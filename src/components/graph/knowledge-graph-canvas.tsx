import { useEffect, useMemo, useRef, useState } from "react";
import type { KnowledgeGraph } from "@/domain/types";

interface Pt { x: number; y: number; vx: number; vy: number }

const COLORS: Record<string, string> = {
  person: "#7fd8e8",
  place: "#e8c07f",
  thing: "#a8b6d8",
  concept: "#8fe8c0",
  organization: "#d89fe8",
  event: "#e89f9f",
};

/** Force-directed graph on canvas with zoom, pan and node selection. */
export function KnowledgeGraphCanvas({
  graph,
  selectedId,
  onSelect,
  height = 460,
}: {
  graph: KnowledgeGraph;
  selectedId: string | null;
  onSelect: (nodeId: string | null) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const movedRef = useRef(false);

  const positions = useRef<Record<string, Pt>>({});

  const layout = useMemo(() => {
    const nodes = graph.nodes;
    const pts: Record<string, Pt> = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      pts[n.id] = { x: Math.cos(angle) * 170, y: Math.sin(angle) * 150, vx: 0, vy: 0 };
    });
    // Simple spring/repulsion relaxation, deterministic.
    for (let step = 0; step < 400; step++) {
      for (const a of nodes) {
        const pa = pts[a.id]!;
        for (const b of nodes) {
          if (a.id === b.id) continue;
          const pb = pts[b.id]!;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const d2 = Math.max(60, dx * dx + dy * dy);
          const f = 5200 / d2;
          pa.vx += (dx / Math.sqrt(d2)) * f;
          pa.vy += (dy / Math.sqrt(d2)) * f;
        }
      }
      for (const e of graph.edges) {
        const pa = pts[e.source];
        const pb = pts[e.target];
        if (!pa || !pb) continue;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const f = (dist - 120) * 0.008;
        pa.vx += (dx / dist) * f;
        pa.vy += (dy / dist) * f;
        pb.vx -= (dx / dist) * f;
        pb.vy -= (dy / dist) * f;
      }
      for (const n of nodes) {
        const p = pts[n.id]!;
        p.x += p.vx * 0.35;
        p.y += p.vy * 0.35;
        p.vx *= 0.55;
        p.vy *= 0.55;
      }
    }
    return pts;
  }, [graph]);

  positions.current = layout;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const neighbours = new Set<string>();
    if (selectedId) {
      for (const e of graph.edges) {
        if (e.source === selectedId) neighbours.add(e.target);
        if (e.target === selectedId) neighbours.add(e.source);
      }
    }

    for (const e of graph.edges) {
      const a = layout[e.source];
      const b = layout[e.target];
      if (!a || !b) continue;
      const highlighted = selectedId && (e.source === selectedId || e.target === selectedId);
      ctx.strokeStyle = highlighted ? "rgba(127,216,232,0.85)" : "rgba(180,195,220,0.18)";
      ctx.lineWidth = highlighted ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (highlighted) {
        ctx.fillStyle = "rgba(210,228,240,0.9)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(e.relation, (a.x + b.x) / 2 + 4, (a.y + b.y) / 2 - 4);
      }
    }

    for (const n of graph.nodes) {
      const p = layout[n.id];
      if (!p) continue;
      const isSel = n.id === selectedId;
      const dim = Boolean(selectedId) && !isSel && !neighbours.has(n.id);
      ctx.globalAlpha = dim ? 0.35 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isSel ? 11 : 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.type] ?? "#a8b6d8";
      ctx.fill();
      if (isSel) {
        ctx.strokeStyle = "rgba(127,216,232,0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(232,240,250,0.92)";
      ctx.font = `${isSel ? "600 " : ""}11px ui-sans-serif, system-ui`;
      ctx.fillText(n.label, p.x + 13, p.y + 4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }, [graph, layout, pan, zoom, selectedId]);

  const hitTest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const y = (clientY - rect.top - rect.height / 2 - pan.y) / zoom;
    for (const n of graph.nodes) {
      const p = layout[n.id];
      if (!p) continue;
      if (Math.hypot(p.x - x, p.y - y) < 14) return n.id;
    }
    return null;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full cursor-grab touch-none rounded-xl border border-border bg-card/40 active:cursor-grabbing"
        onPointerDown={(e) => {
          movedRef.current = false;
          dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) > 3) movedRef.current = true;
          setPan({ x: d.panX + dx, y: d.panY + dy });
        }}
        onPointerUp={(e) => {
          dragRef.current = null;
          if (!movedRef.current) onSelect(hitTest(e.clientX, e.clientY));
        }}
        onWheel={(e) => {
          setZoom((z) => Math.min(2.5, Math.max(0.5, z - e.deltaY * 0.001)));
        }}
      />
      <div className="absolute right-3 bottom-3 flex gap-1">
        {[
          { label: "−", fn: () => setZoom((z) => Math.max(0.5, z - 0.2)) },
          { label: "+", fn: () => setZoom((z) => Math.min(2.5, z + 0.2)) },
          {
            label: "reset",
            fn: () => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            },
          },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.fn}
            className="glass rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
