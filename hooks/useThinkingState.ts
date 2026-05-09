"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ThinkingPhase = "simple" | "upgrading" | "agent" | "done";

export interface ThinkingEvent {
	type:
		| "thinking_start"
		| "upgrade_to_agent"
		| "thinking_chunk"
		| "response_chunk"
		| "done";
	content?: string;
	durationMs?: number;
}

function areStringArraysEqual(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}

	return left.every((value, index) => value === right[index]);
}

export function useThinkingState({
	initialChunks = [],
	initialPhase = "simple",
}: {
	initialChunks?: string[];
	initialPhase?: ThinkingPhase;
} = {}) {
	const [phase, setPhase] = useState<ThinkingPhase>(initialPhase);
	const [thinkingChunks, setThinkingChunksState] =
		useState<string[]>(initialChunks);
	const [durationMs, setDurationMs] = useState<number | undefined>();
	const [showToast, setShowToast] = useState(false);
	const [hasUpgraded, setHasUpgraded] = useState(
		initialPhase === "agent" || initialPhase === "upgrading",
	);
	const upgradeTimeoutRef = useRef<number | null>(null);
	const toastTimeoutRef = useRef<number | null>(null);

	const clearUpgradeTimeout = useCallback(() => {
		if (upgradeTimeoutRef.current) {
			clearTimeout(upgradeTimeoutRef.current);
			upgradeTimeoutRef.current = null;
		}
	}, []);

	const clearToastTimeout = useCallback(() => {
		if (toastTimeoutRef.current) {
			clearTimeout(toastTimeoutRef.current);
			toastTimeoutRef.current = null;
		}
	}, []);

	const handleEvent = useCallback(
		(event: ThinkingEvent) => {
			switch (event.type) {
				case "thinking_start": {
					clearUpgradeTimeout();
					clearToastTimeout();
					setPhase("simple");
					setThinkingChunksState([]);
					setDurationMs(undefined);
					setShowToast(false);
					setHasUpgraded(false);
					break;
				}

				case "upgrade_to_agent": {
					if (phase === "agent" || phase === "upgrading") {
						break;
					}

					clearUpgradeTimeout();
					clearToastTimeout();
					setHasUpgraded(true);
					setPhase("upgrading");
					setShowToast(true);

					upgradeTimeoutRef.current = window.setTimeout(() => {
						setPhase("agent");
						upgradeTimeoutRef.current = null;
					}, 400);

					toastTimeoutRef.current = window.setTimeout(() => {
						setShowToast(false);
						toastTimeoutRef.current = null;
					}, 2200);
					break;
				}

				case "thinking_chunk": {
					if (event.content) {
						setThinkingChunksState((currentChunks) => [
							...currentChunks,
							event.content as string,
						]);
					}
					break;
				}

				case "done": {
					clearUpgradeTimeout();
					clearToastTimeout();
					setDurationMs(event.durationMs);
					setPhase("done");
					setShowToast(false);
					break;
				}

				case "response_chunk":
				default:
					break;
			}
		},
		[clearToastTimeout, clearUpgradeTimeout, phase],
	);

	useEffect(() => {
		return () => {
			clearUpgradeTimeout();
			clearToastTimeout();
		};
	}, [clearToastTimeout, clearUpgradeTimeout]);

	const setThinkingChunks = useCallback((chunks: string[]) => {
		setThinkingChunksState((currentChunks) =>
			areStringArraysEqual(currentChunks, chunks) ? currentChunks : chunks,
		);
	}, []);

	const forcePhase = useCallback((nextPhase: ThinkingPhase) => {
		setPhase(nextPhase);
	}, []);

	return {
		phase,
		thinkingChunks,
		durationMs,
		showToast,
		hasUpgraded,
		onEvent: handleEvent,
		handleEvent,
		setThinkingChunks,
		forcePhase,
	};
}
