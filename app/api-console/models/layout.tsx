import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Console — Models Catalog",
	description:
		"Jelajahi 46+ model AI yang tersedia di Ultramaxo. GPT-5, Claude 4 Sonnet, Gemini 2.5 Pro, DeepSeek R1, Qwen 3, Llama 4, dan lainnya.",
	openGraph: {
		title: "Ultramaxo — AI Models Catalog",
		description:
			"Jelajahi 46+ model AI termasuk GPT-5, Claude, Gemini, DeepSeek.",
		url: "https://app.ultramaxo.tech/models",
	},
};

export default function ModelsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
