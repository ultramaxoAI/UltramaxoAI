import type { UseChatHelpers } from "@ai-sdk/react";
import type { Document, Vote } from "@backend/db/schema";
import { formatDistance } from "date-fns";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import {
	type Dispatch,
	memo,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback, useWindowSize } from "usehooks-ts";
import { codeArtifact } from "@/artifacts/code/client";
import { imageArtifact } from "@/artifacts/image/client";
import { sheetArtifact } from "@/artifacts/sheet/client";
import { textArtifact } from "@/artifacts/text/client";
import {
	initialArtifactData,
	useArtifact,
	useArtifactUiState,
} from "@/hooks/use-artifact";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn, fetcher } from "@/lib/utils";
import { ArtifactActions } from "./artifact-actions";
import { ArtifactShareButton } from "./artifact-share-button";
import { Toolbar } from "./toolbar";
import { VersionFooter } from "./version-footer";
import type { VisibilityType } from "./visibility-selector";

export const artifactDefinitions = [
	textArtifact,
	codeArtifact,
	imageArtifact,
	sheetArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]["kind"];

export type UIArtifact = {
	title: string;
	documentId: string;
	kind: ArtifactKind;
	content: string;
	isVisible: boolean;
	status: "streaming" | "idle";
	boundingBox: {
		top: number;
		left: number;
		width: number;
		height: number;
	};
};

