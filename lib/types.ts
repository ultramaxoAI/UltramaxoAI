import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { webSearch } from "./ai/tools/web-search";
import type { Suggestion } from "./db/schema";

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

export type ChatTools = {
	getWeather: weatherTool;
	requestSuggestions: requestSuggestionsTool;
	webSearch: webSearchTool;
	createDocument: createDocumentTool;
	updateDocument: updateDocumentTool;
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
> & { annotations?: any[] };

export type Attachment = {
	name: string;
	url: string;
	contentType: string;
};
