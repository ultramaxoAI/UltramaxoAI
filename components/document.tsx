import { memo } from "react";
import { toast } from "sonner";
import { useArtifact } from "@/hooks/use-artifact";
import { ArtifactCard } from "./ArtifactCard";
import type { ArtifactKind } from "./artifact";

const getActionText = (
	type: "create" | "update" | "request-suggestions",
	tense: "present" | "past",
) => {
	switch (type) {
		case "create":
			return tense === "present" ? "Creating" : "Created";
		case "update":
			return tense === "present" ? "Updating" : "Updated";
		case "request-suggestions":
			return tense === "present"
				? "Adding suggestions"
				: "Added suggestions to";
		default:
			return null;
	}
};

function openArtifactWorkspace({
	setArtifact,
	result,
	isReadonly,
	rect,
}: {
	setArtifact: ReturnType<typeof useArtifact>["setArtifact"];
	result: { id: string; title: string; kind: ArtifactKind; content?: string };
	isReadonly: boolean;
	rect?: DOMRect;
}) {
	if (isReadonly) {
		toast.error("Viewing files in shared chats is currently not supported.");
		return;
	}

	const boundingBox = rect
		? {
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
		}
		: undefined;

	setArtifact((currentArtifact) => ({
		documentId: result.id,
		kind: result.kind,
		content: result.content ?? currentArtifact.content,
		title: result.title,
		isVisible: true,
		status: "idle",
		streamState: "completed",
		boundingBox: boundingBox ?? currentArtifact.boundingBox,
	}));
}

type DocumentToolResultProps = {
	type: "create" | "update" | "request-suggestions";
	result: { id: string; title: string; kind: ArtifactKind; content?: string };
	isReadonly: boolean;
};

function PureDocumentToolResult({
	type,
	result,
	isReadonly,
}: DocumentToolResultProps) {
	const { setArtifact } = useArtifact();

	return (
		<ArtifactCard
			filename={result.title}
			onOpen={() =>
				openArtifactWorkspace({
					setArtifact,
					result,
					isReadonly,
				})
			}
			status="done"
			subtitles={["Artifact siap dipakai", "Workspace siap dibuka"]}
			title={`${getActionText(type, "past")} \"${result.title}\"`}
		/>
	);
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

type DocumentToolCallArgs =
	| { title?: string; kind?: ArtifactKind; content?: string | null }
	| { id?: string; description?: string }
	| { documentId?: string }
	| undefined;

type DocumentToolCallProps = {
	type: "create" | "update" | "request-suggestions";
	args: DocumentToolCallArgs;
	isReadonly: boolean;
};

function PureDocumentToolCall({
	type,
	args,
	isReadonly,
}: DocumentToolCallProps) {
	const { setArtifact } = useArtifact();
	const safeArgs = args ?? {};
	const title =
		type === "create" && "title" in safeArgs && typeof safeArgs.title === "string"
			? safeArgs.title
			: type === "update" &&
				"description" in safeArgs &&
				typeof safeArgs.description === "string"
				? safeArgs.description
				: "artifact";
	const kind =
		type === "create" && "kind" in safeArgs && safeArgs.kind
			? safeArgs.kind
			: "code";
	const initialContent =
		"content" in safeArgs && typeof safeArgs.content === "string"
			? safeArgs.content
			: "";

	return (
		<ArtifactCard
			filename={title}
			onOpen={() => {
				if (isReadonly) {
					toast.error("Viewing files in shared chats is currently not supported.");
					return;
				}

				setArtifact((currentArtifact) => ({
					...currentArtifact,
					title,
					kind,
					content: initialContent || currentArtifact.content,
					isVisible: true,
					status: initialContent ? "idle" : "streaming",
					streamState: initialContent ? "completed" : "pending",
				}));
			}}
			status="streaming"
			subtitles={[
				"Menyiapkan artifact surface",
				"Menyusun struktur isi",
				"Merangkai detail akhir",
			]}
			title={`${getActionText(type, "present")} \"${title}\"`}
		/>
	);
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
