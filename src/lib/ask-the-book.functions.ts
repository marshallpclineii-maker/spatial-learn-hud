import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(1).max(500),
  bookTitle: z.string().max(200),
  author: z.string().max(200),
  chapterTitle: z.string().max(200),
  timestamp: z.string().max(20),
  transcriptWindow: z.string().max(2000),
  currentSentence: z.string().max(600).default(""),
  selectedEntity: z.string().max(200).nullable(),
  activeEntities: z.array(z.string().max(120)).max(12).default([]),
  relationships: z.array(z.string().max(200)).max(20),
});

export type AskTheBookResult =
  | { status: "ok"; text: string }
  | { status: "unavailable"; reason: string };

/**
 * Optional AI layer. When no gateway key is configured the caller falls back to
 * the deterministic contextual engine — the UI always states which one answered.
 */
export const askTheBookAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }): Promise<AskTheBookResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { status: "unavailable", reason: "No AI credentials configured" };

    const system = [
      "You are the voice of a specific audiobook, answering a listener mid-playback.",
      'Resolve deictic references from the listening context: "this"/"that"/"it" mean the sentence currently being spoken, and "who is that" means the entity currently in focus.',
      "Answer only from the supplied context. If the context does not contain the answer, say so plainly.",
      "Be concise: at most 120 words, no markdown headings.",
    ].join(" ");

    const context = [
      `Book: ${data.bookTitle} by ${data.author}`,
      `Chapter: ${data.chapterTitle} — position ${data.timestamp}`,
      data.currentSentence ? `Sentence being spoken right now: "${data.currentSentence}"` : "",
      `Transcript around the listener: ${data.transcriptWindow}`,
      data.selectedEntity ? `Entity in focus (the referent of "that"/"who"): ${data.selectedEntity}` : "",
      data.activeEntities.length ? `Entities active in this passage: ${data.activeEntities.join(", ")}` : "",
      data.relationships.length ? `Known relationships: ${data.relationships.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `${context}\n\nListener asks: ${data.question}` },
          ],
        }),
      });
      if (res.status === 429) return { status: "unavailable", reason: "AI rate limit reached" };
      if (res.status === 402) return { status: "unavailable", reason: "AI credits exhausted" };
      if (!res.ok) return { status: "unavailable", reason: `AI service error ${res.status}` };
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) return { status: "unavailable", reason: "Empty AI response" };
      return { status: "ok", text };
    } catch {
      return { status: "unavailable", reason: "Could not reach the AI service" };
    }
  });
