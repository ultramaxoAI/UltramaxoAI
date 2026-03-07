import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const callbackUrl = url.searchParams.get("callbackUrl");

	if (callbackUrl?.startsWith("/")) {
		return callbackUrl;
	}

	return "/chat";
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