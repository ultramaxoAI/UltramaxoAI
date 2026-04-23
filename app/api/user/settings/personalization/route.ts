import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/app/(auth)/auth";
import { getUserSettings, upsertUserSettings } from "@backend/db/queries-settings";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getUserSettings(session.user.id);
		return NextResponse.json({
			settings: settings || {
				displayName: "",
				customInstructions: "",
				language: "en",
			},
		});
	} catch (error) {
		console.error("API Error (personalization/GET):", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { displayName, customInstructions, language } = body;

		await upsertUserSettings(session.user.id, {
			displayName: displayName || null,
			customInstructions: customInstructions || null,
			language: language || "en",
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (personalization/PATCH):", error);
		return NextResponse.json(
			{ error: "Failed to save settings" },
			{ status: 500 },
		);
	}
}
