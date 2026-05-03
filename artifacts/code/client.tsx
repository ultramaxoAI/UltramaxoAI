import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Eye, File, Files, TerminalSquare, X } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor, type SupportedLanguage } from "@/components/code-editor";
import {
	Console,
	type ConsoleOutput,
	type ConsoleOutputContent,
} from "@/components/console";
import { Artifact } from "@/components/create-artifact";
import {
	CopyIcon,
	LogsIcon,
	MessageIcon,
	PlayIcon,
	RedoIcon,
	UndoIcon,
} from "@/components/icons";
import { SandpackViewer } from "@/components/sandpack-viewer";
import { WebTerminal, type WebTerminalHandle } from "@/components/web-terminal";
import { useWebContainerOptional } from "@/components/webcontainer-provider";
import { WebContainerRunner } from "@/components/webcontainer-runner";
import { cn, generateUUID } from "@/lib/utils";

function _getFileIcon(filename: string) {
	const ext = filename.split(".").pop()?.toLowerCase();
	const iconClass = "w-4 h-4";

	switch (ext) {
		case "js":
		case "jsx":
			return (
				<span className={iconClass} style={{ color: "#f7df1e" }}>
					📜
				</span>
			);
		case "ts":
		case "tsx":
			return (
				<span className={iconClass} style={{ color: "#3178c6" }}>
					📘
				</span>
			);
		case "py":
			return (
				<span className={iconClass} style={{ color: "#3776ab" }}>
					🐍
				</span>
			);
		case "html":
			return (
				<span className={iconClass} style={{ color: "#e34c26" }}>
					🌐
				</span>
			);
		case "css":
			return (
				<span className={iconClass} style={{ color: "#264de4" }}>
					🎨
				</span>
			);
		case "json":
			return <span className={iconClass}>📋</span>;
		default:
			return <span className={iconClass}>📄</span>;
	}
}

const OUTPUT_HANDLERS = {
	matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    # Clear any existing plots
    plt.clf()
    plt.close('all')

    # Switch to agg backend
    plt.switch_backend('agg')

    def setup_matplotlib_output():
        def custom_show():
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            plt.clf()
            plt.close('all')

        plt.show = custom_show
  `,
	basic: `
    # Basic output capture setup
  `,
};

function detectRequiredHandlers(code: string): string[] {
	const handlers: string[] = ["basic"];

	if (code.includes("matplotlib") || code.includes("plt.")) {
		handlers.push("matplotlib");
	}

	return handlers;
}

// Detect language from code
function detectCodeLanguage(code: string): SupportedLanguage {
	const lowerCode = code.toLowerCase();

	if (
		/^(import|from|def|class|if __name__|print\()/m.test(code) ||
		lowerCode.includes("import numpy") ||
		lowerCode.includes("import pandas")
	) {
		return "python";
	}

	if (
		/^(const|let|var|import|export|function|class)/m.test(code) ||
		code.includes("console.log")
	) {
		if (code.includes(": string") || code.includes("interface ")) {
			return "typescript";
		}
		return "javascript";
	}

	if (/<html|<div|<body|<!DOCTYPE/i.test(code)) {
		return "html";
	}

	return "text";
}

// Parse code into files if it contains multiple file markers
function parseCodeFiles(
	code: string,
): Array<{ name: string; content: string; language: SupportedLanguage }> {
	// Check for file markers like "// filename.js" or "# filename.py" or "<!-- filename.html -->"
	const fileMarkerRegex =
		/(?:\/\/|#|<!--)\s*(?:file:|filename:)?\s*([^\s\n]+\.[a-z]+)/gi;
	const matches = Array.from(code.matchAll(fileMarkerRegex));

	if (matches.length === 0) {
		// Check if it's HTML with inline CSS/JS - auto-split it
		if (/<html|<!DOCTYPE/i.test(code)) {
			return extractHtmlFiles(code);
		}

		// Single file
		const language = detectCodeLanguage(code);
		return [
			{
				name: getDefaultFileName(language),
				content: code,
				language,
			},
		];
	}

	// Multiple files
	const files: Array<{
		name: string;
		content: string;
		language: SupportedLanguage;
	}> = [];

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const fileName = match[1] ?? "code.txt";
		const startIndex = (match.index ?? 0) + match[0].length;
		const nextMatchIndex = matches[i + 1]?.index;
		const endIndex =
			typeof nextMatchIndex === "number" ? nextMatchIndex : code.length;
		const content = code.substring(startIndex, endIndex).trim();

		const language = detectCodeLanguage(content);
		files.push({ name: fileName, content, language });
	}

	return files;
}

// Extract HTML, CSS, and JS from a single HTML file with inline styles/scripts
function extractHtmlFiles(
	html: string,
): Array<{ name: string; content: string; language: SupportedLanguage }> {
	const files: Array<{
		name: string;
		content: string;
		language: SupportedLanguage;
	}> = [];

	// Extract inline CSS
	const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
	const styleMatches = Array.from(html.matchAll(styleRegex));
	let extractedCSS = "";

	if (styleMatches.length > 0) {
		extractedCSS = styleMatches.map((m) => m[1].trim()).join("\n\n");
		// Remove style tags from HTML
		html = html.replace(styleRegex, "");
	}

	// Extract inline JavaScript
	const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
	const scriptMatches = Array.from(html.matchAll(scriptRegex));
	let extractedJS = "";

	if (scriptMatches.length > 0) {
		extractedJS = scriptMatches
			.map((m) => m[1].trim())
			.filter((js) => js && !js.includes("src=")) // Skip external scripts
			.join("\n\n");
		// Remove inline script tags from HTML
		html = html.replace(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi, "");
	}

	// Add link to CSS if we extracted any
	if (extractedCSS) {
		html = html.replace(
			"</head>",
			'    <link rel="stylesheet" href="style.css">\n</head>',
		);
	}

	// Add script tag if we extracted any JS
	if (extractedJS) {
		html = html.replace(
			"</body>",
			'    <script src="script.js"></script>\n</body>',
		);
	}

	// Add HTML file
	files.push({
		name: "index.html",
		content: html.trim(),
		language: "html",
	});

	// Add CSS file if exists
	if (extractedCSS) {
		files.push({
			name: "style.css",
			content: extractedCSS,
			language: "css",
		});
	}

	// Add JS file if exists
	if (extractedJS) {
		files.push({
			name: "script.js",
			content: extractedJS,
			language: "javascript",
		});
	}

	return files;
}

// Convert files back to a single string for persistence
function serializeFilesToContent(
	files: Array<{ name: string; content: string; language?: SupportedLanguage }>,
): string {
	if (files.length === 1 && files[0].name.startsWith("code.")) {
		return files[0].content;
	}

	return files
		.map((file) => `// filename: ${file.name}\n${file.content}`)
		.join("\n\n");
}

