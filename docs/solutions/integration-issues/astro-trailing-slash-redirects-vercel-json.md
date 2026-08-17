---
title: Trailing-Slash Redirects Cannot Live in Astro Config — Use Root vercel.json
date: 2026-08-17
category: integration-issues
module: routing/redirects
problem_type: integration_issue
component: tooling
symptoms:
  - "GSC Page Indexing reported 27 'Not found (404)' URLs, almost all trailing-slash variants of legacy Ghost URLs"
  - "Non-slash form of a legacy URL 301s correctly, but the same path with a trailing slash returns 404"
  - "Adding a '/x/' redirect key to astro.config.mjs logs a duplicate-route conflict at build time"
root_cause: config_error
resolution_type: config_change
severity: medium
tags: [astro, vercel, redirects, trailing-slash, seo, ghost-migration, deployment-protection]
---

# Trailing-Slash Redirects Cannot Live in Astro Config — Use Root vercel.json

## Problem

Google indexed this blog's legacy Ghost URLs in their trailing-slash form (Ghost served every URL with a trailing slash). The Astro redirect map in `astro.config.mjs` matches exact paths only, and Vercel only slash-normalizes pages that exist in the build — so `/legacy-slug` redirected correctly while `/legacy-slug/` returned 404, producing 27 "Not found (404)" entries in Google Search Console (BUI-795/BUI-796).

## Symptoms

- GSC "Not found (404)" bucket full of trailing-slash variants of URLs whose non-slash form redirects fine.
- `curl -I https://site/slug` → 301; `curl -I https://site/slug/` → 404.
- Attempting the obvious in-config fix triggers a build warning: "duplicate route" conflict.

## What Didn't Work

- **Slash-twin entries in `astro.config.mjs`** (`"/x/": dest` alongside `"/x": dest`): with `trailingSlash: "never"`, Astro strips the trailing slash off *every* redirect-source key before compiling it to a route regex, so `/x/` and `/x` both compile to the identical `^/x$` pattern. The build logs it as a duplicate-route conflict (dropping one) and warns this becomes a hard error in future Astro versions. Same for dynamic sources: `/blog/[...slug]/` compiles to the exact same regex as `/blog/[...slug]`, which structurally can never match a trailing slash.
- **Single-dynamic-segment redirects in Astro** (`"/blog/p/[uuid]": "/posts"`): unlike the `[...slug]` rest parameter, a lone `[uuid]` segment is treated as a real route requiring `getStaticPaths` — the build fails with `GetStaticPathsRequired`.
- **Relying on the adapter's baked-in slash-strip route**: `.vercel/output/config.json` contains a `^/(.*)/$` strip-slash route even on an unmodified build, but it does not fire for paths with no built page — those still 404 in production.

## Solution

Put trailing-slash redirects in a root `vercel.json`, which bypasses Astro's route compiler entirely. Vercel honors these platform-side and applies them ahead of the adapter's Build Output routes (verified empirically on PR #24):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "redirects": [
    { "source": "/legacy-slug/", "destination": "/posts/legacy-slug", "statusCode": 301 },
    { "source": "/blog/p/:uuid", "destination": "/posts", "statusCode": 301 },
    { "source": "/blog/p/:uuid/", "destination": "/posts", "statusCode": 301 }
  ]
}
```

Point each slash twin **directly at the final destination** (not at the non-slash source) so no chain exceeds 2 hops from an `http://` entry point. Non-slash redirects stay in `astro.config.mjs` as before; `:param` segments work fine in `vercel.json` where `[param]` fails in Astro.

## Why This Works

`vercel.json` redirects are compiled by the platform at deploy time and merged ahead of the framework's emitted routes, so they never pass through Astro's route normalization. The slash-stripping that makes the in-config twin impossible simply never happens to them.

## Prevention

- Any new redirect added to `astro.config.mjs` for a legacy URL needs a slash twin added to `vercel.json` — Ghost-era URLs will always be indexed in their trailing-slash form.
- `vercel.json` redirects do **not** appear in `.vercel/output/config.json`, so they cannot be verified by a local build. Verify against the preview deployment with curl. Preview deployments sit behind Vercel Deployment Protection (SSO): log into Vercel in a browser, open the preview once, lift the `_vercel_jwt` cookie, and curl with `-H "Cookie: _vercel_jwt=..."`. Probe both the fix set (slash variants → 301 to final destination) and a regression set (existing pages still 200, existing non-slash redirects still 301).
- Astro-config redirect emission *can* be verified locally: grep `.vercel/output/config.json` after `npm run build`.

## Related Issues

- BUI-795 (trailing-slash 404s), BUI-796 (missing legacy redirects), BUI-797 (GSC validation follow-up)
- PR #24 — the fix and its verification record
