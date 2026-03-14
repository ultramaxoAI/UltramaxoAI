import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Authentication",
		template: "%s | UltramaxoAI",
	},
	description: "Sign in or create an account for UltramaxoAI, the uncensored workspace.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
