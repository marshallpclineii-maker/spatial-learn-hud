import type { Entity, UniversalBookObject } from "@/domain/types";
import { formatTime } from "./transcript-engine";

export interface AskContext {
  book: UniversalBookObject;
  atSeconds: number;
  chapterId: string;
  transcriptWindow: string;
  selectedEntity: Entity | null;
}

export interface AskAnswer {
  text: string;
  citations: string[];
  engine: "ai" | "contextual-demo";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

/** Deterministic contextual engine — answers strictly from the book object. */
export function answerFromBook(question: string, ctx: AskContext): AskAnswer {
  const { book, chapterId, atSeconds } = ctx;
  const q = norm(question);
  const all: Entity[] = [...book.entities, ...book.concepts];
  const chapter = book.chapters.find((c) => c.id === chapterId);

  const prepared = book.questions
    .map((item) => {
      const words = norm(item.question).split(/\s+/).filter((w) => w.length > 3);
      const hits = words.filter((w) => q.includes(w)).length;
      return { item, score: hits / Math.max(1, words.length) };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (prepared && prepared.score >= 0.5) {
    return {
      text: prepared.item.answer,
      citations: prepared.item.entityIds
        .map((id) => all.find((e) => e.id === id)?.name)
        .filter(Boolean) as string[],
      engine: "contextual-demo",
    };
  }

  const matched = all
    .filter((e) => {
      const names = [e.name, ...(e.aliases ?? [])].map(norm);
      return names.some((n) => q.includes(n) || n.split(/\s+/).every((w) => w.length > 4 && q.includes(w)));
    })
    .sort((a, b) => b.salience - a.salience);

  const target = matched[0] ?? ctx.selectedEntity;

  if (target) {
    const why = target.whyItMatters[chapterId];
    const related = target.relatedConceptIds
      .map((id) => all.find((e) => e.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    return {
      text: [
        `${target.name} — ${target.definition.short}`,
        target.definition.long,
        why ? `At ${formatTime(atSeconds)} in "${chapter?.title ?? "this chapter"}": ${why}` : null,
        related ? `Connected in this book to ${related}.` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      citations: [target.definition.source],
      engine: "contextual-demo",
    };
  }

  if (/summar|about|what is this|recap/.test(q)) {
    return {
      text: `You are ${formatTime(atSeconds)} into "${book.metadata.title}" by ${book.metadata.author}. ${chapter ? `Chapter ${chapter.index + 1}, ${chapter.title}: ${chapter.summary}` : ""}\n\nJust heard: "${ctx.transcriptWindow}"`,
      citations: [book.metadata.publisher ?? book.metadata.license],
      engine: "contextual-demo",
    };
  }

  const suggestions = book.questions
    .filter((item) => item.chapterId === chapterId || item.chapterId === "any")
    .map((item) => `• ${item.question}`)
    .join("\n");

  return {
    text: `I answer from this book's own notes, and I don't find that in the passage around ${formatTime(atSeconds)}. Things this chapter can answer right now:\n\n${suggestions}`,
    citations: [],
    engine: "contextual-demo",
  };
}
