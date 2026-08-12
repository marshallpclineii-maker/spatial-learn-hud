import type { AudiobookProvider } from "./audiobook-provider";
import { demoProvider } from "./demo-provider";
import { userImportProvider } from "./user-import-provider";

/**
 * Provider connection architecture.
 *
 * Three explicitly separated tiers:
 *  1. `authorized`  — a real, authorized integration returning the user's library.
 *  2. `companion`   — no authorized API: we only open the provider's own app/site.
 *  3. `demo`        — local proof-of-concept content.
 *
 * A connection never reports "connected" unless an authorized integration is
 * actually configured and has returned data.
 */

export type ConnectionTier = "authorized" | "personal" | "companion" | "demo";

export type ConnectionStatus =
  | "connected"
  | "not-configured"
  | "companion-only"
  | "unavailable";

export interface ProviderCapabilities {
  libraryMetadata: boolean;
  chapters: boolean;
  playbackPosition: boolean;
  authorizedPlayback: boolean;
  transcript: boolean;
}

export interface ProviderConnection {
  id: string;
  name: string;
  tier: ConnectionTier;
  status: ConnectionStatus;
  /** Plain-language explanation shown verbatim in the UI. */
  statusDetail: string;
  capabilities: ProviderCapabilities;
  /** Present only for companion mode — opens the provider externally. */
  companionUrl?: string;
  /** Only set when an authorized integration exists. */
  provider?: AudiobookProvider;
}

const none: ProviderCapabilities = {
  libraryMetadata: false,
  chapters: false,
  playbackPosition: false,
  authorizedPlayback: false,
  transcript: false,
};

export const providerConnections: ProviderConnection[] = [
  {
    id: "personal-import",
    name: "My own audiobooks (device import)",
    tier: "personal",
    status: "connected",
    statusDetail:
      "The only path that gives this app a real personal library today. You supply a DRM-free audio file you own and/or a transcript; the book, timeline, entities, graph and knowledge layer are built and stored on this device. Nothing is uploaded and no provider credentials are involved.",
    capabilities: {
      libraryMetadata: true,
      chapters: true,
      playbackPosition: true,
      authorizedPlayback: true,
      transcript: true,
    },
    provider: userImportProvider,
  },
  {
    id: "demo",
    name: "Demo Library",
    tier: "demo",
    status: "connected",
    statusDetail:
      "Local public-domain proof-of-concept content. Clearly labelled demo — not a provider account.",
    capabilities: {
      libraryMetadata: true,
      chapters: true,
      playbackPosition: true,
      authorizedPlayback: true,
      transcript: true,
    },
    provider: demoProvider,
  },
  {
    id: "audible",
    name: "Audible",
    tier: "companion",
    status: "companion-only",
    statusDetail:
      "Audible publishes no public API, OAuth flow, developer program or partner endpoint for personal library, playback position or audio access, and its downloads are DRM-protected. There is therefore nothing to authenticate against and nothing is connected. Two legitimate paths remain: open the title in Audible (companion mode), and run this app's knowledge layer alongside it in companion timeline mode by importing the title's metadata, running time and a transcript you are entitled to use.",
    capabilities: none,
    companionUrl: "https://www.audible.com/library/titles",
  },
  {
    id: "libro-fm",
    name: "Libro.fm",
    tier: "companion",
    status: "companion-only",
    statusDetail: "Companion mode only — opens Libro.fm externally. No credentials are requested or stored.",
    capabilities: none,
    companionUrl: "https://libro.fm/user/library",
  },
  {
    id: "librivox",
    name: "LibriVox (public domain)",
    tier: "authorized",
    status: "not-configured",
    statusDetail:
      "LibriVox publishes an open API and public-domain audio, so an authorized provider adapter can be implemented here. Not yet implemented.",
    capabilities: {
      libraryMetadata: true,
      chapters: true,
      playbackPosition: false,
      authorizedPlayback: true,
      transcript: false,
    },
  },
];

export const activeProvider: AudiobookProvider = demoProvider;

export function connectionById(id: string): ProviderConnection | undefined {
  return providerConnections.find((c) => c.id === id);
}

export const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  "not-configured": "Not configured",
  "companion-only": "Companion mode",
  unavailable: "Unavailable",
};