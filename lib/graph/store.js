import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { getDocEmbeddings, getQueryEmbeddings } from "@/lib/embeddings";

const stores = new Map();

async function fromVectors(chunks, vectors) {
  const store = new MemoryVectorStore(getQueryEmbeddings());
  await store.addVectors(
    vectors,
    chunks.map((text) => new Document({ pageContent: text }))
  );
  return store;
}

export async function buildStore(videoId, chunks) {
  const vectors = await getDocEmbeddings().embedDocuments(chunks);
  if (!vectors.length || vectors.some((v) => !v?.length)) {
    throw new Error("Embedding failed for one or more transcript chunks.");
  }
  stores.set(videoId, await fromVectors(chunks, vectors));
  return vectors;
}

export async function getStore(videoId, chunks, vectors) {
  const cached = stores.get(videoId);
  if (cached) return cached;
  const store = await fromVectors(chunks, vectors);
  stores.set(videoId, store);
  return store;
}
