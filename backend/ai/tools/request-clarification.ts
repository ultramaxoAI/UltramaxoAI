import { tool } from "ai";
import { z } from "zod";

export const requestClarification = tool({
	description:
		"Call this when the user's request is missing critical context such as code, file, query, URL, or exact error text. Ask one short question and wait for the user's reply before doing anything else.",
	inputSchema: z.object({
		question: z
			.string()
			.min(1)
			.max(160)
			.describe(
				"One short sentence asking for the missing context. Match the user's language.",
			),
		missingType: z
			.enum(["code", "file", "error_message", "url", "query", "other"])
			.describe("What kind of context is missing"),
	}),
	execute: async ({ question, missingType }) => {
		return {
			asked: true,
			question,
			missingType,
		};
	},
});
