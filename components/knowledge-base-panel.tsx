"use client";

import {
	BookOpenIcon,
	Loader2Icon,
	PinIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type KnowledgeCategory = "project" | "product" | "brand" | "reference";

type KnowledgeEntry = {
	id: string;
	category: KnowledgeCategory;
	title: string;
	content: string;
	source: string | null;
	workspace: string | null;
	isEnabled: boolean;
	isPinned: boolean;
};

type FolderRecord = {
	id: string;
	name: string;
};

const categoryOptions: KnowledgeCategory[] = [
	"project",
	"product",
	"brand",
	"reference",
];

const initialForm = {
	title: "",
	content: "",
	source: "",
	workspace: "",
	category: "project" as KnowledgeCategory,
	isEnabled: true,
	isPinned: false,
};

export function KnowledgeBasePanel() {
	const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState(initialForm);
	const [folders, setFolders] = useState<FolderRecord[]>([]);

	const loadEntries = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/knowledge");
			const data = await res.json();
			setEntries(data.entries || []);
		} catch {
			toast.error("Failed to load knowledge base");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadEntries();
	}, [loadEntries]);

	useEffect(() => {
		async function loadFolders() {
			try {
				const res = await fetch("/api/user/folders");
				const data = await res.json();
				setFolders(data.folders || []);
			} catch {
				setFolders([]);
			}
		}

		loadFolders();
	}, []);

	const resetForm = () => {
		setEditingId(null);
		setForm(initialForm);
	};

	const saveEntry = async () => {
		if (!form.title.trim() || !form.content.trim()) {
			toast.error("Title and content are required");
			return;
		}

		setSaving(true);
		try {
			const method = editingId ? "PATCH" : "POST";
			const res = await fetch("/api/user/knowledge", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: editingId,
					...form,
					source: form.source.trim() || null,
					workspace: form.workspace.trim() || null,
				}),
			});

			if (!res.ok) throw new Error();

			toast.success(
				editingId ? "Knowledge entry updated" : "Knowledge entry saved",
			);
			resetForm();
			loadEntries();
		} catch {
			toast.error("Failed to save knowledge entry");
		} finally {
			setSaving(false);
		}
	};

	const deleteEntry = async (id: string) => {
		try {
			const res = await fetch(`/api/user/knowledge?id=${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error();
			toast.success("Knowledge entry deleted");
			loadEntries();
		} catch {
			toast.error("Failed to delete knowledge entry");
		}
	};

	const toggleEntry = async (
		entry: KnowledgeEntry,
		patch: Partial<KnowledgeEntry>,
	) => {
		try {
			const res = await fetch("/api/user/knowledge", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: entry.id, ...patch }),
			});
			if (!res.ok) throw new Error();
			loadEntries();
		} catch {
			toast.error("Failed to update knowledge entry");
		}
	};

	return (
		<div className="space-y-8">
			<header>
				<div className="flex items-center gap-2 text-zinc-900 dark:text-white">
					<BookOpenIcon size={20} />
					<h1 className="text-2xl font-semibold tracking-tight">
						Knowledge Base
					</h1>
				</div>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Store reusable project context, product notes, brand rules, and
					reference material for future chats.
				</p>
			</header>

			<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-6 dark:border-white/5 dark:bg-[#101010] space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Entry title</Label>
						<Input
							value={form.title}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, title: e.target.value }))
							}
							placeholder="Ultramaxo positioning"
						/>
					</div>
					<div className="space-y-2">
						<Label>Category</Label>
						<select
							className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
							value={form.category}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									category: e.target.value as KnowledgeCategory,
								}))
							}
						>
							{categoryOptions.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Source</Label>
					<Input
						value={form.source}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, source: e.target.value }))
						}
						placeholder="Optional: docs, URL, campaign brief, product note"
					/>
				</div>

				<div className="space-y-2">
					<Label>Workspace / Project</Label>
					<Input
						list="knowledge-workspace-options"
						value={form.workspace}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, workspace: e.target.value }))
						}
						placeholder="Optional: use a chat folder name such as Research or Redesign"
					/>
					<datalist id="knowledge-workspace-options">
						{folders.map((folder) => (
							<option key={folder.id} value={folder.name} />
						))}
					</datalist>
					<p className="text-[10px] text-zinc-500 dark:text-zinc-400">
						Leave empty to make this entry global. If filled, it will apply to
						chats inside the matching folder.
					</p>
				</div>

				<div className="space-y-2">
					<Label>Context content</Label>
					<textarea
						className="min-h-36 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900"
						value={form.content}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, content: e.target.value }))
						}
						placeholder="Write the facts, constraints, terminology, goals, and details the AI should retain for future work."
					/>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900">
						<input
							checked={form.isEnabled}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, isEnabled: e.target.checked }))
							}
							type="checkbox"
						/>
						Enabled in chat context
					</label>
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900">
						<input
							checked={form.isPinned}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, isPinned: e.target.checked }))
							}
							type="checkbox"
						/>
						Pin as high priority
					</label>
				</div>

				<div className="flex gap-3">
					<Button
						className="bg-zinc-900 text-white dark:bg-white dark:text-black"
						disabled={saving}
						onClick={saveEntry}
						type="button"
					>
						{saving ? (
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<PlusIcon className="mr-2 h-4 w-4" />
						)}
						{editingId ? "Update entry" : "Save entry"}
					</Button>
					{editingId ? (
						<Button onClick={resetForm} type="button" variant="outline">
							Cancel edit
						</Button>
					) : null}
				</div>
			</div>

			<div className="space-y-4">
				{loading ? (
					<div className="flex h-40 items-center justify-center text-zinc-500">
						<Loader2Icon className="animate-spin" size={24} />
					</div>
				) : entries.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-zinc-200 px-5 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
						No knowledge entries yet.
					</div>
				) : (
					<div className="space-y-3">
						{entries.map((entry) => (
							<div
								className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-[#101010]"
								key={entry.id}
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex items-center gap-2">
											<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
												{entry.title}
											</h3>
											{entry.isPinned ? (
												<PinIcon className="h-3.5 w-3.5 text-amber-500" />
											) : null}
										</div>
										<p className="mt-1 line-clamp-4 text-sm text-zinc-500 dark:text-zinc-400">
											{entry.content}
										</p>
										<div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
											<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
												{entry.category}
											</span>
											<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
												{entry.isEnabled ? "active" : "disabled"}
											</span>
											{entry.source ? (
												<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
													{entry.source}
												</span>
											) : null}
											<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
												{entry.workspace
													? `workspace: ${entry.workspace}`
													: "global"}
											</span>
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={() =>
												toggleEntry(entry, { isPinned: !entry.isPinned })
											}
											type="button"
											variant="outline"
										>
											{entry.isPinned ? "Unpin" : "Pin"}
										</Button>
										<Button
											onClick={() =>
												toggleEntry(entry, { isEnabled: !entry.isEnabled })
											}
											type="button"
											variant="outline"
										>
											{entry.isEnabled ? "Disable" : "Enable"}
										</Button>
										<Button
											onClick={() => {
												setEditingId(entry.id);
												setForm({
													title: entry.title,
													content: entry.content,
													source: entry.source || "",
													workspace: entry.workspace || "",
													category: entry.category,
													isEnabled: entry.isEnabled,
													isPinned: entry.isPinned,
												});
											}}
											type="button"
											variant="outline"
										>
											Edit
										</Button>
										<Button
											onClick={() => deleteEntry(entry.id)}
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
