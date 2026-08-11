# Aura Learn

Create a production-quality React/TypeScript web application called "Spatial Audio Library & Knowledge HUD". The application is a spatial-computing audiobook learning platform that transforms conventional audiobook listening into an interactive visual and spatial learning experience.



### 1. CORE ARCHITECTURE & PROVIDER-AGNOSTIC DATA MODEL



A. UNIVERSAL BOOK OBJECT

- Implement a standardized internal data model for books (`UniversalBookObject`) as a real TypeScript data structure and use it throughout the application.

- The schema must structurally decouple: Metadata, Audio, Transcript, Chapters, Entities (People, Places, Organizations, Things), Concepts, Definitions, Events, Questions, Knowledge Graph, and User Learning History.

- Create an `AudiobookProvider` interface with a working `DemoAudiobookProvider` pre-loaded with sample demo texts/audio.

- Ensure future content sources can plug directly into the underlying system without changing the front-end or UI components.



B. SEPARATION OF CONCERNS

- Decouple the following modules cleanly in the codebase:

  - Data models

  - Provider services

  - Audio engine

  - Transcript engine

  - Entity extraction & attention management (Level 1, Level 2, Level 3 priority scoring)

  - Knowledge retrieval & AI reasoning ("Ask the Book" conversational engine)

  - UI components

  - 3D/XR components (React Three Fiber / Three.js)



C. COMPANION ECOSYSTEM ("OPEN IN AUDIBLE")

- Do NOT implement unauthorized screen scraping, credential collection, or DRM bypassing.

- In the Library UI, provide clear, distinct action buttons for every book:

  - ▶ Listen (In-app demo player)

  - ◎ Open in Audible (Directs externally to Audible.com or displays as unavailable if no valid link exists)

  - 🥽 Enter VR (Switches to WebXR immersive space)

  - 📖 Read (Spoken text sync view)



---



### 2. CORE USER EXPERIENCE & NAVIGATION



A. MAIN NAVIGATION

- My Library: Interactive collection grid with sorting, search, filtering, and thematic stacks (Artificial Intelligence, Philosophy, Science).

- Virtual Library: WebXR-ready 3D environment featuring virtual bookshelves and a central Reading Dock.

- Active Reader: The core listening experience with real-time text highlighting and Knowledge HUD.

- Knowledge Graph: Interactive visual network showing relationships between concepts, authors, and entities.



B. THE "MAGIC DEMO" HERO EXPERIENCE

- Include an immediate "START DEMO" mode and a clearly visible "RESET DEMO" control so the entire experience can be demonstrated repeatedly.

- The minimum working path must be: Start Demo → Select Book → Play → Follow Transcript → Select Entity → View Knowledge → Ask the Book → Explore Knowledge Graph.



---



### 3. FUNCTIONAL PROTOTYPE REQUIREMENTS (MUST WORK IN BROWSER)



A. DEMO AUDIOBOOK

- Provide at least one complete demo audiobook experience using appropriately licensed or public-domain audio and text.

- Must contain: audio, synchronized transcript, chapters, timestamped text segments, predefined entities, definitions, contextual explanations, and entity relationships.

- The demo audiobook should be long enough to demonstrate chapter transitions and multiple knowledge entities, but the initial demo should begin at a curated 60–90 second section that showcases the complete experience immediately.



B. AUDIO / TEXT SYNCHRONIZATION

- The audio player and transcript must share a common timestamp model.

- When audio reaches a timestamp: automatically identify the corresponding transcript segment, highlight currently spoken text, auto-scroll the transcript, update the current chapter, and update Knowledge HUD context. Scrubbing updates transcript position.



C. KNOWLEDGE HUD

- When an important entity is reached, display a subtle visual indicator.

- Selecting it opens a contextual card containing: entity name, entity type, concise definition, "Why this matters here", source, related concepts, and deep-dive options.

- The card remains independent of audio controls so listening continues uninterrupted.



D. ASK THE BOOK

- Implement a working conversational interface using the available backend/AI architecture.

- Receives contextual information (book title, author, chapter, timestamp, transcript, selected entity, graph relationships).

- If live AI/API credentials are unavailable, implement using a deterministic contextual demo engine.



E. KNOWLEDGE GRAPH

- Functional interactive graph using demo book's predefined relationships.

- Users can zoom, pan, select nodes, inspect relationships, open Knowledge HUD info, and return to book context.



F. VR / WEBXR & MOBILE FALLBACK

- Build the 3D environment as a real React Three Fiber scene.

- Gracefully fall back to normal 2D reader when WebXR is unavailable. The core experience must remain fully usable without a VR headset.



G. TECHNICAL QUALITY

- Use modular TypeScript components and services. Use realistic loading, empty, error, and unsupported-device states. Never display fake connected states.



---



### 4. PRODUCT PRINCIPLE & PRIORITY HIERARCHY

Don't make the user stop learning in order to look something up. The experience should allow continuous audiobook listening while the application provides contextual information around the listener.



FIRST-BUILD PRIORITY: Do not sacrifice the working 60–90 second Active Reader experience for additional features. If implementation tradeoffs are necessary, prioritize in this order: (1) audio/transcript synchronization, (2) Knowledge HUD interaction, (3) Ask the Book contextual experience, (4) Knowledge Graph, (5) 3D Virtual Library, (6) WebXR. All navigation and UI should remain functional, but the first five minutes of the user experience must be polished and demonstrable.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://spatial-learn-hud.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3e8cf7c4-71d9-4abc-8d13-b9b48892c915).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
