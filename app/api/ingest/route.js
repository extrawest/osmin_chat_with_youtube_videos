import { appGraph } from "@/lib/graph/graph";
import { extractVideoId } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let url, threadId;
  try {
    ({ url } = await request.json());
    threadId = extractVideoId(url);
  } catch (err) {
    return Response.json({ error: err.message || "Invalid request" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        send({ status: "processing", threadId });
        const updates = await appGraph.stream(
          { mode: "ingest", videoUrl: url },
          { configurable: { thread_id: threadId }, streamMode: "updates" }
        );
        for await (const update of updates) {
          const delta = update.ingest;
          if (delta) {
            send({ status: "ready", threadId, videoId: delta.videoId, title: delta.title });
          }
        }
      } catch (err) {
        console.error("Ingest stream failed:", err);
        send({ error: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
