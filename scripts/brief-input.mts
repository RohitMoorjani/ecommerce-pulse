/**
 * Writes data/brief-input.json: the reviewed stories from the last 7 days, as
 * input for writing the Leadership Brief (see BRIEF_INSTRUCTIONS in
 * src/config/editor.ts).
 *
 *   npm run brief:input
 */
import { readFileSync, writeFileSync } from "node:fs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const reviews: Record<string, Record<string, unknown> & { keep: boolean; publishedAt: string }> =
  JSON.parse(readFileSync("data/reviews.json", "utf8"));

const stories = Object.entries(reviews)
  .filter(([, r]) => r.keep && Date.now() - new Date(r.publishedAt).getTime() < WEEK_MS)
  .map(([id, r]) => ({
    id,
    source: id.split("::")[0],
    publishedAt: r.publishedAt,
    segment: r.segment,
    importance: r.importance,
    competitors: r.competitors,
    headline: r.headline,
    takeaway: r.takeaway,
  }))
  .sort((a, b) => (b.importance as number) - (a.importance as number));

writeFileSync("data/brief-input.json", JSON.stringify(stories, null, 1) + "\n");
console.log(`${stories.length} reviewed stories → data/brief-input.json`);
