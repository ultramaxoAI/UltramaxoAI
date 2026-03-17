import type { UseChatHelpers } from "@ai-sdk/react";
import { formatDistance } from "date-fns";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
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
import { useArtifact } from "@/hooks/use-artifact";
import type { Document, Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import { ArtifactShareButton } from "./artifact-share-button";
import { ArtifactActions } from "./artifact-actions";
import { ArtifactCloseButton } from "./artifact-close-button";
import { Toolbar } from "./toolbar";
import { useSidebar } from "./ui/sidebar";
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

	const {
		data: documents,
		isLoading: isDocumentsFetching,
		mutate: mutateDocuments,
	} = useSWR<Document[]>(
		artifact.documentId !== "init" && artifact.status !== "streaming"
			? `/api/document?id=${artifact.documentId}`
			: null,
		fetcher,
	);

	const [mode, setMode] = useState<"edit" | "diff">("edit");
	const [document, setDocument] = useState<Document | null>(null);
	const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

	const { open: isSidebarOpen } = useSidebar();

	useEffect(() => {
		if (documents && documents.length > 0) {
			const mostRecentDocument = documents.at(-1);

			if (mostRecentDocument) {
				setDocument(mostRecentDocument);
				setCurrentVersionIndex(documents.length - 1);
				setArtifact((currentArtifact) => ({
					...currentArtifact,
					content: mostRecentDocument.content ?? "",
				}));
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
	const isMobile = windowWidth ? windowWidth < 1024 : false;

	const artifactDefinition = artifactDefinitions.find(
		(definition) => definition.kind === artifact.kind,
	);

	if (!artifactDefinition) {
		throw new Error("Artifact definition not found!");
	}

	useEffect(() => {
		if (artifact.documentId !== "init" && artifactDefinition.initialize) {
			artifactDefinition.initialize({
				documentId: artifact.documentId,
				setMetadata,
			});
		}
	}, [artifact.documentId, artifactDefinition, setMetadata]);

	return (
		<AnimatePresence>
			{artifact.isVisible && (
				<motion.div
					animate={{ opacity: 1 }}
					className="fixed inset-0 z-50 flex h-dvh w-dvw flex-row bg-black/30 backdrop-blur-[2px] pointer-events-none lg:bg-transparent lg:backdrop-blur-0"
					data-testid="artifact"
					exit={{ opacity: 0, transition: { delay: 0.4 } }}
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
										x: windowWidth ? windowWidth * 0.32 : 0,
										y: 0,
										height: windowHeight ? windowHeight : "100dvh",
										width: windowWidth ? windowWidth * 0.68 : "68dvw",
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
						className="fixed inset-0 flex h-dvh flex-col overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 pointer-events-auto md:border-l shadow-2xl"
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
										x: artifact.boundingBox.left,
										y: artifact.boundingBox.top,
										height: artifact.boundingBox.height,
										width: artifact.boundingBox.width,
										borderRadius: 50,
									}
						}
					>
						<div className="sticky top-0 z-20 flex flex-row items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur md:px-4">
							<div className="flex min-w-0 flex-row items-center gap-3 md:gap-4">
								<ArtifactCloseButton />

								<div className="flex min-w-0 flex-col">
									<div className="truncate font-semibold text-zinc-100 text-sm tracking-wide md:text-base">{artifact.title}</div>

									{isContentDirty ? (
										<div className="text-muted-foreground text-xs md:text-sm">
											Saving changes...
										</div>
									) : document ? (
										<div className="text-muted-foreground text-xs md:text-sm">
											{`Updated ${formatDistance(
												new Date(document.createdAt),
												new Date(),
												{
													addSuffix: true,
												},
											)}`}
										</div>
									) : (
										<div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-muted-foreground/20" />
									)}
								</div>
							</div>

						<div className="flex shrink-0 items-center gap-2">
							{document ? (
								<ArtifactShareButton
									defaultShared={Boolean(document.isShared)}
									documentId={artifact.documentId}
								/>
							) : null}
							<ArtifactActions
								artifact={artifact}
								currentVersionIndex={currentVersionIndex}
								handleVersionChange={handleVersionChange}
								isCurrentVersion={isCurrentVersion}
								metadata={metadata}
								mode={mode}
								setMetadata={setMetadata}
							/>
						</div>
					</div>

						<div className="h-full flex-1 max-w-full! items-center overflow-y-auto bg-zinc-950">
							<div className={artifact.kind === "code" ? "" : "p-3 md:p-4"}>
								<artifactDefinition.content
									content={
										isCurrentVersion
											? artifact.content
											: getDocumentContentById(currentVersionIndex)
									}
									currentVersionIndex={currentVersionIndex}
									getDocumentContentById={getDocumentContentById}
									isCurrentVersion={isCurrentVersion}
									isInline={false}
									isLoading={isDocumentsFetching && !artifact.content}
									metadata={metadata}
									mode={mode}
									onSaveContent={saveContent}
									setMetadata={setMetadata}
									status={artifact.status}
									suggestions={[]}
									title={artifact.title}
								/>
							</div>

							<AnimatePresence>
								{isCurrentVersion && (
									<Toolbar
										artifactKind={artifact.kind}
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
