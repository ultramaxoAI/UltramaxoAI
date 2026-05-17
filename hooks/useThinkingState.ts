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
	const phaseRef = useRef<ThinkingPhase>(initialPhase);
	const durationRef = useRef<number | undefined>(undefined);
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
					phaseRef.current = "simple";
					durationRef.current = undefined;
					setPhase("simple");
					setThinkingChunksState((currentChunks) =>
						currentChunks.length === 0 ? currentChunks : [],
					);
					setDurationMs(undefined);
					setShowToast(false);
					setHasUpgraded(false);
					break;
				}

				case "upgrade_to_agent": {
					if (
						phaseRef.current === "agent" ||
						phaseRef.current === "upgrading"
					) {
						break;
					}

					clearUpgradeTimeout();
					clearToastTimeout();
					phaseRef.current = "upgrading";
					setHasUpgraded(true);
					setPhase("upgrading");
					setShowToast(true);

					upgradeTimeoutRef.current = window.setTimeout(() => {
						phaseRef.current = "agent";
						setPhase("agent");
						upgradeTimeoutRef.current = null;
					}, 120);

					toastTimeoutRef.current = window.setTimeout(() => {
						setShowToast(false);
						toastTimeoutRef.current = null;
					}, 900);
					break;
				}

				case "thinking_chunk": {
					if (event.content) {
						if (phaseRef.current === "simple") {
							phaseRef.current = "agent";
							setHasUpgraded(true);
							setPhase("agent");
						}

						const nextChunk = event.content as string;
						setThinkingChunksState((currentChunks) =>
							currentChunks[currentChunks.length - 1] === nextChunk
								? currentChunks
								: [...currentChunks, nextChunk],
						);
					}
					break;
				}

				case "done": {
					if (
						phaseRef.current === "done" &&
						(durationRef.current ?? undefined) === event.durationMs
					) {
						break;
					}

					clearUpgradeTimeout();
					clearToastTimeout();
					phaseRef.current = "done";
					durationRef.current = event.durationMs;
					setDurationMs((current) =>
						current === event.durationMs ? current : event.durationMs,
					);
					setPhase("done");
					setShowToast(false);
					break;
				}

				default:
					break;
			}
		},
		[clearToastTimeout, clearUpgradeTimeout],
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
		phaseRef.current = nextPhase;
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
