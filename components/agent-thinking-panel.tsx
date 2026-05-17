"use client";

import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { formatToolCallForUser } from "@/lib/format-tool-calls";
import type { ThinkingStep } from "@/lib/thinking-steps";

export interface Step {
	id: string;
	type: "thought" | "tool_call";
	label: string;
	args?: string;
	result?: string;
	status: "pending" | "running" | "done" | "error";
	duration?: number;
}

export type AgentThinkingStep = Step;

export interface AgentThinkingPanelProps {
	status: "thinking" | "executing" | "done" | "error";
	steps?: Step[];
	totalDuration?: number;
	defaultCollapsed?: boolean;
	isActive?: boolean;
	totalDurationMs?: number;
	liveSteps?: ThinkingStep[];
	thinkingChunks?: string[];
	variant?: "responding" | "deep-thinking" | "agent-active";
}

function formatDuration(ms?: number) {
	if (!ms || ms < 0) {
		return "0s";
	}

	if (ms < 1000) {
		return `${Math.max(0.1, ms / 1000).toFixed(1)}s`;
	}

	const seconds = ms / 1000;
	if (seconds < 60) {
		return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
	}

	return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function AgentSummary({
	steps,
	finalDuration,
}: {
	steps: Step[];
	finalDuration?: number;
}) {
	const toolCalls = steps.filter(
		(step) => step.type === "tool_call" && step.status === "done",
	);

	if (toolCalls.length === 0) {
		return null;
	}

	return (
		<div className="mt-3 mb-4 max-w-2xl rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
			<div className="mb-2.5 font-semibold text-[11px] text-[#4f4f4f] uppercase tracking-[0.18em]">
				Completed work
			</div>
			<div className="space-y-1.5">
				{toolCalls.map((step) => (
					<div className="flex items-start gap-2 text-[12px]" key={step.id}>
						<span className="mt-0.5 shrink-0 font-mono text-[#10B981] text-[11px]">
							✓
						</span>
						<span className="leading-relaxed text-[#777]">
							{formatToolCallForUser(step)}
						</span>
					</div>
				))}
			</div>
			<div className="mt-2 border-[#1e1e1e] border-t pt-2 text-[11px] text-[#424242]">
				{toolCalls.length} actions completed in {formatDuration(finalDuration)}
			</div>
		</div>
	);
}

export function AgentThinkingPanel({
	status,
	steps = [],
	totalDuration,
	isActive,
	totalDurationMs,
	thinkingChunks: explicitThinkingChunks,
	variant: _variant,
}: AgentThinkingPanelProps) {
	const active = isActive ?? (status === "thinking" || status === "executing");
	const startsAsAgent =
		steps.length > 0 || Boolean(explicitThinkingChunks?.length);
	const thinkingChunks = steps
		.map((step) => {
			const label = step.label.trim();
			if (!label) {
				return "";
			}

			return step.type === "tool_call" ? `${label} ${step.status}` : label;
		})
		.filter(Boolean);
	const visibleThinkingChunks = explicitThinkingChunks?.length
		? explicitThinkingChunks
		: thinkingChunks;

	return (
		<ThinkingIndicator
			initialPhase={startsAsAgent ? "agent" : "simple"}
			isActive={active}
			thinkingChunks={visibleThinkingChunks}
			keepVisibleOnDone={startsAsAgent}
			listenToGlobalEvents={active}
			totalDurationMs={totalDurationMs ?? totalDuration}
		/>
	);
}
