import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web for real-time information, news, and current events. Use this when user needs current/recent information that may not be in your training data.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up on the web"),
  }),
  execute: async ({ query }: { query: string }) => {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      return {
        error:
          "Pencarian web saat ini tidak tersedia karena kunci API Tavily belum dikonfigurasi. Beritahu pengguna bahwa mereka perlu menambahkan TAVILY_API_KEY ke file .env.local mereka agar fitur ini dapat berfungsi.",
      };
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        return {
          error: `Search API returned error: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      return {
        error: "An unexpected error occurred during the web search.",
      };
    }
  },
});
