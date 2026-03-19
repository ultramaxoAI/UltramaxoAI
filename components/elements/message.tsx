import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
	from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
	<div
		className={cn(
			"group flex w-full items-end justify-end gap-2 py-3",
			from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
			"[&>div]:max-w-[85%]",
			className,
		)}
		{...props}
	/>
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
	children,
	className,
	...props
}: MessageContentProps) => (
	<div
		className={cn(
			"flex flex-col gap-2 overflow-hidden px-4 py-2.5 text-foreground text-[14.5px] leading-relaxed",
			"group-[.is-user]:bg-[#ececf1]/80 group-[.is-user]:dark:bg-[#343541] group-[.is-user]:text-foreground group-[.is-user]:rounded-[1.25rem] group-[.is-user]:shadow-sm group-[.is-user]:border group-[.is-user]:border-black/5 group-[.is-user]:dark:border-white/5",
			"group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-foreground",
			"is-user:dark",
			className,
		)}
		{...props}
	>
		{children}
	</div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
	src: string;
	name?: string;
};

export const MessageAvatar = ({
	src,
	name,
	className,
	...props
}: MessageAvatarProps) => (
	<Avatar className={cn("size-8 ring-1 ring-border", className)} {...props}>
		<AvatarImage alt="" className="my-0" src={src} />
		<AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
	</Avatar>
);
