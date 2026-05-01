"use client";

import { WebContainer } from "@webcontainer/api";
import type {
	DevServerInfo,
	EngineStatus,
	TerminalOutput,
	WCFile,
} from "./types";

/**
 * Singleton WebContainer engine.
 * Boots a Node.js VM in the browser for real terminal & file-system access.
 */

let _instance: WebContainer | null = null;
let _bootPromise: Promise<WebContainer> | null = null;

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

export async function bootWebContainer(): Promise<WebContainer> {
	if (_instance) return _instance;

	if (_bootPromise) return _bootPromise;

	_bootPromise = WebContainer.boot().then((wc) => {
		_instance = wc;
		console.log("[WebContainer] Booted successfully");
		return wc;
	});

	return _bootPromise;
}

export function getWebContainer(): WebContainer | null {
	return _instance;
}

// ---------------------------------------------------------------------------
// File-system helpers
// ---------------------------------------------------------------------------

/**
 * Mount a list of flat files into the WebContainer.
 * Automatically creates nested directories as needed.
 */
export async function mountFiles(files: WCFile[]): Promise<void> {
	const wc = await bootWebContainer();

	// Build the nested tree structure WebContainer expects
	const tree: Record<string, any> = {};

	for (const file of files) {
		const parts = file.path.replace(/^\//, "").split("/");
		let current = tree;

		for (let i = 0; i < parts.length; i++) {
			const segment = parts[i];
			if (i === parts.length - 1) {
				// Leaf — file node
				current[segment] = { file: { contents: file.content } };
			} else {
				// Directory node
				if (!current[segment]) {
					current[segment] = { directory: {} };
				}
				current = current[segment].directory;
			}
		}
	}

	await wc.mount(tree);
	console.log(`[WebContainer] Mounted ${files.length} files`);
}

/**
 * Write a single file (create or overwrite).
 */
export async function writeFile(path: string, content: string): Promise<void> {
	const wc = await bootWebContainer();

	// Ensure parent directories exist
	const dir = path.substring(0, path.lastIndexOf("/"));
	if (dir) {
		await wc.fs.mkdir(dir, { recursive: true });
	}

	await wc.fs.writeFile(path, content);
}

/**
 * Read a single file.
 */
export async function readFile(path: string): Promise<string> {
	const wc = await bootWebContainer();
	const content = await wc.fs.readFile(path, "utf-8");
	return content;
}

/**
 * Delete a file.
 */
export async function deleteFile(path: string): Promise<void> {
	const wc = await bootWebContainer();
	await wc.fs.rm(path);
}

/**
 * List files in a directory (recursive).
 */
export async function listFiles(dir = "."): Promise<string[]> {
	const wc = await bootWebContainer();
	const entries = await wc.fs.readdir(dir, { withFileTypes: true });
	const paths: string[] = [];

	for (const entry of entries) {
		const fullPath = dir === "." ? entry.name : `${dir}/${entry.name}`;
		if (entry.isDirectory()) {
			// Skip node_modules and .next for performance
			if (entry.name === "node_modules" || entry.name === ".next") continue;
			const subFiles = await listFiles(fullPath);
			paths.push(...subFiles);
		} else {
			paths.push(fullPath);
		}
	}

	return paths;
}

// ---------------------------------------------------------------------------
// Process execution
// ---------------------------------------------------------------------------

export type OutputCallback = (output: TerminalOutput) => void;

/**
 * Run a shell command inside the WebContainer.
 * Streams stdout/stderr via the callback.
 * Returns the exit code.
 */
export async function runCommand(
	command: string,
	args: string[] = [],
	onOutput?: OutputCallback,
): Promise<number> {
	const wc = await bootWebContainer();

	const info = (data: string) =>
		onOutput?.({
			type: "info",
			data,
			timestamp: Date.now(),
		});

	info(`$ ${command} ${args.join(" ")}`);

	const process = await wc.spawn(command, args);

	// Stream stdout
	process.output.pipeTo(
		new WritableStream({
			write(data) {
				onOutput?.({
					type: "stdout",
					data,
					timestamp: Date.now(),
				});
			},
		}),
	);

	const exitCode = await process.exit;

	onOutput?.({
		type: "exit",
		data: `Process exited with code ${exitCode}`,
		timestamp: Date.now(),
	});

	return exitCode;
}

/**
 * Install packages via npm.
 */
export async function installPackages(
	packages: string[],
	onOutput?: OutputCallback,
): Promise<number> {
	return runCommand("npm", ["install", ...packages], onOutput);
}

/**
 * Run npm install (all deps from package.json).
 */
export async function npmInstall(onOutput?: OutputCallback): Promise<number> {
	return runCommand("npm", ["install"], onOutput);
}

// ---------------------------------------------------------------------------
// Dev server
// ---------------------------------------------------------------------------

/**
 * Start a dev server and return a promise that resolves when the server is ready.
 * The devServerInfo will contain the preview URL.
 */
export async function startDevServer(
	onOutput?: OutputCallback,
	onServerReady?: (info: DevServerInfo) => void,
): Promise<void> {
	const wc = await bootWebContainer();

	onOutput?.({
		type: "info",
		data: "$ npm run dev",
		timestamp: Date.now(),
	});

	const process = await wc.spawn("npm", ["run", "dev"]);

	// Stream output
	process.output.pipeTo(
		new WritableStream({
			write(data) {
				onOutput?.({
					type: "stdout",
					data,
					timestamp: Date.now(),
				});
			},
		}),
	);

	// Listen for the server-ready event
	wc.on("server-ready", (port: number, url: string) => {
		console.log(`[WebContainer] Dev server ready at ${url} (port ${port})`);
		onServerReady?.({
			url,
			port,
			ready: true,
		});
	});
}

// ---------------------------------------------------------------------------
// Status helper
// ---------------------------------------------------------------------------

let _status: EngineStatus = "idle";
const _statusListeners = new Set<(status: EngineStatus) => void>();

export function getEngineStatus(): EngineStatus {
	return _status;
}

export function setEngineStatus(status: EngineStatus): void {
	_status = status;
	for (const listener of _statusListeners) {
		listener(status);
	}
}

export function onStatusChange(
	listener: (status: EngineStatus) => void,
): () => void {
	_statusListeners.add(listener);
	return () => _statusListeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

export async function teardown(): Promise<void> {
	if (_instance) {
		_instance.teardown();
		_instance = null;
		_bootPromise = null;
		_status = "idle";
		console.log("[WebContainer] Torn down");
	}
}
