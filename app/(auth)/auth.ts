import type { Adapter } from "@auth/core/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcrypt-ts";
import { and, eq, sql } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {
	createGuestUser,
	db,
	getUser,
	getUserByIdentifier,
	setEmailVerified,
	verifyVerificationCode,
} from "@backend/db/queries";
import {
	account as accountTable,
	authenticator as authenticatorTable,
	session as sessionTable,
	user as userTable,
	verificationToken as verificationTokenTable,
} from "@backend/db/schema";
import { generateDummyPassword } from "@backend/db/utils";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular" | "pro";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			type: UserType;
			role: "user" | "admin";
			onboardingReason?: string | null;
		} & DefaultSession["user"];
	}

	interface User {
		id?: string;
		email?: string | null;
		type: UserType;
		role: "user" | "admin";
		onboardingReason?: string | null;
	}
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		id: string;
		type: UserType;
		role: "user" | "admin";
		onboardingReason?: string | null;
	}
}

declare module "@auth/core/adapters" {
	interface AdapterUser {
		type: UserType;
		role: "user" | "admin";
		onboardingReason?: string | null;
	}
}

const isProduction = process.env.NODE_ENV === "production";
// Only enforce cross-subdomain cookies & proxy if deployed to the actual production domain
const isRealProduction = isProduction && (process.env.VERCEL_ENV === "production" || process.env.AUTH_URL?.includes("ultramaxo.tech"));
const cookieDomain = isRealProduction ? ".ultramaxo.tech" : undefined;
const redirectProxyUrl =
	process.env.AUTH_REDIRECT_PROXY_URL ||
	(isRealProduction ? "https://ultramaxo.tech/api/auth" : undefined);
const cookiePrefix = isProduction ? "__Secure-" : "";
const baseAdapter = DrizzleAdapter(db, {
	usersTable: userTable,
	accountsTable: accountTable,
	sessionsTable: sessionTable,
	verificationTokensTable: verificationTokenTable,
	authenticatorsTable: authenticatorTable,
}) as Adapter;

function normalizeEmail(email?: string | null) {
	return email?.trim().toLowerCase() ?? undefined;
}

function resolveUserType(isPro: boolean): UserType {
	return isPro ? "pro" : "regular";
}

function mapDbUserToAdapterUser(dbUser: typeof userTable.$inferSelect) {
	return {
		id: dbUser.id,
		email: dbUser.email,
		emailVerified: dbUser.emailVerified,
		name: dbUser.name,
		image: dbUser.image,
		role: dbUser.role as "user" | "admin",
		type: resolveUserType(dbUser.isPro),
	};
}

function isAdminUser({
	email,
	identifier,
	role,
}: {
	email?: string | null;
	identifier?: string | null;
	role?: string | null;
}) {
	const normalizedEmail = normalizeEmail(email);
	const normalizedIdentifier = identifier?.trim().toLowerCase();
	const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);

	return (
		role === "admin" ||
		normalizedIdentifier === "admin" ||
		Boolean(adminEmail && normalizedEmail === adminEmail)
	);
}

