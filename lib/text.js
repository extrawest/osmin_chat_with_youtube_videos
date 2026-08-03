import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

export async function chunkTranscript(text) {
  const chunks = await splitter.splitText(text);
  return chunks.filter((c) => c.trim());
}
