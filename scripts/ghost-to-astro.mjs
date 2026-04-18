/**
 * ghost-to-astro.mjs
 *
 * Converts a Ghost JSON export to AstroNano-compatible Markdown files.
 *
 * Usage:
 *   node scripts/ghost-to-astro.mjs path/to/ghost-export.json
 *
 * Output:
 *   src/content/blog/{slug}/index.md for each published post
 */

import fs from "fs";
import path from "path";
import TurndownService from "turndown";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  // e.g. "Mar 22 2024"
}

function buildDescription(post) {
  if (post.custom_excerpt) return post.custom_excerpt.trim();
  // Fall back to first 160 chars of plain text stripped from HTML
  const plain = post.html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 160).trim();
}

function sanitizeFrontmatter(str) {
  // Escape double quotes and remove newlines
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}

// ── Main ─────────────────────────────────────────────────────────────────────

const exportPath = process.argv[2];

if (!exportPath) {
  console.error("Usage: node scripts/ghost-to-astro.mjs path/to/ghost-export.json");
  process.exit(1);
}

const raw = fs.readFileSync(exportPath, "utf-8");
const data = JSON.parse(raw);

// Ghost export structure: data.db[0].data.posts
const posts = data?.db?.[0]?.data?.posts;
if (!posts) {
  console.error("Could not find posts in export. Expected data.db[0].data.posts");
  process.exit(1);
}

const published = posts.filter((p) => p.status === "published");
console.log(`Found ${published.length} published posts (${posts.length - published.length} skipped).`);

const outDir = path.resolve("src/content/blog");

for (const post of published) {
  const slug = post.slug;
  const title = sanitizeFrontmatter(post.title || "Untitled");
  const description = sanitizeFrontmatter(buildDescription(post));
  const date = formatDate(post.published_at);
  const markdown = turndown.turndown(post.html || "");

  const frontmatter = `---\ntitle: "${title}"\ndescription: "${description}"\ndate: "${date}"\n---\n\n`;
  const content = frontmatter + markdown;

  const postDir = path.join(outDir, slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, "index.md"), content, "utf-8");
  console.log(`  ✔ ${slug}`);
}

console.log(`\nDone. Posts written to src/content/blog/`);
