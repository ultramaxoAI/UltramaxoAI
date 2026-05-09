"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const STREAM_INTERVAL_MS = 22;
const PARAGRAPH_PAUSE_MS = 250;

type ReasoningStreamProps = {
	chunks: string[];
	showCursor: boolean;
	onCompleteChange?: (isComplete: boolean) => void;
};

function splitStrongTags(value: string) {
	const parts: string[] = [];
	const pattern = /<strong>[\s\S]*?<\/strong>/gi;
	let lastIndex = 0;
	let match = pattern.exec(value);

	while (match) {
		if (match.index > lastIndex) {
			parts.push(value.slice(lastIndex, match.index));
		}

		parts.push(match[0]);
		lastIndex = pattern.lastIndex;
		match = pattern.exec(value);
	}

	if (lastIndex < value.length) {
		parts.push(value.slice(lastIndex));
	}

	return parts.filter((part) => part.length > 0);
}

function normalizeChunks(chunks: string[]) {
	const cleaned = chunks
		.flatMap(splitStrongTags)
		.filter((chunk) => chunk.length > 0);
	return cleaned;
}

function isHtmlChunk(chunk: string) {
	return /^<strong>[\s\S]*<\/strong>$/i.test(chunk.trim());
}

function locateChunkAtOffset(chunks: string[], offset: number) {
	let cursor = offset;

	for (const chunk of chunks) {
		if (cursor < chunk.length) {
			return { chunk, offset: cursor };
		}

		cursor -= chunk.length;
	}

	return null;
}

function renderReasoningNodes(value: string) {
	const nodes: ReactNode[] = [];
	const pattern = /<strong>([\s\S]*?)<\/strong>/gi;
	let lastIndex = 0;
	let match = pattern.exec(value);

	while (match) {
		if (match.index > lastIndex) {
			nodes.push(value.slice(lastIndex, match.index));
		}

		nodes.push(
			<strong
				className="text-white/40 not-italic"
				key={`strong-${match.index}`}
			>
				{match[1]}
			</strong>,
		);
		lastIndex = pattern.lastIndex;
		match = pattern.exec(value);
	}

	if (lastIndex < value.length) {
		nodes.push(value.slice(lastIndex));
	}

	return nodes;
}

export function ReasoningStream({
	chunks,
	showCursor,
	onCompleteChange,
}: ReasoningStreamProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const normalizedChunks = useMemo(() => normalizeChunks(chunks), [chunks]);
	const target = useMemo(() => normalizedChunks.join(""), [normalizedChunks]);
	const [rendered, setRendered] = useState("");
	const isComplete = target.length > 0 && rendered === target;
	const renderedNodes = useMemo(
		() => renderReasoningNodes(rendered),
		[rendered],
	);

	useEffect(() => {
		if (!target.startsWith(rendered)) {
			setRendered("");
		}
	}, [rendered, target]);

	useEffect(() => {
		onCompleteChange?.(isComplete);
	}, [isComplete, onCompleteChange]);

	useEffect(() => {
		if (!scrollRef.current) {
			return;
		}

		scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [rendered]);

	useEffect(() => {
		if (!target || rendered === target || !target.startsWith(rendered)) {
			return;
		}

		const delay = rendered.endsWith("\n\n")
			? PARAGRAPH_PAUSE_MS
			: STREAM_INTERVAL_MS;
		const timeout = window.setTimeout(() => {
			const next = locateChunkAtOffset(normalizedChunks, rendered.length);

			if (!next) {
				return;
			}

			if (next.offset === 0 && isHtmlChunk(next.chunk)) {
				setRendered((current) => current + next.chunk);
				return;
			}

			setRendered((current) => current + next.chunk[next.offset]);
		}, delay);

		return () => window.clearTimeout(timeout);
	}, [normalizedChunks, rendered, target]);

	return (
		<div
			className="reasoning-stream-scroll max-h-[180px] overflow-y-auto px-0 py-0"
			ref={scrollRef}
		>
			<div className="reasoning-stream-text whitespace-pre-wrap break-words text-[11.5px] text-white/22 italic leading-[1.8]">
				{renderedNodes}
				{showCursor ? (
					<span className="reasoning-stream-cursor ml-px inline-block h-[11px] w-[1.5px] rounded-[1px] bg-white/40 align-[-1px] opacity-80" />
				) : null}
			</div>

			<style jsx>{`
				.reasoning-stream-scroll {
					scrollbar-width: none;
				}

				.reasoning-stream-scroll::-webkit-scrollbar {
					display: none;
				}

				.reasoning-stream-cursor {
					animation: reasoning-cursor-blink 0.85s ease-in-out infinite;
				}

				@keyframes reasoning-cursor-blink {
					0%,
					100% {
						opacity: 0.8;
					}
					50% {
						opacity: 0;
					}
				}
			`}</style>
		</div>
	);
}
