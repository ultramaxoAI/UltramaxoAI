import { createHmac } from "node:crypto";
import { createPurchaseRequest, db } from "@backend/db/queries";
import { purchaseRequest, user } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

// YoBasePay V3
const YOBASEPAY_API_KEY = process.env.YOBASEPAY_API_KEY || "";
const YOBASEPAY_BASE_URL =
	process.env.YOBASEPAY_BASE_URL || "https://yobasepay.net/api/v3";
const YOBASEPAY_V3_URL = "https://yobasepay.net/api_v3.php";
const YOBASEPAY_SUCCESS_URL =
	process.env.YOBASEPAY_SUCCESS_URL || "https://ultramaxo.tech/payment/success";
const isDevelopment = process.env.NODE_ENV === "development";

// Tabel harga resmi server-side
const PRICING_TABLE: Record<string, Record<number, number>> = {
	"pro-1": { 1: 15000 },
	"pro-3": { 3: 45000 },
	"pro-6": { 6: 85000 },
	"pro-12": { 12: 150000 },
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
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

async function createYoBasePayV3Order({
	merchantRef,
	amount,
}: {
	merchantRef: string;
	amount: number;
}) {
	const params = new URLSearchParams({
		action: "create_order",
		api_key: YOBASEPAY_API_KEY,
		amount: String(amount),
		ref_id: merchantRef,
	});

	const v3Url = `${YOBASEPAY_V3_URL}?${params.toString()}`;

	if (isDevelopment) {
		console.log(
			"[YoBasePay V3] Creating order:",
			v3Url.replace(YOBASEPAY_API_KEY, "***"),
		);
	}

	const response = await fetch(v3Url, {
		method: "GET",
		headers: {
			"X-API-KEY": YOBASEPAY_API_KEY,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
	});

	const text = await response.text();
	if (isDevelopment) {
		console.log(
			"[YoBasePay V3] Response:",
			response.status,
			text.slice(0, 500),
		);
	}

	if (!response.ok) {
		throw new Error(`YoBasePay V3 error: ${response.status} ${text}`);
	}

	return JSON.parse(text);
}

function buildPaymentNote({
	planId,
	months,
	amount,
	checkoutUrl,
	qris,
	qrImage,
	providerRef,
	rawResponse,
	userNote,
}: {
	planId: string;
	months: number;
	amount: number;
	checkoutUrl: string | null;
	qris: string | null;
	qrImage: string | null;
	providerRef: string | null;
	rawResponse: unknown;
	userNote?: string | null;
}) {
	return JSON.stringify({
		provider: "yobasepay",
		planId,
		months,
		amount,
		checkoutUrl,
		qris,
		qrImage,
		providerRef,
		rawResponse,
		userNote,
		createdAt: new Date().toISOString(),
	});
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
		const { planId, price, months, note } = body;
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
			note: note || undefined,
		});

		const purchaseReq = Array.isArray(purchaseReqRaw)
			? purchaseReqRaw[0]
			: purchaseReqRaw;

		if (!YOBASEPAY_API_KEY) {
			return NextResponse.json(
				{ error: "YoBasePay belum dikonfigurasi di server" },
				{ status: 503 },
			);
		}

		try {
			const yobaseV3Result = await createYoBasePayV3Order({
				merchantRef: purchaseReq.id,
				amount: validPrice,
			});

			if (yobaseV3Result?.status === "Success" && yobaseV3Result?.data) {
				const checkoutUrl =
					yobaseV3Result.data.payment_url ||
					yobaseV3Result.data.checkout_url ||
					null;
				const qrImage = yobaseV3Result.data.qr_image || null;
				const qris =
					yobaseV3Result.data.qris || yobaseV3Result.data.qr_string || null;
				const providerRef =
					yobaseV3Result.data.ref_id ||
					yobaseV3Result.data.trx_id ||
					purchaseReq.id;

				await db
					.update(purchaseRequest)
					.set({
						method: "yobasepay",
						note: buildPaymentNote({
							planId,
							months: effectiveMonths,
							amount: validPrice,
							checkoutUrl,
							qris,
							qrImage,
							providerRef,
							rawResponse: yobaseV3Result,
							userNote: note,
						}),
						updatedAt: new Date(),
					})
					.where(eq(purchaseRequest.id, purchaseReq.id));

				if (!checkoutUrl && !qris && !qrImage) {
					console.warn(
						"[YoBasePay V3] Unknown response format:",
						yobaseV3Result,
					);
					return NextResponse.json(
						{
							error:
								"YoBasePay tidak mengembalikan metode pembayaran yang valid",
						},
						{ status: 502 },
					);
				}

				return NextResponse.json({
					success: true,
					requestId: purchaseReq.id,
					checkoutUrl,
					qris,
					qrImage,
					provider: "yobasepay",
				});
			}

			console.warn("[YoBasePay V3] Unexpected response:", yobaseV3Result);
		} catch (yobaseV3Err) {
			console.error("[YoBasePay V3] Failed to create order:", yobaseV3Err);
		}

		try {
			const yobaseResult = await createYoBasePayTransaction({
				merchantRef: purchaseReq.id,
				amount: validPrice,
				customerName: dbUser.name || dbUser.username || "User",
				customerEmail: dbUser.email || undefined,
				description: `Upgrade ${planId} - ${effectiveMonths} bulan${note ? ` (${note})` : ""}`,
			});

			const checkoutUrl =
				yobaseResult.checkout_url ||
				yobaseResult.payment_url ||
				yobaseResult.data?.checkout_url ||
				yobaseResult.data?.payment_url ||
				yobaseResult.data?.url ||
				yobaseResult.url ||
				yobaseResult.redirect_url ||
				null;

			const qris =
				yobaseResult.qris ||
				yobaseResult.data?.qris ||
				yobaseResult.data?.qr_string ||
				yobaseResult.qr_string ||
				null;
			const qrImage =
				yobaseResult.qr_image || yobaseResult.data?.qr_image || null;

			const providerRef =
				yobaseResult.merchant_ref ||
				yobaseResult.reference ||
				yobaseResult.reference_id ||
				yobaseResult.data?.merchant_ref ||
				purchaseReq.id;

			await db
				.update(purchaseRequest)
				.set({
					method: "yobasepay",
					note: buildPaymentNote({
						planId,
						months: effectiveMonths,
						amount: validPrice,
						checkoutUrl,
						qris,
						qrImage,
						providerRef,
						rawResponse: yobaseResult,
						userNote: note,
					}),
					updatedAt: new Date(),
				})
				.where(eq(purchaseRequest.id, purchaseReq.id));

			if (!checkoutUrl && !qris && !qrImage) {
				console.warn("[YoBasePay] Unknown response format:", yobaseResult);
				const telegramUrl = `https://t.me/ultramaxoai?text=Halo,%20saya%20ingin%20bayar%20invoice%20upgrade%20Pro%20dengan%20ID%20${purchaseReq.id}`;
				return NextResponse.json({
					success: true,
					requestId: purchaseReq.id,
					checkoutUrl: telegramUrl,
					provider: "telegram_fallback",
				});
			}

			return NextResponse.json({
				success: true,
				requestId: purchaseReq.id,
				checkoutUrl,
				qris,
				qrImage,
				provider: "yobasepay",
			});
		} catch (yobaseErr) {
			console.error("[YoBasePay] Failed to create transaction:", yobaseErr);
			const telegramUrl = `https://t.me/ultramaxoai?text=Halo,%20saya%20ingin%20bayar%20invoice%20upgrade%20Pro%20dengan%20ID%20${purchaseReq.id}`;
			return NextResponse.json({
				success: true,
				requestId: purchaseReq.id,
				checkoutUrl: telegramUrl,
				provider: "telegram_fallback",
			});
		}
	} catch (error) {
		console.error("[Payment API] FATAL error:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
