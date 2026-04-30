import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest, db } from "@backend/db/queries";
import { user } from "@backend/db/schema";
import { createHmac } from "node:crypto";

// YoBasePay V3
const YOBASEPAY_API_KEY = process.env.YOBASEPAY_API_KEY || "";
const YOBASEPAY_BASE_URL =
	process.env.YOBASEPAY_BASE_URL || "https://yobasepay.net/api/v3";
const YOBASEPAY_SUCCESS_URL =
	process.env.YOBASEPAY_SUCCESS_URL || "https://ultramaxo.tech/payment/success";
const YOBASEPAY_WEBHOOK_SECRET = process.env.YOBASEPAY_WEBHOOK_SECRET || "";
const isDevelopment = process.env.NODE_ENV === "development";

// Fallback: QRIS Cepat
const QRIS_CEPAT_API_KEY = process.env.QRIS_CEPAT_API_KEY || "";
const QRIS_CEPAT_BASE_URL = "https://qriscepat.com/api";

// Tabel harga resmi server-side
const PRICING_TABLE: Record<string, Record<number, number>> = {
	"Early Adopter (Pro)": { 1: 15000 },
	"1 Tahun": { 12: 150000 },
};

function getValidPrice(planId: string, months: number): number | null {
	const plan = PRICING_TABLE[planId];
	if (!plan) return null;
	return plan[months] ?? null;
}

/**
 * Buat transaksi via YoBasePay V3 API
 */
