"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
	chatModels,
	DEFAULT_CHAT_MODEL,
	modelsByProvider,
} from "@backend/ai/models";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
	CheckIcon,
	ChevronDownIcon,
	CpuIcon,
	FileTextIcon,
	ImageIcon,
	Paperclip,
	Wand2Icon,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
	type ChangeEvent,
	type Dispatch,
	memo,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	isFullstackModeInMaintenance,
	isMobileModeInMaintenance,
} from "@/lib/constants";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "./elements/prompt-input";
import { ArrowUpIcon, StopIcon } from "./icons";
import { ImageGenerationDialog } from "./image-generation-dialog";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "./ui/button";
import type { VisibilityType } from "./visibility-selector";

function setCookie(name: string, value: string) {
	const maxAge = 60 * 60 * 24 * 365; // 1 year
	// biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export interface MultimodalInputProps {
	chatId: string;
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	status: UseChatHelpers<ChatMessage>["status"];
	stop: () => void;
	attachments: Attachment[];
	setAttachments: Dispatch<SetStateAction<Attachment[]>>;
	messages: UIMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
	className?: string;
	selectedVisibilityType: VisibilityType;
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	wormgptEnabled: boolean;
	setWormgptEnabled: Dispatch<SetStateAction<boolean>>;
	deepThinkingEnabled: boolean;
	setDeepThinkingEnabled: Dispatch<SetStateAction<boolean>>;
	webSearchEnabled: boolean;
	setWebSearchEnabled: Dispatch<SetStateAction<boolean>>;
	fullstackModeEnabled: boolean;
	setFullstackModeEnabled: Dispatch<SetStateAction<boolean>>;
	mobileModeEnabled: boolean;
	setMobileModeEnabled: Dispatch<SetStateAction<boolean>>;
	user?: { type?: string; isPro?: boolean; role?: string };
	customModels?: Array<{ id: string; name: string; provider: string }>;
	onWillSendMessage?: (payload: {
		text: string;
		hasAttachment: boolean;
	}) => void;
}

