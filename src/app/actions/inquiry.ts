"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { LIMITS, clientIp, rateLimit } from "@/lib/rateLimit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { inquiryEmailHtml } from "@/lib/email-layout";

export type InquiryState = { error?: string; ok?: string } | undefined;

const schema = z.object({
  topic: z.enum(["CONTACT", "NEWSLETTER", "PRO", "VOLUME", "AFFILIATE", "EVENTS", "INTEGRATIONS"]),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
  body: z.string().trim().optional().default(""),
});

/** Shared handler for the contact form, newsletter box and program applications. */
export async function submitInquiry(_: InquiryState, formData: FormData): Promise<InquiryState> {
  const rl = rateLimit(`inquiry:${await clientIp()}`, LIMITS.inquiry.max, LIMITS.inquiry.windowMs);
  if (!rl.ok) return { error: rl.message };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const inquiry = await db.inquiry.create({ data: parsed.data });
  if (emailConfigured() && process.env.EMAIL_TO) {
    try {
      await sendEmail({
        to: process.env.EMAIL_TO,
        replyTo: parsed.data.email,
        subject: `PalletPort: new ${parsed.data.topic.toLowerCase()} inquiry`,
        text: `Topic: ${parsed.data.topic}\nName: ${parsed.data.name}\nEmail: ${parsed.data.email}\nCompany: ${parsed.data.company}\n\n${parsed.data.body}`,
        html: inquiryEmailHtml({ topic: parsed.data.topic, name: parsed.data.name, email: parsed.data.email, company: parsed.data.company, body: parsed.data.body }),
        idempotencyKey: `inquiry/${inquiry.id}`,
      });
    } catch { console.warn("Inquiry saved, but its email notification could not be sent."); }
  }
  return {
    ok: parsed.data.topic === "NEWSLETTER" ? "You're on the list. Watch your inbox on Mondays." : "Thanks — we'll be in touch within one business day.",
  };
}
