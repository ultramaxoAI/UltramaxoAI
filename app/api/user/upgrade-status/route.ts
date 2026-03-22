import { and, desc, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db, updatePurchaseRequestStatus } from "@/lib/db/queries";
import { purchaseRequest, user as userTable } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Check if user has any pending/approved upgrade requests
 * Used for polling to detect when admin approves upgrade
 */
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const paymentTimeoutMinutes = Number(
			process.env.PAYMENT_PENDING_TIMEOUT_MINUTES ?? 30,
		);
		const timeoutMs = Math.max(1, paymentTimeoutMinutes) * 60_000;
		const timeoutThreshold = new Date(Date.now() - timeoutMs);

		await db
			.update(purchaseRequest)
			.set({ status: "rejected", updatedAt: new Date() })
			.where(
				and(
					eq(purchaseRequest.userId, session.user.id),
					eq(purchaseRequest.status, "pending"),
					lte(purchaseRequest.createdAt, timeoutThreshold),
				),
			);

		let [latestRequest] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.userId, session.user.id))
			.orderBy(desc(purchaseRequest.createdAt))
			.limit(1);

		if (
			latestRequest &&
			latestRequest.status === "pending" &&
			latestRequest.createdAt &&
			latestRequest.createdAt.getTime() <= timeoutThreshold.getTime()
		) {
			latestRequest = await updatePurchaseRequestStatus({
				id: latestRequest.id,
				status: "rejected",
			});
		}

		// Get fresh user data
		const [userData] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, session.user.id))
			.limit(1);

		return NextResponse.json({
			isPro: userData?.isPro || false,
			paymentTimeoutMinutes,
			latestRequest: latestRequest
				? {
						id: latestRequest.id,
						status: latestRequest.status,
						planId: latestRequest.planId,
						createdAt: latestRequest.createdAt,
					}
				: null,
		});
	} catch (error) {
		console.error("Error checking upgrade status:", error);
		return NextResponse.json(
			{ error: "Failed to check status" },
			{ status: 500 },
		);
	}
}
