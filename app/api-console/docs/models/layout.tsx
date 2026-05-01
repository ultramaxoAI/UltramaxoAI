import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Documentation — Available Models",
	description:
		"Daftar lengkap model AI yang tersedia di Ultramaxo API beserta harga per token. GPT-5, Claude 4 Sonnet, Gemini 2.5 Pro, DeepSeek R1, dan lainnya.",
	openGraph: {
		title: "Ultramaxo API — Model Pricing & Availability",
		description: "Daftar model AI dan harga per token di Ultramaxo API.",
		url: "https://app.ultramaxo.tech/docs/models",
	},
};

export default function DocsModelsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
