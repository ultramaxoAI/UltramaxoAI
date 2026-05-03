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
}

const ease = [0.4, 0, 0.2, 1] as const;

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

function LiveThinkingPanel({
	steps,
	isActive,
	totalDurationMs,
}: {
	steps: ThinkingStep[];
	isActive: boolean;
	totalDurationMs?: number;
}) {
	const [collapsed, setCollapsed] = useState(false);
	const [elapsed, setElapsed] = useState(totalDurationMs ?? 0);
	const startedAtRef = useRef(Date.now());
	const visibleCount = useVisibleThinkingSteps(steps, isActive);
	const displayElapsed = totalDurationMs ?? elapsed;
	const isDone = !isActive;

	useEffect(() => {
		if (!isActive) {
			setElapsed((current) => totalDurationMs ?? current);
			setCollapsed(true);
			return;
		}

		setCollapsed(false);
		startedAtRef.current = Date.now() - (totalDurationMs ?? 0);
		const interval = window.setInterval(() => {
			setElapsed(Date.now() - startedAtRef.current);
		}, 100);

		return () => window.clearInterval(interval);
	}, [isActive, totalDurationMs]);

	if (!steps.length) {
		return null;
	}

	if (isDone && collapsed) {
		return (
			<button
				className="mb-4 flex items-center gap-2 font-mono text-[11px] text-white/30 transition-colors hover:text-white/50"
				onClick={() => setCollapsed(false)}
				type="button"
			>
				<span className="size-1.5 rounded-full bg-white/20" />
				<span>
					Selesai berpikir · {steps.length} langkah ·{" "}
					{formatDuration(displayElapsed)}
				</span>
				<ChevronDown className="size-3" />
			</button>
		);
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="mb-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111318]"
			initial={{ opacity: 0, y: 6 }}
			transition={{ duration: 0.28, ease }}
		>
			<button
				className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
				onClick={() => setCollapsed((value) => !value)}
				type="button"
			>
				<div className="flex items-center gap-2">
					{isActive ? (
						<span className="relative flex size-2">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-indigo-500" />
						</span>
					) : (
						<span className="size-2 rounded-full bg-white/20" />
					)}
					<span className="text-[12px] font-medium text-white/55">
						{isActive ? "Berpikir..." : "Selesai berpikir"}
					</span>
				</div>
				<div className="flex items-center gap-2 text-[11px] text-white/25">
					<span>{formatDuration(displayElapsed)}</span>
					{collapsed ? (
						<ChevronDown className="size-3" />
					) : (
						<ChevronUp className="size-3" />
					)}
				</div>
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
						<div className="space-y-2 border-white/[0.05] border-t px-4 pt-3 pb-4">
							<AnimatePresence>
								{steps.slice(0, visibleCount).map((step, index) => {
									const isCurrentStep = index === visibleCount - 1 && isActive;

									return (
										<motion.div
											animate={{ opacity: 1, x: 0 }}
											className={cn(
												"flex items-start gap-2.5",
												isCurrentStep &&
													"-ml-2 border-indigo-500/40 border-l-2 pl-2",
											)}
											initial={{ opacity: 0, x: -6 }}
											key={step.id}
											transition={{ duration: 0.3, ease }}
										>
											{isCurrentStep ? (
												<Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-indigo-400/80" />
											) : (
												<CheckCircle2 className="mt-0.5 size-3 shrink-0 text-green-400/60" />
											)}
											<div className="min-w-0">
												<span
													className={cn(
														"font-mono text-[12px] leading-relaxed",
														isCurrentStep ? "text-white/70" : "text-white/40",
													)}
												>
													{step.label}
													{isCurrentStep && (
														<span className="ml-1 inline-block h-[0.9em] w-[2px] animate-pulse align-middle bg-indigo-400/60" />
													)}
												</span>
												{step.detail ? (
													<div className="mt-1 font-mono text-[11px] text-white/25">
														{step.detail}
													</div>
												) : null}
											</div>
										</motion.div>
									);
								})}
							</AnimatePresence>

							{isActive && visibleCount < steps.length ? (
								<div className="flex gap-1 pt-1 pl-5">
									{[0, 1, 2].map((dot) => (
										<motion.span
											animate={{ opacity: [0.2, 0.8, 0.2] }}
											className="size-1 rounded-full bg-white/20"
											key={dot}
											transition={{
												delay: dot * 0.2,
												duration: 1.2,
												repeat: Number.POSITIVE_INFINITY,
											}}
										/>
									))}
								</div>
							) : null}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
}

function StaticAgentThinkingPanel({
	status,
	steps,
	totalDuration,
	defaultCollapsed,
}: Pick<
	AgentThinkingPanelProps,
	"status" | "steps" | "totalDuration" | "defaultCollapsed"
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
					"flex w-full items-center gap-2 font-mono text-[11px] text-white/30 transition-colors hover:text-white/45",
					!collapsed &&
						"rounded-t-xl border border-white/[0.06] border-b-0 bg-[#111318] px-4 pt-3 pb-2",
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
								"rounded-b-xl border bg-[#111318] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
								status === "error"
									? "border-red-400/15 bg-red-950/10"
									: "border-white/[0.06]",
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
}: AgentThinkingPanelProps) {
	const safeSteps = Array.isArray(steps) ? steps.filter(Boolean) : [];
	const safeLiveSteps = Array.isArray(liveSteps) ? liveSteps.filter(Boolean) : [];

	if (safeLiveSteps.length > 0) {
		return (
			<LiveThinkingPanel
				isActive={Boolean(isActive)}
				steps={safeLiveSteps}
				totalDurationMs={totalDurationMs}
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
		/>
	);
}
