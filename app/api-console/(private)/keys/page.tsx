"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ApiKey = {
	id: string;
	name: string;
	key: string;
	status: "active" | "revoked";
	createdAt: string;
};

export default function ApiConsoleKeysPage() {
	const [keys, setKeys] = useState<ApiKey[]>([]);
	const [loading, setLoading] = useState(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Newly created key (full, shown only once)
	const [revealedKey, setRevealedKey] = useState<{
		id: string;
		key: string;
	} | null>(null);

	const loadKeys = useCallback(async () => {
		const res = await fetch("/api/user/keys");
		if (res.ok) setKeys(await res.json());
	}, []);

	useEffect(() => {
		loadKeys();
	}, [loadKeys]);

	const handleCreate = async () => {
		if (!newKeyName.trim()) {
			toast.error("Please enter a name for your API key");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/user/keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newKeyName.trim() }),
			});
			if (!res.ok) throw new Error("Failed");
			const data = await res.json();
			// Show the key only once
			setRevealedKey({ id: data.id, key: data.key });
			setNewKeyName("");
			setShowCreate(false);
			await loadKeys();
			toast.success("API key created — copy it now, it won't be shown again!");
		} catch {
			toast.error("Failed to create API key");
		} finally {
			setLoading(false);
		}
	};

	const handleRevoke = async (id: string) => {
		if (!confirm("Revoke this key? This cannot be undone.")) return;
		const res = await fetch(`/api/user/keys/${id}/revoke`, {
			method: "POST",
		});
		if (res.ok) {
			toast.success("Key revoked");
			if (revealedKey?.id === id) setRevealedKey(null);
			await loadKeys();
		} else {
			toast.error("Failed to revoke");
		}
	};

	const handleCopy = (key: string, id: string) => {
		navigator.clipboard.writeText(key).then(() => {
			setCopiedId(id);
			toast.success("Copied to clipboard");
			setTimeout(() => setCopiedId(null), 2000);
		});
	};

	const maskKey = (k: string) =>
		`${k.slice(0, 8)}${"•".repeat(24)}${k.slice(-4)}`;

	const fmtDate = (d: string) =>
		new Date(d).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	return (
		<div className="apic-stack apic-stack--32">
			<div className="apic-row apic-row--between">
				<div>
					<h1 className="apic-h1">API Keys</h1>
					<p className="apic-subtitle">Create and manage your keys.</p>
				</div>
				<button
					className="apic-btn apic-btn--primary"
					onClick={() => setShowCreate(!showCreate)}
					type="button"
				>
					+ Create Key
				</button>
			</div>

			{/* Revealed key banner */}
			{revealedKey && (
				<div
					className="apic-card"
					style={{
						borderColor: "#22c55e",
						background: "rgba(34, 197, 94, 0.05)",
					}}
				>
					<div className="apic-stack apic-stack--8">
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<span style={{ fontSize: 16 }}>🔑</span>
							<span className="apic-h3" style={{ color: "#22c55e", margin: 0 }}>
								Your new API key
							</span>
						</div>
						<p style={{ fontSize: 12, color: "#f59e0b", margin: 0 }}>
							⚠️ Copy this key now — you won&apos;t be able to see it again!
						</p>
						<div className="apic-row apic-row--8">
							<code
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: 13,
									color: "#22c55e",
									background: "var(--apic-bg)",
									padding: "8px 12px",
									borderRadius: 6,
									flex: 1,
									wordBreak: "break-all",
								}}
							>
								{revealedKey.key}
							</code>
							<button
								type="button"
								className="apic-btn apic-btn--primary"
								onClick={() => handleCopy(revealedKey.key, revealedKey.id)}
								style={{ whiteSpace: "nowrap" }}
							>
								{copiedId === revealedKey.id ? "✓ Copied" : "Copy"}
							</button>
						</div>
						<button
							type="button"
							className="apic-btn apic-btn--sm"
							onClick={() => setRevealedKey(null)}
							style={{ alignSelf: "flex-start", marginTop: 4 }}
						>
							I&apos;ve copied it — dismiss
						</button>
					</div>
				</div>
			)}

			{/* Create form */}
			{showCreate && (
				<div className="apic-card apic-stack apic-stack--12">
					<div className="apic-h3">Create a new key</div>
					<p
						style={{ fontSize: 12, color: "var(--apic-text-muted)", margin: 0 }}
					>
						Give your key a descriptive name so you can identify it later.
					</p>
					<div className="apic-row apic-row--8">
						<input
							className="apic-input"
							placeholder="e.g. production, my-app, testing"
							value={newKeyName}
							onChange={(e) => setNewKeyName(e.target.value)}
							style={{ maxWidth: 320 }}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
							}}
						/>
						<button
							className="apic-btn apic-btn--primary"
							onClick={handleCreate}
							disabled={loading || !newKeyName.trim()}
							type="button"
						>
							{loading ? "Creating..." : "Create"}
						</button>
						<button
							className="apic-btn"
							onClick={() => setShowCreate(false)}
							type="button"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Keys table */}
			<div className="apic-card" style={{ padding: 0 }}>
				<div
					className="apic-row apic-row--between"
					style={{
						padding: "14px 16px",
						borderBottom: "1px solid #1a1a1a",
					}}
				>
					<div>
						<div className="apic-h3">Your Keys</div>
						<p
							style={{
								fontSize: 12,
								color: "var(--apic-text-dim)",
								margin: "2px 0 0",
							}}
						>
							Keys are masked for security. Rotate keys periodically.
						</p>
					</div>
					<button
						className="apic-btn apic-btn--sm"
						onClick={() => loadKeys()}
						type="button"
					>
						↻
					</button>
				</div>
				<table className="apic-table">
					<thead>
						<tr>
							<th style={{ width: 36 }}>#</th>
							<th>Name</th>
							<th>API Key</th>
							<th>Status</th>
							<th>Created</th>
							<th style={{ width: 120 }} />
						</tr>
					</thead>
					<tbody>
						{keys.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									style={{
										textAlign: "center",
										color: "var(--apic-text-dim)",
										padding: 40,
									}}
								>
									No API keys yet. Click &quot;+ Create Key&quot; to get
									started.
								</td>
							</tr>
						) : (
							keys.map((key, i) => (
								<tr key={key.id}>
									<td style={{ color: "var(--apic-text-dim)" }}>{i + 1}</td>
									<td style={{ color: "var(--apic-text)", fontWeight: 500 }}>
										{key.name}
									</td>
									<td>
										<code
											style={{
												fontFamily: "'JetBrains Mono', monospace",
												fontSize: 12,
												color: key.status === "active" ? "#888" : "#555",
											}}
										>
											{maskKey(key.key)}
										</code>
									</td>
									<td>
										<span
											className={`apic-tag ${key.status === "active" ? "apic-tag--green" : "apic-tag--red"}`}
										>
											{key.status}
										</span>
									</td>
									<td style={{ fontSize: 12, color: "var(--apic-text-muted)" }}>
										{fmtDate(key.createdAt)}
									</td>
									<td>
										{key.status === "active" && (
											<button
												className="apic-btn apic-btn--sm apic-btn--danger"
												onClick={() => handleRevoke(key.id)}
												type="button"
											>
												Revoke
											</button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
				{keys.length > 0 && (
					<div
						style={{
							padding: "8px 16px",
							borderTop: "1px solid #111",
							fontSize: 12,
							color: "var(--apic-text-dim)",
						}}
					>
						Showing {keys.length} key{keys.length !== 1 ? "s" : ""} ·{" "}
						{keys.filter((k) => k.status === "active").length} active
					</div>
				)}
			</div>
		</div>
	);
}
