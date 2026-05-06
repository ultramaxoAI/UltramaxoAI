import { z } from "zod";
import { detectTaskType } from "@/lib/detect-task-type";

export const AgentModeDetectionInputSchema = z.object({
	message: z.string().default(""),
	recentContext: z.array(z.string()).default([]),
	hasAttachment: z.boolean().default(false),
});

export type AgentModeDetectionInput = z.infer<
	typeof AgentModeDetectionInputSchema
>;

export type AgentModeDetection = {
	mode: "chat" | "agent";
	confidence: "low" | "medium" | "high";
	score: number;
	reason: string;
	suggestedRunGoal: string;
	taskType: ReturnType<typeof detectTaskType>;
	uiSurface: "responding" | "deep-thinking" | "agent-active";
};

type Signal = {
	weight: number;
	reason: string;
};

const COMPLEX_ACTION_REGEX =
	/\b(build|buat|bikin|fix|benahi|rapihin|repair|debug|implement|integrate|install|setup|deploy|refactor|migrate|optimize|audit|review|analyze|analisis|research|riset|compare|bandingkan|generate|create|edit|ubah|tambah|hapus|run|jalankan|test|cek|inspect|periksa)\b/i;

const PROJECT_CONTEXT_REGEX =
	/\b(project|proyek|repo|repository|codebase|workspace|file|folder|backend|frontend|ui|ux|api|database|db|schema|migration|component|route|endpoint|server|terminal|command|package|dependency|build error|bug|error|stack trace)\b/i;

const MULTI_STEP_REGEX =
	/\b(step by step|langkah|rencana|plan|flow|alur|architecture|arsitektur|full|lengkap|end-to-end|e2e|production|siap pakai|autonomous|agent mode)\b/i;

const SIMPLE_CHAT_REGEX =
	/^(hai|halo|hello|hi|ping|oke|ok|ya|iya|thanks|makasih|siapa kamu|apa kabar)[.!?\s]*$/i;

const AGENTIC_TOOL_NAME_REGEX =
	/\b(startAgentTask|reportAgentStep|listCodeFiles|createCodeFile|createFile|createFolder|updateCodeFile|editFile|deleteCodeFile|readFile|listFiles|runCommand|executeTerminalCommand|installPackage|installDependency|startPreviewServer|runWorkspaceCommand|createDocument|updateDocument)\b/i;

function collectSignals(input: Required<AgentModeDetectionInput>): Signal[] {
	const text = input.message.trim();
	const taskType = detectTaskType(text);
	const signals: Signal[] = [];

	if (!text) {
		return signals;
	}

	if (input.hasAttachment) {
		signals.push({ weight: 2, reason: "has attachment/context file" });
	}

	if (COMPLEX_ACTION_REGEX.test(text)) {
		signals.push({ weight: 2, reason: "requests concrete action" });
	}

	if (PROJECT_CONTEXT_REGEX.test(text)) {
		signals.push({
			weight: 2,
			reason: "mentions project or implementation context",
		});
	}

	if (MULTI_STEP_REGEX.test(text)) {
		signals.push({ weight: 1.5, reason: "implies multi-step workflow" });
	}

	if (taskType === "coding") {
		signals.push({ weight: 2, reason: "coding task" });
	}

	if (taskType === "reasoning" && text.length > 160) {
		signals.push({ weight: 1, reason: "long reasoning task" });
	}

	if (text.length > 220) {
		signals.push({ weight: 1, reason: "long request" });
	}

	if (/```|\n\s*[-*]\s+|\n\s*\d+[.)]/.test(text)) {
		signals.push({ weight: 1, reason: "structured/code-like input" });
	}

	if (
		input.recentContext.join(" ").length > 700 &&
		COMPLEX_ACTION_REGEX.test(text)
	) {
		signals.push({ weight: 1, reason: "uses recent conversation context" });
	}

	return signals;
}

function summarizeGoal(message: string) {
	const compact = message.replace(/\s+/g, " ").trim();
	if (!compact) {
		return "Autonomous agent task";
	}

	return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

export function detectAgentMode(
	rawInput: AgentModeDetectionInput,
): AgentModeDetection {
	const parsed = AgentModeDetectionInputSchema.parse(rawInput);
	const input = {
		message: parsed.message,
		recentContext: parsed.recentContext,
		hasAttachment: parsed.hasAttachment,
	};
	const taskType = detectTaskType(input.message);
	const text = input.message.trim();

	if (!text || SIMPLE_CHAT_REGEX.test(text)) {
		return {
			mode: "chat",
			confidence: "high",
			score: 0,
			reason: "simple conversational message",
			suggestedRunGoal: summarizeGoal(text),
			taskType,
			uiSurface: "responding",
		};
	}

	const signals = collectSignals(input);
	const score = signals.reduce((total, signal) => total + signal.weight, 0);
	const confidence = score >= 5 ? "high" : score >= 3 ? "medium" : "low";
	const prefersDeepThinking =
		score >= 2.5 ||
		taskType === "reasoning" ||
		(taskType === "coding" && score >= 2) ||
		text.length > 140;
	const shouldUseAgent =
		score >= 4 ||
		(score >= 3 &&
			(taskType === "coding" || PROJECT_CONTEXT_REGEX.test(text))) ||
		(score >= 2.5 &&
			taskType === "coding" &&
			COMPLEX_ACTION_REGEX.test(text) &&
			PROJECT_CONTEXT_REGEX.test(text));

	return {
		mode: shouldUseAgent ? "agent" : "chat",
		confidence,
		score,
		reason:
			signals.map((signal) => signal.reason).join(", ") ||
			"no complex workflow signal",
		suggestedRunGoal: summarizeGoal(text),
		taskType,
		uiSurface: shouldUseAgent
			? "agent-active"
			: prefersDeepThinking
				? "deep-thinking"
				: "responding",
	};
}

export function isAgenticToolName(toolName: string) {
	return AGENTIC_TOOL_NAME_REGEX.test(toolName);
}
