import { writeFileSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import matter from "gray-matter";
import { createElement } from "react";
import { render } from "@react-email/render";
import juice from "juice";
import Newsletter from "../emails/Newsletter.js";
import Welcome from "../emails/Welcome.js";
import { renderMarkdownToEmailHtml } from "../src/lib/email/render-markdown.js";

async function renderInlined(el: React.ReactElement): Promise<string> {
  const raw = await render(el);
  return juice(raw, { preserveImportant: true });
}

const SITE_URL = "https://hsukenooi.com";
const OUT = resolve(".context/email-fixtures");

const INTRO_MD = `Hi,

A quick note before this issue's piece — I've been thinking about the difference between *slope* and *position* when evaluating startups, and a few of you wrote in with sharp pushback after my last essay. The pushback mostly came down to whether slope is even legible at the seed stage. I think it is, and the rest of this issue is my attempt to show why.

**This issue:** a refresh of [Invest in Slope](${SITE_URL}/posts/the-importance-of-slope), now with the new chart, plus a short follow-up.`;

async function main() {
  mkdirSync(OUT, { recursive: true });

  const introHtml = await renderMarkdownToEmailHtml(INTRO_MD, SITE_URL);

  // Allow --post <slug> to pin a specific blog post; otherwise pick the first
  const slugFlag = process.argv.indexOf("--post");
  const requestedSlug = slugFlag >= 0 ? process.argv[slugFlag + 1] : undefined;
  const blogDir = resolve("src/content/blog");
  const candidate = requestedSlug
    ? `${requestedSlug.replace(/\.md$/, "")}.md`
    : readdirSync(blogDir).find((f) => f.endsWith(".md"));
  if (!candidate) throw new Error("no blog md");
  const postRaw = readFileSync(join(blogDir, candidate), "utf-8");
  const { data: postData, content: postMd } = matter(postRaw);
  const postTitle = (postData.title as string | undefined) ?? candidate;
  const bodyHtml = await renderMarkdownToEmailHtml(postMd, SITE_URL);
  const postHtml = `<h1>${postTitle}</h1>\n${bodyHtml}`;

  // Newsletter — intro + post
  const fullEl = createElement(Newsletter, {
    preheader: "Invest in slope: a refresh with the new chart and a follow-up.",
    introHtml,
    postHtml,
  });
  writeFileSync(join(OUT, "newsletter-full.html"), await renderInlined(fullEl));
  writeFileSync(join(OUT, "newsletter-full.txt"), await render(fullEl, { plainText: true }));

  // Newsletter — intro only (no postSlug)
  const introOnlyEl = createElement(Newsletter, {
    preheader: "A short note before the holiday.",
    introHtml,
  });
  writeFileSync(join(OUT, "newsletter-intro-only.html"), await renderInlined(introOnlyEl));
  writeFileSync(join(OUT, "newsletter-intro-only.txt"), await render(introOnlyEl, { plainText: true }));

  // Newsletter — post only (no intro)
  const postOnlyEl = createElement(Newsletter, {
    preheader: "The full post, no intro.",
    postHtml,
  });
  writeFileSync(join(OUT, "newsletter-post-only.html"), await renderInlined(postOnlyEl));
  writeFileSync(join(OUT, "newsletter-post-only.txt"), await render(postOnlyEl, { plainText: true }));

  // Welcome
  const welcomeEl = createElement(Welcome, {});
  writeFileSync(join(OUT, "welcome.html"), await renderInlined(welcomeEl));
  writeFileSync(join(OUT, "welcome.txt"), await render(welcomeEl, { plainText: true }));

  console.log(`Rendered fixtures to ${OUT}`);
  console.log(`  Post fixture: ${candidate} (title: ${postTitle})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
