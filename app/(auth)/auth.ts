import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, db, getUser, getUserByUsername } from "@/lib/db/queries";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
      async authorize({ username, password }: any) {
        const users = await getUserByUsername(username);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
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

        return {
          ...user,
          type: user.isPro ? "pro" : "regular",
          role: isEnvAdminEmail ? "admin" : "user",
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;

        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        const userEmail = (user.email || "").toLowerCase();
        const isAdmin = adminEmail && userEmail === adminEmail;

        token.role = isAdmin ? "admin" : "user";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.role = token.role;
      }

      return session;
    },
  },
  events: {
    async linkAccount({ user, profile }: any) {
      // Sync name from Google/GitHub if available
      if (profile?.name || profile?.login) {
        await db.update(userTable)
          .set({ name: profile.name || profile.login })
          .where(eq(userTable.id, user.id as string));
      }
    },
    async createUser({ user }) {
      // Default type and role for new OAuth users
      await db.update(userTable)
        .set({ role: "user", isPro: false })
        .where(eq(userTable.id, user.id as string));
    },
  },
});
