import type { APIRoute, GetStaticPaths } from "astro";
import { type CollectionEntry, getCollection } from "astro:content";

export const getStaticPaths = (async () => {
  const posts = (await getCollection("blog")).filter(
    (post) => !post.data.draft,
  );
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post,
  }));
}) satisfies GetStaticPaths;

type Props = CollectionEntry<"blog">;

export const GET: APIRoute<Props> = async ({ props }) => {
  const post = props;
  const hasHeading = /^\s*#\s+/.test(post.body ?? "");
  const markdown = hasHeading
    ? post.body
    : `# ${post.data.title}\n\n${post.body}`;

  return new Response(markdown?.trim() + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
