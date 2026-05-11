"use client";

import { ExternalLinkIcon } from "lucide-react";
import katex from "katex";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type MessageRendererProps = {
	content: string;
};

type MarkdownBlock =
	| { type: "text"; content: string }
	| { type: "code"; language: string; code: string };

type TokenKind = "kw" | "fn" | "str" | "cm" | "num" | "tp" | "plain";

type CodeToken = {
	kind: TokenKind;
	value: string;
};

const KEYWORDS = new Set([
	"as",
	"async",
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"default",
	"do",
	"else",
	"export",
	"extends",
	"for",
	"from",
	"function",
	"if",
	"import",
	"in",
	"interface",
	"let",
	"new",
	"of",
	"private",
	"protected",
	"public",
	"return",
	"satisfies",
	"static",
	"switch",
	"throw",
	"try",
	"type",
	"var",
	"void",
	"while",
	"yield",
]);

const TYPES = new Set([
	"AbortController",
	"Array",
	"Date",
	"Error",
	"Map",
	"Promise",
	"ReactNode",
	"Record",
	"RequestInit",
	"Response",
	"Set",
	"T",
	"boolean",
	"never",
	"number",
	"string",
	"unknown",
]);

const TOKEN_CLASS: Record<TokenKind, string> = {
	cm: "cm text-[#3d4a5c] italic",
	fn: "fn text-[#61afef]",
	kw: "kw text-[#c678dd]",
	num: "num text-[#d19a66]",
	plain: "text-[#8a8a8a]",
	str: "str text-[#98c379]",
	tp: "tp text-[#e5c07b]",
};

function stableKey(prefix: string, value: string, salt = 0) {
	let hash = salt;
	for (const char of value) {
		hash = (hash * 31 + char.charCodeAt(0)) | 0;
	}

	return `${prefix}-${salt}-${value.length}-${Math.abs(hash).toString(36)}`;
}

function parseMarkdown(content: string): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const textBuffer: string[] = [];
	const codeBuffer: string[] = [];
	let codeLanguage = "text";
	let inCodeBlock = false;

	const flushText = () => {
		if (textBuffer.length === 0) {
			return;
		}

		blocks.push({
			content: textBuffer.join("\n"),
			type: "text",
		});
		textBuffer.length = 0;
	};

	const flushCode = () => {
		blocks.push({
			code: codeBuffer.join("\n").replace(/\n$/, ""),
			language: codeLanguage,
			type: "code",
		});
		codeBuffer.length = 0;
		codeLanguage = "text";
		inCodeBlock = false;
	};

	for (const line of lines) {
		if (!inCodeBlock) {
			const openingFence = line.match(/^```([^\n`]*)\s*$/);
			if (openingFence) {
				flushText();
				codeLanguage = openingFence[1].trim() || "text";
				inCodeBlock = true;
				continue;
			}

			textBuffer.push(line);
			continue;
		}

		if (/^```\s*$/.test(line)) {
			flushCode();
			continue;
		}

		codeBuffer.push(line);
	}

	if (inCodeBlock) {
		flushCode();
	}

	flushText();

	return blocks;
}

function splitWithBreaks(text: string, keyPrefix: string) {
	const parts = text.split("\n");
	return parts.flatMap((part, partIndex) => {
		if (partIndex === parts.length - 1) {
			return [part];
		}

		const key = stableKey("br", `${keyPrefix}-${part}`, partIndex);
		return [part, <br key={key} />];
	});
}

function renderMath(value: string, displayMode: boolean) {
	try {
		return katex.renderToString(value, {
			displayMode,
			output: "html",
			throwOnError: false,
		});
	} catch {
		return value;
	}
}

function renderPlainTextWithLinks(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	// Match raw URLs in plain text
	const urlPattern = /https?:\/\/[^\s<>"'`\]\)]+/g;
	let lastIndex = 0;
	let urlMatch = urlPattern.exec(text);

	while (urlMatch !== null) {
		if (urlMatch.index > lastIndex) {
			nodes.push(
				...splitWithBreaks(
					text.slice(lastIndex, urlMatch.index),
					`${keyPrefix}-plain-${lastIndex}`,
				),
			);
		}

		// Clean trailing punctuation from URL
		let url = urlMatch[0].replace(/[.,;:!?)]+$/, "");
		// Remove trailing parenthesis if unbalanced
		const openParens = (url.match(/\(/g) || []).length;
		const closeParens = (url.match(/\)/g) || []).length;
		if (closeParens > openParens && url.endsWith(")")) {
			url = url.slice(0, -1);
		}

		let displayUrl: string;
		try {
			const parsed = new URL(url);
			// Show clean domain + short path
			const domain = parsed.hostname.replace(/^www\./, "");
			const path = parsed.pathname === "/" ? "" : parsed.pathname;
			const truncatedPath = path.length > 30 ? `${path.slice(0, 27)}...` : path;
			displayUrl = domain + truncatedPath;
		} catch {
			displayUrl = url.length > 45 ? `${url.slice(0, 42)}...` : url;
		}

		const key = stableKey("link", url, urlMatch.index);
		nodes.push(
			<a
				className="inline-flex items-center gap-1 text-[#60a5fa] underline decoration-[#60a5fa]/30 underline-offset-[3px] transition-all hover:text-[#93c5fd] hover:decoration-[#93c5fd]/50"
				href={url}
				key={key}
				rel="noopener noreferrer"
				target="_blank"
			>
				{displayUrl}
				<ExternalLinkIcon className="inline-block size-3 shrink-0 opacity-50" />
			</a>,
		);

		lastIndex = urlMatch.index + url.length;
		urlPattern.lastIndex = lastIndex;
		urlMatch = urlPattern.exec(text);
	}

	if (lastIndex < text.length) {
		nodes.push(
			...splitWithBreaks(
				text.slice(lastIndex),
				`${keyPrefix}-plain-${lastIndex}`,
			),
		);
	}

	return nodes;
}

