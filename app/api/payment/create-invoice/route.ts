import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest, db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";

const DOMPETX_API_KEY = process.env.DOMPETX_API_KEY ?? "";
const DOMPETX_BASE_URL = "https://api.dompetx.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ultramaxo.tech";

/** Generate HMAC-SHA256 signature sesuai dokumentasi DompetX */
function generateSignature(timestamp: number, body: string, apiKey: string) {
	const ks = `${timestamp}.${body}`;
	return createHmac("sha256", apiKey).update(ks).digest("hex");
}

export async function POST(request: Request) {
	try {
		// 1. Auth check
		const session = await auth();
		console.log("[Payment] Session user:", session?.user?.id);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// 2. Parse body
		const body = await request.json();
		const { planId, price, months } = body;
		console.log("[Payment] Plan:", planId, "Price:", price, "Months:", months);

		if (!planId || !price) {
			return NextResponse.json(
				{ error: "Missing required fields: planId, price" },
				{ status: 400 },
			);
		}

		// 3. Ambil data user dari DB langsung (tanpa getUserById)
		const [dbUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id));

		console.log("[Payment] DB User found:", !!dbUser);

		// Jika user tidak ada di DB, session sudah tidak valid — minta re-login
		if (!dbUser) {
			return NextResponse.json(
				{
					error: "Sesi tidak valid. Silakan logout dan login ulang.",
					code: "SESSION_INVALID",
				},
				{ status: 401 },
			);
		}

		// 4. Simpan purchase request
		const purchaseReqRaw = await createPurchaseRequest({
			userId: session.user.id,
			username: dbUser?.name ?? undefined,
			email: dbUser?.email ?? undefined,
			planId,
			months: months || 1,
			price,
			method: "dompetx",
		});

		const purchaseReq = Array.isArray(purchaseReqRaw)
			? purchaseReqRaw[0]
			: purchaseReqRaw;

		console.log("[Payment] Purchase request created:", purchaseReq?.id);

		if (!purchaseReq?.id) {
			return NextResponse.json(
				{ error: "Gagal menyimpan request pembayaran" },
				{ status: 500 },
			);
		}

		// 5. Coba buat invoice di DompetX
		if (DOMPETX_API_KEY) {
			try {
				const timestamp = Math.floor(Date.now() / 1000);
				const idempotencyKey = `ultramaxo_${purchaseReq.id}`;

				const merchantId = process.env.DOMPETX_MERCHANT_ID ?? "";

				const invoiceBodyObj = {
					merchantId: merchantId,
					method: "QRIS",
					amount: price,
					currency: "IDR",
					settlementSpeed: "standard",
					reference: purchaseReq.id,
					chargeFeeToCustomer: true,
					metadata: {
						customer_id: session.user.id,
						customer_name: dbUser?.name || session.user.name || "User",
						customer_email: dbUser?.email || session.user.email || "",
						order_type: planId,
					},
					description: `Upgrade ke paket ${planId} selama ${months || 1} bulan`,
					callback_url: `${APP_URL}/api/webhooks/dompetx`,
					return_url: `${APP_URL}/payment/success`,
				};

				const invoiceBodyStr = JSON.stringify(invoiceBodyObj);
				const signature = generateSignature(
					timestamp,
					invoiceBodyStr,
					DOMPETX_API_KEY,
				);

				console.log("[DompetX] Calling API...");
				const dompetxResponse = await fetch(`${DOMPETX_BASE_URL}/v1/payments`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-DOMPAY-API-Key": DOMPETX_API_KEY,
						"X-DOMPAY-Signature": signature,
						"X-DOMPAY-Timestamp": String(timestamp),
						"Idempotency-Key": idempotencyKey,
					},
					body: invoiceBodyStr,
				});

				const responseText = await dompetxResponse.text();
				console.log(
					"[DompetX] Status:",
					dompetxResponse.status,
					"| Body:",
					responseText,
				);

				if (dompetxResponse.ok) {
					const dompetxData = JSON.parse(responseText);
					const checkoutUrl =
						dompetxData?.paymentUrl ||
						dompetxData?.data?.checkout_url ||
						dompetxData?.checkout_url ||
						dompetxData?.data?.payment_url ||
						dompetxData?.payment_url;

					if (checkoutUrl) {
						return NextResponse.json({
							success: true,
							requestId: purchaseReq.id,
							checkoutUrl,
						});
					}
				}
			} catch (dompetxErr) {
				console.error("[DompetX] Exception (non-fatal):", dompetxErr);
			}
		}

		// 6. Fallback — invoice tersimpan, menunggu konfirmasi
		return NextResponse.json({
			success: true,
			requestId: purchaseReq.id,
			fallback: true,
		});
	} catch (error) {
		console.error("[Payment API] FATAL error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", detail: String(error) },
			{ status: 500 },
		);
	}
}
