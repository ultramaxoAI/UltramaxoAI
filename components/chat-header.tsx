"use client";

import { memo } from "react";
import { useSession } from "next-auth/react";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { ChatExportButton } from "./chat-export-button";
import { UpgradeProButton } from "./upgrade-pro-button";
import { guestRegex } from "@/lib/constants";

function PureChatHeader({  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { data } = useSession();
  const isGuest = guestRegex.test(data?.user?.email ?? "");

  return (
    <header className="sticky top-0 flex items-center justify-between gap-2 bg-background px-4 py-2 border-b border-border z-10">
      <div className="flex items-center gap-2">
        {!isReadonly && (
          <>
            <VisibilitySelector
              chatId={chatId}
              selectedVisibilityType={selectedVisibilityType}
            />
            <ChatExportButton 
              chatId={chatId} 
            />
          </>
        )}
      </div>
      
      {/* Upgrade Pro Button - Top Right */}
      {!isGuest && data?.user && (
        <UpgradeProButton user={data.user} />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
