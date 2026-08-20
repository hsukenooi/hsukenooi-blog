// Re-runnable technical SEO audit. Crawls every page in the live sitemap and
// checks metadata, canonicals, structured data, headings, images, and the
// internal link graph against Google Search Essentials-level rules.
//
//   node scripts/seo-audit.mjs                      # audits https://hsukenooi.com
//   node scripts/seo-audit.mjs http://localhost:4321 # audits a local preview
//   node scripts/seo-audit.mjs --json out.json       # also dumps findings as JSON
//
// Exit code is 1 if any ERROR-severity finding exists, so it can gate CI.

import { parseHTML } from "linkedom";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const jsonIdx = args.indexOf("--json");
const jsonPath = jsonIdx !== -1 ? args[jsonIdx + 1] : null;
const origin = args.find((a) => a.startsWith("http")) ?? "https://hsukenooi.com";

const UA = "seo-audit-script (github.com/hsukenooi; run by site owner)";
const findings = [];
const add = (severity, check, page, detail) =>
  findings.push({ severity, check, page, detail });

async function get(url, { redirect = "follow", method = "GET" } = {}) {
  const res = await fetch(url, { redirect, method, headers: { "user-agent": UA } });
  return res;
}

// Fetch recording the redirect hop count and final URL.
async function getWithChain(url, maxHops = 5) {
  let current = url;
  let hops = 0;
  for (;;) {
    const res = await get(current, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = new URL(res.headers.get("location"), current).href;
      hops += 1;
      if (hops > maxHops) return { status: res.status, hops, finalUrl: loc, res: null };
      current = loc;
      continue;
    }
    return { status: res.status, hops, finalUrl: current, res };
  }
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

const path = (url) => new URL(url).pathname || "/";

// ---------------------------------------------------------------- sitemap
const sitemapIndexUrl = `${origin}/sitemap-index.xml`;
const sitemapIndex = await get(sitemapIndexUrl);
if (!sitemapIndex.ok) {
  add("ERROR", "sitemap", sitemapIndexUrl, `sitemap-index.xml returned ${sitemapIndex.status}`);
}
const sitemapUrls = [...(await sitemapIndex.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const pageUrls = [];
for (const sm of sitemapUrls) {
  const res = await get(sm.replace(/^https?:\/\/[^/]+/, origin));
  if (!res.ok) { add("ERROR", "sitemap", sm, `child sitemap returned ${res.status}`); continue; }
  const xml = await res.text();
  pageUrls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  // lastmod sanity: no future dates
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    if (new Date(m[1]) > new Date()) add("WARN", "sitemap-lastmod", sm, `future lastmod ${m[1]}`);
  }
}

// ---------------------------------------------------------------- robots.txt
{
  const res = await get(`${origin}/robots.txt`);
  if (!res.ok) add("ERROR", "robots", "/robots.txt", `returned ${res.status}`);
  else {
    const body = await res.text();
    if (!/sitemap:/i.test(body)) add("WARN", "robots", "/robots.txt", "no Sitemap: line");
    if (/^disallow:\s*\/\s*$/im.test(body)) add("ERROR", "robots", "/robots.txt", "Disallow: / blocks the whole site");
  }
}

// ---------------------------------------------------------------- per-page crawl
const titles = new Map();
const descriptions = new Map();
const internalLinks = new Map(); // href -> Set of pages linking to it
const linkedFrom = new Map(); // page path -> in-degree from other pages
const assetChecks = new Set();

const pages = await mapLimit(pageUrls, 5, async (url) => {
  const target = url.replace(/^https?:\/\/[^/]+/, origin);
  const direct = await get(target, { redirect: "manual" });
  if (direct.status !== 200) {
    add("ERROR", "http-status", path(url), `sitemap URL returned ${direct.status} (sitemap must list only 200/canonical URLs)`);
    return null;
  }
  const html = await direct.text();
  const { document } = parseHTML(html);
  const p = path(url);

  // title
  const title = document.querySelector("title")?.textContent?.trim() ?? "";
  if (!title) add("ERROR", "title", p, "missing <title>");
  else {
    if (title.length > 60) add("WARN", "title", p, `title is ${title.length} chars (may truncate in SERP): "${title}"`);
    if (titles.has(title)) add("WARN", "title-duplicate", p, `duplicate of ${titles.get(title)}: "${title}"`);
    titles.set(title, p);
  }

  // meta description
  const desc = document.querySelector("meta[name=\"description\"]")?.getAttribute("content")?.trim() ?? "";
  if (!desc) add("ERROR", "description", p, "missing meta description");
  else {
    if (desc.length < 50) add("WARN", "description", p, `description only ${desc.length} chars: "${desc}"`);
    if (desc.length > 160) add("INFO", "description", p, `description ${desc.length} chars (Google may rewrite/truncate)`);
    if (descriptions.has(desc)) add("WARN", "description-duplicate", p, `duplicate of ${descriptions.get(desc)}`);
    descriptions.set(desc, p);
  }

  // canonical
  const canonical = document.querySelector("link[rel=\"canonical\"]")?.getAttribute("href");
  if (!canonical) add("ERROR", "canonical", p, "missing canonical");
  else {
    const canonNorm = canonical.replace(/\/$/, "") || "/";
    const urlNorm = url.replace(/\/$/, "");
    if (canonNorm !== urlNorm && canonical !== url) {
      add("ERROR", "canonical", p, `canonical "${canonical}" is not self-referencing (sitemap says ${url})`);
    }
  }

  // robots meta
  const robotsMeta = document.querySelector("meta[name=\"robots\"]")?.getAttribute("content") ?? "";
  if (/noindex/i.test(robotsMeta)) add("ERROR", "noindex", p, "sitemap URL carries noindex");

  // headings
  const h1s = document.querySelectorAll("h1");
  if (h1s.length === 0) add("WARN", "headings", p, "no <h1>");
  if (h1s.length > 1) add("WARN", "headings", p, `${h1s.length} <h1> elements`);
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      add("INFO", "headings", p, `heading level skips h${levels[i - 1]} -> h${levels[i]}`);
      break;
    }
  }

  // JSON-LD
  const ldTypes = [];
  for (const s of document.querySelectorAll("script[type=\"application/ld+json\"]")) {
    try {
      const data = JSON.parse(s.textContent);
      for (const item of Array.isArray(data) ? data : [data]) ldTypes.push(item["@type"]);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (["BlogPosting", "Article"].includes(item["@type"])) {
          for (const req of ["headline", "datePublished", "author"]) {
            if (!item[req]) add("WARN", "json-ld", p, `${item["@type"]} missing ${req}`);
          }
          if (!item.image) add("INFO", "json-ld", p, `${item["@type"]} missing image (needed for some rich results)`);
        }
      }
    } catch {
      add("ERROR", "json-ld", p, "JSON-LD block fails to parse");
    }
  }
  const isPost = /^\/posts\/[^/]+$/.test(p);
  if (isPost && !ldTypes.some((t) => ["BlogPosting", "Article"].includes(t))) {
    add("WARN", "json-ld", p, "post has no BlogPosting/Article structured data");
  }

  // OG / twitter
  for (const [sel, name] of [
    ["meta[property=\"og:title\"]", "og:title"],
    ["meta[property=\"og:description\"]", "og:description"],
    ["meta[property=\"og:image\"]", "og:image"],
    ["meta[property=\"twitter:card\"], meta[name=\"twitter:card\"]", "twitter:card"],
  ]) {
    if (!document.querySelector(sel)) add("WARN", "social-meta", p, `missing ${name}`);
  }
  const ogImage = document.querySelector("meta[property=\"og:image\"]")?.getAttribute("content");
  if (ogImage) assetChecks.add(new URL(ogImage, url).href);

  // images
  const imgs = [...document.querySelectorAll("img")];
  const missingAlt = imgs.filter((i) => !i.hasAttribute("alt"));
  if (missingAlt.length) {
    add("WARN", "img-alt", p, `${missingAlt.length}/${imgs.length} images missing alt attribute (${missingAlt.slice(0, 3).map((i) => i.getAttribute("src")).join(", ")}${missingAlt.length > 3 ? ", …" : ""})`);
  }
  for (const img of imgs.slice(0, 30)) {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("data:")) assetChecks.add(new URL(src, url).href);
  }

  // markdown alternate (site convention: posts expose /posts/<slug>.md)
  const mdAlt = document.querySelector("link[rel=\"alternate\"][type=\"text/markdown\"]")?.getAttribute("href");
  if (mdAlt) assetChecks.add(new URL(mdAlt, url).href);

  // internal links
  for (const a of document.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    const abs = new URL(href, url);
    if (abs.origin !== new URL(origin).origin && abs.origin !== "https://hsukenooi.com") continue;
    const key = abs.pathname + abs.search;
    if (!internalLinks.has(key)) internalLinks.set(key, new Set());
    internalLinks.get(key).add(p);
    if (key !== p) linkedFrom.set(abs.pathname, (linkedFrom.get(abs.pathname) ?? 0) + 1);
  }

  // rough word count of main content (posts only)
  if (isPost) {
    const main = document.querySelector("main, article") ?? document.body;
    const words = main.textContent.trim().split(/\s+/).length;
    if (words < 300) add("INFO", "thin-content", p, `~${words} words`);
  }

  return { url, p, title, desc };
});

