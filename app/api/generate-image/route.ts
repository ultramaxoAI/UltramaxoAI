import {
	getChatById,
	saveChat,
	saveMessages,
	spendCreditsForUser,
} from "@backend/db/queries";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateTitleFromUserMessage } from "@/app/(chat)/actions";
import type { VisibilityType } from "@/components/visibility-selector";
import { CREDIT_COSTS } from "@/lib/credits";

const MAIA_API_URL = "https://api.maiarouter.ai/v1/images/generations";
const MAIA_API_KEY = (
	process.env.MAIA_API_KEY ||
	process.env.OPENROUTER_API_KEY_1 ||
	""
).trim();
const MAIA_MODEL = "maia/imagen-3.0-generate-002";
const isDevelopment = process.env.NODE_ENV === "development";

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";

type GenerateImageRequestBody = {
	prompt?: string;
	chatId?: string;
	userMessageId?: string;
	assistantMessageId?: string;
	selectedVisibilityType?: VisibilityType;
};

function getMediaTypeFromImageUrl(imageUrl: string) {
	const dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);

	if (dataUrlMatch?.[1]) {
		return dataUrlMatch[1];
	}

	if (imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")) {
		return "image/jpeg";
	}

	if (imageUrl.includes(".webp")) {
		return "image/webp";
	}

	return "image/png";
}

async function persistSuccessfulImageGeneration({
	sessionUser,
	chatId,
	userMessageId,
	assistantMessageId,
	selectedVisibilityType,
	prompt,
	imageUrl,
}: {
	sessionUser: { id?: string };
	chatId?: string;
	userMessageId?: string;
	assistantMessageId?: string;
	selectedVisibilityType?: VisibilityType;
	prompt: string;
	imageUrl: string;
}) {
	if (!chatId || !userMessageId || !assistantMessageId || !sessionUser.id) {
		return null;
	}

	const existingChat = await getChatById({ id: chatId });

	if (existingChat && existingChat.userId !== sessionUser.id) {
		throw new Error("Forbidden chat access");
	}

	if (!existingChat) {
		const title =
			(await generateTitleFromUserMessage({
				message: {
					id: userMessageId,
					role: "user",
					parts: [{ type: "text", text: prompt }],
				},
			})) || prompt.slice(0, 80);

		await saveChat({
			id: chatId,
			userId: sessionUser.id,
			title,
			visibility: selectedVisibilityType ?? "private",
		});
	}

	const assistantParts = [
		{
			type: "file",
			url: imageUrl,
			mediaType: getMediaTypeFromImageUrl(imageUrl),
			filename: `generated-image-${assistantMessageId}.png`,
		},
		{
			type: "text",
			text: "Generated image",
		},
	];

	await saveMessages({
		messages: [
			{
				id: userMessageId,
				chatId,
				role: "user",
				parts: [{ type: "text", text: prompt }],
				attachments: [],
				createdAt: new Date(),
			},
			{
				id: assistantMessageId,
				chatId,
				role: "assistant",
				parts: assistantParts,
				attachments: [],
				createdAt: new Date(),
			},
		],
	});

	return assistantParts;
}

