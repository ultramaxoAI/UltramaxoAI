"use client";

import type { Chat } from "@backend/db/schema";
import { isToday, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
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
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
	today: Chat[];
	lastWeek: Chat[];
	lastMonth: Chat[];
};

export type ChatHistory = {
	chats: Chat[];
	hasMore: boolean;
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
	const now = new Date();
	const oneWeekAgo = subWeeks(now, 1);

	return chats.reduce(
		(groups, chat) => {
			const chatDate = new Date(chat.createdAt);

			if (isToday(chatDate)) {
				groups.today.push(chat);
			} else if (chatDate > oneWeekAgo) {
				groups.lastWeek.push(chat);
			} else {
				groups.lastMonth.push(chat);
			}

			return groups;
		},
		{
			today: [],
			lastWeek: [],
			lastMonth: [],
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
	const [, setDraggingChatId] = useState<string | null>(null);

	const hasReachedEnd = paginatedChatHistories
		? paginatedChatHistories.some((page) => page.hasMore === false)
		: false;

	const hasEmptyChatHistory = paginatedChatHistories
		? paginatedChatHistories.every((page) => page.chats.length === 0)
		: false;

	const chatsFromHistory =
		paginatedChatHistories?.flatMap(
			(paginatedChatHistory) => paginatedChatHistory.chats,
		) || [];

	const filteredChats = chatsFromHistory;

	const pinnedChats = filteredChats.filter((chat) => chat.isPinned);
	const groupedChats = groupChatsByDate(
		filteredChats.filter((chat) => !chat.isPinned),
	);
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

	const renderChatSection = (label: string, chats: Chat[]) => {
		if (chats.length === 0) {
			return null;
		}

		return (
			<div className="space-y-1.5">
				<div className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-white/25">
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
					<div className="mx-3 mt-3 flex w-auto flex-row items-center justify-center rounded-[22px] border border-black/6 bg-white/55 px-4 py-4 text-sm text-[#6f746f] shadow-[0_12px_30px_rgba(17,19,21,0.04)] dark:border-white/7 dark:bg-white/[0.03] dark:text-[#9ca39d] dark:shadow-none">
						Login to save and revisit previous chats.
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
					<div className="mx-3 mt-3 flex w-auto flex-row items-center justify-center rounded-[22px] border border-black/6 bg-white/55 px-4 py-4 text-sm text-[#6f746f] shadow-[0_12px_30px_rgba(17,19,21,0.04)] dark:border-white/7 dark:bg-white/[0.03] dark:text-[#9ca39d] dark:shadow-none">
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
					<SidebarMenu>
						<div className="flex flex-col gap-5 px-1 pt-3">
							{renderChatSection("PINNED", pinnedChats)}
							{renderChatSection("TODAY", groupedChats.today)}
							{renderChatSection("LAST 7 DAYS", groupedChats.lastWeek)}
							{renderChatSection("LAST 30 DAYS", groupedChats.lastMonth)}
							{filteredChats.length === 0 ? (
								<div className="mx-2 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-white/35">
									No chats yet.
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
