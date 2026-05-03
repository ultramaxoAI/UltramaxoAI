"use client";

import { MoreHorizontal, PanelLeft } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { VisibilityType } from "./visibility-selector";

function PureChatHeader({
	chatTitle = "Untitled Chat",
}: {
	chatId: string;
	selectedVisibilityType: VisibilityType;
	isReadonly: boolean;
	chatTitle?: string;
}) {
	const { open, toggleSidebar } = useSidebar();

	return (
		<header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-white/[0.05] bg-[#0a0a0a] px-4 text-white">
			<div className="flex min-w-0 items-center gap-2">
				{!open && (
					<Button
						aria-label="Open sidebar"
						className="mr-0.5 h-7 w-7 rounded-lg border border-transparent bg-transparent p-0 text-white/28 hover:bg-white/[0.05] hover:text-white/60"
						onClick={toggleSidebar}
						type="button"
						variant="ghost"
					>
						<PanelLeft className="h-[14px] w-[14px]" />
					</Button>
				)}
				<h1 className="truncate text-[13px] font-medium text-white/50">
					{chatTitle || "Chat baru"}
				</h1>
			</div>
			<Button
				aria-label="More options"
				className="h-7 w-7 rounded-lg border border-transparent bg-transparent p-0 text-white/28 hover:bg-white/[0.05] hover:text-white/55"
				type="button"
				variant="ghost"
			>
				<MoreHorizontal className="h-[14px] w-[14px]" />
			</Button>
		</header>
	);
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
	return (
		prevProps.chatId === nextProps.chatId &&
		prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
		prevProps.isReadonly === nextProps.isReadonly &&
		prevProps.chatTitle === nextProps.chatTitle
	);
});
