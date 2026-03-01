import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

const PROVIDER_TEST_URLS: Record<
	string,
	{ url: string; headers: (key: string) => Record<string, string> }
> = {
	gemini: {
		url: "https://generativelanguage.googleapis.com/v1beta/models",
		headers: (key) => ({ "x-goog-api-key": key }),
	},
	openrouter: {
		url: "https://openrouter.ai/api/v1/models",
		headers: (key) => ({ Authorization: `Bearer ${key}` }),
	},
	groq: {
		url: "https://api.groq.com/openai/v1/models",
		headers: (key) => ({ Authorization: `Bearer ${key}` }),
	},
	maia: {
		url: "https://api.maiarouter.ai/v1/models",
		headers: (key) => ({ Authorization: `Bearer ${key}` }),
	},
	openai: {
		url: "https://api.openai.com/v1/models",
		headers: (key) => ({ Authorization: `Bearer ${key}` }),
	},
	anthropic: {
		url: "https://api.anthropic.com/v1/models",
		headers: (key) => ({
			"x-api-key": key,
			"anthropic-version": "2023-06-01",
		}),
	},
};

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { provider, key } = await request.json();

		if (!provider || !key) {
			return NextResponse.json(
				{ error: "Provider and key are required" },
				{ status: 400 },
			);
		}

		const config = PROVIDER_TEST_URLS[provider];
		if (!config) {
			return NextResponse.json(
				{ error: `Unknown provider: ${provider}` },
				{ status: 400 },
			);
		}

		const response = await fetch(config.url, {
			headers: config.headers(key),
		});

		if (response.ok) {
			return NextResponse.json({ success: true, message: "API key is valid!" });
		}

		const errorText = await response.text().catch(() => "Unknown error");
		return NextResponse.json(
			{
				success: false,
				message: `API key invalid (${response.status}): ${errorText.substring(0, 200)}`,
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error("API Error (api-keys/test):", error);
		return NextResponse.json(
			{ error: "Failed to test connection" },
			{ status: 500 },
		);
	}
}
