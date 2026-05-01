"use client";

import { useEffect, useState } from "react";

type Model = {
	modelId: string;
	name: string;
	provider: string;
	context: string | null;
	priceIn: string | null;
	priceOut: string | null;
	isFree: boolean;
	capabilities: string[];
};

export default function DocsModelsPage() {
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/v1/models")
			.then((r) => r.json())
			.then((d) => setModels(d.data || []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Models</h1>
				<p className="apic-subtitle">
					Available models and their pricing, context limits, and capabilities.
				</p>
			</div>

			<div className="apic-prose">
				<h2>List Models Endpoint</h2>
				<pre className="apic-code">GET /v1/models</pre>
				<p>Returns all available models. No authentication required.</p>

				<h3>Query Parameters</h3>
				<div className="apic-params">
					<div className="apic-params-row">
						<div className="apic-params-name">capability</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">string</div>
							<div className="apic-params-desc">
								Filter by capability (e.g. &quot;text&quot;, &quot;image&quot;,
								&quot;code&quot;).
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">provider</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">string</div>
							<div className="apic-params-desc">Filter by provider name.</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">free</div>
						<div className="apic-params-meta">
							<div className="apic-params-type">boolean</div>
							<div className="apic-params-desc">
								If &quot;true&quot;, only return free models.
							</div>
						</div>
					</div>
				</div>

				<h3>Get Single Model</h3>
				<pre className="apic-code">{`GET /v1/models/{model_id}`}</pre>
				<p>Returns details for a specific model by its ID.</p>

				<h2>Pricing</h2>
				<p>
					All prices are in <strong>USD per 1 million tokens</strong>. Free
					models have no cost. Paid models require a minimum balance of $2 USD.
				</p>

				<div className="apic-note apic-note--warn">
					Prices are synced from SwiftRouter and may change. Use the{" "}
					<code className="apic-code--inline">GET /v1/models</code> endpoint for
					the latest pricing.
				</div>
			</div>

			<div>
				<h2 className="apic-h2" style={{ marginBottom: 16 }}>
					Available Models
				</h2>

				{loading ? (
					<p style={{ color: "var(--apic-text-dim)", fontSize: 13 }}>
						Loading models...
					</p>
				) : models.length === 0 ? (
					<div className="apic-card">
						<p style={{ color: "var(--apic-text-dim)", fontSize: 13 }}>
							No models in the catalog yet. An admin needs to trigger a model
							sync via{" "}
							<code className="apic-code--inline">
								POST /api/admin/models/refresh
							</code>
							.
						</p>
					</div>
				) : (
					<div className="apic-card" style={{ padding: 0 }}>
						<table className="apic-table">
							<thead>
								<tr>
									<th>Model ID</th>
									<th>Provider</th>
									<th>Capabilities</th>
									<th>Context</th>
									<th>Input Price</th>
									<th>Output Price</th>
									<th>Tier</th>
								</tr>
							</thead>
							<tbody>
								{models.map((m) => (
									<tr key={m.modelId}>
										<td
											style={{
												fontFamily: "monospace",
												fontSize: 12,
												color: "var(--apic-text)",
											}}
										>
											{m.modelId}
										</td>
										<td>{m.provider}</td>
										<td>
											<div className="apic-row apic-row--4">
												{m.capabilities?.map((cap) => (
													<span
														key={cap}
														style={{
															fontSize: 10,
															padding: "1px 6px",
															borderRadius: 4,
															border: "1px solid #222",
															color: "var(--apic-text-muted)",
															textTransform: "uppercase",
															letterSpacing: "0.05em",
														}}
													>
														{cap}
													</span>
												))}
											</div>
										</td>
										<td>
											{m.context
												? `${Number(m.context).toLocaleString()}`
												: "—"}
										</td>
										<td>
											{m.isFree
												? "Free"
												: m.priceIn
													? `$${Number(m.priceIn).toFixed(2)}`
													: "—"}
										</td>
										<td>
											{m.isFree
												? "Free"
												: m.priceOut
													? `$${Number(m.priceOut).toFixed(2)}`
													: "—"}
										</td>
										<td>
											<span
												className={`apic-tag ${m.isFree ? "apic-tag--green" : "apic-tag--amber"}`}
											>
												{m.isFree ? "free" : "paid"}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
