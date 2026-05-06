"use client";

import { Edit3, MoreHorizontal, PanelLeft, Share2, Trash2 } from "lucide-react";
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
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import { useSession } from "next-auth/react";

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
	user?: { id?: string; email?: string; type?: string; [key: string]: any };
}) {
	const { data: session } = useSession();
	const currentUser = user || session?.user;
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
		<div className="h-14 border-white/6 border-b bg-[#0b0d10]/92 px-3 backdrop-blur-xl sm:px-4">
			<div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					{isMobile && (
						<Button
							className="h-8 w-8 rounded-lg border border-white/7 bg-transparent p-0 text-white/45 hover:bg-white/6 hover:text-white/80"
							onClick={handleToggleSidebar}
							size="sm"
							variant="ghost"
						>
							<PanelLeft className="h-5 w-5" />
							<span className="sr-only">Open sidebar</span>
						</Button>
					)}
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h2 className="truncate text-[13px] font-medium text-white/85">
								{chatTitle}
							</h2>
							<span className="hidden items-center gap-1.5 rounded-full border border-white/7 px-2 py-0.5 text-[10px] font-medium text-white/45 sm:inline-flex">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
								Live workspace
							</span>
						</div>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{currentUser && currentUser.type !== "pro" && (
						<UpgradeProButton user={currentUser as any} variant="minimal" />
					)}
					{!isReadonly && (
						<DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
							<DropdownMenuTrigger asChild>
								<Button
									className="h-8 w-8 rounded-lg border border-white/7 bg-transparent p-0 text-white/45 hover:bg-white/6 hover:text-white/80"
									size="sm"
									variant="ghost"
								>
									<MoreHorizontal className="h-4 w-4" />
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
			</div>
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
