import { NextResponse } from "next/server";

import { getSiteSettings } from "@/lib/db/queries-settings";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const settings = await getSiteSettings();
		return NextResponse.json(
			{
				maintenanceEnabled: settings?.maintenanceEnabled ?? false,
				maintenanceTitle:
					settings?.maintenanceTitle ?? "Scheduled maintenance in progress",
				maintenanceMessage:
					settings?.maintenanceMessage ??
					"UltramaxoAI is temporarily offline while we apply updates and verify system stability.",
				updatedAt: settings?.updatedAt ?? null,
			},
			{
				headers: {
					"cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
				},
			},
		);
	} catch (error) {
		console.error("API Error (public/site-status/GET):", error);
		return NextResponse.json(
			{
				maintenanceEnabled: false,
				maintenanceTitle: "Scheduled maintenance in progress",
				maintenanceMessage:
					"UltramaxoAI is temporarily offline while we apply updates and verify system stability.",
				updatedAt: null,
			},
			{ status: 200 },
		);
	}
}