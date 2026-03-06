"use client";

import {
	SandpackCodeEditor,
	SandpackConsole,
	SandpackPreview,
	SandpackProvider,
	useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CodeIcon,
	EyeIcon,
	FileIcon,
	FolderIcon,
	PackageIcon,
	PencilIcon,
	PlusIcon,
	TerminalIcon,
	Trash2Icon,
} from "lucide-react";
import { memo, type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SupportedLanguage } from "./code-editor";

type PlayableFile = {
	name: string;
	content: string;
	language: SupportedLanguage;
};

type DependencyMap = Record<string, string>;

type FileTreeNode = {
	name: string;
	path: string;
	type: "file" | "folder";
	children: FileTreeNode[];
};

type SandpackViewerProps = {
	files: PlayableFile[];
	activeFileIndex?: number;
	status: string;
	dependencies?: DependencyMap;
	userDependencies?: DependencyMap;
	onDependenciesChange?: (dependencies: DependencyMap) => void;
};

const DEFAULT_APP_FILE = `export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Fullstack Web IDE</p>
        <h1 className="text-4xl font-semibold">Your live app preview is ready.</h1>
        <p className="text-zinc-400">
          Ask the AI to build a landing page, dashboard, mobile app screen, or full UI concept.
        </p>
      </div>
    </main>
  );
}
`;

function normalizePath(fileName: string) {
	return fileName.startsWith("/") ? fileName : `/${fileName}`;
}

function inferLanguageFromPath(path: string): SupportedLanguage {
	const extension = path.split(".").pop()?.toLowerCase();

	switch (extension) {
		case "js":
			return "javascript";
		case "jsx":
			return "jsx";
		case "ts":
			return "typescript";
		case "tsx":
			return "tsx";
		case "css":
			return "css";
		case "html":
			return "html";
		case "json":
			return "json";
		case "md":
			return "markdown";
		default:
			return "text";
	}
}

function createStarterContent(path: string) {
	const language = inferLanguageFromPath(path);

	switch (language) {
		case "jsx":
		case "tsx":
		case "javascript":
		case "typescript":
			return "export default function Component() {\n  return <div />;\n}\n";
		case "css":
			return "body {\n  margin: 0;\n}\n";
		case "json":
			return "{}\n";
		case "html":
			return "<div>Hello from Sandpack</div>\n";
		default:
			return "";
	}
}

function parsePackageSpec(value: string) {
	const trimmed = value.trim();

	if (!trimmed) {
		return null;
	}

	const versionSeparatorIndex = trimmed.startsWith("@")
		? trimmed.indexOf("@", 1)
		: trimmed.indexOf("@");

	if (versionSeparatorIndex > 0) {
		return {
			name: trimmed.slice(0, versionSeparatorIndex),
			version: trimmed.slice(versionSeparatorIndex + 1) || "latest",
		};
	}

	return {
		name: trimmed,
		version: "latest",
	};
}

function buildTree(paths: string[]) {
	const root: FileTreeNode[] = [];

	for (const rawPath of paths) {
		const parts = rawPath.replace(/^\//, "").split("/").filter(Boolean);
		let level = root;
		let currentPath = "";

		for (const [index, part] of parts.entries()) {
			currentPath += `/${part}`;
			const isFile = index === parts.length - 1;
			let node = level.find((entry) => entry.name === part);

			if (!node) {
				node = {
					name: part,
					path: currentPath,
					type: isFile ? "file" : "folder",
					children: [],
				};

				level.push(node);
			}

			level = node.children;
		}
	}

	const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] =>
		nodes
			.map((node) => ({ ...node, children: sortNodes(node.children) }))
			.sort((left, right) => {
				if (left.type !== right.type) {
					return left.type === "folder" ? -1 : 1;
				}

				return left.name.localeCompare(right.name);
			});

	return sortNodes(root);
}

function getTemplate(files: PlayableFile[]) {
	if (files.some((file) => file.name.endsWith(".html"))) {
		return "static";
	}

	return files.some(
		(file) => file.name.endsWith(".ts") || file.name.endsWith(".tsx"),
	)
		? "react-ts"
		: "react";
}

