import type { InferSelectModel } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	integer,
	numeric,
	json,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name"),
	username: text("username"),
	email: text("email").notNull().unique(),
	emailVerified: timestamp("emailVerified", { mode: "date" }),
	image: text("image"),
	password: text("password"),
	role: text("role").default("user").notNull(),
	onboardingReason: text("onboardingReason"),
	isPro: boolean("isPro").default(false).notNull(),
	limitCount: integer("limitCount").default(0).notNull(),
	freeIdeModeUsedAt: timestamp("freeIdeModeUsedAt", { mode: "date" }),
	proExpiresAt: timestamp("proExpiresAt", { mode: "date" }),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const account = pgTable(
	"account",
	{
		userId: uuid("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
	}),
);

export const session = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationToken = pgTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(verificationToken) => ({
		compositePk: primaryKey({
			columns: [verificationToken.identifier, verificationToken.token],
		}),
	}),
);

export const authenticator = pgTable(
	"authenticator",
	{
		credentialID: text("credentialID").notNull().unique(),
		userId: uuid("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		providerAccountId: text("providerAccountId").notNull(),
		credentialPublicKey: text("credentialPublicKey").notNull(),
		counter: integer("counter").notNull(),
		credentialDeviceType: text("credentialDeviceType").notNull(),
		credentialBackedUp: boolean("credentialBackedUp").notNull(),
		transports: text("transports"),
	},
	(authenticator) => ({
		compositePK: primaryKey({
			columns: [authenticator.userId, authenticator.credentialID],
		}),
	}),
);

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	createdAt: timestamp("createdAt").notNull(),
	title: text("title").notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id),
	visibility: varchar("visibility", { enum: ["public", "private"] })
		.notNull()
		.default("private"),
	isPinned: boolean("isPinned").notNull().default(false),
	folder: text("folder"),
	tags: json("tags").$type<string[]>().default([]),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	chatId: uuid("chatId")
		.notNull()
		.references(() => chat.id),
	role: varchar("role").notNull(),
	content: json("content").notNull(),
	createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	chatId: uuid("chatId")
		.notNull()
		.references(() => chat.id),
	role: varchar("role").notNull(),
	parts: json("parts").notNull(),
	attachments: json("attachments").notNull(),
	createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
	"Vote",
	{
		chatId: uuid("chatId")
			.notNull()
			.references(() => chat.id),
		messageId: uuid("messageId")
			.notNull()
			.references(() => messageDeprecated.id),
		isUpvoted: boolean("isUpvoted").notNull(),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.chatId, table.messageId] }),
		};
	},
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
	"Vote_v2",
	{
		chatId: uuid("chatId")
			.notNull()
			.references(() => chat.id),
		messageId: uuid("messageId")
			.notNull()
			.references(() => message.id),
		isUpvoted: boolean("isUpvoted").notNull(),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.chatId, table.messageId] }),
		};
	},
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
	"Document",
	{
		id: uuid("id").notNull().defaultRandom(),
		createdAt: timestamp("createdAt").notNull(),
		title: text("title").notNull(),
		content: text("content"),
		kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
			.notNull()
			.default("text"),
		userId: uuid("userId")
			.notNull()
			.references(() => user.id),
		isShared: boolean("isShared").notNull().default(false),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.id, table.createdAt] }),
		};
	},
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
	"Suggestion",
	{
		id: uuid("id").notNull().defaultRandom(),
		documentId: uuid("documentId").notNull(),
		documentCreatedAt: timestamp("documentCreatedAt").notNull(),
		originalText: text("originalText").notNull(),
		suggestedText: text("suggestedText").notNull(),
		description: text("description"),
		isResolved: boolean("isResolved").notNull().default(false),
		userId: uuid("userId")
			.notNull()
			.references(() => user.id),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id] }),
		documentRef: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
		}),
	}),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
	"Stream",
	{
		id: uuid("id").notNull().defaultRandom(),
		chatId: uuid("chatId").notNull(),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id] }),
		chatRef: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
		}),
	}),
);

export type Stream = InferSelectModel<typeof stream>;

export const pageVisit = pgTable("page_visit", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	path: text("path").notNull(),
	ipHash: text("ipHash").notNull(), // hashed IP for privacy
	visitedAt: timestamp("visitedAt").notNull().defaultNow(),
});

export type PageVisit = InferSelectModel<typeof pageVisit>;

