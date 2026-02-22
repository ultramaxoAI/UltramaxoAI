import type { JSONValue } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";

export const updateDocument = ({
	dataStream,
}: {
	session: Session | null;
	dataStream: { write: (chunk: JSONValue) => void };
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
		execute: ({
			id,
			content,
			kind,
		}: {
			id: string;
			content: string;
			kind?: "code" | "text" | "sheet" | "image";
		}) => {
			console.log(`[Tool: updateDocument] Triggered for id: ${id}`);

			// Clear previous content then send new content
			dataStream.write({ type: "data-clear", data: "" } as JSONValue);

			// Send content in the appropriate format based on kind
			if (kind === "text") {
				dataStream.write({
					type: "data-textDelta",
					data: content,
				} as JSONValue);
			} else {
				// default to codeDelta for code, sheet, image, or unknown kind
				dataStream.write({
					type: "data-codeDelta",
					data: content,
				} as JSONValue);
			}

			dataStream.write({ type: "data-finish", data: "" } as JSONValue);

			return {
				id,
				content,
				message: `Updated document '${id}'`,
			};
		},
	};
};
