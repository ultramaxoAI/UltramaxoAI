import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Documentation — Chat Completions",
	description: "Panduan endpoint Chat Completions API Ultramaxo. Compatible dengan OpenAI SDK untuk akses GPT-5, Claude, Gemini, dan 40+ model AI.",
	openGraph: { title: "Ultramaxo API — Chat Completions", description: "Endpoint Chat Completions compatible dengan OpenAI SDK.", url: "https://app.ultramaxo.tech/docs/chat-completions" },
};

export default function DocsChatCompletionsPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Chat Completions</h1>
				<p className="apic-subtitle">
					Create chat completions using the OpenAI-compatible endpoint.
				</p>
			</div>

			<div className="apic-prose">
				<h2>Endpoint</h2>
				<pre className="apic-code">POST /v1/chat/completions</pre>

				<h2>Request Body</h2>
				<div className="apic-params">
					<div className="apic-params-row">
						<div className="apic-params-name">
							model<span className="apic-params-required">required</span>
						</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">string</div>
							<div className="apic-params-desc">
								The model ID to use (e.g. &quot;gpt-5.3&quot;). See the Models
								page for available options.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">
							messages<span className="apic-params-required">required</span>
						</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">array</div>
							<div className="apic-params-desc">
								Array of message objects with &quot;role&quot;
								(system/user/assistant) and &quot;content&quot; fields.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">stream</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">boolean · default: false</div>
							<div className="apic-params-desc">
								If true, partial message deltas are sent as SSE events.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">temperature</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">number · 0 to 2</div>
							<div className="apic-params-desc">
								Controls randomness. Lower values are more deterministic.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">max_tokens</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">integer</div>
							<div className="apic-params-desc">
								Maximum number of tokens to generate in the response.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">top_p</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">number · 0 to 1</div>
							<div className="apic-params-desc">
								Nucleus sampling. Alternative to temperature.
							</div>
						</div>
					</div>
				</div>

				<h2>Example Request</h2>
				<pre className="apic-code">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.3",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'`}</pre>

				<h2>Response</h2>
				<pre className="apic-code">{`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-5.3",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses quantum bits..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 156,
    "total_tokens": 180
  }
}`}</pre>

				<h2>Streaming</h2>
				<p>
					Set <code className="apic-code--inline">stream: true</code> to receive
					partial responses as Server-Sent Events (SSE). Each event contains a{" "}
					<code className="apic-code--inline">delta</code> object with
					incremental content.
				</p>
				<pre className="apic-code">{`data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"choices":[{"delta":{"content":" there"},"index":0}]}

data: {"choices":[{"delta":{},"finish_reason":"stop","index":0}],"usage":{"prompt_tokens":12,"completion_tokens":9,"total_tokens":21}}

data: [DONE]`}</pre>

				<div className="apic-note">
					Billing for streaming requests is calculated from the{" "}
					<code className="apic-code--inline">usage</code> object in the final
					SSE chunk. If usage data is missing, tokens are estimated from the
					response content.
				</div>

				<h2>SDK Usage</h2>
				<h3>Python</h3>
				<pre className="apic-code">{`from openai import OpenAI

client = OpenAI(
    api_key="ux_sk_YOUR_KEY",
    base_url="https://api.ultramaxo.tech/v1"
)

response = client.chat.completions.create(
    model="gpt-5.3",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`}</pre>

				<h3>JavaScript / TypeScript</h3>
				<pre className="apic-code">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "ux_sk_YOUR_KEY",
  baseURL: "https://api.ultramaxo.tech/v1",
});

const completion = await client.chat.completions.create({
  model: "gpt-5.3",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(completion.choices[0].message.content);`}</pre>
			</div>
		</div>
	);
}
