"use client";

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
				"w-full max-w-[540px] overflow-hidden rounded-lg border border-white/[0.09] bg-white/[0.04] font-sans",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
				borderWidth: "0.5px",
				background: "rgba(255,255,255,0.04)",
			}}
		>
			<div className="flex items-start gap-4 px-[14px] py-[12px]">
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium text-[13px] text-white/85">
						{title ?? filename}
					</div>
					<div
						className={cn(
							"mt-[2px] truncate text-[11px] text-white/35 transition-opacity duration-200",
							subtitleVisible ? "opacity-100" : "opacity-0",
						)}
					>
						{visualStatus === "done"
							? filename
							: subtitles[subtitleIndex]}
					</div>
				</div>
				<span
					className={cn(
						"shrink-0 pt-[1px] font-mono text-[11px]",
						visualStatus === "done" ? "text-[#10B981]" : "text-white/35",
					)}
				>
					{visualStatus === "done"
						? "✓ done"
						: visualStatus === "pending" || visualStatus === "stuck"
							? "pending"
							: "streaming..."}
				</span>
			</div>

			<button
				className="flex w-full items-center justify-center border-t bg-transparent px-[14px] py-[8px] text-center text-[12px] text-white/35 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white/55"
				style={{ borderTopWidth: "0.5px" }}
				onClick={onOpen}
				type="button"
			>
				Open
			</button>
		</div>
	);
}
