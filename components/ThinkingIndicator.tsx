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
	keepVisibleOnDone?: boolean;
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
	keepVisibleOnDone = false,
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
	const lastDoneSignatureRef = useRef<string | null>(null);
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
		if (isActive) {
			lastDoneSignatureRef.current = null;
			return;
		}

		const signature = `${totalDurationMs ?? "none"}`;
		if (lastDoneSignatureRef.current === signature) {
			return;
		}

		lastDoneSignatureRef.current = signature;
		emitEvent({ durationMs: totalDurationMs, type: "done" });
	}, [emitEvent, isActive, totalDurationMs]);

	useEffect(() => {
		if (state.phase === "done" && keepVisibleOnDone) {
			setShouldRender(true);
			return;
		}

		if (state.phase === "done") {
			const timeout = window.setTimeout(() => setShouldRender(false), 90);
			return () => window.clearTimeout(timeout);
		}

		setShouldRender(true);
	}, [keepVisibleOnDone, state.phase]);

	if (!shouldRender) {
		return null;
	}

	return (
		<div className={cn("relative w-full", className)}>
			{state.phase === "simple" ? (
				<SimpleThinking />
			) : state.phase === "upgrading" ? (
				<SimpleThinking isUpgrading />
			) : (
				<AgentThinking
					isDone={state.phase === "done"}
					thinkingChunks={state.thinkingChunks}
				/>
			)}
		</div>
	);
}

export type { ThinkingEvent, ThinkingPhase };
