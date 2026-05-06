import { getMaintenanceSettings } from "@backend/db/queries-settings";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Toaster } from "sonner";
import { auth } from "@/app/(auth)/auth";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { CookieConsent } from "@/components/cookie-consent";
import { JsonLd } from "@/components/json-ld";
import { TimedFeedbackPrompt } from "@/components/timed-feedback-prompt";
import { VisitorTracker } from "@/components/visitor-tracker";

export const metadata: Metadata = {
	metadataBase: new URL("https://ultramaxo.tech"),
	title: {
		default: "UltramaxoAI - The Uncensored AI Workspace",
		template: "%s | UltramaxoAI",
	},
	description:
		"UltramaxoAI adalah AI workspace multimodal untuk chat, coding, dan dokumen yang bantu kamu kerja lebih cepat tanpa sensor. Semua di satu tempat.",
	keywords: [
		"ultramaxo",
		"ultramaxo ai",
		"ultramaxo tech",
		"AI Chatbot",
		"Uncensored AI",
		"AI Workspace",
		"Coding AI",
		"AI Assistant",
		"Multimodal AI",
	],
	authors: [{ name: "Ultramaxo" }],
	creator: "Ultramaxo",
	publisher: "Ultramaxo",
	alternates: {
		canonical: "/",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		type: "website",
		locale: "id_ID",
		url: "https://ultramaxo.tech",
		title: "UltramaxoAI - The Uncensored AI Workspace",
		description:
			"UltramaxoAI adalah AI workspace multimodal untuk chat, coding, dan dokumen yang bantu kamu kerja lebih cepat tanpa sensor.",
		siteName: "UltramaxoAI",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "UltramaxoAI Workspace",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "UltramaxoAI - The Uncensored AI Workspace",
		description:
			"AI workspace multimodal untuk chat, coding, dan dokumen yang bantu kamu kerja lebih cepat tanpa sensor.",
		images: ["/og-image.jpg"],
		creator: "@ultramaxo",
	},
	icons: {
		icon: "/icons/icon-192x192.png",
		shortcut: "/icons/icon-192x192.png",
		apple: "/icons/icon-512x512.png",
	},
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1, // Disable auto-zoom on mobile Safari
	userScalable: false,
	interactiveWidget: "resizes-content", // Better keyboard handling on mobile
};

const geist = GeistSans;
const geistMono = GeistMono;

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "#18181b";
const API_SUBDOMAIN = "api.";
const CHAT_MAINTENANCE_PATH_PREFIXES = ["/chat", "/settings", "/redeem"];
const MAINTENANCE_BYPASS_PATHS = [
	"/maintenance",
	"/login",
	"/register",
	"/oauth",
	"/verify",
	"/forgot-password",
	"/reset-password",
	"/api",
];
const STATIC_PATH_PREFIXES = ["/_next", "/favicon"];
const STATIC_PATHNAMES = new Set([
	"/robots.txt",
	"/sitemap.xml",
	"/manifest.webmanifest",
]);
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

function isStaticRequest(pathname: string) {
	return (
		STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
		STATIC_PATHNAMES.has(pathname) ||
		/\.[a-zA-Z0-9]+$/.test(pathname)
	);
}

function isMaintenanceBypassPath(pathname: string) {
	if (pathname.startsWith("/admin")) {
		return true;
	}

	return MAINTENANCE_BYPASS_PATHS.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

async function shouldRedirectToMaintenance() {
	const headerStore = await headers();
	const pathname = headerStore.get("x-pathname") || "/";
	const host =
		headerStore.get("x-request-host") ||
		headerStore.get("x-forwarded-host") ||
		headerStore.get("host") ||
		"";

	if (host.startsWith(API_SUBDOMAIN) || isStaticRequest(pathname)) {
		return false;
	}

	if (isMaintenanceBypassPath(pathname)) {
		return false;
	}

	const isChatMaintenancePath = CHAT_MAINTENANCE_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);

	if (!isChatMaintenancePath) {
		return false;
	}

	const [session, settings] = await Promise.all([
		auth(),
		getMaintenanceSettings("chat"),
	]);

	return (
		settings?.maintenanceEnabled === true && session?.user?.role !== "admin"
	);
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	if (await shouldRedirectToMaintenance()) {
		redirect("/maintenance?scope=chat");
	}

	return (
		<html
			className={`${geist.variable} ${geistMono.variable} dark`}
			// \`next-themes\` injects an extra classname to the body element to avoid
			// visual flicker before hydration. Hence the \`suppressHydrationWarning\`
			// prop is necessary to avoid the React hydration mismatch warning.
			// https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
			lang="id"
			suppressHydrationWarning
		>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Barlow:wght@300;400;500;600&display=swap"
					rel="stylesheet"
				/>
				<Script id="theme-color-script" strategy="beforeInteractive">
					{THEME_COLOR_SCRIPT}
				</Script>
			</head>
			<body className="font-sans antialiased bg-background text-foreground transition-colors duration-500 ease-in-out">
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					disableTransitionOnChange
					enableSystem={false}
				>
					<Toaster position="top-left" richColors />
					<VisitorTracker />
					<CookieConsent />
					<SessionProvider>
						<TimedFeedbackPrompt />
						{children}
						<JsonLd />
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
