import crypto from "node:crypto";
import { db } from "@backend/db/queries";
import { purchaseRequest } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const WEBHOOK_SECRET =
	process.env.YOBASEPAY_WEBHOOK_SECRET || process.env.YOBASEPAY_API_KEY || "";

function verifySignature(payload: string, signature: string | null): boolean {
	if (!signature || !WEBHOOK_SECRET) return false;
	const expected = crypto
		.createHmac("sha256", WEBHOOK_SECRET)
		.update(payload)
		.digest("hex");
	return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request) {
	try {
		const rawBody = await request.text();
		const signature = request.headers.get("X-YoBasePay-Signature");

		// Verify HMAC signature (skip in dev if no secret configured)
		if (WEBHOOK_SECRET && signature) {
			if (!verifySignature(rawBody, signature)) {
				console.error("[Webhook] Invalid signature");
				return NextResponse.json(
					{ error: "Invalid signature" },
					{ status: 403 },
				);
			}
		}

		const body = JSON.parse(rawBody);
		console.log("[Webhook] Received:", JSON.stringify(body).slice(0, 500));

		const { event, reff_id, trxid, amount, status } = body;

		if (event !== "payment.success" || status !== "SUCCESS") {
			console.log("[Webhook] Non-success event, ignoring:", event, status);
			return NextResponse.json({ ok: true });
		}

		if (!reff_id) {
			console.error("[Webhook] Missing reff_id");
			return NextResponse.json({ error: "Missing reff_id" }, { status: 400 });
		}

		// Find the purchase request by ref_id (which is the purchase request ID)
		const [order] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.id, reff_id));

		if (!order) {
			console.error("[Webhook] Order not found:", reff_id);
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		// Idempotent: skip if already paid
		if (order.status === "paid" || order.status === "approved") {
			console.log("[Webhook] Already processed:", reff_id);
			return NextResponse.json({ ok: true, already: true });
		}

		// Update order status to paid
		await db
			.update(purchaseRequest)
			.set({
				status: "paid",
				updatedAt: new Date(),
				note: JSON.stringify({
					...JSON.parse(order.note || "{}"),
					webhookTrxId: trxid,
					webhookAmount: amount,
					paidAt: new Date().toISOString(),
				}),
			})
			.where(eq(purchaseRequest.id, reff_id));

		// Credit the user's API balance
		try {
			const noteData = JSON.parse(order.note || "{}");
			const usdCents = (noteData.usdCents as number) || 0;

			if (usdCents > 0) {
				// Import dynamically to avoid circular deps
				const { grantApiCredits } = await import("@backend/db/queries");
				await grantApiCredits({
					userId: order.userId,
					amountCents: usdCents,
					reason: `Top-up via QRIS (${trxid || reff_id})`,
				});
				console.log(
					`[Webhook] Credited ${usdCents} cents to user ${order.userId}`,
				);
			}
		} catch (creditError) {
			console.error("[Webhook] Credit failed:", creditError);
			// Don't fail the webhook — order is already marked paid
		}

		console.log("[Webhook] Payment confirmed:", reff_id, trxid);
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Webhook] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

// Allow GET for health check
export async function GET() {
	return NextResponse.json({ status: "ok", webhook: "yobasepay_v3" });
}
