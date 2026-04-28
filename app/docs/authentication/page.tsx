"use client";
import { useDocsContext } from "../docs-context";

const t = {
	en: {
		title: "Authentication",
		intro:
			"All API requests require authentication via a Bearer token in the Authorization header.",
		headerTitle: "Request Header",
		keyPrefix: "API Key Format",
		keyPrefixDesc:
			"All Ultramaxo API keys start with the prefix ux_sk_ followed by a random string. You can generate keys from the API Console.",
		example: "Example",
		security: "Security Best Practices",
		tips: [
			"Never expose your API key in client-side code or public repositories.",
			"Use environment variables to store your keys.",
			"Rotate keys periodically from the API Console.",
			"Revoke compromised keys immediately.",
		],
	},
	id: {
		title: "Autentikasi",
		intro:
			"Semua request API memerlukan autentikasi melalui Bearer token di header Authorization.",
		headerTitle: "Header Request",
		keyPrefix: "Format API Key",
		keyPrefixDesc:
			"Semua API key Ultramaxo diawali dengan prefix ux_sk_ diikuti string acak. Anda bisa membuat key dari API Console.",
		example: "Contoh",
		security: "Praktik Keamanan Terbaik",
		tips: [
			"Jangan pernah menampilkan API key di kode client-side atau repositori publik.",
			"Gunakan environment variable untuk menyimpan key Anda.",
			"Rotasi key secara berkala dari API Console.",
			"Cabut key yang terkompromi segera.",
		],
	},
};

export default function DocsAuthPage() {
	const { lang } = useDocsContext();
	const c = t[lang];
	return (
		<div className="docs-content">
			<h1 className="docs-h1">{c.title}</h1>
			<p className="docs-subtitle">{c.intro}</p>

			<h2 className="docs-h2">{c.headerTitle}</h2>
			<pre className="docs-pre">Authorization: Bearer ux_sk_YOUR_API_KEY</pre>

			<h2 className="docs-h2">{c.keyPrefix}</h2>
			<p className="docs-p">{c.keyPrefixDesc}</p>
			<pre className="docs-pre">ux_sk_a1b2c3d4e5f6g7h8i9j0...</pre>

			<h2 className="docs-h2">{c.example}</h2>
			<pre className="docs-pre">{`curl https://api.ultramaxo.tech/v1/models \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY"`}</pre>

			<h2 className="docs-h2">{c.security}</h2>
			<ul className="docs-list">
				{c.tips.map((tip) => (
					<li key={tip}>{tip}</li>
				))}
			</ul>
		</div>
	);
}
