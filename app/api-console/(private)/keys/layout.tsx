import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Console — API Keys",
	description:
		"Buat dan kelola API key untuk mengakses Ultramaxo API. Keamanan tinggi dengan show-once reveal dan masked storage.",
	openGraph: {
		title: "Ultramaxo — API Keys Management",
		description: "Buat dan kelola API key untuk akses 46+ model AI.",
		url: "https://app.ultramaxo.tech/keys",
	},
};

export default function KeysLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
