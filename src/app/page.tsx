import NewsFeed from "@/components/NewsFeed";
import { CATEGORIES, sources } from "@/config/sources";
import { FALLBACK_SEGMENT, segments } from "@/config/segments";
import { brief } from "@/lib/brief";
import { getNews } from "@/lib/feeds";

export default async function Home() {
  const { items, failedSources, fetchedAt } = await getNews();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          E-Commerce Pulse
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          E-commerce industry news from verified sources · last 7 days
        </p>
      </header>

      <NewsFeed
        items={items}
        segments={[...segments, FALLBACK_SEGMENT].map(({ id, label, description }) => ({ id, label, description }))}
        categories={CATEGORIES}
        sourceNames={sources.map((s) => s.name)}
        brief={brief}
      />

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          Updated{" "}
          {new Date(fetchedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}{" "}
          UTC
        </p>
        {failedSources.length > 0 && (
          <p className="mt-1">
            Temporarily unavailable: {failedSources.join(", ")}
          </p>
        )}
      </footer>
    </main>
  );
}
