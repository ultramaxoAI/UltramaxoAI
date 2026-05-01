import {
	getMaintenanceSettings,
	type MaintenanceScope,
} from "@backend/db/queries-settings";
import type { Metadata } from "next";
import {
	AuroraTemplate,
	EmberTemplate,
	MidnightTemplate,
	MinimalTemplate,
} from "./templates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Maintenance | UltramaxoAI",
	description: "UltramaxoAI sedang tidak tersedia untuk sementara waktu.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function MaintenancePage({
	searchParams,
}: {
	searchParams?: Promise<{ scope?: string }>;
}) {
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const scope: MaintenanceScope =
		resolvedSearchParams?.scope === "api" ? "api" : "chat";
	const settings = await getMaintenanceSettings(scope);
	const template = settings?.maintenanceTemplate ?? "minimal";
	const title = settings?.maintenanceTitle ?? "We'll be right back.";
	const message =
		settings?.maintenanceMessage ??
		"Lagi ada update kecil. Sebentar lagi balik.";

	const props = { title, message };

	switch (template) {
		case "aurora":
			return <AuroraTemplate {...props} />;
		case "minimal":
			return <MinimalTemplate {...props} />;
		case "ember":
			return <EmberTemplate {...props} />;
		default:
			return <MidnightTemplate {...props} />;
	}
}
