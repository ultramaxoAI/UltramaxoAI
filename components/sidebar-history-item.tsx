import Link from "next/link";
import { memo } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import {
	CheckCircleFillIcon,
	GlobeIcon,
	LockIcon,
	MoreHorizontalIcon,
	ShareIcon,
	TrashIcon,
} from "./icons";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

const PureChatItem = ({
	chat,
	isActive,
	onDelete,
	setOpenMobile,
}: {
	chat: Chat;
	isActive: boolean;
	onDelete: (chatId: string) => void;
	setOpenMobile: (open: boolean) => void;
}) => {
	const { visibilityType, setVisibilityType } = useChatVisibility({
		chatId: chat.id,
		initialVisibilityType: chat.visibility,
	});

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				className="rounded-2xl text-[#3e433e] transition-all hover:bg-white/70 hover:text-[#171717] data-[active=true]:bg-white/80 data-[active=true]:text-[#171717] data-[active=true]:shadow-[0_10px_24px_rgba(23,23,23,0.05)] dark:text-[#b8beb8] dark:hover:bg-white/6 dark:hover:text-[#f3f4f1] dark:data-[active=true]:bg-white/8 dark:data-[active=true]:text-[#f3f4f1] dark:data-[active=true]:shadow-none"
				isActive={isActive}
			>
				<Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
					<span>{chat.title}</span>
				</Link>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction
						className="mr-0.5 rounded-xl data-[state=open]:bg-white/70 data-[state=open]:text-[#171717] dark:data-[state=open]:bg-white/7 dark:data-[state=open]:text-[#f3f4f1]"
						showOnHover={!isActive}
					>
						<MoreHorizontalIcon />
						<span className="sr-only">More</span>
					</SidebarMenuAction>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg"
					side="bottom"
				>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="cursor-pointer">
							<ShareIcon />
							<span>Share</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuItem
									className="cursor-pointer flex-row justify-between"
									onClick={() => {
										setVisibilityType("private");
									}}
								>
									<div className="flex flex-row items-center gap-2">
										<LockIcon size={12} />
										<span>Private</span>
									</div>
									{visibilityType === "private" ? (
										<CheckCircleFillIcon />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer flex-row justify-between"
									onClick={() => {
										setVisibilityType("public");
									}}
								>
									<div className="flex flex-row items-center gap-2">
										<GlobeIcon />
										<span>Public</span>
									</div>
									{visibilityType === "public" ? <CheckCircleFillIcon /> : null}
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>

					<DropdownMenuItem
						className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
						onSelect={() => onDelete(chat.id)}
					>
						<TrashIcon />
						<span>Delete</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
	if (prevProps.isActive !== nextProps.isActive) {
		return false;
	}
	return true;
});
