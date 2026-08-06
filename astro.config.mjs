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

const redirects = {
  ...Object.fromEntries(
    ghostPostSlugs.map((slug) => [`/${slug}`, `/posts/${slug}`]),
  ),

  // Posts whose Ghost slug differs from the one they ship under today.
  "/untitled": "/posts/starting-iterative",
  "/making-your-first-technical-hire":
    "/posts/what-to-look-for-in-your-first-technical-hire",
  // Never migrated off Ghost — the writing only survives as a LinkedIn post,
  // so send readers to the index rather than a dead end.
  "/how-to-engineer-investor-fomo": "/posts",

  // Ghost's index and feed URLs.
  "/archive": "/posts",
  "/author/hsu": "/about",
  "/author/hsu-ken-ooi": "/about",
  "/blog/rss": "/rss.xml",
  "/feed": "/rss.xml",
  "/feed.xml": "/rss.xml",
  "/index.xml": "/rss.xml",
  "/atom.xml": "/rss.xml",
  "/feeds/all.atom.xml": "/rss.xml",

  // The short-lived /blog/ structure between Ghost and today.
  "/blog": "/posts",
  "/blog/[...slug]": "/posts/[...slug]",
};

export default defineConfig({
  site: "https://hsukenooi.com",
  output: "static",
  trailingSlash: "never",
  adapter: vercel(),
  redirects,
  integrations: [mdx(), sitemap(), tailwind()],
});
