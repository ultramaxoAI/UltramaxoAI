import {
	getMaintenanceSettings,
	type MaintenanceScope,
} from "@backend/db/queries-settings";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const session = await auth();
	const url = new URL(request.url);
	const scopeParam = url.searchParams.get("scope");
	const scope: MaintenanceScope = scopeParam === "chat" ? "chat" : "api";
	const settings = await getMaintenanceSettings(scope);

	return NextResponse.json({
		scope,
		maintenanceEnabled: settings.maintenanceEnabled,
		maintenanceTemplate: settings.maintenanceTemplate,
		maintenanceTitle: settings.maintenanceTitle,
		maintenanceMessage: settings.maintenanceMessage,
		isAdmin: session?.user?.role === "admin",
	});
}
