import { createPurchaseRequest, db } from "@backend/db/queries";
import { purchaseRequest, user } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const YOBASEPAY_API_KEY = process.env.YOBASEPAY_API_KEY || "";
const YOBASEPAY_V3_URL = "https://yobasepay.net/api_v3.php";
const USD_TO_IDR_RATE = Number(process.env.USD_TO_IDR_RATE || 16000);
const MIN_TOPUP_USD = 2;

function toIdrAmount(usdAmount: number) {
	return Math.ceil(usdAmount * USD_TO_IDR_RATE);
}

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { amountUsd } = body;
		const usdAmount = Number(amountUsd);

		if (!usdAmount || usdAmount < MIN_TOPUP_USD) {
			return NextResponse.json(
				{ error: `Minimum topup USD ${MIN_TOPUP_USD}` },
				{ status: 400 },
			);
		}

		const idrAmount = toIdrAmount(usdAmount);
		const [dbUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id));

		if (!dbUser) {
			return NextResponse.json({ error: "Invalid session" }, { status: 401 });
		}

		// Create purchase request with initial note
		const purchaseReq = await createPurchaseRequest({
			userId: session.user.id,
			username: dbUser?.name ?? undefined,
			email: dbUser?.email ?? undefined,
			planId: "API_TOPUP_USD",
			months: 1,
			price: idrAmount,
			method: "yobasepay_v3",
			note: JSON.stringify({
				usdCents: Math.round(usdAmount * 100),
				usdToIdrRate: USD_TO_IDR_RATE,
				amountIdr: idrAmount,
			}),
		});

		// YoBasePay V3 Direct Gateway
		if (YOBASEPAY_API_KEY) {
			try {
				const params = new URLSearchParams({
					action: "create_order",
					api_key: YOBASEPAY_API_KEY,
					amount: String(idrAmount),
					ref_id: purchaseReq.id,
				});

				const v3Url = `${YOBASEPAY_V3_URL}?${params.toString()}`;
				console.log(
					"[API Topup] Creating V3 order:",
					v3Url.replace(YOBASEPAY_API_KEY, "***"),
				);

				const response = await fetch(v3Url, {
					method: "GET",
					headers: {
						"X-API-KEY": YOBASEPAY_API_KEY,
					},
				});

				const text = await response.text();
				console.log("[API Topup] V3 response:", text.slice(0, 500));

				if (response.ok) {
					const result = JSON.parse(text);

					if (result.status === "Success" && result.data) {
						const { trx_id, qr_image, payment_url, amount_to_pay } =
							result.data;

						// Update note with payment gateway details
						await db
							.update(purchaseRequest)
							.set({
								note: JSON.stringify({
									usdCents: Math.round(usdAmount * 100),
									usdToIdrRate: USD_TO_IDR_RATE,
									amountIdr: idrAmount,
									trxId: trx_id,
									qrImage: qr_image,
									paymentUrl: payment_url,
									amountToPay: amount_to_pay,
								}),
								updatedAt: new Date(),
							})
							.where(eq(purchaseRequest.id, purchaseReq.id));

						return NextResponse.json({
							success: true,
							requestId: purchaseReq.id,
						});
					}

					console.error("[API Topup] V3 unexpected response:", result);
				}
			} catch (error) {
				console.error("[API Topup] V3 failed:", error);
			}
		}

		// No payment gateway available
		return NextResponse.json({
			success: false,
			fallback: true,
			requestId: purchaseReq.id,
			error: "Payment gateway unavailable",
		});
	} catch (error) {
		console.error("API topup error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
