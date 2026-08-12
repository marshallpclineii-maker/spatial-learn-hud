# "Log in with Audible": Feasibility Assessment and Nearest Architecture

Assessment only. No code changes in this iteration.

## 1. Is there a legitimate Audible developer/partner API or OAuth?

No. Audible publishes no public developer program, no OAuth authorization server for third-party apps, and no documented endpoint for personal library, chapters, playback position, or audio. Amazon's public developer surfaces (Login with Amazon, Selling Partner, Alexa, Product Advertising API) do not expose Audible library entitlements. Partner access exists only through negotiated business relationships (device makers, automotive, Alexa), not through self-serve registration.

Consequence: a real "Log in with Audible" button cannot be built today, by this project or any other independent web app.

## 2. Is there a supported Amazon identity mechanism that reaches an Audible account?

Login with Amazon works and is legitimate, but it returns an Amazon *identity* (name, email, user id) with no Audible scopes. There is no `audible:library.read` scope to request. An LwA sign-in would tell us who the user is and nothing about what they own. It cannot power the vision, and adding it would imply a connection that does not exist.

## 3. Is there any browser mechanism for the user to authorize library metadata transfer?

No, for two independent reasons:
- Cross-origin isolation: this app cannot read audible.com cookies, storage, DOM, or network responses. No user consent gesture inside our app can override that; consent must be granted *by Audible* on its own origin, and Audible offers no such flow.
- No export surface: Audible provides no user-initiated library export (no JSON/CSV/OPML download, no "share my library" endpoint). So even the fully manual, user-driven path — user downloads their own data, we ingest it — has nothing to ingest. (Amazon's "Request My Data" privacy portal does return audible listening/library files by email, on a delayed, non-realtime basis. That is a real, user-authorized file the user could hand us, but it is a privacy export, not a product integration: slow, unstable format, metadata only, no audio, no live position.)

## 4. Precisely which parts of the vision are blocked, and why

```text
BLOCKED (no authorized interface exists)
  one-click Audible login                 no OAuth / no developer program
  automatic library listing               no library API
  automatic cover/chapter metadata        no catalog API for owned titles
  reading current playback position       not exposed to third parties
  playing Audible audio inside our app    DRM + no licensed playback SDK
  automatic transcript from Audible audio DRM-protected stream; also no
                                          rights to transcribe the recording

BLOCKED (browser security, unfixable by us)
  reading an Audible session from our tab same-origin policy
  embedding audible.com in an iframe      X-Frame-Options / CSP frame-ancestors

NOT BLOCKED (works today, legitimately)
  user-declared library (titles the user
    tells us they own, enriched from
    public catalog data)
  a user-controlled timeline that matches
    what Audible is playing
  transcript the user is entitled to use
  entities, definitions, people/places/
    orgs/things/concepts
  web sources + image search
  Knowledge HUD, Ask the Book,
  Knowledge Graph
  2D library, 3D bookshelf, Quest WebXR
```

The blocked set is exactly two things: **library acquisition** and **playback position**. Everything downstream of "a title plus a number of seconds" is already built and unaffected.

## 5. Can audible.com be used as an embedded companion playback surface?

Not embedded. Audible's cloud player sends frame-blocking headers, so an iframe or WebView-in-page will refuse to render; inside the Quest browser this is the same. The only supported companion shapes are:
- Audible's own app or a separate browser tab/window plays the audio.
- On Quest, Audible's own Android app (or the Quest browser on audible.com) plays audio while our WebXR bookshelf runs in parallel. Quest allows audio from a backgrounded app to continue under an immersive session, so a genuine "listening in Audible, knowledge layer in VR" experience is possible.

No inspection or extraction of Audible's page occurs in either shape.

## 6. Can we synchronize a knowledge layer with Audible playback legitimately?

Yes, through user-controlled mechanisms only. In increasing order of fidelity:
1. **Manual sync** — user types or scrubs to the position Audible shows, then drift-nudges. Already implemented.
2. **Chapter anchor sync** — user taps "chapter just started"; we snap the clock to that chapter boundary. Cheap, big accuracy gain, no new permissions.
3. **Tap-to-anchor / re-anchor** — user taps whenever a recognizable line is spoken; we re-align and re-estimate rate drift. Works well in VR with a single controller button.
4. **Acoustic self-alignment (microphone)** — with explicit mic consent, fingerprint the room audio and lock our clock to the transcript automatically, continuously. This listens to sound in the room, exactly like Shazam; it does not touch DRM, accounts, or Audible's servers. This is the only path that makes sync feel automatic, and it is legitimate. It is a substantial engine addition, not a small feature.

Note the honest limit on (4): it needs a transcript to align against, and the transcript must come from a source the user is entitled to use (their own ebook copy, a publisher-provided text, public-domain text) — not from the Audible recording.

## 7. Closest architecture that preserves the product vision

Keep the vision; replace only the impossible acquisition step. The button becomes **"Connect my Audible library"** and opens a real, working flow:

```text
Connect my Audible library
  -> user pastes/uploads their Audible library list, or picks titles by search
     (public catalog metadata: cover, author, narrator, runtime, chapters)
  -> each becomes a UniversalBookObject with timelineMode: "provider-companion"
  -> the SAME library renders in 2D grid, 3D bookshelf, and Quest WebXR
  -> select a title -> it becomes the current book
  -> user starts playback in Audible; our clock anchors to it
  -> transcript (user-supplied or public-domain) -> entities -> definitions ->
     sources -> images -> Knowledge HUD -> Ask the Book -> Knowledge Graph -> VR
```

This is the full product experience with one substitution: library ingestion is user-authorized rather than API-authorized, and the audio clock is anchored rather than read. When Audible ever ships an authorized API, the only change is a new `AudiobookProvider` implementation with `origin: "connected"` — the domain model, engines, HUD, graph, and XR layers already accept it unchanged.

### The precise missing capability Audible would have to ship

An OAuth 2.0 authorization server with three scopes: `library.read` (owned titles + chapters), `playback.position.read` (current position, ideally streamed), and optionally `playback.control`. With those three, this app works exactly as envisioned, with no other change to the architecture. Nothing less is sufficient; nothing more is required.

## Recommended next step

Build the "Connect my Audible library" flow described in section 7 as the primary entry point — Audible-branded, honest about what it does, and producing a real multi-title personal library that flows into 2D, 3D, and Quest WebXR. Then add chapter-anchor and tap-to-anchor sync. Treat microphone acoustic alignment as the follow-on that makes sync automatic.

Say the word and I will write the implementation plan for that flow.
