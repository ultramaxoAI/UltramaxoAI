"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { TaskType } from "@/lib/detect-task-type";
import type { ThinkingStep } from "@/lib/thinking-steps";
import type { CustomUIDataTypes } from "@/lib/types";
import type { AgentThinkingStep } from "./agent-thinking-panel";

type AgentStreamStatus = "thinking" | "executing" | "done" | "error";

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
	};
	setLiveThinking: React.Dispatch<
		React.SetStateAction<DataStreamContextValue["liveThinking"]>
	>;
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
	});

	const value = useMemo(
		() => ({
			dataStream,
			setDataStream,
			agentStream,
			setAgentStream,
			liveThinking,
			setLiveThinking,
		}),
		[dataStream, agentStream, liveThinking],
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
