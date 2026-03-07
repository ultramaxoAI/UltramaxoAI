import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const redirectTo = url.searchParams.get("redirectTo");

	if (redirectTo?.startsWith("/")) {
		return redirectTo;
	}

	return "/chat";
}

function isNextRedirectError(error: unknown): error is Error & { digest: string } {
	return (
		error instanceof Error &&
		"digest" in error &&
		typeof (error as { digest?: unknown }).digest === "string" &&
		(error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
	);
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
		return NextResponse.redirect(new URL("/login?error=MissingCredentials", request.url));
	}

	try {
		return await signIn("credentials", {
			username,
			password,
			redirect: true,
			redirectTo: resolveRedirectTo(request),
		});
	} catch (error) {
		if (isNextRedirectError(error)) {
			throw error;
		}

		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("error", "CredentialsSignin");
		return NextResponse.redirect(loginUrl);
	}
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const username = String(url.searchParams.get("username") ?? "").trim();
	const password = String(url.searchParams.get("password") ?? "");

	return handleCredentialsSignIn({
		request,
		username,
		password,
	});
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