import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);
const CHAT_SUCCESS_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

const ALLOWED_CALLBACK_ORIGINS =
	process.env.NODE_ENV === "production"
		? new Set([
				"https://ultramaxo.tech",
				"https://www.ultramaxo.tech",
				"https://app.ultramaxo.tech",
				"https://chat.ultramaxo.tech",
			])
		: null;
const AUTH_SESSION_COOKIE_NAMES = [
	"authjs.session-token",
	"__Secure-authjs.session-token",
	"next-auth.session-token",
	"__Secure-next-auth.session-token",
];
const AUTH_COOKIE_CHUNK_SUFFIXES = ["", ".0", ".1", ".2", ".3", ".4", ".5"];
const AUTH_COOKIE_DOMAIN =
	process.env.NODE_ENV === "production" ? ".ultramaxo.tech" : undefined;

function hasProviderConfig(provider: string) {
	if (provider === "google") {
		return Boolean(
			(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
				(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET),
		);
	}

	if (provider === "github") {
		return Boolean(
			(process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID) &&
				(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET),
		);
	}

	return false;
}

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const callbackUrl = url.searchParams.get("callbackUrl");

	if (callbackUrl?.startsWith("/")) {
		return callbackUrl;
	}

	if (callbackUrl === CHAT_SUCCESS_URL) {
		return callbackUrl;
	}

	if (callbackUrl && ALLOWED_CALLBACK_ORIGINS) {
		try {
			const parsedCallbackUrl = new URL(callbackUrl);
			if (
				ALLOWED_CALLBACK_ORIGINS.has(parsedCallbackUrl.origin) &&
				(parsedCallbackUrl.pathname === "/chat" ||
					parsedCallbackUrl.pathname.startsWith("/chat/"))
			) {
				return callbackUrl;
			}
		} catch {
			// Fall back to the canonical chat URL below.
		}
	}

	return CHAT_SUCCESS_URL;
}

function clearSessionCookies(response: NextResponse) {
	for (const name of AUTH_SESSION_COOKIE_NAMES) {
		for (const suffix of AUTH_COOKIE_CHUNK_SUFFIXES) {
			response.cookies.set(`${name}${suffix}`, "", {
				path: "/",
				maxAge: 0,
			});

			if (AUTH_COOKIE_DOMAIN) {
				response.cookies.set(`${name}${suffix}`, "", {
					path: "/",
					domain: AUTH_COOKIE_DOMAIN,
					maxAge: 0,
				});
			}
		}
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;
	const url = new URL(request.url);

	if (!SUPPORTED_PROVIDERS.has(provider)) {
		return NextResponse.json(
			{ error: "Unsupported provider" },
			{ status: 400 },
		);
	}

	if (!hasProviderConfig(provider)) {
		const url = new URL("/login", request.url);
		url.searchParams.set("error", "ProviderConfig");
		return NextResponse.redirect(url);
	}

	if (url.searchParams.get("fresh") !== "1") {
		url.searchParams.set("fresh", "1");
		const response = NextResponse.redirect(url);
		clearSessionCookies(response);
		return response;
	}

	return await signIn(provider, {
		redirect: true,
		redirectTo: resolveRedirectTo(request),
	});
}
