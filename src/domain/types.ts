/**
 * Universal Book Object — the provider-agnostic internal data model.
 * Every UI component in this app reads only from these types, so a new
 * content source only needs to implement `AudiobookProvider`.
 */

export type EntityType =
  | "person"
  | "place"
  | "organization"
  | "thing"
  | "concept"
  | "event";

/** Attention priority: 1 = must surface, 2 = surface subtly, 3 = on demand. */
export type AttentionLevel = 1 | 2 | 3;

/**
 * Outbound links keyed by provider id ("audible", "libro-fm", "source", …).
 * A `null` value means the link is known to be unavailable for this title, so
 * the UI can render an explicit unavailable state instead of hiding it.
 */
export type ExternalLinks = Record<string, string | null>;

/**
 * Where a title came from. Kept in the domain model so no surface has to
 * infer origin from ids or provider names.
 *  - "demo"      — bundled public-domain proof-of-concept content.
 *  - "personal"  — imported by the listener, stored on their device.
 *  - "connected" — returned by a genuinely authorized provider integration.
 */
export type BookOrigin = "demo" | "personal" | "connected";

export interface BookMetadata {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  narrator?: string;
  year?: number;
  publisher?: string;
  description: string;
  coverAccent: string;
  themes: string[];
  license: string;
  externalLinks: ExternalLinks;
  durationSeconds: number;
}

/**
 * Which clock owns the timeline for this title.
 *  - "local"     — an audio file in this app is authoritative.
 *  - "companion" — audio plays in the provider's own app; this app follows a
 *                  user-controlled clock and must never synthesize narration.
 *  - "provider"  — an authorized provider reports the position.
 */
export type TimelineMode = "local" | "companion" | "provider";

export interface AudioTrack {
  /** Optional streamed file. When null, the engine narrates via speech synthesis. */
  src: string | null;
  mimeType?: string;
  durationSeconds: number;
  attribution: string;
  /** Defaults to "local". */
  timelineMode?: TimelineMode;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  summary: string;
  startSeconds: number;
  endSeconds: number;
}

export interface TranscriptSegment {
  id: string;
  chapterId: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  /** Entity ids mentioned inside this segment. */
  entityIds: string[];
}

export interface Definition {
  short: string;
  long: string;
  source: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases?: string[];
  definition: Definition;
  /** Contextual "why this matters here", keyed by chapter id. */
  whyItMatters: Record<string, string>;
  relatedConceptIds: string[];
  firstMentionSeconds: number;
  /** Base salience 0..1, combined with position by the attention engine. */
  salience: number;
  deepDiveUrl?: string;
}

export interface Concept extends Entity {
  type: "concept";
}

export interface TimelineEvent {
  id: string;
  label: string;
  atSeconds: number;
  chapterId: string;
  entityIds: string[];
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  answer: string;
  entityIds: string[];
  chapterId: string | "any";
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  entityId: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LearningHistoryItem {
  bookId: string;
  atSeconds: number;
  kind: "entity-opened" | "question-asked" | "chapter-reached" | "graph-node";
  label: string;
  timestamp: number;
}

export interface UserLearningHistory {
  lastPositionSeconds: Record<string, number>;
  items: LearningHistoryItem[];
}

export interface UniversalBookObject {
  metadata: BookMetadata;
  audio: AudioTrack;
  chapters: Chapter[];
  transcript: TranscriptSegment[];
  entities: Entity[];
  concepts: Concept[];
  definitions: Record<string, Definition>;
  events: TimelineEvent[];
  questions: SuggestedQuestion[];
  knowledgeGraph: KnowledgeGraph;
}

export interface BookSummary {
  metadata: BookMetadata;
  /** Books without full content are catalog-only entries. */
  hasFullExperience: boolean;
  /** Where this title came from — recorded at the source, never inferred. */
  origin: BookOrigin;
  providerId: string;
}
