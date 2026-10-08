"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Category } from "@/config/sources";
import type { Segment } from "@/config/segments";
import { scoring } from "@/config/signals";
import type { Brief } from "@/lib/brief";
import type { NewsItem } from "@/lib/feeds";

const SEGMENT_DOTS: Record<string, string> = {
  pc: "bg-[#3b78b5]",
  marketplaces: "bg-[#c4862f]",
  agentic: "bg-[#8e5ba8]",
  trends: "bg-[#4e9a6f]",
  plays: "bg-[#8a8f98]",
};

// Soft pastel card backgrounds per section.
const SEGMENT_TINTS: Record<string, string> = {
  agentic: "bg-gradient-to-br from-[#f6ebf6] to-[#ecdff3]",
  pc: "bg-gradient-to-br from-[#eaf2fb] to-[#dfe9f6]",
  marketplaces: "bg-gradient-to-br from-[#fcf1e4] to-[#f6e7d6]",
  trends: "bg-gradient-to-br from-[#e9f5ee] to-[#ddefe5]",
  plays: "bg-gradient-to-br from-[#f3f3f5] to-[#e9e9ee]",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// The selected tab lives in the URL hash (e.g. /#pc) so it can be bookmarked.
// No hash shows the Leadership Brief; #all shows every story.
function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
const getHash = () => decodeURIComponent(window.location.hash.slice(1));
const getServerHash = () => "";

interface Props {
  items: NewsItem[];
  segments: Pick<Segment, "id" | "label" | "description">[];
  categories: Category[];
  sourceNames: string[];
  brief: Brief | null;
}

export default function NewsFeed({ items, segments, categories, sourceNames, brief }: Props) {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const showBrief = brief !== null && hash === "";
  const activeSegment = segments.find((s) => s.id === hash) ?? null;
  const isAll = !showBrief && !activeSegment;
  const [competitorsOnly, setCompetitorsOnly] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<Category | "All">("All");
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");

  // On narrow screens the tab row scrolls sideways; keep the active tab visible.
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-pressed="true"]:not([data-toggle])')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [hash]);

  // null = All stories ("#all"); "" = Leadership Brief.
  const selectSegment = (id: string | null) => {
    window.location.hash = id ?? "all";
  };

  // Items matching everything except the segment tab, so tab counts reflect
  // the other filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!competitorsOnly || item.competitors.length > 0) &&
        (category === "All" || item.category === category) &&
        (source === "All" || item.source === source) &&
        (!q || `${item.title} ${item.snippet} ${item.source}`.toLowerCase().includes(q)),
    );
  }, [items, competitorsOnly, category, source, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const item of filtered) c[item.segment] = (c[item.segment] ?? 0) + 1;
    return c;
  }, [filtered]);

  const visible = activeSegment
    ? filtered.filter((item) => item.segment === activeSegment.id)
    : filtered;

  // "Worth your attention": the highest-scoring stories in the current view.
  const highlights = [...visible]
    .filter((item) =>
      item.importance > 0
        ? item.importance >= scoring.minHighlightImportance
        : item.score >= scoring.minScore,
    )
    .sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, scoring.highlightCount);
  const highlightIds = new Set(highlights.map((item) => item.id));
  const rest = visible.filter((item) => !highlightIds.has(item.id));

  const competitorCount = useMemo(
    () => items.filter((item) => item.competitors.length > 0).length,
    [items],
  );

  const segmentLabel = (id: string) => segments.find((s) => s.id === id)?.label ?? id;

  const tab = (active: boolean, empty = false) =>
    `flex shrink-0 items-center gap-1.5 border-b-[3px] px-1 py-2.5 text-[15px] whitespace-nowrap transition-colors ${
      empty && !active ? "opacity-40 " : ""
    }${
      active
        ? "border-accent font-semibold text-zinc-900"
        : "border-transparent text-zinc-600 hover:text-zinc-900"
    }`;

  const field =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-6 space-y-3 bg-white/95 px-4 pb-3 backdrop-blur">
        <nav
          ref={navRef}
          aria-label="Segment"
          className="-mx-4 flex items-center gap-5 overflow-x-auto border-b border-zinc-200 px-4 [scrollbar-width:none]"
        >
          {brief && (
            <button
              type="button"
              onClick={() => selectSegment("")}
              aria-pressed={showBrief}
              className={`flex shrink-0 items-center gap-1.5 border-b-[3px] px-1 py-2.5 text-[15px] font-semibold whitespace-nowrap transition-colors ${
                showBrief ? "border-gold text-zinc-900" : "border-transparent text-gold-dark hover:text-zinc-900"
              }`}
            >
              Leadership Brief
            </button>
          )}
          <button
            type="button"
            onClick={() => selectSegment(null)}
            aria-pressed={isAll}
            className={tab(isAll)}
          >
            All <span className="opacity-60">{filtered.length}</span>
          </button>
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSegment(s.id)}
              aria-pressed={activeSegment?.id === s.id}
              title={s.description}
              className={tab(activeSegment?.id === s.id, !counts[s.id])}
            >
              <span className={`h-2 w-2 rounded-full ${SEGMENT_DOTS[s.id] ?? "bg-zinc-400"}`} aria-hidden />
              {s.label} <span className="opacity-60">{counts[s.id] ?? 0}</span>
            </button>
          ))}
          <span className="h-5 w-px shrink-0 bg-zinc-300" aria-hidden />
          <button
            type="button"
            onClick={() => {
              // Competitor stories can sit in any tab, so turning the filter on
              // starts from All rather than hiding matches in other tabs.
              if (!competitorsOnly) selectSegment(null);
              setCompetitorsOnly(!competitorsOnly);
            }}
            aria-pressed={competitorsOnly}
            data-toggle
            title="Only stories that mention a competitor (edit the list in segments.ts)"
            className={`my-1.5 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm whitespace-nowrap ring-1 ring-inset transition-colors ${
              competitorsOnly
                ? "bg-accent text-white ring-accent"
                : "text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
            }`}
          >
            ★ Competitors <span className="opacity-60">{competitorCount}</span>
          </button>
        </nav>

        {!showBrief && (
        <>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines…"
            aria-label="Search headlines"
            className="flex-1 rounded-lg border-2 border-zinc-800 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "All")}
              aria-label="Filter by source type"
              className={`${field} flex-1 sm:flex-none`}
            >
              <option value="All">All source types</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              aria-label="Filter by source"
              className={`${field} flex-1 sm:flex-none`}
            >
              <option value="All">All sources</option>
              {sourceNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {activeSegment && <span>{activeSegment.description} · </span>}
          {visible.length} {visible.length === 1 ? "story" : "stories"}
        </p>
        </>
        )}
      </div>

      {showBrief && brief ? (
        <BriefView
          brief={brief}
          items={items}
          segments={segments}
          counts={counts}
          onSelect={selectSegment}
          onCompetitors={() => {
            setCompetitorsOnly(true);
            selectSegment(null);
          }}
        />
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {activeSegment && filtered.length > 0 ? (
            <>
              <p>
                Nothing in {activeSegment.label} with these filters, but{" "}
                {filtered.length} {filtered.length === 1 ? "story matches" : "stories match"} in other tabs.
              </p>
              <button
                type="button"
                onClick={() => selectSegment(null)}
                className="mt-3 rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Show all tabs
              </button>
            </>
          ) : (
            <p>No stories match these filters.</p>
          )}
        </div>
      ) : (
        <>
        {highlights.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display mb-3 text-sm font-bold tracking-wide text-ink uppercase">
              Worth your attention
            </h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${SEGMENT_TINTS[item.segment] ?? SEGMENT_TINTS.plays}`}
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.originalTitle}
                    className="font-display text-lg leading-snug font-bold text-ink hover:underline"
                  >
                    {item.shortTitle}
                  </a>
                  <p className="mt-4 text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-800">{item.source}</span>
                    {item.reasons.length > 0 && <> · {item.reasons.join(" · ")}</>}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
        <ul className="grid gap-4 md:grid-cols-2">
          {rest.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${SEGMENT_TINTS[item.segment] ?? SEGMENT_TINTS.plays}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {!activeSegment && (
                  <button
                    type="button"
                    onClick={() => selectSegment(item.segment)}
                    className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-medium text-zinc-700 hover:bg-white"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEGMENT_DOTS[item.segment] ?? "bg-zinc-400"}`} aria-hidden />
                    {segmentLabel(item.segment)}
                  </button>
                )}
                {item.competitors.length > 0 && (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 font-medium text-gold-dark">
                    ★ {item.competitors.join(", ")}
                  </span>
                )}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.source}</span>
                <span aria-hidden>·</span>
                <time
                  dateTime={item.publishedAt}
                  title={new Date(item.publishedAt).toUTCString()}
                  suppressHydrationWarning
                >
                  {relativeTime(item.publishedAt)}
                </time>
              </div>
              <h2 className="font-display text-[17px] leading-snug font-bold text-ink">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.title !== item.originalTitle ? `Original headline: ${item.originalTitle}` : undefined}
                  className="hover:underline"
                >
                  {item.title}
                </a>
              </h2>
              {(item.takeaway || item.snippet) && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  {item.takeaway || item.snippet}
                </p>
              )}
              {item.coverage.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Also covered by {item.coverage.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
        </>
      )}
    </section>
  );
}

