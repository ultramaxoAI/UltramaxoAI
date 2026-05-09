"use client";

import type { ToolUIPart } from "ai";
import {
	CheckCircleIcon,
	ChevronDownIcon,
	Loader2Icon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
	<Collapsible
		className={cn(
			"not-prose mb-4 w-full overflow-hidden rounded-[14px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-[8px]",
			className,
		)}
		style={{
			background: "rgba(255,255,255,0.03)",
			borderWidth: "0.5px",
			backdropFilter: "blur(8px)",
		}}
		{...props}
	/>
);

export type ToolHeaderProps = {
	type: ToolUIPart["type"];
	state: ToolUIPart["state"];
	className?: string;
	title?: ReactNode;
	icon?: ReactNode;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
	const isDone = status === "output-available";
	const isNeutralPending =
		status === "input-streaming" ||
		status === "input-available" ||
		status === "approval-requested" ||
		status === "approval-responded";
	const label = isDone
		? "Done"
		: isNeutralPending
			? status === "approval-requested" || status === "input-streaming"
				? "Pending"
				: "Running"
			: status === "output-denied"
				? "Denied"
				: "Error";

	const icon: ReactNode = isDone ? (
		<CheckCircleIcon className="size-[10px] text-[rgba(62,207,142,0.8)]" />
	) : isNeutralPending ? (
		<Loader2Icon className="size-[10px] animate-spin text-white/[0.4]" />
	) : (
		<XCircleIcon className="size-[10px] text-white/[0.4]" />
	);

	return (
		<Badge
			className={cn(
				"flex shrink-0 items-center gap-[4px] whitespace-nowrap rounded-[20px] border px-[9px] py-[3px] text-[10.5px] font-normal",
				isDone
					? "border-[rgba(62,207,142,0.2)] bg-[rgba(62,207,142,0.07)] text-[rgba(62,207,142,0.8)]"
					: "border-white/[0.08] bg-white/[0.05] text-white/[0.35]",
			)}
			style={{ borderWidth: "0.5px" }}
			variant="secondary"
		>
			{icon}
			<span className="hidden sm:inline">{label}</span>
		</Badge>
	);
};

export const ToolHeader = ({
	className,
	type,
	state,
	title,
	icon,
	...props
}: ToolHeaderProps) => (
	<CollapsibleTrigger
		className={cn(
			"flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden px-[14px] py-[10px] transition-colors hover:bg-white/[0.02]",
			className,
		)}
		{...props}
	>
		<div className="flex min-w-0 flex-1 items-center gap-[9px]">
			<div
				className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.05] text-white/[0.4]"
				style={{ borderWidth: "0.5px" }}
			>
				{icon || <WrenchIcon className="size-[11px] shrink-0 text-white/[0.4]" />}
			</div>
			<span className="truncate text-[12.5px] font-normal text-white/[0.6]">
				{title || type}
			</span>
		</div>
		<div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
			{getStatusBadge(state)}
			<ChevronDownIcon className="size-4 text-white/[0.28] transition-transform group-data-[state=open]:rotate-180" />
		</div>
	</CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
	<CollapsibleContent
		className={cn(
			"border-t border-white/[0.05] data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-white/[0.7] outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		style={{ borderTopWidth: "0.5px" }}
		{...props}
	/>
);

export type ToolInputProps = ComponentProps<"div"> & {
	input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
	<div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
		<h4 className="text-[11px] font-medium uppercase tracking-wide text-white/[0.3]">
			Parameters
		</h4>
		<pre
			className="overflow-x-auto rounded-[10px] border border-white/[0.06] bg-white/[0.03] p-3 font-mono text-xs text-white/[0.58]"
			style={{ borderWidth: "0.5px" }}
		>
			{JSON.stringify(input, null, 2)}
		</pre>
	</div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
	output: ReactNode;
	errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({
	className,
	output,
	errorText,
	...props
}: ToolOutputProps) => {
	if (!(output || errorText)) {
		return null;
	}

	return (
		<div className={cn("space-y-2 p-4", className)} {...props}>
			<h4 className="text-[11px] font-medium uppercase tracking-wide text-white/[0.3]">
				{errorText ? "Error" : "Result"}
			</h4>
			<div
				className="overflow-x-auto rounded-[10px] border border-white/[0.06] bg-white/[0.03] text-xs text-white/[0.65] [&_table]:w-full"
				style={{ borderWidth: "0.5px" }}
			>
				{errorText && <div className="p-3 text-white/[0.45]">{errorText}</div>}
				{output && <div>{output}</div>}
			</div>
		</div>
	);
};
