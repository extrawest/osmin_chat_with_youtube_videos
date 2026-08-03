import { SystemMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { getTranscript } from "@/lib/youtube";
import { chunkTranscript } from "@/lib/text";
import { buildStore, getStore } from "@/lib/graph/store";
import { lastUserText } from "@/lib/graph/messages";

const CHUNKS_PER_QUESTION = 6;

export async function ingestNode(state) {
  const { videoId, title, transcript } = await getTranscript(state.videoUrl);
  const chunks = await chunkTranscript(transcript);
  if (!chunks.length) throw new Error("This video transcript is empty.");
  const vectors = await buildStore(videoId, chunks);
  return { videoId, title, chunks, vectors };
}

export async function retrieveNode(state) {
  const question = lastUserText(state.messages);
  const store = await getStore(state.videoId, state.chunks, state.vectors);
  const hits = await store.similaritySearchWithScore(question, CHUNKS_PER_QUESTION);
  const contextText = hits.map(([doc]) => doc.pageContent).join("\n\n");
  return { contextText };
}

export async function answerNode(state) {
  const system = new SystemMessage(
    "You answer questions about a YouTube video using the transcript excerpts below. " +
      "Be concise and specific. If the excerpts don't contain the answer, say so plainly.\n\n" +
      `Video: ${state.title || "Unknown"}\n\nTranscript excerpts:\n${state.contextText}`
  );
  const reply = await getModel().invoke([system, ...state.messages]);
  return { messages: [reply] };
}
