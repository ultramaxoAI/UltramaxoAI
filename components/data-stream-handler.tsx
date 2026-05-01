"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { ArtifactKind } from "@/components/artifact";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { useWebContainerOptional } from "./webcontainer-provider";

export function DataStreamHandler() {
	const { dataStream, setDataStream } = useDataStream();
	const { mutate } = useSWRConfig();
	const wc = useWebContainerOptional();

	const { artifact, setArtifact, setMetadata } = useArtifact();

	useEffect(() => {
		if (!dataStream?.length) {
			return;
		}

		const newDeltas = dataStream.slice();
		setDataStream([]);

		let currentKind = artifact.kind;

		for (const delta of newDeltas) {
			// Cast for custom event type comparisons
			const deltaType = delta.type as string;
			const deltaData = (delta as { data?: unknown }).data;

			// Handle chat title updates
			if (deltaType === "data-chat-title") {
				mutate(unstable_serialize(getChatHistoryPaginationKey));
				continue;
			}

			// ── WebContainer terminal events ──────────────────────────────
			if (deltaType === "data-terminal-command" && wc) {
				try {
					const { command, purpose } = JSON.parse(deltaData as string);
					wc.queueCommand(command, purpose);
				} catch (e) {
					console.error("[DataStream] Failed to parse terminal command:", e);
				}
				continue;
			}

			if (deltaType === "data-install-package" && wc) {
				try {
					const { packages, purpose } = JSON.parse(deltaData as string);
					wc.queueInstall(packages, purpose);
				} catch (e) {
					console.error("[DataStream] Failed to parse install event:", e);
				}
				continue;
			}

			if (deltaType === "data-start-dev-server" && wc) {
				wc.queueDevServer();
				continue;
			}
			// ── End WebContainer events ───────────────────────────────────

			if (delta.type === "data-kind") {
				currentKind = delta.data as ArtifactKind;
			}

			const artifactDefinition = artifactDefinitions.find(
				(currentArtifactDefinition) =>
					currentArtifactDefinition.kind === currentKind,
			);

			if (artifactDefinition?.onStreamPart) {
				artifactDefinition.onStreamPart({
					streamPart: delta,
					setArtifact,
					setMetadata,
				});
			}

			setArtifact((draftArtifact) => {
				if (!draftArtifact) {
					return { ...initialArtifactData, status: "streaming" };
				}

				switch (delta.type) {
					case "data-id":
						return {
							...draftArtifact,
							documentId: delta.data,
							isVisible: true,
							status: "streaming",
						};

					case "data-title":
						return {
							...draftArtifact,
							title: delta.data,
							isVisible: true,
							status: "streaming",
						};

					case "data-kind":
						return {
							...draftArtifact,
							kind: delta.data,
							isVisible: true,
							status: "streaming",
						};

					case "data-clear":
						return {
							...draftArtifact,
							content: "",
							isVisible: true,
							status: "streaming",
						};

					case "data-finish":
						return {
							...draftArtifact,
							status: "idle",
						};

					default:
						return draftArtifact;
				}
			});
		}
	}, [
		dataStream,
		setArtifact,
		setMetadata,
		artifact,
		setDataStream,
		mutate,
		wc,
	]);

	return null;
}
