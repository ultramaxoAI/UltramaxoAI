import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";

import { getLanguageModel } from "@/lib/ai/providers";
import { webSearch } from "@/lib/ai/tools/web-search";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  expireProIfNeeded,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { getWeather } from "../../../../lib/ai/tools/get-weather";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  console.log("[Chat API] POST request received");
  try {
    let requestBody: PostRequestBody;

    // Check if any OpenRouter key is configured
    const hasOpenRouterApiKey = Boolean(
      process.env.OPENROUTER_API_KEY_1 ||
        process.env.OPENROUTER_API_KEY_2 ||
        process.env.OPENROUTER_API_KEY_3
    );

    if (!hasOpenRouterApiKey) {
      console.error("=== CONFIGURATION ERROR ===");
      console.error("No OpenRouter API key found in environment variables");
      console.error("Please set OPENROUTER_API_KEY_1/2/3 in your deployment");
      console.error("=== END CONFIGURATION ERROR ===");

      return new Response(
        JSON.stringify({
          error: "AI service not configured. Please contact administrator.",
          code: "missing_api_key",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const json = await request.json();
      requestBody = postRequestBodySchema.parse(json);
    } catch (_) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    try {
      const {
        id,
        message,
        messages,
        selectedChatModel,
        selectedVisibilityType,
        wormgptEnabled,
        deepThinkingEnabled,
        webSearchEnabled,
      } = requestBody;

      const session = await auth();

      if (!session?.user) {
        return new ChatSDKError("unauthorized:chat").toResponse();
      }

      // Per-account rate limiting: 10 chat requests per minute per user
      const clientIp = getClientIp(request);
      const userKey = `user:${session.user.id}:chat`;
      const ipKey = `ip:${clientIp}:chat`;

      const userRate = checkRateLimit(userKey, 10, 60_000); // 10 requests per minute
      const ipRate = checkRateLimit(ipKey, 30, 60_000);

      if (!userRate.allowed || !ipRate.allowed) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      await expireProIfNeeded(session.user.id);
      // userType checking done via DB and session role

      // No daily message limit - users can chat unlimited in conversations
      // Only rate limited by requests per minute (10/min)

      const isToolApprovalFlow = Boolean(messages);

      const chat = await getChatById({ id });
      let messagesFromDb: DBMessage[] = [];
      let titlePromise: Promise<string> | null = null;

      if (chat) {
        if (chat.userId !== session.user.id) {
          return new ChatSDKError("forbidden:chat").toResponse();
        }
        if (!isToolApprovalFlow) {
          messagesFromDb = await getMessagesByChatId({ id });
        }
      } else if (message?.role === "user") {
        await saveChat({
          id,
          userId: session.user.id,
          title: "New chat",
          visibility: selectedVisibilityType,
        });
        titlePromise = generateTitleFromUserMessage({ message });
      }

      const uiMessages = isToolApprovalFlow
        ? (messages as ChatMessage[])
        : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

      const { longitude, latitude, city, country } = geolocation(request);

      const requestHints: RequestHints = {
        longitude,
        latitude,
        city,
        country,
      };

      if (message?.role === "user") {
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: message.id,
              role: "user",
              parts: message.parts,
              attachments: [],
              createdAt: new Date(),
            },
          ],
        });
      }

      const isReasoningModel =
        selectedChatModel.includes("reasoning") ||
        selectedChatModel.includes("thinking") ||
        selectedChatModel.includes("deepseek-r1") ||
        deepThinkingEnabled;

      console.log("[Chat API] Model configuration:", {
        selectedChatModel,
        isReasoningModel,
        wormgptEnabled,
        deepThinkingEnabled,
        webSearchEnabled,
      });

      const modelMessages = await convertToModelMessages(uiMessages);

      const stream = createUIMessageStream({
        originalMessages: isToolApprovalFlow ? uiMessages : undefined,
        execute: async ({ writer: dataStream }) => {
          let retryCount = 0;
          const maxRetries = 2;

          while (retryCount <= maxRetries) {
            try {
              // Disable tools on retry to avoid function call errors
              const useTools = retryCount === 0 && !isReasoningModel;

              if (retryCount > 0) {
                console.log(
                  `[Chat API] Retry attempt ${retryCount}/${maxRetries} without tools`
                );
              }

              const result = streamText({
                model: getLanguageModel(selectedChatModel),
                system: systemPrompt({
                  selectedChatModel,
                  requestHints,
                  wormgptEnabled,
                  deepThinkingEnabled,
                  toolsEnabled: useTools,
                }),
                messages: modelMessages,
                stopWhen: stepCountIs(5),
                toolChoice: "auto",
                providerOptions: isReasoningModel
                  ? {
                      anthropic: {
                        thinking: { type: "enabled", budgetTokens: 10_000 },
                      },
                    }
                  : undefined,
                tools: useTools
                  ? {
                      getWeather,
                      // createDocument: createDocument({ session, dataStream }),
                      // updateDocument: updateDocument({ session, dataStream }),
                      // requestSuggestions: requestSuggestions({
                      //   session,
                      //   dataStream,
                      // }),
                      ...(webSearchEnabled ? { webSearch } : {}),
                    }
                  : {},
                experimental_telemetry: {
                  isEnabled: isProductionEnvironment,
                  functionId: "stream-text",
                },
              });

              dataStream.merge(
                result.toUIMessageStream({ sendReasoning: true })
              );

              if (titlePromise) {
                try {
                  const title = await titlePromise;
                  dataStream.write({ type: "data-chat-title", data: title });
                  updateChatTitleById({ chatId: id, title });
                } catch (titleError) {
                  // Title generation failed (rate limit, model error, etc.)
                  // This should NOT crash the chat stream — just log it
                  console.warn(
                    "[Chat API] Title generation failed (non-fatal):",
                    (titleError as any)?.message || titleError
                  );
                }
              }

              // Success - break retry loop
              break;
            } catch (error: any) {
              console.error(
                `[Chat API] Error during streaming (attempt ${retryCount + 1}/${maxRetries + 1}):`,
                error
              );
              console.error("[Chat API] Error details:", {
                message: error?.message,
                type: error?.type,
                statusCode: error?.statusCode,
                cause: error?.cause,
                stack: error?.stack?.split("\n").slice(0, 3),
              });

              // Check if error is function call related
              const isFunctionError =
                error?.message?.includes("Failed to call a function") ||
                error?.message?.includes("failed_generation") ||
                error?.message?.includes("invalid_request_error") ||
                error?.message?.includes("tool call validation") ||
                error?.type === "invalid_request_error" ||
                error?.cause?.message?.includes("tool") ||
                error?.message?.includes("support tool use");

              // Check if error is Invalid API Key
              const isInvalidKey =
                error?.message?.includes("Invalid API Key") ||
                error?.message?.includes("invalid_api_key") ||
                error?.message?.includes("Unauthorized") ||
                error?.statusCode === 401;

              // Check if error is rate limit or API error
              const isRateLimit =
                error?.message?.includes("rate limit") ||
                error?.message?.includes("429") ||
                error?.statusCode === 429;

              const isApiError =
                error?.message?.includes("API") || error?.statusCode >= 500;

              if (isInvalidKey) {
                console.error(
                  "[Chat API] Invalid API Key detected - check configuration"
                );
                // markKeyFailed("primary"); // Function removed
                // setTimeout(() => resetFailureTracking(), 30_000); // Function removed
                throw new Error(
                  "Invalid API Key. Silakan hubungi administrator untuk mengecek konfigurasi API key."
                );
              }

              if (isFunctionError && retryCount < maxRetries) {
                console.log(
                  `[Chat API] Function call failed, retrying without tools (${retryCount + 1}/${maxRetries})`
                );
                retryCount++;
                await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
                continue; // Retry loop
              }

              if (isRateLimit || isApiError) {
                console.log(
                  "[Chat API] Rate limit or API error detected (will retry if possible)"
                );
                // markKeyFailed("primary"); // Function removed
                // setTimeout(() => resetFailureTracking(), 60_000); // Function removed
              }

              // If we've exhausted retries or hit non-retryable error, throw
              throw error;
            }
          }
        },
        generateId: generateUUID,
        onFinish: async ({ messages: finishedMessages }) => {
          if (isToolApprovalFlow) {
            for (const finishedMsg of finishedMessages) {
              const existingMsg = uiMessages.find(
                (m) => m.id === finishedMsg.id
              );
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                });
              } else {
                await saveMessages({
                  messages: [
                    {
                      id: finishedMsg.id,
                      role: finishedMsg.role,
                      parts: finishedMsg.parts,
                      createdAt: new Date(),
                      attachments: [],
                      chatId: id,
                    },
                  ],
                });
              }
            }
          } else if (finishedMessages.length > 0) {
            await saveMessages({
              messages: finishedMessages.map((currentMessage) => ({
                id: currentMessage.id,
                role: currentMessage.role,
                parts: currentMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });
          }
        },
        onError: (error) => {
          console.error("[Stream Error] Raw error:", error);
          console.error("[Stream Error] Message:", (error as any)?.message);
          console.error("[Stream Error] Cause:", (error as any)?.cause);
          return "Oops, an error occurred!";
        },
      });

      return createUIMessageStreamResponse({
        stream,
        async consumeSseStream({ stream: sseStream }) {
          if (!process.env.REDIS_URL) {
            return;
          }
          try {
            const streamContext = getStreamContext();
            if (streamContext) {
              const streamId = generateId();
              await createStreamId({ streamId, chatId: id });
              await streamContext.createNewResumableStream(
                streamId,
                () => sseStream
              );
            }
          } catch (_) {
            // ignore redis errors
          }
        },
      });
    } catch (error) {
      const vercelId = request.headers.get("x-vercel-id");

      // Log detailed error information
      console.error("=== AI CHAT ERROR ===");
      console.error("Vercel ID:", vercelId);
      console.error(
        "Error Type:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        "Error Message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "Error Stack:",
        error instanceof Error ? error.stack : "N/A"
      );

      // Log request context
      console.error("Request Body:", JSON.stringify(requestBody, null, 2));
      console.error("Selected Model:", requestBody?.selectedChatModel);
      console.error("Chat ID:", requestBody?.id);

      // Log any additional error details
      if (error && typeof error === "object") {
        console.error(
          "Error Details:",
          JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        );
      }
      console.error("=== END ERROR LOG ===");

      if (error instanceof ChatSDKError) {
        return error.toResponse();
      }

      if (
        error instanceof Error &&
        error.message?.includes(
          "AI Gateway requires a valid credit card on file to service requests"
        )
      ) {
        return new ChatSDKError("bad_request:activate_gateway").toResponse();
      }

      console.error("Unhandled error in chat API:", error, { vercelId });
      return new ChatSDKError("offline:chat").toResponse();
    }
  } catch (panic: any) {
    console.error("[Chat API] PANIC:", panic);
    return new Response(JSON.stringify({ error: panic.message }), {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
