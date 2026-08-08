import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SOCIALS } from "@consts";

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const socials = SOCIALS.map((social) => `- ${social.HREF}`).join("\n");

  const postList = posts
    .map((post) => {
      const url = new URL(`posts/${post.slug}`, import.meta.env.SITE).href;
      return `- [${post.data.title}](${url}): ${post.data.description}`;
    })
    .join("\n");

  const llmsTxt = `
# Hsu Ken Ooi

Hsu Ken Ooi is Co-Founder & Managing Partner at [Iterative](https://iterative.vc), an early-stage startup accelerator. He writes about startups, AI, and product, drawing on his experience building, investing in, and advising founders.

${socials}

## Posts

${postList}
`.trim();

  return new Response(llmsTxt + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
