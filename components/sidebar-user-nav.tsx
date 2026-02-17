"use client";

import { useState } from "react";
import { 
  MoreVertical,
  LayoutDashboard, 
  Settings, 
  LogOut,
  User as UserIcon
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { guestRegex } from "@/lib/constants";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";
import { SettingsDialog } from "./settings-dialog";
import { UpgradeProButton } from "./upgrade-pro-button";
import { ProfileEditDialog } from "./profile-edit-dialog";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarUserNav({ user, isCollapsed = false }: { user: User; isCollapsed?: boolean }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isGuest = guestRegex.test(data?.user?.email ?? "");
  const isAdmin = data?.user?.role === 'admin';

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {status === "loading" ? (
                <div className={`flex items-center gap-3 p-4 border-t border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer rounded-lg mx-2 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className="size-10 animate-pulse rounded-full bg-zinc-500/30 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-24 animate-pulse rounded bg-zinc-500/30 mb-1" />
                        <div className="h-3 w-32 animate-pulse rounded bg-zinc-500/30" />
                      </div>
                      <div className="animate-spin text-zinc-500 shrink-0">
                        <LoaderIcon />
                      </div>
                    </>
                  )}
                </div>
              ) : isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex items-center justify-center w-full p-2 border-t border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      data-testid="user-nav-button"
                    >
                      <div className="relative shrink-0">
                        <Image
                          alt={user.email ?? "User Avatar"}
                          className="rounded-full ring-2 ring-white/10"
                          height={40}
                          src={`https://avatar.vercel.sh/${user.email}`}
                          width={40}
                        />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="text-xs">
                      <div className="font-semibold">{isGuest ? "Guest User" : data?.user?.name || user?.email?.split('@')[0] || "User"}</div>
                      <div className="text-zinc-400">{isGuest ? "Not logged in" : user?.email}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  className="flex items-center gap-3 w-full p-4 border-t border-white/10 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  data-testid="user-nav-button"
                >
                  <div className="relative shrink-0">
                    <Image
                      alt={user.email ?? "User Avatar"}
                      className="rounded-full ring-2 ring-white/10"
                      height={40}
                      src={`https://avatar.vercel.sh/${user.email}`}
                      width={40}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-sm text-white truncate">
                      {isGuest ? "Guest User" : data?.user?.name || user?.email?.split('@')[0] || "User"}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {isGuest ? "Not logged in" : user?.email}
                    </div>
                  </div>
                  <MoreVertical className="h-5 w-5 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-popper-anchor-width) min-w-50 bg-zinc-900 border-zinc-800 rounded-xl shadow-lg"
              data-testid="user-nav-menu"
              side="top"
              align="start"
            >
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 hover:bg-zinc-800 rounded-lg focus:bg-zinc-800"
                    onSelect={() => router.push("/admin")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                </>
              )}

              {!isGuest && (
                <DropdownMenuItem asChild className="hover:bg-zinc-800 rounded-lg focus:bg-zinc-800">
                  <ProfileEditDialog />
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="cursor-pointer gap-2 hover:bg-zinc-800 rounded-lg focus:bg-zinc-800"
                onSelect={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer gap-2 hover:bg-zinc-800 rounded-lg focus:bg-zinc-800"
                data-testid="user-nav-item-theme"
                onSelect={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {resolvedTheme === "light" ? "Dark Mode" : "Light Mode"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild data-testid="user-nav-item-auth" className="hover:bg-zinc-800 rounded-lg focus:bg-zinc-800">
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

      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </>
  );
}
``