import { type NextRequest, NextResponse } from "next/server";

const APP_SUBDOMAIN = "app.";
const API_SUBDOMAIN = "api.";
const MAINTENANCE_STATUS_PATH = "/api/internal/maintenance-status";

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export async function proxy(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const { pathname } = request.nextUrl;
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", pathname);
	requestHeaders.set("x-request-host", host);

	if (await shouldBlockApiRequest(request, host, pathname)) {
		const maintenanceStatus = await getMaintenanceStatus(request, "api");
		return NextResponse.json(
			{
				error: "service_unavailable",
				scope: "api",
				message:
					maintenanceStatus?.maintenanceMessage ||
					"API sedang maintenance sementara.",
				title:
					maintenanceStatus?.maintenanceTitle || "API temporarily unavailable",
			},
			{
				status: 503,
				headers: {
					"Retry-After": "300",
				},
			},
		);
	}

	// Apply security headers to all responses
	const response = handleRouting(request, host, pathname, requestHeaders);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	return response;
}

async function getMaintenanceStatus(
	request: NextRequest,
	scope: "api" | "chat",
) {
	const targetUrl = request.nextUrl.clone();
	targetUrl.pathname = MAINTENANCE_STATUS_PATH;
	targetUrl.search = `?scope=${scope}`;

	try {
		const response = await fetch(targetUrl, {
			method: "GET",
			headers: {
				cookie: request.headers.get("cookie") || "",
				host: request.headers.get("host") || "",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as {
			maintenanceEnabled: boolean;
			maintenanceTitle?: string;
			maintenanceMessage?: string;
			isAdmin?: boolean;
		};
	} catch {
		return null;
	}
}

function isBypassedApiMaintenancePath(pathname: string) {
	return (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon") ||
		pathname === "/robots.txt" ||
		pathname === "/sitemap.xml" ||
		pathname.startsWith("/login") ||
		pathname.startsWith("/register") ||
		pathname.startsWith("/oauth") ||
		pathname.startsWith("/verify") ||
		pathname.startsWith("/forgot-password") ||
		pathname.startsWith("/reset-password") ||
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/admin") ||
		pathname.startsWith("/api/internal") ||
		pathname.startsWith("/api/payment/webhook") ||
		pathname.startsWith("/api/webhooks") ||
		pathname.startsWith("/api/cron") ||
		pathname.startsWith("/api/public/site-status") ||
		pathname.startsWith("/api/health")
	);
}

function isApiRequestPath(host: string, pathname: string) {
	if (host.startsWith(API_SUBDOMAIN)) {
		return pathname === "/v1" || pathname.startsWith("/v1/");
	}

	return pathname.startsWith("/api/");
}

async function shouldBlockApiRequest(
	request: NextRequest,
	host: string,
	pathname: string,
) {
	if (!isApiRequestPath(host, pathname)) {
		return false;
	}

	if (isBypassedApiMaintenancePath(pathname)) {
		return false;
	}

	const maintenanceStatus = await getMaintenanceStatus(request, "api");
	return (
		maintenanceStatus?.maintenanceEnabled === true &&
		maintenanceStatus?.isAdmin !== true
	);
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
			pathname.startsWith("/maintenance") ||
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
