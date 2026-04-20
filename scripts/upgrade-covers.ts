import { writeFileSync, readFileSync } from "fs";

const COVERS_PATH = "src/data/covers.json";
const DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractId(url: string): string | null {
  const m = url.match(/[?&]id=([^&]+)/);
  return m ? m[1] : null;
}

function stripImgtk(url: string): string {
  return url.replace(/&imgtk=[^&]+/, "").replace(/^http:/, "https:");
}

async function bestImageUrl(id: string): Promise<string | null> {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  const links = data.volumeInfo?.imageLinks as Record<string, string> | undefined;
  if (!links) return null;

  // Prefer largest available; strip imgtk so the URL is stable
  for (const key of ["extraLarge", "large", "medium", "small", "thumbnail"]) {
    if (links[key]) return stripImgtk(links[key]);
  }
  return null;
}

async function main() {
  const covers: Record<string, string | null> = JSON.parse(
    readFileSync(COVERS_PATH, "utf-8")
  );

  let updated = 0;

  for (const [title, url] of Object.entries(covers)) {
    if (!url) {
      console.log(`[skip-null] ${title}`);
      continue;
    }

    const id = extractId(url);
    if (!id) {
      console.log(`[skip-no-id] ${title}`);
      continue;
    }

    try {
      const best = await bestImageUrl(id);
      if (best && best !== url) {
        covers[title] = best;
        updated++;
        // Log the zoom level we got
        const zoom = best.match(/zoom=(\d)/)?.[1] ?? "?";
        const format = best.includes("publisher/content") ? "pub" : "legacy";
        console.log(`[${format} z${zoom}] ${title}`);
      } else if (!best) {
        console.log(`[no-links] ${title}`);
      } else {
        console.log(`[same]     ${title}`);
      }
    } catch (err) {
      console.error(`[error] ${title}: ${err}`);
    }

    writeFileSync(COVERS_PATH, JSON.stringify(covers, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Updated ${updated} covers to higher resolution.`);
}

main();
