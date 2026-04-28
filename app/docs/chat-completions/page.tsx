"use client";
import { useDocsContext } from "../docs-context";

const t = {
	en: {
		title: "Chat Completions",
		intro:
			"Create chat completions using the OpenAI-compatible /v1/chat/completions endpoint.",
		endpoint: "Endpoint",
		params: "Request Parameters",
		paramList: [
			{
				name: "model",
				type: "string",
				required: true,
				desc: "The model ID to use (e.g. deepseek-v4-flash)",
			},
			{
				name: "messages",
				type: "array",
				required: true,
				desc: "Array of message objects with role and content",
			},
			{
				name: "stream",
				type: "boolean",
				required: false,
				desc: "If true, responses are streamed via SSE",
			},
			{
				name: "temperature",
				type: "number",
				required: false,
				desc: "Sampling temperature (0-2, default: 1)",
			},
			{
				name: "max_tokens",
				type: "number",
				required: false,
				desc: "Maximum tokens to generate",
			},
		],
		roles: "Message Roles",
		roleList: [
			{
				role: "system",
				desc: "Sets the behavior and context of the assistant",
			},
			{ role: "user", desc: "The user's message or question" },
			{
				role: "assistant",
				desc: "Previous assistant responses (for multi-turn)",
			},
		],
		example: "Example Request",
		streaming: "Streaming",
		streamDesc:
			"Set stream: true to receive responses as Server-Sent Events (SSE). Each chunk contains a delta of the response.",
		response: "Response Format",
	},
	id: {
		title: "Chat Completions",
		intro:
			"Buat chat completions menggunakan endpoint /v1/chat/completions yang kompatibel dengan OpenAI.",
		endpoint: "Endpoint",
		params: "Parameter Request",
		paramList: [
			{
				name: "model",
				type: "string",
				required: true,
				desc: "ID model yang digunakan (misal: deepseek-v4-flash)",
			},
			{
				name: "messages",
				type: "array",
				required: true,
				desc: "Array objek pesan dengan role dan content",
			},
			{
				name: "stream",
				type: "boolean",
				required: false,
				desc: "Jika true, respons dikirim via SSE",
			},
			{
				name: "temperature",
				type: "number",
				required: false,
				desc: "Temperatur sampling (0-2, default: 1)",
			},
			{
				name: "max_tokens",
				type: "number",
				required: false,
				desc: "Maksimum token yang dihasilkan",
			},
		],
		roles: "Role Pesan",
		roleList: [
			{ role: "system", desc: "Mengatur perilaku dan konteks asisten" },
			{ role: "user", desc: "Pesan atau pertanyaan pengguna" },
			{
				role: "assistant",
				desc: "Respons asisten sebelumnya (untuk multi-turn)",
			},
		],
		example: "Contoh Request",
		streaming: "Streaming",
		streamDesc:
			"Set stream: true untuk menerima respons sebagai Server-Sent Events (SSE). Setiap chunk berisi delta dari respons.",
		response: "Format Respons",
	},
};

export default function DocsChatCompletionsPage() {
	const { lang } = useDocsContext();
	const c = t[lang];
	return (
		<div className="docs-content">
			<h1 className="docs-h1">{c.title}</h1>
			<p className="docs-subtitle">{c.intro}</p>

			<h2 className="docs-h2">{c.endpoint}</h2>
			<pre className="docs-pre">
				POST https://api.ultramaxo.tech/v1/chat/completions
			</pre>

			<h2 className="docs-h2">{c.params}</h2>
			<table className="docs-table">
				<thead>
					<tr>
						<th>Parameter</th>
						<th>Type</th>
						<th>{lang === "en" ? "Required" : "Wajib"}</th>
						<th>{lang === "en" ? "Description" : "Deskripsi"}</th>
					</tr>
				</thead>
				<tbody>
					{c.paramList.map((p) => (
						<tr key={p.name}>
							<td>
								<code>{p.name}</code>
							</td>
							<td>{p.type}</td>
							<td>{p.required ? "✓" : "—"}</td>
							<td>{p.desc}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h2 className="docs-h2">{c.roles}</h2>
			<table className="docs-table">
				<thead>
					<tr>
						<th>Role</th>
						<th>{lang === "en" ? "Description" : "Deskripsi"}</th>
					</tr>
				</thead>
				<tbody>
					{c.roleList.map((r) => (
						<tr key={r.role}>
							<td>
								<code>{r.role}</code>
							</td>
							<td>{r.desc}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h2 className="docs-h2">{c.example}</h2>
			<pre className="docs-pre">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`}</pre>

			<h2 className="docs-h2">{c.streaming}</h2>
			<p className="docs-p">{c.streamDesc}</p>
			<pre className="docs-pre">{`{
  "model": "deepseek-v4-flash",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}`}</pre>

			<h2 className="docs-h2">{c.response}</h2>
			<pre className="docs-pre">{`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "deepseek-v4-flash",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  }
}`}</pre>
		</div>
	);
}
