/**
 * Portfolio knowledge for the AI assistant — chunking + retrieval (RAG).
 *
 * CHUNKS are DERIVED from the existing data files (portfolio.ts, projects.ts, experience.ts, achievements.ts);
 * there is no second, hand-written biography. Only public fields are read; asset paths, colours and layout
 * settings are ignored. One chunk per skill group, per experience, per project, per achievement, per
 * "About" paragraph, per documented gap.
 *
 * RETRIEVAL (retrieve): the visitor's question is embedded with Gemini, compared by cosine similarity with
 * the pre-computed chunk embeddings in knowledge-embeddings.json, and only the TOP_K best chunks (plus a tiny
 * always-sent "portfolio map" so the model knows what exists) go into the prompt.
 *
 *   >>> Re-run `npm run build:knowledge` whenever you change the data files, then commit the JSON. <<<
 *
 * Safety net: if the embeddings file is missing/invalid, the embedding call fails, or a chunk changed since the
 * file was built, the assistant never errors — chunks with no valid embedding are always included, and with no
 * usable index at all it falls back to sending the whole portfolio (and logs a warning on the server).
 */
import { createHash } from "node:crypto";
import { achievements } from "@/data/achievements";
import { experiences } from "@/data/experience";
import { about, badge, contact, heroRoles, skills } from "@/data/portfolio";
import { projects } from "@/data/projects";
import { EMBED_DIMS, EMBED_MODEL, cosine, embedTexts } from "./embeddings";

/** How many of the best-matching chunks go into the prompt. Raise for broader answers, lower for tighter ones. */
export const TOP_K = 5;
/** Give up on the embedding call after this long and fall back to the full portfolio. */
const EMBED_TIMEOUT_MS = 8000;

export type KnowledgeKind =
  | "profile"
  | "skills"
  | "experience"
  | "project"
  | "achievement"
  | "contact"
  | "coverage"
  | "map";

