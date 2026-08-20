
export function getSessionId() {
  if (typeof window === "undefined") return null;
    const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
    return sessionId
}
