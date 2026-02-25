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
				.describe(
					"The FULL initial content of the document (code, text, or csv). YOU MUST PUT THE FINAL, COMPLETE CODE OR TEXT HERE. DO NOT LEAVE THIS EMPTY.",
				),
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
			console.log(
				`[Tool: createDocument] Content length received: ${content?.length || 0} chars. Preview: ${content ? content.substring(0, 50).replace(/\n/g, "\\n") : "EMPTY"}`,
			);

			// Send document metadata events in the correct format
			dataStream.write({ type: "data-id", data: id } as JSONValue);
			dataStream.write({ type: "data-title", data: title } as JSONValue);
			dataStream.write({ type: "data-kind", data: kind } as JSONValue);
			dataStream.write({ type: "data-clear", data: "" } as JSONValue);

			// Send content in the appropriate format based on kind
			if (kind === "text") {
				dataStream.write({
					type: "data-textDelta",
					data: content,
				} as JSONValue);
			} else {
				// code, sheet, image
				dataStream.write({
					type: "data-codeDelta",
					data: content,
				} as JSONValue);
			}

			dataStream.write({ type: "data-finish", data: "" } as JSONValue);

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
