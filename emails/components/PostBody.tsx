import { Section } from "@react-email/components";

interface PostBodyProps {
  html: string;
}

const elementStyles = `
  .post-body { font-family: Lora, Georgia, serif; color: #1a1a1a; }
  .post-body p { font-family: Lora, Georgia, serif; font-size: 17px; line-height: 1.4; color: #1a1a1a; margin: 0 0 1em; }
  .post-body h1 { font-family: Inter, Helvetica Neue, Arial, sans-serif; font-size: 20px; line-height: 1.3; color: #1a1a1a; margin: 1.5em 0 0.5em; font-weight: 700; }
  .post-body h2 { font-family: Inter, Helvetica Neue, Arial, sans-serif; font-size: 18px; line-height: 1.3; color: #1a1a1a; margin: 1.5em 0 0.5em; font-weight: 700; }
  .post-body h3 { font-family: Inter, Helvetica Neue, Arial, sans-serif; font-size: 16px; line-height: 1.3; color: #1a1a1a; margin: 1.5em 0 0.5em; font-weight: 700; }
  .post-body h4 { font-family: Inter, Helvetica Neue, Arial, sans-serif; font-size: 14px; line-height: 1.3; color: #1a1a1a; margin: 1.5em 0 0.5em; font-weight: 700; }
  .post-body blockquote { border-left: 4px solid #acb3be; color: #7e8a9a; margin: 1em 0; padding-left: 1em; }
  .post-body blockquote p { margin: 0; color: #7e8a9a; }
  .post-body code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; background-color: #ebedef; padding: 3px 6px; border-radius: 0 0.25rem 0.25rem 0; }
  .post-body pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 15px; line-height: 20px; background-color: #ebedef; padding: 1em; border-radius: 0 0.25rem 0.25rem 0; overflow-x: auto; margin: 0 0 1em; }
  .post-body pre code { background: none; padding: 0; }
  .post-body ul, .post-body ol { font-family: Lora, Georgia, serif; font-size: 17px; line-height: 1.4; color: #1a1a1a; margin: 0 0 1em; padding-left: 24px; }
  .post-body li { margin-bottom: 4px; }
  .post-body img { max-width: 100%; height: auto; display: block; margin: 0 0 1em; }
  .post-body a { font-family: Lora, Georgia, serif; color: #005a9c; text-decoration: underline; }
  .post-body hr { border: 0; border-bottom: 1px solid #cccccc; margin: 4em 0; }
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
