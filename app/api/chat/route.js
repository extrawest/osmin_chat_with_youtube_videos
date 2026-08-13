import { HumanMessage } from "@langchain/core/messages";
import { appGraph } from "@/lib/graph/graph";
import { textOf } from "@/utils/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let threadId, message;
  try {
    ({ threadId, message } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!threadId || !message) {
    return Response.json({ error: "Missing threadId or message" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const events = await appGraph.stream(
          { mode: "chat", messages: [new HumanMessage(message)] },
          {
            configurable: { thread_id: threadId },
            streamMode: ["updates", "messages"],
          }
        );
        for await (const [mode, chunk] of events) {
          if (mode === "messages") {
            const [msg] = chunk;
            if (msg?._getType?.() === "tool") continue;
            const token = textOf(msg);
            if (token) send({ token });
          } else if (mode === "updates") {
            const update = chunk.answer || chunk.agent;
            const last = update?.messages?.[update.messages.length - 1];
            const route = last?.additional_kwargs?.route;
            if (route) send({ route, sources: last.additional_kwargs.sources || [] });
          }
        }
      } catch (err) {
        console.error("Chat stream failed:", err);
        send({ error: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
