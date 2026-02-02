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
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel, markKeyFailed, resetFailureTracking } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { webSearch } from "@/lib/ai/tools/web-search";
import { isProductionEnvironment } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimiter";
import {
  createStreamId,
  deleteChatById,
  expireProIfNeeded,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
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
  let requestBody: PostRequestBody;

  // Check if any Groq key is configured (supports GROQ_API_KEY, GROQ_API_KEY_1, GROQ_API_KEY_2)
  const hasGroqApiKey = Boolean(
    process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY_1 ||
      process.env.GROQ_API_KEY_2
  );

  if (!hasGroqApiKey) {
    console.error("=== CONFIGURATION ERROR ===");
    console.error("No Groq API key found in environment variables");
    console.error("Please set GROQ_API_KEY or GROQ_API_KEY_1/2 in your deployment");
    console.error("=== END CONFIGURATION ERROR ===");

    return new Response(
      JSON.stringify({
        error: "AI service not configured. Please contact administrator.",
        code: "missing_api_key"
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

    const dbUser = await expireProIfNeeded(session.user.id);
    const userType: UserType =
      session.user.role === "admin"
        ? "pro"
        : dbUser?.isPro
          ? "pro"
          : "regular";

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
            attachments: [ ],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking") ||
      deepThinkingEnabled;

    const modelMessages = await convertToModelMessages(uiMessages);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        try {
          const result = streamText({
            model: getLanguageModel(selectedChatModel),
            system: systemPrompt({
              selectedChatModel,
              requestHints,
              wormgptEnabled,
              deepThinkingEnabled,
            }),
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            experimental_activeTools: isReasoningModel
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "requestSuggestions",
                  "webSearch",
                ],
            providerOptions: isReasoningModel
              ? {
                  anthropic: {
                    thinking: { type: "enabled", budgetTokens: 10_000 },
                  },
                }
              : undefined,
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({ session, dataStream }),
              webSearch,
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: "stream-text",
            },
          });

          dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

          if (titlePromise) {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          }
        } catch (error: any) {
          console.error("[Chat API] Error during streaming:", error);
          
          // Check if error is rate limit or API error
          const isRateLimit = error?.message?.includes('rate limit') || 
                              error?.message?.includes('429') ||
                              error?.statusCode === 429;
          
          const isApiError = error?.message?.includes('API') || 
                            error?.statusCode >= 500;

          if (isRateLimit || isApiError) {
            console.log("[Chat API] Marking current key as failed, will use backup on retry");
            // Mark as failed - next request will use different key
            markKeyFailed('primary'); // Will auto-switch based on tracking
            
            // Reset after 60 seconds
            setTimeout(() => resetFailureTracking(), 60000);
          }
          
          throw error;
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
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
      onError: () => "Oops, an error occurred!",
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
    console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("Error Stack:", error instanceof Error ? error.stack : "N/A");
    
    // Log request context
    console.error("Request Body:", JSON.stringify(requestBody, null, 2));
    console.error("Selected Model:", requestBody?.selectedChatModel);
    console.error("Chat ID:", requestBody?.id);
    
    // Log any additional error details
    if (error && typeof error === 'object') {
      console.error("Error Details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
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
