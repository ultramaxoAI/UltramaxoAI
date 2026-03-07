import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);
const CHAT_SUCCESS_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const callbackUrl = url.searchParams.get("callbackUrl");

	if (callbackUrl?.startsWith("/")) {
		return callbackUrl;
	}

	if (callbackUrl === CHAT_SUCCESS_URL) {
		return callbackUrl;
	}

	return CHAT_SUCCESS_URL;
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;

	if (!SUPPORTED_PROVIDERS.has(provider)) {
		return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
	}

	return signIn(provider, {
		redirect: true,
		redirectTo: resolveRedirectTo(request),
	});
}