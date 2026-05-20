import { readFileSync } from "fs";
import { resolve, join } from "path";
import matter from "gray-matter";
import { createElement } from "react";
import { render } from "@react-email/render";
import { z } from "zod";
import { renderMarkdownToEmailHtml } from "./render-markdown.js";
import Newsletter from "../../../emails/Newsletter.js";

const SITE_URL = "https://hsukenooi.com";

const frontmatterSchema = z.object({
  subject: z.string(),
  preheader: z.string(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  postSlug: z.string().optional(),
});

export interface ComposeResult {
  subject: string;
  preheader: string;
  scheduledAt: string | undefined;
  html: string;
  text: string;
  slug: string;
}

export async function compose(newsletterPath: string): Promise<ComposeResult> {
  const raw = readFileSync(newsletterPath, "utf-8");
  const { data, content: introMarkdown } = matter(raw);

  const frontmatter = frontmatterSchema.parse(data);
  const { subject, preheader, scheduledAt, postSlug } = frontmatter;

  // Slug derived from filename (e.g. "2026-06-01-intro.md" → "2026-06-01-intro")
  const slug = newsletterPath.split("/").pop()!.replace(/\.md$/, "");

  const introHtml = await renderMarkdownToEmailHtml(introMarkdown, SITE_URL);

  let postHtml: string | undefined;
  if (postSlug) {
    const postPath = resolve(join("src", "content", "blog", postSlug, "index.md"));
    const postRaw = readFileSync(postPath, "utf-8");
    const { data: postData, content: postMarkdown } = matter(postRaw);
    const postTitle = (postData.title as string | undefined) ?? "";

    const bodyHtml = await renderMarkdownToEmailHtml(postMarkdown, SITE_URL);
    postHtml = postTitle ? `<h1>${postTitle}</h1>\n${bodyHtml}` : bodyHtml;
  }

  const element = createElement(Newsletter, { preheader, introHtml, postHtml });
  const html = await render(element);
  const text = await render(element, { plainText: true });

  return { subject, preheader, scheduledAt, html, text, slug };
}
