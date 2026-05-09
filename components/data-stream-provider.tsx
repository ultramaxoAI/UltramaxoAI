"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { TaskType } from "@/lib/detect-task-type";
import type { ThinkingStep } from "@/lib/thinking-steps";
import type { CustomUIDataTypes } from "@/lib/types";
import type { AgentThinkingStep } from "./agent-thinking-panel";

type AgentStreamStatus = "thinking" | "executing" | "done" | "error";

type ArtifactStreamLifecycle =
	| "idle"
	| "pending"
	| "streaming"
	| "completed"
	| "error";

type ArtifactStreamState = {
	artifactId: string | null;
	messageId: string | null;
	toolCallId: string | null;
	kind: CustomUIDataTypes["kind"] | null;
	title: string;
	content: string;
	lifecycle: ArtifactStreamLifecycle;
	updatedAt: number | null;
	error?: string;
};

type DataStreamContextValue = {
	dataStream: DataUIPart<CustomUIDataTypes>[];
	setDataStream: React.Dispatch<
		React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
	>;
	agentStream: {
		status: AgentStreamStatus;
		steps: AgentThinkingStep[];
		startedAt: number | null;
		endedAt: number | null;
		error?: string;
	};
	setAgentStream: React.Dispatch<
		React.SetStateAction<DataStreamContextValue["agentStream"]>
	>;
	liveThinking: {
		enabled: boolean;
		taskType: TaskType;
		steps: ThinkingStep[];
		startedAt: number | null;
		surface: "responding" | "deep-thinking" | "agent-active";
		runtimeEscalated: boolean;
	};
	setLiveThinking: React.Dispatch<
		React.SetStateAction<DataStreamContextValue["liveThinking"]>
	>;
	activeChatId: string | null;
	setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
	artifactStream: ArtifactStreamState;
	setArtifactStream: React.Dispatch<React.SetStateAction<ArtifactStreamState>>;
	resetStreamState: () => void;
};

const initialArtifactStreamState: ArtifactStreamState = {
	artifactId: null,
	messageId: null,
	toolCallId: null,
	kind: null,
	title: "",
	content: "",
	lifecycle: "idle",
	updatedAt: null,
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
		[],
	);
	const [agentStream, setAgentStream] = useState<
		DataStreamContextValue["agentStream"]
	>({
		status: "thinking",
		steps: [],
		startedAt: null,
		endedAt: null,
	});
	const [liveThinking, setLiveThinking] = useState<
		DataStreamContextValue["liveThinking"]
	>({
		enabled: false,
		taskType: "general",
		steps: [],
		startedAt: null,
		surface: "responding",
		runtimeEscalated: false,
	});
	const [activeChatId, setActiveChatId] = useState<string | null>(null);
	const [artifactStream, setArtifactStream] = useState<ArtifactStreamState>(
		initialArtifactStreamState,
	);

	const resetStreamState = useCallback(() => {
		setDataStream([]);
		setAgentStream({
			status: "thinking",
			steps: [],
			startedAt: null,
			endedAt: null,
		});
		setLiveThinking({
			enabled: false,
			taskType: "general",
			steps: [],
			startedAt: null,
			surface: "responding",
			runtimeEscalated: false,
		});
		setArtifactStream(initialArtifactStreamState);
	}, []);

	const value = useMemo(
		() => ({
			dataStream,
			setDataStream,
			agentStream,
			setAgentStream,
			liveThinking,
			setLiveThinking,
			activeChatId,
			setActiveChatId,
			artifactStream,
			setArtifactStream,
			resetStreamState,
		}),
		[
			dataStream,
			agentStream,
			liveThinking,
			activeChatId,
			artifactStream,
			resetStreamState,
		],
	);

	return (
		<DataStreamContext.Provider value={value}>
			{children}
		</DataStreamContext.Provider>
	);
}

export function useDataStream() {
	const context = useContext(DataStreamContext);
	if (!context) {
		throw new Error("useDataStream must be used within a DataStreamProvider");
	}
	return context;
}
