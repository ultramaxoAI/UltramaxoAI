"use client";

import {
	CheckCircle2Icon,
	ChevronUpIcon,
	CircleStopIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";

function formatElapsed(startedAt: number | null, endedAt: number | null) {
	if (!startedAt) {
		return "just now";
	}

	const end = endedAt ?? Date.now();
	const seconds = Math.max(0, Math.round((end - startedAt) / 1000));

	if (seconds < 60) {
		return `${seconds}s`;
	}

	return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function getStatusLabel(status: string) {
	switch (status) {
		case "done":
			return "Done";
		case "error":
			return "Needs attention";
		case "executing":
			return "Working";
		default:
			return "Thinking";
	}
}

function StatusIcon({ status }: { status: string }) {
	if (status === "done") {
		return <CheckCircle2Icon className="size-3.5 text-white/55" />;
	}

	if (status === "error") {
		return <XCircleIcon className="size-3.5 text-white/50" />;
	}

	return <Loader2Icon className="size-3.5 animate-spin text-white/55" />;
}

export function AgentDock({
	className,
	stop,
}: {
	className?: string;
	stop?: () => void;
}) {
	const { agentStream } = useDataStream();
	const [expanded, setExpanded] = useState(false);
	const visibleSteps = useMemo(
		() => agentStream.steps.slice(-3).reverse(),
		[agentStream.steps],
	);
	const latestStep = agentStream.steps.at(-1);

	if (agentStream.steps.length === 0) {
		return null;
	}

	return (
		<div className={cn("mx-auto w-full max-w-3xl px-1 sm:px-0", className)}>
			<div className="overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#151515]/95 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04]">
								<StatusIcon status={agentStream.status} />
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<p className="truncate text-[13px] font-medium tracking-[-0.01em] text-white/88">
										Agent mode
									</p>
									<span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45">
										{getStatusLabel(agentStream.status)}
									</span>
								</div>
								<p className="mt-0.5 truncate text-[11px] leading-5 text-white/38">
									{latestStep?.label ?? "Working in the background"} ·{" "}
									{formatElapsed(agentStream.startedAt, agentStream.endedAt)}
								</p>
							</div>
						</div>

						<div className="flex shrink-0 items-center gap-1.5">
							<button
								className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/42 transition-colors hover:bg-white/[0.07] hover:text-white/70"
								onClick={() => setExpanded((value) => !value)}
								type="button"
							>
								<ChevronUpIcon
									className={cn(
										"size-4 transition-transform",
										!expanded && "rotate-180",
									)}
								/>
							</button>
							{stop && agentStream.status !== "done" ? (
								<button
									className="inline-flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/42 transition-colors hover:bg-white/[0.07] hover:text-white/70"
									onClick={stop}
									type="button"
								>
									<CircleStopIcon className="size-4" />
								</button>
							) : null}
						</div>
					</div>
				</div>

				{expanded ? (
					<div className="border-white/[0.07] border-t px-4 py-3">
						<div className="space-y-2">
							{visibleSteps.map((step) => (
								<div
									className="grid grid-cols-[auto_1fr] gap-2 rounded-2xl bg-white/[0.025] px-3 py-2"
									key={step.id}
								>
									<div className="mt-1 size-1.5 rounded-full bg-white/35" />
									<div className="min-w-0">
										<p className="truncate text-[12px] font-medium text-white/70">
											{step.label}
										</p>
										{step.args || step.result ? (
											<p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-white/34">
												{step.result || step.args}
											</p>
										) : null}
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
