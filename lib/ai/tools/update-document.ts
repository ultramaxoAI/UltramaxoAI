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
    parameters: z.object({
      id: z.string().describe("The ID of the document to update"),
      content: z
        .string()
        .describe("The new content to replace the document with"),
    }),
    execute: ({ id, content }: { id: string; content: string }) => {
      console.log(`[Tool: updateDocument] Triggered for id: ${id}`);

      // Stream the document update event to the client
      dataStream.write({
        type: "id-doc-update",
        id,
        content,
      });

      return {
        id,
        content,
        message: `Updated document '${id}'`,
      };
    },
  };
};
