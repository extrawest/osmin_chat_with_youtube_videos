export function entryRouter(state) {
  return state.mode === "ingest" ? "ingest" : "retrieve";
}
