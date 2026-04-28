import type { NextAuthConfig } from "next-auth";

const MAIN_URL =
	process.env.NODE_ENV === "production" ? "https://ultramaxo.tech" : undefined;
const WWW_URL =
	process.env.NODE_ENV === "production"
		? "https://www.ultramaxo.tech"
		: undefined;
const CHAT_URL =
	process.env.NODE_ENV === "production"
		? "https://ultramaxo.tech/chat"
		: "/chat";
const APP_URL =
	process.env.NODE_ENV === "production"
		? "https://app.ultramaxo.tech"
		: undefined;

export const authConfig = {
	pages: {
		signIn: "/login",
		newUser: CHAT_URL,
	},
	providers: [
		// added later in auth.ts since it requires bcrypt which is only compatible with Node.js
		// while this file is also used in non-Node.js environments
	],
	callbacks: {
		redirect({ url, baseUrl }) {
			const allowedOrigins = new Set([baseUrl]);
			const rootOrigins = new Set([baseUrl]);

			if (MAIN_URL) {
				allowedOrigins.add(MAIN_URL);
				rootOrigins.add(MAIN_URL);
			}

			if (APP_URL) {
				allowedOrigins.add(APP_URL);
				rootOrigins.add(APP_URL);
			}

			if (WWW_URL) {
				allowedOrigins.add(WWW_URL);
				rootOrigins.add(WWW_URL);
			}

			if (CHAT_URL.startsWith("http")) {
				allowedOrigins.add(new URL(CHAT_URL).origin);
			}

			const resolvedChatUrl = CHAT_URL.startsWith("http")
				? CHAT_URL
				: `${baseUrl}${CHAT_URL}`;

			// After sign in, stay in app subdomain if login happens there.
			if (url === baseUrl || url === `${baseUrl}/`) {
				if (APP_URL && baseUrl.startsWith(APP_URL)) {
					return `${baseUrl}/`;
				}
				return resolvedChatUrl;
			}
			// Allow relative callbacks within the app
			if (url.startsWith("/")) {
				if (url === "/chat" || url.startsWith("/chat?")) {
					return resolvedChatUrl;
				}
				return `${baseUrl}${url}`;
			}

			const parsedUrl = new URL(url);

			if (
				rootOrigins.has(parsedUrl.origin) &&
				(parsedUrl.pathname === "/chat" || parsedUrl.pathname.startsWith("/chat/"))
			) {
				return resolvedChatUrl;
			}

			// Never leave authenticated users on the marketing root in production.
			if (rootOrigins.has(parsedUrl.origin) && parsedUrl.pathname === "/") {
				if (APP_URL && parsedUrl.origin === APP_URL) {
					return `${APP_URL}/`;
				}
				return resolvedChatUrl;
			}

			// Allow known first-party origins
			if (allowedOrigins.has(parsedUrl.origin)) {
				return url;
			}
			return resolvedChatUrl;
		},
	},
} satisfies NextAuthConfig;
