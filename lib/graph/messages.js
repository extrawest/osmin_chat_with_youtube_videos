export function textOf(m) {
  if (!m) return "";
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    return m.content.map((c) => (typeof c === "string" ? c : c?.text || "")).join(" ");
  }
  return String(m.content ?? "");
}

export function lastUserText(messages = []) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const type = m?._getType?.() || m?.role;
    if (type === "human" || type === "user") return textOf(m);
  }
  return "";
}