function getDefaultFileName(language: SupportedLanguage): string {
	switch (language) {
		case "python":
			return "main.py";
		case "javascript":
			return "index.js";
		case "typescript":
			return "index.ts";
		case "html":
			return "index.html";
		case "css":
			return "style.css";
		default:
			return "code.txt";
	}
}

function isPreviewableWebProject(
	files: Array<{ name: string; content: string; language: SupportedLanguage }>,
) {
	return files.some(
		(file) =>
			file.name === "package.json" ||
			file.name === "next.config.js" ||
			file.name === "next.config.mjs" ||
			file.name.startsWith("app/") ||
			file.name.startsWith("pages/") ||
			file.name.endsWith(".jsx") ||
			file.name.endsWith(".tsx") ||
			file.name.endsWith(".html") ||
			file.name === "App.js" ||
			file.name === "App.tsx" ||
			file.name === "index.html" ||
			file.content.includes("export default function App") ||
			file.content.includes("import React") ||
			/<html|<!DOCTYPE/i.test(file.content),
	);
}

const BUILT_IN_SANDBOX_DEPENDENCIES = new Set([
	"react",
	"react-dom",
	"next",
	"fs",
	"path",
	"url",
	"crypto",
	"stream",
	"events",
]);

function normalizePackageName(specifier: string): string | null {
	if (!specifier || specifier.startsWith(".") || specifier.startsWith("/")) {
		return null;
	}

	if (specifier.startsWith("@")) {
		const [scope, pkg] = specifier.split("/");
		if (!scope || !pkg) {
			return null;
		}

		return `${scope}/${pkg}`;
	}

	return specifier.split("/")[0] ?? null;
}

