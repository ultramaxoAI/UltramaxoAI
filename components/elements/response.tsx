"use client";

import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
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
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        pre({ children, ...props }: any) {
          const codeElement = children;
          const className = codeElement?.props?.className || "";
          const match = /language-(\w+)/.exec(className);
          const language = match ? match[1] : "";

          if (language) {
            return (
              <CodeBlockWrapper language={language}>
                <pre {...props}>{codeElement}</pre>
              </CodeBlockWrapper>
            );
          }

          return <pre {...props}>{children}</pre>;
        },
      }}
      {...props}
    >
      {children}
    </Streamdown>
  );
}
