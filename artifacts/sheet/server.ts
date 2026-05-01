import { sheetPrompt, updateDocumentPrompt } from "@backend/ai/prompts";
import { getArtifactModel } from "@backend/ai/providers";
import { createDocumentHandler } from "@backend/artifacts/server";
import { streamObject } from "ai";
import { z } from "zod";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
	kind: "sheet",
	onCreateDocument: async ({ title, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: getArtifactModel(),
			system: sheetPrompt,
			prompt: title,
			schema: z.object({
				csv: z.string().describe("CSV data"),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { csv } = object;

				if (csv) {
					dataStream.write({
						type: "data-sheetDelta",
						data: csv,
						transient: true,
					});

					draftContent = csv;
				}
			}
		}

		dataStream.write({
			type: "data-sheetDelta",
			data: draftContent,
			transient: true,
		});

		return draftContent;
	},
	onUpdateDocument: async ({ document, description, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: getArtifactModel(),
			system: updateDocumentPrompt(document.content, "sheet"),
			prompt: description,
			schema: z.object({
				csv: z.string(),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { csv } = object;

				if (csv) {
					dataStream.write({
						type: "data-sheetDelta",
						data: csv,
						transient: true,
					});

					draftContent = csv;
				}
			}
		}

		return draftContent;
	},
});
