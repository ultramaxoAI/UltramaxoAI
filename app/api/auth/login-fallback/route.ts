import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const CHAT_SUCCESS_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const redirectTo = url.searchParams.get("redirectTo");

	if (redirectTo?.startsWith("/")) {
		return redirectTo;
	}

	if (redirectTo === CHAT_SUCCESS_URL) {
		return redirectTo;
	}

	return CHAT_SUCCESS_URL;
}

function isNextRedirectError(
	error: unknown,
): error is Error & { digest: string } {
	return (
		error instanceof Error &&
		"digest" in error &&
		typeof (error as { digest?: unknown }).digest === "string" &&
		(error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
	);
}

function toAbsoluteRedirectUrl(request: Request, redirectTo: string) {
	return new URL(redirectTo, request.url);
}

async function handleCredentialsSignIn({
	request,
	username,
	password,
}: {
	request: Request;
	username: string;
	password: string;
}) {
	if (!username || !password) {
		return NextResponse.redirect(
			new URL("/login?error=MissingCredentials", request.url),
			303,
		);
	}

	try {
		const result = await signIn("credentials", {
			username,
			password,
			redirect: false,
			redirectTo: resolveRedirectTo(request),
		});

		if (result?.error) {
			const errorParam =
				result.error === "unverified"
					? "Unverified"
					: result.error === "OAuthAccountNotLinked" ||
							result.error === "OAuthCallback" ||
							result.error === "Configuration"
						? "CredentialsSignin"
						: result.error;
			const loginUrl = new URL("/login", request.url);
			loginUrl.searchParams.set("error", errorParam);
			return NextResponse.redirect(loginUrl, 303);
		}

		return NextResponse.redirect(
			toAbsoluteRedirectUrl(request, result?.url ?? resolveRedirectTo(request)),
			303,
		);
	} catch (error) {
		if (isNextRedirectError(error)) {
			return NextResponse.redirect(
				toAbsoluteRedirectUrl(request, resolveRedirectTo(request)),
				303,
			);
		}

		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("error", "CredentialsSignin");
		return NextResponse.redirect(loginUrl, 303);
	}
}

export async function GET() {
	return NextResponse.json(
		{ error: "Method not allowed" },
		{
			status: 405,
			headers: { Allow: "POST" },
		},
	);
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const username = String(formData.get("username") ?? "").trim();
	const password = String(formData.get("password") ?? "");

	return handleCredentialsSignIn({
		request,
		username,
		password,
	});
}
