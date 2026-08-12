import { demoBook } from "@/domain/demo-book";
import type { BookOrigin, BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider, ProviderCapabilities } from "./audiobook-provider";
import { catalogOnlyBooks } from "./catalog-entries";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class DemoAudiobookProvider implements AudiobookProvider {
  readonly id = "demo";
  readonly label = "Demo Library";
  readonly origin: BookOrigin = "demo";
  readonly capabilities: ProviderCapabilities = {
    libraryMetadata: true,
    chapters: true,
    playbackPosition: true,
    authorizedPlayback: true,
    transcript: true,
  };

  async listBooks(): Promise<BookSummary[]> {
    await delay(180);
    return [
      { metadata: demoBook.metadata, hasFullExperience: true, origin: this.origin, providerId: this.id },
      ...catalogOnlyBooks.map((metadata) => ({
        metadata,
        hasFullExperience: false,
        origin: this.origin,
        providerId: this.id,
      })),
    ];
  }

  async getBook(bookId: string): Promise<UniversalBookObject | null> {
    await delay(140);
    return bookId === demoBook.metadata.id ? demoBook : null;
  }
}

export const demoProvider = new DemoAudiobookProvider();
