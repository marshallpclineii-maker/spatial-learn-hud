import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Images, Network, Sparkles, X } from "lucide-react";
import type { AttentionItem } from "@/engines/attention-engine";
import type { Entity, UniversalBookObject } from "@/domain/types";
import { ExternalKnowledge, SourceLinks } from "./knowledge-sources-panel";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  person: "Person",
  place: "Place",
  organization: "Organization",
  thing: "Thing",
  concept: "Concept",
  event: "Event",
};

export function AttentionRail({
  items,
  selectedId,
  onSelect,
}: {
  items: AttentionItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const visible = items.filter((i) => i.level <= 2).slice(0, 5);
  if (visible.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        No entity in focus at this moment.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(({ entity, level, reason }) => (
        <button
          key={entity.id}
          onClick={() => onSelect(entity.id)}
          title={reason}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
            selectedId === entity.id
              ? "border-primary bg-primary/20 text-primary"
              : level === 1
                ? "border-primary/50 bg-primary/10 text-primary pulse-attention"
                : "border-accent/40 bg-accent/10 text-accent",
          )}
        >
          <span className="font-mono text-[9px] opacity-70">L{level}</span>
          {entity.name}
        </button>
      ))}
    </div>
  );
}

export function KnowledgeCard({
  entity,
  book,
  chapterId,
  atLabel,
  onClose,
  onAsk,
  onRelated,
}: {
  entity: Entity;
  book: UniversalBookObject;
  chapterId: string;
  atLabel?: string;
  onClose: () => void;
  onAsk: (question: string) => void;
  onRelated: (entityId: string) => void;
}) {
  const all = [...book.entities, ...book.concepts];
  const [tab, setTab] = useState<"overview" | "sources" | "images">("overview");
  const why =
    entity.whyItMatters[chapterId] ??
    Object.values(entity.whyItMatters)[0] ??
    "Context for this passage is not recorded in the book object.";
  const graphNode = book.knowledgeGraph.nodes.find((n) => n.entityId === entity.id);
  const chapter = book.chapters.find((c) => c.id === chapterId);

  return (
    <aside className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
            {TYPE_LABEL[entity.type] ?? entity.type}
          </p>
          <h3 className="text-lg leading-tight font-semibold">{entity.name}</h3>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            surfaced at {atLabel ?? "this passage"}
            {chapter ? ` · ${chapter.title}` : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close knowledge card"
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-1 rounded-lg bg-secondary/50 p-1 text-[11px]">
        {(
          [
            ["overview", "Overview"],
            ["sources", "Sources"],
            ["images", "Images"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 transition-colors",
              tab === id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {id === "images" ? (
              <span className="flex items-center justify-center gap-1">
                <Images className="size-3" /> {label}
              </span>
            ) : (
              label
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <p className="mt-3 text-sm">{entity.definition.short}</p>
          <p className="mt-2 text-sm text-muted-foreground">{entity.definition.long}</p>

          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/8 p-3">
            <p className="font-mono text-[10px] tracking-widest text-accent uppercase">Why this matters here</p>
            <p className="mt-1 text-sm">{why}</p>
          </div>

          <p className="mt-3 font-mono text-[10px] text-muted-foreground">Source: {entity.definition.source}</p>
        </>
      )}

      {tab === "sources" && (
        <div className="mt-3 space-y-4">
          <ExternalKnowledge entity={entity} withImages={false} />
          <SourceLinks entity={entity} />
        </div>
      )}

      {tab === "images" && (
        <div className="mt-3">
          <ExternalKnowledge entity={entity} withImages />
        </div>
      )}

      {tab === "overview" && entity.relatedConceptIds.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Related</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {entity.relatedConceptIds.map((id) => {
              const rel = all.find((e) => e.id === id);
              if (!rel) return null;
              return (
                <button
                  key={id}
                  onClick={() => onRelated(id)}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-secondary"
                >
                  {rel.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onAsk(`Tell me more about ${entity.name}`)}
          className="flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs text-primary hover:bg-primary/25"
        >
          <Sparkles className="size-3.5" /> Ask the book
        </button>
        {graphNode && (
          <Link
            to="/graph"
            search={{ node: graphNode.id }}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            <Network className="size-3.5" /> View in graph
          </Link>
        )}
        {entity.deepDiveUrl && (
          <a
            href={entity.deepDiveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            <ExternalLink className="size-3.5" /> Deep dive
          </a>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Playback keeps running — this card never interrupts the narration.
      </p>
    </aside>
  );
}
