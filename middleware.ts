import { NextResponse, type NextRequest } from "next/server";

const APP_SUBDOMAIN = "app.";

export function middleware(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const { pathname } = request.nextUrl;

	if (host.startsWith(APP_SUBDOMAIN)) {
		// Pass through auth, API, static, and internal paths
		if (
			pathname.startsWith("/api") ||
			pathname.startsWith("/_next") ||
			pathname.startsWith("/favicon") ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/register") ||
			pathname.startsWith("/auth") ||
			pathname.startsWith("/docs")
		) {
			return NextResponse.next();
		}

		// Already on /api-console path — pass through
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
	matcher: ["/((?!_next|api|favicon.ico).*)"],
};
