import type { BookMetadata } from "@/domain/types";

/** Catalog-only entries: metadata exists, full spatial experience does not yet. */
export const catalogOnlyBooks: BookMetadata[] = [
  {
    id: "allegory-of-the-cave",
    title: "The Allegory of the Cave",
    subtitle: "Republic, Book VII",
    author: "Plato",
    year: -375,
    description:
      "Prisoners mistake shadows for reality until one is dragged into the light. The founding text on perception, education and the limits of the senses.",
    coverAccent: "amber",
    themes: ["Philosophy"],
    license: "Public domain (Jowett translation)",
    externalLinks: { audibleUrl: "https://www.audible.com/search?keywords=Plato+Republic" },
    durationSeconds: 1620,
  },
  {
    id: "origin-of-species",
    title: "On the Origin of Species",
    subtitle: "Chapter IV: Natural Selection",
    author: "Charles Darwin",
    year: 1859,
    description:
      "Darwin's account of variation, inheritance and selection — the chapter where the mechanism is finally stated in full.",
    coverAccent: "emerald",
    themes: ["Science"],
    license: "Public domain (1859)",
    externalLinks: { audibleUrl: "https://www.audible.com/search?keywords=Origin+of+Species" },
    durationSeconds: 4980,
  },
  {
    id: "field-notes-on-machine-minds",
    title: "Field Notes on Machine Minds",
    subtitle: "Unlinked archival lecture series",
    author: "Anonymous",
    year: 1978,
    description:
      "An archival lecture series held in this library's index with no distributor listing. Included to demonstrate the unavailable-link state.",
    coverAccent: "slate",
    themes: ["Artificial Intelligence", "Philosophy"],
    license: "Archival — rights unclear",
    externalLinks: { audibleUrl: null },
    durationSeconds: 2400,
  },
];
