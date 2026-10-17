/**
 * PROJECTS
 * ─────────
 * Only the title, category and one-line summary were supplied, so every
 * other field is left empty on purpose — empty fields are simply hidden.
 *
 * To add a cover image: put it in /public/projects/ and set
 *   thumbnail: "/projects/gramseva.jpg"
 * (16:10 landscape works best, ~1600×1000). Without one, a typographic
 * cover is generated from `title`, `category` and `hue`.
 *
 * Never put a link here unless it is real — `demoUrl` / `repoUrl` are optional.
 */

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  /** 0–360, tints the generated cover when no thumbnail is set. */
  hue: number;
  thumbnail?: string;
  role?: string;
  stack?: string[];
  demoUrl?: string;
  repoUrl?: string;
  /** If set, clicking the card opens this URL instead of the case-study view. */
  externalUrl?: string;
  caseStudy?: {
    problem?: string;
    solution?: string;
    contribution?: string;
    process?: string;
    results?: string;
    screenshots?: { src: string; alt: string }[];
  };
};

export const projects: Project[] = [
  {
    slug: "gramseva",
    title: "GramSeva",
    category: "AI · Geospatial",
    summary: "AI-assisted land-record discovery and geospatial analysis.",
    hue: 152,
  },
  {
    slug: "kriya-hub",
    title: "Kriya Hub",
    category: "SaaS · Marketing Design",
    summary: "HR management SaaS and marketing design.",
    hue: 328,
  },
  {
    slug: "candidate-assessment-portal",
    title: "Candidate Assessment Portal",
    category: "Web App · HR",
    summary: "HR candidate and assessment management.",
    hue: 262,
  },
  {
    slug: "ecolearn",
    title: "EcoLearn",
    category: "EdTech · Gamification",
    summary: "A gamified educational platform.",
    hue: 96,
  },
  {
    slug: "disastermesh-resqueue",
    title: "DisasterMesh / ResQueue",
    category: "IoT · Emergency Response",
    summary: "Offline IoT disaster response and emergency logistics.",
    hue: 14,
  },
  {
    slug: "therapet",
    title: "THERAPET",
    category: "UI/UX Design",
    summary: "A UI/UX design project.",
    hue: 292,
  },
  {
    slug: "the-food-coach",
    title: "The Food Coach",
    category: "UI/UX Design",
    summary: "A UI/UX design project.",
    hue: 36,
  },
  {
    slug: "sanskriti-ai",
    title: "Sanskriti AI",
    category: "AI · Language",
    summary: "An offline translation project.",
    hue: 210,
  },
];

export const projectsSection = {
  eyebrow: "Selected work",
  heading: "Projects",
  intro: "From geospatial AI to offline disaster response — scroll through the reel.",
};
