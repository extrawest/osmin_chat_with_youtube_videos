import { SystemMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { getTranscript } from "@/lib/youtube";
import { chunkTranscript } from "@/lib/text";
import { buildOverview } from "@/lib/overview";
import { buildStore, getStore } from "@/lib/graph/store";
import { webSearchTool } from "@/lib/tools";
import { lastUserText } from "@/lib/graph/messages";

const RELEVANCE_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD || 0.75);
const CHUNKS_PER_QUESTION = 6;

// gemini-embedding-001 scores off-topic questions ~0.45 and relevant ones ~0.65,
// so normalize that raw-cosine band to 0-1 before comparing to the threshold.
const OFFTOPIC_COSINE = 0.45;
const ONTOPIC_COSINE = 0.65;
function relevance(cosine) {
  return Math.min(1, Math.max(0, (cosine - OFFTOPIC_COSINE) / (ONTOPIC_COSINE - OFFTOPIC_COSINE)));
}

function lastToolSources(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?._getType?.() === "tool") {
      try {
        return JSON.parse(messages[i].content)?.sources || [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

export async function ingestNode(state) {
  const { videoId, title, author, description, transcript } = await getTranscript(state.videoUrl);
  const chunks = await chunkTranscript(transcript);
  if (!chunks.length) throw new Error("This video transcript is empty.");
  const overview = await buildOverview({ title, author, description }, transcript);
  const vectors = await buildStore(videoId, chunks);
  return { videoId, title, overview, chunks, vectors };
}

export async function retrieveNode(state) {
  if (!state.chunks?.length) {
    return { contextText: "", route: "web" };
  }
  const question = lastUserText(state.messages);
  const store = await getStore(state.videoId, state.chunks, state.vectors);
  const hits = await store.similaritySearchWithScore(question, CHUNKS_PER_QUESTION);
  const bestCosine = hits.reduce((best, [, score]) => (Number.isFinite(score) ? Math.max(best, score) : best), 0);
  const contextText = hits.map(([doc]) => doc.pageContent).join("\n\n");
  return { contextText, route: relevance(bestCosine) >= RELEVANCE_THRESHOLD ? "rag" : "web" };
}

export async function answerNode(state) {
  const system = new SystemMessage(
    "You answer questions about a YouTube video using the overview and transcript excerpts below. " +
      "Prefer specifics from the excerpts; use the overview for high-level questions. " +
      "If neither contains the answer, say so plainly.\n\n" +
      `Video: ${state.title || "Unknown"}\n\n` +
      `Overview:\n${state.overview || "(none)"}\n\n` +
      `Transcript excerpts:\n${state.contextText}`
  );
  const reply = await getModel().invoke([system, ...state.messages]);
  reply.additional_kwargs = { ...reply.additional_kwargs, route: "rag" };
  return { messages: [reply] };
}

export async function agentNode(state) {
  const system = new SystemMessage(
    "You answer questions about a YouTube video.\n" +
      "First use the overview and transcript excerpts below — if they contain the answer, answer from them.\n" +
      "If they do not, decide from the question itself:\n" +
      "- If it asks about this specific video or its event (something only this video could reveal) and it isn't in the transcript, say plainly that the video doesn't cover it.\n" +
      "- If it asks about the wider world (general knowledge, current facts, places, people, recommendations, background), call the web_search tool, then answer from the results and note the answer is from a web search, not the video.\n\n" +
      `Video: ${state.title || "Unknown"}\n\n` +
      `Overview:\n${state.overview || "(none)"}\n\n` +
      `Transcript excerpts:\n${state.contextText || "(none)"}`
  );
  const reply = await getModel().bindTools([webSearchTool]).invoke([system, ...state.messages]);
  if (reply.tool_calls?.length) {
    return { messages: [reply] };
  }
  const sources = lastToolSources(state.messages);
  reply.additional_kwargs = { ...reply.additional_kwargs, route: sources.length ? "web" : "rag", sources };
  return { messages: [reply] };
}
