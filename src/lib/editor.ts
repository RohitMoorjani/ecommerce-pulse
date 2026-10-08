import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { EDITOR_BRIEF } from "@/config/editor";

/**
 * Claude editorial review: decides whether a story is worth the reader's
 * attention, which section it belongs in, and writes a clearer headline.
 * Runs only when an Anthropic API key is configured; otherwise the site uses
 * keyword sorting. Each story is reviewed once and the result is cached, so
 * a 30-minute refresh only pays for new stories.
 */

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const CONCURRENCY = 6;
const CACHE_SECONDS = 10 * 24 * 60 * 60; // longer than the 7-day window

export const SEGMENT_IDS = ["agentic", "pc", "marketplaces", "trends", "plays"] as const;

export const ReviewSchema = z.object({
  keep: z.boolean(),
  segment: z.enum(SEGMENT_IDS),
  headline: z.string(),
  short_headline: z.string(),
  takeaway: z.string(),
  importance: z.number().int(),
  content_type: z.enum([
    "news", "data", "announcement", "analysis", "opinion", "how-to", "sponsored", "event",
  ]),
  competitors: z.array(z.enum(["Apple", "Dell", "HP"])),
});

export type Review = z.infer<typeof ReviewSchema>;

export interface ReviewInput {
  source: string;
  sourceType: string;
  publishedAt: string;
  title: string;
  snippet: string;
}

export function editorEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;

async function callClaude(input: ReviewInput): Promise<Review> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(ReviewSchema) },
    // If a request is declined by a safety classifier, retry it on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: EDITOR_BRIEF, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Review this item.\n\n${JSON.stringify(input, null, 2)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`No review (stop_reason: ${response.stop_reason})`);
  }
  const review = response.parsed_output;
  return { ...review, importance: Math.min(5, Math.max(1, review.importance)) };
}

// Short hash of the brief, so editing it invalidates cached reviews.
function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Cache across ISR regenerations and deployments (keyed by the input). Outside
// a Next.js server (e.g. a local script) there is no cache, so call directly.
const reviewCached = process.env.NEXT_RUNTIME
  ? unstable_cache(callClaude, ["editor-review", MODEL, hash(EDITOR_BRIEF)], {
      revalidate: CACHE_SECONDS,
    })
  : callClaude;

/**
 * Reviews every input, at most CONCURRENCY at a time. A failed review returns
 * null (and isn't cached), so that story falls back to keyword sorting.
 */
export async function reviewAll(inputs: ReviewInput[]): Promise<(Review | null)[]> {
  const results: (Review | null)[] = new Array(inputs.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < inputs.length) {
      const i = next++;
      try {
        results[i] = await reviewCached(inputs[i]);
      } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) throw error;
        console.error(`[editor] review failed for "${inputs[i].title}":`, (error as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, inputs.length) }, worker));
  return results;
}
