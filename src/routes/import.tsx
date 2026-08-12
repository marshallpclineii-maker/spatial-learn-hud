import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileAudio, FileText, Headphones, Loader2, Upload } from "lucide-react";
import { buildImportedBook } from "@/personal/import-pipeline";
import { putPersonalRecord } from "@/personal/personal-store";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Add a Personal Audiobook — Spatial Knowledge Library" },
      {
        name: "description",
        content:
          "Import your own audiobook file or transcript and the knowledge layer builds a synchronized transcript, entities, sources and graph on your device.",
      },
      { property: "og:title", content: "Add a Personal Audiobook" },
      {
        property: "og:description",
        content: "Local-file import and companion timeline mode — no provider credentials, nothing uploaded.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportPage,
});

async function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = new Audio();
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.round(d));
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

function ImportPage() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLInputElement>(null);
  const search = Route.useSearch();
  const [mode, setMode] = useState<"local-audio" | "companion">(
    search.mode === "companion" ? "companion" : "local-audio",
  );
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [narrator, setNarrator] = useState("");
  const [audibleUrl, setAudibleUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAudio = async (file: File | null) => {
    setAudioFile(file);
    setAudioDuration(file ? await readDuration(file) : 0);
  };

  const usingAudio = mode === "local-audio" && Boolean(audioFile);

  const onTranscriptFile = async (file: File | null) => {
    if (!file) return;
    setTranscript(await file.text());
  };

  const submit = async () => {
    setError(null);
    if (!title.trim() || !author.trim()) {
      setError("A title and author are required.");
      return;
    }
    const duration = usingAudio ? audioDuration : Number(manualMinutes) * 60;
    if (!duration) {
      setError(
        mode === "local-audio"
          ? "Choose a DRM-free audio file you own, or switch to companion mode."
          : "Enter the running time in minutes so the companion timeline can be built.",
      );
      return;
    }
    setBusy(true);
    try {
      const book = buildImportedBook({
        title: title.trim(),
        author: author.trim(),
        ...(narrator.trim() ? { narrator: narrator.trim() } : {}),
        ...(audibleUrl.trim() ? { audibleUrl: audibleUrl.trim() } : {}),
        durationSeconds: duration,
        ...(transcript.trim() ? { transcriptText: transcript } : {}),
        hasAudioFile: usingAudio,
      });
      await putPersonalRecord({
        id: book.metadata.id,
        book,
        mode: usingAudio ? "local-audio" : "companion-timeline",
        audioBlob: usingAudio ? (audioFile ?? undefined) : undefined,
        audioFileName: usingAudio ? (audioFile?.name ?? undefined) : undefined,
        createdAt: Date.now(),
      });
      void navigate({ to: "/reader", search: { book: book.metadata.id, t: 0 } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import failed on this device.");
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Personal Library</p>
        <h1 className="text-2xl font-bold tracking-tight">Add one of your own audiobooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything here stays on this device. Give the knowledge layer a local audio file for a real playback
          timeline, or just the running time to run alongside a title you play in another app.
        </p>
      </header>

      <section className="glass space-y-3 rounded-xl p-4">
        <h2 className="text-sm font-semibold">1 · The title</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            Title
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Author
            <input className={input} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Narrator (optional)
            <input className={input} value={narrator} onChange={(e) => setNarrator(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Provider listing URL (optional)
            <input
              className={input}
              value={audibleUrl}
              onChange={(e) => setAudibleUrl(e.target.value)}
              placeholder="https://www.audible.com/pd/…"
            />
          </label>
        </div>
      </section>

      <section className="glass space-y-3 rounded-xl p-4">
        <h2 className="text-sm font-semibold">2 · The audio timeline</h2>
        <p className="text-xs text-muted-foreground">
          A DRM-free file you own (M4B, MP3, M4A) becomes the authoritative clock. DRM-protected provider downloads
          cannot be played here — for those, use companion timeline mode below.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={audioRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => void onAudio(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => audioRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
          >
            <FileAudio className="size-3.5" /> Choose audio file
          </button>
          <span className="text-xs text-muted-foreground">
            {audioFile
              ? `${audioFile.name} · ${Math.round(audioDuration / 60)} min`
              : "No file — companion timeline mode"}
          </span>
        </div>
        {!audioFile && (
          <label className="block space-y-1 text-xs text-muted-foreground">
            Running time in minutes (companion mode)
            <input
              className={`${input} max-w-40`}
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="480"
              inputMode="numeric"
            />
          </label>
        )}
      </section>

      <section className="glass space-y-3 rounded-xl p-4">
        <h2 className="text-sm font-semibold">3 · Text (optional but this is where the intelligence comes from)</h2>
        <p className="text-xs text-muted-foreground">
          Paste or upload a transcript or caption file (SRT/VTT keeps exact timings; plain text is distributed across
          the running time). Entities, the knowledge graph and Ask the Book are all built from this.
        </p>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary">
          <FileText className="size-3.5" /> Upload .srt / .vtt / .txt
          <input
            type="file"
            accept=".srt,.vtt,.txt,text/plain"
            className="hidden"
            onChange={(e) => void onTranscriptFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={8}
          placeholder="Paste transcript text or caption cues here…"
          className={`${input} font-mono text-xs`}
        />
      </section>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
          {error}
        </p>
      )}

      <button
        onClick={() => void submit()}
        disabled={busy}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? "Building knowledge layer…" : "Add to My Library"}
      </button>
    </div>
  );
}