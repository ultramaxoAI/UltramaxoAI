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
	/\b(next\.?js|react|vue|svelte|app router|typescript project|tailwind config|dashboard app|web app|aplikasi|admin panel|admin dashboard|fullstack|repo|repository|workspace|package\.json|npm|terminal|dependency|deploy|routing|api|database|db|flutter|react native|backend|frontend|component|route|endpoint|server|script|tool|tools|kode|code)\b/i;

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

	if (/\b(buat|bikin|buatkan|generate|kirim|tulis|bangun|develop|build|fix|debug|refactor|rapihin|implement)\b[\s\S]{0,60}\b(code|kode|script|tool|tools|app|aplikasi|website|web|component|komponen|api|backend|frontend)\b/i.test(text)) {
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
