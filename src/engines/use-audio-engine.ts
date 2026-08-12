import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineMode, UniversalBookObject } from "@/domain/types";

export type NarrationMode = "speech" | "file" | "clock";

export interface AudioEngineState {
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  mode: NarrationMode;
  voiceReady: boolean;
  notice: string | null;
}

/** Which clock the rest of the pipeline is synchronized to. */
export type TimelineAuthority =
  | "audio-element"
  | "speech-clock"
  | "companion-clock"
  | "provider-reported"
  | "simulated-clock";

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
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const hasFile = Boolean(book?.audio.src);
  const timelineMode: TimelineMode = book?.audio.timelineMode ?? (hasFile ? "local" : "local");
  const isCompanion = timelineMode === "companion";
  const isProviderTimeline = timelineMode === "provider";

  useEffect(() => {
    if (typeof window === "undefined") return;
    // A real audio stream always wins: it becomes the authoritative timeline.
    if (hasFile) {
      setMode("file");
      return;
    }
    if (isCompanion) {
      setMode("clock");
      setNotice("Companion timeline — play the title in your provider's app and scrub here to match.");
      return;
    }
    if (isProviderTimeline) {
      setMode("clock");
      setNotice("Position reported by the authorized provider.");
      return;
    }
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
  }, [hasFile, isCompanion, isProviderTimeline]);

  // Real audio element — created only when the book ships an actual stream.
  useEffect(() => {
    const src = book?.audio.src;
    if (typeof window === "undefined" || !src) return;
    const el = new Audio(src);
    el.preload = "metadata";
    el.currentTime = timeRef.current;
    audioElRef.current = el;
    const onTime = () => {
      timeRef.current = el.currentTime;
      setCurrentTime(el.currentTime);
    };
    const onEnd = () => setIsPlaying(false);
    const onError = () => setNotice("The audio stream could not be played on this device.");
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onError);
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onError);
      audioElRef.current = null;
    };
  }, [book?.audio.src]);

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
    // Skipped entirely when a real audio element owns the timeline.
    if (!isPlaying || !book || mode === "file") return;
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
  }, [isPlaying, speed, duration, book, stopSpeech, mode]);

  // Narrate whichever segment the clock is inside.
  useEffect(() => {
    // Companion and provider timelines must never speak over real playback.
    if (!book || !isPlaying || mode !== "speech" || isCompanion || isProviderTimeline) return;
    const segment = book.transcript.find(
      (s) => currentTime >= s.startSeconds && currentTime < s.endSeconds,
    );
    if (!segment) return;
    if (spokenSegmentRef.current === segment.id) return;
    spokenSegmentRef.current = segment.id;
    speakSegment(segment.text, segment.endSeconds - segment.startSeconds);
  }, [book, currentTime, isPlaying, mode, speakSegment, isCompanion, isProviderTimeline]);

  const play = useCallback(() => {
    if (!book) return;
    if (timeRef.current >= duration) {
      timeRef.current = 0;
      setCurrentTime(0);
      if (audioElRef.current) audioElRef.current.currentTime = 0;
    }
    spokenSegmentRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.playbackRate = speed;
      void audioElRef.current.play().catch(() => setNotice("Playback needs a direct tap on this device."));
    }
    setIsPlaying(true);
  }, [book, duration, speed]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioElRef.current?.pause();
    stopSpeech();
  }, [stopSpeech]);

  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.min(Math.max(0, seconds), duration);
      timeRef.current = clamped;
      setCurrentTime(clamped);
      if (audioElRef.current) audioElRef.current.currentTime = clamped;
      stopSpeech();
    },
    [duration, stopSpeech],
  );

  const changeSpeed = useCallback(
    (next: number) => {
      setSpeed(next);
      spokenSegmentRef.current = null;
      if (audioElRef.current) audioElRef.current.playbackRate = next;
      stopSpeech();
    },
    [stopSpeech],
  );

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  /** Companion drift correction: nudge the clock by ±seconds without stopping. */
  const nudge = useCallback(
    (deltaSeconds: number) => {
      const clamped = Math.min(Math.max(0, timeRef.current + deltaSeconds), duration);
      timeRef.current = clamped;
      setCurrentTime(clamped);
      if (audioElRef.current) audioElRef.current.currentTime = clamped;
    },
    [duration],
  );

  const state: AudioEngineState = { currentTime, isPlaying, speed, mode, voiceReady, notice };
  const authority: TimelineAuthority =
    mode === "file"
      ? "audio-element"
      : isProviderTimeline
        ? "provider-reported"
        : isCompanion
          ? "companion-clock"
          : mode === "speech"
            ? "speech-clock"
            : "simulated-clock";
  return {
    ...state,
    authority,
    timelineMode,
    duration,
    play,
    pause,
    toggle,
    seek,
    nudge,
    setSpeed: changeSpeed,
  };
}
