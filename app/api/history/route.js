import { appGraph } from "@/lib/graph/graph";
import { textOf } from "@/lib/graph/messages";

export const runtime = "nodejs";

export async function GET(request) {
  const threadId = new URL(request.url).searchParams.get("threadId");
  if (!threadId) return Response.json({ error: "Missing threadId" }, { status: 400 });

  try {
    const snapshot = await appGraph.getState({ configurable: { thread_id: threadId } });
    const values = snapshot?.values || {};
    const messages = (values.messages || []).map((m) => {
      const isUser = m._getType?.() === "human" || m.role === "user";
      return {
        role: isUser ? "user" : "assistant",
        content: textOf(m),
        route: m.additional_kwargs?.route ?? null,
        sources: m.additional_kwargs?.sources ?? [],
      };
    });

    return Response.json({
      threadId,
      videoId: values.videoId || null,
      title: values.title || null,
      messages,
    });
  } catch (err) {
    console.error("Failed to read history:", err);
    return Response.json({ error: "Could not read chat history." }, { status: 500 });
  }
}
