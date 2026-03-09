/** Terminal output line from WebContainer process */
export interface TerminalOutput {
	type: "stdout" | "stderr" | "info" | "error" | "exit";
	data: string;
	timestamp: number;
}

/** WebContainer process state */
export interface ProcessState {
	pid: number;
	command: string;
	running: boolean;
	exitCode?: number;
}

/** File entry for WebContainer filesystem mount */
export interface WCFile {
	path: string;
	content: string;
}

/** WebContainer engine state */
export type EngineStatus =
	| "idle"
	| "booting"
	| "ready"
	| "installing"
	| "running"
	| "error";

/** Dev server info */
export interface DevServerInfo {
	url: string;
	port: number;
	ready: boolean;
}

/** Terminal command request from AI data stream */
export interface TerminalCommandEvent {
	command: string;
	purpose: string;
}

/** Package install request from AI data stream */
export interface PackageInstallEvent {
	packages: string[];
	purpose: string;
}
