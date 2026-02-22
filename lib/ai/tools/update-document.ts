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
		}),
		execute: ({ id, content }: { id: string; content: string }) => {
			console.log(`[Tool: updateDocument] Triggered for id: ${id}`);

			// Stream the document update event to the client
			dataStream.write({
				type: "message_annotation",
				data: [
					{
						type: "update-document",
						id,
						content,
					},
				],
				transient: true,
			} as unknown as JSONValue);

			return {
				id,
				content,
				message: `Updated document '${id}'`,
			};
		},
	};
};
