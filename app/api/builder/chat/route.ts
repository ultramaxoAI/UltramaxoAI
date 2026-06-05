import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const apiKey = process.env.FREEMODEL_API_KEY || "fe_oa_a0a141248ea57219eb7a55450d189c22a6aafacc4af0eb5b";
    const baseUrl = process.env.FREEMODEL_BASE_URL || "https://api.freemodel.dev";

    const systemPrompt = {
      role: "system",
      content: `You are UltraaxoAI, an expert web developer AI agent. 
You write high-quality, production-ready code.
You are running in a client-side WebContainer Node.js sandbox.
You have access to write files, read files, and execute terminal commands.

When you want to perform actions, you MUST use XML-style tool calls that the parser can execute.
Format your tool calls exactly like this (do not escape tags):

<tool name="write_file" path="src/components/Counter.tsx">
import React from 'react';
// file content here...
</tool>

<tool name="run_command" cmd="npm install lucide-react"></tool>

Available tools:
1. write_file: path (attribute), content (inner text) - Writes a file to workspace
2. read_file: path (attribute) - Reads file content
3. delete_file: path (attribute) - Deletes a file
4. list_dir: path (attribute) - Lists directory contents
5. run_command: cmd (attribute) - Runs terminal commands (e.g., npm install, npm run build, npm run dev)

Do not run commands that block the terminal unless necessary. Always output thoughts explaining what you are doing before executing tool calls.`,
    };

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        messages: [systemPrompt, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: "AI provider returned error", details: errText }, { status: 502 });
    }

    // Forward the ReadableStream directly to Next.js Response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Chat API Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
