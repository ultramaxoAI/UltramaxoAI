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
import { ChatSDKError } from "../errors";
import { generateUUID } from "../utils";
import {
	authenticator,
	account,
	type Chat,
	chat,
	type DBMessage,
	document,
	message,
	messageDeprecated,
	pageVisit,
	passwordResetToken,
	purchaseRequest,
	redeemCode,
	session,
	stream,
	suggestion,
	type Suggestion,
	type User,
	user,
	userApiKeys,
	userSettings,
	verificationToken,
	vote,
	voteDeprecated,
} from "./schema";
import { generateHashedPassword } from "./utils";

export { getUserApiKeys } from "./queries-settings";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
	prepare: false,
	ssl: "require",
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
}: {
	id: string;
	limit: number;
	startingAfter: string | null;
	endingBefore: string | null;
}) {
	try {
		const extendedLimit = limit + 1;

		const query = (whereCondition?: SQL<unknown>) =>
			db
				.select()
				.from(chat)
				.where(
					whereCondition
						? and(whereCondition, eq(chat.userId, id))
						: eq(chat.userId, id),
				)
				.orderBy(desc(chat.createdAt))
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
		return await db.insert(message).values(messages);
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
	} catch (_error) {
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
		return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
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
		return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
	} catch (error) {
		console.warn("Failed to update title for chat", chatId, error);
		return;
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
	try {
		const [voucher] = await db
			.select()
			.from(redeemCode)
			.where(and(eq(redeemCode.code, code), eq(redeemCode.isUsed, false)));

		if (!voucher) {
			return { error: "Voucher tidak valid atau sudah digunakan." };
		}

		if (voucher.expiresAt && voucher.expiresAt < new Date()) {
			return { error: "Voucher sudah kadaluarsa." };
		}

		const [currentUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId));
		if (!currentUser) {
			return { error: "User tidak ditemukan." };
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
		} else {
			const add = voucher.value || 0;
			updates.limitCount = (currentUser.limitCount || 0) + add;
		}

		await db.update(user).set(updates).where(eq(user.id, userId));
		await db
			.update(redeemCode)
			.set({
				isUsed: true,
				usedBy: userId,
				usedAt: new Date(),
			})
			.where(eq(redeemCode.id, voucher.id));

		return { success: true, ...updates };
	} catch (error) {
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
}) {
	try {
		await db.insert(redeemCode).values({
			...data,
			isUsed: false,
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
		throw new ChatSDKError("bad_request:database", "Failed to get user by id");
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

		if (status === "approved") {
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
			const [targetUser] = await tx
				.select()
				.from(user)
				.where(eq(user.id, id));

			if (!targetUser) {
				return;
			}

			// 1. Unlink redeem codes (leave them used but with null user,
			//    since they are already consumed and we want to keep code uniqueness history)
			await tx
				.update(redeemCode)
				.set({ usedBy: null })
				.where(eq(redeemCode.usedBy, id));

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
		return recentMessagesRaw.map((msg) => {
			let textContent = "";
			if (Array.isArray(msg.parts)) {
				for (const part of msg.parts) {
					if (part.type === "text" && typeof part.text === "string") {
						textContent += part.text + " ";
					}
				}
			}
			return {
				content: textContent.trim(),
				createdAt: msg.createdAt,
				chatId: msg.chatId,
				title: msg.title,
			};
		}).filter(m => m.content.length > 0);
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
