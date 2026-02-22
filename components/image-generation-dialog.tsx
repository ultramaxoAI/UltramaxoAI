"use client";

import { DownloadIcon, Loader2Icon, Wand2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageGenerationDialogProps {
	open: boolean;
	onClose: () => void;
}

export function ImageGenerationDialog({
	open,
	onClose,
}: ImageGenerationDialogProps) {
	const [prompt, setPrompt] = useState("");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setLoading(true);
		setImageUrl(null);

		try {
			const res = await fetch("/api/generate-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt }),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to generate image");
				return;
			}

			setImageUrl(data.imageUrl);
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!imageUrl) {
			return;
		}
		const link = document.createElement("a");
		link.href = imageUrl;
		link.download = `ultramaxo-image-${Date.now()}.png`;
		link.click();
	};

	const handleClose = () => {
		setPrompt("");
		setImageUrl(null);
		setLoading(false);
		onClose();
	};

	if (!open) {
		return null;
	}

	return (
		// Backdrop
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop close
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					handleClose();
				}
			}}
		>
			{/* Dialog */}
			<div
				className={cn(
					"relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl",
					"animate-in fade-in slide-in-from-bottom-4 duration-200",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
					<div className="flex items-center gap-2">
						<Wand2Icon className="size-5 text-violet-400" />
						<h2 className="font-bold text-white text-base">Image Generation</h2>
					</div>
					<button
						className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
						onClick={handleClose}
						type="button"
					>
						<XIcon className="size-4" />
					</button>
				</div>

				{/* Body */}
				<div className="flex flex-col gap-4 p-6">
					{/* Prompt textarea */}
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
							Describe your image
						</label>
						<textarea
							className="min-h-[100px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
							disabled={loading}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
									handleGenerate();
								}
							}}
							placeholder="A majestic dragon flying over a neon-lit cyberpunk city at night..."
							ref={textareaRef}
							value={prompt}
						/>
						<p className="text-[11px] text-zinc-600">
							Ctrl/⌘ + Enter to generate
						</p>
					</div>

					{/* Generated Image */}
					{loading && (
						<div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
							<div className="flex flex-col items-center gap-3">
								<Loader2Icon className="size-8 animate-spin text-violet-400" />
								<p className="text-sm text-zinc-400">
									Generating your image...
								</p>
							</div>
						</div>
					)}

					{imageUrl && !loading && (
						<div className="relative overflow-hidden rounded-xl border border-zinc-800">
							{/* biome-ignore lint/performance/noImgElement: base64 image preview */}
							<img
								alt="Generated"
								className="w-full object-contain"
								src={imageUrl}
							/>
							<div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
								<button
									className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
									onClick={handleDownload}
									type="button"
								>
									<DownloadIcon className="size-3.5" />
									Download
								</button>
							</div>
						</div>
					)}

					{/* Generate button */}
					<button
						className={cn(
							"flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-all",
							"bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
						disabled={loading || !prompt.trim()}
						onClick={handleGenerate}
						type="button"
					>
						{loading ? (
							<>
								<Loader2Icon className="size-4 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<Wand2Icon className="size-4" />
								Generate Image
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
