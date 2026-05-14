"use client";

import { ExternalLinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MessageRendererProps = {
  content: string;
};

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
          {language || "text"}
        </span>
        <button
          className="rounded-lg border border-[#242424] bg-[#151515] px-2.5 py-1 font-mono text-[11px] text-[#777] transition-colors hover:border-[#2f3f54] hover:text-[#9bc7ff]"
          onClick={handleCopy}
          type="button"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <div className="text-[13px] leading-[1.65]">
        <SyntaxHighlighter
          language={language || "text"}
          style={vscDarkPlus}
          customStyle={{ margin: 0, background: "#0d0d0d", padding: "16px" }}
          wrapLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export function MessageRenderer({ content }: MessageRendererProps) {
  return (
    <div className="w-full font-sans text-white/90" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match && !String(children).includes("\n");
            
            if (inline) {
              return (
                <code
                  {...rest}
                  className="rounded-md border border-[#1e1e1e] bg-[#161616] px-1.5 py-0.5 font-mono text-[12px] text-[#98c379]"
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                code={String(children).replace(/\n$/, "")}
                language={match ? match[1] : ""}
              />
            );
          },
          table: ({ children }) => (
            <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.025]">
              <table className="w-full min-w-[420px] border-collapse text-left text-[13px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-white/[0.08] border-b bg-white/[0.04] text-white/70">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/[0.06] text-[#8f8f8f]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-white/[0.025]">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#60a5fa] underline decoration-[#60a5fa]/30 underline-offset-[3px] transition-all hover:text-[#93c5fd] hover:decoration-[#93c5fd]/50"
            >
              {children}
              <ExternalLinkIcon className="inline-block size-3 shrink-0 opacity-50" />
            </a>
          ),
          h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-bold text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-[17px] font-semibold text-white md:text-[18px]">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-[16px] text-white/90 leading-[1.78] last:mb-0 md:text-[17px]">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 pl-5 text-[16px] leading-[1.78] text-white/90 md:text-[17px] list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 pl-5 text-[16px] leading-[1.78] text-white/90 md:text-[17px] list-decimal">{children}</ol>,
          li: ({ children }) => <li className="pl-1 mb-1">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-4 italic text-white/60 mb-4">{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
