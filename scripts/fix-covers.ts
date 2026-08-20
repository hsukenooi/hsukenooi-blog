/**
 * Targeted fix for specific cover issues:
 * - Low-res: try higher zoom on same ID
 * - Wrong/missing: search for correct editions
 */
import { writeFileSync, readFileSync } from "fs";

const COVERS_PATH = "src/data/covers.json";

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function gbUrl(id: string, zoom = 6, publisher = true): string {
  const base = publisher
    ? "https://books.google.com/books/publisher/content"
    : "https://books.google.com/books/content";
  const edge = publisher ? "&edge=curl" : "";
  return `${base}?id=${id}&printsec=frontcover&img=1&zoom=${zoom}${edge}&source=gbs_api`;
}

function stripImgtk(url: string): string {
  return url.replace(/&imgtk=[^&]+/, "").replace(/^http:/, "https:");
}

async function imageSize(url: string): Promise<number> {
  const r = await fetch(url);
  const b = await r.arrayBuffer();
  return b.byteLength;
}

// Try zoom=6 then zoom=4 directly on an ID; return best URL or null
async function tryHighZoom(id: string, isPublisher: boolean): Promise<string | null> {
  for (const zoom of [6, 4]) {
    const url = gbUrl(id, zoom, isPublisher);
    const size = await imageSize(url);
    if (size > 15000) return url;
    await sleep(100);
  }
  return null;
}

