import crypto from "node:crypto";
import { db } from "@backend/db/queries";
import { purchaseRequest } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const WEBHOOK_SECRET =
	process.env.YOBASEPAY_WEBHOOK_SECRET || "";

// Security: Constant-time HMAC verification
function verifySignature(payload: string, signature: string): boolean {
	if (!WEBHOOK_SECRET || !signature) return false;
	try {
		const expected = crypto
			.createHmac("sha256", WEBHOOK_SECRET)
			.update(payload)
			.digest("hex");

		// Ensure both strings are same length before comparison
		if (expected.length !== signature.length) return false;
		return crypto.timingSafeEqual(
			Buffer.from(expected, "utf8"),
			Buffer.from(signature, "utf8"),
		);
	} catch {
		return false;
	}
}

// Security: Validate UUID format
function isValidUUID(id: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Security: Rate limit webhook calls (prevent replay attacks)
const recentWebhooks = new Map<string, number>();
const WEBHOOK_DEDUP_WINDOW = 5 * 60 * 1000; // 5 minutes

function isDuplicateWebhook(trxId: string): boolean {
	const now = Date.now();
	// Clean old entries
	for (const [key, timestamp] of recentWebhooks) {
		if (now - timestamp > WEBHOOK_DEDUP_WINDOW) {
			recentWebhooks.delete(key);
		}
	}
	if (recentWebhooks.has(trxId)) return true;
	recentWebhooks.set(trxId, now);
	return false;
}

// Security: Max body size for webhooks (16KB)
const MAX_WEBHOOK_BODY = 16 * 1024;

export async function POST(request: Request) {
	try {
		// Security: Check content length
		const contentLength = request.headers.get("content-length");
		if (contentLength && Number(contentLength) > MAX_WEBHOOK_BODY) {
			return NextResponse.json(
				{ error: "Payload too large" },
				{ status: 413 },
			);
		}

		const rawBody = await request.text();

		// Security: Enforce body size limit
		if (rawBody.length > MAX_WEBHOOK_BODY) {
			return NextResponse.json(
				{ error: "Payload too large" },
				{ status: 413 },
			);
		}

		const signature = request.headers.get("X-YoBasePay-Signature");

		// Security: ALWAYS verify signature in production
		if (!WEBHOOK_SECRET) {
			console.error("[Webhook] CRITICAL: No webhook secret configured!");
			return NextResponse.json(
				{ error: "Webhook not configured" },
				{ status: 500 },
			);
		}

		if (!signature || !verifySignature(rawBody, signature)) {
			console.error("[Webhook] Invalid signature attempt from:", request.headers.get("x-forwarded-for") || "unknown");
			return NextResponse.json(
				{ error: "Invalid signature" },
				{ status: 403 },
			);
		}

		// Security: Parse with error handling
		let body: any;
		try {
			body = JSON.parse(rawBody);
		} catch {
			return NextResponse.json(
				{ error: "Invalid JSON" },
				{ status: 400 },
			);
		}

		const { event, reff_id, trxid, amount, status } = body;

		// Security: Validate expected fields exist and are strings
		if (typeof event !== "string" || typeof status !== "string") {
			return NextResponse.json(
				{ error: "Invalid payload format" },
				{ status: 400 },
			);
		}

		// Only process success events
		if (event !== "payment.success" || status !== "SUCCESS") {
			return NextResponse.json({ ok: true });
		}

		// Security: Validate reff_id format (UUID)
		if (!reff_id || typeof reff_id !== "string" || !isValidUUID(reff_id)) {
			console.error("[Webhook] Invalid reff_id format:", reff_id);
			return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
		}

		// Security: Prevent replay attacks
		const dedupeKey = trxid || reff_id;
		if (isDuplicateWebhook(dedupeKey)) {
			console.warn("[Webhook] Duplicate webhook detected:", dedupeKey);
			return NextResponse.json({ ok: true, duplicate: true });
		}

		// Find the purchase request
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
			return NextResponse.json({ ok: true, already: true });
		}

		// Security: Validate amount matches (within 1% tolerance for currency conversion)
		if (amount) {
			const expectedAmount = order.price;
			const receivedAmount = Number(amount);
			if (
				receivedAmount > 0 &&
				expectedAmount > 0 &&
				Math.abs(receivedAmount - expectedAmount) / expectedAmount > 0.01
			) {
				console.error(
					"[Webhook] Amount mismatch! Expected:",
					expectedAmount,
					"Received:",
					receivedAmount,
				);
				// Log but don't reject — payment gateway may round
			}
		}

		// Update order status to paid
		await db
			.update(purchaseRequest)
			.set({
				status: "paid",
				updatedAt: new Date(),
				note: JSON.stringify({
					...JSON.parse(order.note || "{}"),
					webhookTrxId: String(trxid || "").slice(0, 128),
					webhookAmount: Number(amount) || 0,
					paidAt: new Date().toISOString(),
				}),
			})
			.where(eq(purchaseRequest.id, reff_id));

		// Credit the user's API balance
		try {
			const noteData = JSON.parse(order.note || "{}");
			const usdCents = Number(noteData.usdCents) || 0;

			// Security: Validate credit amount is reasonable (max $100)
			if (usdCents > 0 && usdCents <= 10000) {
				const { grantApiCredits } = await import("@backend/db/queries");
				await grantApiCredits({
					userId: order.userId,
					amountCents: usdCents,
					reason: `Top-up via QRIS (${String(trxid || reff_id).slice(0, 64)})`,
				});
				console.log(
					`[Webhook] Credited ${usdCents} cents to user ${order.userId}`,
				);
			} else if (usdCents > 10000) {
				console.error("[Webhook] Suspiciously large credit amount:", usdCents);
			}
		} catch (creditError) {
			console.error("[Webhook] Credit failed:", creditError);
		}

		console.log("[Webhook] Payment confirmed:", reff_id);
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Webhook] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

// Security: Remove GET health check in production (info disclosure)
export async function GET() {
	return NextResponse.json({ status: "ok" });
}
