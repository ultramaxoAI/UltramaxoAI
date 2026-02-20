import { Check, Code2, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark as vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { useArtifact } from "@/hooks/use-artifact";
import { generateUUID } from "@/lib/utils";

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { setArtifact } = useArtifact();

  // Extract language if not provided, fallback to text
  const lang =
    language ||
    (className ? /language-(\w+)/.exec(className)?.[1] : "text") ||
    "text";

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
    a.download = `code.${lang}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInEditor = () => {
    setArtifact({
      documentId: generateUUID(),
      content: children,
      title: `Snippet • ${lang.charAt(0).toUpperCase() + lang.slice(1)}`,
      kind: "code",
      isVisible: true,
      status: "idle",
      boundingBox: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
    });
  };

  return (
    <div className="group/code relative my-4 overflow-hidden rounded-lg border bg-zinc-950 font-mono text-sm">
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/code:opacity-100">
        <Button
          className="size-8 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleOpenInEditor}
          size="icon"
          title="Open in Editor"
          variant="ghost"
        >
          <Code2 className="size-4" />
        </Button>
        <Button
          className="size-8 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleCopy}
          size="icon"
          title={copied ? "Copied!" : "Copy code"}
          variant="ghost"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button
          className="size-8 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleDownload}
          size="icon"
          title="Download code"
          variant="ghost"
        >
          <Download className="size-4" />
        </Button>
      </div>
      <SyntaxHighlighter
        codeTagProps={{
          style: {
            fontSize: "0.875rem",
            fontFamily: "var(--font-mono)",
            lineHeight: "1.6",
          },
        }}
        customStyle={{
          margin: 0,
          padding: "1.25rem",
          background: "transparent",
          fontSize: "0.875rem",
        }}
        language={lang}
        PreTag="div"
        style={vscDarkPlus}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
