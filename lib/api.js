import { axiosClient } from "@/lib/axiosClient";

async function streamNdjson(url, body, onDelta) {
  const { data: stream } = await axiosClient.post(url, body, {
    adapter: "fetch",
    responseType: "stream",
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const delta = JSON.parse(line);
      if (delta.error) throw new Error(delta.error);
      onDelta(delta);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const delta = JSON.parse(buffer);
    if (delta.error) throw new Error(delta.error);
    onDelta(delta);
  }
}

export function ingestVideo(url, onDelta) {
  return streamNdjson("/api/ingest", { url }, onDelta);
}

export function chat(threadId, message, onDelta) {
  return streamNdjson("/api/chat", { threadId, message }, onDelta);
}

export async function fetchHistory(threadId) {
  const { data } = await axiosClient.get("/api/history", { params: { threadId } });
  return data;
}
