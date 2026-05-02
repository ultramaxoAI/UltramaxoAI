import "server-only";

import {
	and,
	asc,
	count,
	desc,
	eq,
	exists,
	gt,
	gte,
	ilike,
	inArray,
	lt,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { getCreditResetWindowDays, getStartingCredits } from "@/lib/credits";
import { ChatSDKError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";
import {
	account,
	agentRun,
	agentStep,
	apiCreditAccount,
	apiCreditTransaction,
	authenticator,
	type Chat,
	chat,
	chatFolder,
	creditAccount,
	creditTransaction,
	type DBMessage,
	document,
	message,
	messageDeprecated,
	pageVisit,
	passwordResetToken,
	platformApiKey,
	promptPreset,
	purchaseRequest,
	redeemCode,
	redeemCodeClaim,
	type Suggestion,
	session,
	stream,
	suggestion,
	type User,
	user,
	userFeedback,
	userApiKeys,
	userKnowledgeEntry,
	userMemory,
	userSettings,
	verificationToken,
	vote,
	voteDeprecated,
} from "./schema";
import { generateHashedPassword } from "./utils";

export { getUserApiKeys } from "./queries-settings";

export type FeedbackSource = "timed_prompt";
export type FeedbackStatus = "new" | "reviewed";

function isMissingFeedbackTableError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "42P01"
	);
}

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const url = new URL(process.env.POSTGRES_URL!);
const originalHost = url.hostname;
// Hardcode IPv4 to bypass Node.js IPv6 resolution issues on local dev
url.hostname = "18.215.6.120";

const client = postgres(url.toString(), {
	prepare: false,
	ssl: { servername: originalHost, rejectUnauthorized: true },
	connect_timeout: 10,
	idle_timeout: 60,
	max_lifetime: 60 * 10,
	max: 10,
	keep_alive: 30,
});
export const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
	try {
		return await db.select().from(user).where(eq(user.email, email));
	} catch (error) {
		console.error("Database Error (getUser):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get user by email",
		);
	}
}

export async function getUserByUsername(name: string): Promise<User[]> {
	try {
		const normalizedName = name.trim();

		return await db
			.select()
			.from(user)
			.where(
				or(eq(user.username, normalizedName), eq(user.name, normalizedName)),
			);
	} catch (error) {
		console.error("Database Error (getUserByUsername):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get user by username",
		);
	}
}

export async function getUserByIdentifier(identifier: string): Promise<User[]> {
	const normalizedIdentifier = identifier.trim();

	try {
		return await db
			.select()
			.from(user)
			.where(
				or(
					eq(user.email, normalizedIdentifier.toLowerCase()),
					eq(user.username, normalizedIdentifier),
					eq(user.name, normalizedIdentifier),
				),
			);
	} catch (error) {
		console.error("Database Error (getUserByIdentifier):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get user by login identifier",
		);
	}
}

export async function createUser(
	email: string,
	password: string,
	name?: string,
) {
	const hashedPassword = generateHashedPassword(password);
	const normalizedEmail = email.trim().toLowerCase();
	const normalizedName = name?.trim();

	try {
		return await db.insert(user).values({
			email: normalizedEmail,
			password: hashedPassword,
			name: normalizedName,
			username: normalizedName,
		});
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to create user");
	}
}

export async function createGuestUser() {
	const email = `guest-${Date.now()}`;
	const password = generateHashedPassword(generateUUID());

	try {
		return await db.insert(user).values({ email, password }).returning({
			id: user.id,
			email: user.email,
		});
	} catch (error) {
		console.error("Database Error (createGuestUser):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create guest user",
		);
	}
}

export async function createUserFeedback({
	userId,
	message,
	source,
}: {
	userId: string;
	message: string;
	source: FeedbackSource;
}) {
	try {
		const normalizedMessage = message.trim();

		if (!normalizedMessage) {
			throw new ChatSDKError(
				"bad_request:api",
				"Feedback message is required",
			);
		}

		const [feedback] = await db
			.insert(userFeedback)
			.values({
				userId,
				message: normalizedMessage,
				source,
			})
			.returning();

		return feedback;
	} catch (error) {
		if (error instanceof ChatSDKError) {
			throw error;
		}

		if (isMissingFeedbackTableError(error)) {
			throw new ChatSDKError(
				"bad_request:database",
				"Feedback storage is not ready yet. Run the latest database migration first.",
			);
		}

		console.error("Database Error (createUserFeedback):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create user feedback",
		);
	}
}

export async function listUserFeedback() {
	try {
		return await db
			.select({
				id: userFeedback.id,
				userId: userFeedback.userId,
				message: userFeedback.message,
				source: userFeedback.source,
				status: userFeedback.status,
				createdAt: userFeedback.createdAt,
				updatedAt: userFeedback.updatedAt,
				userName: user.name,
				userEmail: user.email,
			})
			.from(userFeedback)
			.innerJoin(user, eq(userFeedback.userId, user.id))
			.orderBy(desc(userFeedback.createdAt));
	} catch (error) {
		if (isMissingFeedbackTableError(error)) {
			throw new ChatSDKError(
				"bad_request:database",
				"Feedback storage is not ready yet. Run the latest database migration first.",
			);
		}

		console.error("Database Error (listUserFeedback):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to list user feedback",
		);
	}
}

export async function updateUserFeedbackStatus({
	id,
	status,
}: {
	id: string;
	status: FeedbackStatus;
}) {
	try {
		const [feedback] = await db
			.update(userFeedback)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(userFeedback.id, id))
			.returning();

		return feedback ?? null;
	} catch (error) {
		if (isMissingFeedbackTableError(error)) {
			throw new ChatSDKError(
				"bad_request:database",
				"Feedback storage is not ready yet. Run the latest database migration first.",
			);
		}

		console.error("Database Error (updateUserFeedbackStatus):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update feedback status",
		);
	}
}

export async function saveChat({
	id,
	userId,
	title,
	visibility,
}: {
	id: string;
	userId: string;
	title: string;
	visibility: VisibilityType;
}) {
	try {
		console.log("saveChat attempting insert:", {
			id,
			userId,
			title,
			visibility,
		});
		const result = await db.insert(chat).values({
			id,
			createdAt: new Date(),
			userId,
			title,
			visibility,
			updatedAt: new Date(),
		});
		console.log("saveChat insert success");
		return result;
	} catch (error) {
		console.error("saveChat database error:", error);
		throw new ChatSDKError("bad_request:database", "Failed to save chat");
	}
}

export async function deleteChatById({ id }: { id: string }) {
	try {
		await db.delete(vote).where(eq(vote.chatId, id));
		await db.delete(message).where(eq(message.chatId, id));
		await db.delete(stream).where(eq(stream.chatId, id));

		const [chatsDeleted] = await db
			.delete(chat)
			.where(eq(chat.id, id))
			.returning();
		return chatsDeleted;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete chat by id",
		);
	}
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
	try {
		const userChats = await db
			.select({ id: chat.id })
			.from(chat)
			.where(eq(chat.userId, userId));

		if (userChats.length === 0) {
			return { deletedCount: 0 };
		}

		const chatIds = userChats.map((c) => c.id);

		await db.delete(vote).where(inArray(vote.chatId, chatIds));
		await db.delete(message).where(inArray(message.chatId, chatIds));
		await db.delete(stream).where(inArray(stream.chatId, chatIds));

		const deletedChats = await db
			.delete(chat)
			.where(eq(chat.userId, userId))
			.returning();

		return { deletedCount: deletedChats.length };
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete all chats by user id",
		);
	}
}

export async function getChatsByUserId({
	id,
	limit,
	startingAfter,
	endingBefore,
	searchQuery,
	visibility,
	pinnedOnly,
	folder,
}: {
	id: string;
	limit: number;
	startingAfter: string | null;
	endingBefore: string | null;
	searchQuery?: string | null;
	visibility?: "all" | "private" | "public";
	pinnedOnly?: boolean;
	folder?: string | null;
}) {
	try {
		const extendedLimit = limit + 1;
		const normalizedSearch = searchQuery?.trim();

		const baseConditions: SQL<unknown>[] = [eq(chat.userId, id)];

		if (visibility && visibility !== "all") {
			baseConditions.push(eq(chat.visibility, visibility));
		}

		if (pinnedOnly) {
			baseConditions.push(eq(chat.isPinned, true));
		}

		if (folder && folder !== "all") {
			if (folder === "uncategorized") {
				baseConditions.push(
					sql`(${chat.folder} IS NULL OR ${chat.folder} = '')`,
				);
			} else {
				baseConditions.push(eq(chat.folder, folder));
			}
		}

		if (normalizedSearch) {
			const pattern = `%${normalizedSearch}%`;
			baseConditions.push(
				or(
					ilike(chat.title, pattern),
					ilike(chat.folder, pattern),
					sql`EXISTS (
						SELECT 1
						FROM json_array_elements_text(COALESCE(${chat.tags}, '[]'::json)) AS tag
						WHERE tag ILIKE ${pattern}
					)`,
				) as SQL<unknown>,
			);
		}

		const query = (whereCondition?: SQL<unknown>) =>
			db
				.select()
				.from(chat)
				.where(
					and(...baseConditions, ...(whereCondition ? [whereCondition] : [])),
				)
				.orderBy(
					desc(chat.isPinned),
					desc(chat.updatedAt),
					desc(chat.createdAt),
				)
				.limit(extendedLimit);

		let filteredChats: Chat[] = [];

		if (startingAfter) {
			const [selectedChat] = await db
				.select()
				.from(chat)
				.where(eq(chat.id, startingAfter))
				.limit(1);

			if (!selectedChat) {
				throw new ChatSDKError(
					"not_found:database",
					`Chat with id ${startingAfter} not found`,
				);
			}

			filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
		} else if (endingBefore) {
			const [selectedChat] = await db
				.select()
				.from(chat)
				.where(eq(chat.id, endingBefore))
				.limit(1);

			if (!selectedChat) {
				throw new ChatSDKError(
					"not_found:database",
					`Chat with id ${endingBefore} not found`,
				);
			}

			filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
		} else {
			filteredChats = await query();
		}

		const hasMore = filteredChats.length > limit;

		return {
			chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
			hasMore,
		};
	} catch (error) {
		console.error("Database Error (getChatsByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get chats by user id",
		);
	}
}

