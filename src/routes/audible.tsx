import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Headphones, Info, Loader2, Sparkles } from "lucide-react";
import {
  audibleSearchUrl,
  parseAudibleLibraryPaste,
  type ParsedLibraryRow,
} from "@/personal/audible-library-parse";
import { buildImportedBook } from "@/personal/import-pipeline";
import { putPersonalRecord } from "@/personal/personal-store";

export const Route = createFileRoute("/audible")({
  head: () => ({
    meta: [
      { title: "Connect My Audible Library — Spatial Knowledge Library" },
      {
        name: "description",
        content:
          "Bring the titles you own on Audible into a 2D, 3D and WebXR knowledge library. Audible keeps playing the audio; this app runs the synchronized knowledge layer.",
      },
      { property: "og:title", content: "Connect My Audible Library" },
      {
        property: "og:description",
        content: "Your Audible titles as a spatial knowledge library — companion timeline, no credentials, no scraping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AudibleConnectPage,
});

const EXAMPLE = `Project Hail Mary — Andy Weir — 16 hrs and 10 mins
Sapiens: A Brief History of Humankind by Yuval Noah Harari · 15 hrs and 17 mins
The Pragmatic Programmer — David Thomas, Andrew Hunt — 9 hrs and 30 mins`;

interface Row extends ParsedLibraryRow {
  selected: boolean;
}

function AudibleConnectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paste, setPaste] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(0);

  const selectedCount = useMemo(() => rows?.filter((r) => r.selected).length ?? 0, [rows]);

  const analyse = () => {
    setError(null);
    const parsed = parseAudibleLibraryPaste(paste);
    if (parsed.length === 0) {
      setError("No titles were found in that text. One title per line, e.g. “Title — Author — 9 hrs and 30 mins”.");
      setRows(null);
      return;
    }
    setRows(parsed.map((r) => ({ ...r, selected: true })));
  };

  const patch = (index: number, next: Partial<Row>) =>
    setRows((prev) => prev?.map((r, i) => (i === index ? { ...r, ...next } : r)) ?? prev);

  const addSelected = async () => {
    if (!rows) return;
    const picked = rows.filter((r) => r.selected && r.title.trim());
    if (picked.length === 0) {
      setError("Select at least one title.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const row of picked) {
        const book = buildImportedBook({
          title: row.title.trim(),
          author: row.author.trim() || "Unknown author",
          ...(row.narrator ? { narrator: row.narrator } : {}),
          description:
            "From your Audible shelf. Audible plays the audio; this app follows a companion clock you anchor to it and delivers the knowledge layer.",
          audibleUrl: audibleSearchUrl(row.title, row.author),
          durationSeconds: Math.max(60, (row.minutes || 480) * 60),
          hasAudioFile: false,
        });
        book.metadata.themes = ["Audible"];
        book.metadata.license = "Owned by you on Audible — no audio or account data is stored here";
        await putPersonalRecord({
          id: book.metadata.id,
          book,
          mode: "companion-timeline",
          shelf: "audible",
          createdAt: Date.now(),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["books", "all"] });
      setAdded(picked.length);
      setRows(null);
      setPaste("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Those titles could not be saved on this device.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="font-mono text-[10px] tracking-widest text-accent uppercase">Audible</p>
        <h1 className="text-2xl font-bold tracking-tight">Connect my Audible library</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Bring the titles you own on Audible into this app as a real library — 2D grid, 3D bookshelf and Meta Quest
          WebXR. Audible stays the player; this app runs the synchronized knowledge layer beside it.
        </p>
      </header>

      <div className="glass flex items-start gap-3 rounded-xl p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          <span className="font-semibold text-foreground">Why you paste instead of signing in.</span> Audible publishes
          no authorized API, OAuth flow or library export for third-party apps, and a browser cannot read another
          site's session. So the only honest path is the one you control: you tell this app which titles are yours. No
          credentials are requested, nothing is scraped, and no DRM is touched. If Audible ever ships an authorized
          library + position API, this page becomes a real sign-in button and nothing else in the app has to change.
        </p>
      </div>

      {added > 0 && (
        <div className="glass flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 p-4 text-sm">
          <CheckCircle2 className="size-4 text-primary" />
          <span>
            {added} {added === 1 ? "title" : "titles"} added to your Audible shelf.
          </span>
          <Link to="/library" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Open My Library
          </Link>
          <Link to="/virtual-library" className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary">
            See it on the 3D shelf
          </Link>
        </div>
      )}

      <section className="glass space-y-3 rounded-xl p-4">
        <h2 className="text-sm font-semibold">1 · Paste your library list</h2>
        <p className="text-xs text-muted-foreground">
          Open your Audible library in another tab, select your titles and paste them here — one per line. Title,
          author and running time are picked up automatically from most pastes, and you can correct anything below.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={8}
          placeholder={EXAMPLE}
          className={`${input} font-mono text-xs`}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={analyse}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            <Sparkles className="size-4" /> Read my list
          </button>
          <button
            onClick={() => setPaste(EXAMPLE)}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
          >
            Use an example
          </button>
          <a
            href="https://www.audible.com/library/titles"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
          >
            <ExternalLink className="size-3.5" /> Open my Audible library
          </a>
        </div>
      </section>

      {rows && (
        <section className="glass space-y-3 rounded-xl p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">2 · Check the titles</h2>
            <p className="text-xs text-muted-foreground">
              {selectedCount} of {rows.length} selected
            </p>
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={`${row.title}-${i}`} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[auto_2fr_1.4fr_auto]">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) => patch(i, { selected: e.target.checked })}
                    aria-label={`Include ${row.title}`}
                  />
                </label>
                <input
                  className={input}
                  value={row.title}
                  onChange={(e) => patch(i, { title: e.target.value })}
                  aria-label="Title"
                />
                <input
                  className={input}
                  value={row.author}
                  onChange={(e) => patch(i, { author: e.target.value })}
                  placeholder="Author"
                  aria-label="Author"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    className={`${input} w-20`}
                    value={row.minutes || ""}
                    onChange={(e) => patch(i, { minutes: Number(e.target.value.replace(/[^0-9]/g, "")) })}
                    placeholder="480"
                    inputMode="numeric"
                    aria-label="Running time in minutes"
                  />
                  min
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => void addSelected()}
            disabled={busy}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Headphones className="size-4" />}
            {busy ? "Building your shelf…" : `Add ${selectedCount} to my library`}
          </button>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
          {error}
        </p>
      )}

      <section className="glass space-y-2 rounded-xl p-4 text-xs text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">3 · Then listen the way you already do</h2>
        <p>
          Press play in Audible, open the title here and anchor the companion clock to the position Audible shows. From
          that moment the knowledge layer follows along: entities, people, places, organizations, concepts, live
          reference sources, images, Ask the Book, the Knowledge Graph and the spatial reader — flat, on the 3D shelf,
          or in a Quest headset.
        </p>
        <p>
          A transcript you are entitled to use makes it far richer. Add one per title from{" "}
          <button
            onClick={() => void navigate({ to: "/import", search: { mode: "companion" as const } })}
            className="text-primary underline"
          >
            the import page
          </button>
          . Without one, the app still gives you the timeline, chapters and Ask the Book.
        </p>
      </section>
    </div>
  );
}