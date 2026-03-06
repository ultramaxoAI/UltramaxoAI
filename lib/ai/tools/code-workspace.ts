import type { Session } from "next-auth";
import { z } from "zod";
import {
	deleteArtifactCodeFile,
	parseArtifactCodeFiles,
	serializeArtifactCodeFiles,
	upsertArtifactCodeFile,
} from "@/lib/artifacts/code-files";
import { getDocumentById, saveDocument } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

type WorkspaceStreamChunk =
	| { type: "data-clear"; data: null }
	| { type: "data-codeDelta"; data: string }
	| { type: "data-finish"; data: null };

type ToolContext = {
	session: Session | null;
	dataStream: { write: (chunk: WorkspaceStreamChunk) => void };
};

async function loadCodeDocument(documentId: string, userId?: string) {
	const document = await getDocumentById({ id: documentId });

	if (!document) {
		throw new ChatSDKError("not_found:document", "Code workspace not found");
	}

	if (userId && document.userId !== userId) {
		throw new ChatSDKError(
			"forbidden:document",
			"Not allowed to edit this workspace",
		);
	}

	if (document.kind !== "code") {
		throw new ChatSDKError(
			"bad_request:document",
			"Workspace document must be code",
		);
	}

	return document;
}

async function persistCodeDocument(
	documentId: string,
	content: string,
	title: string,
	userId: string,
	dataStream: ToolContext["dataStream"],
) {
	await saveDocument({
		id: documentId,
		title,
		kind: "code",
		content,
		userId,
	});

	dataStream.write({ type: "data-clear", data: null });
	dataStream.write({ type: "data-codeDelta", data: content });
	dataStream.write({ type: "data-finish", data: null });

	return content;
}

export const listCodeFiles = ({ session }: Pick<ToolContext, "session">) => ({
	description:
		"List files inside the current Fullstack or Mobile workspace artifact so the agent can inspect the virtual project tree.",
	inputSchema: z.object({
		documentId: z.string().uuid().describe("The code workspace document id"),
	}),
	execute: async ({ documentId }: { documentId: string }) => {
		const document = await loadCodeDocument(documentId, session?.user?.id);
		const files = parseArtifactCodeFiles(document.content ?? "").map(
			(file) => file.name,
		);

		return {
			documentId,
			files,
			count: files.length,
		};
	},
});

export const createCodeFile = ({ session, dataStream }: ToolContext) => ({
	description:
		"Create a new file in the virtual Fullstack or Mobile workspace artifact. Use this when adding components, pages, styles, utilities, or config files.",
	inputSchema: z.object({
		documentId: z.string().uuid().describe("The code workspace document id"),
		path: z
			.string()
			.min(1)
			.describe("File path to create, like components/Hero.jsx"),
		content: z.string().describe("Full file contents"),
	}),
	execute: async ({
		documentId,
		path,
		content,
	}: {
		documentId: string;
		path: string;
		content: string;
	}) => {
		if (!session?.user?.id) {
			throw new ChatSDKError("unauthorized:document");
		}

		const document = await loadCodeDocument(documentId, session.user.id);
		const files = parseArtifactCodeFiles(document.content ?? "");
		const nextFiles = upsertArtifactCodeFile(files, path, content);
		const serialized = serializeArtifactCodeFiles(nextFiles);

		await persistCodeDocument(
			documentId,
			serialized,
			document.title,
			session.user.id,
			dataStream,
		);

		return {
			documentId,
			path,
			action: "created",
			files: nextFiles.map((file) => file.name),
		};
	},
});

export const updateCodeFile = ({ session, dataStream }: ToolContext) => ({
	description:
		"Update an existing file in the virtual Fullstack or Mobile workspace artifact. Use this when editing code, refactoring, or replacing a file entirely.",
	inputSchema: z.object({
		documentId: z.string().uuid().describe("The code workspace document id"),
		path: z.string().min(1).describe("File path to update"),
		content: z.string().describe("Full updated file contents"),
	}),
	execute: async ({
		documentId,
		path,
		content,
	}: {
		documentId: string;
		path: string;
		content: string;
	}) => {
		if (!session?.user?.id) {
			throw new ChatSDKError("unauthorized:document");
		}

		const document = await loadCodeDocument(documentId, session.user.id);
		const files = parseArtifactCodeFiles(document.content ?? "");
		const nextFiles = upsertArtifactCodeFile(files, path, content);
		const serialized = serializeArtifactCodeFiles(nextFiles);

		await persistCodeDocument(
			documentId,
			serialized,
			document.title,
			session.user.id,
			dataStream,
		);

		return {
			documentId,
			path,
			action: "updated",
			files: nextFiles.map((file) => file.name),
		};
	},
});

export const deleteCodeFile = ({ session, dataStream }: ToolContext) => ({
	description:
		"Delete a file from the virtual Fullstack or Mobile workspace artifact. Use this when removing obsolete files or simplifying the project.",
	inputSchema: z.object({
		documentId: z.string().uuid().describe("The code workspace document id"),
		path: z.string().min(1).describe("File path to delete"),
	}),
	execute: async ({
		documentId,
		path,
	}: {
		documentId: string;
		path: string;
	}) => {
		if (!session?.user?.id) {
			throw new ChatSDKError("unauthorized:document");
		}

		const document = await loadCodeDocument(documentId, session.user.id);
		const files = parseArtifactCodeFiles(document.content ?? "");
		const nextFiles = deleteArtifactCodeFile(files, path);
		const serialized = serializeArtifactCodeFiles(nextFiles);

		await persistCodeDocument(
			documentId,
			serialized,
			document.title,
			session.user.id,
			dataStream,
		);

		return {
			documentId,
			path,
			action: "deleted",
			files: nextFiles.map((file) => file.name),
		};
	},
});

export const runWorkspaceCommand = () => ({
	description:
		"Report a virtual workspace command for the IDE, such as npm install package-name, npm run dev, or pnpm add axios. This only mirrors the command log and does not mutate files or install packages by itself, so required package.json and code changes must already exist before calling it.",
	inputSchema: z.object({
		command: z.string().min(1).describe("Command label to display"),
		purpose: z.string().min(1).describe("Why the command is being executed"),
		result: z.string().min(1).describe("Concise outcome of the command"),
	}),
	execute: async ({
		command,
		purpose,
		result,
	}: {
		command: string;
		purpose: string;
		result: string;
	}) => ({
		command,
		purpose,
		result,
		status: "completed",
	}),
});
