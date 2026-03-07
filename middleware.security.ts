import { type NextRequest, NextResponse } from "next/server";

/**
 * Security headers middleware
 * Adds CSP, HSTS, and other security headers to all responses
 */
export function securityHeaders(request: NextRequest, response: NextResponse) {
	const headers = new Headers(response.headers);
	const pathname = request.nextUrl.pathname;
	const isAuthRoute =
		pathname === "/login" ||
		pathname === "/register" ||
		pathname === "/forgot-password" ||
		pathname === "/reset-password" ||
		pathname.startsWith("/oauth/") ||
		pathname.startsWith("/api/auth/");

	// Content Security Policy
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https: blob:",
		"connect-src 'self' https://ultramaxo.tech https://chat.ultramaxo.tech https://api.groq.com https://*.vercel.com wss://*.vercel.com",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self' https://ultramaxo.tech https://www.ultramaxo.tech https://chat.ultramaxo.tech https://accounts.google.com https://github.com",
	].join("; ");

	headers.set("Content-Security-Policy", csp);

	// Strict Transport Security (HTTPS only)
	headers.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains",
	);

	// Prevent MIME type sniffing
	headers.set("X-Content-Type-Options", "nosniff");

	// Clickjacking protection
	headers.set("X-Frame-Options", "DENY");

	// XSS Protection (legacy but still useful)
	headers.set("X-XSS-Protection", "1; mode=block");

	// Referrer Policy
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// Permissions Policy (restrict browser features)
	headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), interest-cohort=()",
	);

	if (isAuthRoute) {
		headers.set(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
		);
		headers.set("Pragma", "no-cache");
		headers.set("Expires", "0");
		headers.set("Surrogate-Control", "no-store");
	}

	headers.forEach((value, key) => {
		response.headers.set(key, value);
	});

	return response;
}
