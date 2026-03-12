import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";

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

		console.log(`[generate-image] Request Uncensored: "${prompt.trim().slice(0, 80)}..."`);

		// Clean prompt for URL injection
		const sanitizedPrompt = encodeURIComponent(prompt.trim() + " detailed, masterpiece, high quality, 8k resolution, best quality");
		
		const seed = Math.floor(Math.random() * 1000000);
		// Force the uncensored 'flux' model from pollinations
		const finalUrl = `${POLLINATIONS_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}&model=flux`;

		console.log(`[generate-image] Fetching from Pollinations to bypass CORS COEP issue...`);
		// Fetch the image on the server-side to bypass Strict browser COEP / CSP policies
		const imageReq = await fetch(finalUrl, { 
			method: "GET",
			headers: { "Accept": "image/jpeg" }
		});

		if (!imageReq.ok) {
			return NextResponse.json(
				{ error: "Image generation backend failure." },
				{ status: 500 }
			);
		}

		const arrayBuffer = await imageReq.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Str = buffer.toString('base64');
		
		const base64Url = `data:image/jpeg;base64,${base64Str}`;

		return NextResponse.json({ imageUrl: base64Url });
		
	} catch (error) {
		console.error("[generate-image] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
