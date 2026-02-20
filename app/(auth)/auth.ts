import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DUMMY_PASSWORD } from "@/lib/constants";
import {
  createGuestUser,
  db,
  getUser,
  getUserByUsername,
  setEmailVerified,
  verifyVerificationCode,
} from "@/lib/db/queries";
import { user as userTable } from "@/lib/db/schema";
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ username, password, email, code }: any) {
        // SCENARIO 1: Login with Email & Verification Code (Auto-Login after Verify)
        if (email && code) {
          const isValid = await verifyVerificationCode(email, code);
          if (isValid) {
            await setEmailVerified(email);
            const [user] = await getUser(email);
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
        const users = await getUserByUsername(username);

        if (users.length === 0) {
          if (password) await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          if (password) await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        const isEnvAdminEmail =
          user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

        const isAdminUsername = (username || "").toLowerCase() === "admin";
        const isAdmin = isEnvAdminEmail || isAdminUsername;

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
    async jwt({ token, user, trigger }) {
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
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT:", error);
          // If error, keep existing token data
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
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
      if (account?.provider === "credentials") return true;

      // For OAuth (Google, GitHub) - allow sign in and let NextAuth handle linking
      // If the email already exists with a different provider, automatically link
      if (account && user.email) {
        try {
          const [existingUser] = await getUser(user.email);
          if (existingUser) {
            // User exists — update their name if not set
            if (!existingUser.name && user.name) {
              await db
                .update(userTable)
                .set({ name: user.name })
                .where(eq(userTable.id, existingUser.id));
            }
            // Patch user.id so NextAuth uses the existing user
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
    async linkAccount({ user, profile }: any) {
      // Sync name from Google/GitHub if available
      if (profile?.name || profile?.login) {
        await db
          .update(userTable)
          .set({ name: profile.name || profile.login })
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
