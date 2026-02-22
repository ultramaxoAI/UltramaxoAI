import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	listPurchaseRequestsAdmin,
	updatePurchaseRequestStatus,
} from "@/lib/db/queries";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const purchases = await listPurchaseRequestsAdmin();
		return NextResponse.json({ purchases });
	} catch (error) {
		console.error("API Error (admin/purchases/GET):", error);
		return NextResponse.json(
			{ error: "Failed to fetch purchases" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id, status } = body || {};

		if (!id || !status) {
			return NextResponse.json(
				{ error: "Missing id or status" },
				{ status: 400 },
			);
		}

		if (!["pending", "paid", "approved", "rejected"].includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		const purchase = await updatePurchaseRequestStatus({ id, status });
		return NextResponse.json({ purchase });
	} catch (error) {
		console.error("API Error (admin/purchases/PATCH):", error);
		return NextResponse.json(
			{ error: "Failed to update purchase" },
			{ status: 500 },
		);
	}
}
