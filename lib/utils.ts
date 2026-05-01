import type { DBMessage, Document } from "@backend/db/schema";
import type {
	AssistantModelMessage,
	ToolModelMessage,
	UIMessage,
	UIMessagePart,
} from "ai";
import { type ClassValue, clsx } from "clsx";
import { formatISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import { ChatSDKError, type ErrorCode } from "./errors";
import type { ChatMessage, ChatTools, CustomUIDataTypes } from "./types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
	const response = await fetch(url);

	if (!response.ok) {
		const { code, cause } = await response.json();
		throw new ChatSDKError(code as ErrorCode, cause);
	}

	return response.json();
};

export async function fetchWithErrorHandlers(
	input: RequestInfo | URL,
	init?: RequestInit,
) {
	try {
		const response = await fetch(input, init);

		if (!response.ok) {
			const { code, cause } = await response.json();
			throw new ChatSDKError(code as ErrorCode, cause);
		}

		return response;
	} catch (error: unknown) {
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			throw new ChatSDKError("offline:chat");
		}

		throw error;
	}
}

export function getLocalStorage(key: string) {
	if (typeof window !== "undefined") {
		return JSON.parse(localStorage.getItem(key) || "[]");
	}
	return [];
}

export function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

type ResponseMessageWithoutId = ToolModelMessage | AssistantModelMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
	const userMessages = messages.filter((message) => message.role === "user");
	return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
	documents: Document[],
	index: number,
) {
	if (!documents) {
		return new Date();
	}
	if (index > documents.length) {
		return new Date();
	}

	return documents[index].createdAt;
}

export function getTrailingMessageId({
	messages,
}: {
	messages: ResponseMessage[];
}): string | null {
	const trailingMessage = messages.at(-1);

	if (!trailingMessage) {
		return null;
	}

	return trailingMessage.id;
}

export function sanitizeText(text: string) {
	return text.replace("<has_function_call>", "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toDisplayText(value: unknown) {
	if (typeof value === "string") {
		return value;
	}

	if (value == null) {
		return "";
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function sanitizeMessagePart(part: unknown) {
	if (!isRecord(part) || typeof part.type !== "string") {
		return null;
	}

	if (part.type === "text") {
		return {
			...part,
			type: "text",
			text: toDisplayText(part.text),
		} as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	if (part.type === "reasoning") {
		return {
			...part,
			type: "reasoning",
			text: toDisplayText(part.text),
		} as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	if (part.type === "file") {
		if (typeof part.url !== "string" || typeof part.mediaType !== "string") {
			return null;
		}

		return {
			...part,
			type: "file",
			url: part.url,
			mediaType: part.mediaType,
			filename: typeof part.filename === "string" ? part.filename : undefined,
		} as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	if (part.type === "tool-invocation") {
		return part as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	if (part.type.startsWith("tool-") && typeof part.toolCallId === "string") {
		return part as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	return null;
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
	return messages.map((message) => ({
		id: message.id,
		role: message.role as "user" | "assistant" | "system",
		parts: Array.isArray(message.parts)
			? message.parts
					.map(sanitizeMessagePart)
					.filter(
						(part): part is UIMessagePart<CustomUIDataTypes, ChatTools> =>
							part !== null,
					)
			: [],
		metadata: {
			createdAt: formatISO(message.createdAt),
		},
	}));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => (part as { type: "text"; text: string }).text)
		.join("");
}

export function sanitizeChatMessage(message: ChatMessage): ChatMessage {
	const safeParts = Array.isArray(message.parts)
		? message.parts.filter((part): part is ChatMessage["parts"][number] =>
				Boolean(
					part &&
						typeof part === "object" &&
						"type" in part &&
						typeof (part as { type?: unknown }).type === "string",
				),
			)
		: [];

	return {
		...message,
		parts: safeParts,
	};
}

export function sanitizeChatMessages(messages: ChatMessage[]): ChatMessage[] {
	if (!Array.isArray(messages)) {
		return [];
	}

	return messages.map(sanitizeChatMessage);
}
