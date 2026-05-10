import type { ArtifactKind } from "@/components/artifact";
import type { ChatMessage } from "@/lib/types";

export type WorkspaceEntryCandidate = {
	content: string;
	kind: ArtifactKind;
	title: string;
	existingArtifactId?: string;
};

function normalizeWhitespace(value: string) {
	return value.replace(/\r\n/g, "\n").trim();
}

function getTextParts(message: ChatMessage) {
	return (message.parts ?? [])
		.filter(
			(part): part is { type: "text"; text: string } =>
				part?.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("\n")
		.trim();
}

function parseCreateDocumentToolCall(rawText: string) {
	const match = rawText.match(
		/p\.call_tool\s*\(\s*["']createDocument["']\s*,\s*(\{[\s\S]*\})\s*\)/,
	);

	if (!match) {
		return null;
	}

	try {
		const parsed = JSON.parse(match[1]) as {
			title?: string;
			kind?: ArtifactKind;
			content?: string;
		};

		if (!parsed?.content?.trim()) {
			return null;
		}

		return {
			content: parsed.content.trim(),
			kind: parsed.kind ?? "text",
			title: parsed.title?.trim() || "Workspace",
		};
	} catch {
		return null;
	}
}

function stripMarkdownCodeFence(value: string) {
	const match = value.match(/```([\w.+-]+)?\n([\s\S]*?)```/);
	if (!match) {
		return null;
	}

	return {
		language: (match[1] ?? "").trim().toLowerCase(),
		content: match[2].trim(),
	};
}

function inferKindFromText(value: string): ArtifactKind {
	const fenced = stripMarkdownCodeFence(value);
	if (fenced?.content) {
		return "code";
	}

	if (
		/(^|\n)\s*(import |export |const |let |var |function |class |interface |type |def |async |await |public class |#include|SELECT |INSERT INTO |UPDATE |DELETE FROM )/im.test(
			value,
		)
	) {
		return "code";
	}

	return "text";
}

function inferTitle(value: string, kind: ArtifactKind) {
	const fenced = stripMarkdownCodeFence(value);
	if (fenced?.language) {
		return `snippet.${fenced.language}`;
	}

	const firstMeaningfulLine = value
		.split("\n")
		.map((line) => line.trim())
		.find(Boolean);

	if (!firstMeaningfulLine) {
		return kind === "code" ? "snippet.txt" : "notes.txt";
	}

	if (kind === "code") {
		return "snippet.txt";
	}

	return firstMeaningfulLine.length > 36
		? `${firstMeaningfulLine.slice(0, 33).trim()}...`
		: firstMeaningfulLine;
}

function isWorkspaceRelevantText(value: string) {
	if (!value.trim()) {
		return false;
	}

	if (stripMarkdownCodeFence(value)?.content) {
		return true;
	}

	if (
		/(^|\n)\s*(import |export |const |let |var |function |class |interface |type |def |async |await |#include|SELECT |INSERT INTO |UPDATE |DELETE FROM )/im.test(
			value,
		)
	) {
		return true;
	}

	return value.trim().length >= 420;
}

function extractExistingArtifactCandidate(message: ChatMessage) {
	for (const part of message.parts ?? []) {
		if (!part || typeof part !== "object") {
			continue;
		}

		const rawType =
			"type" in part && typeof part.type === "string"
				? String(part.type)
				: "";
		const toolName =
			"toolName" in part && typeof part.toolName === "string"
				? part.toolName
				: "";
		const normalizedType =
			rawType === "dynamic-tool" || rawType === "tool-invocation"
				? toolName
				: rawType;

		if (
			normalizedType !== "createDocument" &&
			normalizedType !== "tool-createDocument"
		) {
			continue;
		}

		const source =
			"output" in part && part.output && typeof part.output === "object"
				? (part.output as Record<string, unknown>)
				: "input" in part && part.input && typeof part.input === "object"
					? (part.input as Record<string, unknown>)
					: null;

		if (!source) {
			continue;
		}

		const content =
			typeof source.content === "string"
				? normalizeWhitespace(source.content)
				: "";
		const title =
			typeof source.title === "string" ? source.title.trim() : "Workspace";
		const kind =
			typeof source.kind === "string" &&
			["code", "text", "sheet", "image"].includes(source.kind)
				? (source.kind as ArtifactKind)
				: inferKindFromText(content);
		const existingArtifactId =
			typeof source.id === "string" ? source.id : undefined;

		if (!content) {
			continue;
		}

		return {
			content,
			existingArtifactId,
			kind,
			title,
		} satisfies WorkspaceEntryCandidate;
	}

	return null;
}

export function getWorkspaceEntryCandidate(
	message: ChatMessage,
): WorkspaceEntryCandidate | null {
	const text = getTextParts(message);
	const parsedToolCall = text ? parseCreateDocumentToolCall(text) : null;
	if (parsedToolCall) {
		return parsedToolCall;
	}

	const existingArtifact = extractExistingArtifactCandidate(message);
	if (existingArtifact) {
		return existingArtifact;
	}

	if (!isWorkspaceRelevantText(text)) {
		return null;
	}

	const normalizedText = normalizeWhitespace(text);
	const kind = inferKindFromText(normalizedText);
	const fenced = stripMarkdownCodeFence(normalizedText);
	const content = fenced?.content ? fenced.content : normalizedText;

	return {
		content,
		kind,
		title: inferTitle(normalizedText, kind),
	};
}
