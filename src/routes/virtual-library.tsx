import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, lazy, useState } from "react";
import { Glasses, MonitorSmartphone } from "lucide-react";
import { demoProvider } from "@/providers/demo-provider";
import { useHydrated } from "@/lib/use-hydrated";
import { useWebXrSupport } from "@/xr/use-webxr-support";

const Scene = lazy(() => import("@/xr/virtual-library-scene"));

interface VLSearch {
  book?: string | undefined;
}

const booksQuery = queryOptions({
  queryKey: ["books", demoProvider.id],
  queryFn: () => demoProvider.listBooks(),
});

export const Route = createFileRoute("/virtual-library")({
  validateSearch: (search: Record<string, unknown>): VLSearch => ({
    book: typeof search.book === "string" ? search.book : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(booksQuery),
  head: () => ({
    meta: [
      { title: "Virtual Library — Spatial Audio Library" },
      {
        name: "description",
        content: "A 3D bookshelf environment with a central Reading Dock, with WebXR when the device supports it.",
      },
      { property: "og:title", content: "Virtual Library — Spatial Audio Library" },
      { property: "og:description", content: "Walk your shelves in 3D, then step into VR on supported hardware." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="glass rounded-xl p-6 text-sm">
      The virtual library could not be loaded: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="glass rounded-xl p-6 text-sm">Nothing here.</div>,
  component: VirtualLibraryPage,
});

function VirtualLibraryPage() {
  return (
    <Suspense fallback={<div className="glass rounded-xl p-6 text-sm text-muted-foreground">Loading shelves…</div>}>
      <VirtualLibraryContent />
    </Suspense>
  );
}

function VirtualLibraryContent() {
  const { book } = Route.useSearch();
  const { data: books } = useSuspenseQuery(booksQuery);
  const hydrated = useHydrated();
  const xr = useWebXrSupport();
  const [selectedId, setSelectedId] = useState<string | null>(book ?? books[0]?.metadata.id ?? null);
  const selected = books.find((b) => b.metadata.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Virtual Library</p>
          <h1 className="text-2xl font-bold tracking-tight">Shelves & Reading Dock</h1>
          <p className="text-sm text-muted-foreground">
            Orbit with drag, zoom with scroll, click a spine to select a title.
          </p>
        </div>
        <XrButton support={xr} />
      </header>

      <div className="glass overflow-hidden rounded-xl">
        <div className="h-[58vh] min-h-96">
          {hydrated ? (
            <Suspense
              fallback={
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Building the 3D environment…
                </div>
              }
            >
              <Scene books={books} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Preparing 3D scene…</div>
          )}
        </div>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-4">
        <MonitorSmartphone className="size-4 text-muted-foreground" />
        <p className="text-sm">
          {selected ? (
            <>
              Selected: <span className="font-medium">{selected.metadata.title}</span> — {selected.metadata.author}
            </>
          ) : (
            "No spine selected."
          )}
        </p>
        {selected?.hasFullExperience && (
          <Link
            to="/reader"
            search={{ book: selected.metadata.id, t: 0 }}
            className="ml-auto rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Take it to the Reading Dock
          </Link>
        )}
      </div>
    </div>
  );
}

function XrButton({ support }: { support: ReturnType<typeof useWebXrSupport> }) {
  if (support === "checking") {
    return <span className="font-mono text-[11px] text-muted-foreground">checking XR support…</span>;
  }
  if (support === "supported") {
    return (
      <button
        onClick={async () => {
          const { xrStore } = await import("@/xr/virtual-library-scene");
          void xrStore.enterVR();
        }}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Glasses className="size-4" /> Enter VR
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">VR unavailable on this device.</span>{" "}
      {support === "insecure-context"
        ? "WebXR needs a secure (https) context."
        : "No immersive-vr session support was reported — the 2D scene above is fully usable."}
    </div>
  );
}
