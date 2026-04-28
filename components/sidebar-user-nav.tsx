"use client";

import {
	Download,
	KeyRound,
	LayoutDashboard,
	LogOut,
	MessageCircle,
	Moon,
	MoreVertical,
	Settings,
	Smartphone,
	Sun,
	User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
import { CreditBalanceBadge } from "./credit-balance-badge";
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

	// PWA Install Logic
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
	const [isInstallable, setIsInstallable] = useState(false);

	useEffect(() => {
		// In development or localhost, forcefully show the button for UI testing
		if (
			process.env.NODE_ENV === "development" ||
			(typeof window !== "undefined" &&
				window.location.hostname === "localhost")
		) {
			setIsInstallable(true);
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setIsInstallable(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) {
			if (
				process.env.NODE_ENV === "development" ||
				(typeof window !== "undefined" &&
					window.location.hostname === "localhost")
			) {
				toast({
					type: "success",
					description:
						"PWA Install simulated in Development Mode. In production, this will trigger the native prompt.",
				});
			}
			return;
		}

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setDeferredPrompt(null);
			setIsInstallable(false);
		}
	};

	const isGuest = guestRegex.test(data?.user?.email ?? "");
	const isAdmin = data?.user?.role === "admin";
	const apiConsoleUrl =
		typeof window !== "undefined" && window.location.hostname.endsWith("ultramaxo.tech")
			? "https://app.ultramaxo.tech"
			: "/api-console";

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem className="relative flex w-full flex-row items-center border-t border-black/6 dark:border-white/10 group">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							{status === "loading" ? (
								<div
									className={`mx-2 flex items-center gap-3 rounded-2xl border-t border-black/6 p-4 transition-colors cursor-pointer hover:bg-black/4 dark:border-white/10 dark:hover:bg-white/6 ${isCollapsed ? "justify-center" : ""}`}
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
											className="flex w-full items-center justify-center border-t border-black/6 p-2 transition-colors cursor-pointer group hover:bg-black/4 dark:border-white/10 dark:hover:bg-white/6"
											data-testid="user-nav-button"
											type="button"
										>
											<div className="relative shrink-0">
												<Image
													alt={user.email ?? "User Avatar"}
													className="rounded-full ring-2 ring-zinc-200 dark:ring-white/10"
													height={40}
													src={`https://ui-avatars.com/api/?name=${user.email}&background=random`}
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
									className="flex flex-1 items-center gap-3 rounded-2xl p-4 transition-colors cursor-pointer group hover:bg-black/4 dark:hover:bg-white/6"
									data-testid="user-nav-button"
									type="button"
								>
									<div className="relative shrink-0">
										<Image
											alt={user.email ?? "User Avatar"}
											className="rounded-full ring-2 ring-zinc-200 dark:ring-white/10"
											height={40}
											src={`https://ui-avatars.com/api/?name=${user.email}&background=random`}
											width={40}
										/>
									</div>
									<div className="flex-1 min-w-0 text-left">
										<div className="flex items-center gap-2 mb-0.5">
											<div className="truncate text-sm font-semibold text-[#241a12] dark:text-[#f5efe8]">
												{isGuest
													? "Guest User"
													: data?.user?.name ||
														user?.email?.split("@")[0] ||
														"User"}
											</div>
											{/* Dynamic Plan Badge */}
											{!isGuest && (
												<span
													className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
														user?.type === "pro"
															? "border-[#d4a06e]/30 bg-[#d4a06e]/12 text-[#9f6440] dark:border-[#d4a06e]/30 dark:bg-[#d4a06e]/12 dark:text-[#f0c499]"
															: "border-black/8 bg-transparent text-[#8a7869] dark:border-white/10 dark:text-[#9a8979]"
													}`}
												>
													{user?.type === "pro" ? "PRO" : "FREE"}
												</span>
											)}
										</div>
								<div className="truncate text-xs text-[#8a7869] dark:text-[#9a8979]">
									{isGuest ? "Not logged in" : user?.email}
								</div>
								{!isGuest ? (
									<div className="mt-2">
										<CreditBalanceBadge compact />
									</div>
								) : null}
							</div>
									<MoreVertical className="h-5 w-5 shrink-0 text-[#8a7869] transition-colors group-hover:text-[#241a12] dark:text-[#9a8979] dark:group-hover:text-[#f5efe8]" />
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

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => window.open("/app-release.apk", "_blank")}
							>
								<Smartphone className="h-4 w-4" />
								Download App
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => window.open(apiConsoleUrl, "_blank")}
							>
								<KeyRound className="h-4 w-4" />
								API Console
							</DropdownMenuItem>

							{!isGuest && <ProfileEditDialog />}

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => router.push("/settings")}
							>
								<Settings className="h-4 w-4" />
								Settings
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								data-testid="user-nav-item-theme"
								onSelect={() =>
									setTheme(resolvedTheme === "dark" ? "light" : "dark")
								}
							>
								{resolvedTheme === "light" ? (
									<Moon className="h-4 w-4" />
								) : (
									<Sun className="h-4 w-4" />
								)}
								{resolvedTheme === "light" ? "Dark Mode" : "Light Mode"}
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800"
								onSelect={() => window.open("https://t.me/anjiingg", "_blank")}
							>
								<MessageCircle className="h-4 w-4" />
								Contact Us
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
											const logoutRedirect =
												typeof window !== "undefined" &&
												window.location.hostname.endsWith("ultramaxo.tech")
													? "https://ultramaxo.tech/login?loggedOut=1"
													: "/login?loggedOut=1";

											signOut({
												callbackUrl: logoutRedirect,
											});
										}
									}}
									type="button"
								>
									{isGuest ? (
										<>
											<UserIcon size={14} />
											Log in to Account
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

					{/* Download App Button next to profile */}
					{!isCollapsed && isInstallable && status !== "loading" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={handleInstallClick}
									className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
								>
									<Download className="h-4 w-4" />
								</button>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p className="text-xs">Get the app</p>
							</TooltipContent>
						</Tooltip>
					)}
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);
}
