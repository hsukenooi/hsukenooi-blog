import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

interface AbsolutizeOptions {
  siteUrl: string;
}

const absolutizeAndInline: Plugin<[AbsolutizeOptions], Root> = ({ siteUrl }) => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      for (const attr of ["href", "src"] as const) {
        const value = node.properties?.[attr];
        if (typeof value !== "string") continue;
        // Rewrite relative and root-absolute URLs; leave fully-qualified untouched
        if (value.startsWith("/") || (value.startsWith(".") && !value.startsWith(".//"))) {
          try {
            node.properties[attr] = new URL(value, siteUrl).href;
          } catch {
            // malformed — leave as-is
          }
        }
      }

      if (node.tagName === "img") {
        const existing = typeof node.properties?.style === "string" ? node.properties.style : "";
        const base = "max-width:100%;height:auto;";
        node.properties.style = existing
          ? `${existing.replace(/;?\s*$/, "")};${base}`
          : base;
      }
    });
  };
};

export async function renderMarkdownToEmailHtml(
  md: string,
  siteUrl: string
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(absolutizeAndInline, { siteUrl })
    .use(rehypeStringify)
    .process(md);

  return String(file);
}
