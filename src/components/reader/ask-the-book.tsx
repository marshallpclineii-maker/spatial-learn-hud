import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import type { Entity, UniversalBookObject } from "@/domain/types";
import { answerFromBook } from "@/engines/knowledge-engine";
import { formatTime } from "@/engines/transcript-engine";
import { askTheBookAi } from "@/lib/ask-the-book.functions";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "book";
  text: string;
  engine?: "ai" | "contextual-demo";
  citations?: string[];
}

interface Props {
  book: UniversalBookObject;
  atSeconds: number;
  chapterId: string;
  transcriptWindow: string;
  selectedEntity: Entity | null;
  pendingQuestion: string | null;
  onConsumedQuestion: () => void;
  onAsked: (question: string) => void;
}

export function AskTheBook({
  book,
  atSeconds,
  chapterId,
  transcriptWindow,
  selectedEntity,
  pendingQuestion,
  onConsumedQuestion,
  onAsked,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const askAi = useServerFn(askTheBookAi);
  const listRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ atSeconds, chapterId, transcriptWindow, selectedEntity });
  stateRef.current = { atSeconds, chapterId, transcriptWindow, selectedEntity };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const submit = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    onAsked(q);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: q }]);

    const ctx = stateRef.current;
    const chapter = book.chapters.find((c) => c.id === ctx.chapterId);
    const fallback = answerFromBook(q, {
      book,
      atSeconds: ctx.atSeconds,
      chapterId: ctx.chapterId,
      transcriptWindow: ctx.transcriptWindow,
      selectedEntity: ctx.selectedEntity,
    });

    let result: Message = {
      id: `b-${Date.now()}`,
      role: "book",
      text: fallback.text,
      engine: fallback.engine,
      citations: fallback.citations,
    };

    try {
      const ai = await askAi({
        data: {
          question: q,
          bookTitle: book.metadata.title,
          author: book.metadata.author,
          chapterTitle: chapter?.title ?? "",
          timestamp: formatTime(ctx.atSeconds),
          transcriptWindow: ctx.transcriptWindow,
          selectedEntity: ctx.selectedEntity?.name ?? null,
          relationships: book.knowledgeGraph.edges.slice(0, 20).map((e) => {
            const s = book.knowledgeGraph.nodes.find((n) => n.id === e.source)?.label ?? e.source;
            const t = book.knowledgeGraph.nodes.find((n) => n.id === e.target)?.label ?? e.target;
            return `${s} ${e.relation} ${t}`;
          }),
        },
      });
      if (ai.status === "ok") {
        result = { ...result, text: ai.text, engine: "ai", citations: [] };
      }
    } catch {
      /* keep the deterministic answer */
    }

    setMessages((m) => [...m, result]);
    setBusy(false);
  };

  useEffect(() => {
    if (!pendingQuestion) return;
    void submit(pendingQuestion);
    onConsumedQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  const suggestions = book.questions
    .filter((item) => item.chapterId === chapterId || item.chapterId === "any")
    .slice(0, 3);

  return (
    <div className="glass flex h-full flex-col rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Ask the Book</h3>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          ctx {formatTime(atSeconds)}
        </span>
      </div>

      <div ref={listRef} className="mt-3 max-h-80 min-h-24 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Questions are answered with the current chapter, timestamp, transcript and selected entity as context.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm whitespace-pre-line",
              m.role === "user" ? "ml-6 bg-primary/15 text-foreground" : "mr-2 bg-secondary/70",
            )}
          >
            {m.text}
            {m.role === "book" && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                {m.engine === "ai" ? "answered by live AI" : "answered by contextual demo engine"}
                {m.citations?.length ? ` · ${m.citations.join(" · ")}` : ""}
              </p>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Consulting the book…
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => void submit(s.question)}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {s.question}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this passage…"
          className="flex-1 rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Send question"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
