/**
 * Validates data/new-brief.json and saves it as data/brief.json.
 * Expected shape: { title, summary, points: [{ headline, detail, segment, storyIds }] }
 *
 *   npm run brief:save
 */
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { BriefSchema } from "@/lib/brief";

const reviews = JSON.parse(readFileSync("data/reviews.json", "utf8"));
const raw = JSON.parse(readFileSync("data/new-brief.json", "utf8"));
const parsed = BriefSchema.safeParse({ ...raw, updatedAt: new Date().toISOString() });
if (!parsed.success) {
  console.error("Invalid brief:", parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "));
  process.exit(1);
}
const brief = parsed.data;
const problems: string[] = [];
if (!brief.title) problems.push("missing title");
else if (brief.title.length > 75) problems.push("title over 75 chars");
if (brief.summary.length > 280) problems.push("summary over 280 chars");
if (brief.points.length < 3 || brief.points.length > 5) problems.push("expected 3-5 points");
for (const [i, p] of brief.points.entries()) {
  if (p.headline.length > 90) problems.push(`point ${i + 1}: headline over 90 chars`);
  if (p.detail.length > 260) problems.push(`point ${i + 1}: detail over 260 chars`);
  for (const id of p.storyIds) {
    if (!reviews[id]?.keep) problems.push(`point ${i + 1}: story not found or not kept: ${id}`);
  }
}
if (problems.length) {
  console.error("Brief not saved:\n- " + problems.join("\n- "));
  process.exit(1);
}
writeFileSync("data/brief.json", JSON.stringify(brief, null, 1) + "\n");
unlinkSync("data/new-brief.json");
console.log(`Brief saved with ${brief.points.length} points.`);
