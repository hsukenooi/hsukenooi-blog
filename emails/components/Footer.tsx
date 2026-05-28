import { Link, Section, Text } from "@react-email/components";

const SITE_URL = "https://hsukenooi.com";
const SOCIALS = [
  { name: "twitter-x", href: "https://x.com/hsukenooi" },
  { name: "linkedin", href: "https://www.linkedin.com/in/hsukenooi" },
  { name: "github", href: "https://github.com/hsukenooi" },
];

interface FooterProps {
  transactional?: boolean;
}

const baseText = {
  color: "#1a1a1a",
  fontSize: "14px" as const,
  lineHeight: "1.4",
  fontFamily: "Lora, Georgia, serif",
};

const socialLinkStyle = {
  color: "#005a9c" as const,
  textDecoration: "underline" as const,
};

const mutedText = {
  ...baseText,
  color: "#cccccc",
};

const mutedLink = {
  color: "#cccccc" as const,
  textDecoration: "underline" as const,
};

const dividerStyle = {
  color: "#cccccc" as const,
  margin: "0 6px",
};

export function Footer({ transactional = false }: FooterProps) {
  return (
    <Section
      style={{
        borderTop: "1px solid #cccccc",
        marginTop: "4em",
        paddingTop: "1.5em",
      }}
    >
      <Text style={{ ...baseText, margin: "0 0 2em" }}>
        {SOCIALS.map((s, i) => (
          <span key={s.href}>
            <Link href={s.href} style={socialLinkStyle}>
              {s.name}
            </Link>
            {i < SOCIALS.length - 1 && <span style={dividerStyle}>/</span>}
          </span>
        ))}
      </Text>
      <Text style={{ ...mutedText, margin: "0" }}>
        You&apos;re receiving this because you signed up at{" "}
        <Link href={SITE_URL} style={mutedLink}>
          hsukenooi.com
        </Link>
        .{" "}
        {transactional ? (
          "Reply to this email to unsubscribe."
        ) : (
          <>
            <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={mutedLink}>
              Unsubscribe
            </Link>{" "}
            instantly.
          </>
        )}
      </Text>
    </Section>
  );
}
