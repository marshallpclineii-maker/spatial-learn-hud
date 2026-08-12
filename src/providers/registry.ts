import type { BookSummary, UniversalBookObject } from "@/domain/types";
import type { AudiobookProvider } from "./audiobook-provider";
import { demoProvider } from "./demo-provider";
import { userImportProvider } from "./user-import-provider";

/**
 * Provider registry. The UI asks the registry for books and never needs to
 * know which provider answered — only which *origin* a title has, so demo,
 * personal and connected-provider content are never silently mixed.
 */

export type BookOrigin = "demo" | "personal" | "connected";

export const ORIGIN_LABEL: Record<BookOrigin, string> = {
  demo: "Demo content",
  personal: "Personal content",
  connected: "Connected provider content",
};

export interface LibraryEntry extends BookSummary {
  origin: BookOrigin;
  providerId: string;
}

interface RegisteredProvider {
  provider: AudiobookProvider;
  origin: BookOrigin;
}

/**
 * No authorized Audible integration exists, so no provider is registered with
 * origin "connected". A connected provider appears here only when a real
 * authorized adapter is implemented — never as a placeholder.
 */
const registered: RegisteredProvider[] = [
  { provider: userImportProvider, origin: "personal" },
  { provider: demoProvider, origin: "demo" },
];

export async function listAllBooks(): Promise<LibraryEntry[]> {
  const results = await Promise.all(
    registered.map(async ({ provider, origin }) => {
      try {
        const books = await provider.listBooks();
        return books.map((b) => ({ ...b, origin, providerId: provider.id }));
      } catch {
        return [] as LibraryEntry[];
      }
    }),
  );
  return results.flat();
}

export async function getBookAnywhere(bookId: string): Promise<UniversalBookObject | null> {
  for (const { provider } of registered) {
    try {
      const book = await provider.getBook(bookId);
      if (book) return book;
    } catch {
      /* try the next provider */
    }
  }
  return null;
}

export function originOf(bookId: string): BookOrigin {
  return bookId.startsWith("personal-") ? "personal" : "demo";
}