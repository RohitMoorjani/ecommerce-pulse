# E-Commerce Pulse

A live feed of e-commerce industry news from a fixed list of verified sources.
Built with Next.js (App Router), TypeScript and Tailwind. It has no database:
feeds are fetched on the server and the page is regenerated every 30 minutes (ISR).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. In dev mode the feeds are fetched on every request.
`npm run build && npm start` runs the production build with the 30-minute cache.

## Reviewing stories with Claude Code (no API key needed)

Claude Code can review stories as part of your Claude subscription. Reviews
are saved to `data/reviews.json`, and the site reads them at build time.

```bash
npm run review:pending   # lists new stories in data/pending.json
```

Then ask Claude Code: *"Review data/pending.json following
src/config/editor.ts and write data/new-reviews.json"*. Then run:

```bash
npm run review:save      # validates and merges into data/reviews.json
```

Commit and push `data/reviews.json`, and the host redeploys. Stories that
haven't been reviewed yet fall back to keyword sorting. Reviews older than 10
days are pruned automatically.

## Claude editorial review via the API (optional)

With an Anthropic API key, every story is reviewed by Claude, using the
editorial brief in `src/config/editor.ts`. Claude:

- **drops** stories that aren't worth an e-commerce leader's time: generic
  opinion pieces, how-to guides, sponsored content, event promotions, and
  unrelated retail news;
- **sorts** each kept story into one of the five tabs;
- **rewrites the headline** to lead with what changed. It uses only facts from
  the source, and the original headline appears on hover.
- writes a one-line **takeaway** for a PC brand selling online, and a
  55-character version of the headline for the highlights list;
- rates **importance from 1 to 5**. Stories rated 4 or 5 can appear in "Worth
  your attention".

Each story is reviewed once and the result is cached for 10 days (Next.js data
cache, no database), so a 30-minute refresh only sends new stories to Claude.
Editing `editor.ts` invalidates the cache, so every story gets a fresh review.

Setup:

```bash
cp .env.example .env.local   # then paste your key into ANTHROPIC_API_KEY
```

On Vercel, add `ANTHROPIC_API_KEY` under Project → Settings → Environment
Variables. `CLAUDE_MODEL` is optional (default `claude-opus-5-5`).

Without a key, or if the API fails, the site falls back to keyword sorting
(described below), so the page never breaks.

## How it works

- `src/config/sources.ts`: the list of feeds (name, URL, category).
- `src/config/keywords.ts`: the keyword filter.
- `src/config/segments.ts`: the segment tabs, the keywords that sort stories into them, and the competitor list.
- `src/lib/feeds.ts` fetches every feed in parallel with `rss-parser`. If a feed
  times out or errors, it is skipped and named in the page footer; the rest of
  the page still renders. It keeps items from the last 7 days, applies the keyword
  filter, sorts newest first, and removes near-duplicate headlines (word-overlap
  similarity of 75% or more; the newest copy is kept).
- `src/app/page.tsx` sets `export const revalidate = 1800` (30 minutes).
- `src/components/NewsFeed.tsx` is the client-side UI: category chips, source
  dropdown, search box and cards.

### Keyword filter rules

- **Tech Press** sources must match at least one keyword.
- **Analyst** and **Trade Press** sources skip the filter.
- To change this for one source, set `requireKeywordMatch: true` or `false` on it.
- Brand names on their own (Amazon, Apple, Dell, HP) aren't enough to keep a
  story; it also needs commerce or PC context. That's what keeps out stories
  like "Amazon signs a nuclear power deal".

Matching is whole-word ("HP" does not match "PHP"). Single capitalized words
(Target, Prime, Surface) are case-sensitive, so "target" in ordinary text
doesn't count. Edit the lists in `src/config/keywords.ts`.

## Segment tabs and the Competitors filter

Each story goes into exactly one tab. Tabs are checked in this order, and a
story goes to the first one it matches (`src/config/segments.ts`):

| # | Tab | Covers |
| --- | --- | --- |
| 1 | Agentic Commerce | AI agents in shopping, from discovery to purchase: shopper agents, merchant agents, agent-to-agent checkout, Sparky, Rufus, Alexa+, Muse, ChatGPT shopping, AI search |
| 2 | PC Industry | PCs, tablets, servers, PC makers, and anything PC-related in digital commerce |
| 3 | Marketplaces | Amazon, Walmart, Shopify, Best Buy, Target, TikTok Shop, Temu and other marketplaces |
| 4 | Shopper Trends | Spending, consumer sentiment, seasonal demand, holiday and Cyber 5 forecasts (matched on headlines only) |
| 5 | New Plays | Everything else that's relevant: what retailers and brands are launching in delivery, payments, loyalty, marketing and store tech |

