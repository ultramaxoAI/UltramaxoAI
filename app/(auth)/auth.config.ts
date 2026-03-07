import type { NextAuthConfig } from "next-auth";

const MAIN_URL =
	process.env.NODE_ENV === "production" ? "https://ultramaxo.tech" : undefined;
const CHAT_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

export const authConfig = {
	pages: {
		signIn: "/login",
		newUser: "/chat",
	},
	providers: [
		// added later in auth.ts since it requires bcrypt which is only compatible with Node.js
		// while this file is also used in non-Node.js environments
	],
	callbacks: {
		redirect({ url, baseUrl }) {
			const allowedOrigins = new Set([baseUrl]);

			if (MAIN_URL) {
				allowedOrigins.add(MAIN_URL);
			}

			if (CHAT_URL.startsWith("http")) {
				allowedOrigins.add(CHAT_URL);
			}

			// After sign in, send to chat subdomain (production) or /chat (dev)
			if (url === baseUrl || url === `${baseUrl}/`) {
				return CHAT_URL.startsWith("http") ? CHAT_URL : `${baseUrl}${CHAT_URL}`;
			}
			// Allow relative callbacks within the app
			if (url.startsWith("/")) {
				return `${baseUrl}${url}`;
			}
			// Allow known first-party origins
			if (allowedOrigins.has(new URL(url).origin)) {
				return url;
			}
			return CHAT_URL.startsWith("http") ? CHAT_URL : `${baseUrl}${CHAT_URL}`;
		},
	},
} satisfies NextAuthConfig;
