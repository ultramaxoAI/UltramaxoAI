"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatContextHeader } from "@/components/chat-context-header";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import { Button } from "./ui/button";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const router = useRouter();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // When user navigates back/forward, refresh to sync with URL
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const [wormgptEnabled, setWormgptEnabled] = useState(false);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      const shouldContinue =
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false;
      return shouldContinue;
    },
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            wormgptEnabled,
            deepThinkingEnabled,
            webSearchEnabled,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      // Log detailed error on client side
      console.error("=== CLIENT CHAT ERROR ===");
      console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error Message:", error instanceof Error ? error.message : String(error));
      console.error("Error Stack:", error instanceof Error ? error.stack : "N/A");
      console.error("Chat ID:", id);
      console.error("Current Model:", currentModelId);
      console.error("Messages Count:", messages.length);
      
      if (error && typeof error === 'object') {
        console.error("Error Details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      console.error("=== END CLIENT ERROR ===");

      if (error instanceof ChatSDKError) {
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          // This is a Groq-based app, not using AI Gateway
          toast({
            type: "error",
            description: "Terjadi kesalahan dengan layanan AI. Silakan coba lagi.",
          });
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      } else {
        // Show generic error for non-ChatSDKError
        toast({
          type: "error",
          description: "Terjadi kesalahan saat berkomunikasi dengan AI. Silakan coba lagi.",
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex h-dvh min-w-0 flex-col bg-background relative">
        {/* Header dengan absolute positioning agar center */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <ChatContextHeader
            chatId={id}
            isReadonly={isReadonly}
            selectedVisibilityType={initialVisibilityType}
          />
        </div>

        {/* Main content area with proper centering - offset untuk header */}
        <div className={`flex flex-1 flex-col overflow-hidden pt-13 ${
          messages.length === 0 ? 'items-center justify-center' : ''
        }`}>
          {/* Messages container with centered max-width */}
          {messages.length > 0 && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <Messages
                addToolApprovalResponse={addToolApprovalResponse}
                chatId={id}
                isArtifactVisible={isArtifactVisible}
                isReadonly={isReadonly}
                messages={messages}
                regenerate={regenerate}
                selectedModelId={initialChatModel}
                setMessages={setMessages}
                status={status}
                votes={votes}
              />
            </div>
          )}

          {/* Centered greeting + input container for empty state */}
          {messages.length === 0 && (
            <div className="w-full max-w-3xl px-4 space-y-8">
              <Messages
                addToolApprovalResponse={addToolApprovalResponse}
                chatId={id}
                isArtifactVisible={isArtifactVisible}
                isReadonly={isReadonly}
                messages={messages}
                regenerate={regenerate}
                selectedModelId={initialChatModel}
                setMessages={setMessages}
                status={status}
                votes={votes}
              />

              {!isReadonly ? (
                <MultimodalInput
                  attachments={attachments}
                  chatId={id}
                  input={input}
                  messages={messages}
                  onModelChange={setCurrentModelId}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={sendMessage}
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                  wormgptEnabled={wormgptEnabled}
                  setWormgptEnabled={setWormgptEnabled}
                  deepThinkingEnabled={deepThinkingEnabled}
                  setDeepThinkingEnabled={setDeepThinkingEnabled}
                  webSearchEnabled={webSearchEnabled}
                  setWebSearchEnabled={setWebSearchEnabled}
                />
              ) : (
                <div className="flex w-full items-center justify-center p-4">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50 w-full">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Please sign in to start chatting with Ultramaxo AI.
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/register">Create Account</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom input for active chat state */}
        {messages.length > 0 && (
          <div className="w-full px-4 pb-4">
            <div className="mx-auto w-full max-w-3xl">
              {!isReadonly ? (
                <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              wormgptEnabled={wormgptEnabled}
              setWormgptEnabled={setWormgptEnabled}
              deepThinkingEnabled={deepThinkingEnabled}
              setDeepThinkingEnabled={setDeepThinkingEnabled}
              webSearchEnabled={webSearchEnabled}
              setWebSearchEnabled={setWebSearchEnabled}
            />
          ) : (
            <div className="flex w-full items-center justify-center p-4">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50 w-full">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Please sign in to start chatting with Ultramaxo AI.
                </p>
                <div className="flex gap-4 mt-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Create Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>
        )}
      </div>

      <Artifact
        addToolApprovalResponse={addToolApprovalResponse}
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
        wormgptEnabled={wormgptEnabled}
        setWormgptEnabled={setWormgptEnabled}
        deepThinkingEnabled={deepThinkingEnabled}
        setDeepThinkingEnabled={setDeepThinkingEnabled}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={setWebSearchEnabled}
      />
    </>
  );
}
