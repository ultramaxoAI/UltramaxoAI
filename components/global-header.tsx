"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/components/ui/sidebar";
import { guestRegex } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SidebarToggle } from "./sidebar-toggle";
import { UpgradeProButton } from "./upgrade-pro-button";

export function GlobalHeader() {
  const { data } = useSession();
  const isGuest = guestRegex.test(data?.user?.email ?? "");
  const { state } = useSidebar();
  const isSidebarOpen = state === "expanded";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 ease-in-out",
        isSidebarOpen ? "left-0 md:left-64" : "left-0 md:left-20"
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-3">
        {/* Sidebar Toggle - Always Visible */}
        <div className="flex items-center gap-3">
          <SidebarToggle />

          {/* Logo */}
          <Link
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            href="/"
          >
            <span className="font-semibold text-xl tracking-tight">
              UltramaxoAI
            </span>
          </Link>
        </div>

        {/* Upgrade Plan Button */}
        <div className="flex items-center gap-3">
          {!isGuest && data?.user && <UpgradeProButton user={data.user} />}
        </div>
      </div>
    </header>
  );
}
