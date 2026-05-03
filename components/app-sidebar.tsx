"use client";

import { PanelLeft, Search, Sliders, SquarePen } from "lucide-react";
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
	const { setOpenMobile, state, isMobile, toggleSidebar } = useSidebar();
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
				className="z-30 border-r border-white/[0.06] bg-[#0a0a0a] text-white antialiased [&_[data-sidebar=sidebar]]:bg-[#0a0a0a]"
				collapsible="icon"
			>
				<SidebarHeader className="border-b border-white/[0.06]">
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
											<span className="block text-[15px] font-semibold tracking-tight text-white/88">
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
												className="h-8 w-8 shrink-0 rounded-md p-0 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/65"
												onClick={toggleSidebar}
												type="button"
												variant="ghost"
											>
												<PanelLeft className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="right"
											sideOffset={12}
											className="rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/85 shadow-xl"
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
													"cursor-pointer font-normal text-white/38 transition-colors hover:bg-white/[0.04] hover:text-white/75",
													isSidebarOpen
														? "h-9 w-full justify-start gap-3 rounded-md px-3"
														: "mx-auto h-8 w-8 rounded-md p-0",
												)}
												onClick={() => {
													setOpenMobile(false);
													router.push("/chat");
													router.refresh();
												}}
												type="button"
												variant="ghost"
											>
												<SquarePen className="h-[17px] w-[17px] shrink-0" />
												{isSidebarOpen && (
													<span className="text-[13px] font-normal">
														New chat
													</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/85 shadow-xl"
											>
												<span>New chat</span>
											</TooltipContent>
										)}
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className={cn(
													"cursor-pointer font-normal text-white/38 transition-colors hover:bg-white/[0.04] hover:text-white/75",
													isSidebarOpen
														? "h-9 w-full justify-start gap-3 rounded-md px-3"
														: "mx-auto h-8 w-8 rounded-md p-0",
												)}
												type="button"
												variant="ghost"
											>
												<Search className="h-[17px] w-[17px] shrink-0" />
												{isSidebarOpen && (
													<span className="text-[13px]">Search</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/85 shadow-xl"
											>
												<span>Search</span>
											</TooltipContent>
										)}
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												className={cn(
													"cursor-pointer font-normal text-white/38 transition-colors hover:bg-white/[0.04] hover:text-white/75",
													isSidebarOpen
														? "h-9 w-full justify-start gap-3 rounded-md px-3"
														: "mx-auto h-8 w-8 rounded-md p-0",
												)}
												onClick={() => {
													setOpenMobile(false);
													router.push("/settings");
												}}
												type="button"
												variant="ghost"
											>
												<Sliders className="h-[17px] w-[17px] shrink-0" />
												{isSidebarOpen && (
													<span className="text-[13px]">Settings</span>
												)}
											</Button>
										</TooltipTrigger>
										{!isSidebarOpen && (
											<TooltipContent
												side="right"
												sideOffset={12}
												className="rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/85 shadow-xl"
											>
												<span>Settings</span>
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
