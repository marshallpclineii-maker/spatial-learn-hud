import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Info, Plug } from "lucide-react";
import { STATUS_LABEL, providerConnections } from "@/providers/provider-connection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect an Audiobook Provider — Spatial Knowledge Library" },
      {
        name: "description",
        content:
          "Authorized integrations, companion mode and demo content are kept strictly separate — no credentials, no scraping, no fake connected states.",
      },
      { property: "og:title", content: "Connect an Audiobook Provider" },
      {
        property: "og:description",
        content: "Provider connection tiers: authorized integration, companion mode, and demo content.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectPage,
});

const CAPABILITY_LABELS: Array<[keyof typeof providerConnections[number]["capabilities"], string]> = [
  ["libraryMetadata", "Library metadata"],
  ["chapters", "Chapters"],
  ["playbackPosition", "Playback position"],
  ["authorizedPlayback", "Authorized playback"],
  ["transcript", "Transcript sync"],
];

function ConnectPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Provider Connections</p>
        <h1 className="text-2xl font-bold tracking-tight">Connect an audiobook provider</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Three tiers, never blurred: an authorized integration reads your library through an official interface,
          companion mode only opens the provider's own app, and demo content is local public-domain material.
        </p>
      </header>

      <div className="glass flex items-start gap-3 rounded-xl p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          This app never asks for provider credentials, never scrapes provider pages, and never bypasses DRM or
          authentication. If no authorized interface exists, it says so instead of showing a connected state.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providerConnections.map((c) => (
          <article key={c.id} className="glass flex flex-col rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">{c.name}</h2>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{c.tier} tier</p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px]",
                  c.status === "connected"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : c.status === "companion-only"
                      ? "border-accent/50 text-accent"
                      : "border-dashed border-border text-muted-foreground",
                )}
              >
                {c.status === "connected" && <CheckCircle2 className="size-3" />}
                {STATUS_LABEL[c.status]}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{c.statusDetail}</p>

            <ul className="mt-3 grid grid-cols-2 gap-1 text-[11px]">
              {CAPABILITY_LABELS.map(([key, label]) => (
                <li key={key} className={c.capabilities[key] ? "text-foreground" : "text-muted-foreground/60"}>
                  {c.capabilities[key] ? "✓" : "—"} {label}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {c.tier === "demo" && (
                <Link
                  to="/library"
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Open demo library
                </Link>
              )}
              {c.companionUrl && (
                <a
                  href={c.companionUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
                >
                  <ExternalLink className="size-3.5" /> {c.name} Companion Mode
                </a>
              )}
              {c.id === "audible" ? (
                <Link
                  to="/audible"
                  className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                >
                  Connect my Audible library
                </Link>
              ) : c.tier === "companion" ? (
                <Link
                  to="/import"
                  search={{ mode: "companion" as const }}
                  className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                >
                  Start a companion session
                </Link>
              ) : null}
              {c.status === "not-configured" && (
                <span className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  <Plug className="size-3.5" /> Adapter not implemented yet
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
