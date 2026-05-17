import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@backend/db/schema";
import { ChevronDownIcon, RefreshCw, XCircle } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { ChatMessage } from "@/lib/types";
import { AgentThinkingPanel } from "./agent-thinking-panel";
import { ReasoningBlock, ToolBlock } from "./AgentUI"; // <--- Tambah ini
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage } from "./message";

type MessagesProps = {
	addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
	chatId: string;
	status: UseChatHelpers<ChatMessage>["status"];
	votes: Vote[] | undefined;
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	isReadonly: boolean;
	isArtifactVisible: boolean;
	selectedModelId: string;
	onSuggestedPrompt?: (prompt: string) => void;
	streamError?: string | null;
	onRetry?: () => void;
};

function getPartState(part: unknown) {
	if (!part || typeof part !== "object") {
		return undefined;
	}

	const record = part as { state?: unknown };
	return typeof record.state === "string" ? record.state : undefined;
}

function getAssistantTextPayload(message: ChatMessage | undefined) {
	if (!message || message.role !== "assistant") {
		return "";
	}

	const rawContent =
		typeof (message as { content?: unknown }).content === "string"
			? ((message as { content?: string }).content ?? "")
			: "";
	const parts = Array.isArray(message.parts) ? message.parts : [];
	const partText = parts
		.filter((part) => part?.type === "text")
		.map((part) => (part as { text?: string }).text ?? "")
		.join("\n");

	return [rawContent, partText].filter(Boolean).join("\n").trim();
}

