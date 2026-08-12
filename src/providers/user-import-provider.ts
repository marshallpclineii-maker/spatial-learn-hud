import type { BookOrigin, BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider, ProviderCapabilities } from "./audiobook-provider";
import { audioUrlFor, getPersonalRecord, listPersonalRecords } from "@/personal/personal-store";

/**
 * Personal titles the listener imported themselves. Fully authorized by
 * definition: the material never leaves the device and no provider account is
 * touched. Titles with a local audio file get a real audio timeline; titles
 * without one run in companion timeline mode.
 */
export class UserImportProvider implements AudiobookProvider {
  readonly id = "personal";
  readonly label = "My imports";
  readonly origin: BookOrigin = "personal";
  readonly capabilities: ProviderCapabilities = {
    libraryMetadata: true,
    chapters: true,
    playbackPosition: true,
    authorizedPlayback: true,
    transcript: true,
  };

  async listBooks(): Promise<BookSummary[]> {
    const records = await listPersonalRecords();
    return records
      .filter((r) => (r.shelf ?? "personal") === "personal")
      .map((r) => ({
      metadata: r.book.metadata,
      hasFullExperience: true,
      origin: this.origin,
      providerId: this.id,
    }));
  }

  async getBook(bookId: string): Promise<UniversalBookObject | null> {
    const record = await getPersonalRecord(bookId);
    if (!record || (record.shelf ?? "personal") !== "personal") return null;
    const src = audioUrlFor(record.id, record.audioBlob);
    return {
      ...record.book,
      audio: {
        ...record.book.audio,
        src,
        timelineMode: src ? "local" : (record.book.audio.timelineMode ?? "companion"),
      },
    };
  }
}

export const userImportProvider = new UserImportProvider();