// Search GB and return best imageLink URL for first result matching query
async function searchBest(q: string): Promise<{ id: string; url: string; title: string } | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3`
  );
  const data = await res.json();
  for (const item of data.items ?? []) {
    const links = item.volumeInfo?.imageLinks as Record<string, string> | undefined;
    if (!links) continue;
    for (const key of ["extraLarge", "large", "medium", "small", "thumbnail"]) {
      if (links[key]) {
        return { id: item.id, url: stripImgtk(links[key]), title: item.volumeInfo.title };
      }
    }
  }
  return null;
}

// Fetch best image URL for a known volume ID
async function bestForId(id: string): Promise<string | null> {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
  const data = await res.json();
  const links = data.volumeInfo?.imageLinks as Record<string, string> | undefined;
  if (!links) return null;
  for (const key of ["extraLarge", "large", "medium", "small", "thumbnail"]) {
    if (links[key]) return stripImgtk(links[key]);
  }
  return null;
}

async function main() {
  const covers: Record<string, string | null> = JSON.parse(readFileSync(COVERS_PATH, "utf-8"));

  function save() { writeFileSync(COVERS_PATH, JSON.stringify(covers, null, 2)); }

  function patch(title: string, url: string) {
    covers[title] = url;
    console.log(`[patch] ${title}`);
    save();
  }

  async function searchAndPatch(title: string, query: string) {
    await sleep(600);
    const result = await searchBest(query);
    if (result) {
      patch(title, result.url);
      console.log(`        → id=${result.id} matched="${result.title}"`);
    } else {
      console.log(`[miss]  ${title} (query: ${query})`);
    }
  }

  // ─── PHASE 1: Try higher zoom for low-res books with same ID ─────────────

  const lowResBooks: [string, string, boolean][] = [
    ["1984",                                              "4HQcMQAACAAJ", false],
    ["Ghost in the Wires: My Adventures as the World's Most Wanted Hacker", "mx_AjwEACAAJ", false],
    ["The Practicing Stoic: A Philosophical User's Manual","D4DetAEACAAJ", false],
    ["In Praise of Idleness: A Timeless Essay",           "lxzC0AEACAAJ", false],
    ["The Stress Prescription",                           "c1lmEAAAQBAJ", true],
    ["Star Wars: Thrawn Ascendancy (Book I: Chaos Rising)","wSiOEAAAQBAJ", true],
    ["Revan: Star Wars Legends (The Old Republic)",        "fmi_BgAAQBAJ", true],
    ["Outlive: The Science and Art of Longevity",          "HYqeEAAAQBAJ", true],
    ["Gödel, Escher, Bach: An Eternal Golden Braid",       "uZLdksxOEecC", false],
    ["Founders at Work: Stories of Startups' Early Days",  "lB3tDAEACAAJ", false],
    ["1Q84",                                              "l4rgzgEACAAJ", false],
    ["Red Notice",                                        "sZ-SBgAAQBAJ", true],
    ["Masters of Doom",                                   "sySPEAAAQBAJ", true],
    ["Crazy Rich Asians",                                 "_YRenAEACAAJ", false],
    ["What's Our Problem?: A Self-Help Book for Societies","7HrHzwEACAAJ", false],
  ];

  console.log("\n=== PHASE 1: Low-res zoom upgrades ===");
  for (const [title, id, isPub] of lowResBooks) {
    await sleep(400);
    const url = await tryHighZoom(id, isPub);
    if (url) {
      patch(title, url);
    } else {
      // Fall back to API imageLinks
      const apiUrl = await bestForId(id);
      if (apiUrl) {
        patch(title, apiUrl);
      } else {
        console.log(`[no-zoom] ${title} — will re-search`);
      }
    }
  }

  // ─── PHASE 2: Wrong covers — search for correct edition ──────────────────

  console.log("\n=== PHASE 2: Wrong cover replacements ===");

  await searchAndPatch(
    "Tojo: The Rise and Fall of Japan's Most Controversial World War II General",
    "Tojo Rise Fall Japan Most Controversial General Peter Mauch"
  );

  await searchAndPatch(
    "Babel: Or the Necessity of Violence",
    "Babel Necessity Violence RF Kuang fantasy 2022"
  );

  // Foundation — the classic Asimov novel, not a scan/reprint
  await searchAndPatch(
    "Foundation",
    "Foundation Isaac Asimov novel Del Rey"
  );

  // Duplicate ID bug: Thrawn Treason + Book III + Heir all shared 27LaDwAAQBAJ
  await searchAndPatch(
    "Star Wars: Thrawn Ascendancy (Book III: Lesser Evil)",
    "Star Wars Thrawn Ascendancy Lesser Evil Timothy Zahn"
  );

  await searchAndPatch(
    "Thrawn: Treason",
    "Thrawn Treason Timothy Zahn Star Wars 2019"
  );

  await searchAndPatch(
    "Star Wars: Heir to the Empire",
    "Star Wars Heir to the Empire Timothy Zahn Thrawn"
  );

  await searchAndPatch(
    "Star Wars: The Old Republic: Fatal Alliance",
    "Star Wars Old Republic Fatal Alliance Sean Williams"
  );

  await searchAndPatch(
    "Children of Dune",
    "Children of Dune Frank Herbert Ace Books"
  );

  await searchAndPatch(
    "\"Surely You're Joking, Mr. Feynman!\"",
    "Surely Joking Mr Feynman Richard Feynman Norton"
  );

  await searchAndPatch(
    "The Silmarillion",
    "The Silmarillion Tolkien Houghton Mifflin"
  );

  await searchAndPatch(
    "The Metaverse",
    "The Metaverse Matthew Ball book 2022"
  );

  await searchAndPatch(
    "The Network State",
    "The Network State Balaji Srinivasan 2022"
  );

  await searchAndPatch(
    "Dune",
    "Dune Frank Herbert Ace Books science fiction"
  );

  await searchAndPatch(
    "Hackers & Painters",
    "Hackers Painters Big Ideas Computer Age Paul Graham O'Reilly"
  );

  await searchAndPatch(
    "How to Avoid a Climate Disaster",
    "How to Avoid Climate Disaster Bill Gates Knopf"
  );

  await searchAndPatch(
    "Pachinko",
    "Pachinko Min Jin Lee Grand Central Publishing"
  );

  await searchAndPatch(
    "The Mamba Mentality: How I Play",
    "Mamba Mentality How I Play Kobe Bryant"
  );

  await searchAndPatch(
    "Very Important People",
    "Very Important People Status and Beauty Ashley Mears Princeton"
  );

  await searchAndPatch(
    "The Mind-Body Problem",
    "Mind Body Problem Rebecca Newberger Goldstein novel"
  );

  // Duplicate ID bug: Dark Forest and Three-Body Problem both had ybSfEAAAQBAJ
  await searchAndPatch(
    "The Dark Forest (The Three-Body Problem Series Book 2)",
    "The Dark Forest Cixin Liu Three-Body Problem Book 2"
  );

  await searchAndPatch(
    "The Three-Body Problem",
    "The Three-Body Problem Cixin Liu Book 1 Tor"
  );

  await searchAndPatch(
    "Principles: Life and Work",
    "Principles Life Work Ray Dalio Simon Schuster"
  );

  await searchAndPatch(
    "The Hard Thing About Hard Things",
    "Hard Thing About Hard Things Ben Horowitz HarperCollins"
  );

  // ─── PHASE 3: Missing covers ─────────────────────────────────────────────

  console.log("\n=== PHASE 3: Missing / blank covers ===");

  await searchAndPatch(
    "Foundation and Empire",
    "Foundation and Empire Isaac Asimov Bantam"
  );

  await searchAndPatch(
    "Zen: The Authentic Gate",
    "Zen Authentic Gate Koun Yamada Shambhala"
  );

  await searchAndPatch(
    "High Output Management",
    "High Output Management Andrew Grove Random House"
  );

  await searchAndPatch(
    "Batman: The Dark Knight Returns",
    "Batman Dark Knight Returns Frank Miller DC Comics"
  );

  console.log("\n✓ Done");
}

main().catch(console.error);