// ---------------------------------------------------------------- link graph checks
// internal links must not 404 and should not point at redirects
await mapLimit([...internalLinks.keys()], 5, async (key) => {
  const { status, hops, finalUrl } = await getWithChain(origin + key);
  const sources = [...internalLinks.get(key)].slice(0, 3).join(", ");
  if (status === 404) add("ERROR", "broken-link", key, `internal link 404s (linked from ${sources})`);
  else if (hops > 0) add("WARN", "link-to-redirect", key, `internal link redirects (${hops} hop${hops > 1 ? "s" : ""} -> ${path(finalUrl)}); link the final URL directly (linked from ${sources})`);
  if (/\/$/.test(key) && key !== "/") add("WARN", "trailing-slash-link", key, `internal link uses trailing slash (site canonicals are slash-less); linked from ${sources}`);
});

// orphan pages: in the sitemap but no other page links to them
for (const page of pages.filter(Boolean)) {
  if (page.p === "/" ) continue;
  if (!linkedFrom.get(page.p)) add("WARN", "orphan", page.p, "no internal links point here (only sitemap)");
}

// ---------------------------------------------------------------- assets
await mapLimit([...assetChecks], 5, async (asset) => {
  const res = await get(asset, { method: "HEAD" });
  if (!res.ok) add("ERROR", "broken-asset", asset, `returned ${res.status}`);
});

