import Link from "next/link";
import { Pin } from "lucide-react";
import { memo, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "sonner";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@backend/db/schema";
import { ChatOrganizationDialog } from "./chat-organization-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import {
	CheckCircleFillIcon,
	GlobeIcon,
	LockIcon,
	MoreHorizontalIcon,
	ShareIcon,
	TrashIcon,
} from "./icons";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

const PureChatItem = ({
	chat,
	isActive,
	onDelete,
	onDragEnd,
	onDragStart,
	onUpdated,
	setOpenMobile,
}: {
	chat: Chat;
	isActive: boolean;
	onDelete: (chatId: string) => void;
	onDragEnd?: () => void;
	onDragStart?: (chatId: string) => void;
	onUpdated?: () => void;
	setOpenMobile: (open: boolean) => void;
}) => {
	const { visibilityType, setVisibilityType } = useChatVisibility({
		chatId: chat.id,
		initialVisibilityType: chat.visibility,
	});
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	const handleTogglePin = async () => {
		const response = await fetch(`/api/chat/${chat.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isPinned: !chat.isPinned }),
		});

		if (!response.ok) {
			toast.error("Failed to update pin status");
			return;
		}

		toast.success(chat.isPinned ? "Chat unpinned" : "Chat pinned");
		onUpdated?.();
	};

	const handleCopyShareLink = async () => {
		if (chat.visibility !== "public") {
			setVisibilityType("public");
		}

		await navigator.clipboard.writeText(
			`${window.location.origin}/share/chat/${chat.id}`,
		);
		toast.success("Public share link copied");
		onUpdated?.();
	};

	const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", chat.id);
		onDragStart?.(chat.id);
	};

	return (
		<>
			<SidebarMenuItem
				draggable
				onDragEnd={onDragEnd}
				onDragStart={handleDragStart}
			>
			<SidebarMenuButton
				asChild
				className="rounded-2xl text-[#3e433e] transition-all hover:bg-white/70 hover:text-[#171717] data-[active=true]:bg-white/80 data-[active=true]:text-[#171717] data-[active=true]:shadow-[0_10px_24px_rgba(23,23,23,0.05)] dark:text-[#b8beb8] dark:hover:bg-white/6 dark:hover:text-[#f3f4f1] dark:data-[active=true]:bg-white/8 dark:data-[active=true]:text-[#f3f4f1] dark:data-[active=true]:shadow-none"
				isActive={isActive}
			>
				<Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
					<div className="flex min-w-0 flex-col gap-1 py-0.5">
						<div className="flex items-center gap-1.5">
							<span className="truncate">{chat.title}</span>
							{chat.isPinned ? (
								<Pin className="h-3 w-3 shrink-0 text-teal-600 dark:text-teal-300" />
							) : null}
						</div>
						{chat.folder || (Array.isArray(chat.tags) && chat.tags.length > 0) ? (
							<div className="flex min-w-0 flex-wrap gap-1 text-[10px] text-[#7a807a] dark:text-[#8f9790]">
								{chat.folder ? (
									<span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/8">
										{chat.folder}
									</span>
								) : null}
								{Array.isArray(chat.tags)
									? chat.tags.slice(0, 2).map((tag) => (
										<span
											className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/8"
											key={tag}
										>
											#{tag}
										</span>
									))
									: null}
							</div>
						) : null}
					</div>
				</Link>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction
						className="mr-0.5 rounded-xl data-[state=open]:bg-white/70 data-[state=open]:text-[#171717] dark:data-[state=open]:bg-white/7 dark:data-[state=open]:text-[#f3f4f1]"
						showOnHover={!isActive}
					>
						<MoreHorizontalIcon />
						<span className="sr-only">More</span>
					</SidebarMenuAction>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
					side="bottom"
				>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="cursor-pointer">
							<ShareIcon />
							<span>Share</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuItem
									className="cursor-pointer flex-row justify-between"
									onClick={() => {
										setVisibilityType("private");
									}}
								>
									<div className="flex flex-row items-center gap-2">
										<LockIcon size={12} />
										<span>Private</span>
									</div>
									{visibilityType === "private" ? (
										<CheckCircleFillIcon />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer flex-row justify-between"
									onClick={() => {
										setVisibilityType("public");
									}}
								>
									<div className="flex flex-row items-center gap-2">
										<GlobeIcon />
										<span>Public</span>
									</div>
									{visibilityType === "public" ? <CheckCircleFillIcon /> : null}
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={handleCopyShareLink}
					>
						<ShareIcon />
						<span>Copy share link</span>
					</DropdownMenuItem>
					<DropdownMenuItem className="cursor-pointer" onClick={handleTogglePin}>
						<Pin className="h-4 w-4" />
						<span>{chat.isPinned ? "Unpin chat" : "Pin chat"}</span>
					</DropdownMenuItem>
					<ChatOrganizationDialog
						chatId={chat.id}
						defaultFolder={chat.folder}
						defaultTags={Array.isArray(chat.tags) ? chat.tags : []}
						onSaved={onUpdated}
						title={chat.title}
						trigger={
							<div className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm outline-none">
								<MoreHorizontalIcon />
								<span>Folder and tags</span>
							</div>
						}
					/>
					<DropdownMenuItem
						className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
						onSelect={(event) => {
							event.preventDefault();
							setConfirmDeleteOpen(true);
						}}
					>
						<TrashIcon />
						<span>Delete</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			</SidebarMenuItem>

			<AlertDialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete chat?</AlertDialogTitle>
						<AlertDialogDescription>
							This permanently deletes `
							{chat.title}
							` from your workspace.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => onDelete(chat.id)}>
							Delete chat
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
	if (prevProps.isActive !== nextProps.isActive) {
		return false;
	}
	return (
		prevProps.chat.id === nextProps.chat.id &&
		prevProps.chat.title === nextProps.chat.title &&
		prevProps.chat.visibility === nextProps.chat.visibility &&
		prevProps.chat.isPinned === nextProps.chat.isPinned &&
		prevProps.chat.folder === nextProps.chat.folder &&
		JSON.stringify(prevProps.chat.tags ?? []) ===
			JSON.stringify(nextProps.chat.tags ?? [])
	);
});
