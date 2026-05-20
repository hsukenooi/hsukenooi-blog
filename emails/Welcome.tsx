import { Section, Text } from "@react-email/components";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";

const bodyStyle = {
  fontSize: "16px" as const,
  lineHeight: "1.7",
  color: "#1a1a1a",
  fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
  margin: "0 0 16px" as const,
};

export default function Welcome() {
  return (
    <Layout preheader="TBD_COPY_WELCOME_PREHEADER">
      <Header />
      <Section>
        <Text style={bodyStyle}>TBD_COPY_WELCOME_BODY_OPENING</Text>
        <Text style={bodyStyle}>TBD_COPY_WELCOME_BODY_WHAT_TO_EXPECT</Text>
        <Text style={bodyStyle}>TBD_COPY_WELCOME_BODY_CLOSING</Text>
      </Section>
      <Footer transactional />
    </Layout>
  );
}
