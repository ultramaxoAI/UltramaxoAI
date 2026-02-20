import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { chat, message } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const format = searchParams.get("format") || "json"; // json, markdown, txt

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 });
    }

    // Verify chat ownership
    const [chatData] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);

    if (!chatData) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (
      chatData.userId !== session.user.id &&
      chatData.visibility !== "public"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all messages
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt);

    // Format export based on requested format
    let exportData: string;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split("T")[0];
    const title = chatData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    switch (format) {
      case "markdown":
        exportData = formatAsMarkdown(chatData.title, messages);
        contentType = "text/markdown";
        filename = `chat_${title}_${timestamp}.md`;
        break;

      case "txt":
        exportData = formatAsText(chatData.title, messages);
        contentType = "text/plain";
        filename = `chat_${title}_${timestamp}.txt`;
        break;

      default: // json
        exportData = JSON.stringify(
          {
            chat: {
              id: chatData.id,
              title: chatData.title,
              createdAt: chatData.createdAt,
              visibility: chatData.visibility,
            },
            messages: messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.parts,
              createdAt: m.createdAt,
            })),
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
        contentType = "application/json";
        filename = `chat_${title}_${timestamp}.json`;
    }

    logger.info("Chat exported", { chatId, format, userId: session.user.id });

    return new Response(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("Chat export error", error);
    return NextResponse.json(
      { error: "Failed to export chat" },
      { status: 500 }
    );
  }
}

function formatAsMarkdown(title: string, messages: any[]): string {
  let md = `# ${title}\n\n`;
  md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

  for (const msg of messages) {
    const role = msg.role === "user" ? "👤 User" : "🤖 Assistant";
    md += `## ${role}\n\n`;

    const textParts = msg.parts.filter((p: any) => p.type === "text");
    for (const part of textParts) {
      md += `${part.text}\n\n`;
    }

    md += "---\n\n";
  }

  return md;
}

function formatAsText(title: string, messages: any[]): string {
  let txt = `${title}\n`;
  txt += `${"=".repeat(title.length)}\n\n`;
  txt += `Exported on ${new Date().toLocaleString()}\n\n`;
  txt += `${"=".repeat(50)}\n\n`;

  for (const msg of messages) {
    const role = msg.role === "user" ? "USER" : "ASSISTANT";
    txt += `[${role}]\n`;

    const textParts = msg.parts.filter((p: any) => p.type === "text");
    for (const part of textParts) {
      txt += `${part.text}\n\n`;
    }

    txt += `${"-".repeat(50)}\n\n`;
  }

  return txt;
}
