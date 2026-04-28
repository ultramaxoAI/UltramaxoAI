import { db } from "@backend/db/queries";
import { purchaseRequest } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	const [order] = await db
		.select()
		.from(purchaseRequest)
		.where(eq(purchaseRequest.id, id));

	if (!order || order.userId !== session.user.id) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	// Auto-cancel if pending and older than 24 hours
	const ageMs = Date.now() - new Date(order.createdAt).getTime();
	const isExpired = ageMs > 24 * 60 * 60 * 1000;

	if (order.status === "pending" && isExpired) {
		await db
			.update(purchaseRequest)
			.set({ status: "cancelled", updatedAt: new Date() })
			.where(eq(purchaseRequest.id, id));
		order.status = "cancelled";
	}

	// Parse note for payment details
	let noteData: Record<string, unknown> = {};
	try {
		if (order.note) noteData = JSON.parse(order.note);
	} catch {
		/* ignore parse errors */
	}

	return NextResponse.json({
		id: order.id,
		status: order.status,
		trxId: (noteData.trxId as string) || null,
		refId: order.id,
		qrImage: (noteData.qrImage as string) || null,
		paymentUrl: (noteData.paymentUrl as string) || null,
		amountToPay: order.price,
		amountUsd: ((noteData.usdCents as number) || 0) / 100,
		createdAt: order.createdAt,
		method: order.method,
	});
}