function PureArtifact({
	addToolApprovalResponse,
	chatId,
	input,
	setInput,
	status,
	stop,
	attachments,
	setAttachments,
	sendMessage,
	messages,
	setMessages,
	regenerate,
	votes,
	isReadonly,
	selectedVisibilityType,
	selectedModelId,
	wormgptEnabled,
	setWormgptEnabled,
	deepThinkingEnabled,
	setDeepThinkingEnabled,
	webSearchEnabled,
	setWebSearchEnabled,
}: {
	addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
	chatId: string;
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	status: UseChatHelpers<ChatMessage>["status"];
	stop: UseChatHelpers<ChatMessage>["stop"];
	attachments: Attachment[];
	setAttachments: Dispatch<SetStateAction<Attachment[]>>;
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	votes: Vote[] | undefined;
	sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	isReadonly: boolean;
	selectedVisibilityType: VisibilityType;
	selectedModelId: string;
	wormgptEnabled: boolean;
	setWormgptEnabled: Dispatch<SetStateAction<boolean>>;
	deepThinkingEnabled: boolean;
	setDeepThinkingEnabled: Dispatch<SetStateAction<boolean>>;
	webSearchEnabled: boolean;
	setWebSearchEnabled: Dispatch<SetStateAction<boolean>>;
}) {
	const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
	const artifactUiState = useArtifactUiState();
	const isIdeLocked = artifactUiState?.uiState?.isIdeLocked ?? false;
	const safeArtifact = artifact ?? initialArtifactData;

	const {
		data: documents,
		isLoading: isDocumentsFetching,
		mutate: mutateDocuments,
	} = useSWR<Document[]>(
		safeArtifact.documentId !== "init" && safeArtifact.status !== "streaming"
			? `/api/document?id=${safeArtifact.documentId}`
			: null,
		fetcher,
	);

	const [mode, setMode] = useState<"edit" | "diff">("edit");
	const [document, setDocument] = useState<Document | null>(null);
	const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

	useEffect(() => {
		if (documents && documents.length > 0) {
			const mostRecentDocument = documents.at(-1);

			if (mostRecentDocument) {
				setDocument(mostRecentDocument);
				setCurrentVersionIndex(documents.length - 1);
				setArtifact((currentArtifact) => {
					const currentContent = currentArtifact?.content ?? "";
					const nextContent = mostRecentDocument.content ?? "";

					if (currentContent.trim().length > nextContent.trim().length) {
						return currentArtifact;
					}

					return {
						...currentArtifact,
						content: nextContent,
					};
				});
			}
		}
	}, [documents, setArtifact]);

	useEffect(() => {
		mutateDocuments();
	}, [mutateDocuments]);

	const { mutate } = useSWRConfig();
	const [isContentDirty, setIsContentDirty] = useState(false);

	const handleContentChange = useCallback(
		(updatedContent: string) => {
			if (!artifact) {
				return;
			}

			mutate<Document[]>(
				`/api/document?id=${artifact.documentId}`,
				async (currentDocuments) => {
					if (!currentDocuments) {
						return [];
					}

					const currentDocument = currentDocuments.at(-1);

					if (!currentDocument || !currentDocument.content) {
						setIsContentDirty(false);
						return currentDocuments;
					}

					if (currentDocument.content !== updatedContent) {
						await fetch(`/api/document?id=${artifact.documentId}`, {
							method: "POST",
							body: JSON.stringify({
								title: artifact.title,
								content: updatedContent,
								kind: artifact.kind,
							}),
						});

						setIsContentDirty(false);

						const newDocument = {
							...currentDocument,
							content: updatedContent,
							createdAt: new Date(),
						};

						return [...currentDocuments, newDocument];
					}
					return currentDocuments;
				},
				{ revalidate: false },
			);
		},
		[artifact, mutate],
	);

	const debouncedHandleContentChange = useDebounceCallback(
		handleContentChange,
		2000,
	);

	const saveContent = useCallback(
		(updatedContent: string, debounce: boolean) => {
			if (document && updatedContent !== document.content) {
				setIsContentDirty(true);

				if (debounce) {
					debouncedHandleContentChange(updatedContent);
				} else {
					handleContentChange(updatedContent);
				}
			}
		},
		[document, debouncedHandleContentChange, handleContentChange],
	);

	function getDocumentContentById(index: number) {
		if (!documents) {
			return "";
		}
		if (!documents[index]) {
			return "";
		}
		return documents[index].content ?? "";
	}

	const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
		if (!documents) {
			return;
		}

		if (type === "latest") {
			setCurrentVersionIndex(documents.length - 1);
			setMode("edit");
		}

		if (type === "toggle") {
			setMode((currentMode) => (currentMode === "edit" ? "diff" : "edit"));
		}

		if (type === "prev") {
			if (currentVersionIndex > 0) {
				setCurrentVersionIndex((index) => index - 1);
			}
		} else if (type === "next" && currentVersionIndex < documents.length - 1) {
			setCurrentVersionIndex((index) => index + 1);
		}
	};

	const [isToolbarVisible, setIsToolbarVisible] = useState(false);

	/*
	 * NOTE: if there are no documents, or if
	 * the documents are being fetched, then
	 * we mark it as the current version.
	 */

	const isCurrentVersion =
		documents && documents.length > 0
			? currentVersionIndex === documents.length - 1
			: true;

	const { width: windowWidth, height: windowHeight } = useWindowSize();
	const isMobile = windowWidth ? windowWidth < 768 : false;
	const artifactLanguage =
		safeArtifact.kind === "code" ? "code" : safeArtifact.kind || "text";
	const closeArtifact = useCallback(() => {
		setArtifact((currentArtifact) =>
			currentArtifact.status === "streaming"
				? {
						...currentArtifact,
						isVisible: false,
					}
				: { ...initialArtifactData, status: "idle" },
		);
	}, [setArtifact]);

	const artifactDefinition = artifactDefinitions.find(
		(definition) => definition.kind === safeArtifact.kind,
	);

	if (!artifactDefinition) {
		return null;
	}

	useEffect(() => {
		if (
			safeArtifact.documentId !== "init" &&
			artifactDefinition.initialize
		) {
			artifactDefinition.initialize({
				documentId: safeArtifact.documentId,
				setMetadata,
			});
		}
	}, [safeArtifact.documentId, artifactDefinition, setMetadata]);

	if (!artifact) {
		return null;
	}

	if (
		!safeArtifact.content &&
		safeArtifact.status !== "streaming" &&
		safeArtifact.documentId === "init" &&
		!safeArtifact.isVisible
	) {
		return null;
	}

	return (
		<AnimatePresence>
			{safeArtifact.isVisible && (
				<motion.div
					animate={{ opacity: 1 }}
					className={cn(
						"fixed inset-0 z-50 flex h-dvh w-dvw flex-row pointer-events-none md:relative md:inset-auto md:z-10 md:h-full md:w-full md:min-w-0 md:flex-1",
						isIdeLocked
							? "bg-transparent backdrop-blur-0"
							: "bg-black/30 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0",
					)}
					data-testid="artifact"
					exit={{ opacity: 0, transition: { delay: 0.15 } }}
					initial={{ opacity: 0 }}
				>
					<motion.div
						animate={
							isMobile
								? {
										opacity: 1,
										x: 0,
										y: 0,
										height: windowHeight ? windowHeight : "100dvh",
										width: windowWidth ? windowWidth : "100dvw",
										borderRadius: 0,
										transition: {
											delay: 0,
											type: "spring",
											stiffness: 300,
											damping: 30,
											duration: 0.8,
										},
									}
								: {
										opacity: 1,
										x: 0,
										y: 0,
										height: "100%",
										width: "100%",
										borderRadius: 0,
										transition: {
											delay: 0,
											type: "spring",
											stiffness: 300,
											damping: 30,
											duration: 0.8,
										},
									}
						}
						className={cn(
							"fixed inset-0 flex h-dvh min-w-0 flex-col overflow-hidden border-white/[0.06] bg-[#0e0e0e] text-white/85 shadow-2xl pointer-events-auto md:relative md:inset-auto md:h-full md:w-full md:flex-1 md:shadow-none",
							isIdeLocked ? "border-b md:border-l" : "md:border-l",
						)}
						exit={{
							opacity: 0,
							scale: 0.5,
							transition: {
								delay: 0.1,
								type: "spring",
								stiffness: 600,
								damping: 30,
							},
						}}
						initial={
							isMobile
								? {
										opacity: 0,
										x: 0,
										y: 24,
										height: windowHeight ? windowHeight : "100dvh",
										width: windowWidth ? windowWidth : "100dvw",
										borderRadius: 0,
									}
								: {
										opacity: 0.8,
										x: 48,
										y: 0,
										height: "100%",
										width: "100%",
										borderRadius: 0,
									}
						}
					>
						<div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] px-4 py-2.5">
							<div className="flex min-w-0 items-center gap-2">
								<button
									className="mr-1 inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[12px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/75 md:hidden"
									onClick={closeArtifact}
									type="button"
								>
									<ChevronLeft className="size-4" />
									Back
								</button>
								<span className="truncate text-[12px] text-white/38">
									{safeArtifact.title || "Untitled artifact"}
								</span>
								<span className="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-white/25">
									{artifactLanguage}
								</span>

								{isContentDirty ? (
									<span className="hidden text-[11px] text-white/30 sm:inline">
										Saving...
									</span>
								) : document ? (
									<span className="hidden text-[11px] text-white/25 lg:inline">
										{formatDistance(new Date(document.createdAt), new Date(), {
											addSuffix: true,
										})}
									</span>
								) : null}
							</div>

							<div className="flex shrink-0 items-center gap-1">
								{document ? (
									<ArtifactShareButton
										defaultShared={Boolean(document.isShared)}
										documentId={safeArtifact.documentId}
									/>
								) : null}
								<ArtifactActions
									artifact={safeArtifact}
									currentVersionIndex={currentVersionIndex}
									handleVersionChange={handleVersionChange}
									isCurrentVersion={isCurrentVersion}
									metadata={metadata}
									mode={mode}
									setMetadata={setMetadata}
								/>
								<button
									className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
									onClick={closeArtifact}
									type="button"
								>
									<X className="h-[14px] w-[14px]" />
								</button>
							</div>
						</div>

						<div className="flex min-h-0 flex-1 max-w-full overflow-hidden bg-[#0e0e0e]">
							<div
								className={cn(
									"min-h-0 flex-1",
									safeArtifact.kind === "code"
										? "h-full"
										: "overflow-y-auto p-3 md:p-4",
								)}
							>
								<artifactDefinition.content
									content={
										isCurrentVersion
											? safeArtifact.content
											: getDocumentContentById(currentVersionIndex)
									}
									currentVersionIndex={currentVersionIndex}
									getDocumentContentById={getDocumentContentById}
									isCurrentVersion={isCurrentVersion}
									isInline={false}
									isLoading={isDocumentsFetching && !safeArtifact.content}
									metadata={metadata}
									mode={mode}
									onSaveContent={saveContent}
									setMetadata={setMetadata}
									status={safeArtifact.status}
									suggestions={[]}
									title={safeArtifact.title}
								/>
							</div>

							<AnimatePresence>
								{isCurrentVersion && (
									<Toolbar
										artifactKind={safeArtifact.kind}
										isToolbarVisible={isToolbarVisible}
										sendMessage={sendMessage}
										setIsToolbarVisible={setIsToolbarVisible}
										setMessages={setMessages}
										status={status}
										stop={stop}
									/>
								)}
							</AnimatePresence>
						</div>

						<AnimatePresence>
							{!isCurrentVersion && (
								<VersionFooter
									currentVersionIndex={currentVersionIndex}
									documents={documents}
									handleVersionChange={handleVersionChange}
								/>
							)}
						</AnimatePresence>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
	if (prevProps.status !== nextProps.status) {
		return false;
	}
	if (!equal(prevProps.votes, nextProps.votes)) {
		return false;
	}
	if (prevProps.input !== nextProps.input) {
		return false;
	}
	if (!equal(prevProps.messages, nextProps.messages.length)) {
		return false;
	}
	if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
		return false;
	}

	return true;
});
