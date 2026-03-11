import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { purchaseRequest, user } from "@/lib/db/schema";

export async function GET(_request: Request) {
	try {
		const session = await auth();

		if (!session || !session.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const requests = await db
			.select()
			.from(purchaseRequest)
			.orderBy(desc(purchaseRequest.createdAt));

		return NextResponse.json({ requests });
	} catch (error) {
		console.error("Error fetching upgrade requests:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	try {
		const session = await auth();

		if (!session || !session.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, requestId, status } = body;
		const resolvedId = id ?? requestId;

		if (!resolvedId || !status) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Update request status
		await db
			.update(purchaseRequest)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(purchaseRequest.id, resolvedId));

		// If approved, upgrade the user to pro
		if (status === "approved") {
			const [request] = await db
				.select()
				.from(purchaseRequest)
				.where(eq(purchaseRequest.id, resolvedId));

			if (request?.userId) {
				const now = new Date();
				const expiresAt = new Date(now);
				expiresAt.setMonth(expiresAt.getMonth() + (request.months || 1));

				await db
					.update(user)
					.set({
						isPro: true,
						proExpiresAt: expiresAt,
						limitCount: 99_999,
					})
					.where(eq(user.id, request.userId));
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating upgrade request:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
