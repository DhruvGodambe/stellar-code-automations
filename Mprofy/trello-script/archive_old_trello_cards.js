/**
 * archive_old_trello_cards.js
 *
 * Bulk-archives Trello cards CREATED more than N months ago.
 *
 * NOTE: We use creation date (not "last activity") because some automation/bot
 * on this board touches all cards periodically, making dateLastActivity
 * unreliable for finding genuinely old cards. Creation date is embedded in
 * the card's ID itself and never changes.
 *
 * SETUP:
 * 1. Fill in API_KEY, TOKEN, BOARD_ID, LIST_ID below (see steps discussed).
 * 2. First run with TEST_LIMIT = 2 and DRY_RUN = true -> just prints, archives nothing.
 * 3. Check the printed cards look right, then set DRY_RUN = false (TEST_LIMIT still 2)
 *    -> archives just those 2. Go check Trello yourself that they moved to Archive.
 * 4. If correct, set TEST_LIMIT = null and DRY_RUN = false -> full run on all matching cards.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Run: node archive_old_trello_cards.js
 */

// ===================== CONFIG =====================
const API_KEY = "paste your api key";
const TOKEN = "paste your token";
const BOARD_ID = "paste your board id";

// Set to a specific list's ID to only process that list, or null for whole board.
const LIST_ID = "paste your list id"; // or: const LIST_ID = null;

const MONTHS_THRESHOLD = 6;

// true = only prints what WOULD be archived, touches nothing.
const DRY_RUN = true;

// Number of oldest matching cards to process - for safe testing. null = process all.
const TEST_LIMIT = 2;

// Delay between archive requests (ms) to stay well under Trello's rate limit.
const DELAY_MS = 150;
// ====================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Trello card IDs are Mongo ObjectIds - first 8 hex chars encode creation time
// (seconds since epoch). This is always accurate and never changes.
function getCreatedDateFromId(id) {
  const timestampHex = id.substring(0, 8);
  const timestampSec = parseInt(timestampHex, 16);
  return new Date(timestampSec * 1000);
}

async function fetchAllCards() {
  const base = LIST_ID
    ? `https://api.trello.com/1/lists/${LIST_ID}/cards`
    : `https://api.trello.com/1/boards/${BOARD_ID}/cards`;

  const url = `${base}?key=${API_KEY}&token=${TOKEN}&fields=id,name,shortUrl`;

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
  if (API_KEY.startsWith("PASTE_") || TOKEN.startsWith("PASTE_") || BOARD_ID.startsWith("PASTE_")) {
    console.error("ERROR: Fill in API_KEY, TOKEN, and BOARD_ID (and LIST_ID if using one) at the top of this file before running.");
    process.exit(1);
  }

  console.log("Fetching all cards...");
  const cards = await fetchAllCards();
  console.log(`Total cards found: ${cards.length}`);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS_THRESHOLD);

  let oldCards = cards
    .map((c) => ({ ...c, createdAt: getCreatedDateFromId(c.id) }))
    .filter((c) => c.createdAt < cutoff)
    // oldest first - so testing on "first N" tests the genuinely stalest cards
    .sort((a, b) => a.createdAt - b.createdAt);

  console.log(`Cards created more than ${MONTHS_THRESHOLD} months ago: ${oldCards.length}`);

  if (TEST_LIMIT !== null) {
    oldCards = oldCards.slice(0, TEST_LIMIT);
    console.log(`TEST_LIMIT active - only processing first ${oldCards.length} card(s)`);
  }

  console.log(DRY_RUN ? "\n[DRY RUN - nothing will be archived]\n" : "\n[LIVE RUN - archiving now]\n");

  let done = 0;
  for (const card of oldCards) {
    console.log(
      `${done + 1}/${oldCards.length} - "${card.name}" (created ${card.createdAt.toDateString()}) - ${card.shortUrl}`
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