export const redeemCode = pgTable("redeem_codes", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	code: varchar("code", { length: 50 }).notNull().unique(),
	type: varchar("type", { enum: ["PRO", "CREDIT"] }).notNull(),
	value: integer("value").default(0),
	durationMonths: integer("durationMonths").default(0),
	isUsed: boolean("isUsed").notNull().default(false),
	usedBy: uuid("usedBy").references(() => user.id),
	usedAt: timestamp("usedAt"),
	expiresAt: timestamp("expiresAt"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const purchaseRequest = pgTable("purchase_requests", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	username: text("username"),
	email: text("email"),
	planId: text("planId").notNull(),
	months: integer("months").notNull().default(1),
	price: integer("price").notNull().default(0),
	method: text("method").notNull().default("manual"),
	status: text("status").notNull().default("pending"),
	note: text("note"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type PurchaseRequest = InferSelectModel<typeof purchaseRequest>;

export const passwordResetToken = pgTable("password_reset_token", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PasswordResetToken = InferSelectModel<typeof passwordResetToken>;

export type RedeemCode = InferSelectModel<typeof redeemCode>;

// ============================================================
// User Settings (Personalization - 1:1 per user)
// ============================================================
export const userSettings = pgTable("user_settings", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	displayName: text("displayName"),
	customInstructions: text("customInstructions"),
	language: varchar("language", { length: 10 }).default("en"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserSettings = InferSelectModel<typeof userSettings>;

// ============================================================
// Site Settings (Global - singleton row keyed by "global")
// ============================================================
export const siteSettings = pgTable("site_settings", {
	key: varchar("key", { length: 50 }).primaryKey().notNull().default("global"),
	maintenanceEnabled: boolean("maintenanceEnabled").notNull().default(false),
	maintenanceTemplate: varchar("maintenanceTemplate", { length: 30 })
		.notNull()
		.default("midnight"),
	maintenanceTitle: text("maintenanceTitle")
		.notNull()
		.default("We will be right back."),
	maintenanceMessage: text("maintenanceMessage")
		.notNull()
		.default(
			"Lagi ada update kecil. Sebentar lagi balik.",
		),
	updatedBy: uuid("updatedBy"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type SiteSettings = InferSelectModel<typeof siteSettings>;

export const chatFolder = pgTable("chat_folder", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ChatFolder = InferSelectModel<typeof chatFolder>;

export const creditAccount = pgTable("credit_account", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" })
		.unique(),
	balance: integer("balance").notNull().default(0),
	lifetimeGranted: integer("lifetimeGranted").notNull().default(0),
	lifetimeSpent: integer("lifetimeSpent").notNull().default(0),
	lastRefillAt: timestamp("lastRefillAt").notNull().defaultNow(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type CreditAccount = InferSelectModel<typeof creditAccount>;

export const creditTransaction = pgTable("credit_transaction", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	amount: integer("amount").notNull(),
	balanceAfter: integer("balanceAfter").notNull(),
	type: varchar("type", {
		enum: ["grant", "spend", "refund", "bonus"],
	})
		.notNull()
		.default("spend"),
	reason: text("reason").notNull(),
	metadata: json("metadata"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type CreditTransaction = InferSelectModel<typeof creditTransaction>;

export const userMemory = pgTable("user_memory", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	category: varchar("category", {
		enum: ["profile", "coding", "product", "instruction"],
	})
		.notNull()
		.default("instruction"),
	title: text("title").notNull(),
	content: text("content").notNull(),
	isEnabled: boolean("isEnabled").notNull().default(true),
	isPinned: boolean("isPinned").notNull().default(false),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserMemory = InferSelectModel<typeof userMemory>;

export const userKnowledgeEntry = pgTable("user_knowledge_entry", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	category: varchar("category", {
		enum: ["project", "product", "brand", "reference"],
	})
		.notNull()
		.default("project"),
	title: text("title").notNull(),
	content: text("content").notNull(),
	source: text("source"),
	workspace: text("workspace"),
	isEnabled: boolean("isEnabled").notNull().default(true),
	isPinned: boolean("isPinned").notNull().default(false),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserKnowledgeEntry = InferSelectModel<typeof userKnowledgeEntry>;

export const agentRun = pgTable("agent_run", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	chatId: uuid("chatId").references(() => chat.id, { onDelete: "set null" }),
	mode: varchar("mode", { enum: ["fullstack", "mobile"] }).notNull(),
	goal: text("goal").notNull(),
	plan: json("plan").$type<string[]>().notNull().default([]),
	deliverable: text("deliverable").notNull(),
	status: varchar("status", {
		enum: ["running", "paused", "completed", "cancelled"],
	})
		.notNull()
		.default("running"),
	startedAt: timestamp("startedAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AgentRun = InferSelectModel<typeof agentRun>;

export const agentStep = pgTable("agent_step", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	runId: uuid("runId")
		.notNull()
		.references(() => agentRun.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	status: varchar("status", { enum: ["in_progress", "completed"] })
		.notNull()
		.default("in_progress"),
	detail: text("detail").notNull(),
	files: json("files").$type<string[]>().notNull().default([]),
	packages: json("packages").$type<string[]>().notNull().default([]),
	command: text("command"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AgentStep = InferSelectModel<typeof agentStep>;

export const promptPreset = pgTable("prompt_preset", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	prompt: text("prompt").notNull(),
	modelId: text("modelId"),
	visibility: varchar("visibility", { enum: ["public", "private"] })
		.notNull()
		.default("private"),
	webSearchEnabled: boolean("webSearchEnabled").notNull().default(true),
	deepThinkingEnabled: boolean("deepThinkingEnabled").notNull().default(false),
	fullstackModeEnabled: boolean("fullstackModeEnabled")
		.notNull()
		.default(false),
	mobileModeEnabled: boolean("mobileModeEnabled").notNull().default(false),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type PromptPreset = InferSelectModel<typeof promptPreset>;

// ============================================================
// User API Keys (Custom AI - 1 per provider per user)
// ============================================================
export const userApiKeys = pgTable("user_api_keys", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	provider: varchar("provider", { length: 50 }).notNull(),
	keysEncrypted: text("keysEncrypted"),
	isEnabled: boolean("isEnabled").notNull().default(false),
	customModels: json("customModels").$type<string[]>().default([]),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserApiKey = InferSelectModel<typeof userApiKeys>;

// ============================================================
// Platform API Keys (Proxy Keys generated by the platform)
// ============================================================
export const platformApiKey = pgTable("platform_api_key", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	key: text("key").notNull().unique(), // The 'ux_sk_...' string
	name: text("name").notNull().default("Default Key"),
	status: varchar("status", { enum: ["active", "revoked"] }).notNull().default("active"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	lastUsedAt: timestamp("lastUsedAt"),
});

export type PlatformApiKey = InferSelectModel<typeof platformApiKey>;

// ============================================================
// API Credit Accounts (Pay-as-you-go, USD cents)
// ============================================================
export const apiCreditAccount = pgTable("api_credit_account", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" })
		.unique(),
	balanceCents: integer("balanceCents").notNull().default(0),
	lifetimeGrantedCents: integer("lifetimeGrantedCents").notNull().default(0),
	lifetimeSpentCents: integer("lifetimeSpentCents").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ApiCreditAccount = InferSelectModel<typeof apiCreditAccount>;

export const apiCreditTransaction = pgTable("api_credit_transaction", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	amountCents: integer("amountCents").notNull(),
	balanceAfterCents: integer("balanceAfterCents").notNull(),
	type: varchar("type", {
		enum: ["grant", "spend", "refund"],
	})
		.notNull()
		.default("spend"),
	reason: text("reason").notNull(),
	metadata: json("metadata"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ApiCreditTransaction = InferSelectModel<typeof apiCreditTransaction>;

// ============================================================
// Model Catalog (SwiftRouter)
// ============================================================
export const modelCatalog = pgTable("model_catalog", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	modelId: text("modelId").notNull().unique(),
	name: text("name").notNull(),
	provider: text("provider").notNull(),
	context: text("context"),
	priceIn: numeric("priceIn", { precision: 12, scale: 6 }),
	priceOut: numeric("priceOut", { precision: 12, scale: 6 }),
	priceUnit: text("priceUnit").notNull().default("per_1m"),
	currency: text("currency").notNull().default("USD"),
	isFree: boolean("isFree").notNull().default(false),
	capabilities: json("capabilities").$type<string[]>().default([]),
	status: varchar("status", { enum: ["active", "deprecated", "hidden"] })
		.notNull()
		.default("active"),
	raw: json("raw"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ModelCatalog = InferSelectModel<typeof modelCatalog>;

export const modelCatalogRefreshLog = pgTable("model_catalog_refresh_log", {
	id: uuid("id").primaryKey().notNull().defaultRandom(),
	status: varchar("status", { enum: ["success", "error"] })
		.notNull()
		.default("success"),
	message: text("message"),
	refreshedAt: timestamp("refreshedAt").notNull().defaultNow(),
	count: integer("count").notNull().default(0),
});

export type ModelCatalogRefreshLog = InferSelectModel<typeof modelCatalogRefreshLog>;

