import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { purchaseRequest } from "@/lib/db/schema";

const upgradeRequestSchema = z.object({
	planId: z.string(),
	months: z.number().min(1),
	price: z.number().min(0),
	note: z.string().optional(),
});

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Don't allow guests to request upgrades
		if (session.user.type === "guest") {
			return NextResponse.json(
				{ error: "Guest users cannot request upgrades" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const validatedData = upgradeRequestSchema.parse(body);

		// Create purchase request
		await db.insert(purchaseRequest).values({
			userId: session.user.id,
			username: session.user.name || undefined,
			email: session.user.email || undefined,
			planId: validatedData.planId,
			months: validatedData.months,
			price: validatedData.price,
			method: "manual",
			status: "pending",
			note: validatedData.note,
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Error creating upgrade request:", error);

		if (error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
