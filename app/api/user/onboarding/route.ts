import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.email) {
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

		const dbUser = await db
			.select()
			.from(user)
			.where(eq(user.email, session.user.email))
			.then((res) => res[0]);

		if (!dbUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update the user's onboarding reason in the database
		await db
			.update(user)
			.set({
				onboardingReason: reason,
				updatedAt: new Date(),
			})
			.where(eq(user.id, dbUser.id));

		return NextResponse.json({ success: true, message: "Onboarding completed" });
	} catch (error) {
		console.error("Failed to save onboarding reason:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
