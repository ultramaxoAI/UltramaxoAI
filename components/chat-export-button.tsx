"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/toast";
import { DownloadIcon, FileTextIcon, FileJsonIcon, FileIcon } from "./icons";

interface ChatExportButtonProps {
  chatId: string;
  className?: string;
}

export function ChatExportButton({ chatId, className }: ChatExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "json" | "markdown" | "txt") => {
    setExporting(true);
    try {
      const response = await fetch(`/api/chat/export?chatId=${chatId}&format=${format}`);
      
      if (!response.ok) {
        throw new Error("Gagal export chat");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `chat.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ type: "success", description: `Chat berhasil di-export sebagai ${format.toUpperCase()}!` });
    } catch (error: any) {
      toast({ type: "error", description: error.message || "Gagal export chat" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={className}
          disabled={exporting}
          size="sm"
          variant="ghost"
        >
          <DownloadIcon />
          {exporting ? "Exporting..." : "Export Chat"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJsonIcon className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("markdown")}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("txt")}>
          <FileIcon className="mr-2 h-4 w-4" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
