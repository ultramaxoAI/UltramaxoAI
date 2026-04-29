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

// Security: Max body size (256KB)
const MAX_BODY_SIZE = 256 * 1024;
// Security: Max messages array length
const MAX_MESSAGES = 128;
// Security: Max single message content length (64KB)
const MAX_MESSAGE_LENGTH = 64 * 1024;

const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Cache-Control": "no-store, no-cache, must-revalidate",
};

// Security: Validate and sanitize request body
function validateBody(body: any): { valid: boolean; error?: string } {
	if (!body || typeof body !== "object") {
		return { valid: false, error: "Invalid request body" };
	}

	if (typeof body.model !== "string" || body.model.length === 0) {
		return { valid: false, error: "Model parameter is required" };
	}

	if (body.model.length > 128) {
		return { valid: false, error: "Model ID too long" };
	}

	// Validate model ID format (alphanumeric, dots, hyphens)
	if (!/^[a-zA-Z0-9._-]+$/.test(body.model)) {
		return { valid: false, error: "Invalid model ID format" };
	}

	if (!Array.isArray(body.messages) || body.messages.length === 0) {
		return { valid: false, error: "Messages array is required" };
	}

	if (body.messages.length > MAX_MESSAGES) {
		return {
			valid: false,
			error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.`,
		};
	}

	// Validate each message
	for (const msg of body.messages) {
		if (!msg || typeof msg !== "object") {
			return { valid: false, error: "Invalid message format" };
		}
		if (!["system", "user", "assistant", "tool", "function"].includes(msg.role)) {
			return { valid: false, error: `Invalid message role: ${msg.role}` };
		}
		if (typeof msg.content === "string" && msg.content.length > MAX_MESSAGE_LENGTH) {
			return {
				valid: false,
				error: `Message content too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
			};
		}
	}

	// Validate optional parameters
	if (body.temperature !== undefined) {
		const temp = Number(body.temperature);
		if (Number.isNaN(temp) || temp < 0 || temp > 2) {
			return { valid: false, error: "Temperature must be between 0 and 2" };
		}
	}

	if (body.max_tokens !== undefined) {
		const mt = Number(body.max_tokens);
		if (!Number.isInteger(mt) || mt < 1 || mt > 1_000_000) {
			return { valid: false, error: "max_tokens must be integer between 1 and 1,000,000" };
		}
	}

	if (body.top_p !== undefined) {
		const tp = Number(body.top_p);
		if (Number.isNaN(tp) || tp < 0 || tp > 1) {
			return { valid: false, error: "top_p must be between 0 and 1" };
		}
	}

	return { valid: true };
}

export async function POST(req: NextRequest) {
	try {
		// Security: Check Content-Type
		const contentType = req.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			return NextResponse.json(
				{ error: { message: "Content-Type must be application/json" } },
				{ status: 415, headers: SECURITY_HEADERS },
			);
		}

		// Security: Check body size
		const contentLength = req.headers.get("content-length");
		if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
			return NextResponse.json(
				{ error: { message: "Request body too large. Maximum 256KB." } },
				{ status: 413, headers: SECURITY_HEADERS },
			);
		}

		// Security: Validate Authorization header
		const authHeader = req.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: { message: "Missing or invalid Authorization header" } },
				{ status: 401, headers: SECURITY_HEADERS },
			);
		}

		const apiKey = authHeader.split(" ")[1];

		// Security: Validate API key format
		if (!apiKey || !apiKey.startsWith("ux_sk_") || apiKey.length < 20) {
			return NextResponse.json(
				{
					error: {
						message: "Invalid API key format.",
					},
				},
				{ status: 401, headers: SECURITY_HEADERS },
			);
		}

		// Security: Validate API Key in DB
		const [keyRecord] = await db
			.select()
			.from(platformApiKey)
			.where(eq(platformApiKey.key, apiKey));

		if (!keyRecord || keyRecord.status !== "active") {
			return NextResponse.json(
				{ error: { message: "Invalid or revoked API key." } },
				{ status: 401, headers: SECURITY_HEADERS },
			);
		}

		// Parse and validate request body
		let body: any;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ error: { message: "Invalid JSON in request body" } },
				{ status: 400, headers: SECURITY_HEADERS },
			);
		}

		const validation = validateBody(body);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: { message: validation.error } },
				{ status: 400, headers: SECURITY_HEADERS },
			);
		}

		const requestedModel = body.model;
		const modelInfo = await getModelCatalogById(requestedModel);
		if (!modelInfo) {
			return NextResponse.json(
				{ error: { message: "Model not supported." } },
				{ status: 400, headers: SECURITY_HEADERS },
			);
		}

		const isFreeModel = modelInfo.isFree;
		let userAccount = null;

		// Billing check for paid models
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
					{ status: 402, headers: SECURITY_HEADERS },
				);
			}
		}

		// Rate limiting
		const rateLimitKey = `api:${keyRecord.id}:rpm`;
		const limit = isFreeModel ? FREE_RPM_LIMIT : PAID_RPM_LIMIT;
		const rate = checkRateLimit(rateLimitKey, limit, WINDOW_MS);
		if (!rate.allowed) {
			return NextResponse.json(
				{
					error: {
						message: "Rate limit exceeded. Try again later.",
						retryAfter: Math.ceil(WINDOW_MS / 1000),
					},
				},
				{
					status: 429,
					headers: {
						...SECURITY_HEADERS,
						"Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
					},
				},
			);
		}

		// Update last used
		db.update(platformApiKey)
			.set({ lastUsedAt: new Date() })
			.where(eq(platformApiKey.id, keyRecord.id))
			.catch(() => {});

		// Proxy to SwiftRouter
		const SWIFTROUTER_API_KEY = process.env.SWIFTROUTER_API_KEY;
		if (!SWIFTROUTER_API_KEY) {
			return NextResponse.json(
				{ error: { message: "Service temporarily unavailable." } },
				{ status: 503, headers: SECURITY_HEADERS },
			);
		}

		// Security: Strip any sensitive fields before forwarding
		const sanitizedBody = {
			model: body.model,
			messages: body.messages,
			...(body.stream !== undefined && { stream: Boolean(body.stream) }),
			...(body.temperature !== undefined && { temperature: Number(body.temperature) }),
			...(body.max_tokens !== undefined && { max_tokens: Number(body.max_tokens) }),
			...(body.top_p !== undefined && { top_p: Number(body.top_p) }),
			...(body.stream_options && { stream_options: body.stream_options }),
		};

		const swiftResponse = await fetch(
			"https://api.swiftrouter.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${SWIFTROUTER_API_KEY}`,
				},
				body: JSON.stringify(sanitizedBody),
			},
		);

		if (!swiftResponse.ok) {
			const errorText = await swiftResponse.text();
			// Security: Don't expose upstream error details
			console.error("[API] Upstream error:", errorText.slice(0, 500));
			return NextResponse.json(
				{ error: { message: "Upstream provider error." } },
				{ status: swiftResponse.status, headers: SECURITY_HEADERS },
			);
		}

		// Handle streaming
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
					"Cache-Control": "no-cache, no-store",
					Connection: "keep-alive",
					"X-Content-Type-Options": "nosniff",
				},
			});
		}

		// Non-streaming response
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

		return NextResponse.json(data, { headers: SECURITY_HEADERS });
	} catch (error) {
		console.error("Proxy Error:", error);
		return NextResponse.json(
			{ error: { message: "Internal server error" } },
			{ status: 500, headers: SECURITY_HEADERS },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Max-Age": "86400",
		},
	});
}
