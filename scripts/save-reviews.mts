/**
 * Validates reviews in data/new-reviews.json and merges them into
 * data/reviews.json. Expected shape: { "<story id>": Review | { "keep": false } }
 * where Review matches ReviewSchema in src/lib/editor.ts.
 *
 *   npm run review:save
 */
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { ReviewSchema } from "@/lib/editor";

const REVIEWS = "data/reviews.json";
const PENDING = "data/pending.json";
const NEW = "data/new-reviews.json";

const Entry = z.union([ReviewSchema, z.object({ keep: z.literal(false) })]);

const reviews = JSON.parse(readFileSync(REVIEWS, "utf8"));
const pending: { id: string; publishedAt: string }[] = JSON.parse(readFileSync(PENDING, "utf8"));
const publishedAt = new Map(pending.map((p) => [p.id, p.publishedAt]));
const incoming: Record<string, unknown> = JSON.parse(readFileSync(NEW, "utf8"));

let saved = 0;
const errors: string[] = [];
for (const [id, raw] of Object.entries(incoming)) {
  const date = publishedAt.get(id);
  if (!date) {
    errors.push(`${id}: not in pending.json`);
    continue;
  }
  const parsed = Entry.safeParse(raw);
  if (!parsed.success) {
    errors.push(`${id}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    continue;
  }
  const review = parsed.data;
  if (review.keep) {
    if (review.headline.length > 100) errors.push(`${id}: headline over 100 chars (saved anyway)`);
    if (review.short_headline.length > 60) errors.push(`${id}: short_headline over 60 chars (saved anyway)`);
  }
  reviews[id] = { ...review, publishedAt: date };
  saved++;
}
writeFileSync(REVIEWS, JSON.stringify(reviews, null, 1) + "\n");
unlinkSync(NEW);

const remaining = pending.filter((p) => !reviews[p.id]).length;
console.log(`Saved ${saved} reviews. ${remaining} still pending.`);
if (errors.length) console.log("Problems:\n- " + errors.join("\n- "));
