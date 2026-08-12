import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Live multi-source knowledge retrieval.
 * Uses public, supported Wikimedia APIs only — no scraping, full attribution.
 */

const LookupInput = z.object({
  name: z.string().min(1).max(120),
  hint: z.string().max(200).optional(),
  withImages: z.boolean().optional(),
});

export interface KnowledgeImage {
  title: string;
  thumbUrl: string;
  pageUrl: string;
  credit: string;
  license: string;
}

export interface KnowledgeLookupResult {
  status: "ok" | "not-found" | "error";
  summary: string | null;
  summarySource: string | null;
  summaryUrl: string | null;
  thumbnail: string | null;
  images: KnowledgeImage[];
  message?: string;
}

const UA = "SpatialKnowledgeLibrary/1.0 (educational audiobook companion)";

async function wikipediaSummary(name: string) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}?redirect=true`,
    { headers: { "Api-User-Agent": UA, Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { source?: string };
    type?: string;
  };
  if (!json.extract || json.type === "disambiguation") return null;
  return {
    extract: json.extract,
    url: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
    thumbnail: json.thumbnail?.source ?? null,
  };
}

async function commonsImages(name: string): Promise<KnowledgeImage[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=" +
    encodeURIComponent(name) +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480";
  const res = await fetch(url, { headers: { "Api-User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            thumburl?: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };
  const pages = Object.values(json.query?.pages ?? {});
  const strip = (s?: string) => (s ?? "").replace(/<[^>]*>/g, "").trim();
  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl) return null;
      return {
        title: (p.title ?? "").replace(/^File:/, ""),
        thumbUrl: info.thumburl,
        pageUrl: info.descriptionurl ?? "https://commons.wikimedia.org",
        credit: strip(info.extmetadata?.["Artist"]?.value) || "Wikimedia Commons contributor",
        license: strip(info.extmetadata?.["LicenseShortName"]?.value) || "See file page",
      } satisfies KnowledgeImage;
    })
    .filter((i): i is KnowledgeImage => i !== null);
}

export const lookupKnowledge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LookupInput.parse(input))
  .handler(async ({ data }): Promise<KnowledgeLookupResult> => {
    const empty: KnowledgeLookupResult = {
      status: "not-found",
      summary: null,
      summarySource: null,
      summaryUrl: null,
      thumbnail: null,
      images: [],
    };
    try {
      const [summary, images] = await Promise.all([
        wikipediaSummary(data.name),
        data.withImages === false ? Promise.resolve([]) : commonsImages(data.hint ? `${data.name} ${data.hint}` : data.name),
      ]);
      if (!summary && images.length === 0) return empty;
      return {
        status: "ok",
        summary: summary?.extract ?? null,
        summarySource: summary ? "Wikipedia (CC BY-SA)" : null,
        summaryUrl: summary?.url ?? null,
        thumbnail: summary?.thumbnail ?? null,
        images,
      };
    } catch {
      return { ...empty, status: "error", message: "External knowledge sources could not be reached." };
    }
  });