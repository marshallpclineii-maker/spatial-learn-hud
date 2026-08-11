import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AttentionRail, KnowledgeCard } from "@/components/reader/knowledge-hud";
import { AskTheBook } from "@/components/reader/ask-the-book";
import { PlayerBar } from "@/components/reader/player-bar";
import { TranscriptView } from "@/components/reader/transcript-view";
import { AttentionEngine } from "@/engines/attention-engine";
import { TranscriptEngine, formatTime } from "@/engines/transcript-engine";
import { useAudioEngine } from "@/engines/use-audio-engine";
import { demoProvider } from "@/providers/demo-provider";
import { useDemoSession } from "@/state/demo-session";
import { cn } from "@/lib/utils";

interface ReaderSearch {
  book: string;
  t: number;
  view?: "listen" | "read";
}

const bookQuery = (bookId: string) =>
  queryOptions({
    queryKey: ["book", bookId],
    queryFn: () => demoProvider.getBook(bookId),
  });

export const Route = createFileRoute("/reader")({
  validateSearch: (search: Record<string, unknown>): ReaderSearch => ({
    book: typeof search['book'] === "string" && search['book'] ? (search['book'] as string) : "notes-on-the-analytical-engine",
    t: Number(search['t']) || 0,
    view: search['view'] === "read" ? "read" : "listen",
  }),
  loaderDeps: ({ search: { book } }) => ({ book }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(bookQuery(deps.book)),
  head: () => ({
    meta: [
      { title: "Active Reader — Spatial Audio Library" },
      {
        name: "description",
        content:
          "Listen with a synchronized transcript, live entity attention markers, contextual knowledge cards and an Ask the Book assistant.",
      },
      { property: "og:title", content: "Active Reader — Spatial Audio Library" },
      { property: "og:description", content: "Audio, transcript and knowledge in one synchronized surface." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="glass rounded-xl p-6 text-sm">
      This book could not be opened: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="glass rounded-xl p-6 text-sm">That book is not in this library.</div>,
  component: ReaderPage,
});

function ReaderPage() {
  return (
    <Suspense fallback={<div className="glass rounded-xl p-6 text-sm text-muted-foreground">Preparing reader…</div>}>
      <ReaderContent />
    </Suspense>
  );
}

function ReaderContent() {
  const { book: bookId, t, view } = Route.useSearch();
  const { data: book } = useSuspenseQuery(bookQuery(bookId));
  const { startDemo, recordPosition, record } = useDemoSession();

  const engine = useAudioEngine(book, t);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastChapterRef = useRef<string | null>(null);

  const transcriptEngine = useMemo(() => (book ? new TranscriptEngine(book) : null), [book]);
  const attentionEngine = useMemo(() => (book ? new AttentionEngine(book) : null), [book]);

  const segment = transcriptEngine?.segmentAt(engine.currentTime) ?? null;
  const chapter = transcriptEngine?.chapterAt(engine.currentTime) ?? null;
  const attention = attentionEngine?.activeAt(engine.currentTime) ?? [];
  const selectedEntity = selectedEntityId ? (attentionEngine?.byId(selectedEntityId) ?? null) : null;

  const entityNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of attentionEngine?.allEntities() ?? []) map[e.id] = e.name;
    return map;
  }, [attentionEngine]);

  useEffect(() => {
    startDemo();
  }, [startDemo]);

  useEffect(() => {
    if (!book) return;
    recordPosition(book.metadata.id, engine.currentTime);
  }, [book, engine.currentTime, recordPosition]);

  useEffect(() => {
    if (!chapter || !book) return;
    if (lastChapterRef.current === chapter.id) return;
    lastChapterRef.current = chapter.id;
    record({
      bookId: book.metadata.id,
      atSeconds: engine.currentTime,
      kind: "chapter-reached",
      label: chapter.title,
    });
  }, [chapter, book, engine.currentTime, record]);

  if (!book) {
    return (
      <div className="glass rounded-xl p-10 text-center">
        <p className="text-sm font-medium">No spatial experience for this title yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the demo audiobook ships with a full transcript, entity set and graph.
        </p>
        <Link to="/library" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground">
          Back to library
        </Link>
      </div>
    );
  }

  const selectEntity = (id: string) => {
    setSelectedEntityId(id);
    const name = entityNames[id] ?? id;
    record({ bookId: book.metadata.id, atSeconds: engine.currentTime, kind: "entity-opened", label: name });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Active Reader</p>
          <h1 className="text-2xl font-bold tracking-tight">{book.metadata.title}</h1>
          <p className="text-sm text-muted-foreground">
            {book.metadata.author} · {book.metadata.license}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs transition-colors",
              autoScroll ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground",
            )}
          >
            Auto-scroll {autoScroll ? "on" : "off"}
          </button>
          <Link
            to="/graph"
            search={{ node: undefined }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Knowledge graph
          </Link>
        </div>
      </header>

      <PlayerBar
        currentTime={engine.currentTime}
        duration={engine.duration}
        isPlaying={engine.isPlaying}
        speed={engine.speed}
        mode={engine.mode}
        notice={engine.notice}
        chapter={chapter}
        onToggle={engine.toggle}
        onSeek={engine.seek}
        onSpeed={engine.setSpeed}
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {view === "read" ? "Read along" : "Transcript"}{" "}
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                {formatTime(engine.currentTime)}
              </span>
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              segment {segment ? book.transcript.indexOf(segment) + 1 : "—"} / {book.transcript.length}
            </p>
          </div>
          <TranscriptView
            book={book}
            currentTime={engine.currentTime}
            activeSegment={segment}
            onSeek={engine.seek}
            onSelectEntity={selectEntity}
            entityNames={entityNames}
            autoScroll={autoScroll}
          />
        </section>

        <div className="space-y-4">
          <section className="glass rounded-xl p-4">
            <h2 className="text-sm font-semibold">Knowledge HUD</h2>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              Attention priority scored live: L1 surfaces automatically, L2 is a subtle marker, L3 stays on demand.
            </p>
            <AttentionRail items={attention} selectedId={selectedEntityId} onSelect={selectEntity} />
          </section>

          {selectedEntity ? (
            <KnowledgeCard
              entity={selectedEntity}
              book={book}
              chapterId={chapter?.id ?? book.chapters[0]!.id}
              onClose={() => setSelectedEntityId(null)}
              onAsk={(q) => setPendingQuestion(q)}
              onRelated={selectEntity}
            />
          ) : (
            <div className="glass rounded-xl border-dashed p-4 text-xs text-muted-foreground">
              Select a marker above — or an ◈ tag in the transcript — to open its knowledge card. Playback continues.
            </div>
          )}

          <AskTheBook
            book={book}
            atSeconds={engine.currentTime}
            chapterId={chapter?.id ?? book.chapters[0]!.id}
            transcriptWindow={transcriptEngine?.contextWindow(engine.currentTime) ?? ""}
            selectedEntity={selectedEntity}
            pendingQuestion={pendingQuestion}
            onConsumedQuestion={() => setPendingQuestion(null)}
            onAsked={(q) =>
              record({ bookId: book.metadata.id, atSeconds: engine.currentTime, kind: "question-asked", label: q })
            }
          />
        </div>
      </div>
    </div>
  );
}
