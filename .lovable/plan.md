# Audible Integration Assessment & Target Architecture

Technical assessment only — no code changes in this iteration.

## 1. What the "Connect Audible" control actually does today

There is no OAuth or login of any kind. On `/connect`, Audible is registered as a **companion-tier** connection with `status: "companion-only"` and `capabilities: none` (all five capability flags false). The only interactive element is an external link (`companionUrl` → `audible.com/library/titles`) that opens Audible's own site in a new tab. On library cards, "Open in Audible" is a plain outbound link built from `metadata.externalLinks.audibleUrl`, which is a search URL for demo titles and `null` for the deliberately unlinked entry.

## 2. What the app receives after the user logs into Audible

Nothing. Zero bytes. The login happens on `audible.com` in a separate browsing context. The browser's same-origin policy means this app cannot read Audible's cookies, localStorage, session tokens, DOM, or network responses. There is no callback, no redirect back, no token exchange. The app never learns that a login even occurred.

## 3. Is an authorized Audible integration available?

No — not to this project, and not to any independent web app today.

- Audible publishes no public REST API, no OAuth 2.0 authorization server for third-party apps, no developer program, and no partner endpoint for personal library, chapter data, or playback position.
- Amazon's Login with Amazon returns an Amazon identity, not Audible library entitlements — it cannot grant library access.
- Audible audio is DRM-protected. Even with a downloaded file, decryption is not something an app may perform or ship.
- The community libraries that do read Audible libraries work by replaying the private mobile-app authentication flow. That is unauthorized use, breaks with any change on Amazon's side, requires handling the user's Amazon password, and is out of scope here.
- Unofficial scraping of library pages is not permitted and is additionally blocked by cross-origin restrictions in the browser.

Conclusion: an authorized Audible provider cannot be built now. The correct posture is the one the code already takes — say so plainly and never render a "connected" state.

## 4. Closest legitimate personal-use architecture

Three separate, honestly-labelled origins (already modeled in `registry.ts` as `demo | personal | connected`):

- **Personal (real, works today).** User supplies DRM-free audio they own plus an optional transcript. Stored on-device in IndexedDB. Full timeline, transcript, entities, HUD, graph, VR.
- **Companion Timeline (real, works today, best fit for Audible).** Audio plays in the Audible app. This app runs a user-controlled clock aligned to the same running time, never synthesizing narration, and delivers the entire knowledge layer alongside. Requires the user to enter/scrub position and supply a transcript they are entitled to use.
- **Connected (empty by design).** No adapter is registered. Only a genuinely authorized provider ever lands here.

The realistic accuracy ceiling for companion mode is manual sync plus drift correction. An optional future improvement is microphone-based audio fingerprint alignment to auto-lock the clock to what is actually playing in the room — that is legitimate (it listens to output, does not touch DRM or accounts) but is a substantial engine addition, not a small feature.

## 5. Building the pipeline independently of Audible

The pipeline is already Audible-independent and should stay that way. Its only contract with any provider is: a timeline position in seconds, plus a transcript.

```text
timeline seconds  ->  TranscriptEngine.segmentAt
                  ->  AttentionEngine.activeAt (L1/L2/L3)
                  ->  Knowledge HUD card
                  ->  knowledge-lookup.functions (Wikipedia / Commons, ranked sources)
                  ->  Ask the Book (server fn + deterministic fallback)
                  ->  Knowledge Graph
                  ->  Spatial reader / WebXR (same useReaderState hook)
```

Where the seconds come from — a local `HTMLAudioElement`, a companion clock, or one day an authorized provider's reported position — is irrelevant to everything downstream. That is the property worth protecting.

## 6. Keeping UniversalBookObject / AudiobookProvider plug-in ready

The domain model is close to correct. Targeted additions to make a future authorized provider a drop-in:

- `AudiobookProvider` gains optional capability declaration and optional position methods, so the UI can adapt without type checks on provider id:
  - `capabilities: ProviderCapabilities`
  - `getPlaybackPosition?(bookId): Promise<number | null>`
  - `reportPlaybackPosition?(bookId, seconds): Promise<void>`
  - `getStreamUrl?(bookId): Promise<string | null>` (authorized playback only)
- `AudioTrack.timelineMode` widens from `"companion"` to `"local" | "companion" | "provider"`, where `"provider"` means position is owned by an external authorized source.
- `BookMetadata.externalLinks` becomes a general `Record<string, string | null>` keyed by provider id, instead of an Audible-specific field.
- `BookSummary` carries `origin` and `providerId` at the source rather than having the registry stitch them on.
- Registry drops the `originOf()` string-prefix heuristic in favour of the origin recorded on the entry.

With that, adding an authorized provider is: implement the interface, register it with `origin: "connected"`, done. No UI, engine, HUD, graph, or XR change.

## 7. Exactly which files would change (when we implement)

| File | Change |
| --- | --- |
| `src/domain/types.ts` | Widen `timelineMode`; generalize `externalLinks`; add `origin`/`providerId` to `BookSummary` |
| `src/providers/audiobook-provider.ts` | Add capabilities + optional position/stream methods to the interface |
| `src/providers/registry.ts` | Read origin from provider entries; remove `originOf()` prefix heuristic |
| `src/providers/provider-connection.ts` | Derive capabilities from providers; keep Audible companion-only wording |
| `src/providers/demo-provider.ts`, `user-import-provider.ts` | Declare capabilities; set `timelineMode: "local"` |
| `src/engines/use-audio-engine.ts` | Handle three timeline modes; add companion drift/nudge controls |
| `src/routes/import.tsx` | Split the flow into "I have the audio file" vs "audio plays in Audible (companion)" |
| `src/routes/connect.tsx` | Present Audible explicitly as companion-only with a "start companion session" path |
| `src/components/library/book-card.tsx` | Generic external-link rendering from the new links map |
| `src/routes/architecture.tsx` | Update the real-vs-simulated status table with these findings |

Untouched: transcript engine, attention engine, knowledge engine, knowledge lookup, Ask the Book, HUD, graph canvas, spatial reader, XR.

## Honest limits

- Cannot read your Audible library, positions, or chapters — no authorized interface exists.
- Cannot read anything from an Audible browser session — cross-origin isolation forbids it.
- Cannot play or decrypt Audible audio.
- Can deliver the full knowledge layer alongside Audible playback, and a complete first-class experience for DRM-free audio you own.
