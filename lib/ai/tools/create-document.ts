import type { Session } from "next-auth";
import { z } from "zod";
import { saveDocument } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

type CreateDocumentStreamChunk =
	| { type: "data-id"; data: string }
	| { type: "data-title"; data: string }
	| { type: "data-kind"; data: "code" | "text" | "sheet" | "image" }
	| { type: "data-clear"; data: null }
	| { type: "data-textDelta"; data: string }
	| { type: "data-codeDelta"; data: string }
	| { type: "data-finish"; data: null };

export const createDocument = ({
	session,
	dataStream,
}: {
	session: Session | null;
	dataStream: { write: (chunk: CreateDocumentStreamChunk) => void };
}) => {
	return {
		description:
			"Create a new document for code, text, or spreadsheets. This opens a side panel for the user. ALWAYS use this for writing code.",
		inputSchema: z.object({
			title: z.string().describe("The title of the document"),
			kind: z
				.enum(["code", "text", "sheet", "image"])
				.describe("The type of document to create"),
			content: z
				.string()
				.describe(
					"The FULL initial content of the document (code, text, or csv). YOU MUST PUT THE FINAL, COMPLETE CODE OR TEXT HERE. DO NOT LEAVE THIS EMPTY.",
				),
		}),
		execute: async ({
			title,
			kind,
			content,
		}: {
			title: string;
			kind: "code" | "text" | "sheet" | "image";
			content: string;
		}) => {
			const id = generateUUID();

			console.log(
				`[Tool: createDocument] Triggered for title: ${title}, kind: ${kind}`,
			);
			console.log(
				`[Tool: createDocument] Content length received: ${content?.length || 0} chars. Preview: ${content ? content.substring(0, 50).replace(/\n/g, "\\n") : "EMPTY"}`,
			);

			if (session?.user?.id) {
				await saveDocument({
					id,
					title,
					kind,
					content,
					userId: session.user.id,
				});
			}

			// Send document metadata events in the correct format
			dataStream.write({ type: "data-id", data: id });
			dataStream.write({ type: "data-title", data: title });
			dataStream.write({ type: "data-kind", data: kind });
			dataStream.write({ type: "data-clear", data: null });

			// Send content in the appropriate format based on kind
			if (kind === "text") {
				dataStream.write({
					type: "data-textDelta",
					data: content,
				});
			} else {
				// code, sheet, image
				dataStream.write({
					type: "data-codeDelta",
					data: content,
				});
			}

			dataStream.write({ type: "data-finish", data: null });

			return {
				id,
				title,
				kind,
				content,
				message: `Created document '${title}' (${kind})`,
			};
		},
	};
};
