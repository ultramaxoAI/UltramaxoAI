"use client";

import { Menu, SquarePen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
	getChatHistoryPaginationKey,
	SidebarHistory,
} from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
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

export function AppSidebar({ user }: { user: User | undefined }) {
	const router = useRouter();
	const { setOpenMobile, state, open, setOpen } = useSidebar();
	const { mutate } = useSWRConfig();
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

	const isSidebarOpen = state === "expanded";

	const handleDeleteAll = () => {
		const deletePromise = fetch("/api/history", {
			method: "DELETE",
		});

		toast.promise(deletePromise, {
			loading: "Deleting all chats...",
			success: () => {
				mutate(unstable_serialize(getChatHistoryPaginationKey));
				setShowDeleteAllDialog(false);
				router.replace("/");
				router.refresh();
				return "All chats deleted successfully";
			},
			error: "Failed to delete all chats",
		});
	};

	return (
		<>
			<Sidebar
				className="z-30 border-r border-[#171717]/7 bg-[linear-gradient(180deg,rgba(250,248,243,0.92),rgba(244,241,234,0.98))] dark:border-white/7 dark:bg-[linear-gradient(180deg,rgba(17,19,21,0.98),rgba(14,16,18,1))]"
				collapsible="icon"
			>
				<SidebarHeader className="border-b border-[#171717]/6 dark:border-white/7">
					<SidebarMenu>
						<div className="flex flex-col gap-2 px-3 py-4">
							{/* Toggle + Title Row */}
							<div className="flex items-center gap-2 mb-1">
								{/* Toggle Button */}
								<Button
									aria-label={
										isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
									}
									className="h-8 w-8 shrink-0 rounded-full p-0 transition-colors hover:bg-black/4 dark:hover:bg-white/7"
									onClick={() => setOpen(!open)}
									type="button"
									variant="ghost"
								>
									<Menu className="h-4 w-4" />
								</Button>

								{/* App Title - show when open */}
								{isSidebarOpen && (
									<Link
										className="flex items-center hover:opacity-80 transition-opacity"
										href="/chat"
										onClick={() => setOpenMobile(false)}
									>
										<span className="text-base font-semibold tracking-[-0.03em] text-[#171717] dark:text-[#f3f4f1]">
											UltramaxoAI
										</span>
									</Link>
								)}
							</div>

							{/* New Chat Button */}
							<Button
								className={cn(
									"rounded-2xl border border-[#171717]/6 bg-white/48 transition-all hover:bg-white/70 dark:border-white/7 dark:bg-white/4 dark:hover:bg-white/7",
									isSidebarOpen
										? "h-10 w-full justify-start gap-2 px-3"
										: "mx-auto h-10 w-10 p-0",
								)}
								onClick={() => {
									setOpenMobile(false);
									router.push("/chat");
									router.refresh();
								}}
								type="button"
								variant="ghost"
							>
								<SquarePen className="h-4 w-4 shrink-0" />
								{isSidebarOpen && <span className="text-sm">New Chat</span>}
							</Button>
						</div>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					{isSidebarOpen ? (
						<SidebarHistory user={user} />
					) : (
						<div className="flex items-center justify-center py-4">
							<span
								className="rotate-180 text-xs text-[#7a807a] dark:text-[#8f9790]"
								style={{ writingMode: "vertical-rl" }}
							>
								History
							</span>
						</div>
					)}
				</SidebarContent>
				<SidebarFooter>
					{user && <SidebarUserNav isCollapsed={!isSidebarOpen} user={user} />}
				</SidebarFooter>
			</Sidebar>

			<AlertDialog
				onOpenChange={setShowDeleteAllDialog}
				open={showDeleteAllDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete all chats?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete all
							your chats and remove them from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteAll}>
							Delete All
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
