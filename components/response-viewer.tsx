"use client";

import { MessageRenderer } from "@/components/MessageRenderer";
import { cn } from "@/lib/utils";

function stripCodeBlocks(text: string) {
	return text.replace(/```[\s\S]*?```/g, "").trim();
}

export function ResponseViewer({
	text,
	className,
	hideCodeBlocks = false,
}: {
	text: string;
	className?: string;
	showModes?: boolean;
	hideCodeBlocks?: boolean;
	isLoading?: boolean;
}) {
	const strippedText = hideCodeBlocks ? stripCodeBlocks(text) : text;
	const content =
		hideCodeBlocks && strippedText.length > 0 ? strippedText : text;

	return (
		<div className={cn("space-y-3", className)}>
			<MessageRenderer content={content} />
		</div>
	);
}
