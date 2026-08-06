import { TavilySearch } from "@langchain/tavily";

const MAX_RESULTS = 5;
const MAX_SOURCES = 3;

let tavily;
function getTavily() {
  if (!tavily) {
    tavily = new TavilySearch({
      maxResults: MAX_RESULTS,
      includeAnswer: true,
      searchDepth: "basic",
      tavilyApiKey: process.env.TAVILY_API_KEY,
    });
  }
  return tavily;
}

export async function webSearch(query) {
  const raw = await getTavily().invoke({ query });
  const res = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (res?.error) throw new Error(res.error);
  const results = Array.isArray(res?.results) ? res.results : [];
  if (!results.length && !res?.answer) throw new Error("Tavily returned no results.");
  return {
    answer: res?.answer || "",
    sources: results.slice(0, MAX_SOURCES).map((r) => ({ title: r.title, url: r.url })),
  };
}
