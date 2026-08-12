import type { BookOrigin, BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider } from "./audiobook-provider";
import { demoProvider } from "./demo-provider";
import { userImportProvider } from "./user-import-provider";

/**
 * Provider registry. The UI asks the registry for books and never needs to
 * know which provider answered — only which *origin* a title has, so demo,
 * personal and connected-provider content are never silently mixed.
 */

export type { BookOrigin };

export const ORIGIN_LABEL: Record<BookOrigin, string> = {
  demo: "Demo content",
  personal: "Personal content",
  connected: "Connected provider content",
};

/** Every summary already carries its own origin and provider id. */
export type LibraryEntry = BookSummary;

/**
 * No authorized Audible integration exists, so no provider is registered with
 * origin "connected". A connected provider appears here only when a real
 * authorized adapter is implemented — never as a placeholder.
 */
const registered: AudiobookProvider[] = [userImportProvider, demoProvider];

export function registeredProviders(): AudiobookProvider[] {
  return registered;
}

export async function listAllBooks(): Promise<LibraryEntry[]> {
  const results = await Promise.all(
    registered.map(async (provider) => {
      try {
        return await provider.listBooks();
      } catch {
        return [] as LibraryEntry[];
      }
    }),
  );
  return results.flat();
}

export async function getBookAnywhere(bookId: string): Promise<UniversalBookObject | null> {
  for (const provider of registered) {
    try {
      const book = await provider.getBook(bookId);
      if (book) return book;
    } catch {
      /* try the next provider */
    }
  }
  return null;
}