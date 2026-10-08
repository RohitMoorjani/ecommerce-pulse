/**
 * Segment tabs. Each story goes into exactly one segment: the FIRST one in
 * this list that it matches. Order matters: an AI shopping agent on Amazon
 * goes to Agentic Commerce, and Dell deals on Amazon go to PC Industry.
 *
 * A story matches a segment if its headline or snippet contains:
 *  - any word in `keywords`, or
 *  - a word in `weakKeywords` in the HEADLINE, plus a word in `context`
 *    anywhere (for terms that are too broad alone, e.g. "agentic" is
 *    everywhere in tech news but only counts here when the headline is about
 *    it and the story mentions shopping, checkout, merchants etc.).
 *
 * Shopper Trends only looks at headlines, because words like "shoppers"
 * appear in almost every retail snippet.
 *
 * Stories that match no segment go to FALLBACK_SEGMENT, but only if they pass
 * `fallbackRelevance` (otherwise they're dropped as not relevant to
 * e-commerce strategy).
 *
 * Matching is whole-word. Single capitalized words (Target, Prime, Surface)
 * are case-sensitive; everything else is case-insensitive.
 */

export interface Segment {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  weakKeywords?: string[];
  context?: string[];
  /** Only look at the headline (for segments whose words are common in snippets). */
  headlineOnly?: boolean;
}

export const segments: Segment[] = [
  {
    id: "agentic",
    label: "Agentic Commerce",
    description:
      "AI agents in shopping, from discovery to purchase: shopper agents, merchant agents, agent-to-agent checkout, AI assistants and AI search",
    keywords: [
      "agentic commerce", "agentic shopping", "agentic checkout", "agentic ordering",
      "agentic payments", "shopping agent", "shopping agents", "AI shopping",
      "AI shopper", "AI shoppers", "shopping assistant", "shopping assistants",
      "agent-to-agent", "A2A", "WebMCP", "Agentic Commerce Protocol",
      "Universal Commerce Protocol", "Agent Pay", "Agent Payments",
      "Intelligent Commerce", "conversational commerce", "AI discovery",
      "AI traffic", "AI-powered discovery", "AI-powered shopping", "AI-powered search",
      "generative engine optimization", "Sparky", "Rufus",
    ],
    // Too broad alone (Alexa is also a tablet feature, ChatGPT is also an
    // office tool), so these need one of the `context` words too.
    weakKeywords: [
      "agentic", "AI agent", "AI agents", "AI assistant", "AI assistants", "AI search",
      "chatbot", "chatbots", "LLM", "LLMs", "Muse", "ChatGPT", "Perplexity",
      "Alexa", "Alexa+", "OpenAI", "Gemini", "Copilot", "Anthropic", "Claude",
    ],
    context: [
      "shopping", "shop", "shoppers", "shopper", "commerce", "ecommerce",
      "e-commerce", "checkout", "purchase", "purchases", "buy", "buying",
      "ordering", "retail", "retailer", "retailers", "merchant", "merchants",
      "storefront", "online store", "catalog", "payments", "discovery",
      "customer intent", "customer journey", "web platform", "BFCM",
    ],
  },
  {
    id: "pc",
    label: "PC Industry",
    description: "PCs, tablets and servers: the market, PC makers and everything PC-related in digital commerce",
    keywords: [
      "PC", "PCs", "PC market", "PC shipments", "AI PC", "AI PCs", "Copilot+",
      "laptop", "laptops", "notebook PC", "notebook PCs", "notebook shipments",
      "desktop", "desktops", "workstation", "workstations", "Chromebook",
      "Chromebooks", "tablet", "tablets", "iPad", "Mac", "MacBook", "iMac",
      "Windows 11", "Windows 10", "Surface", "Lenovo", "ThinkPad", "Legion",
      "Dell", "Alienware", "XPS", "Inspiron", "Latitude", "OptiPlex", "Dell Pro",
      "Dell Pro Max", "PowerEdge", "HP", "OmniBook", "EliteBook", "ProBook",
      "ZBook", "Spectre", "Envy", "Omen", "ASUS", "Asus", "Acer", "MSI", "Razer",
      "server", "servers", "DRAM", "memory prices",
    ],
  },
  {
    id: "marketplaces",
    label: "Marketplaces",
    description:
      "Marketplaces and retailers that sell consumer electronics, worldwide: Amazon, Best Buy, Walmart, Flipkart, JD.com, MediaMarkt and more",
    keywords: [
      "marketplace", "marketplaces", "third-party sellers",
      // North America
      "Amazon", "Prime Day", "Prime Big Deal Days", "Best Buy", "Walmart", "Target",
      "Costco", "Newegg", "Micro Center", "B&H", "TikTok Shop", "eBay", "Shopify",
      // India
      "Flipkart", "Croma", "Reliance Digital", "Vijay Sales", "Amazon India",
      // China and Asia-Pacific
      "JD.com", "Tmall", "Alibaba", "AliExpress", "Temu", "Coupang", "Rakuten",
      "Shopee", "Lazada", "JB Hi-Fi",
      // Europe, Middle East, Latin America
      "MediaMarkt", "Ceconomy", "Currys", "Fnac", "Darty", "Otto", "Argos", "Noon",
      "Mercado Libre", "Allegro", "Zalando",
    ],
  },
  {
    id: "trends",
    label: "Shopper Trends",
    description: "What shoppers are doing: spending, sentiment, seasonal demand, holiday and Cyber 5 forecasts",
    headlineOnly: true,
    keywords: [
      "consumer confidence", "consumer sentiment", "consumer spending", "spending",
      "shoppers", "consumers", "shopping behavior", "online sales", "forecast",
      "forecasts", "projection", "survey", "study", "holiday season",
      "holiday sales", "holiday shopping", "holiday spending", "holiday forecast", "Cyber 5", "Cyber Five", "Cyber Week", "Cyber Monday",
      "Black Friday", "back-to-school", "back to school", "Q4", "peak season",
      "Gen Z", "millennials", "inflation", "tariff", "tariffs", "traffic",
    ],
  },
];

