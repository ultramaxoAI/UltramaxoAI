import type { UseChatHelpers } from "@ai-sdk/react";
import { ArrowDownIcon } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@backend/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

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
}: MessagesProps) {
	const {
		containerRef: messagesContainerRef,
		endRef: messagesEndRef,
		isAtBottom,
		scrollToBottom,
		hasSentMessage,
	} = useMessages({
		status,
	});

	useDataStream();

	const lastMessage = messages.at(-1);
	const lastAssistantHasContent =
		lastMessage?.role === "assistant" &&
		(lastMessage.parts ?? []).some((part) => {
			if (!part || typeof part !== "object" || !("type" in part)) {
				return false;
			}

			const typedPart = part as { type?: string; text?: string };
			return (
				(typedPart.type === "text" && Boolean(typedPart.text?.trim())) ||
				(typedPart.type === "reasoning" && Boolean(typedPart.text?.trim()))
			);
		});

	const hasApprovalResponse = messages.some((msg) =>
		(msg.parts ?? []).some((part) => {
			if (!part || typeof part !== "object" || !("state" in part)) {
				return false;
			}

			return (
				(part as { state?: string }).state === "approval-responded"
			);
		}),
	);

	return (
		<>
			{messages.length === 0 ? (
				<Greeting />
			) : (
				<div className="relative flex-1">
					<div
						className="absolute inset-0 touch-pan-y overflow-y-auto"
						ref={messagesContainerRef}
					>
						<div className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-5 px-4 py-5 md:gap-7 md:px-6">
							{messages.map((message, index) => (
								<PreviewMessage
									addToolApprovalResponse={addToolApprovalResponse}
									chatId={chatId}
									isLoading={
										status === "streaming" && messages.length - 1 === index
									}
									isReadonly={isReadonly}
									key={message.id}
									message={message}
									regenerate={regenerate}
									requiresScrollPadding={
										hasSentMessage && index === messages.length - 1
									}
									setMessages={setMessages}
									vote={
										votes
											? votes.find((vote) => vote.messageId === message.id)
											: undefined
									}
								/>
							))}

							{/* Show ThinkingMessage only before any content (text or reasoning) arrives */}
							{(status === "submitted" ||
								(status === "streaming" &&
									messages.length > 0 &&
									lastMessage?.role === "assistant" &&
									!lastAssistantHasContent)) &&
								!hasApprovalResponse && <ThinkingMessage />}

							<div className="min-h-6 min-w-6 shrink-0" ref={messagesEndRef} />
						</div>
					</div>

					<button
						aria-label="Scroll to bottom"
						className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#171717]/8 bg-white/90 p-2.5 text-[#171717] shadow-[0_10px_30px_rgba(23,23,23,0.12)] backdrop-blur transition-all hover:bg-white dark:border-white/10 dark:bg-[#171b1f]/92 dark:text-[#f3f4f1] dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] dark:hover:bg-[#1d2227] ${
							isAtBottom
								? "pointer-events-none scale-0 opacity-0"
								: "pointer-events-auto scale-100 opacity-100"
						}`}
						onClick={() => scrollToBottom("smooth")}
						type="button"
					>
						<ArrowDownIcon className="size-4" />
					</button>
				</div>
			)}
		</>
	);
}

export const Messages = PureMessages;
