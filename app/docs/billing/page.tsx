"use client";
import { useDocsContext } from "../docs-context";

export default function DocsBillingPage() {
	const { lang } = useDocsContext();
	const en = lang === "en";
	return (
		<div className="docs-content">
			<h1 className="docs-h1">{en ? "Billing & Limits" : "Billing & Limit"}</h1>
			<p className="docs-subtitle">
				{en
					? "Understand how billing works with the Ultramaxo API."
					: "Pahami cara kerja billing di API Ultramaxo."}
			</p>

			<h2 className="docs-h2">
				{en ? "How Billing Works" : "Cara Kerja Billing"}
			</h2>
			<p className="docs-p">
				{en
					? "Ultramaxo uses a prepaid credit system. Top up your balance, then each API call deducts credits based on token usage. Free models have zero cost."
					: "Ultramaxo menggunakan sistem kredit prabayar. Isi saldo Anda, lalu setiap panggilan API akan mengurangi kredit berdasarkan penggunaan token. Model gratis tidak dikenakan biaya."}
			</p>

			<h2 className="docs-h2">{en ? "Check Balance" : "Cek Saldo"}</h2>
			<pre className="docs-pre">{`GET /v1/balance
Authorization: Bearer ux_sk_YOUR_KEY`}</pre>
			<pre className="docs-pre">{`{
  "balance_cents": 500,
  "balance_usd": "5.00",
  "currency": "USD"
}`}</pre>

			<h2 className="docs-h2">{en ? "View Usage" : "Lihat Penggunaan"}</h2>
			<pre className="docs-pre">{`GET /v1/usage?days=7
Authorization: Bearer ux_sk_YOUR_KEY`}</pre>

			<h2 className="docs-h2">{en ? "Top Up" : "Isi Ulang"}</h2>
			<p className="docs-p">
				{en
					? "Top up your balance via QRIS from the API Console billing page. Minimum top-up is $2 USD, converted to IDR at checkout."
					: "Isi ulang saldo via QRIS dari halaman billing API Console. Minimum top-up $2 USD, dikonversi ke IDR saat checkout."}
			</p>

			<h2 className="docs-h2">{en ? "Rate Limits" : "Batas Rate"}</h2>
			<table className="docs-table">
				<thead>
					<tr>
						<th>{en ? "Limit" : "Batas"}</th>
						<th>{en ? "Value" : "Nilai"}</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{en ? "Requests per minute" : "Request per menit"}</td>
						<td>60</td>
					</tr>
					<tr>
						<td>{en ? "Tokens per minute" : "Token per menit"}</td>
						<td>100,000</td>
					</tr>
					<tr>
						<td>{en ? "Concurrent requests" : "Request bersamaan"}</td>
						<td>10</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
