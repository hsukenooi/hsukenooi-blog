import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const ALLOWED_ORIGIN = "https://hsukenooi.com";

const bodySchema = z.object({
  reason: z.enum(["turnstile_error", "turnstile_expired", "turnstile_timeout", "turnstile_watchdog"]),
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

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return uniformOk();
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return uniformOk();
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  log("client_error", { reason: parsed.data.reason, ip });

  return uniformOk();
};
