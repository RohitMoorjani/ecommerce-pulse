/**
 * News sources for E-Commerce Pulse.
 *
 * Add or remove a source by editing this list. Each entry needs:
 *  - name:      label shown on cards and in the source filter
 *  - url:       RSS or Atom feed URL
 *  - category:  "Analyst" | "Trade Press" | "Tech Press" | "Competitor Newsroom"
 *  - requireKeywordMatch (optional): force the keyword filter on/off for this
 *    source. By default, Tech Press sources must match a keyword in
 *    keywords.ts; Analyst and Trade Press sources skip the filter.
 *  - competitor (optional): marks a competitor's own newsroom. Every story it
 *    keeps is tagged with that competitor, and only stories that match
 *    `competitorRelevance` in segments.ts are kept (instead of keywords.ts).
 */

export type Category = "Analyst" | "Trade Press" | "Tech Press" | "Competitor Newsroom";

export const CATEGORIES: Category[] = ["Analyst", "Trade Press", "Tech Press", "Competitor Newsroom"];

export interface Source {
  name: string;
  url: string;
  category: Category;
  requireKeywordMatch?: boolean;
  competitor?: string;
}

export const sources: Source[] = [
  // ── Analyst ────────────────────────────────────────────────────────────
  {
    name: "Digital Commerce 360",
    url: "https://www.digitalcommerce360.com/feed/",
    category: "Analyst",
  },
  {
    name: "Marketplace Pulse",
    url: "https://www.marketplacepulse.com/articles/recent.atom",
    category: "Analyst",
  },

  // PC-industry analysts. None of these firms publish a working public RSS
  // feed, so each uses a Google News search restricted to the firm's own site.
  // Only PC-related stories are kept (keyword filter).
  {
    name: "IDC",
    url: "https://news.google.com/rss/search?q=site:idc.com+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Analyst",
    requireKeywordMatch: true,
  },
  {
    name: "Gartner",
    url: "https://news.google.com/rss/search?q=site:gartner.com+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Analyst",
    requireKeywordMatch: true,
  },
  {
    name: "Counterpoint Research",
    url: "https://news.google.com/rss/search?q=site:counterpointresearch.com+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Analyst",
    requireKeywordMatch: true,
  },
  {
    name: "Omdia",
    url: "https://news.google.com/rss/search?q=(site:omdia.tech.informa.com+OR+site:canalys.com)+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Analyst",
    requireKeywordMatch: true,
  },

  {
    // Taiwan-based research on PC, server, tablet and memory markets.
    name: "TrendForce",
    url: "https://news.google.com/rss/search?q=site:trendforce.com+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Analyst",
    requireKeywordMatch: true,
  },

  // Google Alerts RSS feeds (Gartner / IDC). In Google Alerts, set
  // "Deliver to" = "RSS feed", then paste the feed URL here, e.g.:
  // {
  //   name: "Gartner (Google Alert)",
  //   url: "https://www.google.com/alerts/feeds/XXXXXXXX/YYYYYYYY",
  //   category: "Analyst",
  //   requireKeywordMatch: true,
  // },
  // {
  //   name: "IDC (Google Alert)",
  //   url: "https://www.google.com/alerts/feeds/XXXXXXXX/ZZZZZZZZ",
  //   category: "Analyst",
  //   requireKeywordMatch: true,
  // },

  // ── Trade Press ────────────────────────────────────────────────────────
  {
    name: "Modern Retail",
    url: "https://www.modernretail.co/feed/",
    category: "Trade Press",
  },
  {
    name: "Retail Dive",
    url: "https://www.retaildive.com/feeds/news/",
    category: "Trade Press",
  },
  {
    // The main pymnts.com/feed/ is mostly banking and crypto; this is the
    // eCommerce section feed.
    name: "PYMNTS",
    url: "https://www.pymnts.com/category/news/ecommerce/feed/",
    category: "Trade Press",
  },
  {
    // retailtouchpoints.com/feed blocks server requests (HTTP 403), so this
    // uses a Google News search restricted to the site.
    name: "Retail TouchPoints",
    url: "https://news.google.com/rss/search?q=site:retailtouchpoints.com+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Trade Press",
  },
  {
    // UK and European e-commerce trade press.
    name: "InternetRetailing",
    url: "https://internetretailing.net/feed/",
    category: "Trade Press",
  },
  {
    // US consumer-electronics retail trade press (Best Buy, CE brands).
    name: "TWICE",
    url: "https://www.twice.com/feed",
    category: "Trade Press",
  },
  {
    // India retail trade press (Economic Times). Mostly fashion and FMCG, so
    // only stories matching a keyword are kept.
    name: "ETRetail",
    url: "https://retail.economictimes.indiatimes.com/rss/topstories",
    category: "Trade Press",
    requireKeywordMatch: true,
  },
  {
    // Consumer-electronics marketplaces worldwide, as reported by Reuters,
    // Bloomberg and CNBC (Google News search limited to those sites).
    name: "Global Marketplaces",
    url: "https://news.google.com/rss/search?q=(%22Best+Buy%22+OR+Newegg+OR+Flipkart+OR+%22Amazon+India%22+OR+JD.com+OR+%22Mercado+Libre%22+OR+Coupang+OR+%22TikTok+Shop%22+OR+MediaMarkt+OR+Ceconomy+OR+Currys+OR+Shopee+OR+Lazada)+(site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com)+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Trade Press",
    requireKeywordMatch: true,
  },
  {
    // Reuters discontinued its public RSS feeds, so this uses a Google News
    // search restricted to reuters.com. It is general news, so it must match
    // a keyword.
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com+(retail+OR+ecommerce+OR+e-commerce)+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Trade Press",
    requireKeywordMatch: true,
  },

  // ── Competitor newsrooms ──────────────────────────────────────────────
  // Official company news. Only stories relevant to our business
  // (PCs, tablets, servers, accessories, online store, pricing) are kept.
  {
    name: "Apple Newsroom",
    url: "https://www.apple.com/newsroom/rss-feed.rss",
    category: "Competitor Newsroom",
    competitor: "Apple",
  },
  {
    // Dell's newsroom has no RSS feed; this is a Google News search
    // restricted to it.
    name: "Dell Newsroom",
    url: "https://news.google.com/rss/search?q=site:dell.com/en-us/dt/corporate/newsroom+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Competitor Newsroom",
    competitor: "Dell",
  },
  {
    name: "Dell Press Releases",
    url: "https://news.google.com/rss/search?q=site:businesswire.com+%22Dell+Technologies%22+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Competitor Newsroom",
    competitor: "Dell",
  },
  {
    name: "Dell Blog",
    url: "https://www.dell.com/en-us/blog/feed/",
    category: "Competitor Newsroom",
    competitor: "Dell",
  },
  {
    // HP's newsroom has no RSS feed; this is a Google News search
    // restricted to it.
    name: "HP Newsroom",
    url: "https://news.google.com/rss/search?q=site:hp.com/us-en/newsroom+when:7d&hl=en-US&gl=US&ceid=US:en",
    category: "Competitor Newsroom",
    competitor: "HP",
  },

  // ── Tech Press ─────────────────────────────────────────────────────────
  {
    // The /tag/ecommerce/ feed is rarely updated; the Commerce category feed
    // is TechCrunch's active e-commerce section.
    name: "TechCrunch",
    url: "https://techcrunch.com/category/commerce/feed/",
    category: "Tech Press",
  },
  {
    // India startup and e-commerce news (Flipkart, quick commerce, D2C).
    name: "Inc42",
    url: "https://inc42.com/feed/",
    category: "Tech Press",
  },
  {
    // IT channel news; strong on PC makers.
    name: "CRN",
    url: "https://www.crn.com/news/rss.xml",
    category: "Tech Press",
  },
  {
    // Asian supply-chain news: notebook shipments, components, ODMs.
    name: "DigiTimes",
    url: "https://www.digitimes.com/rss/daily.xml",
    category: "Tech Press",
  },
];
