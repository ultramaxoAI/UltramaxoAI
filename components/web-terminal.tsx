"use client";

import "@xterm/xterm/css/xterm.css";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import {
	ChevronDown,
	ChevronUp,
	Loader2,
	TerminalSquare,
	Trash2,
} from "lucide-react";
import {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TerminalOutput } from "@/lib/webcontainer/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebTerminalHandle {
	/** Write a line to the terminal */
	writeln: (text: string) => void;
	/** Write raw text (no newline) */
	write: (text: string) => void;
	/** Clear the terminal */
	clear: () => void;
	/** Focus the terminal */
	focus: () => void;
}

interface WebTerminalProps {
	/** Whether the terminal panel is initially collapsed */
	defaultCollapsed?: boolean;
	/** External status label shown in the header */
	status?: string;
	/** Whether a command is currently running */
	isRunning?: boolean;
	/** Terminal output stream from WebContainer */
	outputs?: TerminalOutput[];
	/** Class overrides */
	className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PureWebTerminal(
	{
		defaultCollapsed = true,
		status,
		isRunning = false,
		outputs = [],
		className,
	}: WebTerminalProps,
	ref: React.Ref<WebTerminalHandle>,
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const xtermRef = useRef<XTerm | null>(null);
	const fitRef = useRef<FitAddon | null>(null);
	const renderedOutputCountRef = useRef(0);
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	// Initialise xterm
	useEffect(() => {
		if (!containerRef.current || xtermRef.current) return;

		const term = new XTerm({
			theme: {
				background: "#0b0d10",
				foreground: "rgba(255,255,255,0.82)",
				cursor: "rgba(255,255,255,0.7)",
				selectionBackground: "rgba(99,102,241,0.3)",
				black: "#1a1d23",
				red: "#f87171",
				green: "#4ade80",
				yellow: "#eab308",
				blue: "#6366f1",
				magenta: "#a78bfa",
				cyan: "#22d3ee",
				white: "rgba(255,255,255,0.82)",
			},
			fontFamily: "'Geist Mono', Menlo, monospace",
			fontSize: 13,
			lineHeight: 1.6,
			cursorBlink: true,
			cursorStyle: "bar",
			scrollback: 5000,
			convertEol: true,
			allowProposedApi: true,
		});

		const fit = new FitAddon();
		term.loadAddon(fit);
		term.open(containerRef.current);

		// Initial fit
		requestAnimationFrame(() => fit.fit());

		xtermRef.current = term;
		fitRef.current = fit;

		// Welcome message
		term.writeln("\x1b[36mWebContainer Terminal\x1b[0m");
		term.writeln("\x1b[90mReady for AI agent commands...\x1b[0m");
		term.writeln("");

		return () => {
			term.dispose();
			xtermRef.current = null;
			fitRef.current = null;
		};
	}, []);

	// Re-fit on collapse/expand
	useEffect(() => {
		if (!collapsed && fitRef.current) {
			requestAnimationFrame(() => fitRef.current?.fit());
		}
	}, [collapsed]);

	// Re-fit on window resize
	useEffect(() => {
		const handleResize = () => {
			if (!collapsed && fitRef.current) {
				fitRef.current.fit();
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [collapsed]);

	// Expose imperative handle
	useImperativeHandle(
		ref,
		() => ({
			writeln(text: string) {
				xtermRef.current?.writeln(text);
			},
			write(text: string) {
				xtermRef.current?.write(text);
			},
			clear() {
				xtermRef.current?.clear();
			},
			focus() {
				xtermRef.current?.focus();
			},
		}),
		[],
	);

	const handleClear = useCallback(() => {
		xtermRef.current?.clear();
		renderedOutputCountRef.current = 0;
	}, []);

	useEffect(() => {
		const terminal = xtermRef.current;
		if (!terminal || outputs.length === 0) {
			return;
		}

		const startIndex = renderedOutputCountRef.current;
		const nextOutputs = outputs.slice(startIndex);

		for (const output of nextOutputs) {
			terminal.writeln(formatTerminalOutput(output));
		}

		renderedOutputCountRef.current = outputs.length;
	}, [outputs]);

	return (
		<div
			className={cn(
				"flex flex-col border-white/[0.06] border-t bg-[#0b0d10]",
				className,
			)}
		>
			{/* ── Header ─────────────────────────────────────────────────── */}
			<div
				className="flex cursor-pointer items-center justify-between border-white/[0.06] border-b bg-[#111318] px-3 py-2 transition-colors hover:bg-white/[0.02]"
				onClick={() => setCollapsed((prev) => !prev)}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						setCollapsed((prev) => !prev);
					}
				}}
				role="button"
				tabIndex={0}
			>
				<div className="flex items-center gap-2 text-xs font-medium text-white/45">
					<TerminalSquare size={14} className="text-indigo-300/70" />
					<span>Terminal</span>
					{isRunning && (
						<Loader2 size={12} className="animate-spin text-indigo-400/80" />
					)}
					{status && (
						<span className="ml-1 font-normal text-white/25">{status}</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{!collapsed && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-white/30 hover:bg-white/[0.06] hover:text-white/60"
							onClick={(e) => {
								e.stopPropagation();
								handleClear();
							}}
						>
							<Trash2 size={12} />
						</Button>
					)}
					{collapsed ? (
						<ChevronUp size={14} className="text-white/30" />
					) : (
						<ChevronDown size={14} className="text-white/30" />
					)}
				</div>
			</div>

			{/* ── Terminal body ───────────────────────────────────────────── */}
			<div
				className={cn(
					"transition-all duration-200 ease-in-out overflow-hidden",
					collapsed ? "h-0" : "h-[200px]",
				)}
			>
				<div ref={containerRef} className="h-full w-full px-1" />
			</div>
		</div>
	);
}

export const WebTerminal = memo(forwardRef(PureWebTerminal));

// ---------------------------------------------------------------------------
// Helper: format TerminalOutput for xterm
// ---------------------------------------------------------------------------

export function formatTerminalOutput(output: TerminalOutput): string {
	switch (output.type) {
		case "info":
			return `\x1b[36m${output.data}\x1b[0m`; // cyan
		case "stdout":
			return output.data;
		case "stderr":
			return `\x1b[31m${output.data}\x1b[0m`; // red
		case "error":
			return `\x1b[31merror: ${output.data}\x1b[0m`; // red
		case "exit":
			return `\x1b[90m${output.data}\x1b[0m`; // dim
		default:
			return output.data;
	}
}