export async function getChatById({ id }: { id: string }) {
	try {
		const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
		if (!selectedChat) {
			return null;
		}

		return selectedChat;
	} catch (error) {
		console.warn(
			"Database Error (getChatById): Failed to find or parse chat ID",
			error,
		);
		return null;
	}
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
	try {
		return await db.insert(message).values(messages).onConflictDoNothing();
	} catch (error) {
		console.error("Database Error (saveMessages):", error);
		throw new ChatSDKError("bad_request:database", "Failed to save messages");
	}
}

export async function updateMessage({
	id,
	parts,
}: {
	id: string;
	parts: DBMessage["parts"];
}) {
	try {
		return await db.update(message).set({ parts }).where(eq(message.id, id));
	} catch (error) {
		console.error("Database Error (updateMessage):", error);
		throw new ChatSDKError("bad_request:database", "Failed to update message");
	}
}

export async function getMessagesByChatId({ id }: { id: string }) {
	try {
		return await db
			.select()
			.from(message)
			.where(eq(message.chatId, id))
			.orderBy(asc(message.createdAt));
	} catch (error) {
		console.error("Database Error (getMessagesByChatId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get messages by chat id",
		);
	}
}

export async function getTodayMessageCount(userId: string): Promise<number> {
	try {
		const result = await db
			.select({ count: count() })
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(
				and(
					eq(chat.userId, userId),
					sql`${message.createdAt} >= CURRENT_DATE`,
					eq(message.role, "user"),
				),
			);
		return result[0]?.count || 0;
	} catch (error) {
		console.error("Database Error (getTodayMessageCount):", error);
		return 0; // Safe fallback
	}
}

export async function deductUserLimitCount(userId: string): Promise<boolean> {
	try {
		const currentUser = await getUserById(userId);
		const limit = currentUser[0]?.limitCount || 0;

		if (limit <= 0) {
			return false;
		}

		await db
			.update(user)
			.set({ limitCount: limit - 1 })
			.where(eq(user.id, userId));

		return true;
	} catch (error) {
		console.error("Database Error (deductUserLimitCount):", error);
		return false;
	}
}

export async function voteMessage({
	chatId,
	messageId,
	type,
}: {
	chatId: string;
	messageId: string;
	type: "up" | "down";
}) {
	try {
		const [existingVote] = await db
			.select()
			.from(vote)
			.where(and(eq(vote.messageId, messageId)));

		if (existingVote) {
			return await db
				.update(vote)
				.set({ isUpvoted: type === "up" })
				.where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
		}
		return await db.insert(vote).values({
			chatId,
			messageId,
			isUpvoted: type === "up",
		});
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to vote message");
	}
}

export async function getVotesByChatId({ id }: { id: string }) {
	try {
		return await db.select().from(vote).where(eq(vote.chatId, id));
	} catch (error) {
		console.error("Database Error (getVotesByChatId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get votes by chat id",
		);
	}
}

export async function saveDocument({
	id,
	title,
	kind,
	content,
	userId,
}: {
	id: string;
	title: string;
	kind: ArtifactKind;
	content: string;
	userId: string;
}) {
	try {
		await db.execute(sql`
			DO $$
			BEGIN
				IF EXISTS (
					SELECT 1
					FROM pg_constraint
					WHERE conname = 'Document_userId_User_id_fk'
				) THEN
					ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_id_fk";
				END IF;

				IF NOT EXISTS (
					SELECT 1
					FROM pg_constraint
					WHERE conname = 'Document_userId_user_id_fk'
				) THEN
					ALTER TABLE "Document"
					ADD CONSTRAINT "Document_userId_user_id_fk"
					FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
				END IF;
			END $$;
		`);

		return await db
			.insert(document)
			.values({
				id,
				title,
				kind,
				content,
				userId,
				createdAt: new Date(),
			})
			.returning();
	} catch (error) {
		console.error("Database Error (saveDocument):", error, {
			id,
			title,
			kind,
			userId,
			contentLength: content.length,
		});
		throw new ChatSDKError("bad_request:database", "Failed to save document");
	}
}

export async function getDocumentsById({ id }: { id: string }) {
	try {
		const documents = await db
			.select()
			.from(document)
			.where(eq(document.id, id))
			.orderBy(asc(document.createdAt));

		return documents;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get documents by id",
		);
	}
}

export async function getDocumentById({ id }: { id: string }) {
	try {
		const [selectedDocument] = await db
			.select()
			.from(document)
			.where(eq(document.id, id))
			.orderBy(desc(document.createdAt));

		return selectedDocument;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get document by id",
		);
	}
}

export async function deleteDocumentsByIdAfterTimestamp({
	id,
	timestamp,
}: {
	id: string;
	timestamp: Date;
}) {
	try {
		await db
			.delete(suggestion)
			.where(
				and(
					eq(suggestion.documentId, id),
					gt(suggestion.documentCreatedAt, timestamp),
				),
			);

		return await db
			.delete(document)
			.where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
			.returning();
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete documents by id after timestamp",
		);
	}
}

export async function saveSuggestions({
	suggestions,
}: {
	suggestions: Suggestion[];
}) {
	try {
		return await db.insert(suggestion).values(suggestions);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to save suggestions",
		);
	}
}

export async function getSuggestionsByDocumentId({
	documentId,
}: {
	documentId: string;
}) {
	try {
		return await db
			.select()
			.from(suggestion)
			.where(eq(suggestion.documentId, documentId));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get suggestions by document id",
		);
	}
}

export async function getMessageById({ id }: { id: string }) {
	try {
		return await db.select().from(message).where(eq(message.id, id));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get message by id",
		);
	}
}

export async function deleteMessagesByChatIdAfterTimestamp({
	chatId,
	timestamp,
}: {
	chatId: string;
	timestamp: Date;
}) {
	try {
		const messagesToDelete = await db
			.select({ id: message.id })
			.from(message)
			.where(
				and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
			);

		const messageIds = messagesToDelete.map(
			(currentMessage) => currentMessage.id,
		);

		if (messageIds.length > 0) {
			await db
				.delete(vote)
				.where(
					and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
				);

			return await db
				.delete(message)
				.where(
					and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
				);
		}
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete messages by chat id after timestamp",
		);
	}
}

export async function updateChatVisibilityById({
	chatId,
	visibility,
}: {
	chatId: string;
	visibility: "private" | "public";
}) {
	try {
		return await db
			.update(chat)
			.set({ visibility, updatedAt: new Date() })
			.where(eq(chat.id, chatId));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update chat visibility by id",
		);
	}
}

export async function updateChatTitleById({
	chatId,
	title,
}: {
	chatId: string;
	title: string;
}) {
	try {
		return await db
			.update(chat)
			.set({ title, updatedAt: new Date() })
			.where(eq(chat.id, chatId));
	} catch (error) {
		console.warn("Failed to update title for chat", chatId, error);
		return;
	}
}

export async function updateChatOrganizationById({
	chatId,
	userId,
	isPinned,
	folder,
	tags,
}: {
	chatId: string;
	userId: string;
	isPinned?: boolean;
	folder?: string | null;
	tags?: string[];
}) {
	try {
		const payload: Partial<typeof chat.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (typeof isPinned === "boolean") {
			payload.isPinned = isPinned;
		}

		if (folder !== undefined) {
			const normalizedFolder = folder?.trim() ? folder.trim() : null;
			payload.folder = normalizedFolder;

			if (normalizedFolder) {
				const [existingFolder] = await db
					.select()
					.from(chatFolder)
					.where(
						and(
							eq(chatFolder.userId, userId),
							eq(chatFolder.name, normalizedFolder),
						),
					)
					.limit(1);

				if (!existingFolder) {
					await db.insert(chatFolder).values({
						userId,
						name: normalizedFolder,
						updatedAt: new Date(),
					});
				}
			}
		}

		if (tags !== undefined) {
			payload.tags = tags;
		}

		const [updatedChat] = await db
			.update(chat)
			.set(payload)
			.where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
			.returning();

		return updatedChat;
	} catch (error) {
		console.error("Database Error (updateChatOrganizationById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update chat organization",
		);
	}
}

export async function getChatFoldersByUserId({ userId }: { userId: string }) {
	try {
		return await db
			.select()
			.from(chatFolder)
			.where(eq(chatFolder.userId, userId))
			.orderBy(asc(chatFolder.name));
	} catch (error) {
		console.error("Database Error (getChatFoldersByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load chat folders",
		);
	}
}

