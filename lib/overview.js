import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getModel } from "@/lib/llm";
import { textOf } from "@/lib/graph/messages";

const MAX_TRANSCRIPT_CHARS = 30000;

const SYSTEM = new SystemMessage(
  "You summarise a video from its transcript. Use ONLY the transcript; do not invent facts. " +
    "Reply as exactly these four labelled lines and nothing else:\n" +
    "About: <one sentence on what the video is about>\n" +
    "Speakers: <names and roles if identifiable from the transcript, else 'Not stated'>\n" +
    "Summary: <3-4 sentences>\n" +
    "Key points: <5-8 short items separated by semicolons>"
);

export async function buildOverview(title, transcript) {
  const human = new HumanMessage(`Title: ${title || "Unknown"}\n\nTranscript:\n${transcript.slice(0, MAX_TRANSCRIPT_CHARS)}`);
  return textOf(await getModel().invoke([SYSTEM, human])).trim();
}
