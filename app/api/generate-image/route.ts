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

		const sanitizedPrompt = encodeURIComponent(prompt.trim() + " detailed, masterpiece, high quality, 8k resolution, best quality");
		const seed = Math.floor(Math.random() * 1000000);
		
		// Priority 1: flux (Best quality, highly uncensored)
		const fluxUrl = `${POLLINATIONS_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}&model=flux`;
		// Priority 2: turbo (Fast fallback, robust)
		const turboUrl = `${POLLINATIONS_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}&model=turbo`;

		const tryFetchImage = async (url: string, timeoutMs: number) => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			try {
				const response = await fetch(url, { 
					method: "GET",
					headers: { "Accept": "image/jpeg" },
					signal: controller.signal
				});
				clearTimeout(timeoutId);
				return response;
			} catch (e) {
				clearTimeout(timeoutId);
				throw e;
			}
		};

		let imageReq;
		try {
			console.log(`[generate-image] Attempting primary model (flux)...`);
			imageReq = await tryFetchImage(fluxUrl, 25000); // 25s timeout
		} catch (error) {
			console.warn(`[generate-image] Flux failed or timed out, trying turbo fallback:`, error);
		}

		if (!imageReq || !imageReq.ok) {
			console.log(`[generate-image] Attempting fallback model (turbo)...`);
			try {
				imageReq = await tryFetchImage(turboUrl, 20000);
			} catch (fallbackError) {
				console.error(`[generate-image] Fallback also failed:`, fallbackError);
			}
		}

		if (!imageReq || !imageReq.ok) {
			return NextResponse.json(
				{ error: "Image generation backend failure. Both models are currently busy." },
				{ status: 502 }
			);
		}

		const arrayBuffer = await imageReq.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Url = `data:image/jpeg;base64,${buffer.toString('base64')}`;

		return NextResponse.json({ imageUrl: base64Url });
		
	} catch (error) {
		console.error("[generate-image] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
