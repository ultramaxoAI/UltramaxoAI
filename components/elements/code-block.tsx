import { Check, Code2, Copy, Download } from "lucide-react";
import { memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { useArtifact } from "@/hooks/use-artifact";
import { generateUUID } from "@/lib/utils";

// Safety limits to prevent browser OOM crashes
const MAX_HIGHLIGHT_CHARS = 12_000; // Skip highlighting above this
const MAX_HIGHLIGHT_LINES = 300;
const MAX_DISPLAY_CHARS = 50_000; // Truncate display above this

interface CodeBlockProps {
	children: string;
	className?: string;
	language?: string;
	isLoading?: boolean;
}

function PureCodeBlock({
	children,
	className,
	language,
	isLoading,
}: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const [showFull, setShowFull] = useState(false);
	const { setArtifact } = useArtifact();

	// Extract language if not provided, fallback to text
	const lang =
		language ||
		(className ? /language-(\w+)/.exec(className)?.[1] : "text") ||
		"text";

	// Determine rendering strategy
	const lineCount = children.split("\n").length;
	const isTooLargeForHighlight =
		children.length > MAX_HIGHLIGHT_CHARS || lineCount > MAX_HIGHLIGHT_LINES;
	const isTooLargeForDisplay = children.length > MAX_DISPLAY_CHARS;

	// Truncate if necessary
	const displayContent =
		isTooLargeForDisplay && !showFull
			? `${children.slice(0, MAX_DISPLAY_CHARS)}\n\n... (${(children.length / 1000).toFixed(0)}KB total, click "Show All" to expand)`
			: children;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(children); // Always copy full content
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const blob = new Blob([children], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `code.${lang}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleOpenInEditor = () => {
		setArtifact({
			documentId: generateUUID(),
			content: children,
			title: `Snippet • ${lang.charAt(0).toUpperCase() + lang.slice(1)}`,
			kind: "code",
			isVisible: true,
			status: "idle",
			boundingBox: {
				top: 0,
				left: 0,
				width: 0,
				height: 0,
			},
		});
	};

	return (
		<div className="group/code relative my-4 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/8 bg-white/[0.04] font-mono text-[13px] md:max-w-full">
			<div className="flex items-center justify-between border-white/8 border-b px-4 py-2">
				<span className="text-[10px] uppercase tracking-[0.18em] text-white/25">
					{lang}
				</span>
				<div className="flex gap-1">
					<Button
						className="size-7 text-white/30 hover:bg-white/6 hover:text-white/70"
						onClick={handleOpenInEditor}
						size="icon"
						title="Open in Editor"
						variant="ghost"
					>
						<Code2 className="size-3.5" />
					</Button>
					<Button
						className="size-7 text-white/30 hover:bg-white/6 hover:text-white/70"
						onClick={handleCopy}
						size="icon"
						title={copied ? "Copied!" : "Copy code"}
						variant="ghost"
					>
						{copied ? (
							<Check className="size-3.5" />
						) : (
							<Copy className="size-3.5" />
						)}
					</Button>
					<Button
						className="size-7 text-white/30 hover:bg-white/6 hover:text-white/70"
						onClick={handleDownload}
						size="icon"
						title="Download code"
						variant="ghost"
					>
						<Download className="size-3.5" />
					</Button>
				</div>
			</div>
			<div className="max-h-[500px] overflow-x-auto overflow-y-auto">
				{isTooLargeForHighlight || isLoading ? (
					/* Plain text fallback for large code or when streaming - no Prism = no OOM/Freeze */
					<pre
						className="whitespace-pre p-5 text-[13px] leading-[1.65] text-white/65"
						style={{ minWidth: "fit-content" }}
					>
						{displayContent}
					</pre>
				) : (
					<SyntaxHighlighter
						codeTagProps={{
							style: {
								fontSize: "0.8rem",
								fontFamily: "'Geist Mono', Menlo, monospace",
								lineHeight: "1.6",
							},
						}}
						customStyle={{
							margin: 0,
							padding: "1.25rem",
							background: "transparent",
							fontSize: "13px",
							minWidth: "fit-content",
						}}
						language={lang}
						PreTag="div"
						style={oneDark}
						wrapLongLines={false}
						showLineNumbers={lineCount > 5}
						lineNumberStyle={{
							minWidth: "2.5em",
							paddingRight: "1em",
							color: "rgba(255,255,255,0.22)",
							userSelect: "none",
						}}
					>
						{displayContent}
					</SyntaxHighlighter>
				)}
			</div>
			{isTooLargeForDisplay && !showFull && (
				<div className="border-white/8 border-t px-4 py-2 text-center">
					<button
						className="text-xs text-indigo-300/70 transition-colors hover:text-indigo-200"
						onClick={() => setShowFull(true)}
						type="button"
					>
						Show All ({(children.length / 1000).toFixed(0)}KB)
					</button>
				</div>
			)}
		</div>
	);
}

export const CodeBlock = memo(PureCodeBlock);
