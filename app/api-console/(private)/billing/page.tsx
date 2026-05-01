import type { Metadata } from "next";
import { BillingPanel } from "@/components/api-console/billing-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "API Console — Billing & Credits",
	description:
		"Kelola saldo kredit API Anda, lihat riwayat transaksi, dan top-up via QRIS. Mulai dari $2.",
	openGraph: {
		title: "Ultramaxo — Billing & Credits",
		description: "Kelola saldo dan top-up kredit API.",
		url: "https://app.ultramaxo.tech/billing",
	},
};

export default function ApiConsoleBillingPage() {
	return <BillingPanel />;
}
