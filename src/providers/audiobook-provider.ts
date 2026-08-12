import type { BookOrigin, BookSummary, UniversalBookObject } from "@/domain/types";

/**
 * What a provider can actually do. Declared by the provider itself so the UI
 * adapts to capability instead of branching on provider ids.
 */
export interface ProviderCapabilities {
  libraryMetadata: boolean;
  chapters: boolean;
  playbackPosition: boolean;
  authorizedPlayback: boolean;
  transcript: boolean;
}

export const NO_CAPABILITIES: ProviderCapabilities = {
  libraryMetadata: false,
  chapters: false,
  playbackPosition: false,
  authorizedPlayback: false,
  transcript: false,
};

/**
 * Any content source (demo, public-domain archive, licensed catalog) implements
 * this interface. UI components never talk to a source directly.
 *
 * The optional members are the seam a future *authorized* provider plugs into:
 * implement them, register the provider with origin "connected", and no engine,
 * HUD, graph or XR code has to change.
 */
export interface AudiobookProvider {
  readonly id: string;
  readonly label: string;
  readonly origin: BookOrigin;
  readonly capabilities: ProviderCapabilities;
  listBooks(): Promise<BookSummary[]>;
  getBook(bookId: string): Promise<UniversalBookObject | null>;
  /** Authorized providers only: the position the user is really at. */
  getPlaybackPosition?(bookId: string): Promise<number | null>;
  /** Authorized providers only: push this app's position back to the provider. */
  reportPlaybackPosition?(bookId: string, seconds: number): Promise<void>;
  /** Authorized providers only: a playable, non-DRM-bypassing stream URL. */
  getStreamUrl?(bookId: string): Promise<string | null>;
}
