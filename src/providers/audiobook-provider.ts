import type { BookSummary, UniversalBookObject } from "@/domain/types";

/**
 * Any content source (demo, public-domain archive, licensed catalog) implements
 * this interface. UI components never talk to a source directly.
 */
export interface AudiobookProvider {
  readonly id: string;
  readonly label: string;
  listBooks(): Promise<BookSummary[]>;
  getBook(bookId: string): Promise<UniversalBookObject | null>;
}
