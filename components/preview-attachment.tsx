"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { Attachment } from "@/lib/types";
import { Loader } from "./elements/loader";
import { CrossSmallIcon } from "./icons";
import { Button } from "./ui/button";

export const PreviewAttachment = ({
	attachment,
	isUploading = false,
	onRemove,
}: {
	attachment: Attachment;
	isUploading?: boolean;
	onRemove?: () => void;
}) => {
	const { name, url, contentType } = attachment;
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const titleId = useId();
	const isImage = Boolean(contentType?.startsWith("image") && url);

	useEffect(() => {
		if (!isPreviewOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsPreviewOpen(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isPreviewOpen]);

	return (
		<>
			<div
				className="group relative size-16 overflow-hidden rounded-lg border border-white/[0.09] bg-white/[0.04]"
				data-testid="input-attachment-preview"
			>
				{isImage ? (
					<button
						aria-label={`Preview ${name ?? "image attachment"}`}
						className="block size-full cursor-zoom-in"
						onClick={() => setIsPreviewOpen(true)}
						type="button"
					>
						<Image
							alt={name ?? "An image attachment"}
							className="size-full object-cover"
							height={64}
							src={url}
							width={64}
						/>
					</button>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground text-xs">
						File
					</div>
				)}

				{isUploading && (
					<div
						className="absolute inset-0 flex items-center justify-center bg-black/50"
						data-testid="input-attachment-loader"
					>
						<Loader size={16} />
					</div>
				)}

				{onRemove && !isUploading && (
					<Button
						aria-label={`Remove ${name ?? "attachment"}`}
						className="absolute top-0.5 right-0.5 size-4 rounded-full border border-white/[0.12] bg-[#080808]/80 p-0 text-white/65 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white/90 group-hover:opacity-100"
						onClick={(event) => {
							event.stopPropagation();
							onRemove();
						}}
						size="sm"
						type="button"
						variant="ghost"
					>
						<CrossSmallIcon size={8} />
					</Button>
				)}

				<div className="absolute inset-x-0 bottom-0 truncate bg-black/72 px-1 py-0.5 text-[10px] text-white/80">
					{name}
				</div>
			</div>

			{isPreviewOpen && isImage ? (
				<div
					aria-labelledby={titleId}
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/92 p-4"
					onClick={() => setIsPreviewOpen(false)}
					role="dialog"
				>
					<div
						className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/[0.09] bg-[#080808]"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between gap-3 border-white/[0.08] border-b px-4 py-3">
							<div className="min-w-0">
								<p
									className="truncate font-medium text-[13px] text-white/85"
									id={titleId}
								>
									{name ?? "Image preview"}
								</p>
								<p className="text-[12px] text-white/35">{contentType}</p>
							</div>
							<button
								className="shrink-0 rounded-md px-2 py-1 text-[12px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/80"
								onClick={() => setIsPreviewOpen(false)}
								type="button"
							>
								Close
							</button>
						</div>
						<div className="flex min-h-0 flex-1 items-center justify-center p-3">
							<Image
								alt={name ?? "An image attachment"}
								className="max-h-[78vh] w-auto max-w-full object-contain"
								height={1200}
								src={url}
								width={1200}
							/>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};