function renderInlineMarkdown(text: string, keyPrefix: string) {
	const nodes: ReactNode[] = [];
	// Match: inline code, math, bold, markdown links [text](url), and raw URLs
	const pattern = /(`[^`]+`|\$[^$\n]+\$|\*\*[\s\S]+?\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|https?:\/\/[^\s<>"'`\]\)]+)/g;
	let lastIndex = 0;
	let match = pattern.exec(text);

	while (match !== null) {
		if (match.index > lastIndex) {
			nodes.push(
				...splitWithBreaks(
					text.slice(lastIndex, match.index),
					`${keyPrefix}-text-${lastIndex}`,
				),
			);
		}

		const token = match[0];

		// Markdown link [text](url)
		if (match[2] && match[3]) {
			const linkText = match[2];
			const linkUrl = match[3];
			const key = stableKey("md-link", linkUrl, match.index);
			nodes.push(
				<a
					className="inline-flex items-center gap-1 text-[#60a5fa] underline decoration-[#60a5fa]/30 underline-offset-[3px] transition-all hover:text-[#93c5fd] hover:decoration-[#93c5fd]/50"
					href={linkUrl}
					key={key}
					rel="noopener noreferrer"
					target="_blank"
				>
					{linkText}
					<ExternalLinkIcon className="inline-block size-3 shrink-0 opacity-50" />
				</a>,
			);
		}
		// Raw URL
		else if (token.startsWith("http")) {
			// Clean trailing punctuation from URL
			let url = token.replace(/[.,;:!?)]+$/, "");
			const openParens = (url.match(/\(/g) || []).length;
			const closeParens = (url.match(/\)/g) || []).length;
			if (closeParens > openParens && url.endsWith(")")) {
				url = url.slice(0, -1);
			}

			let displayUrl: string;
			try {
				const parsed = new URL(url);
				const domain = parsed.hostname.replace(/^www\./, "");
				const path = parsed.pathname === "/" ? "" : parsed.pathname;
				const truncatedPath = path.length > 30 ? `${path.slice(0, 27)}...` : path;
				displayUrl = domain + truncatedPath;
			} catch {
				displayUrl = url.length > 45 ? `${url.slice(0, 42)}...` : url;
			}

			const key = stableKey("link", url, match.index);
			nodes.push(
				<a
					className="inline-flex items-center gap-1 text-[#60a5fa] underline decoration-[#60a5fa]/30 underline-offset-[3px] transition-all hover:text-[#93c5fd] hover:decoration-[#93c5fd]/50"
					href={url}
					key={key}
					rel="noopener noreferrer"
					target="_blank"
				>
					{displayUrl}
					<ExternalLinkIcon className="inline-block size-3 shrink-0 opacity-50" />
				</a>,
			);

			// Adjust lastIndex if we trimmed the URL
			if (url.length < token.length) {
				lastIndex = match.index + url.length;
				pattern.lastIndex = lastIndex;
				match = pattern.exec(text);
				continue;
			}
		}
		// Inline code
		else if (token.startsWith("`")) {
			const key = stableKey("inline-code", token, match.index);
			nodes.push(
				<code
					className="rounded-md border border-[#1e1e1e] bg-[#161616] px-1.5 py-0.5 font-mono text-[12px] text-[#98c379]"
					key={key}
				>
					{token.slice(1, -1)}
				</code>,
			);
		}
		// Math
		else if (token.startsWith("$")) {
			const key = stableKey("math", token, match.index);
			nodes.push(
				<span
					className="text-white/75"
					dangerouslySetInnerHTML={{
						__html: renderMath(token.slice(1, -1), false),
					}}
					key={key}
				/>,
			);
		}
		// Bold
		else {
			const key = stableKey("bold", token, match.index);
			nodes.push(
				<strong className="font-semibold text-white" key={key}>
					{token.slice(2, -2)}
				</strong>,
			);
		}

		lastIndex = pattern.lastIndex;
		match = pattern.exec(text);
	}

	if (lastIndex < text.length) {
		nodes.push(
			...splitWithBreaks(
				text.slice(lastIndex),
				`${keyPrefix}-text-${lastIndex}`,
			),
		);
	}

	return nodes;
}

