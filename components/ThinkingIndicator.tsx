"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ThinkingEvent, ThinkingPhase } from "@/hooks/useThinkingState";
import { useThinkingState } from "@/hooks/useThinkingState";
import { cn } from "@/lib/utils";
import { AgentThinking } from "./AgentThinking";
import { SimpleThinking } from "./SimpleThinking";

type ThinkingIndicatorProps = {
	onEvent?: (event: ThinkingEvent) => void;
	event?: ThinkingEvent;
	events?: ThinkingEvent[];
	thinkingChunks?: string[];
	isActive?: boolean;
	totalDurationMs?: number;
	initialPhase?: ThinkingPhase;
	listenToGlobalEvents?: boolean;
	className?: string;
};

function normalizeChunks(chunks: string[]) {
	return chunks.map((chunk) => chunk.replace(/\r\n/g, "\n"));
}

function isThinkingEvent(value: unknown): value is ThinkingEvent {
	if (!value || typeof value !== "object" || !("type" in value)) {
		return false;
	}

	const type = (value as { type?: unknown }).type;
	return (
		type === "thinking_start" ||
		type === "upgrade_to_agent" ||
		type === "thinking_chunk" ||
		type === "response_chunk" ||
		type === "done"
	);
}

export function ThinkingIndicator({
	onEvent,
	event,
	events,
	thinkingChunks = [],
	isActive = true,
	totalDurationMs,
	initialPhase,
	listenToGlobalEvents = false,
	className,
}: ThinkingIndicatorProps) {
	const normalizedChunks = useMemo(
		() => normalizeChunks(thinkingChunks),
		[thinkingChunks],
	);
	const derivedInitialPhase =
		initialPhase ?? (normalizedChunks.length > 0 ? "agent" : "simple");
	const eventCountRef = useRef(0);
	const state = useThinkingState({
		initialChunks: normalizedChunks,
		initialPhase: derivedInitialPhase,
	});
	const [shouldRender, setShouldRender] = useState(true);

	const emitEvent = useMemo(
		() => (nextEvent: ThinkingEvent) => {
			state.handleEvent(nextEvent);
			onEvent?.(nextEvent);
		},
		[state.handleEvent, onEvent],
	);

	useEffect(() => {
		if (listenToGlobalEvents && normalizedChunks.length === 0) {
			return;
		}

		state.setThinkingChunks(normalizedChunks);
	}, [listenToGlobalEvents, normalizedChunks, state.setThinkingChunks]);

	useEffect(() => {
		if (event) {
			emitEvent(event);
		}
	}, [emitEvent, event]);

	useEffect(() => {
		if (!events?.length) {
			return;
		}

		const unseenEvents = events.slice(eventCountRef.current);
		eventCountRef.current = events.length;

		for (const nextEvent of unseenEvents) {
			emitEvent(nextEvent);
		}
	}, [emitEvent, events]);

	useEffect(() => {
		if (!listenToGlobalEvents) {
			return;
		}

		const handleGlobalEvent = (browserEvent: Event) => {
			const detail = (browserEvent as CustomEvent<unknown>).detail;
			if (isThinkingEvent(detail)) {
				emitEvent(detail);
			}
		};

		window.addEventListener("ultramaxo-thinking-event", handleGlobalEvent);
		return () => {
			window.removeEventListener("ultramaxo-thinking-event", handleGlobalEvent);
		};
	}, [emitEvent, listenToGlobalEvents]);

	useEffect(() => {
		if (!isActive) {
			emitEvent({ durationMs: totalDurationMs, type: "done" });
		}
	}, [emitEvent, isActive, totalDurationMs]);

	useEffect(() => {
		if (state.phase === "done" && !state.hasUpgraded) {
			const timeout = window.setTimeout(() => setShouldRender(false), 300);
			return () => window.clearTimeout(timeout);
		}

		setShouldRender(true);
	}, [state.hasUpgraded, state.phase]);

	if (!shouldRender) {
		return null;
	}

	return (
		<div className={cn("relative w-full", className)}>
			{state.showToast ? (
				<div
					className="adaptive-thinking-toast pointer-events-none absolute -top-11 left-0 z-10 rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-normal text-white/[0.45] backdrop-blur-[8px]"
					style={{
						background: "rgba(255,255,255,0.03)",
						borderWidth: "0.5px",
						backdropFilter: "blur(8px)",
					}}
				>
					⚡ Mode ditingkatkan ke UltraAgent
				</div>
			) : null}

			{state.phase === "simple" || (state.phase === "done" && !state.hasUpgraded) ? (
				<SimpleThinking />
			) : state.phase === "upgrading" ? (
				<SimpleThinking isUpgrading />
			) : (
				<AgentThinking
					durationMs={state.durationMs ?? totalDurationMs}
					isDone={state.phase === "done"}
					thinkingChunks={state.thinkingChunks}
				/>
			)}

			<style jsx>{`
				.adaptive-thinking-toast {
					animation: adaptive-toast-in 0.18s ease forwards;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
						sans-serif;
				}

				@keyframes adaptive-toast-in {
					0% {
						opacity: 0;
						transform: translateY(4px) scale(0.98);
					}
					100% {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
			`}</style>
		</div>
	);
}

export type { ThinkingEvent, ThinkingPhase };
