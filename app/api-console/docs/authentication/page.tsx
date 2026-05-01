import type { Metadata } from "next";

const DEFAULT_FREE_MODEL_ID = "gpt-5.3-codex";

export const metadata: Metadata = {
	title: "API Documentation — Authentication",
	description:
		"Pelajari cara autentikasi API Ultramaxo menggunakan API key. Panduan Bearer token dan keamanan API key.",
	openGraph: {
		title: "Ultramaxo API — Authentication Guide",
		description: "Panduan autentikasi API key untuk Ultramaxo API.",
		url: "https://app.ultramaxo.tech/docs/authentication",
	},
};

export default function DocsAuthPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Authentication</h1>
				<p className="apic-subtitle">
					How to authenticate requests to the Ultramaxo API.
				</p>
			</div>

			<div className="apic-prose">
				<h2>API Keys</h2>
				<p>
					All API requests must include a valid API key in the{" "}
					<code className="apic-code--inline">Authorization</code> header using
					the Bearer token scheme.
				</p>

				<pre className="apic-code">
					Authorization: Bearer ux_sk_YOUR_API_KEY
				</pre>

				<h2>Key Format</h2>
				<p>
					API keys always start with the prefix{" "}
					<code className="apic-code--inline">ux_sk_</code> followed by 32
					random characters. Keep your keys secret — do not expose them in
					client-side code or public repositories.
				</p>

				<h2>Creating Keys</h2>
				<p>
					You can create and manage API keys from the API Keys page in the
					console. Each key has a name for identification and can be revoked at
					any time.
				</p>

				<h2>Example</h2>
				<pre className="apic-code">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "ux_sk_YOUR_API_KEY",
  baseURL: "https://api.ultramaxo.tech/v1",
});

const response = await client.chat.completions.create({
  model: "${DEFAULT_FREE_MODEL_ID}",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`}</pre>

				<h2>Security Best Practices</h2>
				<ul>
					<li>
						Store API keys in environment variables, never in source code.
					</li>
					<li>Use separate keys for development and production.</li>
					<li>Revoke unused keys immediately.</li>
					<li>Rotate keys periodically.</li>
				</ul>

				<div className="apic-note apic-note--warn">
					If you suspect a key has been compromised, revoke it immediately from
					the API Keys page and create a new one.
				</div>
			</div>
		</div>
	);
}
