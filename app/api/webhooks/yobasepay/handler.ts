import { createHmac, timingSafeEqual } from "node:crypto";
import { db, updatePurchaseRequestStatus } from "@backend/db/queries";
import { purchaseRequest, user } from "@backend/db/schema";
import { sendProUpgradeEmail } from "@backend/email";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const YOBASEPAY_WEBHOOK_SECRET = process.env.YOBASEPAY_WEBHOOK_SECRET ?? "";
const MAX_WEBHOOK_BODY = 16 * 1024;

function verifySignature(
	rawBody: string,
	receivedSig: string,
	secret: string,
): boolean {
	if (!secret || !receivedSig) return false;

	const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

	try {
		return timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(receivedSig, "hex"),
		);
	} catch {
		return false;
	}
}

function isValidUUID(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}

function getHeaderSignature(request: Request): string {
	return (
		request.headers.get("X-Signature") ||
		request.headers.get("X-YoBase-Signature") ||
		request.headers.get("X-Webhook-Signature") ||
		request.headers.get("X-YoBasePay-Signature") ||
		""
	);
}

function parseNote(note: string | null) {
	if (!note) return {};

	try {
		const parsed = JSON.parse(note);
		return typeof parsed === "object" && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}

export async function handleYoBasePayWebhook(request: Request) {
	try {
		const contentLength = request.headers.get("content-length");
		if (contentLength && Number(contentLength) > MAX_WEBHOOK_BODY) {
			return NextResponse.json({ error: "Payload too large" }, { status: 413 });
		}

		const rawBody = await request.text();
		if (rawBody.length > MAX_WEBHOOK_BODY) {
			return NextResponse.json({ error: "Payload too large" }, { status: 413 });
		}

		if (!YOBASEPAY_WEBHOOK_SECRET) {
			console.error("[Webhook YoBasePay] Missing YOBASEPAY_WEBHOOK_SECRET");
			return NextResponse.json(
				{ error: "Webhook not configured" },
				{ status: 500 },
			);
		}

		const receivedSig = getHeaderSignature(request);
		if (!receivedSig) {
			console.warn("[Webhook YoBasePay] Missing signature header");
			return NextResponse.json({ error: "Missing signature" }, { status: 401 });
		}

		if (!verifySignature(rawBody, receivedSig, YOBASEPAY_WEBHOOK_SECRET)) {
			console.warn("[Webhook YoBasePay] Invalid signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		let body: Record<string, unknown>;
		try {
			body = JSON.parse(rawBody);
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const referenceId = (body.merchant_ref ||
			body.reference ||
			body.reference_id ||
			body.reff_id ||
			body.order_id ||
			body.invoice_id) as string;

		const status = (body.status ||
			body.payment_status ||
			body.transaction_status) as string;
		const amount = body.amount || body.total || body.paid_amount;
		const externalTrxId = body.trxid || body.trx_id || body.transaction_id;
		const method = body.payment_method || body.channel || body.method;

		console.log(
			"[Webhook YoBasePay] Reference:",
			referenceId,
			"| Status:",
			status,
			"| Amount:",
			amount,
			"| Method:",
			method,
		);

		if (!referenceId) {
			return NextResponse.json(
				{ error: "Missing reference field" },
				{ status: 400 },
			);
		}

		if (!isValidUUID(referenceId)) {
			return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
		}

		const [order] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.id, referenceId))
			.limit(1);

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		const receivedAmount = Number(amount);
		if (
			Number.isFinite(receivedAmount) &&
			receivedAmount > 0 &&
			order.price > 0 &&
			Math.abs(receivedAmount - order.price) / order.price > 0.01
		) {
			console.error("[Webhook YoBasePay] Amount mismatch for", referenceId);
			return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
		}

		const normalizedStatus = String(status || "").toUpperCase();
		const isSuccess = [
			"PAID",
			"SUCCESS",
			"SETTLED",
			"COMPLETED",
			"SUCCESSFUL",
		].includes(normalizedStatus);
		const isFailure = [
			"EXPIRED",
			"FAILED",
			"CANCELLED",
			"CANCELED",
			"REJECTED",
		].includes(normalizedStatus);
		const isPending = ["PENDING", "WAITING", "UNPAID"].includes(
			normalizedStatus,
		);

		const currentNote = parseNote(order.note);
		await db
			.update(purchaseRequest)
			.set({
				note: JSON.stringify({
					...currentNote,
					provider: "yobasepay",
					webhookStatus: normalizedStatus || null,
					webhookTrxId: externalTrxId
						? String(externalTrxId).slice(0, 128)
						: null,
					webhookAmount: Number.isFinite(receivedAmount)
						? receivedAmount
						: null,
					paidAt: isSuccess ? new Date().toISOString() : currentNote.paidAt,
				}),
				updatedAt: new Date(),
			})
			.where(eq(purchaseRequest.id, referenceId));

		if (isSuccess) {
			if (order.status === "paid" || order.status === "approved") {
				return NextResponse.json({
					success: true,
					message: "Payment already processed",
				});
			}

			const updatedRequest = await updatePurchaseRequestStatus({
				id: referenceId,
				status: "approved",
			});

			if (updatedRequest && updatedRequest.planId !== "API_TOPUP_USD") {
				try {
					const [proUser] = await db
						.select()
						.from(user)
						.where(eq(user.id, updatedRequest.userId))
						.limit(1);

					if (proUser?.email) {
						await sendProUpgradeEmail(proUser.email, proUser.name || "User");
					}
				} catch (emailErr) {
					console.error(
						"[Webhook YoBasePay] Failed to send PRO upgrade email:",
						emailErr,
					);
				}
			}

			console.log(`[Webhook YoBasePay] Payment APPROVED for ${referenceId}`);
			return NextResponse.json({
				success: true,
				message: "Payment processed",
			});
		}

		if (isFailure) {
			await updatePurchaseRequestStatus({
				id: referenceId,
				status: "rejected",
			});

			console.log(
				`[Webhook YoBasePay] Payment REJECTED for ${referenceId}: ${status}`,
			);
			return NextResponse.json({
				success: true,
				message: `Payment marked failed: ${status}`,
			});
		}

		if (isPending) {
			console.log(`[Webhook YoBasePay] Payment PENDING for ${referenceId}`);
			return NextResponse.json({
				success: true,
				message: `Payment pending: ${status}`,
			});
		}

		console.log(
			`[Webhook YoBasePay] Unhandled status: ${status} for ${referenceId}`,
		);
		return NextResponse.json({
			success: true,
			message: `Webhook received, status: ${status}`,
		});
	} catch (error) {
		console.error("[Webhook YoBasePay] Error:", error);
		return NextResponse.json({ error: "Processing error" }, { status: 200 });
	}
}

export async function handleYoBasePayWebhookHealthcheck() {
	return NextResponse.json({ status: "ok" });
}
