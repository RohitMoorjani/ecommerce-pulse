"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Category } from "@/config/sources";
import type { Segment } from "@/config/segments";
import { scoring } from "@/config/signals";
import type { NewsItem } from "@/lib/feeds";

const SEGMENT_DOTS: Record<string, string> = {
  pc: "bg-sky-500",
  marketplaces: "bg-amber-500",
  agentic: "bg-fuchsia-500",
  trends: "bg-emerald-500",
  plays: "bg-zinc-400",
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

// The selected tab lives in the URL hash (e.g. /#fulfillment) so it can be
// bookmarked and survives the 30-minute page refresh.
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
}

export default function NewsFeed({ items, segments, categories, sourceNames }: Props) {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const activeSegment = segments.find((s) => s.id === hash) ?? null;
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

  const selectSegment = (id: string | null) => {
    window.location.hash = id ?? "";
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
    `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
      empty && !active ? "opacity-40 " : ""
    }${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const field =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600";

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-4 space-y-3 bg-background/90 px-4 py-3 backdrop-blur">
        <nav
          ref={navRef}
          aria-label="Segment"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
        >
          <button
            type="button"
            onClick={() => selectSegment(null)}
            aria-pressed={!activeSegment}
            className={tab(!activeSegment)}
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
          <span className="mx-1 w-px shrink-0 self-stretch bg-zinc-200 dark:bg-zinc-800" aria-hidden />
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
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap ring-1 ring-inset transition-colors ${
              competitorsOnly
                ? "bg-amber-400 text-zinc-900 ring-amber-400"
                : "text-zinc-700 ring-zinc-300 hover:bg-zinc-100 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            ★ Competitors <span className="opacity-60">{competitorCount}</span>
          </button>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines…"
            aria-label="Search headlines"
            className={`${field} flex-1`}
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
      </div>

      {visible.length === 0 ? (
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
          <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-400/25 dark:bg-amber-400/[0.06]">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
              Worth your attention
            </h2>
            <ol className="space-y-2">
              {highlights.map((item) => (
                <li key={item.id} className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.originalTitle}
                    className="min-w-0 truncate text-sm font-semibold hover:underline sm:flex-1"
                  >
                    {item.shortTitle}
                  </a>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {[item.source, ...item.reasons].join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <ul className="space-y-3">
          {rest.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {!activeSegment && (
                  <button
                    type="button"
                    onClick={() => selectSegment(item.segment)}
                    className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEGMENT_DOTS[item.segment] ?? "bg-zinc-400"}`} aria-hidden />
                    {segmentLabel(item.segment)}
                  </button>
                )}
                {item.competitors.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
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
              <h2 className="text-base font-semibold leading-snug">
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
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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