function getStringToken(line: string) {
	const quote = line[0];
	if (!(quote === "'" || quote === '"' || quote === "`")) {
		return "";
	}

	let escaped = false;
	for (let index = 1; index < line.length; index += 1) {
		const char = line[index];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (char === quote) {
			return line.slice(0, index + 1);
		}
	}

	return line;
}

function tokenizeCodeLine(line: string, language: string): CodeToken[] {
	const tokens: CodeToken[] = [];
	const supportsHashComments = /^(py|python|bash|sh|shell|zsh|yaml|yml)$/i.test(
		language,
	);
	let index = 0;

	while (index < line.length) {
		const rest = line.slice(index);
		const blockComment = rest.match(/^\/\*.*?\*\//);
		const slashComment = rest.match(/^\/\/.*$/);
		const hashComment = supportsHashComments ? rest.match(/^#.*$/) : null;
		const stringToken = getStringToken(rest);
		const numberToken = rest.match(/^\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)\b/);
		const wordToken = rest.match(/^[A-Za-z_$][\w$]*/);

		if (blockComment) {
			tokens.push({ kind: "cm", value: blockComment[0] });
			index += blockComment[0].length;
			continue;
		}

		if (slashComment || hashComment) {
			const comment = slashComment?.[0] ?? hashComment?.[0] ?? "";
			tokens.push({ kind: "cm", value: comment });
			index += comment.length;
			continue;
		}

		if (stringToken) {
			tokens.push({ kind: "str", value: stringToken });
			index += stringToken.length;
			continue;
		}

		if (numberToken) {
			tokens.push({ kind: "num", value: numberToken[0] });
			index += numberToken[0].length;
			continue;
		}

		if (wordToken) {
			const word = wordToken[0];
			const afterWord = rest.slice(word.length);
			const kind = KEYWORDS.has(word)
				? "kw"
				: TYPES.has(word)
					? "tp"
					: /^\s*\(/.test(afterWord)
						? "fn"
						: "plain";

			tokens.push({ kind, value: word });
			index += word.length;
			continue;
		}

		tokens.push({ kind: "plain", value: line[index] });
		index += 1;
	}

	return tokens;
}

function renderHighlightedCode(code: string, language: string) {
	return code.split("\n").map((line, lineIndex) => {
		let charOffset = 0;
		const tokens = tokenizeCodeLine(line, language).map((token, tokenIndex) => {
			const tokenOffset = charOffset;
			charOffset += token.value.length;

			return {
				key: stableKey(
					"token",
					`${lineIndex}:${tokenOffset}:${token.kind}:${token.value}`,
					tokenIndex,
				),
				token,
			};
		});

		return (
			<span
				className="block min-h-[1.65em]"
				key={stableKey("line", `${lineIndex}:${line}`, lineIndex)}
			>
				{tokens.map(({ key: tokenKey, token }) => (
					<span className={TOKEN_CLASS[token.kind]} key={tokenKey}>
						{token.value}
					</span>
				))}
			</span>
		);
	});
}

function CodeBlock({ code, language }: { code: string; language: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div className="my-4 overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#0d0d0d]">
			<div className="flex items-center justify-between border-[#1e1e1e] border-b bg-[#111] px-3.5 py-2">
				<span className="font-mono text-[11px] text-[#666] lowercase tracking-[0.08em]">
					{language}
				</span>
				<button
					className="rounded-lg border border-[#242424] bg-[#151515] px-2.5 py-1 font-mono text-[11px] text-[#777] transition-colors hover:border-[#2f3f54] hover:text-[#9bc7ff]"
					onClick={handleCopy}
					type="button"
				>
					{copied ? "copied!" : "copy"}
				</button>
			</div>
			<pre className="overflow-x-auto bg-[#0d0d0d] p-4 text-[12.5px] leading-[1.65] [scrollbar-color:#1e1e1e_transparent]">
				<code className="font-mono">
					{renderHighlightedCode(code, language)}
				</code>
			</pre>
		</div>
	);
}

function parseTable(section: string) {
	const lines = section.split("\n").map((line) => line.trim());
	if (lines.length < 2 || !lines.every((line) => /^\|.+\|$/.test(line))) {
		return null;
	}

	if (!/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[1])) {
		return null;
	}

	return lines
		.filter((_, index) => index !== 1)
		.map((line) =>
			line
				.replace(/^\|/, "")
				.replace(/\|$/, "")
				.split("|")
				.map((cell) => cell.trim()),
		);
}

function TextBlock({ block, blockKey }: { block: string; blockKey: string }) {
	const normalized = block.replace(/\r\n/g, "\n").trim();
	if (!normalized) {
		return null;
	}

	const sections = normalized.split(/\n{2,}/).filter(Boolean);
	const keyedSections = sections.map((section, sectionIndex) => ({
		key: stableKey("section", `${blockKey}-${section}`, sectionIndex),
		section,
	}));

	return (
		<>
			{keyedSections.map(({ key, section }) => {
				const lines = section.split("\n");
				const unordered = lines.every((line) => /^\s*[-*]\s+/.test(line));
				const ordered = lines.every((line) => /^\s*\d+[.)]\s+/.test(line));
				const heading = section.match(/^(#{1,3})\s+(.+)$/);
				const displayMath = section.match(/^\$\$([\s\S]+)\$\$$/);
				const tableRows = parseTable(section);

				if (displayMath) {
					return (
						<div
							className="my-4 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-white/75"
							dangerouslySetInnerHTML={{
								__html: renderMath(displayMath[1].trim(), true),
							}}
							key={key}
						/>
					);
				}

				if (tableRows) {
					const [header, ...bodyRows] = tableRows;
					return (
						<div
							className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.025]"
							key={key}
						>
							<table className="w-full min-w-[420px] border-collapse text-left text-[13px]">
								<thead className="border-white/[0.08] border-b bg-white/[0.04] text-white/70">
									<tr>
										{header.map((cell, index) => (
											<th className="px-3 py-2 font-medium" key={stableKey("th", cell, index)}>
												{renderInlineMarkdown(cell, `${key}-th-${index}`)}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-white/[0.06] text-[#8f8f8f]">
									{bodyRows.map((row, rowIndex) => (
										<tr className="transition-colors hover:bg-white/[0.025]" key={stableKey("tr", row.join("|"), rowIndex)}>
											{row.map((cell, cellIndex) => (
												<td className="px-3 py-2 align-top" key={stableKey("td", cell, cellIndex)}>
													{renderInlineMarkdown(cell, `${key}-td-${rowIndex}-${cellIndex}`)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					);
				}

				if (heading) {
					return (
						<h3
							className="mb-2 mt-5 text-[17px] font-semibold text-white md:text-[18px]"
							key={key}
						>
							{renderInlineMarkdown(heading[2], `heading-${key}`)}
						</h3>
					);
				}

				if (unordered || ordered) {
					const ListTag = unordered ? "ul" : "ol";
					const keyedLines = lines.map((line, lineIndex) => ({
						key: stableKey("li", `${key}-${line}`, lineIndex),
						line,
					}));

					return (
						<ListTag
							className={`mb-4 pl-5 text-[16px] leading-[1.78] text-white/90 md:text-[17px] ${
								unordered ? "list-disc" : "list-decimal"
							}`}
							key={key}
						>
							{keyedLines.map(({ key: lineKey, line }) => (
								<li className="pl-1" key={lineKey}>
									{renderInlineMarkdown(
										line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""),
										`li-${lineKey}`,
									)}
								</li>
							))}
						</ListTag>
					);
				}

				return (
					<p
						className="mb-4 text-[16px] text-white/90 leading-[1.78] last:mb-0 md:text-[17px]"
						key={key}
					>
						{renderInlineMarkdown(section, `p-${key}`)}
					</p>
				);
			})}
		</>
	);
}

export function MessageRenderer({ content }: MessageRendererProps) {
	const blocks = useMemo(() => parseMarkdown(content), [content]);
	const keyedBlocks = blocks.map((block, blockIndex) => ({
		block,
		key: stableKey(
			"block",
			block.type === "code" ? `${block.language}-${block.code}` : block.content,
			blockIndex,
		),
	}));

	return (
		<div
			className="w-full font-sans text-white/90"
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
			}}
		>
			{keyedBlocks.map(({ block, key }) =>
				block.type === "code" ? (
					<CodeBlock code={block.code} key={key} language={block.language} />
				) : (
					<TextBlock block={block.content} blockKey={key} key={key} />
				),
			)}
		</div>
	);
}
