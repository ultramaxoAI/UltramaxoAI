import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest, db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";

// FIX #1: Tidak ada hardcoded API key lagi
const QRIS_CEPAT_API_KEY = process.env.QRIS_CEPAT_API_KEY || "";
const QRIS_CEPAT_BASE_URL = "https://qriscepat.com/api";

// FIX #6: Tabel harga resmi server-side (harus cocok dengan frontend planId)
const PRICING_TABLE: Record<string, Record<number, number>> = {
	"Early Adopter (Pro)": { 1: 15000 },
	"1 Tahun": { 12: 150000 },
};

function getValidPrice(planId: string, months: number): number | null {
	const plan = PRICING_TABLE[planId];
	if (!plan) return null;
	return plan[months] ?? null;
}

export async function POST(request: Request) {
	try {
		// 1. Auth check
		const session = await auth();
		console.log("[Payment] Session user:", session?.user?.id);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// FIX #1: Pastikan API key ada
		if (!QRIS_CEPAT_API_KEY) {
			console.error("[Payment] QRIS_CEPAT_API_KEY not configured");
			return NextResponse.json(
				{ error: "Payment service not configured" },
				{ status: 503 },
			);
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

		// FIX #6: Validasi harga server-side
		const effectiveMonths = months || 1;
		const validPrice = getValidPrice(planId, effectiveMonths);
		if (validPrice === null) {
			return NextResponse.json(
				{ error: "Plan tidak valid" },
				{ status: 400 },
			);
		}
		if (Number(price) !== validPrice) {
			console.warn(`[Payment] Price mismatch! Client sent ${price}, expected ${validPrice} for ${planId}/${effectiveMonths}mo`);
			return NextResponse.json(
				{ error: "Harga tidak sesuai dengan plan yang dipilih" },
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
			const qrisUrl = `${QRIS_CEPAT_BASE_URL}/deposit/${validPrice}/${QRIS_CEPAT_API_KEY}`;
			console.log("[QRISCepat] Generating QRIS for amount:", validPrice);
			
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
						months: effectiveMonths,
						price: validPrice,
						method: "qriscepat",
						note: trxId,
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
					throw new Error("Invalid response format from QRIS Cepat");
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
				months: effectiveMonths,
				price: validPrice,
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
		// FIX #5: Tidak bocorkan detail error ke client
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
