function retryOn(err) {
  const status = Number(err?.status ?? err?.response?.status ?? err?.code);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || err);
  return /\b(408|429|500|502|503|504)\b|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|fetch failed|network|overloaded|unavailable|exhausted|rate limit|try again/i.test(
    msg
  );
}

export const RETRY_OPTIONS = {
  retryOn,
};
