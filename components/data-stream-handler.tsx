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

type NormalizedArtifactEvent =
	| { type: "artifact-id"; artifactId: string }
	| { type: "artifact-title"; title: string }
	| { type: "artifact-kind"; kind: ArtifactKind }
	| { type: "artifact-clear"; kind?: ArtifactKind }
	| { type: "artifact-partial"; kind: ArtifactKind; content: string }
	| { type: "artifact-finish" };

function inferArtifactKindFromDelta(
	deltaType: string,
	currentKind: ArtifactKind,
): ArtifactKind {
	if (deltaType === "data-codeDelta") return "code";
	if (deltaType === "data-textDelta") return "text";
	if (deltaType === "data-imageDelta") return "image";
	if (deltaType === "data-sheetDelta") return "sheet";
	return currentKind;
}

function normalizeArtifactEvent(
	deltaType: string,
	deltaData: unknown,
	currentKind: ArtifactKind,
): NormalizedArtifactEvent | null {
	if (deltaType === "data-id" && typeof deltaData === "string") {
		return { type: "artifact-id", artifactId: deltaData };
	}

	if (deltaType === "data-title" && typeof deltaData === "string") {
		return { type: "artifact-title", title: deltaData };
	}

	if (deltaType === "data-kind") {
		return { type: "artifact-kind", kind: deltaData as ArtifactKind };
	}

	if (deltaType === "data-clear") {
		return { type: "artifact-clear", kind: currentKind };
	}

	if (
		(deltaType === "data-codeDelta" ||
			deltaType === "data-textDelta" ||
			deltaType === "data-imageDelta" ||
			deltaType === "data-sheetDelta") &&
		typeof deltaData === "string"
	) {
		return {
			type: "artifact-partial",
			kind: inferArtifactKindFromDelta(deltaType, currentKind),
			content: deltaData,
		};
	}

	if (deltaType === "data-finish") {
		return { type: "artifact-finish" };
	}

	return null;
}

