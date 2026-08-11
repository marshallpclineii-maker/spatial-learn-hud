# Spatial Audio Library & Knowledge HUD

A spatial-computing audiobook learning platform: listen to a demo audiobook while synchronized transcript, contextual knowledge cards, an "Ask the Book" assistant, a knowledge graph, and a 3D/VR library surround the listening experience.

## Build priority
The 60–90 second Active Reader flow is built and polished first: audio/transcript sync → Knowledge HUD → Ask the Book → Knowledge Graph → 3D Virtual Library → WebXR. Everything else stays functional but secondary.

## Architecture (layered, provider-agnostic)

```text
src/
  domain/        UniversalBookObject types (metadata, audio, transcript,
                 chapters, entities, concepts, definitions, events,
                 questions, knowledgeGraph, learningHistory)
  providers/     AudiobookProvider interface + DemoAudiobookProvider
  engines/       audio-engine, transcript-engine (timestamp index),
                 attention-engine (L1/L2/L3 entity priority scoring),
                 knowledge-engine (retrieval + Ask the Book)
  components/    UI (library, reader, HUD, graph, chat)
  xr/            React Three Fiber scene + WebXR capability detection
  routes/        /, /library, /reader, /graph, /virtual-library
```

Every UI component reads only from the domain model, so a future real provider (Audible-linked catalog, other sources) plugs in without UI changes.

## Demo content
One complete public-domain demo audiobook plus two catalog entries. Audio is a public-domain LibriVox/Internet Archive recording streamed from its public URL; the transcript is hand-authored with per-segment timestamps for a curated 60–90 second opening plus a chapter transition, with ~12 entities (people, places, organizations, concepts), definitions, "why this matters here" notes, and graph relationships. If audio fails to load, the reader falls back to a visible timeline-clock mode so sync, HUD, and graph stay demonstrable — never a fake "connected" state.

## Features

**My Library** — grid with search, sort, filters, and thematic stacks (AI, Philosophy, Science). Each card has four distinct actions: Listen, Open in Audible (real external link, or explicitly disabled "no link available"), Enter VR, Read. No scraping, no credentials, no DRM handling.

**Active Reader** — shared timestamp model between player and transcript: word/segment highlight, auto-scroll, chapter tracking, scrub-to-seek both directions, playback speed. Entity markers appear inline as audio reaches them.

**Knowledge HUD** — a subtle pulse indicator on high-priority entities; clicking opens a side card with name, type, definition, "why this matters here", source, related concepts, and deep-dive links (open in graph / ask the book). The card never pauses audio.

**Ask the Book** — chat panel that sends full context (book, author, chapter, timestamp, nearby transcript, selected entity, graph edges) to a server function calling Lovable AI. A deterministic contextual demo engine answers from the book's own definitions and relationships whenever AI is unavailable, with a clear indicator of which mode is active.

**Knowledge Graph** — interactive canvas force-layout graph with zoom, pan, node select, relationship inspection, HUD card open, and "return to this moment in the book".

**Virtual Library** — React Three Fiber scene with shelves, book spines, and a central Reading Dock; orbit controls on desktop, "Enter VR" only when WebXR is actually reported by the device, with an honest unsupported-device message otherwise and full 2D fallback.

**Demo controls** — START DEMO seeds the curated moment; RESET DEMO clears listening progress and history so it can be re-run.

## Design direction
Dark spatial UI: deep slate/near-black surfaces, glass panels, one luminous cyan-amber accent pair for entity attention levels, monospace timestamps, restrained motion (pulse, fade, depth blur). All tokens in `src/styles.css`.

## Technical notes
- Adds `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`.
- 3D/XR components are loaded client-only (dynamic import behind a hydration gate) to avoid SSR issues.
- Ask the Book runs through a TanStack `createServerFn`; the AI key stays server-side.
- Loading, empty, error, and unsupported-device states throughout; no persistence backend needed (progress kept in local state/localStorage) unless you want cross-device history later.
