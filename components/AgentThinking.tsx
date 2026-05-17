"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReasoningStream } from "./ReasoningStream";

export function AgentThinking({
	thinkingChunks,
	isDone,
	className,
}: {
	thinkingChunks: string[];
	isDone: boolean;
	className?: string;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasReasoning = thinkingChunks.length > 0;

	return (
		<div
			className={cn("w-full max-w-[540px] font-sans", className)}
			style={{
				fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
			}}
		>
			<div className="flex items-center gap-2 px-0 py-0">
				<div className="min-w-0 flex-1">
					<span
						className={cn(
							"block truncate text-[13px]",
							isDone ? "text-white/35" : "agent-thinking-shimmer",
						)}
					>
						Thinking
					</span>
				</div>

				{hasReasoning ? (
					<button
						aria-expanded={isExpanded}
						className="inline-flex h-5 min-h-5 min-w-5 shrink-0 items-center justify-center rounded border border-white/[0.09] px-1 text-[11px] text-white/35 transition-colors duration-150 hover:border-white/[0.16] hover:text-white/55"
						onClick={() => setIsExpanded((value) => !value)}
						type="button"
					>
						{isExpanded ? "↓" : "→"}
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
						rgba(255,255,255,.22) 0%,
						rgba(255,255,255,.58) 42%,
						rgba(255,255,255,.86) 50%,
						rgba(255,255,255,.58) 58%,
						rgba(255,255,255,.22) 100%
					);
					background-size: 220% 100%;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					animation: shimmer-text 2.2s ease-in-out infinite;
				}

				@keyframes shimmer-text {
					0% { background-position: 200% center; }
					100% { background-position: -200% center; }
				}
			`}</style>
		</div>
	);
}
