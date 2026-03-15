"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { PinIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { SidebarFolderManager } from "./sidebar-folder-manager";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
	today: Chat[];
	yesterday: Chat[];
	lastWeek: Chat[];
	lastMonth: Chat[];
	older: Chat[];
};

export type ChatHistory = {
	chats: Chat[];
	hasMore: boolean;
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
	const now = new Date();
	const oneWeekAgo = subWeeks(now, 1);
	const oneMonthAgo = subMonths(now, 1);

	return chats.reduce(
		(groups, chat) => {
			const chatDate = new Date(chat.createdAt);

			if (isToday(chatDate)) {
				groups.today.push(chat);
			} else if (isYesterday(chatDate)) {
				groups.yesterday.push(chat);
			} else if (chatDate > oneWeekAgo) {
				groups.lastWeek.push(chat);
			} else if (chatDate > oneMonthAgo) {
				groups.lastMonth.push(chat);
			} else {
				groups.older.push(chat);
			}

			return groups;
		},
		{
			today: [],
			yesterday: [],
			lastWeek: [],
			lastMonth: [],
			older: [],
		} as GroupedChats,
	);
};

export function getChatHistoryPaginationKey(
	pageIndex: number,
	previousPageData: ChatHistory,
) {
	if (previousPageData && previousPageData.hasMore === false) {
		return null;
	}

	if (pageIndex === 0) {
		return `/api/history?limit=${PAGE_SIZE}`;
	}

	const firstChatFromPage = previousPageData.chats.at(-1);

	if (!firstChatFromPage) {
		return null;
	}

	return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
	const { setOpenMobile } = useSidebar();
	const pathname = usePathname();
	const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;

	const {
		data: paginatedChatHistories,
		setSize,
		isValidating,
		isLoading,
		mutate,
	} = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
		fallbackData: [],
	});

	const router = useRouter();
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [visibilityFilter, setVisibilityFilter] = useState<
		"all" | "private" | "public"
	>("all");
	const [pinnedOnly, setPinnedOnly] = useState(false);
	const [folderFilter, setFolderFilter] = useState("all");
	const [draggingChatId, setDraggingChatId] = useState<string | null>(null);

	const hasReachedEnd = paginatedChatHistories
		? paginatedChatHistories.some((page) => page.hasMore === false)
		: false;

	const hasEmptyChatHistory = paginatedChatHistories
		? paginatedChatHistories.every((page) => page.chats.length === 0)
		: false;

	const chatsFromHistory = paginatedChatHistories?.flatMap(
		(paginatedChatHistory) => paginatedChatHistory.chats,
	) || [];

	const availableFolders = useMemo(
		() =>
			Array.from(
				new Set(
					chatsFromHistory
						.map((chat) => chat.folder)
						.filter((folder): folder is string => Boolean(folder?.trim())),
				),
			).sort((a, b) => a.localeCompare(b)),
		[chatsFromHistory],
	);

	const filteredChats = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return chatsFromHistory.filter((chat) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				chat.title.toLowerCase().includes(normalizedSearch) ||
				chat.folder?.toLowerCase().includes(normalizedSearch) ||
				chat.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch));

			const matchesVisibility =
				visibilityFilter === "all" || chat.visibility === visibilityFilter;
			const matchesPinned = !pinnedOnly || chat.isPinned;
			const matchesFolder =
				folderFilter === "all"
					? true
					: folderFilter === "uncategorized"
						? !chat.folder?.trim()
						: chat.folder === folderFilter;

			return matchesSearch && matchesVisibility && matchesPinned && matchesFolder;
		});
	}, [chatsFromHistory, folderFilter, pinnedOnly, searchTerm, visibilityFilter]);

	const pinnedChats = filteredChats.filter((chat) => chat.isPinned);
	const groupedChats = groupChatsByDate(filteredChats.filter((chat) => !chat.isPinned));
	const chatCounts = useMemo(() => {
		return chatsFromHistory.reduce<Record<string, number>>((acc, chat) => {
			const key = chat.folder?.trim() || "uncategorized";
			acc[key] = (acc[key] ?? 0) + 1;
			return acc;
		}, {});
	}, [chatsFromHistory]);

	const handleDelete = () => {
		const chatToDelete = deleteId;
		const isCurrentChat = pathname === `/chat/${chatToDelete}`;

		setShowDeleteDialog(false);

		const deletePromise = fetch(`/api/chat/${chatToDelete}`, {
			method: "DELETE",
		});

		toast.promise(deletePromise, {
			loading: "Deleting chat...",
			success: () => {
				mutate((chatHistories) => {
					if (chatHistories) {
						return chatHistories.map((chatHistory) => ({
							...chatHistory,
							chats: chatHistory.chats.filter(
								(chat) => chat.id !== chatToDelete,
							),
						}));
					}
				});

				if (isCurrentChat) {
					router.replace("/");
					router.refresh();
				}

				return "Chat deleted successfully";
			},
			error: "Failed to delete chat",
		});
	};

	const handleHistoryRefresh = () => {
		mutate();
	};

	const handleAssignChatToFolder = async (folder: string | null) => {
		if (!draggingChatId) {
			return;
		}

		const response = await fetch(`/api/chat/${draggingChatId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ folder }),
		});

		if (!response.ok) {
			toast.error("Failed to move chat");
			setDraggingChatId(null);
			return;
		}

		toast.success(folder ? `Chat moved to ${folder}` : "Chat removed from folder");
		setDraggingChatId(null);
		handleHistoryRefresh();
	};

	const renderChatSection = (label: string, chats: Chat[]) => {
		if (chats.length === 0) {
			return null;
		}

		return (
			<div>
				<div className="px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase text-[#7a807a] dark:text-[#8f9790]">
					{label}
				</div>
				{chats.map((chat) => (
					<ChatItem
						chat={chat}
						isActive={chat.id === id}
						key={chat.id}
						onDelete={(chatId) => {
							setDeleteId(chatId);
							setShowDeleteDialog(true);
						}}
						onDragEnd={() => setDraggingChatId(null)}
						onDragStart={setDraggingChatId}
						onUpdated={handleHistoryRefresh}
						setOpenMobile={setOpenMobile}
					/>
				))}
			</div>
		);
	};

	if (!user) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<div className="flex w-full flex-row items-center justify-center gap-2 px-3 py-4 text-sm text-[#6f746f] dark:text-[#9ca39d]">
						Login to save and revisit previous chats!
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	if (isLoading) {
		return (
			<SidebarGroup>
				<div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
					Today
				</div>
				<SidebarGroupContent>
					<div className="flex flex-col">
						{[44, 32, 28, 64, 52].map((item) => (
							<div
								className="flex h-8 items-center gap-2 rounded-md px-2"
								key={item}
							>
								<div
									className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
									style={
										{
											"--skeleton-width": `${item}%`,
										} as React.CSSProperties
									}
								/>
							</div>
						))}
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	if (hasEmptyChatHistory) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<div className="flex w-full flex-row items-center justify-center gap-2 px-3 py-4 text-sm text-[#6f746f] dark:text-[#9ca39d]">
						Your conversations will appear here once you start chatting!
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarFolderManager
						activeFolder={folderFilter}
						chatCounts={chatCounts}
						draggingChatId={draggingChatId}
						onAssignChatToFolder={handleAssignChatToFolder}
						onFoldersUpdated={handleHistoryRefresh}
						onSelectFolder={setFolderFilter}
					/>
					<div className="mb-4 space-y-2 px-2">
						<div className="relative">
							<SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a807a] dark:text-[#8f9790]" />
							<input
								className="h-10 w-full rounded-2xl border border-[#171717]/8 bg-white/80 pl-9 pr-3 text-sm text-[#171717] outline-none placeholder:text-[#7a807a] dark:border-white/8 dark:bg-white/6 dark:text-[#f3f4f1]"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search chats, folders, or tags"
								value={searchTerm}
							/>
						</div>
						<div className="flex gap-2">
							<Select
								onValueChange={(value) =>
									setVisibilityFilter(value as "all" | "private" | "public")
								}
								value={visibilityFilter}
							>
								<SelectTrigger className="h-9 flex-1 rounded-xl border-[#171717]/8 bg-[#111315] text-xs text-[#f3f4f1] shadow-none ring-0 focus:ring-0 dark:border-white/8 dark:bg-[#111315] dark:text-[#f3f4f1]">
									<SelectValue placeholder="All visibility" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-white/10 bg-[#171b1f] text-[#f3f4f1] shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl">
									<SelectItem className="rounded-lg text-xs focus:bg-white/8 focus:text-white" value="all">
										All visibility
									</SelectItem>
									<SelectItem className="rounded-lg text-xs focus:bg-white/8 focus:text-white" value="private">
										Private
									</SelectItem>
									<SelectItem className="rounded-lg text-xs focus:bg-white/8 focus:text-white" value="public">
										Public
									</SelectItem>
								</SelectContent>
							</Select>
							<Select onValueChange={setFolderFilter} value={folderFilter}>
								<SelectTrigger className="h-9 flex-1 rounded-xl border-[#171717]/8 bg-[#111315] text-xs text-[#f3f4f1] shadow-none ring-0 focus:ring-0 dark:border-white/8 dark:bg-[#111315] dark:text-[#f3f4f1]">
									<SelectValue placeholder="All folders" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-white/10 bg-[#171b1f] text-[#f3f4f1] shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl">
									<SelectItem className="rounded-lg text-xs focus:bg-white/8 focus:text-white" value="all">
										All folders
									</SelectItem>
									<SelectItem className="rounded-lg text-xs focus:bg-white/8 focus:text-white" value="uncategorized">
										Uncategorized
									</SelectItem>
									{availableFolders.map((folder) => (
										<SelectItem
											className="rounded-lg text-xs focus:bg-white/8 focus:text-white"
											key={folder}
											value={folder}
										>
											{folder}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<button
							className={`flex h-9 w-full items-center justify-center gap-2 rounded-xl border text-xs font-medium transition-colors ${
								pinnedOnly
									? "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300"
									: "border-[#171717]/8 bg-white/80 text-[#5f6258] dark:border-white/8 dark:bg-white/6 dark:text-[#a6aca6]"
							}`}
							onClick={() => setPinnedOnly((current) => !current)}
							type="button"
						>
							<PinIcon className="h-3.5 w-3.5" />
							Pinned only
						</button>
					</div>
					<SidebarMenu>
						<div className="flex flex-col gap-6">
							{renderChatSection("Pinned", pinnedChats)}
							{renderChatSection("Today", groupedChats.today)}
							{renderChatSection("Yesterday", groupedChats.yesterday)}
							{renderChatSection("Last 7 days", groupedChats.lastWeek)}
							{renderChatSection("Last 30 days", groupedChats.lastMonth)}
							{renderChatSection("Older than last month", groupedChats.older)}
							{filteredChats.length === 0 ? (
								<div className="px-2 py-4 text-sm text-[#6f746f] dark:text-[#9ca39d]">
									No chats match the current filters.
								</div>
							) : null}
						</div>
					</SidebarMenu>

					<motion.div
						onViewportEnter={() => {
							if (!isValidating && !hasReachedEnd) {
								setSize((size) => size + 1);
							}
						}}
					/>

					{hasReachedEnd ? (
						<div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
							You have reached the end of your chat history.
						</div>
					) : (
						<div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
							<div className="animate-spin">
								<LoaderIcon />
							</div>
							<div>Loading Chats...</div>
						</div>
					)}
				</SidebarGroupContent>
			</SidebarGroup>

			<AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							chat and remove it from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
