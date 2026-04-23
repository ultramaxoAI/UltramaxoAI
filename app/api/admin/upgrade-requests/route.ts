import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db, updatePurchaseRequestStatus } from "@backend/db/queries";
import { purchaseRequest } from "@backend/db/schema";

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

		if (!["pending", "paid", "approved", "rejected"].includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		await updatePurchaseRequestStatus({
			id: resolvedId,
			status,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating upgrade request:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
