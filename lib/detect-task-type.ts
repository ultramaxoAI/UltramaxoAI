export type TaskType = "reasoning" | "math" | "coding" | "writing" | "general";

export function detectTaskType(message: string): TaskType {
	const lower = message.toLowerCase();

	if (
		/\d+[+\-*/^]|\bhitung\b|\bberapa\b|\bsolve\b|\bintegral\b|\bderivat|\bmatematika\b/.test(
			lower,
		)
	) {
		return "math";
	}

	if (
		/\bcode\b|\bkode\b|\bprogram\b|\bfunction\b|\bdebug\b|\bfungsi\b|\bscript\b|\bapi\b|\bcomponent\b|\bkomponen\b|\breact\b|\bnext\.?js\b|\btypescript\b|\bjavascript\b|\blanding page\b|\bwebsite\b|\bweb\b|\bapp\b|\baplikasi\b|\bsaas\b|\bdashboard\b|\bfrontend\b|\bui\b|\bux\b/.test(
			lower,
		)
	) {
		return "coding";
	}

	if (
		/\btulis\b|\bemail\b|\bartikel\b|\bessay\b|\bparagraf\b|\bmarketing\b|\bcopy\b|\bkonten\b|\bcaption\b|\bheadline\b/.test(
			lower,
		)
	) {
		return "writing";
	}

	if (
		/\banalisis\b|\banalisa\b|\balasan\b|\bmengapa\b|\bstrategi\b|\brencana\b|\bpikir\b|\bjelaskan\b|\bargumen\b|\bbandingkan\b|\brekomendasi\b/.test(
			lower,
		)
	) {
		return "reasoning";
	}

	return "general";
}
