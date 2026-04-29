import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "API Pricing",
	description:
		"Harga Ultramaxo API pay-as-you-go per 1 juta token. Lihat harga input/output per model dan syarat saldo minimum.",
	alternates: {
		canonical: "https://app.ultramaxo.tech/pricing",
	},
	openGraph: {
		title: "Ultramaxo API Pricing",
		description:
			"Harga Ultramaxo API pay-as-you-go per 1 juta token untuk model GPT-5, Claude, Gemini, DeepSeek, dan lainnya.",
		url: "https://app.ultramaxo.tech/pricing",
	},
};

const pricingHighlights = [
	{
		title: "Pay-as-you-go",
		desc: "Tanpa biaya langganan. Bayar sesuai pemakaian per 1 juta token.",
	},
	{
		title: "Harga transparan",
		desc: "Harga input dan output per model terlihat jelas di katalog.",
	},
	{
		title: "Saldo minimum",
		desc: "Gunakan model berbayar dengan saldo minimal $2 USD.",
	},
	{
		title: "Model gratis",
		desc: "Model tertentu tersedia gratis dengan rate limit standar.",
	},
];

export default function ApiPricingPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">API Pricing</h1>
				<p className="apic-subtitle">
					Harga Ultramaxo API dihitung per 1 juta token. Tidak ada
					langganan bulanan.
				</p>
			</div>

			<div className="apic-grid apic-grid--2">
				{pricingHighlights.map((item) => (
					<div className="apic-card" key={item.title}>
						<div className="apic-h3">{item.title}</div>
						<p style={{ color: "var(--apic-text-muted)", marginTop: 6 }}>
							{item.desc}
						</p>
					</div>
				))}
			</div>

			<div className="apic-card apic-stack apic-stack--16">
				<div>
					<div className="apic-h3">Cara hitung biaya</div>
					<p style={{ color: "var(--apic-text-muted)", marginTop: 6 }}>
						Biaya dihitung dari total token input dan output.
					</p>
				</div>
				<pre className="apic-code">{`cost = (prompt_tokens / 1,000,000) * price_in
     + (completion_tokens / 1,000,000) * price_out`}</pre>
				<p style={{ color: "var(--apic-text-muted)", fontSize: 12 }}>
					Harga tersimpan dalam USD per 1 juta token.
				</p>
			</div>

			<div className="apic-grid apic-grid--3">
				<Link href="/models" className="apic-card" style={{ textDecoration: "none" }}>
					<div className="apic-h3">Model Catalog</div>
					<p style={{ color: "var(--apic-text-muted)", marginTop: 6 }}>
						Lihat harga input/output semua model.
					</p>
				</Link>
				<Link href="/docs/billing" className="apic-card" style={{ textDecoration: "none" }}>
					<div className="apic-h3">Billing & Limits</div>
					<p style={{ color: "var(--apic-text-muted)", marginTop: 6 }}>
						Detail sistem kredit, rate limit, dan saldo minimum.
					</p>
				</Link>
				<Link href="/docs/models" className="apic-card" style={{ textDecoration: "none" }}>
					<div className="apic-h3">Docs: Models</div>
					<p style={{ color: "var(--apic-text-muted)", marginTop: 6 }}>
						Contoh response dan struktur data katalog model.
					</p>
				</Link>
			</div>
		</div>
	);
}
