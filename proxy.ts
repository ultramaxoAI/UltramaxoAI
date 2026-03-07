import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex } from "./lib/constants";
import { securityHeaders } from "./middleware.security";

const CHAT_SUBDOMAIN = "chat.ultramaxo.tech";
const MAIN_DOMAIN = "ultramaxo.tech";
const LOGOUT_REDIRECT_FLAG = "loggedOut";

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

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hostname = request.headers.get("host") || "";
	const isLoggedOutRedirect =
		request.nextUrl.searchParams.get(LOGOUT_REDIRECT_FLAG) === "1";

	if (request.method === "POST" && pathname === "/login") {
		const loginFallbackUrl = new URL("/api/auth/login-fallback", request.url);
		loginFallbackUrl.search = request.nextUrl.search;
		return NextResponse.rewrite(loginFallbackUrl);
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

	// ALLOW /api/auth/* AND /api/debug-db explicitly
	if (pathname.startsWith("/api/auth") || pathname.includes("/api/debug-db")) {
		return nextWithSecurity(request);
	}

	const token = await getToken({
		req: request,
		secret: process.env.AUTH_SECRET,
	});

	const chatSubdomain = isChatSubdomain(request);
	const production = isProduction(request);

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

	// If user is on main domain and hits /chat while in production → redirect to chat subdomain
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
			// Don't redirect RSC/prefetch requests cross-origin — just pass through
			return nextWithSecurity(request);
		}
		if (production) {
			return NextResponse.redirect(
				new URL("/chat", `https://${CHAT_SUBDOMAIN}`),
			);
		}
		return NextResponse.redirect(new URL("/chat", request.url));
	}

	// Authenticated non-guest users landing on main-domain root → send to chat
	if (production && !chatSubdomain && token && !isGuest && pathname === "/") {
		return NextResponse.redirect(
			new URL("/chat", `https://${CHAT_SUBDOMAIN}`),
		);
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
