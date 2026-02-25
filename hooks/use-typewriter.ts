"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Typewriter hook: gradually reveals text character by character.
 * - When streaming (isStreaming=true), shows text instantly (realtime)
 * - When streaming stops, applies a fast typewriter reveal on new chunks
 * @param fullText - The complete text to display
 * @param isStreaming - Whether the AI is still generating
 * @param charsPerFrame - Characters revealed per animation frame (higher = faster)
 */
export function useTypewriter(
	fullText: string,
	isStreaming: boolean,
	charsPerFrame = 6,
) {
	const [displayedText, setDisplayedText] = useState(fullText);
	const prevTextRef = useRef(fullText);
	const rafRef = useRef<number | null>(null);
	const posRef = useRef(fullText.length);

	useEffect(() => {
		// Cancel any ongoing animation
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}

		// While AI is streaming in realtime, just show full text immediately
		if (isStreaming) {
			setDisplayedText(fullText);
			prevTextRef.current = fullText;
			posRef.current = fullText.length;
			return;
		}

		const prevText = prevTextRef.current;

		// If text is getting shorter (e.g. edit), show immediately
		if (fullText.length <= prevText.length) {
			setDisplayedText(fullText);
			prevTextRef.current = fullText;
			posRef.current = fullText.length;
			return;
		}

		// New text added after streaming — animate reveal from where we were
		const startPos = prevText.length;
		posRef.current = startPos;
		prevTextRef.current = fullText;

		const animate = () => {
			posRef.current = Math.min(
				posRef.current + charsPerFrame,
				fullText.length,
			);
			setDisplayedText(fullText.slice(0, posRef.current));

			if (posRef.current < fullText.length) {
				rafRef.current = requestAnimationFrame(animate);
			} else {
				rafRef.current = null;
			}
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [fullText, isStreaming, charsPerFrame]);

	return displayedText;
}
