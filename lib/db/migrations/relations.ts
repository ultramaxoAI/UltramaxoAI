import { relations } from "drizzle-orm/relations";
import { user, session, suggestion, document, chat, message, messageV2, stream, redeemCodes, purchaseRequests, passwordResetToken, vote, voteV2, authenticator, account } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	suggestions: many(suggestion),
	chats: many(chat),
	redeemCodes: many(redeemCodes),
	purchaseRequests: many(purchaseRequests),
	passwordResetTokens: many(passwordResetToken),
	documents: many(document),
	authenticators: many(authenticator),
	accounts: many(account),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.createdAt]
	}),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	suggestions: many(suggestion),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	messages: many(message),
	messageV2s: many(messageV2),
	streams: many(stream),
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	votes: many(vote),
	voteV2s: many(voteV2),
}));

export const messageV2Relations = relations(messageV2, ({one, many}) => ({
	chat: one(chat, {
		fields: [messageV2.chatId],
		references: [chat.id]
	}),
	voteV2s: many(voteV2),
}));

export const streamRelations = relations(stream, ({one}) => ({
	chat: one(chat, {
		fields: [stream.chatId],
		references: [chat.id]
	}),
}));

export const redeemCodesRelations = relations(redeemCodes, ({one}) => ({
	user: one(user, {
		fields: [redeemCodes.usedBy],
		references: [user.id]
	}),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({one}) => ({
	user: one(user, {
		fields: [purchaseRequests.userId],
		references: [user.id]
	}),
}));

export const passwordResetTokenRelations = relations(passwordResetToken, ({one}) => ({
	user: one(user, {
		fields: [passwordResetToken.userId],
		references: [user.id]
	}),
}));

export const voteRelations = relations(vote, ({one}) => ({
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
}));

export const voteV2Relations = relations(voteV2, ({one}) => ({
	chat: one(chat, {
		fields: [voteV2.chatId],
		references: [chat.id]
	}),
	messageV2: one(messageV2, {
		fields: [voteV2.messageId],
		references: [messageV2.id]
	}),
}));

export const authenticatorRelations = relations(authenticator, ({one}) => ({
	user: one(user, {
		fields: [authenticator.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));