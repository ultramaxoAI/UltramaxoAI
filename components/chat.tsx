"use client";

import { useChat } from "@ai-sdk/react";
import type { Vote } from "@backend/db/schema";
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
import { detectAgentMode, isAgenticToolName } from "@/lib/agent-mode-detector";
import { detectTaskType } from "@/lib/detect-task-type";
import { ChatSDKError } from "@/lib/errors";
import { getThinkingSteps } from "@/lib/thinking-steps";
import type { Attachment, ChatMessage, CustomUIDataTypes } from "@/lib/types";
import {
	cn,
	fetcher,
	fetchWithErrorHandlers,
	generateUUID,
	getTextFromMessage,
	sanitizeChatMessage,
	sanitizeChatMessages,
} from "@/lib/utils";
import { AgentDock } from "./agent-dock";
import { Artifact } from "./artifact";
import { ContextualUpgradeBanner } from "./contextual-upgrade-banner";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { useSidebar } from "./ui/sidebar";
import type { VisibilityType } from "./visibility-selector";

function getPartState(part: unknown) {
	if (!part || typeof part !== "object") {
		return undefined;
	}

	const record = part as { state?: unknown };
	return typeof record.state === "string" ? record.state : undefined;
}

function isApprovalGranted(part: unknown) {
	if (!part || typeof part !== "object") {
		return false;
	}

	const record = part as { approval?: unknown };
	if (!record.approval || typeof record.approval !== "object") {
		return false;
	}

	return (record.approval as { approved?: unknown }).approved === true;
}

