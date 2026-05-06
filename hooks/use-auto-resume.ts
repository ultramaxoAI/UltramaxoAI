"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";
import { sanitizeChatMessage, sanitizeChatMessages } from "@/lib/utils";

export type UseAutoResumeParams = {
	autoResume: boolean;
	initialMessages: ChatMessage[];
	resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
};

export function useAutoResume({
	autoResume,
	initialMessages,
	resumeStream,
	setMessages,
}: UseAutoResumeParams) {
	const { dataStream } = useDataStream();
	const safeInitialMessages = sanitizeChatMessages(initialMessages);

	useEffect(() => {
		if (!autoResume) {
			return;
		}

		const mostRecentMessage = safeInitialMessages.at(-1);
		const hasInvalidParts = safeInitialMessages.some(
			(msg) =>
				(msg.parts?.length ?? 0) !== (msg.parts ?? []).filter(Boolean).length,
		);

		if (mostRecentMessage?.role === "user" && !hasInvalidParts) {
			// Wrap in try-catch to handle TypeValidationError from old chats
			// that have message_annotation format which no longer matches current schema
			Promise.resolve()
				.then(() => resumeStream())
				.catch((err) => {
					// Silently ignore resume errors for old chat formats
					// The chat will still display stored messages normally
					console.warn(
						"[AutoResume] Stream resume failed (old format):",
						err?.message || err,
					);
				});
		}

		// we intentionally run this once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		autoResume,
		resumeStream,
		safeInitialMessages.at,
		safeInitialMessages.some,
	]);

	useEffect(() => {
		if (!autoResume) {
			return;
		}

		if (!dataStream) {
			return;
		}
		if (dataStream.length === 0) {
			return;
		}

		const dataPart = dataStream[0];

		if (dataPart.type === "data-appendMessage") {
			try {
				const message = sanitizeChatMessage(
					JSON.parse(dataPart.data) as ChatMessage,
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
	}, [autoResume, dataStream, safeInitialMessages, setMessages]);
}
