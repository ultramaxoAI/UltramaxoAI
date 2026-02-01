"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Response } from "./elements/response";
import { parseResponse } from "@/lib/parse-response";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlock = {
  language?: string;
  content: string;
};

type FileKey = "html" | "css" | "js" | "other";

type FileEntry = {
  key: FileKey;
  label: string;
  icon: string;
  language: string;
  content: string;
};

const looksLikeHtml = (text: string) =>
  /<\s*(html|head|body|div|span|section|article|style|header|footer|main|nav|p|a|img|ul|ol|li|table|form|input|button|script)\b/i.test(
    text
  );

const stripScriptsAndEvents = (html: string) => {
  const withoutScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  const withoutEvents = withoutScripts.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  const withoutJsUrls = withoutEvents.replace(
    /(href|src)\s*=\s*"\s*javascript:[^"]*"/gi,
    "$1=\"\""
  );
  return withoutJsUrls;
};

const buildHtmlPreviewDoc = (blocks: CodeBlock[]) => {
  const htmlBlocks = blocks.filter(
    (block) => block.language === "html" || looksLikeHtml(block.content)
  );
  const cssBlocks = blocks.filter((block) => block.language === "css");

  const htmlContent = htmlBlocks.map((b) => b.content).join("\n\n");
  const cssContent = cssBlocks.map((b) => b.content).join("\n\n");

  if (!htmlContent && !cssContent) {
    return "";
  }

  if (/<\s*html\b/i.test(htmlContent)) {
    return stripScriptsAndEvents(htmlContent);
  }

  const safeBody = stripScriptsAndEvents(htmlContent || "<div></div>");
  const safeCss = stripScriptsAndEvents(cssContent);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${safeCss}</style>
  </head>
  <body>
    ${safeBody}
  </body>
</html>`;
};
function getFileName(language: string | undefined, index: number) {
  const lang = (language || "").toLowerCase();
  if (lang === "html") return "index.html";
  if (lang === "css") return "style.css";
  if (lang === "js" || lang === "javascript" || lang === "ts" || lang === "typescript") {
    return "script.js";
  }
  return `snippet-${index + 1}${lang ? `.${lang}` : ""}`;
}

export function ResponseViewer({
  text,
  className,
  showModes = true,
  hideCodeBlocks = false,
}: {
  text: string;
  className?: string;
  showModes?: boolean;
  hideCodeBlocks?: boolean;
}) {
  const [activeFile, setActiveFile] = useState<FileKey | null>(null);
  const [openFiles, setOpenFiles] = useState<Record<FileKey, boolean>>({
    html: true,
    css: true,
    js: true,
    other: true,
  });
  const [showPreview, setShowPreview] = useState(false);

  const parsed = useMemo(() => parseResponse(text), [text]);

  const codeBlocks: CodeBlock[] = useMemo(
    () =>
      parsed.blocks.map((b) => ({
        language: b.language,
        content: b.code,
      })),
    [parsed.blocks]
  );

  const htmlBlocks = useMemo(
    () =>
      codeBlocks.filter(
        (block) => block.language === "html" || looksLikeHtml(block.content)
      ),
    [codeBlocks]
  );

  const htmlPreviewDoc = useMemo(
    () => buildHtmlPreviewDoc(codeBlocks),
    [codeBlocks]
  );
  const hasCode = codeBlocks.length > 0;
  const hasHtmlOrCss = htmlBlocks.length > 0 || !!htmlPreviewDoc;

  const files = useMemo<FileEntry[]>(() => {
    if (!hasCode) return [];

    let html = "";
    let css = "";
    let js = "";
    let other = "";
    let otherLang: string | null = null;

    for (const block of codeBlocks) {
      const lang = (block.language || "").toLowerCase();
      if (lang === "html" || (!lang && looksLikeHtml(block.content))) {
        html += (html ? "\n\n" : "") + block.content;
      } else if (lang === "css") {
        css += (css ? "\n\n" : "") + block.content;
      } else if (
        lang === "js" ||
        lang === "javascript" ||
        lang === "ts" ||
        lang === "tsx" ||
        lang === "typescript"
      ) {
        js += (js ? "\n\n" : "") + block.content;
      } else {
        other += (other ? "\n\n" : "") + block.content;
        if (!otherLang) otherLang = lang || "text";
      }
    }

    const entries: FileEntry[] = [];

    if (html.trim()) {
      entries.push({
        key: "html",
        label: "index.html",
        icon: "📄",
        language: "html",
        content: html.trim(),
      });
    }

    if (css.trim()) {
      entries.push({
        key: "css",
        label: "style.css",
        icon: "🎨",
        language: "css",
        content: css.trim(),
      });
    }

    if (js.trim()) {
      entries.push({
        key: "js",
        label: "script.js",
        icon: "⚡",
        language: "javascript",
        content: js.trim(),
      });
    }

    if (other.trim()) {
      const lang = (otherLang || "text").toLowerCase();
      let label = "snippet.txt";
      if (lang === "python" || lang === "py") {
        label = "main.py";
      } else if (lang === "csharp" || lang === "cs") {
        label = "Program.cs";
      } else if (lang && lang !== "text") {
        label = `snippet.${lang}`;
      }

      entries.push({
        key: "other",
        label,
        icon: "📄",
        language: lang || "text",
        content: other.trim(),
      });
    }

    return entries;
  }, [codeBlocks, hasCode]);

  // Default: buka index.html jika ada, selain itu file pertama.
  useEffect(() => {
    if (files.length === 0) {
      setActiveFile(null);
      setShowPreview(false);
      return;
    }

    setActiveFile((prev) => {
      if (prev && files.some((f) => f.key === prev)) return prev;
      const htmlFile = files.find((f) => f.key === "html");
      return (htmlFile ?? files[0]).key;
    });
  }, [files]);

  // Matikan preview kalau pindah dari HTML.
  useEffect(() => {
    if (activeFile !== "html") {
      setShowPreview(false);
    }
  }, [activeFile]);

  const canShowExplorer = showModes && files.length > 0;

  const handleFileClick = (key: FileKey) => {
    const isOpen = openFiles[key] ?? true;
    const nextOpen = !isOpen;

    setOpenFiles((prev) => ({ ...prev, [key]: nextOpen }));

    if (nextOpen) {
      setActiveFile(key);
    } else if (activeFile === key) {
      const firstOther = files.find((f) => f.key !== key && (openFiles[f.key] ?? true));
      setActiveFile(firstOther ? firstOther.key : null);
    }
  };

  const active =
    activeFile && (openFiles[activeFile] ?? true)
      ? files.find((f) => f.key === activeFile) || null
      : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Normal view: selalu tampil seperti AI biasa */}
      <Response>{text}</Response>

      {/* PERMANENTLY HIDE code blocks explorer - code should appear in artifacts only */}
    </div>
  );
}