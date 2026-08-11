import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(1).max(500),
  bookTitle: z.string(),
  author: z.string(),
  chapterTitle: z.string(),
  timestamp: z.string(),
  transcriptWindow: z.string(),
  selectedEntity: z.string().nullable(),
  relationships: z.array(z.string()),
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
      "Answer only from the supplied context. If the context does not contain the answer, say so plainly.",
      "Be concise: at most 120 words, no markdown headings.",
    ].join(" ");

    const context = [
      `Book: ${data.bookTitle} by ${data.author}`,
      `Chapter: ${data.chapterTitle} — position ${data.timestamp}`,
      `Transcript around the listener: ${data.transcriptWindow}`,
      data.selectedEntity ? `Selected entity: ${data.selectedEntity}` : "",
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
