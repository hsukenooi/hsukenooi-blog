import type { APIRoute } from "astro";
import { Resend } from "resend";
import { verifyUnsubscribeToken } from "../../lib/unsubscribe-token.js";

export const prerender = false;

const resend = new Resend(process.env.RESEND_API_KEY!);

function log(failure_class: string, detail?: unknown) {
  console.log(JSON.stringify({ failure_class, detail }));
}

async function unsubscribe(email: string, token: string): Promise<"ok" | "invalid" | "error"> {
  if (!email || !token) return "invalid";
  if (!verifyUnsubscribeToken(email, token)) return "invalid";

  const { error } = await resend.contacts.update({ email, unsubscribed: true });
  if (error) {
    log("resend_unsubscribe_error", { email, error });
    return "error";
  }
  return "ok";
}

function htmlPage(title: string, body: string, status: number): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Inter,Helvetica Neue,Arial,sans-serif;max-width:520px;margin:80px auto;padding:0 20px;color:#1a1a1a;line-height:1.5}h1{font-size:20px;margin:0 0 12px}p{color:#6b6b6b;margin:0}</style></head><body><h1>${title}</h1><p>${body}</p></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get("email") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const result = await unsubscribe(email, token);

  if (result === "invalid") {
    return htmlPage(
      "Invalid Unsubscribe Link",
      "This unsubscribe link is invalid or has expired. Reply to any newsletter email and we'll remove you manually.",
      400,
    );
  }
  if (result === "error") {
    return htmlPage(
      "Something Went Wrong",
      "We couldn't process your unsubscribe right now. Reply to any newsletter email and we'll remove you manually.",
      500,
    );
  }
  return htmlPage(
    "Unsubscribed",
    "You've been unsubscribed from the newsletter. You won't receive further emails.",
    200,
  );
};

export const POST: APIRoute = async ({ url, request }) => {
  let email = url.searchParams.get("email") ?? "";
  let token = url.searchParams.get("token") ?? "";

  // RFC 8058 one-click also allows the URL params to be in the body
  if (!email || !token) {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = new URLSearchParams(await request.text());
        email = email || form.get("email") || "";
        token = token || form.get("token") || "";
      }
    } catch {
      // fall through to invalid
    }
  }

  const result = await unsubscribe(email, token);

  if (result === "invalid") return new Response(null, { status: 400 });
  if (result === "error") return new Response(null, { status: 500 });
  return new Response(null, { status: 200 });
};
