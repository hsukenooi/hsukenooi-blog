import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Hsu Ken Ooi",
  EMAIL: "hsukenooi@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 12,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Astro Nano is a minimal and lightweight blog and portfolio.",
};

export const BLOG: Metadata = {
  TITLE: "Posts",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
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
