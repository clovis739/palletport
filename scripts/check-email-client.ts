import assert from "node:assert/strict";
import { sendEmail, emailConfigurationIssues } from "../src/lib/email-client";

async function main() {
  process.env.RESEND_API_KEY = "re_test_placeholder";
  process.env.EMAIL_FROM = "PalletPort <orders@example.com>";
  process.env.EMAIL_TO = "example.com";
  process.env.APP_URL = "https://example.com";
  assert(emailConfigurationIssues().some((issue) => issue.startsWith("EMAIL_TO")));
  process.env.EMAIL_TO = "team@example.com";
  assert.deepEqual(emailConfigurationIssues(), []);
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options?.method, "POST");
    const payload = JSON.parse(String(options?.body));
    assert.deepEqual(payload.to, ["team@example.com"]);
    assert.equal(payload.reply_to, "buyer@example.com");
    assert.equal(payload.from, process.env.EMAIL_FROM);
    assert.equal((options?.headers as Record<string, string>).Authorization, "Bearer re_test_placeholder");
    return new Response(JSON.stringify({ id: "test-message-id" }), { status: 200 });
  };
  const message = { to: "team@example.com", subject: "Test", text: "Test", replyTo: "buyer@example.com" };
  assert.equal(await sendEmail(message), "test-message-id");
  await assert.rejects(sendEmail({ ...message, to: "example.com" }), /address is invalid/);
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "private provider details" }), { status: 403 });
  await assert.rejects(sendEmail(message), /^Error: Email provider rejected the request \(403\)$/);
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendEmail(message), /Email is not configured/);
  console.log("Email request and failure handling checks passed. No emails sent.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
