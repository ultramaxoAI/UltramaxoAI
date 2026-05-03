import {
	deleteArtifactCodeFile,
	parseArtifactCodeFiles,
	serializeArtifactCodeFiles,
	upsertArtifactCodeFile,
} from "@backend/artifacts/code-files";
import {
	getDocumentById,
	resolveExistingUserId,
	saveDocument,
} from "@backend/db/queries";
import type { UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";

const isDevelopment = process.env.NODE_ENV === "development";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamCodeSnapshot(
	dataStream: ToolContext["dataStream"],
	content: string,
) {
	dataStream.write({ type: "data-clear", data: null });

	if (!content) {
		dataStream.write({ type: "data-codeDelta", data: "" });
		dataStream.write({ type: "data-finish", data: null });
		return;
	}

	const chunkSize = 180;
	for (let index = 0; index < content.length; index += chunkSize) {
		dataStream.write({
			type: "data-codeDelta",
			data: content.slice(0, index + chunkSize),
		});
		await sleep(12);
	}

	dataStream.write({ type: "data-finish", data: null });
}

type ToolContext = {
	session: Session | null;
	dataStream: Pick<UIMessageStreamWriter<ChatMessage>, "write">;
	getDocumentId?: () => string | undefined;
	setDocumentId?: (id: string) => void;
};

type LoadedCodeDocument = Awaited<ReturnType<typeof loadCodeDocument>>;
type FallbackCodeDocument = { title: string; content: string };

function emitAgentToolStart(
	dataStream: ToolContext["dataStream"],
	tool: string,
	input: unknown,
	id = `${tool}-${Date.now()}`,
) {
	dataStream.write({
		type: "data-agent-tool_start",
		data: {
			id,
			tool,
			label: tool,
			input,
		},
	});
}

function emitAgentToolDone(
	dataStream: ToolContext["dataStream"],
	tool: string,
	input: unknown,
	output: unknown,
	status: "done" | "error" = "done",
	id = `${tool}-${Date.now()}`,
) {
	dataStream.write({
		type: "data-agent-tool_done",
		data: {
			id,
			tool,
			label: tool,
			input,
			output,
			status,
		},
	});
}

async function getEffectiveSessionUserId(session: Session | null) {
	if (!session?.user) {
		return null;
	}

	return resolveExistingUserId({
		userId: session.user.id,
		email: session.user.email,
	});
}

async function getOrAutoCreateDocumentId(
	documentId: string | undefined,
	getDocumentId: (() => string | undefined) | undefined,
	setDocumentId: ((id: string) => void) | undefined,
	dataStream: ToolContext["dataStream"],
	userId: string,
): Promise<string> {
	let idToUse = documentId || getDocumentId?.();
	if (!idToUse) {
		idToUse = crypto.randomUUID();
		setDocumentId?.(idToUse);

		// 1. Save empty shell to DB immediately so `loadCodeDocument` won't 404
		await saveDocument({
			id: idToUse,
			title: "Workspace",
			kind: "code",
			content: "",
			userId,
		});

		// 2. Auto-initialize empty document to stream to client
		dataStream.write({ type: "data-id", data: idToUse });
		dataStream.write({ type: "data-title", data: "Workspace" });
		dataStream.write({ type: "data-kind", data: "code" });
	}
	return idToUse;
}

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

	await streamCodeSnapshot(dataStream, content);

	return content;
}

