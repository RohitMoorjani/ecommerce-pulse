import NewsFeed from "@/components/NewsFeed";
import { CATEGORIES, sources } from "@/config/sources";
import { FALLBACK_SEGMENT, segments } from "@/config/segments";
import { brief } from "@/lib/brief";
import { getNews } from "@/lib/feeds";

export default async function Home() {
  const { items, failedSources, fetchedAt } = await getNews();

  const updated = new Date(fetchedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="bg-utility text-xs text-zinc-600">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-2">Updated {updated} UTC</div>
      </div>

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">E-Commerce Pulse</h1>
          <p className="mt-1 text-sm text-zinc-600">
            E-commerce and PC industry news from verified sources · last 7 days
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-12">
        <NewsFeed
          items={items}
          segments={[...segments, FALLBACK_SEGMENT].map(({ id, label, description }) => ({ id, label, description }))}
          categories={CATEGORIES}
          sourceNames={sources.map((s) => s.name)}
          brief={brief}
        />

        {failedSources.length > 0 && (
          <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
            Temporarily unavailable: {failedSources.join(", ")}
          </footer>
        )}
      </main>
    </>
  );
}
