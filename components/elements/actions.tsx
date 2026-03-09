"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ActionsProps = ComponentProps<"div">;

export const Actions = ({ className, children, ...props }: ActionsProps) => (
	<div className={cn("flex items-center gap-0.5", className)} {...props}>
		{children}
	</div>
);

export type ActionProps = ComponentProps<typeof Button> & {
	tooltip?: string;
	label?: string;
};

export const Action = ({
	tooltip,
	children,
	label,
	className,
	variant = "ghost",
	size = "sm",
	...props
}: ActionProps) => {
	const button = (
		<Button
			className={cn(
				"relative size-8 rounded-full p-1.5 text-[#727872] transition-colors hover:bg-black/4 hover:text-[#171717] dark:text-[#8f9790] dark:hover:bg-white/6 dark:hover:text-[#f3f4f1]",
				className,
			)}
			size={size}
			type="button"
			variant={variant}
			{...props}
		>
			{children}
			<span className="sr-only">{label || tooltip}</span>
		</Button>
	);

	if (tooltip) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{button}</TooltipTrigger>
					<TooltipContent>
						<p>{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return button;
};
