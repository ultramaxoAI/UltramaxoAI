export type ParsedCodeBlock = {
	language: string;
	code: string;
};

export type ParsedResponse = {
	explanation: string;
	blocks: ParsedCodeBlock[];
};

const CODE_BLOCK_REGEX = /```(\w+)?\s*\n([\s\S]*?)```/g;

/**
 * parseResponse(content)
 * - mengekstrak semua code block ```lang ... ```
 * - mengembalikan list blok kode + teks penjelasan tanpa kode
 */
export function parseResponse(content: string): ParsedResponse {
	const blocks: ParsedCodeBlock[] = [];
	const explanationParts: string[] = [];

	// Safety: skip parsing if content is absurdly large
	if (content.length > 200_000) {
		return { explanation: content, blocks: [] };
	}

	// IMPORTANT: Reset lastIndex to avoid stale state from previous calls
	CODE_BLOCK_REGEX.lastIndex = 0;

	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let safety = 0;
	const MAX_ITERATIONS = 500;

	while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
		if (++safety > MAX_ITERATIONS) break; // Prevent infinite loops

		const [fullMatch, langRaw, codeRaw] = match;

		// teks sebelum blok kode dianggap bagian dari penjelasan
		if (match.index > lastIndex) {
			explanationParts.push(content.slice(lastIndex, match.index));
		}

		blocks.push({
			language: (langRaw || "").toLowerCase(),
			code: (codeRaw || "").trim(),
		});

		lastIndex = match.index + fullMatch.length;
	}

	if (lastIndex < content.length) {
		explanationParts.push(content.slice(lastIndex));
	}

	const explanation = explanationParts.join("").trim();

	return { explanation, blocks };
}
