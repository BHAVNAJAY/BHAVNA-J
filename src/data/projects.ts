/**
 * PROJECTS
 * ─────────
 * To add a cover image: put it in /public/projects/ and set
 *   thumbnail: "/projects/satquery.jpg"
 * (16:10 landscape works best, ~1600×1000). Without one, a typographic
 * cover is generated from `title`, `category` and `hue`.
 *
 * `externalUrl` makes the whole card open that link directly — no case
 * study page in between.
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
  /** Clicking the card opens this URL. */
  externalUrl?: string;
};

export const projects: Project[] = [
  {
    slug: "satquery-ai",
    title: "SatQuery AI",
    category: "AI-Powered Earth Observation",
    summary:
      "A Vision-Language system for an ISRO problem statement that integrates Gemini API, Meta SAM 2, and fine-tuned AI models to analyze multi-sensor satellite imagery and support remote-sensing queries.",
    hue: 200,
    thumbnail: "/projects/project-01.png",
    role: "Generative AI Satellite Query & Analysis Platform",
    stack: ["Python", "PyTorch", "LLMs", "Agentic AI", "RAG", "Embeddings", "Computer Vision", "REST APIs", "EfficientNet-B4", "ResNet-50"],
    repoUrl: "https://github.com/BHAVNAJAY/SatQueryAI",
    externalUrl: "https://github.com/BHAVNAJAY/SatQueryAI",
  },
  {
    slug: "ping",
    title: "Ping",
    category: "Intelligent Campaign Automation",
    summary:
      "A full-stack CRM that transforms natural-language business goals into AI-generated customer audiences, personalized campaign messages, and recommended send times.",
    hue: 328,
    thumbnail: "/projects/ping.png",
    role: "AI-Powered CRM for Smarter Customer Engagement",
    stack: ["React", "Node.js", "Express.js", "MongoDB", "OpenAI API"],
    demoUrl: "https://ping-ecru-nu.vercel.app/",
    externalUrl: "https://ping-ecru-nu.vercel.app/",
  },
  {
    slug: "iready",
    title: "iReady",
    category: "AI-Powered Interview Preparation",
    summary:
      "An NLP-powered interview practice platform that analyzes interview responses using TF-IDF similarity, grammar correction, and keyword matching to provide structured feedback.",
    hue: 262,
    thumbnail: "/projects/iready.png",
    role: "AI Interview Practice Platform",
    stack: ["React", "Flask", "Python", "Scikit-learn", "TextBlob", "NLTK", "ReportLab"],
    demoUrl: "https://i-ready-alpha.vercel.app/",
    externalUrl: "https://i-ready-alpha.vercel.app/",
  },
  {
    slug: "netra",
    title: "Netra",
    category: "Intelligent Healthcare Operations",
    summary:
      "An AI-powered hospital platform that predicts patient length of stay, ward requirements, and overflow probability to support smarter triage and resource planning.",
    hue: 14,
    thumbnail: "/projects/netra.png",
    role: "AI-Powered Patient Flow & Hospital Operations Platform",
    stack: ["Python", "FastAPI", "Scikit-learn", "Pandas", "NumPy", "Next.js", "Supabase"],
    repoUrl: "https://github.com/BHAVNAJAY/Netra",
    externalUrl: "https://github.com/BHAVNAJAY/Netra",
  },
  {
    slug: "structify",
    title: "Structify",
    category: "Graph Analysis & Validation",
    summary:
      "A Node.js-based graph analysis tool that parses node strings, detects hierarchical tree structures, identifies cycles, and analyzes graph relationships using graph algorithms.",
    hue: 36,
    thumbnail: "/projects/structify.png",
    role: "BFHL Node Hierarchy Analyzer",
    stack: ["React", "Node.js", "REST APIs", "Graph Algorithms", "JavaScript"],
    demoUrl: "https://structifybybhavna.netlify.app/",
    externalUrl: "https://structifybybhavna.netlify.app/",
  },
  {
    slug: "notify",
    title: "Notify",
    category: "Secure Notes & Organization",
    summary:
      "A full-stack notes application featuring Google OAuth authentication, search, pagination, and a responsive user interface for managing notes efficiently.",
    hue: 210,
    thumbnail: "/projects/notify.png",
    role: "Full-Stack Notes Application",
    stack: ["React", "Node.js", "Express.js", "MongoDB", "Google OAuth"],
    demoUrl: "https://notify-yh0m.onrender.com/",
    externalUrl: "https://notify-yh0m.onrender.com/",
  },
  {
    slug: "ecolearn",
    title: "EcoLearn",
    category: "Gamified Sustainability Education",
    summary:
      "A gamified learning platform that promotes awareness of the UN Sustainable Development Goals through interactive lessons, quizzes, and sustainability challenges, encouraging students to connect learning with real-world action.",
    hue: 96,
    thumbnail: "/projects/ecolearn.png",
    role: "Gamified SDG Learning Platform",
    stack: ["React", "TypeScript", "Supabase", "Gemini API"],
    repoUrl: "https://github.com/BHAVNAJAY/Eco-Learn",
    externalUrl: "https://github.com/BHAVNAJAY/Eco-Learn",
  },
];

export const projectsSection = {
  heading: "Projects",
};