import { fetchTranscript } from "youtube-transcript-plus";
import { Innertube } from "youtubei.js";

const RE_ID = /^[\w-]{11}$/;
const RE_YT =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;

export function extractVideoId(input) {
  const s = String(input || "").trim();
  if (RE_ID.test(s)) return s;
  const m = s.match(RE_YT);
  if (m) return m[1];
  const v = s.match(/[?&]v=([\w-]{11})/);
  if (v) return v[1];
  throw new Error(`Not a valid YouTube URL or video id: ${input}`);
}

let client;
async function getClient() {
  if (!client) client = await Innertube.create({ retrieve_player: false });
  return client;
}

function joinParts(parts) {
  return (parts || [])
    .map((p) => p.text || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getMeta(videoId) {
  try {
    const yt = await getClient();
    const info = await yt.getInfo(videoId);
    const b = info.basic_info || {};
    return {
      title: b.title || "YouTube video",
      author: b.author || b.channel?.name || "",
      description: b.short_description || "",
    };
  } catch (err) {
    console.warn(`Could not fetch metadata for ${videoId}:`, err.message);
    return { title: "YouTube video", author: "", description: "" };
  }
}

async function fetchTranscriptText(videoId) {
  try {
    const text = joinParts(await fetchTranscript(videoId, { lang: "en" }));
    if (text) return text;
  } catch (err) {
    console.warn(`English transcript failed for ${videoId}, trying default:`, err.message);
  }
  try {
    const text = joinParts(await fetchTranscript(videoId));
    if (text) return text;
  } catch (err) {
    console.warn(`Default transcript failed for ${videoId}, trying InnerTube:`, err.message);
  }
  try {
    const yt = await getClient();
    const info = await yt.getInfo(videoId);
    const data = await info.getTranscript();
    const segments = data?.transcript?.content?.body?.initial_segments || [];
    const text = joinParts(segments.map((s) => ({ text: s.snippet?.text })));
    if (text) return text;
  } catch (err) {
    console.warn(`InnerTube transcript failed for ${videoId}:`, err.message);
  }
  throw new Error("This video has no usable transcript/captions.");
}

export async function getTranscript(urlOrId) {
  const videoId = extractVideoId(urlOrId);
  const [meta, transcript] = await Promise.all([getMeta(videoId), fetchTranscriptText(videoId)]);
  return { videoId, ...meta, transcript };
}
