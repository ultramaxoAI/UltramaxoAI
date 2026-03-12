import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const OPENROUTER_URL = "https://image.pollinations.ai/prompt/";

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

		console.log("[generate-image] Calling Pollinations AI...");

		// Clean prompt for URL injection
		const sanitizedPrompt = encodeURIComponent(prompt.trim() + " detailed, masterpiece, high quality, 8k resolution, best quality");
		
		// Optional: add a seed parameter for uniqueness, e.g., ?seed=123
		const seed = Math.floor(Math.random() * 100000);
		const finalUrl = `${OPENROUTER_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}`;

		return NextResponse.json({ imageUrl: finalUrl });
	} catch (error) {
		console.error("[generate-image] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
