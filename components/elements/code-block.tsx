"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([children], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language || "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="group/code relative my-4">
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/code:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 bg-muted/80 backdrop-blur-sm hover:bg-muted"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 bg-muted/80 backdrop-blur-sm hover:bg-muted"
          onClick={handleDownload}
          title="Download code"
        >
          <Download className="size-4" />
        </Button>
      </div>
      <pre className={className} style={{ position: 'relative' }}>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: children }} />
      </pre>
    </div>
  );
}
