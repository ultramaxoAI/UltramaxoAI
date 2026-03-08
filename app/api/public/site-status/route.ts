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
					settings?.maintenanceTitle ?? "Situs sedang kami rapikan sebentar",
				maintenanceMessage:
					settings?.maintenanceMessage ??
					"Beberapa bagian sedang kami perbarui agar akses berikutnya lebih stabil. Silakan coba lagi beberapa saat lagi.",
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
				maintenanceTitle: "Situs sedang kami rapikan sebentar",
				maintenanceMessage:
					"Beberapa bagian sedang kami perbarui agar akses berikutnya lebih stabil. Silakan coba lagi beberapa saat lagi.",
				updatedAt: null,
			},
			{ status: 200 },
		);
	}
}