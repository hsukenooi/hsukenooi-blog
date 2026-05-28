import { Link, Section, Text } from "@react-email/components";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";

const SITE_URL = "https://hsukenooi.com";

const bodyStyle = {
  fontSize: "17px" as const,
  lineHeight: "1.4",
  color: "#1a1a1a",
  fontFamily: "Lora, Georgia, serif",
  margin: "0 0 1em" as const,
};

const listStyle = {
  fontSize: "17px" as const,
  lineHeight: "1.4",
  color: "#1a1a1a",
  fontFamily: "Lora, Georgia, serif",
  margin: "0 0 1em" as const,
  paddingLeft: "24px" as const,
};

const linkStyle = {
  color: "#005a9c" as const,
  textDecoration: "underline" as const,
};

const startHerePosts = [
  {
    title: "Invest in Slope",
    href: `${SITE_URL}/posts/the-importance-of-slope`,
  },
  {
    title: "Should You Stop Working on Your Startup?",
    href: `${SITE_URL}/posts/should-you-stop-working-on-your-startup`,
  },
  {
    title: "Is Your Startup Solving an Important Problem?",
    href: `${SITE_URL}/posts/is-your-startup-solving-an-important-problem`,
  },
];

export default function Welcome() {
  return (
    <Layout preheader="New essays from hsukenooi.com, mostly about startups and occasionally about other things.">
      <Header />
      <Section>
        <Text style={bodyStyle}>Hi,</Text>
        <Text style={bodyStyle}>Thanks for subscribing.</Text>
        <Text style={bodyStyle}>
          You&apos;ll get new essays from hsukenooi.com, mostly about startups and occasionally about other things.
        </Text>
        <Text style={bodyStyle}>If you want somewhere to start:</Text>
        <ul style={listStyle}>
          {startHerePosts.map((post) => (
            <li key={post.href}>
              <Link href={post.href} style={linkStyle}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
        <Text style={bodyStyle}>Reply anytime, it comes to my inbox.</Text>
      </Section>
      <Footer transactional />
    </Layout>
  );
}