function buildSandpackFiles(files: PlayableFile[]) {
	const sandpackFiles = files.reduce(
		(accumulator, file) => {
			accumulator[normalizePath(file.name)] = file.content;
			return accumulator;
		},
		{} as Record<string, string>,
	);
	const isStaticTemplate = files.some((file) => file.name.endsWith(".html"));

	if (isStaticTemplate) {
		if (!sandpackFiles["/index.html"]) {
			sandpackFiles["/index.html"] = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Web Preview</title>
		<script src="https://cdn.tailwindcss.com"></script>
	</head>
	<body>
		<main style="font-family: system-ui; padding: 24px;">
			<h1>Web preview is ready</h1>
			<p>Create or update index.html to render your app.</p>
		</main>
	</body>
</html>`;
		}

		return sandpackFiles;
	}

	if (
		!sandpackFiles["/App.js"] &&
		!sandpackFiles["/App.jsx"] &&
		!sandpackFiles["/App.tsx"] &&
		!sandpackFiles["/index.js"] &&
		!sandpackFiles["/index.tsx"]
	) {
		sandpackFiles["/App.js"] = DEFAULT_APP_FILE;
	}

	if (!sandpackFiles["/public/index.html"]) {
		sandpackFiles["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Code Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {}
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
	}

	return sandpackFiles;
}

function getFileIcon(path: string) {
	const extension = path.split(".").pop()?.toLowerCase();

	switch (extension) {
		case "js":
		case "jsx":
		case "ts":
		case "tsx":
			return <CodeIcon className="size-4 text-cyan-400" />;
		case "json":
			return <FileIcon className="size-4 text-amber-400" />;
		case "css":
			return <FileIcon className="size-4 text-pink-400" />;
		default:
			return <FileIcon className="size-4 text-zinc-400" />;
	}
}

function SandpackIDE({
	dependencies = {},
	status,
	userDependencies = {},
	onDependenciesChange,
}: Pick<
	SandpackViewerProps,
	"dependencies" | "status" | "userDependencies" | "onDependenciesChange"
>) {
	const { sandpack } = useSandpack();
	const [activeTab, setActiveTab] = useState<"code" | "preview" | "console">(
		"preview",
	);
	const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
		{},
	);
	const [isAddingFile, setIsAddingFile] = useState(false);
	const [newFileName, setNewFileName] = useState("");
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [renamedFile, setRenamedFile] = useState("");
	const [packageInput, setPackageInput] = useState("");

	const fileEntries = useMemo(
		() =>
			(Object.entries(sandpack.files) as Array<
				[string, { code: string; hidden?: boolean }]
			>)
				.filter(([, file]) => !file.hidden)
				.sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath)),
		[sandpack.files],
	);

	const filePaths = useMemo(
		() => fileEntries.map(([path]) => path),
		[fileEntries],
	);

	const fileTree = useMemo(() => buildTree(filePaths), [filePaths]);

	const allDependencies = useMemo(
		() => Object.entries(dependencies),
		[dependencies],
	);

	const toggleFolder = (path: string) => {
		setExpandedFolders((current) => ({
			...current,
			[path]: current[path] === false,
		}));
	};

	const handleCreateFile = () => {
		const trimmedName = newFileName.trim();

		if (!trimmedName) {
			setIsAddingFile(false);
			return;
		}

		const nextPath = normalizePath(trimmedName);

		if (sandpack.files[nextPath]) {
			toast.error("File already exists.");
			return;
		}

		sandpack.addFile(nextPath, createStarterContent(nextPath), true);
		sandpack.openFile(nextPath);
		sandpack.setActiveFile(nextPath);
		setActiveTab("code");
		setIsAddingFile(false);
		setNewFileName("");
	};

	const handleDeleteFile = (path: string) => {
		if (filePaths.length <= 1) {
			toast.error("At least one file is required.");
			return;
		}

		const currentIndex = filePaths.indexOf(path);
		const nextActiveFile =
			filePaths[currentIndex + 1] ?? filePaths[currentIndex - 1] ?? filePaths[0];

		sandpack.deleteFile(path, true);

		if (sandpack.activeFile === path && nextActiveFile) {
			sandpack.openFile(nextActiveFile);
			sandpack.setActiveFile(nextActiveFile);
		}
	};

	const handleRenameFile = (path: string) => {
		const trimmedName = renamedFile.trim();

		if (!trimmedName) {
			setRenamingPath(null);
			setRenamedFile("");
			return;
		}

		const nextPath = normalizePath(trimmedName);

		if (nextPath === path) {
			setRenamingPath(null);
			setRenamedFile("");
			return;
		}

		if (sandpack.files[nextPath]) {
			toast.error("A file with that name already exists.");
			return;
		}

		const existingCode = sandpack.files[path]?.code ?? "";
		sandpack.addFile(nextPath, existingCode, false);
		sandpack.deleteFile(path, true);
		sandpack.openFile(nextPath);
		sandpack.setActiveFile(nextPath);
		setRenamingPath(null);
		setRenamedFile("");
	};

	const handleAddDependency = () => {
		const parsedPackage = parsePackageSpec(packageInput);

		if (!parsedPackage) {
			return;
		}

		onDependenciesChange?.({
			...userDependencies,
			[parsedPackage.name]: parsedPackage.version,
		});
		setPackageInput("");
	};

	const renderTree = (nodes: FileTreeNode[], depth = 0): ReactNode => {
		return nodes.map((node) => {
			if (node.type === "folder") {
				const isExpanded = expandedFolders[node.path] !== false;

				return (
					<div key={node.path}>
						<button
							className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-zinc-300 hover:bg-zinc-800/80"
							onClick={() => toggleFolder(node.path)}
							type="button"
						>
							<span style={{ marginLeft: depth * 12 }}>
								{isExpanded ? (
									<ChevronDownIcon className="size-4" />
								) : (
									<ChevronRightIcon className="size-4" />
								)}
							</span>
							<FolderIcon className="size-4 text-zinc-400" />
							<span className="truncate">{node.name}</span>
						</button>

						{isExpanded && renderTree(node.children, depth + 1)}
					</div>
				);
			}

			const isActive = sandpack.activeFile === node.path;
			const isRenaming = renamingPath === node.path;

			return (
				<div
					className={cn(
						"group flex items-center gap-2 rounded-md pr-2 text-sm",
						isActive
							? "bg-zinc-800 text-white"
							: "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200",
					)}
					key={node.path}
				>
					<button
						className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left"
						onClick={() => {
							sandpack.openFile(node.path);
							sandpack.setActiveFile(node.path);
							setActiveTab("code");
						}}
						type="button"
					>
						<span style={{ marginLeft: depth * 12 + 16 }} />
						{getFileIcon(node.path)}
						{isRenaming ? (
							<Input
								autoFocus
								className="h-7 border-zinc-700 bg-zinc-950 text-xs"
								onBlur={() => handleRenameFile(node.path)}
								onChange={(event) => setRenamedFile(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										handleRenameFile(node.path);
									}

									if (event.key === "Escape") {
										setRenamingPath(null);
										setRenamedFile("");
									}
								}}
								value={renamedFile}
							/>
						) : (
							<span className="truncate">{node.name}</span>
						)}
					</button>

					<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							className="size-7 text-zinc-400 hover:text-white"
							onClick={() => {
								setRenamingPath(node.path);
								setRenamedFile(node.path.replace(/^\//, ""));
							}}
							size="icon"
							type="button"
							variant="ghost"
						>
							<PencilIcon className="size-3.5" />
						</Button>
						<Button
							className="size-7 text-zinc-400 hover:text-red-400"
							onClick={() => handleDeleteFile(node.path)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Trash2Icon className="size-3.5" />
						</Button>
					</div>
				</div>
			);
		});
	};

	return (
		<div className="flex h-full min-h-0 flex-col bg-zinc-950">
			<div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
				<div className="flex items-center gap-2">
					{[
						{ key: "code", label: "Code", icon: CodeIcon },
						{ key: "preview", label: "Preview", icon: EyeIcon },
						{ key: "console", label: "Console", icon: TerminalIcon },
					].map((tab) => {
						const Icon = tab.icon;

						return (
							<button
								className={cn(
									"flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
									activeTab === tab.key
										? "bg-zinc-800 text-white"
										: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
								)}
								key={tab.key}
								onClick={() =>
									setActiveTab(tab.key as "code" | "preview" | "console")
								}
								type="button"
							>
								<Icon className="size-4" />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				<div className="flex items-center gap-2 text-xs text-zinc-400">
					<span className="rounded-full border border-zinc-700 px-2 py-1 uppercase tracking-wide">
						{status}
					</span>
					<span className="rounded-full border border-zinc-700 px-2 py-1 uppercase tracking-wide">
						{sandpack.status}
					</span>
				</div>
			</div>

			<div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
				<div className="flex min-h-0 flex-col border-r border-zinc-800 bg-zinc-950/80">
					<div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
						<div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
							<FolderIcon className="size-4" />
							<span>Files</span>
						</div>

						<Button
							className="size-8 text-zinc-400 hover:text-white"
							onClick={() => setIsAddingFile((current) => !current)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<PlusIcon className="size-4" />
						</Button>
					</div>

					{isAddingFile && (
						<div className="border-b border-zinc-800 p-3">
							<Input
								autoFocus
								className="h-9 border-zinc-700 bg-zinc-900 text-sm"
								onBlur={handleCreateFile}
								onChange={(event) => setNewFileName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										handleCreateFile();
									}

									if (event.key === "Escape") {
										setIsAddingFile(false);
										setNewFileName("");
									}
								}}
								placeholder="components/Hero.tsx"
								value={newFileName}
							/>
						</div>
					)}

					<div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
						{renderTree(fileTree)}
					</div>
				</div>

				<div className="min-h-0 bg-zinc-950">
					{activeTab === "code" && (
						<div className="h-full min-h-0 [&_.sp-wrapper]:h-full [&_.sp-editor]:h-full [&_.sp-stack]:h-full">
							<SandpackCodeEditor
								showLineNumbers={true}
								showTabs={false}
								style={{ height: "100%" }}
								wrapContent={false}
							/>
						</div>
					)}

					{activeTab === "preview" && (
						<div className="h-full min-h-0 [&_.sp-preview]:h-full [&_.sp-stack]:h-full [&_.sp-preview-container]:h-full [&_.sp-preview-iframe]:h-full">
							<SandpackPreview
								showNavigator={true}
								showOpenInCodeSandbox={false}
								showRefreshButton={true}
								style={{ height: "100%" }}
							/>
						</div>
					)}

					{activeTab === "console" && (
						<div className="h-full min-h-0 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-3">
							<SandpackConsole
								className="h-full rounded-xl border border-zinc-800 bg-zinc-950"
								maxMessageCount={200}
								resetOnPreviewRestart={true}
								showHeader={false}
								showResetConsoleButton={true}
								showRestartButton={true}
								showSetupProgress={true}
								showSyntaxError={true}
								standalone={true}
							/>
						</div>
					)}
				</div>
			</div>

			<div className="border-t border-zinc-800 bg-zinc-950/90 px-3 py-3">
				<div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-200">
					<PackageIcon className="size-4" />
					<span>Dependencies</span>
				</div>

				<div className="flex flex-wrap gap-2">
					{allDependencies.map(([dependency, version]) => (
						<div
							className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
							key={dependency}
						>
							<span>{dependency}</span>
							<span className="text-zinc-500">{version}</span>
							{userDependencies[dependency] && (
								<CheckIcon className="size-3.5 text-emerald-400" />
							)}
						</div>
					))}
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<Input
						className="h-9 max-w-xs border-zinc-700 bg-zinc-900 text-sm"
						onChange={(event) => setPackageInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleAddDependency();
							}
						}}
						placeholder="axios or framer-motion@latest"
						value={packageInput}
					/>
					<Button
						className="h-9"
						onClick={handleAddDependency}
						type="button"
						variant="secondary"
					>
						<PlusIcon className="mr-2 size-4" />
						Add Package
					</Button>
				</div>
			</div>
		</div>
	);
}

function PureSandpackViewer({
	files,
	activeFileIndex = 0,
	dependencies = {},
	userDependencies = {},
	onDependenciesChange,
	status,
}: SandpackViewerProps) {
	const sandpackFiles = useMemo(() => buildSandpackFiles(files), [files]);
	const template = useMemo(() => getTemplate(files), [files]);
	const activeFile = normalizePath(
		files[activeFileIndex]?.name || files[0]?.name || "App.js",
	);
	const startRoute = template === "static" ? "/index.html" : "/";

	return (
		<div className="h-full w-full overflow-hidden bg-zinc-950">
			<SandpackProvider
				customSetup={{
					dependencies,
				}}
				files={sandpackFiles}
				theme={dracula}
				template={template}
				options={{
					activeFile,
					startRoute,
					visibleFiles: Object.keys(sandpackFiles),
				}}
			>
				<SandpackIDE
					dependencies={dependencies}
					onDependenciesChange={onDependenciesChange}
					status={status}
					userDependencies={userDependencies}
				/>
			</SandpackProvider>
		</div>
	);
}

export const SandpackViewer = memo(PureSandpackViewer);
