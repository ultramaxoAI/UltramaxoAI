"use client";

import type { ComponentProps } from "react";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

type ResponseProps = ComponentProps<typeof Streamdown>;

export function Response({
	className,
	children,
	isLoading,
	...props
}: ResponseProps & { isLoading?: boolean }) {
	return (
		<Streamdown
			className={cn(
				"size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				// Grok-like typography styling
				"text-sm leading-[1.65] md:text-[15px] md:leading-relaxed",
				"tracking-[-0.01em] text-zinc-900 dark:text-zinc-100", // Clean, bright text
				"[&_p]:my-4",
				"[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_ul]:my-1",
				"[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_ol]:my-1",
				"[&_li]:mt-1.5 [&_li]:pl-1",
				"[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100",
				"[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100",
				"[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100",
				"[&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-zinc-900 dark:[&_h4]:text-zinc-100",
				"[&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-white",
				"[&_a]:text-blue-500 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-500/50 dark:[&_a]:decoration-blue-400/50 hover:[&_a]:decoration-blue-500 dark:hover:[&_a]:decoration-blue-400",
				"[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 dark:[&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400 [&_blockquote]:my-4",
				"[&_hr]:my-8 [&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-800",
				"[&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
				className,
			)}
			components={{
				pre: ({ children }: any) => {
					// Robustly extract text from children
					const extractText = (content: any, depth = 0): string => {
						if (depth > 20) return "";
						if (typeof content === "string" || typeof content === "number") {
							return String(content);
						}
						if (Array.isArray(content)) {
							return content.map((c) => extractText(c, depth + 1)).join("");
						}
						if (content?.props?.children) {
							return extractText(content.props.children, depth + 1);
						}
						return "";
					};

					// Find code element among children
					const childrenArray = Array.isArray(children) ? children : [children];
					const codeElement = childrenArray.find(
						(child: any) =>
							child?.type === "code" ||
							child?.props?.className?.startsWith("language-") ||
							child?.type === "code",
					);

					// Even if no code element is found directly (e.g. plain text inside pre), treats as code block
					// But usually markdown gives pre > code structure.

					let language = "text";
					let codeContent = "";

					if (codeElement) {
						const className = codeElement.props?.className || "";
						const match = /language-(\w+)/.exec(className);
						language = match ? match[1] : "text";
						codeContent = String(
							extractText(codeElement.props.children),
						).replace(/\n$/, "");
					} else {
						// Fallback: extract text from pre's direct children
						codeContent = String(extractText(children)).replace(/\n$/, "");
					}

					return (
						<CodeBlock
							className={`language-${language}`}
							language={language}
							isLoading={isLoading}
						>
							{codeContent}
						</CodeBlock>
					);
				},
				code: ({ inline, className, children, ...props }: any) => {
					// Handle inline code only. Block code is handled by 'pre'.
					if (inline) {
						return (
							<code
								className={cn(
									"bg-muted px-1.5 py-0.5 rounded-md font-mono text-sm",
									className,
								)}
								{...props}
							>
								{children}
							</code>
						);
					}
					// For block code, just render children so 'pre' can access them
					return (
						<code className={className} {...props}>
							{children}
						</code>
					);
				},
				table: ({ children, ...props }: any) => (
					<div className="my-4 w-full overflow-y-auto w-full overflow-x-auto rounded-lg border border-border">
						<table className="w-full text-left text-sm" {...props}>
							{children}
						</table>
					</div>
				),
				thead: ({ children, ...props }: any) => (
					<thead className="bg-muted/50 text-muted-foreground" {...props}>
						{children}
					</thead>
				),
				tbody: ({ children, ...props }: any) => (
					<tbody className="divide-y divide-border" {...props}>
						{children}
					</tbody>
				),
				tr: ({ children, ...props }: any) => (
					<tr className="transition-colors hover:bg-muted/50" {...props}>
						{children}
					</tr>
				),
				th: ({ children, ...props }: any) => (
					<th className="px-4 py-3 font-medium" {...props}>
						{children}
					</th>
				),
				td: ({ children, ...props }: any) => (
					<td className="px-4 py-3" {...props}>
						{children}
					</td>
				),
			}}
			rehypePlugins={[rehypeKatex]}
			remarkPlugins={[remarkMath, remarkGfm]}
			{...props}
		>
			{children}
		</Streamdown>
	);
}
