import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InMemoryCache } from "@langchain/langgraph-checkpoint";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { GraphState } from "@/lib/graph/state";
import { ingestNode, retrieveNode, answerNode, agentNode } from "@/lib/graph/nodes";
import { entryRouter, decideRoute, agentShouldContinue } from "@/lib/graph/routing";
import { webSearchTool } from "@/lib/tools";
import { RETRY_OPTIONS } from "@/lib/graph/retry";
import { lastUserText } from "@/utils/messages";

const DB_PATH = process.env.CHECKPOINT_DB || "./data/checkpoints.sqlite";
mkdirSync(dirname(DB_PATH), { recursive: true });
const checkpointer = SqliteSaver.fromConnString(DB_PATH);

const graph = new StateGraph(GraphState)
  .addNode("ingest", ingestNode, {
    retryPolicy: RETRY_OPTIONS,
    cachePolicy: { keyFunc: ([state]) => state.videoUrl, ttl: 3600 },
  })
  .addNode("retrieve", retrieveNode, {
    retryPolicy: RETRY_OPTIONS,
    cachePolicy: { keyFunc: ([state]) => `${state.videoId}:${lastUserText(state.messages)}`, ttl: 300 },
  })
  .addNode("answer", answerNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("agent", agentNode, { retryPolicy: RETRY_OPTIONS })
  .addNode("tools", new ToolNode([webSearchTool]), { retryPolicy: RETRY_OPTIONS })
  .addConditionalEdges(START, entryRouter, ["ingest", "retrieve"])
  .addEdge("ingest", END)
  .addConditionalEdges("retrieve", decideRoute, ["answer", "agent"])
  .addEdge("answer", END)
  .addConditionalEdges("agent", agentShouldContinue, ["tools", END])
  .addEdge("tools", "agent");

export const appGraph = graph.compile({ checkpointer, cache: new InMemoryCache() });
