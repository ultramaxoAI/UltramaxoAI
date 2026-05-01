"use client";

import { useCallback, useEffect, useRef } from "react";
import {
	bootWebContainer,
	installPackages,
	mountFiles,
	runCommand,
	setEngineStatus,
	startDevServer,
} from "@/lib/webcontainer/engine";
import type { TerminalOutput } from "@/lib/webcontainer/types";
import { useWebContainerOptional } from "./webcontainer-provider";

/**
 * Headless component that:
 * 1. Boots the WebContainer on mount
 * 2. Processes the command queue from WebContainerProvider
 * 3. Pipes output to the terminal via addTerminalOutput
 */
export function WebContainerRunner() {
	const ctx = useWebContainerOptional();
	const processingRef = useRef(false);
	const bootedRef = useRef(false);
	const syncedWorkspaceSignatureRef = useRef("");

	// Boot WebContainer on first render
	useEffect(() => {
		if (!ctx || bootedRef.current) return;
		bootedRef.current = true;

		(async () => {
			try {
				ctx.setStatus("booting");
				ctx.addTerminalOutput({
					type: "info",
					data: "⚡ Booting WebContainer...",
					timestamp: Date.now(),
				});

				await bootWebContainer();

				ctx.setStatus("ready");
				setEngineStatus("ready");
				ctx.addTerminalOutput({
					type: "info",
					data: "✓ WebContainer ready",
					timestamp: Date.now(),
				});
			} catch (err) {
				ctx.setStatus("error");
				ctx.addTerminalOutput({
					type: "error",
					data: `WebContainer boot failed: ${err instanceof Error ? err.message : String(err)}`,
					timestamp: Date.now(),
				});
			}
		})();
	}, [ctx]);

	useEffect(() => {
		if (!ctx || ctx.status === "idle" || ctx.workspaceFiles.length === 0) {
			return;
		}

		const nextSignature = JSON.stringify(
			ctx.workspaceFiles.map((file) => [file.path, file.content]),
		);

		if (syncedWorkspaceSignatureRef.current === nextSignature) {
			return;
		}

		let isCancelled = false;

		(async () => {
			try {
				await mountFiles(
					ctx.workspaceFiles.map((file) => ({
						path: file.path,
						content: file.content,
					})),
				);

				if (!isCancelled) {
					syncedWorkspaceSignatureRef.current = nextSignature;
				}
			} catch (err) {
				if (!isCancelled) {
					ctx.addTerminalOutput({
						type: "error",
						data: `Workspace sync failed: ${err instanceof Error ? err.message : String(err)}`,
						timestamp: Date.now(),
					});
				}
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [ctx, ctx?.status, ctx?.workspaceFiles]);

	// Create output handler
	const createOutputHandler = useCallback((): ((
		output: TerminalOutput,
	) => void) => {
		if (!ctx) return () => {};
		return (output: TerminalOutput) => {
			ctx.addTerminalOutput(output);
		};
	}, [ctx]);

	// Process command queue
	useEffect(() => {
		if (!ctx || processingRef.current) return;
		if (ctx.commandQueue.length === 0) return;

		const processNext = async () => {
			processingRef.current = true;
			const action = ctx.popAction();
			if (!action) {
				processingRef.current = false;
				return;
			}

			ctx.setIsRunning(true);
			const onOutput = createOutputHandler();

			try {
				switch (action.type) {
					case "command": {
						const parts = action.command.split(" ");
						const cmd = parts[0];
						const args = parts.slice(1);
						ctx.setStatus("running");
						await runCommand(cmd, args, onOutput);
						break;
					}

					case "install": {
						ctx.setStatus("installing");
						await installPackages(action.packages, onOutput);
						break;
					}

					case "dev-server": {
						ctx.setStatus("running");
						await startDevServer(onOutput, (info) => {
							ctx.setDevServer(info);
							ctx.addTerminalOutput({
								type: "info",
								data: `✓ Dev server ready at ${info.url}`,
								timestamp: Date.now(),
							});
						});
						break;
					}
				}
			} catch (err) {
				ctx.addTerminalOutput({
					type: "error",
					data: `Command failed: ${err instanceof Error ? err.message : String(err)}`,
					timestamp: Date.now(),
				});
			}

			ctx.setIsRunning(false);
			ctx.setStatus("ready");
			processingRef.current = false;

			// Process next if there are more in queue
			if (ctx.commandQueue.length > 0) {
				processNext();
			}
		};

		processNext();
	}, [ctx, ctx?.commandQueue.length, createOutputHandler]);

	return null; // Headless component
}
