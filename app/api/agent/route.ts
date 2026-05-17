import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

// Tool definitions
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information, news, or data.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_chart",
      description:
        "Generate chart data for visualization. Returns structured data for a pie, bar, or line chart.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["pie", "bar", "line"],
            description: "Chart type",
          },
          title: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "number" },
              },
            },
          },
        },
        required: ["type", "title", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_file",
      description: "Analyze uploaded file content and return a summary.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string" },
          summary: { type: "string", description: "Analysis result" },
          insights: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["filename", "summary", "insights"],
      },
    },
  },
];

// Simulate tool execution (replace with real implementations)
async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "web_search":
      // Replace with real search API (e.g., Tavily, SerpAPI)
      return JSON.stringify({
        results: [
          {
            title: `Search results for: ${args.query}`,
            snippet:
              "This is a simulated search result. Integrate a real search API like Tavily or SerpAPI.",
            url: "https://example.com",
          },
        ],
      });

    case "generate_chart":
      // Return the chart data as-is; frontend will render it
      return JSON.stringify({
        chart: {
          type: args.type,
          title: args.title,
          data: args.data,
        },
      });

    case "analyze_file":
      return JSON.stringify({
        analysis: args.summary,
        insights: args.insights,
      });

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

export async function POST(req: Request) {
  const { messages, fileContent } = await req.json();

  const systemPrompt = `You are a powerful AI agent for Ultramaxo.tech. You help users by searching the web, generating charts, and analyzing files.

When working on complex tasks:
1. Break down the task into clear steps
2. Use tools proactively — search for data, generate charts when comparing numbers, analyze files when provided
3. Keep visible reasoning concise and operational
4. Be conversational but precise

UI output style:
- No emoji.
- No purple accents or colorful gradients.
- Prefer a premium minimal dark interface: #080808 background, rgba(255,255,255,0.04) surfaces, rgba(255,255,255,0.09) borders.
- Use #3B82F6 only for links or active states.
- Use #10B981 only for done states.
- Buttons should be small text controls with no filled background unless hovered.
- Thinking labels should be plain "Thinking" with dots or a subtle underline.

${fileContent ? `A file has been uploaded with the following content:\n${fileContent}` : ""}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...messages,
        ];

        let continueLoop = true;

        // Notify frontend: reasoning starting
        const notifyReasoning = (content: string) => {
          send({ type: "reasoning", content });
        };

        while (continueLoop) {
          notifyReasoning("Thinking");

          const openai = getOpenAI();
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: allMessages,
            tools,
            tool_choice: "auto",
            stream: true,
          });

          let currentContent = "";
          let toolCalls: Record<
            number,
            { id: string; name: string; args: string }
          > = {};

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;

            // Stream text content
            if (delta?.content) {
              currentContent += delta.content;
              send({ type: "text", content: delta.content });
            }

            // Accumulate tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCalls[tc.index]) {
                  toolCalls[tc.index] = { id: "", name: "", args: "" };
                }
                if (tc.id) toolCalls[tc.index].id = tc.id;
                if (tc.function?.name)
                  toolCalls[tc.index].name = tc.function.name;
                if (tc.function?.arguments)
                  toolCalls[tc.index].args += tc.function.arguments;
              }
            }

            // Check finish reason
            const finishReason = chunk.choices[0]?.finish_reason;

            if (finishReason === "tool_calls") {
              // Add assistant message with tool calls
              allMessages.push({
                role: "assistant",
                content: currentContent || null,
                tool_calls: Object.values(toolCalls).map((tc) => ({
                  id: tc.id,
                  type: "function" as const,
                  function: { name: tc.name, arguments: tc.args },
                })),
              });

              // Execute each tool
              for (const tc of Object.values(toolCalls)) {
                let parsedArgs: Record<string, unknown> = {};
                try {
                  parsedArgs = JSON.parse(tc.args);
                } catch {}

                // Notify frontend: tool start
                send({
                  type: "tool_start",
                  tool: tc.name,
                  args: parsedArgs,
                });

                const result = await executeTool(tc.name, parsedArgs);

                // Notify frontend: tool done
                send({
                  type: "tool_result",
                  tool: tc.name,
                  result: JSON.parse(result),
                });

                // Add tool result to messages
                allMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: result,
                });
              }

              toolCalls = {};
              currentContent = "";
              // Continue the loop for next LLM call
            } else if (finishReason === "stop") {
              continueLoop = false;
            }
          }
        }

        send({ type: "done" });
        controller.close();
      } catch (err) {
        send({ type: "error", message: String(err) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
