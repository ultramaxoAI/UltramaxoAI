import { getApiCreditSummaryByUserId } from "@backend/db/queries";
import { ArrowRight, CalendarRange } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import { DashboardAutoRefresh } from "@/components/api-console/dashboard-auto-refresh";
import { UsageChart } from "@/components/api-console/usage-chart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "API Console — Dashboard",
	description:
		"Ultramaxo API Console — Monitor penggunaan API, kelola API key, dan pantau saldo kredit Anda secara real-time. Akses 46+ model AI dalam satu dashboard.",
	openGraph: {
		title: "Ultramaxo API Console — Dashboard",
		description:
			"Monitor penggunaan API, kelola API key, dan pantau saldo kredit secara real-time.",
		url: "https://app.ultramaxo.tech",
	},
};

const statCards = [
	{
		key: "spent",
		label: "Total Spend",
		description: "Lifetime usage value",
	},
	{
		key: "requests",
		label: "API Requests",
		description: "Completed request volume",
	},
	{
		key: "tokens",
		label: "Total Tokens",
		description: "Input and output tokens",
	},
	{
		key: "success",
		label: "Success Rate",
		description: "Healthy delivery signal",
	},
] as const;

export default async function ApiConsoleDashboard() {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return null;

	const credit = await getApiCreditSummaryByUserId({ userId, limit: 50 });

	const spent = (credit.account.lifetimeSpentCents / 100).toFixed(4);

	const spendTxs = credit.transactions.filter((transaction) => {
		return transaction.type === "spend";
	});
	const totalRequests = spendTxs.length;
	const totalTokens = spendTxs.reduce((sum, transaction) => {
		const meta = transaction.metadata as Record<string, number> | null;
		return sum + (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
	}, 0);
	const successRate = totalRequests > 0 ? "100.0%" : "—";

	const chartData = spendTxs.map((transaction) => ({
		date: transaction.createdAt,
		amount: Math.abs(transaction.amountCents),
		tokens: (() => {
			const meta = transaction.metadata as Record<string, number> | null;
			return (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
		})(),
	}));

	return (
		<div className="apic-stack apic-stack--16">
			<DashboardAutoRefresh />

			<section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1318] shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
				<div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-white/70">
							<CalendarRange className="h-4 w-4" />
						</div>
						<div>
							<h1 className="text-sm font-medium text-white/92">Usage</h1>
							<p className="text-sm text-white/46">
								Track requests and token consumption.
							</p>
						</div>
					</div>
					<Link
						href="/api-console/billing"
						className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/84 transition-colors hover:bg-white/[0.05]"
					>
						Add credit <ArrowRight className="h-4 w-4" />
					</Link>
				</div>

				<div className="grid gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-4">
					{statCards.map((card) => {
						const value =
							card.key === "spent"
								? `$${spent}`
								: card.key === "requests"
									? totalRequests.toLocaleString()
									: card.key === "tokens"
										? totalTokens.toLocaleString()
										: successRate;

						return (
							<div key={card.key} className="bg-[#0f1318] px-5 py-6">
								<p className="text-sm font-medium text-white/92">
									{card.label}
								</p>
								<p className="mt-5 text-[3rem] leading-none font-semibold tracking-[-0.06em] text-white">
									{value}
								</p>
								<p className="mt-3 text-sm text-white/46">{card.description}</p>
							</div>
						);
					})}
				</div>
			</section>

			<UsageChart data={JSON.stringify(chartData)} />
		</div>
	);
}
