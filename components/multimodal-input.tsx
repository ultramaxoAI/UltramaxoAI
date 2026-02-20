"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  CheckIcon,
  CodeIcon,
  CpuIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  ImageIcon,
  PlusIcon,
  SparklesIcon,
  Wand2Icon,
  XIcon,
} from "lucide-react";
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
      textareaRef.current.style.height = "44px";
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
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
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

  const submitForm = useCallback(() => {
    window.history.pushState({}, "", `/chat/${chatId}`);

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
          (attachment) => attachment !== undefined
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
    [setAttachments, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
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
            attachment.contentType !== undefined
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
    [setAttachments, uploadFile]
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
        className="rounded-3xl border border-zinc-300 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-sm p-3 shadow-lg shadow-black/10 transition-all duration-200 focus-within:border-purple-500/50 focus-within:shadow-purple-500/20 hover:border-zinc-400 dark:hover:border-zinc-600"
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
                    currentAttachments.filter((a) => a.url !== attachment.url)
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
          webSearchEnabled) && (
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
          </div>
        )}
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-base outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={200}
            minHeight={44}
            onChange={handleInput}
            placeholder="Send a message..."
            ref={textareaRef}
            rows={1}
            value={input}
          />
        </div>
        <PromptInputToolbar className="border-top-0! border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            {/* Dropdown Menu All-in-One - Kiri (Gemini Style) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="size-8 rounded-lg p-1.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  data-testid="all-options-button"
                  title="Options"
                  variant="ghost"
                >
                  <PlusIcon className="text-muted-foreground" size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
              >
                {/* Mode Settings */}
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800"
                  onClick={() => setWormgptEnabled(!wormgptEnabled)}
                >
                  <SparklesIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      wormgptEnabled && "fill-current"
                    )}
                  />
                  <span>WormGPT Mode</span>
                  {wormgptEnabled && <CheckIcon className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800"
                  onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                >
                  <CpuIcon className="mr-2 h-4 w-4" />
                  <span>Deep Thinking</span>
                  {deepThinkingEnabled && (
                    <CheckIcon className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                >
                  <GlobeIcon className="mr-2 h-4 w-4" />
                  <span>Web Search</span>
                  {webSearchEnabled && (
                    <CheckIcon className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800",
                    !isPro && "cursor-not-allowed opacity-40"
                  )}
                  disabled={!isPro}
                  onClick={() => {
                    if (isPro) setImageGenerationMode(!imageGenerationMode);
                  }}
                >
                  <Wand2Icon className="mr-2 h-4 w-4" />
                  <span>Image Generation</span>
                  {imageGenerationMode && (
                    <CheckIcon className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />

                {/* File Upload Options */}
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800"
                  disabled={status !== "ready"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  <span>Upload files</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-200 dark:focus:bg-zinc-800"
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
                <DropdownMenuItem className="opacity-50" disabled>
                  <FolderIcon className="mr-2 h-4 w-4" />
                  <span>Add from Drive</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-50" disabled>
                  <CodeIcon className="mr-2 h-4 w-4" />
                  <span>Import code</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Model Selector - Samping Kanan + */}
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
              user={user}
            />

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

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
            >
              <ArrowUpIcon size={14} />
            </PromptInputSubmit>
          )}
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

    return true;
  }
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
    chatModels.map((m) => m.name)
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
                            "Upgrade to Pro to access UltraAgent Pro"
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
            )
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
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
