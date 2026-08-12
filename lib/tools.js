import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { webSearch } from "@/lib/tavily";

export const webSearchTool = tool(
  async ({ query }) => {
    const { answer, sources } = await webSearch(query);
    return JSON.stringify({ answer, sources });
  },
  {
    name: "web_search",
    description:
      "Search the web for real-world information the video does not contain but that would genuinely help the user " +
      "(current facts, recommendations, background). Do NOT use it for a detail the video simply never mentions " +
      "(a company, person, or fact not in the transcript) — for those, just say the video doesn't cover it.",
    schema: z.object({ query: z.string().describe("A focused web search query") }),
  }
);
