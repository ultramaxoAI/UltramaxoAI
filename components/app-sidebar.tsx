"use client";

import { PanelLeft, SquarePen, Search, Settings } from "lucide-react";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	const { setOpenMobile, state, open, setOpen, isMobile, toggleSidebar } = useSidebar();
	const { mutate } = useSWRConfig();
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

	const isSidebarOpen = state === "expanded" || isMobile;

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
				className="z-30 border-r border-[#171717]/7 bg-[linear-gradient(180deg,rgba(249,247,241,0.94),rgba(244,241,234,0.98))] dark:border-white/7 dark:bg-[linear-gradient(180deg,rgba(16,18,20,0.98),rgba(14,16,18,1))]"
				collapsible="icon"
			>
				<SidebarHeader className="border-b border-[#171717]/6 dark:border-white/7">
					<SidebarMenu>
						<TooltipProvider delayDuration={0}>
						<div className="flex flex-col gap-2 px-3 py-3.5">
							{/* Toggle + Title Row */}
							<div className={cn("mb-1 flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
								{/* App Title - show when open */}
								{isSidebarOpen && (
									<Link
										className="flex items-center hover:opacity-80 transition-opacity flex-1 ml-2"
										href="/chat"
										onClick={() => setOpenMobile(false)}
									>
										<span className="text-[1.7rem] font-serif tracking-[-0.04em] text-[#171717] dark:text-[#f3f4f1]">
											Ultramaxo
										</span>
									</Link>
								)}

								{/* Toggle Button */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label={
												isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
											}
											className="h-8 w-8 shrink-0 rounded-md p-0 transition-colors hover:bg-black/4 dark:hover:bg-white/7 cursor-pointer"
											onClick={toggleSidebar}
											type="button"
											variant="ghost"
										>
											<PanelLeft className="h-5 w-5 opacity-70" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right" sideOffset={12} className="bg-black/90 border-[#333] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium dark:bg-black dark:border-white/10">
										<span>{isSidebarOpen ? "Close sidebar" : "Open sidebar"}</span>
										<span className="text-white/50 text-[10px] uppercase font-mono tracking-widest ml-1">Ctrl+.</span>
									</TooltipContent>
								</Tooltip>
							</div>

							<div className="flex w-full flex-col gap-0.5">
								{/* New Chat Button */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className={cn(
												"transition-all font-normal text-[#171717] dark:text-[#f3f4f1] hover:bg-black/4 dark:hover:bg-white/7 cursor-pointer",
												isSidebarOpen
													? "h-10 w-full justify-start gap-3 rounded-xl px-2.5"
													: "mx-auto h-9 w-9 rounded-xl p-0",
											)}
											onClick={() => {
												setOpenMobile(false);
												router.push("/chat");
												router.refresh();
											}}
											type="button"
											variant="ghost"
										>
											<SquarePen className="h-[18px] w-[18px] shrink-0 opacity-80" />
											{isSidebarOpen && <span className="text-[14px] font-medium">New chat</span>}
										</Button>
									</TooltipTrigger>
									{!isSidebarOpen && (
										<TooltipContent side="right" sideOffset={12} className="bg-black/90 border-[#333] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium dark:bg-black dark:border-white/10">
											<span>New chat</span>
										</TooltipContent>
									)}
								</Tooltip>

								{/* Search Placeholder */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className={cn(
												"transition-all font-normal text-[#171717] dark:text-[#f3f4f1] hover:bg-black/4 dark:hover:bg-white/7 cursor-pointer",
												isSidebarOpen
													? "h-9 w-full justify-start gap-3 rounded-xl px-2.5"
													: "mx-auto h-9 w-9 rounded-xl p-0",
											)}
											type="button"
											variant="ghost"
										>
											<Search className="h-[18px] w-[18px] shrink-0 opacity-80" />
											{isSidebarOpen && <span className="text-[13px] text-[#5f6258] dark:text-[#a6aca6]">Search</span>}
										</Button>
									</TooltipTrigger>
									{!isSidebarOpen && (
										<TooltipContent side="right" sideOffset={12} className="bg-black/90 border-[#333] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium dark:bg-black dark:border-white/10">
											<span>Search</span>
										</TooltipContent>
									)}
								</Tooltip>

								{/* Settings / Personalization */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className={cn(
												"transition-all font-normal text-[#171717] dark:text-[#f3f4f1] hover:bg-black/4 dark:hover:bg-white/7 cursor-pointer",
												isSidebarOpen
													? "h-9 w-full justify-start gap-3 rounded-xl px-2.5"
													: "mx-auto h-9 w-9 rounded-xl p-0",
											)}
											onClick={() => {
												setOpenMobile(false);
												router.push("/settings");
											}}
											type="button"
											variant="ghost"
										>
											<Settings className="h-[18px] w-[18px] shrink-0 opacity-80" />
											{isSidebarOpen && <span className="text-[13px] text-[#5f6258] dark:text-[#a6aca6]">Personalization</span>}
										</Button>
									</TooltipTrigger>
									{!isSidebarOpen && (
										<TooltipContent side="right" sideOffset={12} className="bg-black/90 border-[#333] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium dark:bg-black dark:border-white/10">
											<span>Personalization</span>
										</TooltipContent>
									)}
								</Tooltip>
							</div>
						</div>
						</TooltipProvider>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					{isSidebarOpen ? (
						<SidebarHistory user={user} />
					) : null}
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
