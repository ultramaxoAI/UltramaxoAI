"use client";

import { BarChart3Icon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UsageOverview = {
	totalChats: number;
	publicChats: number;
	pinnedChats: number;
	totalMessages: number;
	messagesLast24Hours: number;
	totalDocuments: number;
	sharedDocuments: number;
	totalPresets: number;
	connectedProviders: number;
};

const metricCards: Array<{ key: keyof UsageOverview; label: string }> = [
	{ key: "totalChats", label: "Total chats" },
	{ key: "publicChats", label: "Public chats" },
	{ key: "pinnedChats", label: "Pinned chats" },
	{ key: "totalMessages", label: "Total messages" },
	{ key: "messagesLast24Hours", label: "Messages / 24h" },
	{ key: "totalDocuments", label: "Artifacts saved" },
	{ key: "sharedDocuments", label: "Shared artifacts" },
	{ key: "totalPresets", label: "Prompt presets" },
	{ key: "connectedProviders", label: "Connected providers" },
];

export function UsageOverviewPanel() {
	const [usage, setUsage] = useState<UsageOverview | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadUsage() {
			try {
				const res = await fetch("/api/user/usage");
				const data = await res.json();
				setUsage(data.usage || null);
			} catch {
				toast.error("Failed to load usage overview");
			} finally {
				setLoading(false);
			}
		}

		loadUsage();
	}, []);

	if (loading) {
		return (
			<div className="flex h-48 items-center justify-center text-zinc-500">
				<Loader2Icon className="animate-spin" size={28} />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<div className="flex items-center gap-2 text-zinc-900 dark:text-white">
					<BarChart3Icon size={20} />
					<h1 className="text-2xl font-semibold tracking-tight">
						Usage Overview
					</h1>
				</div>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Track how much of the workspace you are actively using.
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{metricCards.map((metric) => (
					<div
						className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50/40 dark:bg-[#101010] p-5"
						key={metric.key}
					>
						<p className="text-sm text-zinc-500 dark:text-zinc-400">
							{metric.label}
						</p>
						<p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
							{usage?.[metric.key] ?? 0}
						</p>
					</div>
				))}
			</div>

			<div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#101010] p-5 text-sm text-zinc-600 dark:text-zinc-300 leading-7">
				Your library, shared assets, and connected model providers are now
				visible from one place, so you can see whether the workspace is being
				used mainly for chat, artifacts, or reusable prompt operations.
			</div>
		</div>
	);
}
