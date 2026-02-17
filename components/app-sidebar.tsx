"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { SquarePen, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { cn } from "@/lib/utils";
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
      <Sidebar collapsible="icon" className="border-r border-border bg-zinc-900 z-30">
        <SidebarHeader className="border-b border-border/10">
          <SidebarMenu>
            <div className="flex flex-col gap-2 px-3 py-4">
              {/* Toggle + Title Row */}
              <div className="flex items-center gap-2 mb-1">
                {/* Toggle Button */}
                <Button
                  className="h-8 w-8 p-0 rounded-md hover:bg-white/10 transition-colors shrink-0"
                  onClick={() => setOpen(!open)}
                  type="button"
                  variant="ghost"
                  aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {/* App Title - show when open */}
                {isSidebarOpen && (
                  <Link
                    href="/"
                    className="flex items-center hover:opacity-80 transition-opacity"
                    onClick={() => setOpenMobile(false)}
                  >
                    <span className="font-semibold text-base tracking-tight text-white">
                      UltramaxoAI
                    </span>
                  </Link>
                )}
              </div>
              
              {/* New Chat Button */}
              <Button
                className={cn(
                  "rounded-md hover:bg-white/10 transition-colors",
                  isSidebarOpen ? "w-full justify-start gap-2 px-2 h-9" : "h-9 w-9 p-0 mx-auto"
                )}
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/");
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
              <span className="text-zinc-500 text-xs rotate-180" style={{ writingMode: 'vertical-rl' }}>
                History
              </span>
            </div>
          )}
        </SidebarContent>
        <SidebarFooter>
          {user && <SidebarUserNav user={user} isCollapsed={!isSidebarOpen} />}
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
