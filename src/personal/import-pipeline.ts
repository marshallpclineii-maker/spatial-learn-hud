import type {
  Chapter,
  Entity,
  EntityType,
  TranscriptSegment,
  UniversalBookObject,
} from "@/domain/types";

/**
 * User-assisted import pipeline.
 *
 * Converts material the listener is legitimately able to provide — their own
 * audio file, a transcript/caption file, or just title metadata — into a
 * UniversalBookObject. No provider account, no scraping, no DRM involved.
 */

export interface ImportInput {
  title: string;
  author: string;
  narrator?: string;
  description?: string;
  audibleUrl?: string;
  /** Seconds. Read from the audio file when one is supplied. */
  durationSeconds: number;
  transcriptText?: string;
  hasAudioFile: boolean;
}

export interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

const timeToSeconds = (h: string, m: string, s: string, ms: string) =>
  Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;

const CUE_RE =
  /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;

/** Parses SRT or WebVTT. Returns [] when the text carries no timing cues. */
export function parseTimedTranscript(raw: string): ParsedCue[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const cues: ParsedCue[] = [];
  let current: ParsedCue | null = null;
  for (const line of lines) {
    const m = CUE_RE.exec(line);
    if (m) {
      if (current && current.text.trim()) cues.push(current);
      current = {
        start: timeToSeconds(m[1]!, m[2]!, m[3]!, m[4]!),
        end: timeToSeconds(m[5]!, m[6]!, m[7]!, m[8]!),
        text: "",
      };
      continue;
    }
    if (!current) continue;
    if (!line.trim()) {
      if (current.text.trim()) cues.push(current);
      current = null;
      continue;
    }
    if (/^\d+$/.test(line.trim()) && !current.text) continue;
    current.text += (current.text ? " " : "") + line.trim();
  }
  if (current && current.text.trim()) cues.push(current);
  return cues;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"“'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Untimed prose: distribute segments across the duration by word count. */
function segmentsFromProse(text: string, duration: number): ParsedCue[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  const counts = sentences.map((s) => Math.max(1, s.split(/\s+/).length));
  const total = counts.reduce((a, b) => a + b, 0);
  let at = 0;
  return sentences.map((s, i) => {
    const span = (counts[i]! / total) * duration;
    const cue = { start: at, end: at + span, text: s };
    at += span;
    return cue;
  });
}

const STOP = new Set(
  ("the a an and or but if then than that this these those of in on at to for from with without by as is are was were be been being it its his her their our your my we you they he she i not no so such which who whom whose what when where why how all any both each few more most other some only own same too very can will just don should now chapter part book one two three four five".split(
    " ",
  )),
);

const COMMON = new Set(
  ("said says came went made take took give given know knew think thought people place time year years day days long great little good would could must might upon into over under again also because before after while during between".split(
    " ",
  )),
);

function classify(name: string): EntityType {
  if (/\b(city|river|mountain|island|sea|valley|county|province|state|kingdom)\b/i.test(name)) return "place";
  if (/\b(company|university|institute|society|army|corporation|ministry|church|party)\b/i.test(name)) return "organization";
  if (/\b(war|revolution|battle|treaty|crisis|election|congress|expedition)\b/i.test(name)) return "event";
  if (/^(Mr|Mrs|Dr|Sir|Lady|Lord|King|Queen|President|Professor)\b/.test(name)) return "person";
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name)) return "person";
  return "concept";
}

interface Candidate {
  name: string;
  count: number;
  firstAt: number;
}

/**
 * Heuristic entity extraction: repeated proper-noun phrases plus rare long
 * words (the "unfamiliar word" case). Definitions are intentionally left thin —
 * the Knowledge HUD resolves them live from Wikipedia/Commons and the ranked
 * source layer at listening time.
 */
