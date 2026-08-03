import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let model;
export function getModel() {
  if (!model) {
    model = new ChatGoogleGenerativeAI({
      model: CHAT_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
      streaming: true,
    });
  }
  return model;
}
