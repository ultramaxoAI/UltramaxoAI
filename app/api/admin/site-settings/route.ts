import {
	listMaintenanceSettings,
	MAINTENANCE_SCOPES,
	upsertSiteSettings,
} from "@backend/db/queries-settings";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await listMaintenanceSettings();
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
		const validTemplates = ["midnight", "aurora", "minimal", "ember"];

		const scopes = body?.scopes;
		if (!scopes || typeof scopes !== "object") {
			return NextResponse.json(
				{ error: "Scopes payload is required" },
				{ status: 400 },
			);
		}

		for (const scope of MAINTENANCE_SCOPES) {
			const scopeSettings = scopes[scope];
			if (!scopeSettings || typeof scopeSettings !== "object") {
				return NextResponse.json(
					{ error: `Missing maintenance scope: ${scope}` },
					{ status: 400 },
				);
			}

			const maintenanceTitle = String(
				scopeSettings.maintenanceTitle ?? "",
			).trim();
			const maintenanceMessage = String(
				scopeSettings.maintenanceMessage ?? "",
			).trim();

			if (!maintenanceTitle || !maintenanceMessage) {
				return NextResponse.json(
					{ error: `Title and message are required for ${scope}` },
					{ status: 400 },
				);
			}
		}

		await Promise.all(
			MAINTENANCE_SCOPES.map(async (scope) => {
				const scopeSettings = scopes[scope];
				const maintenanceTemplate = String(
					scopeSettings.maintenanceTemplate ?? "minimal",
				).trim();
				const template = validTemplates.includes(maintenanceTemplate)
					? maintenanceTemplate
					: "minimal";

				await upsertSiteSettings(scope, {
					maintenanceEnabled: Boolean(scopeSettings.maintenanceEnabled),
					maintenanceTemplate: template,
					maintenanceTitle: String(scopeSettings.maintenanceTitle ?? "").trim(),
					maintenanceMessage: String(
						scopeSettings.maintenanceMessage ?? "",
					).trim(),
					updatedBy: session.user.id,
				});
			}),
		);

		const settings = await listMaintenanceSettings();

		return NextResponse.json({ success: true, settings });
	} catch (error) {
		console.error("API Error (admin/site-settings/PATCH):", error);
		return NextResponse.json(
			{ error: "Failed to update site settings" },
			{ status: 500 },
		);
	}
}
