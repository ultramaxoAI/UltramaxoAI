"use client";

import { useCallback, useEffect, useState } from "react";

type CreditSummaryResponse = {
	account?: {
		balanceCents?: number;
	};
};

const BALANCE_REFRESH_MS = 10_000;

export function LiveBalanceCard({
	initialBalance,
}: {
	initialBalance: string;
}) {
	const [balance, setBalance] = useState(initialBalance);

	const refreshBalance = useCallback(async () => {
		try {
			const response = await fetch("/api/user/api-credits", {
				cache: "no-store",
			});

			if (!response.ok) {
				return;
			}

			const data = (await response.json()) as CreditSummaryResponse;
			const nextBalanceCents = data.account?.balanceCents;

			if (typeof nextBalanceCents === "number") {
				setBalance((nextBalanceCents / 100).toFixed(2));
			}
		} catch {
			// Keep the last known balance if the background refresh fails.
		}
	}, []);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			void refreshBalance();
		}, BALANCE_REFRESH_MS);

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshBalance();
			}
		};

		window.addEventListener("focus", refreshBalance);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.clearInterval(intervalId);
			window.removeEventListener("focus", refreshBalance);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refreshBalance]);

	const isReadyForPaidModels = Number(balance) >= 2;

	return (
		<>
			<div className="apic-h3">Balance</div>
			<div
				className="apic-stat-value apic-stat-value--sm"
				style={{ marginTop: 8 }}
			>
				${balance}
			</div>
			<p
				style={{
					fontSize: 12,
					color: "var(--apic-text-dim)",
					marginTop: 4,
				}}
			>
				{isReadyForPaidModels ? (
					<span style={{ color: "#4ade80" }}>Ready for paid models</span>
				) : (
					<span style={{ color: "#f87171" }}>Top up to use paid models</span>
				)}
			</p>
		</>
	);
}
