"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";

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

	useEffect(() => {
		if (!autoResume) {
			return;
		}

		const mostRecentMessage = initialMessages.at(-1);

		if (mostRecentMessage?.role === "user") {
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
	}, [autoResume, initialMessages.at, resumeStream]);

	useEffect(() => {
		if (!dataStream) {
			return;
		}
		if (dataStream.length === 0) {
			return;
		}

		const dataPart = dataStream[0];

		if (dataPart.type === "data-appendMessage") {
			const message = JSON.parse(dataPart.data);
			setMessages([...initialMessages, message]);
		}
	}, [dataStream, initialMessages, setMessages]);
}
