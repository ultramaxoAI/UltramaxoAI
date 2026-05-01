import {
	getApiCreditSummaryByUserId,
	getPlatformApiKeysByUserId,
} from "@backend/db/queries";
import {
	ArrowRight,
	CircleDollarSign,
	KeyRound,
	Play,
	ReceiptText,
	Waypoints,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import { DashboardAutoRefresh } from "@/components/api-console/dashboard-auto-refresh";
import { LiveBalanceCard } from "@/components/api-console/live-balance-card";
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

	const [credit, keys] = await Promise.all([
		getApiCreditSummaryByUserId({ userId, limit: 50 }),
		getPlatformApiKeysByUserId(userId),
	]);

	const balance = (credit.account.balanceCents / 100).toFixed(2);
	const spent = (credit.account.lifetimeSpentCents / 100).toFixed(4);
	const activeKeys = keys.filter(
		(key: { status: string }) => key.status === "active",
	).length;

	const spendTxs = credit.transactions.filter((transaction) => {
		return transaction.type === "spend";
	});
	const totalRequests = spendTxs.length;
	const totalTokens = spendTxs.reduce((sum, transaction) => {
		const meta = transaction.metadata as Record<string, number> | null;
		return sum + (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
	}, 0);
	const successRate = totalRequests > 0 ? "100.0%" : "—";

	const latestSpend = spendTxs[0];
	const latestSpendSummary = latestSpend
		? {
				spend: `$${(Math.abs(latestSpend.amountCents) / 100).toFixed(4)}`,
				date: new Date(latestSpend.createdAt).toLocaleString("id-ID", {
					dateStyle: "medium",
					timeStyle: "short",
				}),
			}
		: null;

	const chartData = spendTxs.map((transaction) => ({
		date: transaction.createdAt,
		amount: Math.abs(transaction.amountCents),
		tokens: (() => {
			const meta = transaction.metadata as Record<string, number> | null;
			return (meta?.promptTokens || 0) + (meta?.completionTokens || 0);
		})(),
	}));

	return (
		<div className="apic-stack apic-stack--32">
			<DashboardAutoRefresh />

			<section className="rounded-[28px] border border-white/8 bg-[#0f1318] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
				<div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_360px]">
					<div className="border-white/8 border-b p-6 sm:p-8 xl:border-r xl:border-b-0">
						<div className="flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/48">
								<span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
								Overview
							</span>
							<span className="text-xs uppercase tracking-[0.2em] text-white/28">
								API control center
							</span>
						</div>
						<h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
							Monitor usage, manage access, and keep delivery clean.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-white/56 sm:text-[15px]">
							Overview ini jadi tempat paling cepat untuk lihat saldo, key
							aktif, spend terbaru, dan jalur tindakan utama tanpa kebanyakan
							dekorasi.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Link
								href="/api-console/keys"
								className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
							>
								Manage keys <ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="/api-console/playground"
								className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.05]"
							>
								Open playground <Play className="h-4 w-4" />
							</Link>
						</div>
						<div className="mt-8 grid gap-px overflow-hidden rounded-[22px] border border-white/8 bg-white/8 sm:grid-cols-3">
							<div className="bg-[#0f1318] p-5">
								<div className="flex items-center gap-2 text-white/36">
									<CircleDollarSign className="h-4 w-4" />
									<span className="text-[11px] uppercase tracking-[0.22em]">
										Balance
									</span>
								</div>
								<div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
									${balance}
								</div>
								<p className="mt-2 text-sm text-white/48">
									Ready to spend across all supported models.
								</p>
							</div>
							<div className="bg-[#0f1318] p-5">
								<div className="flex items-center gap-2 text-white/36">
									<KeyRound className="h-4 w-4" />
									<span className="text-[11px] uppercase tracking-[0.22em]">
										Active keys
									</span>
								</div>
								<div className="mt-4 text-3xl font-medium tracking-[-0.05em] text-white">
									{activeKeys}
								</div>
								<p className="mt-2 text-sm text-white/48">
									{keys.length} total key tercatat di akun ini.
								</p>
							</div>
							<div className="bg-[#0f1318] p-5">
								<div className="flex items-center gap-2 text-white/36">
									<ReceiptText className="h-4 w-4" />
									<span className="text-[11px] uppercase tracking-[0.22em]">
										Latest spend
									</span>
								</div>
								<div className="mt-4 text-2xl font-medium tracking-[-0.04em] text-white">
									{latestSpendSummary?.spend || "Belum ada"}
								</div>
								<p className="mt-2 text-sm text-white/48">
									{latestSpendSummary?.date ||
										"Spend terbaru akan muncul di sini."}
								</p>
							</div>
						</div>
					</div>

					<div className="p-6 sm:p-8">
						<div className="flex items-center gap-2 text-white/36">
							<Waypoints className="h-4 w-4" />
							<span className="text-[11px] uppercase tracking-[0.22em]">
								Quick actions
							</span>
						</div>
						<div className="mt-5 space-y-3">
							<Link
								href="/api-console/keys"
								className="block rounded-[18px] border border-white/8 px-4 py-4 transition-colors hover:bg-white/[0.04]"
							>
								<div className="flex items-center justify-between gap-4">
									<div>
										<div className="text-sm font-medium text-white">
											Create or revoke API keys
										</div>
										<div className="mt-1 text-xs text-white/42">
											Kontrol environment dan akses model.
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-white/32" />
								</div>
							</Link>
							<Link
								href="/api-console/billing"
								className="block rounded-[18px] border border-white/8 px-4 py-4 transition-colors hover:bg-white/[0.04]"
							>
								<div className="flex items-center justify-between gap-4">
									<div>
										<div className="text-sm font-medium text-white">
											Review balance and top up
										</div>
										<div className="mt-1 text-xs text-white/42">
											Lihat saldo dan histori transaksi.
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-white/32" />
								</div>
							</Link>
							<Link
								href="/api-console/docs"
								className="block rounded-[18px] border border-white/8 px-4 py-4 transition-colors hover:bg-white/[0.04]"
							>
								<div className="flex items-center justify-between gap-4">
									<div>
										<div className="text-sm font-medium text-white">
											Open docs and integration guides
										</div>
										<div className="mt-1 text-xs text-white/42">
											Endpoint, auth flow, dan contoh request.
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-white/32" />
								</div>
							</Link>
						</div>
						<div className="mt-6 rounded-[22px] border border-white/8 bg-[#0b0f13] p-4">
							<LiveBalanceCard initialBalance={balance} />
						</div>
					</div>
				</div>
			</section>

			<div className="grid gap-px overflow-hidden rounded-[22px] border border-white/8 bg-white/8 md:grid-cols-2 xl:grid-cols-4">
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
						<div key={card.key} className="bg-[#0f1318] p-5">
							<p className="text-[11px] uppercase tracking-[0.22em] text-white/38">
								{card.label}
							</p>
							<p className="mt-4 text-4xl font-medium tracking-[-0.06em] text-white">
								{value}
							</p>
							<p className="mt-2 text-sm text-white/46">{card.description}</p>
						</div>
					);
				})}
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
				<UsageChart data={JSON.stringify(chartData)} />

				<section className="rounded-[24px] border border-white/8 bg-[#0f1318] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
					<div className="flex items-center justify-between gap-4 border-white/8 border-b pb-4">
						<div>
							<h2 className="text-lg font-semibold tracking-[-0.03em] text-white">
								Account state
							</h2>
							<p className="mt-1 text-sm text-white/46">
								Ringkasan singkat untuk health, credits, dan flow utama.
							</p>
						</div>
					</div>
					<div className="mt-5 space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
									Balance status
								</div>
								<div className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">
									${balance}
								</div>
							</div>
							<div className="rounded-full border border-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
								Ready
							</div>
						</div>
						<div className="grid gap-px overflow-hidden rounded-[18px] border border-white/8 bg-white/8">
							<div className="flex items-center justify-between bg-[#0f1318] px-4 py-3 text-sm">
								<span className="text-white/46">Active keys</span>
								<span className="font-medium text-white">{activeKeys}</span>
							</div>
							<div className="flex items-center justify-between bg-[#0f1318] px-4 py-3 text-sm">
								<span className="text-white/46">Total requests</span>
								<span className="font-medium text-white">
									{totalRequests.toLocaleString()}
								</span>
							</div>
							<div className="flex items-center justify-between bg-[#0f1318] px-4 py-3 text-sm">
								<span className="text-white/46">Success rate</span>
								<span className="font-medium text-white">{successRate}</span>
							</div>
						</div>
						<Link
							href="/api-console/billing"
							className="block rounded-[18px] border border-white/8 bg-[#0b0f13] p-4"
							style={{ textDecoration: "none" }}
						>
							<LiveBalanceCard initialBalance={balance} />
						</Link>
					</div>
				</section>
			</div>
		</div>
	);
}
