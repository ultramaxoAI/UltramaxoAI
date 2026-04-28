"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type CreditSummary = {
	account: {
		balanceCents: number;
		lifetimeGrantedCents: number;
		lifetimeSpentCents: number;
	};
	transactions: Array<{
		id: string;
		amountCents: number;
		balanceAfterCents: number;
		type: string;
		reason: string;
		createdAt: string;
	}>;
};

type PaymentOrder = {
	id: string;
	status: string;
	amountIdr: number;
	amountUsd: number;
	method: string;
	trxId: string | null;
	createdAt: string;
	updatedAt: string;
};

export function BillingPanel() {
	const router = useRouter();
	const [summary, setSummary] = useState<CreditSummary | null>(null);
	const [orders, setOrders] = useState<PaymentOrder[]>([]);
	const [amount, setAmount] = useState("2");
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		const [credRes, ordRes] = await Promise.all([
			fetch("/api/user/api-credits"),
			fetch("/api/payment/history"),
		]);
		if (credRes.ok) {
			const data: CreditSummary = await credRes.json();
			setSummary(data);
		}
		if (ordRes.ok) {
			const data = await ordRes.json();
			if (Array.isArray(data?.orders)) setOrders(data.orders);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleTopup = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/payment/create-api-topup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amountUsd: Number(amount) }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || "Failed");

			if (data.fallback || !data.success) {
				toast.error(
					data.error || "Payment gateway unavailable. Try again later.",
				);
				return;
			}

			// Redirect to dedicated payment page
			router.push(`/api-console/pay/${data.requestId}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Top-up failed");
		} finally {
			setLoading(false);
		}
	};

	const fmt = (c: number) => (c / 100).toFixed(2);

	const statusBadge = (status: string) => {
		const colors: Record<string, string> = {
			pending: "apic-tag--yellow",
			paid: "apic-tag--green",
			approved: "apic-tag--green",
			cancelled: "apic-tag--red",
			rejected: "apic-tag--red",
		};
		const labels: Record<string, string> = {
			pending: "Pending",
			paid: "Paid",
			approved: "Approved",
			cancelled: "Cancelled",
			rejected: "Rejected",
		};
		return (
			<span className={`apic-tag ${colors[status] || ""}`}>
				{labels[status] || status}
			</span>
		);
	};

	const fmtDate = (d: string) => {
		const date = new Date(d);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Billing</h1>
				<p className="apic-subtitle">
					Manage your API balance and payment history.
				</p>
			</div>

			{/* Stats */}
			<div className="apic-grid apic-grid--3">
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Balance</div>
					<div className="apic-stat-value">
						${summary ? fmt(summary.account.balanceCents) : "—"}
					</div>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Total Spent</div>
					<div className="apic-stat-value apic-stat-value--sm">
						${summary ? fmt(summary.account.lifetimeSpentCents) : "—"}
					</div>
				</div>
				<div className="apic-card apic-card--stat">
					<div className="apic-stat-label">Total Top-up</div>
					<div className="apic-stat-value apic-stat-value--sm">
						${summary ? fmt(summary.account.lifetimeGrantedCents) : "—"}
					</div>
				</div>
			</div>

			{/* Top-up Form */}
			<div className="apic-card apic-stack apic-stack--12">
				<div className="apic-h3">Add Balance</div>
				<div className="apic-row apic-row--8">
					<span style={{ color: "#666", fontSize: 13 }}>USD</span>
					<input
						className="apic-input"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						type="number"
						min="2"
						step="1"
						style={{ maxWidth: 120 }}
					/>
					<button
						className="apic-btn apic-btn--primary"
						onClick={handleTopup}
						disabled={loading}
						type="button"
					>
						{loading ? "Processing..." : "Top-up via QRIS"}
					</button>
				</div>
				<p style={{ fontSize: 12, color: "#555" }}>
					Minimum $2 USD. You&apos;ll be redirected to the payment page.
				</p>
			</div>

			{/* Payment Orders History */}
			<div className="apic-card" style={{ padding: 0 }}>
				<div
					className="apic-row apic-row--between"
					style={{
						padding: "12px 16px",
						borderBottom: "1px solid #1a1a1a",
					}}
				>
					<div className="apic-h3">Payment History</div>
					<button
						className="apic-btn apic-btn--sm"
						onClick={load}
						type="button"
					>
						Refresh
					</button>
				</div>
				{orders.length > 0 ? (
					<table className="apic-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Transaction ID</th>
								<th style={{ width: 80 }} />
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o.id}>
									<td style={{ fontSize: 12, color: "#888" }}>
										{fmtDate(o.createdAt)}
									</td>
									<td>
										<div style={{ color: "#e5e5e5", fontSize: 13 }}>
											Rp {o.amountIdr.toLocaleString("id-ID")}
										</div>
										<div style={{ color: "#555", fontSize: 11 }}>
											${o.amountUsd.toFixed(2)}
										</div>
									</td>
									<td>{statusBadge(o.status)}</td>
									<td
										style={{
											fontSize: 11,
											color: "#666",
											fontFamily: "monospace",
										}}
									>
										{o.trxId || "—"}
									</td>
									<td>
										{o.status === "pending" && (
											<button
												className="apic-btn apic-btn--sm apic-btn--primary"
												onClick={() => router.push(`/api-console/pay/${o.id}`)}
												type="button"
												style={{ fontSize: 11 }}
											>
												Pay
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p
						style={{
							padding: 24,
							textAlign: "center",
							color: "#555",
							fontSize: 13,
						}}
					>
						No payments yet.
					</p>
				)}
			</div>

			{/* Credit Transactions */}
			<div className="apic-card" style={{ padding: 0 }}>
				<div
					style={{
						padding: "12px 16px",
						borderBottom: "1px solid #1a1a1a",
					}}
				>
					<div className="apic-h3">Credit Transactions</div>
				</div>
				{summary?.transactions?.length ? (
					<table className="apic-table">
						<thead>
							<tr>
								<th>Reason</th>
								<th>Amount</th>
								<th>Balance After</th>
							</tr>
						</thead>
						<tbody>
							{summary.transactions.map((tx) => (
								<tr key={tx.id}>
									<td style={{ fontSize: 13 }}>{tx.reason}</td>
									<td
										style={{
											color: tx.type === "grant" ? "#4ade80" : "#f87171",
											fontSize: 13,
										}}
									>
										{tx.type === "grant" ? "+" : "−"}${fmt(tx.amountCents)}
									</td>
									<td style={{ fontSize: 13, color: "#888" }}>
										${fmt(tx.balanceAfterCents)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p
						style={{
							padding: 24,
							textAlign: "center",
							color: "#555",
							fontSize: 13,
						}}
					>
						No credit transactions yet.
					</p>
				)}
			</div>
		</div>
	);
}
