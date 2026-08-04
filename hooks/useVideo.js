import { useState } from "react";
import { App } from "antd";
import * as api from "@/lib/api";

export function useVideo() {
  const { message } = App.useApp();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(url) {
    const clean = (url || "").trim();
    if (!clean || loading) return;
    setLoading(true);

    let ready = null;
    try {
      await api.ingestVideo(clean, (delta) => {
        if (delta.status === "ready") {
          ready = { threadId: delta.threadId, videoId: delta.videoId, title: delta.title };
        }
      });
      if (ready) setVideo(ready);
      else message.error("Could not process this video.");
    } catch (err) {
      console.error("Failed to load video:", err);
      message.error(err.message || "Could not process this video.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setVideo(null);
  }

  return { video, loading, load, reset };
}
