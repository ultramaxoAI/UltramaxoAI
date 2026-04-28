"use client";

import { useDocsContext } from "./docs-context";

const content = {
	en: {
		title: "Ultramaxo API Documentation",
		subtitle:
			"OpenAI-compatible API for 50+ premium AI models. One endpoint, all models.",
		quickStart: "Quick Start",
		quickStartSteps: [
			{
				title: "1. Get an API key",
				desc: "Sign up and generate a key from the API Console.",
			},
			{
				title: "2. Set your base URL",
				desc: "Point your OpenAI SDK to https://api.ultramaxo.tech/v1",
			},
			{
				title: "3. Make a request",
				desc: "Use any OpenAI-compatible client to call /chat/completions.",
			},
		],
		baseUrl: "Base URL",
		endpoints: "Available Endpoints",
		endpointList: [
			{
				method: "POST",
				path: "/v1/chat/completions",
				desc: "Send messages and get AI responses",
			},
			{ method: "GET", path: "/v1/models", desc: "List all available models" },
			{
				method: "GET",
				path: "/v1/models/:id",
				desc: "Get details for a specific model",
			},
			{ method: "GET", path: "/v1/balance", desc: "Check your credit balance" },
			{ method: "GET", path: "/v1/usage", desc: "View your usage history" },
		],
		example: "Example Request",
		learnMore: "Learn More",
		sections: [
			{
				title: "Authentication",
				desc: "How to authenticate your API requests.",
				href: "/docs/authentication",
			},
			{
				title: "Chat Completions",
				desc: "Send messages, stream responses, and use tools.",
				href: "/docs/chat-completions",
			},
			{
				title: "Models",
				desc: "Browse all available models and their capabilities.",
				href: "/docs/models",
			},
			{
				title: "SDKs & Libraries",
				desc: "Integration guides for Python, JS, Go, and more.",
				href: "/docs/sdks",
			},
		],
	},
	id: {
		title: "Dokumentasi API Ultramaxo",
		subtitle:
			"API kompatibel OpenAI untuk 50+ model AI premium. Satu endpoint, semua model.",
		quickStart: "Mulai Cepat",
		quickStartSteps: [
			{
				title: "1. Dapatkan API key",
				desc: "Daftar dan buat key dari API Console.",
			},
			{
				title: "2. Atur base URL",
				desc: "Arahkan SDK OpenAI ke https://api.ultramaxo.tech/v1",
			},
			{
				title: "3. Kirim request",
				desc: "Gunakan client OpenAI-compatible untuk memanggil /chat/completions.",
			},
		],
		baseUrl: "Base URL",
		endpoints: "Endpoint Tersedia",
		endpointList: [
			{
				method: "POST",
				path: "/v1/chat/completions",
				desc: "Kirim pesan dan dapatkan respons AI",
			},
			{
				method: "GET",
				path: "/v1/models",
				desc: "Daftar semua model yang tersedia",
			},
			{ method: "GET", path: "/v1/models/:id", desc: "Detail model tertentu" },
			{ method: "GET", path: "/v1/balance", desc: "Cek saldo kredit" },
			{ method: "GET", path: "/v1/usage", desc: "Lihat riwayat penggunaan" },
		],
		example: "Contoh Request",
		learnMore: "Pelajari Lebih Lanjut",
		sections: [
			{
				title: "Autentikasi",
				desc: "Cara mengautentikasi request API Anda.",
				href: "/docs/authentication",
			},
			{
				title: "Chat Completions",
				desc: "Kirim pesan, stream respons, dan gunakan tools.",
				href: "/docs/chat-completions",
			},
			{
				title: "Model",
				desc: "Jelajahi semua model yang tersedia dan kapabilitasnya.",
				href: "/docs/models",
			},
			{
				title: "SDK & Library",
				desc: "Panduan integrasi untuk Python, JS, Go, dan lainnya.",
				href: "/docs/sdks",
			},
		],
	},
};

export default function PublicDocsIntroPage() {
	const { lang } = useDocsContext();
	const c = content[lang];

	return (
		<div className="docs-content">
			<h1 className="docs-h1">{c.title}</h1>
			<p className="docs-subtitle">{c.subtitle}</p>

			{/* Base URL */}
			<div className="docs-card" style={{ marginTop: 24 }}>
				<div className="docs-label">{c.baseUrl}</div>
				<code className="docs-code-block">https://api.ultramaxo.tech/v1</code>
			</div>

			{/* Quick Start */}
			<h2 className="docs-h2">{c.quickStart}</h2>
			<div className="docs-steps">
				{c.quickStartSteps.map((s) => (
					<div key={s.title} className="docs-step">
						<div className="docs-step-title">{s.title}</div>
						<p className="docs-step-desc">{s.desc}</p>
					</div>
				))}
			</div>

			{/* Example */}
			<h2 className="docs-h2">{c.example}</h2>
			<pre className="docs-pre">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}</pre>

			{/* Endpoints */}
			<h2 className="docs-h2">{c.endpoints}</h2>
			<table className="docs-table">
				<thead>
					<tr>
						<th>Method</th>
						<th>Path</th>
						<th>{lang === "en" ? "Description" : "Deskripsi"}</th>
					</tr>
				</thead>
				<tbody>
					{c.endpointList.map((ep) => (
						<tr key={ep.path}>
							<td>
								<span
									className={`docs-method docs-method--${ep.method.toLowerCase()}`}
								>
									{ep.method}
								</span>
							</td>
							<td>
								<code>{ep.path}</code>
							</td>
							<td>{ep.desc}</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Learn more cards */}
			<h2 className="docs-h2">{c.learnMore}</h2>
			<div className="docs-grid">
				{c.sections.map((s) => (
					<a key={s.href} href={s.href} className="docs-link-card">
						<div className="docs-link-card-title">{s.title}</div>
						<p className="docs-link-card-desc">{s.desc}</p>
					</a>
				))}
			</div>
		</div>
	);
}
