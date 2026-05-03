import type {
	reportAgentStep,
	startAgentTask,
} from "@backend/ai/tools/agent-mode";
import type {
	createCodeFile,
	createFile,
	createFolder,
	deleteCodeFile,
	editFile,
	executeTerminalCommand,
	installDependency,
	installPackage,
	listCodeFiles,
	listFiles,
	readFile,
	runCommand,
	runWorkspaceCommand,
	startPreviewServer,
	updateCodeFile,
} from "@backend/ai/tools/code-workspace";
import type { createDocument } from "@backend/ai/tools/create-document";
import type { getWeather } from "@backend/ai/tools/get-weather";
import type { requestSuggestions } from "@backend/ai/tools/request-suggestions";
import type { updateDocument } from "@backend/ai/tools/update-document";
import type { webSearch } from "@backend/ai/tools/web-search";
import type { Suggestion } from "@backend/db/schema";
import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type requestSuggestionsTool = InferUITool<
	ReturnType<typeof requestSuggestions>
>;
type webSearchTool = InferUITool<typeof webSearch>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type startAgentTaskTool = InferUITool<ReturnType<typeof startAgentTask>>;
type reportAgentStepTool = InferUITool<ReturnType<typeof reportAgentStep>>;
type listCodeFilesTool = InferUITool<ReturnType<typeof listCodeFiles>>;
type createCodeFileTool = InferUITool<ReturnType<typeof createCodeFile>>;
type createFileTool = InferUITool<ReturnType<typeof createFile>>;
type createFolderTool = InferUITool<ReturnType<typeof createFolder>>;
type updateCodeFileTool = InferUITool<ReturnType<typeof updateCodeFile>>;
type editFileTool = InferUITool<ReturnType<typeof editFile>>;
type deleteCodeFileTool = InferUITool<ReturnType<typeof deleteCodeFile>>;
type readFileTool = InferUITool<ReturnType<typeof readFile>>;
type listFilesTool = InferUITool<ReturnType<typeof listFiles>>;
type runCommandTool = InferUITool<ReturnType<typeof runCommand>>;
type executeTerminalCommandTool = InferUITool<
	ReturnType<typeof executeTerminalCommand>
>;
type installPackageTool = InferUITool<ReturnType<typeof installPackage>>;
type installDependencyTool = InferUITool<ReturnType<typeof installDependency>>;
type startPreviewServerTool = InferUITool<
	ReturnType<typeof startPreviewServer>
>;
type runWorkspaceCommandTool = InferUITool<
	ReturnType<typeof runWorkspaceCommand>
>;

export type ChatTools = {
	getWeather: weatherTool;
	requestSuggestions: requestSuggestionsTool;
	webSearch: webSearchTool;
	createDocument: createDocumentTool;
	updateDocument: updateDocumentTool;
	startAgentTask: startAgentTaskTool;
	reportAgentStep: reportAgentStepTool;
	listCodeFiles: listCodeFilesTool;
	createCodeFile: createCodeFileTool;
	createFile: createFileTool;
	createFolder: createFolderTool;
	updateCodeFile: updateCodeFileTool;
	editFile: editFileTool;
	deleteCodeFile: deleteCodeFileTool;
	readFile: readFileTool;
	listFiles: listFilesTool;
	runCommand: runCommandTool;
	executeTerminalCommand: executeTerminalCommandTool;
	installPackage: installPackageTool;
	installDependency: installDependencyTool;
	startPreviewServer: startPreviewServerTool;
	runWorkspaceCommand: runWorkspaceCommandTool;
};

export type CustomUIDataTypes = {
	textDelta: string;
	imageDelta: string;
	sheetDelta: string;
	codeDelta: string;
	suggestion: Suggestion;
	appendMessage: string;
	id: string;
	title: string;
	kind: ArtifactKind;
	clear: null;
	finish: null;
	"chat-title": string;
	"agent-thinking": {
		id?: string;
		label?: string;
		status?: string;
		duration?: number;
	};
	"agent-tool_start": {
		id?: string;
		toolCallId?: string;
		label?: string;
		tool?: string;
		args?: string;
		input?: unknown;
	};
	"agent-tool_done": {
		id?: string;
		toolCallId?: string;
		label?: string;
		tool?: string;
		args?: string;
		input?: unknown;
		result?: string;
		output?: unknown;
		status?: string;
		duration?: number;
	};
	"agent-done": {
		status?: string;
		duration?: number;
	};
	"terminal-command": string;
	"install-package": string;
	"start-dev-server": string;
	"create-document": {
		type: "create-document";
		id: string;
		title: string;
		kind: ArtifactKind;
		content: string;
	};
	"update-document": {
		type: "update-document";
		id: string;
		content: string;
	};
};

export type ChatMessage = UIMessage<
	MessageMetadata,
	CustomUIDataTypes,
	ChatTools
> & { annotations?: unknown[] };

export type Attachment = {
	name: string;
	url: string;
	contentType: string;
};