function PureMultimodalInput({
	chatId,
	input,
	setInput,
	status,
	stop,
	attachments,
	setAttachments,
	setMessages,
	sendMessage,
	className,
	selectedVisibilityType,
	selectedModelId,
	onModelChange,
	wormgptEnabled,
	setWormgptEnabled,
	deepThinkingEnabled,
	setDeepThinkingEnabled,
	webSearchEnabled,
	setWebSearchEnabled,
	fullstackModeEnabled,
	setFullstackModeEnabled,
	mobileModeEnabled,
	setMobileModeEnabled,
	user,
	customModels,
	onWillSendMessage,
}: MultimodalInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { width } = useWindowSize();
	const [imageGenerationOpen, setImageGenerationOpen] = useState(false);
	const [imageGenerationMode, setImageGenerationMode] = useState(false);
	const inputDisabled = status === "submitted" || status === "streaming";

	// Grant image gen access to PRO users and admins
	const isPro =
		user?.type === "pro" || user?.isPro === true || user?.role === "admin";

	const adjustHeight = useCallback(() => {
		if (textareaRef.current) {
			// Temporarily set height to 0 to correctly calculate shrink
			textareaRef.current.style.height = "0px";
			const scrollHeight = textareaRef.current.scrollHeight;
			// Re-apply height based on scrollHeight, clamped for a Reagent-like compact composer
			textareaRef.current.style.height = `${Math.min(
				Math.max(scrollHeight, 16),
				144,
			)}px`;
		}
	}, []);

	useEffect(() => {
		if (textareaRef.current) {
			adjustHeight();
		}
	}, [adjustHeight]);

	const hasAutoFocused = useRef(false);
	useEffect(() => {
		if (!hasAutoFocused.current && width) {
			const timer = setTimeout(() => {
				textareaRef.current?.focus();
				hasAutoFocused.current = true;
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [width]);

	const resetHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "16px";
		}
	}, []);

	const [localStorageInput, setLocalStorageInput] = useLocalStorage(
		"input",
		"",
	);

	useEffect(() => {
		if (textareaRef.current) {
			const domValue = textareaRef.current.value;
			// Prefer DOM value over localStorage to handle hydration
			const finalValue = domValue || localStorageInput || "";
			setInput(finalValue);
			adjustHeight();
		}
		// Only run once after hydration
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adjustHeight, localStorageInput, setInput]);

	useEffect(() => {
		setLocalStorageInput(input);
	}, [input, setLocalStorageInput]);

	const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(event.target.value);
	};

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadQueue, setUploadQueue] = useState<string[]>([]);
	const activeModeCount = [
		deepThinkingEnabled,
		fullstackModeEnabled,
		mobileModeEnabled,
		imageGenerationMode,
	].filter(Boolean).length;

	const toggleFullstackMode = () => {
		if (isFullstackModeInMaintenance) {
			setFullstackModeEnabled(false);
			toast.error("Fullstack mode sedang maintenance sementara.");
			return;
		}

		setFullstackModeEnabled(!fullstackModeEnabled);
	};

	const toggleMobileMode = () => {
		if (isMobileModeInMaintenance) {
			setMobileModeEnabled(false);
			toast.error("Mobile Dev sedang maintenance sementara.");
			return;
		}

		setMobileModeEnabled(!mobileModeEnabled);
	};

	const submitForm = useCallback(async () => {
		window.history.pushState({}, "", `/chat/${chatId}`);

		if (imageGenerationMode) {
			const userMessageId = nanoid();
			const loadingMessageId = nanoid();
			const currentInput = input;

			// 1. Append user message
			setMessages((messages: ChatMessage[]) => [
				...messages,
				{
					id: userMessageId,
					role: "user",
					content: currentInput,
					parts: [{ type: "text", text: currentInput }],
				},
			]);

			// Handle UI reset
			setAttachments([]);
			setLocalStorageInput("");
			resetHeight();
			setInput("");
			setImageGenerationMode(false); // Disable image mode after use

			// 2. Append loading message
			setMessages((messages: ChatMessage[]) => [
				...messages,
				{
					id: loadingMessageId,
					role: "assistant",
					content: "Generating your image...",
					parts: [{ type: "text", text: "Generating your image..." }],
				},
			]);

			try {
				const res = await fetch("/api/generate-image", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt: currentInput,
						chatId,
						userMessageId,
						assistantMessageId: loadingMessageId,
						selectedVisibilityType,
					}),
				});

				if (!res.ok) {
					throw new Error("Failed to generate image");
				}

				const data = await res.json();
				const assistantMessage = data.assistantMessage;

				// 3. Replace loading message with image
				setMessages((messages: ChatMessage[]) =>
					messages.map((m: ChatMessage) =>
						m.id === loadingMessageId
							? {
									...m,
									role: assistantMessage?.role ?? m.role,
									parts: assistantMessage?.parts ?? [
										{
											type: "file",
											url: data.imageUrl,
											mediaType: "image/png",
											filename: `generated-image-${loadingMessageId}.png`,
										},
										{ type: "text", text: "Generated image" },
									],
								}
							: m,
					),
				);
			} catch (_error) {
				setMessages((messages: ChatMessage[]) =>
					messages.map((m: ChatMessage) =>
						m.id === loadingMessageId
							? {
									...m,
									content: "Failed to generate image. Please try again.",
									parts: [
										{
											type: "text",
											text: "Failed to generate image. Please try again.",
										},
									],
								}
							: m,
					),
				);
			}

			if (width && width > 768) {
				textareaRef.current?.focus();
			}
			return;
		}

		onWillSendMessage?.({
			text: input,
			hasAttachment: attachments.length > 0,
		});

		sendMessage({
			role: "user",
			parts: [
				...attachments.map((attachment) => ({
					type: "file" as const,
					url: attachment.url,
					name: attachment.name,
					mediaType: attachment.contentType,
				})),
				{
					type: "text",
					text: input,
				},
			],
		});
		setAttachments([]);
		setLocalStorageInput("");
		resetHeight();
		setInput("");

		if (width && width > 768) {
			textareaRef.current?.focus();
		}
	}, [
		input,
		setInput,
		attachments,
		sendMessage,
		setAttachments,
		setLocalStorageInput,
		width,
		chatId,
		resetHeight,
		imageGenerationMode,
		selectedVisibilityType,
		setMessages,
		onWillSendMessage,
	]);

	const uploadFile = useCallback(async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch("/api/files/upload", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				const { url, pathname, contentType } = data;

				return {
					url,
					name: pathname,
					contentType,
				};
			}
			const { error } = await response.json();
			toast.error(error);
		} catch (_error) {
			toast.error("Failed to upload file, please try again!");
		}
	}, []);

	// Check if model supports vision (images)
	const modelSupportsVision = useCallback((modelId: string): boolean => {
		const nonVisionModels: string[] = [
			"grok-4-1-fast-reasoning",
			"grok-4-1-reasoning",
			"grok-3",
			"grok-2",
			"grok-1",
			"reasoning",
			"thinking",
			"o1",
			"o3",
			"o4",
			"gemini-2.0-flash",
			"gemini-2.5-flash",
		];
		const normalizedId = modelId.toLowerCase();
		// Allow vision for maia/gemini models and vision-specific models
		if (
			normalizedId.includes("maia/gemini") ||
			normalizedId.includes("google/gemini-1.5") ||
			normalizedId.includes("google/gemini-pro") ||
			normalizedId.includes("vision") ||
			normalizedId.includes("claude")
		) {
			return true;
		}
		// Block for reasoning/thinking models and grok models
		return !nonVisionModels.some((m) => normalizedId.includes(m.toLowerCase()));
	}, []);

	const handleFileChange = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files || []);
			// Remove the blanket modelSupportsVision check for uploads
			// as it wrongfully blocks non-image files (PDFs, ZIP, TXT, PHP, etc)

			setUploadQueue(files.map((file) => file.name));

			try {
				const uploadPromises = files.map((file) => uploadFile(file));
				const uploadedAttachments = await Promise.all(uploadPromises);
				const successfullyUploadedAttachments = uploadedAttachments.filter(
					(attachment) => attachment !== undefined,
				);

				setAttachments((currentAttachments) => [
					...currentAttachments,
					...successfullyUploadedAttachments,
				]);
			} catch (error) {
				console.error("Error uploading files!", error);
			} finally {
				setUploadQueue([]);
			}
		},
		[setAttachments, uploadFile],
	);

	const handlePaste = useCallback(
		async (event: ClipboardEvent) => {
			// Check if model supports vision
			if (!modelSupportsVision(selectedModelId)) {
				toast.error(
					"Model ini tidak mendukung input gambar. Silakan pilih model lain.",
				);
				return;
			}

			const items = event.clipboardData?.items;
			if (!items) {
				return;
			}

			const imageItems = Array.from(items).filter((item) =>
				item.type.startsWith("image/"),
			);

			if (imageItems.length === 0) {
				return;
			}

			// Prevent default paste behavior for images
			event.preventDefault();

			setUploadQueue((prev) => [...prev, "Pasted image"]);

			try {
				const uploadPromises = imageItems
					.map((item) => item.getAsFile())
					.filter((file): file is File => file !== null)
					.map((file) => uploadFile(file));

				const uploadedAttachments = await Promise.all(uploadPromises);
				const successfullyUploadedAttachments = uploadedAttachments.filter(
					(attachment) =>
						attachment !== undefined &&
						attachment.url !== undefined &&
						attachment.contentType !== undefined,
				);

				setAttachments((curr) => [
					...curr,
					...(successfullyUploadedAttachments as Attachment[]),
				]);
			} catch (error) {
				console.error("Error uploading pasted images:", error);
				toast.error("Failed to upload pasted image(s)");
			} finally {
				setUploadQueue([]);
			}
		},
		[setAttachments, uploadFile, modelSupportsVision, selectedModelId],
	);

	// Add paste event listener to textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) {
			return;
		}

		textarea.addEventListener("paste", handlePaste);
		return () => textarea.removeEventListener("paste", handlePaste);
	}, [handlePaste]);

	return (
		<div
			className={cn(
				"relative mx-auto flex w-full max-w-[820px] shrink-0 flex-col px-6 pt-3 pb-6",
				className,
			)}
		>
			<input
				className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
				multiple
				onChange={handleFileChange}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			<PromptInput
				className="w-full rounded-[20px] border border-white/[0.08] bg-[#141518] p-0 text-white/85 outline-none transition-colors duration-150 hover:border-white/[0.12] focus-within:border-white/[0.15]"
				onSubmit={(event) => {
					event.preventDefault();
					if (!input.trim() && attachments.length === 0) {
						return;
					}
					if (inputDisabled) {
						toast.error("Please wait for the model to finish its response!");
					} else {
						submitForm();
					}
				}}
			>
				{(attachments.length > 0 || uploadQueue.length > 0) && (
					<div
						className="flex flex-row items-end gap-2 overflow-x-scroll"
						data-testid="attachments-preview"
					>
						{attachments.map((attachment) => (
							<PreviewAttachment
								attachment={attachment}
								key={attachment.url}
								onRemove={() => {
									setAttachments((currentAttachments) =>
										currentAttachments.filter((a) => a.url !== attachment.url),
									);
									if (fileInputRef.current) {
										fileInputRef.current.value = "";
									}
								}}
							/>
						))}

						{uploadQueue.map((filename) => (
							<PreviewAttachment
								attachment={{
									url: "",
									name: filename,
									contentType: "",
								}}
								isUploading={true}
								key={filename}
							/>
						))}
					</div>
				)}
					{activeModeCount > 0 ? (
						<div className="flex max-w-full flex-row gap-1.5 overflow-x-auto px-4 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							{deepThinkingEnabled ? (
								<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/55">
									<CpuIcon className="size-3" />
									Deep Thinking
								</span>
							) : null}
							{fullstackModeEnabled ? (
								<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/55">
									<FileTextIcon className="size-3" />
									Fullstack
								</span>
							) : null}
							{mobileModeEnabled ? (
								<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/55">
									<CheckIcon className="size-3" />
									Mobile Dev
								</span>
							) : null}
							{imageGenerationMode ? (
								<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/55">
									<Wand2Icon className="size-3" />
									Image Gen
								</span>
						) : null}
					</div>
				) : null}
						<div
							className={cn(
							"flex flex-row items-start px-5 pt-0 pb-0",
							inputDisabled && "opacity-70",
						)}
					>
						<PromptInputTextarea
							className="grow resize-none border-0! bg-transparent px-0 pt-5 pb-3 text-[14.5px] leading-relaxed text-white/80 outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-white/22 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
							data-testid="multimodal-input"
							disableAutoResize={true}
							disabled={inputDisabled}
							maxHeight={260}
							minHeight={64}
							onChange={handleInput}
							placeholder={
								inputDisabled
									? "Tunggu sampai respons selesai..."
									: "Ketik sesuatu..."
							}
						ref={textareaRef}
						rows={1}
						value={input}
					/>
				</div>
				<PromptInputToolbar className="relative flex items-center justify-between px-4 pt-1 pb-4">
					<PromptInputTools className="flex items-center gap-1">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent px-0 text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/55"
									data-testid="all-options-button"
									title="Tools"
									variant="ghost"
								>
									<Paperclip className="h-[14px] w-[14px]" />
								</Button>
							</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									className="w-56 rounded-xl border border-white/[0.08] bg-[#111111] text-white/75 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
								>
								{/* File Upload Options */}
								<DropdownMenuItem
										className="cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]"
										disabled={inputDisabled}
										onClick={() => fileInputRef.current?.click()}
									>
									<FileTextIcon className="mr-2 h-4 w-4" />
									<span>Upload files</span>
								</DropdownMenuItem>
								<DropdownMenuItem
										className="cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]"
										disabled={inputDisabled}
										onClick={() => {
											if (fileInputRef.current && !inputDisabled) {
											fileInputRef.current.accept = "image/*";
											fileInputRef.current.click();
											setTimeout(() => {
												if (fileInputRef.current) {
													fileInputRef.current.accept = "*/*";
												}
											}, 100);
										}
									}}
								>
									<ImageIcon className="mr-2 h-4 w-4" />
									<span>Photos</span>
								</DropdownMenuItem>

									<DropdownMenuSeparator className="bg-white/[0.08]" />
									<DropdownMenuItem
										className="cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]"
										onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
									>
									<CpuIcon className="mr-2 h-4 w-4" />
									<span>Deep Thinking</span>
									{deepThinkingEnabled ? (
											<CheckIcon className="ml-auto h-4 w-4 text-white/65" />
										) : null}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]"
										onClick={toggleFullstackMode}
									>
									<FileTextIcon className="mr-2 h-4 w-4" />
									<span>
										Fullstack Web
										{isFullstackModeInMaintenance ? " (Maintenance)" : ""}
									</span>
									{fullstackModeEnabled ? (
											<CheckIcon className="ml-auto h-4 w-4 text-white/65" />
										) : null}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]"
										onClick={toggleMobileMode}
									>
									<CheckIcon className="mr-2 h-4 w-4" />
									<span>
										Mobile Dev
										{isMobileModeInMaintenance ? " (Maintenance)" : ""}
									</span>
									{mobileModeEnabled ? (
											<CheckIcon className="ml-auto h-4 w-4 text-white/65" />
										) : null}
									</DropdownMenuItem>
									<DropdownMenuItem
										className={cn(
											"cursor-pointer rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.04]",
											!isPro && "cursor-not-allowed opacity-40",
										)}
									disabled={!isPro}
									onClick={() => {
										if (isPro) {
											setImageGenerationMode(!imageGenerationMode);
										}
									}}
								>
									<Wand2Icon className="mr-2 h-4 w-4" />
										<span>Image Gen (Pro)</span>
										{imageGenerationMode && (
											<CheckIcon className="ml-auto h-4 w-4 text-white/65" />
										)}
									</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<input
							accept="*/*"
							className="pointer-events-none fixed left-0 top-0 size-0.5 opacity-0"
							data-testid="file-input"
							multiple
							onChange={handleFileChange}
							ref={fileInputRef}
							type="file"
						/>
					</PromptInputTools>

					<div className="flex items-center gap-2">
						<ModelSelectorCompact
							onModelChange={onModelChange}
							selectedModelId={selectedModelId}
							user={user}
							customModels={customModels}
						/>

						{inputDisabled ? (
							<StopButton
								className="size-8 rounded-xl"
								setMessages={setMessages}
								stop={stop}
							/>
						) : (
							<PromptInputSubmit
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition-all",
										!input.trim() &&
										uploadQueue.length === 0 &&
										attachments.length === 0
											? "cursor-not-allowed bg-white/[0.05] text-white/18"
											: "bg-white text-black hover:bg-white/90",
									)}
								data-testid="send-button"
								disabled={
									!input.trim() &&
									uploadQueue.length === 0 &&
									attachments.length === 0
								}
								status={status}
							>
								<ArrowUpIcon size={14} />
							</PromptInputSubmit>
						)}
					</div>
				</PromptInputToolbar>
			</PromptInput>

			<p className="mx-auto mt-3 max-w-xl text-center text-[11px] text-white/18">
				Ultramaxo dapat membuat kesalahan. Verifikasi informasi penting sebelum
				digunakan.
			</p>

			<ImageGenerationDialog
				onClose={() => setImageGenerationOpen(false)}
				open={imageGenerationOpen}
			/>
		</div>
	);
}

