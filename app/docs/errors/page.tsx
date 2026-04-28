"use client";
import { useDocsContext } from "../docs-context";

export default function DocsErrorsPage() {
	const { lang } = useDocsContext();
	const en = lang === "en";
	const errors = [
		{
			code: 400,
			name: "Bad Request",
			desc: en
				? "The request body is malformed or missing required fields."
				: "Body request tidak valid atau field wajib tidak ada.",
		},
		{
			code: 401,
			name: "Unauthorized",
			desc: en
				? "Missing or invalid API key."
				: "API key tidak ada atau tidak valid.",
		},
		{
			code: 402,
			name: "Payment Required",
			desc: en
				? "Insufficient credit balance."
				: "Saldo kredit tidak mencukupi.",
		},
		{
			code: 404,
			name: "Not Found",
			desc: en
				? "The requested model or resource does not exist."
				: "Model atau resource yang diminta tidak ada.",
		},
		{
			code: 429,
			name: "Too Many Requests",
			desc: en
				? "Rate limit exceeded. Wait and retry."
				: "Batas rate terlampaui. Tunggu dan coba lagi.",
		},
		{
			code: 500,
			name: "Internal Server Error",
			desc: en
				? "Unexpected server error. Contact support if persistent."
				: "Error server tak terduga. Hubungi support jika terus terjadi.",
		},
		{
			code: 503,
			name: "Service Unavailable",
			desc: en
				? "The upstream model provider is temporarily unavailable."
				: "Provider model upstream sementara tidak tersedia.",
		},
	];

	return (
		<div className="docs-content">
			<h1 className="docs-h1">{en ? "Error Reference" : "Referensi Error"}</h1>
			<p className="docs-subtitle">
				{en
					? "HTTP status codes and error responses from the API."
					: "Kode status HTTP dan respons error dari API."}
			</p>

			<h2 className="docs-h2">{en ? "Error Format" : "Format Error"}</h2>
			<pre className="docs-pre">{`{
  "error": {
    "message": "Insufficient credits",
    "type": "payment_required",
    "code": 402
  }
}`}</pre>

			<h2 className="docs-h2">{en ? "Status Codes" : "Kode Status"}</h2>
			<table className="docs-table">
				<thead>
					<tr>
						<th>Code</th>
						<th>Name</th>
						<th>{en ? "Description" : "Deskripsi"}</th>
					</tr>
				</thead>
				<tbody>
					{errors.map((e) => (
						<tr key={e.code}>
							<td>
								<code>{e.code}</code>
							</td>
							<td>{e.name}</td>
							<td>{e.desc}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h2 className="docs-h2">{en ? "Retry Strategy" : "Strategi Retry"}</h2>
			<p className="docs-p">
				{en
					? "For 429 and 503 errors, implement exponential backoff starting at 1 second. For 402, top up your balance before retrying."
					: "Untuk error 429 dan 503, implementasikan exponential backoff mulai dari 1 detik. Untuk 402, isi saldo sebelum mencoba lagi."}
			</p>
		</div>
	);
}
