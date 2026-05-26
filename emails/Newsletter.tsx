import { Section } from "@react-email/components";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { PostBody } from "./components/PostBody";

interface NewsletterProps {
  preheader: string;
  introHtml: string;
  postHtml?: string;
}

export default function Newsletter({
  preheader,
  introHtml,
  postHtml,
}: NewsletterProps) {
  return (
    <Layout preheader={preheader}>
      <Header />
      <Section dangerouslySetInnerHTML={{ __html: introHtml }} />
      {postHtml && <PostBody html={postHtml} />}
      <Footer />
    </Layout>
  );
}

Newsletter.PreviewProps = {
  preheader: "A short preview of what's inside this email.",
  introHtml: "<p>Here's what I've been thinking about lately...</p>",
  postHtml: "<h1>Example Post</h1><p>The full post content goes here.</p>",
} satisfies NewsletterProps;
