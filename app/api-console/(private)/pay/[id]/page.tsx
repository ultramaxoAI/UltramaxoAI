"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PaymentData = {
	status: string;
	trxId: string;
	refId: string;
	qrImage: string | null;
	paymentUrl: string | null;
	amountToPay: number;
	amountUsd: number;
	createdAt: string;
};

export default function PaymentPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<PaymentData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await fetch(`/api/payment/status/${id}`);
			if (!res.ok) {
				setError("Payment not found");
				return;
			}
			const d = await res.json();
			setData(d);
			if (d.status === "paid" || d.status === "cancelled") {
				if (pollRef.current) clearInterval(pollRef.current);
				if (timerRef.current) clearInterval(timerRef.current);
			}
		} catch {
			setError("Failed to load payment");
		}
	}, [id]);

	useEffect(() => {
		load();
		pollRef.current = setInterval(load, 5000);
		timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [load]);

	const fmtTime = (s: number) => {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${sec.toString().padStart(2, "0")}`;
	};

	if (error) {
		return (
			<div
				className="apic-stack apic-stack--32"
				style={{ maxWidth: 480, margin: "0 auto" }}
			>
				<div className="apic-card" style={{ textAlign: "center", padding: 48 }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
					<div className="apic-h2">{error}</div>
					<Link
						href="/api-console/billing"
						className="apic-btn apic-btn--primary"
						style={{
							marginTop: 16,
							display: "inline-block",
							textDecoration: "none",
						}}
					>
						Back to Billing
					</Link>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "60vh",
				}}
			>
				<p style={{ color: "var(--apic-text-dim)" }}>Loading payment...</p>
			</div>
		);
	}

	const isPaid = data.status === "paid" || data.status === "approved";
	const isCancelled = data.status === "cancelled" || data.status === "rejected";
	const isPending = !isPaid && !isCancelled;

	return (
		<div
			className="apic-stack apic-stack--32"
			style={{ maxWidth: 520, margin: "0 auto" }}
		>
			{/* Header */}
			<div style={{ textAlign: "center" }}>
				<h1 className="apic-h1" style={{ fontSize: 20 }}>
					{isPaid
						? "Payment Complete"
						: isCancelled
							? "Payment Cancelled"
							: "Complete Payment"}
				</h1>
				<p style={{ fontSize: 13, color: "var(--apic-text-muted)", marginTop: 4 }}>
					Transaction {data.trxId || data.refId}
				</p>
			</div>

			{/* Status Badge */}
			<div style={{ display: "flex", justifyContent: "center" }}>
				<span
					className={`apic-tag ${isPaid ? "apic-tag--green" : isCancelled ? "apic-tag--red" : "apic-tag--yellow"}`}
					style={{ fontSize: 13, padding: "6px 20px" }}
				>
					{isPaid
						? "✓ Paid"
						: isCancelled
							? "✕ Cancelled"
							: "⏳ Awaiting Payment"}
				</span>
			</div>

			{/* Amount */}
			<div className="apic-card" style={{ textAlign: "center" }}>
				<div className="apic-stat-label">Amount to Pay</div>
				<div className="apic-stat-value" style={{ fontSize: 32, marginTop: 8 }}>
					Rp {data.amountToPay?.toLocaleString("id-ID") || "—"}
				</div>
				<p style={{ fontSize: 12, color: "var(--apic-text-dim)", marginTop: 4 }}>
					≈ ${(data.amountUsd || 0).toFixed(2)} USD
				</p>
			</div>

			{/* QR Code */}
			{isPending && data.qrImage && (
				<div className="apic-card" style={{ padding: 0, overflow: "hidden" }}>
					<div
						style={{
							background: "#fff",
							padding: 24,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<img
							src={data.qrImage}
							alt="QRIS Payment QR Code"
							style={{ maxWidth: 300, width: "100%", height: "auto" }}
						/>
					</div>
					<div
						style={{
							padding: "12px 16px",
							borderTop: "1px solid #1a1a1a",
							textAlign: "center",
						}}
					>
						<div
							className="apic-row"
							style={{ justifyContent: "center", gap: 8 }}
						>
							<span className="apic-pulse" />
							<span style={{ fontSize: 12, color: "#fbbf24" }}>
								Waiting for payment... {fmtTime(elapsed)}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Payment URL Fallback */}
			{isPending && data.paymentUrl && (
				<div style={{ textAlign: "center" }}>
					<a
						href={data.paymentUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="apic-btn apic-btn--primary"
						style={{ display: "inline-block", textDecoration: "none" }}
					>
						Open Payment Page ↗
					</a>
				</div>
			)}

			{/* Success State */}
			{isPaid && (
				<div className="apic-card" style={{ textAlign: "center", padding: 32 }}>
					<div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
					<p style={{ color: "#4ade80", fontSize: 14 }}>
						Payment received. Your balance has been updated.
					</p>
				</div>
			)}

			{/* Cancelled State */}
			{isCancelled && (
				<div className="apic-card" style={{ textAlign: "center", padding: 32 }}>
					<div style={{ fontSize: 48, marginBottom: 8 }}>✕</div>
					<p style={{ color: "#f87171", fontSize: 14 }}>
						This payment was cancelled or has expired.
					</p>
				</div>
			)}

			{/* Back link */}
			<div style={{ textAlign: "center" }}>
				<Link
					href="/api-console/billing"
					style={{ color: "var(--apic-text-muted)", fontSize: 13, textDecoration: "none" }}
				>
					← Back to Billing
				</Link>
			</div>
		</div>
	);
}
