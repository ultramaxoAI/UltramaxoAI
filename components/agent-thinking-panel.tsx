"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Circle,
	Loader2,
	XCircle,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatToolCallForUser } from "@/lib/format-tool-calls";
import type { ThinkingStep } from "@/lib/thinking-steps";
import { cn } from "@/lib/utils";

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
	variant?: "responding" | "deep-thinking" | "agent-active";
}

const ease = [0.4, 0, 0.2, 1] as const;
const THINKING_SUBTITLES = [
	"Memproses permintaan",
	"Menganalisis konteks",
	"Menyusun respons",
] as const;
const DEFAULT_THINKING_STEPS: ThinkingStep[] = [
	{ id: "think-1", label: "Memahami permintaan", status: "done" },
	{ id: "think-2", label: "Menyusun respons terbaik", status: "running" },
	{ id: "think-3", label: "Mengirim jawaban", status: "running" },
];

function formatDuration(ms?: number) {
	if (!ms || ms < 0) {
		return "0s";
	}

	if (ms < 1000) {
		return `${Math.max(0.1, ms / 1000).toFixed(1)}s`;
	}

	return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)}s`;
}

function useElapsedTimer(isActive: boolean, totalDuration?: number) {
	const [elapsed, setElapsed] = useState(totalDuration ?? 0);
	const startedAtRef = useRef(Date.now());

	useEffect(() => {
		if (!isActive) {
			setElapsed((current) => totalDuration ?? current);
			return;
		}

		startedAtRef.current = Date.now() - (totalDuration ?? 0);
		const interval = window.setInterval(() => {
			setElapsed(Date.now() - startedAtRef.current);
		}, 250);

		return () => window.clearInterval(interval);
	}, [isActive, totalDuration]);

	return totalDuration ?? elapsed;
}

function StepIcon({ status }: { status: Step["status"] }) {
	if (status === "done") {
		return <CheckCircle2 className="size-3 text-green-400/70" />;
	}

	if (status === "running") {
		return <Loader2 className="size-3 animate-spin text-indigo-400/80" />;
	}

	if (status === "error") {
		return <XCircle className="size-3 text-red-400/60" />;
	}

	return <Circle className="size-3 text-white/20" />;
}

function AgentStepRow({ step, index }: { step: Step; index: number }) {
	const [expanded, setExpanded] = useState(false);
	const hasDetails = Boolean(step.args || step.result);
	const isCurrent = step.status === "running";

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			className={cn(
				"relative pl-5",
				isCurrent && "rounded-r-lg border-indigo-400/50 border-l",
			)}
			initial={{ opacity: 0, x: -4 }}
			transition={{ delay: index * 0.15, duration: 0.24, ease }}
		>
			<div className="absolute top-1.5 bottom-[-0.65rem] left-1.5 w-px bg-white/8" />
			<button
				className={cn(
					"grid w-full grid-cols-[auto_1fr_auto] items-start gap-2 rounded-lg px-1.5 py-1 text-left font-mono text-[12px] transition-colors",
					hasDetails && "hover:bg-white/[0.03]",
				)}
				disabled={!hasDetails}
				onClick={() => setExpanded((value) => !value)}
				type="button"
			>
				<span className="mt-0.5">
					{step.type === "thought" ? (
						<span
							className={cn(
								"block size-1.5 rounded-full",
								isCurrent ? "animate-pulse bg-indigo-400/70" : "bg-white/18",
							)}
						/>
					) : (
						<StepIcon status={step.status} />
					)}
				</span>
				<span className="min-w-0 truncate">
					<span
						className={cn(
							step.type === "tool_call" ? "text-white/65" : "text-white/45",
							step.status === "pending" && "text-white/25",
							step.status === "error" && "text-red-300/70",
						)}
					>
						{step.label}
					</span>
					{step.args ? (
						<span className="ml-1 text-white/30">{step.args}</span>
					) : null}
				</span>
				<span className="pt-0.5 text-[11px] text-white/25">
					{step.duration ? formatDuration(step.duration) : ""}
				</span>
			</button>

			<AnimatePresence initial={false}>
				{expanded && hasDetails ? (
					<motion.div
						animate={{ height: "auto", opacity: 1 }}
						className="overflow-hidden"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease }}
					>
						<pre className="mt-1 max-h-56 overflow-auto rounded-lg border border-white/8 bg-white/[0.04] p-3 font-mono text-[11px] leading-relaxed text-white/45">
							{step.result || step.args}
						</pre>
					</motion.div>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
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
		<div className="mt-3 mb-4 max-w-2xl rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
			<div className="mb-2.5 font-semibold text-[11px] text-white/30 uppercase tracking-widest">
				Yang sudah dikerjakan
			</div>
			<div className="space-y-1.5">
				{toolCalls.map((step) => (
					<div className="flex items-start gap-2 text-[12px]" key={step.id}>
						<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-400/60" />
						<span className="leading-relaxed text-white/55">
							{formatToolCallForUser(step)}
						</span>
					</div>
				))}
			</div>
			<div className="mt-2 border-white/[0.04] border-t pt-2 text-[11px] text-white/20">
				{toolCalls.length} aksi selesai dalam {formatDuration(finalDuration)}
			</div>
		</div>
	);
}

function useVisibleThinkingSteps(steps: ThinkingStep[], isActive: boolean) {
	const [visibleCount, setVisibleCount] = useState(0);
	const stepsLength = steps.length;

	useEffect(() => {
		if (!isActive) {
			setVisibleCount(stepsLength);
			return;
		}

		if (visibleCount >= stepsLength) {
			return;
		}

		const delay = visibleCount === 0 ? 300 : 600 + Math.random() * 800;
		const timer = window.setTimeout(() => {
			setVisibleCount((value) => Math.min(value + 1, stepsLength));
		}, delay);

		return () => window.clearTimeout(timer);
	}, [isActive, stepsLength, visibleCount]);

	return visibleCount;
}

function useRotatingSubtitle(isActive: boolean) {
	const [subtitleIndex, setSubtitleIndex] = useState(0);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		const interval = window.setInterval(() => {
			setSubtitleIndex((current) => (current + 1) % THINKING_SUBTITLES.length);
		}, 3000);

		return () => window.clearInterval(interval);
	}, [isActive]);

	return THINKING_SUBTITLES[subtitleIndex];
}

function getActiveThinkingSubtitle(
	steps: ThinkingStep[],
	visibleCount: number,
	isActive: boolean,
	fallback: string,
) {
	if (!steps.length) {
		return fallback;
	}

	const activeIndex = isActive
		? Math.min(Math.max(visibleCount - 1, 0), steps.length - 1)
		: steps.length - 1;
	const currentStep = steps[activeIndex];
	const subtitle = currentStep?.detail?.trim() || currentStep?.label?.trim();

	if (!subtitle) {
		return fallback;
	}

	return subtitle.length > 120 ? `${subtitle.slice(0, 117)}...` : subtitle;
}

function LiveThinkingPanel({
	steps,
	isActive,
	totalDurationMs,
	variant = "deep-thinking",
}: {
	steps: ThinkingStep[];
	isActive: boolean;
	totalDurationMs?: number;
	variant?: "responding" | "deep-thinking" | "agent-active";
}) {
	const [collapsed, setCollapsed] = useState(false);
	const [elapsed, setElapsed] = useState(totalDurationMs ?? 0);
	const startedAtRef = useRef(Date.now());
	const normalizedSteps = steps.length ? steps : DEFAULT_THINKING_STEPS;
	const visibleCount = useVisibleThinkingSteps(normalizedSteps, isActive);
	const displayElapsed = totalDurationMs ?? elapsed;
	const isDone = !isActive;
	const rotatingSubtitle = useRotatingSubtitle(isActive);
	const subtitle = getActiveThinkingSubtitle(
		normalizedSteps,
		visibleCount,
		isActive,
		rotatingSubtitle,
	);

	useEffect(() => {
		if (!isActive) {
			setElapsed((current) => totalDurationMs ?? current);
			setCollapsed(true);
			return;
		}

		setCollapsed(true);
		startedAtRef.current = Date.now() - (totalDurationMs ?? 0);
		const interval = window.setInterval(() => {
			setElapsed(Date.now() - startedAtRef.current);
		}, 100);

		return () => window.clearInterval(interval);
	}, [isActive, totalDurationMs]);

	if (isDone && collapsed) {
		return (
			<button
				className="mb-4 flex items-center gap-2 text-[11px] text-[#777] transition-colors hover:text-[#ccc]"
				onClick={() => setCollapsed(false)}
				type="button"
			>
				<span className="size-1.5 rounded-full bg-[#555]" />
				<span>
					Selesai berpikir · {normalizedSteps.length} langkah ·{" "}
					{formatDuration(displayElapsed)}
				</span>
				<ChevronDown className="size-3" />
			</button>
		);
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"mb-5 overflow-hidden rounded-[14px] border shadow-sm",
				variant === "agent-active"
					? "border-[#2a2a2a] bg-[#1a1a1a]"
					: "border-[#2a2a2a] bg-[#1a1a1a]",
			)}
			initial={{ opacity: 0, y: 6 }}
			transition={{ duration: 0.28, ease }}
		>
			<button
				aria-expanded={!collapsed}
				className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.015]"
				onClick={() => setCollapsed((value) => !value)}
				type="button"
			>
				<div className="flex min-w-0 flex-1 items-start gap-3">
					<div className="flex pt-1">
						{[0, 1, 2].map((dot) => (
							<motion.span
								animate={{ opacity: [0.3, 1, 0.3], scale: [0.92, 1, 0.92] }}
								className="mr-1 size-1.5 rounded-full bg-[#4a90e2]"
								key={dot}
								transition={{
									delay: dot * 0.2,
									duration: 1.1,
									ease: "easeInOut",
									repeat: Number.POSITIVE_INFINITY,
								}}
							/>
						))}
					</div>
					<div className="min-w-0">
						<div className="text-[13px] font-medium text-[#ccc]">
							{isActive ? "Berpikir..." : "Selesai berpikir"}
						</div>
						<div className="mt-0.5 text-[11px] text-[#777]">
							{isDone ? "Pemrosesan selesai" : subtitle}
						</div>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2 pt-0.5 text-[12px] text-[#777]">
					<span className="tabular-nums text-[#777]">
						{(displayElapsed / 1000).toFixed(1)}s
					</span>
					<ChevronDown
						className={cn(
							"size-3 transition-transform duration-200",
							!collapsed && "rotate-180",
						)}
					/>
				</div>
			</button>

			<div
				className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
				style={{
					maxHeight: collapsed ? 0 : 240,
					opacity: collapsed ? 0 : 1,
				}}
			>
				<div className="border-[#2a2a2a] border-t px-4 pb-4 pt-3">
					<div className="space-y-3">
						{normalizedSteps.slice(0, visibleCount).map((step, index) => {
							const isDoneStep = step.status === "done" || (!isActive && index < normalizedSteps.length - 1);
							const isActiveStep =
								isActive && index === Math.min(visibleCount - 1, normalizedSteps.length - 1);

							return (
								<div
									className="flex items-start gap-3"
									key={step.id}
								>
									<div className="flex size-4 shrink-0 items-center justify-center pt-0.5">
										{isDoneStep ? (
											<CheckCircle2 className="size-3.5 text-[#3ecf8e]" />
										) : isActiveStep ? (
											<span className="size-3.5 animate-spin rounded-full border border-[#555] border-t-[#4a90e2]" />
										) : (
											<Circle className="size-3.5 text-[#555]" />
										)}
									</div>
									<div className="min-w-0">
										<div
											className={cn(
												"text-[13px] leading-5",
												isActiveStep
													? "text-[#ccc]"
													: isDoneStep
														? "text-[#b8b8b8]"
														: "text-[#777]",
											)}
										>
											{step.label}
										</div>
										{step.detail ? (
											<div className="mt-0.5 text-[11px] text-[#555]">
												{step.detail}
											</div>
										) : null}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

function StaticAgentThinkingPanel({
	status,
	steps,
	totalDuration,
	defaultCollapsed,
	variant = "agent-active",
}: Pick<
	AgentThinkingPanelProps,
	"status" | "steps" | "totalDuration" | "defaultCollapsed" | "variant"
>) {
	const safeSteps = Array.isArray(steps) ? steps.filter(Boolean) : [];
	const [collapsed, setCollapsed] = useState(
		defaultCollapsed ?? status === "done",
	);
	const elapsed = useElapsedTimer(
		status === "thinking" || status === "executing",
		totalDuration,
	);
	const visibleSteps = useMemo(
		() =>
			safeSteps.length
				? safeSteps
				: [
						{
							id: "analyze",
							type: "thought" as const,
							label: "Menganalisis permintaan",
							status: "running" as const,
						},
						{
							id: "context",
							type: "thought" as const,
							label: "Memeriksa konteks percakapan",
							status: "pending" as const,
						},
						{
							id: "plan",
							type: "thought" as const,
							label: "Menyusun rencana eksekusi",
							status: "pending" as const,
						},
					],
		[safeSteps],
	);
	const stepCount = Math.max(safeSteps.length, visibleSteps.length);

	useEffect(() => {
		if (status === "thinking" || status === "executing" || status === "error") {
			setCollapsed(false);
		}
		if (status === "done") {
			setCollapsed(defaultCollapsed ?? true);
		}
	}, [defaultCollapsed, status]);

	const title =
		status === "executing"
			? "Menjalankan"
			: status === "error"
				? "Proses berhenti"
				: status === "done"
					? "Selesai berpikir"
					: "Berpikir...";

	return (
		<motion.div className="my-3 w-full max-w-2xl" layout="position">
			<button
				className={cn(
					"flex w-full items-center gap-2 text-[11px] text-white/30 transition-colors hover:text-white/45",
					!collapsed &&
						"rounded-t-[22px] border border-white/[0.06] border-b-0 bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(17,19,24,0.96))] px-4 pt-3 pb-2",
				)}
				onClick={() => setCollapsed((value) => !value)}
				type="button"
			>
				{status === "executing" ? (
					<Zap className="size-3 text-indigo-400/70" />
				) : (
					<span className="relative flex size-3 items-center justify-center">
						<span
							className={cn(
								"absolute size-2 rounded-full",
								status === "error" ? "bg-red-400/60" : "bg-green-400/60",
								status !== "done" && "animate-ping",
							)}
						/>
						<span
							className={cn(
								"relative size-1.5 rounded-full",
								status === "error" ? "bg-red-400/70" : "bg-indigo-400/80",
							)}
						/>
					</span>
				)}
				<span className="min-w-0 flex-1 text-left">
					{collapsed
						? `${title} · ${stepCount} langkah · ${formatDuration(elapsed)}`
						: title}
				</span>
				{!collapsed ? (
					<span className="text-white/25">{formatDuration(elapsed)}</span>
				) : null}
				<ChevronDown
					className={cn(
						"size-3 transition-transform duration-200",
						!collapsed && "rotate-180",
					)}
				/>
			</button>

			<AnimatePresence initial={false}>
				{!collapsed ? (
					<motion.div
						animate={{ height: "auto", opacity: 1 }}
						className="overflow-hidden"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.28, ease }}
					>
						<div
							className={cn(
								"rounded-b-[22px] border p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
								status === "error"
									? "border-red-400/15 bg-red-950/10"
									: variant === "agent-active"
										? "border-indigo-400/14 bg-[linear-gradient(180deg,rgba(99,102,241,0.05),rgba(17,19,24,0.98))]"
										: "border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(17,19,24,0.98))]",
							)}
						>
							<motion.div
								animate="show"
								className="space-y-1.5 border-white/5 border-t pt-3"
								initial="hidden"
								variants={{
									hidden: {},
									show: {
										transition: {
											staggerChildren: 0.15,
										},
									},
								}}
							>
								{visibleSteps.map((step, index) => (
									<AgentStepRow
										index={index}
										key={step.id || `${step.label}-${index}`}
										step={step}
									/>
								))}
							</motion.div>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
			{status === "done" && collapsed ? (
				<AgentSummary finalDuration={elapsed} steps={safeSteps} />
			) : null}
		</motion.div>
	);
}

export function AgentThinkingPanel({
	status,
	steps,
	totalDuration,
	defaultCollapsed,
	isActive,
	totalDurationMs,
	liveSteps,
	variant = "agent-active",
}: AgentThinkingPanelProps) {
	const safeSteps = Array.isArray(steps) ? steps.filter(Boolean) : [];
	const safeLiveSteps = Array.isArray(liveSteps) ? liveSteps.filter(Boolean) : [];

	if (variant !== "agent-active") {
		return (
			<LiveThinkingPanel
				isActive={Boolean(isActive)}
				steps={safeLiveSteps}
				totalDurationMs={totalDurationMs}
				variant={variant}
			/>
		);
	}

	if (!status) {
		return null;
	}

	return (
		<StaticAgentThinkingPanel
			defaultCollapsed={defaultCollapsed}
			status={status}
			steps={safeSteps}
			totalDuration={totalDuration}
			variant={variant}
		/>
	);
}
