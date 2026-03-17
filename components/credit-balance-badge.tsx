"use client";

import { CoinsIcon, Loader2Icon } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type CreditResponse = {
	account: {
		balance: number;
	};
};

export function CreditBalanceBadge({ compact = false }: { compact?: boolean }) {
	const { data, isLoading } = useSWR<CreditResponse>("/api/user/credits", fetcher);

	if (isLoading) {
		return (
			<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-[#a6aca6]">
				<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
			</div>
		);
	}

	return (
		<div
			className={`inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-200 ${
				compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
			}`}
		>
			<CoinsIcon className="h-3.5 w-3.5" />
			<span className="font-medium">{data?.account?.balance ?? 0} credits</span>
		</div>
	);
}