const sharedCookieOptions = {
	httpOnly: true,
	sameSite: "lax" as const,
	path: "/",
	secure: isProduction,
	...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const {
	handlers: { GET, POST },
	auth,
	signIn,
	signOut,
} = NextAuth({
	...authConfig,
	trustHost: true,
	redirectProxyUrl,
	cookies: {
		sessionToken: {
			name: `${cookiePrefix}authjs.session-token`,
			options: sharedCookieOptions,
		},
		callbackUrl: {
			name: `${cookiePrefix}authjs.callback-url`,
			options: sharedCookieOptions,
		},
		csrfToken: {
			name: `${cookiePrefix}authjs.csrf-token`,
			options: sharedCookieOptions,
		},
		pkceCodeVerifier: {
			name: `${cookiePrefix}authjs.pkce.code_verifier`,
			options: sharedCookieOptions,
		},
		state: {
			name: `${cookiePrefix}authjs.state`,
			options: sharedCookieOptions,
		},
		nonce: {
			name: `${cookiePrefix}authjs.nonce`,
			options: sharedCookieOptions,
		},
	},
	adapter: {
		...baseAdapter,
		async createUser(data) {
			if (!baseAdapter.createUser) {
				throw new Error("Auth adapter is missing createUser");
			}

			return baseAdapter.createUser({
				...data,
				email: normalizeEmail(data.email) ?? data.email,
			});
		},
		async getUserByEmail(email) {
			const normalizedEmail = normalizeEmail(email);

			if (!normalizedEmail) {
				return null;
			}

			const adapterUser = await baseAdapter.getUserByEmail?.(normalizedEmail);
			if (adapterUser) {
				return adapterUser;
			}

			const [dbUser] = await db
				.select()
				.from(userTable)
				.where(sql`lower(${userTable.email}) = ${normalizedEmail}`)
				.limit(1);

			if (!dbUser) {
				return null;
			}

			return mapDbUserToAdapterUser(dbUser);
		},
		async getUserByAccount({ provider, providerAccountId }) {
			const [linkedAccount] = await db
				.select({
					userId: accountTable.userId,
					linkedUser: userTable,
				})
				.from(accountTable)
				.leftJoin(userTable, eq(accountTable.userId, userTable.id))
				.where(
					and(
						eq(accountTable.provider, provider),
						eq(accountTable.providerAccountId, providerAccountId),
					),
				)
				.limit(1);

			if (!linkedAccount) {
				return null;
			}

			if (!linkedAccount.linkedUser) {
				await db
					.delete(accountTable)
					.where(
						and(
							eq(accountTable.provider, provider),
							eq(accountTable.providerAccountId, providerAccountId),
						),
					);
				return null;
			}

			return mapDbUserToAdapterUser(linkedAccount.linkedUser);
		},
		async linkAccount(accountData) {
			await db
				.insert(accountTable)
				.values({
					userId: accountData.userId,
					type: accountData.type,
					provider: accountData.provider,
					providerAccountId: accountData.providerAccountId,
					refresh_token: accountData.refresh_token ?? null,
					access_token: accountData.access_token ?? null,
					expires_at: accountData.expires_at ?? null,
					token_type: accountData.token_type ?? null,
					scope: accountData.scope ?? null,
					id_token: accountData.id_token ?? null,
					session_state:
						typeof accountData.session_state === "string"
							? accountData.session_state
							: null,
				})
				.onConflictDoUpdate({
					target: [accountTable.provider, accountTable.providerAccountId],
					set: {
						userId: accountData.userId,
						type: accountData.type,
						refresh_token: accountData.refresh_token ?? null,
						access_token: accountData.access_token ?? null,
						expires_at: accountData.expires_at ?? null,
						token_type: accountData.token_type ?? null,
						scope: accountData.scope ?? null,
						id_token: accountData.id_token ?? null,
						session_state:
							typeof accountData.session_state === "string"
								? accountData.session_state
								: null,
					},
				});

			return accountData;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60, // 1 Day (24 Hours)
	},
	providers: [
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
		Credentials({
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize({
				username,
				password,
				email,
				code,
			}: Partial<Record<"username" | "password" | "email" | "code", unknown>>) {
				const normalizedUsername = String(username ?? "").trim();
				const normalizedPassword = String(password ?? "");
				const normalizedEmail = String(email ?? "")
					.trim()
					.toLowerCase();

				// SCENARIO 1: Login with Email & Verification Code (Auto-Login after Verify)
				if (normalizedEmail && code) {
					const isValid = await verifyVerificationCode(
						normalizedEmail,
						code as string,
					);
					if (isValid) {
						await setEmailVerified(normalizedEmail);
						const [user] = await getUser(normalizedEmail);
						if (user) {
							return {
								id: user.id,
								email: user.email,
								type: user.isPro
									? ("pro" as UserType)
									: ("regular" as UserType),
								role: user.role as "user" | "admin",
							};
						}
					}
					return null;
				}

				// SCENARIO 2: Normal Login with Username & Password
				const users = await getUserByIdentifier(normalizedUsername);

				if (users.length === 0) {
					if (normalizedPassword) {
						await compare(normalizedPassword, generateDummyPassword());
					}
					return null;
				}

				const [user] = users;

				if (!user.password) {
					if (normalizedPassword) {
						await compare(normalizedPassword, generateDummyPassword());
					}
					return null;
				}

				const passwordsMatch = await compare(normalizedPassword, user.password);

				if (!passwordsMatch) {
					return null;
				}

				const isAdmin = isAdminUser({
					email: user.email,
					identifier: normalizedUsername,
					role: user.role,
				});

				const emailVerificationEnabled =
					process.env.ENABLE_EMAIL_VERIFICATION === "true";

				if (emailVerificationEnabled && !user.emailVerified && !isAdmin) {
					// Explicitly block unverified regular users from logging in with password
					throw new Error("unverified");
				}

				return {
					...user,
					type: resolveUserType(user.isPro),
					role: isAdmin ? "admin" : "user",
					onboardingReason: user.onboardingReason,
				};
			},
		}),
		Credentials({
			id: "guest",
			credentials: {},
			async authorize() {
				const [guestUser] = await createGuestUser();
				return { ...guestUser, type: "guest", role: "user" };
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			// Initial sign in
			if (user) {
				token.id = user.id as string;
				token.type = user.type;
				token.role = user.role;
				token.email = user.email ?? token.email;
				token.name = user.name ?? token.name;
				token.onboardingReason = user.onboardingReason;

				return token;
			}

			// Refresh user data from database on every request to keep it fresh
			// This ensures that when admin approves, the next request will have updated data
			if (token.id) {
				try {
					let [dbUser] = await db
						.select()
						.from(userTable)
						.where(eq(userTable.id, token.id))
						.limit(1);

					if (!dbUser && token.email) {
						const normalizedEmail = normalizeEmail(token.email);
						if (normalizedEmail) {
							[dbUser] = await db
								.select()
								.from(userTable)
								.where(sql`lower(${userTable.email}) = ${normalizedEmail}`)
								.limit(1);
							if (dbUser) {
								token.id = dbUser.id;
							}
						}
					}

					if (dbUser) {
						// Update token with fresh data from database
						token.type = dbUser.isPro ? "pro" : "regular";
						token.role = dbUser.role as "user" | "admin";
						token.email = dbUser.email;
						token.name = dbUser.name;
						token.onboardingReason = dbUser.onboardingReason;
					} else {
						// SECURITY FIX: User was deleted from the database.
						// Returning null instantly invalidates the JWT and destroying the session.
						return null;
					}
				} catch (error) {
					console.error("Error refreshing user data in JWT:", error);
					// If a generic database or network error occurs, keep the existing token data.
				}
			}

			return token;
		},
		session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id;
				session.user.type = token.type;
				session.user.role = token.role;
				session.user.email = (token.email as string | undefined) ?? session.user.email;
				session.user.name = (token.name as string | undefined) ?? session.user.name;
				session.user.onboardingReason = token.onboardingReason as string | null | undefined;
			}

			return session;
		},
		async signIn({ user, account, profile }) {
			// Allow credentials sign in
			if (account?.provider === "credentials") {
				return true;
			}

			// For OAuth providers (Google, GitHub), auto-link if email already exists
			if (account && (account.provider === "google" || account.provider === "github")) {
				const oauthEmail = normalizeEmail(profile?.email ?? user?.email);
				if (!oauthEmail) {
					return true;
				}

				// Check if user already exists with this email
				const [existingUser] = await db
					.select()
					.from(userTable)
					.where(sql`lower(${userTable.email}) = ${oauthEmail}`)
					.limit(1);

				if (existingUser) {
					// Check if this OAuth account is already linked
					const [existingAccount] = await db
						.select()
						.from(accountTable)
						.where(
							and(
								eq(accountTable.provider, account.provider),
								eq(accountTable.providerAccountId, account.providerAccountId),
							),
						)
						.limit(1);

					if (!existingAccount) {
						// Auto-link: insert the OAuth account for the existing user
						try {
							await db
								.insert(accountTable)
								.values({
									userId: existingUser.id,
									type: account.type,
									provider: account.provider,
									providerAccountId: account.providerAccountId,
									refresh_token: account.refresh_token ?? null,
									access_token: account.access_token ?? null,
									expires_at: account.expires_at ?? null,
									token_type: account.token_type ?? null,
									scope: account.scope ?? null,
									id_token: account.id_token ?? null,
									session_state:
										typeof account.session_state === "string"
											? account.session_state
											: null,
								})
								.onConflictDoNothing();

							// Also mark email as verified since OAuth provider verified it
							if (!existingUser.emailVerified) {
								await setEmailVerified(existingUser.id);
							}

							// Sync name from OAuth profile if user doesn't have one
							const displayName = (profile as { name?: string; login?: string })?.name
								?? (profile as { login?: string })?.login;
							if (displayName && !existingUser.name) {
								await db
									.update(userTable)
									.set({ name: displayName })
									.where(eq(userTable.id, existingUser.id));
							}
						} catch (linkError) {
							console.error("[Auth.js] Auto-link failed:", linkError);
							// Still allow sign in even if linking fails
						}
					}
				}
			}

			return true;
		},
	},
	logger: {
		error(error) {
			console.error("[Auth.js][error]", error);
		},
		warn(code) {
			console.warn("[Auth.js][warn]", code);
		},
		debug(code, metadata) {
			if (process.env.NODE_ENV !== "production") {
				console.debug("[Auth.js][debug]", code, metadata);
			}
		},
	},
	events: {
		async linkAccount({ user, profile }) {
			// Sync name from Google/GitHub if available
			const oauthProfile = profile as
				| { name?: string; login?: string }
				| undefined;
			const displayName = oauthProfile?.name || oauthProfile?.login;

			if (displayName) {
				try {
					await db
						.update(userTable)
						.set({
							name: displayName,
						})
						.where(eq(userTable.id, user.id as string));
				} catch (error) {
					console.error("[Auth.js][linkAccount] Failed to sync profile", error);
				}
			}
		},
		async createUser({ user }) {
			// Default type and role for new OAuth users
			try {
				await db
					.update(userTable)
					.set({ role: "user", isPro: false })
					.where(eq(userTable.id, user.id as string));
			} catch (error) {
				console.error("[Auth.js][createUser] Failed to finalize OAuth user", error);
			}
		},
	},
});
