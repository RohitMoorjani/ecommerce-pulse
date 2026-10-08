import { z } from "zod";
import stored from "../../data/brief.json";
import { SEGMENT_IDS } from "@/lib/editor";

/** The Leadership Brief, written by Claude from the reviewed stories. */
export const BriefSchema = z.object({
  updatedAt: z.string(),
  summary: z.string(),
  points: z.array(
    z.object({
      headline: z.string(),
      detail: z.string(),
      segment: z.enum(SEGMENT_IDS),
      storyIds: z.array(z.string()),
    }),
  ),
});

export type Brief = z.infer<typeof BriefSchema>;

export const brief: Brief | null = BriefSchema.safeParse(stored).success
  ? (stored as Brief)
  : null;
