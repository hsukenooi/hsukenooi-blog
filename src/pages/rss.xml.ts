import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

const SITE_URL = "https://hsukenooi.com";

type Context = {
  site: string
}

// Rewrite root-relative and relative hrefs/srcs to absolute URLs so the
// rendered content reads correctly in feed readers, which have no notion
// of the site's own base URL.
const absolutizeUrls: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      for (const attr of ["href", "src"] as const) {
        const value = node.properties?.[attr];
        if (typeof value !== "string") continue;
        if (value.startsWith("/") || (value.startsWith(".") && !value.startsWith(".//"))) {
          try {
            node.properties[attr] = new URL(value, SITE_URL).href;
          } catch {
            // malformed — leave as-is
          }
        }
      }
    });
  };
};

async function renderPostContent(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(absolutizeUrls)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

export async function GET(context: Context) {
  const blog = (await getCollection("blog"))
  .filter(post => !post.data.draft);

  const items = [...blog]
    .sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf());

  return rss({
    title: "Hsu Ken Ooi",
    description: "Essays on startups, AI, and product from Hsu Ken Ooi, Co-Founder & Managing Partner at Iterative.",
    site: context.site,
    trailingSlash: false,
    items: await Promise.all(items.map(async (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.slug}`,
      content: await renderPostContent(post.body ?? ""),
    }))),
  });
}