export type KnowledgeDoc = {
  id: string;
  kind: KnowledgeKind;
  title: string;
  text: string;
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ── chunking ───────────────────────────────────────────────────────────── */

function profileChunks(): KnowledgeDoc[] {
  const name = badge.front.name === "BHAVNA J" ? "Bhavna Jayakumar" : badge.front.name;
  const out: KnowledgeDoc[] = [
    {
      id: "profile-identity",
      kind: "profile",
      title: "Who Bhavna is",
      text: [
        `Name: ${name} (shown on the site as "${badge.front.name}")`,
        `Headline: ${badge.front.title}`,
        `Roles she presents herself with: ${badge.back.roles.join(", ")}`,
        `Labels on the hero section: ${heroRoles.map((r) => r.text).join(", ")}`,
        `About-section headline: "${about.heading}"`,
      ].join("\n"),
    },
  ];
  about.paragraphs.forEach((p, i) =>
    out.push({ id: `profile-about-${i + 1}`, kind: "profile", title: `About Bhavna (part ${i + 1})`, text: `About: ${clean(p)}` })
  );
  if (about.facts.length) {
    out.push({
      id: "profile-facts",
      kind: "profile",
      title: "Quick facts",
      text: about.facts.map((f) => `${f.label}: ${clean(f.value)}`).join("\n"),
    });
  }
  return out;
}

function skillChunks(): KnowledgeDoc[] {
  return skills.groups.map((g) => ({
    id: `skills-${slug(g.title)}`,
    kind: "skills" as const,
    title: `Skills — ${g.title}`,
    text: `${g.title} skills listed in her portfolio: ${g.items.map((i) => i.name).join(", ")}.\nNote: these are skill names only — no proficiency levels, years of use, or whether each came from work, coursework or personal projects.`,
  }));
}

function experienceChunks(): KnowledgeDoc[] {
  return experiences
    .filter((e) => e.description) // skips the closing "And I'm just getting started" card
    .map((e, i) => ({
      id: `experience-${i + 1}-${slug(e.title)}`,
      kind: "experience" as const,
      title: `${e.title}${e.org ? ` — ${e.org}` : ""}`,
      text: [`Role: ${e.title}`, e.org && `Organisation: ${e.org}`, e.period && `Period (as listed): ${e.period}`, `What the portfolio says: ${clean(e.description ?? "")}`]
        .filter(Boolean)
        .join("\n"),
    }));
}

function projectChunks(): KnowledgeDoc[] {
  return projects.map((p) => {
    const lines = [
      `Project: ${p.title}`,
      `Category: ${p.category}`,
      p.role && `Described as: ${p.role}`,
      `Summary: ${clean(p.summary)}`,
      p.stack?.length && `Technologies listed: ${p.stack.join(", ")}`,
      p.repoUrl && `Source code: ${p.repoUrl}`,
      p.demoUrl && `Live demo: ${p.demoUrl}`,
      "Note: presented as her project; the portfolio does not say which parts she did personally versus teammates, and lists no usage numbers or measured results.",
    ];
    if (p.caseStudy) {
      for (const [k, v] of Object.entries(p.caseStudy)) if (typeof v === "string" && v) lines.push(`Case study — ${k}: ${clean(v)}`);
    }
    return { id: `project-${p.slug}`, kind: "project" as const, title: p.title, text: lines.filter(Boolean).join("\n") };
  });
}

function achievementChunks(): KnowledgeDoc[] {
  // The achievements section is an image flipbook; the data file holds each page's caption only.
  return achievements.pages
    .filter((_, i, all) => i > 0 && i < all.length - 1) // drop front/back cover
    .map((p, i) => ({
      id: `achievement-${i + 1}`,
      kind: "achievement" as const,
      title: clean(p.alt),
      text: `Achievement / leadership entry (from her "${achievements.heading}" book): ${clean(p.alt)}.\nNote: only this title is available — the details are inside a page image the assistant cannot read.`,
    }));
}

function contactChunk(): KnowledgeDoc {
  const lines = [
    contact.email && `Email: ${contact.email}`,
    contact.linkedin && `LinkedIn: ${contact.linkedin}`,
    contact.behance && `Behance (design work): ${contact.behance}`,
    "A downloadable resume is available in the Contact section of the site.",
  ];
  return { id: "contact", kind: "contact", title: "Public links and how to contact her", text: lines.filter(Boolean).join("\n") };
}

/** What the portfolio does NOT cover, split by topic so the right gap is retrieved for the right question. */
function coverageChunks(): KnowledgeDoc[] {
  const gap = (id: string, title: string, text: string): KnowledgeDoc => ({ id: `coverage-${id}`, kind: "coverage", title, text });
  return [
    gap("personal", "Not documented: hobbies and personal life", "The portfolio does not document hobbies, interests outside work, personality traits, or personal life. There is no hobbies section."),
    gap("education", "Not documented: education details", "Education details such as grades, graduation dates and coursework are not in the portfolio data. Only her field (Computer Science — AI & ML) is stated."),
    gap("credentials", "Not documented: certifications and publications", "The portfolio does not list certifications, publications or courses."),
    gap("logistics", "Not documented: availability, salary, location, phone", "The portfolio does not document salary expectations, availability, location preferences or a phone number."),
    gap(
      "depth",
      "Not documented: skill depth, results, contributions, resume contents",
      "The portfolio does not document proficiency levels or years of experience for any skill; measured outcomes of projects (users, accuracy, revenue, performance); the exact split between Bhavna's own contribution and teammates'; the contents of the resume PDF (the assistant cannot read it); or any technology not named elsewhere in this knowledge."
    ),
  ];
}

/**
 * A compact index of EVERYTHING the portfolio contains. It is always sent with the retrieved chunks, so the
 * model can tell "exists but wasn't retrieved" apart from "genuinely not documented".
 */
function mapChunk(): KnowledgeDoc {
  const allSkills = skills.groups.flatMap((g) => g.items.map((i) => i.name));
  return {
    id: "portfolio-map",
    kind: "map",
    title: "Portfolio map (index of everything documented)",
    text: [
      "Sections of the portfolio: About, Skills, Experience, Projects, Achievements, Contact. There is no hobbies, education-details or certifications section.",
      `Skill groups: ${skills.groups.map((g) => g.title).join("; ")}.`,
      `All listed skills: ${allSkills.join(", ")}.`,
      `Experience / roles: ${experiences.filter((e) => e.description).map((e) => `${e.title}${e.org ? ` (${e.org})` : ""}`).join("; ")}.`,
      `Projects (${projects.length}): ${projects.map((p) => p.title).join(", ")}.`,
      `Achievements: ${achievements.pages.slice(1, -1).map((p) => clean(p.alt)).join("; ")}.`,
    ].join("\n"),
  };
}

let chunkCache: KnowledgeDoc[] | null = null;

/** Every chunk (including the pinned map), built once from the data files. */
export function buildChunks(): KnowledgeDoc[] {
  if (!chunkCache) {
    chunkCache = [
      ...profileChunks(),
      ...skillChunks(),
      ...experienceChunks(),
      ...projectChunks(),
      ...achievementChunks(),
      contactChunk(),
      ...coverageChunks(),
      mapChunk(),
    ];
  }
  return chunkCache;
}

/** Kept for existing imports: the whole knowledge base. */
export const buildKnowledge = buildChunks;

/** The text that is actually embedded for a chunk (title helps short chunks match questions). */
export const embeddingText = (d: KnowledgeDoc) => `${d.title}\n${d.text}`;

/** Fingerprint of a chunk's embedded text — lets retrieval notice chunks edited since the embeddings were built. */
export const chunkHash = (d: KnowledgeDoc) => createHash("sha1").update(embeddingText(d)).digest("hex").slice(0, 12);

/* ── embeddings index (built by `npm run build:knowledge`) ──────────────── */

type IndexFile = { model?: string; dimensions?: number; chunks?: { id: string; hash: string; embedding: number[] }[] };
type Index = Map<string, { hash: string; embedding: number[] }>;

let index: Index | null | undefined; // undefined = not tried yet, null = unavailable
let warnedStale = false;

function loadIndex(): Index | null {
  if (index !== undefined) return index;
  try {
    // A `require` inside try/catch keeps the build working even if the file is deleted (webpack treats it as optional).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const file = require("./knowledge-embeddings.json") as IndexFile;
    if (file.model !== EMBED_MODEL || file.dimensions !== EMBED_DIMS || !Array.isArray(file.chunks) || file.chunks.length === 0) {
      throw new Error("embeddings file is empty or built with a different model/size — run `npm run build:knowledge`");
    }
    index = new Map(file.chunks.filter((c) => c.embedding?.length === EMBED_DIMS).map((c) => [c.id, { hash: c.hash, embedding: c.embedding }]));
    if (index.size === 0) throw new Error("no usable vectors in the embeddings file");
  } catch (err) {
    console.warn(`[rag] embeddings unavailable, sending the whole portfolio instead: ${(err as Error).message}`);
    index = null;
  }
  return index;
}

/* ── retrieval ──────────────────────────────────────────────────────────── */

export type RetrievalInfo = { mode: "retrieval" | "fallback"; ids: string[]; chunks: number; chars: number };

/** The question to embed. A short follow-up ("tell me more") borrows the previous question for context. */
function queryText(question: string, history: { role: "user" | "assistant"; text: string }[]): string {
  const lastUser = [...history].reverse().find((t) => t.role === "user")?.text;
  return lastUser && question.length < 60 ? `${lastUser.slice(0, 300)}\n${question}` : question;
}

/**
 * Pick the evidence to hand to the model for a question:
 *   the pinned portfolio map  +  the TOP_K most similar chunks  +  any chunk not covered by the embeddings file.
 * Falls back to the whole portfolio if retrieval cannot run. Never throws.
 */
export async function retrieveWithInfo(
  question: string,
  history: { role: "user" | "assistant"; text: string }[] = []
): Promise<{ docs: KnowledgeDoc[]; info: RetrievalInfo }> {
  const all = buildChunks();
  const done = (docs: KnowledgeDoc[], mode: RetrievalInfo["mode"]) => ({
    docs,
    info: { mode, ids: docs.map((d) => d.id), chunks: docs.length, chars: docs.reduce((n, d) => n + d.text.length, 0) },
  });

  const idx = loadIndex();
  if (!idx) return done(all, "fallback");

  const pinned = all.filter((d) => d.kind === "map");
  const rankable = all.filter((d) => d.kind !== "map");
  const indexed: { doc: KnowledgeDoc; embedding: number[] }[] = [];
  const unindexed: KnowledgeDoc[] = [];
  for (const d of rankable) {
    const e = idx.get(d.id);
    if (e && e.hash === chunkHash(d)) indexed.push({ doc: d, embedding: e.embedding });
    else unindexed.push(d); // new or edited since the last `npm run build:knowledge`
  }
  if (unindexed.length && !warnedStale) {
    warnedStale = true;
    console.warn(`[rag] ${unindexed.length} chunk(s) changed since the embeddings were built — including them every time. Run \`npm run build:knowledge\`.`);
  }
  if (indexed.length === 0) return done(all, "fallback");

  try {
    const [q] = await embedTexts([queryText(question, history)], "RETRIEVAL_QUERY", { signal: AbortSignal.timeout(EMBED_TIMEOUT_MS) });
    const top = indexed
      .map((c) => ({ doc: c.doc, score: cosine(q, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map((s) => s.doc);
    return done([...pinned, ...top, ...unindexed], "retrieval");
  } catch {
    console.warn("[rag] could not embed the question, sending the whole portfolio instead");
    return done(all, "fallback");
  }
}

/** Evidence for the prompt (see retrieveWithInfo for the details). */
export async function retrieve(question: string, history: { role: "user" | "assistant"; text: string }[] = []): Promise<KnowledgeDoc[]> {
  return (await retrieveWithInfo(question, history)).docs;
}

/** Render documents as a delimited block the model is told to treat as data, never as instructions. */
export function formatContext(docs: KnowledgeDoc[]): string {
  return docs.map((d) => `### [${d.kind}] ${d.title}\n${d.text}`).join("\n\n");
}
