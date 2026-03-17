"use client";

import { CoinsIcon, Loader2Icon } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type CreditTransaction = {
	id: string;
	amount: number;
	balanceAfter: number;
	type: "grant" | "spend" | "refund" | "bonus";
	reason: string;
	createdAt: string;
};

type CreditResponse = {
	account: {
		balance: number;
		lifetimeGranted: number;
		lifetimeSpent: number;
	};
	transactions: CreditTransaction[];
	costs: Record<string, number>;
	policy: {
		allowance: number;
		resetWindowDays: number;
	};
};

const costLabels: Array<{ key: string; label: string }> = [
	{ key: "chatBase", label: "Chat" },
	{ key: "webSearch", label: "Web search add-on" },
	{ key: "deepThinking", label: "Deep thinking add-on" },
	{ key: "fullstackMode", label: "Fullstack mode add-on" },
	{ key: "mobileMode", label: "Mobile mode add-on" },
	{ key: "imageGeneration", label: "Image generation" },
	{ key: "agentExecution", label: "Agent execution" },
];

export function CreditOverviewPanel() {
	const { data, isLoading } = useSWR<CreditResponse>("/api/user/credits", fetcher);

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center text-zinc-500">
				<Loader2Icon className="h-7 w-7 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<div className="flex items-center gap-2 text-zinc-900 dark:text-white">
					<CoinsIcon size={20} />
					<h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
				</div>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Track your remaining credits, spending history, and action pricing.
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 dark:border-white/5 dark:bg-[#101010]">
					<p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
					<p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
						{data?.account.balance ?? 0}
					</p>
				</div>
				<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 dark:border-white/5 dark:bg-[#101010]">
					<p className="text-sm text-zinc-500 dark:text-zinc-400">Lifetime granted</p>
					<p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
						{data?.account.lifetimeGranted ?? 0}
					</p>
				</div>
				<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 dark:border-white/5 dark:bg-[#101010]">
					<p className="text-sm text-zinc-500 dark:text-zinc-400">Lifetime spent</p>
					<p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
						{data?.account.lifetimeSpent ?? 0}
					</p>
				</div>
			</div>

			<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 text-sm text-zinc-600 dark:border-white/5 dark:bg-[#101010] dark:text-zinc-300">
				You receive up to <span className="font-semibold text-zinc-900 dark:text-white">{data?.policy.allowance ?? 0} credits</span> every <span className="font-semibold text-zinc-900 dark:text-white">{data?.policy.resetWindowDays ?? 0} day{data?.policy.resetWindowDays === 1 ? "" : "s"}</span>. If you still have extra bonus credits above the allowance, they stay untouched.
			</div>

			<div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/5 dark:bg-[#101010]">
					<h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Action pricing</h2>
					<div className="mt-4 space-y-3">
						{costLabels.map((item) => (
							<div className="flex items-center justify-between text-sm" key={item.key}>
								<span className="text-zinc-500 dark:text-zinc-400">{item.label}</span>
								<span className="font-medium text-zinc-900 dark:text-white">
									{data?.costs?.[item.key] ?? 0}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/5 dark:bg-[#101010]">
					<h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent activity</h2>
					<div className="mt-4 space-y-3">
						{data?.transactions?.length ? (
							data.transactions.map((transaction) => (
								<div className="flex items-start justify-between rounded-xl border border-zinc-200/80 px-4 py-3 dark:border-white/6" key={transaction.id}>
									<div>
										<p className="text-sm font-medium text-zinc-900 dark:text-white">{transaction.reason}</p>
										<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
											Balance after: {transaction.balanceAfter}
										</p>
									</div>
									<div className={`text-sm font-semibold ${transaction.amount < 0 ? "text-rose-500" : "text-emerald-500"}`}>
										{transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
									</div>
								</div>
							))
						) : (
							<div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/8 dark:text-zinc-400">
								No credit activity yet.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
