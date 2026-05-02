"use client";

import { PanelLeft, Search, Settings, SquarePen } from "lucide-react";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	const { setOpenMobile, state, open, setOpen, isMobile, toggleSidebar } =
		useSidebar();
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
				className="z-30 border-r border-black/6 bg-[linear-gradient(180deg,rgba(248,244,237,0.985),rgba(242,236,226,0.985))] backdrop-blur-2xl dark:border-white/6 dark:bg-[linear-gradient(180deg,rgba(11,13,16,0.985),rgba(15,18,22,0.99))]"
				collapsible="icon"
			>
				<SidebarHeader className="border-b border-black/6 dark:border-white/6">
					<SidebarMenu>
						<TooltipProvider delayDuration={0}>
							<div className="flex flex-col gap-4 px-3 py-4">
								<div
									className={cn(
										"mb-1 flex items-center",
										isSidebarOpen ? "justify-between" : "justify-center",
									)}
								>
									{isSidebarOpen && (
										<Link
											className="ml-1 flex flex-1 items-center transition-opacity hover:opacity-80"
											href="/chat"
											onClick={() => setOpenMobile(false)}
										>
											<span className="block text-[1.5rem] font-serif tracking-[-0.045em] text-[#16181b] dark:text-[#f4f1ec]">
												Ultramaxo
											</span>
										</Link>
									)}

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												aria-label={
													isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
												}
												className="h-8 w-8 shrink-0 rounded-xl p-0 text-[#5e625c] transition-colors hover:bg-black/5 hover:text-[#15181b] dark:text-[#8f948d] dark:hover:bg-white/6 dark:hover:text-[#f4f1ec]"
												onClick={toggleSidebar}
												type="button"
												variant="ghost"
											>
												<PanelLeft className="h-5 w-5 opacity-70" />
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="right"
											sideOffset={12}
											className="rounded-xl border border-white/8 bg-[#121519] px-3 py-1.5 text-xs font-medium text-white shadow-xl"
										>
											<span>
												{isSidebarOpen ? "Close sidebar" : "Open sidebar"}
											</span>
											<span className="text-white/50 text-[10px] uppercase font-mono tracking-widest ml-1">
												Ctrl+.
											</span>
										</TooltipContent>
									</Tooltip>
								</div>

								<div className="flex w-full flex-col gap-1">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className={cn(
													"cursor-pointer font-normal text-[#1b1e21] transition-all hover:bg-black/5 dark:text-[#f4f1ec] dark:hover:bg-white/6",
													isSidebarOpen
														? "h-11 w-full justify-start gap-3 rounded-[18px] px-3"
														: "mx-auto h-9 w-9 rounded-2xl p-0",
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
												{isSidebarOpen && (
													<span className="text-[14px] font-medium">
														New chat
													</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-xl border border-white/8 bg-[#121519] px-3 py-1.5 text-xs font-medium text-white shadow-xl"
											>
												<span>New chat</span>
											</TooltipContent>
										)}
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className={cn(
													"cursor-pointer font-normal text-[#1b1e21] transition-all hover:bg-black/5 dark:text-[#f4f1ec] dark:hover:bg-white/6",
													isSidebarOpen
														? "h-10 w-full justify-start gap-3 rounded-[18px] px-3"
														: "mx-auto h-9 w-9 rounded-2xl p-0",
												)}
												type="button"
												variant="ghost"
											>
												<Search className="h-[18px] w-[18px] shrink-0 opacity-80" />
												{isSidebarOpen && (
													<span className="text-[13px] text-[#666b66] dark:text-[#959b95]">
														Search
													</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-xl border border-white/8 bg-[#121519] px-3 py-1.5 text-xs font-medium text-white shadow-xl"
											>
												<span>Search</span>
											</TooltipContent>
										)}
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className={cn(
													"cursor-pointer font-normal text-[#1b1e21] transition-all hover:bg-black/5 dark:text-[#f4f1ec] dark:hover:bg-white/6",
													isSidebarOpen
														? "h-10 w-full justify-start gap-3 rounded-[18px] px-3"
														: "mx-auto h-9 w-9 rounded-2xl p-0",
												)}
												onClick={() => {
													setOpenMobile(false);
													router.push("/settings");
												}}
												type="button"
												variant="ghost"
											>
												<Settings className="h-[18px] w-[18px] shrink-0 opacity-80" />
												{isSidebarOpen && (
													<span className="text-[13px] text-[#666b66] dark:text-[#959b95]">
														Personalization
													</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-xl border border-white/8 bg-[#121519] px-3 py-1.5 text-xs font-medium text-white shadow-xl"
											>
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
					{isSidebarOpen ? <SidebarHistory user={user} /> : null}
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
