"use client";

import { ChevronUpIcon, CircleStopIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AgentModeBar } from "./AgentModeBar";
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
			return "done";
		case "error":
			return "working";
		case "executing":
			return "working";
		default:
			return "working";
	}
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
			<div className="overflow-hidden rounded-[16px] border border-white/[0.08] bg-transparent text-white">
				<div className="px-0 py-0">
					<div className="flex items-center gap-2">
						<div className="min-w-0 flex-1">
							<AgentModeBar
								status={getStatusLabel(agentStream.status)}
								subtitles={visibleSteps.length > 0
									? visibleSteps.map(
										(step) => `${step.label} · ${formatElapsed(agentStream.startedAt, agentStream.endedAt)}`,
									)
									: [`${latestStep?.label ?? "Menyiapkan dokumen"} · ${formatElapsed(agentStream.startedAt, agentStream.endedAt)}`]}
							/>
						</div>
						<button
							className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-white/[0.07] bg-white/[0.04] text-white/30 transition-colors hover:bg-white/[0.07]"
							onClick={() => setExpanded((value) => !value)}
							type="button"
						>
							<ChevronUpIcon
								className={cn("size-3.5 transition-transform", !expanded && "rotate-180")}
							/>
						</button>
						{stop && agentStream.status !== "done" ? (
							<button
								className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-white/[0.07] bg-white/[0.04] text-white/30 transition-colors hover:bg-white/[0.07]"
								onClick={stop}
								type="button"
							>
								<CircleStopIcon className="size-3.5" />
							</button>
						) : null}
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
