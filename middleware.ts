import { NextResponse, type NextRequest } from "next/server";

const APP_SUBDOMAIN = "app.";
const API_SUBDOMAIN = "api.";

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function middleware(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const { pathname } = request.nextUrl;

	// Apply security headers to all responses
	const response = handleRouting(request, host, pathname);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	return response;
}

function handleRouting(
	request: NextRequest,
	host: string,
	pathname: string,
): NextResponse {
	// API subdomain: restrict to /api routes only
	if (host.startsWith(API_SUBDOMAIN)) {
		if (
			pathname.startsWith("/api/") ||
			pathname.startsWith("/_next") ||
			pathname.startsWith("/favicon")
		) {
			return NextResponse.next();
		}
		// Block non-API access on api subdomain
		return NextResponse.json(
			{
				error: "Not found",
				message: "Use ultramaxo.tech for the web interface.",
			},
			{ status: 404 },
		);
	}

	// App subdomain routing
	if (host.startsWith(APP_SUBDOMAIN)) {
		// Pass through auth, API, static, and internal paths
		if (
			pathname.startsWith("/api") ||
			pathname.startsWith("/_next") ||
			pathname.startsWith("/favicon") ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/register") ||
			pathname.startsWith("/auth") ||
			pathname.startsWith("/verify") ||
			pathname.startsWith("/forgot-password") ||
			pathname.startsWith("/reset-password") ||
			pathname.startsWith("/docs") ||
			pathname === "/robots.txt" ||
			pathname === "/sitemap.xml"
		) {
			return NextResponse.next();
		}

		// Already on /api-console path
		if (pathname.startsWith("/api-console")) {
			return NextResponse.next();
		}

		// Root → dashboard
		if (pathname === "/") {
			return NextResponse.rewrite(new URL("/api-console", request.url));
		}

		// Everything else → rewrite to /api-console/<path>
		return NextResponse.rewrite(
			new URL(`/api-console${pathname}`, request.url),
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|favicon.ico).*)"],
};