Because of this order, an AI shopping agent on Amazon goes to Agentic Commerce,
and Dell deals on Amazon go to PC Industry.

**Dropped as not relevant:**
- Stories that match no tab and don't pass `fallbackRelevance` (unrelated
  retail news).
- Executive moves, earnings, store closures and layoffs (`companyNewsTerms`),
  unless they're about e-commerce or digital, or involve a competitor.

**Worth your attention:** the top 3 stories in the current view, scored by
`src/config/signals.ts`, shown one line each. E-commerce headlines (checkout,
AI shopping, online store, pricing, delivery…) score highest, so e-commerce
moves rank above product launches. Points also come from competitor news,
coverage by several sources, hard numbers, "something changed" headline words
(launches, first, acquires…) and the last 48 hours. Cards also show which other sources
covered the same story.

The selected tab is saved in the URL (for example `/#agentic`), so you can
bookmark a tab.

**★ Competitors** is a filter that works on top of any tab. A story is tagged
when it mentions a name in the `competitors` list (Apple, HP and Dell by
default) **and** is relevant to our business, meaning it matches a term
in `competitorRelevance`: PCs, tablets, servers, competitor product lines,
online store, pricing, shopping events, market share. Both lists are in
`segments.ts`.

Competitor newsrooms (Apple Newsroom, Dell Newsroom, Dell press releases on
Business Wire, Dell Blog, HP Newsroom) are sources with `competitor` set in
`sources.ts`. They only keep relevant stories, and every story they keep is
tagged with that competitor. To add one, for example ASUS, add a source with
`category: "Competitor Newsroom"` and `competitor: "ASUS"`, and add "ASUS" to
`competitors`.

The selected tab is saved in the URL (for example `/#pc` or `/#marketplaces`),
so you can bookmark a tab.

## Adding or removing sources

Edit `src/config/sources.ts`:

```ts
{
  name: "Example News",              // shown on cards and in the source filter
  url: "https://example.com/feed/",  // RSS or Atom feed URL
  category: "Trade Press",           // "Analyst" | "Trade Press" | "Tech Press"
  requireKeywordMatch: true,         // optional override
},
```

To remove a source, delete its entry. To add one, first check that the feed URL
returns items:

```bash
curl -sL -A "Mozilla/5.0" https://example.com/feed/ | grep -c "<item\|<entry"
```

A non-zero count means the feed works. Most WordPress sites serve a feed at
`/feed/`. Otherwise look for `<link rel="alternate" type="application/rss+xml">`
in the page source.

### Google Alerts (Gartner, IDC, etc.)

1. Go to https://www.google.com/alerts and create an alert (for example `Gartner ecommerce`).
2. Click **Show options**, then set **Deliver to** to **RSS feed**, then click **Create Alert**.
3. Click the RSS icon next to the alert and copy its URL.
4. Uncomment the Google Alerts example in `sources.ts` and paste the URL into it.

Keep `requireKeywordMatch: true` on alerts so off-topic results are filtered out.

### Sources that need workarounds

| Source | Issue | Current approach |
| --- | --- | --- |
| Reuters | Public RSS feeds were discontinued (401) | Google News search limited to `site:reuters.com`, with the keyword filter on |
| Retail TouchPoints | `/feed` blocks server requests (403) | Google News search limited to `site:retailtouchpoints.com` |
| TechCrunch | `/tag/ecommerce/feed/` is rarely updated | Commerce category feed |
| IDC, Gartner, Counterpoint, Omdia/Canalys | No working public RSS feeds | Google News search limited to each firm's own site, with the keyword filter on (only PC-related stories are kept) |
| Dell Newsroom, HP Newsroom | No RSS feeds | Google News search limited to each newsroom's own pages |
| TrendForce | No public RSS feed | Google News search limited to `trendforce.com`, with the keyword filter on |
| Marketplace Pulse | No `/feed` URL | Atom feed at `/articles/recent.atom` (it posts weekly or less, so it can show 0 items in some weeks) |

Links from the Google News feeds go through a `news.google.com` redirect to the
original article.

## Deploy to Vercel (free tier)

1. Push this folder to a GitHub, GitLab or Bitbucket repository.
2. At https://vercel.com/new, import the repository. Vercel detects Next.js, so you can keep the defaults.
3. Click **Deploy**.

No environment variables are needed. ISR works on the free (Hobby) plan. The
page is rebuilt in the background at most once every 30 minutes, and only when
someone visits.

Or use the CLI:

```bash
npx vercel
```

After you edit `sources.ts` or `keywords.ts`, push the change. Vercel redeploys
automatically.
