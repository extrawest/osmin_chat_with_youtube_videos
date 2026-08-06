import { SystemMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { getTranscript } from "@/lib/youtube";
import { chunkTranscript } from "@/lib/text";
import { buildStore, getStore } from "@/lib/graph/store";
import { webSearch } from "@/lib/tavily";
import { lastUserText } from "@/lib/graph/messages";

const SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD || 0.75);
const CHUNKS_PER_QUESTION = 6;

export async function ingestNode(state) {
  const { videoId, title, transcript } = await getTranscript(state.videoUrl);
  const chunks = await chunkTranscript(transcript);
  if (!chunks.length) throw new Error("This video transcript is empty.");
  const vectors = await buildStore(videoId, chunks);
  return { videoId, title, chunks, vectors };
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
  return { contextText, route: bestCosine >= SIMILARITY_THRESHOLD ? "rag" : "web" };
}

export async function answerNode(state) {
  const system = new SystemMessage(
    "You answer questions about a YouTube video using the transcript excerpts below. " +
      "Be concise and specific. If the excerpts don't contain the answer, say so plainly.\n\n" +
      `Video: ${state.title || "Unknown"}\n\nTranscript excerpts:\n${state.contextText}`
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
