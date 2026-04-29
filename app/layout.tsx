import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { VisitorTracker } from "@/components/visitor-tracker";
import { CookieConsent } from "@/components/cookie-consent";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { JsonLd } from "@/components/json-ld";
import { Analytics } from "@vercel/analytics/next";

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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			className={`${geist.variable} ${geistMono.variable}`}
			// \`next-themes\` injects an extra classname to the body element to avoid
			// visual flicker before hydration. Hence the \`suppressHydrationWarning\`
			// prop is necessary to avoid the React hydration mismatch warning.
			// https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
			lang="id"
			suppressHydrationWarning
		>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
					dangerouslySetInnerHTML={{
						__html: THEME_COLOR_SCRIPT,
					}}
				/>
			</head>
			<body className="font-sans antialiased bg-background text-foreground transition-colors duration-500 ease-in-out">
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					disableTransitionOnChange
					enableSystem
				>
					<Toaster position="top-left" richColors />
					<VisitorTracker />
					<CookieConsent />
					<SessionProvider>
						<OnboardingWizard />
						{children}
						<JsonLd />
					</SessionProvider>
					<Analytics />
				</ThemeProvider>
			</body>
		</html>
	);
}
