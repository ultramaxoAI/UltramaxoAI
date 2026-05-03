import type { AgentThinkingStep } from "@/components/agent-thinking-panel";

function parseArgs(args?: string) {
	if (!args) return {};
	const trimmed = args.trim().replace(/^\(/, "").replace(/\)$/, "");

	try {
		return JSON.parse(trimmed) as Record<string, unknown>;
	} catch {
		return {};
	}
}

function getString(value: unknown) {
	return typeof value === "string" && value.trim() ? value : "";
}

function getStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

export function formatToolCallForUser(step: AgentThinkingStep): string {
	const args = parseArgs(step.args);

	switch (step.label) {
		case "create_file":
		case "createFile":
		case "createCodeFile":
			return `Membuat file ${getString(args.path) || "baru"}`;
		case "edit_file":
		case "editFile":
		case "updateCodeFile":
			return `Mengedit file ${getString(args.path) || "workspace"}`;
		case "create_folder":
		case "createFolder":
			return `Membuat folder ${getString(args.path) || "baru"}`;
		case "run_command":
		case "runCommand":
		case "executeTerminalCommand":
			return `Menjalankan: ${getString(args.command) || step.label}`;
		case "install_package":
		case "installPackage": {
			const packages = getStringArray(args.packages);
			return `Menginstall: ${packages.length ? packages.join(", ") : "package"}`;
		}
		case "read_file":
		case "readFile":
			return `Membaca file ${getString(args.path) || "workspace"}`;
		case "list_files":
		case "listFiles":
		case "listCodeFiles":
			return `Melihat isi ${getString(args.path) || "workspace"}`;
		default:
			return step.label;
	}
}
