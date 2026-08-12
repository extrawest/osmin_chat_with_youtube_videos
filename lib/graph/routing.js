import { END } from "@langchain/langgraph";

export function entryRouter(state) {
  return state.mode === "ingest" ? "ingest" : "retrieve";
}

export function decideRoute(state) {
  return state.route === "web" ? "agent" : "answer";
}

export function agentShouldContinue(state) {
  const last = state.messages[state.messages.length - 1];
  return last?.tool_calls?.length ? "tools" : END;
}
