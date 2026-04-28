import {
	db,
	ensureApiCreditAccountForUser,
	spendApiCredits,
} from "@backend/db/queries";
import { platformApiKey } from "@backend/db/schema";
import { getModelCatalogById } from "@backend/models/model-catalog";
import { checkRateLimit } from "@backend/rateLimiter";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { calculateCostCents, estimateTokens } from "@/lib/api-billing";

const MIN_BALANCE_CENTS = 200;
const FREE_RPM_LIMIT = 5;
const PAID_RPM_LIMIT = 60;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
	try {
		const authHeader = req.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: { message: "Missing or invalid Authorization header" } },
				{ status: 401 },
			);
		}

		const apiKey = authHeader.split(" ")[1];

		if (!apiKey.startsWith("ux_sk_")) {
			return NextResponse.json(
				{
					error: {
						message:
							"Invalid API Key format. Generate one at ultramaxo.tech/plan",
					},
				},
				{ status: 401 },
			);
		}

		// 1. Validate API Key in Neon DB
		const [keyRecord] = await db
			.select()
			.from(platformApiKey)
			.where(eq(platformApiKey.key, apiKey));

		if (!keyRecord || keyRecord.status !== "active") {
			return NextResponse.json(
				{ error: { message: "Invalid or revoked API Key." } },
				{ status: 401 },
			);
		}

		// 2. Parse Request Body
		const body = await req.json();
		const requestedModel = body.model;

		if (!requestedModel) {
			return NextResponse.json(
				{ error: { message: "Model parameter is required." } },
				{ status: 400 },
			);
		}

		const modelInfo = await getModelCatalogById(requestedModel);
		if (!modelInfo) {
			return NextResponse.json(
				{ error: { message: "Model not supported." } },
				{ status: 400 },
			);
		}

		const isFreeModel = modelInfo.isFree;
		let userAccount = null;

		// 3. Billing Logic for Paid Models
		if (!isFreeModel) {
			userAccount = await ensureApiCreditAccountForUser({
				userId: keyRecord.userId,
			});
			if (userAccount.balanceCents < MIN_BALANCE_CENTS) {
				return NextResponse.json(
					{
						error: {
							message:
								"Minimum balance of USD 2 is required to use paid models.",
						},
					},
					{ status: 402 },
				);
			}
		}

		const rateLimitKey = `api:${apiKey}:rpm`;
		const limit = isFreeModel ? FREE_RPM_LIMIT : PAID_RPM_LIMIT;
		const rate = checkRateLimit(rateLimitKey, limit, WINDOW_MS);
		if (!rate.allowed) {
			return NextResponse.json(
				{ error: { message: "Rate limit exceeded." } },
				{ status: 429 },
			);
		}

		// Update Last Used
		await db
			.update(platformApiKey)
			.set({ lastUsedAt: new Date() })
			.where(eq(platformApiKey.id, keyRecord.id));

		// 4. Proxy to SwiftRouter
		const SWIFTROUTER_API_KEY = process.env.SWIFTROUTER_API_KEY;
		if (!SWIFTROUTER_API_KEY) {
			return NextResponse.json(
				{ error: { message: "Missing upstream API key." } },
				{ status: 500 },
			);
		}

		const swiftResponse = await fetch(
			"https://api.swiftrouter.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${SWIFTROUTER_API_KEY}`,
				},
				body: JSON.stringify(body),
			},
		);

		if (!swiftResponse.ok) {
			const errorData = await swiftResponse.text();
			return NextResponse.json(
				{ error: { message: "Upstream provider error.", details: errorData } },
				{ status: swiftResponse.status },
			);
		}

		// 5. Handle Response & Deduct Credits
		if (body.stream) {
			const stream = swiftResponse.body;
			if (!stream) throw new Error("No response body from upstream");

			let buffer = "";
			let usage: { prompt_tokens?: number; completion_tokens?: number } | null =
				null;
			let outputText = "";

			const transformStream = new TransformStream({
				async transform(chunk, controller) {
					controller.enqueue(chunk);
					const text = new TextDecoder().decode(chunk);
					buffer += text;

					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (!line.startsWith("data:")) continue;
						const payload = line.replace("data:", "").trim();
						if (payload === "[DONE]") continue;
						try {
							const parsed = JSON.parse(payload);
							if (parsed?.usage) {
								usage = parsed.usage;
							}
							const delta = parsed?.choices?.[0]?.delta?.content;
							if (typeof delta === "string") {
								outputText += delta;
							}
						} catch {}
					}
				},
				async flush() {
					try {
						if (!isFreeModel && userAccount) {
							const promptTokens =
								usage?.prompt_tokens ??
								estimateTokens(JSON.stringify(body.messages ?? []));
							const completionTokens =
								usage?.completion_tokens ?? estimateTokens(outputText);

							let costCents = calculateCostCents({
								priceIn: modelInfo.priceIn ? Number(modelInfo.priceIn) : null,
								priceOut: modelInfo.priceOut
									? Number(modelInfo.priceOut)
									: null,
								promptTokens,
								completionTokens,
							});

							if (costCents > userAccount.balanceCents) {
								costCents = userAccount.balanceCents;
							}

							if (costCents > 0) {
								await spendApiCredits({
									userId: userAccount.userId,
									amountCents: costCents,
									reason: `API stream usage for ${requestedModel}`,
									metadata: {
										model: requestedModel,
										promptTokens,
										completionTokens,
										stream: true,
									},
								});
							}
						}
					} catch (error) {
						console.error("Stream billing error:", error);
					}
				},
			});

			return new NextResponse(stream.pipeThrough(transformStream), {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		const data = await swiftResponse.json();

		if (!isFreeModel && userAccount) {
			const promptTokens = data.usage?.prompt_tokens ?? 0;
			const completionTokens = data.usage?.completion_tokens ?? 0;
			let costCents = calculateCostCents({
				priceIn: modelInfo.priceIn ? Number(modelInfo.priceIn) : null,
				priceOut: modelInfo.priceOut ? Number(modelInfo.priceOut) : null,
				promptTokens,
				completionTokens,
			});

			if (costCents > userAccount.balanceCents) {
				costCents = userAccount.balanceCents;
			}

			if (costCents > 0) {
				await spendApiCredits({
					userId: userAccount.userId,
					amountCents: costCents,
					reason: `API usage for ${requestedModel}`,
					metadata: {
						promptTokens,
						completionTokens,
						model: requestedModel,
					},
				});
			}
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Proxy Error:", error);
		return NextResponse.json(
			{ error: { message: "Internal server error" } },
			{ status: 500 },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
