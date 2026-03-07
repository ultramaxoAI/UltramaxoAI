import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);

function buildOAuthCompletionUrl(requestUrl: URL, callbackUrl: string) {
	const completionUrl = new URL("/oauth/complete", requestUrl.origin);
	completionUrl.searchParams.set("target", callbackUrl);
	return completionUrl.toString();
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;

	if (!SUPPORTED_PROVIDERS.has(provider)) {
		return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
	}

	const url = new URL(request.url);
	const callbackUrl =
		url.searchParams.get("callbackUrl") ||
		(process.env.NODE_ENV === "production"
			? "https://chat.ultramaxo.tech/chat"
			: "/chat");

	return signIn(provider, {
		redirect: true,
		redirectTo: buildOAuthCompletionUrl(url, callbackUrl),
	});
}