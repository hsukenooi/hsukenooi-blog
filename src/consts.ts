import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Hsu Ken Ooi",
  EMAIL: "hsukenooi@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 12,
};

export const HOME: Metadata = {
  TITLE: "Hsu Ken Ooi — Co-Founder & Managing Partner at Iterative",
  DESCRIPTION: "Essays on startups, AI, and product from Hsu Ken Ooi, Co-Founder & Managing Partner at Iterative.",
};

export const BLOG: Metadata = {
  TITLE: "Posts",
  DESCRIPTION: "Essays on startups, AI, and product from Hsu Ken Ooi.",
};

export const SOCIALS: Socials = [
  {
    NAME: "twitter-x",
    HREF: "https://x.com/hsukenooi",
  },
  {
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/hsukenooi",
  },
  {
    NAME: "github",
    HREF: "https://github.com/hsukenooi"
  },
];
