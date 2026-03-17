import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex } from "./lib/constants";
import { securityHeaders } from "./middleware.security";

const CHAT_SUBDOMAIN = "chat.ultramaxo.tech";
const MAIN_DOMAIN = "ultramaxo.tech";
const LOGOUT_REDIRECT_FLAG = "loggedOut";
const MAINTENANCE_ALLOWED_PATHS = new Set([
	"/maintenance",
	"/login",
	"/register",
	"/forgot-password",
	"/reset-password",
	"/privacy",
	"/terms",
	"/manifest.webmanifest",
	"/site.webmanifest",
	"/sw.js",
]);
const MAINTENANCE_ALLOWED_PREFIXES = [
	"/oauth/",
	"/api/auth/",
	"/api/public/site-status",
	"/api/admin/",
	"/api/debug-db",
	"/ping",
];

function nextWithSecurity(request: NextRequest) {
	return securityHeaders(request, NextResponse.next());
}

function isChatSubdomain(request: NextRequest): boolean {
	const hostname = request.headers.get("host") || "";
	return hostname.startsWith("chat.");
}

function isProduction(request: NextRequest): boolean {
	const hostname = request.headers.get("host") || "";
	return hostname.endsWith("ultramaxo.tech");
}

function isMaintenanceBypassed(pathname: string) {
	if (MAINTENANCE_ALLOWED_PATHS.has(pathname)) {
		return true;
	}

	return MAINTENANCE_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function getMaintenanceStatus(request: NextRequest) {
	const hostname = request.nextUrl.hostname;
	if (
		process.env.NODE_ENV !== "production" ||
		hostname === "localhost" ||
		hostname === "127.0.0.1"
	) {
		return { maintenanceEnabled: false };
	}

	try {
		const statusUrl = new URL("/api/public/site-status", request.url);
		const response = await fetch(statusUrl, {
			cache: "no-store",
			signal: AbortSignal.timeout(1200),
			headers: {
				"cache-control": "no-store",
			},
		});

		if (!response.ok) {
			return { maintenanceEnabled: false };
		}

		return (await response.json()) as {
			maintenanceEnabled?: boolean;
		};
	} catch {
		return { maintenanceEnabled: false };
	}
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hostname = request.headers.get("host") || "";
	const isLoggedOutRedirect =
		request.nextUrl.searchParams.get(LOGOUT_REDIRECT_FLAG) === "1";

	if (request.method === "POST" && pathname === "/oauth/complete") {
		const completionUrl = new URL(request.url);
		return NextResponse.redirect(completionUrl, { status: 303 });
	}

	// Do not force apex/non-www here.
	// Platform-level domain redirects (Vercel) should be the single source of truth
	// to prevent redirect loops between app middleware and edge/domain settings.

	/*
	 * Playwright starts the dev server and requires a 200 status to
	 * begin the tests, so this ensures that the tests can start
	 */
	if (pathname.startsWith("/ping")) {
		return new Response("pong", { status: 200 });
	}

	// Allow auth and maintenance status routes to pass through immediately.
	if (
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/public/site-status") ||
		pathname.includes("/api/debug-db")
	) {
		return nextWithSecurity(request);
	}

	// Use the same cookie name as configured in app/(auth)/auth.ts
	// In production the cookie is prefixed with __Secure-
	const production = isProduction(request);
	const cookiePrefix = production ? "__Secure-" : "";
	const token = await getToken({
		req: request,
		secret: process.env.AUTH_SECRET,
		cookieName: `${cookiePrefix}authjs.session-token`,
	});

	const chatSubdomain = isChatSubdomain(request);
	const isAdmin = token?.role === "admin";
	const maintenance = await getMaintenanceStatus(request);

	if (
		maintenance.maintenanceEnabled &&
		!isAdmin &&
		!isMaintenanceBypassed(pathname)
	) {
		if (pathname.startsWith("/api/")) {
			return new NextResponse(
				JSON.stringify({
					error: "Maintenance mode is enabled",
				}),
				{
					status: 503,
					headers: {
						"content-type": "application/json",
						"cache-control": "no-store",
					},
				},
			);
		}

		return NextResponse.redirect(new URL("/maintenance", request.url));
	}

	if (!chatSubdomain && pathname === "/login" && isLoggedOutRedirect) {
		return nextWithSecurity(request);
	}

	// If user hits chat subdomain without auth → redirect to main domain login
	if (chatSubdomain && !token) {
		// Allow API routes and static assets on chat subdomain
		if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
			return NextResponse.next();
		}
		return NextResponse.redirect(new URL("/login", `https://${MAIN_DOMAIN}`));
	}

	// If user is on main domain and hits /chat while authenticated in production,
	// send them to the dedicated chat subdomain.
	if (production && !chatSubdomain && pathname.startsWith("/chat") && token) {
		const chatPath = pathname.replace("/chat", "") || "";
		return NextResponse.redirect(
			new URL(
				`/chat${chatPath}${request.nextUrl.search}`,
				`https://${CHAT_SUBDOMAIN}`,
			),
		);
	}

	// Allow OAuth launcher routes for unauthenticated users
	if (!token && pathname.startsWith("/oauth/")) {
		return nextWithSecurity(request);
	}

	// Allow access to home and public pages without a token
	if (
		!token &&
		[
			"/",
			"/login",
			"/register",
			"/forgot-password",
			"/reset-password",
			"/api/auth/guest",
			"/manifest.webmanifest",
			"/site.webmanifest",
			"/sw.js",
			"/privacy",
			"/terms",
		].includes(pathname)
	) {
		return nextWithSecurity(request);
	}

	// If it's a chat ID page, we check visibility within the page component,
	// but we can allow the middleware to pass for now.
	if (!token && pathname.startsWith("/chat/")) {
		return nextWithSecurity(request);
	}

	if (!token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const isGuest = guestRegex.test(token?.email ?? "");

	// Authenticated non-guest users on login/register → redirect to chat
	// Skip cross-origin redirect for RSC prefetch requests (they cause CORS errors)
	const isRSCRequest =
		request.nextUrl.searchParams.has("_rsc") ||
		request.headers.get("RSC") === "1" ||
		request.headers.get("Next-Router-Prefetch") === "1";

	if (
		token &&
		!isGuest &&
		["/login", "/register"].includes(pathname) &&
		!(pathname === "/login" && isLoggedOutRedirect)
	) {
		if (isRSCRequest) {
			// Don't redirect RSC/prefetch requests; just return the page.
			return nextWithSecurity(request);
		}
		if (production) {
			return NextResponse.redirect(
				new URL("/chat", `https://${CHAT_SUBDOMAIN}`),
			);
		}
		return NextResponse.redirect(new URL("/chat", request.url));
	}

	// Authenticated non-guest users landing on main-domain root → send to chat subdomain
	if (production && !chatSubdomain && token && !isGuest && pathname === "/") {
		return NextResponse.redirect(
			new URL("/chat", `https://${CHAT_SUBDOMAIN}`),
		);
	}

	if (!production && !chatSubdomain && token && !isGuest && pathname === "/") {
		return NextResponse.redirect(new URL("/chat", request.url));
	}

	// Apply security headers to all responses
	return nextWithSecurity(request);
}

export const config = {
	matcher: [
		"/",
		"/chat/:id",
		"/api/:path*",
		"/login",
		"/register",

		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|site.webmanifest|sw.js).*)",
	],
};