export function Chat({
	id,
	initialMessages,
	initialChatModel,
	initialVisibilityType,
	isReadonly,
	isAtLimit,
	autoResume,
	chatAnnouncement,
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
	chatAnnouncement?: {
		enabled: boolean;
		title: string;
		message: string;
	};
	user?: User;
	customModels?: Array<{ id: string; name: string; provider: string }>;
}) {
	const router = useRouter();

	const hasApprovalContinuationPart = (parts: ChatMessage["parts"] = []) =>
		parts.some((part) => {
			const state = getPartState(part);
			return state === "approval-responded" || state === "output-denied";
		});

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
	const {
		agentStream,
		liveThinking,
		setDataStream,
		setAgentStream,
		setLiveThinking,
	} = useDataStream();
	const { setUiState: setArtifactUiState } = useArtifactUiState();
	const { setOpen: setSidebarOpen, setOpenMobile: setSidebarOpenMobile } =
		useSidebar();

	const [input, setInput] = useState<string>("");
	const [currentModelId, setCurrentModelId] = useState(initialChatModel);
	const [wormgptEnabled, setWormgptEnabled] = useState(false);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
	const [webSearchEnabled, setWebSearchEnabled] = useState(true);
	const [fullstackModeEnabled, setFullstackModeEnabled] = useState(false);
	const [mobileModeEnabled, setMobileModeEnabled] = useState(false);
	const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
	const [streamError, setStreamError] = useState<string | null>(null);
	const [lastChunkAt, setLastChunkAt] = useState(() => Date.now());
	const streamStallTimeoutMs = 30_000;
	const streamWatchdogTimeoutMs = 90_000;
	const lastThinkingMessageIdRef = useRef<string | null>(null);
	const lastFallbackMessageForUserIdRef = useRef<string | null>(null);
	const pendingTurnRef = useRef<{
		text: string;
		hasAttachment: boolean;
		startedAt: number;
	} | null>(null);
	const currentModelIdRef = useRef(currentModelId);
	const statusResetAtRef = useRef<number | null>(null);
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
		if (
			!chatAnnouncement?.enabled ||
			!chatAnnouncement.title ||
			!chatAnnouncement.message
		) {
			setIsAnnouncementOpen(false);
			return;
		}

		const storageKey = `chat-announcement:${chatAnnouncement.title}:${chatAnnouncement.message}`;
		const hasDismissed =
			typeof window !== "undefined" &&
			window.sessionStorage.getItem(storageKey) === "dismissed";

		setIsAnnouncementOpen(!hasDismissed);
	}, [chatAnnouncement]);

	const handleAnnouncementOpenChange = (open: boolean) => {
		if (!open && chatAnnouncement?.enabled) {
			const storageKey = `chat-announcement:${chatAnnouncement.title}:${chatAnnouncement.message}`;
			window.sessionStorage.setItem(storageKey, "dismissed");
		}

		setIsAnnouncementOpen(open);
	};

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
						getPartState(part) === "approval-responded" &&
						isApprovalGranted(part),
				) ?? false;
			return shouldContinue;
		},
		transport: new DefaultChatTransport({
			api: "/api/chat",
			fetch: fetchWithErrorHandlers,
			prepareSendMessagesRequest(request) {
				const approvalPatchMessages = request.messages.filter((msg) =>
					hasApprovalContinuationPart(msg.parts),
				);
				const lastUserMessage = request.messages
					.slice()
					.reverse()
					.find((msg) => msg.role === "user");

				return {
					body: {
						id: request.id,
						...(approvalPatchMessages.length > 0
							? { messages: approvalPatchMessages }
							: { message: lastUserMessage }),
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
			setLastChunkAt(Date.now());
			setStreamError(null);

			if (
				dataPart.type === "data-appendMessage" &&
				typeof dataPart.data === "string"
			) {
				try {
					const parsedMessage = sanitizeChatMessage(
						JSON.parse(dataPart.data) as ChatMessage,
					);
					setMessages((currentMessages) => {
						if (
							currentMessages.some((message) => message.id === parsedMessage.id)
						) {
							return currentMessages;
						}

						return [...currentMessages, parsedMessage];
					});
				} catch (error) {
					console.warn(
						"[Chat] Failed to append streamed fallback message",
						error,
					);
				}
			}

			setDataStream((ds) => [
				...(ds ?? []),
				dataPart as DataUIPart<CustomUIDataTypes>,
			]);
		},
		onFinish: () => {
			setLastChunkAt(Date.now());
			setStreamError(null);
			mutate(unstable_serialize(getChatHistoryPaginationKey));
		},
		onError: (error) => {
			if (process.env.NODE_ENV === "development") {
				console.groupCollapsed("[Chat] Client error");
				console.log(
					"Error Type:",
					error instanceof Error ? error.constructor.name : typeof error,
				);
				console.log(
					"Error Message:",
					error instanceof Error ? error.message : String(error),
				);
				console.log(
					"Error Stack:",
					error instanceof Error ? error.stack : "N/A",
				);
				console.log("Chat ID:", id);
				console.log("Current Model:", currentModelId);
				console.log("Messages Count:", messages.length);

				if (error && typeof error === "object") {
					console.log(
						"Error Details:",
						JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
					);
				}
				console.groupEnd();
			}

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
					error.message.includes("Insufficient credits")
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

	useEffect(() => {
		if (status === "submitted") {
			const now = Date.now();
			statusResetAtRef.current = now;
			const lastUserMessage = messages
				.slice()
				.reverse()
				.find((message) => message.role === "user");
			const pendingTurn = pendingTurnRef.current;
			if (!lastUserMessage && !pendingTurn) {
				return;
			}

			const isReplayOfSameUserMessage =
				lastUserMessage != null &&
				lastThinkingMessageIdRef.current === lastUserMessage.id;
			if (lastUserMessage && !isReplayOfSameUserMessage) {
				lastThinkingMessageIdRef.current = lastUserMessage.id;
			}
			const userText = lastUserMessage
				? getTextFromMessage(lastUserMessage)
				: (pendingTurn?.text ?? "");
			const hasAttachment = lastUserMessage
				? Array.isArray(lastUserMessage.parts)
					? lastUserMessage.parts.some((part) => part.type === "file")
					: false
				: (pendingTurn?.hasAttachment ?? false);
			const taskType = detectTaskType(userText);
			const recentContext = messages
				.filter((candidate) =>
					lastUserMessage ? candidate.id !== lastUserMessage.id : true,
				)
				.slice(-4)
				.map((candidate) => getTextFromMessage(candidate).trim())
				.filter(Boolean);
			const preflightDetection = detectAgentMode({
				message: userText,
				recentContext,
				hasAttachment,
			});
			const initialSurface =
				fullstackModeEnabled || mobileModeEnabled
					? "agent-active"
					: preflightDetection.uiSurface === "agent-active"
						? "deep-thinking"
						: deepThinkingEnabled &&
								preflightDetection.uiSurface === "responding"
							? "deep-thinking"
							: preflightDetection.uiSurface;
			const shouldShowLiveThinking = initialSurface !== "responding";

			setStreamError(null);
			setLastChunkAt(now);
			setAgentStream({
				status: "thinking",
				steps: [],
				startedAt: now,
				endedAt: null,
			});
			setLiveThinking({
				enabled: shouldShowLiveThinking,
				taskType,
				steps: shouldShowLiveThinking
					? getThinkingSteps(taskType, userText)
					: [],
				startedAt: shouldShowLiveThinking ? now : null,
				surface: initialSurface,
				runtimeEscalated: false,
			});
		}

		if (status === "ready") {
			statusResetAtRef.current = null;
			pendingTurnRef.current = null;
			setAgentStream((current) =>
				current.startedAt &&
				current.status !== "done" &&
				current.status !== "error"
					? { ...current, status: "done", endedAt: Date.now() }
					: current,
			);
			setStreamError(null);
			setLiveThinking((current) => ({
				...current,
				enabled: false,
			}));
		}

		if (status === "error") {
			statusResetAtRef.current = null;
			pendingTurnRef.current = null;
			setAgentStream((current) => ({
				...current,
				status: "error",
				endedAt: current.endedAt ?? Date.now(),
				error: current.error ?? "Terjadi kesalahan saat merespons.",
			}));
			setLiveThinking((current) => ({
				...current,
				enabled: false,
			}));
		}
	}, [messages, setAgentStream, setLiveThinking, status]);

	useEffect(() => {
		if (status !== "submitted" && status !== "streaming") {
			return;
		}

		const hasRuntimeAgentWork =
			agentStream.steps.some((step) => {
				if (step.type === "tool_call") {
					return isAgenticToolName(step.label);
				}

				return agentStream.steps.length > 1;
			}) ||
			agentStream.steps.filter((step) => step.type === "tool_call").length > 1;

		if (!hasRuntimeAgentWork) {
			return;
		}

		setLiveThinking((current) => ({
			...current,
			enabled: true,
			startedAt: current.startedAt ?? agentStream.startedAt ?? Date.now(),
			surface: "agent-active",
			runtimeEscalated: true,
		}));
	}, [
		agentStream.startedAt,
		agentStream.status,
		agentStream.steps,
		setLiveThinking,
		status,
	]);

	useEffect(() => {
		if (status !== "ready") {
			return;
		}

		const lastUserMessage = messages
			.slice()
			.reverse()
			.find((message) => message.role === "user");

		if (!lastUserMessage) {
			return;
		}

		const assistantMessagesAfterLastUser = messages.filter((message, index) => {
			const lastUserIndex = messages.findLastIndex(
				(candidate) => candidate.id === lastUserMessage.id,
			);
			return index > lastUserIndex && message.role === "assistant";
		});

		const hasRenderableAssistantAfterLastUser =
			assistantMessagesAfterLastUser.some((message) => {
				const messageParts = Array.isArray(message.parts) ? message.parts : [];
				const hasTextPart = messageParts.some((part) => {
					if (!part || typeof part !== "object" || !("type" in part)) {
						return false;
					}

					if (part.type === "text" || part.type === "reasoning") {
						return Boolean((part as { text?: string }).text?.trim());
					}

					return false;
				});

				const hasFallbackContent =
					typeof (message as { content?: unknown }).content === "string" &&
					Boolean(((message as { content?: string }).content ?? "").trim());

				return hasTextPart || hasFallbackContent;
			});

		const hasAgentTrace =
			agentStream.steps.length > 0 || liveThinking.steps.length > 0;
		const hasAssistantToolOutputAfterLastUser =
			assistantMessagesAfterLastUser.some((message) =>
				(message.parts ?? []).some((part) => {
					if (!part || typeof part !== "object" || !("type" in part)) {
						return false;
					}

					return String((part as { type?: string }).type ?? "").includes(
						"tool",
					);
				}),
			);

		if (
			hasRenderableAssistantAfterLastUser ||
			hasAssistantToolOutputAfterLastUser ||
			!hasAgentTrace ||
			lastFallbackMessageForUserIdRef.current === lastUserMessage.id
		) {
			return;
		}

		lastFallbackMessageForUserIdRef.current = lastUserMessage.id;
		setMessages((currentMessages) => [
			...currentMessages,
			{
				id: generateUUID(),
				role: "assistant",
				parts: [
					{
						type: "text",
						text: "Proses sudah selesai, tapi respons akhir tidak sempat tampil di chat. Coba generate ulang atau lanjutkan dari hasil workspace yang sudah dibuat.",
					},
				],
				metadata: {
					createdAt: new Date().toISOString(),
				},
			},
		]);
	}, [
		agentStream.steps.length,
		liveThinking.steps.length,
		messages,
		setMessages,
		status,
	]);

	useEffect(() => {
		if (status !== "streaming") {
			return;
		}

		const elapsedSinceLastChunk = Date.now() - lastChunkAt;
		const timer = window.setTimeout(
			() => {
				stop();
				setStreamError("Koneksi terhenti. Silakan coba lagi.");
				setAgentStream((current) => ({
					...current,
					status: "error",
					endedAt: Date.now(),
					error: "Koneksi terhenti. Silakan coba lagi.",
				}));
			},
			Math.max(0, streamStallTimeoutMs - elapsedSinceLastChunk),
		);

		return () => window.clearTimeout(timer);
	}, [lastChunkAt, setAgentStream, status, stop]);

	useEffect(() => {
		if (status !== "submitted" && status !== "streaming") {
			return;
		}

		const watchdog = window.setTimeout(() => {
			stop();
			setStreamError("Respons AI terlalu lama. Silakan kirim ulang pesan.");
			setAgentStream((current) => ({
				...current,
				status: "error",
				endedAt: Date.now(),
				error: "Stream watchdog triggered",
			}));
			setLiveThinking((current) => ({
				...current,
				enabled: false,
			}));
			console.warn("Stream watchdog triggered after 45s", {
				chatId: id,
				status,
				startedAt: statusResetAtRef.current,
			});
		}, streamWatchdogTimeoutMs);

		return () => window.clearTimeout(watchdog);
	}, [id, setAgentStream, setLiveThinking, status, stop]);

	function primeThinkingSurface({
		text,
		hasAttachment,
	}: {
		text: string;
		hasAttachment: boolean;
	}) {
		pendingTurnRef.current = {
			text,
			hasAttachment,
			startedAt: Date.now(),
		};
	}

	const searchParams = useSearchParams();
	const query = searchParams.get("query");

	const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
	const hasAppendedQueryRef = useRef(false);

	useEffect(() => {
		if (query && !(hasAppendedQuery || hasAppendedQueryRef.current)) {
			hasAppendedQueryRef.current = true;
			setHasAppendedQuery(true);
			primeThinkingSurface({
				text: query,
				hasAttachment: false,
			});
			sendMessage({
				role: "user" as const,
				parts: [{ type: "text", text: query }],
			});

			window.history.replaceState({}, "", `/chat/${id}`);
		}
	}, [query, sendMessage, hasAppendedQuery, id, primeThinkingSurface]);

	const { data: votes } = useSWR<Vote[]>(
		messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
		fetcher,
	);

	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
	const artifactUiState = useArtifactUiState();
	const isIdeArtifactLocked = artifactUiState?.uiState?.isIdeLocked ?? false;

	// Count user messages for contextual upgrade banner
	const userMessageCount = messages.filter((m) => m.role === "user").length;

	useAutoResume({
		autoResume,
		initialMessages: safeInitialMessages,
		resumeStream,
		setMessages,
	});

	useEffect(() => {
		if (isArtifactVisible) {
			setSidebarOpen(false);
			setSidebarOpenMobile(false);
		}
	}, [isArtifactVisible, setSidebarOpen, setSidebarOpenMobile]);

	const handleSuggestedPrompt = (prompt: string) => {
		setInput(prompt);
	};

	const handleRetry = () => {
		setStreamError(null);
		regenerate();
	};

	return (
		<>
			<Dialog
				onOpenChange={handleAnnouncementOpenChange}
				open={isAnnouncementOpen}
			>
				<DialogContent className="border-[#171717]/8 bg-[#f8f6f1] p-0 text-[#171717] shadow-[0_24px_70px_rgba(17,19,21,0.15)] dark:border-white/10 dark:bg-[#111315] dark:text-[#f3f4f1] sm:max-w-md sm:rounded-[28px]">
					<div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
						<div className="inline-flex items-center rounded-full border border-black/7 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6e69] shadow-[0_10px_24px_rgba(16,18,20,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#8f948e] dark:shadow-none">
							Chat update
						</div>
						<DialogHeader className="space-y-2 text-left">
							<DialogTitle className="text-[1.35rem] leading-tight tracking-[-0.03em] text-[#171717] dark:text-[#f3f4f1]">
								{chatAnnouncement?.title}
							</DialogTitle>
							<DialogDescription className="text-sm leading-6 text-[#5f6258] dark:text-[#9ea59f]">
								{chatAnnouncement?.message}
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-end">
							<Button
								className="rounded-full"
								onClick={() => handleAnnouncementOpenChange(false)}
								size="sm"
								type="button"
							>
								Got it
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex h-full min-w-0 flex-1 overflow-hidden">
				<div
					className={cn(
						"relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent text-[#171717] transition-all duration-300 ease-in-out dark:text-[#f3f4f1]",
						isArtifactVisible
							? isIdeArtifactLocked
								? "lg:w-[46%] lg:min-w-[46%] lg:shrink-0 lg:border-r lg:border-white/[0.05]"
								: "md:w-[320px] md:min-w-[320px] md:max-w-[320px] md:shrink-0 md:border-r md:border-white/[0.05]"
							: "w-full",
					)}
				>
					<div className="pointer-events-none absolute top-0 right-0 left-0 z-20">
						<div className="pointer-events-auto w-full">
							<ChatContextHeader
								chatId={id}
								isReadonly={isReadonly}
								selectedVisibilityType={initialVisibilityType}
								user={user}
							/>
						</div>
					</div>

					<div
						className={`relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden pt-20 sm:pt-[5.8rem] ${
							messages.length === 0 ? "items-center justify-center" : ""
						}`}
					>
						{messages.length > 0 && (
							<div className="flex flex-1 flex-col overflow-hidden px-2 pb-2 sm:px-4 sm:pb-4">
								<div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
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
										onSuggestedPrompt={handleSuggestedPrompt}
										streamError={streamError}
										onRetry={handleRetry}
									/>
								</div>
							</div>
						)}

						{messages.length === 0 && (
							<div className="flex w-full flex-1 items-center justify-center px-3 pb-4 sm:px-4">
								<div className="mx-auto w-full max-w-3xl">
									<Greeting onPromptSelect={handleSuggestedPrompt} />

									{isReadonly ? (
										<div className="mt-7 rounded-lg border border-dashed border-black/10 bg-white/45 px-6 py-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
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
										<div className="mt-7 rounded-lg border border-dashed border-black/10 bg-white/45 px-6 py-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
											<p className="text-sm font-medium text-[#171717] dark:text-[#f3f4f1]">
												Batas penggunaan tercapai untuk sementara.
											</p>
											<p className="mt-2 text-xs text-[#5f6258] dark:text-[#a6aca6]">
												Coba lagi nanti atau buka halaman paket untuk melihat
												opsi yang tersedia.
											</p>
											<div className="mt-4 flex justify-center">
												<Button asChild className="rounded-full" size="sm">
													<Link href="/plan">Lihat paket</Link>
												</Button>
											</div>
										</div>
									) : (
										<div className="mt-7">
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
												onWillSendMessage={primeThinkingSurface}
											/>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{messages.length > 0 && (
						<div className="relative z-10 w-full px-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-6">
							{/* Contextual Upgrade Banner */}
							{user?.type !== "pro" && (
								<ContextualUpgradeBanner
									messageCount={userMessageCount}
									isRateLimited={isRateLimited}
									userType={user?.type}
								/>
							)}
							<div className="min-w-0 w-full">
								{isReadonly ? (
									<div className="flex w-full items-center justify-center p-4">
										<div className="w-full max-w-3xl rounded-[30px] border border-dashed border-black/7 bg-white/52 p-6 text-center shadow-[0_18px_50px_rgba(18,20,22,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171b1f]/78 dark:shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
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
										<div className="w-full max-w-3xl rounded-[30px] border border-dashed border-black/7 bg-white/52 p-6 text-center shadow-[0_18px_50px_rgba(18,20,22,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171b1f]/78 dark:shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
											<p className="text-sm font-medium text-[#171717] dark:text-[#f3f4f1]">
												Batas penggunaan tercapai untuk sementara.
											</p>
											<p className="mb-2 text-xs text-[#5f6258] dark:text-[#a6aca6]">
												Coba lagi nanti atau buka halaman paket untuk melihat
												opsi yang tersedia.
											</p>
											<div className="flex gap-4">
												<Button asChild className="rounded-full" size="sm">
													<Link href="/plan">Lihat paket</Link>
												</Button>
											</div>
										</div>
									</div>
								) : (
									<div className="relative flex flex-col gap-2">
										<AgentDock stop={stop} />
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
											onWillSendMessage={primeThinkingSurface}
										/>
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
			</div>
		</>
	);
}