export function extractEntities(cues: ParsedCue[], limit = 40): Entity[] {
  const proper = new Map<string, Candidate>();
  const rare = new Map<string, Candidate>();

  for (const cue of cues) {
    const words = cue.text.split(/\s+/);
    // proper-noun phrases
    const phraseRe = /\b([A-Z][\w'’-]+(?:\s+(?:of|the|de|van|von)\s+)?(?:\s+[A-Z][\w'’-]+){0,3})/g;
    let m: RegExpExecArray | null;
    while ((m = phraseRe.exec(cue.text))) {
      const raw = m[1]!.replace(/[^\w\s'’-]/g, "").trim();
      if (raw.length < 4) continue;
      const first = raw.split(/\s+/)[0]!.toLowerCase();
      if (STOP.has(first) && !raw.includes(" ")) continue;
      const existing = proper.get(raw);
      if (existing) existing.count += 1;
      else proper.set(raw, { name: raw, count: 1, firstAt: cue.start });
    }
    // unfamiliar / uncommon vocabulary
    for (const w of words) {
      const word = w.replace(/[^A-Za-z-]/g, "");
      if (word.length < 9) continue;
      const lower = word.toLowerCase();
      if (STOP.has(lower) || COMMON.has(lower)) continue;
      if (/^[A-Z]/.test(word)) continue;
      const existing = rare.get(lower);
      if (existing) existing.count += 1;
      else rare.set(lower, { name: lower, count: 1, firstAt: cue.start });
    }
  }

  const scored: Array<Candidate & { kind: "proper" | "rare" }> = [
    ...[...proper.values()].filter((c) => c.count >= 2).map((c) => ({ ...c, kind: "proper" as const })),
    ...[...rare.values()].map((c) => ({ ...c, kind: "rare" as const })),
  ].sort((a, b) => b.count - a.count || a.firstAt - b.firstAt);

  const maxCount = scored[0]?.count ?? 1;

  return scored.slice(0, limit).map((c, i) => {
    const name = c.kind === "rare" ? c.name : c.name;
    const id = `imported-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`;
    const type: EntityType = c.kind === "rare" ? "concept" : classify(name);
    return {
      id,
      name,
      type,
      definition: {
        short:
          c.kind === "rare"
            ? "Uncommon term detected in your transcript — live reference lookup below."
            : "Detected in your transcript — live reference lookup below.",
        long:
          "This entity was extracted from the transcript you imported. Its description is retrieved live from Wikipedia, Wikimedia Commons and the ranked source layer, with attribution.",
        source: "Imported transcript + live reference retrieval",
      },
      whyItMatters: {},
      relatedConceptIds: [],
      firstMentionSeconds: Math.floor(c.firstAt),
      salience: Math.min(0.95, 0.35 + (c.count / Math.max(1, maxCount)) * 0.6),
    } satisfies Entity;
  });
}

function buildChapters(cues: ParsedCue[], duration: number): Chapter[] {
  const target = 600; // ~10 minute chapters when none are supplied
  const count = Math.max(1, Math.min(24, Math.round(duration / target) || 1));
  const span = duration / count;
  return Array.from({ length: count }, (_, i) => {
    const start = i * span;
    const end = i === count - 1 ? duration : (i + 1) * span;
    const inside = cues.filter((c) => c.start >= start && c.start < end);
    return {
      id: `part-${i + 1}`,
      index: i,
      title: `Part ${i + 1}`,
      summary: inside[0]?.text.slice(0, 140) ?? "No transcript supplied for this stretch.",
      startSeconds: Math.floor(start),
      endSeconds: Math.floor(end),
    } satisfies Chapter;
  });
}

export function buildImportedBook(input: ImportInput): UniversalBookObject {
  const id = `personal-${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}-${Date.now().toString(36)}`;
  const duration = Math.max(60, Math.round(input.durationSeconds));
  const raw = input.transcriptText?.trim() ?? "";
  const timed = raw ? parseTimedTranscript(raw) : [];
  const cues = timed.length > 0 ? timed : raw ? segmentsFromProse(raw, duration) : [];
  const chapters = buildChapters(cues, duration);

  const chapterFor = (t: number) =>
    chapters.find((c) => t >= c.startSeconds && t < c.endSeconds) ?? chapters[0]!;

  const entities = extractEntities(cues);

  const transcript: TranscriptSegment[] = cues.map((c, i) => {
    const text = c.text;
    return {
      id: `seg-${i}`,
      chapterId: chapterFor(c.start).id,
      startSeconds: c.start,
      endSeconds: c.end,
      text,
      entityIds: entities
        .filter((e) => new RegExp(`\\b${e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))
        .map((e) => e.id),
    } satisfies TranscriptSegment;
  });

  // Co-occurrence relationships → knowledge graph edges.
  const pairSeen = new Set<string>();
  const edges = transcript.flatMap((seg) =>
    seg.entityIds.flatMap((a, i) =>
      seg.entityIds.slice(i + 1).flatMap((b) => {
        const key = [a, b].sort().join("::");
        if (pairSeen.has(key)) return [];
        pairSeen.add(key);
        return [{ id: `edge-${key}`, source: a, target: b, relation: "mentioned together" }];
      }),
    ),
  );

  for (const seg of transcript) {
    for (const a of seg.entityIds) {
      const entity = entities.find((e) => e.id === a);
      if (!entity) continue;
      for (const b of seg.entityIds) {
        if (b !== a && !entity.relatedConceptIds.includes(b) && entity.relatedConceptIds.length < 6) {
          entity.relatedConceptIds.push(b);
        }
      }
      if (!entity.whyItMatters[seg.chapterId]) {
        entity.whyItMatters[seg.chapterId] = `First surfaced here: “${seg.text.slice(0, 160)}”`;
      }
    }
  }

  return {
    metadata: {
      id,
      title: input.title,
      author: input.author,
      ...(input.narrator ? { narrator: input.narrator } : {}),
      description:
        input.description?.trim() ||
        (input.hasAudioFile
          ? "Personal title imported from a local audio file."
          : "Personal title running in companion timeline mode — audio plays in the provider's own app."),
      coverAccent: "cyan",
      themes: ["Personal"],
      license: "Personal copy — supplied by you, stored only on this device",
      externalLinks: { audible: input.audibleUrl?.trim() || null },
      durationSeconds: duration,
    },
    audio: {
      src: null,
      durationSeconds: duration,
      timelineMode: input.hasAudioFile ? ("local" as const) : ("companion" as const),
      attribution: input.hasAudioFile
        ? "Local file supplied by the listener; never uploaded."
        : "No audio in this app — the provider's own app remains the player.",
    },
    chapters,
    transcript,
    entities,
    concepts: [],
    definitions: Object.fromEntries(entities.map((e) => [e.id, e.definition])),
    events: [],
    questions: [],
    knowledgeGraph: {
      nodes: entities.map((e) => ({ id: e.id, label: e.name, type: e.type, entityId: e.id })),
      edges,
    },
  };
}