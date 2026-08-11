import type { UniversalBookObject } from "./types";

/**
 * Demo audiobook content.
 * Source text is adapted from Ada Lovelace's 1843 "Notes by the Translator" on
 * L. F. Menabrea's Sketch of the Analytical Engine — public domain.
 */

const CH1 = "ch-1";
const CH2 = "ch-2";

const seg = (
  id: string,
  chapterId: string,
  startSeconds: number,
  endSeconds: number,
  text: string,
  entityIds: string[] = [],
) => ({ id, chapterId, startSeconds, endSeconds, text, entityIds });

export const demoBook: UniversalBookObject = {
  metadata: {
    id: "notes-on-the-analytical-engine",
    title: "Notes on the Analytical Engine",
    subtitle: "Ada Lovelace's commentary on the first general-purpose machine",
    author: "Ada Lovelace",
    narrator: "Demo narration",
    year: 1843,
    publisher: "Taylor's Scientific Memoirs",
    description:
      "In her notes on Menabrea's memoir, Ada Lovelace describes a machine that weaves algebraic patterns as the Jacquard loom weaves flowers, and sketches the first published algorithm.",
    coverAccent: "cyan",
    themes: ["Artificial Intelligence", "Science"],
    license: "Public domain (source text, 1843)",
    externalLinks: {
      audibleUrl: "https://www.audible.com/search?keywords=Ada+Lovelace",
      sourceUrl: "https://en.wikisource.org/wiki/Scientific_Memoirs/3/Sketch_of_the_Analytical_Engine",
    },
    durationSeconds: 168,
  },
  audio: {
    src: null,
    durationSeconds: 168,
    attribution: "Narrated in-browser from public-domain text (no third-party audio).",
  },
  chapters: [
    {
      id: CH1,
      index: 0,
      title: "A Machine That Weaves Algebra",
      summary:
        "Lovelace contrasts the Difference Engine with the Analytical Engine and introduces the Jacquard loom analogy.",
      startSeconds: 0,
      endSeconds: 92,
    },
    {
      id: CH2,
      index: 1,
      title: "Beyond Numbers",
      summary:
        "Operations on symbols, the first published algorithm, and the limits of what a machine can originate.",
      startSeconds: 92,
      endSeconds: 168,
    },
  ],
  transcript: [
    seg("s1", CH1, 0, 8, "The Analytical Engine is not, in any sense, merely a calculating machine.", ["analytical-engine"]),
    seg("s2", CH1, 8, 17, "Its province is to assist us in making available what we are already acquainted with.", []),
    seg("s3", CH1, 17, 27, "Charles Babbage first conceived the Difference Engine, a device for producing mathematical tables by the method of finite differences.", ["babbage", "difference-engine"]),
    seg("s4", CH1, 27, 37, "But the Analytical Engine is of an entirely different order: it is a general machine, whose operations are directed by cards.", ["analytical-engine"]),
    seg("s5", CH1, 37, 48, "We may say most aptly that the Analytical Engine weaves algebraic patterns, just as the Jacquard loom weaves flowers and leaves.", ["analytical-engine", "jacquard-loom"]),
    seg("s6", CH1, 48, 58, "The cards are the medium of instruction. One set directs the operations, another the variables upon which those operations act.", ["punched-card"]),
    seg("s7", CH1, 58, 69, "In this separation lies the germ of what a later age would call an algorithm, and of the stored program itself.", ["algorithm"]),
    seg("s8", CH1, 69, 80, "Luigi Menabrea, an Italian engineer, described the engine after Babbage lectured upon it in Turin.", ["menabrea", "babbage", "turin"]),
    seg("s9", CH1, 80, 92, "I translated his memoir, and appended notes of my own that grew to three times the length of the original.", ["lovelace"]),
    seg("s10", CH2, 92, 103, "Supposing, for instance, that the fundamental relations of pitched sounds were susceptible of expression and adaptation.", ["symbolic-computation"]),
    seg("s11", CH2, 103, 114, "The engine might compose elaborate and scientific pieces of music of any degree of complexity or extent.", ["symbolic-computation"]),
    seg("s12", CH2, 114, 125, "For the engine operates upon symbols, and number is but one of the many things a symbol may stand for.", ["symbolic-computation", "algorithm"]),
    seg("s13", CH2, 125, 137, "In Note G, I set down the sequence of operations by which the engine would compute the Bernoulli numbers.", ["bernoulli-numbers", "note-g"]),
    seg("s14", CH2, 137, 149, "It is, so far as is known, the first algorithm published for a machine to execute.", ["algorithm", "note-g"]),
    seg("s15", CH2, 149, 159, "The Analytical Engine has no pretensions whatever to originate anything.", ["analytical-engine", "lovelace-objection"]),
    seg("s16", CH2, 159, 168, "It can do whatever we know how to order it to perform. Its province is to assist us in making available what we already know.", ["lovelace-objection"]),
  ],
  entities: [
    {
      id: "analytical-engine",
      name: "Analytical Engine",
      type: "thing",
      definition: {
        short: "Babbage's proposed general-purpose mechanical computer, programmed with punched cards.",
        long: "Designed from 1837 onward, the Analytical Engine separated a 'mill' (processor) from a 'store' (memory) and read its instructions from punched cards. It was never completed, but its architecture anticipates the general-purpose computer by a century.",
        source: "Lovelace, Notes on Menabrea's Sketch (1843)",
      },
      whyItMatters: {
        [CH1]: "This is the object of the whole memoir — everything Lovelace claims about programmability rests on the engine being general rather than special-purpose.",
        [CH2]: "The claim that it cannot originate anything is a claim about this specific machine, and became the first framing of the AI debate.",
      },
      relatedConceptIds: ["algorithm", "punched-card", "difference-engine"],
      firstMentionSeconds: 0,
      salience: 1,
      deepDiveUrl: "https://en.wikipedia.org/wiki/Analytical_Engine",
    },
    {
      id: "babbage",
      name: "Charles Babbage",
      type: "person",
      definition: {
        short: "English mathematician and inventor (1791–1871), designer of the Difference and Analytical Engines.",
        long: "Lucasian Professor of Mathematics at Cambridge, Babbage spent decades designing calculating engines that were never built in his lifetime. His 1840 Turin lectures produced the only contemporary published description of the Analytical Engine.",
        source: "Scientific Memoirs, Vol. 3",
      },
      whyItMatters: {
        [CH1]: "Babbage's earlier Difference Engine is the contrast Lovelace needs: it computes one thing; his later engine computes anything you can specify.",
      },
      relatedConceptIds: ["analytical-engine", "difference-engine"],
      firstMentionSeconds: 17,
      salience: 0.9,
      deepDiveUrl: "https://en.wikipedia.org/wiki/Charles_Babbage",
    },
    {
      id: "difference-engine",
      name: "Difference Engine",
      type: "thing",
      definition: {
        short: "A special-purpose mechanical calculator for tabulating polynomial functions by finite differences.",
        long: "The Difference Engine automated the production of navigational and logarithmic tables. It could only perform one fixed procedure — the reason Lovelace insists the Analytical Engine belongs to a different order of machine.",
        source: "Lovelace, Note A",
      },
      whyItMatters: {
        [CH1]: "Hearing this here tells you what 'general purpose' meant in 1843: the difference between a machine with one procedure and a machine with any procedure.",
      },
      relatedConceptIds: ["analytical-engine", "babbage"],
      firstMentionSeconds: 17,
      salience: 0.7,
    },
    {
      id: "jacquard-loom",
      name: "Jacquard Loom",
      type: "thing",
      definition: {
        short: "A punched-card-controlled weaving loom invented by Joseph-Marie Jacquard around 1804.",
        long: "The loom read chains of punched cards to select warp threads, letting a single machine weave arbitrary patterns. Babbage adopted the card mechanism directly; Lovelace turned it into the memoir's central metaphor.",
        source: "Lovelace, Note A",
      },
      whyItMatters: {
        [CH1]: "This is the most quoted line in the notes. The loom is the proof that a machine can be told what to make rather than built to make one thing.",
      },
      relatedConceptIds: ["punched-card", "analytical-engine"],
      firstMentionSeconds: 37,
      salience: 0.95,
      deepDiveUrl: "https://en.wikipedia.org/wiki/Jacquard_machine",
    },
    {
      id: "punched-card",
      name: "Punched Card",
      type: "thing",
      definition: {
        short: "A stiff card encoding instructions or data as patterns of holes.",
        long: "Lovelace distinguishes operation cards from variable cards — an early separation of instruction from operand that survives in modern instruction-set design.",
        source: "Lovelace, Note C",
      },
      whyItMatters: {
        [CH1]: "The split between operation cards and variable cards is the moment programming becomes a thing you write rather than a machine you build.",
      },
      relatedConceptIds: ["algorithm", "jacquard-loom"],
      firstMentionSeconds: 48,
      salience: 0.8,
    },
    {
      id: "menabrea",
      name: "Luigi Federico Menabrea",
      type: "person",
      definition: {
        short: "Italian engineer, general and later prime minister (1809–1896) who wrote the Sketch of the Analytical Engine.",
        long: "Menabrea attended Babbage's 1840 Turin lectures and published the resulting French-language memoir in 1842. Lovelace's translation and notes made it famous.",
        source: "Bibliothèque Universelle de Genève, 1842",
      },
      whyItMatters: {
        [CH1]: "Everything you're hearing exists because Menabrea took lecture notes — Babbage never published a full description himself.",
      },
      relatedConceptIds: ["turin", "lovelace"],
      firstMentionSeconds: 69,
      salience: 0.6,
    },
    {
      id: "turin",
      name: "Turin",
      type: "place",
      definition: {
        short: "Capital of Piedmont, where Babbage lectured on the Analytical Engine in 1840.",
        long: "The Turin lectures were the only occasion on which Babbage presented the engine's design to an audience of mathematicians, producing the memoir Lovelace later translated.",
        source: "Scientific Memoirs, Vol. 3",
      },
      whyItMatters: {
        [CH1]: "A geographic detail with consequences: had Babbage not travelled to Turin, no contemporary account of the engine would survive.",
      },
      relatedConceptIds: ["menabrea"],
      firstMentionSeconds: 69,
      salience: 0.4,
    },
    {
      id: "lovelace",
      name: "Ada Lovelace",
      type: "person",
      definition: {
        short: "English mathematician (1815–1852), author of the Notes and of the first published algorithm.",
        long: "Augusta Ada King, Countess of Lovelace, translated Menabrea's memoir and appended seven notes, A through G, that are three times longer than the original text.",
        source: "Taylor's Scientific Memoirs (1843)",
      },
      whyItMatters: {
        [CH1]: "The narrator is the author: the notes you're hearing are her commentary, not Menabrea's description.",
        [CH2]: "Her speculation about music is the earliest recorded claim that computation is not limited to numbers.",
      },
      relatedConceptIds: ["note-g", "algorithm"],
      firstMentionSeconds: 80,
      salience: 0.95,
      deepDiveUrl: "https://en.wikipedia.org/wiki/Ada_Lovelace",
    },
    {
      id: "note-g",
      name: "Note G",
      type: "thing",
      definition: {
        short: "The final and longest of Lovelace's notes, containing the Bernoulli-number program.",
        long: "Note G lays out a table of operations, variables and results — a program in all but name — and also contains the famous objection that the engine cannot originate anything.",
        source: "Lovelace, Note G",
      },
      whyItMatters: {
        [CH2]: "This is where the abstract argument becomes concrete: a step-by-step procedure written for a machine that did not exist.",
      },
      relatedConceptIds: ["bernoulli-numbers", "algorithm", "lovelace-objection"],
      firstMentionSeconds: 125,
      salience: 0.9,
    },
    {
      id: "bernoulli-numbers",
      name: "Bernoulli Numbers",
      type: "concept",
      definition: {
        short: "A sequence of rational numbers appearing in expansions of trigonometric and exponential functions.",
        long: "Computing them requires a recursive procedure — each value depends on earlier ones — which is exactly why Lovelace chose them to demonstrate looping and reuse of results.",
        source: "Lovelace, Note G",
      },
      whyItMatters: {
        [CH2]: "The choice is deliberate: a recursive sequence forces the engine to loop and reuse stored results, showing off real programmability.",
      },
      relatedConceptIds: ["note-g", "algorithm"],
      firstMentionSeconds: 125,
      salience: 0.75,
    },
  ],
  concepts: [
    {
      id: "algorithm",
      name: "Algorithm",
      type: "concept",
      definition: {
        short: "A finite, ordered procedure that transforms inputs into outputs.",
        long: "In 1843 the word was not yet used in this sense, but Lovelace's tables of operations satisfy the definition exactly: determinate steps, a defined order, and repetition of groups of steps.",
        source: "Lovelace, Notes C and G",
      },
      whyItMatters: {
        [CH1]: "Right here is the conceptual hinge of the book: instructions become an object separate from the machine that runs them.",
        [CH2]: "The Bernoulli sequence is the worked example that makes the abstract idea checkable.",
      },
      relatedConceptIds: ["note-g", "punched-card", "symbolic-computation"],
      firstMentionSeconds: 58,
      salience: 1,
    },
    {
      id: "symbolic-computation",
      name: "Symbolic Computation",
      type: "concept",
      definition: {
        short: "Computation over symbols that may stand for anything, not only over quantities.",
        long: "Lovelace's insight that the engine could compose music if musical relations were expressible is the first statement that computers are general symbol manipulators.",
        source: "Lovelace, Note A",
      },
      whyItMatters: {
        [CH2]: "This is the sentence that separates 'calculator' from 'computer' — and the reason this text is read as a founding document of AI.",
      },
      relatedConceptIds: ["algorithm", "analytical-engine"],
      firstMentionSeconds: 92,
      salience: 0.95,
    },
    {
      id: "lovelace-objection",
      name: "The Lovelace Objection",
      type: "concept",
      definition: {
        short: "The claim that a machine can only do what we know how to order it to perform.",
        long: "Alan Turing named and answered this argument in 1950 as 'Lady Lovelace's Objection', making it the oldest continuously debated question in artificial intelligence.",
        source: "Lovelace Note G; Turing, Computing Machinery and Intelligence (1950)",
      },
      whyItMatters: {
        [CH2]: "You are listening to the origin of the machine-creativity debate, stated a century before the first electronic computer ran.",
      },
      relatedConceptIds: ["symbolic-computation", "note-g"],
      firstMentionSeconds: 149,
      salience: 1,
      deepDiveUrl: "https://en.wikipedia.org/wiki/Lovelace_objection",
    },
  ],
  definitions: {},
  events: [
    { id: "e1", label: "Jacquard loom analogy", atSeconds: 37, chapterId: CH1, entityIds: ["jacquard-loom"] },
    { id: "e2", label: "Chapter 2 begins: Beyond Numbers", atSeconds: 92, chapterId: CH2, entityIds: ["symbolic-computation"] },
    { id: "e3", label: "First published algorithm", atSeconds: 137, chapterId: CH2, entityIds: ["note-g", "algorithm"] },
    { id: "e4", label: "The Lovelace Objection", atSeconds: 149, chapterId: CH2, entityIds: ["lovelace-objection"] },
  ],
  questions: [
    {
      id: "q1",
      question: "Why does the loom comparison matter?",
      answer:
        "Because the Jacquard loom already proved that one machine could produce unlimited patterns when its instructions were supplied on cards. Lovelace borrows that proof and applies it to algebra: the Analytical Engine is general for the same reason the loom is, and the cards are what make it so.",
      entityIds: ["jacquard-loom", "analytical-engine", "punched-card"],
      chapterId: CH1,
    },
    {
      id: "q2",
      question: "What is the difference between the two engines?",
      answer:
        "The Difference Engine performs one fixed procedure — tabulating polynomials by finite differences. The Analytical Engine takes its procedure from punched cards, so the same hardware can carry out any procedure you can express. That is the whole distinction between a calculator and a computer.",
      entityIds: ["difference-engine", "analytical-engine", "babbage"],
      chapterId: CH1,
    },
    {
      id: "q3",
      question: "Why are Bernoulli numbers used in the example?",
      answer:
        "They are defined recursively, so computing them requires looping and reusing previously stored results. That makes them the ideal demonstration that the engine could do more than evaluate a formula once — it could run a program.",
      entityIds: ["bernoulli-numbers", "note-g", "algorithm"],
      chapterId: CH2,
    },
    {
      id: "q4",
      question: "How does this connect to modern AI?",
      answer:
        "Two threads. First, symbolic computation: Lovelace says number is only one thing a symbol can stand for, which is the premise of every non-numeric computation since. Second, the Lovelace Objection — that the engine originates nothing — which Turing named and answered in 1950 and which is still the shape of the machine-creativity argument today.",
      entityIds: ["symbolic-computation", "lovelace-objection"],
      chapterId: "any",
    },
  ],
  knowledgeGraph: {
    nodes: [
      { id: "n-engine", label: "Analytical Engine", type: "thing", entityId: "analytical-engine" },
      { id: "n-babbage", label: "Charles Babbage", type: "person", entityId: "babbage" },
      { id: "n-diff", label: "Difference Engine", type: "thing", entityId: "difference-engine" },
      { id: "n-loom", label: "Jacquard Loom", type: "thing", entityId: "jacquard-loom" },
      { id: "n-card", label: "Punched Card", type: "thing", entityId: "punched-card" },
      { id: "n-menabrea", label: "Menabrea", type: "person", entityId: "menabrea" },
      { id: "n-turin", label: "Turin", type: "place", entityId: "turin" },
      { id: "n-lovelace", label: "Ada Lovelace", type: "person", entityId: "lovelace" },
      { id: "n-noteg", label: "Note G", type: "thing", entityId: "note-g" },
      { id: "n-bernoulli", label: "Bernoulli Numbers", type: "concept", entityId: "bernoulli-numbers" },
      { id: "n-algorithm", label: "Algorithm", type: "concept", entityId: "algorithm" },
      { id: "n-symbolic", label: "Symbolic Computation", type: "concept", entityId: "symbolic-computation" },
      { id: "n-objection", label: "Lovelace Objection", type: "concept", entityId: "lovelace-objection" },
    ],
    edges: [
      { id: "g1", source: "n-babbage", target: "n-engine", relation: "designed" },
      { id: "g2", source: "n-babbage", target: "n-diff", relation: "designed earlier" },
      { id: "g3", source: "n-engine", target: "n-diff", relation: "generalizes" },
      { id: "g4", source: "n-loom", target: "n-card", relation: "introduced" },
      { id: "g5", source: "n-engine", target: "n-card", relation: "programmed by" },
      { id: "g6", source: "n-menabrea", target: "n-engine", relation: "described" },
      { id: "g7", source: "n-menabrea", target: "n-turin", relation: "attended lectures in" },
      { id: "g8", source: "n-lovelace", target: "n-menabrea", relation: "translated" },
      { id: "g9", source: "n-lovelace", target: "n-noteg", relation: "wrote" },
      { id: "g10", source: "n-noteg", target: "n-bernoulli", relation: "computes" },
      { id: "g11", source: "n-noteg", target: "n-algorithm", relation: "first instance of" },
      { id: "g12", source: "n-card", target: "n-algorithm", relation: "encodes" },
      { id: "g13", source: "n-engine", target: "n-symbolic", relation: "enables" },
      { id: "g14", source: "n-lovelace", target: "n-objection", relation: "stated" },
      { id: "g15", source: "n-symbolic", target: "n-objection", relation: "in tension with" },
      { id: "g16", source: "n-lovelace", target: "n-symbolic", relation: "proposed" },
    ],
  },
};

demoBook.definitions = Object.fromEntries(
  [...demoBook.entities, ...demoBook.concepts].map((e) => [e.id, e.definition]),
);
