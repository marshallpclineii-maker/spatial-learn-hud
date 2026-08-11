import type { AttentionLevel, Entity, UniversalBookObject } from "@/domain/types";

export interface AttentionItem {
  entity: Entity;
  level: AttentionLevel;
  score: number;
  reason: string;
}

/**
 * Scores which entities deserve the listener's attention at a given moment.
 * Level 1 = surfaced automatically, 2 = subtle marker, 3 = available on demand.
 */
export class AttentionEngine {
  private readonly all: Entity[];

  constructor(private readonly book: UniversalBookObject) {
    this.all = [...book.entities, ...book.concepts];
  }

  byId(id: string): Entity | null {
    return this.all.find((e) => e.id === id) ?? null;
  }

  allEntities(): Entity[] {
    return this.all;
  }

  activeAt(seconds: number): AttentionItem[] {
    const segment = this.book.transcript.find(
      (s) => seconds >= s.startSeconds && seconds < s.endSeconds,
    );
    const activeIds = new Set(segment?.entityIds ?? []);
    const recentIds = new Set(
      this.book.transcript
        .filter((s) => s.endSeconds <= seconds && s.endSeconds > seconds - 24)
        .flatMap((s) => s.entityIds),
    );

    return this.all
      .map((entity) => {
        const isActive = activeIds.has(entity.id);
        const isRecent = recentIds.has(entity.id);
        const introduced = entity.firstMentionSeconds <= seconds + 0.01;
        const positional = isActive ? 1 : isRecent ? 0.55 : introduced ? 0.2 : 0;
        const score = Number((entity.salience * 0.55 + positional * 0.45).toFixed(3));
        const level: AttentionLevel =
          isActive && entity.salience >= 0.75 ? 1 : isActive || (isRecent && entity.salience >= 0.8) ? 2 : 3;
        const reason = isActive
          ? "Mentioned in the line being spoken"
          : isRecent
            ? "Mentioned moments ago"
            : introduced
              ? "Introduced earlier in this book"
              : "Appears later";
        return { entity, level, score, reason };
      })
      .sort((a, b) => a.level - b.level || b.score - a.score);
  }

  focusAt(seconds: number): AttentionItem | null {
    const items = this.activeAt(seconds).filter((i) => i.level === 1);
    return items[0] ?? null;
  }
}
