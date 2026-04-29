import type { Metadata } from "next";
import Link from "next/link";
import { ApiConsoleSidebarNav } from "@/components/api-console/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleTranslate } from "@/components/google-translate";

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
	return (
		<div className="apic">
			<aside className="apic-sidebar">
				<div className="apic-sidebar-head">
					<Link href="/api-console" className="apic-logo">
						<span className="apic-logo-mark">U</span>
						<span className="apic-logo-text">Ultramaxo</span>
					</Link>
					<span className="apic-badge">API</span>
				</div>

				<ApiConsoleSidebarNav items={navItems} />

				<div className="apic-sidebar-foot flex flex-col gap-3">
					<div className="flex items-center gap-2 px-2">
						<GoogleTranslate />
						<ThemeToggle />
					</div>
					<Link href="/chat" className="apic-nav-link apic-nav-link--muted">
						<span className="apic-nav-icon">←</span>
						Back to Chat
					</Link>
				</div>
			</aside>

			{/* Mobile header */}
			<div className="apic-mobile-header flex items-center justify-between p-4 md:hidden" style={{ borderBottom: "1px solid var(--apic-border)", background: "var(--apic-sidebar-bg)" }}>
				<div className="flex items-center gap-2">
					<Link href="/api-console" className="apic-logo flex items-center gap-2">
						<span className="apic-logo-mark flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm">U</span>
						<span className="apic-logo-text font-semibold">Ultramaxo</span>
					</Link>
					<span className="apic-badge">API</span>
				</div>
				<div className="flex items-center gap-2">
					<GoogleTranslate />
					<ThemeToggle />
				</div>
			</div>

			<main className="apic-main">{children}</main>
		</div>
	);
}
