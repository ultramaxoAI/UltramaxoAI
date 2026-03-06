import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CodeEditor, type SupportedLanguage } from "@/components/code-editor";
import {
	Console,
	type ConsoleOutput,
	type ConsoleOutputContent,
} from "@/components/console";
import { Artifact } from "@/components/create-artifact";
import { FileExplorer } from "@/components/file-explorer";
import {
	CopyIcon,
	LogsIcon,
	MessageIcon,
	PlayIcon,
	RedoIcon,
	UndoIcon,
} from "@/components/icons";
import { SandpackViewer } from "@/components/sandpack-viewer";
import { generateUUID } from "@/lib/utils";

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
		const fileName = match[1];
		const startIndex = match.index! + match[0].length;
		const endIndex =
			i < matches.length - 1 ? matches[i + 1].index! : code.length;
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
	const combinedSource = Array.isArray(source)
		? source.map((file) => file.content).join("\n")
		: source;

	const dependencies: Record<string, string> = {};
	const patterns = [
		/import\s+[^'"\n]+\s+from\s+['"]([^./][^'"]*)['"]/g,
		/import\s*\(\s*['"]([^./][^'"]*)['"]\s*\)/g,
		/require\(\s*['"]([^./][^'"]*)['"]\s*\)/g,
	];

	for (const pattern of patterns) {
		for (const match of combinedSource.matchAll(pattern)) {
			const packageName = normalizePackageName(match[1] ?? "");

			if (
				!packageName ||
				BUILT_IN_SANDBOX_DEPENDENCIES.has(packageName)
			) {
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
};

async function executeJavaScript(
	code: string,
	outputCallback: (content: ConsoleOutputContent) => void,
): Promise<void> {
	const originalLog = console.log;
	const originalError = console.error;
	const originalWarn = console.warn;

	try {
		// Override console methods
		console.log = (...args: any[]) => {
			outputCallback({
				type: "text",
				value: args.map((arg) => String(arg)).join(" "),
			});
		};

		console.error = (...args: any[]) => {
			outputCallback({
				type: "text",
				value: `Error: ${args.map((arg) => String(arg)).join(" ")}`,
			});
		};

		console.warn = (...args: any[]) => {
			outputCallback({
				type: "text",
				value: `Warning: ${args.map((arg) => String(arg)).join(" ")}`,
			});
		};

		// Execute code
		// eslint-disable-next-line no-eval
		await eval(`(async () => { ${code} })()`);
	} catch (error: any) {
		outputCallback({
			type: "text",
			value: `Error: ${error.message}`,
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
		});
	},
	onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
		if (streamPart.type === "data-codeDelta") {
			setArtifact((draftArtifact) => ({
				...draftArtifact,
				content: streamPart.data,
				// Make artifact visible immediately when code starts streaming
				isVisible: true,
				status: "streaming",
			}));

			// Parse files and detect language when enough content is available
			if (streamPart.data.length > 50) {
				const files = parseCodeFiles(streamPart.data);
				const detectedLang =
					files[0]?.language || detectCodeLanguage(streamPart.data);
				setMetadata((metadata) => ({
					...metadata,
					language: detectedLang,
					files,
				}));
			}
		}
	},
	content: ({ metadata, setMetadata, content, ...props }) => {
		const [isExpanded, setIsExpanded] = useState(true);
		const files = metadata?.files || parseCodeFiles(content || "");
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

		// Get preview of code (first few lines)
		const codePreview = (activeFile?.content || content || "")
			.split("\n")
			.slice(0, 3)
			.join("\n");
		const linesCount = (activeFile?.content || content || "").split(
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
		};

		const handleFileRename = (index: number, newName: string) => {
			const updatedFiles = [...files];
			updatedFiles[index] = { ...updatedFiles[index], name: newName };

			setMetadata({
				...metadata,
				files: updatedFiles,
			});
		};

		return (
			<div className="flex flex-col w-full border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
				{/* Collapsible Header - Like Reagent */}
				<button
					className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? (
						<ChevronDown className="w-5 h-5 text-zinc-400" />
					) : (
						<ChevronRight className="w-5 h-5 text-zinc-400" />
					)}
					<div className="flex items-center gap-2">
						<div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
							<LogsIcon size={20} />
						</div>
						<div className="flex-1 text-left">
							<div className="font-medium text-zinc-200">
								{detectedLanguage.toUpperCase()}
							</div>
							<div className="text-xs text-zinc-500">
								{linesCount} lines
								{files.length > 1 ? ` • ${files.length} files` : ""}
							</div>
						</div>
					</div>
					{!isExpanded && (
						<div className="flex-1 text-left text-sm text-zinc-500 font-mono truncate ml-4">
							{codePreview.substring(0, 80)}...
						</div>
					)}
				</button>

				{/* Expandable Content */}
				{isExpanded && (
					<div className="flex w-full" style={{ height: 500 }}>
						{/* If it's a React project, we display SandpackViewer which handles its own layout */}
						{files.some(
							(f) =>
								f.name.endsWith(".jsx") ||
								f.name.endsWith(".tsx") ||
								f.content.includes("export default function App") ||
								f.content.includes("import React") ||
								f.name === "App.js" ||
								f.name === "App.tsx",
						) ? (
							<div className="flex-1 w-full h-full">
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
								/>
							</div>
						) : (
							<>
								{/* File Explorer Sidebar - Show when multiple files and NOT a React project (Sandpack has its own File Explorer if we want, or we keep this one) */}
								{files.length > 1 && (
									<FileExplorer
										activeFileIndex={activeFileIndex}
										className="w-56 shrink-0 border-r border-zinc-800"
										files={files}
										onFileAdd={handleFileAdd}
										onFileDelete={handleFileDelete}
										onFileRename={handleFileRename}
										onFileSelect={(index) =>
											setMetadata({ ...metadata, activeFileIndex: index })
										}
									/>
								)}

								{/* Code Editor Area */}
								<div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
									<CodeEditor
										{...props}
										content={activeFile?.content || content || ""}
										language={detectedLanguage}
									/>

									{metadata?.outputs && metadata.outputs.length > 0 && (
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
							</>
						)}
					</div>
				)}
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
				} catch (error: any) {
					setMetadata((metadata) => ({
						...metadata,
						outputs: [
							...metadata.outputs.filter((output) => output.id !== runId),
							{
								id: runId,
								contents: [{ type: "text", value: error.message }],
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
