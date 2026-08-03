import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

function make(taskType) {
  return new GoogleGenerativeAIEmbeddings({
    model: MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    taskType,
  });
}

let docs;
export function getDocEmbeddings() {
  if (!docs) docs = make("RETRIEVAL_DOCUMENT");
  return docs;
}

let query;
export function getQueryEmbeddings() {
  if (!query) query = make("RETRIEVAL_QUERY");
  return query;
}
