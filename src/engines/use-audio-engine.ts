import { useCallback, useEffect, useRef, useState } from "react";
import type { UniversalBookObject } from "@/domain/types";

export type NarrationMode = "speech" | "file" | "clock";

export interface AudioEngineState {
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  mode: NarrationMode;
  voiceReady: boolean;
  notice: string | null;
}

/**
 * Shared timestamp clock for player + transcript.
 * Narration is produced by the browser's speech engine from the public-domain
 * text (mode "speech"). Where no voice engine exists we fall back to a visible
 * silent timeline (mode "clock") rather than pretending audio is playing.
 */
export function useAudioEngine(book: UniversalBookObject | null, startAt = 0) {
  const duration = book?.metadata.durationSeconds ?? 0;
  const [currentTime, setCurrentTime] = useState(startAt);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<NarrationMode>("clock");
  const [voiceReady, setVoiceReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const timeRef = useRef(startAt);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const spokenSegmentRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) {
      setMode("speech");
      const check = () => setVoiceReady(window.speechSynthesis.getVoices().length > 0);
      check();
      window.speechSynthesis.addEventListener("voiceschanged", check);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
    }
    setMode("clock");
    setNotice("No speech engine on this device — following the silent timeline.");
    return;
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    spokenSegmentRef.current = null;
  }, []);

  const speakSegment = useCallback(
    (text: string, spanSeconds: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const words = text.split(/\s+/).length;
      const targetWps = words / Math.max(1, spanSeconds);
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = Math.min(2, Math.max(0.5, (targetWps / 2.7) * speed));
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    },
    [speed],
  );

  // Clock loop — the single source of truth for every synced surface.
  useEffect(() => {
    if (!isPlaying || !book) return;
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const delta = ((now - lastTickRef.current) / 1000) * speed;
      lastTickRef.current = now;
      const next = timeRef.current + delta;
      if (next >= duration) {
        timeRef.current = duration;
        setCurrentTime(duration);
        setIsPlaying(false);
        stopSpeech();
        return;
      }
      timeRef.current = next;
      setCurrentTime(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speed, duration, book, stopSpeech]);

  // Narrate whichever segment the clock is inside.
  useEffect(() => {
    if (!book || !isPlaying || mode !== "speech") return;
    const segment = book.transcript.find(
      (s) => currentTime >= s.startSeconds && currentTime < s.endSeconds,
    );
    if (!segment) return;
    if (spokenSegmentRef.current === segment.id) return;
    spokenSegmentRef.current = segment.id;
    speakSegment(segment.text, segment.endSeconds - segment.startSeconds);
  }, [book, currentTime, isPlaying, mode, speakSegment]);

  const play = useCallback(() => {
    if (!book) return;
    if (timeRef.current >= duration) {
      timeRef.current = 0;
      setCurrentTime(0);
    }
    spokenSegmentRef.current = null;
    setIsPlaying(true);
  }, [book, duration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopSpeech();
  }, [stopSpeech]);

  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.min(Math.max(0, seconds), duration);
      timeRef.current = clamped;
      setCurrentTime(clamped);
      stopSpeech();
    },
    [duration, stopSpeech],
  );

  const changeSpeed = useCallback(
    (next: number) => {
      setSpeed(next);
      spokenSegmentRef.current = null;
      stopSpeech();
    },
    [stopSpeech],
  );

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const state: AudioEngineState = { currentTime, isPlaying, speed, mode, voiceReady, notice };
  return { ...state, duration, play, pause, toggle, seek, setSpeed: changeSpeed };
}
