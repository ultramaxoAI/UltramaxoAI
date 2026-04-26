"use client";

import { useChat } from "@ai-sdk/react";
import { type DataUIPart, DefaultChatTransport } from "ai";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatContextHeader } from "@/components/chat-context-header";
import { useArtifactSelector, useArtifactUiState } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@backend/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage, CustomUIDataTypes } from "@/lib/types";
import {
	cn,
	fetcher,
	fetchWithErrorHandlers,
	generateUUID,
	sanitizeChatMessages,
} from "@/lib/utils";
import { Artifact } from "./artifact";
import { ContextualUpgradeBanner } from "./contextual-upgrade-banner";
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
	isAtLimit,
	autoResume,
	user,
	customModels,
}: {
	id: string;
	initialMessages: ChatMessage[];
	initialChatModel: string;
	initialVisibilityType: VisibilityType;
	isReadonly: boolean;
	isAtLimit?: boolean;
	autoResume: boolean;
	user?: User;
	customModels?: Array<{ id: string; name: string; provider: string }>;
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
	const { setUiState: setArtifactUiState } = useArtifactUiState();

	const [input, setInput] = useState<string>("");
	const [currentModelId, setCurrentModelId] = useState(initialChatModel);
	const [wormgptEnabled, setWormgptEnabled] = useState(false);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
	const [webSearchEnabled, setWebSearchEnabled] = useState(true);
	const [fullstackModeEnabled, setFullstackModeEnabled] = useState(false);
	const [mobileModeEnabled, setMobileModeEnabled] = useState(false);
	const currentModelIdRef = useRef(currentModelId);
	const activeDocumentId = useArtifactSelector((state) => state.documentId);
	const togglesRef = useRef({
		wormgptEnabled,
		deepThinkingEnabled,
		webSearchEnabled,
		fullstackModeEnabled,
		mobileModeEnabled,
		visibilityType,
		activeDocumentId,
	});

	useEffect(() => {
		currentModelIdRef.current = currentModelId;
		togglesRef.current = {
			wormgptEnabled,
			deepThinkingEnabled,
			webSearchEnabled,
			fullstackModeEnabled,
			mobileModeEnabled,
			visibilityType,
			activeDocumentId,
		};
	}, [
		currentModelId,
		wormgptEnabled,
		deepThinkingEnabled,
		webSearchEnabled,
		fullstackModeEnabled,
		mobileModeEnabled,
		visibilityType,
		activeDocumentId,
	]);

	useEffect(() => {
		setArtifactUiState((currentState) => {
			const nextIsIdeLocked = fullstackModeEnabled || mobileModeEnabled;

			if (currentState.isIdeLocked === nextIsIdeLocked) {
				return currentState;
			}

			return {
				...currentState,
				isIdeLocked: nextIsIdeLocked,
			};
		});
	}, [fullstackModeEnabled, mobileModeEnabled, setArtifactUiState]);

	const safeInitialMessages = useMemo(
		() => sanitizeChatMessages(initialMessages),
		[initialMessages],
	);

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
		messages: safeInitialMessages,
		generateId: generateUUID,
		sendAutomaticallyWhen: ({ messages: currentMessages }) => {
			const lastMessage = currentMessages.at(-1);
			const shouldContinue =
				lastMessage?.parts?.some(
					(part) =>
						part &&
						typeof part === "object" &&
						"state" in part &&
						part.state === "approval-responded" &&
						"approval" in part &&
						(part.approval as { approved?: boolean })?.approved === true,
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
							const state =
								part && typeof part === "object"
									? (part as { state?: string }).state
									: undefined;
							return (
								state === "approval-responded" || state === "output-denied"
							);
						}),
					);

				return {
					body: {
						id: request.id,
						...(isToolApprovalContinuation
							? { messages: request.messages }
							: { message: lastMessage }),
						selectedChatModel: currentModelIdRef.current,
						selectedVisibilityType: togglesRef.current.visibilityType,
						wormgptEnabled: togglesRef.current.wormgptEnabled,
						deepThinkingEnabled: togglesRef.current.deepThinkingEnabled,
						webSearchEnabled: togglesRef.current.webSearchEnabled,
						fullstackModeEnabled: togglesRef.current.fullstackModeEnabled,
						mobileModeEnabled: togglesRef.current.mobileModeEnabled,
						activeDocumentId:
							togglesRef.current.activeDocumentId === "init"
								? undefined
								: togglesRef.current.activeDocumentId,
						...request.body,
					},
				};
			},
		}),
		onData: (dataPart) => {
			setDataStream((ds) => [
				...(ds ?? []),
				dataPart as DataUIPart<CustomUIDataTypes>,
			]);
		},
		onFinish: () => {
			mutate(unstable_serialize(getChatHistoryPaginationKey));
		},
		onError: (error) => {
			// Log detailed error on client side
			console.error("=== CLIENT CHAT ERROR ===");
			console.error(
				"Error Type:",
				error instanceof Error ? error.constructor.name : typeof error,
			);
			console.error(
				"Error Message:",
				error instanceof Error ? error.message : String(error),
			);
			console.error(
				"Error Stack:",
				error instanceof Error ? error.stack : "N/A",
			);
			console.error("Chat ID:", id);
			console.error("Current Model:", currentModelId);
			console.error("Messages Count:", messages.length);

			if (error && typeof error === "object") {
				console.error(
					"Error Details:",
					JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
				);
			}
			console.error("=== END CLIENT ERROR ===");

			// Detect rate limit errors and trigger upgrade banner instead of just showing a toast
			const errorMsg = error instanceof Error ? error.message : String(error);
			const isRateLimitError =
				errorMsg.includes("rate_limit") ||
				errorMsg.includes("Rate limit") ||
				errorMsg.includes("Too many requests");

			if (isRateLimitError) {
				setIsRateLimited(true);
				// Auto-reset after 60 seconds
				setTimeout(() => setIsRateLimited(false), 60_000);
			}

			if (error instanceof ChatSDKError) {
				if (
					error.message?.includes("AI Gateway requires a valid credit card")
				) {
					toast({
						type: "error",
						description:
							"Terjadi kesalahan dengan layanan AI. Silakan coba lagi.",
					});
				} else {
					toast({
						type: "error",
						description: error.message,
					});
				}
			} else {
				if (
					error instanceof Error &&
					error.message.includes("IDE Mode Limit!")
				) {
					toast({
						type: "error",
						description: error.message,
					});
				} else {
					toast({
						type: "error",
						description:
							"Terjadi kesalahan saat berkomunikasi dengan AI. Silakan coba lagi.",
					});
				}
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
		fetcher,
	);

	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
	const {
		uiState: { isIdeLocked: isIdeArtifactLocked },
	} = useArtifactUiState();

	// Count user messages for contextual upgrade banner
	const userMessageCount = messages.filter((m) => m.role === "user").length;

	useAutoResume({
		autoResume,
		initialMessages: safeInitialMessages,
		resumeStream,
		setMessages,
	});

	return (
		<>
			<div
				className={cn(
					"relative flex h-dvh min-w-0 flex-col overflow-hidden bg-white text-[#171717] transition-all duration-300 ease-in-out dark:bg-[#171717] md:dark:bg-[#212121] dark:text-[#f3f4f1]",
					isArtifactVisible
						? isIdeArtifactLocked
							? "lg:w-[46%]"
							: "lg:w-[55%]"
						: "w-full",
				)}
			>
				<div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-3 pt-2 sm:px-4 sm:pt-2.5">
					<div className="pointer-events-auto mx-auto w-full max-w-5xl">
						<ChatContextHeader
							chatId={id}
							isReadonly={isReadonly}
							selectedVisibilityType={initialVisibilityType}
							user={user}
						/>
					</div>
				</div>

				<div
					className={`relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden pt-15 sm:pt-16 ${
						messages.length === 0 ? "items-center justify-center" : ""
					}`}
				>
					{messages.length > 0 && (
						<div className="flex flex-1 flex-col overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4">
							<div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden bg-transparent">
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
						</div>
					)}

					{messages.length === 0 && (
						<div className="flex w-full flex-1 items-center justify-center px-4 pb-4">
							<div className="mx-auto w-full max-w-3xl space-y-4 text-center">
								<div className="mx-auto max-w-2xl">
									<h1 className="text-balance text-[2.1rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.6rem] dark:text-[#f3f4f1]">
										Apa yang ingin Anda buat?
									</h1>
									<p className="mt-3 text-sm leading-7 text-[#5f6258] dark:text-[#a6aca6] sm:text-[15px]">
										Mulai dari satu prompt.
									</p>
								</div>

								{isReadonly ? (
									<div className="rounded-[28px] border border-dashed border-[#171717]/8 bg-white/42 px-6 py-5 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/4">
										<p className="text-sm text-[#5f6258] dark:text-[#a6aca6]">
											Masuk dulu untuk mulai ngobrol dan buka workspace penuh
											Ultramaxo AI.
										</p>
										<div className="mt-4 flex justify-center gap-3">
											<Button
												asChild
												className="rounded-full"
												size="sm"
												variant="outline"
											>
												<Link href="/login">Sign In</Link>
											</Button>
											<Button asChild className="rounded-full" size="sm">
												<Link href="/register">Create Account</Link>
											</Button>
										</div>
									</div>
								) : isAtLimit ? (
									<div className="rounded-[28px] border border-dashed border-[#171717]/8 bg-white/42 px-6 py-5 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/4">
										<p className="text-sm font-medium text-[#171717] dark:text-[#f3f4f1]">
											You have reached your free daily limit of 10 messages.
										</p>
										<p className="mt-2 text-xs text-[#5f6258] dark:text-[#a6aca6]">
											Upgrade to PRO for unlimited messages, or wait until
											tomorrow.
										</p>
										<div className="mt-4 flex justify-center">
											<Button asChild className="rounded-full" size="sm">
												<Link href="/plan">Upgrade to PRO</Link>
											</Button>
										</div>
									</div>
								) : (
									<div className="mx-auto w-full max-w-3xl">
										<MultimodalInput
											attachments={attachments}
											chatId={id}
											deepThinkingEnabled={deepThinkingEnabled}
											input={input}
											messages={messages}
											onModelChange={setCurrentModelId}
											selectedModelId={currentModelId}
											selectedVisibilityType={visibilityType}
											sendMessage={sendMessage}
											setAttachments={setAttachments}
											setDeepThinkingEnabled={setDeepThinkingEnabled}
											setInput={setInput}
											setMessages={setMessages}
											setWebSearchEnabled={setWebSearchEnabled}
											setWormgptEnabled={setWormgptEnabled}
											fullstackModeEnabled={fullstackModeEnabled}
											setFullstackModeEnabled={setFullstackModeEnabled}
											mobileModeEnabled={mobileModeEnabled}
											setMobileModeEnabled={setMobileModeEnabled}
											status={status}
											stop={stop}
											user={user}
											webSearchEnabled={webSearchEnabled}
											wormgptEnabled={wormgptEnabled}
											customModels={customModels}
										/>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{messages.length > 0 && (
					<div className="relative z-10 w-full px-3 pb-6 sm:px-4 sm:pb-6">
						{/* Contextual Upgrade Banner */}
						{user?.type !== "pro" && (
							<ContextualUpgradeBanner
								messageCount={userMessageCount}
								isRateLimited={isRateLimited}
								userType={user?.type}
							/>
						)}
						<div className="mx-auto w-full max-w-4xl">
							{isReadonly ? (
								<div className="flex w-full items-center justify-center p-4">
									<div className="w-full max-w-3xl rounded-[28px] border border-dashed border-[#171717]/8 bg-white/42 p-6 text-center shadow-[0_18px_50px_rgba(23,23,23,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171b1f]/78 dark:shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
										<p className="text-sm text-[#5f6258] dark:text-[#a6aca6]">
											Please sign in to start chatting with Ultramaxo AI.
										</p>
										<div className="mt-2 flex gap-4">
											<Button
												asChild
												className="rounded-full"
												size="sm"
												variant="outline"
											>
												<Link href="/login">Sign In</Link>
											</Button>
											<Button asChild className="rounded-full" size="sm">
												<Link href="/register">Create Account</Link>
											</Button>
										</div>
									</div>
								</div>
							) : isAtLimit ? (
								<div className="flex w-full items-center justify-center p-4">
									<div className="w-full max-w-3xl rounded-[28px] border border-dashed border-[#171717]/8 bg-white/42 p-6 text-center shadow-[0_18px_50px_rgba(23,23,23,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171b1f]/78 dark:shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
										<p className="text-sm font-medium text-[#171717] dark:text-[#f3f4f1]">
											You have reached your free daily limit of 10 messages.
										</p>
										<p className="mb-2 text-xs text-[#5f6258] dark:text-[#a6aca6]">
											Upgrade to PRO for unlimited messages, or wait until
											tomorrow.
										</p>
										<div className="flex gap-4">
											<Button asChild className="rounded-full" size="sm">
												<Link href="/plan">Upgrade to PRO</Link>
											</Button>
										</div>
									</div>
								</div>
							) : (
								<div className="relative flex flex-col gap-2">
									<div className="mx-auto w-full max-w-5xl">
										<MultimodalInput
											attachments={attachments}
											chatId={id}
											deepThinkingEnabled={deepThinkingEnabled}
											input={input}
											messages={messages}
											onModelChange={setCurrentModelId}
											selectedModelId={currentModelId}
											selectedVisibilityType={visibilityType}
											sendMessage={sendMessage}
											setAttachments={setAttachments}
											setDeepThinkingEnabled={setDeepThinkingEnabled}
											setInput={setInput}
											setMessages={setMessages}
											setWebSearchEnabled={setWebSearchEnabled}
											setWormgptEnabled={setWormgptEnabled}
											fullstackModeEnabled={fullstackModeEnabled}
											setFullstackModeEnabled={setFullstackModeEnabled}
											mobileModeEnabled={mobileModeEnabled}
											setMobileModeEnabled={setMobileModeEnabled}
											status={status}
											stop={stop}
											user={user}
											webSearchEnabled={webSearchEnabled}
											wormgptEnabled={wormgptEnabled}
											customModels={customModels}
										/>
									</div>
									<p className="mx-auto max-w-xl text-center text-[10px] text-[#5f6258] dark:text-[#8e948e] px-2">
										UltraAgent can make mistakes. Consider verifying important
										information.
									</p>
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
				deepThinkingEnabled={deepThinkingEnabled}
				input={input}
				isReadonly={isReadonly}
				messages={messages}
				regenerate={regenerate}
				selectedModelId={currentModelId}
				selectedVisibilityType={visibilityType}
				sendMessage={sendMessage}
				setAttachments={setAttachments}
				setDeepThinkingEnabled={setDeepThinkingEnabled}
				setInput={setInput}
				setMessages={setMessages}
				setWebSearchEnabled={setWebSearchEnabled}
				setWormgptEnabled={setWormgptEnabled}
				status={status}
				stop={stop}
				votes={votes}
				webSearchEnabled={webSearchEnabled}
				wormgptEnabled={wormgptEnabled}
			/>
		</>
	);
}
