/**
 * ─────────────────────────────────────────────────────────────
 *  PORTFOLIO CONFIGURATION
 *  Every piece of personal text, label, link and asset path on the
 *  site lives here (projects → projects.ts, flipbook → achievements.ts).
 *  Edit this file; you should not need to touch any component.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Bhavna Jayakumar",
  shortName: "Bhavna J",
  description:
    "Portfolio of Bhavna Jayakumar — Computer Science (AI & ML) student, full-stack developer, UI/UX and graphic designer, and digital marketer.",
};

/* ── Hero: 3D ID badge ─────────────────────────────────────── */

export const badge = {
  /** Portrait shown on the front insert. Replace the file or change the path. */
  portrait: "/images/portrait.jpg",
  /** QR code printed on the back of the badge. */
  qr: "/images/qr.png",
  /**
   * Where to focus when cropping the portrait into the badge window.
   * x / y are 0–1 fractions of the source image (0.5, 0.5 = centre).
   * zoom > 1 crops tighter around the focus point.
   */
  portraitFocus: { x: 0.5, y: 0.6, zoom: 1.55 },

  front: {
    name: "BHAVNA J",
    title: "Developer & Designer",
    /** Small printed details on the insert (purely typographic). */
    metaLeft: "PORTFOLIO",
    signature: "Bhavna",
  },

  back: {
    heading: "What I do",
    roles: ["Developer", "Designer", "Facilitator"],
    connect: "Connect with Me",
  },

  /** Accessible label for the interactive badge. */
  ariaLabel: "Bhavna J's ID badge",
};

/**
 * Floating role labels around the badge. Plain HTML text — edit freely.
 * position: "tl" | "tr" | "bl" | "br" (top-left, top-right, bottom-left, bottom-right)
 * accent: true renders the label in pale pink instead of white.
 */
export const heroRoles: { text: string; position: "tl" | "tr" | "bl" | "br"; accent?: boolean }[] = [
  { text: "CREATIVE LEADER", position: "tl" },
  { text: "DEVELOPER", position: "tr", accent: true },
  { text: "DESIGNER", position: "bl", accent: true },
  { text: "PUBLIC SPEAKER", position: "br" },
];

/* ── About ─────────────────────────────────────────────────── */

export const about = {
  title: "About Me",
  heading: "Logic Runs from A to Z, Creativity Knows No Limits.",
  photo: "/images/about.png",
  signoff: "- BHAVNA JAYAKUMAR",
  photoAlt: "Portrait of Bhavna Jayakumar",
  /**
   * Short biography. Written only from the facts you supplied —
   * rewrite in your own voice whenever you like (one string per paragraph).
   */
  paragraphs: [
    "Hey, I'm a Computer Science Engineering student specialising in AI & Machine Learning, with a love for development, AI, and design.",
    "I enjoy building things from scratch, developing web applications, experimenting with AI-powered solutions, and designing interfaces that are intuitive and visually engaging.",
    "Beyond coding and designing, I enjoy collaborating with people, sharing ideas, and taking on challenges that push me to learn something new. I'm always exploring, creating, and finding better ways to turn ideas into reality.",
  ],
  facts: [
    { label: "Studying", value: "Computer Science - AI & ML" },
    { label: "Roles", value: "Developer, Designer, Facilitator" },
  ],
};

/* ── Skills ────────────────────────────────────────────────── */

export type Skill = { name: string; logo?: string; icon?: string };

export const skills = {
  heading: "Skills & Toolkit",
  groups: [
    {
      title: "Development",
      icon: "code" as const,
      items: [
        { name: "Python", logo: "/skills/python.svg" },
        { name: "JavaScript", logo: "/skills/javascript.svg" },
        { name: "TypeScript", logo: "/skills/typescript.svg" },
        { name: "React.js", logo: "/skills/react.svg" },
        { name: "Next.js", logo: "/skills/nextjs.svg" },
        { name: "Node.js", logo: "/skills/nodejs.svg" },
        { name: "Express.js", logo: "/skills/express.svg" },
        { name: "Flask", logo: "/skills/flask.svg" },
        { name: "FastAPI", logo: "/skills/fastapi.svg" },
        { name: "SQL", icon: "database" },
        { name: "MongoDB", logo: "/skills/mongodb.svg" },
        { name: "PostgreSQL", logo: "/skills/postgresql.svg" },
        { name: "Supabase", logo: "/skills/supabase.svg" },
        { name: "REST APIs", icon: "plug" },
        { name: "Git", logo: "/skills/git.svg" },
        { name: "GitHub", logo: "/skills/github.svg" },
      ] as Skill[],
    },
    {
      title: "Design & Visualisation",
      icon: "pen" as const,
      items: [
        { name: "Figma", logo: "/skills/figma.svg" },
        { name: "Canva", logo: "/skills/canva.svg" },
        { name: "Adobe Illustrator", logo: "/skills/illustrator.svg" },
        { name: "Adobe Photoshop", logo: "/skills/photoshop.svg" },
        { name: "Blender", logo: "/skills/blender.svg" },
        { name: "UI/UX Design", icon: "layout" },
        { name: "Prototyping", icon: "shapes" },
        { name: "Graphic Design", icon: "pen" },
        { name: "Branding", icon: "badge" },
      ] as Skill[],
    },
    {
      title: "AI & Machine Learning",
      icon: "ai" as const,
      items: [
        { name: "Generative AI", icon: "sparkles" },
        { name: "LLMs", icon: "message" },
        { name: "Prompt Engineering", icon: "terminal" },
        { name: "RAG", icon: "search" },
        { name: "Embeddings", icon: "network" },
        { name: "Agentic AI", icon: "bot" },
        { name: "NLP", icon: "languages" },
        { name: "Computer Vision", icon: "eye" },
        { name: "PyTorch", logo: "/skills/pytorch.svg" },
        { name: "Scikit-learn", logo: "/skills/scikitlearn.svg" },
        { name: "Pandas", logo: "/skills/pandas.svg" },
        { name: "NumPy", logo: "/skills/numpy.svg" },
        { name: "Gemini API", icon: "sparkles" },
        { name: "OpenAI API", icon: "bot" },
      ] as Skill[],
    },
  ],
};

/* ── Resume & contact ──────────────────────────────────────── */

export const resume = {
  /** Put your PDF at /public/resume.pdf (or change this path). */
  path: "/resume.pdf",
  downloadName: "Bhavna-Jayakumar-Resume.pdf",
  heading: "Resume",
  line: "Everything in one page — education, projects, skills and leadership.",
};

export const contact = {
  heading: "Find me here.",
  subtitle: "Have an idea? Let's make something meaningful.",
  email: "bhavnajayakumar@gmail.com",
  linkedin: "https://www.linkedin.com/in/bhavna-jayakumar-934057284/",
  footer: "Designed & built by Bhavna J.",
};

export const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Achievements", href: "#achievements" },
  { label: "Contact", href: "#contact" },
];
