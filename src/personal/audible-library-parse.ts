/**
 * Parses a pasted Audible library listing into title rows.
 *
 * This reads text the listener pasted or typed themselves — copied from their
 * own library page, an order email, or written by hand. Nothing is fetched
 * from Audible and no session is inspected.
 */

export interface ParsedLibraryRow {
  title: string;
  author: string;
  narrator?: string;
  /** Running time in minutes; 0 when the paste carried none. */
  minutes: number;
}

const SPLIT = /\s+(?:—|–|-|·|\||\t)\s+|\s+[Bb]y\s+/;

function readMinutes(line: string): number {
  const hours = /(\d+)\s*(?:hrs?|hours?|h)\b/i.exec(line);
  const mins = /(\d+)\s*(?:mins?|minutes?|m)\b/i.exec(line);
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

function stripNoise(part: string): string {
  return part
    .replace(/\b\d+\s*(?:hrs?|hours?|h)\b.*$/i, "")
    .replace(/\b\d+\s*(?:mins?|minutes?|m)\b.*$/i, "")
    .replace(/\b(?:narrated|read)\s+by\b/i, "")
    .replace(/^[\s"'“”·—–-]+|[\s"'“”·—–-]+$/g, "")
    .trim();
}

export function parseAudibleLibraryPaste(raw: string): ParsedLibraryRow[] {
  const rows: ParsedLibraryRow[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const text = line.trim();
    if (!text || text.length < 3) continue;
    if (/^(title|author|length|narrated|purchase|showing|\d+\s+titles?)\b/i.test(text)) continue;

    const minutes = readMinutes(text);
    const parts = text.split(SPLIT).map(stripNoise).filter(Boolean);
    const title = stripNoise(parts[0] ?? text);
    if (!title) continue;

    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const author = parts[1] ?? "";
    const narrator = parts[2];
    rows.push({
      title,
      author,
      ...(narrator ? { narrator } : {}),
      minutes,
    });
  }

  return rows;
}

/** A search URL on Audible's own site — an outbound link, never an API call. */
export function audibleSearchUrl(title: string, author: string): string {
  const q = encodeURIComponent(`${title} ${author}`.trim());
  return `https://www.audible.com/search?keywords=${q}`;
}