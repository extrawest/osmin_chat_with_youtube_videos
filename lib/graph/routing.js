export function entryRouter(state) {
  return state.mode === "ingest" ? "ingest" : "retrieve";
}

export function decideRoute(state) {
  return state.route === "web" ? "webSearch" : "answer";
}