async function createYoBasePayTransaction({
	merchantRef,
	amount,
	customerName,
	customerEmail,
	description,
}: {
	merchantRef: string;
	amount: number;
	customerName: string;
	customerEmail?: string;
	description: string;
}) {
	// Generate signature: HMAC-SHA256(api_key, merchant_ref + amount)
	const signaturePayload = `${merchantRef}${amount}`;
	const signature = createHmac("sha256", YOBASEPAY_API_KEY)
		.update(signaturePayload)
		.digest("hex");

	const payload = {
		api_key: YOBASEPAY_API_KEY,
		merchant_ref: merchantRef,
		amount,
		customer_name: customerName,
		customer_email: customerEmail || "",
		description,
		success_url: YOBASEPAY_SUCCESS_URL,
		signature,
	};

	if (isDevelopment) {
		console.log("[YoBasePay] Creating transaction:", {
			merchant_ref: merchantRef,
			amount,
			description,
		});
	}

	const response = await fetch(`${YOBASEPAY_BASE_URL}/transaction/create`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${YOBASEPAY_API_KEY}`,
		},
		body: JSON.stringify(payload),
	});

	const text = await response.text();
	if (isDevelopment) {
		console.log("[YoBasePay] Response:", response.status);
	}

	if (!response.ok) {
		throw new Error(`YoBasePay API error: ${response.status} ${text}`);
	}

	return JSON.parse(text);
}

export async function POST(request: Request) {
	try {
		// 1. Auth check
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// 2. Parse body
		const body = await request.json();
		const { planId, price, months } = body;
		if (isDevelopment) {
			console.log(
				"[Payment] Plan:",
				planId,
				"Price:",
				price,
				"Months:",
				months,
			);
		}

		if (!planId || !price) {
			return NextResponse.json(
				{ error: "Missing required fields: planId, price" },
				{ status: 400 },
			);
		}

		// 3. Validasi harga server-side
		const effectiveMonths = months || 1;
		const validPrice = getValidPrice(planId, effectiveMonths);
		if (validPrice === null) {
			return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
		}
		if (Number(price) !== validPrice) {
			console.warn(
				`[Payment] Price mismatch! Client sent ${price}, expected ${validPrice} for ${planId}/${effectiveMonths}mo`,
			);
			return NextResponse.json(
				{ error: "Harga tidak sesuai dengan plan yang dipilih" },
				{ status: 400 },
			);
		}

		// 4. Get user from DB
		const [dbUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id));

		if (!dbUser) {
			return NextResponse.json(
				{
					error: "Sesi tidak valid. Silakan logout dan login ulang.",
					code: "SESSION_INVALID",
				},
				{ status: 401 },
			);
		}

		// 5. Store purchase request terlebih dahulu
		const purchaseReqRaw = await createPurchaseRequest({
			userId: session.user.id,
			username: dbUser?.name ?? undefined,
			email: dbUser?.email ?? undefined,
			planId,
			months: effectiveMonths,
			price: validPrice,
			method: "yobasepay",
		});

		const purchaseReq = Array.isArray(purchaseReqRaw)
			? purchaseReqRaw[0]
			: purchaseReqRaw;

		// 6. Coba buat transaksi via YoBasePay V3
		if (YOBASEPAY_API_KEY) {
			try {
				const yobaseResult = await createYoBasePayTransaction({
					merchantRef: purchaseReq.id,
					amount: validPrice,
					customerName: dbUser.name || dbUser.username || "User",
					customerEmail: dbUser.email || undefined,
					description: `Upgrade ${planId} - ${effectiveMonths} bulan`,
				});

				// YoBasePay biasanya return checkout_url atau payment_url
				const checkoutUrl =
					yobaseResult.checkout_url ||
					yobaseResult.payment_url ||
					yobaseResult.data?.checkout_url ||
					yobaseResult.data?.payment_url ||
					yobaseResult.data?.url;

				if (checkoutUrl) {
					return NextResponse.json({
						success: true,
						requestId: purchaseReq.id,
						checkoutUrl,
						provider: "yobasepay",
					});
				}

				// Jika ada QRIS data
				const qrisData =
					yobaseResult.qris ||
					yobaseResult.data?.qris ||
					yobaseResult.data?.qr_string;
				if (qrisData) {
					return NextResponse.json({
						success: true,
						requestId: purchaseReq.id,
						qris: qrisData,
						provider: "yobasepay",
					});
				}

				// Return raw response kalau format tidak dikenali
				console.warn("[YoBasePay] Unknown response format:", yobaseResult);
				return NextResponse.json({
					success: true,
					requestId: purchaseReq.id,
					checkoutUrl: yobaseResult.url || yobaseResult.redirect_url || null,
					rawResponse: yobaseResult,
					provider: "yobasepay",
				});
			} catch (yobaseErr) {
				console.error("[YoBasePay] Failed, falling back:", yobaseErr);
				// Lanjut ke fallback QRIS Cepat
			}
		}

		// 7. Fallback ke QRIS Cepat
		if (QRIS_CEPAT_API_KEY) {
			try {
				const qrisUrl = `${QRIS_CEPAT_BASE_URL}/deposit/${validPrice}/${QRIS_CEPAT_API_KEY}`;
				console.log("[QRISCepat] Generating QRIS for amount:", validPrice);

				const qrisResponse = await fetch(qrisUrl);
				const qrisText = await qrisResponse.text();

				console.log(
					"[QRISCepat] Response:",
					qrisResponse.status,
					qrisText.substring(0, 100) + "...",
				);

				if (qrisResponse.ok) {
					const qrisData = JSON.parse(qrisText);

					if (qrisData.status === "success" && qrisData.data?.qris) {
						// Update purchase request method
						return NextResponse.json({
							success: true,
							requestId: purchaseReq.id,
							trxId: qrisData.data.trx_id,
							qris: qrisData.data.qris,
							provider: "qriscepat",
						});
					}
				}
			} catch (qrisErr) {
				console.error("[QRISCepat] Also failed:", qrisErr);
			}
		}

		// 8. Final fallback — manual
		return NextResponse.json({
			success: true,
			requestId: purchaseReq.id,
			fallback: true,
			provider: "manual",
		});
	} catch (error) {
		console.error("[Payment API] FATAL error:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
