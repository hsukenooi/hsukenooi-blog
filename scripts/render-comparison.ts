import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import matter from "gray-matter";
import { createElement } from "react";
import { render } from "@react-email/render";
import Newsletter from "../emails/Newsletter.js";
import { renderMarkdownToEmailHtml } from "../src/lib/email/render-markdown.js";

const SITE_URL = "https://hsukenooi.com";
const OUT = resolve(".context/email-fixtures");

const INTRO_MD = `Hi,

A quick note before this issue's piece — I've been thinking about the difference between *slope* and *position* when evaluating startups, and a few of you wrote in with sharp pushback after my last essay. The pushback mostly came down to whether slope is even legible at the seed stage. I think it is, and the rest of this issue is my attempt to show why.

**This issue:** a refresh of [Invest in Slope](${SITE_URL}/posts/the-importance-of-slope), now with the new chart, plus a short follow-up.`;

const INTER_STACK = "Inter, Helvetica Neue, Arial, sans-serif";

function swapHeadingsAndHeaderToInter(html: string): string {
  let out = html;
  // PostBody injects <style>...</style> with rules like ".post-body h1 { font-family: Georgia, serif; ..."
  // Swap heading font-family declarations only inside the .post-body h{1-4} rules.
  out = out.replace(
    /(\.post-body h[1-4]\s*\{[^}]*font-family:\s*)Georgia,\s*serif/g,
    `$1${INTER_STACK}`,
  );
  // Header.tsx inlines the "Hsu Ken Ooi" link with font-family:Georgia, serif. There's exactly one such anchor.
  out = out.replace(
    /(href="https:\/\/hsukenooi\.com"[^>]*style="[^"]*?font-family:)Georgia, serif/,
    `$1${INTER_STACK}`,
  );
  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const introHtml = await renderMarkdownToEmailHtml(INTRO_MD, SITE_URL);
  const slug = "should-you-stop-working-on-your-startup";
  const postRaw = readFileSync(
    resolve("src/content/blog", `${slug}.md`),
    "utf-8",
  );
  const { data: postData, content: postMd } = matter(postRaw);
  const postTitle = (postData.title as string | undefined) ?? slug;
  const bodyHtml = await renderMarkdownToEmailHtml(postMd, SITE_URL);
  const postHtml = `<h1>${postTitle}</h1>\n${bodyHtml}`;

  const el = createElement(Newsletter, {
    preheader: postTitle,
    introHtml,
    postHtml,
  });
  const georgiaHtml = await render(el);
  const interHtml = swapHeadingsAndHeaderToInter(georgiaHtml);
  // Third variant: inter headings + inter site name, body uses Lora (matches blog's prose-p:font-serif)
  const interLoraHtml = interHtml.replace(
    /font-family:\s*Georgia,\s*serif/g,
    "font-family: Lora, Georgia, serif",
  );

  writeFileSync(join(OUT, "compare-georgia.html"), georgiaHtml);
  writeFileSync(join(OUT, "compare-inter-headings.html"), interHtml);
  writeFileSync(join(OUT, "compare-inter-lora.html"), interLoraHtml);

  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Compare typography variants</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #eee; color: #333; }
    .bar { padding: 10px 16px; background: #fff; border-bottom: 1px solid #ddd; display: flex; gap: 24px; font-size: 13px; }
    .bar strong { font-weight: 600; }
    .pair { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ddd; height: calc(100% - 41px); }
    .pane { background: #fff; display: flex; flex-direction: column; min-width: 0; }
    .pane h3 { margin: 0; padding: 8px 12px; font: 600 11px -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; letter-spacing: 0.05em; color: #666; background: #fafafa; border-bottom: 1px solid #eee; }
    iframe { flex: 1; width: 100%; border: 0; }
  </style>
</head>
<body>
  <div class="bar">
    <span><strong>Compare typography:</strong> three variants of the same newsletter</span>
    <span>Post: <strong>${postTitle}</strong></span>
  </div>
  <div class="pair">
    <div class="pane">
      <h3>A — Georgia (current)</h3>
      <iframe src="compare-georgia.html"></iframe>
    </div>
    <div class="pane">
      <h3>B — Inter headings + Georgia body</h3>
      <iframe src="compare-inter-headings.html"></iframe>
    </div>
    <div class="pane">
      <h3>C — Inter headings + Lora body (site parity)</h3>
      <iframe src="compare-inter-lora.html"></iframe>
    </div>
  </div>
</body>
</html>`;
  writeFileSync(join(OUT, "compare.html"), page);
  console.log(`Wrote comparison: ${join(OUT, "compare.html")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