export async function createChatFolder({
	userId,
	name,
}: {
	userId: string;
	name: string;
}) {
	try {
		const normalizedName = name.trim();

		const [existingFolder] = await db
			.select()
			.from(chatFolder)
			.where(
				and(eq(chatFolder.userId, userId), eq(chatFolder.name, normalizedName)),
			)
			.limit(1);

		if (existingFolder) {
			return existingFolder;
		}

		const [folder] = await db
			.insert(chatFolder)
			.values({
				userId,
				name: normalizedName,
				updatedAt: new Date(),
			})
			.returning();

		return folder;
	} catch (error) {
		console.error("Database Error (createChatFolder):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create chat folder",
		);
	}
}

export async function renameChatFolder({
	userId,
	previousName,
	nextName,
}: {
	userId: string;
	previousName: string;
	nextName: string;
}) {
	try {
		const normalizedPrev = previousName.trim();
		const normalizedNext = nextName.trim();

		const [folder] = await db
			.update(chatFolder)
			.set({ name: normalizedNext, updatedAt: new Date() })
			.where(
				and(eq(chatFolder.userId, userId), eq(chatFolder.name, normalizedPrev)),
			)
			.returning();

		await db
			.update(chat)
			.set({ folder: normalizedNext, updatedAt: new Date() })
			.where(and(eq(chat.userId, userId), eq(chat.folder, normalizedPrev)));

		return folder;
	} catch (error) {
		console.error("Database Error (renameChatFolder):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to rename chat folder",
		);
	}
}

export async function deleteChatFolder({
	userId,
	name,
}: {
	userId: string;
	name: string;
}) {
	try {
		const normalizedName = name.trim();

		await db
			.update(chat)
			.set({ folder: null, updatedAt: new Date() })
			.where(and(eq(chat.userId, userId), eq(chat.folder, normalizedName)));

		const [folder] = await db
			.delete(chatFolder)
			.where(
				and(eq(chatFolder.userId, userId), eq(chatFolder.name, normalizedName)),
			)
			.returning();

		return folder;
	} catch (error) {
		console.error("Database Error (deleteChatFolder):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete chat folder",
		);
	}
}

export async function getPromptPresetsByUserId({ userId }: { userId: string }) {
	try {
		return await db
			.select()
			.from(promptPreset)
			.where(eq(promptPreset.userId, userId))
			.orderBy(desc(promptPreset.updatedAt), desc(promptPreset.createdAt));
	} catch (error) {
		console.error("Database Error (getPromptPresetsByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load prompt presets",
		);
	}
}

export async function createPromptPreset({
	userId,
	title,
	prompt,
	modelId,
	visibility,
	webSearchEnabled,
	deepThinkingEnabled,
	fullstackModeEnabled,
	mobileModeEnabled,
}: {
	userId: string;
	title: string;
	prompt: string;
	modelId?: string | null;
	visibility?: VisibilityType;
	webSearchEnabled?: boolean;
	deepThinkingEnabled?: boolean;
	fullstackModeEnabled?: boolean;
	mobileModeEnabled?: boolean;
}) {
	try {
		const [preset] = await db
			.insert(promptPreset)
			.values({
				userId,
				title,
				prompt,
				modelId: modelId ?? null,
				visibility: visibility ?? "private",
				webSearchEnabled: webSearchEnabled ?? true,
				deepThinkingEnabled: deepThinkingEnabled ?? false,
				fullstackModeEnabled: fullstackModeEnabled ?? false,
				mobileModeEnabled: mobileModeEnabled ?? false,
				updatedAt: new Date(),
			})
			.returning();

		return preset;
	} catch (error) {
		console.error("Database Error (createPromptPreset):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create prompt preset",
		);
	}
}

export async function updatePromptPresetById({
	id,
	userId,
	title,
	prompt,
	modelId,
	visibility,
	webSearchEnabled,
	deepThinkingEnabled,
	fullstackModeEnabled,
	mobileModeEnabled,
}: {
	id: string;
	userId: string;
	title?: string;
	prompt?: string;
	modelId?: string | null;
	visibility?: VisibilityType;
	webSearchEnabled?: boolean;
	deepThinkingEnabled?: boolean;
	fullstackModeEnabled?: boolean;
	mobileModeEnabled?: boolean;
}) {
	try {
		const payload: Partial<typeof promptPreset.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (title !== undefined) payload.title = title;
		if (prompt !== undefined) payload.prompt = prompt;
		if (modelId !== undefined) payload.modelId = modelId;
		if (visibility !== undefined) payload.visibility = visibility;
		if (webSearchEnabled !== undefined)
			payload.webSearchEnabled = webSearchEnabled;
		if (deepThinkingEnabled !== undefined)
			payload.deepThinkingEnabled = deepThinkingEnabled;
		if (fullstackModeEnabled !== undefined)
			payload.fullstackModeEnabled = fullstackModeEnabled;
		if (mobileModeEnabled !== undefined)
			payload.mobileModeEnabled = mobileModeEnabled;

		const [preset] = await db
			.update(promptPreset)
			.set(payload)
			.where(and(eq(promptPreset.id, id), eq(promptPreset.userId, userId)))
			.returning();

		return preset;
	} catch (error) {
		console.error("Database Error (updatePromptPresetById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update prompt preset",
		);
	}
}

export async function deletePromptPresetById({
	id,
	userId,
}: {
	id: string;
	userId: string;
}) {
	try {
		const [preset] = await db
			.delete(promptPreset)
			.where(and(eq(promptPreset.id, id), eq(promptPreset.userId, userId)))
			.returning();

		return preset;
	} catch (error) {
		console.error("Database Error (deletePromptPresetById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete prompt preset",
		);
	}
}

export async function setDocumentSharingById({
	id,
	userId,
	isShared,
}: {
	id: string;
	userId: string;
	isShared: boolean;
}) {
	try {
		const [sharedDocument] = await db
			.update(document)
			.set({ isShared })
			.where(and(eq(document.id, id), eq(document.userId, userId)))
			.returning();

		return sharedDocument;
	} catch (error) {
		console.error("Database Error (setDocumentSharingById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update document sharing",
		);
	}
}

export async function getSharedDocumentById({ id }: { id: string }) {
	try {
		const [sharedDocument] = await db
			.select()
			.from(document)
			.where(and(eq(document.id, id), eq(document.isShared, true)))
			.orderBy(desc(document.createdAt));

		return sharedDocument;
	} catch (error) {
		console.error("Database Error (getSharedDocumentById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get shared document",
		);
	}
}

export async function getUserUsageOverview({ userId }: { userId: string }) {
	try {
		const [chatStats] = await db
			.select({
				totalChats: count(chat.id),
				publicChats: sql<number>`COALESCE(SUM(CASE WHEN ${chat.visibility} = 'public' THEN 1 ELSE 0 END), 0)`,
				pinnedChats: sql<number>`COALESCE(SUM(CASE WHEN ${chat.isPinned} = true THEN 1 ELSE 0 END), 0)`,
			})
			.from(chat)
			.where(eq(chat.userId, userId));

		const [messageStats] = await db
			.select({
				totalMessages: count(message.id),
				messagesLast24Hours: sql<number>`COALESCE(SUM(CASE WHEN ${message.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END), 0)`,
			})
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(eq(chat.userId, userId));

		const [documentStats] = await db
			.select({
				totalDocuments: count(document.id),
				sharedDocuments: sql<number>`COALESCE(SUM(CASE WHEN ${document.isShared} = true THEN 1 ELSE 0 END), 0)`,
			})
			.from(document)
			.where(eq(document.userId, userId));

		const [presetStats] = await db
			.select({ totalPresets: count(promptPreset.id) })
			.from(promptPreset)
			.where(eq(promptPreset.userId, userId));

		const [providerStats] = await db
			.select({ connectedProviders: count(userApiKeys.id) })
			.from(userApiKeys)
			.where(
				and(eq(userApiKeys.userId, userId), eq(userApiKeys.isEnabled, true)),
			);

		return {
			totalChats: Number(chatStats?.totalChats ?? 0),
			publicChats: Number(chatStats?.publicChats ?? 0),
			pinnedChats: Number(chatStats?.pinnedChats ?? 0),
			totalMessages: Number(messageStats?.totalMessages ?? 0),
			messagesLast24Hours: Number(messageStats?.messagesLast24Hours ?? 0),
			totalDocuments: Number(documentStats?.totalDocuments ?? 0),
			sharedDocuments: Number(documentStats?.sharedDocuments ?? 0),
			totalPresets: Number(presetStats?.totalPresets ?? 0),
			connectedProviders: Number(providerStats?.connectedProviders ?? 0),
		};
	} catch (error) {
		console.error("Database Error (getUserUsageOverview):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load user usage overview",
		);
	}
}

export async function getMessageCountByUserId({
	id,
	differenceInHours,
}: {
	id: string;
	differenceInHours: number;
}) {
	try {
		const twentyFourHoursAgo = new Date(
			Date.now() - differenceInHours * 60 * 60 * 1000,
		);

		const [stats] = await db
			.select({ count: count(message.id) })
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(
				and(
					eq(chat.userId, id),
					gte(message.createdAt, twentyFourHoursAgo),
					eq(message.role, "user"),
					// Only count if there's at least one assistant message in the same chat
					exists(
						db
							.select()
							.from(message)
							.where(
								and(eq(message.chatId, chat.id), eq(message.role, "assistant")),
							),
					),
				),
			)
			.execute();

		return stats?.count ?? 0;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get message count by user id",
		);
	}
}

