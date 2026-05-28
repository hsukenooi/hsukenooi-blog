import "dotenv/config";
import { Resend } from "resend";
import { z } from "zod";
import { compose } from "../src/lib/email/compose.js";

const GRACE_SECONDS = 60;

function parseArgs() {
  const args = process.argv.slice(2);
  let path: string | undefined;
  let at: string | undefined;
  let draft = false;
  let testTo: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--at" && args[i + 1]) {
      at = args[++i];
    } else if (args[i] === "--draft") {
      draft = true;
    } else if (args[i] === "--test-to" && args[i + 1]) {
      testTo = args[++i];
    } else if (!args[i].startsWith("--")) {
      path = args[i];
    }
  }

  return { path, at, draft, testTo };
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required env var: ${name} — set it in .env`);
    process.exit(1);
  }
  return val;
}

const isoWithOffset = z.string().datetime({ offset: true });

function resolveScheduledAt(
  fromFrontmatter: string | undefined,
  fromFlag: string | undefined
): string | undefined {
  const raw = fromFlag ?? fromFrontmatter;
  if (!raw) return undefined;

  const parsed = isoWithOffset.safeParse(raw);
  if (!parsed.success) {
    console.error(
      `Invalid scheduledAt: "${raw}"\n` +
        "Must be a timezone-explicit ISO 8601 string (e.g. 2026-06-01T13:00:00Z or 2026-06-01T09:00:00-04:00)"
    );
    process.exit(1);
  }

  const scheduledDate = new Date(raw);
  const deltaSeconds = (scheduledDate.getTime() - Date.now()) / 1000;

  if (deltaSeconds < -GRACE_SECONDS) {
    console.error(
      `scheduledAt is ${Math.abs(Math.round(deltaSeconds))}s in the past (grace window is ${GRACE_SECONDS}s). Aborting.`
    );
    process.exit(1);
  }

  const utcString = scheduledDate.toUTCString();
  const deltaMin = Math.round(deltaSeconds / 60);
  const deltaLabel =
    deltaSeconds <= GRACE_SECONDS
      ? "now (within grace window)"
      : `in ${deltaMin} minute${Math.abs(deltaMin) !== 1 ? "s" : ""}`;

  console.log(`Scheduled at: ${utcString} (${deltaLabel})`);
  // Within grace window → send now (no scheduledAt)
  return deltaSeconds <= GRACE_SECONDS ? undefined : raw;
}

async function main() {
  const { path, at, draft, testTo } = parseArgs();

  if (!path) {
    console.error(
      "Usage: npm run send -- <path-to-newsletter.md> [--at <ISO>] [--draft] [--test-to <email>]"
    );
    process.exit(1);
  }

  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("NEWSLETTER_FROM");
  const segmentId = requireEnv("RESEND_SEGMENT_ID");
  const topicId = requireEnv("RESEND_TOPIC_ID");

  const { subject, scheduledAt: frontmatterScheduledAt, html, text, slug } =
    await compose(path);

  const resend = new Resend(apiKey);

  // --test-to: transactional send, bypasses the segment
  if (testTo) {
    console.log(
      "Note: {{{RESEND_UNSUBSCRIBE_URL}}} will appear literally in test emails — this is expected."
    );
    const { data, error } = await resend.emails.send({
      from,
      to: testTo,
      subject: `[TEST] ${subject}`,
      html,
      text,
    });
    if (error) {
      console.error("Send failed:", JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log(`Test email sent to ${testTo} — id: ${data?.id}`);
    return;
  }

  // --draft: create without sending (send: false)
  if (draft) {
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      topicId,
      from,
      subject,
      html,
      text,
      name: slug,
      send: false,
    });
    if (error) {
      console.error("Create failed:", JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log(`Draft broadcast created — id: ${data?.id}`);
    console.log(`Review and send at: https://resend.com/broadcasts/${data?.id}`);
    return;
  }

  // Default: schedule or send immediately (send: true)
  const resolvedScheduledAt = resolveScheduledAt(frontmatterScheduledAt, at);

  if (resolvedScheduledAt) {
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      topicId,
      from,
      subject,
      html,
      text,
      name: slug,
      send: true,
      scheduledAt: resolvedScheduledAt,
    });
    if (error) {
      console.error("Schedule failed:", JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log(`Broadcast scheduled — id: ${data?.id}`);
  } else {
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      topicId,
      from,
      subject,
      html,
      text,
      name: slug,
      send: true,
    });
    if (error) {
      console.error("Send failed:", JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log(`Broadcast sent — id: ${data?.id}`);
  }
}

main();
