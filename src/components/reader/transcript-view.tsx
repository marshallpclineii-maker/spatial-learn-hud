import { useEffect, useRef } from "react";
import type { TranscriptSegment, UniversalBookObject } from "@/domain/types";
import { formatTime } from "@/engines/transcript-engine";
import { cn } from "@/lib/utils";

interface Props {
  book: UniversalBookObject;
  currentTime: number;
  activeSegment: TranscriptSegment | null;
  onSeek: (seconds: number) => void;
  onSelectEntity: (entityId: string) => void;
  entityNames: Record<string, string>;
  autoScroll: boolean;
}

export function TranscriptView({
  book,
  currentTime,
  activeSegment,
  onSeek,
  onSelectEntity,
  entityNames,
  autoScroll,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!autoScroll || !activeRef.current || !containerRef.current) return;
    const el = activeRef.current;
    const box = containerRef.current;
    const offset = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top: offset, behavior: "smooth" });
  }, [activeSegment?.id, autoScroll]);

  return (
    <div
      ref={containerRef}
      className="h-[52vh] overflow-y-auto pr-2 md:h-[58vh]"
      aria-label="Synchronized transcript"
    >
      <div className="space-y-1">
        {book.chapters.map((chapter) => (
          <section key={chapter.id}>
            <header className="sticky top-0 z-10 -mx-1 bg-card/85 px-1 py-2 backdrop-blur">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Chapter {chapter.index + 1} · {formatTime(chapter.startSeconds)}
              </p>
              <h3 className="text-sm font-semibold">{chapter.title}</h3>
            </header>

            {book.transcript
              .filter((s) => s.chapterId === chapter.id)
              .map((s) => {
                const isActive = activeSegment?.id === s.id;
                const isPast = s.endSeconds <= currentTime;
                return (
                  <button
                    key={s.id}
                    ref={isActive ? activeRef : undefined}
                    onClick={() => onSeek(s.startSeconds)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left transition-colors",
                      isActive
                        ? "bg-primary/12 ring-1 ring-primary/35"
                        : "hover:bg-secondary/60",
                    )}
                  >
                    <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                      {formatTime(s.startSeconds)}
                    </span>
                    <span
                      className={cn(
                        "text-base leading-relaxed",
                        isActive
                          ? "text-foreground text-glow"
                          : isPast
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70",
                      )}
                    >
                      {s.text}
                    </span>
                    {s.entityIds.length > 0 && (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {s.entityIds.map((id) => (
                          <span
                            key={id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEntity(id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                onSelectEntity(id);
                              }
                            }}
                            className={cn(
                              "cursor-pointer rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                              isActive
                                ? "border-primary/50 bg-primary/15 text-primary pulse-attention"
                                : "border-border text-muted-foreground hover:bg-secondary",
                            )}
                          >
                            ◈ {entityNames[id] ?? id}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
          </section>
        ))}
      </div>
    </div>
  );
}
