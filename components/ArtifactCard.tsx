"use client";

import { Check, FileText, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_SUBTITLES = [
	"Menyiapkan struktur file",
	"Menyusun isi awal",
	"Merapikan detail implementasi",
];

export function ArtifactCard({
	filename,
	status,
	subtitles = DEFAULT_SUBTITLES,
	onOpen,
	className,
	title,
}: {
	filename: string;
	status: "streaming" | "done" | "pending";
	subtitles?: string[];
	onOpen?: () => void;
	className?: string;
	title?: string;
}) {
	const [subtitleIndex, setSubtitleIndex] = useState(0);
	const [subtitleVisible, setSubtitleVisible] = useState(true);
	const [isPossiblyStuck, setIsPossiblyStuck] = useState(false);
	const visualStatus =
		status === "done"
			? "done"
			: isPossiblyStuck
				? "stuck"
				: status === "pending"
					? "pending"
					: "streaming";

	useEffect(() => {
		if (status === "done") {
			setIsPossiblyStuck(false);
			return;
		}

		const timeout = window.setTimeout(() => {
			setIsPossiblyStuck(true);
		}, 10_000);

		return () => window.clearTimeout(timeout);
	}, [status, filename]);

	useEffect(() => {
		if (subtitles.length <= 1) {
			return;
		}

		const interval = window.setInterval(() => {
			setSubtitleVisible(false);
			window.setTimeout(() => {
				setSubtitleIndex((index) => (index + 1) % subtitles.length);
				setSubtitleVisible(true);
			}, 180);
		}, 2500);

		return () => window.clearInterval(interval);
	}, [subtitles]);

	return (
		<div
			className={cn(
				"w-full max-w-[540px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-white/[0.03] font-sans backdrop-blur-[8px]",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
				borderWidth: "0.5px",
				background: "rgba(255,255,255,0.03)",
				backdropFilter: "blur(8px)",
			}}
		>
			<div className="flex items-center gap-[9px] px-[14px] py-[10px]">
				<div
					className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.05] text-white/40"
					style={{ borderWidth: "0.5px" }}
				>
					<FileText className="size-[11px]" strokeWidth={1.5} />
				</div>
				<span className="min-w-0 flex-1 truncate text-[12.5px] text-white/60">
					{filename}
				</span>
				<div
					className={cn(
						"inline-flex items-center gap-[4px] rounded-[20px] border px-[9px] py-[3px] text-[10.5px]",
						visualStatus === "done"
							? "border-[rgba(62,207,142,0.2)] bg-[rgba(62,207,142,0.07)] text-[rgba(62,207,142,0.8)]"
							: "border-white/[0.08] bg-white/[0.05] text-white/[0.35]",
					)}
					style={{ borderWidth: "0.5px" }}
				>
					{visualStatus === "done" ? (
						<Check className="size-[10px]" strokeWidth={1.8} />
					) : (
						<Loader2 className="size-[10px] animate-spin text-white/40" strokeWidth={1.8} />
					)}
					<span>
						{visualStatus === "done"
							? "Done"
							: visualStatus === "pending" || visualStatus === "stuck"
								? "Pending"
								: "Streaming"}
					</span>
				</div>
			</div>

			<div
				className="flex items-center gap-[10px] border-t px-[14px] py-[10px]"
				style={{ borderTopWidth: "0.5px" }}
			>
				<div
					className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-white/[0.07] bg-white/[0.04] text-white/34"
					style={{ borderWidth: "0.5px" }}
				>
					<Sparkles className="size-[13px]" strokeWidth={1.5} />
				</div>
				<div className="min-w-0 flex-1">
					<div className="truncate text-[11.5px] text-white/50">
						{title ?? `${status === "done" ? 'Created' : 'Creating'} \"${filename}\"`}
					</div>
					<div
						className={cn(
							"mt-[2px] text-[10px] text-white/25 transition-opacity duration-200",
							subtitleVisible ? "opacity-100" : "opacity-0",
						)}
					>
						{subtitles[subtitleIndex]}
					</div>
				</div>
				{visualStatus !== "done" ? (
					<Loader2 className="size-[12px] shrink-0 animate-spin text-white/40" strokeWidth={1.7} />
				) : null}
			</div>

			<button
				className="flex w-full items-center justify-center gap-[6px] border-t bg-transparent px-[14px] py-[8px] text-center text-[11.5px] text-white/35 transition-colors duration-150 hover:bg-white/[0.02] hover:text-white/55"
				style={{ borderTopWidth: "0.5px" }}
				onClick={onOpen}
				type="button"
			>
				Buka di workspace ↗
			</button>
		</div>
	);
}