export const listCodeFiles = ({
	session,
	getDocumentId,
	setDocumentId,
	dataStream,
}: Pick<
	ToolContext,
	"session" | "getDocumentId" | "setDocumentId" | "dataStream"
>) => ({
	description:
		"List files inside the current Fullstack or Mobile workspace artifact so the agent can inspect the virtual project tree.",
	inputSchema: z.object({
		documentId: z
			.string()
			.nullish()
			.describe("The code workspace document id (optional)"),
	}),
	execute: async ({ documentId }: { documentId?: string | null }) => {
		try {
			console.log("[Tool listCodeFiles] Started execution", { documentId });
			const effectiveUserId = await getEffectiveSessionUserId(session);
			if (!effectiveUserId) {
				console.error("[Tool listCodeFiles] No session user ID");
				throw new ChatSDKError("unauthorized:document");
			}

			const idToUse = await getOrAutoCreateDocumentId(
				documentId || undefined,
				getDocumentId,
				setDocumentId,
				dataStream,
				effectiveUserId,
			);
			console.log("[Tool listCodeFiles] Evaluated idToUse:", idToUse);

			let document: LoadedCodeDocument | FallbackCodeDocument;
			try {
				document = await loadCodeDocument(idToUse, effectiveUserId);
				console.log(
					"[Tool listCodeFiles] Successfully loaded existing document",
				);
			} catch (e) {
				console.log(
					"[Tool listCodeFiles] Failed to load existing document. Falling back.",
					e,
				);
				document = { title: "Workspace", content: "" };
			}
			const files = parseArtifactCodeFiles(document.content ?? "");

			console.log(
				"[Tool listCodeFiles] Returning file list. Count:",
				files.length,
			);
			return {
				documentId: idToUse,
				count: files.length,
				files: files.map((file) => file.name),
			};
		} catch (error) {
			console.error(
				"[Tool listCodeFiles] CRITICAL ERROR DURING EXECUTION:",
				error,
			);
			throw error;
		}
	},
});

export const createCodeFile = ({
	session,
	dataStream,
	getDocumentId,
	setDocumentId,
}: ToolContext) => ({
	description:
		"Create a new file in the virtual Fullstack or Mobile workspace artifact. Use this when adding components, pages, styles, utilities, or config files.",
	inputSchema: z.object({
		documentId: z
			.string()
			.nullish()
			.describe("The code workspace document id (optional)"),
		path: z
			.string()
			.nullish()
			.describe("File path to create, like components/Hero.jsx"),
		content: z.string().nullish().describe("Full file contents"),
	}),
	execute: async ({
		documentId,
		path,
		content,
	}: {
		documentId?: string | null;
		path?: string | null;
		content?: string | null;
	}) => {
		try {
			if (isDevelopment) {
				console.log("[Tool createCodeFile] Input:", {
					documentId,
					path,
					contentLength: content?.length ?? 0,
				});
			}

			const safePath = path || "untitled.ts";
			const safeContent = content || "";

			console.log("[Tool createCodeFile] Started execution", {
				documentId,
				path: safePath,
				contentLength: safeContent.length,
			});
			const effectiveUserId = await getEffectiveSessionUserId(session);
			if (!effectiveUserId) {
				console.error("[Tool createCodeFile] No session user ID");
				throw new ChatSDKError("unauthorized:document");
			}

			const idToUse = await getOrAutoCreateDocumentId(
				documentId || undefined,
				getDocumentId,
				setDocumentId,
				dataStream,
				effectiveUserId,
			);
			console.log("[Tool createCodeFile] Evaluated idToUse:", idToUse);

			let document: LoadedCodeDocument | FallbackCodeDocument;
			try {
				document = await loadCodeDocument(idToUse, effectiveUserId);
				console.log(
					"[Tool createCodeFile] Successfully loaded existing document",
				);
			} catch (e) {
				console.log(
					"[Tool createCodeFile] Failed to load existing document (expected if auto-created). Falling back.",
					e,
				);
				document = { title: "Workspace", content: "" };
			}
			const files = parseArtifactCodeFiles(document.content ?? "");
			const nextFiles = upsertArtifactCodeFile(files, safePath, safeContent);
			const serialized = serializeArtifactCodeFiles(nextFiles);

			console.log(
				"[Tool createCodeFile] Parsed and upserted. Writing to db...",
			);
			await persistCodeDocument(
				idToUse,
				serialized,
				document.title,
				effectiveUserId,
				dataStream,
			);
			console.log("[Tool createCodeFile] Persisted. Returning true.");

			return {
				documentId: idToUse,
				path: safePath,
				action: "created",
				files: nextFiles.map((file) => file.name),
			};
		} catch (error) {
			console.error(
				"[Tool createCodeFile] CRITICAL ERROR DURING EXECUTION:",
				error,
			);
			throw error;
		}
	},
});

