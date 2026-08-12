import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Entity, UniversalBookObject } from "@/domain/types";
import { AttentionEngine } from "./attention-engine";
import { TranscriptEngine } from "./transcript-engine";
import { useAudioEngine } from "./use-audio-engine";
import { useDemoSession } from "@/state/demo-session";

/**
 * The single Active Reader state. Both the 2D reader and the spatial (WebXR)
 * reader mount this same hook, so the audio → transcript → entity → HUD chain
 * is identical in flat and spatial modes.
 */
export function useReaderState(book: UniversalBookObject | null, startAt = 0) {
  const audio = useAudioEngine(book, startAt);
  const { recordPosition, record } = useDemoSession();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const lastChapterRef = useRef<string | null>(null);

  const transcriptEngine = useMemo(() => (book ? new TranscriptEngine(book) : null), [book]);
  const attentionEngine = useMemo(() => (book ? new AttentionEngine(book) : null), [book]);

  const segment = transcriptEngine?.segmentAt(audio.currentTime) ?? null;
  const chapter = transcriptEngine?.chapterAt(audio.currentTime) ?? null;
  const attention = attentionEngine?.activeAt(audio.currentTime) ?? [];
  const selectedEntity: Entity | null = selectedEntityId
    ? (attentionEngine?.byId(selectedEntityId) ?? null)
    : null;
  const focus = attentionEngine?.focusAt(audio.currentTime) ?? null;
  const contextWindow = transcriptEngine?.contextWindow(audio.currentTime) ?? "";

  const entityNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of attentionEngine?.allEntities() ?? []) map[e.id] = e.name;
    return map;
  }, [attentionEngine]);

  useEffect(() => {
    if (!book) return;
    recordPosition(book.metadata.id, audio.currentTime);
  }, [book, audio.currentTime, recordPosition]);

  useEffect(() => {
    if (!chapter || !book) return;
    if (lastChapterRef.current === chapter.id) return;
    lastChapterRef.current = chapter.id;
    record({
      bookId: book.metadata.id,
      atSeconds: audio.currentTime,
      kind: "chapter-reached",
      label: chapter.title,
    });
  }, [chapter, book, audio.currentTime, record]);

  const selectEntity = useCallback(
    (id: string) => {
      setSelectedEntityId(id);
      if (!book) return;
      record({
        bookId: book.metadata.id,
        atSeconds: audio.currentTime,
        kind: "entity-opened",
        label: entityNames[id] ?? id,
      });
    },
    [book, audio.currentTime, record, entityNames],
  );

  return {
    audio,
    transcriptEngine,
    attentionEngine,
    segment,
    chapter,
    attention,
    focus,
    contextWindow,
    entityNames,
    selectedEntityId,
    selectedEntity,
    selectEntity,
    clearEntity: () => setSelectedEntityId(null),
  };
}

export type ReaderState = ReturnType<typeof useReaderState>;