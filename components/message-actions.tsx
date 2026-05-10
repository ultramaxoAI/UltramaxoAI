import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@backend/db/schema";
import equal from "fast-deep-equal";
import { Braces, Copy, Ellipsis, RefreshCw, Share, ThumbsDown, ThumbsUp } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { useArtifact } from "@/hooks/use-artifact";
import type { ChatMessage } from "@/lib/types";
import { fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { getWorkspaceEntryCandidate } from "@/lib/workspace-entry";
import { Action, Actions } from "./elements/actions";
import { CopyIcon, PencilEditIcon } from "./icons";

export function PureMessageActions({
	chatId,
	message,
	vote,
	isLoading,
	setMode,
	regenerate,
}: {
	chatId: string;
	message: ChatMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	setMode?: (mode: "view" | "edit") => void;
	regenerate?: UseChatHelpers<ChatMessage>["regenerate"];
}) {
	const { mutate } = useSWRConfig();
	const { setArtifact } = useArtifact();
	const [_, copyToClipboard] = useCopyToClipboard();

	if (isLoading) {
		return null;
	}

	const textFromParts = message.parts
		?.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n")
		.trim();
	const workspaceCandidate =
		message.role === "assistant" ? getWorkspaceEntryCandidate(message) : null;

	const handleCopy = async () => {
		if (!textFromParts) {
			toast.error("There's no text to copy!");
			return;
		}

		let textToCopy = textFromParts;

		// Jika teks mengandung raw p.call_tool("createDocument"...), ekstrak content-nya
		const createDocMatch = textFromParts.match(
			/p\.call_tool\s*\(\s*["']createDocument["']\s*,\s*(\{[\s\S]*\})\s*\)/,
		);
		if (createDocMatch) {
			try {
				const parsed = JSON.parse(createDocMatch[1]);
				if (parsed?.content) {
					textToCopy = parsed.content;
				}
			} catch {
				// fallback ke text asli
			}
		}

		// Unescape \n dan \t ke karakter aslinya
		textToCopy = textToCopy
			.replace(/\\n/g, "\n")
			.replace(/\\t/g, "\t")
			.replace(/\\"/g, '"');

		await copyToClipboard(textToCopy);
		toast.success("Copied to clipboard!");
	};

	const handleOpenWorkspace = async () => {
		if (!workspaceCandidate) {
			toast.error("Belum ada konten yang cocok dibuka di workspace.");
			return;
		}

		const documentId = workspaceCandidate.existingArtifactId ?? generateUUID();

		if (!workspaceCandidate.existingArtifactId) {
			await fetchWithErrorHandlers(`/api/document?id=${documentId}`, {
				body: JSON.stringify({
					content: workspaceCandidate.content,
					kind: workspaceCandidate.kind,
					title: workspaceCandidate.title,
				}),
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			});
		}

		setArtifact((currentArtifact) => ({
			...currentArtifact,
			content: workspaceCandidate.content,
			documentId,
			isVisible: true,
			kind: workspaceCandidate.kind,
			status: "idle",
			streamState: "completed",
			title: workspaceCandidate.title,
		}));

		toast.success("Workspace siap dibuka.");
	};

	// User messages get edit (on hover) and copy actions
	if (message.role === "user") {
		return (
			<Actions className="-mr-0.5 mt-1 justify-end opacity-100 md:opacity-0 md:transition-opacity md:group-hover/message:opacity-100 md:focus-within:opacity-100">
				<div className="relative">
					{setMode && (
						<Action
							className="absolute top-0 -left-9 opacity-100 md:opacity-0 md:transition-opacity md:focus-visible:opacity-100 md:group-hover/message:opacity-100"
							data-testid="message-edit-button"
							onClick={() => setMode("edit")}
							tooltip="Edit"
						>
							<PencilEditIcon />
						</Action>
					)}
					<Action onClick={handleCopy} tooltip="Copy">
						<CopyIcon />
					</Action>
				</div>
			</Actions>
		);
	}

	return (
		<div className="mt-3 flex flex-wrap items-center gap-1.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/message:opacity-100 md:focus-within:opacity-100">
			<button
				aria-label="Like response"
				className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-35"
				data-testid="message-upvote"
				disabled={vote?.isUpvoted}
				onClick={() => {
					const upvote = fetch("/api/vote", {
						method: "PATCH",
						body: JSON.stringify({
							chatId,
							messageId: message.id,
							type: "up",
						}),
					});

					toast.promise(upvote, {
						loading: "Upvoting Response...",
						success: () => {
							mutate<Vote[]>(
								`/api/vote?chatId=${chatId}`,
								(currentVotes) => {
									if (!currentVotes) {
										return [];
									}

									const votesWithoutCurrent = currentVotes.filter(
										(currentVote) => currentVote.messageId !== message.id,
									);

									return [
										...votesWithoutCurrent,
										{
											chatId,
											messageId: message.id,
											isUpvoted: true,
										},
									];
								},
								{ revalidate: false },
							);

							return "Upvoted Response!";
						},
						error: "Failed to upvote response.",
					});
				}}
				type="button"
			>
				<ThumbsUp className="size-[18px]" />
			</button>

			<button
				aria-label="Dislike response"
				className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-35"
				data-testid="message-downvote"
				disabled={vote && !vote.isUpvoted}
				onClick={() => {
					const downvote = fetch("/api/vote", {
						method: "PATCH",
						body: JSON.stringify({
							chatId,
							messageId: message.id,
							type: "down",
						}),
					});

					toast.promise(downvote, {
						loading: "Downvoting Response...",
						success: () => {
							mutate<Vote[]>(
								`/api/vote?chatId=${chatId}`,
								(currentVotes) => {
									if (!currentVotes) {
										return [];
									}

									const votesWithoutCurrent = currentVotes.filter(
										(currentVote) => currentVote.messageId !== message.id,
									);

									return [
										...votesWithoutCurrent,
										{
											chatId,
											messageId: message.id,
											isUpvoted: false,
										},
									];
								},
								{ revalidate: false },
							);

							return "Downvoted Response!";
						},
						error: "Failed to downvote response.",
					});
				}}
				type="button"
			>
				<ThumbsDown className="size-[18px]" />
			</button>

			<button
				aria-label="Copy response"
				className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white"
				onClick={handleCopy}
				type="button"
			>
				<Copy className="size-[18px]" />
			</button>

			<button
				aria-label="Share response"
				className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white"
				onClick={handleCopy}
				type="button"
			>
				<Share className="size-[18px]" />
			</button>

			{workspaceCandidate ? (
				<button
					aria-label="Open workspace"
					className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white"
					onClick={() => {
						void handleOpenWorkspace();
					}}
					title="Open workspace"
					type="button"
				>
					<Braces className="size-[18px]" />
				</button>
			) : null}

			{regenerate ? (
				<button
					aria-label="Regenerate response"
					className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white"
					onClick={() => regenerate()}
					type="button"
				>
					<RefreshCw className="size-[18px]" />
				</button>
			) : null}

			<button
				aria-label="More actions"
				className="inline-flex size-8 items-center justify-center rounded-full text-white/72 transition-colors hover:bg-white/10 hover:text-white"
				type="button"
			>
				<Ellipsis className="size-[18px]" />
			</button>
		</div>
	);
}

export const MessageActions = memo(
	PureMessageActions,
	(prevProps, nextProps) => {
		if (!equal(prevProps.vote, nextProps.vote)) {
			return false;
		}
		if (prevProps.isLoading !== nextProps.isLoading) {
			return false;
		}
		if (!equal(prevProps.message.parts, nextProps.message.parts)) {
			return false;
		}
		if (prevProps.message.id !== nextProps.message.id) {
			return false;
		}

		return true;
	},
);
