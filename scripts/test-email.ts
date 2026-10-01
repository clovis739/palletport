import { emailConfigured, emailConfigurationIssues, sendEmail } from "../src/lib/email-client";

async function main() {
  const configured = {
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY?.trim()),
    EMAIL_FROM: Boolean(process.env.EMAIL_FROM?.trim()),
    EMAIL_TO: Boolean(process.env.EMAIL_TO?.trim()),
    APP_URL: Boolean(process.env.APP_URL?.trim()),
  };
  console.log("Email configuration:", configured);
  const issues = emailConfigurationIssues();
  if (issues.length) throw new Error(issues.join("\n"));
  if (!process.argv.includes("--send")) return;
  if (!emailConfigured()) throw new Error("Add RESEND_API_KEY and EMAIL_FROM to .env first");
  const to = process.env.EMAIL_TEST_TO || process.env.EMAIL_TO;
  if (!to) throw new Error("Set EMAIL_TEST_TO or EMAIL_TO for the test recipient");
  const id = await sendEmail({ to, subject: "PalletPort email setup test", text: "Your PalletPort site is connected to Resend. This is a test email." });
  console.log(`Resend accepted the test email. Message ID: ${id}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
