import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation,
  videoUrl: Annotation,
  videoId: Annotation,
  title: Annotation,
  overview: Annotation,
  chunks: Annotation,
  vectors: Annotation,
  contextText: Annotation,
  route: Annotation,
});
