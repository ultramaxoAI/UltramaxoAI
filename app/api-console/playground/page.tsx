"use client";

import { useEffect, useRef, useState } from "react";

type Model = {
	modelId: string;
	name: string;
	provider: string;
	isFree: boolean;
};

export default function ApiConsolePlaygroundPage() {
	const [apiKey, setApiKey] = useState("");
	const [model, setModel] = useState("gpt-5.3");
	const [systemPrompt, setSystemPrompt] = useState("");
	const [prompt, setPrompt] = useState("");
	const [temperature, setTemperature] = useState("0.7");
	const [maxTokens, setMaxTokens] = useState("1024");
	const [stream, setStream] = useState(true);
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState("");
	const [models, setModels] = useState<Model[]>([]);
	const [showCode, setShowCode] = useState(false);
	const [codeLanguage, setCodeLanguage] = useState<
		"curl" | "python" | "javascript"
	>("curl");
	const responseRef = useRef<HTMLPreElement>(null);

	useEffect(() => {
		fetch("/api/v1/models")
			.then((r) => r.json())
			.then((d) => setModels(d.data || []))
			.catch(() => {});
	}, []);

	const handleRun = async () => {
		if (!apiKey.trim()) return;
		setLoading(true);
		setResponse("");

		const messages = [];
		if (systemPrompt.trim()) {
			messages.push({ role: "system", content: systemPrompt });
		}
		messages.push({ role: "user", content: prompt || "Hello" });

		const body: Record<string, unknown> = {
			model,
			messages,
		};

		if (temperature) body.temperature = Number(temperature);
		if (maxTokens) body.max_tokens = Number(maxTokens);
		if (stream) body.stream = true;

		try {
			const res = await fetch("/api/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData?.error?.message || JSON.stringify(errData));
			}

			if (stream && res.body) {
				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				let fullText = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (!line.startsWith("data:")) continue;
						const payload = line.replace("data:", "").trim();
						if (payload === "[DONE]") continue;
						try {
							const parsed = JSON.parse(payload);
							const delta = parsed?.choices?.[0]?.delta?.content;
							if (typeof delta === "string") {
								fullText += delta;
								setResponse(fullText);
								if (responseRef.current) {
									responseRef.current.scrollTop =
										responseRef.current.scrollHeight;
								}
							}
						} catch {}
					}
				}
			} else {
				const data = await res.json();
				setResponse(
					data?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2),
				);
			}
		} catch (err) {
			setResponse(err instanceof Error ? err.message : "Request failed");
		} finally {
			setLoading(false);
		}
	};

	const generateCode = () => {
		const messages = [];
		if (systemPrompt.trim()) {
			messages.push({ role: "system", content: systemPrompt });
		}
		messages.push({ role: "user", content: prompt || "Hello" });

		const bodyObj: Record<string, unknown> = { model, messages };
		if (temperature) bodyObj.temperature = Number(temperature);
		if (maxTokens) bodyObj.max_tokens = Number(maxTokens);
		if (stream) bodyObj.stream = true;

		if (codeLanguage === "curl") {
			return `curl https://api.ultramaxo.tech/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey || "ux_sk_YOUR_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(bodyObj, null, 2)}'`;
		}
		if (codeLanguage === "python") {
			return `from openai import OpenAI

client = OpenAI(
    api_key="${apiKey || "ux_sk_YOUR_KEY"}",
    base_url="https://api.ultramaxo.tech/v1"
)

response = client.chat.completions.create(
    model="${model}",
    messages=${JSON.stringify(messages, null, 4)},${temperature ? `\n    temperature=${temperature},` : ""}${maxTokens ? `\n    max_tokens=${maxTokens},` : ""}${stream ? "\n    stream=True," : ""}
)

${
	stream
		? `for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`
		: "print(response.choices[0].message.content)"
}`;
		}
		return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${apiKey || "ux_sk_YOUR_KEY"}",
  baseURL: "https://api.ultramaxo.tech/v1",
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: ${JSON.stringify(messages, null, 2)},${temperature ? `\n  temperature: ${temperature},` : ""}${maxTokens ? `\n  max_tokens: ${maxTokens},` : ""}${stream ? "\n  stream: true," : ""}
});

