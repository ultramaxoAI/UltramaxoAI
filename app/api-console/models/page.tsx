"use client";

import { useCallback, useEffect, useState } from "react";

type CatalogModel = {
	modelId: string;
	name: string;
	provider: string;
	context: string;
	isFree: boolean;
	priceIn: string | null;
	priceOut: string | null;
	capabilities: string[];
};

export default function ApiConsoleModelsPage() {
	const [models, setModels] = useState<CatalogModel[]>([]);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/v1/models?limit=200");
			if (!res.ok) return;
			const data = await res.json();
			if (Array.isArray(data?.data)) setModels(data.data);
		} finally {
			setLoaded(true);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleCopy = (id: string) => {
		navigator.clipboard.writeText(id).then(() => {
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		});
	};

	const filtered = models.filter((m) => {
		const q = search.toLowerCase();
		const matchesSearch =
			!q ||
			m.modelId.toLowerCase().includes(q) ||
			m.name.toLowerCase().includes(q) ||
			m.provider.toLowerCase().includes(q);
		const matchesFilter =
			filter === "all" ||
			(filter === "free" && m.isFree) ||
			(filter === "paid" && !m.isFree);
		return matchesSearch && matchesFilter;
	});

	const freeCount = models.filter((m) => m.isFree).length;
	const paidCount = models.filter((m) => !m.isFree).length;

	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Models</h1>
				<p className="apic-subtitle">
					Browse all available models. Use the model ID in your API requests.
				</p>
			</div>

			{/* Stats */}
			<div className="apic-grid apic-grid--3">
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Total Models</div>
					<div className="apic-stat-value" style={{ marginTop: 4 }}>
						{models.length}
					</div>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Free Models</div>
					<div
						className="apic-stat-value apic-stat-value--sm"
						style={{ marginTop: 4, color: "#4ade80" }}
					>
						{freeCount}
					</div>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Paid Models</div>
					<div
						className="apic-stat-value apic-stat-value--sm"
						style={{ marginTop: 4 }}
					>
						{paidCount}
					</div>
				</div>
			</div>

			{/* Search & Filter */}
			<div className="apic-card">
				<div className="apic-row apic-row--8 apic-row--wrap">
					<input
						className="apic-input"
						placeholder="Search models by name, ID, or provider..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{ flex: 1, minWidth: 200 }}
					/>
					<div className="apic-row apic-row--4">
						{(["all", "free", "paid"] as const).map((f) => (
							<button
								key={f}
								type="button"
								className={`apic-btn apic-btn--sm ${filter === f ? "apic-btn--primary" : ""}`}
								onClick={() => setFilter(f)}
							>
								{f === "all" ? "All" : f === "free" ? "Free" : "Paid"}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Models Table */}
			<div className="apic-card" style={{ padding: 0 }}>
				<table className="apic-table">
					<thead>
						<tr>
							<th>Model Name</th>
							<th>Model ID</th>
							<th>Provider</th>
							<th>Context</th>
							<th>Pricing (per 1M tokens)</th>
						</tr>
					</thead>
					<tbody>
						{filtered.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									style={{
										textAlign: "center",
										color: "var(--apic-text-dim)",
										padding: 40,
									}}
								>
									{!loaded
										? "Loading models..."
										: models.length === 0
											? "No models in catalog. Try refreshing."
											: "No models match your search."}
								</td>
							</tr>
						) : (
							filtered.map((m) => (
								<tr key={m.modelId}>
									<td>
										<div
											style={{
												color: "var(--apic-text)",
												fontWeight: 500,
												fontSize: 13,
											}}
										>
											{m.name}
										</div>
										<div
											className="apic-row apic-row--4"
											style={{ marginTop: 4 }}
										>
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
										<div className="apic-row apic-row--8">
											<code
												style={{
													fontFamily: "'JetBrains Mono', monospace",
													fontSize: 12,
													color: "#a5f3fc",
													background: "var(--apic-bg)",
													padding: "2px 8px",
													borderRadius: 4,
												}}
											>
												{m.modelId}
											</code>
											<button
												type="button"
												className="apic-btn apic-btn--sm"
												onClick={() => handleCopy(m.modelId)}
												style={{
													padding: "2px 8px",
													fontSize: 11,
												}}
											>
												{copiedId === m.modelId ? "✓" : "Copy"}
											</button>
										</div>
									</td>
									<td style={{ fontSize: 13, color: "var(--apic-text-muted)" }}>{m.provider}</td>
									<td style={{ fontSize: 13, color: "var(--apic-text-muted)" }}>
										{m.context ? Number(m.context).toLocaleString() : "—"}
									</td>
									<td>
										{m.isFree ? (
											<span className="apic-tag apic-tag--green">Free</span>
										) : m.priceIn || m.priceOut ? (
											<span
												style={{
													fontSize: 12,
													color: "var(--apic-text-muted)",
													fontFamily: "monospace",
												}}
											>
												${Number(m.priceIn || 0).toFixed(2)} / ${Number(m.priceOut || 0).toFixed(2)}
											</span>
										) : (
											<span style={{ fontSize: 12, color: "var(--apic-text-dim)" }}>—</span>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
				{filtered.length > 0 && (
					<div
						style={{
							padding: "8px 16px",
							borderTop: "1px solid #111",
							fontSize: 12,
							color: "var(--apic-text-dim)",
						}}
					>
						Showing {filtered.length} of {models.length} models
					</div>
				)}
			</div>
		</div>
	);
}
