"use client";
import { useDocsContext } from "../docs-context";

export default function DocsSDKsPage() {
	const { lang } = useDocsContext();
	const en = lang === "en";
	return (
		<div className="docs-content">
			<h1 className="docs-h1">{en ? "SDKs & Libraries" : "SDK & Library"}</h1>
			<p className="docs-subtitle">
				{en
					? "Integration guides for popular languages and frameworks."
					: "Panduan integrasi untuk bahasa dan framework populer."}
			</p>

			<h2 className="docs-h2">Python (OpenAI SDK)</h2>
			<pre className="docs-pre">{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.ultramaxo.tech/v1",
    api_key="ux_sk_YOUR_KEY"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}</pre>

			<h2 className="docs-h2">JavaScript / TypeScript</h2>
			<pre className="docs-pre">{`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.ultramaxo.tech/v1",
  apiKey: "ux_sk_YOUR_KEY"
});

const response = await client.chat.completions.create({
  model: "deepseek-v4-flash",
  messages: [{ role: "user", content: "Hello!" }]
});
console.log(response.choices[0].message.content);`}</pre>

			<h2 className="docs-h2">cURL</h2>
			<pre className="docs-pre">{`curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ux_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Hello!"}]}'`}</pre>

			<h2 className="docs-h2">Go</h2>
			<pre className="docs-pre">{`import "github.com/sashabaranov/go-openai"

client := openai.NewClientWithConfig(openai.ClientConfig{
    BaseURL: "https://api.ultramaxo.tech/v1",
    AuthToken: "ux_sk_YOUR_KEY",
})

resp, _ := client.CreateChatCompletion(ctx,
    openai.ChatCompletionRequest{
        Model: "deepseek-v4-flash",
        Messages: []openai.ChatCompletionMessage{
            {Role: "user", Content: "Hello!"},
        },
    },
)`}</pre>

			<h2 className="docs-h2">
				{en ? "Framework Integrations" : "Integrasi Framework"}
			</h2>

			<h3 className="docs-h3">LangChain</h3>
			<pre className="docs-pre">{`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://api.ultramaxo.tech/v1",
    api_key="ux_sk_YOUR_KEY",
    model="deepseek-v4-flash"
)
response = llm.invoke("Hello!")`}</pre>

			<h3 className="docs-h3">Vercel AI SDK</h3>
			<pre className="docs-pre">{`import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const ultramaxo = createOpenAI({
  baseURL: "https://api.ultramaxo.tech/v1",
  apiKey: "ux_sk_YOUR_KEY"
});

const { text } = await generateText({
  model: ultramaxo("deepseek-v4-flash"),
  prompt: "Hello!"
});`}</pre>
		</div>
	);
}
