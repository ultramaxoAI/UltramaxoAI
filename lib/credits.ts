export const CREDIT_COSTS = {
	chatBase: 1,
	webSearch: 1,
	deepThinking: 2,
	fullstackMode: 4,
	mobileMode: 3,
	imageGeneration: 6,
	agentExecution: 12,
} as const;

export const FREE_CREDIT_ALLOWANCE = 10;
export const PRO_CREDIT_ALLOWANCE = 120;
export const FREE_CREDIT_RESET_DAYS = 2;
export const PRO_CREDIT_RESET_DAYS = 1;

export function getChatCreditCost({
	deepThinkingEnabled,
	webSearchEnabled,
	fullstackModeEnabled,
	mobileModeEnabled,
}: {
	deepThinkingEnabled?: boolean;
	webSearchEnabled?: boolean;
	fullstackModeEnabled?: boolean;
	mobileModeEnabled?: boolean;
}) {
	let total = CREDIT_COSTS.chatBase;

	if (webSearchEnabled) total += CREDIT_COSTS.webSearch;
	if (deepThinkingEnabled) total += CREDIT_COSTS.deepThinking;
	if (fullstackModeEnabled) total += CREDIT_COSTS.fullstackMode;
	if (mobileModeEnabled) total += CREDIT_COSTS.mobileMode;

	return total;
}

export function getStartingCredits({
	isPro,
	role,
}: {
	isPro?: boolean;
	role?: string | null;
}) {
	if (role === "admin") {
		return 999999;
	}

	return isPro ? PRO_CREDIT_ALLOWANCE : FREE_CREDIT_ALLOWANCE;
}

export function getCreditResetWindowDays({
	isPro,
	role,
}: {
	isPro?: boolean;
	role?: string | null;
}) {
	if (role === "admin") {
		return 36500;
	}

	return isPro ? PRO_CREDIT_RESET_DAYS : FREE_CREDIT_RESET_DAYS;
}

export function getCreditLabel(amount: number) {
	return `${amount} credit${amount === 1 ? "" : "s"}`;
}
