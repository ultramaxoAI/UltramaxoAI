"use client";

import {
	LayoutDashboard,
	LogOut,
	MessageCircle,
	MoreVertical,
	Settings,
	User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { guestRegex } from "@/lib/constants";
import { LoaderIcon } from "./icons";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { toast } from "./toast";

export function SidebarUserNav({
	user,
	isCollapsed = false,
}: {
	user: User;
	isCollapsed?: boolean;
}) {
	const router = useRouter();
	const { data, status } = useSession();
	const { setTheme, resolvedTheme } = useTheme();

	const isGuest = guestRegex.test(data?.user?.email ?? "");
	const isAdmin = data?.user?.role === "admin";

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							{status === "loading" ? (
								<div
									className={`flex items-center gap-3 p-4 border-t border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer rounded-lg mx-2 ${isCollapsed ? "justify-center" : ""}`}
								>
									<div className="size-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-500/30 shrink-0" />
									{!isCollapsed && (
										<>
											<div className="flex-1 min-w-0">
												<div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-500/30 mb-1" />
												<div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-500/30" />
											</div>
											<div className="animate-spin text-zinc-400 dark:text-zinc-500 shrink-0">
												<LoaderIcon />
											</div>
										</>
									)}
								</div>
							) : isCollapsed ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="flex items-center justify-center w-full p-2 border-t border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
											data-testid="user-nav-button"
											type="button"
										>
											<div className="relative shrink-0">
												<Image
													alt={user.email ?? "User Avatar"}
													className="rounded-full ring-2 ring-zinc-200 dark:ring-white/10"
													height={40}
													src={`https://avatar.vercel.sh/${user.email}`}
													width={40}
												/>
											</div>
										</button>
									</TooltipTrigger>
									<TooltipContent side="right">
										<div className="text-xs">
											<div className="font-semibold">
												{isGuest
													? "Guest User"
													: data?.user?.name ||
														user?.email?.split("@")[0] ||
														"User"}
											</div>
											<div className="text-zinc-500 dark:text-zinc-400">
												{isGuest ? "Not logged in" : user?.email}
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							) : (
								<button
									className="flex items-center gap-3 w-full p-4 border-t border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
									data-testid="user-nav-button"
									type="button"
								>
									<div className="relative shrink-0">
										<Image
											alt={user.email ?? "User Avatar"}
											className="rounded-full ring-2 ring-zinc-200 dark:ring-white/10"
											height={40}
											src={`https://avatar.vercel.sh/${user.email}`}
											width={40}
										/>
									</div>
									<div className="flex-1 min-w-0 text-left">
										<div className="flex items-center gap-2 mb-0.5">
											<div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
												{isGuest
													? "Guest User"
													: data?.user?.name ||
														user?.email?.split("@")[0] ||
														"User"}
											</div>
											{/* Dynamic Plan Badge */}
											{!isGuest && (
												<span
													className={`px-2 py-0.5 text-[10px] font-bold rounded border shrink-0 ${
														user?.type === "pro"
															? "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30"
															: "text-zinc-500 dark:text-gray-400 bg-transparent border-zinc-200 dark:border-gray-600/30"
													}`}
												>
													{user?.type === "pro" ? "PRO" : "FREE"}
												</span>
											)}
										</div>
										<div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
											{isGuest ? "Not logged in" : user?.email}
										</div>
									</div>
									<MoreVertical className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
								</button>
							)}
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-(--radix-popper-anchor-width) min-w-50 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
							data-testid="user-nav-menu"
							side="top"
						>
							{isAdmin && (
								<>
									<DropdownMenuItem
										className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
										onSelect={() => router.push("/admin")}
									>
										<LayoutDashboard className="h-4 w-4" />
										Admin Panel
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
								</>
							)}

							{!isGuest && (
								<DropdownMenuItem
									asChild
									className="hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								>
									<ProfileEditDialog />
								</DropdownMenuItem>
							)}

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => router.push("/settings")}
							>
								<Settings className="h-4 w-4" />
								Pengaturan
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								data-testid="user-nav-item-theme"
								onSelect={() =>
									setTheme(resolvedTheme === "dark" ? "light" : "dark")
								}
							>
								{resolvedTheme === "light" ? "Dark Mode" : "Light Mode"}
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => window.open("https://t.me/anjiingg", "_blank")}
							>
								<MessageCircle className="h-4 w-4" />
								Hubungi Kami
							</DropdownMenuItem>

							<DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
							<DropdownMenuItem
								asChild
								className="hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								data-testid="user-nav-item-auth"
							>
								<button
									className="w-full cursor-pointer flex items-center gap-2"
									onClick={() => {
										if (status === "loading") {
											toast({
												type: "error",
												description:
													"Checking authentication status, please try again!",
											});

											return;
										}

										if (isGuest) {
											router.push("/login");
										} else {
											signOut({
												redirectTo: "/",
											});
										}
									}}
									type="button"
								>
									{isGuest ? (
										<>
											<UserIcon size={14} />
											Login ke Akun
										</>
									) : (
										<>
											<LogOut className="h-4 w-4 text-red-500" />
											Sign out
										</>
									)}
								</button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);
}
("");
