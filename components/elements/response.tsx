"use client";

import type { ComponentProps } from "react";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import "katex/dist/katex.min.css";

type ResponseProps = ComponentProps<typeof Streamdown>;

export function Response({ className, children, ...props }: ResponseProps) {
  return (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      components={{
        pre: ({ children, ...props }: any) => {
          // Robustly extract text from children
          const extractText = (content: any): string => {
            if (typeof content === "string") return content;
            if (Array.isArray(content))
              return content.map(extractText).join("");
            if (content?.props?.children)
              return extractText(content.props.children);
            return "";
          };

          // Find code element among children
          const childrenArray = Array.isArray(children) ? children : [children];
          const codeElement = childrenArray.find(
            (child: any) =>
              child?.type === "code" ||
              child?.props?.className?.startsWith("language-") ||
              child?.type === "code"
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
              extractText(codeElement.props.children)
            ).replace(/\n$/, "");
          } else {
            // Fallback: extract text from pre's direct children
            codeContent = String(extractText(children)).replace(/\n$/, "");
          }

          return (
            <CodeBlock className={`language-${language}`} language={language}>
              {codeContent}
            </CodeBlock>
          );
        },
        code: ({ node, inline, className, children, ...props }: any) => {
          // Handle inline code only. Block code is handled by 'pre'.
          if (inline) {
            return (
              <code
                className={cn(
                  "bg-muted px-1.5 py-0.5 rounded-md font-mono text-sm",
                  className
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
      }}
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkMath]}
      {...props}
    >
      {children}
    </Streamdown>
  );
}
