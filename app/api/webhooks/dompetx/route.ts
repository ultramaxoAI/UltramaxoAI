import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { updatePurchaseRequestStatus } from "@backend/db/queries";

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

		// FIX #2: Verifikasi signature WAJIB jika API key dikonfigurasi
		const timestamp = request.headers.get("X-DOMPAY-Timestamp") || "";
		const receivedSig = request.headers.get("X-DOMPAY-Signature") || "";

		if (DOMPETX_API_KEY) {
			// Tolak request tanpa signature header
			if (!receivedSig || !timestamp) {
				console.warn("[Webhook DompetX] Missing signature/timestamp headers! Rejecting.");
				return NextResponse.json(
					{ error: "Missing authentication headers" },
					{ status: 401 },
				);
			}

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

		const normalizedStatus = String(status || "").toUpperCase();
		const isSuccess = ["PAID", "SUCCESS", "SETTLED", "COMPLETED"].includes(
			normalizedStatus,
		);
		const isFailure = ["EXPIRED", "FAILED", "CANCELLED", "CANCELED"].includes(
			normalizedStatus,
		);

		if (isSuccess) {
			await updatePurchaseRequestStatus({
				id: referenceId,
				status: "approved",
			});

			return NextResponse.json({ success: true, message: "Payment processed" });
		}

		if (isFailure) {
			await updatePurchaseRequestStatus({
				id: referenceId,
				status: "rejected",
			});
			return NextResponse.json({
				success: true,
				message: `Payment marked failed: ${status}`,
			});
		}

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
