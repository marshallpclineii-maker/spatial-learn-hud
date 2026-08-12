import type { Entity, EntityType } from "@/domain/types";

/**
 * Provider-agnostic knowledge source layer.
 *
 * A KnowledgeSource never owns UI. It declares who it is, how authoritative it
 * is, and how to reach it for a given entity — either through a supported API
 * (`api`) or by linking the listener out to the original source (`link-out`).
 * Nothing here scrapes: link-out sources open the publisher's own page.
 */

export type SourceAuthority =
  | "primary"
  | "reference"
  | "educational"
  | "community"
  | "general-web";

export const AUTHORITY_LABEL: Record<SourceAuthority, string> = {
  primary: "Primary / authoritative",
  reference: "Reference",
  educational: "Educational",
  community: "Community / open",
  "general-web": "General web",
};

export const AUTHORITY_RANK: Record<SourceAuthority, number> = {
  primary: 0,
  reference: 1,
  educational: 2,
  community: 3,
  "general-web": 4,
};

export type SourceAccess =
  | { kind: "api"; note: string }
  | { kind: "link-out"; note: string }
  | { kind: "requires-license"; note: string };

export interface KnowledgeLink {
  sourceId: string;
  sourceName: string;
  authority: SourceAuthority;
  label: string;
  url: string;
  access: SourceAccess["kind"];
}

export interface KnowledgeSource {
  id: string;
  name: string;
  authority: SourceAuthority;
  access: SourceAccess;
  attribution: string;
  supports?: (type: EntityType) => boolean;
  buildUrl: (query: string, entity: Entity) => string | null;
}

const q = (s: string) => encodeURIComponent(s);

export const knowledgeSources: KnowledgeSource[] = [
  {
    id: "wikipedia",
    name: "Wikipedia",
    authority: "community",
    access: { kind: "api", note: "Public Wikimedia REST API — summary fetched live and attributed." },
    attribution: "Wikipedia, CC BY-SA",
    buildUrl: (query) => `https://en.wikipedia.org/wiki/Special:Search?search=${q(query)}`,
  },
  {
    id: "wikimedia-commons",
    name: "Wikimedia Commons",
    authority: "community",
    access: { kind: "api", note: "Public Commons API — image results carry per-file licence metadata." },
    attribution: "Wikimedia Commons contributors",
    buildUrl: (query) => `https://commons.wikimedia.org/w/index.php?search=${q(query)}`,
  },
  {
    id: "britannica",
    name: "Encyclopaedia Britannica",
    authority: "reference",
    access: { kind: "link-out", note: "No public API — the listener is linked to Britannica's own search." },
    attribution: "Encyclopaedia Britannica",
    buildUrl: (query) => `https://www.britannica.com/search?query=${q(query)}`,
  },
  {
    id: "merriam-webster",
    name: "Merriam-Webster",
    authority: "primary",
    access: {
      kind: "requires-license",
      note: "Definitions require a licensed Merriam-Webster API key; until then this links out.",
    },
    attribution: "Merriam-Webster, Incorporated",
    supports: (type) => type === "concept" || type === "thing",
    buildUrl: (query) => `https://www.merriam-webster.com/dictionary/${q(query.split(" ")[0] ?? query)}`,
  },
  {
    id: "dictionary-com",
    name: "Dictionary.com",
    authority: "reference",
    access: { kind: "link-out", note: "Linked out to the publisher's page; no scraping." },
    attribution: "Dictionary.com",
    supports: (type) => type === "concept" || type === "thing",
    buildUrl: (query) => `https://www.dictionary.com/browse/${q(query.split(" ").join("-"))}`,
  },
  {
    id: "openstreetmap",
    name: "OpenStreetMap",
    authority: "educational",
    access: { kind: "link-out", note: "Map view of the place, opened on OSM." },
    attribution: "OpenStreetMap contributors, ODbL",
    supports: (type) => type === "place" || type === "organization",
    buildUrl: (query) => `https://www.openstreetmap.org/search?query=${q(query)}`,
  },
  {
    id: "internet-archive",
    name: "Internet Archive",
    authority: "educational",
    access: { kind: "link-out", note: "Primary documents and scans held by the Archive." },
    attribution: "Internet Archive",
    buildUrl: (query) => `https://archive.org/search?query=${q(query)}`,
  },
  {
    id: "web-search",
    name: "Web search",
    authority: "general-web",
    access: { kind: "link-out", note: "Unvetted results — treated as the lowest authority tier." },
    attribution: "Search engine results",
    buildUrl: (query) => `https://duckduckgo.com/?q=${q(query)}`,
  },
  {
    id: "image-search",
    name: "Image search",
    authority: "general-web",
    access: { kind: "link-out", note: "Opens an external image search for this entity." },
    attribution: "Search engine results",
    buildUrl: (query) => `https://duckduckgo.com/?q=${q(query)}&iax=images&ia=images`,
  },
];

/** Ordered, authority-ranked link set for one entity. */
export function linksForEntity(entity: Entity): KnowledgeLink[] {
  const query = entity.aliases?.[0] ? `${entity.name}` : entity.name;
  return knowledgeSources
    .filter((s) => !s.supports || s.supports(entity.type))
    .map((s) => {
      const url = s.buildUrl(query, entity);
      if (!url) return null;
      return {
        sourceId: s.id,
        sourceName: s.name,
        authority: s.authority,
        label: s.name,
        url,
        access: s.access.kind,
      } satisfies KnowledgeLink;
    })
    .filter((l): l is KnowledgeLink => l !== null)
    .sort((a, b) => AUTHORITY_RANK[a.authority] - AUTHORITY_RANK[b.authority]);
}

export function sourceById(id: string): KnowledgeSource | undefined {
  return knowledgeSources.find((s) => s.id === id);
}