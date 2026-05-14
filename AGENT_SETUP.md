# Ultramaxo Agent — Setup Guide

## File Structure
```
app/
  api/
    agent/
      route.ts       ← API route (streaming + tool calling)
  page.tsx           ← Import AgentUI here
components/
  AgentUI.tsx        ← Full agent chat UI
```

## 1. Install dependency
```bash
npm install openai
```

## 2. .env.local
```
OPENAI_API_KEY=sk-...
```

## 3. app/page.tsx (or any route)
```tsx
import AgentUI from "@/components/AgentUI";
export default function Page() {
  return <AgentUI />;
}
```

## 4. Tambah real web search (opsional, recommended)
Daftar di https://tavily.com → dapat API key gratis.
Ganti bagian `web_search` di `route.ts`:

```ts
import Tavily from "@tavily/core";
const tavily = new Tavily({ apiKey: process.env.TAVILY_API_KEY });

case "web_search":
  const searchResult = await tavily.search(args.query as string, { maxResults: 5 });
  return JSON.stringify({ results: searchResult.results });
```

Tambah ke .env.local:
```
TAVILY_API_KEY=tvly-...
```

## Tools yang sudah ada
| Tool | Fungsi |
|------|--------|
| `web_search` | Search web (simulasi → ganti Tavily) |
| `generate_chart` | Bikin pie / bar chart inline |
| `analyze_file` | Analisis file yang diupload |

## Extend tools
Tambah tool baru di `tools[]` di `route.ts`, lalu handle di `executeTool()`.
Contoh: `send_email`, `query_database`, `generate_image`, dll.

---

## Gemini Prompt (untuk generate fitur tambahan)

```
You are an expert Next.js + TypeScript developer. I have an AI Agent UI for my site ultramaxo.tech. 

Current setup:
- Next.js 14 App Router
- OpenAI SDK with streaming + tool calling
- API route: /app/api/agent/route.ts
- UI: /components/AgentUI.tsx

The agent currently supports 3 tools: web_search, generate_chart, analyze_file.

Please add the following new tools:

### Tool 1: `code_interpreter`
- The agent can write and "run" Python-like pseudocode
- Display the code in a styled code block in the UI
- Show the output below the code block

### Tool 2: `create_table`  
- The agent generates structured table data
- Renders as a clean HTML table in the chat
- Supports sorting by column on click

### Tool 3: `summarize_url`
- Accepts a URL
- Uses fetch to get page content (server-side in route.ts)
- Returns a structured summary: title, key points (array), sentiment

For each tool:
1. Add the OpenAI tool definition in route.ts (tools[] array)
2. Add execution logic in executeTool()
3. Add UI rendering in AgentUI.tsx (new block types + renderers)
4. Keep the dark aesthetic (#080808 bg, blue/purple accent)
5. Make tool result cards collapsible (same pattern as existing ToolBlock)

Output: full updated route.ts and AgentUI.tsx files.
```
