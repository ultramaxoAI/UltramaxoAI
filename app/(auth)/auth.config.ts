import type { NextAuthConfig } from "next-auth";

const CHAT_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech"
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
			// After sign in, send to chat subdomain (production) or /chat (dev)
			if (url === baseUrl || url === `${baseUrl}/`) {
				return CHAT_URL.startsWith("http") ? CHAT_URL : `${baseUrl}${CHAT_URL}`;
			}
			// Allow relative callbacks within the app
			if (url.startsWith("/")) {
				return `${baseUrl}${url}`;
			}
			// Allow same-origin URLs
			if (new URL(url).origin === baseUrl) {
				return url;
			}
			// Allow chat subdomain in production
			if (url.startsWith("https://chat.ultramaxo.tech")) {
				return url;
			}
			return CHAT_URL.startsWith("http") ? CHAT_URL : `${baseUrl}${CHAT_URL}`;
		},
	},
} satisfies NextAuthConfig;
