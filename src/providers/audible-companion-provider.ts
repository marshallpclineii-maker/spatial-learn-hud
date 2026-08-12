import type { BookOrigin, BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider, ProviderCapabilities } from "./audiobook-provider";
import { getPersonalRecord, listPersonalRecords } from "@/personal/personal-store";

/**
 * The listener's Audible shelf, declared by the listener.
 *
 * Audible exposes no authorized API, OAuth flow or library export endpoint, so
 * the titles here are the ones the listener told this app they own. Audio never
 * enters this app: Audible remains the player and this app runs a companion
 * clock the listener anchors to it, plus the whole knowledge layer.
 *
 * The moment Audible ships an authorized interface, this class is replaced by
 * one that calls it and registers with origin "connected" — nothing downstream
 * changes.
 */
export class AudibleCompanionProvider implements AudiobookProvider {
  readonly id = "audible";
  readonly label = "My Audible library (companion)";
  readonly origin: BookOrigin = "companion";
  readonly capabilities: ProviderCapabilities = {
    libraryMetadata: true, // declared by the listener, not read from Audible
    chapters: true,
    playbackPosition: false, // Audible does not expose it to third parties
    authorizedPlayback: false, // audio stays in Audible's own app
    transcript: true, // when the listener supplies one they may use
  };

  async listBooks(): Promise<BookSummary[]> {
    const records = await listPersonalRecords();
    return records
      .filter((r) => r.shelf === "audible")
      .map((r) => ({
        metadata: r.book.metadata,
        hasFullExperience: true,
        origin: this.origin,
        providerId: this.id,
      }));
  }

  async getBook(bookId: string): Promise<UniversalBookObject | null> {
    const record = await getPersonalRecord(bookId);
    if (!record || record.shelf !== "audible") return null;
    return {
      ...record.book,
      audio: { ...record.book.audio, src: null, timelineMode: "companion" },
    };
  }
}

export const audibleCompanionProvider = new AudibleCompanionProvider();