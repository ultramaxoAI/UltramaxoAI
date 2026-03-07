import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: WorkerGlobalScope;

const authRouteMatcher = ({ url }: { url: URL }) => {
	return (
		url.origin === self.location.origin &&
		(
			url.pathname === "/login" ||
			url.pathname === "/register" ||
			url.pathname === "/forgot-password" ||
			url.pathname === "/reset-password" ||
			url.pathname.startsWith("/oauth/") ||
			url.pathname.startsWith("/api/auth/")
		)
	);
};

const runtimeCaching = defaultCache.map((entry) => {
	if (
		entry.method === "GET" &&
		typeof entry.matcher === "function"
	) {
		return {
			...entry,
			matcher: (args: Parameters<typeof entry.matcher>[0]) => {
				if (authRouteMatcher(args)) {
					return false;
				}

				return entry.matcher(args);
			},
		};
	}

	return entry;
});

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching,
});

serwist.addEventListeners();
