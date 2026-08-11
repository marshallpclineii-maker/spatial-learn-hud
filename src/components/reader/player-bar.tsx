import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import type { Chapter } from "@/domain/types";
import { formatTime } from "@/engines/transcript-engine";
import type { NarrationMode } from "@/engines/use-audio-engine";
import { cn } from "@/lib/utils";

interface Props {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  mode: NarrationMode;
  notice: string | null;
  chapter: Chapter | null;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onSpeed: (speed: number) => void;
}

export function PlayerBar({
  currentTime,
  duration,
  isPlaying,
  speed,
  mode,
  notice,
  chapter,
  onToggle,
  onSeek,
  onSpeed,
}: Props) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSeek(currentTime - 10)}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back 10 seconds"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          onClick={onToggle}
          className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_var(--glow)] transition-transform hover:scale-105"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 translate-x-0.5" />}
        </button>
        <button
          onClick={() => onSeek(currentTime + 10)}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Forward 10 seconds"
        >
          <RotateCw className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-xs font-medium">
              {chapter ? `Ch. ${chapter.index + 1} — ${chapter.title}` : "—"}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.5}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            aria-label="Scrub position"
          />
        </div>

        <div className="flex gap-1">
          {[0.75, 1, 1.25, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[11px] transition-colors",
                speed === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] tracking-wide text-muted-foreground">
        {mode === "speech"
          ? "narration: in-browser speech engine · public-domain text"
          : "narration: silent timeline (no speech engine on this device)"}
        {notice ? ` · ${notice}` : ""}
      </p>
    </div>
  );
}
