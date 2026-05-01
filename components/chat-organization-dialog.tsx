"use client";

import { Loader2, Tag, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChatOrganizationDialog({
	chatId,
	title,
	defaultFolder,
	defaultTags,
	trigger,
	onSaved,
}: {
	chatId: string;
	title: string;
	defaultFolder?: string | null;
	defaultTags?: string[];
	trigger: ReactNode;
	onSaved?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [folder, setFolder] = useState(defaultFolder ?? "");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState(defaultTags ?? []);
	const [saving, setSaving] = useState(false);

	const normalizedTags = useMemo(
		() => Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))),
		[tags],
	);

	const addTag = () => {
		const nextTag = tagInput.trim().replace(/^#/, "");
		if (!nextTag) return;
		if (normalizedTags.includes(nextTag)) {
			setTagInput("");
			return;
		}
		setTags((current) => [...current, nextTag]);
		setTagInput("");
	};

	const removeTag = (tagToRemove: string) => {
		setTags((current) => current.filter((tag) => tag !== tagToRemove));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const response = await fetch(`/api/chat/${chatId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					folder,
					tags: normalizedTags,
				}),
			});

			if (!response.ok) {
				throw new Error();
			}

			toast.success("Chat organization updated");
			setOpen(false);
			onSaved?.();
		} catch {
			toast.error("Failed to update chat organization");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="border-[#171717]/8 bg-[#f8f6f1] p-0 text-[#171717] shadow-[0_24px_70px_rgba(17,19,21,0.15)] dark:border-white/10 dark:bg-[#111315] dark:text-[#f3f4f1] sm:max-w-md sm:rounded-[28px]">
				<div className="p-6 sm:p-7">
					<DialogHeader>
						<DialogTitle className="text-xl tracking-tight">
							Organize chat
						</DialogTitle>
						<DialogDescription className="text-[#5f6258] dark:text-[#9ea59f]">
							Set a folder and tags for `
							<span className="font-medium text-[#171717] dark:text-[#f3f4f1]">
								{title}
							</span>
							`.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-6 space-y-5">
						<div className="space-y-2">
							<Label>Folder</Label>
							<Input
								className="h-11 rounded-xl border-[#171717]/10 bg-white/80 dark:border-white/10 dark:bg-white/5"
								onChange={(e) => setFolder(e.target.value)}
								placeholder="Product ideas"
								value={folder}
							/>
						</div>

						<div className="space-y-2">
							<Label>Tags</Label>
							<div className="flex gap-2">
								<Input
									className="h-11 rounded-xl border-[#171717]/10 bg-white/80 dark:border-white/10 dark:bg-white/5"
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTag();
										}
									}}
									placeholder="security"
									value={tagInput}
								/>
								<Button
									className="h-11 rounded-xl"
									onClick={addTag}
									type="button"
								>
									<Tag className="mr-2 h-4 w-4" />
									Add
								</Button>
							</div>
							<div className="flex min-h-12 flex-wrap gap-2 rounded-2xl border border-dashed border-[#171717]/10 bg-white/55 p-3 dark:border-white/10 dark:bg-white/4">
								{normalizedTags.length > 0 ? (
									normalizedTags.map((tag) => (
										<Badge
											className="gap-1 rounded-full border-transparent bg-[#171717]/6 px-2.5 py-1 text-[#171717] hover:bg-[#171717]/10 dark:bg-white/10 dark:text-[#f3f4f1]"
											key={tag}
											variant="outline"
										>
											#{tag}
											<button
												className="ml-0.5"
												onClick={() => removeTag(tag)}
												type="button"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))
								) : (
									<p className="text-sm text-[#6f746f] dark:text-[#9ca39d]">
										No tags yet.
									</p>
								)}
							</div>
						</div>
					</div>

					<DialogFooter className="mt-7">
						<Button
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#111315] text-[#f3f4f1] dark:bg-[#f3f4f1] dark:text-[#111315]"
							disabled={saving}
							onClick={handleSave}
							type="button"
						>
							{saving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save changes
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