function detectDependencies(
	source:
		| string
		| Array<{ name: string; content: string; language: SupportedLanguage }>,
): Record<string, string> {
	const packageJsonFiles = Array.isArray(source)
		? source.filter((file) => file.name === "package.json")
		: [];
	const combinedSource = Array.isArray(source)
		? source.map((file) => file.content).join("\n")
		: source;

	const dependencies: Record<string, string> = {};

	for (const packageJsonFile of packageJsonFiles) {
		try {
			const parsedPackage = JSON.parse(packageJsonFile.content) as {
				dependencies?: Record<string, string>;
				devDependencies?: Record<string, string>;
			};

			for (const [dependencyName, version] of Object.entries({
				...(parsedPackage.dependencies ?? {}),
				...(parsedPackage.devDependencies ?? {}),
			})) {
				if (!BUILT_IN_SANDBOX_DEPENDENCIES.has(dependencyName)) {
					dependencies[dependencyName] = version || "latest";
				}
			}
		} catch {
			// Ignore malformed package.json here and fall back to import-based detection.
		}
	}

	const patterns = [
		/import\s+[^'"\n]+\s+from\s+['"]([^./][^'"]*)['"]/g,
		/import\s*\(\s*['"]([^./][^'"]*)['"]\s*\)/g,
		/require\(\s*['"]([^./][^'"]*)['"]\s*\)/g,
	];

	for (const pattern of patterns) {
		for (const match of combinedSource.matchAll(pattern)) {
			const packageName = normalizePackageName(match[1] ?? "");

			if (!packageName || BUILT_IN_SANDBOX_DEPENDENCIES.has(packageName)) {
				continue;
			}

			dependencies[packageName] = "latest";
		}
	}

	return dependencies;
}

type Metadata = {
	outputs: ConsoleOutput[];
	language?: SupportedLanguage;
	files?: Array<{ name: string; content: string; language: SupportedLanguage }>;
	activeFileIndex?: number;
	userDependencies?: Record<string, string>;
	parsedContentLength?: number;
};

