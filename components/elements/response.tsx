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
				"text-[14.5px] leading-[1.8] tracking-[-0.01em] text-white/75",
				"[&_p]:mb-4 [&_p]:mt-0",
				"[&_ul]:mb-4 [&_ul]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_ul]:my-1",
				"[&_ol]:mb-4 [&_ol]:mt-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_ol]:my-1",
				"[&_li]:mt-1.5 [&_li]:pl-1 [&_li]:text-white/65",
				"[&_h1]:mb-2 [&_h1]:mt-5 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-white/90",
				"[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-white/90",
				"[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-white/90",
				"[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:text-white/90",
				"[&_strong]:font-semibold [&_strong]:text-white/85",
				"[&_a]:text-[#60a5fa] [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:decoration-[#60a5fa]/30 hover:[&_a]:text-[#93c5fd] hover:[&_a]:decoration-[#93c5fd]/50",
				"[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/50",
				"[&_hr]:my-8 [&_hr]:border-white/5",
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
									"rounded bg-white/6 px-1.5 py-0.5 font-mono text-[12px] text-white/80",
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
