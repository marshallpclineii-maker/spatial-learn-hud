import { demoBook } from "@/domain/demo-book";
import type { BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider } from "./audiobook-provider";
import { catalogOnlyBooks } from "./catalog-entries";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class DemoAudiobookProvider implements AudiobookProvider {
  readonly id = "demo";
  readonly label = "Demo Library";

  async listBooks(): Promise<BookSummary[]> {
    await delay(180);
    return [
      { metadata: demoBook.metadata, hasFullExperience: true },
      ...catalogOnlyBooks.map((metadata) => ({ metadata, hasFullExperience: false })),
    ];
  }

  async getBook(bookId: string): Promise<UniversalBookObject | null> {
    await delay(140);
    return bookId === demoBook.metadata.id ? demoBook : null;
  }
}

export const demoProvider = new DemoAudiobookProvider();