export const FALLBACK_SEGMENT = {
  id: "plays",
  label: "New Plays",
  description:
    "What other retailers and brands are launching (delivery, payments, loyalty, marketing, store tech): ideas to borrow or threats to watch",
};

/**
 * A story that matches no segment above is kept in New Plays only if it
 * mentions one of these. Everything else (unrelated earnings, executive
 * moves, store closures) is dropped.
 */
export const fallbackRelevance: string[] = [
  "ecommerce", "e-commerce", "online", "digital", "omnichannel", "app",
  "website", "D2C", "DTC", "direct-to-consumer", "delivery", "fulfillment",
  "last-mile", "last mile", "shipping", "freight", "logistics", "returns",
  "loyalty", "rewards", "membership", "subscription", "payments", "checkout",
  "BNPL", "credit card", "retail media", "advertising", "ads", "marketing",
  "creator", "creators", "influencer", "influencers", "social commerce",
  "TikTok", "livestream", "personalization", "catalog", "product feed",
  "pricing", "promotions", "customer experience", "customer data",
  "gamification", "drone", "robot", "robots", "automation",
];

/**
 * People moves and financial results are only kept when they're about
 * e-commerce or digital (e.g. "names chief digital officer"), or involve a
 * competitor.
 */
export const companyNewsTerms: string[] = [
  "CEO", "CFO", "COO", "CMO", "chief financial officer", "chief executive",
  "names", "appoints", "appointed", "hires", "steps down", "jumps to",
  "exits", "departs", "leaves", "leadership shake-up",
  "earnings", "quarterly results", "quarter", "layoffs", "job cuts",
  "turnaround", "closes", "closing", "shutter", "bankruptcy",
];
export const companyNewsKeepIf: string[] = [
  "ecommerce", "e-commerce", "online", "digital", "direct-to-consumer", "DTC", "D2C",
];

/**
 * Competitors filter. A story gets a ★ tag when it mentions a competitor AND
 * is relevant to our business, meaning it matches a term in
 * `competitorRelevance`. Stories from a competitor's own newsroom (see
 * `competitor` in sources.ts) are tagged automatically but must still match.
 */
export const competitors: string[] = ["Apple", "HP", "Dell"];

export const competitorRelevance: string[] = [
  // Product categories we sell online
  "PC", "PCs", "AI PC", "AI PCs", "Copilot+", "laptop", "laptops", "notebook",
  "notebooks", "desktop", "desktops", "workstation", "workstations", "tablet",
  "tablets", "Chromebook", "Chromebooks", "Googlebook", "monitor", "monitors",
  "accessories", "docking station", "server", "servers",
  "gaming PC", "gaming laptop",
  // Competitor product lines
  "Mac", "MacBook", "MacBook Air", "MacBook Pro", "iMac", "Mac mini",
  "Mac Studio", "Mac Pro", "iPad", "Studio Display", "XPS", "Inspiron",
  "Latitude", "Precision", "OptiPlex", "Alienware", "Dell Pro", "Dell Pro Max",
  "PowerEdge", "OmniBook", "EliteBook", "ProBook", "ZBook", "Spectre", "Envy",
  "Pavilion", "Omen", "HyperX",
  // Digital commerce
  "ecommerce", "e-commerce", "online store", "digital commerce", "website",
  "web platform", "customer experience", "customer intent", "agentic commerce",
  "pricing", "prices", "price", "trade-in", "trade in", "financing",
  "back to school", "education pricing", "Black Friday",
  "Cyber Monday", "Prime Day", "holiday",
  // Market data
  "market share", "shipments",
];
