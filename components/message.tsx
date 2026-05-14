"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@backend/db/schema";
import {
	BotIcon,
	CheckCircle2Icon,
	Clock3Icon,
	CloudRainIcon,
	ExternalLinkIcon,
	FileCodeIcon,
	FileEditIcon,
	FileTextIcon,
	GlobeIcon,
	LightbulbIcon,
	SparklesIcon as LucideSparklesIcon,
	MonitorSmartphoneIcon,
	PackageIcon,
	PlayIcon,
	SearchIcon,
	SmartphoneIcon,
	TerminalIcon,
	TrashIcon,
	WandSparklesIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { MessageContent } from "./elements/message";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "./elements/tool";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import {
	AgentThinkingPanel,
	type AgentThinkingStep,
	MessageReasoning,
} from "./message-reasoning";
import { ReasoningBlock } from "./AgentUI";
import { PreviewAttachment } from "./preview-attachment";
import { ResponseViewer } from "./response-viewer";
import { Weather, type WeatherAtLocation } from "./weather";

type DocumentToolResultData = {
	id: string;
	title: string;
	kind: "image" | "text" | "code" | "sheet";
	content?: string;
	error?: unknown;
};

type ToolHeaderState =
	| "input-streaming"
	| "input-available"
	| "approval-requested"
	| "approval-responded"
	| "output-available"
	| "output-error"
	| "output-denied";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

type GenericToolPart = {
	type?: string;
	toolName?: string;
	toolCallId?: string;
	state?: string;
	input?: unknown;
	output?: unknown;
	approval?: { id?: string; approved?: boolean };
};

type LocalApprovalState = {
	phase: "approved" | "running" | "possibly-stuck" | "denied";
	startedAt: number;
};

function isTerminalToolState(state?: string) {
	return (
		state === "output-available" ||
		state === "output-error" ||
		state === "output-denied"
	);
}

function getApprovalAwareToolHeaderState(
	state: string | undefined,
	localApprovalState?: LocalApprovalState,
): ToolHeaderState {
	if (isTerminalToolState(state)) {
		return getSafeToolState(state);
	}

	if (localApprovalState?.phase === "possibly-stuck") {
		return "output-error";
	}

	if (
		localApprovalState?.phase === "approved" ||
		localApprovalState?.phase === "running" ||
		state === "approval-responded"
	) {
		return "input-available";
	}

	if (localApprovalState?.phase === "denied") {
		return "output-denied";
	}

	return getSafeToolState(state);
}

function getStringValue(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function getStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
}

type WebSearchSource = {
	title: string;
	url: string;
	domain: string;
	content?: string;
};

function getHostname(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

function getWebSearchSources(output: unknown): WebSearchSource[] {
	const payload = isRecord(output) ? output : {};
	const rawSources = Array.isArray(payload.sources)
		? payload.sources
		: Array.isArray(payload.results)
			? payload.results
			: [];

	return rawSources
		.filter(isRecord)
		.map((source) => {
			const url = getStringValue(source.url);
			const domain = getStringValue(source.domain, url ? getHostname(url) : "web");
			return {
				content: getStringValue(source.content),
				domain,
				title: getStringValue(source.title, domain || "Sumber web"),
				url,
			};
		})
		.filter((source) => source.url)
		.slice(0, 4);
}

function WebSearchSources({ output, state }: { output: unknown; state?: string }) {
	const sources = getWebSearchSources(output);

	if (state !== "output-available" || sources.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3 px-4 py-4">
			<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
				<GlobeIcon className="size-3.5" />
				Sumber Pencarian Web
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{sources.map((source) => (
					<a
						className="group/source rounded-2xl border border-white/[0.12] bg-white/[0.045] p-4 transition-colors hover:border-white/[0.2] hover:bg-white/[0.075]"
						href={source.url}
						key={source.url}
						rel="noreferrer"
						target="_blank"
					>
						<div className="mb-2 flex items-center justify-between gap-3 text-[13px] text-white/62">
							<span className="min-w-0 truncate">{source.domain}</span>
							<ExternalLinkIcon className="size-3.5 shrink-0 opacity-45 transition-opacity group-hover/source:opacity-80" />
						</div>
						<div className="line-clamp-2 text-[15px] leading-[1.45] text-white/90">
							{source.title}
						</div>
						{source.content ? (
							<div className="mt-2 line-clamp-2 text-[13px] leading-[1.55] text-white/58">
								{source.content}
							</div>
						) : null}
					</a>
				))}
			</div>
		</div>
	);
}

function isValidMessagePart(
	part: unknown,
): part is ChatMessage["parts"][number] {
	return Boolean(
		part &&
			typeof part === "object" &&
			"type" in part &&
			typeof (part as { type?: unknown }).type === "string",
	);
}

function getPartState(part: unknown) {
	if (!part || typeof part !== "object" || !("state" in part)) {
		return undefined;
	}

	return typeof (part as { state?: unknown }).state === "string"
		? ((part as { state?: string }).state ?? undefined)
		: undefined;
}

function getNormalizedPartType(part: unknown) {
	if (!part || typeof part !== "object" || !("type" in part)) {
		return "";
	}

	const rawType =
		typeof (part as { type?: unknown }).type === "string"
			? ((part as { type?: string }).type ?? "")
			: "";

	if (
		(rawType === "dynamic-tool" || rawType === "tool-invocation") &&
		typeof (part as { toolName?: unknown }).toolName === "string"
	) {
		const toolName = (part as { toolName?: string }).toolName ?? "";
		return toolName ? `tool-${toolName}` : rawType;
	}

	return rawType;
}

function asToolPart(part: unknown): GenericToolPart {
	return isRecord(part) ? (part as GenericToolPart) : {};
}

function getSafeToolState(state?: string): ToolHeaderState {
	switch (state) {
		case "input-streaming":
		case "input-available":
		case "approval-requested":
		case "approval-responded":
		case "output-available":
		case "output-error":
		case "output-denied":
			return state;
		default:
			return "input-available";
	}
}

function isDuplicateAssistantText(
	fingerprint: string,
	seenFingerprints: Set<string>,
) {
	if (!fingerprint) {
		return false;
	}

	for (const seen of seenFingerprints) {
		if (seen === fingerprint) {
			return true;
		}

		const shorter = seen.length < fingerprint.length ? seen : fingerprint;
		const longer = seen.length < fingerprint.length ? fingerprint : seen;

		if (shorter.length > 24 && longer.includes(shorter)) {
			return true;
		}
	}

	return false;
}

function stringifyCompact(value: unknown) {
	if (value === undefined || value === null || value === "") {
		return "";
	}

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

function formatMessageTimestamp(message: ChatMessage) {
	const createdAt = message.metadata?.createdAt;
	if (!createdAt) {
		return "";
	}

	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	return new Intl.DateTimeFormat("id-ID", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
	}).format(date);
}

function getToolStatus(state?: string): AgentThinkingStep["status"] {
	if (!state) {
		return "pending";
	}

	if (state.includes("denied") || state.includes("error")) {
		return "error";
	}

	if (state.includes("output") || state === "approval-responded") {
		return "done";
	}

	if (state.includes("input") || state.includes("approval")) {
		return "running";
	}

	return "pending";
}

function getAgentThinkingSteps(parts: ChatMessage["parts"]) {
	const steps: AgentThinkingStep[] = [];

	for (const [index, part] of parts.entries()) {
		if (!isValidMessagePart(part)) {
			continue;
		}

		if (part.type === "reasoning" && part.text?.trim()) {
			for (const [lineIndex, line] of part.text
				.split("\n")
				.map((item) => item.trim())
				.filter(Boolean)
				.slice(0, 6)
				.entries()) {
				steps.push({
					id: `thought-${index}-${lineIndex}`,
					type: "thought",
					label: line.replace(/^[-*>]\s*/, ""),
					status:
						getPartState(part) === "streaming" && lineIndex === 0
							? "running"
							: "done",
				});
			}
		}

		const normalizedType = getNormalizedPartType(part);

		if (normalizedType.startsWith("tool-")) {
			const payload = asToolPart(part);
			const label = normalizedType.replace(/^tool-/, "");
			const args = stringifyCompact(payload.input);
			const result = stringifyCompact(payload.output);

			steps.push({
				id: payload.toolCallId ?? `tool-${index}`,
				type: "tool_call",
				label,
				args: args ? `(${args})` : "",
				result,
				status: getToolStatus(payload.state),
			});
		}
	}

	return steps;
}

// ============================================================
// UserTextWithLinks — renders user text with auto-linked URLs
// ============================================================
function UserTextWithLinks({ text }: { text: string }) {
	const urlPattern = /https?:\/\/[^\s<>"'`\]\)]+/g;
	const parts: Array<{ type: "text" | "link"; value: string }> = [];
	let lastIndex = 0;
	let match = urlPattern.exec(text);

	while (match !== null) {
		if (match.index > lastIndex) {
			parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
		}
		// Clean trailing punctuation
		let url = match[0].replace(/[.,;:!?)]+$/, "");
		const openParens = (url.match(/\(/g) || []).length;
		const closeParens = (url.match(/\)/g) || []).length;
		if (closeParens > openParens && url.endsWith(")")) {
			url = url.slice(0, -1);
		}
		parts.push({ type: "link", value: url });
		lastIndex = match.index + url.length;
		urlPattern.lastIndex = lastIndex;
		match = urlPattern.exec(text);
	}
	if (lastIndex < text.length) {
		parts.push({ type: "text", value: text.slice(lastIndex) });
	}

	if (parts.length === 0) {
		return <>{text}</>;
	}

	return (
		<>
			{parts.map((part, index) => {
				if (part.type === "link") {
					let displayUrl: string;
					try {
						const parsed = new URL(part.value);
						const domain = parsed.hostname.replace(/^www\./, "");
						const path = parsed.pathname === "/" ? "" : parsed.pathname;
						const truncatedPath = path.length > 30 ? `${path.slice(0, 27)}...` : path;
						displayUrl = domain + truncatedPath;
					} catch {
						displayUrl = part.value.length > 50 ? `${part.value.slice(0, 47)}...` : part.value;
					}
					return (
						<a
							className="inline-flex items-center gap-1 text-[#60a5fa] underline decoration-[#60a5fa]/30 underline-offset-[3px] transition-all hover:text-[#93c5fd] hover:decoration-[#93c5fd]/50"
							href={part.value}
							key={`user-link-${index}-${part.value}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							{displayUrl}
							<ExternalLinkIcon className="inline-block size-3 shrink-0 opacity-50" />
						</a>
					);
				}
				return <span key={`user-text-${index}`}>{part.value}</span>;
			})}
		</>
	);
}

// ============================================================
// MessageTextPart — renders text with OOM-safe truncation
// ============================================================
function MessageTextPart({
	rawText,
	isHuge,
	maxChars,
	messageRole,
	isLoading,
}: {
	rawText: string;
	isHuge: boolean;
	maxChars: number;
	messageRole: string;
	isLoading: boolean;
}) {
	const [expanded, setExpanded] = useState(false);

	const displayText =
		isHuge && !expanded ? rawText.slice(0, maxChars) : rawText;

	return (
		<div className={cn(messageRole === "user" ? "w-full flex justify-end" : "w-full")}>
			<div
				className={cn({
					"w-fit max-w-[90%] md:max-w-[75%] whitespace-pre-wrap break-words rounded-[22px] bg-[#2f2f2f] px-5 py-2.5 text-left text-[15px] leading-[1.6] text-white/95 shadow-none":
						messageRole === "user",
					"w-full bg-transparent px-0 py-0 text-left text-[15.5px] leading-[1.7] text-white/90 md:text-[16px]":
						messageRole === "assistant",
				})}
				data-testid="message-content"
			>
				{messageRole === "assistant" ? (
					<ResponseViewer
						className={cn(isLoading && "streaming-cursor")}
						hideCodeBlocks={false}
						text={displayText}
						isLoading={isLoading}
					/>
				) : (
					<UserTextWithLinks text={displayText} />
				)}
			</div>
			{isHuge && !expanded && (
				<div className="mt-2 text-center">
					<button
						className="rounded-full border border-white/8 bg-white/6 px-4 py-2 text-xs text-white/70 transition-colors hover:bg-white/10"
						onClick={() => setExpanded(true)}
						type="button"
					>
						Pesan ini sangat panjang ({(rawText.length / 1000).toFixed(0)}KB).
						Klik untuk tampilkan semua.
					</button>
				</div>
			)}
		</div>
	);
}

const PurePreviewMessage = ({
	addToolApprovalResponse,
	chatId,
	message,
	vote,
	isLoading,
	setMessages,
	regenerate,
	isReadonly,
	requiresScrollPadding: _requiresScrollPadding,
}: {
	addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
	chatId: string;
	message: ChatMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	isReadonly: boolean;
	requiresScrollPadding: boolean;
}) => {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [localApprovalStates, setLocalApprovalStates] = useState<
		Record<string, LocalApprovalState>
	>({});
	useEffect(() => {
		const interval = window.setInterval(() => {
			const now = Date.now();
			setLocalApprovalStates((current) => {
				let changed = false;
				const next = { ...current };

				for (const [toolCallId, approvalState] of Object.entries(current)) {
					if (
						approvalState.phase === "approved" &&
						now - approvalState.startedAt > 600
					) {
						next[toolCallId] = { ...approvalState, phase: "running" };
						changed = true;
					}

					if (
						approvalState.phase === "running" &&
						now - approvalState.startedAt > 10_000
					) {
						next[toolCallId] = { ...approvalState, phase: "possibly-stuck" };
						changed = true;
					}
				}

				return changed ? next : current;
			});
		}, 500);

		return () => window.clearInterval(interval);
	}, []);

	useEffect(() => {
		const toolParts = (Array.isArray(message.parts) ? message.parts : []).filter(
			isValidMessagePart,
		);

		setLocalApprovalStates((current) => {
			let changed = false;
			const next = { ...current };
			const liveToolCallIds = new Set<string>();

			for (const part of toolParts) {
				const normalizedType = getNormalizedPartType(part);
				if (!normalizedType.startsWith("tool-")) {
					continue;
				}

				const payload = asToolPart(part);
				const toolCallId = payload.toolCallId;
				if (!toolCallId) {
					continue;
				}

				liveToolCallIds.add(toolCallId);

				if (isTerminalToolState(payload.state)) {
					if (toolCallId in next) {
						delete next[toolCallId];
						changed = true;
					}
					continue;
				}

				if (
					payload.state === "approval-responded" &&
					payload.approval?.approved === false &&
					next[toolCallId]?.phase !== "denied"
				) {
					next[toolCallId] = {
						phase: "denied",
						startedAt: next[toolCallId]?.startedAt ?? Date.now(),
					};
					changed = true;
				}
			}

			for (const toolCallId of Object.keys(next)) {
				if (!liveToolCallIds.has(toolCallId)) {
					delete next[toolCallId];
					changed = true;
				}
			}

			return changed ? next : current;
		});
	}, [message.parts]);

	if (!message || !message.id) {
		return null;
	}

	const messageParts = Array.isArray(message.parts)
		? message.parts.filter(isValidMessagePart)
		: [];
	const fallbackContent =
		typeof (message as { content?: unknown }).content === "string"
			? ((message as { content?: string }).content ?? "")
			: "";

	const attachmentsFromMessage = messageParts.filter(
		(part) => part.type === "file",
	);

	const hasDocumentToolPart = messageParts.some(
		(part) =>
			getNormalizedPartType(part) === "tool-createDocument" ||
			getNormalizedPartType(part) === "tool-updateDocument",
	);
	const agentThinkingSteps = getAgentThinkingSteps(messageParts);
	const hasAgentThinkingPanel =
		message.role === "assistant" && agentThinkingSteps.length > 0;
	const hasRunningAgentStep = agentThinkingSteps.some(
		(step) => step.status === "running" || step.status === "pending",
	);
	const agentPanelStatus = agentThinkingSteps.some(
		(step) => step.status === "error",
	)
		? "error"
		: hasRunningAgentStep &&
				agentThinkingSteps.some((step) => step.type === "tool_call")
			? "executing"
			: hasRunningAgentStep || isLoading
				? "thinking"
				: "done";
	// When agent mode is actively running, delay showing text/output parts
	// so the agent thinking panel finishes its animation first
	const agentStillRunning =
		hasAgentThinkingPanel &&
		isLoading &&
		(agentPanelStatus === "thinking" || agentPanelStatus === "executing");

	const timestamp = formatMessageTimestamp(message);
	const hasRenderablePart = messageParts.some((part) => {
		const normalizedType = getNormalizedPartType(part);

		if (normalizedType === "text") {
			return Boolean(
				sanitizeText((part as { text?: string }).text ?? "").trim(),
			);
		}

		if (normalizedType === "reasoning") {
			return (
				!hasAgentThinkingPanel &&
				Boolean((part as { text?: string }).text?.trim())
			);
		}

		if (normalizedType === "file") {
			return true;
		}

		return normalizedType.startsWith("tool-");
	});
	const hasTextPart = messageParts.some(
		(part) =>
			getNormalizedPartType(part) === "text" &&
			Boolean(sanitizeText((part as { text?: string }).text ?? "").trim()),
	);
	const hasToolPart = messageParts.some((part) =>
		getNormalizedPartType(part).startsWith("tool-")
	);
	const hasReasoningPart = messageParts.some(
		(part) => getNormalizedPartType(part) === "reasoning"
	);
	const hasRenderableAnnotation = Boolean(
		!hasDocumentToolPart &&
			message.annotations?.some((annotation) => {
				const parsed =
					typeof annotation === "object" && annotation !== null
						? (annotation as Record<string, unknown>)
						: null;

				return (
					parsed?.type === "create-document" || parsed?.type === "update-document"
				);
			}),
	);

	const isReasoningFinished = !isLoading || hasTextPart || hasToolPart || hasRenderableAnnotation || hasDocumentToolPart;
	const shouldShowAssistantActions =
		message.role === "user" ||
		hasTextPart ||
		Boolean(fallbackContent.trim()) ||
		attachmentsFromMessage.length > 0;
	const renderedAssistantTextFingerprints = new Set<string>();

	if (
		message.role === "assistant" &&
		!hasRenderablePart &&
		!fallbackContent.trim() &&
		!hasAgentThinkingPanel &&
		!hasRenderableAnnotation
	) {
		return null;
	}

	return (
		<div
			className={cn(
				"group/message fade-in w-full animate-in duration-200",
				message.role === "user" ? "py-4 md:py-5" : "py-4 md:py-5"
			)}
			data-role={message.role}
			data-testid={`message-${message.role}`}
		>
			<div
				className={cn(
					"mx-auto flex w-full max-w-[768px] px-4 md:px-5",
					message.role === "user"
						? "justify-end"
						: "group-data-[top=true]:mt-[6vh]",
				)}
			>
				<div
					className={cn("flex flex-col min-w-0", {
						"gap-2": messageParts.some(
							(p) =>
								getNormalizedPartType(p) === "text" &&
								Boolean((p as { text?: string }).text?.trim()),
						),
						"w-full": message.role === "assistant" || mode === "edit",
						"w-full items-end": message.role === "user" && mode !== "edit",
					})}
				>
					{attachmentsFromMessage.length > 0 && (
						<div
							className="flex flex-row justify-end gap-2 pr-0.5"
							data-testid={"message-attachments"}
						>
							{attachmentsFromMessage.map((attachment) => (
								<PreviewAttachment
									attachment={{
										name: attachment.filename ?? "file",
										contentType: attachment.mediaType,
										url: attachment.url,
									}}
									key={attachment.url}
								/>
							))}
						</div>
					)}

					{hasAgentThinkingPanel && (
						<AgentThinkingPanel
							status={agentPanelStatus}
							steps={agentThinkingSteps}
						/>
					)}

					{/* Render message parts */}
					{messageParts.map((part, index) => {
						if (!isValidMessagePart(part)) {
							return null;
						}

						const normalizedType = getNormalizedPartType(part);
						const key = `message-${message.id}-part-${index}`;

						try {
// ... (di bagian rendering message parts, tambahkan)
							if (normalizedType === "reasoning") {
								const reasoningPart = part as { text?: string };
								
								// Don't render reasoning block if there's no content yet
								if (!reasoningPart.text || reasoningPart.text.trim().length === 0) {
									return null;
								}

								if (hasAgentThinkingPanel) {
									return null;
								}
								// Gunakan ReasoningBlock baru kita
								return <ReasoningBlock key={key} content={reasoningPart.text || ""} isFinished={isReasoningFinished} />;
							}

							// HIDE ALL NON-REASONING PARTS IF REASONING IS STILL ACTIVE
							if (!isReasoningFinished) {
								return null;
							}

							if (normalizedType === "text") {
								// Hide text output while agent mode is actively thinking
								if ((agentStillRunning || isLoading) && message.role === "assistant" && !hasTextPart) {
									return null;
								}
								const textPart = part as { text?: string };
								if (mode === "view") {
									const rawText = sanitizeText(textPart.text ?? "");
									const normalizedTextFingerprint = rawText.replace(/\s+/g, " ").trim();
									if (
										message.role === "assistant" &&
										isDuplicateAssistantText(
											normalizedTextFingerprint,
											renderedAssistantTextFingerprints,
										)
									) {
										return null;
									}
									if (message.role === "assistant" && normalizedTextFingerprint) {
										renderedAssistantTextFingerprints.add(normalizedTextFingerprint);
									}
									const MAX_MSG_CHARS = 15_000;
									const isHuge = rawText.length > MAX_MSG_CHARS;

									return (
										<MessageTextPart
											key={key}
											rawText={rawText}
											isHuge={isHuge}
											maxChars={MAX_MSG_CHARS}
											messageRole={message.role}
											isLoading={isLoading}
										/>
									);
								}

								if (mode === "edit") {
									return (
										<div
											className="flex w-full flex-row items-start gap-3"
											key={key}
										>
											<div className="size-8" />
											<div className="min-w-0 flex-1">
												<MessageEditor
													key={message.id}
													message={message}
													regenerate={regenerate}
													setMessages={setMessages}
													setMode={setMode}
												/>
											</div>
										</div>
									);
								}
							}

							if (normalizedType === "tool-getWeather") {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;
								const approvalId = toolPart.approval?.id;
								const isDenied =
									state === "output-denied" ||
									(state === "approval-responded" &&
										toolPart.approval?.approved === false);
								const widthClass = "w-[min(100%,450px)]";

								if (state === "output-available") {
									return (
										<div className={widthClass} key={toolCallId}>
											<Weather
												weatherAtLocation={toolPart.output as WeatherAtLocation}
											/>
										</div>
									);
								}

								if (isDenied) {
									return (
										<div className={widthClass} key={toolCallId}>
											<Tool className="w-full" defaultOpen={true}>
												<ToolHeader
													state="output-denied"
													type="tool-getWeather"
													title="Memeriksa cuaca (Ditolak)"
													icon={
														<CloudRainIcon className="size-4 shrink-0 text-muted-foreground" />
													}
												/>
												<ToolContent>
													<div className="px-4 py-3 text-muted-foreground text-sm">
														Weather lookup was denied.
													</div>
												</ToolContent>
											</Tool>
										</div>
									);
								}

								if (state === "approval-responded") {
									return (
										<div className={widthClass} key={toolCallId}>
											<Tool className="w-full" defaultOpen={true}>
												<ToolHeader
													state={getSafeToolState(state)}
													type="tool-getWeather"
													title="Memeriksa cuaca..."
													icon={
														<CloudRainIcon className="size-4 shrink-0 text-muted-foreground" />
													}
												/>
												<ToolContent>
													<ToolInput input={toolPart.input} />
												</ToolContent>
											</Tool>
										</div>
									);
								}

								return (
									<div className={widthClass} key={toolCallId}>
										<Tool className="w-full" defaultOpen={true}>
											<ToolHeader
												state={getSafeToolState(state)}
												type="tool-getWeather"
												title="Memeriksa cuaca..."
												icon={
													<CloudRainIcon className="size-4 shrink-0 text-muted-foreground" />
												}
											/>
											<ToolContent>
												{(state === "input-available" ||
													state === "approval-requested") && (
													<ToolInput input={toolPart.input} />
												)}
												{state === "approval-requested" && approvalId && (
													<div className="flex items-center justify-end gap-2 border-t px-4 py-3">
														<button
															className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
															onClick={() => {
																addToolApprovalResponse({
																	id: approvalId,
																	approved: false,
																	reason: "User denied weather lookup",
																});
															}}
															type="button"
														>
															Deny
														</button>
														<button
															className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
															onClick={() => {
																addToolApprovalResponse({
																	id: approvalId,
																	approved: true,
																});
															}}
															type="button"
														>
															Allow
														</button>
													</div>
												)}
											</ToolContent>
										</Tool>
									</div>
								);
							}

							if (normalizedType === "tool-requestClarification") {
								const clarificationPart = part as {
									toolCallId?: string;
									state?: string;
									input?: unknown;
									output?: unknown;
								};
								const toolCallId = clarificationPart.toolCallId ?? key;
								const state = clarificationPart.state;
								const payload =
									state === "output-available"
										? clarificationPart.output
										: clarificationPart.input;
								const clarification = isRecord(payload) ? payload : {};
								const question = getStringValue(
									clarification.question,
									"Bisa share detail yang kurang dulu?",
								);

								return (
									<div
										className="flex w-full max-w-[820px] items-start gap-3"
										key={toolCallId}
									>
										<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
											U
										</div>
										<p className="pt-0.5 text-[15px] leading-[1.8] text-white/75">
											{question}
										</p>
									</div>
								);
							}

							if (
								normalizedType === "tool-createDocument" ||
								normalizedType === "tool-updateDocument"
							) {
								return null;
							}

							if (normalizedType === "tool-startAgentTask") {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;
								const payload =
									state === "output-available"
										? toolPart.output
										: toolPart.input;
								const agentTask = isRecord(payload) ? payload : {};
								const agentMode =
									agentTask.mode === "mobile"
										? "mobile"
										: agentTask.mode === "general"
											? "general"
											: "fullstack";
								const agentPlan = getStringArray(agentTask.plan);

								return (
									<Tool defaultOpen={true} key={toolCallId}>
										<ToolHeader
											state={
												state === "output-error"
													? "output-error"
													: "input-available"
											}
											type={"tool-startAgentTask" as `tool-${string}`}
											title={`Rencana agen: ${getStringValue(agentTask.goal, "Analisis")}`}
											icon={
												<BotIcon className="size-4 shrink-0 text-muted-foreground" />
											}
										/>
										<ToolContent>
											<div className="space-y-4 px-4 py-4">
												<div className="flex items-center gap-2 text-sm font-medium text-foreground">
													{agentMode === "mobile" ? (
														<SmartphoneIcon className="size-4 text-pink-500" />
													) : agentMode === "general" ? (
														<BotIcon className="size-4 text-sky-500" />
													) : (
														<MonitorSmartphoneIcon className="size-4 text-orange-500" />
													)}
													<span>
														{agentMode === "mobile"
															? "Mobile Dev Agent"
															: agentMode === "general"
																? "Auto Agent"
																: "Fullstack Agent"}
													</span>
												</div>

												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Goal
													</div>
													<p className="text-sm leading-relaxed text-foreground">
														{getStringValue(
															agentTask.goal,
															"Agent task started.",
														)}
													</p>
												</div>

												<div className="rounded-xl border bg-background p-3">
													<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Execution Plan
													</div>
													<ul className="space-y-2">
														{agentPlan.map((planItem) => (
															<li
																className="flex items-start gap-2 text-sm text-foreground"
																key={`${toolCallId}-plan-${planItem}`}
															>
																<WandSparklesIcon className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
																<span>{planItem}</span>
															</li>
														))}
													</ul>
												</div>

												<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Deliverable
													</div>
													{getStringValue(
														agentTask.deliverable,
														"Preparing workspace changes.",
													)}
												</div>
											</div>
										</ToolContent>
									</Tool>
								);
							}

							if (normalizedType === "tool-reportAgentStep") {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;
								const payload =
									state === "output-available"
										? toolPart.output
										: toolPart.input;
								const step = isRecord(payload) ? payload : {};
								const stepStatus =
									step.status === "completed" ? "completed" : "in_progress";
								const stepFiles = getStringArray(step.files);
								const stepPackages = getStringArray(step.packages);
								const stepCommand =
									typeof step.command === "string" ? step.command : "";

								return (
									<Tool defaultOpen={true} key={toolCallId}>
										<ToolHeader
											state={getSafeToolState(state)}
											type={"tool-reportAgentStep" as `tool-${string}`}
											title={`Langkah agen: ${getStringValue(step.title, "Proses")}`}
											icon={
												<PlayIcon className="size-4 shrink-0 text-muted-foreground" />
											}
										/>
										<ToolContent>
											<div className="space-y-3 px-4 py-4">
												<div className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3">
													<div className="flex items-start gap-2">
														{stepStatus === "completed" ? (
															<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
														) : (
															<Clock3Icon className="mt-0.5 size-4 shrink-0 animate-pulse text-amber-500" />
														)}
														<div>
															<div className="text-sm font-medium text-foreground">
																{getStringValue(step.title, "Agent step")}
															</div>
															<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
																{getStringValue(
																	step.detail,
																	"Processing workspace changes.",
																)}
															</p>
														</div>
													</div>
													<div className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
														{stepStatus === "completed" ? "Done" : "Running"}
													</div>
												</div>

												{stepFiles.length > 0 && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															<LucideSparklesIcon className="size-3.5" />
															Files
														</div>
														<div className="flex flex-wrap gap-2">
															{stepFiles.map((file) => (
																<span
																	className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-white/[0.58]"
																	key={`${toolCallId}-${file}`}
																>
																	{file}
																</span>
															))}
														</div>
													</div>
												)}

												{stepPackages.length > 0 && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															<PackageIcon className="size-3.5" />
															Packages
														</div>
														<div className="flex flex-wrap gap-2">
															{stepPackages.map((pkg) => (
																<span
																	className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-white/[0.58]"
																	key={`${toolCallId}-${pkg}`}
																>
																	{pkg}
																</span>
															))}
														</div>
													</div>
												)}

												{stepCommand && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/[0.62]"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															<PlayIcon className="size-3.5" />
															Action
														</div>
														{stepCommand}
													</div>
												)}
											</div>
										</ToolContent>
									</Tool>
								);
							}

							if (
								normalizedType === "tool-listCodeFiles" ||
								normalizedType === "tool-listFiles" ||
								normalizedType === "tool-createCodeFile" ||
								normalizedType === "tool-createFile" ||
								normalizedType === "tool-createFolder" ||
								normalizedType === "tool-updateCodeFile" ||
								normalizedType === "tool-editFile" ||
								normalizedType === "tool-deleteCodeFile" ||
								normalizedType === "tool-readFile" ||
								normalizedType === "tool-runWorkspaceCommand" ||
								normalizedType === "tool-runCommand" ||
								normalizedType === "tool-executeTerminalCommand" ||
								normalizedType === "tool-installPackage" ||
								normalizedType === "tool-installDependency"
							) {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;
								const payload =
									state === "output-available"
										? toolPart.output
										: toolPart.input;

								if (
									normalizedType === "tool-runWorkspaceCommand" ||
									normalizedType === "tool-runCommand" ||
									normalizedType === "tool-executeTerminalCommand" ||
									normalizedType === "tool-installPackage" ||
									normalizedType === "tool-installDependency" ||
									normalizedType === "tool-createFolder"
								) {
									const commandResult: Record<string, unknown> = isRecord(
										payload,
									)
										? payload
										: {};
									const packages = getStringArray(commandResult.packages);
									const resultText = getStringValue(commandResult.result, "");
									const commandTitle =
										normalizedType === "tool-installPackage" ||
										normalizedType === "tool-installDependency"
											? `Menginstall: ${packages.join(", ") || "package"}`
											: normalizedType === "tool-createFolder"
												? `Membuat folder: ${getStringValue(commandResult.path, "folder")}`
												: `Menjalankan perintah: ${getStringValue(commandResult.command, "Terminal Command")}`;

									return (
										<Tool defaultOpen={true} key={toolCallId}>
											<ToolHeader
												state={getSafeToolState(state)}
												type={normalizedType as `tool-${string}`}
												title={commandTitle}
												icon={
													<TerminalIcon className="size-4 shrink-0 text-muted-foreground" />
												}
											/>
											<ToolContent>
												<div className="space-y-3 px-4 py-4">
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-3 font-mono text-xs text-white/[0.62]"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															<PlayIcon className="size-3.5" />
															Virtual Command
														</div>
														{getStringValue(
															commandResult.command,
															packages.length
																? `npm install ${packages.join(" ")}`
																: "Unavailable command",
														)}
													</div>
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/[0.62]"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															Purpose
														</div>
														{getStringValue(
															commandResult.purpose,
															"Virtual workspace command",
														)}
													</div>
													{(state === "output-available" ||
														state === "output-error") &&
													resultText ? (
														<div
															className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/[0.62]"
															style={{ borderWidth: "0.5px" }}
														>
															<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
																Result
															</div>
															{resultText}
														</div>
													) : null}
												</div>
											</ToolContent>
										</Tool>
									);
								}

								const workspacePayload: Record<string, unknown> = isRecord(
									payload,
								)
									? payload
									: {};
								const stableToolCallId = toolCallId ?? key;
								const approvalId = toolPart.approval?.id;
								const isDenied =
									state === "output-denied" ||
									(state === "approval-responded" &&
										toolPart.approval?.approved === false);
								const localApprovalState = localApprovalStates[stableToolCallId];
								const visualStatus = isDenied || localApprovalState?.phase === "denied"
									? "Denied"
									: state === "output-available"
										? "Done"
										: state === "output-error"
											? "Error"
											: localApprovalState?.phase === "possibly-stuck"
												? "Possibly stuck"
												: localApprovalState?.phase === "approved"
													? "Approved"
													: localApprovalState?.phase === "running" ||
														state === "approval-responded" ||
														state === "input-available" ||
														state === "input-streaming"
														? "Running"
														: "Waiting approval";
								const workspaceFiles = getStringArray(workspacePayload.files);

								const titleMap: Record<string, string> = {
									"tool-listCodeFiles": "Membaca file workspace",
									"tool-listFiles": "Membaca file workspace",
									"tool-createCodeFile": "Membuat file baru",
									"tool-createFile": "Membuat file baru",
									"tool-updateCodeFile": "Memperbarui file",
									"tool-editFile": "Memperbarui file",
									"tool-deleteCodeFile": "Menghapus file",
									"tool-readFile": "Membaca file",
								};

								const iconMap: Record<string, React.ReactNode> = {
									"tool-listCodeFiles": (
										<FileCodeIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-listFiles": (
										<FileCodeIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-createCodeFile": (
										<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-createFile": (
										<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-updateCodeFile": (
										<FileEditIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-editFile": (
										<FileEditIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-deleteCodeFile": (
										<TrashIcon className="size-4 shrink-0 text-muted-foreground" />
									),
									"tool-readFile": (
										<FileCodeIcon className="size-4 shrink-0 text-muted-foreground" />
									),
								};

								return (
									<Tool defaultOpen={true} key={stableToolCallId}>
										<ToolHeader
											state={getApprovalAwareToolHeaderState(
												state,
												localApprovalState,
											)}
											type={normalizedType as `tool-${string}`}
											title={titleMap[normalizedType] ?? "Aksi Workspace"}
											icon={iconMap[normalizedType]}
										/>
										<ToolContent>
											<div className="space-y-3 px-4 py-4">
												<div className="flex items-center justify-between gap-3">
													<div className="min-w-0 text-[12.5px] font-normal text-white/[0.6]">
														{titleMap[normalizedType] ?? "Workspace Action"}
													</div>
													<span
														className={cn(
															"shrink-0 rounded-full border px-2.5 py-1 text-[10.5px]",
															visualStatus === "Done"
																? "border-[rgba(62,207,142,0.2)] bg-[rgba(62,207,142,0.07)] text-[rgba(62,207,142,0.8)]"
																: "border-white/[0.08] bg-white/[0.05] text-white/[0.35]",
														)}
														style={{ borderWidth: "0.5px" }}
													>
														{visualStatus}
													</span>
												</div>

												{typeof workspacePayload.path === "string" && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/[0.62]"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															Path
														</div>
														<div className="font-mono text-xs">
															{workspacePayload.path}
														</div>
													</div>
												)}

												{typeof workspacePayload.count === "number" && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/[0.62]"
														style={{ borderWidth: "0.5px" }}
													>
														{workspacePayload.count} files available in the
														virtual workspace.
													</div>
												)}

												{workspaceFiles.length > 0 && (
													<div
														className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3"
														style={{ borderWidth: "0.5px" }}
													>
														<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/[0.3]">
															Files
														</div>
														<div className="flex flex-wrap gap-2">
															{workspaceFiles.map((file) => (
																<span
																	className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-white/[0.58]"
																	key={`${toolCallId}-${file}`}
																>
																	{file}
																</span>
															))}
														</div>
													</div>
												)}

												{visualStatus === "Possibly stuck" ? (
													<div className="flex items-center justify-between gap-3 border-white/[0.06] border-t pt-3 text-[11.5px] text-white/35">
														<span>Result belum sampai. Kamu bisa tunggu atau refresh chat.</span>
														<button
															className="rounded-[8px] border border-white/[0.08] px-2.5 py-1 text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/70"
															onClick={() => window.location.reload()}
															type="button"
														>
															Refresh
														</button>
													</div>
												) : null}

												{state === "approval-requested" && approvalId && !isDenied && (
													<div className="flex items-center justify-end gap-2 border-white/[0.06] border-t pt-3">
														<button
															className="rounded-[8px] px-3 py-1.5 text-white/35 text-sm transition-colors hover:bg-white/[0.04] hover:text-white/65"
															onClick={() => {
																setLocalApprovalStates((current) => ({
																	...current,
																	[stableToolCallId]: {
																		phase: "denied",
																		startedAt: Date.now(),
																	},
																}));
																addToolApprovalResponse({
																	id: approvalId,
																	approved: false,
																	reason: "User denied workspace action",
																});
															}}
															type="button"
														>
															Deny
														</button>
														<button
															className="rounded-[8px] border border-white/[0.08] bg-white/[0.06] px-3 py-1.5 text-sm text-white/75 transition-colors hover:bg-white/[0.1]"
															onClick={() => {
																setLocalApprovalStates((current) => ({
																	...current,
																	[stableToolCallId]: {
																		phase: "approved",
																		startedAt: Date.now(),
																	},
																}));
																addToolApprovalResponse({
																	id: approvalId,
																	approved: true,
																});
															}}
															type="button"
														>
															Allow
														</button>
													</div>
												)}
											</div>
										</ToolContent>
									</Tool>
								);
							}

							if (normalizedType === "tool-webSearch") {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;
								const query = isRecord(toolPart.input)
									? getStringValue(toolPart.input.query, "web")
									: "web";

								return (
									<Tool defaultOpen={true} key={toolCallId ?? key}>
										<ToolHeader
											state={getSafeToolState(state)}
											type="tool-webSearch"
											title={`Mencari web: ${query}`}
											icon={
												<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
											}
										/>
										<ToolContent>
											{state === "input-available" || state === "input-streaming" || state === "approval-requested" || state === "approval-responded" ? (
												<div className="px-4 py-4 flex items-center gap-2 text-[13.5px] text-white/52">
													<SearchIcon className="size-3.5 animate-pulse" />
													<span>Mencari data untuk query &quot;{query}&quot;...</span>
												</div>
											) : (
												<WebSearchSources
													output={toolPart.output}
													state={state}
												/>
											)}
										</ToolContent>
									</Tool>
								);
							}

							if (normalizedType === "tool-requestSuggestions") {
								const toolPart = asToolPart(part);
								const { toolCallId, state } = toolPart;

								return (
									<Tool defaultOpen={true} key={toolCallId}>
										<ToolHeader
											state={getSafeToolState(state)}
											type="tool-requestSuggestions"
											title="Mencari saran perbaikan..."
											icon={
												<LightbulbIcon className="size-4 shrink-0 text-muted-foreground" />
											}
										/>
										<ToolContent>
											{state === "input-available" && (
												<ToolInput input={toolPart.input} />
											)}
											{state === "output-available" &&
												(() => {
													const suggestionOutput =
														toolPart.output as DocumentToolResultData;

													return (
														<ToolOutput
															errorText={undefined}
															output={
																suggestionOutput.error ? (
																	<div className="rounded border p-2 text-red-500">
																		Error: {String(suggestionOutput.error)}
																	</div>
																) : (
																	<DocumentToolResult
																		isReadonly={isReadonly}
																		result={suggestionOutput}
																		type="request-suggestions"
																	/>
																)
															}
														/>
													);
												})()}
										</ToolContent>
									</Tool>
								);
							}

							return null;
						} catch (error) {
							console.error("[PreviewMessage] Failed to render part", {
								error,
								messageId: message.id,
								part,
								partIndex: index,
							});
							return null;
						}
					})}

					{!hasTextPart && !agentStillRunning && fallbackContent.trim() ? (
						<MessageTextPart
							rawText={sanitizeText(fallbackContent)}
							isHuge={fallbackContent.length > 15_000}
							maxChars={15_000}
							messageRole={message.role}
							isLoading={isLoading}
						/>
					) : null}

					{/* Render tool events injected via message annotations */}
					{!hasDocumentToolPart && isReasoningFinished && message.annotations?.map((annotation, index) => {
						const key = `message-${message.id}-annotation-${index}`;
						const parsed =
							typeof annotation === "object" && annotation !== null
								? (annotation as Record<string, unknown>)
								: null;

						if (!parsed || !("type" in parsed)) return null;

						if (
							parsed.type === "create-document" ||
							parsed.type === "update-document"
						) {
							const toolType =
								parsed.type === "create-document" ? "create" : "update";
							const parsedTitle =
								typeof parsed.title === "string" ? parsed.title : "";
							const parsedKind =
								parsed.kind === "code" ||
								parsed.kind === "text" ||
								parsed.kind === "sheet" ||
								parsed.kind === "image"
									? parsed.kind
									: "text";

							// Since annotations are sent on execution block (call), we emulate tool properties
							return (
								<Tool defaultOpen={true} key={key}>
									<ToolHeader
										state="input-available"
										type={`tool-${parsed.type === "create-document" ? "createDocument" : "updateDocument"}`}
										title={
											parsed.type === "create-document"
												? `Membuat dokumen: ${parsedTitle}`
												: `Memperbarui dokumen: ${parsedTitle}`
										}
										icon={
											parsed.type === "create-document" ? (
												<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
											) : (
												<FileEditIcon className="size-4 shrink-0 text-muted-foreground" />
											)
										}
									/>
									<ToolContent>
										<DocumentToolCall
											type={toolType}
											args={{
												title: parsedTitle,
												kind: parsedKind,
											}}
											isReadonly={isReadonly}
										/>
									</ToolContent>
								</Tool>
							);
						}

						return null;
					})}

					{timestamp ? (
						<div
							className={cn(
								"mt-1 text-[10px] text-white/20 opacity-0 transition-opacity duration-200 group-hover/message:opacity-100 group-focus-within/message:opacity-100",
								message.role === "user" ? "text-right" : "text-left",
							)}
						>
							{timestamp}
						</div>
					) : null}

					{!isReadonly && shouldShowAssistantActions && (
						<MessageActions
							chatId={chatId}
							isLoading={isLoading}
							key={`action-${message.id}`}
							message={message}
							regenerate={regenerate}
							setMode={setMode}
							vote={vote}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
	return (
		<div
			className="group/message fade-in w-full animate-in duration-300"
			data-role="assistant"
			data-testid="message-assistant-loading"
		>
			<div className="mx-auto flex w-full max-w-[680px]">
				<div className="min-w-0 flex-1">
					<AgentThinkingPanel
						status="thinking"
						steps={[
							{
								id: "analyze",
								type: "thought",
								label: "Menganalisis permintaan",
								status: "running",
							},
							{
								id: "context",
								type: "thought",
								label: "Memeriksa konteks sebelumnya",
								status: "pending",
							},
							{
								id: "plan",
								type: "thought",
								label: "Menyusun rencana eksekusi",
								status: "pending",
							},
						]}
					/>
					<div className="mt-3 flex items-center gap-1.5 pl-1 text-white/25">
						{[0, 1, 2].map((dot) => (
							<span
								className="size-1.5 animate-[typing-dot_1s_ease-in-out_infinite] rounded-full bg-white/35"
								key={dot}
								style={{ animationDelay: `${dot * 0.16}s` }}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
