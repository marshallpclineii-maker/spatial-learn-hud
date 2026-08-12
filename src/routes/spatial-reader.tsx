import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { Glasses } from "lucide-react";
import { KnowledgeCard } from "@/components/reader/knowledge-hud";
import { PlayerBar } from "@/components/reader/player-bar";
import { useReaderState } from "@/engines/use-reader-state";
import { formatTime } from "@/engines/transcript-engine";
import { demoProvider } from "@/providers/demo-provider";
import { useHydrated } from "@/lib/use-hydrated";
import { useWebXrSupport } from "@/xr/use-webxr-support";

const Scene = lazy(() => import("@/xr/spatial-reader-scene"));

interface SpatialSearch {
  book: string;
  t: number;
}

const bookQuery = (bookId: string) =>
  queryOptions({ queryKey: ["book", bookId], queryFn: () => demoProvider.getBook(bookId) });

export const Route = createFileRoute("/spatial-reader")({
  validateSearch: (search: Record<string, unknown>): SpatialSearch => ({
    book:
      typeof search["book"] === "string" && search["book"]
        ? (search["book"] as string)
        : "notes-on-the-analytical-engine",
    t: Number(search["t"]) || 0,
  }),
  loaderDeps: ({ search: { book } }) => ({ book }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(bookQuery(deps.book)),
  head: () => ({
    meta: [
      { title: "Spatial Reader — Spatial Knowledge Library" },
      {
        name: "description",
        content:
          "Virtual pages synchronized to the audiobook timeline, with spoken-sentence highlighting and spatial knowledge markers.",
      },
      { property: "og:title", content: "Spatial Reader — Spatial Knowledge Library" },
      {
        property: "og:description",
        content: "The same Active Reader state, projected into a 3D/WebXR reading space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="glass rounded-xl p-6 text-sm">
      Spatial reading mode could not start: {error.message}
    </div>
  ),
  component: SpatialReaderPage,
});

function SpatialReaderPage() {
  return (
    <Suspense fallback={<div className="glass rounded-xl p-6 text-sm text-muted-foreground">Preparing pages…</div>}>
      <SpatialReaderContent />
    </Suspense>
  );
}

function SpatialReaderContent() {
  const { book: bookId, t } = Route.useSearch();
  const { data: book } = useSuspenseQuery(bookQuery(bookId));
  const hydrated = useHydrated();
  const xr = useWebXrSupport();
  const reader = useReaderState(book, t);

  if (!book) {
    return (
      <div className="glass rounded-xl p-8 text-center text-sm">
        This title has no spatial content yet.{" "}
        <Link to="/library" className="text-primary underline">
          Back to library
        </Link>
      </div>
    );
  }

  const engine = reader.audio;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Spatial Reading Mode</p>
          <h1 className="text-2xl font-bold tracking-tight">{book.metadata.title}</h1>
          <p className="text-sm text-muted-foreground">
            Same audio, transcript and attention state as the Active Reader — projected onto virtual pages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reader"
            search={{ book: book.metadata.id, t: Math.floor(engine.currentTime) }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Flat reader
          </Link>
          {xr === "supported" ? (
            <button
              onClick={async () => {
                const { spatialReaderStore } = await import("@/xr/spatial-reader-scene");
                void spatialReaderStore.enterVR();
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Glasses className="size-4" /> Enter VR
            </button>
          ) : (
            <span className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground">
              {xr === "checking" ? "checking XR support…" : "WebXR unavailable — 3D view is fully usable"}
            </span>
          )}
        </div>
      </header>

      <PlayerBar
        currentTime={engine.currentTime}
        duration={engine.duration}
        isPlaying={engine.isPlaying}
        speed={engine.speed}
        mode={engine.mode}
        notice={engine.notice}
        chapter={reader.chapter}
        onToggle={engine.toggle}
        onSeek={engine.seek}
        onSpeed={engine.setSpeed}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass overflow-hidden rounded-xl">
          <div className="h-[56vh] min-h-96">
            {hydrated ? (
              <Suspense
                fallback={
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    Building the reading space…
                  </div>
                }
              >
                <Scene
                  book={book}
                  segment={reader.segment}
                  currentTime={engine.currentTime}
                  attention={reader.attention}
                  onSelectEntity={reader.selectEntity}
                  selectedName={reader.selectedEntity?.name ?? null}
                />
              </Suspense>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Preparing 3D scene…</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {reader.selectedEntity ? (
            <KnowledgeCard
              entity={reader.selectedEntity}
              book={book}
              chapterId={reader.chapter?.id ?? book.chapters[0]!.id}
              atLabel={formatTime(engine.currentTime)}
              onClose={reader.clearEntity}
              onAsk={() => undefined}
              onRelated={reader.selectEntity}
            />
          ) : (
            <div className="glass rounded-xl border-dashed p-4 text-xs text-muted-foreground">
              Entities glow beside the pages as the narrator reaches them. Select one — the narration keeps playing.
            </div>
          )}
          <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Sentence sync</p>
            <p className="mt-1 text-sm text-foreground">{reader.segment?.text ?? "—"}</p>
            <p className="mt-2">
              Word-level highlighting activates automatically when a provider supplies word timings; this demo has
              sentence-level timings only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
