import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Console — Playground",
	description:
		"Coba Ultramaxo API langsung di browser. Playground interaktif untuk testing model AI (GPT-5, Claude, Gemini) tanpa perlu coding.",
	openGraph: {
		title: "Ultramaxo — API Playground",
		description:
			"Testing model AI langsung di browser tanpa perlu coding.",
		url: "https://app.ultramaxo.tech/playground",
	},
};

export default function PlaygroundLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
