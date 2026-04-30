import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const APP_SUBDOMAIN = "app.";
const API_SUBDOMAIN = "api.";
const MAINTENANCE_BYPASS_PATHS = [
	"/maintenance",
	"/login",
	"/register",
	"/oauth",
	"/verify",
	"/forgot-password",
	"/reset-password",
	"/api",
];
const STATIC_PATH_PREFIXES = ["/_next", "/favicon"];
const STATIC_PATHNAMES = new Set([
	"/robots.txt",
	"/sitemap.xml",
	"/manifest.webmanifest",
]);

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

/**
 * Check if the current request is from an admin user by decoding the JWT.
 * Works in Edge Runtime (no bcrypt needed).
 */
async function isAdminRequest(request: NextRequest): Promise<boolean> {
	try {
		const token = await getToken({
			req: request,
			secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
			// Match the cookie name used in auth.ts
			cookieName:
				process.env.NODE_ENV === "production"
					? "__Secure-authjs.session-token"
					: "authjs.session-token",
		});
		return token?.role === "admin";
	} catch {
		return false;
	}
}

function isStaticRequest(pathname: string) {
	return (
		STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
		STATIC_PATHNAMES.has(pathname) ||
		/\.[a-zA-Z0-9]+$/.test(pathname)
	);
}

function isMaintenanceBypassPath(pathname: string) {
	return MAINTENANCE_BYPASS_PATHS.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

async function isMaintenanceEnabled(request: NextRequest) {
	try {
		const url = new URL("/api/public/site-status", request.url);
		const response = await fetch(url, {
			headers: {
				"x-maintenance-check": "1",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return false;
		}

		const data = (await response.json()) as { maintenanceEnabled?: boolean };
		return data.maintenanceEnabled === true;
	} catch {
		return false;
	}
}

export async function middleware(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const { pathname } = request.nextUrl;
	const isAdmin = await isAdminRequest(request);

	if (
		!isAdmin &&
		!isStaticRequest(pathname) &&
		!isMaintenanceBypassPath(pathname) &&
		(await isMaintenanceEnabled(request))
	) {
		return NextResponse.rewrite(new URL("/maintenance", request.url));
	}

	// --- Admin route protection (runs before everything else) ---
	if (pathname.startsWith("/admin")) {
		if (!isAdmin) {
			// Non-admin users get a 404 (same as the layout behavior)
			return new NextResponse("Not Found", { status: 404 });
		}
	}

	// --- Admin API route protection ---
	if (pathname.startsWith("/api/admin")) {
		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Forbidden", message: "Admin access required." },
				{ status: 403 },
			);
		}
	}

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
		if (pathname === "/v1" || pathname.startsWith("/v1/")) {
			return NextResponse.rewrite(new URL(`/api${pathname}`, request.url));
		}

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
			pathname.startsWith("/oauth") ||
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
