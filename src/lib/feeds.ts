import Parser from "rss-parser";
import { brandContext, brandKeywords, keywords } from "@/config/keywords";
import { ecommerceTerms, scoring, signalWords } from "@/config/signals";
import { sources, type Category, type Source } from "@/config/sources";
import { classifySegment, findCompetitors, isCompetitorRelevant } from "@/lib/classify";
import { editorEnabled, reviewAll, type Review } from "@/lib/editor";
import { isKept, storedReviews } from "@/lib/reviews";
import { compileMatcher } from "@/lib/match";

export interface NewsItem {
  id: string;
  /** Headline shown on the card: Claude's rewrite when reviewed, else the original. */
  title: string;
  originalTitle: string;
  /** One-line version for the highlights list. */
  shortTitle: string;
  /** Claude's one-sentence implication for us ("" when not reviewed). */
  takeaway: string;
  /** Claude's 1-5 importance rating (0 when not reviewed). */
  importance: number;
  /** Whether keyword rules alone would keep this story (used if review fails). */
  keywordKept: boolean;
  link: string;
  source: string;
  category: Category;
  segment: string;
  competitors: string[];
  /** Other sources that covered the same story. */
  coverage: string[];
  /** "Worth your attention" score and the reasons behind it. */
  score: number;
  reasons: string[];
  publishedAt: string; // ISO
  snippet: string;
}

export interface FeedResult {
  items: NewsItem[];
  failedSources: string[];
  fetchedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_AGE_DAYS = 7;
const SNIPPET_LENGTH = 220;
const DUPLICATE_THRESHOLD = 0.75;
// Lower bar for "another source covered the same story" (shown, not merged).
const COVERAGE_THRESHOLD = 0.4;

const FETCH_TIMEOUT_MS = 10_000;
const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; EcommercePulse/1.0; +https://vercel.com)",
  Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
};

const parser = new Parser();

// Some feeds (e.g. PYMNTS) contain bare "&" characters that break XML
// parsing; escape any "&" that does not start a valid entity.
const BARE_AMPERSAND = /&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g;

async function fetchFeed(url: string) {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = (await res.text()).replace(BARE_AMPERSAND, "&amp;");
  return parser.parseString(xml);
}

const matchKeywords = compileMatcher(keywords);
const matchBrands = compileMatcher(brandKeywords);
const matchBrandContext = compileMatcher(brandContext);

function passesKeywordFilter(text: string) {
  if (matchKeywords(text).length > 0) return true;
  return matchBrands(text).length > 0 && matchBrandContext(text).length > 0;
}

function needsKeywordMatch(source: Source) {
  return (
    source.requireKeywordMatch ??
    (source.category === "Tech Press" || source.category === "Consumer Research")
  );
}

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function clean(text: string | undefined) {
  if (!text) return "";
  return decodeEntities(text.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "") + "…";
}

// Google News titles end in " - Publisher"; drop that suffix.
function stripPublisherSuffix(title: string, source: Source) {
  if (!source.url.includes("news.google.com")) return title;
  const i = title.lastIndexOf(" - ");
  return i > 0 ? title.slice(0, i) : title;
}

// With `keepUnsorted`, stories the keyword rules would drop are kept as
// candidates so Claude can make the call.
async function fetchSource(source: Source, keepUnsorted: boolean): Promise<NewsItem[]> {
  const feed = await fetchFeed(source.url);
  const cutoff = Date.now() - (source.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS) * DAY_MS;
  const filterByKeyword = needsKeywordMatch(source);

  const items: NewsItem[] = [];
  for (const entry of feed.items) {
    const dateStr = entry.isoDate ?? entry.pubDate;
    const date = dateStr ? new Date(dateStr) : null;
    if (!date || isNaN(date.getTime()) || date.getTime() < cutoff) continue;
    if (!entry.title || !entry.link) continue;

    // Some newsrooms prefix titles with a date, e.g. "2026.10.07 | ...".
    const title = stripPublisherSuffix(clean(entry.title), source).replace(/^\d{4}[.\-/]\d{2}[.\-/]\d{2}\s*\|\s*/, "");
    let snippet = clean(entry.contentSnippet || entry.summary || entry.content);
    // Google News "snippets" just repeat the headline and publisher.
    if (snippet.startsWith(title)) snippet = "";

    const text = `${title} ${snippet}`;
    if (source.competitor) {
      if (!isCompetitorRelevant(text)) continue;
    } else if (filterByKeyword && !passesKeywordFilter(text)) {
      continue;
    }

    const competitors = findCompetitors(text, source.competitor);
    const segment = classifySegment(title, snippet, competitors.length > 0);
    if (!segment && !keepUnsorted) continue;

    items.push({
      id: `${source.name}::${entry.guid ?? entry.link}`,
      title,
      originalTitle: title,
      shortTitle: title,
      takeaway: "",
      importance: 0,
      keywordKept: segment !== null,
      link: entry.link,
      source: source.name,
      category: source.category,
      segment: segment ?? "plays",
      competitors,
      coverage: [],
      score: 0,
      reasons: [],
      publishedAt: date.toISOString(),
      snippet: truncate(snippet, SNIPPET_LENGTH),
    });
  }
  return items;
}

