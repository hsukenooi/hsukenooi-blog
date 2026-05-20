import { readFileSync } from "fs";
import { Resend } from "resend";

const RATE_DELAY_MS = 110; // ~9 req/sec, safely under Resend's 10 req/sec limit

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let file: string | undefined;
  let consentConfirmed = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      file = args[++i];
    } else if (args[i] === "--consent-confirmed") {
      consentConfirmed = true;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { file, consentConfirmed, dryRun };
}

function parseEmailFile(filePath: string): string[] {
  const raw = readFileSync(filePath, "utf-8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const { file, consentConfirmed, dryRun } = parseArgs();

  if (!file) {
    console.error("Usage: npm run import-subscribers -- --file <path> --consent-confirmed [--dry-run]");
    process.exit(1);
  }

  if (!dryRun && !consentConfirmed) {
    console.error(
      "Error: --consent-confirmed is required for live imports.\n" +
      "This flag asserts that every address in the file represents a prior opt-in.\n" +
      "Use --dry-run to preview without importing."
    );
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!dryRun) {
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY — set it in .env");
      process.exit(1);
    }
    if (!audienceId) {
      console.error("Missing RESEND_AUDIENCE_ID — set it in .env");
      process.exit(1);
    }
  }

  let emails: string[];
  try {
    emails = parseEmailFile(file);
  } catch {
    console.error(`Could not read file: ${file}`);
    process.exit(1);
  }

  if (emails.length === 0) {
    console.log("No emails found in file (after stripping comments and blank lines).");
    process.exit(0);
  }

  if (dryRun) {
    const valid = emails.filter(isValidEmail);
    const invalid = emails.filter((e) => !isValidEmail(e));
    console.log(`Dry run — ${valid.length} valid email(s) would be imported:`);
    valid.slice(0, 5).forEach((e) => console.log(`  ${e}`));
    if (valid.length > 5) console.log(`  ... and ${valid.length - 5} more`);
    if (invalid.length > 0) {
      console.log(`\n${invalid.length} invalid email(s) would be skipped:`);
      invalid.forEach((e) => console.log(`  ${e}`));
    }
    return;
  }

  const resend = new Resend(apiKey!);
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const email of emails) {
    if (!isValidEmail(email)) {
      console.error(`  [FAIL] Invalid email format: ${email}`);
      failed++;
      continue;
    }

    try {
      const { error } = await resend.contacts.create({
        email,
        audienceId: audienceId!,
        unsubscribed: false,
      });

      if (error) {
        const isAlreadyExists =
          (error as { name?: string; message?: string }).name === "validation_error" &&
          (error as { name?: string; message?: string }).message?.includes("already exists");

        if (isAlreadyExists) {
          skipped++;
        } else {
          console.error(`  [FAIL] ${email}: ${JSON.stringify(error)}`);
          failed++;
        }
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${email}: ${String(err)}`);
      failed++;
    }

    await sleep(RATE_DELAY_MS);
  }

  console.log(`\nImported ${imported}, skipped ${skipped} (already exists), failed ${failed} (see log above).`);
}

main();
