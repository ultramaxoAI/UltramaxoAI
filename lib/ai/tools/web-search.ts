import { tool } from "ai";
import { z } from "zod";

// Search using Tavily API (primary)
async function searchWithTavily(query: string, apiKey: string) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Tavily ${response.status}: ${txt.slice(0, 200)}`);
  }

  const data = await response.json();
  return {
    answer: data.answer,
    results: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content?.slice(0, 300),
    })),
    source: "tavily",
  };
}

// Free DuckDuckGo fallback (no API key required)
async function searchWithDuckDuckGo(query: string) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Ultramaxo AI/1.0" },
  });

  if (!response.ok) throw new Error(`DDG ${response.status}`);

  const data = await response.json();

  const results = [
    ...(data.Results || []).map((r: any) => ({
      title: r.Text,
      url: r.FirstURL,
      content: r.Text,
    })),
    ...(data.RelatedTopics || [])
      .filter((t: any) => t.Text && t.FirstURL)
      .slice(0, 5)
      .map((t: any) => ({
        title: t.Text?.split(" - ")[0] || t.Text,
        url: t.FirstURL,
        content: t.Text,
      })),
  ].slice(0, 5);

  return {
    answer: data.AbstractText || null,
    results,
    source: "duckduckgo",
  };
}

export const webSearch = tool({
  description:
    "Search the web for real-time information, current events, news, and facts. Use this when user asks about something that requires up-to-date information.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up on the web"),
  }),
  execute: async ({ query }: { query: string }) => {
    const tavilyKey = process.env.TAVILY_API_KEY;

    console.log("[webSearch] Searching for:", query);

    // Try Tavily first
    if (tavilyKey) {
      try {
        const result = await searchWithTavily(query, tavilyKey);
        console.log(
          "[webSearch] Tavily success, results:",
          result.results.length
        );
        return result;
      } catch (err) {
        console.warn(
          "[webSearch] Tavily failed:",
          (err as Error).message,
          "→ falling back to DDG"
        );
      }
    }

    // Fallback to DuckDuckGo (free, no key needed)
    try {
      const result = await searchWithDuckDuckGo(query);
      console.log("[webSearch] DDG results:", result.results.length);
      return result;
    } catch (err) {
      console.error("[webSearch] DDG also failed:", (err as Error).message);
      return {
        error: "Web search is currently unavailable. Please try again later.",
        results: [],
      };
    }
  },
});
