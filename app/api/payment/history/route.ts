import { db } from "@backend/db/queries";
import { purchaseRequest } from "@backend/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Auto-cancel expired pending orders (older than 24h)
	const cutoff = new Date(Date.now() - EXPIRY_MS);
	await db
		.update(purchaseRequest)
		.set({ status: "cancelled", updatedAt: new Date() })
		.where(
			and(
				eq(purchaseRequest.userId, session.user.id),
				eq(purchaseRequest.status, "pending"),
				lt(purchaseRequest.createdAt, cutoff),
			),
		);

	// Fetch all orders
	const orders = await db
		.select()
		.from(purchaseRequest)
		.where(eq(purchaseRequest.userId, session.user.id))
		.orderBy(desc(purchaseRequest.createdAt))
		.limit(50);

	const mapped = orders.map((o) => {
		let noteData: Record<string, unknown> = {};
		try {
			if (o.note) noteData = JSON.parse(o.note);
		} catch {
			/* ignore */
		}

		return {
			id: o.id,
			status: o.status,
			amountIdr: o.price,
			amountUsd: ((noteData.usdCents as number) || 0) / 100,
			method: o.method,
			trxId: (noteData.trxId as string) || null,
			createdAt: o.createdAt,
			updatedAt: o.updatedAt,
		};
	});

	return NextResponse.json({ orders: mapped });
}
