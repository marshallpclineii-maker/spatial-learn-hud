import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Glasses, Play, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { BookSummary } from "@/domain/types";
import { formatTime } from "@/engines/transcript-engine";
import { deletePersonalRecord } from "@/personal/personal-store";
import type { BookOrigin } from "@/providers/registry";
import { cn } from "@/lib/utils";

const ACCENTS: Record<string, string> = {
  cyan: "from-primary/35 to-primary/5",
  amber: "from-accent/35 to-accent/5",
  emerald: "from-chart-4/35 to-chart-4/5",
  slate: "from-muted/60 to-muted/10",
};

const LINK_LABEL: Record<string, string> = {
  audible: "Open in Audible",
  "libro-fm": "Open in Libro.fm",
  source: "Read the source text",
};

export function BookCard({ book, origin }: { book: BookSummary; origin?: BookOrigin }) {
  const { metadata: m, hasFullExperience } = book;
  const shownOrigin: BookOrigin = origin ?? book.origin;
  const queryClient = useQueryClient();
  // Provider-agnostic: the first declared link wins, and a declared-but-null
  // link renders as an explicit unavailable state rather than disappearing.
  const linkEntries = Object.entries(m.externalLinks);
  const primary = linkEntries.find(([, url]) => Boolean(url)) ?? linkEntries[0];
  const primaryKey = primary?.[0] ?? "audible";
  const primaryUrl = primary?.[1] ?? null;

  return (
    <article className="glass group flex flex-col overflow-hidden rounded-xl transition-shadow hover:shadow-[0_0_40px_var(--glow)]">
      <div
        className={cn(
          "relative flex h-40 items-end bg-gradient-to-br p-4",
          ACCENTS[m.coverAccent] ?? ACCENTS['slate'],
        )}
      >
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 font-mono text-[10px] tracking-widest uppercase">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5",
              origin === "personal"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-dashed border-border text-muted-foreground",
            )}
          >
            {origin}
          </span>
          <span className="text-muted-foreground">{hasFullExperience ? "full experience" : "catalog only"}</span>
        </div>
        <div>
          <h3 className="text-lg leading-tight font-semibold">{m.title}</h3>
          <p className="text-xs text-muted-foreground">
            {m.author}
            {m.year ? ` · ${m.year > 0 ? m.year : `${Math.abs(m.year)} BCE`}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">{m.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {m.themes.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
              {t}
            </span>
          ))}
          <span className="rounded-full px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {formatTime(m.durationSeconds)}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          {hasFullExperience ? (
            <Link
              to="/reader"
              search={{ book: m.id, t: 0 }}
              className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="size-3.5" /> Listen
            </Link>
          ) : (
            <button
              disabled
              title="Full spatial experience not yet prepared for this title"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground opacity-60"
            >
              <Play className="size-3.5" /> Listen
            </button>
          )}

          {audible ? (
            <a
              href={audible}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <ExternalLink className="size-3.5" /> Open in Audible
            </a>
          ) : (
            <button
              disabled
              title="No valid Audible listing for this title"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground opacity-60"
            >
              <ExternalLink className="size-3.5" /> Unavailable
            </button>
          )}

          <Link
            to="/virtual-library"
            search={{ book: m.id }}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
          >
            <Glasses className="size-3.5" /> Enter VR
          </Link>

          {hasFullExperience ? (
            <Link
              to="/reader"
              search={{ book: m.id, t: 0, view: "read" }}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <BookOpen className="size-3.5" /> Read
            </Link>
          ) : (
            <button
              disabled
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground opacity-60"
            >
              <BookOpen className="size-3.5" /> Read
            </button>
          )}

          {origin === "personal" && (
            <button
              onClick={() => {
                void deletePersonalRecord(m.id).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["books", "all"] }),
                );
              }}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" /> Remove from this device
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
