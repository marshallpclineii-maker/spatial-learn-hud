import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BookCard } from "@/components/library/book-card";
import { demoProvider } from "@/providers/demo-provider";
import { cn } from "@/lib/utils";

const booksQuery = queryOptions({
  queryKey: ["books", demoProvider.id],
  queryFn: () => demoProvider.listBooks(),
});

export const Route = createFileRoute("/library")({
  loader: ({ context }) => context.queryClient.ensureQueryData(booksQuery),
  head: () => ({
    meta: [
      { title: "My Library — Spatial Audio Library" },
      {
        name: "description",
        content: "Browse thematic stacks of audiobooks with Listen, Open in Audible, Enter VR and Read actions.",
      },
      { property: "og:title", content: "My Library — Spatial Audio Library" },
      { property: "og:description", content: "Search, sort and filter your spatial audiobook collection." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="glass rounded-xl p-6 text-sm">
      The library could not be loaded: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="glass rounded-xl p-6 text-sm">No library found.</div>,
  component: LibraryPage,
});

const THEMES = ["All", "Artificial Intelligence", "Philosophy", "Science"] as const;
type Sort = "title" | "author" | "duration";

function LibraryPage() {
  return (
    <Suspense fallback={<div className="glass rounded-xl p-6 text-sm text-muted-foreground">Loading library…</div>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const { data: books } = useSuspenseQuery(booksQuery);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("All");
  const [sort, setSort] = useState<Sort>("title");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books
      .filter((b) => (theme === "All" ? true : b.metadata.themes.includes(theme)))
      .filter(
        (b) =>
          !q ||
          b.metadata.title.toLowerCase().includes(q) ||
          b.metadata.author.toLowerCase().includes(q) ||
          b.metadata.description.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "duration") return a.metadata.durationSeconds - b.metadata.durationSeconds;
        if (sort === "author") return a.metadata.author.localeCompare(b.metadata.author);
        return a.metadata.title.localeCompare(b.metadata.title);
      });
  }, [books, query, theme, sort]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="text-sm text-muted-foreground">
          {books.length} titles from the {demoProvider.label} provider.
        </p>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, authors, ideas…"
            className="w-full rounded-md border border-input bg-background/60 py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                theme === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-input bg-background/60 px-2 py-2 text-xs"
          aria-label="Sort by"
        >
          <option value="title">Sort: Title</option>
          <option value="author">Sort: Author</option>
          <option value="duration">Sort: Duration</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-sm font-medium">Nothing in this stack yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No title matches “{query}” in {theme}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <BookCard key={b.metadata.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
