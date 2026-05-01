import { type NextRequest, NextResponse } from "next/server";

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

export async function middleware(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const { pathname } = request.nextUrl;
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", pathname);
	requestHeaders.set("x-request-host", host);

	// Apply security headers to all responses
	const response = handleRouting(request, host, pathname, requestHeaders);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	return response;
}

function handleRouting(
	request: NextRequest,
	host: string,
	pathname: string,
	requestHeaders: Headers,
): NextResponse {
	const withPath = (targetPath: string) => {
		const targetUrl = request.nextUrl.clone();
		targetUrl.pathname = targetPath;
		return targetUrl;
	};

	// API subdomain: restrict to /api routes only
	if (host.startsWith(API_SUBDOMAIN)) {
		if (pathname === "/v1" || pathname.startsWith("/v1/")) {
			return NextResponse.rewrite(withPath(`/api${pathname}`), {
				request: { headers: requestHeaders },
			});
		}

		if (
			pathname.startsWith("/api/") ||
			pathname.startsWith("/_next") ||
			pathname.startsWith("/favicon")
		) {
			return NextResponse.next({
				request: { headers: requestHeaders },
			});
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
			return NextResponse.next({
				request: { headers: requestHeaders },
			});
		}

		// Already on /api-console path
		if (pathname.startsWith("/api-console")) {
			return NextResponse.next({
				request: { headers: requestHeaders },
			});
		}

		// Root → dashboard
		if (pathname === "/") {
			return NextResponse.rewrite(withPath("/api-console"), {
				request: { headers: requestHeaders },
			});
		}

		// Everything else → rewrite to /api-console/<path>
		return NextResponse.rewrite(withPath(`/api-console${pathname}`), {
			request: { headers: requestHeaders },
		});
	}

	return NextResponse.next({
		request: { headers: requestHeaders },
	});
}

export const config = {
	matcher: ["/((?!_next|favicon.ico).*)"],
};
