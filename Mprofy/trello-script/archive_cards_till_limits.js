/**
 * archive_until_500_remain.js
 *
 * Sorts all cards oldest-first and archives cards one by one
 * until only 500 cards are left remaining (not archived) in the list/board.
 *
 * After archiving (or in dry-run), it also writes a numbered .txt report
 * of every card that was (or would be) archived - useful to send to your manager.
 *
 * SETUP:
 * 1. Fill in API_KEY, TOKEN, BOARD_ID, LIST_ID below.
 * 2. First run with DRY_RUN = true -> just prints/report, touches nothing.
 * 3. Check the printed list and report look correct.
 * 4. Set DRY_RUN = false to actually archive.
 *
 * Requires Node.js 18+ (built-in fetch + fs).
 * Run: node archive_until_500_remain.js
 */

// "fs" is Node's built-in File System module - lets us create/write files on disk
const fs = require("fs");
// "path" is Node's built-in module for building file paths safely (works on Windows/Mac/Linux)
const path = require("path");

// ===================== CONFIG =====================

// Your Trello API key (from https://trello.com/app-key)
const API_KEY = "paste your api key";

// Your Trello API token (generated from the same page)
const TOKEN = "paste your token";

// The board's ID (from board-url + ".json", the "id" field)
const BOARD_ID = "paste your board id";

// The specific list's ID to work on (leave as null to use the whole board instead)
const LIST_ID = "paste your list id"; // or: const LIST_ID = null;

// How many cards should remain (not archived) after this script runs
const KEEP_COUNT = 500;

// true = only prints what WOULD be archived, doesn't touch anything (safe mode)
// false = actually archives the cards (live mode)
const DRY_RUN = true;

// Delay (in milliseconds) between each archive request, so we don't hit
// Trello's rate limit (roughly 100 requests per 10 seconds per token)
const DELAY_MS = 150;

// Name of the report file that will be created in the same folder as this script
const REPORT_FILE_NAME = "archived_cards_report.txt";
// ====================================================

// A small helper function that "pauses" execution for a given number of milliseconds.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extracts a card's real creation date from its Trello ID
// (first 8 hex characters of the ID = creation time, in seconds since 1970).
function getCreatedDateFromId(id) {
  const timestampHex = id.substring(0, 8);
  const timestampSec = parseInt(timestampHex, 16);
  return new Date(timestampSec * 1000);
}

// Fetches every card from the target list (or whole board) from Trello's API.
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

// Archives a single card by its ID.
async function archiveCard(cardId) {
  const url = `https://api.trello.com/1/cards/${cardId}?closed=true&key=${API_KEY}&token=${TOKEN}`;

  const res = await fetch(url, { method: "PUT" });

  if (!res.ok) {
    throw new Error(`Failed to archive ${cardId}: ${res.status} ${await res.text()}`);
  }
}

// Builds the full text content of the report, given the final list of processed cards.
// Each entry includes: a serial number, the card's name, its created date, and its link.
function buildReportText(cardsProcessed, dryRun, keepCount) {
  // The report's header - explains what this file is and when it was generated
  const header =
    `Trello Card Archive Report\n` +
    `Generated on: ${new Date().toString()}\n` +
    `Mode: ${dryRun ? "DRY RUN (nothing was actually archived)" : "LIVE (cards were actually archived)"}\n` +
    `Cards archived: ${cardsProcessed.length}\n` +
    `Cards remaining in list: ${keepCount}\n` +
    `\n----------------------------------------\n\n`;

  // Build one line per card, numbered starting from 1
  const lines = cardsProcessed
    .map((card, index) => {
      // index starts at 0, so we add 1 to get a human-friendly serial number
      const serialNumber = index + 1;
      return (
        `${serialNumber}. ${card.name}\n` +
        `   Created: ${card.createdAt.toDateString()}\n` +
        `   Link: ${card.shortUrl}\n`
      );
    })
    // join all the individual card entries with a blank line between them
    .join("\n");

  // Combine header + all card entries into one final string
  return header + lines;
}

// Writes the given text content to a .txt file in the same folder as this script.
function writeReportFile(reportText) {
  // __dirname is a built-in Node variable = the folder this script file lives in
  const filePath = path.join(__dirname, REPORT_FILE_NAME);

  // Write the text to disk (overwrites the file if it already exists)
  fs.writeFileSync(filePath, reportText, "utf8");

  // Return the full path so we can tell the user where to find it
  return filePath;
}

// The main function that runs the whole process, start to finish.
async function main() {
  // Safety check: don't let the script run with placeholder values still in place
  if (
    API_KEY.startsWith("paste") ||
    TOKEN.startsWith("paste") ||
    BOARD_ID.startsWith("paste")
  ) {
    console.error("ERROR: Fill in API_KEY, TOKEN, BOARD_ID (and LIST_ID if needed) before running.");
    process.exit(1);
  }

  console.log("Fetching all cards...");

  const cards = await fetchAllCards();

  console.log(`Total cards currently in list: ${cards.length}`);

  // If we already have 500 or fewer cards, there's nothing to archive - stop early
  if (cards.length <= KEEP_COUNT) {
    console.log(`Already at or below ${KEEP_COUNT} cards. Nothing to archive.`);
    return;
  }

  // Work out exactly how many cards need to be archived to get down to KEEP_COUNT
  const numberToArchive = cards.length - KEEP_COUNT;
  console.log(`Need to archive ${numberToArchive} card(s) to leave exactly ${KEEP_COUNT} remaining.`);

  // Attach each card's real creation date (computed from its ID) to the card object
  const cardsWithDates = cards.map((c) => ({
    ...c,
    createdAt: getCreatedDateFromId(c.id),
  }));

  // Sort ALL cards oldest-first
  cardsWithDates.sort((a, b) => a.createdAt - b.createdAt);

  // Take only the oldest N cards, where N = numberToArchive
  const cardsToArchive = cardsWithDates.slice(0, numberToArchive);

  console.log(DRY_RUN ? "\n[DRY RUN - nothing will be archived]\n" : "\n[LIVE RUN - archiving now]\n");

  let done = 0;

  // Loop through every card we've decided to archive, one at a time
  for (const card of cardsToArchive) {
    console.log(
      `${done + 1}/${cardsToArchive.length} - "${card.name}" (created ${card.createdAt.toDateString()}) - ${card.shortUrl}`
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

  // Final console summary
  console.log(
    `\nDone. ${DRY_RUN ? "Would have archived" : "Archived"} ${cardsToArchive.length} card(s). ` +
      `${KEEP_COUNT} card(s) will remain in the list.`
  );

  // Build the report text using all the cards we just processed
  const reportText = buildReportText(cardsToArchive, DRY_RUN, KEEP_COUNT);

  // Write that report text to a .txt file, and get back its full path
  const reportPath = writeReportFile(reportText);

  // Tell the user exactly where the report file was saved
  console.log(`\nReport saved to: ${reportPath}`);
}

// Actually kick off the script by calling main(), and catch any unexpected fatal errors
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});