"use client";

import { Loader2Icon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromptPreset = {
	id: string;
	title: string;
	prompt: string;
	modelId: string | null;
	visibility: "public" | "private";
	webSearchEnabled: boolean;
	deepThinkingEnabled: boolean;
	fullstackModeEnabled: boolean;
	mobileModeEnabled: boolean;
	updatedAt: string;
};

const initialForm = {
	title: "",
	prompt: "",
	modelId: "",
	visibility: "private",
	webSearchEnabled: true,
	deepThinkingEnabled: false,
	fullstackModeEnabled: false,
	mobileModeEnabled: false,
};

export function PromptLibraryPanel() {
	const [presets, setPresets] = useState<PromptPreset[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState(initialForm);

	const loadPresets = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/prompt-presets");
			const data = await res.json();
			setPresets(data.presets || []);
		} catch {
			toast.error("Failed to load prompt presets");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPresets();
	}, [loadPresets]);

	const resetForm = () => {
		setEditingId(null);
		setForm(initialForm);
	};

	const handleSubmit = async () => {
		if (!form.title.trim() || !form.prompt.trim()) {
			toast.error("Title and prompt are required");
			return;
		}

		setSaving(true);
		try {
			const method = editingId ? "PATCH" : "POST";
			const res = await fetch("/api/user/prompt-presets", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: editingId,
					...form,
					modelId: form.modelId || null,
				}),
			});

			if (!res.ok) {
				throw new Error("Failed to save preset");
			}

			toast.success(editingId ? "Preset updated" : "Preset saved");
			resetForm();
			loadPresets();
		} catch {
			toast.error("Failed to save preset");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			const res = await fetch(`/api/user/prompt-presets?id=${id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error();
			}

			toast.success("Preset deleted");
			loadPresets();
		} catch {
			toast.error("Failed to delete preset");
		}
	};

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
					Prompt Library
				</h1>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Save reusable prompts with model and workspace mode defaults.
				</p>
			</header>

			<div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50/40 dark:bg-[#0f0f0f] p-6 space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Preset Name</Label>
						<Input
							value={form.title}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, title: e.target.value }))
							}
							placeholder="Landing page audit"
						/>
					</div>
					<div className="space-y-2">
						<Label>Preferred Model</Label>
						<Input
							value={form.modelId}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, modelId: e.target.value }))
							}
							placeholder="openai/gpt-4.1"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Prompt</Label>
					<textarea
						className="min-h-36 w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none"
						value={form.prompt}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, prompt: e.target.value }))
						}
						placeholder="Review this feature request, break it into implementation steps, then produce the first working draft..."
					/>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
						<input
							checked={form.webSearchEnabled}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									webSearchEnabled: e.target.checked,
								}))
							}
							type="checkbox"
						/>
						Web search
					</label>
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
						<input
							checked={form.deepThinkingEnabled}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									deepThinkingEnabled: e.target.checked,
								}))
							}
							type="checkbox"
						/>
						Deep thinking
					</label>
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
						<input
							checked={form.fullstackModeEnabled}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									fullstackModeEnabled: e.target.checked,
								}))
							}
							type="checkbox"
						/>
						Fullstack mode
					</label>
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
						<input
							checked={form.mobileModeEnabled}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									mobileModeEnabled: e.target.checked,
								}))
							}
							type="checkbox"
						/>
						Mobile mode
					</label>
				</div>

				<div className="flex gap-3">
					<Button
						className="bg-zinc-900 text-white dark:bg-white dark:text-black"
						disabled={saving}
						onClick={handleSubmit}
						type="button"
					>
						{saving ? (
							<Loader2Icon className="mr-2 animate-spin" size={16} />
						) : (
							<PlusIcon className="mr-2" size={16} />
						)}
						{editingId ? "Update preset" : "Save preset"}
					</Button>
					{editingId ? (
						<Button
							disabled={saving}
							onClick={resetForm}
							type="button"
							variant="outline"
						>
							Cancel edit
						</Button>
					) : null}
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
					<SparklesIcon size={16} />
					Saved presets
				</div>

				{loading ? (
					<div className="flex h-40 items-center justify-center text-zinc-500">
						<Loader2Icon className="animate-spin" size={24} />
					</div>
				) : presets.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 px-5 py-8 text-sm text-zinc-500 dark:text-zinc-400">
						No presets yet. Save your first reusable workflow here.
					</div>
				) : (
					<div className="space-y-3">
						{presets.map((preset) => (
							<div
								className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#101010] p-4"
								key={preset.id}
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
											{preset.title}
										</h3>
										<p className="mt-1 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
											{preset.prompt}
										</p>
										<div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
											{preset.modelId ? (
												<span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
													{preset.modelId}
												</span>
											) : null}
											{preset.webSearchEnabled ? (
												<span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
													web
												</span>
											) : null}
											{preset.deepThinkingEnabled ? (
												<span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
													deep
												</span>
											) : null}
											{preset.fullstackModeEnabled ? (
												<span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
													fullstack
												</span>
											) : null}
											{preset.mobileModeEnabled ? (
												<span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1">
													mobile
												</span>
											) : null}
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={() => {
												setEditingId(preset.id);
												setForm({
													title: preset.title,
													prompt: preset.prompt,
													modelId: preset.modelId || "",
													visibility: preset.visibility,
													webSearchEnabled: preset.webSearchEnabled,
													deepThinkingEnabled: preset.deepThinkingEnabled,
													fullstackModeEnabled: preset.fullstackModeEnabled,
													mobileModeEnabled: preset.mobileModeEnabled,
												});
											}}
											type="button"
											variant="outline"
										>
											Edit
										</Button>
										<Button
											onClick={() => handleDelete(preset.id)}
											type="button"
											variant="ghost"
										>
											<Trash2Icon size={16} />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