export async function createStreamId({
	streamId,
	chatId,
}: {
	streamId: string;
	chatId: string;
}) {
	try {
		await db
			.insert(stream)
			.values({ id: streamId, chatId, createdAt: new Date() });
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create stream id",
		);
	}
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
	try {
		const streamIds = await db
			.select({ id: stream.id })
			.from(stream)
			.where(eq(stream.chatId, chatId))
			.orderBy(asc(stream.createdAt))
			.execute();

		return streamIds.map(({ id }) => id);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get stream ids by chat id",
		);
	}
}

export async function redeemVoucher({
	userId,
	code,
}: {
	userId: string;
	code: string;
}) {
	const normalizedCode = code.trim().toUpperCase();

	try {
		return await db.transaction(async (tx) => {
			const [voucher] = await tx
				.select()
				.from(redeemCode)
				.where(eq(redeemCode.code, normalizedCode))
				.limit(1);

			if (!voucher) {
				return { error: "Invalid code." };
			}

			const now = new Date();
			const isExpiredByDate = voucher.expiresAt && voucher.expiresAt < now;
			const isExhausted =
				voucher.maxClaims !== null && voucher.claimedCount >= voucher.maxClaims;

			if (isExpiredByDate) {
				return { error: "Code expired." };
			}

			if (isExhausted) {
				return { error: "Code quota reached." };
			}

			const [currentUser] = await tx
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			if (!currentUser) {
				return { error: "User not found." };
			}

			try {
				await tx.insert(redeemCodeClaim).values({
					redeemCodeId: voucher.id,
					userId,
					createdAt: now,
				});
			} catch (error) {
				if (
					error &&
					typeof error === "object" &&
					"code" in error &&
					error.code === "23505"
				) {
					return { error: "Already claimed by this account." };
				}
				throw error;
			}

			const [updatedVoucher] = await tx
				.update(redeemCode)
				.set({
					claimedCount: sql`${redeemCode.claimedCount} + 1`,
				})
				.where(
					voucher.maxClaims === null
						? eq(redeemCode.id, voucher.id)
						: and(
								eq(redeemCode.id, voucher.id),
								sql`${redeemCode.claimedCount} < ${redeemCode.maxClaims}`,
							),
				)
				.returning();

			if (!updatedVoucher) {
				throw new ChatSDKError("bad_request:database", "Code quota reached.");
			}

			const isNowExhausted =
				updatedVoucher.maxClaims !== null &&
				updatedVoucher.claimedCount >= updatedVoucher.maxClaims;

			if (
				updatedVoucher.isUsed !== isNowExhausted ||
				updatedVoucher.usedBy !== (isNowExhausted ? userId : null)
			) {
				await tx
					.update(redeemCode)
					.set({
						isUsed: isNowExhausted,
						usedBy: isNowExhausted ? userId : null,
						usedAt: isNowExhausted ? now : null,
					})
					.where(eq(redeemCode.id, updatedVoucher.id));
			}

			const updates: Partial<User> = {};
			if (voucher.type === "PRO") {
				const months = voucher.durationMonths || 1;
				const currentExpiry = currentUser.proExpiresAt
					? new Date(currentUser.proExpiresAt)
					: new Date();
				const nextExpiry = new Date(
					Math.max(currentExpiry.getTime(), Date.now()),
				);
				nextExpiry.setMonth(nextExpiry.getMonth() + months);

				updates.isPro = true;
				updates.limitCount = 99_999;
				updates.proExpiresAt = nextExpiry;

				await tx.update(user).set(updates).where(eq(user.id, userId));

				const proAllowance = getStartingCredits({
					isPro: true,
					role: currentUser.role,
				});
				const [currentAccount] = await tx
					.select()
					.from(creditAccount)
					.where(eq(creditAccount.userId, userId))
					.limit(1);

				if (!currentAccount) {
					await tx.insert(creditAccount).values({
						userId,
						balance: proAllowance,
						lifetimeGranted: proAllowance,
						lifetimeSpent: 0,
						lastRefillAt: now,
						createdAt: now,
						updatedAt: now,
					});

					await tx.insert(creditTransaction).values({
						userId,
						amount: proAllowance,
						balanceAfter: proAllowance,
						type: "grant",
						reason: "pro voucher activation",
						metadata: { source: "voucher", code: voucher.code },
						createdAt: now,
					});
				} else if (currentAccount.balance < proAllowance) {
					const topUpAmount = proAllowance - currentAccount.balance;
					const nextBalance = currentAccount.balance + topUpAmount;

					await tx
						.update(creditAccount)
						.set({
							balance: nextBalance,
							lifetimeGranted: currentAccount.lifetimeGranted + topUpAmount,
							updatedAt: now,
						})
						.where(eq(creditAccount.userId, userId));

					await tx.insert(creditTransaction).values({
						userId,
						amount: topUpAmount,
						balanceAfter: nextBalance,
						type: "grant",
						reason: "pro voucher top-up",
						metadata: { source: "voucher", code: voucher.code },
						createdAt: now,
					});
				}
			} else {
				const add = voucher.value || 0;

				if (add > 0) {
					const startingCredits = getStartingCredits({
						isPro: currentUser.isPro,
						role: currentUser.role,
					});
					const [currentAccount] = await tx
						.select()
						.from(creditAccount)
						.where(eq(creditAccount.userId, userId))
						.limit(1);

					if (!currentAccount) {
						const nextBalance = startingCredits + add;

						await tx.insert(creditAccount).values({
							userId,
							balance: nextBalance,
							lifetimeGranted: nextBalance,
							lifetimeSpent: 0,
							lastRefillAt: now,
							createdAt: now,
							updatedAt: now,
						});

						if (startingCredits > 0) {
							await tx.insert(creditTransaction).values({
								userId,
								amount: startingCredits,
								balanceAfter: startingCredits,
								type: "grant",
								reason:
									currentUser.role === "admin"
										? "admin bootstrap"
										: "initial allocation",
								metadata: { isPro: currentUser.isPro },
								createdAt: now,
							});
						}

						await tx.insert(creditTransaction).values({
							userId,
							amount: add,
							balanceAfter: nextBalance,
							type: "bonus",
							reason: "voucher redemption",
							metadata: { code: voucher.code },
							createdAt: now,
						});
					} else {
						const nextBalance = currentAccount.balance + add;
						await tx
							.update(creditAccount)
							.set({
								balance: nextBalance,
								lifetimeGranted: currentAccount.lifetimeGranted + add,
								updatedAt: now,
							})
							.where(eq(creditAccount.userId, userId));

						await tx.insert(creditTransaction).values({
							userId,
							amount: add,
							balanceAfter: nextBalance,
							type: "bonus",
							reason: "voucher redemption",
							metadata: { code: voucher.code },
							createdAt: now,
						});
					}
				}
			}

			return { success: true, ...updates };
		});
	} catch (error) {
		if (
			error instanceof ChatSDKError &&
			error.message === "Code quota reached."
		) {
			return { error: "Code quota reached." };
		}

		console.error("Redeem voucher error:", error);
		throw new ChatSDKError("bad_request:database", "Failed to redeem voucher");
	}
}

export async function createVoucher(data: {
	code: string;
	type: "PRO" | "CREDIT";
	value?: number;
	durationMonths?: number;
	expiresAt?: Date | null;
	maxClaims?: number | null;
}) {
	try {
		await db.insert(redeemCode).values({
			...data,
			isUsed: false,
			claimedCount: 0,
			createdAt: new Date(),
		});
		return { success: true };
	} catch (error) {
		console.error("Create voucher error:", error);
		return { error: "Failed to create voucher (Code might already exist)" };
	}
}

export async function listUsersWithChatCount() {
	try {
		const results = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				onboardingReason: user.onboardingReason,
				isPro: user.isPro,
				limitCount: user.limitCount,
				createdAt: user.createdAt,
				chatCount: sql<number>`count(DISTINCT ${chat.id})`,
				messageCount: sql<number>`cast(count(DISTINCT CASE WHEN ${message.role} = 'user' THEN ${message.id} ELSE NULL END) as integer)`,
				todayMessageCount: sql<number>`cast(count(DISTINCT CASE WHEN ${message.createdAt} >= CURRENT_DATE AND ${message.role} = 'user' THEN ${message.id} ELSE NULL END) as integer)`,
			})
			.from(user)
			.leftJoin(chat, eq(user.id, chat.userId))
			.leftJoin(message, eq(chat.id, message.chatId))
			.groupBy(user.id)
			.orderBy(desc(user.createdAt));

		return results;
	} catch (error) {
		console.error("Database Error (listUsersWithChatCount):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to list users with chat count",
		);
	}
}

export async function updateUserAdmin(
	id: string,
	data: {
		role?: "user" | "admin";
		isPro?: boolean;
		limitCount?: number;
		proExpiresAt?: Date | null;
	},
) {
	try {
		return await db.update(user).set(data).where(eq(user.id, id));
	} catch (error) {
		console.error("Database Error (updateUserAdmin):", error);
		throw new ChatSDKError("bad_request:database", "Failed to update user");
	}
}

