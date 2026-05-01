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
				background: "#0a0a0a",
				foreground: "#e4e4e7",
				cursor: "#22d3ee",
				selectionBackground: "#27272a",
				black: "#09090b",
				red: "#ef4444",
				green: "#22c55e",
				yellow: "#eab308",
				blue: "#3b82f6",
				magenta: "#a855f7",
				cyan: "#06b6d4",
				white: "#e4e4e7",
			},
			fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
			fontSize: 13,
			lineHeight: 1.4,
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
		term.writeln("\x1b[36m⚡ WebContainer Terminal\x1b[0m");
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
				"flex flex-col border-t border-zinc-800 bg-[#0a0a0a]",
				className,
			)}
		>
			{/* ── Header ─────────────────────────────────────────────────── */}
			<button
				type="button"
				className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900/50 transition-colors"
				onClick={() => setCollapsed((prev) => !prev)}
			>
				<div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
					<TerminalSquare size={14} className="text-cyan-400" />
					<span>Terminal</span>
					{isRunning && (
						<Loader2 size={12} className="animate-spin text-cyan-400" />
					)}
					{status && (
						<span className="ml-1 text-zinc-500 font-normal">{status}</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{!collapsed && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
							onClick={(e) => {
								e.stopPropagation();
								handleClear();
							}}
						>
							<Trash2 size={12} />
						</Button>
					)}
					{collapsed ? (
						<ChevronUp size={14} className="text-zinc-500" />
					) : (
						<ChevronDown size={14} className="text-zinc-500" />
					)}
				</div>
			</button>

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
			return `\x1b[31m✗ ${output.data}\x1b[0m`; // red with X
		case "exit":
			return `\x1b[90m${output.data}\x1b[0m`; // dim
		default:
			return output.data;
	}
}
