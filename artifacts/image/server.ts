import { generateText } from "ai";
import { getLanguageModel } from "@backend/ai/providers";
import { createDocumentHandler } from "@backend/artifacts/server";

export const imageDocumentHandler = createDocumentHandler<"image">({
	kind: "image",
	onCreateDocument: async ({ title, dataStream }) => {
		const { text: content } = await generateText({
			model: getLanguageModel("gpt-4o-mini"),
			system:
				"You are an AI image generation assistant. Generate a detailed prompt for creating an image based on the user's title and requirements.",
			prompt: `Generate an image prompt for: ${title}`,
		});

		dataStream.write({
			type: "data-textDelta",
			data: content,
			transient: true,
		});

		return content;
	},
	onUpdateDocument: async ({ document, description, dataStream }) => {
		const { text: content } = await generateText({
			model: getLanguageModel("gpt-4o-mini"),
			system:
				"You are an AI image generation assistant. Update the image prompt based on the user's description.",
			prompt: `Current prompt: ${document.content}\n\nUpdate description: ${description}\n\nGenerate the updated prompt:`,
		});

		dataStream.write({
			type: "data-textDelta",
			data: content,
			transient: true,
		});

		return content;
	},
});