function normalizeAssistantFingerprint(value: string) {
	return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function isDuplicateOrOverlappingText(value: string, seen: Set<string>) {
	const fingerprint = normalizeAssistantFingerprint(value);
	if (!fingerprint) {
		return false;
	}

	for (const previous of seen) {
		const shorter =
			previous.length < fingerprint.length ? previous : fingerprint;
		const longer =
			previous.length < fingerprint.length ? fingerprint : previous;
		if (
			previous === fingerprint ||
			(shorter.length > 32 && longer.includes(shorter))
		) {
			return true;
		}
	}

	seen.add(fingerprint);
	return false;
}

function hasAssistantText(message: ChatMessage | undefined) {
	return Boolean(getAssistantTextPayload(message).trim());
}

function hasToolPart(message: ChatMessage | undefined) {
	const parts = Array.isArray(message?.parts) ? message.parts : [];
	return parts.some((part) =>
		Boolean(
			part &&
				typeof part === "object" &&
				"type" in part &&
				String(part.type).includes("tool"),
		),
	);
}

function compactAssistantMessages(messages: ChatMessage[]) {
	const result: ChatMessage[] = [];
	let segment: ChatMessage[] = [];
	const seenAssistantTexts = new Set<string>();

	const flushSegment = () => {
		if (segment.length === 0) {
			return;
		}

		const lastAssistantTextIndex = segment.findLastIndex(
			(message) => message.role === "assistant" && hasAssistantText(message),
		);

		for (let index = 0; index < segment.length; index++) {
			const message = segment[index];
			if (message.role !== "assistant") {
				result.push(message);
				continue;
			}

			const text = getAssistantTextPayload(message);
			if (text) {
				if (index < lastAssistantTextIndex) {
					continue;
				}
				if (isDuplicateOrOverlappingText(text, seenAssistantTexts)) {
					continue;
				}
				result.push(message);
				continue;
			}

			// Hide stale thinking/reasoning shells when a final assistant answer exists in the same turn.
			if (
				lastAssistantTextIndex !== -1 &&
				index < lastAssistantTextIndex &&
				!hasToolPart(message)
			) {
				continue;
			}

			result.push(message);
		}

		segment = [];
	};

	for (const message of messages) {
		if (message.role === "user") {
			flushSegment();
			result.push(message);
			continue;
		}

		segment.push(message);
	}

	flushSegment();
	return result;
}

function hasRenderableAssistantAnswer(message: ChatMessage | undefined) {
	if (!message || message.role !== "assistant") {
		return false;
	}

	const messageParts = Array.isArray(message.parts) ? message.parts : [];
	const hasVisibleAnswerPart = messageParts.some((part) => {
		if (!part || typeof part !== "object" || !("type" in part)) {
			return false;
		}

		if (part.type === "text") {
			return Boolean((part as { text?: string }).text?.trim());
		}

		return part.type === "file" || String(part.type).includes("tool");
	});

	if (hasVisibleAnswerPart) {
		return true;
	}

	const rawContent =
		typeof (message as { content?: unknown }).content === "string"
			? ((message as { content?: string }).content ?? "")
			: "";
	return Boolean(rawContent.trim());
}

function PureMessages({
	addToolApprovalResponse,
	chatId,
	status,
	votes,
	messages,
	setMessages,
	regenerate,
	isReadonly,
	selectedModelId: _selectedModelId,
	onSuggestedPrompt,
	streamError,
	onRetry,
}: MessagesProps) {
	const safeMessages = Array.isArray(messages) ? messages : [];

	const {
		containerRef: messagesContainerRef,
		endRef: messagesEndRef,
		isAtBottom,
		scrollToBottom,
		hasSentMessage,
	} = useMessages({
		status,
	});

	const { agentStream, liveThinking } = useDataStream();
	const filteredVisibleMessages = safeMessages.filter((message) => {
		if (!message || !message.id) {
			return false;
		}
		const rawContent =
			typeof (message as { content?: unknown }).content === "string"
				? ((message as { content?: string }).content ?? "")
				: "";

		const messageParts = Array.isArray(message.parts) ? message.parts : [];
		const textPayload = [
			rawContent,
			...messageParts
				.filter((part) => part?.type === "text")
				.map((part) => (part as { text?: string }).text ?? ""),
		].join("\n");

		if (
			message.role === "assistant" &&
			textPayload.includes(
				"Proses sudah selesai, tapi respons akhir tidak sempat tampil di chat",
			)
		) {
			return false;
		}

		const hasTextContent = rawContent
			? Boolean(rawContent.trim())
			: messageParts.some((part) => {
					if (!part || typeof part !== "object" || !("type" in part)) {
						return false;
					}

					if (part.type === "text" || part.type === "reasoning") {
						return Boolean((part as { text?: string }).text?.trim());
					}

					return false;
				});
		const hasToolCalls = messageParts.some((part) => {
			if (!part || typeof part !== "object" || !("type" in part)) {
				return false;
			}

			return String(part.type).includes("tool");
		});
		const hasRenderableNonTextPart = messageParts.some((part) => {
			if (!part || typeof part !== "object" || !("type" in part)) {
				return false;
			}

			return part.type === "file";
		});

		if (
			message.role === "assistant" &&
			!hasTextContent &&
			!hasToolCalls &&
			!hasRenderableNonTextPart
		) {
			return false;
		}

		return true;
	});

	const visibleMessages = compactAssistantMessages(
		filteredVisibleMessages.length > 0
			? filteredVisibleMessages
			: safeMessages.filter((message) =>
					Boolean(message && message.id && message.role),
				),
	);
	const recoveredFromHiddenMessages =
		filteredVisibleMessages.length === 0 && safeMessages.length > 0;

	const lastUserIndex = visibleMessages.findLastIndex(
		(message) => message.role === "user",
	);
	const assistantsAfterLastUser =
		lastUserIndex === -1
			? []
			: visibleMessages.filter(
					(message, index) =>
						index > lastUserIndex && message.role === "assistant",
				);
	const hasRenderableAssistantAfterLastUser = assistantsAfterLastUser.some(
		(message) => hasRenderableAssistantAnswer(message),
	);
	const hasApprovalResponse = visibleMessages.some((msg) =>
		(msg.parts ?? []).some(
			(part) => getPartState(part) === "approval-responded",
		),
	);
	const totalAgentDuration =
		agentStream.startedAt && agentStream.endedAt
			? agentStream.endedAt - agentStream.startedAt
			: agentStream.startedAt
				? Date.now() - agentStream.startedAt
				: undefined;
	const [thinkingDurationMs, setThinkingDurationMs] = useState<
		number | undefined
	>();
	const waitingForAssistantResponse =
		status === "submitted" || status === "streaming";
	const shouldRenderThinking =
		!hasApprovalResponse &&
		lastUserIndex !== -1 &&
		(waitingForAssistantResponse ||
			(liveThinking.enabled && !hasRenderableAssistantAfterLastUser));

	// Check if the last assistant message already has its own reasoning-based
	// AgentThinkingPanel to avoid rendering a duplicate at the list level
	const lastAssistantMessage =
		assistantsAfterLastUser[assistantsAfterLastUser.length - 1];
	const lastMessageHasReasoningPanel = (() => {
		if (!lastAssistantMessage) return false;
		const parts = Array.isArray(lastAssistantMessage.parts)
			? lastAssistantMessage.parts
			: [];
		return parts.some((part) => {
			if (!part || typeof part !== "object" || !("type" in part)) return false;
			if (part.type === "reasoning" && (part as { text?: string }).text?.trim())
				return true;
			if (String(part.type).includes("tool")) return true;
			return false;
		});
	})();

	const showToolAgentPanel =
		shouldRenderThinking &&
		agentStream.steps.length > 0 &&
		!lastMessageHasReasoningPanel;
	const showLiveThinkingPanel =
		shouldRenderThinking &&
		!showToolAgentPanel &&
		!lastMessageHasReasoningPanel &&
		liveThinking.thinkingChunks.length > 0;
	const showSimpleThinking =
		shouldRenderThinking &&
		!showToolAgentPanel &&
		!showLiveThinkingPanel &&
		!lastMessageHasReasoningPanel;

	useEffect(() => {
		if (shouldRenderThinking) {
			setThinkingDurationMs(undefined);
			return;
		}

		if (liveThinking.startedAt && thinkingDurationMs === undefined) {
			setThinkingDurationMs(Date.now() - liveThinking.startedAt);
		}
	}, [liveThinking.startedAt, shouldRenderThinking, thinkingDurationMs]);

	return (
		<>
			{visibleMessages.length === 0 ? (
				<Greeting onPromptSelect={onSuggestedPrompt} />
			) : (
				<div className="relative flex-1">
					<div
						className="absolute inset-0 touch-pan-y overflow-y-auto"
						ref={messagesContainerRef}
					>
						<div className="mx-auto flex min-w-0 w-full max-w-[820px] flex-col space-y-5 px-6 py-8">
							{recoveredFromHiddenMessages ? (
								<div className="rounded-2xl border border-amber-400/15 bg-amber-400/8 px-4 py-3 text-[12px] text-amber-100/80">
									Memulihkan percakapan dari data tersimpan. Beberapa bubble
									yang tidak lengkap tetap ditampilkan agar chat tidak kosong.
								</div>
							) : null}
							{visibleMessages.map((message, index) => (
								<Fragment key={`${message.id}-${index}`}>
									<PreviewMessage
										addToolApprovalResponse={addToolApprovalResponse}
										chatId={chatId}
										isLoading={
											status === "streaming" &&
											visibleMessages.length - 1 === index
										}
										isReadonly={isReadonly}
										message={message}
										regenerate={regenerate}
										requiresScrollPadding={
											hasSentMessage && index === visibleMessages.length - 1
										}
										setMessages={setMessages}
										vote={
											votes
												? votes.find((vote) => vote.messageId === message.id)
												: undefined
										}
									/>
								</Fragment>
							))}

							{showSimpleThinking && (
								<div
									className="group/message fade-in w-full animate-in duration-300"
									data-role="assistant"
									data-testid="message-assistant-basic-loading"
								>
									<div className="mx-auto flex w-full max-w-[820px]">
										<div className="min-w-0 flex-1">
											<AgentThinkingPanel isActive status="thinking" />
										</div>
									</div>
								</div>
							)}

							{showLiveThinkingPanel && (
								<div
									className="group/message fade-in w-full animate-in duration-300"
									data-role="assistant"
									data-testid="message-assistant-live-thinking"
								>
									<div className="mx-auto flex w-full max-w-[820px]">
										<div className="min-w-0 flex-1">
											<AgentThinkingPanel
												isActive
												status="thinking"
												thinkingChunks={liveThinking.thinkingChunks}
											/>
										</div>
									</div>
								</div>
							)}

							{showToolAgentPanel && (
								<div
									className="group/message fade-in w-full animate-in duration-300"
									data-role="assistant"
									data-testid="message-assistant-loading"
								>
									<div className="mx-auto flex w-full max-w-[820px]">
										<div className="min-w-0 flex-1">
											<AgentThinkingPanel
												status={agentStream.status}
												steps={agentStream.steps}
												totalDuration={totalAgentDuration}
												variant="agent-active"
											/>
										</div>
									</div>
								</div>
							)}

							{streamError && (
								<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
									<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
										U
									</div>
									<div className="flex w-full max-w-2xl items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/10 p-4 text-white/70">
										<XCircle className="mt-0.5 size-4 shrink-0 text-red-400/60" />
										<div className="min-w-0 flex-1">
											<p className="text-[13px] leading-6">{streamError}</p>
											{onRetry ? (
												<button
													className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] text-white/60 transition-colors hover:bg-white/15 hover:text-white/80"
													onClick={onRetry}
													type="button"
												>
													<RefreshCw className="size-3" />
													Coba lagi
												</button>
											) : null}
										</div>
									</div>
								</div>
							)}

							<div className="min-h-6 min-w-6 shrink-0" ref={messagesEndRef} />
						</div>
					</div>

					<button
						aria-label="Scroll to bottom"
						className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/8 bg-white/8 p-2.5 text-white/55 shadow-[0_14px_35px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all hover:bg-white/12 hover:text-white/80 ${
							isAtBottom
								? "pointer-events-none scale-0 opacity-0"
								: "pointer-events-auto scale-100 opacity-100"
						}`}
						onClick={() => scrollToBottom("smooth")}
						type="button"
					>
						<ChevronDownIcon className="size-4" />
					</button>
				</div>
			)}
		</>
	);
}

export const Messages = PureMessages;
