"use client";

import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";

type FolderRecord = {
	id: string;
	name: string;
};

export function SidebarFolderManager({
	activeFolder,
	chatCounts,
	draggingChatId,
	onAssignChatToFolder,
	onFoldersUpdated,
	onSelectFolder,
}: {
	activeFolder: string;
	chatCounts: Record<string, number>;
	draggingChatId: string | null;
	onAssignChatToFolder: (folder: string | null) => Promise<void>;
	onFoldersUpdated?: () => void;
	onSelectFolder: (folder: string) => void;
}) {
	const { data, mutate } = useSWR<{ folders: FolderRecord[] }>(
		"/api/user/folders",
		fetcher,
	);
	const [createOpen, setCreateOpen] = useState(false);
	const [folderName, setFolderName] = useState("");
	const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [folderPendingDelete, setFolderPendingDelete] = useState<string | null>(
		null,
	);
	const [pendingMoveTarget, setPendingMoveTarget] = useState<string | null>(
		null,
	);

	const folders = useMemo(() => data?.folders ?? [], [data]);
	const normalizedFolderNames = useMemo(
		() => folders.map((folder) => folder.name.trim().toLowerCase()),
		[folders],
	);

	const createFolder = async () => {
		const normalizedName = folderName.trim();

		if (!normalizedName) {
			toast.error("Folder name cannot be empty");
			return;
		}

		if (normalizedFolderNames.includes(normalizedName.toLowerCase())) {
			toast.error("Folder name already exists");
			return;
		}

		const response = await fetch("/api/user/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: normalizedName }),
		});

		if (!response.ok) {
			toast.error("Failed to create folder");
			return;
		}

		setFolderName("");
		setCreateOpen(false);
		mutate();
		onFoldersUpdated?.();
		toast.success("Folder created");
	};

	const renameFolder = async () => {
		const normalizedName = renameValue.trim();

		if (!renamingFolder) return;

		if (!normalizedName) {
			toast.error("Folder name cannot be empty");
			return;
		}

		if (
			renamingFolder.trim().toLowerCase() !== normalizedName.toLowerCase() &&
			normalizedFolderNames.includes(normalizedName.toLowerCase())
		) {
			toast.error("Folder name already exists");
			return;
		}

		const response = await fetch("/api/user/folders", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				previousName: renamingFolder,
				nextName: normalizedName,
			}),
		});

		if (!response.ok) {
			toast.error("Failed to rename folder");
			return;
		}

		setRenamingFolder(null);
		setRenameValue("");
		mutate();
		onFoldersUpdated?.();
		toast.success("Folder renamed");
	};

	const deleteFolder = async (name: string) => {
		const response = await fetch(
			`/api/user/folders?name=${encodeURIComponent(name)}`,
			{ method: "DELETE" },
		);

		if (!response.ok) {
			toast.error("Failed to delete folder");
			return;
		}

		mutate();
		onFoldersUpdated?.();
		setFolderPendingDelete(null);
		if (activeFolder === name) {
			onSelectFolder("all");
		}
		toast.success("Folder deleted");
	};

	const requestMoveToUncategorized = () => {
		if (!draggingChatId) {
			void onAssignChatToFolder(null);
			return;
		}

		setPendingMoveTarget("uncategorized");
	};

	const confirmMoveToUncategorized = async () => {
		await onAssignChatToFolder(null);
		setPendingMoveTarget(null);
	};

	const baseDropClass = draggingChatId
		? "border-[#d97757]/40 bg-[#d97757]/10"
		: "border-black/6 bg-black/[0.03] dark:border-white/6 dark:bg-white/[0.03]";

	return (
		<div className="mb-3 space-y-2 px-2">
			<div className="flex items-center justify-between px-1">
				<div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#74675c] dark:text-[#8f857a]">
					Folders
				</div>
				<Dialog onOpenChange={setCreateOpen} open={createOpen}>
					<DialogTrigger asChild>
						<Button
							className="h-7 rounded-full px-2.5 text-xs text-[#6f6257] dark:text-[#b9afa3]"
							size="sm"
							type="button"
							variant="ghost"
						>
							<Plus className="mr-1 h-3.5 w-3.5" />
							New
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-sm">
						<DialogHeader>
							<DialogTitle>Create folder</DialogTitle>
							<DialogDescription>
								Create a folder to organize chats and enable drag-and-drop.
							</DialogDescription>
						</DialogHeader>
						<Input
							onChange={(e) => setFolderName(e.target.value)}
							placeholder="Research"
							value={folderName}
						/>
						<DialogFooter>
							<Button onClick={createFolder} type="button">
								Create
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<button
				className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${baseDropClass}`}
				onClick={() => onSelectFolder("all")}
				onDragOver={(e) => draggingChatId && e.preventDefault()}
				onDrop={(e) => {
					e.preventDefault();
					requestMoveToUncategorized();
				}}
				type="button"
			>
				<span className={activeFolder === "all" ? "font-semibold" : ""}>
					All chats
				</span>
				<span className="text-xs text-[#7a807a] dark:text-[#988d81]">
					{Object.values(chatCounts).reduce((sum, current) => sum + current, 0)}
				</span>
			</button>

			<div className="space-y-1.5">
				<button
					className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${baseDropClass}`}
					onClick={() => onSelectFolder("uncategorized")}
					onDragOver={(e) => draggingChatId && e.preventDefault()}
					onDrop={(e) => {
						e.preventDefault();
						requestMoveToUncategorized();
					}}
					type="button"
				>
					<span
						className={activeFolder === "uncategorized" ? "font-semibold" : ""}
					>
						Uncategorized
					</span>
					<span className="text-xs text-[#7a807a] dark:text-[#988d81]">
						{chatCounts.uncategorized ?? 0}
					</span>
				</button>

				{folders.map((folder) => (
					<div
						className={`rounded-xl border px-3 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${baseDropClass}`}
						key={folder.id}
						onDragOver={(e) => draggingChatId && e.preventDefault()}
						onDrop={(e) => {
							e.preventDefault();
							void onAssignChatToFolder(folder.name);
						}}
					>
						<div className="flex items-center justify-between gap-2">
							<button
								className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
								onClick={() => onSelectFolder(folder.name)}
								type="button"
							>
								<FolderOpen className="h-4 w-4 shrink-0 text-[#7a807a] dark:text-[#988d81]" />
								<span
									className={`truncate ${activeFolder === folder.name ? "font-semibold" : ""}`}
								>
									{folder.name}
								</span>
								<span className="ml-auto text-xs text-[#7a807a] dark:text-[#988d81]">
									{chatCounts[folder.name] ?? 0}
								</span>
							</button>
							<div className="flex items-center gap-1">
								<Button
									className="h-7 w-7 rounded-full p-0"
									onClick={() => {
										setRenamingFolder(folder.name);
										setRenameValue(folder.name);
									}}
									type="button"
									variant="ghost"
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
								<Button
									className="h-7 w-7 rounded-full p-0"
									onClick={() => setFolderPendingDelete(folder.name)}
									type="button"
									variant="ghost"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setRenamingFolder(null);
						setRenameValue("");
					}
				}}
				open={Boolean(renamingFolder)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Rename folder</DialogTitle>
						<DialogDescription>
							Update the folder name and keep its chats linked.
						</DialogDescription>
					</DialogHeader>
					<Input
						onChange={(e) => setRenameValue(e.target.value)}
						value={renameValue}
					/>
					<DialogFooter>
						<Button onClick={() => void renameFolder()} type="button">
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) {
						setFolderPendingDelete(null);
					}
				}}
				open={Boolean(folderPendingDelete)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete folder?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the folder `{folderPendingDelete}` and moves its
							chats to uncategorized.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (folderPendingDelete) {
									void deleteFolder(folderPendingDelete);
								}
							}}
						>
							Delete folder
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) {
						setPendingMoveTarget(null);
					}
				}}
				open={Boolean(pendingMoveTarget)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Move chat to uncategorized?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the current folder assignment from the dragged chat.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => void confirmMoveToUncategorized()}
						>
							Move chat
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
