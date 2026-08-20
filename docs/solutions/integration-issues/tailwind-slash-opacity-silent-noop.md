---
title: Tailwind v3 Slash-Opacity Outside the Scale Silently Generates No CSS
date: 2026-08-20
category: integration-issues
module: styling/tailwind
problem_type: integration_issue
component: tooling
symptoms:
  - "A utility like outline-black/8 compiles without warning but emits no CSS rule"
  - "Element falls back to inherited/currentColor styling; build and astro check stay green"
  - "Visual regression is invisible until a rendered-output comparison"
root_cause: config_error
resolution_type: code_change
severity: low
tags: [tailwind, opacity, css, silent-failure, verification, pixel-diff]
---

# Tailwind v3 Slash-Opacity Outside the Scale Silently Generates No CSS

## Problem

During the Interface Cheat Sheet Adoption batch (BUI-839), book covers got a 1px inset outline via `outline-black/8 dark:outline-white/8`. Tailwind v3's slash-opacity modifier only accepts values from the opacity scale (0, 5, 10, 15, …) or arbitrary bracket values — `8` is neither, so the classes generated **no CSS at all**. The covers silently fell back to a 1px `currentColor` frame at the text color's opacity. `npm run build`, `astro check`, and eslint all stayed green.

## Symptoms

- The class appears in the markup, but the built stylesheet contains no matching rule.
- The element renders with fallback styling that can look plausibly intentional.
- No build warning, no type error, no lint finding.

## What Didn't Work

Nothing flagged it at authoring time. The Wave 2 agent's inline self-review read the diff and the class names looked correct; only the Wave 3 agent's empirical verification (building both revisions and pixel-diffing pages in Chromium) exposed a 0.63% pixel difference on `/books` traceable to the missing rule.

## Solution

Use bracket syntax for off-scale opacity — `outline-black/[0.08]` — or write plain CSS in `global.css` (`outline: 1px solid rgb(0 0 0 / 0.08)`), which is what this repo settled on: prose-image outlines were already plain CSS because the `prose-img:` variant combination also failed to compile, and BUI-841 later unified both under the `image-edge` semantic token.

## Prevention

- Treat any Tailwind slash-opacity value not divisible by 5 as suspect; grep the built CSS for the class before trusting it.
- For styling refactors, the closing verification that actually catches this class of bug is a rendered-output comparison (computed-style diff or pixel diff of built revisions), not code review — code review sees a well-formed class name and approves it.
- The repo's em-batch profile (`.claude/em-batch.md`) now records this gotcha under Local gates.