// ---------------------------------------------------------------- feeds & extras
for (const extra of ["/rss.xml", "/llms.txt", "/favicon.ico", "/apple-touch-icon.png"]) {
  const res = await get(origin + extra);
  if (!res.ok) add("WARN", "extra", extra, `returned ${res.status}`);
}

// legacy redirect spot checks: representative Ghost-era URLs must 301/308 in <=2 hops
for (const legacy of ["/learnings/", "/blog/learnings/", "/blog", "/rss/", "/home/"]) {
  const { status, hops, finalUrl } = await getWithChain(origin + legacy);
  if (status !== 200 || hops === 0) add("ERROR", "legacy-redirect", legacy, `expected redirect chain to a 200, got status ${status} after ${hops} hops`);
  else if (hops > 2) add("WARN", "legacy-redirect", legacy, `${hops} hops to ${path(finalUrl)} (keep chains <=2)`);
}

// ---------------------------------------------------------------- report
const order = { ERROR: 0, WARN: 1, INFO: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.check.localeCompare(b.check));
const counts = { ERROR: 0, WARN: 0, INFO: 0 };
for (const f of findings) counts[f.severity]++;

console.log(`\nSEO audit of ${origin} — ${pageUrls.length} sitemap pages, ${internalLinks.size} internal link targets\n`);
for (const f of findings) {
  console.log(`${f.severity.padEnd(5)} [${f.check}] ${f.page}\n      ${f.detail}`);
}
console.log(`\n${counts.ERROR} errors, ${counts.WARN} warnings, ${counts.INFO} info`);

if (jsonPath) writeFileSync(jsonPath, JSON.stringify({ origin, date: new Date().toISOString(), findings }, null, 2));
process.exit(counts.ERROR > 0 ? 1 : 0);
