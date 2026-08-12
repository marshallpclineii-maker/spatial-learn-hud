import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import type { Entity } from "@/domain/types";
import { AUTHORITY_LABEL, linksForEntity, type SourceAuthority } from "@/knowledge/sources";
import { lookupKnowledge } from "@/lib/knowledge-lookup.functions";

const AUTHORITY_STYLE: Record<SourceAuthority, string> = {
  primary: "border-primary/50 text-primary",
  reference: "border-accent/50 text-accent",
  educational: "border-chart-4/50 text-chart-4",
  community: "border-border text-muted-foreground",
  "general-web": "border-dashed border-border text-muted-foreground",
};

export function SourceLinks({ entity }: { entity: Entity }) {
  const links = linksForEntity(entity);
  const groups = links.reduce<Record<string, typeof links>>((acc, l) => {
    (acc[l.authority] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {(Object.keys(groups) as SourceAuthority[]).map((authority) => (
        <div key={authority}>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {AUTHORITY_LABEL[authority]}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {groups[authority]?.map((l) => (
              <a
                key={l.sourceId}
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                title={
                  l.access === "requires-license"
                    ? "A licensed API key is required for inline definitions — this opens the publisher's page."
                    : l.access === "api"
                      ? "Fetched live through a supported public API"
                      : "Opens the original source"
                }
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] hover:bg-secondary ${AUTHORITY_STYLE[authority]}`}
              >
                {l.label}
                <ExternalLink className="size-3 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">
        Authority tiers are shown so open or general-web results are never mistaken for authoritative ones.
      </p>
    </div>
  );
}

/** Live retrieval from public Wikimedia APIs — attributed, never scraped. */
export function ExternalKnowledge({ entity, withImages }: { entity: Entity; withImages: boolean }) {
  const lookup = useServerFn(lookupKnowledge);
  const query = useQuery({
    queryKey: ["knowledge", entity.id, withImages],
    queryFn: () => lookup({ data: { name: entity.name, withImages } }),
    staleTime: 1000 * 60 * 30,
  });

  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Retrieving external knowledge…
      </p>
    );
  }
  if (query.isError || query.data?.status === "error") {
    return <p className="text-xs text-muted-foreground">External sources could not be reached right now.</p>;
  }
  const data = query.data;
  if (!data || data.status === "not-found") {
    return <p className="text-xs text-muted-foreground">No external record matched “{entity.name}”.</p>;
  }

  return (
    <div className="space-y-3">
      {data.summary && (
        <div>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {data.summarySource}
            {data.summaryUrl && (
              <>
                {" · "}
                <a href={data.summaryUrl} target="_blank" rel="noreferrer noopener" className="underline">
                  original
                </a>
              </>
            )}
          </p>
        </div>
      )}
      {withImages && (
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            <ImageIcon className="size-3" /> Wikimedia Commons
          </p>
          {data.images.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">No freely licensed images matched this entity.</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {data.images.map((img) => (
                <a
                  key={img.pageUrl}
                  href={img.pageUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group overflow-hidden rounded-md border border-border"
                  title={`${img.title} — ${img.credit} (${img.license})`}
                >
                  <img
                    src={img.thumbUrl}
                    alt={img.title}
                    loading="lazy"
                    className="h-20 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <p className="truncate px-1 py-0.5 text-[9px] text-muted-foreground">{img.license}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}