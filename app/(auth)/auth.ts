import type { Adapter } from "@auth/core/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcrypt-ts";
import { and, eq } from "drizzle-orm";
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
} from "@/lib/db/queries";
import {
	account as accountTable,
	authenticator as authenticatorTable,
	session as sessionTable,
	user as userTable,
	verificationToken as verificationTokenTable,
} from "@/lib/db/schema";
import { generateDummyPassword } from "@/lib/db/utils";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular" | "pro";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			type: UserType;
			role: "user" | "admin";
		} & DefaultSession["user"];
	}

	interface User {
		id?: string;
		email?: string | null;
		type: UserType;
		role: "user" | "admin";
	}
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		id: string;
		type: UserType;
		role: "user" | "admin";
	}
}

declare module "@auth/core/adapters" {
	interface AdapterUser {
		type: UserType;
		role: "user" | "admin";
	}
}

const isProduction = process.env.NODE_ENV === "production";
const cookieDomain = isProduction ? ".ultramaxo.tech" : undefined;
const redirectProxyUrl =
	process.env.AUTH_REDIRECT_PROXY_URL ||
	(isProduction ? "https://ultramaxo.tech/api/auth" : undefined);
const cookiePrefix = isProduction ? "__Secure-" : "";
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
	adapter: DrizzleAdapter(db, {
		usersTable: userTable,
		accountsTable: accountTable,
		sessionsTable: sessionTable,
		verificationTokensTable: verificationTokenTable,
		authenticatorsTable: authenticatorTable,
	}) as Adapter,
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

				const isEnvAdminEmail =
					user.email &&
					process.env.ADMIN_EMAIL &&
					user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

				const isAdminUsername = normalizedUsername.toLowerCase() === "admin";
				const isAdmin = isEnvAdminEmail || isAdminUsername;

				const emailVerificationEnabled =
					process.env.ENABLE_EMAIL_VERIFICATION === "true";

				if (emailVerificationEnabled && !user.emailVerified && !isAdmin) {
					// Explicitly block unverified regular users from logging in with password
					throw new Error("unverified");
				}

				return {
					...user,
					type: user.isPro ? "pro" : "regular",
					role: isAdmin ? "admin" : "user",
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
			}

			// Refresh user data from database on every request to keep it fresh
			// This ensures that when admin approves, the next request will have updated data
			if (token.id) {
				try {
					const [dbUser] = await db
						.select()
						.from(userTable)
						.where(eq(userTable.id, token.id))
						.limit(1);

					if (dbUser) {
						// Update token with fresh data from database
						token.type = dbUser.isPro ? "pro" : "regular";
						token.role = dbUser.role as "user" | "admin";
						token.email = dbUser.email;
						token.name = dbUser.name;
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
				session.user.email = token.email as string;
				session.user.name = token.name as string;
			}

			return session;
		},
		async signIn({ user, account }) {
			// Allow credentials sign in
			if (account?.provider === "credentials") {
				return true;
			}

			// For OAuth (Google, GitHub) - let Auth.js handle account linking
			// via allowDangerousEmailAccountLinking: true on the provider config.
			// We only need to:
			// 1. Clean up orphaned account rows (user deleted but account row left behind)
			// 2. Patch user.id so Auth.js uses the existing user instead of creating a new one
			// 3. Sync display name from OAuth profile
			if (account && user.email) {
				try {
					// Check if this OAuth account is already linked (and if the linked user still exists)
					const [linkedAccount] = await db
						.select({
							accountUserId: accountTable.userId,
							linkedUserId: userTable.id,
							linkedUserEmail: userTable.email,
						})
						.from(accountTable)
						.leftJoin(userTable, eq(accountTable.userId, userTable.id))
						.where(
							and(
								eq(accountTable.provider, account.provider),
								eq(accountTable.providerAccountId, account.providerAccountId),
							),
						)
						.limit(1);

					// Self-heal: delete orphaned OAuth rows where the user no longer exists.
					// This prevents Auth.js from finding a stale account link pointing to a deleted user.
					if (linkedAccount && !linkedAccount.linkedUserId) {
						await db
							.delete(accountTable)
							.where(
								and(
									eq(accountTable.provider, account.provider),
									eq(accountTable.providerAccountId, account.providerAccountId),
								),
							);
					}

					// Block sign-in if this OAuth account is already linked to a DIFFERENT user
					if (
						linkedAccount?.linkedUserEmail &&
						linkedAccount.linkedUserId
					) {
						const [existingUser] = await getUser(user.email);
						if (existingUser && linkedAccount.linkedUserEmail !== existingUser.email) {
							return false;
						}
					}

					// Check if a user with this email already exists (e.g. registered via credentials)
					const [existingUser] = await getUser(user.email);
					if (existingUser) {
						// Sync display name from OAuth profile if the user doesn't have one
						if (!existingUser.name && user.name) {
							await db
								.update(userTable)
								.set({ name: user.name })
								.where(eq(userTable.id, existingUser.id));
						}

						// Patch user.id so Auth.js uses the existing user
						// instead of trying to create a duplicate
						user.id = existingUser.id;
					}
				} catch {
					// If lookup fails, continue with normal flow
				}
			}
			return true;
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
				await db
					.update(userTable)
					.set({
						name: displayName,
					})
					.where(eq(userTable.id, user.id as string));
			}
		},
		async createUser({ user }) {
			// Default type and role for new OAuth users
			await db
				.update(userTable)
				.set({ role: "user", isPro: false })
				.where(eq(userTable.id, user.id as string));
		},
	},
});
