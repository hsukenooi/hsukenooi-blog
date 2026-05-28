import { Link, Section } from "@react-email/components";

const SITE_URL = "https://hsukenooi.com";

export function Header() {
  return (
    <Section
      style={{
        marginBottom: "32px",
        paddingBottom: "20px",
      }}
    >
      <Link
        href={SITE_URL}
        style={{
          color: "#1a1a1a",
          textDecoration: "none",
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: "17px",
          fontWeight: "700",
        }}
      >
        Hsu Ken Ooi
      </Link>
    </Section>
  );
}
