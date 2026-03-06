"use client";

import { useChat } from "@ai-sdk/react";
import { type DataUIPart, DefaultChatTransport } from "ai";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatContextHeader } from "@/components/chat-context-header";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage, CustomUIDataTypes } from "@/lib/types";
import { cn, fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import { Button } from "./ui/button";
import type { VisibilityType } from "./visibility-selector";

const emptyStatePrompts = [
	{
		title: "Rancang landing page",
		description: "Susun hero, CTA, dan alur section untuk produk AI workspace.",
		prompt: "Bantu saya rancang landing page premium untuk produk AI workspace dengan tone modern dan jelas.",
	},
	{
		title: "Analisis file kerja",
		description: "Ringkas isi file, cari masalah utama, lalu urutkan perbaikannya.",
		prompt: "Tolong analisis file yang saya upload, jelaskan masalah utamanya, lalu beri urutan perbaikannya.",
	},
	{
		title: "Mulai mode fullstack",
		description: "Rancang flow feature, API, state, dan komponen yang perlu dibuat.",
		prompt: "Bantu saya rancang fitur fullstack dari UI, API, database, sampai deployment checklist.",
	},
];

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

	const [input, setInput] = useState<string>("");
	const [currentModelId, setCurrentModelId] = useState(initialChatModel);
	const [wormgptEnabled, setWormgptEnabled] = useState(false);
	const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
	const [webSearchEnabled, setWebSearchEnabled] = useState(false);
	const [fullstackModeEnabled, setFullstackModeEnabled] = useState(false);
	const [mobileModeEnabled, setMobileModeEnabled] = useState(false);
	const currentModelIdRef = useRef(currentModelId);
	const togglesRef = useRef({
		wormgptEnabled,
		deepThinkingEnabled,
		webSearchEnabled,
		fullstackModeEnabled,
		mobileModeEnabled,
		visibilityType,
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
		};
	}, [
		currentModelId,
		wormgptEnabled,
		deepThinkingEnabled,
		webSearchEnabled,
		fullstackModeEnabled,
		mobileModeEnabled,
		visibilityType,
	]);

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
							const state = (part as { state?: string }).state;
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

			if (error instanceof ChatSDKError) {
				if (
					error.message?.includes("AI Gateway requires a valid credit card")
				) {
					// This is a Groq-based app, not using AI Gateway
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
				// Show generic error for non-ChatSDKError
				toast({
					type: "error",
					description:
						"Terjadi kesalahan saat berkomunikasi dengan AI. Silakan coba lagi.",
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
		fetcher,
	);

	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

	const handleStarterPrompt = (prompt: string) => {
		setInput(prompt);
		requestAnimationFrame(() => {
			const textarea = document.querySelector("textarea");
			if (textarea instanceof HTMLTextAreaElement) {
				textarea.focus();
				textarea.setSelectionRange(textarea.value.length, textarea.value.length);
			}
		});
	};

	const activeModes = [
		fullstackModeEnabled ? "fullstack" : null,
		mobileModeEnabled ? "mobile" : null,
		deepThinkingEnabled ? "deep think" : null,
		webSearchEnabled ? "web" : null,
	].filter(Boolean) as string[];

	useAutoResume({
		autoResume,
		initialMessages,
		resumeStream,
		setMessages,
	});

	return (
		<>
			<div
				className={cn(
					"relative flex h-dvh min-w-0 flex-col overflow-hidden bg-[#f7f7f4] text-[#171717] transition-all duration-300 ease-in-out dark:bg-[#111213] dark:text-[#f3f4f1]",
					isArtifactVisible ? "lg:w-[55%]" : "w-full",
				)}
			>
				<div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(17,19,21,0.03),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

				<div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-3 pt-2 sm:px-4 sm:pt-2.5">
					<div className="pointer-events-auto mx-auto max-w-4xl">
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
							<div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col overflow-hidden">
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
							<div className="mx-auto w-full max-w-4xl space-y-4">
								<div className="px-4 py-8 sm:px-8 sm:py-10">
									<div className="mx-auto max-w-2xl text-center">
										<div className="inline-flex rounded-full border border-black/8 bg-white/70 px-3 py-1 text-[11px] font-medium tracking-[0.14em] uppercase text-[#6b6b63] dark:border-white/10 dark:bg-white/5 dark:text-[#9ca39d]">
											Ultramaxo Workspace
										</div>
										<h1 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.04em] text-[#171717] sm:text-4xl dark:text-[#f3f4f1]">
											Mau bantu apa hari ini?
										</h1>
										<p className="mt-4 text-sm leading-7 text-[#5f6258] dark:text-[#a6aca6] sm:text-base">
											Mulai dengan prompt singkat. Kalau perlu, lanjutkan ke artifact, file analysis, atau flow fullstack tanpa pindah konteks.
										</p>
										{activeModes.length > 0 && (
											<div className="mt-5 flex flex-wrap justify-center gap-2">
												{activeModes.map((mode) => (
													<span
														className="rounded-full border border-black/8 px-3 py-1 text-xs text-[#5f6258] dark:border-white/10 dark:text-[#a6aca6]"
														key={mode}
													>
														{mode}
													</span>
												))}
											</div>
										)}
									</div>

									<div className="mt-8 grid gap-3 sm:grid-cols-3">
										{emptyStatePrompts.map((item) => (
											<button
												className="rounded-3xl border border-black/6 bg-white/85 p-4 text-left transition-colors hover:bg-[#f3f2ed] dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/8"
												key={item.title}
												onClick={() => handleStarterPrompt(item.prompt)}
												type="button"
											>
												<div className="text-sm font-semibold text-[#171717] dark:text-[#f3f4f1]">
													{item.title}
												</div>
												<p className="mt-2 text-sm leading-6 text-[#5f6258] dark:text-[#a6aca6]">
													{item.description}
												</p>
											</button>
										))}
									</div>
								</div>

								{isReadonly ? (
									<div className="rounded-3xl border border-dashed border-black/8 bg-white/85 px-6 py-5 text-center dark:border-white/10 dark:bg-white/5">
										<p className="text-sm text-[#5f6258] dark:text-[#a6aca6]">
											Masuk dulu untuk mulai ngobrol dan buka workspace penuh Ultramaxo AI.
										</p>
										<div className="mt-4 flex justify-center gap-3">
											<Button asChild className="rounded-full" size="sm" variant="outline">
												<Link href="/login">Sign In</Link>
											</Button>
											<Button asChild className="rounded-full" size="sm">
												<Link href="/register">Create Account</Link>
											</Button>
										</div>
									</div>
								) : isAtLimit ? (
									<div className="rounded-3xl border border-dashed border-black/8 bg-white/85 px-6 py-5 text-center dark:border-white/10 dark:bg-white/5">
										<p className="text-sm font-medium text-[#171717] dark:text-[#f3f4f1]">
											You have reached your free daily limit of 10 messages.
										</p>
										<p className="mt-2 text-xs text-[#5f6258] dark:text-[#a6aca6]">
											Upgrade to PRO for unlimited messages, or wait until tomorrow.
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
					<div className="relative z-10 w-full px-3 pb-3 sm:px-4 sm:pb-4">
						<div className="mx-auto w-full max-w-4xl">
							{isReadonly ? (
								<div className="flex w-full items-center justify-center p-4">
										<div className="w-full max-w-3xl rounded-3xl border border-dashed border-black/8 bg-white/90 p-6 text-center dark:border-white/10 dark:bg-[#17181a]">
										<p className="text-sm text-[#5f6258] dark:text-[#a6aca6]">
											Please sign in to start chatting with Ultramaxo AI.
										</p>
										<div className="mt-2 flex gap-4">
											<Button asChild className="rounded-full" size="sm" variant="outline">
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
										<div className="w-full max-w-3xl rounded-3xl border border-dashed border-black/8 bg-white/90 p-6 text-center dark:border-white/10 dark:bg-[#17181a]">
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
									<p className="mx-auto max-w-xl text-center text-[10px] text-[#5f6258] dark:text-[#8e948e]">
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
