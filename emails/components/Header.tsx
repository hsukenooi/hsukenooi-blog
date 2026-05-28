import { Link, Section } from "@react-email/components";

const SITE_URL = "https://hsukenooi.com";

export function Header() {
  return (
    <Section
      style={{
        borderBottom: "1px solid #e5e3df",
        marginBottom: "32px",
        paddingBottom: "16px",
      }}
    >
      <Link
        href={SITE_URL}
        style={{
          color: "#1a1a1a",
          textDecoration: "none",
          fontFamily: "Lora, Georgia, serif",
          fontSize: "20px",
          fontWeight: "600",
        }}
      >
        Hsu Ken Ooi
      </Link>
    </Section>
  );
}
