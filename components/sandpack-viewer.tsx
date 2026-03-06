"use client";

import {
	SandpackCodeEditor,
	SandpackConsole,
	type SandpackPredefinedTemplate,
	SandpackPreview,
	SandpackProvider,
	useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	CodeIcon,
	FileIcon,
	FolderIcon,
	PencilIcon,
	PlusIcon,
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

const DEFAULT_NEXT_LAYOUT_FILE = `export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
`;

const DEFAULT_NEXT_PAGE_FILE = `export default function HomePage() {
	return (
		<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
			<div style={{ textAlign: "center", padding: 24 }}>
				<p style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "#0f766e", fontSize: 12 }}>
					Next.js Preview
				</p>
				<h1 style={{ fontSize: 40, margin: "12px 0" }}>Your app is ready.</h1>
				<p style={{ color: "#475569" }}>
					Ask the AI to create pages, components, routes, and project dependencies.
				</p>
			</div>
		</main>
	);
}
`;

const DEFAULT_NEXT_CONFIG_FILE = `/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
};

module.exports = nextConfig;
`;

const DEFAULT_NEXT_PACKAGE_JSON = `{
	"name": "nextjs-live-preview",
	"private": true,
	"scripts": {
		"dev": "next dev"
	},
	"dependencies": {
		"next": "latest",
		"react": "latest",
		"react-dom": "latest"
	}
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

function isNextJsProject(files: PlayableFile[]) {
	return files.some((file) => {
		if (
			file.name === "package.json" ||
			file.name === "next.config.js" ||
			file.name === "next.config.mjs" ||
			file.name.startsWith("app/") ||
			file.name.startsWith("pages/")
		) {
			return true;
		}

		return /from\s+["']next\//.test(file.content);
	});
}

function getTemplate(files: PlayableFile[]): SandpackPredefinedTemplate {
	if (isNextJsProject(files)) {
		return "nextjs";
	}

	if (files.some((file) => file.name.endsWith(".html"))) {
		return "static";
	}

	return files.some(
		(file) => file.name.endsWith(".ts") || file.name.endsWith(".tsx"),
	)
		? "react-ts"
		: "react";
}

function buildSandpackFiles(
	files: PlayableFile[],
	template: SandpackPredefinedTemplate,
) {
	const sandpackFiles = files.reduce(
		(accumulator, file) => {
			accumulator[normalizePath(file.name)] = file.content;
			return accumulator;
		},
		{} as Record<string, string>,
	);

	if (template === "nextjs") {
		if (!sandpackFiles["/package.json"]) {
			sandpackFiles["/package.json"] = DEFAULT_NEXT_PACKAGE_JSON;
		}

		if (
			!sandpackFiles["/next.config.js"] &&
			!sandpackFiles["/next.config.mjs"]
		) {
			sandpackFiles["/next.config.js"] = DEFAULT_NEXT_CONFIG_FILE;
		}

		const hasAppRoute =
			Boolean(sandpackFiles["/app/page.js"]) ||
			Boolean(sandpackFiles["/app/page.jsx"]) ||
			Boolean(sandpackFiles["/app/page.tsx"]);
		const hasPagesRoute =
			Boolean(sandpackFiles["/pages/index.js"]) ||
			Boolean(sandpackFiles["/pages/index.jsx"]) ||
			Boolean(sandpackFiles["/pages/index.tsx"]);

		if (!hasAppRoute && !hasPagesRoute) {
			sandpackFiles["/app/page.js"] = DEFAULT_NEXT_PAGE_FILE;
		}

		const hasAppLayout =
			Boolean(sandpackFiles["/app/layout.js"]) ||
			Boolean(sandpackFiles["/app/layout.jsx"]) ||
			Boolean(sandpackFiles["/app/layout.tsx"]);

		if (!hasPagesRoute && !hasAppLayout) {
			sandpackFiles["/app/layout.js"] = DEFAULT_NEXT_LAYOUT_FILE;
		}

		return sandpackFiles;
	}

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
	const [expandedFolders, setExpandedFolders] = useState<
		Record<string, boolean>
	>({});
	const [isAddingFile, setIsAddingFile] = useState(false);
	const [newFileName, setNewFileName] = useState("");
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [renamedFile, setRenamedFile] = useState("");
	const [packageInput, setPackageInput] = useState("");

	const fileEntries = useMemo(
		() =>
			(
				Object.entries(sandpack.files) as Array<
					[string, { code: string; hidden?: boolean }]
				>
			)
				.filter(([, file]) => !file.hidden)
				.sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath)),
		[sandpack.files],
	);

	const filePaths = useMemo(
		() => fileEntries.map(([path]) => path),
		[fileEntries],
	);

	const fileTree = useMemo(() => buildTree(filePaths), [filePaths]);

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
			filePaths[currentIndex + 1] ??
			filePaths[currentIndex - 1] ??
			filePaths[0];

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
				<div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
					<CodeIcon className="size-4 text-cyan-400" />
					<span>Workspace</span>
				</div>

				<div className="flex items-center gap-2 text-xs text-zinc-400">
					<span className="rounded-full border border-zinc-700 px-2 py-1 uppercase tracking-wide">
						{status}
					</span>
					<span className="rounded-full border border-zinc-700 px-2 py-1 uppercase tracking-wide text-zinc-300">
						{filePaths.length} files
					</span>
				</div>
			</div>

			<div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
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
					<div className="h-full min-h-0 [&_.sp-wrapper]:h-full [&_.sp-editor]:h-full [&_.sp-stack]:h-full">
						<SandpackCodeEditor
							showLineNumbers={true}
							showTabs={false}
							style={{ height: "100%" }}
							wrapContent={false}
						/>
					</div>
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
	const template = useMemo(() => getTemplate(files), [files]);
	const sandpackFiles = useMemo(
		() => buildSandpackFiles(files, template),
		[files, template],
	);
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
