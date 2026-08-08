import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().optional()
  }),
});

const newsletters = defineCollection({
  type: "content",
  schema: z.object({
    subject: z.string(),
    preheader: z.string(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    postSlug: z.string().optional(),
  }),
});

export const collections = { blog, newsletters };
