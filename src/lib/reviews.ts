import stored from "../../data/reviews.json";
import type { Review } from "@/lib/editor";

/**
 * Editorial reviews saved by Claude Code (see README → "Reviewing stories with
 * Claude Code"). Keyed by story id. A review with `keep: false` means Claude
 * decided the story isn't worth showing.
 */
export type StoredReview = { publishedAt: string } & (Review | { keep: false });

export const storedReviews = stored as Record<string, StoredReview>;

export function isKept(review: StoredReview): review is { publishedAt: string } & Review {
  return review.keep;
}
