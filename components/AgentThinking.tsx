"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ReasoningStream } from "./ReasoningStream";

const FALLBACK_LABELS = [
	"Menganalisis permintaan...",
	"Menyusun implementasi...",
	"Memeriksa langkah terbaik...",
];

function stripReasoningMarkup(value: string) {
	return value
		.replace(/<strong>([\s\S]*?)<\/strong>/gi, "$1")
		.replace(/\*\*([\s\S]*?)\*\*/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

function pickAgentLabel(thinkingChunks: string[], label?: string) {
	if (label?.trim()) {
		return label.trim();
	}

	for (let index = thinkingChunks.length - 1; index >= 0; index -= 1) {
		const cleaned = stripReasoningMarkup(thinkingChunks[index] ?? "");
		if (cleaned) {
			return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
		}
	}

	return FALLBACK_LABELS[0];
}

export function AgentThinking({
	thinkingChunks,
	isDone,
	label,
	className,
}: {
	thinkingChunks: string[];
	isDone: boolean;
	label?: string;
	className?: string;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasReasoning = thinkingChunks.length > 0;
	const displayLabel = useMemo(
		() => pickAgentLabel(thinkingChunks, label),
		[label, thinkingChunks],
	);

	return (
		<div
			className={cn("w-full max-w-[540px] font-sans", className)}
			style={{
				fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
			}}
		>
			<div className="flex items-center gap-2 px-0 py-0">
				<span className="agent-thinking-shimmer min-w-0 flex-1 truncate text-[13px]">
					{displayLabel}
				</span>

				{hasReasoning ? (
					<button
						aria-expanded={isExpanded}
						className="inline-flex h-5 min-h-5 min-w-5 shrink-0 items-center justify-center rounded-md border border-white/[0.08] px-1 text-[11px] text-white/35 transition-all duration-150 hover:border-white/[0.16] hover:text-white/55"
						onClick={() => setIsExpanded((value) => !value)}
						type="button"
					>
						↕
					</button>
				) : null}
			</div>

			{hasReasoning ? (
				<div
					className={cn(
						"overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out",
						isExpanded
							? "mt-2 max-h-[180px] opacity-100"
							: "mt-0 max-h-0 opacity-0",
					)}
				>
					<div className="border-l border-white/[0.06] pl-3">
						<ReasoningStream chunks={thinkingChunks} showCursor={!isDone} />
					</div>
				</div>
			) : null}

			<style jsx>{`
				.agent-thinking-shimmer {
					background: linear-gradient(
						90deg,
						rgba(255,255,255,.2) 0%,
						rgba(255,255,255,.68) 38%,
						rgba(255,255,255,.92) 50%,
						rgba(255,255,255,.68) 62%,
						rgba(255,255,255,.2) 100%
					);
					background-size: 200% 100%;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					animation: shimmer-text 2.8s ease-in-out infinite;
				}

				@keyframes shimmer-text {
					0% { background-position: 200% center; }
					100% { background-position: -200% center; }
				}
			`}</style>
		</div>
	);
}
