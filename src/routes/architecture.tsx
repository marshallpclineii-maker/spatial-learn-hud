import { createFileRoute } from "@tanstack/react-router";

type Maturity = "real" | "demo" | "external-api" | "provider" | "webxr" | "future";

const BADGE: Record<Maturity, { label: string; className: string }> = {
  real: { label: "Real", className: "border-primary/50 bg-primary/10 text-primary" },
  demo: { label: "Demo / simulated", className: "border-accent/50 bg-accent/10 text-accent" },
  "external-api": { label: "Needs external API", className: "border-chart-4/50 text-chart-4" },
  provider: { label: "Needs authorized provider", className: "border-dashed border-border text-muted-foreground" },
  webxr: { label: "WebXR-ready", className: "border-primary/40 text-primary" },
  future: { label: "Future work", className: "border-dashed border-border text-muted-foreground" },
};

const ROWS: Array<{ area: string; state: Maturity; detail: string }> = [
  {
    area: "UniversalBookObject + AudiobookProvider",
    state: "real",
    detail: "Every surface (reader, HUD, graph, 3D, spatial reader) consumes the same provider-agnostic object.",
  },
  {
    area: "Transcript / attention / knowledge engines",
    state: "real",
    detail: "Timestamp indexing, salience + position scoring (L1/L2/L3) and deterministic in-book answering.",
  },
  {
    area: "Shared Active Reader state (useReaderState)",
    state: "real",
    detail: "One hook drives the flat reader and the spatial reader — identical audio → entity → HUD chain.",
  },
  {
    area: "Audio timeline",
    state: "demo",
    detail:
      "A real HTMLAudioElement becomes the authoritative clock whenever a book supplies audio.src. The demo book has no stream, so browser speech synthesis narrates the public-domain text against a fallback clock.",
  },
  {
    area: "External knowledge retrieval (Wikipedia, Wikimedia Commons)",
    state: "real",
    detail: "Live server-side calls to public Wikimedia APIs, with attribution and per-image licence metadata.",
  },
  {
    area: "Britannica / Merriam-Webster / Dictionary.com inline definitions",
    state: "external-api",
    detail: "No public or licensed API available here, so these are authority-ranked link-outs to the publisher.",
  },
  {
    area: "Ask the Book",
    state: "real",
    detail:
      "Context-aware: book, chapter, timestamp, spoken sentence, nearby transcript, focused entity, active entities and graph relationships. Falls back to the deterministic engine and always labels which answered.",
  },
  {
    area: "Knowledge graph",
    state: "real",
    detail: "Same entity ids as the HUD; selecting a card deep-links to its node.",
  },
  {
    area: "Virtual library + spatial reader",
    state: "webxr",
    detail:
      "React Three Fiber scenes with real WebXR capability detection; VR entry only appears when immersive-vr is actually supported. Desktop/mobile fallback is fully functional.",
  },
  {
    area: "Audible / Libro.fm",
    state: "provider",
    detail: "Companion mode only — external open, no credentials, no scraping, never a fake connected state.",
  },
  {
    area: "Word-level highlighting, AR wall anchoring, spatial knowledge objects (maps, timelines, exhibits)",
    state: "future",
    detail:
      "Architecture is in place (entity types, spatial markers, source layer), implementation awaits word timings and mixed-reality passthrough work.",
  },
];

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Implementation Status — Spatial Knowledge Library" },
      {
        name: "description",
        content:
          "An honest map of what is genuinely functional, what is demo content, what needs an external API, and what needs an authorized audiobook provider.",
      },
      { property: "og:title", content: "Implementation Status — Spatial Knowledge Library" },
      { property: "og:description", content: "Real vs demo vs future, feature by feature." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Implementation Status</p>
        <h1 className="text-2xl font-bold tracking-tight">What is real, what is demo, what is next</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The engine matters more than the surface. This page states the maturity of every layer without dressing up
          simulated behaviour as finished capability.
        </p>
      </header>

      <div className="space-y-2">
        {ROWS.map((row) => (
          <article key={row.area} className="glass rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{row.area}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${BADGE[row.state].className}`}>
                {BADGE[row.state].label}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{row.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
