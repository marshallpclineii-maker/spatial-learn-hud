import type { Chapter, TranscriptSegment, UniversalBookObject } from "@/domain/types";

/** Timestamp index shared by the player, the transcript view and the HUD. */
export class TranscriptEngine {
  constructor(private readonly book: UniversalBookObject) {}

  segmentAt(seconds: number): TranscriptSegment | null {
    const list = this.book.transcript;
    for (const s of list) {
      if (seconds >= s.startSeconds && seconds < s.endSeconds) return s;
    }
    return seconds >= (list[list.length - 1]?.endSeconds ?? 0) ? (list[list.length - 1] ?? null) : null;
  }

  chapterAt(seconds: number): Chapter | null {
    return (
      this.book.chapters.find((c) => seconds >= c.startSeconds && seconds < c.endSeconds) ??
      this.book.chapters[this.book.chapters.length - 1] ??
      null
    );
  }

  /** Transcript text around a position, used as context for Ask the Book. */
  contextWindow(seconds: number, radius = 2): string {
    const list = this.book.transcript;
    const idx = list.findIndex((s) => seconds >= s.startSeconds && seconds < s.endSeconds);
    if (idx < 0) return list.slice(0, radius * 2 + 1).map((s) => s.text).join(" ");
    return list
      .slice(Math.max(0, idx - radius), idx + radius + 1)
      .map((s) => s.text)
      .join(" ");
  }

  /** Word-level progress within the active segment, 0..1. */
  segmentProgress(seconds: number, segment: TranscriptSegment): number {
    const span = segment.endSeconds - segment.startSeconds;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (seconds - segment.startSeconds) / span));
  }
}

export const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
