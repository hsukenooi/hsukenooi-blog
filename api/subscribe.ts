import { Resend } from "resend";
import { z } from "zod";
import { createElement } from "react";
import { render } from "@react-email/render";
import Welcome from "../emails/Welcome.js";

const ALLOWED_ORIGIN = "https://hsukenooi.com";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const resend = new Resend(process.env.RESEND_API_KEY!);

const bodySchema = z.object({
  email: z.string().email().max(254),
  "cf-turnstile-response": z.string(),
  company: z.string().optional(), // honeypot
});

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function uniformOk(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function log(failure_class: string, detail?: unknown) {
  console.log(JSON.stringify({ failure_class, detail }));
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request): Promise<Response> {
  // CORS origin check
  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    log("cors_rejected", { origin });
    return new Response(JSON.stringify({ ok: true }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    log("parse_error");
    return uniformOk();
  }

  // Validate
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    log("validation_error", parsed.error.flatten());
    return uniformOk();
  }

  const { email, "cf-turnstile-response": turnstileToken, company } = parsed.data;

  // Honeypot
  if (company) {
    log("honeypot", { email });
    return uniformOk();
  }

  // Log IP for observability
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Turnstile verification
  const turnstileRes = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: turnstileToken,
      remoteip: ip,
    }),
  });
  const turnstileData = (await turnstileRes.json()) as {
    success: boolean;
    action?: string;
  };

  if (!turnstileData.success || turnstileData.action !== "newsletter-subscribe") {
    log("turnstile_failed", { email, action: turnstileData.action });
    return uniformOk();
  }

  // Create contact
  const { error: contactError } = await resend.contacts.create({
    email,
    audienceId: process.env.RESEND_AUDIENCE_ID!,
    unsubscribed: false,
  });

  const isDuplicate =
    contactError &&
    (contactError as { name?: string; message?: string }).name === "validation_error" &&
    (contactError as { name?: string; message?: string }).message?.includes("already exists");

  if (contactError && !isDuplicate) {
    log("resend_contact_error", { email, error: contactError });
    return uniformOk();
  }

  if (isDuplicate) {
    log("duplicate", { email });
    return uniformOk();
  }

  // Send welcome email
  const welcomeHtml = await render(createElement(Welcome));
  const { error: emailError } = await resend.emails.send({
    from: process.env.NEWSLETTER_FROM!,
    to: email,
    subject: "TBD_COPY_WELCOME_SUBJECT",
    html: welcomeHtml,
  });

  if (emailError) {
    log("resend_email_error", { email, error: emailError });
  }

  return uniformOk();
}
