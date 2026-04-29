import { BillingPanel } from "@/components/api-console/billing-panel";
import type { Metadata } from "next";

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
