import { NextResponse } from "next/server";

import { getSiteSettings } from "@backend/db/queries-settings";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const settings = await getSiteSettings();
		return NextResponse.json(
			{
				maintenanceEnabled: settings?.maintenanceEnabled ?? false,
				maintenanceTitle:
					settings?.maintenanceTitle ?? "We'll be right back.",
				maintenanceMessage:
					settings?.maintenanceMessage ??
					"Lagi ada update kecil. Sebentar lagi balik.",
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
				maintenanceTitle: "We'll be right back.",
				maintenanceMessage:
					"Lagi ada update kecil. Sebentar lagi balik.",
				updatedAt: null,
			},
			{ status: 200 },
		);
	}
}