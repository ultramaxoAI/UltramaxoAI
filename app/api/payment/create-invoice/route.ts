import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest, db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";

const QRIS_CEPAT_API_KEY = process.env.QRIS_CEPAT_API_KEY || "7c3b83283217094ca37e58a57688daa4";
const QRIS_CEPAT_BASE_URL = "https://qriscepat.com/api";

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

		// 3. Get user from DB
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

		// 4. Request QRIS from QRISCepat API
		try {
			const qrisUrl = `${QRIS_CEPAT_BASE_URL}/deposit/${price}/${QRIS_CEPAT_API_KEY}`;
			console.log("[QRISCepat] Generating QRIS for amounts:", price);
			
			const qrisResponse = await fetch(qrisUrl);
			const qrisText = await qrisResponse.text();
			
			console.log("[QRISCepat] Response:", qrisResponse.status, qrisText.substring(0, 100) + "...");
			
			if (qrisResponse.ok) {
				const qrisData = JSON.parse(qrisText);
				
				if (qrisData.status === "success" && qrisData.data?.qris) {
					const trxId = qrisData.data.trx_id;
					
					// 5. Store purchase request
					const purchaseReqRaw = await createPurchaseRequest({
						userId: session.user.id,
						username: dbUser?.name ?? undefined,
						email: dbUser?.email ?? undefined,
						planId,
						months: months || 1,
						price,
						method: "qriscepat",
						note: trxId, // Store external transaction ID here 
					});

					const purchaseReq = Array.isArray(purchaseReqRaw)
						? purchaseReqRaw[0]
						: purchaseReqRaw;

					return NextResponse.json({
						success: true,
						requestId: purchaseReq.id,
						trxId: trxId,
						qris: qrisData.data.qris,
					});
				} else {
					throw new Error("Invalid response format from QRIS Cepat: " + qrisText);
				}
			} else {
				throw new Error("QRIS Cepat API rejected request");
			}
		} catch (qrisErr) {
			console.error("[QRISCepat] Exception:", qrisErr);
			
			// 6. Fallback (Manual WA) if QRIS fails
			const purchaseReqRawFallback = await createPurchaseRequest({
				userId: session.user.id,
				username: dbUser?.name ?? undefined,
				email: dbUser?.email ?? undefined,
				planId,
				months: months || 1,
				price,
				method: "manual_fallback",
			});
			
			const purchaseReqFall = Array.isArray(purchaseReqRawFallback)
				? purchaseReqRawFallback[0]
				: purchaseReqRawFallback;

			return NextResponse.json({
				success: true,
				requestId: purchaseReqFall.id,
				fallback: true,
			});
		}
	} catch (error) {
		console.error("[Payment API] FATAL error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", detail: String(error) },
			{ status: 500 },
		);
	}
}
