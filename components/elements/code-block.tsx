import { Check, Code2, Copy, Download } from "lucide-react";
import { memo, useEffect, useState } from "react";
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
}

function PureCodeBlock({ children, className, language }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const [showFull, setShowFull] = useState(false);
	const { setArtifact } = useArtifact();
	const [debouncedChildren, setDebouncedChildren] = useState(children);

	// Debounce children to prevent freezing the browser during rapid AI streaming
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedChildren(children);
		}, 150);
		return () => clearTimeout(timer);
	}, [children]);

	// Extract language if not provided, fallback to text
	const lang =
		language ||
		(className ? /language-(\w+)/.exec(className)?.[1] : "text") ||
		"text";

	// Determine rendering strategy
	const lineCount = debouncedChildren.split("\n").length;
	const isTooLargeForHighlight =
		debouncedChildren.length > MAX_HIGHLIGHT_CHARS || lineCount > MAX_HIGHLIGHT_LINES;
	const isTooLargeForDisplay = debouncedChildren.length > MAX_DISPLAY_CHARS;

	// Truncate if necessary
	const displayContent =
		isTooLargeForDisplay && !showFull
			? `${debouncedChildren.slice(0, MAX_DISPLAY_CHARS)}\n\n... (${(debouncedChildren.length / 1000).toFixed(0)}KB total, click "Show All" to expand)`
			: debouncedChildren;

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
		<div className="group/code relative my-4 rounded-lg border bg-zinc-950 font-mono text-sm max-w-[calc(100vw-2rem)] md:max-w-full">
			{/* Language label + action buttons header */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
				<span className="text-xs text-zinc-500 uppercase tracking-wider">
					{lang}
				</span>
				<div className="flex gap-1">
					<Button
						className="size-7 text-zinc-400 hover:text-zinc-100"
						onClick={handleOpenInEditor}
						size="icon"
						title="Open in Editor"
						variant="ghost"
					>
						<Code2 className="size-3.5" />
					</Button>
					<Button
						className="size-7 text-zinc-400 hover:text-zinc-100"
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
						className="size-7 text-zinc-400 hover:text-zinc-100"
						onClick={handleDownload}
						size="icon"
						title="Download code"
						variant="ghost"
					>
						<Download className="size-3.5" />
					</Button>
				</div>
			</div>
			<div className="overflow-x-auto overflow-y-auto max-h-[500px]">
				{isTooLargeForHighlight ? (
					/* Plain text fallback for large code - no Prism = no OOM */
					<pre
						className="p-5 text-[0.8rem] leading-[1.6] text-zinc-300 whitespace-pre"
						style={{ minWidth: "fit-content" }}
					>
						{displayContent}
					</pre>
				) : (
					<SyntaxHighlighter
						codeTagProps={{
							style: {
								fontSize: "0.8rem",
								fontFamily: "var(--font-mono)",
								lineHeight: "1.6",
							},
						}}
						customStyle={{
							margin: 0,
							padding: "1.25rem",
							background: "transparent",
							fontSize: "0.8rem",
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
							color: "#4a4a5a",
							userSelect: "none",
						}}
					>
						{displayContent}
					</SyntaxHighlighter>
				)}
			</div>
			{isTooLargeForDisplay && !showFull && (
				<div className="border-t border-zinc-800 px-4 py-2 text-center">
					<button
						className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
						onClick={() => setShowFull(true)}
						type="button"
					>
						Show All ({(debouncedChildren.length / 1000).toFixed(0)}KB)
					</button>
				</div>
			)}
		</div>
	);
}

export const CodeBlock = memo(PureCodeBlock);
