import {
	getMaintenanceSettings,
	type MaintenanceScope,
} from "@backend/db/queries-settings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const scopeParam = url.searchParams.get("scope");
		const scope: MaintenanceScope = scopeParam === "api" ? "api" : "chat";
		const settings = await getMaintenanceSettings(scope);
		return NextResponse.json(
			{
				scope,
				maintenanceEnabled: settings?.maintenanceEnabled ?? false,
				maintenanceTitle: settings?.maintenanceTitle ?? "We'll be right back.",
				maintenanceMessage:
					settings?.maintenanceMessage ??
					"Lagi ada update kecil. Sebentar lagi balik.",
				updatedAt: settings?.updatedAt ?? null,
			},
			{
				headers: {
					"cache-control":
						"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
				},
			},
		);
	} catch (error) {
		console.error("API Error (public/site-status/GET):", error);
		return NextResponse.json(
			{
				scope: "chat",
				maintenanceEnabled: false,
				maintenanceTitle: "We'll be right back.",
				maintenanceMessage: "Lagi ada update kecil. Sebentar lagi balik.",
				updatedAt: null,
			},
			{ status: 200 },
		);
	}
}
