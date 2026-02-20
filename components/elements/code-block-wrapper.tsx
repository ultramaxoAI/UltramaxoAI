"use client";

import { Check, Copy, Download } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CodeBlockWrapperProps {
  children: React.ReactNode;
  language?: string;
}

export function CodeBlockWrapper({
  children,
  language,
}: CodeBlockWrapperProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (preRef.current) {
      const codeText = preRef.current.querySelector("code")?.textContent || "";
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (preRef.current) {
      const codeText = preRef.current.querySelector("code")?.textContent || "";
      const blob = new Blob([codeText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `code.${language || "txt"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="group/code relative my-4" ref={preRef}>
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/code:opacity-100">
        <Button
          className="size-8 bg-muted/80 backdrop-blur-sm hover:bg-muted"
          onClick={handleCopy}
          size="icon"
          title={copied ? "Copied!" : "Copy code"}
          variant="ghost"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button
          className="size-8 bg-muted/80 backdrop-blur-sm hover:bg-muted"
          onClick={handleDownload}
          size="icon"
          title="Download code"
          variant="ghost"
        >
          <Download className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
