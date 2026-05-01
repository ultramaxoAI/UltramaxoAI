import { getMaintenanceSettings } from "@backend/db/queries-settings";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ApiConsoleClientLayout } from "@/components/api-console/client-layout";

export const metadata: Metadata = {
	metadataBase: new URL("https://app.ultramaxo.tech"),
	title: {
		default: "Ultramaxo API Console",
		template: "%s | Ultramaxo API",
	},
	description:
		"Ultramaxo API Console — Akses 46+ model AI (GPT-5, Claude, Gemini, DeepSeek) melalui satu API key. Dashboard developer, dokumentasi, dan playground.",
	keywords: [
		"Ultramaxo API",
		"AI API Gateway",
		"GPT-5 API",
		"Claude API",
		"Gemini API",
		"DeepSeek API",
		"OpenAI compatible API",
		"AI model API",
		"unified AI API",
		"API Console",
		"AI playground",
	],
	openGraph: {
		type: "website",
		siteName: "Ultramaxo API",
		locale: "id_ID",
		url: "https://app.ultramaxo.tech",
		title: "Ultramaxo API Console — 46+ AI Models, One API Key",
		description:
			"Akses GPT-5, Claude, Gemini, DeepSeek, dan 40+ model AI lainnya melalui satu endpoint OpenAI-compatible.",
		images: [
			{
				url: "https://ultramaxo.tech/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Ultramaxo API Console",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Ultramaxo API — 46+ AI Models, One API Key",
		description:
			"Akses GPT-5, Claude, Gemini, DeepSeek melalui satu endpoint OpenAI-compatible.",
		images: ["https://ultramaxo.tech/og-image.jpg"],
		creator: "@ultramaxo",
	},
	alternates: {
		canonical: "https://app.ultramaxo.tech",
	},
};

const navItems = [
	{ href: "/api-console", label: "Overview", icon: "◈" },
	{ href: "/api-console/keys", label: "API Keys", icon: "⚿" },
	{ href: "/api-console/billing", label: "Billing", icon: "⊡" },
	{ href: "/api-console/models", label: "Models", icon: "◎" },
	{ href: "/api-console/pricing", label: "Pricing", icon: "$" },
	{ href: "/api-console/playground", label: "Playground", icon: "▷" },
	{
		href: "/api-console/docs",
		label: "Documentation",
		icon: "☰",
		children: [
			{ href: "/api-console/docs", label: "Introduction" },
			{ href: "/api-console/docs/authentication", label: "Authentication" },
			{ href: "/api-console/docs/chat-completions", label: "Chat Completions" },
			{ href: "/api-console/docs/models", label: "Models" },
			{ href: "/api-console/docs/sdks", label: "SDKs & Libraries" },
			{ href: "/api-console/docs/billing", label: "Billing & Limits" },
			{ href: "/api-console/docs/errors", label: "Error Reference" },
		],
	},
];

export default async function ApiConsoleLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [session, settings] = await Promise.all([
		auth(),
		getMaintenanceSettings("api"),
	]);

	if (settings.maintenanceEnabled && session?.user?.role !== "admin") {
		redirect("/maintenance?scope=api");
	}

	return (
		<ApiConsoleClientLayout navItems={navItems}>
			{children}
		</ApiConsoleClientLayout>
	);
}
