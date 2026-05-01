import type { Metadata } from "next";
import LandingPage from "@/components/landing-page";

export const metadata: Metadata = {
	title: "UltramaxoAI - The Uncensored AI Workspace",
	description:
		"UltramaxoAI adalah AI workspace multimodal untuk chat, coding, dan dokumen yang bantu kamu kerja lebih cepat tanpa sensor.",
	alternates: {
		canonical: "https://ultramaxo.tech",
		languages: {
			"id-ID": "https://ultramaxo.tech",
			"en-US": "https://ultramaxo.tech",
		},
	},
};

export default function RootPage() {
	return <LandingPage />;
}
