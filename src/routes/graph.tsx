import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KnowledgeGraphCanvas } from "@/components/graph/knowledge-graph-canvas";
import { demoBook } from "@/domain/demo-book";
import { useDemoSession } from "@/state/demo-session";
import { formatTime } from "@/engines/transcript-engine";

interface GraphSearch {
  node?: string | undefined;
}

export const Route = createFileRoute("/graph")({
  validateSearch: (search: Record<string, unknown>): GraphSearch => ({
    node: typeof search.node === "string" ? search.node : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Knowledge Graph — Spatial Audio Library" },
      {
        name: "description",
        content: "Explore the demo audiobook's entities, concepts and relationships as an interactive network.",
      },
      { property: "og:title", content: "Knowledge Graph — Spatial Audio Library" },
      { property: "og:description", content: "Pan, zoom and inspect the relationships behind the book." },
    ],
  }),
  component: GraphPage,
});

function GraphPage() {
  const { node } = Route.useSearch();
  const navigate = useNavigate();
  const { record } = useDemoSession();
  const book = demoBook;
  const [selectedId, setSelectedId] = useState<string | null>(node ?? null);

  const selectedNode = book.knowledgeGraph.nodes.find((n) => n.id === selectedId) ?? null;
  const entity = selectedNode
    ? [...book.entities, ...book.concepts].find((e) => e.id === selectedNode.entityId) ?? null
    : null;
  const edges = selectedId
    ? book.knowledgeGraph.edges.filter((e) => e.source === selectedId || e.target === selectedId)
    : [];
  const label = (id: string) => book.knowledgeGraph.nodes.find((n) => n.id === id)?.label ?? id;

  const select = (id: string | null) => {
    setSelectedId(id);
    void navigate({ to: "/graph", search: { node: id ?? undefined }, replace: true });
    if (id) record({ bookId: book.metadata.id, atSeconds: 0, kind: "graph-node", label: label(id) });
  };

  return (
    <div className="space-y-4">
      <header>
        <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Knowledge Graph</p>
        <h1 className="text-2xl font-bold tracking-tight">{book.metadata.title}</h1>
        <p className="text-sm text-muted-foreground">
          {book.knowledgeGraph.nodes.length} nodes · {book.knowledgeGraph.edges.length} relationships · drag to pan,
          scroll to zoom, click a node to inspect.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-xl p-3">
          <KnowledgeGraphCanvas graph={book.knowledgeGraph} selectedId={selectedId} onSelect={select} />
        </div>

        <aside className="glass rounded-xl p-4">
          {entity && selectedNode ? (
            <>
              <p className="font-mono text-[10px] tracking-widest text-primary uppercase">{entity.type}</p>
              <h2 className="text-lg font-semibold">{entity.name}</h2>
              <p className="mt-2 text-sm">{entity.definition.short}</p>
              <p className="mt-2 text-sm text-muted-foreground">{entity.definition.long}</p>

              <h3 className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Relationships
              </h3>
              <ul className="mt-1.5 space-y-1 text-sm">
                {edges.map((e) => (
                  <li key={e.id} className="rounded-md bg-secondary/60 px-2 py-1">
                    <button
                      onClick={() => select(e.source === selectedNode.id ? e.target : e.source)}
                      className="text-left"
                    >
                      {label(e.source)} <span className="text-primary">{e.relation}</span> {label(e.target)}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/reader"
                  search={{ book: book.metadata.id, t: Math.floor(entity.firstMentionSeconds) }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Return to book at {formatTime(entity.firstMentionSeconds)}
                </Link>
                <button
                  onClick={() => select(null)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  Clear selection
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Nothing selected</p>
              <p className="mt-1">
                Click any node to see its definition, its relationships, and a jump back to the exact moment it is
                spoken.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