function shouldRefreshParsedFiles(
	nextContent: string,
	previousParsedLength?: number,
) {
	const nextLength = nextContent.length;
	const previousLength = previousParsedLength ?? 0;

	if (nextLength <= 200) {
		return nextLength !== previousLength;
	}

	if (nextContent.includes("// file:") || nextContent.includes("<!-- file:")) {
		return nextLength - previousLength >= 240;
	}

	return nextLength - previousLength >= 900;
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

async function executeJavaScript(
	code: string,
	outputCallback: (content: ConsoleOutputContent) => void,
): Promise<void> {
	type ConsoleMethod = (...data: unknown[]) => void;
	const originalLog = console.log;
	const originalError = console.error;
	const originalWarn = console.warn;

	try {
		// Override console methods
		console.log = ((...args: unknown[]) => {
			outputCallback({
				type: "text",
				value: args.map((arg) => String(arg)).join(" "),
			});
		}) as ConsoleMethod;

		console.error = ((...args: unknown[]) => {
			outputCallback({
				type: "text",
				value: `Error: ${args.map((arg) => String(arg)).join(" ")}`,
			});
		}) as ConsoleMethod;

		console.warn = ((...args: unknown[]) => {
			outputCallback({
				type: "text",
				value: `Warning: ${args.map((arg) => String(arg)).join(" ")}`,
			});
		}) as ConsoleMethod;

		// Execute code
		// biome-ignore lint/security/noGlobalEval: this artifact runner intentionally executes user-authored sandbox code in-browser.
		await eval(`(async () => { ${code} })()`);
	} catch (error: unknown) {
		outputCallback({
			type: "text",
			value: `Error: ${getErrorMessage(error)}`,
		});
		throw error;
	} finally {
		// Restore console methods
		console.log = originalLog;
		console.error = originalError;
		console.warn = originalWarn;
	}
}

export const codeArtifact = new Artifact<"code", Metadata>({
	kind: "code",
	description:
		"Useful for code generation; Code execution is available for Python, JavaScript, TypeScript, HTML, CSS and more.",
	initialize: ({ setMetadata }) => {
		setMetadata({
			outputs: [],
			language: undefined,
			files: [],
			activeFileIndex: 0,
			userDependencies: {},
			parsedContentLength: 0,
		});
	},
	onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
		if (streamPart.type === "data-codeDelta") {
			const nextContent = streamPart.data ?? "";
			setArtifact((draftArtifact) => ({
				...draftArtifact,
				content: nextContent,
				isVisible: draftArtifact.isVisible,
				status: "streaming",
			}));

			// Parse files and detect language when enough content is available
			if (nextContent.length > 50) {
				setMetadata((metadata) => {
					if (
						!shouldRefreshParsedFiles(
							nextContent,
							metadata?.parsedContentLength,
						)
					) {
						return metadata;
					}

					const files = parseCodeFiles(nextContent);
					const detectedLang =
						files[0]?.language || detectCodeLanguage(nextContent);

					return {
						...metadata,
						language: detectedLang,
						files,
						parsedContentLength: nextContent.length,
					};
				});
			}
		}
	},
	content: ({ metadata, setMetadata, content, ...props }) => {
		const [_isExpanded, _setIsExpanded] = useState(true);
		const [activeTab, setActiveTab] = useState<"code" | "preview" | "terminal">(
			"code",
		);
		const [openTabs, setOpenTabs] = useState<string[]>([]);
		const [copied, setCopied] = useState(false);
		const terminalRef = useRef<WebTerminalHandle>(null);
		const lastWorkspaceSignatureRef = useRef("");
		const wc = useWebContainerOptional();
		const files = useMemo(
			() =>
				metadata?.files && metadata.files.length > 0
					? metadata.files
					: parseCodeFiles(content || ""),
			[metadata?.files, content],
		);
		const activeFileIndex = metadata?.activeFileIndex || 0;
		const activeFile = files[activeFileIndex] || files[0];
		const autoDetectedDependencies = useMemo(
			() => detectDependencies(files.length > 0 ? files : content || ""),
			[files, content],
		);
		const userDependencies = metadata?.userDependencies ?? {};
		const mergedDependencies = useMemo(
			() => ({
				...autoDetectedDependencies,
				...userDependencies,
			}),
			[autoDetectedDependencies, userDependencies],
		);
		const detectedLanguage =
			activeFile?.language ||
			metadata?.language ||
			detectCodeLanguage(content || "");

		useEffect(() => {
			if (!activeFile?.name) {
				return;
			}

			setOpenTabs((currentTabs) =>
				currentTabs.includes(activeFile.name)
					? currentTabs
					: [...currentTabs, activeFile.name],
			);
		}, [activeFile?.name]);

		useEffect(() => {
			if (wc?.devServer?.ready && isPreviewableWebProject(files)) {
				setActiveTab("preview");
			}
		}, [wc?.devServer?.ready, files]);

		useEffect(() => {
			if (!wc) {
				return;
			}

			const nextWorkspaceFiles = files.map((file) => ({
				path: file.name,
				content: file.content,
			}));
			const nextSignature = JSON.stringify(
				nextWorkspaceFiles.map((file) => [file.path, file.content]),
			);

			if (lastWorkspaceSignatureRef.current === nextSignature) {
				return;
			}

			lastWorkspaceSignatureRef.current = nextSignature;
			wc.setWorkspaceFiles(nextWorkspaceFiles);
		}, [wc, files]);

		// Get preview of code (first few lines)
		const _codePreview = (activeFile?.content || content || "")
			.split("\n")
			.slice(0, 3)
			.join("\n");
		const _linesCount = (activeFile?.content || content || "").split(
			"\n",
		).length;

		const handleFileAdd = (newFile: {
			name: string;
			content: string;
			language: SupportedLanguage;
		}) => {
			const updatedFiles = [...files, newFile];
			setMetadata({
				...metadata,
				files: updatedFiles,
				activeFileIndex: updatedFiles.length - 1,
			});
			props.onSaveContent(serializeFilesToContent(updatedFiles), false);
		};

		const handleFileDelete = (index: number) => {
			if (files.length <= 1) {
				return;
			}

			const updatedFiles = files.filter((_, i) => i !== index);
			const newActiveIndex =
				index >= updatedFiles.length ? updatedFiles.length - 1 : index;

			setMetadata({
				...metadata,
				files: updatedFiles,
				activeFileIndex: newActiveIndex,
			});
			props.onSaveContent(serializeFilesToContent(updatedFiles), false);
		};

		const handleFileRename = (index: number, newName: string) => {
			const updatedFiles = [...files];
			updatedFiles[index] = { ...updatedFiles[index], name: newName };

			setMetadata({
				...metadata,
				files: updatedFiles,
			});
			props.onSaveContent(serializeFilesToContent(updatedFiles), false);
		};

		const selectFile = (index: number) => {
			setMetadata({ ...metadata, activeFileIndex: index });
		};

		const closeTab = (fileName: string, event: React.MouseEvent) => {
			event.stopPropagation();

			setOpenTabs((currentTabs) => {
				const nextTabs = currentTabs.filter((tab) => tab !== fileName);

				if (activeFile?.name === fileName) {
					const fallbackFileName = nextTabs.at(-1);
					const fallbackIndex = files.findIndex(
						(file) => file.name === fallbackFileName,
					);

					if (fallbackIndex >= 0) {
						selectFile(fallbackIndex);
					}
				}

				return nextTabs;
			});
		};

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(activeFile?.content || content || "");
				setCopied(true);
				window.setTimeout(() => setCopied(false), 1500);
			} catch {
				toast.error("Failed to copy code");
			}
		};

		const handleActiveFileContentChange = (
			updatedFileContent: string,
			debounce: boolean,
		) => {
			if (!activeFile) {
				props.onSaveContent(updatedFileContent, debounce);
				return;
			}

			const updatedFiles = files.map((file, index) =>
				index === activeFileIndex
					? { ...file, content: updatedFileContent }
					: file,
			);

			setMetadata({
				...metadata,
				files: updatedFiles,
				activeFileIndex,
			});

			props.onSaveContent(serializeFilesToContent(updatedFiles), debounce);
		};

		return (
			<div className="flex h-full w-full overflow-hidden bg-[#0e0e0e]">
				<div className="hidden w-10 shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0a0a0a] py-2 md:flex">
					<button
						type="button"
						className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
					>
						<Files className="h-[15px] w-[15px]" />
					</button>
				</div>

				<div className="hidden w-[175px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0a] md:flex">
					<div className="border-b border-white/[0.05] px-3 py-2.5">
						<span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/22">
							Files
						</span>
					</div>
					<div className="flex-1 overflow-y-auto py-1">
						{files.map((file, index) => (
							<button
								key={file.name}
								type="button"
								onClick={() => selectFile(index)}
								className={cn(
									"flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[12px] transition-colors",
									index === activeFileIndex
										? "bg-white/[0.05] text-white/82"
										: "text-white/35 hover:bg-white/[0.03] hover:text-white/62",
								)}
							>
								<File className="h-3 w-3 shrink-0 text-white/18" />
								<span className="truncate">{file.name}</span>
							</button>
						))}
					</div>
				</div>

				<div className="flex min-w-0 flex-1 flex-col bg-[#0e0e0e]">
					<div className="flex h-9 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] pl-4 pr-2">
						<span className="truncate text-[12px] text-white/38">
							{activeFile?.name || "index.tsx"}
						</span>
						<button
							type="button"
							onClick={handleCopy}
							className="flex h-6 w-6 items-center justify-center rounded text-white/22 transition-colors hover:text-white/55"
						>
							{copied ? (
								<Check className="h-3 w-3 text-white/70" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</button>
					</div>

					{openTabs.length > 0 && (
						<div className="flex shrink-0 overflow-x-auto border-b border-white/[0.06] bg-[#0a0a0a]">
							{openTabs.map((tab) => {
								const isActive = activeFile?.name === tab;
								return (
									<div
										key={tab}
										className={cn(
											"flex h-9 shrink-0 cursor-pointer select-none items-center gap-1.5 border-r border-white/[0.05] px-3 text-[12px] transition-colors",
											isActive
												? "border-t border-t-white/[0.35] bg-[#0e0e0e] text-white/80"
												: "text-white/32 hover:text-white/58",
										)}
										onClick={() => {
											const nextIndex = files.findIndex((file) => file.name === tab);
											if (nextIndex >= 0) {
												selectFile(nextIndex);
											}
										}}
										onKeyDown={() => {}}
										role="button"
										tabIndex={0}
									>
										<span>{tab}</span>
										<button
											type="button"
											onClick={(event) => closeTab(tab, event)}
											className="text-white/18 transition-colors hover:text-white/55"
										>
											<X className="h-2.5 w-2.5" />
										</button>
									</div>
								);
							})}
						</div>
					)}

					<div className="flex shrink-0 items-center border-b border-white/[0.06] bg-[#0a0a0a]">
						{([
							{ id: "code", icon: Files, label: "Code" },
							{ id: "preview", icon: Eye, label: "Preview" },
							{ id: "terminal", icon: TerminalSquare, label: "Terminal" },
						] as const)
							.filter((item) => item.id !== "preview" || isPreviewableWebProject(files))
							.map(({ id, icon: Icon, label }) => (
								<button
									key={id}
									type="button"
									onClick={() => setActiveTab(id)}
									className={cn(
										"flex h-8 items-center gap-1.5 border-r border-white/[0.05] px-4 text-[11px] transition-colors",
										activeTab === id
											? "text-white/75"
											: "text-white/28 hover:text-white/55",
									)}
								>
									<Icon className="h-3 w-3" />
									{label}
								</button>
							))}
					</div>

				{/* Expandable Content */}
				<div
					className="flex flex-1 w-full relative"
					style={{ height: "calc(100vh - 120px)" }}
				>
					{/* WebContainer Runner (headless) */}
					{isPreviewableWebProject(files) && <WebContainerRunner />}

					<div className="flex min-w-0 flex-1 flex-col bg-[#0e0e0e]">
						{/* Top Editor/Preview Section */}
						<div className="flex-1 min-h-0 relative">
							{activeTab === "terminal" ? (
								<div className="h-full">
									<WebTerminal
										ref={terminalRef}
										defaultCollapsed={false}
										outputs={wc?.terminalOutputs}
										status={
											wc?.status === "installing"
												? "Installing..."
												: wc?.status === "running"
													? "Running..."
													: undefined
										}
										isRunning={wc?.isRunning ?? false}
									/>
								</div>
							) : activeTab === "preview" && isPreviewableWebProject(files) ? (
								wc?.devServer?.ready ? (
									<div className="w-full h-full bg-white rounded-tl-md overflow-hidden">
										<iframe
											title="WebContainer Preview"
											src={wc.devServer.url}
											className="w-full h-full border-0"
											sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
										/>
									</div>
								) : (
									// Fallback if dev server is still starting or failed
									<SandpackViewer
										dependencies={mergedDependencies}
										files={files}
										activeFileIndex={activeFileIndex}
										onDependenciesChange={(nextDependencies) =>
											setMetadata((currentMetadata) => ({
												...currentMetadata,
												userDependencies: nextDependencies,
											}))
										}
										status={props.status}
										userDependencies={userDependencies}
										onSaveContent={(updatedFiles) => {
											setMetadata({
												...metadata,
												files: updatedFiles,
											});
											props.onSaveContent(
												serializeFilesToContent(updatedFiles),
												true,
											);
										}}
									/>
								)
							) : (
								<div className="w-full h-full flex flex-col">
									<CodeEditor
										{...props}
										content={activeFile?.content || content || ""}
										language={detectedLanguage}
										onSaveContent={handleActiveFileContentChange}
									/>
									{!isPreviewableWebProject(files) &&
										metadata?.outputs &&
										metadata.outputs.length > 0 && (
											<Console
												consoleOutputs={metadata.outputs}
												setConsoleOutputs={() => {
													setMetadata({
														...metadata,
														outputs: [],
													});
												}}
											/>
										)}
								</div>
							)}
						</div>

						<div className="flex h-6 shrink-0 items-center justify-between border-t border-white/[0.05] bg-[#0a0a0a] px-4">
							<span className="font-mono text-[10px] text-white/22">
								{detectedLanguage}
							</span>
							<div className="flex items-center gap-1.5">
								<div
									className={cn(
										"h-1.5 w-1.5 rounded-full",
										wc?.status === "running"
											? "bg-white/55"
											: wc?.status === "error"
												? "bg-white/30"
												: "bg-white/20",
									)}
								/>
								<span className="text-[10px] text-white/22">
									{wc?.status ?? "ready"}
								</span>
							</div>
						</div>
					</div>
				</div>
				</div>
			</div>
		);
	},
	actions: [
		{
			icon: <PlayIcon size={18} />,
			label: "Run",
			description: "Execute code",
			onClick: async ({ content, setMetadata, metadata }) => {
				const runId = generateUUID();
				const outputContent: ConsoleOutputContent[] = [];

				const files = metadata?.files || parseCodeFiles(content);
				const activeFileIndex = metadata?.activeFileIndex || 0;
				const activeFile = files[activeFileIndex] || files[0];
				const codeToRun = activeFile?.content || content;
				const language =
					activeFile?.language ||
					metadata?.language ||
					detectCodeLanguage(content);

				setMetadata((metadata) => ({
					...metadata,
					outputs: [
						...metadata.outputs,
						{
							id: runId,
							contents: [],
							status: "in_progress",
						},
					],
				}));

				try {
					// JavaScript/TypeScript execution
					if (
						language === "javascript" ||
						language === "typescript" ||
						language === "jsx" ||
						language === "tsx"
					) {
						await executeJavaScript(codeToRun, (output) => {
							outputContent.push(output);
						});

						setMetadata((metadata) => ({
							...metadata,
							outputs: [
								...metadata.outputs.filter((output) => output.id !== runId),
								{
									id: runId,
									contents: outputContent,
									status: "completed",
								},
							],
						}));
						return;
					}

					// HTML execution - display in iframe
					if (language === "html") {
						outputContent.push({
							type: "text",
							value: "✓ HTML rendered below",
						});

						setMetadata((metadata) => ({
							...metadata,
							outputs: [
								...metadata.outputs.filter((output) => output.id !== runId),
								{
									id: runId,
									contents: [
										...outputContent,
										{
											type: "html",
											value: codeToRun,
										},
									],
									status: "completed",
								},
							],
						}));
						return;
					}

					// Python execution
					if (language === "python") {
						// @ts-expect-error - loadPyodide is not defined
						const currentPyodideInstance = await globalThis.loadPyodide({
							indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
						});

						currentPyodideInstance.setStdout({
							batched: (output: string) => {
								outputContent.push({
									type: output.startsWith("data:image/png;base64")
										? "image"
										: "text",
									value: output,
								});
							},
						});

						await currentPyodideInstance.loadPackagesFromImports(content, {
							messageCallback: (message: string) => {
								setMetadata((metadata) => ({
									...metadata,
									outputs: [
										...metadata.outputs.filter((output) => output.id !== runId),
										{
											id: runId,
											contents: [{ type: "text", value: message }],
											status: "loading_packages",
										},
									],
								}));
							},
						});

						const requiredHandlers = detectRequiredHandlers(codeToRun);
						for (const handler of requiredHandlers) {
							if (OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS]) {
								await currentPyodideInstance.runPythonAsync(
									OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS],
								);

								if (handler === "matplotlib") {
									await currentPyodideInstance.runPythonAsync(
										"setup_matplotlib_output()",
									);
								}
							}
						}

						await currentPyodideInstance.runPythonAsync(codeToRun);

						setMetadata((metadata) => ({
							...metadata,
							outputs: [
								...metadata.outputs.filter((output) => output.id !== runId),
								{
									id: runId,
									contents: outputContent,
									status: "completed",
								},
							],
						}));
						return;
					}

					// Unsupported language
					throw new Error(
						`Execution not supported for ${language}. Currently supports: Python, JavaScript, TypeScript, HTML.`,
					);
				} catch (error: unknown) {
					setMetadata((metadata) => ({
						...metadata,
						outputs: [
							...metadata.outputs.filter((output) => output.id !== runId),
							{
								id: runId,
								contents: [{ type: "text", value: getErrorMessage(error) }],
								status: "failed",
							},
						],
					}));
				}
			},
		},
		{
			icon: <UndoIcon size={18} />,
			description: "View Previous version",
			onClick: ({ handleVersionChange }) => {
				handleVersionChange("prev");
			},
			isDisabled: ({ currentVersionIndex }) => {
				if (currentVersionIndex === 0) {
					return true;
				}

				return false;
			},
		},
		{
			icon: <RedoIcon size={18} />,
			description: "View Next version",
			onClick: ({ handleVersionChange }) => {
				handleVersionChange("next");
			},
			isDisabled: ({ isCurrentVersion }) => {
				if (isCurrentVersion) {
					return true;
				}

				return false;
			},
		},
		{
			icon: <CopyIcon size={18} />,
			description: "Copy code to clipboard",
			onClick: ({ content }) => {
				navigator.clipboard.writeText(content);
				toast.success("Copied to clipboard!");
			},
		},
	],
	toolbar: [
		{
			icon: <MessageIcon />,
			description: "Add comments",
			onClick: ({ sendMessage }) => {
				sendMessage({
					role: "user",
					parts: [
						{
							type: "text",
							text: "Add comments to the code snippet for understanding",
						},
					],
				});
			},
		},
		{
			icon: <LogsIcon />,
			description: "Add logs",
			onClick: ({ sendMessage }) => {
				sendMessage({
					role: "user",
					parts: [
						{
							type: "text",
							text: "Add logs to the code snippet for debugging",
						},
					],
				});
			},
		},
	],
});
