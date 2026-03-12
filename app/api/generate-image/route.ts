import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
const MAIA_IMAGE_URL = "https://api.maiarouter.ai/v1/images/generations";
const MODEL_NAME = "maia/imagen-3.0-generate-002"; // Requested by user based on Notion docs

export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// PRO-only feature check
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

		console.log(`[generate-image] Calling MAIA Router (${MODEL_NAME})...`);

		// Standard OpenAI-compatible image generation request
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
				prompt: prompt.trim(),
				n: 1,
				size: "1024x1024"
			}),
		});

		const rawText = await response.text();
		console.log("[generate-image] status:", response.status);

		if (!response.ok) {
			return NextResponse.json(
				{ error: `Generator error (${response.status}). Please try again.` },
				{ status: 500 },
			);
		}

		let data: any;
		try {
			data = JSON.parse(rawText);
		} catch {
			return NextResponse.json(
				{ error: "Invalid response from generator" },
				{ status: 500 },
			);
		}

		// OpenAI format returns { data: [{ url: "...", b64_json: "..." }] }
		const urlImg = data?.data?.[0]?.url;
		const b64Img = data?.data?.[0]?.b64_json;
		
		let finalUrl = "";
		if (urlImg) {
			finalUrl = urlImg;
		} else if (b64Img) {
			finalUrl = `data:image/png;base64,${b64Img}`;
		}

		if (finalUrl) {
			return NextResponse.json({ imageUrl: finalUrl });
		}

		console.error(
			"[generate-image] Unexpected response shape:",
			rawText.slice(0, 500),
		);
		return NextResponse.json(
			{ error: "No image returned from generator" },
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
