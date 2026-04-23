import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updatePurchaseRequestStatus } from "@backend/db/queries";

const YOBASEPAY_WEBHOOK_SECRET = process.env.YOBASEPAY_WEBHOOK_SECRET ?? "";

/**
 * Verifikasi signature webhook dari YoBasePay
 * Standard: HMAC-SHA256(webhook_secret, raw_body)
 */
function verifySignature(
	rawBody: string,
	receivedSig: string,
	secret: string,
): boolean {
	if (!secret || !receivedSig) return false;

	const expected = createHmac("sha256", secret)
		.update(rawBody)
		.digest("hex");

	// Timing-safe comparison to prevent timing attacks
	try {
		return timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(receivedSig, "hex"),
		);
	} catch {
		return false;
	}
}

export async function POST(request: Request) {
	try {
		const rawBody = await request.text();
		console.log("[Webhook YoBasePay] Raw payload:", rawBody);

		// Verifikasi signature jika webhook secret dikonfigurasi
		const receivedSig =
			request.headers.get("X-Signature") ||
			request.headers.get("X-YoBase-Signature") ||
			request.headers.get("X-Webhook-Signature") ||
			"";

		if (YOBASEPAY_WEBHOOK_SECRET) {
			if (!receivedSig) {
				console.warn(
					"[Webhook YoBasePay] Missing signature header! Rejecting.",
				);
				return NextResponse.json(
					{ error: "Missing signature" },
					{ status: 401 },
				);
			}

			const isValid = verifySignature(
				rawBody,
				receivedSig,
				YOBASEPAY_WEBHOOK_SECRET,
			);
			if (!isValid) {
				console.warn(
					"[Webhook YoBasePay] Invalid signature! Possible spoofed request.",
				);
				return NextResponse.json(
					{ error: "Invalid signature" },
					{ status: 401 },
				);
			}

			console.log("[Webhook YoBasePay] Signature verified ✓");
		}

		let body: Record<string, unknown>;
		try {
			body = JSON.parse(rawBody);
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		// Extract reference ID — coba berbagai field name yang umum dipakai
		const referenceId = (body.merchant_ref ||
			body.reference ||
			body.reference_id ||
			body.trx_id ||
			body.order_id ||
			body.invoice_id) as string;

		// Extract status
		const status = (body.status ||
			body.payment_status ||
			body.transaction_status) as string;

		// Extract additional info for logging
		const amount = body.amount || body.total || body.paid_amount;
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

		if (isSuccess) {
			await updatePurchaseRequestStatus({
				id: referenceId,
				status: "approved",
			});

			console.log(
				`[Webhook YoBasePay] Payment APPROVED for ${referenceId}`,
			);
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
			console.log(
				`[Webhook YoBasePay] Payment PENDING for ${referenceId}`,
			);
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
		// Return 200 agar YoBasePay tidak retry terus
		return NextResponse.json(
			{ error: "Processing error" },
			{ status: 200 },
		);
	}
}
