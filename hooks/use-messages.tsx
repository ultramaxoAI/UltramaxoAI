import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMessages({
	status,
}: {
	status: UseChatHelpers<ChatMessage>["status"];
}) {
	const {
		containerRef,
		endRef,
		isAtBottom,
		scrollToBottom,
		onViewportEnter,
		onViewportLeave,
	} = useScrollToBottom();

	const [hasSentMessage, setHasSentMessage] = useState(false);

	useEffect(() => {
		if (status === "submitted") {
			setHasSentMessage(true);
			scrollToBottom("smooth");
		}
	}, [scrollToBottom, status]);

	useEffect(() => {
		if (status === "streaming" && isAtBottom) {
			scrollToBottom("auto");
		}
	}, [isAtBottom, scrollToBottom, status]);

	return {
		containerRef,
		endRef,
		isAtBottom,
		scrollToBottom,
		onViewportEnter,
		onViewportLeave,
		hasSentMessage,
	};
}
