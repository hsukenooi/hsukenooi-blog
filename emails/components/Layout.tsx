import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { tokens } from "../tailwind.tokens";

interface LayoutProps {
  preheader: string;
  children: React.ReactNode;
}

export function Layout({ preheader, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: tokens.fontFamily,
              colors: tokens.colors,
            },
          },
        }}
      >
        <Body
          style={{
            backgroundColor: "#ffffff",
            fontFamily: "Lora, Georgia, serif",
            color: "#1a1a1a",
            margin: "0",
            padding: "0",
          }}
        >
          <Container
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              padding: "32px 20px",
            }}
          >
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
