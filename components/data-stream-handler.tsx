"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { ArtifactKind } from "@/components/artifact";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import type { AgentThinkingStep } from "./agent-thinking-panel";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { useWebContainerOptional } from "./webcontainer-provider";

export function DataStreamHandler() {
	const { dataStream, setDataStream, setAgentStream } = useDataStream();
	const { mutate } = useSWRConfig();
	const wc = useWebContainerOptional();

	const { artifact, setArtifact, setMetadata } = useArtifact();
	const artifactVisibilityTypes = [
		"data-textDelta",
		"data-imageDelta",
		"data-sheetDelta",
	];

	useEffect(() => {
		if (!dataStream?.length) {
			return;
		}

		const newDeltas = dataStream.slice();
		setDataStream([]);

		let currentKind = artifact?.kind ?? initialArtifactData.kind;

		for (const delta of newDeltas) {
			// Cast for custom event type comparisons
			const deltaType = delta.type as string;
			const deltaData = (delta as { data?: unknown }).data;

			// Handle chat title updates
			if (deltaType === "data-chat-title") {
				mutate(unstable_serialize(getChatHistoryPaginationKey));
				continue;
			}

			if (
				deltaType.startsWith("data-agent-") ||
				deltaType.startsWith("agent:")
			) {
				setAgentStream((current) => {
					const now = Date.now();
					const data =
						typeof deltaData === "string"
							? safeJsonParse(deltaData)
							: isRecord(deltaData)
								? deltaData
								: {};
					const eventName = deltaType.startsWith("agent:")
						? deltaType
						: deltaType.replace(/^data-agent-/, "agent:");

					if (eventName === "agent:thinking") {
						return {
							status: "thinking",
							startedAt: current.startedAt ?? now,
							endedAt: null,
							steps: [
								...current.steps,
								normalizeAgentStep(data, current.steps.length, "thought"),
							],
						};
					}

					if (eventName === "agent:tool_start") {
						const nextStep = normalizeAgentStep(
							data,
							current.steps.length,
							"tool_call",
							"running",
						);
						return {
							...current,
							status: "executing",
							startedAt: current.startedAt ?? now,
							endedAt: null,
							steps: upsertAgentStep(current.steps, nextStep),
						};
					}

					if (eventName === "agent:tool_done") {
						const nextStep = normalizeAgentStep(
							data,
							current.steps.length,
							"tool_call",
							data.status === "error" ? "error" : "done",
						);
						return {
							...current,
							status: nextStep.status === "error" ? "error" : "executing",
							steps: upsertAgentStep(current.steps, nextStep),
						};
					}

					if (eventName === "agent:done") {
						return {
							...current,
							status: data.status === "error" ? "error" : "done",
							endedAt: now,
						};
					}

					return current;
				});
				window.dispatchEvent(
					new CustomEvent("ultramaxo-agent-stream", {
						detail: { type: deltaType, data: deltaData },
					}),
				);
				continue;
			}

			// ── WebContainer terminal events ──────────────────────────────
			if (deltaType === "data-terminal-command" && wc) {
				try {
					const { command, purpose } = JSON.parse(deltaData as string);
					wc.queueCommand(command, purpose);
				} catch (e) {
					console.error("[DataStream] Failed to parse terminal command:", e);
				}
				continue;
			}

			if (deltaType === "data-install-package" && wc) {
				try {
					const { packages, purpose } = JSON.parse(deltaData as string);
					wc.queueInstall(packages, purpose);
				} catch (e) {
					console.error("[DataStream] Failed to parse install event:", e);
				}
				continue;
			}

			if (deltaType === "data-start-dev-server" && wc) {
				wc.queueDevServer();
				continue;
			}
			// ── End WebContainer events ───────────────────────────────────

			if (delta.type === "data-kind") {
				currentKind = delta.data as ArtifactKind;
			}

			const artifactDefinition = artifactDefinitions.find(
				(currentArtifactDefinition) =>
					currentArtifactDefinition.kind === currentKind,
			);

			if (artifactDefinition?.onStreamPart) {
				try {
					artifactDefinition.onStreamPart({
						streamPart: delta,
						setArtifact,
						setMetadata,
					});
				} catch (error) {
					console.error("Failed to handle artifact stream part:", error, delta);
				}
			}

			try {
				setArtifact((draftArtifact) => {
					if (!draftArtifact) {
						return { ...initialArtifactData, status: "streaming" };
					}
					const shouldForceVisible = artifactVisibilityTypes.includes(delta.type);

					switch (delta.type) {
						case "data-id":
							return {
								...draftArtifact,
								documentId: delta.data,
								status: "streaming",
							};

						case "data-title":
							return {
								...draftArtifact,
								title: delta.data,
								status: "streaming",
							};

						case "data-kind":
							return {
								...draftArtifact,
								kind: delta.data,
								status: "streaming",
							};

						case "data-clear":
							return {
								...draftArtifact,
								content: "",
								status: "streaming",
							};

						case "data-finish":
							return {
								...draftArtifact,
								isVisible:
									draftArtifact.isVisible ||
									shouldForceVisible ||
									Boolean(draftArtifact.content?.trim()),
								status: "idle",
							};

						default:
							return shouldForceVisible
								? {
										...draftArtifact,
										isVisible: true,
								  }
								: draftArtifact;
					}
				});
			} catch (error) {
				console.error("Failed to create artifact:", error, delta);
			}
		}
	}, [
		dataStream,
		setArtifact,
		setMetadata,
		artifact,
		setDataStream,
		setAgentStream,
		mutate,
		wc,
	]);

	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function safeJsonParse(value: string) {
	try {
		const parsed = JSON.parse(value);
		return isRecord(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

function normalizeAgentStep(
	data: Record<string, unknown>,
	index: number,
	type: AgentThinkingStep["type"],
	status?: AgentThinkingStep["status"],
): AgentThinkingStep {
	const id =
		typeof data.id === "string"
			? data.id
			: typeof data.toolCallId === "string"
				? data.toolCallId
				: `${type}-${index}`;
	const label =
		typeof data.label === "string"
			? data.label
			: typeof data.tool === "string"
				? data.tool
				: typeof data.title === "string"
					? data.title
					: type === "tool_call"
						? "tool_call"
						: "Menganalisis permintaan";
	const args =
		typeof data.args === "string"
			? data.args
			: data.input !== undefined
				? stringifyCompact(data.input)
				: undefined;
	const result =
		typeof data.result === "string"
			? data.result
			: data.output !== undefined
				? stringifyCompact(data.output)
				: undefined;
	const duration =
		typeof data.duration === "number" ? data.duration : undefined;

	return {
		id,
		type,
		label,
		args,
		result,
		status:
			status ??
			(data.status === "pending" ||
			data.status === "running" ||
			data.status === "done" ||
			data.status === "error"
				? data.status
				: "running"),
		duration,
	};
}

function stringifyCompact(value: unknown) {
	if (typeof value === "string") {
		return value.length > 120 ? `${value.slice(0, 117)}...` : value;
	}

	try {
		const text = JSON.stringify(value);
		return text.length > 140 ? `${text.slice(0, 137)}...` : text;
	} catch {
		return String(value);
	}
}

function upsertAgentStep(
	steps: AgentThinkingStep[],
	nextStep: AgentThinkingStep,
) {
	const existingIndex = steps.findIndex((step) => step.id === nextStep.id);
	if (existingIndex === -1) {
		return [...steps, nextStep];
	}

	return steps.map((step, index) =>
		index === existingIndex ? { ...step, ...nextStep } : step,
	);
}
