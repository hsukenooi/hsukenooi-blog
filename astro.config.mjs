import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

// Posts used to live at the root on Ghost (/should-you-stop-working-on-your-startup),
// then briefly under /blog/, before landing on /posts/. Both older shapes are still
// indexed and linked from elsewhere, so they permanently redirect to their new home.
// The slug list comes from the last Ghost sitemap-posts.xml capture on archive.org.
const ghostPostSlugs = [
  "5-reasons-why-office-hours-are-so-effective",
  "convincing-people-to-work-at-your-startup",
  "dogmatic-vs-scientific-founders",
  "founder-simulations",
  "how-to-think-about-product",
  "increasing-a-startups-chances-of-being-successful",
  "is-your-startup-solving-an-important-problem",
  "learnings",
  "origin-story-of-a-venture-backed-acquired-startup",
  "postmortem-of-a-venture-backed-acquired-startup",
  "should-you-continue-working-on-your-startup",
  "should-you-stop-working-on-your-startup",
  "the-3-things-we-look-for-in-founders",
  "the-5-most-common-startup-pitch-mistakes-and-what-to-do",
  "the-difference-between-bad-good-and-great-startup-engineers",
  "the-importance-of-slope",
  "top-posts-of-2023",
  "what-to-look-for-in-your-first-technical-hire",
  "whats-more-important-when-fundraising-a-strong-story-or-strong-traction",
];

// NOTE on trailing-slash twins (BUI-795): a "/x/" -> dest entry added
// alongside "/x" -> dest here is NOT viable. Verified empirically: with
// trailingSlash: "never", Astro strips the trailing slash off every
// redirect-source key before compiling it to a Vercel route regex, so "/x/"
// and "/x" both compile to the identical `^/x$` pattern. The build logs it
// as a duplicate-route "conflict" (dropping one) and warns it "will result
// in a hard error in following versions of Astro." Same result for the
// dynamic "/blog/[...slug]/" pattern: it compiles to the exact same regex as
// "/blog/[...slug]" (`^/blog(?:/(...))?$`), which structurally can never
// match a trailing slash anyway. Trailing-slash coverage for every entry
// below is instead handled in the root vercel.json (see BUI-795 there),
// which is not run through Astro's route compiler.
const redirects = {
  ...Object.fromEntries(
    ghostPostSlugs.map((slug) => [`/${slug}`, `/posts/${slug}`]),
  ),

  // Posts whose Ghost slug differs from the one they ship under today.
  "/untitled": "/posts/starting-iterative",
  "/making-your-first-technical-hire":
    "/posts/what-to-look-for-in-your-first-technical-hire",
  // BUI-795: indexed by Google at the root (pre-dates the /posts/ URL
  // structure, or a stray backlink) even though the post itself never lived
  // anywhere but /posts/.
  "/the-ai-pilled-advantage": "/posts/the-ai-pilled-advantage",
  // Never migrated off Ghost — the writing only survives as a LinkedIn post,
  // so send readers to the index rather than a dead end.
  "/how-to-engineer-investor-fomo": "/posts",
  // BUI-796: same situation as /how-to-engineer-investor-fomo above — never
  // migrated off Ghost, so send readers to the index.
  "/beginner-mistakes": "/posts",

  // Ghost's index and feed URLs.
  "/archive": "/posts",
  "/author/hsu": "/about",
  "/author/hsu-ken-ooi": "/about",
  "/blog/rss": "/rss.xml",
  // BUI-796: Ghost's actual feed URL — distinct from /blog/rss above.
  "/rss": "/rss.xml",
  "/feed": "/rss.xml",
  "/feed.xml": "/rss.xml",
  "/index.xml": "/rss.xml",
  "/atom.xml": "/rss.xml",
  "/feeds/all.atom.xml": "/rss.xml",

  // The short-lived /blog/ structure between Ghost and today.
  "/blog": "/posts",
  "/blog/[...slug]": "/posts/[...slug]",

  // BUI-796: old homepage alias.
  "/home": "/",
  // BUI-796: pre-Ghost, date-based permalink.
  "/public/2020/03/27/starting-iterative": "/posts/starting-iterative",

  // BUI-796 (optional): Ghost preview links, e.g.
  // /blog/p/a6b4faec-f4f7-412e-b7b6-3e541fae5a9f. NOT included here: Astro's
  // redirect matcher treats a single dynamic segment like [uuid] as a real
  // route requiring getStaticPaths (unlike the [...slug] rest param above),
  // so `"/blog/p/[uuid]": "/posts"` fails the build with
  // GetStaticPathsRequired (verified). Not "cleanly expressible" as an Astro
  // redirect per the ticket, so it's handled in vercel.json instead, where a
  // plain `:uuid` path segment is just a redirect rule, not a route.
};

// astro.config.mjs can't import the content collection (that API isn't available
// at config time), so to give the sitemap a lastmod per post we read each post's
// frontmatter straight off disk here and build a slug -> lastmod date map.
// gray-matter isn't a dependency, so this is a minimal hand-rolled parse of just
// the two date fields we need, rather than pulling in a full YAML parser.
function readBlogLastmods() {
  const blogDir = new URL("./src/content/blog/", import.meta.url);
  const lastmodBySlug = new Map();

  for (const filename of readdirSync(blogDir)) {
    if (!filename.endsWith(".md")) continue;

    const raw = readFileSync(new URL(filename, blogDir), "utf-8");
    const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) continue;
    const frontmatter = frontmatterMatch[1];

    const extractDate = (key) => {
      const match = frontmatter.match(
        new RegExp(`^${key}:\\s*"?(\\d{4}-\\d{2}-\\d{2})"?\\s*$`, "m"),
      );
      return match?.[1];
    };

    const pubDate = extractDate("pubDate");
    if (!pubDate) continue;
    const updatedDate = extractDate("updatedDate");

    const slug = filename.replace(/\.md$/, "");
    lastmodBySlug.set(slug, updatedDate ?? pubDate);
  }

  return lastmodBySlug;
}

const blogLastmods = readBlogLastmods();

export default defineConfig({
  site: "https://hsukenooi.com",
  output: "static",
  trailingSlash: "never",
  adapter: vercel(),
  redirects,
  integrations: [
    mdx(),
    sitemap({
      // BUI-691: keep the WIP /preview page out of the public sitemap.
      filter: (page) => page !== "https://hsukenooi.com/preview",
      // BUI-690: stamp /posts/* entries with a lastmod so crawlers can tell
      // fresh posts from stale ones.
      serialize(item) {
        const { pathname } = new URL(item.url);
        const match = pathname.match(/^\/posts\/([^/]+)$/);
        const lastmod = match && blogLastmods.get(match[1]);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    tailwind(),
  ],
});
