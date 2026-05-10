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

function getTextContentFromParts(parts: unknown): string {
	if (!Array.isArray(parts)) {
		return "";
	}

	return parts
		.map((part) => {
			if (!isRecord(part) || typeof part.type !== "string") {
				return "";
			}

			if (part.type === "text" || part.type === "reasoning") {
				return toDisplayText(part.text).trim();
			}

			return "";
		})
		.filter(Boolean)
		.join("\n");
}

function getDocumentContentPart(
	parts: UIMessagePart<CustomUIDataTypes, ChatTools>[],
) {
	for (const part of parts) {
		if (!isRecord(part)) {
			continue;
		}

		const partRecord = part as Record<string, unknown>;
		const rawType =
			typeof partRecord.type === "string" ? String(partRecord.type) : "";
		const toolName =
			typeof partRecord.toolName === "string"
				? String(partRecord.toolName)
				: "";
		const normalizedType = rawType === "dynamic-tool" ? toolName : rawType;

		if (
			normalizedType !== "createDocument" &&
			normalizedType !== "tool-createDocument"
		) {
			continue;
		}

		const source = isRecord(partRecord.output)
			? partRecord.output
			: isRecord(partRecord.input)
				? partRecord.input
				: null;
		const content =
			typeof source?.content === "string" ? source.content.trim() : "";
		const kind = typeof source?.kind === "string" ? source.kind : "text";

		if (!content) {
			continue;
		}

		return kind === "code" ? `\`\`\`\n${content}\n\`\`\`` : content;
	}

	return "";
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

	if (part.type === "dynamic-tool" && typeof part.toolName === "string") {
		return part as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	if (part.type.startsWith("tool-") && typeof part.toolCallId === "string") {
		return part as UIMessagePart<CustomUIDataTypes, ChatTools>;
	}

	return null;
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
	return messages.map((message) => {
		const safeParts = Array.isArray(message.parts)
			? message.parts
					.map(sanitizeMessagePart)
					.filter(
						(part): part is UIMessagePart<CustomUIDataTypes, ChatTools> =>
							part !== null,
					)
			: [];
		const hasTextPart = safeParts.some(
			(part) =>
				part.type === "text" && Boolean(toDisplayText(part.text).trim()),
		);
		const documentContentText = hasTextPart
			? ""
			: getDocumentContentPart(safeParts);
		const displayParts = documentContentText
			? ([
					{ type: "text", text: documentContentText },
					...safeParts,
				] as UIMessagePart<CustomUIDataTypes, ChatTools>[])
			: safeParts;

		return {
			id: message.id,
			role: message.role as "user" | "assistant" | "system",
			content: getTextContentFromParts(displayParts),
			parts: displayParts,
			metadata: {
				createdAt: formatISO(message.createdAt),
			},
		};
	});
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
		...(message as ChatMessage & { content?: string }),
		content:
			typeof (message as { content?: unknown }).content === "string" &&
			(message as { content?: string }).content?.trim()
				? ((message as { content?: string }).content ?? "")
				: getTextContentFromParts(safeParts),
		parts: safeParts,
	} as ChatMessage;
}

export function sanitizeChatMessages(messages: ChatMessage[]): ChatMessage[] {
	if (!Array.isArray(messages)) {
		return [];
	}

	return messages.map(sanitizeChatMessage);
}
