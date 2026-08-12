import type { UniversalBookObject } from "@/domain/types";

/**
 * Personal library persistence.
 *
 * Personal titles live entirely on the user's own device (IndexedDB): the
 * UniversalBookObject plus, when the user supplied one, the actual audio file
 * as a Blob. Nothing is uploaded and no provider credentials are involved.
 */

const DB_NAME = "spatial-knowledge-library";
const DB_VERSION = 1;
const STORE = "personal-books";

export type PersonalMode = "local-audio" | "companion-timeline";

export interface PersonalRecord {
  id: string;
  /** Book object as stored — audio.src is always null on disk. */
  book: UniversalBookObject;
  mode: PersonalMode;
  audioBlob?: Blob | undefined;
  audioFileName?: string | undefined;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser has no local storage for personal books."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB unavailable"));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Storage error"));
    t.oncomplete = () => db.close();
  });
}

export async function listPersonalRecords(): Promise<PersonalRecord[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<PersonalRecord[]>("readonly", (s) => s.getAll() as IDBRequest<PersonalRecord[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getPersonalRecord(id: string): Promise<PersonalRecord | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const rec = await tx<PersonalRecord | undefined>("readonly", (s) => s.get(id) as IDBRequest<PersonalRecord | undefined>);
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function putPersonalRecord(record: PersonalRecord): Promise<void> {
  await tx("readwrite", (s) => s.put(record) as IDBRequest<IDBValidKey>);
}

export async function deletePersonalRecord(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id) as IDBRequest<undefined>);
}

/** Object URLs are created per session; the Blob itself is the persisted form. */
const urlCache = new Map<string, string>();

export function audioUrlFor(id: string, blob: Blob | undefined): string | null {
  if (!blob || typeof URL === "undefined") return null;
  const existing = urlCache.get(id);
  if (existing) return existing;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}