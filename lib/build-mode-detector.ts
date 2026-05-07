import { z } from "zod";

export const BuildModeDetectionInputSchema = z.object({
	message: z.string().default(""),
	recentContext: z.array(z.string()).default([]),
});

export type BuildModeDetectionInput = z.infer<
	typeof BuildModeDetectionInputSchema
>;

export type BuildModeDetection = {
	mode: "none" | "html-preview" | "workspace-app";
	confidence: "low" | "medium" | "high";
	reason: string;
};

const HTML_PREVIEW_REGEX =
	/\b(landing page|homepage|home page|portfolio|company profile|company website|promo page|marketing page|website|web page|halaman promo|halaman promosi|landingpage|landing|homepage modern)\b/i;

const WORKSPACE_APP_REGEX =
	/\b(next\.?js|react|app router|typescript project|tailwind config|dashboard app|web app|aplikasi|admin panel|admin dashboard|fullstack|repo|repository|workspace|package\.json|npm|terminal|dependency|deploy|routing|api|database|db)\b/i;

const HTML_ONLY_HINT_REGEX =
	/\b(html|css|javascript|vanilla js|plain html|single page|one pager|one-page|static page|static website)\b/i;

export function detectBuildMode(
	rawInput: BuildModeDetectionInput,
): BuildModeDetection {
	const input = BuildModeDetectionInputSchema.parse(rawInput);
	const text = `${input.recentContext.join(" ")} ${input.message}`.trim();

	if (!text) {
		return {
			mode: "none",
			confidence: "low",
			reason: "empty prompt",
		};
	}

	if (WORKSPACE_APP_REGEX.test(text) && !HTML_ONLY_HINT_REGEX.test(text)) {
		return {
			mode: "workspace-app",
			confidence: "high",
			reason: "explicit framework/app/workspace signal",
		};
	}

	if (HTML_ONLY_HINT_REGEX.test(text)) {
		return {
			mode: "html-preview",
			confidence: "high",
			reason: "explicit html/css/static page signal",
		};
	}

	if (HTML_PREVIEW_REGEX.test(text)) {
		return {
			mode: "html-preview",
			confidence: "medium",
			reason: "generic website/landing page request",
		};
	}

	return {
		mode: "none",
		confidence: "low",
		reason: "no specific artifact mode signal",
	};
}
