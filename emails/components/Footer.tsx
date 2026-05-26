import { Link, Section, Text } from "@react-email/components";

const SITE_URL = "https://hsukenooi.com";

interface FooterProps {
  transactional?: boolean;
}

export function Footer({ transactional = false }: FooterProps) {
  return (
    <Section
      style={{
        borderTop: "1px solid #e5e3df",
        marginTop: "40px",
        paddingTop: "24px",
      }}
    >
      <Text
        style={{
          color: "#6b6b6b",
          fontSize: "13px",
          lineHeight: "1.5",
          margin: "0 0 8px",
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        }}
      >
        New essays from hsukenooi.com, mostly about startups and occasionally about other things.
      </Text>
      <Text
        style={{
          color: "#6b6b6b",
          fontSize: "13px",
          lineHeight: "1.5",
          margin: "0 0 8px",
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        }}
      >
        You&apos;re receiving this because you signed up at{" "}
        <Link
          href={SITE_URL}
          style={{ color: "#6b6b6b", textDecoration: "underline" }}
        >
          hsukenooi.com
        </Link>
        .
      </Text>
      {transactional ? (
        <Text
          style={{
            color: "#6b6b6b",
            fontSize: "13px",
            lineHeight: "1.5",
            margin: "0",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          }}
        >
          Reply to this email if you&apos;d like to unsubscribe.
        </Text>
      ) : (
        <Text
          style={{
            color: "#6b6b6b",
            fontSize: "13px",
            lineHeight: "1.5",
            margin: "0",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          }}
        >
          <Link
            href="{{{RESEND_UNSUBSCRIBE_URL}}}"
            style={{ color: "#6b6b6b", textDecoration: "underline" }}
          >
            Unsubscribe
          </Link>
        </Text>
      )}
    </Section>
  );
}
