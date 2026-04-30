import type { Metadata } from "next";

const DEFAULT_FREE_MODEL_ID = "gpt-5.3-codex";

export const metadata: Metadata = {
	title: "API Documentation — SDKs & Libraries",
	description: "SDK dan library untuk integrasi Ultramaxo API. Contoh kode Python, Node.js, Go, cURL dan OpenAI-compatible SDK.",
	openGraph: { title: "Ultramaxo API — SDKs & Libraries", description: "SDK dan contoh kode integrasi API.", url: "https://app.ultramaxo.tech/docs/sdks" },
};

import Link from "next/link";

export default function DocsSDKsPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">SDKs &amp; Libraries</h1>
				<p className="apic-subtitle">
					Integrate the Ultramaxo API using your preferred language and
					framework.
				</p>
			</div>

			<div className="apic-prose">
				<h2>Compatibility</h2>
				<p>
					Ultramaxo API is fully <strong>OpenAI-compatible</strong>. Any SDK,
					library, or tool that works with the OpenAI API will work with
					Ultramaxo by changing two values:
				</p>
				<ul>
					<li>
						<strong>Base URL</strong> →{" "}
						<code className="apic-code--inline">
							https://api.ultramaxo.tech/v1
						</code>
					</li>
					<li>
						<strong>API Key</strong> → your{" "}
						<code className="apic-code--inline">ux_sk_...</code> key
					</li>
				</ul>

				<h2>Python</h2>
				<h3>OpenAI SDK</h3>
				<pre className="apic-code">{`pip install openai`}</pre>
				<pre className="apic-code">{`from openai import OpenAI

client = OpenAI(
    api_key="ux_sk_YOUR_KEY",
    base_url="https://api.ultramaxo.tech/v1"
)

# Non-streaming
response = client.chat.completions.create(
    model="${DEFAULT_FREE_MODEL_ID}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing."}
    ],
    temperature=0.7,
    max_tokens=1024
)
print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model="${DEFAULT_FREE_MODEL_ID}",
    messages=[{"role": "user", "content": "Write a poem about AI."}],
    stream=True
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`}</pre>

				<h3>Requests (HTTP)</h3>
				<pre className="apic-code">{`import requests

response = requests.post(
    "https://api.ultramaxo.tech/v1/chat/completions",
    headers={
        "Authorization": "Bearer ux_sk_YOUR_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "${DEFAULT_FREE_MODEL_ID}",
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)

data = response.json()
print(data["choices"][0]["message"]["content"])`}</pre>

				<h2>JavaScript / TypeScript</h2>
				<h3>OpenAI SDK</h3>
				<pre className="apic-code">{`npm install openai`}</pre>
				<pre className="apic-code">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "ux_sk_YOUR_KEY",
  baseURL: "https://api.ultramaxo.tech/v1",
});

// Non-streaming
const response = await client.chat.completions.create({
  model: "${DEFAULT_FREE_MODEL_ID}",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);

// Streaming
const stream = await client.chat.completions.create({
  model: "${DEFAULT_FREE_MODEL_ID}",
  messages: [{ role: "user", content: "Tell me a story." }],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`}</pre>

				<h3>Fetch API (Browser / Node.js)</h3>
				<pre className="apic-code">{`const response = await fetch("https://api.ultramaxo.tech/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ux_sk_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${DEFAULT_FREE_MODEL_ID}",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);`}</pre>

				<h2>cURL</h2>
				<h3>Basic Request</h3>
				<pre className="apic-code">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${DEFAULT_FREE_MODEL_ID}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>

				<h3>Streaming</h3>
				<pre className="apic-code">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  --no-buffer \\
  -d '{
    "model": "${DEFAULT_FREE_MODEL_ID}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`}</pre>

				<h2>Go</h2>
				<pre className="apic-code">{`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    body := map[string]interface{}{
        "model": "${DEFAULT_FREE_MODEL_ID}",
        "messages": []map[string]string{
            {"role": "user", "content": "Hello!"},
        },
    }
    jsonBody, _ := json.Marshal(body)

    req, _ := http.NewRequest("POST",
        "https://api.ultramaxo.tech/v1/chat/completions",
        bytes.NewBuffer(jsonBody))
    req.Header.Set("Authorization", "Bearer ux_sk_YOUR_KEY")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    result, _ := io.ReadAll(resp.Body)
    fmt.Println(string(result))
}`}</pre>

				<h2>PHP</h2>
				<pre className="apic-code">{`<?php

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.ultramaxo.tech/v1/chat/completions",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ux_sk_YOUR_KEY",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "model" => "${DEFAULT_FREE_MODEL_ID}",
        "messages" => [
            ["role" => "user", "content" => "Hello!"]
        ]
    ])
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo $data["choices"][0]["message"]["content"];`}</pre>

				<h2>Additional Endpoints</h2>
				<h3>List Models</h3>
				<pre className="apic-code">{`# No authentication required
curl https://api.ultramaxo.tech/v1/models

# Filter by capability
curl "https://api.ultramaxo.tech/v1/models?capability=text&free=true"

# Get specific model
curl https://api.ultramaxo.tech/v1/models/${DEFAULT_FREE_MODEL_ID}`}</pre>

				<h3>Check Balance</h3>
				<pre className="apic-code">{`curl https://api.ultramaxo.tech/v1/balance \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY"`}</pre>

				<h3>Query Usage</h3>
				<pre className="apic-code">{`# Last 30 days
curl https://api.ultramaxo.tech/v1/usage \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY"

# Last 7 days, max 20 entries
curl "https://api.ultramaxo.tech/v1/usage?days=7&limit=20" \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY"`}</pre>

				<h2>Framework Integrations</h2>
				<p>
					Since Ultramaxo is OpenAI-compatible, it works out of the box with:
				</p>
				<ul>
					<li>
						<strong>LangChain</strong> — set{" "}
						<code className="apic-code--inline">base_url</code> in ChatOpenAI
					</li>
					<li>
						<strong>LlamaIndex</strong> — configure the OpenAI LLM with custom
						base URL
					</li>
					<li>
						<strong>Vercel AI SDK</strong> — use{" "}
						<code className="apic-code--inline">createOpenAI</code> with baseURL
						override
					</li>
					<li>
						<strong>AutoGen</strong> — set{" "}
						<code className="apic-code--inline">base_url</code> in config list
					</li>
					<li>
						<strong>CrewAI</strong> — configure OpenAI-compatible LLM provider
					</li>
				</ul>

				<h3>Vercel AI SDK Example</h3>
				<pre className="apic-code">{`import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const ultramaxo = createOpenAI({
  apiKey: "ux_sk_YOUR_KEY",
  baseURL: "https://api.ultramaxo.tech/v1",
});

const { text } = await generateText({
  model: ultramaxo("${DEFAULT_FREE_MODEL_ID}"),
  prompt: "Explain the theory of relativity.",
});

console.log(text);`}</pre>

				<h3>LangChain Example</h3>
				<pre className="apic-code">{`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="${DEFAULT_FREE_MODEL_ID}",
    openai_api_key="ux_sk_YOUR_KEY",
    openai_api_base="https://api.ultramaxo.tech/v1",
)

response = llm.invoke("What is machine learning?")
print(response.content)`}</pre>

				<div className="apic-note">
					Need help with a specific language or framework?{" "}
					<Link href="/contact" style={{ color: "#818cf8" }}>
						Contact us
					</Link>{" "}
					and we&apos;ll add it to the documentation.
				</div>
			</div>
		</div>
	);
}