export function DataStreamHandler() {
	const {
		dataStream,
		setDataStream,
		setAgentStream,
		artifactStream,
		setArtifactStream,
	} = useDataStream();
	const { mutate } = useSWRConfig();
	const wc = useWebContainerOptional();
	const { artifact, setArtifact, setMetadata } = useArtifact();

	useEffect(() => {
		if (!dataStream?.length) {
			return;
		}

		const newDeltas = dataStream.slice();
		setDataStream([]);

		let currentKind = artifact?.kind ?? initialArtifactData.kind;

		for (const delta of newDeltas) {
			const deltaType = delta.type as string;
			const deltaData = (delta as { data?: unknown }).data;

			if (deltaType === "data-chat-title") {
				mutate(unstable_serialize(getChatHistoryPaginationKey));
				continue;
			}

			const adaptiveThinkingEvent = normalizeAdaptiveThinkingDataEvent(
				deltaType,
				deltaData,
			);
			if (adaptiveThinkingEvent) {
				dispatchAdaptiveThinkingEventObject(adaptiveThinkingEvent);
				continue;
			}

			if (
				deltaType.startsWith("data-agent-") ||
				deltaType.startsWith("agent:")
			) {
				const data =
					typeof deltaData === "string"
						? safeJsonParse(deltaData)
						: isRecord(deltaData)
							? deltaData
							: {};
				const eventName = deltaType.startsWith("agent:")
					? deltaType
					: deltaType.replace(/^data-agent-/, "agent:");

				dispatchAdaptiveThinkingEvent(eventName, data);

				setAgentStream((current) => {
					const now = Date.now();

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

			currentKind = inferArtifactKindFromDelta(deltaType, currentKind);
			const normalizedArtifactEvent = normalizeArtifactEvent(
				deltaType,
				deltaData,
				currentKind,
			);

			if (normalizedArtifactEvent) {
				if (normalizedArtifactEvent.type === "artifact-kind") {
					currentKind = normalizedArtifactEvent.kind;
				}

				if (
					normalizedArtifactEvent.type === "artifact-clear" &&
					normalizedArtifactEvent.kind
				) {
					currentKind = normalizedArtifactEvent.kind;
				}

				if (normalizedArtifactEvent.type === "artifact-partial") {
					currentKind = normalizedArtifactEvent.kind;
				}
				setArtifactStream((currentStream) => {
					switch (normalizedArtifactEvent.type) {
						case "artifact-id":
							return {
								...currentStream,
								artifactId: normalizedArtifactEvent.artifactId,
								updatedAt: Date.now(),
							};
						case "artifact-title":
							return {
								...currentStream,
								title: normalizedArtifactEvent.title,
								updatedAt: Date.now(),
							};
						case "artifact-kind":
							return {
								...currentStream,
								kind: normalizedArtifactEvent.kind,
								updatedAt: Date.now(),
							};
						case "artifact-clear":
							return {
								...currentStream,
								kind: normalizedArtifactEvent.kind ?? currentStream.kind,
								content: "",
								lifecycle: "pending",
								updatedAt: Date.now(),
								error: undefined,
							};
						case "artifact-partial":
							return {
								...currentStream,
								kind: normalizedArtifactEvent.kind,
								content:
									normalizedArtifactEvent.kind === "text"
										? `${currentStream.kind === "text" ? currentStream.content : ""}${normalizedArtifactEvent.content}`
										: normalizedArtifactEvent.content,
								lifecycle:
									normalizedArtifactEvent.content.length > 0 ? "streaming" : "pending",
								updatedAt: Date.now(),
								error: undefined,
							};
						case "artifact-finish": {
							const normalizedContent = currentStream.content.trim();
							const shouldCompleteCodeWorkspace =
								currentStream.kind === "code" && Boolean(currentStream.artifactId);
							return {
								...currentStream,
								lifecycle:
									normalizedContent.length > 0 || shouldCompleteCodeWorkspace
										? "completed"
										: "idle",
								updatedAt: Date.now(),
							};
						}
					}
				});

				setArtifact((currentArtifact) => {
					const baseArtifact = currentArtifact ?? initialArtifactData;
					switch (normalizedArtifactEvent.type) {
						case "artifact-id":
							return {
								...baseArtifact,
								documentId: normalizedArtifactEvent.artifactId,
							};
						case "artifact-title":
							return {
								...baseArtifact,
								title: normalizedArtifactEvent.title,
							};
						case "artifact-kind":
							return {
								...baseArtifact,
								kind: normalizedArtifactEvent.kind,
							};
						case "artifact-clear":
							return {
								...baseArtifact,
								kind: normalizedArtifactEvent.kind ?? baseArtifact.kind,
								content: "",
								status: "streaming",
								streamState: "pending",
							};
						case "artifact-partial": {
							const nextContent =
								normalizedArtifactEvent.kind === "text"
									? `${baseArtifact.kind === "text" ? baseArtifact.content : ""}${normalizedArtifactEvent.content}`
									: normalizedArtifactEvent.content;
							return {
								...baseArtifact,
								kind: normalizedArtifactEvent.kind,
								content: nextContent,
								status: "streaming",
								streamState: nextContent.trim().length > 0 ? "streaming" : "pending",
							};
						}
						case "artifact-finish": {
							const normalizedContent = baseArtifact.content.trim();
							const shouldCompleteCodeWorkspace =
								baseArtifact.kind === "code" && baseArtifact.documentId !== "init";
							return {
								...baseArtifact,
								status: "idle",
								streamState:
									normalizedContent.length > 0 || shouldCompleteCodeWorkspace
										? "completed"
										: "idle",
								isVisible:
									baseArtifact.isVisible ||
									normalizedContent.length > 0 ||
									shouldCompleteCodeWorkspace,
							};
						}
					}
				});
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
		}
	}, [
		artifact,
		artifactStream.lifecycle,
		dataStream,
		mutate,
		setAgentStream,
		setArtifact,
		setArtifactStream,
		setDataStream,
		setMetadata,
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

type AdaptiveThinkingEvent =
	| { type: "thinking_start" }
	| { type: "upgrade_to_agent" }
	| { type: "thinking_chunk"; content: string }
	| { type: "response_chunk"; content: string }
	| { type: "done"; durationMs?: number };

function dispatchAdaptiveThinkingEventObject(event: AdaptiveThinkingEvent) {
	window.dispatchEvent(
		new CustomEvent("ultramaxo-thinking-event", { detail: event }),
	);
}

function dispatchAdaptiveThinkingEvent(
	eventName: string,
	data: Record<string, unknown>,
) {
	if (
		eventName === "agent:thinking" ||
		eventName === "agent:tool_start" ||
		eventName === "agent:tool_done"
	) {
		dispatchAdaptiveThinkingEventObject({ type: "upgrade_to_agent" });
	}

	if (eventName === "agent:thinking") {
		const content = getAdaptiveContent(data);
		if (content) {
			dispatchAdaptiveThinkingEventObject({ content, type: "thinking_chunk" });
		}
	}

	if (eventName === "agent:done") {
		const durationMs =
			typeof data.duration === "number" ? data.duration : undefined;
		dispatchAdaptiveThinkingEventObject({ durationMs, type: "done" });
	}
}

function normalizeAdaptiveThinkingDataEvent(
	deltaType: string,
	deltaData: unknown,
): AdaptiveThinkingEvent | null {
	const normalizedType = deltaType.startsWith("data-")
		? deltaType.slice("data-".length)
		: deltaType;
	const data =
		typeof deltaData === "string"
			? safeJsonParse(deltaData)
			: isRecord(deltaData)
				? deltaData
				: {};

	if (normalizedType === "thinking_start") {
		return { type: "thinking_start" };
	}

	if (normalizedType === "upgrade_to_agent") {
		return { type: "upgrade_to_agent" };
	}

	if (normalizedType === "thinking_chunk") {
		const content =
			typeof deltaData === "string" ? deltaData : getAdaptiveContent(data);
		return content ? { content, type: "thinking_chunk" } : null;
	}

	if (normalizedType === "response_chunk") {
		const content =
			typeof deltaData === "string" ? deltaData : getAdaptiveContent(data);
		return content ? { content, type: "response_chunk" } : null;
	}

	if (normalizedType === "done" || normalizedType === "thinking_done") {
		const durationMs =
			typeof data.durationMs === "number"
				? data.durationMs
				: typeof data.duration === "number"
					? data.duration
					: undefined;
		return { durationMs, type: "done" };
	}

	return null;
}

function getAdaptiveContent(data: Record<string, unknown>) {
	const content =
		data.content ??
		data.text ??
		data.thinking ??
		data.detail ??
		data.label ??
		data.title ??
		data.message;
	return typeof content === "string" && content.length > 0 ? content : "";
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
	const rawLabel =
		typeof data.label === "string"
			? data.label
			: typeof data.tool === "string"
				? data.tool
				: typeof data.title === "string"
					? data.title
					: type === "tool_call"
						? "tool_call"
						: "Menganalisis permintaan";
	const label = formatAgentStepLabel(rawLabel);
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

function formatAgentStepLabel(label: string) {
	const normalized = label.trim();

	const friendlyMap: Record<string, string> = {
		startAgentTask: "Memahami tugas",
		reportAgentStep: "Mencatat progres kerja",
		listCodeFiles: "Membaca struktur file",
		createCodeFile: "Membuat file kode",
		createFile: "Membuat file",
		createFolder: "Membuat folder",
		updateCodeFile: "Memperbarui file kode",
		editFile: "Mengubah file",
		deleteCodeFile: "Menghapus file kode",
		readFile: "Membaca file",
		listFiles: "Memeriksa isi folder",
		runCommand: "Menjalankan perintah",
		executeTerminalCommand: "Menjalankan terminal",
		installPackage: "Menambahkan package",
		installDependency: "Memasang dependency",
		startPreviewServer: "Menyalakan preview",
		runWorkspaceCommand: "Menjalankan workspace",
		createDocument: "Menyiapkan dokumen",
		updateDocument: "Memperbarui dokumen",
	};

	return friendlyMap[normalized] ?? normalized;
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
