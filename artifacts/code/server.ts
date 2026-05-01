import { codePrompt, updateDocumentPrompt } from "@backend/ai/prompts";
import { getArtifactModel } from "@backend/ai/providers";
import { createDocumentHandler } from "@backend/artifacts/server";
import { streamText } from "ai";

export const codeDocumentHandler = createDocumentHandler<"code">({
	kind: "code",
	onCreateDocument: async ({ title, dataStream }) => {
		let draftContent = "";

		const { textStream } = streamText({
			model: getArtifactModel(),
			system: `${codePrompt}\n\nGenerate ONLY the code, no explanations, no markdown formatting, no \`\`\` blocks. Just the raw code.`,
			prompt: title,
		});

		for await (const delta of textStream) {
			draftContent += delta;

			dataStream.write({
				type: "data-codeDelta",
				data: draftContent,
				transient: true,
			});
		}

		return draftContent;
	},
	onUpdateDocument: async ({ document, description, dataStream }) => {
		let draftContent = "";

		const { textStream } = streamText({
			model: getArtifactModel(),
			system: `${updateDocumentPrompt(document.content, "code")}\n\nGenerate ONLY the code, no explanations, no markdown formatting, no \`\`\` blocks. Just the raw code.`,
			prompt: description,
		});

		for await (const delta of textStream) {
			draftContent += delta;

			dataStream.write({
				type: "data-codeDelta",
				data: draftContent,
				transient: true,
			});
		}

		return draftContent;
	},
});
