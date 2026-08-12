import { SystemMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { getTranscript } from "@/lib/youtube";
import { chunkTranscript } from "@/lib/text";
import { buildOverview } from "@/lib/overview";
import { buildStore, getStore } from "@/lib/graph/store";
import { webSearch } from "@/lib/tavily";
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

export async function webSearchNode(state) {
  const question = lastUserText(state.messages);
  const { answer, sources } = await webSearch(question);
  const system = new SystemMessage(
    "The video transcript did not cover this question, so a web search was run. " +
      "Answer the user with the web-search result below; the client will show the source links. " +
      "Keep it concise.\n\n" +
      `Web search answer:\n${answer || "(no direct answer returned)"}`
  );
  const reply = await getModel().invoke([system, ...state.messages]);
  reply.additional_kwargs = { ...reply.additional_kwargs, route: "web", sources };
  return { messages: [reply], sources };
}
