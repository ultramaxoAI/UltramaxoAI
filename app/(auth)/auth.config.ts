import type { NextAuthConfig } from "next-auth";

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
			// After sign in, send to /chat instead of the landing page
			if (url === baseUrl || url === `${baseUrl}/`) {
				return `${baseUrl}/chat`;
			}
			// Allow relative callbacks within the app
			if (url.startsWith("/")) {
				return `${baseUrl}${url}`;
			}
			// Allow same-origin URLs
			if (new URL(url).origin === baseUrl) {
				return url;
			}
			return `${baseUrl}/chat`;
		},
	},
} satisfies NextAuthConfig;
