"use client";

import { Check, ChevronDown, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ReasoningStream } from "./ReasoningStream";

const TIMER_MS = 100;
const SUBTITLE_INTERVAL_MS = 2800;
const SUBTITLES = [
	"Menganalisis permintaan",
	"Mempertimbangkan pendekatan",
	"Merancang implementasi",
	"Memverifikasi logika",
];

function formatSeconds(ms: number) {
	return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

export function AgentThinking({
	thinkingChunks,
	isDone,
	durationMs,
	className,
}: {
	thinkingChunks: string[];
	isDone: boolean;
	durationMs?: number;
	className?: string;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [elapsedMs, setElapsedMs] = useState(durationMs ?? 0);
	const [subtitleIndex, setSubtitleIndex] = useState(0);
	const startedAtRef = useRef(Date.now() - (durationMs ?? 0));
	const displayDuration = durationMs ?? elapsedMs;

	useEffect(() => {
		if (thinkingChunks.length === 0 && !isDone) {
			setIsExpanded(false);
			return;
		}

		const timeout = window.setTimeout(() => {
			setIsExpanded(true);
		}, isDone ? 0 : 420);

		return () => window.clearTimeout(timeout);
	}, [isDone, thinkingChunks.length]);

	useEffect(() => {
		if (isDone) {
			return;
		}

		const interval = window.setInterval(() => {
			setElapsedMs(Date.now() - startedAtRef.current);
		}, TIMER_MS);

		return () => window.clearInterval(interval);
	}, [isDone]);

	useEffect(() => {
		if (isDone) {
			return;
		}

		const interval = window.setInterval(() => {
			setSubtitleIndex((index) => (index + 1) % SUBTITLES.length);
		}, SUBTITLE_INTERVAL_MS);

		return () => window.clearInterval(interval);
	}, [isDone]);

	return (
		<div
			className={cn("w-full max-w-[540px] font-sans", className)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
			}}
		>
			<div className="overflow-hidden rounded-none border-0 bg-transparent backdrop-blur-0">
				<button
					aria-expanded={isExpanded}
					className="flex w-full items-center gap-[11px] px-[14px] py-[10px] text-left transition-colors hover:bg-white/[0.02]"
					onClick={() => setIsExpanded((value) => !value)}
					type="button"
				>
					{isDone ? (
						<span
							className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-white/[0.07] bg-white/[0.04]"
							style={{ borderWidth: "0.5px" }}
						>
							<Check className="size-[13px] text-white/50" strokeWidth={1.8} />
						</span>
					) : null}

					<span className="min-w-0 flex-1">
						<span className="block min-w-0 truncate text-[13px] font-normal thinking-shimmer">
							{isDone ? "Jawaban siap" : "Sedang berpikir"}
						</span>
						<span className="mt-[2px] block truncate text-[10px] text-white/[0.25] transition-opacity duration-200">
							{isDone
								? `Selesai dalam ${formatSeconds(displayDuration)}`
								: SUBTITLES[subtitleIndex]}
						</span>
					</span>

					<span
						className="inline-flex items-center gap-[3.5px] rounded-[20px] border border-white/[0.08] bg-white/[0.05] px-[8px] py-[3px] font-mono text-[10.5px] text-white/[0.35]"
						style={{ borderWidth: "0.5px" }}
					>
						<Clock3 className="size-[9px]" strokeWidth={1.5} />
						{formatSeconds(displayDuration)}
					</span>

					<ChevronDown
						className={cn(
							"size-[14px] shrink-0 text-white/20 transition-transform duration-200",
							isExpanded && "rotate-180",
						)}
						strokeWidth={1.5}
					/>
				</button>

				<div
					className={cn(
						"overflow-hidden border-white/[0.05] border-t transition-[max-height,opacity] duration-300 ease-out",
						isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0",
					)}
					style={{ borderTopWidth: isExpanded ? "0.5px" : "0px" }}
				>
					<div className="reasoning-shell px-[14px] py-[12px]">
						<ReasoningStream chunks={thinkingChunks} showCursor={!isDone} />
					</div>
				</div>
			</div>

			<style jsx>{`
				.thinking-shimmer {
					background: linear-gradient(
						90deg,
						rgba(255,255,255,.2) 0%,
						rgba(255,255,255,.7) 40%,
						rgba(255,255,255,.9) 50%,
						rgba(255,255,255,.7) 60%,
						rgba(255,255,255,.2) 100%
					);
					background-size: 200% 100%;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					animation: shimmer-text 2.8s ease-in-out infinite;
				}

				.reasoning-shell :global(.reasoning-stream) {
					max-height: 180px;
					overflow-y: auto;
					scrollbar-width: none;
				}

				.reasoning-shell :global(.reasoning-stream::-webkit-scrollbar) {
					display: none;
				}

				.reasoning-shell :global(.reasoning-stream p),
				.reasoning-shell :global(.reasoning-stream div),
				.reasoning-shell :global(.reasoning-stream span) {
					font-size: 11.5px;
					line-height: 1.8;
					color: rgba(255, 255, 255, 0.22);
					font-style: italic;
				}

				.reasoning-shell :global(.reasoning-stream strong),
				.reasoning-shell :global(.reasoning-stream b) {
					color: rgba(255, 255, 255, 0.35);
					font-style: normal;
					font-weight: 600;
				}

				.reasoning-shell :global(.reasoning-cursor) {
					width: 1.5px;
					background: rgba(255, 255, 255, 0.4);
					border-radius: 1px;
				}

				@keyframes shimmer-text {
					0% { background-position: 200% center; }
					100% { background-position: -200% center; }
				}
			`}</style>
		</div>
	);
}
