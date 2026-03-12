import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_URL = "https://api.maiarouter.ai/v1/images/generations";
const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
const MAIA_MODEL = "maia/imagen-3.0-generate-002";

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

		const cleanPrompt = prompt.trim();
		console.log(`[generate-image] Prompt: "${cleanPrompt.slice(0, 80)}..."`);

		// ============================================================
		// PRIMARY: MAIA Router — maia/imagen-3.0-generate-002
		// ============================================================
		if (MAIA_API_KEY) {
			try {
				console.log("[generate-image] Trying MAIA Imagen 3.0...");
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000);

				const maiaRes = await fetch(MAIA_API_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${MAIA_API_KEY}`,
						"HTTP-Referer": "https://chat.ultramaxo.tech",
						"X-Title": "UltramaxoAI",
					},
					body: JSON.stringify({
						model: MAIA_MODEL,
						messages: [{ role: "user", content: cleanPrompt }],
					}),
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				const rawText = await maiaRes.text();
				console.log("[generate-image] MAIA status:", maiaRes.status);
				console.log("[generate-image] MAIA response preview:", rawText.slice(0, 500));

				if (maiaRes.ok) {
					const data = JSON.parse(rawText);
					// OpenAI-compatible format: { data: [{ url, b64_json }] }
					const imgUrl = data?.data?.[0]?.url;
					const b64 = data?.data?.[0]?.b64_json;

					if (b64) {
						return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
					}

					if (imgUrl) {
						// Proxy the URL through the server to bypass COEP
						try {
							const imgRes = await fetch(imgUrl);
							if (imgRes.ok) {
								const buf = Buffer.from(await imgRes.arrayBuffer());
								return NextResponse.json({ imageUrl: `data:image/png;base64,${buf.toString("base64")}` });
							}
						} catch {
							// If proxy fails, return URL directly (might work on non-COEP pages)
							return NextResponse.json({ imageUrl: imgUrl });
						}
					}
				}
				console.warn("[generate-image] MAIA did not return a valid image, falling back to Pollinations.");
			} catch (maiaError) {
				console.warn("[generate-image] MAIA error:", maiaError);
			}
		}

		// ============================================================
		// FALLBACK: Pollinations AI (flux model, uncensored)
		// ============================================================
		console.log("[generate-image] Using Pollinations fallback...");
		const sanitizedPrompt = encodeURIComponent(cleanPrompt + " detailed, masterpiece, high quality, 8k resolution");
		const seed = Math.floor(Math.random() * 1000000);
		const pollinationsUrl = `${POLLINATIONS_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}&model=flux`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 25000);
			const pollRes = await fetch(pollinationsUrl, {
				method: "GET",
				headers: { "Accept": "image/*" },
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			if (pollRes.ok) {
				const buf = Buffer.from(await pollRes.arrayBuffer());
				return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${buf.toString("base64")}` });
			}
		} catch (pollError) {
			console.error("[generate-image] Pollinations fallback error:", pollError);
		}

		return NextResponse.json(
			{ error: "All image generation backends are currently unavailable. Please try again." },
			{ status: 502 },
		);
	} catch (error) {
		console.error("[generate-image] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
