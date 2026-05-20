import { Section } from "@react-email/components";

interface PostBodyProps {
  html: string;
}

const elementStyles = `
  .post-body { font-family: Inter, Helvetica Neue, Arial, sans-serif; }
  .post-body p { font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 16px; }
  .post-body h1 { font-family: Lora, Georgia, serif; font-size: 28px; line-height: 1.3; color: #1a1a1a; margin: 32px 0 16px; font-weight: 600; }
  .post-body h2 { font-family: Lora, Georgia, serif; font-size: 22px; line-height: 1.3; color: #1a1a1a; margin: 28px 0 12px; font-weight: 600; }
  .post-body h3 { font-family: Lora, Georgia, serif; font-size: 18px; line-height: 1.3; color: #1a1a1a; margin: 24px 0 10px; font-weight: 600; }
  .post-body blockquote { border-left: 4px solid #e5e3df; margin: 20px 0; padding: 0 0 0 16px; color: #6b6b6b; }
  .post-body blockquote p { margin: 0; }
  .post-body code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; background-color: #f7f6f4; padding: 2px 5px; border-radius: 3px; }
  .post-body pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; background-color: #f7f6f4; padding: 16px; border-radius: 4px; overflow-x: auto; margin: 0 0 16px; }
  .post-body pre code { background: none; padding: 0; }
  .post-body ul, .post-body ol { font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 16px; padding-left: 24px; }
  .post-body li { margin-bottom: 4px; }
  .post-body img { max-width: 100%; height: auto; display: block; margin: 0 0 16px; }
  .post-body a { color: #1a1a1a; text-decoration: underline; }
  .post-body hr { border: none; border-top: 1px solid #e5e3df; margin: 32px 0; }
`;

export function PostBody({ html }: PostBodyProps) {
  return (
    <Section>
      <style dangerouslySetInnerHTML={{ __html: elementStyles }} />
      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Section>
  );
}