export const updateCodeFile = ({
	session,
	dataStream,
	getDocumentId,
	setDocumentId,
}: ToolContext) => ({
	description:
		"Update an existing file in the virtual Fullstack or Mobile workspace artifact. Use this when editing code, refactoring, or replacing a file entirely.",
	inputSchema: z.object({
		documentId: z
			.string()
			.nullish()
			.describe("The code workspace document id (optional)"),
		path: z
			.string()
			.nullish()
			.describe("File path to update, like components/Hero.jsx"),
		content: z.string().nullish().describe("Full file contents after update"),
	}),
	execute: async ({
		documentId,
		path,
		content,
	}: {
		documentId?: string | null;
		path?: string | null;
		content?: string | null;
	}) => {
		try {
			if (isDevelopment) {
				console.log("[Tool updateCodeFile] Input:", {
					documentId,
					path,
					contentLength: content?.length ?? 0,
				});
			}

			const safePath = path || "untitled.ts";
			const safeContent = content || "";

			console.log("[Tool updateCodeFile] Started execution", {
				documentId,
				path: safePath,
				contentLength: safeContent.length,
			});
			const effectiveUserId = await getEffectiveSessionUserId(session);
			if (!effectiveUserId) {
				console.error("[Tool updateCodeFile] No session user ID");
				throw new ChatSDKError("unauthorized:document");
			}

			const idToUse = await getOrAutoCreateDocumentId(
				documentId || undefined,
				getDocumentId,
				setDocumentId,
				dataStream,
				effectiveUserId,
			);
			console.log("[Tool updateCodeFile] Evaluated idToUse:", idToUse);

			let document: LoadedCodeDocument | FallbackCodeDocument;
			try {
				document = await loadCodeDocument(idToUse, effectiveUserId);
				console.log(
					"[Tool updateCodeFile] Successfully loaded existing document",
				);
			} catch (e) {
				console.log(
					"[Tool updateCodeFile] Failed to load existing document. Falling back.",
					e,
				);
				document = { title: "Workspace", content: "" };
			}
			const files = parseArtifactCodeFiles(document.content ?? "");
			const nextFiles = upsertArtifactCodeFile(files, safePath, safeContent);
			const serialized = serializeArtifactCodeFiles(nextFiles);

			console.log(
				"[Tool updateCodeFile] Parsed and upserted. Writing to db...",
			);
			await persistCodeDocument(
				idToUse,
				serialized,
				document.title,
				effectiveUserId,
				dataStream,
			);
			console.log("[Tool updateCodeFile] Persisted. Returning true.");

			return {
				documentId: idToUse,
				path: safePath,
				action: "updated",
				files: nextFiles.map((file) => file.name),
			};
		} catch (error) {
			console.error(
				"[Tool updateCodeFile] CRITICAL ERROR DURING EXECUTION:",
				error,
			);
			throw error;
		}
	},
});

