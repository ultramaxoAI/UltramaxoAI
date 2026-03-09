"use client";

import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { DevServerInfo, EngineStatus, TerminalOutput } from "@/lib/webcontainer/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebContainerContextValue {
	/** Current engine status */
	status: EngineStatus;
	/** Whether a command is currently running */
	isRunning: boolean;
	/** Dev server info (set when server-ready fires) */
	devServer: DevServerInfo | null;
	/** Queue a terminal command for execution */
	queueCommand: (command: string, purpose?: string) => void;
	/** Queue package install */
	queueInstall: (packages: string[], purpose?: string) => void;
	/** Queue dev server start */
	queueDevServer: () => void;
	/** Pending command queue (consumed by the WebContainerRunner) */
	commandQueue: QueuedAction[];
	/** Pop next action from the queue */
	popAction: () => QueuedAction | undefined;
	/** Terminal output log */
	terminalOutputs: TerminalOutput[];
	/** Add a terminal output line */
	addTerminalOutput: (output: TerminalOutput) => void;
	/** Set engine status */
	setStatus: (status: EngineStatus) => void;
	/** Set dev server info */
	setDevServer: (info: DevServerInfo | null) => void;
	/** Set running state */
	setIsRunning: (running: boolean) => void;
}

export type QueuedAction =
	| { type: "command"; command: string; purpose: string }
	| { type: "install"; packages: string[]; purpose: string }
	| { type: "dev-server" };

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WebContainerContext = createContext<WebContainerContextValue | null>(null);

export function useWebContainer(): WebContainerContextValue {
	const ctx = useContext(WebContainerContext);
	if (!ctx) {
		throw new Error("useWebContainer must be used within WebContainerProvider");
	}
	return ctx;
}

/** Safe version that returns null outside provider (for non-IDE pages) */
export function useWebContainerOptional(): WebContainerContextValue | null {
	return useContext(WebContainerContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WebContainerProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<EngineStatus>("idle");
	const [isRunning, setIsRunning] = useState(false);
	const [devServer, setDevServer] = useState<DevServerInfo | null>(null);
	const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([]);
	const queueRef = useRef<QueuedAction[]>([]);
	const [, setQueueVersion] = useState(0); // trigger re-renders on queue change

	const addTerminalOutput = useCallback((output: TerminalOutput) => {
		setTerminalOutputs((prev) => [...prev.slice(-500), output]); // Keep last 500 lines
	}, []);

	const queueCommand = useCallback((command: string, purpose = "") => {
		queueRef.current.push({ type: "command", command, purpose });
		setQueueVersion((v) => v + 1);
	}, []);

	const queueInstall = useCallback((packages: string[], purpose = "") => {
		queueRef.current.push({ type: "install", packages, purpose });
		setQueueVersion((v) => v + 1);
	}, []);

	const queueDevServer = useCallback(() => {
		queueRef.current.push({ type: "dev-server" });
		setQueueVersion((v) => v + 1);
	}, []);

	const popAction = useCallback((): QueuedAction | undefined => {
		return queueRef.current.shift();
	}, []);

	return (
		<WebContainerContext.Provider
			value={{
				status,
				isRunning,
				devServer,
				queueCommand,
				queueInstall,
				queueDevServer,
				commandQueue: queueRef.current,
				popAction,
				terminalOutputs,
				addTerminalOutput,
				setStatus,
				setDevServer,
				setIsRunning,
			}}
		>
			{children}
		</WebContainerContext.Provider>
	);
}
