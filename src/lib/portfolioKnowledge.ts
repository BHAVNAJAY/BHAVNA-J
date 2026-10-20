/**
 * Portfolio knowledge for the AI assistant.
 *
 * Everything here is DERIVED from the existing data files (portfolio.ts, projects.ts,
 * experience.ts, achievements.ts) — there is no second, hand-written biography to keep in sync.
 * Only fields meant for public visitors are read; asset paths, colours and layout settings are ignored.
 *
 * v1 returns the whole portfolio as context (it is small). `retrieve()` is the single seam a later
 * RAG version replaces: chunk → embed → semantic search → return only the relevant documents.
 */
import { achievements } from "@/data/achievements";
import { experiences } from "@/data/experience";
import { about, badge, contact, heroRoles, skills } from "@/data/portfolio";
import { projects } from "@/data/projects";

export type KnowledgeKind = "profile" | "skills" | "experience" | "project" | "achievement" | "contact" | "coverage";

export type KnowledgeDoc = {
  id: string;
  kind: KnowledgeKind;
  title: string;
  text: string;
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function profileDoc(): KnowledgeDoc {
  const lines = [
    `Name: Bhavna Jayakumar (shown on the site as "${badge.front.name}")`,
    `Headline: ${badge.front.title}`,
    `Roles she presents herself with: ${badge.back.roles.join(", ")}`,
    `Labels on the hero section: ${heroRoles.map((r) => r.text).join(", ")}`,
    `About-section headline: "${about.heading}"`,
    ...about.paragraphs.map((p) => `About: ${clean(p)}`),
    ...about.facts.map((f) => `${f.label}: ${clean(f.value)}`),
  ];
  return { id: "profile", kind: "profile", title: "Profile and About", text: lines.join("\n") };
}

function skillsDoc(): KnowledgeDoc {
  const lines = skills.groups.map((g) => `${g.title}: ${g.items.map((i) => i.name).join(", ")}`);
  lines.push(
    "Note: these are skill names only. The portfolio does not state proficiency levels, years of use, or which skills came from work vs coursework vs personal projects."
  );
  return { id: "skills", kind: "skills", title: "Skills and toolkit", text: lines.join("\n") };
}

function experienceDocs(): KnowledgeDoc[] {
  return experiences
    .filter((e) => e.description) // skips the closing "And I'm just getting started" card
    .map((e, i) => ({
      id: `experience-${i + 1}`,
      kind: "experience" as const,
      title: `${e.title}${e.org ? ` — ${e.org}` : ""}`,
      text: [
        `Role: ${e.title}`,
        e.org && `Organisation: ${e.org}`,
        e.period && `Period (as listed): ${e.period}`,
        `What the portfolio says: ${clean(e.description ?? "")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    }));
}

function projectDocs(): KnowledgeDoc[] {
  return projects.map((p) => {
    const lines = [
      `Project: ${p.title}`,
      `Category: ${p.category}`,
      p.role && `Described as: ${p.role}`,
      `Summary: ${clean(p.summary)}`,
      p.stack?.length && `Technologies listed: ${p.stack.join(", ")}`,
      p.repoUrl && `Source code: ${p.repoUrl}`,
      p.demoUrl && `Live demo: ${p.demoUrl}`,
      "Note: the portfolio presents this as her project. It does not break down which parts were done by her personally versus by teammates, and it lists no usage numbers or measured results.",
    ];
    if (p.caseStudy) {
      for (const [k, v] of Object.entries(p.caseStudy)) {
        if (typeof v === "string" && v) lines.push(`Case study — ${k}: ${clean(v)}`);
      }
    }
    return { id: `project-${p.slug}`, kind: "project" as const, title: p.title, text: lines.filter(Boolean).join("\n") };
  });
}

function achievementDoc(): KnowledgeDoc {
  // The achievements section is an image flipbook; the data file holds each page's caption only.
  const items = achievements.pages
    .filter((_, i, all) => i > 0 && i < all.length - 1) // drop front/back cover
    .map((p) => `- ${clean(p.alt)}`);
  return {
    id: "achievements",
    kind: "achievement",
    title: "Achievements and leadership (flipbook pages)",
    text: [
      `Section title: "${achievements.heading}"`,
      "Entries (titles only — the descriptions live inside page images the assistant cannot read):",
      ...items,
    ].join("\n"),
  };
}

function contactDoc(): KnowledgeDoc {
  const lines = [
    contact.email && `Email: ${contact.email}`,
    contact.linkedin && `LinkedIn: ${contact.linkedin}`,
    contact.behance && `Behance (design work): ${contact.behance}`,
    "A downloadable resume is available in the Contact section of the site.",
  ];
  return { id: "contact", kind: "contact", title: "Public links", text: lines.filter(Boolean).join("\n") };
}

function coverageDoc(): KnowledgeDoc {
  return {
    id: "coverage",
    kind: "coverage",
    title: "What the portfolio does NOT document",
    text: [
      "The assistant has NO information about the following, so it must say so instead of guessing:",
      "- Hobbies, interests outside work, or personality traits (the portfolio has no hobbies section).",
      "- Education details such as grades, graduation dates or coursework (these are not in the portfolio data).",
      "- Certifications, publications, salary, availability, location preferences or phone number.",
      "- Proficiency levels or years of experience for any skill.",
      "- Measured outcomes of projects (users, accuracy, revenue, performance numbers).",
      "- The exact split between Bhavna's own contribution and her teammates' on each project.",
      "- The contents of her resume PDF (the assistant cannot read it).",
      "- Any technology, tool or framework that is not named elsewhere in this knowledge.",
    ].join("\n"),
  };
}

let cache: KnowledgeDoc[] | null = null;

/** All knowledge documents, built once from the data files. */
export function buildKnowledge(): KnowledgeDoc[] {
  if (!cache) {
    cache = [profileDoc(), skillsDoc(), ...experienceDocs(), ...projectDocs(), achievementDoc(), contactDoc(), coverageDoc()];
  }
  return cache;
}

/**
 * Pick the evidence to hand to the model for a question.
 * v1: the whole portfolio (a few KB). RAG upgrade point — replace the body with embedding search
 * over the same documents and return the top matches, keeping this signature.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function retrieve(_question: string): KnowledgeDoc[] {
  return buildKnowledge();
}

/** Render documents as a delimited block the model is told to treat as data, never as instructions. */
export function formatContext(docs: KnowledgeDoc[]): string {
  return docs.map((d) => `### [${d.kind}] ${d.title}\n${d.text}`).join("\n\n");
}
