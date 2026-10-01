type Email = { to: string; subject: string; text: string; html?: string; replyTo?: string; idempotencyKey?: string };

export function validEmail(value: string | undefined) {
  return Boolean(value && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim()));
}

function senderAddress(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed?.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] ?? trimmed;
}

export function emailConfigurationIssues() {
  const issues: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim().startsWith("re_")) issues.push("RESEND_API_KEY must be a Resend API key");
  if (!validEmail(senderAddress(process.env.EMAIL_FROM))) issues.push("EMAIL_FROM must contain a valid sender email");
  if (!validEmail(process.env.EMAIL_TO)) issues.push("EMAIL_TO must be a complete inbox address, including @");
  try {
    const url = new URL(process.env.APP_URL || "");
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { issues.push("APP_URL must be a complete http(s) site URL"); }
  return issues;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && validEmail(senderAddress(process.env.EMAIL_FROM)));
}

/** Used by server code and the local diagnostic script; never import into client components. */
export async function sendEmail(message: Email) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) throw new Error("Email is not configured");
  if (!validEmail(senderAddress(from)) || !validEmail(message.to) || (message.replyTo && !validEmail(message.replyTo))) {
    throw new Error("Email sender or recipient address is invalid");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}), ...(message.replyTo ? { reply_to: message.replyTo } : validEmail(process.env.EMAIL_TO) ? { reply_to: process.env.EMAIL_TO?.trim() } : {}) }),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as { id?: string; name?: string };
  // Provider bodies may contain recipient details; keep them out of app errors and logs.
  if (!response.ok || !result.id) throw new Error(`Email provider rejected the request (${response.status})`);
  return result.id;
}
