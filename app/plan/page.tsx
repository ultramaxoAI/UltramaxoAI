import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { PricingPage } from "@/components/pricing-page";

export const metadata: Metadata = {
	title: "Pricing Plans",
	description:
		"Upgrade to UltramaxoAI Pro for unlimited chat, customized tools, and priority access.",
	alternates: {
		canonical: "/plan",
	},
};

export const dynamic = "force-dynamic";

export default async function PlanPage() {
	const session = await auth();

	// Auto-redirect if user is already PRO
	if (session?.user?.type === "pro") {
		redirect("/chat");
	}

	return <PricingPage user={session?.user} />;
}
