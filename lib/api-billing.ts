export function estimateTokens(text: string) {
	if (!text) return 0;
	return Math.max(1, Math.ceil(text.length / 4));
}

export function calculateCostCents({
	priceIn,
	priceOut,
	promptTokens,
	completionTokens,
}: {
	priceIn: number | null;
	priceOut: number | null;
	promptTokens: number;
	completionTokens: number;
}) {
	const inputCost = priceIn ? (promptTokens / 1_000_000) * priceIn : 0;
	const outputCost = priceOut ? (completionTokens / 1_000_000) * priceOut : 0;
	const totalUsd = inputCost + outputCost;
	return Math.max(0, Math.ceil(totalUsd * 100));
}