export const deleteCodeFile = ({
	session,
	dataStream,
	getDocumentId,
	setDocumentId,
}: ToolContext) => ({
	description:
		"Delete a file from the virtual Fullstack or Mobile workspace artifact. Use this when removing obsolete files or simplifying the project.",
	inputSchema: z.object({
		documentId: z
			.string()
			.nullish()
			.describe("The code workspace document id (optional)"),
		path: z.string().min(1).describe("File path to delete"),
	}),
	execute: async ({
		documentId,
		path,
	}: {
		documentId?: string | null;
		path: string;
	}) => {
		try {
			console.log("[Tool deleteCodeFile] Started execution", {
				documentId,
				path,
			});
			const effectiveUserId = await getEffectiveSessionUserId(session);
			if (!effectiveUserId) {
				console.error("[Tool deleteCodeFile] No session user ID");
				throw new ChatSDKError("unauthorized:document");
			}

			const idToUse = await getOrAutoCreateDocumentId(
				documentId || undefined,
				getDocumentId,
				setDocumentId,
				dataStream,
				effectiveUserId,
			);
			console.log("[Tool deleteCodeFile] Evaluated idToUse:", idToUse);

			let document: LoadedCodeDocument | FallbackCodeDocument;
			try {
				document = await loadCodeDocument(idToUse, effectiveUserId);
				console.log(
					"[Tool deleteCodeFile] Successfully loaded existing document",
				);
			} catch (e) {
				console.log(
					"[Tool deleteCodeFile] Failed to load existing document. Falling back.",
					e,
				);
				document = { title: "Workspace", content: "" };
			}
			const files = parseArtifactCodeFiles(document.content ?? "");
			const nextFiles = deleteArtifactCodeFile(files, path);
			const serialized = serializeArtifactCodeFiles(nextFiles);

			console.log("[Tool deleteCodeFile] Parsed and deleted. Writing to db...");
			await persistCodeDocument(
				idToUse,
				serialized,
				document.title,
				effectiveUserId,
				dataStream,
			);
			console.log("[Tool deleteCodeFile] Persisted. Returning true.");

			return {
				documentId: idToUse,
				path,
				action: "deleted",
				files: nextFiles.map((file) => file.name),
			};
		} catch (error) {
			console.error(
				"[Tool deleteCodeFile] CRITICAL ERROR DURING EXECUTION:",
				error,
			);
			throw error;
		}
	},
});

/**
 * Execute a terminal command in the WebContainer.
 * Emits a "data-terminal-command" event that the frontend intercepts
 * and runs inside the WebContainer.
 */
export const executeTerminalCommand = ({
	dataStream,
}: Pick<ToolContext, "dataStream">) => ({
	description:
		"Execute a real terminal command inside the WebContainer environment (e.g. npm install, npx create-next-app, mkdir, etc.). The command runs in a browser-based Node.js virtual machine. Use this for any shell operations needed to build the project.",
	inputSchema: z.object({
		command: z
			.string()
			.min(1)
			.describe(
				"Full shell command to execute, e.g. 'npm install framer-motion' or 'npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias @/* --use-npm'",
			),
		purpose: z.string().min(1).describe("Why this command is being executed"),
	}),
	execute: async ({
		command,
		purpose,
	}: {
		command: string;
		purpose: string;
	}) => {
		const stepId = `run_command-${Date.now()}`;
		emitAgentToolStart(dataStream, "run_command", { command, purpose }, stepId);
		// Emit the command to the frontend data stream
		dataStream.write({
			type: "data-terminal-command",
			data: JSON.stringify({ command, purpose }),
		});

		const output = {
			command,
			purpose,
			status: "dispatched",
			note: "Command sent to WebContainer for execution. Output will appear in the terminal.",
		};
		emitAgentToolDone(
			dataStream,
			"run_command",
			{ command, purpose },
			output,
			"done",
			stepId,
		);
		return output;
	},
});

export const runCommand = executeTerminalCommand;

/**
 * Install npm packages in the WebContainer.
 * Shortcut for npm install <packages>.
 */
export const installDependency = ({
	dataStream,
}: Pick<ToolContext, "dataStream">) => ({
	description:
		"Install one or more npm packages in the WebContainer environment. Equivalent to running 'npm install <package1> <package2> ...'",
	inputSchema: z.object({
		packages: z
			.array(z.string().min(1))
			.min(1)
			.describe(
				"Package names to install, e.g. ['framer-motion', 'lucide-react']",
			),
		purpose: z.string().min(1).describe("Why these packages are needed"),
	}),
	execute: async ({
		packages,
		purpose,
	}: {
		packages: string[];
		purpose: string;
	}) => {
		const stepId = `install_package-${Date.now()}`;
		emitAgentToolStart(
			dataStream,
			"install_package",
			{ packages, purpose },
			stepId,
		);
		dataStream.write({
			type: "data-install-package",
			data: JSON.stringify({ packages, purpose }),
		});

		const output = {
			packages,
			purpose,
			status: "dispatched",
			note: "Package installation sent to WebContainer.",
		};
		emitAgentToolDone(
			dataStream,
			"install_package",
			{ packages, purpose },
			output,
			"done",
			stepId,
		);
		return output;
	},
});

