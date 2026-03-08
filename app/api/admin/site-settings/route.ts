import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getSiteSettings, upsertSiteSettings } from "@/lib/db/queries-settings";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getSiteSettings();
		return NextResponse.json({ settings });
	} catch (error) {
		console.error("API Error (admin/site-settings/GET):", error);
		return NextResponse.json(
			{ error: "Failed to fetch site settings" },
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
		const maintenanceEnabled = Boolean(body.maintenanceEnabled);
		const maintenanceTitle = String(body.maintenanceTitle ?? "").trim();
		const maintenanceMessage = String(body.maintenanceMessage ?? "").trim();

		if (!maintenanceTitle || !maintenanceMessage) {
			return NextResponse.json(
				{ error: "Title and message are required" },
				{ status: 400 },
			);
		}

		const [settings] = await upsertSiteSettings({
			maintenanceEnabled,
			maintenanceTitle,
			maintenanceMessage,
			updatedBy: session.user.id,
		});

		return NextResponse.json({ success: true, settings });
	} catch (error) {
		console.error("API Error (admin/site-settings/PATCH):", error);
		return NextResponse.json(
			{ error: "Failed to update site settings" },
			{ status: 500 },
		);
	}
}