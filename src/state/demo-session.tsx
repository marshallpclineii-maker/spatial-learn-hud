import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LearningHistoryItem, UserLearningHistory } from "@/domain/types";

const STORAGE_KEY = "spatial-audio-demo-session-v1";

interface DemoSession {
  demoStarted: boolean;
  history: UserLearningHistory;
  startDemo: () => void;
  resetDemo: () => void;
  recordPosition: (bookId: string, seconds: number) => void;
  record: (item: Omit<LearningHistoryItem, "timestamp">) => void;
}

const emptyHistory: UserLearningHistory = { lastPositionSeconds: {}, items: [] };

const Ctx = createContext<DemoSession | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [demoStarted, setDemoStarted] = useState(false);
  const [history, setHistory] = useState<UserLearningHistory>(emptyHistory);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { demoStarted: boolean; history: UserLearningHistory };
        setDemoStarted(Boolean(parsed.demoStarted));
        setHistory(parsed.history ?? emptyHistory);
      }
    } catch {
      /* corrupt storage is simply ignored */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ demoStarted, history }));
  }, [demoStarted, history, hydrated]);

  const startDemo = useCallback(() => setDemoStarted(true), []);

  const resetDemo = useCallback(() => {
    setDemoStarted(false);
    setHistory(emptyHistory);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
  }, []);

  const recordPosition = useCallback((bookId: string, seconds: number) => {
    setHistory((h) => ({ ...h, lastPositionSeconds: { ...h.lastPositionSeconds, [bookId]: seconds } }));
  }, []);

  const record = useCallback((item: Omit<LearningHistoryItem, "timestamp">) => {
    setHistory((h) => {
      const last = h.items[0];
      if (last && last.kind === item.kind && last.label === item.label) return h;
      return { ...h, items: [{ ...item, timestamp: Date.now() }, ...h.items].slice(0, 40) };
    });
  }, []);

  const value = useMemo(
    () => ({ demoStarted, history, startDemo, resetDemo, recordPosition, record }),
    [demoStarted, history, startDemo, resetDemo, recordPosition, record],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoSession(): DemoSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoSession must be used inside DemoSessionProvider");
  return ctx;
}
