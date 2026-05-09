"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";
import { sanitizeChatMessage, sanitizeChatMessages } from "@/lib/utils";

const RECENT_STREAM_RESUME_WINDOW_MS = 3 * 60 * 1000;

function hasRenderableAssistantMessage(message: ChatMessage) {
	if (message.role !== "assistant") {
		return false;
	}

	const parts = Array.isArray(message.parts) ? message.parts : [];
	const hasRenderableParts = parts.some((part) => {
		if (!part || typeof part !== "object" || !("type" in part)) {
			return false;
		}

		if (part.type === "text" || part.type === "reasoning") {
			return Boolean((part as { text?: string }).text?.trim());
		}

		return part.type === "file" || String(part.type).includes("tool");
	});

	if (hasRenderableParts) {
		return true;
	}

	const rawContent = (message as { content?: unknown }).content;
	return typeof rawContent === "string" && Boolean(rawContent.trim());
}

export type UseAutoResumeParams = {
	chatId: string;
	autoResume: boolean;
	initialMessages: ChatMessage[];
	resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
};

function getMessageTimestamp(message: ChatMessage | undefined) {
	const createdAt = message?.metadata?.createdAt;
	if (typeof createdAt !== "string") {
		return null;
	}

	const timestamp = Date.parse(createdAt);
	return Number.isFinite(timestamp) ? timestamp : null;
}

export function useAutoResume({
	chatId,
	autoResume,
	initialMessages,
	resumeStream,
	setMessages,
}: UseAutoResumeParams) {
	const { dataStream, activeChatId } = useDataStream();
	const safeInitialMessages = sanitizeChatMessages(initialMessages);
	const resumedChatIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!autoResume) {
			return;
		}

		if (resumedChatIdsRef.current.has(chatId)) {
			return;
		}

		const hasInvalidParts = safeInitialMessages.some(
			(msg) =>
				(msg.parts?.length ?? 0) !== (msg.parts ?? []).filter(Boolean).length,
		);
		const mostRecentMessage = safeInitialMessages.at(-1);
		const mostRecentTimestamp = getMessageTimestamp(mostRecentMessage);
		const lastUserIndex = safeInitialMessages.findLastIndex(
			(message) => message.role === "user",
		);
		const lastUserMessage =
			lastUserIndex === -1 ? undefined : safeInitialMessages[lastUserIndex];
		const assistantMessagesAfterLastUser =
			lastUserIndex === -1
				? []
				: safeInitialMessages.filter(
						(message, index) => index > lastUserIndex && message.role === "assistant",
					);
		const hasRenderableAssistantAfterLastUser = assistantMessagesAfterLastUser.some(
			(message) => hasRenderableAssistantMessage(message),
		);
		const shouldRetryRecentAssistantStream =
			lastUserMessage?.role === "user" &&
			assistantMessagesAfterLastUser.length > 0 &&
			Boolean(
				mostRecentTimestamp &&
				Date.now() - mostRecentTimestamp <= RECENT_STREAM_RESUME_WINDOW_MS,
			);

		if (
			lastUserMessage?.role === "user" &&
			!hasInvalidParts &&
			(!hasRenderableAssistantAfterLastUser || shouldRetryRecentAssistantStream)
		) {
			resumedChatIdsRef.current.add(chatId);
			Promise.resolve()
				.then(() => resumeStream())
				.catch((err) => {
					console.warn(
						"[AutoResume] Stream resume failed:",
						err?.message || err,
					);
				});
		}
	}, [autoResume, chatId, resumeStream, safeInitialMessages]);

	useEffect(() => {
		if (!autoResume) {
			return;
		}

		if (activeChatId !== chatId) {
			return;
		}

		if (!dataStream || dataStream.length === 0) {
			return;
		}

		const appendMessagePart = dataStream.find(
			(dataPart) => dataPart.type === "data-appendMessage",
		);

		if (appendMessagePart?.type === "data-appendMessage") {
			try {
				const message = sanitizeChatMessage(
					JSON.parse(appendMessagePart.data) as ChatMessage,
				);
				setMessages((currentMessages) => {
					if (currentMessages.some((current) => current.id === message.id)) {
						return currentMessages;
					}

					return [...currentMessages, message];
				});
			} catch (err) {
				console.warn("[AutoResume] Failed to append streamed message:", err);
			}
		}
	}, [activeChatId, autoResume, chatId, dataStream, setMessages]);
}
