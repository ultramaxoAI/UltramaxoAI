import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);

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
		redirectTo: callbackUrl,
	});
}