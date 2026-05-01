import {
	getApiCreditSummaryByUserId,
	getPlatformApiKeysByUserId,
} from "@backend/db/queries";
import {
	Activity,
	ArrowRight,
	Braces,
	CircleDollarSign,
	KeyRound,
	Play,
	Sparkles,
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
		caption: "Lifetime usage value",
		icon: CircleDollarSign,
		accent: "from-cyan-400/22 via-cyan-400/6 to-transparent",
	},
	{
		key: "requests",
		label: "API Requests",
		caption: "Completed request volume",
		icon: Activity,
		accent: "from-emerald-400/22 via-emerald-400/6 to-transparent",
	},
	{
		key: "tokens",
		label: "Total Tokens",
		caption: "Input and output tokens",
		icon: Sparkles,
		accent: "from-sky-300/18 via-sky-300/6 to-transparent",
	},
	{
		key: "success",
		label: "Success Rate",
		caption: "Healthy delivery signal",
		icon: Braces,
		accent: "from-violet-400/18 via-violet-400/6 to-transparent",
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

			<section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#090b10] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-8">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
				<div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">
							<span className="h-2 w-2 rounded-full bg-cyan-300" />
							Console overview
						</div>
						<div>
							<h1 className="max-w-3xl font-body text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
								Build smarter.
								<br />
								Ship further.
							</h1>
							<p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
								Satu permukaan yang lebih tenang untuk memantau spend, request,
								token, key aktif, dan kesehatan workflow API kamu tanpa terasa
								seperti dashboard template.
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Link
								href="/api-console/keys"
								className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
							>
								Manage API Keys <ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="/api-console/playground"
								className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/[0.08]"
							>
								Open Playground <Play className="h-4 w-4" />
							</Link>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
						<div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
										Available balance
									</p>
									<p className="mt-3 text-4xl font-medium tracking-[-0.05em] text-white">
										${balance}
									</p>
								</div>
								<div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
									<CircleDollarSign className="h-5 w-5" />
								</div>
							</div>
							<p className="mt-4 text-sm text-white/55">
								Saldo aktif untuk request berikutnya di seluruh model API.
							</p>
						</div>
						<div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
										Active keys
									</p>
									<p className="mt-3 text-4xl font-medium tracking-[-0.05em] text-white">
										{activeKeys}
									</p>
								</div>
								<div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
									<KeyRound className="h-5 w-5" />
								</div>
							</div>
							<p className="mt-4 text-sm text-white/55">
								{activeKeys} aktif dari total {keys.length} key yang pernah
								dibuat.
							</p>
						</div>
						<div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
							<p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
								Latest spend
							</p>
							<p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
								{latestSpendSummary?.spend || "Belum ada"}
							</p>
							<p className="mt-2 text-sm text-white/55">
								{latestSpendSummary?.date ||
									"Begitu request pertama masuk, spend terbaru akan muncul di sini."}
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{statCards.map((card) => {
					const Icon = card.icon;
					const value =
						card.key === "spent"
							? `$${spent}`
							: card.key === "requests"
								? totalRequests.toLocaleString()
								: card.key === "tokens"
									? totalTokens.toLocaleString()
									: successRate;

					return (
						<div
							key={card.key}
							className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101318] p-5 transition-transform duration-200 hover:-translate-y-0.5"
						>
							<div
								className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`}
							/>
							<div className="relative">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
											{card.label}
										</p>
										<p className="mt-4 text-4xl font-medium tracking-[-0.06em] text-white">
											{value}
										</p>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/72">
										<Icon className="h-5 w-5" />
									</div>
								</div>
								<p className="mt-4 text-sm text-white/56">{card.caption}</p>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
				<UsageChart data={JSON.stringify(chartData)} />

				<div className="apic-stack apic-stack--16">
					<div className="rounded-[28px] border border-white/10 bg-[#101318] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
									Quick actions
								</h2>
								<p className="mt-2 text-sm leading-6 text-white/56">
									Akses flow yang paling sering dipakai tanpa muter-muter.
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-cyan-300">
								<Braces className="h-5 w-5" />
							</div>
						</div>

						<div className="mt-6 grid gap-3">
							<Link
								href="/api-console/keys"
								className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/85 transition-colors hover:bg-white/[0.06]"
							>
								<div>
									<div className="font-medium text-white">
										Generate or revoke keys
									</div>
									<div className="mt-1 text-xs text-white/45">
										Kontrol akses model dan environment.
									</div>
								</div>
								<ArrowRight className="h-4 w-4 text-white/45" />
							</Link>
							<Link
								href="/api-console/billing"
								className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/85 transition-colors hover:bg-white/[0.06]"
							>
								<div>
									<div className="font-medium text-white">
										Top up and track credits
									</div>
									<div className="mt-1 text-xs text-white/45">
										Lihat saldo realtime dan histori pembayaran.
									</div>
								</div>
								<ArrowRight className="h-4 w-4 text-white/45" />
							</Link>
							<Link
								href="/api-console/docs"
								className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/85 transition-colors hover:bg-white/[0.06]"
							>
								<div>
									<div className="font-medium text-white">
										Open documentation
									</div>
									<div className="mt-1 text-xs text-white/45">
										Copy endpoint, auth flow, dan contoh request.
									</div>
								</div>
								<ArrowRight className="h-4 w-4 text-white/45" />
							</Link>
						</div>
					</div>

					<Link
						href="/api-console/billing"
						className="rounded-[28px] border border-white/10 bg-[#101318] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
						style={{ textDecoration: "none" }}
					>
						<LiveBalanceCard initialBalance={balance} />
					</Link>
				</div>
			</div>
		</div>
	);
}
