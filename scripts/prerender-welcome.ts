import { writeFileSync } from "fs";
import { createElement } from "react";
import { render } from "@react-email/render";
import Welcome from "../emails/Welcome.js";

const html = await render(createElement(Welcome));
writeFileSync(
  "src/pages/api/_welcome-html.ts",
  `export const welcomeHtml = ${JSON.stringify(html)};\n`
);
console.log("Pre-rendered Welcome email to src/pages/api/_welcome-html.ts");