function BriefView({
  brief,
  items,
  segments,
  counts,
  onSelect,
  onCompetitors,
}: {
  brief: Brief;
  items: NewsItem[];
  segments: Pick<Segment, "id" | "label">[];
  counts: Record<string, number>;
  onSelect: (id: string | null) => void;
  onCompetitors: () => void;
}) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const updated = new Date(brief.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-8">
      <article className="relative overflow-hidden rounded-3xl border-2 border-gold/60 bg-gradient-to-br from-[#f3e4f0] via-[#ead8ea] to-[#e2d0e6] p-6 sm:p-10">
        {/* soft decorative arcs, like the reference banner */}
        <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-56 h-[34rem] w-[34rem] rounded-full bg-white/25" />
        <div aria-hidden className="pointer-events-none absolute -top-48 right-1/3 h-96 w-96 rounded-full bg-white/15" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide text-gold-dark uppercase">
              <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
              Leadership Brief · {updated}
            </p>
            <h2 className="font-display mt-5 text-3xl leading-tight font-extrabold text-ink sm:text-4xl">
              This week in e-commerce
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-800">{brief.summary}</p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="font-display rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#561a5d]"
              >
                Read all stories
              </button>
              <button
                type="button"
                onClick={onCompetitors}
                className="font-display text-sm font-bold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-[3px]"
              >
                Competitor moves
              </button>
            </div>
          </div>

          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {brief.points.map((point, i) => {
              const stories = point.storyIds.map((id) => byId.get(id)).filter((s) => s !== undefined);
              return (
                <li key={i} className="py-4">
                  <h3 className="font-display flex gap-3 text-base leading-snug font-bold text-ink">
                    <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {point.headline}
                  </h3>
                  <p className="mt-1.5 pl-8 text-sm leading-relaxed text-zinc-700">{point.detail}</p>
                  {stories.length > 0 && (
                    <ul className="mt-2 space-y-0.5 pl-8 text-xs">
                      {stories.map((story) => (
                        <li key={story.id} className="truncate">
                          <a
                            href={story.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={story.title}
                            className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
                          >
                            {story.shortTitle}
                          </a>
                          <span className="text-zinc-500"> · {story.source}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </article>

      <div>
        <h2 className="font-display mb-3 text-sm font-bold tracking-wide text-ink uppercase">Go deeper</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 ${SEGMENT_TINTS[s.id] ?? SEGMENT_TINTS.plays}`}
            >
              <span className="font-display block text-sm font-bold text-ink">{s.label}</span>
              <span className="mt-1 block text-xs text-zinc-600">
                {counts[s.id] ?? 0} {(counts[s.id] ?? 0) === 1 ? "story" : "stories"} →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
