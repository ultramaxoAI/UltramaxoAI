"use client";

import {
  Edit3,
  Menu,
  MoreVertical,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { User } from "next-auth";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatExportButton } from "./chat-export-button";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatContextHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  chatTitle = "Untitled Chat",
  user,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  chatTitle?: string;
  user?: User;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setOpenMobile, isMobile, openMobile } = useSidebar();

  const handleToggleSidebar = () => {
    // Hanya buka kalau belum open, prevent double-click bug
    if (!openMobile) {
      setOpenMobile(true);
    }
  };

  const handleShareChat = async () => {
    const shareUrl = `${window.location.origin}/chat/${chatId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
    setIsMenuOpen(false);
  };

  const handleRenameChat = async () => {
    // biome-ignore lint/suspicious/noAlert: Simple prompt for renaming
    const newTitle = prompt("Enter new chat title:", chatTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle === chatTitle) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        toast.success("Chat renamed successfully");
        window.location.reload();
      } else {
        toast.error("Failed to rename chat");
      }
    } catch (err) {
      console.error("Failed to rename:", err);
      toast.error("Failed to rename chat");
    }
    setIsMenuOpen(false);
  };

  const handleDeleteChat = async () => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Chat deleted successfully");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete chat");
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
      {/* Left: Hamburger menu untuk mobile & Upgrade Button */}
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={handleToggleSidebar}
            size="sm"
            variant="ghost"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        )}
        {/* ChatGPT-style Upgrade Button */}
        {user && user.type !== "pro" && (
          <Link href="/plan">
            <Button
              className="h-8 px-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium shadow-lg shadow-indigo-500/20 transition-all"
              size="sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Upgrade Pro
            </Button>
          </Link>
        )}
      </div>

      {/* Center: Chat Title */}
      <div className="flex-1 min-w-0 text-center">
        <h2 className="text-sm font-medium text-muted-foreground truncate">
          {chatTitle}
        </h2>
      </div>

      {/* Right: Menu Button */}
      {!isReadonly && (
        <DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              size="sm"
              variant="ghost"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Chat actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50"
          >
            {/* Visibility Selector */}
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Chat Visibility
              </div>
              <VisibilitySelector
                chatId={chatId}
                selectedVisibilityType={selectedVisibilityType}
              />
            </div>

            <DropdownMenuSeparator />

            <ChatExportButton asMenuItem chatId={chatId} />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={handleShareChat}
            >
              <Share2 className="h-4 w-4" />
              Share Chat Link
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={handleRenameChat}
            >
              <Edit3 className="h-4 w-4" />
              Rename Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
              onClick={handleDeleteChat}
            >
              <Trash2 className="h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export const ChatContextHeader = memo(
  PureChatContextHeader,
  (prevProps, nextProps) => {
    return (
      prevProps.chatId === nextProps.chatId &&
      prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
      prevProps.isReadonly === nextProps.isReadonly &&
      prevProps.chatTitle === nextProps.chatTitle &&
      prevProps.user?.id === nextProps.user?.id
    );
  }
);