function tokens(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function similarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

// Items arrive sorted newest first; keep the first of each near-duplicate group.
function dedupe(items: NewsItem[]) {
  const kept: { item: NewsItem; tokens: Set<string> }[] = [];
  for (const item of items) {
    const t = tokens(item.title);
    if (kept.some((k) => similarity(k.tokens, t) >= DUPLICATE_THRESHOLD)) continue;
    kept.push({ item, tokens: t });
  }
  return kept.map((k) => k.item);
}

const matchSignal = compileMatcher(signalWords);
const matchEcommerce = compileMatcher(ecommerceTerms);
const HARD_NUMBER = /[$€£¥]\s?\d|\d\s?%|\b\d+(\.\d+)?\s?(billion|million|trillion)\b|\brecord\b/i;
const FRESH_MS = 48 * 60 * 60 * 1000;

// Note which other sources covered each story, then score it.
function annotate(kept: NewsItem[], all: NewsItem[]) {
  const allTokens = all.map((item) => ({ item, tokens: tokens(item.originalTitle) }));
  const now = Date.now();
  for (const item of kept) {
    const t = tokens(item.originalTitle);
    item.coverage = [
      ...new Set(
        allTokens
          .filter((o) => o.item.source !== item.source && similarity(o.tokens, t) >= COVERAGE_THRESHOLD)
          .map((o) => o.item.source),
      ),
    ];

    // Short labels shown on highlights. Signal words and freshness add
    // points but aren't listed, to keep highlights to one line.
    const reasons: string[] = [];
    let score = 0;
    if (item.importance > 0) {
      // Reviewed by Claude: its importance rating dominates the score.
      score += scoring.importancePoints * item.importance;
    } else if (matchEcommerce(item.title).length > 0) {
      score += scoring.ecommercePoints;
      reasons.push("E-commerce");
    }
    if (item.competitors.length > 0) {
      score += scoring.competitorPoints;
      reasons.push(`★ ${item.competitors.join(", ")}`);
    }
    if (item.coverage.length > 0) {
      score += scoring.coveragePoints * item.coverage.length;
      reasons.push(`${item.coverage.length + 1} sources`);
    }
    if (HARD_NUMBER.test(item.title)) {
      score += scoring.numberPoints;
      reasons.push("Numbers");
    }
    if (item.importance === 0) {
      score += scoring.signalPoints * matchSignal(item.title).slice(0, 2).length;
    }
    if (now - new Date(item.publishedAt).getTime() < FRESH_MS) {
      score += scoring.freshPoints;
    }
    item.score = score;
    item.reasons = reasons;
  }
}

function applyReview(item: NewsItem, review: Review, fixedCompetitor?: string) {
  item.segment = review.segment;
  item.title = review.headline.trim() || item.originalTitle;
  item.shortTitle = review.short_headline.trim() || item.title;
  item.takeaway = review.takeaway.trim();
  item.importance = review.importance;
  const competitors = new Set<string>(review.competitors);
  if (fixedCompetitor && competitors.size === 0) competitors.add(fixedCompetitor);
  item.competitors = [...competitors];
}

const sourceByName = new Map(sources.map((s) => [s.name, s]));

// Stories nobody has reviewed yet are hidden unless SHOW_UNREVIEWED=true
// (then they appear sorted by keyword rules).
const SHOW_UNREVIEWED = process.env.SHOW_UNREVIEWED === "true";

// Applies reviews saved by Claude Code (data/reviews.json). Returns the kept
// stories and the ones that still need a review.
function applyStoredReviews(items: NewsItem[]) {
  const kept: NewsItem[] = [];
  const unreviewed: NewsItem[] = [];
  for (const item of items) {
    const review = storedReviews[item.id];
    if (!review) unreviewed.push(item);
    else if (isKept(review) && review.importance > 1) {
      applyReview(item, review, sourceByName.get(item.source)?.competitor);
      kept.push(item);
    }
  }
  return { kept, unreviewed };
}

// Sends each story to the Claude API (only when an API key is set). Stories
// Claude drops are removed; stories whose review failed keep their keyword
// result (or are removed if keywords would have dropped them).
async function editorialReview(items: NewsItem[]): Promise<NewsItem[]> {
  let reviews: (Review | null)[];
  try {
    reviews = await reviewAll(
      items.map((item) => ({
        source: item.source,
        sourceType: item.category,
        publishedAt: item.publishedAt,
        title: item.originalTitle,
        snippet: item.snippet,
      })),
    );
  } catch (error) {
    console.error("[editor] disabled for this refresh:", (error as Error).message);
    return items.filter((item) => item.keywordKept);
  }
  return items.filter((item, i) => {
    const review = reviews[i];
    if (!review) return item.keywordKept;
    if (!review.keep || review.importance <= 1) return false;
    applyReview(item, review, sourceByName.get(item.source)?.competitor);
    return true;
  });
}

async function fetchAll() {
  // Always keep keyword-dropped stories as candidates: a saved review or the
  // API may still keep them.
  const results = await Promise.allSettled(sources.map((s) => fetchSource(s, true)));

  const failedSources: string[] = [];
  const all: NewsItem[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      failedSources.push(sources[i].name);
      console.error(`[feeds] ${sources[i].name} failed:`, result.reason?.message ?? result.reason);
    }
  });

  all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return { all, candidates: dedupe(all), failedSources };
}

/** Deduplicated stories from the last 7 days, before any review or filtering. */
export async function getCandidates() {
  return (await fetchAll()).candidates;
}

export async function getNews(): Promise<FeedResult> {
  const { all, candidates, failedSources } = await fetchAll();

  const { kept, unreviewed } = applyStoredReviews(candidates);
  const rest = editorEnabled()
    ? await editorialReview(unreviewed)
    : SHOW_UNREVIEWED
      ? unreviewed.filter((item) => item.keywordKept)
      : [];
  const items = [...kept, ...rest].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  annotate(items, all);

  return {
    items,
    failedSources,
    fetchedAt: new Date().toISOString(),
  };
}
