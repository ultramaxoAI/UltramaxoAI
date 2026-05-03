"use client";

import JSZip from "jszip";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	DownloadIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileTextIcon,
	FolderIcon,
	ImageIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";
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

type FileTreeNode = {
	name: string;
	path: string;
	type: "file" | "directory";
	index?: number;
	children?: FileTreeNode[];
};

function getFileIcon(filename: string, size = 16) {
	const ext = filename.split(".").pop()?.toLowerCase();

	switch (ext) {
		case "js":
		case "jsx":
		case "ts":
		case "tsx":
		case "py":
		case "html":
		case "css":
			return <FileCodeIcon className="text-indigo-300/75" size={size} />;
		case "json":
			return <FileJsonIcon className="text-amber-300/75" size={size} />;
		case "md":
			return <FileTextIcon className="text-white/45" size={size} />;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "svg":
			return <ImageIcon className="text-fuchsia-300/70" size={size} />;
		default:
			return <FileIcon className="text-white/35" size={size} />;
	}
}

function buildFileTree(files: FileNode[]): FileTreeNode[] {
	const root: FileTreeNode[] = [];
	const directories = new Map<string, FileTreeNode>();

	for (const [index, file] of files.entries()) {
		const segments = file.name.split("/").filter(Boolean);
		let currentChildren = root;
		let currentPath = "";

		for (const [segmentIndex, segment] of segments.entries()) {
			currentPath = currentPath ? `${currentPath}/${segment}` : segment;
			const isFile = segmentIndex === segments.length - 1;

			if (isFile) {
				currentChildren.push({
					name: segment,
					path: currentPath,
					type: "file",
					index,
				});
				continue;
			}

			let directoryNode = directories.get(currentPath);
			if (!directoryNode) {
				directoryNode = {
					name: segment,
					path: currentPath,
					type: "directory",
					children: [],
				};
				directories.set(currentPath, directoryNode);
				currentChildren.push(directoryNode);
			}

			currentChildren = directoryNode.children ?? [];
		}
	}

	const sortNodes = (nodes: FileTreeNode[]) => {
		nodes.sort((left, right) => {
			if (left.type !== right.type) {
				return left.type === "directory" ? -1 : 1;
			}

			return left.name.localeCompare(right.name);
		});

		for (const node of nodes) {
			if (node.children) {
				sortNodes(node.children);
			}
		}
	};

	sortNodes(root);
	return root;
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
	const [expandedDirectories, setExpandedDirectories] = useState<
		Record<string, boolean>
	>({});
	const fileTree = useMemo(() => buildFileTree(files), [files]);

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

	const toggleDirectory = (path: string) => {
		setExpandedDirectories((current) => ({
			...current,
			[path]: current[path] === false,
		}));
	};

	const renderNode = (node: FileTreeNode, depth = 0): ReactNode => {
		if (node.type === "directory") {
			const isDirectoryExpanded = expandedDirectories[node.path] !== false;

			return (
				<Fragment key={node.path}>
					<button
						type="button"
						className="mx-1 flex min-h-8 w-[calc(100%-0.5rem)] items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[12px] text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white/75"
						style={{ paddingLeft: `${depth * 14 + 8}px` }}
						onClick={() => toggleDirectory(node.path)}
					>
						{isDirectoryExpanded ? (
							<ChevronDownIcon size={14} className="text-white/25" />
						) : (
							<ChevronRightIcon size={14} className="text-white/25" />
						)}
						<FolderIcon size={14} className="text-yellow-300/60" />
						<span className="truncate">{node.name}</span>
					</button>
					{isDirectoryExpanded &&
						node.children?.map((childNode) => renderNode(childNode, depth + 1))}
				</Fragment>
			);
		}

		const index = node.index ?? 0;
		const file = files[index];

		return (
			<div
				className={cn(
					"group mx-1 flex min-h-8 cursor-pointer items-center justify-between rounded-md py-1.5 pr-2 transition-colors",
					activeFileIndex === index
						? "bg-white/[0.06] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
						: "text-white/45 hover:bg-white/[0.03] hover:text-white/70",
				)}
				key={node.path}
				onClick={() => onFileSelect(index)}
				style={{ paddingLeft: `${depth * 14 + 28}px` }}
			>
				{editingIndex === index ? (
					<Input
						autoFocus
						className="h-7 border-white/[0.08] bg-[#181c22] text-[12px] text-white/80 placeholder:text-white/25 focus-visible:ring-indigo-400/30"
						onBlur={() => {
							if (editingName.trim()) {
								handleRenameFile(index);
							} else {
								setEditingIndex(null);
								setEditingName("");
							}
						}}
						onChange={(event) => setEditingName(event.target.value)}
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								handleRenameFile(index);
							}
							if (event.key === "Escape") {
								setEditingIndex(null);
								setEditingName("");
							}
						}}
						value={editingName}
					/>
				) : (
					<>
						<div className="flex min-w-0 flex-1 items-center gap-2">
							{getFileIcon(file.name, 14)}
							<span
								className="truncate text-[12px]"
								onDoubleClick={(event) => {
									event.stopPropagation();
									if (onFileRename) {
										setEditingIndex(index);
										setEditingName(file.name);
									}
								}}
							>
								{node.name}
							</span>
						</div>

						{onFileDelete && files.length > 1 && (
							<Button
								className="h-5 w-5 rounded-md border border-transparent bg-transparent text-white/25 opacity-0 transition-all hover:border-red-400/15 hover:bg-red-400/10 hover:text-red-300/80 group-hover:opacity-100"
								onClick={(event) => {
									event.stopPropagation();
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
		);
	};

	return (
		<div
			className={cn(
				"flex h-full flex-col border-white/[0.06] border-r bg-[#111318] text-white/70",
				className,
			)}
		>
			<div className="flex items-center justify-between border-white/[0.06] border-b px-3 py-2.5">
				<button
					className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-white/60"
					onClick={() => setIsExpanded(!isExpanded)}
					type="button"
				>
					{isExpanded ? (
						<ChevronDownIcon size={16} />
					) : (
						<ChevronRightIcon size={16} />
					)}
					<FolderIcon size={14} className="text-yellow-300/60" />
					<span>Files</span>
				</button>

				<div className="flex gap-1">
					{onFileAdd && (
						<Button
							className="h-6 w-6 rounded-md bg-transparent text-white/30 hover:bg-white/[0.06] hover:text-white/65"
							onClick={() => setIsCreating(true)}
							size="icon"
							title="New File"
							variant="ghost"
						>
							<PlusIcon size={14} />
						</Button>
					)}
					<Button
						className="h-6 w-6 rounded-md bg-transparent text-white/30 hover:bg-white/[0.06] hover:text-white/65"
						onClick={handleDownloadProject}
						size="icon"
						title="Download Project"
						variant="ghost"
					>
						<DownloadIcon size={14} />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="flex-1 overflow-y-auto py-1">
					{isCreating && (
						<div className="border-white/[0.06] border-b p-2">
							<Input
								autoFocus
								className="h-8 border-white/[0.08] bg-[#181c22] text-[12px] text-white/80 placeholder:text-white/25 focus-visible:ring-indigo-400/30"
								onBlur={() => {
									if (newFileName.trim()) {
										handleCreateFile();
									} else {
										setIsCreating(false);
									}
								}}
								onChange={(event) => setNewFileName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										handleCreateFile();
									}
									if (event.key === "Escape") {
										setIsCreating(false);
										setNewFileName("");
									}
								}}
								placeholder="folder/file.ext"
								value={newFileName}
							/>
						</div>
					)}

					{fileTree.length > 0 ? (
						fileTree.map((node) => renderNode(node))
					) : (
						<div className="px-3 py-4 text-[12px] text-white/30">
							Workspace files will appear here.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
