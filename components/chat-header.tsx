"use client";

import { useSession } from "next-auth/react";
import { memo } from "react";
import { guestRegex } from "@/lib/constants";
import { ChatExportButton } from "./chat-export-button";
import { UpgradeProButton } from "./upgrade-pro-button";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
	chatId,
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
		<header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/6 bg-[linear-gradient(180deg,rgba(246,242,234,0.9),rgba(246,242,234,0.72))] px-3 py-2.5 backdrop-blur-xl dark:border-white/6 dark:bg-[linear-gradient(180deg,rgba(11,13,16,0.92),rgba(11,13,16,0.74))] sm:px-4">
			<div className="flex items-center gap-2">
				{!isReadonly && (
					<>
						<VisibilitySelector
							chatId={chatId}
							selectedVisibilityType={selectedVisibilityType}
						/>
						<ChatExportButton chatId={chatId} />
					</>
				)}
			</div>

			{!isGuest && data?.user && <UpgradeProButton user={data.user} />}
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
