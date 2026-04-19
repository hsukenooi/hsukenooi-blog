import { writeFileSync, readFileSync, existsSync } from "fs";
import { books } from "../src/data/books.ts";

const COVERS_PATH = "src/data/covers.json";
const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function gbUrl(id: string): string {
  return `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
}

function shortTitle(title: string): string {
  return title.split(/[:(]/)[0].trim();
}

async function searchGoogleBooks(q: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const id = data.items?.[0]?.id;
  return id ? gbUrl(id) : null;
}

async function fetchCover(title: string, author: string): Promise<string | null> {
  const firstAuthor = author.split(",")[0].trim();
  const short = shortTitle(title);

  const strategies = [
    `intitle:${title} inauthor:${firstAuthor}`,
    `${title} ${firstAuthor}`,
    `intitle:${short} inauthor:${firstAuthor}`,
    `${short} ${firstAuthor}`,
    `intitle:${short}`,
  ];

  for (const q of strategies) {
    const url = await searchGoogleBooks(q);
    if (url) return url;
    await sleep(150);
  }
  return null;
}

async function main() {
  const existing: Record<string, string | null> = existsSync(COVERS_PATH)
    ? JSON.parse(readFileSync(COVERS_PATH, "utf-8"))
    : {};

  // Strip any Open Library entries so they get re-fetched with Google Books
  for (const [key, val] of Object.entries(existing)) {
    if (val?.includes("openlibrary.org")) {
      delete existing[key];
    }
  }

  const allBooks = books.flatMap(({ items }) => items);
  let fetched = 0;
  let skipped = 0;

  for (const book of allBooks) {
    const key = book.title;

    if (book.coverUrl) {
      console.log(`[override] ${book.title}`);
      skipped++;
      continue;
    }

    if (key in existing && existing[key] !== null) {
      console.log(`[cached]   ${book.title}`);
      skipped++;
      continue;
    }

    // Either not seen before, or was previously null — try again
    let url: string | null = null;
    try {
      url = await fetchCover(book.title, book.author);
      if (url) {
        console.log(`[gb]  ${book.title}`);
      } else {
        console.log(`[miss] ${book.title}`);
      }
    } catch (err) {
      console.error(`[error] ${book.title}: ${err}`);
    }

    existing[key] = url;
    fetched++;

    writeFileSync(COVERS_PATH, JSON.stringify(existing, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Fetched: ${fetched}, Skipped (cached/override): ${skipped}`);
}

main();
