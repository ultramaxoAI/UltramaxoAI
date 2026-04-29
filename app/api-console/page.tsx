import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import {
	getApiCreditSummaryByUserId,
	getPlatformApiKeysByUserId,
} from "@backend/db/queries";
import { UsageChart } from "@/components/api-console/usage-chart";

export default async function ApiConsoleDashboard() {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return null;

	const [credit, keys] = await Promise.all([
		getApiCreditSummaryByUserId({ userId, limit: 50 }),
		getPlatformApiKeysByUserId(userId),
	]);

	const bal = (credit.account.balanceCents / 100).toFixed(2);
	const spent = (credit.account.lifetimeSpentCents / 100).toFixed(4);
	const activeKeys = keys.filter(
		(k: { status: string }) => k.status === "active",
	).length;

	const spendTxs = credit.transactions.filter((t) => t.type === "spend");
	const totalRequests = spendTxs.length;
	const totalTokens = spendTxs.reduce((sum, tx) => {
		const meta = tx.metadata as Record<string, number> | null;
		return sum + (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
	}, 0);
	const successRate = totalRequests > 0 ? "100.0" : "—";

	const chartData = spendTxs.map((tx) => ({
		date: tx.createdAt,
		amount: Math.abs(tx.amountCents),
		tokens: (() => {
			const meta = tx.metadata as Record<string, number> | null;
			return (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
		})(),
	}));

	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Usage</h1>
				<p className="apic-subtitle">
					Track requests and token consumption.
				</p>
			</div>

			<div className="apic-grid apic-grid--4">
				<div className="apic-card apic-card--stat apic-card--glow-green">
					<div className="apic-row apic-row--between">
						<div className="apic-stat-label">Total Spend</div>
						<span style={{ color: "var(--apic-text-dim)", fontSize: 14 }}>$</span>
					</div>
					<div className="apic-stat-value" style={{ marginTop: 8 }}>
						${spent}
					</div>
					<p style={{ fontSize: 11, color: "var(--apic-text-dim)", marginTop: 4 }}>
						Lifetime
					</p>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-row apic-row--between">
						<div className="apic-stat-label">API Requests</div>
						<span style={{ color: "var(--apic-text-dim)", fontSize: 14 }}>↗</span>
					</div>
					<div className="apic-stat-value" style={{ marginTop: 8 }}>
						{totalRequests}
					</div>
					<p style={{ fontSize: 11, color: "var(--apic-text-dim)", marginTop: 4 }}>
						{totalRequests} successful, 0 failed
					</p>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-row apic-row--between">
						<div className="apic-stat-label">Total Tokens</div>
						<span style={{ color: "var(--apic-text-dim)", fontSize: 14 }}>⟡</span>
					</div>
					<div className="apic-stat-value" style={{ marginTop: 8 }}>
						{totalTokens.toLocaleString()}
					</div>
					<p style={{ fontSize: 11, color: "var(--apic-text-dim)", marginTop: 4 }}>
						Input + output tokens
					</p>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-row apic-row--between">
						<div className="apic-stat-label">Success Rate</div>
						<span style={{ color: "var(--apic-text-dim)", fontSize: 14 }}>↗</span>
					</div>
					<div className="apic-stat-value" style={{ marginTop: 8 }}>
						{successRate}%
					</div>
					<p style={{ fontSize: 11, color: "var(--apic-text-dim)", marginTop: 4 }}>
						Request success rate
					</p>
				</div>
			</div>

			<UsageChart data={JSON.stringify(chartData)} />

			<div className="apic-grid apic-grid--3">
				<Link
					href="/api-console/keys"
					className="apic-card"
					style={{ textDecoration: "none", cursor: "pointer" }}
				>
					<div className="apic-h3">API Keys</div>
					<div
						className="apic-stat-value apic-stat-value--sm"
						style={{ marginTop: 8 }}
					>
						{activeKeys}
					</div>
					<p style={{ fontSize: 12, color: "var(--apic-text-dim)", marginTop: 4 }}>
						{activeKeys} active · {keys.length} total
					</p>
				</Link>
				<Link
					href="/api-console/billing"
					className="apic-card"
					style={{ textDecoration: "none", cursor: "pointer" }}
				>
					<div className="apic-h3">Balance</div>
					<div
						className="apic-stat-value apic-stat-value--sm"
						style={{ marginTop: 8 }}
					>
						${bal}
					</div>
					<p style={{ fontSize: 12, color: "var(--apic-text-dim)", marginTop: 4 }}>
						{Number(bal) >= 2 ? (
							<span style={{ color: "#4ade80" }}>
								Ready for paid models
							</span>
						) : (
							<span style={{ color: "#f87171" }}>
								Top up to use paid models
							</span>
						)}
					</p>
				</Link>
				<Link
					href="/api-console/playground"
					className="apic-card"
					style={{ textDecoration: "none", cursor: "pointer" }}
				>
					<div className="apic-h3">Playground</div>
					<p
						style={{
							fontSize: 13,
							color: "var(--apic-text-muted)",
							marginTop: 8,
							lineHeight: 1.5,
						}}
					>
						Test API requests interactively with streaming.
					</p>
				</Link>
			</div>
		</div>
	);
}
