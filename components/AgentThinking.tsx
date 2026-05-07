"use client";

import { Check, ChevronDown, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ReasoningStream } from "./ReasoningStream";

const TIMER_MS = 100;
const SUBTITLE_INTERVAL_MS = 2800;
const SUBTITLES = [
	"Analyzing request",
	"Considering approach",
	"Designing implementation",
	"Verifying logic",
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
		const timeout = window.setTimeout(() => {
			setIsExpanded(true);
		}, 600);

		return () => window.clearTimeout(timeout);
	}, []);

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
			className={cn(
				"agent-thinking-panel w-full max-w-[580px] font-sans",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
			}}
		>
			<div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111]">
				<button
					aria-expanded={isExpanded}
					className="flex w-full select-none items-center gap-2.5 px-3.5 py-[11px] text-left transition-colors hover:bg-white/[0.012]"
					onClick={() => setIsExpanded((value) => !value)}
					type="button"
				>
					<span className="flex size-[30px] shrink-0 items-center justify-center rounded-full border border-[#222] bg-[#151515]">
						{isDone ? (
							<Check className="size-[15px] text-[#3ecf8e]" strokeWidth={1.8} />
						) : (
							<span className="agent-thinking-dots flex items-center gap-[3px]">
								<span />
								<span />
								<span />
							</span>
						)}
					</span>

					<span className="min-w-0 flex-1">
						<span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#b0b0b0]">
							{isDone ? "Finished thinking" : "Thinking..."}
							{isDone ? null : <span className="agent-live-dot" />}
						</span>
						<span className="mt-0.5 block truncate text-[11px] text-[#484848] transition-opacity duration-200">
							{isDone
								? `in ${formatSeconds(displayDuration)}`
								: SUBTITLES[subtitleIndex]}
						</span>
					</span>

					<span className="inline-flex items-center gap-1 rounded-full border border-[#1e1e1e] bg-[#141414] px-2 py-[3px] font-mono text-[10.5px] text-[#424242] tabular-nums">
						<Clock3 className="size-2.5" strokeWidth={1.5} />
						{formatSeconds(displayDuration)}
					</span>

					<ChevronDown
						className={cn(
							"size-3.5 shrink-0 text-[#333] transition-transform duration-200",
							isExpanded && "rotate-180",
						)}
						strokeWidth={1.5}
					/>
				</button>

				<div
					className={cn(
						"overflow-hidden border-[#181818] border-t transition-[max-height,opacity] duration-300 ease-out",
						isExpanded ? "max-h-[280px] opacity-100" : "max-h-0 opacity-0",
					)}
				>
					<ReasoningStream chunks={thinkingChunks} showCursor={!isDone} />
				</div>
			</div>

			<style jsx>{`
				.agent-thinking-panel {
					animation: agent-panel-in 0.4s ease forwards;
					transform-origin: left top;
				}

				.agent-thinking-dots span {
					width: 4.5px;
					height: 4.5px;
					border-radius: 999px;
					background: #4a90e2;
					animation: agent-dot-pulse 1.5s ease-in-out infinite;
				}

				.agent-thinking-dots span:nth-child(2) {
					animation-delay: 0.18s;
				}

				.agent-thinking-dots span:nth-child(3) {
					animation-delay: 0.36s;
				}

				.agent-live-dot {
					width: 6px;
					height: 6px;
					border-radius: 999px;
					background: #4a90e2;
					box-shadow: 0 0 8px #4a90e2;
					animation: agent-live-dot 2s ease-in-out infinite;
				}

				@keyframes agent-panel-in {
					0% {
						opacity: 0;
						transform: scale(0.97) translateY(4px);
					}
					100% {
						opacity: 1;
						transform: scale(1) translateY(0);
					}
				}

				@keyframes agent-dot-pulse {
					0%,
					60%,
					100% {
						opacity: 0.2;
						transform: scale(0.78);
					}
					30% {
						opacity: 1;
						transform: scale(1);
					}
				}

				@keyframes agent-live-dot {
					0%,
					100% {
						opacity: 0.4;
					}
					50% {
						opacity: 1;
					}
				}
			`}</style>
		</div>
	);
}
