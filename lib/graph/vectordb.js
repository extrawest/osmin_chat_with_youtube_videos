import { Pinecone } from "@pinecone-database/pinecone";

const INDEX = process.env.PINECONE_INDEX_NAME || "youtube-transcripts";

const BATCH_SIZE = 100;

let _pc = null;
function getClient() {
  if (!_pc) _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return _pc;
}

function toBatches(records, size) {
  const batches = [];
  for (let i = 0; i < records.length; i += size) {
    batches.push(records.slice(i, i + size));
  }
  return batches;
}

export async function ingestToVectorDb(videoId, chunks, embeddings) {
  const namespace = getClient().index(INDEX).namespace(videoId);
  try {
    await namespace.deleteAll();
  } catch (err) {
    if (!err.message?.includes("404")) throw err;
  }
  const records = chunks.map((text, i) => ({
    id: `chunk-${i}`,
    values: embeddings[i],
    metadata: { text },
  }));
  for (const batch of toBatches(records, BATCH_SIZE)) {
    await namespace.upsert({ records: batch });
  }
}

export async function queryVectorDb(videoId, queryVector, k = 6) {
  const result = await getClient().index(INDEX).namespace(videoId).query({
    vector: queryVector,
    topK: k,
    includeMetadata: true,
  });
  return (result.matches || []).map((m) => ({
    text: String(m.metadata?.text || ""),
    score: m.score,
  }));
}