${
	stream
		? `for await (const chunk of response) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`
		: "console.log(response.choices[0].message.content);"
}`;
	};

	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Playground</h1>
				<p className="apic-subtitle">
					Test API requests interactively with streaming support.
				</p>
			</div>

			<div className="apic-grid apic-grid--2">
				<div className="apic-card apic-stack apic-stack--16">
					<div className="apic-stack apic-stack--8">
						<label htmlFor="pg-api-key" className="apic-stat-label">
							API Key
						</label>
						<input
							id="pg-api-key"
							className="apic-input"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							placeholder="ux_sk_..."
							type="password"
						/>
					</div>
					<div className="apic-stack apic-stack--8">
						<label htmlFor="pg-model" className="apic-stat-label">
							Model
						</label>
						<select
							id="pg-model"
							className="apic-input apic-select"
							value={model}
							onChange={(e) => setModel(e.target.value)}
						>
							{models.length > 0 ? (
								models.map((m) => (
									<option key={m.modelId} value={m.modelId}>
										{m.name} ({m.provider}) {m.isFree ? "— Free" : ""}
									</option>
								))
							) : (
								<option value="gpt-5.3">gpt-5.3 (Free)</option>
							)}
						</select>
					</div>
					<div className="apic-stack apic-stack--8">
						<label htmlFor="pg-system" className="apic-stat-label">
							System Prompt (optional)
						</label>
						<textarea
							id="pg-system"
							className="apic-input"
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							placeholder="You are a helpful assistant."
							rows={2}
							style={{ resize: "vertical" }}
						/>
					</div>
					<div className="apic-stack apic-stack--8">
						<label htmlFor="pg-prompt" className="apic-stat-label">
							User Message
						</label>
						<textarea
							id="pg-prompt"
							className="apic-input"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Type your message..."
							rows={5}
							style={{ resize: "vertical" }}
						/>
					</div>

					<div className="apic-row apic-row--12 apic-row--wrap">
						<div
							className="apic-stack apic-stack--8"
							style={{ flex: 1, minWidth: 80 }}
						>
							<label htmlFor="pg-temp" className="apic-stat-label">
								Temperature
							</label>
							<input
								id="pg-temp"
								className="apic-input"
								value={temperature}
								onChange={(e) => setTemperature(e.target.value)}
								type="number"
								min="0"
								max="2"
								step="0.1"
							/>
						</div>
						<div
							className="apic-stack apic-stack--8"
							style={{ flex: 1, minWidth: 80 }}
						>
							<label htmlFor="pg-max-tokens" className="apic-stat-label">
								Max Tokens
							</label>
							<input
								id="pg-max-tokens"
								className="apic-input"
								value={maxTokens}
								onChange={(e) => setMaxTokens(e.target.value)}
								type="number"
								min="1"
								max="32000"
								step="128"
							/>
						</div>
						<div
							className="apic-stack apic-stack--8"
							style={{ flex: 1, minWidth: 80 }}
						>
							<label htmlFor="pg-stream" className="apic-stat-label">
								Stream
							</label>
							<button
								id="pg-stream"
								type="button"
								className={`apic-btn apic-btn--sm ${stream ? "apic-btn--primary" : ""}`}
								onClick={() => setStream(!stream)}
								style={{ width: "100%" }}
							>
								{stream ? "ON" : "OFF"}
							</button>
						</div>
					</div>

					<div className="apic-row apic-row--8">
						<button
							className="apic-btn apic-btn--primary"
							onClick={handleRun}
							disabled={loading || !apiKey.trim()}
							type="button"
							style={{ flex: 1 }}
						>
							{loading ? "Running..." : "▶ Send Request"}
						</button>
						<button
							className="apic-btn"
							onClick={() => setShowCode(!showCode)}
							type="button"
						>
							{showCode ? "Hide Code" : "<> Code"}
						</button>
					</div>
				</div>

				<div className="apic-stack apic-stack--12">
					<div
						className="apic-card apic-stack apic-stack--12"
						style={{ flex: 1 }}
					>
						<div className="apic-row apic-row--between">
							<div className="apic-h3">Response</div>
							{loading && (
								<div className="apic-row apic-row--8">
									<span className="apic-pulse" />
									<span style={{ fontSize: 12, color: "#818cf8" }}>
										Streaming...
									</span>
								</div>
							)}
						</div>
						<pre
							ref={responseRef}
							className="apic-code"
							style={{ minHeight: 300, maxHeight: 500, overflow: "auto" }}
						>
							{response || "Response will appear here..."}
						</pre>
					</div>

					{showCode && (
						<div className="apic-card apic-stack apic-stack--12">
							<div className="apic-row apic-row--between">
								<div className="apic-h3">Generated Code</div>
								<div className="apic-row apic-row--8">
									{(["curl", "python", "javascript"] as const).map((lang) => (
										<button
											key={lang}
											type="button"
											className={`apic-btn apic-btn--sm ${codeLanguage === lang ? "apic-btn--primary" : ""}`}
											onClick={() => setCodeLanguage(lang)}
										>
											{lang === "javascript"
												? "JS/TS"
												: lang.charAt(0).toUpperCase() + lang.slice(1)}
										</button>
									))}
								</div>
							</div>
							<pre
								className="apic-code"
								style={{ maxHeight: 300, overflow: "auto" }}
							>
								{generateCode()}
							</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
