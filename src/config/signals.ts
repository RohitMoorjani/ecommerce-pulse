/**
 * "Worth your attention" scoring. The top stories in each tab are shown as
 * highlights, with the reasons listed. Points:
 *
 *  - ecommercePoints:  the HEADLINE is about how things are sold online
 *                      (checkout, AI shopping, online store, pricing…), so
 *                      e-commerce moves outrank product launches
 *  - competitorPoints: the story is tagged ★ Competitor
 *  - coveragePoints:   per additional source covering the same story
 *  - signalPoints:     headline has a "something changed" word (max 2 counted)
 *  - numberPoints:     headline has a hard number ($, %, billion, record)
 *  - freshPoints:      published in the last 48 hours
 */
export const scoring = {
  // When Claude reviews stories: points per importance level (1-5), and the
  // minimum importance for a story to be highlighted.
  importancePoints: 3,
  minHighlightImportance: 4,
  // Keyword mode (no API key):
  ecommercePoints: 4,
  competitorPoints: 2,
  coveragePoints: 2,
  signalPoints: 1,
  numberPoints: 1,
  freshPoints: 1,
  highlightCount: 3,
  minScore: 3,
};

export const signalWords: string[] = [
  "launch", "launches", "launched", "debut", "debuts", "unveil", "unveils",
  "introduces", "first", "new", "expands", "expansion", "pilots", "rolls out",
  "acquire", "acquires", "acquisition", "partnership", "partners", "teams up",
  "exits", "shuts down", "cuts", "overtakes", "surges", "plunges", "doubles",
  "triples", "bans", "sues", "opens", "ends", "replaces",
];

export const ecommerceTerms: string[] = [
  "ecommerce", "e-commerce", "digital commerce", "online", "website",
  "web platform", "online store", "storefront", "checkout", "cart",
  "conversion", "agentic commerce", "AI shopping", "shopping",
  "shoppers", "discovery", "AI search", "marketplace", "marketplaces",
  "D2C", "DTC", "direct-to-consumer", "customer intent", "customer experience",
  "personalization", "pricing", "promotions", "deals", "payments",
  "delivery", "fulfillment", "pickup", "returns", "loyalty", "rewards",
  "retail media", "TikTok Shop", "Prime Day", "Black Friday", "Cyber Monday",
  "BFCM", "Cyber 5",
];
