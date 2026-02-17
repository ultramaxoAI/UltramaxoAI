"use client";

import { memo, useState } from "react";
import { 
  MoreVertical, 
  Share2, 
  Edit3, 
  Trash2,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { ChatExportButton } from "./chat-export-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function PureChatContextHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  chatTitle = "Untitled Chat",
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  chatTitle?: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setOpenMobile, isMobile, openMobile } = useSidebar();

  const handleToggleSidebar = () => {
    // Hanya buka kalau belum open, prevent double-click bug
    if (!openMobile) {
      setOpenMobile(true);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
      {/* Left: Hamburger menu untuk mobile */}
      <div className="w-8">
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={handleToggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
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
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Chat actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-50">
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
            
            <ChatExportButton 
              chatId={chatId}
              asMenuItem
            />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Share2 className="h-4 w-4" />
              Share Chat Link
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Edit3 className="h-4 w-4" />
              Rename Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export const ChatContextHeader = memo(PureChatContextHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.chatTitle === nextProps.chatTitle
  );
});
