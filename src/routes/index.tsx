import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Boxes, Headphones, Network, Sparkles } from "lucide-react";
import { demoBook } from "@/domain/demo-book";
import { useDemoSession } from "@/state/demo-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spatial Audio Library — Listen and Learn in Space" },
      {
        name: "description",
        content:
          "Start the demo: a synchronized audiobook transcript, contextual knowledge cards, an Ask the Book assistant, a knowledge graph and a 3D virtual library.",
      },
      { property: "og:title", content: "Spatial Audio Library — Listen and Learn in Space" },
      {
        property: "og:description",
        content: "Audiobook listening with a Knowledge HUD that surrounds you instead of interrupting you.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  "Select book",
  "Play",
  "Follow transcript",
  "Select entity",
  "View knowledge",
  "Ask the book",
  "Explore graph",
];

function Index() {
  const { startDemo, resetDemo, demoStarted, history } = useDemoSession();
  const navigate = useNavigate();
  const resume = history.lastPositionSeconds[demoBook.metadata.id] ?? 0;

  return (
    <div className="space-y-10">
      <section className="glass relative overflow-hidden rounded-2xl p-6 md:p-10">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase">
          Spatial computing · audiobook learning
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-5xl">
          Don't stop learning to look something up.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          The narration keeps running while the transcript follows along, knowledge cards appear
          around the passage you're hearing, and the whole library becomes a space you can walk
          through.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              startDemo();
              void navigate({ to: "/reader", search: { book: demoBook.metadata.id, t: 0 } });
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_var(--glow)] transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="size-4" /> Start demo
            <ArrowRight className="size-4" />
          </button>
          {demoStarted && resume > 2 && (
            <Link
              to="/reader"
              search={{ book: demoBook.metadata.id, t: Math.floor(resume) }}
              className="flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm hover:bg-secondary"
            >
              <Headphones className="size-4" /> Resume at {Math.floor(resume)}s
            </Link>
          )}
          <button
            onClick={resetDemo}
            className="rounded-lg border border-border px-5 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Reset demo
          </button>
        </div>

        <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[11px] text-muted-foreground">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded border border-border px-2 py-1">{`${i + 1}. ${s}`}</span>
              {i < STEPS.length - 1 && <span className="text-border">→</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            to: "/library" as const,
            icon: Headphones,
            title: "My Library",
            body: "Sort, search and filter thematic stacks. Every title exposes Listen, Open in Audible, Enter VR and Read.",
          },
          {
            to: "/graph" as const,
            icon: Network,
            title: "Knowledge Graph",
            body: "Every entity in the demo book, wired by real relationships you can pan, zoom and inspect.",
          },
          {
            to: "/virtual-library" as const,
            icon: Boxes,
            title: "Virtual Library",
            body: "A real 3D shelf environment with a central Reading Dock, WebXR when the device supports it.",
          },
        ].map(({ to, icon: Icon, title, body }) => (
          <Link key={to} to={to} className="glass rounded-xl p-5 transition-colors hover:bg-card">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </Link>
        ))}
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold">Featured demo audiobook</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="text-foreground">{demoBook.metadata.title}</span> by {demoBook.metadata.author} ·{" "}
          {demoBook.chapters.length} chapters · {demoBook.transcript.length} timed segments ·{" "}
          {demoBook.entities.length + demoBook.concepts.length} knowledge entities · {demoBook.metadata.license}
        </p>
      </section>
    </div>
  );
}
