"use client";

import {
	BrainCircuitIcon,
	Loader2Icon,
	PauseIcon,
	PlayIcon,
	SquareIcon,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/utils";

type AgentStep = {
	id: string;
	title: string;
	status: "in_progress" | "completed";
	detail: string;
	files: string[];
	packages: string[];
	command: string | null;
};

type AgentRun = {
	id: string;
	mode: "fullstack" | "mobile";
	goal: string;
	plan: string[];
	deliverable: string;
	status: "running" | "paused" | "completed" | "cancelled";
	updatedAt: string;
	steps: AgentStep[];
};

export function AgentRunsPanel() {
	const { data, isLoading, mutate } = useSWR<{ runs: AgentRun[] }>(
		"/api/user/agent-runs",
		fetcher,
	);

	const updateStatus = async (
		runId: string,
		status: "running" | "paused" | "completed" | "cancelled",
	) => {
		try {
			const response = await fetch("/api/user/agent-runs", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ runId, status }),
			});

			if (!response.ok) throw new Error();
			mutate();
			toast.success(`Agent ${status}`);
		} catch {
			toast.error("Failed to update agent status");
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center text-zinc-500">
				<Loader2Icon className="h-7 w-7 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<div className="flex items-center gap-2 text-zinc-900 dark:text-white">
					<BrainCircuitIcon size={20} />
					<h1 className="text-2xl font-semibold tracking-tight">Agent Runs</h1>
				</div>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Monitor autonomous fullstack and mobile agent sessions.
				</p>
			</header>

			<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 text-sm leading-7 text-zinc-600 dark:border-white/5 dark:bg-[#101010] dark:text-zinc-300">
				Use this panel to review how the agent planned the job, which steps were
				recorded, and whether a run is still active, paused, or already stopped.
				For cleaner output, start fullstack jobs with a concrete deliverable,
				target stack, and file scope.
			</div>

			{data?.runs?.length ? (
				<div className="space-y-4">
					{data.runs.map((run) => (
						<div
							className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/5 dark:bg-[#101010]"
							key={run.id}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
											{run.goal}
										</h2>
										<span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] dark:bg-zinc-800">
											{run.mode}
										</span>
										<span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] dark:bg-zinc-800">
											{run.status}
										</span>
									</div>
									<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
										{run.deliverable}
									</p>
								</div>
								<div className="flex gap-2">
									{run.status === "running" ? (
										<Button
											onClick={() => void updateStatus(run.id, "paused")}
											size="sm"
											type="button"
											variant="outline"
										>
											<PauseIcon className="mr-1.5 h-3.5 w-3.5" />
											Pause
										</Button>
									) : run.status === "paused" ? (
										<Button
											onClick={() => void updateStatus(run.id, "running")}
											size="sm"
											type="button"
											variant="outline"
										>
											<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
											Resume
										</Button>
									) : null}
									{run.status !== "completed" && run.status !== "cancelled" ? (
										<Button
											onClick={() => void updateStatus(run.id, "cancelled")}
											size="sm"
											type="button"
											variant="outline"
										>
											<SquareIcon className="mr-1.5 h-3.5 w-3.5" />
											Stop
										</Button>
									) : null}
								</div>
							</div>

							<div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
								<div className="rounded-xl border border-zinc-200/80 p-4 dark:border-white/6">
									<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										Plan
									</div>
									<ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
										{run.plan.map((planItem) => (
											<li key={`${run.id}-${planItem}`}>- {planItem}</li>
										))}
									</ul>
								</div>

								<div className="rounded-xl border border-zinc-200/80 p-4 dark:border-white/6">
									<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										Steps
									</div>
									<div className="space-y-3">
										{run.steps.length ? (
											run.steps.map((step) => (
												<div
													className="rounded-xl bg-zinc-50/70 p-3 dark:bg-white/4"
													key={step.id}
												>
													<div className="flex items-center justify-between gap-3">
														<p className="text-sm font-medium text-zinc-900 dark:text-white">
															{step.title}
														</p>
														<span className="text-[11px] text-zinc-500 dark:text-zinc-400">
															{step.status}
														</span>
													</div>
													<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
														{step.detail}
													</p>
												</div>
											))
										) : (
											<div className="text-sm text-zinc-500 dark:text-zinc-400">
												No agent steps recorded yet.
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-zinc-200 px-5 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
					No agent runs yet. Use fullstack or mobile mode in chat to start one.
				</div>
			)}
		</div>
	);
}