async function createSuccessResponse({
	sessionUser,
	chatId,
	userMessageId,
	assistantMessageId,
	selectedVisibilityType,
	prompt,
	imageUrl,
}: {
	sessionUser: { id?: string };
	chatId?: string;
	userMessageId?: string;
	assistantMessageId?: string;
	selectedVisibilityType?: VisibilityType;
	prompt: string;
	imageUrl: string;
}) {
	const assistantParts = await persistSuccessfulImageGeneration({
		sessionUser,
		chatId,
		userMessageId,
		assistantMessageId,
		selectedVisibilityType,
		prompt,
		imageUrl,
	});

	return NextResponse.json({
		imageUrl,
		assistantMessage:
			assistantParts && assistantMessageId
				? {
						id: assistantMessageId,
						role: "assistant",
						parts: assistantParts,
					}
				: null,
	});
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

		const {
			prompt,
			chatId,
			userMessageId,
			assistantMessageId,
			selectedVisibilityType,
		} = (await request.json()) as GenerateImageRequestBody;

		if (!prompt?.trim()) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		const cleanPrompt = prompt.trim();
		const sessionUser = session.user as { id?: string };
		if (isDevelopment) {
			console.log(`[generate-image] Prompt length: ${cleanPrompt.length}`);
		}

		if (session.user.id) {
			const creditResult = await spendCreditsForUser({
				userId: session.user.id,
				amount: CREDIT_COSTS.imageGeneration,
				reason: "image generation",
				metadata: { promptLength: cleanPrompt.length },
			});

			if (creditResult.error) {
				return NextResponse.json(
					{
						error: `Insufficient credits. Image generation needs ${CREDIT_COSTS.imageGeneration} credits.`,
					},
					{ status: 402 },
				);
			}
		}

		// ============================================================
		// PRIMARY: MAIA Router — maia/imagen-3.0-generate-002
		// ============================================================
		if (MAIA_API_KEY) {
			try {
				if (isDevelopment) {
					console.log("[generate-image] Trying MAIA Imagen 3.0...");
				}
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000);

				const maiaRes = await fetch(MAIA_API_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${MAIA_API_KEY}`,
						"HTTP-Referer": "https://chat.ultramaxo.tech",
						"X-Title": "UltramaxoAI",
					},
					body: JSON.stringify({
						model: MAIA_MODEL,
						prompt: cleanPrompt,
						n: 1,
						size: "1024x1024",
					}),
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				const rawText = await maiaRes.text();
				if (isDevelopment) {
					console.log("[generate-image] MAIA status:", maiaRes.status);
				}

				if (maiaRes.ok) {
					const data = JSON.parse(rawText);
					// OpenAI-compatible format: { data: [{ url, b64_json }] }
					const imgUrl = data?.data?.[0]?.url;
					const b64 = data?.data?.[0]?.b64_json;

					if (b64) {
						return createSuccessResponse({
							sessionUser,
							chatId,
							userMessageId,
							assistantMessageId,
							selectedVisibilityType,
							prompt: cleanPrompt,
							imageUrl: `data:image/png;base64,${b64}`,
						});
					}

					if (imgUrl) {
						// Proxy the URL through the server to bypass COEP
						try {
							const imgRes = await fetch(imgUrl);
							if (imgRes.ok) {
								const buf = Buffer.from(await imgRes.arrayBuffer());
								return createSuccessResponse({
									sessionUser,
									chatId,
									userMessageId,
									assistantMessageId,
									selectedVisibilityType,
									prompt: cleanPrompt,
									imageUrl: `data:image/png;base64,${buf.toString("base64")}`,
								});
							}
						} catch {
							// If proxy fails, return URL directly (might work on non-COEP pages)
							return createSuccessResponse({
								sessionUser,
								chatId,
								userMessageId,
								assistantMessageId,
								selectedVisibilityType,
								prompt: cleanPrompt,
								imageUrl: imgUrl,
							});
						}
					}
				}
				console.warn(
					"[generate-image] MAIA did not return a valid image, falling back to Pollinations.",
				);
			} catch (maiaError) {
				console.warn("[generate-image] MAIA error:", maiaError);
			}
		}

		// ============================================================
		// FALLBACK: Pollinations AI (flux model, uncensored)
		// ============================================================
		if (isDevelopment) {
			console.log("[generate-image] Using Pollinations fallback...");
		}
		const sanitizedPrompt = encodeURIComponent(
			`${cleanPrompt} detailed, masterpiece, high quality, 8k resolution`,
		);
		const seed = Math.floor(Math.random() * 1000000);
		const pollinationsUrl = `${POLLINATIONS_URL}${sanitizedPrompt}?width=1024&height=1024&nofeed=yes&nologo=yes&seed=${seed}&model=flux`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 25000);
			const pollRes = await fetch(pollinationsUrl, {
				method: "GET",
				headers: { Accept: "image/*" },
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			if (pollRes.ok) {
				const buf = Buffer.from(await pollRes.arrayBuffer());
				return createSuccessResponse({
					sessionUser,
					chatId,
					userMessageId,
					assistantMessageId,
					selectedVisibilityType,
					prompt: cleanPrompt,
					imageUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
				});
			}
		} catch (pollError) {
			console.error("[generate-image] Pollinations fallback error:", pollError);
		}

		return NextResponse.json(
			{
				error:
					"All image generation backends are currently unavailable. Please try again.",
			},
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
