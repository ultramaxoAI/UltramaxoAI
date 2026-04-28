"use client";
import { useCallback, useEffect, useState } from "react";
import { useDocsContext } from "../docs-context";

type Model = {
	modelId: string;
	name: string;
	provider: string;
	context: string;
	isFree: boolean;
	priceIn: string | null;
	priceOut: string | null;
	capabilities: string[];
};

export default function DocsModelsPage() {
	const { lang } = useDocsContext();
	const [models, setModels] = useState<Model[]>([]);
	const [search, setSearch] = useState("");
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

	const filtered = models.filter((m) => {
		const q = search.toLowerCase();
		return (
			!q ||
			m.modelId.toLowerCase().includes(q) ||
			m.name.toLowerCase().includes(q) ||
			m.provider.toLowerCase().includes(q)
		);
	});

	const title = lang === "en" ? "Models" : "Model";
	const subtitle =
		lang === "en"
			? "All available models and their IDs. Use the model ID in your API requests."
			: "Semua model yang tersedia dan ID-nya. Gunakan model ID di request API Anda.";

	const emptyMsg = !loaded
		? lang === "en"
			? "Loading models..."
			: "Memuat model..."
		: models.length === 0
			? lang === "en"
				? "No models available. The catalog may be refreshing — try again shortly."
				: "Tidak ada model tersedia. Katalog mungkin sedang di-refresh — coba lagi nanti."
			: lang === "en"
				? "No results"
				: "Tidak ada hasil";

	return (
		<div className="docs-content">
			<h1 className="docs-h1">{title}</h1>
			<p className="docs-subtitle">{subtitle}</p>

			<div className="docs-card" style={{ marginBottom: 16 }}>
				<input
					className="docs-input"
					placeholder={lang === "en" ? "Search models..." : "Cari model..."}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<table className="docs-table">
				<thead>
					<tr>
						<th>Model ID</th>
						<th>{lang === "en" ? "Name" : "Nama"}</th>
						<th>Provider</th>
						<th>Context</th>
						<th>{lang === "en" ? "Price (per 1M)" : "Harga (per 1M)"}</th>
					</tr>
				</thead>
				<tbody>
					{filtered.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								style={{ textAlign: "center", padding: 32, opacity: 0.5 }}
							>
								{emptyMsg}
							</td>
						</tr>
					) : (
						filtered.map((m) => (
							<tr key={m.modelId}>
								<td>
									<code className="docs-code-inline">{m.modelId}</code>
								</td>
								<td>{m.name}</td>
								<td>{m.provider}</td>
								<td>{m.context || "—"}</td>
								<td>
									{m.isFree ? (
										<span className="docs-tag docs-tag--green">Free</span>
									) : (
										<span style={{ fontFamily: "monospace", fontSize: 12 }}>
											${m.priceIn || "?"} / ${m.priceOut || "?"}
										</span>
									)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
			{filtered.length > 0 && (
				<p className="docs-p" style={{ fontSize: 12, opacity: 0.5 }}>
					{lang === "en"
						? `Showing ${filtered.length} of ${models.length} models`
						: `Menampilkan ${filtered.length} dari ${models.length} model`}
				</p>
			)}
		</div>
	);
}
