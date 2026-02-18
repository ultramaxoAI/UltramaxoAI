"use client";

import type { ComponentProps } from "react";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { CodeBlockWrapper } from "./code-block-wrapper";
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
        pre({ children, ...props }: any) {
          // Streamdown might wrap code in multiple elements or arrays
          const childrenArray = Array.isArray(children) ? children : [children];
          const codeElement = childrenArray.find(
            (child: any) => child?.type === "code"
          );

          if (!codeElement) {
            return <pre {...props}>{children}</pre>;
          }

          const className = codeElement.props?.className || "";
          const match = /language-(\w+)/.exec(className);
          const language = match ? match[1] : "";

          return (
            <CodeBlockWrapper language={language}>
              <pre {...props}>{children}</pre>
            </CodeBlockWrapper>
          );
        },
      }}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      remarkPlugins={[remarkMath]}
      {...props}
    >
      {children}
    </Streamdown>
  );
}