export async function getUserById(id: string): Promise<User[]> {
	try {
		return await db.select().from(user).where(eq(user.id, id));
	} catch (error) {
		console.error("Database Error (getUserById):", error);
		return [];
	}
}

export async function resolveExistingUserId({
	userId,
	email,
}: {
	userId?: string | null;
	email?: string | null;
}) {
	if (userId) {
		const usersById = await getUserById(userId);
		if (usersById[0]?.id) {
			return usersById[0].id;
		}
	}

	if (email) {
		const usersByEmail = await getUser(email);
		if (usersByEmail[0]?.id) {
			return usersByEmail[0].id;
		}
	}

	return null;
}

export async function ensureCreditAccountForUser({
	userId,
}: {
	userId: string;
}) {
	try {
		const [currentUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!currentUser) {
			throw new ChatSDKError("bad_request:database", "User not found");
		}

		const [existingAccount] = await db
			.select()
			.from(creditAccount)
			.where(eq(creditAccount.userId, userId))
			.limit(1);

		if (existingAccount) {
			const refillWindowDays = getCreditResetWindowDays({
				isPro: currentUser.isPro,
				role: currentUser.role,
			});
			const allowance = getStartingCredits({
				isPro: currentUser.isPro,
				role: currentUser.role,
			});
			const now = new Date();
			const nextRefillAt = new Date(existingAccount.lastRefillAt);
			nextRefillAt.setDate(nextRefillAt.getDate() + refillWindowDays);

			if (nextRefillAt <= now) {
				const grantAmount = Math.max(0, allowance - existingAccount.balance);
				const [updatedAccount] = await db
					.update(creditAccount)
					.set({
						balance:
							grantAmount > 0
								? existingAccount.balance + grantAmount
								: existingAccount.balance,
						lifetimeGranted: existingAccount.lifetimeGranted + grantAmount,
						lastRefillAt: now,
						updatedAt: now,
					})
					.where(eq(creditAccount.userId, userId))
					.returning();

				if (grantAmount > 0) {
					await db.insert(creditTransaction).values({
						userId,
						amount: grantAmount,
						balanceAfter: updatedAccount.balance,
						type: "grant",
						reason: currentUser.isPro ? "daily pro refill" : "free refill",
						metadata: { allowance, refillWindowDays },
					});
				}

				return updatedAccount;
			}

			return existingAccount;
		}

		const startingCredits = getStartingCredits({
			isPro: currentUser.isPro,
			role: currentUser.role,
		});

		const [createdAccount] = await db
			.insert(creditAccount)
			.values({
				userId,
				balance: startingCredits,
				lifetimeGranted: startingCredits,
				lifetimeSpent: 0,
				lastRefillAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		await db.insert(creditTransaction).values({
			userId,
			amount: startingCredits,
			balanceAfter: startingCredits,
			type: "grant",
			reason:
				currentUser.role === "admin" ? "admin bootstrap" : "initial allocation",
			metadata: { isPro: currentUser.isPro },
		});

		return createdAccount;
	} catch (error) {
		console.error("Database Error (ensureCreditAccountForUser):", error);
		if (error instanceof ChatSDKError) {
			throw error;
		}
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to ensure credit account",
		);
	}
}

export async function getCreditSummaryByUserId({
	userId,
	limit = 20,
}: {
	userId: string;
	limit?: number;
}) {
	try {
		const account = await ensureCreditAccountForUser({ userId });
		const transactions = await db
			.select()
			.from(creditTransaction)
			.where(eq(creditTransaction.userId, userId))
			.orderBy(desc(creditTransaction.createdAt))
			.limit(limit);

		return { account, transactions };
	} catch (error) {
		console.error("Database Error (getCreditSummaryByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get credit summary",
		);
	}
}

export async function ensureApiCreditAccountForUser({
	userId,
}: {
	userId: string;
}) {
	try {
		const [existing] = await db
			.select()
			.from(apiCreditAccount)
			.where(eq(apiCreditAccount.userId, userId))
			.limit(1);

		if (existing) {
			return existing;
		}

		const [created] = await db
			.insert(apiCreditAccount)
			.values({
				userId,
				balanceCents: 0,
				lifetimeGrantedCents: 0,
				lifetimeSpentCents: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return created;
	} catch (error) {
		console.error("Database Error (ensureApiCreditAccountForUser):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to ensure API credit account",
		);
	}
}

export async function getApiCreditSummaryByUserId({
	userId,
	limit = 20,
}: {
	userId: string;
	limit?: number;
}) {
	try {
		const account = await ensureApiCreditAccountForUser({ userId });
		const transactions = await db
			.select()
			.from(apiCreditTransaction)
			.where(eq(apiCreditTransaction.userId, userId))
			.orderBy(desc(apiCreditTransaction.createdAt))
			.limit(limit);

		return { account, transactions };
	} catch (error) {
		console.error("Database Error (getApiCreditSummaryByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get API credit summary",
		);
	}
}

export async function grantApiCredits({
	userId,
	amountCents,
	reason,
	metadata,
}: {
	userId: string;
	amountCents: number;
	reason: string;
	metadata?: Record<string, unknown>;
}) {
	const account = await ensureApiCreditAccountForUser({ userId });
	const nextBalance = account.balanceCents + amountCents;

	const [updated] = await db
		.update(apiCreditAccount)
		.set({
			balanceCents: nextBalance,
			lifetimeGrantedCents: account.lifetimeGrantedCents + amountCents,
			updatedAt: new Date(),
		})
		.where(eq(apiCreditAccount.userId, userId))
		.returning();

	await db.insert(apiCreditTransaction).values({
		userId,
		amountCents,
		balanceAfterCents: nextBalance,
		type: "grant",
		reason,
		metadata,
	});

	return updated;
}

export async function spendApiCredits({
	userId,
	amountCents,
	reason,
	metadata,
}: {
	userId: string;
	amountCents: number;
	reason: string;
	metadata?: Record<string, unknown>;
}) {
	const account = await ensureApiCreditAccountForUser({ userId });
	const nextBalance = account.balanceCents - amountCents;

	const [updated] = await db
		.update(apiCreditAccount)
		.set({
			balanceCents: nextBalance,
			lifetimeSpentCents: account.lifetimeSpentCents + amountCents,
			updatedAt: new Date(),
		})
		.where(eq(apiCreditAccount.userId, userId))
		.returning();

	await db.insert(apiCreditTransaction).values({
		userId,
		amountCents: Math.abs(amountCents),
		balanceAfterCents: nextBalance,
		type: "spend",
		reason,
		metadata,
	});

	return updated;
}

export async function getUserMemoryByUserId({ userId }: { userId: string }) {
	try {
		return await db
			.select()
			.from(userMemory)
			.where(eq(userMemory.userId, userId))
			.orderBy(desc(userMemory.isPinned), desc(userMemory.updatedAt));
	} catch (error) {
		console.error("Database Error (getUserMemoryByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load user memory",
		);
	}
}

async function ensureUserKnowledgeEntryTable() {
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "user_knowledge_entry" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
				"category" varchar(20) NOT NULL DEFAULT 'project',
				"title" text NOT NULL,
				"content" text NOT NULL,
				"source" text,
				"workspace" text,
				"isEnabled" boolean NOT NULL DEFAULT true,
				"isPinned" boolean NOT NULL DEFAULT false,
				"createdAt" timestamp NOT NULL DEFAULT now(),
				"updatedAt" timestamp NOT NULL DEFAULT now()
			)
		`);
		await db.execute(sql`
			ALTER TABLE "user_knowledge_entry"
			ADD COLUMN IF NOT EXISTS "workspace" text
		`);
	} catch (error) {
		console.warn("Could not ensure user_knowledge_entry table:", error);
	}
}

export async function getUserKnowledgeEntriesByUserId({
	userId,
}: {
	userId: string;
}) {
	try {
		await ensureUserKnowledgeEntryTable();
		return await db
			.select()
			.from(userKnowledgeEntry)
			.where(eq(userKnowledgeEntry.userId, userId))
			.orderBy(
				desc(userKnowledgeEntry.isPinned),
				desc(userKnowledgeEntry.updatedAt),
			);
	} catch (error) {
		console.error("Database Error (getUserKnowledgeEntriesByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load knowledge base entries",
		);
	}
}

export async function getEnabledUserKnowledgeEntriesByUserId({
	userId,
	limit = 8,
	workspace,
}: {
	userId: string;
	limit?: number;
	workspace?: string | null;
}) {
	try {
		await ensureUserKnowledgeEntryTable();
		const normalizedWorkspace = workspace?.trim() || null;
		return await db
			.select()
			.from(userKnowledgeEntry)
			.where(
				and(
					eq(userKnowledgeEntry.userId, userId),
					eq(userKnowledgeEntry.isEnabled, true),
					normalizedWorkspace
						? or(
								eq(userKnowledgeEntry.workspace, normalizedWorkspace),
								sql`(${userKnowledgeEntry.workspace} IS NULL OR ${userKnowledgeEntry.workspace} = '')`,
							)
						: sql`(${userKnowledgeEntry.workspace} IS NULL OR ${userKnowledgeEntry.workspace} = '')`,
				),
			)
			.orderBy(
				desc(userKnowledgeEntry.isPinned),
				desc(userKnowledgeEntry.updatedAt),
			)
			.limit(limit);
	} catch (error) {
		console.error(
			"Database Error (getEnabledUserKnowledgeEntriesByUserId):",
			error,
		);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load enabled knowledge base entries",
		);
	}
}

export async function createUserKnowledgeEntry({
	userId,
	category,
	title,
	content,
	source,
	workspace,
	isEnabled,
	isPinned,
}: {
	userId: string;
	category: "project" | "product" | "brand" | "reference";
	title: string;
	content: string;
	source?: string | null;
	workspace?: string | null;
	isEnabled?: boolean;
	isPinned?: boolean;
}) {
	try {
		await ensureUserKnowledgeEntryTable();
		const [entry] = await db
			.insert(userKnowledgeEntry)
			.values({
				userId,
				category,
				title,
				content,
				source: source ?? null,
				workspace: workspace?.trim() || null,
				isEnabled: isEnabled ?? true,
				isPinned: isPinned ?? false,
				updatedAt: new Date(),
			})
			.returning();

		return entry;
	} catch (error) {
		console.error("Database Error (createUserKnowledgeEntry):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create knowledge base entry",
		);
	}
}

export async function updateUserKnowledgeEntryById({
	id,
	userId,
	category,
	title,
	content,
	source,
	workspace,
	isEnabled,
	isPinned,
}: {
	id: string;
	userId: string;
	category?: "project" | "product" | "brand" | "reference";
	title?: string;
	content?: string;
	source?: string | null;
	workspace?: string | null;
	isEnabled?: boolean;
	isPinned?: boolean;
}) {
	try {
		await ensureUserKnowledgeEntryTable();
		const payload: Partial<typeof userKnowledgeEntry.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (category !== undefined) payload.category = category;
		if (title !== undefined) payload.title = title;
		if (content !== undefined) payload.content = content;
		if (source !== undefined) payload.source = source;
		if (workspace !== undefined) payload.workspace = workspace?.trim() || null;
		if (isEnabled !== undefined) payload.isEnabled = isEnabled;
		if (isPinned !== undefined) payload.isPinned = isPinned;

		const [entry] = await db
			.update(userKnowledgeEntry)
			.set(payload)
			.where(
				and(
					eq(userKnowledgeEntry.id, id),
					eq(userKnowledgeEntry.userId, userId),
				),
			)
			.returning();

		return entry;
	} catch (error) {
		console.error("Database Error (updateUserKnowledgeEntryById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update knowledge base entry",
		);
	}
}

export async function deleteUserKnowledgeEntryById({
	id,
	userId,
}: {
	id: string;
	userId: string;
}) {
	try {
		await ensureUserKnowledgeEntryTable();
		const [entry] = await db
			.delete(userKnowledgeEntry)
			.where(
				and(
					eq(userKnowledgeEntry.id, id),
					eq(userKnowledgeEntry.userId, userId),
				),
			)
			.returning();

		return entry;
	} catch (error) {
		console.error("Database Error (deleteUserKnowledgeEntryById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete knowledge base entry",
		);
	}
}

export async function getEnabledUserMemoryByUserId({
	userId,
	limit = 12,
}: {
	userId: string;
	limit?: number;
}) {
	try {
		return await db
			.select()
			.from(userMemory)
			.where(and(eq(userMemory.userId, userId), eq(userMemory.isEnabled, true)))
			.orderBy(desc(userMemory.isPinned), desc(userMemory.updatedAt))
			.limit(limit);
	} catch (error) {
		console.error("Database Error (getEnabledUserMemoryByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to load enabled user memory",
		);
	}
}

export async function createUserMemory({
	userId,
	category,
	title,
	content,
	isEnabled,
	isPinned,
}: {
	userId: string;
	category: "profile" | "coding" | "product" | "instruction";
	title: string;
	content: string;
	isEnabled?: boolean;
	isPinned?: boolean;
}) {
	try {
		const [memory] = await db
			.insert(userMemory)
			.values({
				userId,
				category,
				title,
				content,
				isEnabled: isEnabled ?? true,
				isPinned: isPinned ?? false,
				updatedAt: new Date(),
			})
			.returning();

		return memory;
	} catch (error) {
		console.error("Database Error (createUserMemory):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create user memory",
		);
	}
}

export async function updateUserMemoryById({
	id,
	userId,
	category,
	title,
	content,
	isEnabled,
	isPinned,
}: {
	id: string;
	userId: string;
	category?: "profile" | "coding" | "product" | "instruction";
	title?: string;
	content?: string;
	isEnabled?: boolean;
	isPinned?: boolean;
}) {
	try {
		const payload: Partial<typeof userMemory.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (category !== undefined) payload.category = category;
		if (title !== undefined) payload.title = title;
		if (content !== undefined) payload.content = content;
		if (isEnabled !== undefined) payload.isEnabled = isEnabled;
		if (isPinned !== undefined) payload.isPinned = isPinned;

		const [memory] = await db
			.update(userMemory)
			.set(payload)
			.where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
			.returning();

		return memory;
	} catch (error) {
		console.error("Database Error (updateUserMemoryById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update user memory",
		);
	}
}

export async function deleteUserMemoryById({
	id,
	userId,
}: {
	id: string;
	userId: string;
}) {
	try {
		const [memory] = await db
			.delete(userMemory)
			.where(and(eq(userMemory.id, id), eq(userMemory.userId, userId)))
			.returning();

		return memory;
	} catch (error) {
		console.error("Database Error (deleteUserMemoryById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete user memory",
		);
	}
}

export async function createAgentRun({
	userId,
	chatId,
	mode,
	goal,
	plan,
	deliverable,
}: {
	userId: string;
	chatId?: string;
	mode: "fullstack" | "mobile";
	goal: string;
	plan: string[];
	deliverable: string;
}) {
	try {
		const [run] = await db
			.insert(agentRun)
			.values({
				userId,
				chatId: chatId ?? null,
				mode,
				goal,
				plan,
				deliverable,
				status: "running",
				updatedAt: new Date(),
			})
			.returning();

		return run;
	} catch (error) {
		console.error("Database Error (createAgentRun):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create agent run",
		);
	}
}

export async function addAgentStep({
	runId,
	title,
	status,
	detail,
	files,
	packages,
	command,
}: {
	runId: string;
	title: string;
	status: "in_progress" | "completed";
	detail: string;
	files?: string[];
	packages?: string[];
	command?: string | null;
}) {
	try {
		const [step] = await db
			.insert(agentStep)
			.values({
				runId,
				title,
				status,
				detail,
				files: files ?? [],
				packages: packages ?? [],
				command: command ?? null,
				updatedAt: new Date(),
			})
			.returning();

		await db
			.update(agentRun)
			.set({
				status: status === "completed" ? "running" : "running",
				updatedAt: new Date(),
			})
			.where(eq(agentRun.id, runId));

		return step;
	} catch (error) {
		console.error("Database Error (addAgentStep):", error);
		throw new ChatSDKError("bad_request:database", "Failed to add agent step");
	}
}

export async function updateAgentRunStatus({
	runId,
	userId,
	status,
}: {
	runId: string;
	userId: string;
	status: "running" | "paused" | "completed" | "cancelled";
}) {
	try {
		const [run] = await db
			.update(agentRun)
			.set({ status, updatedAt: new Date() })
			.where(and(eq(agentRun.id, runId), eq(agentRun.userId, userId)))
			.returning();

		return run;
	} catch (error) {
		console.error("Database Error (updateAgentRunStatus):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update agent run status",
		);
	}
}

export async function updateAgentRunStatusById({
	runId,
	status,
}: {
	runId: string;
	status: "running" | "paused" | "completed" | "cancelled";
}) {
	try {
		const [run] = await db
			.update(agentRun)
			.set({ status, updatedAt: new Date() })
			.where(eq(agentRun.id, runId))
			.returning();

		return run;
	} catch (error) {
		console.error("Database Error (updateAgentRunStatusById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update agent run status",
		);
	}
}

export async function getAgentRunsByUserId({ userId }: { userId: string }) {
	try {
		const runs = await db
			.select()
			.from(agentRun)
			.where(eq(agentRun.userId, userId))
			.orderBy(desc(agentRun.updatedAt), desc(agentRun.startedAt));

		const runIds = runs.map((run) => run.id);
		const steps =
			runIds.length > 0
				? await db
						.select()
						.from(agentStep)
						.where(inArray(agentStep.runId, runIds))
						.orderBy(desc(agentStep.createdAt))
				: [];

		return runs.map((run) => ({
			...run,
			steps: steps.filter((step) => step.runId === run.id),
		}));
	} catch (error) {
		console.error("Database Error (getAgentRunsByUserId):", error);
		throw new ChatSDKError("bad_request:database", "Failed to load agent runs");
	}
}

export async function grantCreditsToUser({
	userId,
	amount,
	reason,
	type = "grant",
	metadata,
}: {
	userId: string;
	amount: number;
	reason: string;
	type?: "grant" | "refund" | "bonus";
	metadata?: Record<string, unknown>;
}) {
	if (amount <= 0) {
		throw new ChatSDKError(
			"bad_request:database",
			"Credit amount must be positive",
		);
	}

	try {
		return await db.transaction(async (tx) => {
			const ensuredAccount = await ensureCreditAccountForUser({ userId });
			const nextBalance = ensuredAccount.balance + amount;

			const [updatedAccount] = await tx
				.update(creditAccount)
				.set({
					balance: nextBalance,
					lifetimeGranted: ensuredAccount.lifetimeGranted + amount,
					updatedAt: new Date(),
				})
				.where(eq(creditAccount.userId, userId))
				.returning();

			const [transaction] = await tx
				.insert(creditTransaction)
				.values({
					userId,
					amount,
					balanceAfter: nextBalance,
					type,
					reason,
					metadata,
				})
				.returning();

			return { account: updatedAccount, transaction };
		});
	} catch (error) {
		console.error("Database Error (grantCreditsToUser):", error);
		if (error instanceof ChatSDKError) {
			throw error;
		}
		throw new ChatSDKError("bad_request:database", "Failed to grant credits");
	}
}

export async function spendCreditsForUser({
	userId,
	amount,
	reason,
	metadata,
}: {
	userId: string;
	amount: number;
	reason: string;
	metadata?: Record<string, unknown>;
}) {
	if (amount <= 0) {
		throw new ChatSDKError(
			"bad_request:database",
			"Credit amount must be positive",
		);
	}

	try {
		return await db.transaction(async (tx) => {
			const [currentUser] = await tx
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			if (!currentUser) {
				throw new ChatSDKError("bad_request:database", "User not found");
			}

			if (currentUser.role === "admin") {
				const account = await ensureCreditAccountForUser({ userId });
				return { account, transaction: null, skipped: true };
			}

			const ensuredAccount = await ensureCreditAccountForUser({ userId });

			if (ensuredAccount.balance < amount) {
				return {
					account: ensuredAccount,
					transaction: null,
					skipped: false,
					error: "Insufficient credits",
				};
			}

			const nextBalance = ensuredAccount.balance - amount;

			const [updatedAccount] = await tx
				.update(creditAccount)
				.set({
					balance: nextBalance,
					lifetimeSpent: ensuredAccount.lifetimeSpent + amount,
					updatedAt: new Date(),
				})
				.where(eq(creditAccount.userId, userId))
				.returning();

			const [transaction] = await tx
				.insert(creditTransaction)
				.values({
					userId,
					amount: -amount,
					balanceAfter: nextBalance,
					type: "spend",
					reason,
					metadata,
				})
				.returning();

			return { account: updatedAccount, transaction, skipped: false };
		});
	} catch (error) {
		console.error("Database Error (spendCreditsForUser):", error);
		if (error instanceof ChatSDKError) {
			throw error;
		}
		throw new ChatSDKError("bad_request:database", "Failed to spend credits");
	}
}

export async function updateUserPassword(id: string, newPasswordPlain: string) {
	try {
		const hashedPassword = generateHashedPassword(newPasswordPlain);
		return await db
			.update(user)
			.set({ password: hashedPassword })
			.where(eq(user.id, id));
	} catch (error) {
		console.error("Database Error (updateUserPassword):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update user password",
		);
	}
}

export async function upsertVerificationCode(email: string, code: string) {
	try {
		const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

		// Delete any existing token for this email first (composite PK on identifier+token,
		// so we can't do onConflictDoUpdate on just identifier)
		await db
			.delete(verificationToken)
			.where(eq(verificationToken.identifier, email));

		// Insert the new token
		await db.insert(verificationToken).values({
			identifier: email,
			token: code,
			expires,
		});
	} catch (error) {
		console.error("Database Error (upsertVerificationCode):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to upsert verification code",
		);
	}
}

export async function getDashboardStats() {
	try {
		const [totalUsers] = await db.select({ count: count() }).from(user);

		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		// Active users: Users who sent a message (role='user') in the last 24h
		// We join message -> chat to get userId
		const [activeUsers] = await db
			.select({
				count: sql<number>`count(DISTINCT ${chat.userId})`,
			})
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(
				and(
					eq(message.role, "user"),
					gt(message.createdAt, twentyFourHoursAgo),
				),
			);

		return {
			totalUsers: totalUsers?.count || 0,
			activeUsers: activeUsers?.count || 0,
		};
	} catch (error) {
		console.error("Database Error (getDashboardStats):", error);
		return { totalUsers: 0, activeUsers: 0 };
	}
}

export async function verifyVerificationCode(email: string, code: string) {
	try {
		const [token] = await db
			.select()
			.from(verificationToken)
			.where(
				and(
					eq(verificationToken.identifier, email),
					eq(verificationToken.token, code),
					gt(verificationToken.expires, new Date()),
				),
			);

		if (!token) {
			return false;
		}

		// Delete token after successful verification
		await db
			.delete(verificationToken)
			.where(eq(verificationToken.identifier, email));

		return true;
	} catch (error) {
		console.error("Database Error (verifyVerificationCode):", error);
		return false;
	}
}

export async function setEmailVerified(email: string) {
	try {
		return await db
			.update(user)
			.set({ emailVerified: new Date() })
			.where(eq(user.email, email));
	} catch (error) {
		console.error("Database Error (setEmailVerified):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to set email verified",
		);
	}
}

export async function setEmailVerifiedById(userId: string) {
	try {
		return await db
			.update(user)
			.set({ emailVerified: new Date() })
			.where(eq(user.id, userId));
	} catch (error) {
		console.error("Database Error (setEmailVerifiedById):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to set email verified",
		);
	}
}

export async function createPasswordResetTokenForEmail(email: string) {
	try {
		const [foundUser] = await db
			.select()
			.from(user)
			.where(eq(user.email, email));
		if (!foundUser) {
			return null;
		}

		const token = generateUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await db
			.delete(passwordResetToken)
			.where(eq(passwordResetToken.userId, foundUser.id));

		await db.insert(passwordResetToken).values({
			userId: foundUser.id,
			email: foundUser.email,
			token,
			expiresAt,
			createdAt: new Date(),
		});

		return { token, userId: foundUser.id, email: foundUser.email };
	} catch (error) {
		console.error("Database Error (createPasswordResetTokenForEmail):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create password reset token",
		);
	}
}

export async function consumePasswordResetToken(token: string) {
	try {
		const [row] = await db
			.select()
			.from(passwordResetToken)
			.where(eq(passwordResetToken.token, token));

		if (!row) {
			return null;
		}

		if (row.expiresAt < new Date()) {
			await db
				.delete(passwordResetToken)
				.where(eq(passwordResetToken.id, row.id));
			return null;
		}

		await db
			.delete(passwordResetToken)
			.where(eq(passwordResetToken.id, row.id));

		return { userId: row.userId, email: row.email };
	} catch (error) {
		console.error("Database Error (consumePasswordResetToken):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to consume password reset token",
		);
	}
}

function computeProExpiry(current: Date | null, months: number) {
	const now = new Date();
	const base = current ?? now;
	const start = base.getTime() > now.getTime() ? base : now;
	const next = new Date(start);
	next.setMonth(next.getMonth() + Math.max(1, months));
	return next;
}

export async function createPurchaseRequest(data: {
	userId: string;
	username?: string | null;
	email?: string | null;
	planId: string;
	months?: number;
	price?: number;
	method?: string;
	note?: string | null;
}) {
	try {
		const months = Math.max(1, Number(data.months) || 1);
		const price = Math.max(0, Number(data.price) || 0);

		const [created] = await db
			.insert(purchaseRequest)
			.values({
				userId: data.userId,
				username: data.username || null,
				email: data.email || null,
				planId: data.planId,
				months,
				price,
				method: data.method || "manual",
				status: "pending",
				note: data.note || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return created;
	} catch (error) {
		console.error("Database Error (createPurchaseRequest):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create purchase request",
		);
	}
}

export async function listPurchaseRequestsByUserId(userId: string) {
	try {
		return await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.userId, userId))
			.orderBy(desc(purchaseRequest.createdAt));
	} catch (error) {
		console.error("Database Error (listPurchaseRequestsByUserId):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to list purchase requests",
		);
	}
}

export async function listPurchaseRequestsAdmin() {
	try {
		return await db
			.select()
			.from(purchaseRequest)
			.orderBy(desc(purchaseRequest.createdAt));
	} catch (error) {
		console.error("Database Error (listPurchaseRequestsAdmin):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to list purchase requests",
		);
	}
}

export async function updatePurchaseRequestStatus({
	id,
	status,
}: {
	id: string;
	status: "pending" | "paid" | "approved" | "rejected";
}) {
	try {
		const [requestRow] = await db
			.select()
			.from(purchaseRequest)
			.where(eq(purchaseRequest.id, id));

		if (!requestRow) {
			throw new ChatSDKError(
				"not_found:database",
				"Purchase request not found",
			);
		}

		// Idempotency: skip if already in the target state (prevents double-crediting from webhook retries)
		if (requestRow.status === status) {
			console.log(
				`[updatePurchaseRequestStatus] Already ${status} for ${id}, skipping.`,
			);
			return requestRow;
		}

		// Prevent re-approving a previously approved/paid request
		const isCurrentlySuccess =
			requestRow.status === "approved" || requestRow.status === "paid";
		const isTargetSuccess = status === "approved" || status === "paid";

		if (isCurrentlySuccess && isTargetSuccess) {
			console.warn(
				`[updatePurchaseRequestStatus] Double-approval blocked for ${id}`,
			);
			return requestRow;
		}

		if (isTargetSuccess) {
			if (requestRow.planId === "API_TOPUP_USD") {
				let usdCents = 0;
				try {
					const parsed = requestRow.note ? JSON.parse(requestRow.note) : null;
					usdCents = Number(parsed?.usdCents || 0);
				} catch {
					usdCents = 0;
				}

				if (usdCents > 0) {
					await grantApiCredits({
						userId: requestRow.userId,
						amountCents: usdCents,
						reason: "api topup",
						metadata: { purchaseRequestId: requestRow.id },
					});
				}
			} else {
				const [currentUser] = await db
					.select()
					.from(user)
					.where(eq(user.id, requestRow.userId));

				if (currentUser) {
					const nextExpiry = computeProExpiry(
						currentUser.proExpiresAt ?? null,
						Number(requestRow.months) || 1,
					);

					await db
						.update(user)
						.set({
							isPro: true,
							limitCount: 99_999,
							proExpiresAt: nextExpiry,
						})
						.where(eq(user.id, currentUser.id));

					const proAllowance = getStartingCredits({
						isPro: true,
						role: currentUser.role,
					});
					const currentAccount = await ensureCreditAccountForUser({
						userId: currentUser.id,
					});

					if (currentAccount.balance < proAllowance) {
						await grantCreditsToUser({
							userId: currentUser.id,
							amount: proAllowance - currentAccount.balance,
							reason: "pro approval top-up",
							type: "grant",
							metadata: { purchaseRequestId: requestRow.id },
						});
					}
				}
			}
		}

		const [updated] = await db
			.update(purchaseRequest)
			.set({ status, updatedAt: new Date() })
			.where(eq(purchaseRequest.id, id))
			.returning();

		return updated;
	} catch (error) {
		console.error("Database Error (updatePurchaseRequestStatus):", error);
		if (error instanceof ChatSDKError) {
			throw error;
		}
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update purchase request",
		);
	}
}

export async function expireProIfNeeded(userId: string) {
	try {
		const [currentUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId));
		if (!currentUser) {
			return null;
		}

		if (currentUser.isPro && currentUser.proExpiresAt) {
			const now = new Date();
			if (currentUser.proExpiresAt < now) {
				await db
					.update(user)
					.set({ isPro: false, proExpiresAt: null })
					.where(eq(user.id, userId));
				return { ...currentUser, isPro: false, proExpiresAt: null };
			}
		}

		return currentUser;
	} catch (error) {
		console.error("Database Error (expireProIfNeeded):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to check pro expiration",
		);
	}
}

export async function deleteUserById(id: string) {
	try {
		return await db.transaction(async (tx) => {
			// Load user once so we can also clean up by email if needed
			const [targetUser] = await tx.select().from(user).where(eq(user.id, id));

			if (!targetUser) {
				return;
			}

			// 1. Unlink redeem codes (leave them used but with null user,
			//    since they are already consumed and we want to keep code uniqueness history)
			await tx
				.update(redeemCode)
				.set({ usedBy: null })
				.where(eq(redeemCode.usedBy, id));

			await tx.delete(redeemCodeClaim).where(eq(redeemCodeClaim.userId, id));

			// 1b. Remove verification tokens tied to this email (if any)
			if (targetUser.email) {
				await tx
					.delete(verificationToken)
					.where(eq(verificationToken.identifier, targetUser.email));
			}

			// 2. Delete auth/session dependencies
			await tx.delete(account).where(eq(account.userId, id));
			await tx.delete(session).where(eq(session.userId, id));
			await tx.delete(authenticator).where(eq(authenticator.userId, id));
			await tx
				.delete(passwordResetToken)
				.where(eq(passwordResetToken.userId, id));
			await tx.delete(purchaseRequest).where(eq(purchaseRequest.userId, id));
			await tx.delete(userSettings).where(eq(userSettings.userId, id));
			await tx.delete(userApiKeys).where(eq(userApiKeys.userId, id));
			await tx
				.delete(userKnowledgeEntry)
				.where(eq(userKnowledgeEntry.userId, id));

			// 3. Delete suggestions & documents
			await tx.delete(suggestion).where(eq(suggestion.userId, id));
			await tx.delete(document).where(eq(document.userId, id));

			// 3. Get user's chats to delete associated data
			const userChats = await tx
				.select({ id: chat.id })
				.from(chat)
				.where(eq(chat.userId, id));
			const chatIds = userChats.map((c) => c.id);

			if (chatIds.length > 0) {
				// 4. Delete messages, votes, streams for those chats
				await tx.delete(vote).where(inArray(vote.chatId, chatIds));
				await tx
					.delete(voteDeprecated)
					.where(inArray(voteDeprecated.chatId, chatIds));
				await tx.delete(message).where(inArray(message.chatId, chatIds));
				await tx
					.delete(messageDeprecated)
					.where(inArray(messageDeprecated.chatId, chatIds));
				await tx.delete(stream).where(inArray(stream.chatId, chatIds));
			}

			// 5. Delete chats
			await tx.delete(chat).where(eq(chat.userId, id));

			// 6. Finally delete the user
			await tx.delete(user).where(eq(user.id, id));
		});
	} catch (error) {
		console.error("Database Error (deleteUserById):", error);
		throw new ChatSDKError("bad_request:database", "Failed to delete user");
	}
}

export async function logPageVisit(path: string, ipHash: string) {
	try {
		await db.insert(pageVisit).values({
			path,
			ipHash,
			visitedAt: new Date(),
		});
	} catch (error) {
		console.error("Database Error (logPageVisit):", error);
		// fail silently to not disrupt the user request
	}
}

export async function getRealtimeVisits() {
	try {
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const results = await db
			.select({
				path: pageVisit.path,
				uniqueVisitors: sql<number>`count(DISTINCT ${pageVisit.ipHash})`,
				totalHits: count(pageVisit.id),
			})
			.from(pageVisit)
			.where(gt(pageVisit.visitedAt, twentyFourHoursAgo))
			.groupBy(pageVisit.path);

		return results;
	} catch (error) {
		console.error("Database Error (getRealtimeVisits):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get realtime visits",
		);
	}
}

export async function getVisitorInsights() {
	try {
		const results = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				isPro: user.isPro,
				lastActiveAt: sql<Date>`max(${message.createdAt})`,
				messageCount: count(message.id),
				chatCount: sql<number>`count(DISTINCT ${chat.id})`,
			})
			.from(user)
			.leftJoin(chat, eq(user.id, chat.userId))
			.leftJoin(message, eq(chat.id, message.chatId))
			.groupBy(user.id)
			.orderBy(desc(sql`max(${message.createdAt})`));

		return results;
	} catch (error) {
		console.error("Database Error (getVisitorInsights):", error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to fetch visitor insights",
		);
	}
}

export async function getRecentCrossChatMemory({
	userId,
	currentChatId,
	limit = 6,
}: {
	userId: string;
	currentChatId: string;
	limit?: number;
}) {
	try {
		const recentMessagesRaw = await db
			.select({
				parts: message.parts,
				createdAt: message.createdAt,
				chatId: chat.id,
				title: chat.title,
			})
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(
				and(
					eq(chat.userId, userId),
					eq(message.role, "user"),
					sql`${chat.id} != ${currentChatId}`,
				),
			)
			.orderBy(desc(message.createdAt))
			.limit(limit);

		// Extract text content from parts
		return recentMessagesRaw
			.map((msg) => {
				let textContent = "";
				if (Array.isArray(msg.parts)) {
					for (const part of msg.parts) {
						if (part.type === "text" && typeof part.text === "string") {
							textContent += `${part.text} `;
						}
					}
				}
				return {
					content: textContent.trim(),
					createdAt: msg.createdAt,
					chatId: msg.chatId,
					title: msg.title,
				};
			})
			.filter((m) => m.content.length > 0);
	} catch (error) {
		console.error("Database Error (getRecentCrossChatMemory):", error);
		return []; // Fail gracefully, return empty context
	}
}

export async function updateUserIdeModeUsage(userId: string) {
	try {
		await db
			.update(user)
			.set({ freeIdeModeUsedAt: new Date() })
			.where(eq(user.id, userId));
		return true;
	} catch (error) {
		console.error("Database Error (updateUserIdeModeUsage):", error);
		return false;
	}
}

export async function getPlatformApiKeysByUserId(userId: string) {
	try {
		return await db
			.select()
			.from(platformApiKey)
			.where(eq(platformApiKey.userId, userId))
			.orderBy(desc(platformApiKey.createdAt));
	} catch (error) {
		console.error("Database Error (getPlatformApiKeysByUserId):", error);
		throw new ChatSDKError("bad_request:database", "Failed to fetch API keys");
	}
}

export async function createPlatformApiKey({
	userId,
	name,
	key,
}: {
	userId: string;
	name: string;
	key: string;
}) {
	try {
		const [newKey] = await db
			.insert(platformApiKey)
			.values({
				userId,
				name,
				key,
				status: "active",
			})
			.returning();
		return newKey;
	} catch (error) {
		console.error("Database Error (createPlatformApiKey):", error);
		throw new ChatSDKError("bad_request:database", "Failed to create API key");
	}
}

export async function revokePlatformApiKey(id: string, userId: string) {
	try {
		const [revoked] = await db
			.update(platformApiKey)
			.set({ status: "revoked" })
			.where(and(eq(platformApiKey.id, id), eq(platformApiKey.userId, userId)))
			.returning();
		return revoked;
	} catch (error) {
		console.error("Database Error (revokePlatformApiKey):", error);
		throw new ChatSDKError("bad_request:database", "Failed to revoke API key");
	}
}