export const installPackage = installDependency;

export const createFile = createCodeFile;
export const editFile = updateCodeFile;
export const listFiles = listCodeFiles;

export const readFile = ({
	session,
	dataStream,
	getDocumentId,
	setDocumentId,
}: ToolContext) => ({
	description: "Read a file from the current virtual workspace artifact.",
	inputSchema: z.object({
		documentId: z.string().nullish().describe("Workspace document id"),
		path: z.string().min(1).describe("File path to read"),
	}),
	execute: async ({
		documentId,
		path,
	}: {
		documentId?: string | null;
		path: string;
	}) => {
		const stepId = `read_file-${Date.now()}`;
		emitAgentToolStart(dataStream, "read_file", { documentId, path }, stepId);
		const effectiveUserId = await getEffectiveSessionUserId(session);
		if (!effectiveUserId) {
			throw new ChatSDKError("unauthorized:document");
		}
		const idToUse = await getOrAutoCreateDocumentId(
			documentId || undefined,
			getDocumentId,
			setDocumentId,
			dataStream,
			effectiveUserId,
		);
		const document = await loadCodeDocument(idToUse, effectiveUserId);
		const file = parseArtifactCodeFiles(document.content ?? "").find(
			(item) => item.name === path,
		);
		const output = {
			documentId: idToUse,
			path,
			content: file?.content ?? "",
			found: Boolean(file),
		};
		emitAgentToolDone(
			dataStream,
			"read_file",
			{ documentId, path },
			output,
			"done",
			stepId,
		);
		return output;
	},
});

export const createFolder = ({
	dataStream,
}: Pick<ToolContext, "dataStream">) => ({
	description:
		"Create a folder in the WebContainer terminal. Use before shell-based project setup when needed.",
	inputSchema: z.object({
		path: z.string().min(1).describe("Folder path to create"),
	}),
	execute: async ({ path }: { path: string }) => {
		const command = `mkdir -p ${JSON.stringify(path)}`;
		const stepId = `create_folder-${Date.now()}`;
		emitAgentToolStart(dataStream, "create_folder", { path }, stepId);
		dataStream.write({
			type: "data-terminal-command",
			data: JSON.stringify({ command, purpose: `Create folder ${path}` }),
		});
		const output = { path, command, status: "dispatched" };
		emitAgentToolDone(
			dataStream,
			"create_folder",
			{ path },
			output,
			"done",
			stepId,
		);
		return output;
	},
});

/**
 * Start the dev server in the WebContainer.
 * Runs npm run dev and returns the preview URL when ready.
 */
export const startPreviewServer = ({
	dataStream,
}: Pick<ToolContext, "dataStream">) => ({
	description:
		"Start the development server (npm run dev) in the WebContainer and open the live preview. Call this after all files are created and dependencies are installed.",
	inputSchema: z.object({
		purpose: z.string().min(1).describe("Why the dev server is being started"),
	}),
	execute: async ({ purpose }: { purpose: string }) => {
		dataStream.write({
			type: "data-start-dev-server",
			data: JSON.stringify({ purpose }),
		});

		return {
			purpose,
			status: "dispatched",
			note: "Dev server start command sent to WebContainer. Preview will appear when ready.",
		};
	},
});

/**
 * Legacy: Report a virtual workspace command.
 * Kept for backward compatibility.
 */
export const runWorkspaceCommand = () => ({
	description:
		"Report a virtual workspace command for the IDE. Use executeTerminalCommand instead when real execution is needed.",
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
