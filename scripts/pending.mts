/**
 * Lists stories that still need an editorial review and writes them to
 * data/pending.json. Also prunes saved reviews older than 35 days.
 *
 *   npm run review:pending
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getCandidates } from "@/lib/feeds";

const REVIEWS = "data/reviews.json";
const PENDING = "data/pending.json";
// Longer than the longest source window (30 days for consumer research).
const KEEP_MS = 35 * 24 * 60 * 60 * 1000;

const reviews: Record<string, { publishedAt: string }> = JSON.parse(readFileSync(REVIEWS, "utf8"));
const cutoff = Date.now() - KEEP_MS;
let pruned = 0;
for (const [id, review] of Object.entries(reviews)) {
  if (new Date(review.publishedAt).getTime() < cutoff) {
    delete reviews[id];
    pruned++;
  }
}
writeFileSync(REVIEWS, JSON.stringify(reviews, null, 1) + "\n");

const candidates = await getCandidates();
const pending = candidates
  .filter((item) => !reviews[item.id])
  .map((item) => ({
    id: item.id,
    source: item.source,
    sourceType: item.category,
    publishedAt: item.publishedAt,
    title: item.originalTitle,
    snippet: item.snippet,
  }));
writeFileSync(PENDING, JSON.stringify(pending, null, 1) + "\n");

console.log(`${pending.length} stories need review (${candidates.length} total, ${pruned} old reviews pruned) → ${PENDING}`);
