import {
  companyNewsKeepIf,
  companyNewsTerms,
  competitorRelevance,
  competitors,
  FALLBACK_SEGMENT,
  fallbackRelevance,
  segments,
} from "@/config/segments";
import { compileMatcher } from "@/lib/match";

const segmentMatchers = segments.map((s) => {
  const strong = compileMatcher(s.keywords);
  const weak = compileMatcher(s.weakKeywords ?? []);
  const context = compileMatcher(s.context ?? []);
  return {
    id: s.id,
    headlineOnly: s.headlineOnly ?? false,
    matches: (headline: string, text: string) =>
      strong(text).length > 0 || (weak(headline).length > 0 && context(text).length > 0),
  };
});
const matchFallback = compileMatcher(fallbackRelevance);
const matchCompanyNews = compileMatcher(companyNewsTerms);
const matchCompanyNewsKeep = compileMatcher(companyNewsKeepIf);
const matchCompetitors = compileMatcher(competitors);
const matchRelevance = compileMatcher(competitorRelevance);

/**
 * The segment a story belongs to, or null if it should be dropped as not
 * relevant to e-commerce strategy.
 */
export function classifySegment(title: string, snippet: string, isCompetitor: boolean): string | null {
  const text = `${title} ${snippet}`;
  if (
    !isCompetitor &&
    matchCompanyNews(title).length > 0 &&
    matchCompanyNewsKeep(text).length === 0
  ) {
    return null;
  }
  for (const { id, headlineOnly, matches } of segmentMatchers) {
    if (matches(title, headlineOnly ? title : text)) return id;
  }
  return matchFallback(text).length > 0 ? FALLBACK_SEGMENT.id : null;
}

/** True if the story is about something we sell or how we sell it. */
export function isCompetitorRelevant(text: string): boolean {
  return matchRelevance(text).length > 0;
}

/**
 * Competitors named in a relevant story. `fixed` is the competitor whose own
 * newsroom published it, which counts even if the text doesn't name them.
 */
export function findCompetitors(text: string, fixed?: string): string[] {
  if (!isCompetitorRelevant(text)) return [];
  const found = matchCompetitors(text);
  return fixed && !found.includes(fixed) ? [fixed, ...found] : found;
}
