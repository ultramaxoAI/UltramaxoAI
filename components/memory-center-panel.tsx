"use client";

import { BrainIcon, Loader2Icon, PinIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemoryCategory = "profile" | "coding" | "product" | "instruction";

type MemoryItem = {
	id: string;
	category: MemoryCategory;
	title: string;
	content: string;
	isEnabled: boolean;
	isPinned: boolean;
};

const categoryOptions: MemoryCategory[] = [
	"profile",
	"coding",
	"product",
	"instruction",
];

const initialForm = {
	title: "",
	content: "",
	category: "instruction" as MemoryCategory,
	isEnabled: true,
	isPinned: false,
};

export function MemoryCenterPanel() {
	const [memories, setMemories] = useState<MemoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState(initialForm);

	const loadMemories = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/memory");
			const data = await res.json();
			setMemories(data.memories || []);
		} catch {
			toast.error("Failed to load memory");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadMemories();
	}, [loadMemories]);

	const resetForm = () => {
		setEditingId(null);
		setForm(initialForm);
	};

	const saveMemory = async () => {
		if (!form.title.trim() || !form.content.trim()) {
			toast.error("Title and content are required");
			return;
		}

		setSaving(true);
		try {
			const method = editingId ? "PATCH" : "POST";
			const res = await fetch("/api/user/memory", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingId, ...form }),
			});

			if (!res.ok) throw new Error();

			toast.success(editingId ? "Memory updated" : "Memory saved");
			resetForm();
			loadMemories();
		} catch {
			toast.error("Failed to save memory");
		} finally {
			setSaving(false);
		}
	};

	const deleteMemory = async (id: string) => {
		try {
			const res = await fetch(`/api/user/memory?id=${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error();
			toast.success("Memory deleted");
			loadMemories();
		} catch {
			toast.error("Failed to delete memory");
		}
	};

	const toggleMemory = async (memory: MemoryItem, patch: Partial<MemoryItem>) => {
		try {
			const res = await fetch("/api/user/memory", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: memory.id, ...patch }),
			});
			if (!res.ok) throw new Error();
			loadMemories();
		} catch {
			toast.error("Failed to update memory");
		}
	};

	return (
		<div className="space-y-8">
			<header>
				<div className="flex items-center gap-2 text-zinc-900 dark:text-white">
					<BrainIcon size={20} />
					<h1 className="text-2xl font-semibold tracking-tight">Memory Center</h1>
				</div>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Store persistent context the workspace should remember across chats.
				</p>
			</header>

			<div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-6 dark:border-white/5 dark:bg-[#101010] space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Memory title</Label>
						<Input
							value={form.title}
							onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
							placeholder="Preferred stack"
						/>
					</div>
					<div className="space-y-2">
						<Label>Category</Label>
						<select
							className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
							value={form.category}
							onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as MemoryCategory }))}
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
					<Label>Memory content</Label>
					<textarea
						className="min-h-32 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900"
						value={form.content}
						onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
						placeholder="Always default to Next.js App Router, TypeScript strict mode, and Tailwind."
					/>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900">
						<input checked={form.isEnabled} onChange={(e) => setForm((prev) => ({ ...prev, isEnabled: e.target.checked }))} type="checkbox" />
						Enabled in chat
					</label>
					<label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-900">
						<input checked={form.isPinned} onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))} type="checkbox" />
						Pin as high priority
					</label>
				</div>

				<div className="flex gap-3">
					<Button className="bg-zinc-900 text-white dark:bg-white dark:text-black" disabled={saving} onClick={saveMemory} type="button">
						{saving ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <PlusIcon className="mr-2 h-4 w-4" />}
						{editingId ? "Update memory" : "Save memory"}
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
				) : memories.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-zinc-200 px-5 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
						No saved memory yet.
					</div>
				) : (
					<div className="space-y-3">
						{memories.map((memory) => (
							<div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-[#101010]" key={memory.id}>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex items-center gap-2">
											<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{memory.title}</h3>
											{memory.isPinned ? <PinIcon className="h-3.5 w-3.5 text-amber-500" /> : null}
										</div>
										<p className="mt-1 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">{memory.content}</p>
										<div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
											<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{memory.category}</span>
											<span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{memory.isEnabled ? "active" : "disabled"}</span>
										</div>
									</div>
									<div className="flex gap-2">
										<Button onClick={() => toggleMemory(memory, { isPinned: !memory.isPinned })} type="button" variant="outline">
											{memory.isPinned ? "Unpin" : "Pin"}
										</Button>
										<Button onClick={() => toggleMemory(memory, { isEnabled: !memory.isEnabled })} type="button" variant="outline">
											{memory.isEnabled ? "Disable" : "Enable"}
										</Button>
										<Button
											onClick={() => {
												setEditingId(memory.id);
												setForm({
													title: memory.title,
													content: memory.content,
													category: memory.category,
													isEnabled: memory.isEnabled,
													isPinned: memory.isPinned,
												});
											}}
											type="button"
											variant="outline"
										>
											Edit
										</Button>
										<Button onClick={() => deleteMemory(memory.id)} type="button" variant="ghost">
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