export const MultimodalInput = memo(
	PureMultimodalInput,
	(prevProps, nextProps) => {
		if (prevProps.input !== nextProps.input) {
			return false;
		}
		if (prevProps.status !== nextProps.status) {
			return false;
		}
		if (!equal(prevProps.attachments, nextProps.attachments)) {
			return false;
		}
		if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
			return false;
		}
		if (prevProps.selectedModelId !== nextProps.selectedModelId) {
			return false;
		}
		if (prevProps.wormgptEnabled !== nextProps.wormgptEnabled) {
			return false;
		}
		if (prevProps.deepThinkingEnabled !== nextProps.deepThinkingEnabled) {
			return false;
		}
		if (prevProps.webSearchEnabled !== nextProps.webSearchEnabled) {
			return false;
		}
		if (prevProps.fullstackModeEnabled !== nextProps.fullstackModeEnabled) {
			return false;
		}
		if (prevProps.mobileModeEnabled !== nextProps.mobileModeEnabled) {
			return false;
		}

		return true;
	},
);

function PureModelSelectorCompact({
	selectedModelId,
	onModelChange,
	user,
	customModels,
}: {
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	user?: { type?: string; isPro?: boolean; role?: string };
	customModels?: Array<{ id: string; name: string; provider: string }>;
}) {
	const [open, setOpen] = useState(false);
	const isPro =
		user?.type === "pro" || user?.isPro === true || user?.role === "admin";

	const isProRestrictedModel = useCallback(
		(modelId: string, modelName?: string) =>
			modelId === "ultramaxo/ultra-agent-pro" ||
			modelId === "openai/gpt-5.4-mini" ||
			modelId.endsWith("-pro") ||
			Boolean(modelName?.includes("Pro")),
		[],
	);

	const fallbackModel =
		chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ?? chatModels[0];

	const rawSelectedModel =
		chatModels.find((m) => m.id === selectedModelId) ??
		customModels?.find((m) => m.id === selectedModelId) ??
		fallbackModel;

	const selectedModel =
		!isPro && isProRestrictedModel(rawSelectedModel.id, rawSelectedModel.name)
			? fallbackModel
			: rawSelectedModel;

	// Provider display names
	const providerNames: Record<string, string> = {
		anthropic: "Anthropic",
		openai: "OpenAI",
		google: "Google",
		xai: "xAI",
		reasoning: "Reasoning",
		groq: "",
	};

	const selectModel = (modelId: string, locked?: boolean) => {
		if (locked) {
			toast.error("Upgrade to Pro to access UltraAgent Pro");
			return;
		}

		onModelChange?.(modelId);
		setCookie("chat-model", modelId);
		setOpen(false);
	};

	useEffect(() => {
		if (
			!isPro &&
			rawSelectedModel &&
			isProRestrictedModel(rawSelectedModel.id, rawSelectedModel.name)
		) {
			onModelChange?.(fallbackModel.id);
			setCookie("chat-model", fallbackModel.id);
		}
	}, [
		fallbackModel.id,
		isPro,
		isProRestrictedModel,
		onModelChange,
		rawSelectedModel,
	]);

		return (
			<DropdownMenu onOpenChange={setOpen} open={open}>
				<DropdownMenuTrigger asChild>
					<Button
						className="h-8 min-w-[9rem] max-w-[14rem] justify-between gap-1.5 rounded-xl border border-transparent bg-transparent px-3 text-[12.5px] font-medium text-white/30 shadow-none transition-all hover:bg-white/[0.05] hover:text-white/60"
						variant="ghost"
					>
						<div className="flex min-w-0 items-center gap-2">
							<div className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/28" />
							<span className="truncate text-left text-[12.5px] font-medium">
								{selectedModel.name}
							</span>
						</div>
					<ChevronDownIcon
						className={cn(
							"size-3.5 shrink-0 text-white/30 transition-transform duration-200",
							open && "rotate-180",
						)}
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[20rem] rounded-lg border border-[#171717]/8 bg-white/98 p-1.5 text-[#171717] shadow-[0_14px_34px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-[#16171b]/98 dark:text-[#d9ddd8] dark:shadow-[0_18px_48px_rgba(0,0,0,0.42)]"
				sideOffset={10}
			>
				<div className="px-3 pb-2 pt-2">
					<div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#7d847f]">
						Models
					</div>
					<div className="mt-1 text-[12px] text-[#5f6258] dark:text-[#9da39e]">
						Switch model directly from the composer
					</div>
				</div>

				{customModels && customModels.length > 0 && (
					<>
						<div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#6f7671]">
							My Custom Models
						</div>
						{customModels.map((model) => (
							<DropdownMenuItem
								className="min-h-11 rounded-xl px-3 py-2 text-[#171717] hover:bg-black/5 focus:bg-black/5 dark:text-[#e6e9e3] dark:hover:bg-white/6 dark:focus:bg-white/6"
								key={model.id}
								onSelect={() => selectModel(model.id)}
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<div className="flex size-7 items-center justify-center rounded-md bg-black/5 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/8">
										<ModelSelectorLogo
											className="size-3.5 dark:invert-0"
											provider={model.provider}
										/>
									</div>
									<div className="min-w-0">
										<div className="truncate text-[13px] font-medium">
											{model.name}
										</div>
										<div className="truncate text-[11px] text-[#5f6258] dark:text-[#7f8781]">
											Custom
										</div>
									</div>
								</div>
								{model.id === selectedModelId && (
									<CheckIcon className="ml-3 size-4 text-[#171717] dark:text-[#f3f4f1]" />
								)}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator className="my-1 bg-black/5 dark:bg-white/8" />
					</>
				)}

				<div className="max-h-88 overflow-y-auto pr-1">
					{Object.entries(modelsByProvider).map(
						([providerKey, providerModels]) => (
							<div key={providerKey}>
								<div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#6f7671]">
									{providerNames[providerKey] ?? providerKey}
								</div>
								{providerModels.map((model) => {
									const logoProvider = model.id.split("/")[0];
									const isProModel = isProRestrictedModel(model.id, model.name);
									const isLocked = isProModel && !isPro;

									return (
										<DropdownMenuItem
											className={cn(
												"min-h-11 rounded-xl px-3 py-2 text-[#171717] hover:bg-black/5 focus:bg-black/5 dark:text-[#e6e9e3] dark:hover:bg-white/6 dark:focus:bg-white/6",
												isLocked && "opacity-60",
											)}
											key={model.id}
											onSelect={() => selectModel(model.id, isLocked)}
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<div className="flex size-7 items-center justify-center rounded-md bg-black/5 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/8">
													<ModelSelectorLogo
														className="size-3.5 dark:invert-0"
														provider={logoProvider}
													/>
												</div>
												<div className="min-w-0">
													<div className="flex items-center gap-2">
														<span className="truncate text-[13px] font-medium">
															{model.name}
														</span>
														{isProModel && (
															<span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5f6258] dark:bg-white/7 dark:text-[#d8dcd5]">
																Pro
															</span>
														)}
													</div>
													<div className="truncate text-[11px] text-[#5f6258] dark:text-[#7f8781]">
														{providerNames[providerKey] ?? providerKey}
													</div>
												</div>
											</div>
											{isLocked ? (
												<span className="ml-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#8d7462]">
													Locked
												</span>
											) : model.id === selectedModelId ? (
												<CheckIcon className="ml-3 size-4 text-[#171717] dark:text-[#f3f4f1]" />
											) : null}
										</DropdownMenuItem>
									);
								})}
							</div>
						),
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
	stop,
	setMessages,
	className,
}: {
	stop: () => void;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	className?: string;
}) {
	return (
		<Button
			className={cn(
				"size-7 rounded-lg bg-white p-1 text-black transition-colors duration-200 hover:bg-white/90 disabled:bg-white/8 disabled:text-white/25",
				className,
			)}
			data-testid="stop-button"
			onClick={(event) => {
				event.preventDefault();
				stop();
				setMessages((messages: ChatMessage[]) => messages);
			}}
			type="button"
		>
			<StopIcon size={14} />
		</Button>
	);
}

const StopButton = memo(PureStopButton);
