"use client";

import {
	Edit3,
	Menu,
	MoreVertical,
	Share2,
	Sparkles,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import type { User } from "next-auth";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatExportButton } from "./chat-export-button";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatContextHeader({
	chatId,
	selectedVisibilityType,
	isReadonly,
	chatTitle = "Untitled Chat",
	user,
}: {
	chatId: string;
	selectedVisibilityType: VisibilityType;
	isReadonly: boolean;
	chatTitle?: string;
	user?: User;
}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { setOpenMobile, isMobile, openMobile } = useSidebar();

	const handleToggleSidebar = () => {
		// Hanya buka kalau belum open, prevent double-click bug
		if (!openMobile) {
			setOpenMobile(true);
		}
	};

	const handleShareChat = async () => {
		const shareUrl = `${window.location.origin}/share/chat/${chatId}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success("Link copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy:", err);
			toast.error("Failed to copy link");
		}
		setIsMenuOpen(false);
	};

	const handleRenameChat = async () => {
		// biome-ignore lint/suspicious/noAlert: Simple prompt for renaming
		const newTitle = prompt("Enter new chat title:", chatTitle);
		if (!newTitle || newTitle.trim() === "" || newTitle === chatTitle) {
			return;
		}

		try {
			const response = await fetch(`/api/chat/${chatId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: newTitle }),
			});

			if (response.ok) {
				toast.success("Chat renamed successfully");
				window.location.reload();
			} else {
				toast.error("Failed to rename chat");
			}
		} catch (err) {
			console.error("Failed to rename:", err);
			toast.error("Failed to rename chat");
		}
		setIsMenuOpen(false);
	};

	const handleDeleteChat = async () => {
		try {
			const response = await fetch(`/api/chat/${chatId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Chat deleted successfully");
				setTimeout(() => {
					window.location.href = "/";
				}, 500);
			} else {
				toast.error("Failed to delete chat");
			}
		} catch (err) {
			console.error("Failed to delete:", err);
			toast.error("Failed to delete chat");
		}
		setIsMenuOpen(false);
	};

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-[#171717]/8 bg-[rgba(255,255,255,0.72)] px-2 py-1.5 shadow-[0_8px_18px_rgba(18,20,22,0.04)] backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(18,21,25,0.78)] dark:shadow-none">
			<div className="flex items-center gap-2">
				{isMobile && (
					<Button
						className="h-9 w-9 rounded-full bg-transparent p-0 text-[#5f6258] hover:bg-black/4 hover:text-[#171717] dark:text-[#a6aca6] dark:hover:bg-white/6 dark:hover:text-[#f3f4f1]"
						onClick={handleToggleSidebar}
						size="sm"
						variant="ghost"
					>
						<Menu className="h-5 w-5" />
						<span className="sr-only">Open sidebar</span>
					</Button>
				)}
				{user && user.type !== "pro" && (
					<Link href="/plan">
						<Button
							className="h-8 rounded-md border border-black/8 bg-transparent px-3 text-xs font-medium text-[#4f544f] hover:bg-black/[0.03] dark:border-white/8 dark:text-[#c4cbc5] dark:hover:bg-white/[0.05]"
							size="sm"
							variant="ghost"
						>
							<Sparkles className="mr-1.5 h-3.5 w-3.5" />
							Upgrade Pro
						</Button>
					</Link>
				)}
			</div>

			<div className="min-w-0 flex-1 text-center">
				<h2 className="truncate px-3 text-sm font-medium tracking-[-0.02em] text-[#4f544f] dark:text-[#c4cbc5]">
					{chatTitle}
				</h2>
			</div>

			{!isReadonly && (
				<DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							className="h-9 w-9 rounded-full bg-transparent p-0 text-[#5f6258] hover:bg-black/4 hover:text-[#171717] dark:text-[#a6aca6] dark:hover:bg-white/6 dark:hover:text-[#f3f4f1]"
							size="sm"
							variant="ghost"
						>
							<MoreVertical className="h-4 w-4" />
							<span className="sr-only">Chat actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="z-50 w-56 rounded-2xl border border-black/8 bg-white/98 shadow-[0_20px_44px_rgba(18,20,22,0.12)] backdrop-blur-xl dark:border-white/8 dark:bg-[#17181a]/98"
					>
						<div className="px-2 py-1.5">
							<div className="mb-2 text-xs font-medium text-muted-foreground">
								Chat Visibility
							</div>
							<VisibilitySelector
								chatId={chatId}
								selectedVisibilityType={selectedVisibilityType}
							/>
						</div>

						<DropdownMenuSeparator />

						<ChatExportButton asMenuItem chatId={chatId} />
						<DropdownMenuItem
							className="cursor-pointer gap-2"
							onClick={handleShareChat}
						>
							<Share2 className="h-4 w-4" />
							Share Chat Link
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer gap-2"
							onClick={handleRenameChat}
						>
							<Edit3 className="h-4 w-4" />
							Rename Chat
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="cursor-pointer gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
							onClick={handleDeleteChat}
						>
							<Trash2 className="h-4 w-4" />
							Delete Chat
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}

export const ChatContextHeader = memo(
	PureChatContextHeader,
	(prevProps, nextProps) => {
		return (
			prevProps.chatId === nextProps.chatId &&
			prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
			prevProps.isReadonly === nextProps.isReadonly &&
			prevProps.chatTitle === nextProps.chatTitle &&
			prevProps.user?.id === nextProps.user?.id
		);
	},
);
