"use client";

import { useCallback, useEffect, useReducer } from "react";

export type ThinkingPhase = "simple" | "upgrading" | "agent" | "done";

export type ThinkingEvent =
	| { type: "thinking_start" }
	| { type: "upgrade_to_agent" }
	| { type: "thinking_chunk"; content: string }
	| { type: "response_chunk"; content: string }
	| { type: "done"; durationMs?: number };

type ThinkingState = {
	phase: ThinkingPhase;
	thinkingChunks: string[];
	responseContent: string;
	durationMs?: number;
	showToast: boolean;
	hasUpgraded: boolean;
	upgradeStartedAt?: number;
};

type ThinkingAction =
	| { type: "event"; event: ThinkingEvent }
	| { type: "finish_upgrade" }
	| { type: "hide_toast" }
	| { type: "set_chunks"; chunks: string[] }
	| { type: "force_phase"; phase: ThinkingPhase };

const initialState: ThinkingState = {
	durationMs: undefined,
	hasUpgraded: false,
	phase: "simple",
	responseContent: "",
	showToast: false,
	thinkingChunks: [],
	upgradeStartedAt: undefined,
};

function areStringArraysEqual(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}

	return left.every((value, index) => value === right[index]);
}

function reducer(state: ThinkingState, action: ThinkingAction): ThinkingState {
	switch (action.type) {
		case "event": {
			const { event } = action;

			if (event.type === "thinking_start") {
				return initialState;
			}

			if (event.type === "upgrade_to_agent") {
				if (state.phase === "agent" || state.phase === "upgrading") {
					return state;
				}

				return {
					...state,
					hasUpgraded: true,
					phase: "upgrading",
					showToast: true,
					upgradeStartedAt: Date.now(),
				};
			}

			if (event.type === "thinking_chunk") {
				return {
					...state,
					thinkingChunks: [...state.thinkingChunks, event.content],
				};
			}

			if (event.type === "response_chunk") {
				return {
					...state,
					responseContent: `${state.responseContent}${event.content}`,
				};
			}

			if (event.type === "done") {
				const nextDuration = event.durationMs ?? state.durationMs;
				if (
					state.phase === "done" &&
					state.durationMs === nextDuration &&
					state.showToast === false
				) {
					return state;
				}

				return {
					...state,
					durationMs: nextDuration,
					phase: "done",
					showToast: false,
				};
			}

			return state;
		}

		case "finish_upgrade":
			if (state.phase !== "upgrading") {
				return state;
			}

			return { ...state, phase: "agent" };

		case "hide_toast":
			return { ...state, showToast: false };

		case "set_chunks":
			if (areStringArraysEqual(state.thinkingChunks, action.chunks)) {
				return state;
			}

			return { ...state, thinkingChunks: action.chunks };

		case "force_phase":
			return {
				...state,
				phase: action.phase,
				hasUpgraded: action.phase === "agent",
			};

		default:
			return state;
	}
}

export function useThinkingState({
	initialChunks = [],
	initialPhase = "simple",
}: {
	initialChunks?: string[];
	initialPhase?: ThinkingPhase;
} = {}) {
	const [state, dispatch] = useReducer(reducer, {
		...initialState,
		hasUpgraded: initialPhase === "agent",
		phase: initialPhase,
		thinkingChunks: initialChunks,
	});

	const onEvent = useCallback((event: ThinkingEvent) => {
		dispatch({ event, type: "event" });
	}, []);

	const setThinkingChunks = useCallback((chunks: string[]) => {
		dispatch({ chunks, type: "set_chunks" });
	}, []);

	const forcePhase = useCallback((phase: ThinkingPhase) => {
		dispatch({ phase, type: "force_phase" });
	}, []);

	useEffect(() => {
		if (state.phase !== "upgrading") {
			return;
		}

		const timeout = window.setTimeout(() => {
			dispatch({ type: "finish_upgrade" });
		}, 800);

		return () => window.clearTimeout(timeout);
	}, [state.phase]);

	useEffect(() => {
		if (!state.showToast) {
			return;
		}

		const timeout = window.setTimeout(() => {
			dispatch({ type: "hide_toast" });
		}, 3000);

		return () => window.clearTimeout(timeout);
	}, [state.showToast]);

	return {
		...state,
		forcePhase,
		onEvent,
		setThinkingChunks,
	};
}
