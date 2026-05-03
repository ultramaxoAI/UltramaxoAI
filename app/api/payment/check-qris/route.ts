import { db, updatePurchaseRequestStatus } from "@backend/db/queries";
import { purchaseRequest, user } from "@backend/db/schema";
import { sendProUpgradeEmail } from "@backend/email";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export const dynamic = "force-dynamic";

function parseNote(note: string | null) {
	if (!note) return {};

	try {
		const parsed = JSON.parse(note);
		return typeof parsed === "object" && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}

export async function GET(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const requestId = searchParams.get("requestId");

		if (!requestId) {
			return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
		}

		// Look up purchase request
		const [reqInfo] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.id, requestId))
			.limit(1);

		if (!reqInfo) {
			return NextResponse.json({ error: "Request not found" }, { status: 404 });
		}

		// Ensure the user owns this request
		if (reqInfo.userId !== session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		const noteData = parseNote(reqInfo.note) as {
			checkoutUrl?: string | null;
			qris?: string | null;
			webhookStatus?: string | null;
			paidAt?: string | null;
		};

		if (reqInfo.status === "approved" || reqInfo.status === "paid") {
			return NextResponse.json({
				paid: true,
				status: reqInfo.status,
				checkoutUrl: noteData.checkoutUrl || null,
				qris: noteData.qris || null,
				paidAt: noteData.paidAt || null,
			});
		}

		const webhookStatus = String(noteData.webhookStatus || "").toUpperCase();
		if (
			reqInfo.status === "pending" &&
			["PAID", "SUCCESS", "SETTLED", "COMPLETED", "SUCCESSFUL"].includes(
				webhookStatus,
			)
		) {
			await updatePurchaseRequestStatus({
				id: requestId,
				status: "approved",
			});

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
				console.error(
					"[Payment Status] Failed to send PRO upgrade email:",
					emailErr,
				);
			}

			return NextResponse.json({
				paid: true,
				status: "approved",
				checkoutUrl: noteData.checkoutUrl || null,
				qris: noteData.qris || null,
				paidAt: noteData.paidAt || null,
			});
		}

		if (
			reqInfo.status === "rejected" ||
			["FAILED", "EXPIRED", "REJECTED", "CANCELLED", "CANCELED"].includes(
				webhookStatus,
			)
		) {
			return NextResponse.json({
				paid: false,
				status: "rejected",
				checkoutUrl: noteData.checkoutUrl || null,
				qris: noteData.qris || null,
			});
		}

		return NextResponse.json({
			paid: false,
			status: reqInfo.status,
			checkoutUrl: noteData.checkoutUrl || null,
			qris: noteData.qris || null,
		});
	} catch (error) {
		console.error("[QRIS Check] Internal Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
