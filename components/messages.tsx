import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@backend/db/schema";
import { ChevronDownIcon, RefreshCw, XCircle } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { ChatMessage } from "@/lib/types";
import { AgentThinkingPanel } from "./agent-thinking-panel";
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
	if (!Array.isArray(messages)) {
		return null;
	}

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
	const visibleMessages = messages.filter((message) => {
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

		const hasTextContent =
			rawContent
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

		if (message.role === "assistant" && !hasTextContent && !hasToolCalls) {
			return false;
		}

		return true;
	});

	const lastMessage = visibleMessages.at(-1);
	const lastUserIndex = visibleMessages.findLastIndex(
		(message) => message.role === "user",
	);
	const assistantAfterLastUserIndex =
		lastUserIndex === -1
			? -1
			: visibleMessages.findIndex(
					(message, index) => index > lastUserIndex && message.role === "assistant",
				);
	const lastAssistantHasContent =
		assistantAfterLastUserIndex !== -1 &&
		(visibleMessages[assistantAfterLastUserIndex]?.parts ?? []).some((part) => {
			if (!part || typeof part !== "object" || !("type" in part)) {
				return false;
			}

			const typedPart = part as { type?: string; text?: string };
			return (
				(typedPart.type === "text" && Boolean(typedPart.text?.trim())) ||
				(typedPart.type === "reasoning" && Boolean(typedPart.text?.trim()))
			);
		});

	const hasApprovalResponse = visibleMessages.some((msg) =>
		(msg.parts ?? []).some((part) => {
			if (!part || typeof part !== "object" || !("state" in part)) {
				return false;
			}

			return (part as { state?: string }).state === "approval-responded";
		}),
	);
	const totalAgentDuration =
		agentStream.startedAt && agentStream.endedAt
			? agentStream.endedAt - agentStream.startedAt
			: agentStream.startedAt
				? Date.now() - agentStream.startedAt
				: undefined;
	const contextualThinkingAnchorIndex =
		assistantAfterLastUserIndex !== -1 ? assistantAfterLastUserIndex : lastUserIndex;
	const contextualThinkingAnchoredToUser =
		contextualThinkingAnchorIndex !== -1 &&
		visibleMessages[contextualThinkingAnchorIndex]?.role === "user";
	const [thinkingDurationMs, setThinkingDurationMs] = useState<
		number | undefined
	>();
	const hasLiveThinkingSurface =
		liveThinking.enabled &&
		(liveThinking.steps.length > 0 ||
			status === "submitted" ||
			status === "streaming" ||
			status === "error");
	const showContextualThinking =
		hasLiveThinkingSurface &&
		((liveThinking.enabled &&
			(status === "submitted" ||
				status === "streaming" ||
				status === "error" ||
				contextualThinkingAnchorIndex !== -1)) ||
			(status === "ready" && contextualThinkingAnchorIndex === -1) ||
			(status === "error" && contextualThinkingAnchorIndex === -1));
	const waitingForFirstAssistantToken =
		(status === "submitted" || status === "streaming") &&
		(assistantAfterLastUserIndex === -1 || !lastAssistantHasContent);
	const contextualThinkingActive =
		(status === "submitted" || waitingForFirstAssistantToken) &&
		!hasApprovalResponse;
	const showToolAgentPanel =
		!showContextualThinking &&
		!hasApprovalResponse &&
		agentStream.steps.length > 0 &&
		(status === "submitted" ||
			waitingForFirstAssistantToken ||
			(status === "ready" && assistantAfterLastUserIndex === -1) ||
			(status === "error" && assistantAfterLastUserIndex === -1));
	const showBasicAssistantLoading =
		!showContextualThinking &&
		!showToolAgentPanel &&
		(status === "submitted" || status === "streaming") &&
		assistantAfterLastUserIndex === -1 &&
		lastUserIndex !== -1;
	const showMissingAssistantFallback = false;

	useEffect(() => {
		if (contextualThinkingActive) {
			setThinkingDurationMs(undefined);
			return;
		}

		if (
			showContextualThinking &&
			liveThinking.startedAt &&
			thinkingDurationMs === undefined
		) {
			setThinkingDurationMs(Date.now() - liveThinking.startedAt);
		}
	}, [
		contextualThinkingActive,
		liveThinking.startedAt,
		showContextualThinking,
		thinkingDurationMs,
	]);

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
						<div className="mx-auto flex min-w-0 w-full max-w-[820px] flex-col space-y-8 px-6 py-10">
							{visibleMessages.map((message, index) => (
								<Fragment key={message.id}>
									{showContextualThinking &&
										index === contextualThinkingAnchorIndex &&
										!contextualThinkingAnchoredToUser && (
											<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
												<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
													U
												</div>
												<div className="min-w-0 flex-1">
													<AgentThinkingPanel
														isActive={contextualThinkingActive}
														key={liveThinking.startedAt ?? "live-thinking"}
														liveSteps={liveThinking.steps}
														status={
															contextualThinkingActive ? "thinking" : "done"
														}
														steps={[]}
														totalDurationMs={thinkingDurationMs}
													/>
												</div>
											</div>
										)}
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
									{showContextualThinking &&
										index === contextualThinkingAnchorIndex &&
										contextualThinkingAnchoredToUser && (
											<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
												<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
													U
												</div>
												<div className="min-w-0 flex-1">
													<AgentThinkingPanel
														isActive={contextualThinkingActive}
														key={liveThinking.startedAt ?? "live-thinking"}
														liveSteps={liveThinking.steps}
														status={
															contextualThinkingActive ? "thinking" : "done"
														}
														steps={[]}
														totalDurationMs={thinkingDurationMs}
													/>
												</div>
											</div>
										)}
								</Fragment>
							))}

							{showContextualThinking && contextualThinkingAnchorIndex === -1 && (
								<div
									className="group/message fade-in w-full animate-in duration-300"
									data-role="assistant"
									data-testid="message-assistant-loading"
								>
									<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
										<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
											U
										</div>
										<div className="min-w-0 flex-1">
											<AgentThinkingPanel
												isActive={contextualThinkingActive}
												key={liveThinking.startedAt ?? "live-thinking"}
												liveSteps={liveThinking.steps}
												status="thinking"
												steps={[]}
												totalDurationMs={thinkingDurationMs}
											/>
										</div>
									</div>
								</div>
							)}

							{showBasicAssistantLoading && (
								<div
									className="group/message fade-in w-full animate-in duration-300"
									data-role="assistant"
									data-testid="message-assistant-basic-loading"
								>
									<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
										<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
											U
										</div>
										<div className="flex min-h-11 items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-white/30">
											{[0, 1, 2].map((dot) => (
												<span
													className="size-1.5 animate-[typing-dot_1s_ease-in-out_infinite] rounded-full bg-white/40"
													key={dot}
													style={{ animationDelay: `${dot * 0.16}s` }}
												/>
											))}
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
									<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
										<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
											U
										</div>
										<div className="min-w-0 flex-1">
											<AgentThinkingPanel
												status={agentStream.status}
												steps={agentStream.steps}
												totalDuration={totalAgentDuration}
											/>
											{(status === "submitted" ||
												status === "streaming") && (
												<div className="mt-3 flex items-center gap-1.5 pl-1 text-white/25">
													{[0, 1, 2].map((dot) => (
														<span
															className="size-1.5 animate-[typing-dot_1s_ease-in-out_infinite] rounded-full bg-white/35"
															key={dot}
															style={{ animationDelay: `${dot * 0.16}s` }}
														/>
													))}
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							{showMissingAssistantFallback && (
								<div className="mx-auto flex w-full max-w-[820px] items-start gap-3">
									<div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-[11px] font-semibold text-white/55">
										U
									</div>
									<div className="flex w-full max-w-2xl items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-white/70">
										<div className="min-w-0 flex-1">
											<p className="text-[13px] leading-6">
												Agent sudah selesai jalan, tapi pesan akhir belum
												sempat tampil di chat.
											</p>
											{onRetry ? (
												<button
													className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] text-white/60 transition-colors hover:bg-white/15 hover:text-white/80"
													onClick={onRetry}
													type="button"
												>
													<RefreshCw className="size-3" />
													Coba generate ulang
												</button>
											) : null}
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
