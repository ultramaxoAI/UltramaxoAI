import { z } from "zod";

const textPartSchema = z.object({
	type: z.enum(["text"]),
	text: z.string().max(100_000),
});

const filePartSchema = z.object({
	type: z.enum(["file", "image"]),
	mediaType: z.string().optional(),
	name: z.string().min(1).max(255).optional(),
	filename: z.string().min(1).max(255).optional(),
	url: z.string(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
	id: z.string().min(1),
	role: z.enum(["user"]),
	parts: z.array(partSchema).min(1),
});

// For tool approval flows, we accept all messages (more permissive schema)
const messageSchema = z.object({
	id: z.string(),
	role: z.string(),
	parts: z.array(z.any()),
});

export const postRequestBodySchema = z.object({
	id: z.string().uuid(),
	// Either a single new message or all messages (for tool approvals)
	message: userMessageSchema.optional(),
	messages: z.array(messageSchema).max(8).optional(),
	selectedChatModel: z.string(),
	selectedVisibilityType: z.enum(["public", "private"]),
	wormgptEnabled: z.boolean().optional(),
	deepThinkingEnabled: z.boolean().optional(),
	webSearchEnabled: z.boolean().optional(),
	fullstackModeEnabled: z.boolean().optional(),
	mobileModeEnabled: z.boolean().optional(),
	activeDocumentId: z.string().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
