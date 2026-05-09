"use client";

import { Check, ChevronDown, Loader2, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function AgentModeBar({
	status,
	subtitles,
	className,
}: {
	status: "working" | "done";
	subtitles?: string[];
	className?: string;
}) {
	const resolvedSubtitles = useMemo(
		() => subtitles?.length ? subtitles : ["Menyiapkan dokumen · 0s"],
		[subtitles],
	);
	const [subtitleIndex, setSubtitleIndex] = useState(0);
	const [subtitleVisible, setSubtitleVisible] = useState(true);

	useEffect(() => {
		if (resolvedSubtitles.length <= 1 || status === "done") {
			return;
		}

		const interval = window.setInterval(() => {
			setSubtitleVisible(false);
			window.setTimeout(() => {
				setSubtitleIndex((index) => (index + 1) % resolvedSubtitles.length);
				setSubtitleVisible(true);
			}, 180);
		}, 3000);

		return () => window.clearInterval(interval);
	}, [resolvedSubtitles, status]);

	return (
		<div
			className={cn(
				"flex w-full items-center gap-[10px] rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-[14px] py-[10px] font-sans",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
			}}
		>
			<div className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05]">
				{status === "done" ? (
					<Check className="size-[13px] text-[rgba(62,207,142,.8)]" strokeWidth={1.8} />
				) : (
					<Loader2 className="size-[13px] animate-spin text-white/50" strokeWidth={1.8} />
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-[7px] text-[12px] font-medium text-white/55">
					<span>Agent mode</span>
					<span className="rounded-[20px] border border-white/[0.1] bg-white/[0.06] px-[7px] py-[1px] text-[9.5px] font-normal text-white/35">
						{status === "done" ? "Done" : "Working"}
					</span>
				</div>
				<div
					className={cn(
						"mt-[2px] truncate text-[10.5px] text-white/25 transition-opacity duration-200",
						subtitleVisible ? "opacity-100" : "opacity-0",
					)}
				>
					{resolvedSubtitles[Math.min(subtitleIndex, resolvedSubtitles.length - 1)]}
				</div>
			</div>

			<div className="flex shrink-0 gap-[5px]">
				<button
					className="flex size-[26px] items-center justify-center rounded-[7px] border border-white/[0.07] bg-white/[0.04] text-white/30 transition-colors hover:bg-white/[0.07]"
					type="button"
				>
					<ChevronDown className="size-[12px]" strokeWidth={1.6} />
				</button>
				<button
					className="flex size-[26px] items-center justify-center rounded-[7px] border border-white/[0.07] bg-white/[0.04] text-white/30 transition-colors hover:bg-white/[0.07]"
					type="button"
				>
					<MoreHorizontal className="size-[12px]" strokeWidth={1.6} />
				</button>
			</div>
		</div>
	);
}
