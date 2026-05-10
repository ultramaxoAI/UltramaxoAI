import { tool } from "ai";
import { z } from "zod";

type WebSearchProgress = (message: string) => void;

type TavilyResult = {
	title?: string;
	url?: string;
	content?: string;
	score?: number;
	published_date?: string;
};

function getDomain(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

function getResultTitle(result: TavilyResult, domain: string) {
	return result.title?.trim() || domain || "Sumber web";
}

function normalizeResults(results: TavilyResult[] = []) {
	return results
		.filter((result) => typeof result.url === "string" && result.url.trim())
		.map((result) => {
			const url = result.url?.trim() ?? "";
			const domain = getDomain(url);
			return {
				content: result.content,
				domain,
				publishedDate: result.published_date,
				score: result.score,
				title: getResultTitle(result, domain),
				url,
			};
		});
}

export function createWebSearchTool(onProgress?: WebSearchProgress) {
	return tool({
		description:
			"Search the web for real-time information, news, and current events. Use this when user needs current/recent information that may not be in your training data.",
		inputSchema: z.object({
			query: z.string().describe("The search query to look up on the web"),
		}),
		execute: async ({ query }: { query: string }) => {
			console.log("[Web Search Tool] Calling Tavily API for query:", query);
			onProgress?.(`Mencari web untuk: ${query}`);
			const tavilyKey = process.env.TAVILY_API_KEY;
			if (!tavilyKey) {
				console.warn("[Web Search Tool] Missing TAVILY_API_KEY");
				onProgress?.(
					"Pencarian web gagal karena konfigurasi Tavily belum tersedia.",
				);
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

				console.log("[Web Search Tool] Tavily response status:", response.status);

				if (!response.ok) {
					const errText = await response.text();
					console.error("[Web Search Tool] Tavily error:", errText);
					onProgress?.("Pencarian web gagal, menjawab dari konteks yang tersedia.");
					return {
						error: `Search API returned error: ${response.status}`,
					};
				}

				const data = await response.json();
				const sources = normalizeResults(data.results ?? []);
				console.log(
					`[Web Search Tool] Search successful, found ${sources.length || 0} results`,
				);

				if (sources.length === 0) {
					onProgress?.("Tidak menemukan sumber web yang cukup relevan.");
				} else {
					for (const source of sources.slice(0, 4)) {
						onProgress?.(`Membaca ${source.domain}: ${source.title}`);
					}
					onProgress?.(
						`Membandingkan ${sources.length} sumber dan memilih poin yang konsisten.`,
					);
				}

				return {
					...data,
					sources,
				};
			} catch (_error: any) {
				console.error("[Web Search Tool] Fetch exception:", _error.message);
				onProgress?.("Pencarian web gagal, menjawab dari konteks yang tersedia.");
				return {
					error: "An unexpected error occurred during the web search.",
				};
			}
		},
	});
}

export const webSearch = createWebSearchTool();
