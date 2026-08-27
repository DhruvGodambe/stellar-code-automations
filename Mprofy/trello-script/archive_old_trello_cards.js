/**
 * archive-old-trello-cards.js
 *
 * Bulk-archives Trello cards whose LAST ACTIVITY is older than N months.
 *
 * SETUP:
 * 1. Get your API key here:      https://trello.com/app-key
 * 2. Generate a token (link on same page, or use):
 *    https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=YOUR_KEY
 * 3. Get your Board ID: add ".json" to the board URL and look for the "id" field near the top.
 * 4. Fill in the CONFIG section below.
 * 5. First run with TEST_LIMIT = 2 and DRY_RUN = true -> see what would happen to just 2 cards.
 * 6. Then TEST_LIMIT = 2, DRY_RUN = false -> actually archive those 2, go check Trello yourself.
 * 7. If all good, set TEST_LIMIT = null and DRY_RUN = false -> full run on all ~1100.
 *
 * Requires Node.js 18+ (uses built-in fetch).
 * Run: node archive-old-trello-cards.js
 */

// ===================== CONFIG =====================
const API_KEY = "YOUR_API_KEY_HERE";
const TOKEN = "YOUR_TOKEN_HERE";
const BOARD_ID = "YOUR_BOARD_ID_HERE";

// Optional: only archive cards from a specific list (leave null for whole board)
const LIST_ID = null; // e.g. "5f9a1b2c3d4e5f6a7b8c9d0e"

const MONTHS_THRESHOLD = 6;

// true = only prints what it WOULD archive, doesn't actually touch anything
const DRY_RUN = true;

// Set to a number (e.g. 2) to only process that many old cards - for safe testing.
// Set to null to process ALL matching cards.
const TEST_LIMIT = 2;

// Trello rate limit: ~100 req / 10 sec per token. This delay keeps us safely under it.
const DELAY_MS = 150;
// ====================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllCards() {
  const base = LIST_ID
    ? `https://api.trello.com/1/lists/${LIST_ID}/cards`
    : `https://api.trello.com/1/boards/${BOARD_ID}/cards`;

  // dateLastActivity comes directly from Trello - no need to compute anything
  const url = `${base}?key=${API_KEY}&token=${TOKEN}&fields=id,name,shortUrl,dateLastActivity`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch cards: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function archiveCard(cardId) {
  const url = `https://api.trello.com/1/cards/${cardId}?closed=true&key=${API_KEY}&token=${TOKEN}`;
  const res = await fetch(url, { method: "PUT" });
  if (!res.ok) {
    throw new Error(`Failed to archive ${cardId}: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  console.log("Fetching all cards...");
  const cards = await fetchAllCards();
  console.log(`Total cards found: ${cards.length}`);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS_THRESHOLD);

  let oldCards = cards
    .map((c) => ({ ...c, lastActivity: new Date(c.dateLastActivity) }))
    .filter((c) => c.lastActivity < cutoff)
    // oldest activity first - so testing on "first 2" means the genuinely stalest cards
    .sort((a, b) => a.lastActivity - b.lastActivity);

  console.log(`Cards with last activity older than ${MONTHS_THRESHOLD} months: ${oldCards.length}`);

  if (TEST_LIMIT !== null) {
    oldCards = oldCards.slice(0, TEST_LIMIT);
    console.log(`TEST_LIMIT active - only processing first ${oldCards.length} card(s)`);
  }

  console.log(DRY_RUN ? "\n[DRY RUN - nothing will be archived]\n" : "\n[LIVE RUN - archiving now]\n");

  let done = 0;
  for (const card of oldCards) {
    console.log(
      `${done + 1}/${oldCards.length} - "${card.name}" (last activity ${card.lastActivity.toDateString()}) - ${card.shortUrl}`
    );

    if (!DRY_RUN) {
      try {
        await archiveCard(card.id);
        console.log("  -> archived");
      } catch (err) {
        console.error(`  ERROR archiving ${card.id}:`, err.message);
      }
      await sleep(DELAY_MS);
    }
    done++;
  }

  console.log(`\nDone. ${DRY_RUN ? "Would have archived" : "Archived"} ${oldCards.length} card(s).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});