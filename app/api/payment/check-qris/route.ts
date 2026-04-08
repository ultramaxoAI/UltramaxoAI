import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db, updatePurchaseRequestStatus } from "@/lib/db/queries";
import { purchaseRequest, user } from "@/lib/db/schema";
import { sendProUpgradeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const requestId = searchParams.get("requestId");

		if (!requestId) {
			return NextResponse.json(
				{ error: "Missing requestId" },
				{ status: 400 },
			);
		}

		// Look up purchase request
		const [reqInfo] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.id, requestId))
			.limit(1);

		if (!reqInfo) {
			return NextResponse.json(
				{ error: "Request not found" },
				{ status: 404 },
			);
		}

		// Ensure the user owns this request
		if (reqInfo.userId !== session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// If it's already approved, return true
		if (reqInfo.status === "approved" || reqInfo.status === "paid") {
			return NextResponse.json({ paid: true, status: reqInfo.status });
		}

		// Check the external transaction via QRIS Cepat TRX ID stored in 'note'
		const trxId = reqInfo.note;
		if (!trxId) {
			return NextResponse.json(
				{ error: "No external transaction ID found for this request" },
				{ status: 400 },
			);
		}

		// Call QRIS Cepat checking endpoint
		const checkUrl = `https://qriscepat.com/api/trx/${trxId}`;
		console.log("[QRIS Check] Polling QRISCepat API for trx:", trxId);
		
		const checkResponse = await fetch(checkUrl);
		const checkText = await checkResponse.text();
		
		console.log("[QRIS Check] Response:", checkResponse.status, checkText.substring(0, 100) + "...");

		if (checkResponse.ok) {
			const checkData = JSON.parse(checkText);
			
			if (checkData.status === "success" && checkData.data) {
				const trxStatus = checkData.data.trx_status?.toLowerCase();
				
				if (trxStatus === "success" || trxStatus === "paid" || trxStatus === "settled") {
					console.log("[QRIS Check] Payment successful for requestId:", requestId);
					// Mark as approved (this grants PRO inside queries.ts)
					await updatePurchaseRequestStatus({
						id: requestId,
						status: "approved",
					});
					
					// Trigger Upgrade Email
					try {
						const [proUser] = await db
							.select()
							.from(user)
							.where(eq(user.id, reqInfo.userId))
							.limit(1);

						if (proUser?.email) {
							await sendProUpgradeEmail(proUser.email, proUser.name || "User");
						}
					} catch (emailErr) {
						console.error("[QRIS Check] Failed to send PRO upgrade email:", emailErr);
					}
					
					return NextResponse.json({ paid: true, status: "approved" });
				} else if (trxStatus === "failed" || trxStatus === "expired") {
					await updatePurchaseRequestStatus({
						id: requestId,
						status: "rejected",
					});
					return NextResponse.json({ paid: false, status: "rejected" });
				}
				
				// "pending"
				return NextResponse.json({ paid: false, status: trxStatus || "pending" });
			}
		}

		return NextResponse.json({ paid: false, status: "pending" });
	} catch (error) {
		console.error("[QRIS Check] Internal Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
