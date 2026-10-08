/**
 * Keyword filter for sources that require a keyword match (Tech Press and
 * anything with `requireKeywordMatch: true` in sources.ts).
 *
 * A story is kept if its headline or snippet contains:
 *  - any word in `keywords`, or
 *  - a word in `brandKeywords` AND a word in `keywords` or `brandContext`.
 *    Brand names are ambiguous on their own ("Amazon" also means AWS data
 *    centers, "Apple" also means patent lawsuits), so they need commerce
 *    context to count.
 *
 * Matching is whole-word ("HP" does not match "PHP"). Single capitalized
 * words are case-sensitive; everything else is case-insensitive.
 */

export const keywords: string[] = [
  // E-commerce
  "ecommerce",
  "e-commerce",
  "online retail",
  "online shopping",
  "D2C",
  "DTC",
  "marketplace",
  "marketplaces",
  "checkout",
  "conversion",
  "agentic commerce",
  "AI shopping",
  "Shopify",
  "B2B commerce",
  // Consumer-electronics marketplaces
  "Best Buy",
  "Newegg",
  "Flipkart",
  "Croma",
  "Reliance Digital",
  "JD.com",
  "Tmall",
  "Mercado Libre",
  "Coupang",
  "TikTok Shop",
  "MediaMarkt",
  "Ceconomy",
  "Currys",
  "Shopee",
  "Lazada",
  // Shopper trends
  "consumer spending",
  "consumers",
  "shoppers",
  "shopping",
  "spending",
  "purchasing power",
  "Gen Z",
  "Gen Alpha",
  "millennials",
  "Millennials",
  "Gen X",
  "boomers",
  "Boomers",
  "baby boomers",
  "parents",
  "students",
  "gamers",
  "BNPL",
  "buy now, pay later",
  "Buy Now, Pay Later",
  "holiday",
  "Black Friday",
  "Cyber Monday",
  "back-to-school",
  "small business",
  "small businesses",
  "SMB",
  "SMBs",
  "last mile",
  "last-mile",
  "delivery",
  "consumer electronics",
  "electronics",
  // PC industry
  "PC market",
  "PC shipments",
  "PC",
  "PCs",
  "AI PC",
  "AI PCs",
  "laptop",
  "laptops",
  "notebook PC",
  "notebook PCs",
  "notebook shipments",
  "Chromebook",
  "Chromebooks",
  "Lenovo",
  "ASUS",
  "Acer",
];

export const brandKeywords: string[] = ["Amazon", "Dell", "HP", "Apple"];

export const brandContext: string[] = [
  "online",
  "shopping",
  "shoppers",
  "seller",
  "sellers",
  "listings",
  "retail",
  "retailer",
  "retailers",
  "store",
  "stores",
  "prices",
  "pricing",
  "deals",
  "delivery",
  "Mac",
  "MacBook",
  "iPad",
  "tablet",
  "tablets",
  "server",
  "servers",
  "workstation",
  "workstations",
  "market share",
  "shipments",
];
