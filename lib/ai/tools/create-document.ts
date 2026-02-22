import type { JSONValue } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

export const createDocument = ({
	dataStream,
}: {
	session: Session | null;
	dataStream: { write: (chunk: JSONValue) => void };
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
				.describe("The initial content of the document (code, text, or csv)"),
		}),
		execute: ({
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

			// Stream the document creation event to the client using official message annotations if needed,
			// or rely entirely on the tool output part of Vercel AI SDK.
			dataStream.write({
				type: "message_annotation",
				data: [
					{
						type: "create-document",
						id,
						title,
						kind,
						content,
					},
				],
				transient: true,
			} as unknown as JSONValue);

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
