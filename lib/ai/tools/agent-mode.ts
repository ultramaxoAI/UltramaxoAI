import { z } from "zod";

export const startAgentTask = () => {
	return {
		description:
			"Start an autonomous build session for Fullstack Web or Mobile Dev mode. Use this at the beginning to announce the goal and the execution plan.",
		inputSchema: z.object({
			mode: z
				.enum(["fullstack", "mobile"])
				.describe("Which IDE agent mode is currently active"),
			goal: z.string().min(1).describe("The user request being executed"),
			plan: z
				.array(z.string().min(1))
				.min(2)
				.max(8)
				.describe("A short checklist of major execution steps"),
			deliverable: z
				.string()
				.min(1)
				.describe("What will be delivered in the IDE artifact"),
		}),
		execute: ({
			mode,
			goal,
			plan,
			deliverable,
		}: {
			mode: "fullstack" | "mobile";
			goal: string;
			plan: string[];
			deliverable: string;
		}) => {
			return {
				mode,
				goal,
				plan,
				deliverable,
				startedAt: new Date().toISOString(),
			};
		},
	};
};

export const reportAgentStep = () => {
	return {
		description:
			"Report a concrete agent step while building the Fullstack Web or Mobile Dev project. Use this to show progress like creating files, adding packages, or launching preview.",
		inputSchema: z.object({
			title: z.string().min(1).describe("Short action title"),
			status: z
				.enum(["in_progress", "completed"])
				.describe("Current step state"),
			detail: z.string().min(1).describe("What the agent is doing or finished"),
			files: z
				.array(z.string().min(1))
				.optional()
				.describe("Files created or updated in this step"),
			packages: z
				.array(z.string().min(1))
				.optional()
				.describe("Packages needed for this step"),
			command: z
				.string()
				.optional()
				.describe("Virtual command or action label, for example npm install framer-motion"),
		}),
		execute: ({
			title,
			status,
			detail,
			files,
			packages,
			command,
		}: {
			title: string;
			status: "in_progress" | "completed";
			detail: string;
			files?: string[];
			packages?: string[];
			command?: string;
		}) => {
			return {
				title,
				status,
				detail,
				files: files ?? [],
				packages: packages ?? [],
				command: command ?? null,
				updatedAt: new Date().toISOString(),
			};
		},
	};
};