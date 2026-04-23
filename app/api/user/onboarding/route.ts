import { auth } from "@/app/(auth)/auth";
import { db } from "@backend/db/queries";
import { user } from "@backend/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { reason } = await request.json();

		if (!reason || typeof reason !== "string") {
			return NextResponse.json(
				{ error: "Valid reason is required" },
				{ status: 400 }
			);
		}

		// Update the user's onboarding reason in the database
		const result = await db
			.update(user)
			.set({
				onboardingReason: reason,
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id))
			.returning({ id: user.id });

		if (result.length === 0) {
			console.error("[Onboarding] User not found in DB:", session.user.id);
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: "Onboarding completed" });
	} catch (error) {
		console.error("[Onboarding] Failed to save reason:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
