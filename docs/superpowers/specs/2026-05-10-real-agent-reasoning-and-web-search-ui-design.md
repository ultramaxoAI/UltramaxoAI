# Real Agent Reasoning and Web Search UI Design

## Goal
Improve Ultramaxo chat reasoning so it feels real, clean, and useful:

- Agent reasoning appears for tasks that benefit from visible thinking: math formulas, coding, debugging, step-by-step work, tutorials, planning, and web search.
- Reasoning must not be generic template copy. It should be derived from the actual task, tool calls, web search query, and search result domains.
- Thinking UI must stop or collapse once a final assistant answer is visible, so stale reasoning does not remain under the completed answer.
- Web search responses should show GPT-like source affordances: contextual search progress, compact source cards, and a clean `Sumber` action.
- Assistant text should be easier to read on dark UI: larger and brighter than the current small/dark rendering.

## Current Problems

1. The last change removed synthetic template reasoning, which also removed reasoning for providers that do not emit native reasoning chunks.
2. Web search currently returns Tavily data but does not emit user-visible progress such as searched query or visited domains.
3. The UI can show thinking after the answer has already started.
4. Message typography is too small and low-contrast.
5. Source display exists in pieces but is not integrated into the main assistant answer flow.

## UX Direction

Use the approved clean mockup:

### Task Reasoning
For math/coding/tutorial/step-by-step tasks, show a compact reasoning panel:

- one live headline, e.g. `Menentukan pola validasi dan edge case email`
- expandable detail lines
- subtle left border
- no big cards
- no fake generic text like `Menganalisis konteks percakapan...`

### Web Search Reasoning
For web search, show real progress:

- query being searched
- domains being read, e.g. `Membaca reuters.com...`
- comparison/completion line after results arrive
- source cards after the assistant answer when usable results exist
- `Sumber` action remains in the footer/action row

### Typography
Assistant text should use a larger readable size and brighter color:

- main assistant prose around `15px` / comfortable line-height
- dark theme color around `text-white/85`
- muted secondary text still visible around `text-white/50-60`

## Architecture

### Server Stream Events
Keep using existing data stream events:

- `data-thinking_start`
- `data-thinking_chunk`
- `data-upgrade_to_agent`
- `data-agent-thinking`
- `data-agent-step`

Add better event emission in `/app/(chat)/api/chat/route.ts` around real work:

1. Before model stream starts, emit only a minimal start event.
2. For task types likely to need reasoning, emit task-specific reasoning lines based on the user prompt category:
   - math/formula
   - coding/debugging
   - tutorial/step-by-step
   - planning/strategy
3. Avoid generic template wording. Lines must mention the task category or concrete prompt keywords.
4. For web search tool execution, emit progress based on actual query and returned domains.

### Web Search Tool
Update `backend/ai/tools/web-search.ts` or wrap the call from the route so web search returns normalized source metadata:

```ts
type WebSearchSource = {
  title: string;
  url: string;
  domain: string;
  content?: string;
  publishedDate?: string;
};
```

The chat route should convert Tavily results into streamable source/progress data.

### Client Thinking State
Update `hooks/useThinkingState.ts` so:

- real `thinking_chunk` events upgrade simple thinking into agent reasoning
- task reasoning chunks also upgrade into agent reasoning
- done/error events stop the active panel
- duplicate chunks are ignored

### Message Rendering
Update:

- `components/messages.tsx`: keep hiding stale thinking once renderable assistant output exists, unless the response is still streaming and the thinking is attached above the current assistant stream.
- `components/AgentThinking.tsx`: clean styling from approved mockup.
- `components/MessageRenderer.tsx` or response wrapper: improve prose contrast/size.
- source UI components: render compact source cards from web search tool output when present.

## Detection Rules

Reasoning should appear for:

- math: `rumus`, `hitung`, `persamaan`, `integral`, `turunan`, `matematika`, formulas
- coding: `kode`, `script`, `function`, `debug`, `error`, `implementasi`, filenames/extensions
- tutorial: `step by step`, `langkah`, `tutorial`, `panduan`, `cara`
- planning: `rencana`, `strategi`, `roadmap`, `arsitektur`
- web search: whenever `webSearch` tool is invoked

Reasoning should not appear for casual short chat unless model emits native reasoning/tool progress.

## Error Handling

- If web search fails, show one concise thinking line: `Pencarian web gagal, menjawab dari konteks yang tersedia.`
- If Tavily has no results, show: `Tidak menemukan sumber web yang cukup relevan.`
- Do not leave spinner/thinking active after stream finishes or assistant text renders.

## Testing

Manual tests:

1. Ask coding prompt: `buat fungsi validasi email js step by step`.
   - Reasoning appears with coding-specific lines.
   - Answer text remains readable.
2. Ask math prompt: `buat rumus dan jelaskan cara menghitung kecepatan`.
   - Reasoning appears with formula-specific lines.
3. Ask casual prompt: `hai`.
   - No heavy agent reasoning panel.
4. Ask current-news prompt with web search enabled.
   - Thinking shows query/domain progress.
   - Source cards and `Sumber` are visible.
5. After answer completes, stale thinking disappears/collapses.
6. Run `npm run build`.

## Out of Scope

- Full redesign of the whole chat page.
- Changing billing/credit behavior.
- Adding browser crawling beyond Tavily search results.
