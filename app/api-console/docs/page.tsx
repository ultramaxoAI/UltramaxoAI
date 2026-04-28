import Link from "next/link";

export default function DocsIntroPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Introduction</h1>
				<p className="apic-subtitle">
					The Ultramaxo API provides OpenAI-compatible endpoints for chat
					completions, model listing, and more.
				</p>
			</div>

			<div className="apic-prose">
				<h2>Overview</h2>
				<p>
					Ultramaxo API is a pay-as-you-go API service that routes requests
					through <strong>SwiftRouter</strong> to a wide range of language
					models. It uses the same request/response format as the OpenAI API, so
					any OpenAI-compatible SDK or client will work out of the box.
				</p>

				<h2>Base URL</h2>
				<pre className="apic-code">https://api.ultramaxo.tech/v1</pre>

				<h2>Quick Start</h2>
				<p>Get up and running in under a minute:</p>

				<h3>1. Create an API Key</h3>
				<p>
					Go to{" "}
					<Link href="/api-console/keys" style={{ color: "#818cf8" }}>
						API Keys
					</Link>{" "}
					and click &quot;Create Key&quot;. Your key will start with{" "}
					<code className="apic-code--inline">ux_sk_</code>.
				</p>

				<h3>2. Top Up Your Balance</h3>
				<p>
					Paid models require a minimum balance of <strong>$2 USD</strong>. Free
					models (like GPT-5.3) work without any balance. Visit{" "}
					<Link href="/api-console/billing" style={{ color: "#818cf8" }}>
						Billing
					</Link>{" "}
					to add funds via QRIS.
				</p>

				<h3>3. Make Your First Request</h3>
				<pre className="apic-code">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.3",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}</pre>

				<h2>Available Endpoints</h2>
				<table className="apic-table">
					<thead>
						<tr>
							<th>Method</th>
							<th>Endpoint</th>
							<th>Description</th>
							<th>Auth</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<span className="apic-tag apic-tag--green">POST</span>
							</td>
							<td>
								<code className="apic-code--inline">/v1/chat/completions</code>
							</td>
							<td>Create a chat completion</td>
							<td>Required</td>
						</tr>
						<tr>
							<td>
								<span className="apic-tag apic-tag--blue">GET</span>
							</td>
							<td>
								<code className="apic-code--inline">/v1/models</code>
							</td>
							<td>List all available models</td>
							<td>Optional</td>
						</tr>
						<tr>
							<td>
								<span className="apic-tag apic-tag--blue">GET</span>
							</td>
							<td>
								<code className="apic-code--inline">/v1/models/:id</code>
							</td>
							<td>Get single model details</td>
							<td>Optional</td>
						</tr>
						<tr>
							<td>
								<span className="apic-tag apic-tag--blue">GET</span>
							</td>
							<td>
								<code className="apic-code--inline">/v1/balance</code>
							</td>
							<td>Check your credit balance</td>
							<td>Required</td>
						</tr>
						<tr>
							<td>
								<span className="apic-tag apic-tag--blue">GET</span>
							</td>
							<td>
								<code className="apic-code--inline">/v1/usage</code>
							</td>
							<td>Query usage history</td>
							<td>Required</td>
						</tr>
					</tbody>
				</table>

				<h2>Features</h2>
				<ul>
					<li>
						<strong>OpenAI-compatible</strong> — drop-in replacement for any
						OpenAI SDK.
					</li>
					<li>
						<strong>Pay-as-you-go</strong> — billed per token with no monthly
						minimums.
					</li>
					<li>
						<strong>Streaming</strong> — full SSE streaming support for
						real-time responses.
					</li>
					<li>
						<strong>Multiple models</strong> — access various LLMs through a
						single endpoint.
					</li>
					<li>
						<strong>Free tier</strong> — GPT-5.3 is available at no cost.
					</li>
					<li>
						<strong>Balance & usage APIs</strong> — check balance and query
						usage programmatically.
					</li>
				</ul>

				<h2>Next Steps</h2>
				<ul>
					<li>
						<Link href="/api-console/docs/authentication">Authentication</Link>{" "}
						— learn how API keys work.
					</li>
					<li>
						<Link href="/api-console/docs/chat-completions">
							Chat Completions
						</Link>{" "}
						— full endpoint reference.
					</li>
					<li>
						<Link href="/api-console/docs/models">Models</Link> — see available
						models and pricing.
					</li>
					<li>
						<Link href="/api-console/docs/sdks">SDKs & Libraries</Link> —
						integration guides for Python, JS, Go, PHP & more.
					</li>
					<li>
						<Link href="/api-console/docs/billing">Billing & Limits</Link> —
						understand rate limits and costs.
					</li>
					<li>
						<Link href="/api-console/docs/errors">Error Reference</Link> —
						handle errors gracefully.
					</li>
				</ul>
			</div>
		</div>
	);
}
