/**
 * Throwaway validation script for Unit 3 gate.
 * Renders a real blog post through the Newsletter template and sends to author.
 * Delete after Unit 4 is complete.
 *
 * Usage: npm run send -- scripts/email-render-check.ts --test-to <your-email>
 * (or directly: tsx scripts/email-render-check.ts)
 */
import { readFileSync } from "fs";
import { resolve, join } from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import Newsletter from "../emails/Newsletter.tsx";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_TO = process.argv[2] || process.env.NEWSLETTER_FROM;
const SITE_URL = "https://hsukenooi.com";

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY");
  process.exit(1);
}
if (!TEST_TO) {
  console.error("Provide a target email as first arg or set NEWSLETTER_FROM");
  process.exit(1);
}

const POST_SLUG = "invest-in-slope";
const postPath = resolve(join("src", "content", "blog", POST_SLUG, "index.md"));

let postContent: string;
try {
  postContent = readFileSync(postPath, "utf-8");
} catch {
  console.error(`Post not found at ${postPath}. Update POST_SLUG to an existing slug.`);
  process.exit(1);
}

const { content: markdown } = matter(postContent);

const postFile = await unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown);

let postHtml = String(postFile);

// Absolutize root-absolute URLs and inline img styles for email clients
postHtml = postHtml.replace(/src="(\/[^"]+)"/g, `src="${SITE_URL}$1"`);
postHtml = postHtml.replace(/href="(\/[^"]+)"/g, `href="${SITE_URL}$1"`);
postHtml = postHtml.replace(/<img /g, '<img style="max-width:100%;height:auto;" ');

const html = await render(
  createElement(Newsletter, {
    preheader: "Validating email rendering before going live.",
    introHtml: "<p>This is a validation test. The full post body appears below.</p>",
    postHtml,
  })
);

const resend = new Resend(RESEND_API_KEY);
const from = process.env.NEWSLETTER_FROM || "noreply@hsukenooi.com";

const { data, error } = await resend.emails.send({
  from,
  to: TEST_TO,
  subject: "[Gate check] Newsletter rendering test",
  html,
});

if (error) {
  console.error("Send failed:", error);
  process.exit(1);
}

console.log(`Sent to ${TEST_TO} — id: ${data?.id}`);
console.log("Inspect in Gmail AND Apple Mail. Gate passes when:");
console.log("  - Paragraphs, headings, blockquotes, code, lists, images all render");
console.log("  - Images load (absolute URLs work)");
console.log("  - Header and footer match intended design");
