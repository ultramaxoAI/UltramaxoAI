import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculateCostCents, estimateTokens } from "../../lib/api-billing";

describe("api billing helpers", () => {
	test("estimateTokens returns minimum 1 for non-empty text", () => {
		assert.equal(estimateTokens("hello"), 2);
	});

	test("estimateTokens returns 0 for empty string", () => {
		assert.equal(estimateTokens(""), 0);
	});

	test("estimateTokens estimates roughly chars/4", () => {
		const text = "a".repeat(100);
		assert.equal(estimateTokens(text), 25);
	});

	test("calculateCostCents uses per 1M token pricing", () => {
		const cents = calculateCostCents({
			priceIn: 1.0,
			priceOut: 2.0,
			promptTokens: 1_000_000,
			completionTokens: 500_000,
		});
		// 1M * $1/1M = $1 input + 500K * $2/1M = $1 output = $2 total = 200 cents
		assert.equal(cents, 200);
	});

	test("calculateCostCents returns 0 when prices are null (free model)", () => {
		const cents = calculateCostCents({
			priceIn: null,
			priceOut: null,
			promptTokens: 1_000_000,
			completionTokens: 500_000,
		});
		assert.equal(cents, 0);
	});

	test("calculateCostCents rounds up to nearest cent", () => {
		const cents = calculateCostCents({
			priceIn: 0.5,
			priceOut: 1.5,
			promptTokens: 100,
			completionTokens: 200,
		});
		// (100 / 1M) * 0.5 + (200 / 1M) * 1.5 = 0.00005 + 0.0003 = 0.00035 USD = 0.035 cents → ceil = 1 cent
		assert.equal(cents, 1);
	});

	test("calculateCostCents handles zero tokens", () => {
		const cents = calculateCostCents({
			priceIn: 10.0,
			priceOut: 30.0,
			promptTokens: 0,
			completionTokens: 0,
		});
		assert.equal(cents, 0);
	});

	test("calculateCostCents with only input price", () => {
		const cents = calculateCostCents({
			priceIn: 5.0,
			priceOut: null,
			promptTokens: 200_000,
			completionTokens: 100_000,
		});
		// (200K / 1M) * 5 = $1 = 100 cents
		assert.equal(cents, 100);
	});

	test("calculateCostCents with only output price", () => {
		const cents = calculateCostCents({
			priceIn: null,
			priceOut: 15.0,
			promptTokens: 100_000,
			completionTokens: 100_000,
		});
		// (100K / 1M) * 15 = $1.50 = 150 cents
		assert.equal(cents, 150);
	});
});
