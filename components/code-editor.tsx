"use client";

import type { Suggestion } from "@backend/db/schema";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { memo, useEffect, useRef } from "react";

export type SupportedLanguage =
	| "javascript"
	| "typescript"
	| "python"
	| "html"
	| "css"
	| "json"
	| "markdown"
	| "jsx"
	| "tsx"
	| "java"
	| "cpp"
	| "c"
	| "rust"
	| "go"
	| "php"
	| "ruby"
	| "swift"
	| "kotlin"
	| "text";

function isNearBottom(element: HTMLElement, threshold = 48) {
	return (
		element.scrollHeight - (element.scrollTop + element.clientHeight) <= threshold
	);
}

type EditorProps = {
	content: string;
	onSaveContent: (updatedContent: string, debounce: boolean) => void;
	status: "streaming" | "idle";
	isCurrentVersion: boolean;
	currentVersionIndex: number;
	suggestions: Suggestion[];
	language?: SupportedLanguage;
};

// Language detection helper
function detectLanguage(code: string): SupportedLanguage {
	const lowerCode = code.toLowerCase();

	// Python
	if (
		/^(import|from|def|class|if __name__|print\(|async def)/m.test(code) ||
		lowerCode.includes("import numpy") ||
		lowerCode.includes("import pandas")
	) {
		return "python";
	}

	// JavaScript/TypeScript
	if (
		/^(const|let|var|import|export|function|class|async|await)/m.test(code) ||
		code.includes("console.log") ||
		code.includes("=>")
	) {
		if (
			code.includes(": string") ||
			code.includes(": number") ||
			code.includes("interface ")
		) {
			return "typescript";
		}
		return "javascript";
	}

	// HTML
	if (/<html|<div|<body|<head|<!DOCTYPE/i.test(code)) {
		return "html";
	}

	// CSS
	if (
		/\{[\s\S]*:[^:]+;[\s\S]*\}/.test(code) &&
		/@media|\.class|#id/.test(code)
	) {
		return "css";
	}

	// JSON
	if (/^\s*[[{]/.test(code) && /[\]}]\s*$/.test(code)) {
		try {
			JSON.parse(code);
			return "json";
		} catch {
			// Not JSON
		}
	}

	// Java
	if (/public class|public static void main|import java\./m.test(code)) {
		return "java";
	}

	// C/C++
	if (/#include|int main\(|std::|cout|cin/.test(code)) {
		return "cpp";
	}

	// Rust
	if (/fn main\(|let mut|pub fn|use std::/m.test(code)) {
		return "rust";
	}

	// Go
	if (/^package|func main\(|import \(|fmt\.Print/m.test(code)) {
		return "go";
	}

	// PHP
	if (/^<\?php|^\$[a-zA-Z_]/m.test(code)) {
		return "php";
	}

	// Ruby
	if (/^(require|class|def|end|puts)/m.test(code)) {
		return "ruby";
	}

	return "text";
}

// Get appropriate language extension
async function getLanguageExtension(language: SupportedLanguage) {
	switch (language) {
		case "javascript":
		case "jsx":
			return javascript({ jsx: true });
		case "typescript":
		case "tsx":
			return javascript({ jsx: true, typescript: true });
		case "python":
			return python();
		default:
			return javascript(); // Fallback to javascript for syntax highlighting
	}
}

function PureCodeEditor({
	content,
	onSaveContent,
	status,
	language: providedLanguage,
}: EditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<EditorView | null>(null);
	const languageCompartmentRef = useRef<Compartment | null>(null);
	const onSaveContentRef = useRef(onSaveContent);
	const detectedLanguage = providedLanguage || detectLanguage(content);

	useEffect(() => {
		onSaveContentRef.current = onSaveContent;
	}, [onSaveContent]);

	useEffect(() => {
		if (containerRef.current && !editorRef.current) {
			const languageCompartment = new Compartment();
			languageCompartmentRef.current = languageCompartment;

			(async () => {
				const langExtension = await getLanguageExtension(detectedLanguage);

				// Custom theme to handle responsive scrolling behavior inside CodeMirror
				const editorTheme = EditorView.theme({
					"&": { height: "100%" },
					".cm-scroller": { overflowY: "auto", overflowX: "auto" },
				});

				const startState = EditorState.create({
					doc: content,
					extensions: [
						basicSetup,
						languageCompartment.of(langExtension),
						EditorView.updateListener.of((update) => {
							if (update.docChanged) {
								const transaction = update.transactions.find(
									(tr) => !tr.annotation(Transaction.remote),
								);

								if (transaction) {
									const newContent = update.state.doc.toString();
									onSaveContentRef.current(newContent, true);
								}
							}
						}),
						oneDark,
						editorTheme,
					],
				});

				editorRef.current = new EditorView({
					state: startState,
					parent: containerRef.current!,
				});
			})();
		}

		return () => {
			if (editorRef.current) {
				editorRef.current.destroy();
				editorRef.current = null;
			}
		};
		// Create the editor only once; content and language are updated by dedicated effects.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content, detectedLanguage]);

	useEffect(() => {
		const view = editorRef.current;
		const languageCompartment = languageCompartmentRef.current;
		if (!view || !languageCompartment) {
			return;
		}

		(async () => {
			const langExtension = await getLanguageExtension(detectedLanguage);
			view.dispatch({
				effects: languageCompartment.reconfigure(langExtension),
			});
		})();
	}, [detectedLanguage]);

	useEffect(() => {
		if (editorRef.current) {
			const currentContent = editorRef.current.state.doc.toString();

			if (status === "streaming" || currentContent !== content) {
				const scroller = editorRef.current.scrollDOM;
				const shouldAutoFollow = isNearBottom(scroller);
				const previousScrollTop = scroller.scrollTop;

				const transaction = editorRef.current.state.update({
					changes: {
						from: 0,
						to: currentContent.length,
						insert: content,
					},
					annotations: [Transaction.remote.of(true)],
				});

				editorRef.current.dispatch(transaction);

				requestAnimationFrame(() => {
					if (!editorRef.current) {
						return;
					}

					const nextScroller = editorRef.current.scrollDOM;
					if (shouldAutoFollow) {
						nextScroller.scrollTop = nextScroller.scrollHeight;
						return;
					}

					nextScroller.scrollTop = previousScrollTop;
				});
			}
		}
	}, [content, status]);

	return (
		<div className="relative w-full h-full">
			{/* Language indicator */}
			<div className="absolute top-2 right-2 z-10 rounded-md bg-zinc-800 px-2 py-1 text-xs font-mono text-zinc-300">
				{detectedLanguage.toUpperCase()}
			</div>
			<div
				className="not-prose relative w-full h-full text-sm"
				ref={containerRef}
			/>
		</div>
	);
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
	if (prevProps.suggestions !== nextProps.suggestions) {
		return false;
	}
	if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
		return false;
	}
	if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
		return false;
	}
	if (prevProps.status === "streaming" && nextProps.status === "streaming") {
		return false;
	}
	if (prevProps.content !== nextProps.content) {
		return false;
	}

	return true;
}

export const CodeEditor = memo(PureCodeEditor, areEqual);
