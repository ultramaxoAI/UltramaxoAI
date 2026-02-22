"use client";

import JSZip from "jszip";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	DownloadIcon,
	FileIcon,
	FolderIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SupportedLanguage } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FileNode = {
	name: string;
	content: string;
	language: SupportedLanguage;
};

type FileExplorerProps = {
	files: FileNode[];
	activeFileIndex: number;
	onFileSelect: (index: number) => void;
	onFileAdd?: (file: FileNode) => void;
	onFileDelete?: (index: number) => void;
	onFileRename?: (index: number, newName: string) => void;
	className?: string;
};

function getFileIcon(filename: string, size = 16) {
	const ext = filename.split(".").pop()?.toLowerCase();

	switch (ext) {
		case "js":
		case "jsx":
			return <span style={{ fontSize: size }}>📜</span>;
		case "ts":
		case "tsx":
			return <span style={{ fontSize: size }}>📘</span>;
		case "py":
			return <span style={{ fontSize: size }}>🐍</span>;
		case "html":
			return <span style={{ fontSize: size }}>🌐</span>;
		case "css":
			return <span style={{ fontSize: size }}>🎨</span>;
		case "json":
			return <span style={{ fontSize: size }}>📋</span>;
		case "md":
			return <span style={{ fontSize: size }}>📝</span>;
		default:
			return <FileIcon className="text-gray-400" size={size} />;
	}
}

async function downloadProjectAsZip(
	files: FileNode[],
	projectName = "project",
) {
	try {
		const zip = new JSZip();

		files.forEach((file) => {
			zip.file(file.name, file.content);
		});

		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${projectName}.zip`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast.success(`Downloaded ${projectName}.zip`);
	} catch (error) {
		toast.error("Failed to download project");
		console.error(error);
	}
}

export function FileExplorer({
	files,
	activeFileIndex,
	onFileSelect,
	onFileAdd,
	onFileDelete,
	onFileRename,
	className,
}: FileExplorerProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [newFileName, setNewFileName] = useState("");
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editingName, setEditingName] = useState("");

	const handleCreateFile = () => {
		if (newFileName.trim() && onFileAdd) {
			const extension = newFileName.split(".").pop()?.toLowerCase() || "txt";
			const languageMap: Record<string, SupportedLanguage> = {
				js: "javascript",
				jsx: "jsx",
				ts: "typescript",
				tsx: "tsx",
				py: "python",
				html: "html",
				css: "css",
				json: "json",
				md: "markdown",
			};

			onFileAdd({
				name: newFileName.trim(),
				content: "",
				language: (languageMap[extension] || "text") as SupportedLanguage,
			});
			setNewFileName("");
			setIsCreating(false);
			toast.success(`Created ${newFileName}`);
		}
	};

	const handleRenameFile = (index: number) => {
		if (editingName.trim() && onFileRename) {
			onFileRename(index, editingName.trim());
			setEditingIndex(null);
			setEditingName("");
			toast.success("File renamed");
		}
	};

	const handleDownloadProject = () => {
		downloadProjectAsZip(files);
	};

	return (
		<div
			className={cn(
				"flex flex-col bg-zinc-900 border-r border-zinc-800",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-2 border-b border-zinc-800">
				<button
					className="flex items-center gap-1 text-sm font-semibold text-gray-300 hover:text-white"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? (
						<ChevronDownIcon size={16} />
					) : (
						<ChevronRightIcon size={16} />
					)}
					<FolderIcon size={16} />
					<span>Files</span>
				</button>

				<div className="flex gap-1">
					{onFileAdd && (
						<Button
							className="h-6 w-6"
							onClick={() => setIsCreating(true)}
							size="icon"
							title="New File"
							variant="ghost"
						>
							<PlusIcon size={14} />
						</Button>
					)}
					<Button
						className="h-6 w-6"
						onClick={handleDownloadProject}
						size="icon"
						title="Download Project"
						variant="ghost"
					>
						<DownloadIcon size={14} />
					</Button>
				</div>
			</div>

			{/* File List */}
			{isExpanded && (
				<div className="flex-1 overflow-y-auto">
					{/* New File Input */}
					{isCreating && (
						<div className="p-2 border-b border-zinc-800">
							<Input
								autoFocus
								className="h-7 text-sm bg-zinc-800 border-zinc-700"
								onBlur={() => {
									if (newFileName.trim()) {
										handleCreateFile();
									} else {
										setIsCreating(false);
									}
								}}
								onChange={(e) => setNewFileName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleCreateFile();
									}
									if (e.key === "Escape") {
										setIsCreating(false);
										setNewFileName("");
									}
								}}
								placeholder="filename.ext"
								value={newFileName}
							/>
						</div>
					)}

					{/* Files */}
					{files.map((file, index) => (
						<div
							className={cn(
								"flex items-center justify-between group px-2 py-1.5 cursor-pointer transition-colors",
								activeFileIndex === index
									? "bg-zinc-800 text-white"
									: "text-gray-400 hover:bg-zinc-800/50 hover:text-gray-300",
							)}
							key={index}
							onClick={() => onFileSelect(index)}
						>
							{editingIndex === index ? (
								<Input
									autoFocus
									className="h-6 text-sm bg-zinc-700 border-zinc-600"
									onBlur={() => {
										if (editingName.trim()) {
											handleRenameFile(index);
										} else {
											setEditingIndex(null);
											setEditingName("");
										}
									}}
									onChange={(e) => setEditingName(e.target.value)}
									onClick={(e) => e.stopPropagation()}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleRenameFile(index);
										}
										if (e.key === "Escape") {
											setEditingIndex(null);
											setEditingName("");
										}
									}}
									value={editingName}
								/>
							) : (
								<>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										{getFileIcon(file.name, 14)}
										<span
											className="text-sm truncate"
											onDoubleClick={(e) => {
												e.stopPropagation();
												if (onFileRename) {
													setEditingIndex(index);
													setEditingName(file.name);
												}
											}}
										>
											{file.name}
										</span>
									</div>

									{onFileDelete && files.length > 1 && (
										<Button
											className="h-5 w-5 opacity-0 group-hover:opacity-100"
											onClick={(e) => {
												e.stopPropagation();
												onFileDelete(index);
												toast.success(`Deleted ${file.name}`);
											}}
											size="icon"
											variant="ghost"
										>
											<TrashIcon size={12} />
										</Button>
									)}
								</>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
