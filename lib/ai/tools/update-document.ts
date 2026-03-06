import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveDocument } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

type DocumentStreamChunk =
	| { type: "data-clear"; data: null }
	| { type: "data-textDelta"; data: string }
	| { type: "data-codeDelta"; data: string }
	| { type: "data-finish"; data: null };

export const updateDocument = ({
	session,
	dataStream,
}: {
	session: Session | null;
	dataStream: { write: (chunk: DocumentStreamChunk) => void };
}) => {
	return {
		description: "Update an existing document (code, text, or spreadsheet).",
		inputSchema: z.object({
			id: z.string().describe("The ID of the document to update"),
			content: z
				.string()
				.describe("The new content to replace the document with"),
			kind: z
				.enum(["code", "text", "sheet", "image"])
				.optional()
				.describe(
					"The type of document (optional, to determine stream format)",
				),
		}),
		execute: async ({
			id,
			content,
			kind,
		}: {
			id: string;
			content: string;
			kind?: "code" | "text" | "sheet" | "image";
		}) => {
			console.log(`[Tool: updateDocument] Triggered for id: ${id}`);
			const normalizedContent = content.trim();
			let persisted = false;

			const existingDocument = await getDocumentById({ id });

			if (!existingDocument) {
				throw new ChatSDKError(
					"not_found:document",
					"Document not found for update",
				);
			}

			if (session?.user?.id) {
				try {
					await saveDocument({
						id,
						title: existingDocument.title,
						kind: kind ?? existingDocument.kind,
						content: normalizedContent,
						userId: session.user.id,
					});
					persisted = true;
				} catch (error) {
					console.warn(
						"[Tool: updateDocument] Persist failed, continuing with streamed update",
						error,
					);
				}
			}

			// Clear previous content then send new content
			dataStream.write({ type: "data-clear", data: null });

			// Send content in the appropriate format based on kind
			if (kind === "text") {
				dataStream.write({
					type: "data-textDelta",
					data: normalizedContent,
				});
			} else {
				// default to codeDelta for code, sheet, image, or unknown kind
				dataStream.write({
					type: "data-codeDelta",
					data: normalizedContent,
				});
			}

			dataStream.write({ type: "data-finish", data: null });

			return {
				id,
				content: normalizedContent,
				persisted,
				message: `Updated document '${id}'`,
			};
		},
	};
};
