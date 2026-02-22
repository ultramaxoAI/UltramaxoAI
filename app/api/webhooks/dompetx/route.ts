import { createHmac } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/queries";
import { purchaseRequest, user } from "@/lib/db/schema";

const DOMPETX_API_KEY = process.env.DOMPETX_API_KEY ?? "";

/** Verifikasi signature webhook dari DompetX */
function verifyWebhookSignature(
	timestamp: string,
	body: string,
	receivedSig: string,
	apiKey: string,
): boolean {
	if (!apiKey || !receivedSig) return false;
	const ks = `${timestamp}.${body}`;
	const expected = createHmac("sha256", apiKey).update(ks).digest("hex");
	return expected === receivedSig;
}

export async function POST(request: Request) {
	try {
		const rawBody = await request.text();
		console.log("[Webhook DompetX] Raw payload:", rawBody);

		// Verifikasi signature (opsional tapi dianjurkan)
		const timestamp = request.headers.get("X-DOMPAY-Timestamp") || "";
		const receivedSig = request.headers.get("X-DOMPAY-Signature") || "";

		if (DOMPETX_API_KEY && receivedSig && timestamp) {
			const isValid = verifyWebhookSignature(
				timestamp,
				rawBody,
				receivedSig,
				DOMPETX_API_KEY,
			);
			if (!isValid) {
				console.warn(
					"[Webhook DompetX] Invalid signature! Possible spoofed request.",
				);
				return NextResponse.json(
					{ error: "Invalid signature" },
					{ status: 401 },
				);
			}
		}

		let body: Record<string, unknown>;
		try {
			body = JSON.parse(rawBody);
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		// Sesuaikan field dengan format payload webhook DompetX
		// Field umum: reference (= merchant_ref), status
		const referenceId = (body.reference ||
			body.merchant_ref ||
			body.reference_id) as string;
		const status = (body.status || body.payment_status) as string;

		console.log(
			"[Webhook DompetX] Reference:",
			referenceId,
			"| Status:",
			status,
		);

		if (!referenceId) {
			return NextResponse.json(
				{ error: "Missing reference field" },
				{ status: 400 },
			);
		}

		// Status sukses: PAID, SUCCESS, SETTLED, COMPLETED
		const isSuccess = ["PAID", "SUCCESS", "SETTLED", "COMPLETED"].includes(
			String(status).toUpperCase(),
		);

		if (isSuccess) {
			// Cari purchase request berdasarkan ID kita (dikirim sebagai reference)
			const [requestRec] = await db
				.select()
				.from(purchaseRequest)
				.where(eq(purchaseRequest.id, referenceId));

			if (requestRec && requestRec.status !== "approved") {
				// Update status jadi approved
				await db
					.update(purchaseRequest)
					.set({ status: "approved", updatedAt: new Date() })
					.where(eq(purchaseRequest.id, referenceId));

				// Aktifkan status PRO untuk user
				if (requestRec.userId) {
					const now = new Date();
					const expiresAt = new Date(now);
					expiresAt.setMonth(expiresAt.getMonth() + (requestRec.months || 1));

					await db
						.update(user)
						.set({
							isPro: true,
							proExpiresAt: expiresAt,
							limitCount: 99_999,
						})
						.where(eq(user.id, requestRec.userId));

					console.log(
						`[Webhook DompetX] ✅ PRO activated for userId: ${requestRec.userId}`,
					);
				}
			}

			return NextResponse.json({ success: true, message: "Payment processed" });
		}

		// Status lainnya (PENDING, EXPIRED, FAILED, dll)
		console.log(`[Webhook DompetX] Status non-success: ${status}`);
		return NextResponse.json({
			success: true,
			message: `Webhook received, status: ${status}`,
		});
	} catch (error) {
		console.error("[Webhook DompetX] Error:", error);
		// Return 200 agar DompetX tidak retry terus
		return NextResponse.json({ error: "Processing error" }, { status: 200 });
	}
}
