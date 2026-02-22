"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
	CheckIcon,
	CpuIcon,
	FileTextIcon,
	GlobeIcon,
	ImageIcon,
	PlusIcon,
	SparklesIcon,
	Wand2Icon,
	XIcon,
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
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorName,
	ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	chatModels,
	DEFAULT_CHAT_MODEL,
	modelsByProvider,
} from "@/lib/ai/models";
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
	user?: { type?: string; isPro?: boolean };
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
}: MultimodalInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { width } = useWindowSize();
	const [imageGenerationOpen, setImageGenerationOpen] = useState(false);
	const [imageGenerationMode, setImageGenerationMode] = useState(false);

	// Grant image gen access to PRO users and admins
	const isPro =
		(user as any)?.type === "pro" ||
		(user as any)?.isPro === true ||
		(user as any)?.role === "admin";

	const adjustHeight = useCallback(() => {
		if (textareaRef.current) {
			// Temporarily set height to 0 to correctly calculate shrink
			textareaRef.current.style.height = "0px";
			const scrollHeight = textareaRef.current.scrollHeight;
			// Re-apply height based on scrollHeight, clamped between 20px and 200px
			textareaRef.current.style.height = `${Math.min(
				Math.max(scrollHeight, 20),
				200,
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
			textareaRef.current.style.height = "20px";
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

	const submitForm = useCallback(async () => {
		window.history.pushState({}, "", `/chat/${chatId}`);

		if (imageGenerationMode) {
			const userMessageId = nanoid();
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
			const loadingMessageId = nanoid();
			setMessages((messages: ChatMessage[]) => [
				...messages,
				{
					id: loadingMessageId,
					role: "assistant",
					content: "Generating your image... 🎨",
					parts: [{ type: "text", text: "Generating your image... 🎨" }],
				},
			]);

			try {
				const res = await fetch("/api/generate-image", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ prompt: currentInput }),
				});

				if (!res.ok) {
					throw new Error("Failed to generate image");
				}

				const data = await res.json();

				// 3. Replace loading message with image
				setMessages((messages: ChatMessage[]) =>
					messages.map((m: ChatMessage) =>
						m.id === loadingMessageId
							? {
									...m,
									content: `![Generated Image](${data.imageUrl})`,
									parts: [
										{
											type: "text",
											text: `![Generated Image](${data.imageUrl})`,
										},
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
									content: "❌ Failed to generate image. Please try again.",
									parts: [
										{
											type: "text",
											text: "❌ Failed to generate image. Please try again.",
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
		setMessages,
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

	const handleFileChange = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files || []);

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
		[setAttachments, uploadFile],
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
		<div className={cn("relative flex w-full flex-col gap-4", className)}>
			<input
				className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
				multiple
				onChange={handleFileChange}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			<PromptInput
				className="mx-auto w-full max-w-[768px] rounded-[32px] bg-[#1a1a1a] border border-white/5 p-2 shadow-2xl transition-all duration-200 focus-within:ring-1 focus-within:ring-white/10"
				onSubmit={(event) => {
					event.preventDefault();
					if (!input.trim() && attachments.length === 0) {
						return;
					}
					if (status !== "ready") {
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
				{/* Active Mode Chips — like Gemini */}
				{(imageGenerationMode ||
					wormgptEnabled ||
					deepThinkingEnabled ||
					webSearchEnabled ||
					fullstackModeEnabled ||
					mobileModeEnabled) && (
					<div className="flex flex-row flex-wrap gap-1.5 px-2 pt-2">
						{imageGenerationMode && (
							<span className="flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-[11px] font-bold text-violet-400">
								<Wand2Icon className="size-3" />
								Image
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-violet-500/30 transition-colors"
									onClick={() => setImageGenerationMode(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
						{wormgptEnabled && (
							<span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
								<SparklesIcon className="size-3" />
								WormGPT
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-red-500/30 transition-colors"
									onClick={() => setWormgptEnabled(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
						{deepThinkingEnabled && (
							<span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-400">
								<CpuIcon className="size-3" />
								Deep Thinking
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-blue-500/30 transition-colors"
									onClick={() => setDeepThinkingEnabled(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
						{webSearchEnabled && (
							<span className="flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 text-[11px] font-bold text-green-400">
								<GlobeIcon className="size-3" />
								Web Search
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-green-500/30 transition-colors"
									onClick={() => setWebSearchEnabled(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
						{fullstackModeEnabled && (
							<span className="flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[11px] font-bold text-orange-400">
								<FileTextIcon className="size-3" />
								Fullstack
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-orange-500/30 transition-colors"
									onClick={() => setFullstackModeEnabled(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
						{mobileModeEnabled && (
							<span className="flex items-center gap-1 rounded-full bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 text-[11px] font-bold text-pink-400">
								<CheckIcon className="size-3" />
								Mobile Dev
								<button
									className="ml-1 rounded-full p-0.5 hover:bg-pink-500/30 transition-colors"
									onClick={() => setMobileModeEnabled(false)}
									type="button"
								>
									<XIcon className="size-3.5" />
								</button>
							</span>
						)}
					</div>
				)}
				<div className="flex flex-row items-start px-3 pt-2 pb-0">
					<PromptInputTextarea
						className="grow resize-none border-0! bg-transparent px-1 py-0 text-base leading-relaxed text-zinc-100 outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
						data-testid="multimodal-input"
						disableAutoResize={true}
						maxHeight={200}
						minHeight={20}
						onChange={handleInput}
						placeholder="Send a message..."
						ref={textareaRef}
						rows={1}
						value={input}
					/>
				</div>
				<PromptInputToolbar className="flex items-center justify-between px-3 pb-2 pt-1 relative">
					<PromptInputTools className="flex items-center gap-1.5">
						{/* Dropdown Menu All-in-One - + Icon */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="size-9 rounded-full p-2 transition-colors hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
									data-testid="all-options-button"
									title="Options"
									variant="ghost"
								>
									<PlusIcon size={18} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="w-56 bg-[#1a1a1a] border-white/10 rounded-xl shadow-lg text-zinc-300"
							>
								{/* File Upload Options */}
								<DropdownMenuItem
									className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10"
									disabled={status !== "ready"}
									onClick={() => fileInputRef.current?.click()}
								>
									<FileTextIcon className="mr-2 h-4 w-4" />
									<span>Upload files</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10"
									disabled={status !== "ready"}
									onClick={() => {
										if (fileInputRef.current && status === "ready") {
											fileInputRef.current.accept = "image/*";
											fileInputRef.current.click();
											setTimeout(() => {
												if (fileInputRef.current) {
													fileInputRef.current.accept =
														"image/*,text/plain,application/pdf,application/json";
												}
											}, 100);
										}
									}}
								>
									<ImageIcon className="mr-2 h-4 w-4" />
									<span>Photos</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator className="bg-white/10" />

								{/* Mode Settings */}
								<DropdownMenuItem
									className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10"
									onClick={() => setWormgptEnabled(!wormgptEnabled)}
								>
									<SparklesIcon
										className={cn(
											"mr-2 h-4 w-4",
											wormgptEnabled && "fill-current text-red-500",
										)}
									/>
									<span>WormGPT Mode</span>
									{wormgptEnabled && (
										<CheckIcon className="ml-auto h-4 w-4 text-red-500" />
									)}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10"
									onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
								>
									<CpuIcon className="mr-2 h-4 w-4" />
									<span>Deep Thinking</span>
									{deepThinkingEnabled && (
										<CheckIcon className="ml-auto h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-not-allowed opacity-50 rounded-lg"
									disabled
								>
									<FileTextIcon className="mr-2 h-4 w-4" />
									<span>Fullstack Web</span>
									<span className="ml-auto text-[10px] font-medium text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
										Maintenance
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-not-allowed opacity-50 rounded-lg"
									disabled
								>
									<CheckIcon className="mr-2 h-4 w-4" />
									<span>Mobile Dev</span>
									<span className="ml-auto text-[10px] font-medium text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
										Maintenance
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className={cn(
										"cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10",
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
										<CheckIcon className="ml-auto h-4 w-4 text-purple-500" />
									)}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Globe Button for Web Search Mode */}
						<Button
							className={cn(
								"size-9 rounded-full p-2 transition-colors",
								webSearchEnabled
									? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
									: "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200",
							)}
							onClick={() => setWebSearchEnabled(!webSearchEnabled)}
							title="Web Search"
							type="button"
							variant="ghost"
						>
							<GlobeIcon size={18} />
						</Button>

						<input
							accept="image/*,text/plain,application/pdf,application/json"
							className="pointer-events-none fixed left-0 top-0 size-0.5 opacity-0"
							data-testid="file-input"
							multiple
							onChange={handleFileChange}
							ref={fileInputRef}
							type="file"
						/>
					</PromptInputTools>

					{/* Right side: Model Selector + Submit */}
					<div className="flex items-center gap-2">
						<div className="bg-[#2a2a2a] rounded-full px-2 py-0.5 flex items-center h-9 text-sm text-zinc-300">
							<ModelSelectorCompact
								onModelChange={onModelChange}
								selectedModelId={selectedModelId}
								user={user}
							/>
						</div>

						{status === "submitted" ? (
							<StopButton
								className="size-9"
								setMessages={setMessages}
								stop={stop}
							/>
						) : (
							<PromptInputSubmit
								className={cn(
									"size-9 rounded-full transition-all duration-200 flex items-center justify-center",
									!input.trim() &&
										uploadQueue.length === 0 &&
										attachments.length === 0
										? "bg-[#2a2a2a] text-zinc-500"
										: "bg-white text-black hover:bg-zinc-200",
								)}
								data-testid="send-button"
								disabled={
									!input.trim() &&
									uploadQueue.length === 0 &&
									attachments.length === 0
								}
								status={status}
							>
								<ArrowUpIcon size={18} />
							</PromptInputSubmit>
						)}
					</div>
				</PromptInputToolbar>
			</PromptInput>

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
}: {
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	user?: { type?: string };
}) {
	const [open, setOpen] = useState(false);
	const isPro = user?.type === "pro";

	// Debug logging - COMPREHENSIVE
	console.log("=== MODEL SELECTOR DEBUG ===");
	console.log("Full User Object:", JSON.stringify(user, null, 2));
	console.log("User Type:", user?.type);
	console.log("Is Pro?:", isPro);
	console.log(
		"All Available Models:",
		chatModels.map((m) => m.name),
	);
	console.log("===========================");

	const selectedModel =
		chatModels.find((m) => m.id === selectedModelId) ??
		chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
		chatModels[0];
	const [provider] = selectedModel.id.split("/");

	// Provider display names
	const providerNames: Record<string, string> = {
		anthropic: "Anthropic",
		openai: "OpenAI",
		google: "Google",
		xai: "xAI",
		reasoning: "Reasoning",
		groq: "",
	};

	return (
		<ModelSelector onOpenChange={setOpen} open={open}>
			<ModelSelectorTrigger asChild>
				<Button
					className="h-8 w-[200px] justify-between px-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
					variant="ghost"
				>
					{provider && <ModelSelectorLogo provider={provider} />}
					<ModelSelectorName>{selectedModel.name}</ModelSelectorName>
				</Button>
			</ModelSelectorTrigger>
			<ModelSelectorContent>
				<ModelSelectorInput placeholder="Search models..." />
				<ModelSelectorList>
					{Object.entries(modelsByProvider).map(
						([providerKey, providerModels]) => (
							<ModelSelectorGroup
								heading={providerNames[providerKey] ?? providerKey}
								key={providerKey}
							>
								{providerModels.map((model) => {
									const logoProvider = model.id.split("/")[0];
									const isProModel = model.name.includes("Pro");
									const isLocked = isProModel && !isPro;

									return (
										<ModelSelectorItem
											className={isLocked ? "opacity-60" : ""}
											key={model.id}
											onSelect={() => {
												if (isLocked) {
													toast.error(
														"Upgrade to Pro to access UltraAgent Pro",
													);
													return;
												}
												onModelChange?.(model.id);
												setCookie("chat-model", model.id);
												setOpen(false);
											}}
											value={model.id}
										>
											<ModelSelectorLogo provider={logoProvider} />
											<ModelSelectorName>
												{model.name}
												{isProModel && (
													<span className="ml-2 text-xs font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
														PRO
													</span>
												)}
											</ModelSelectorName>
											{isLocked && (
												<span className="ml-auto text-xs text-zinc-500">
													🔒
												</span>
											)}
											{model.id === selectedModel.id && !isLocked && (
												<CheckIcon className="ml-auto size-4" />
											)}
										</ModelSelectorItem>
									);
								})}
							</ModelSelectorGroup>
						),
					)}
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
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
				"size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground",
				className,
			)}
			data-testid="stop-button"
			onClick={(event) => {
				event.preventDefault();
				stop();
				setMessages((messages: ChatMessage[]) => messages);
			}}
		>
			<StopIcon size={14} />
		</Button>
	);
}

const StopButton = memo(PureStopButton);
