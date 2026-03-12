import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
// Use OpenRouter Flux for fast, uncensored, high-quality images
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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
				{ error: "Image generation not configured" },
				{ status: 500 },
			);
		}

		console.log("[generate-image] Calling OpenRouter Flux...");

		// Call OpenRouter with an image generation model like pollinations/any-image-generator
		// This model returns an image URL in the content when prompted
		const response = await fetch(OPENROUTER_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${MAIA_API_KEY}`,
				"HTTP-Referer": "https://ultramaxo.tech",
				"X-Title": "Ultramaxo AI",
			},
			body: JSON.stringify({
				model: "pollinations/any-image-generator",
				messages: [
					{
						role: "user",
						content: prompt.trim(),
					},
				],
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

		// pollinations/any-image-generator returns the Markdown image link in content: ![Image](url)
		const contentResponse = data?.choices?.[0]?.message?.content || "";
		
		// Extract URL from markdown `![...](https://...)`
		const urlMatch = contentResponse.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
		
		let finalUrl = "";
		if (urlMatch && urlMatch[1]) {
			finalUrl = urlMatch[1];
		} else if (contentResponse.startsWith("http")) {
			// In case it just returns the raw URL
			finalUrl = contentResponse.trim();
		}

		if (finalUrl) {
			return NextResponse.json({ imageUrl: finalUrl });
		}

		console.error(
			"[generate-image] Unexpected response shape:",
			contentResponse.slice(0, 500),
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
