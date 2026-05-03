"use client";

import {
	Download,
	KeyRound,
	LayoutDashboard,
	LogOut,
	MessageCircle,
	Moon,
	Settings,
	Smartphone,
	Sun,
	User as UserIcon,
} from "lucide-react";
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
		typeof window !== "undefined" &&
		window.location.hostname.endsWith("ultramaxo.tech")
			? "https://app.ultramaxo.tech"
			: "/api-console";

	return (
		<SidebarMenu>
			<SidebarMenuItem className="group relative flex w-full flex-row items-center border-t border-white/[0.06] px-2 py-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{status === "loading" ? (
							<div
								className={`flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/6 ${isCollapsed ? "w-full justify-center" : "w-full"}`}
							>
								<div className="size-9 animate-pulse rounded-full bg-white/10 shrink-0" />
								{!isCollapsed && (
									<>
										<div className="flex-1 min-w-0">
											<div className="mb-1 h-4 w-24 animate-pulse rounded bg-white/10" />
											<div className="h-3 w-32 animate-pulse rounded bg-white/10" />
										</div>
										<div className="shrink-0 animate-spin text-white/35">
											<LoaderIcon />
										</div>
									</>
								)}
							</div>
						) : isCollapsed ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="group flex w-full cursor-pointer items-center justify-center rounded-md p-2 transition-colors hover:bg-white/[0.04]"
										data-testid="user-nav-button"
										type="button"
									>
										<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/55">
											{(data?.user?.name || user?.email || "U")
												.charAt(0)
												.toUpperCase()}
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
								className="group flex flex-1 cursor-pointer items-center gap-2.5 rounded-md p-2.5 transition-colors hover:bg-white/[0.04]"
								data-testid="user-nav-button"
								type="button"
							>
								<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/55">
									{(data?.user?.name || user?.email || "U")
										.charAt(0)
										.toUpperCase()}
								</div>
								<div className="flex-1 min-w-0 text-left">
									<div className="mb-0.5 truncate text-[12px] font-medium text-white/58">
										{isGuest
											? "Guest User"
											: data?.user?.name ||
												user?.email?.split("@")[0] ||
												"User"}
									</div>
									<div className="truncate text-[12px] text-white/38">
										{isGuest ? "Not logged in" : user?.email}
									</div>
								</div>
								<Settings className="h-3.5 w-3.5 shrink-0 text-white/22 transition-colors group-hover:text-white/50" />
							</button>
						)}
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-popper-anchor-width) min-w-50 rounded-xl border border-white/[0.08] bg-[#111111] p-1 text-white/78 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
						data-testid="user-nav-menu"
						side="top"
					>
						{isAdmin && (
							<>
								<DropdownMenuItem
									className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
									onSelect={() => router.push("/admin")}
								>
									<LayoutDashboard className="h-4 w-4" />
									Admin Panel
								</DropdownMenuItem>
								<DropdownMenuSeparator className="bg-white/[0.06]" />
							</>
						)}

						<DropdownMenuItem
							className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
							onSelect={() => window.open("/app-release.apk", "_blank")}
						>
							<Smartphone className="h-4 w-4" />
							Download App
						</DropdownMenuItem>

						<DropdownMenuItem
							className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
							onSelect={() => window.open(apiConsoleUrl, "_blank")}
						>
							<KeyRound className="h-4 w-4" />
							API Console
						</DropdownMenuItem>

						{!isGuest && <ProfileEditDialog />}

						<DropdownMenuItem
							className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
							onSelect={() => router.push("/settings")}
						>
							<Settings className="h-4 w-4" />
							Settings
						</DropdownMenuItem>

						<DropdownMenuItem
							className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
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
							className="cursor-pointer gap-2 rounded-md text-white/72 focus:bg-white/[0.06] focus:text-white hover:bg-white/[0.06] hover:text-white"
							onSelect={() =>
								window.open("https://t.me/+CQR8SWdH5nE2OTdk", "_blank")
							}
						>
							<MessageCircle className="h-4 w-4" />
							Community
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
								className="absolute top-1/2 right-12 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/6 hover:text-white/75"
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
	);
}
