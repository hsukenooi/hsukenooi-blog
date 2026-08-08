import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";
import { SITE } from "@consts";

// BUI-683: per-post OG images, generated at build time. Minimal black/white
// design matching the site (near-white bg, black Inter text, name as the
// attribution line). Long titles wrap via astro-og-canvas's paragraph layout.

const posts = await getCollection("blog", (post) => !post.data.draft);
const pages = Object.fromEntries(posts.map((post) => [post.slug, post.data]));

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: SITE.NAME,
    bgGradient: [[245, 245, 244]],
    padding: 80,
    font: {
      title: {
        color: [0, 0, 0],
        size: 60,
        lineHeight: 1.2,
        weight: "SemiBold",
        families: ["Inter"],
      },
      description: {
        color: [140, 140, 138],
        size: 28,
        lineHeight: 1.3,
        weight: "Normal",
        families: ["Inter"],
      },
    },
    fonts: [
      "./src/assets/og-fonts/inter-400.ttf",
      "./src/assets/og-fonts/inter-600.ttf",
    ],
  }),
});
