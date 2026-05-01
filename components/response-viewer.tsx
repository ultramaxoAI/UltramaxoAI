"use client";

import { cn } from "@/lib/utils";
import { Response } from "./elements/response";

export function ResponseViewer({
	text,
	className,
	showModes = true,
	hideCodeBlocks = false,
	isLoading = false,
}: {
	text: string;
	className?: string;
	showModes?: boolean;
	hideCodeBlocks?: boolean;
	isLoading?: boolean;
}) {
	return (
		<div className={cn("space-y-3", className)}>
			{/* Normal view: selalu tampil seperti AI biasa */}
			<Response className={className} isLoading={isLoading}>
				{text}
			</Response>
		</div>
	);
}
