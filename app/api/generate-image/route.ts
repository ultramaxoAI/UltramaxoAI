import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
const MAIA_IMAGE_URL = "https://api.maiarouter.ai/v1/images/generations";
const MODEL_NAME = "maia/imagen-3.0-generate-002";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2500; // 2.5 second delay between retries

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callMaiaImageAPI(prompt: string): Promise<{ imageUrl?: string; error?: string; status?: number }> {
	const response = await fetch(MAIA_IMAGE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${MAIA_API_KEY}`,
			"HTTP-Referer": "https://ultramaxo.tech",
			"X-Title": "Ultramaxo AI",
		},
		body: JSON.stringify({
			model: MODEL_NAME,
			prompt: prompt,
			n: 1,
			size: "1024x1024",
		}),
	});

	const rawText = await response.text();
	console.log("[generate-image] MAIA status:", response.status);
	console.log("[generate-image] MAIA raw response:", rawText.slice(0, 800));

	if (!response.ok) {
		return { error: `MAIA returned ${response.status}: ${rawText.slice(0, 200)}`, status: response.status };
	}

	let data: any;
	try {
		data = JSON.parse(rawText);
	} catch {
		return { error: "Invalid JSON from MAIA" };
	}

	// OpenAI format: { data: [{ url, b64_json }] }
	const urlImg = data?.data?.[0]?.url;
	const b64Img = data?.data?.[0]?.b64_json;

	if (urlImg) {
		return { imageUrl: urlImg };
	}
	if (b64Img) {
		return { imageUrl: `data:image/png;base64,${b64Img}` };
	}

	return { error: `Unexpected shape: ${rawText.slice(0, 300)}` };
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userType = (session.user as { type?: string }).type;
		const userRole = (session.user as { role?: string }).role;
		const hasPro = userType === "pro" || userRole === "admin";

		if (!hasPro) {
			return NextResponse.json(
				{ error: "Image generation is a PRO feature. Upgrade to access." },
				{ status: 403 },
			);
		}

		const { prompt } = await request.json();

		if (!prompt?.trim()) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		if (!MAIA_API_KEY) {
			return NextResponse.json(
				{ error: "API Key not configured" },
				{ status: 500 },
			);
		}

		console.log(`[generate-image] Request: "${prompt.trim().slice(0, 80)}..."`);

		// Retry loop: handles rate-limiting (429) and transient errors
		let lastError = "";
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if (attempt > 0) {
				console.log(`[generate-image] Retry #${attempt} after ${RETRY_DELAY_MS}ms...`);
				await sleep(RETRY_DELAY_MS);
			}

			const result = await callMaiaImageAPI(prompt.trim());

			if (result.imageUrl) {
				console.log("[generate-image] Success on attempt", attempt + 1);
				return NextResponse.json({ imageUrl: result.imageUrl });
			}

			lastError = result.error || "Unknown error";
			console.warn(`[generate-image] Attempt ${attempt + 1} failed:`, lastError);

			// Only retry on rate-limit (429) or server errors (5xx)
			if (result.status && result.status < 429 && result.status !== 500 && result.status !== 502 && result.status !== 503) {
				break; // Don't retry on 4xx client errors (except 429)
			}
		}

		console.error("[generate-image] All attempts failed:", lastError);
		return NextResponse.json(
			{ error: "Failed to generate image. Please try again." },
			{ status: 500 },
		);
	} catch (error) {
		console.error("[generate-image] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
