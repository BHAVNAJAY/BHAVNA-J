/**
 * EXPERIENCE
 * ──────────
 * Edit the entries below. They appear top-to-bottom, alternating
 * left / right of the vertical line (on phones they stack on one side).
 *
 * `placeholder: true` shows the text in a faded "to fill in" style —
 * delete that line once you've written the real details.
 * `tags` is optional (skills / tools used).
 */

export type Experience = {
  title: string;
  org?: string;
  period?: string;
  description?: string;
  tags?: string[];
  placeholder?: boolean;
};

export const experienceSection = {
  eyebrow: "Experience",
  heading: "The path so far",
};

export const experiences: Experience[] = [
  {
    title: "Full Stack Developer Intern",
    org: "Finan Consulting, Chennai",
    period: "Jun 2025 – Aug 2026",
    description:
      "Contributed to the development and improvement of SaaS applications across frontend and backend. Built responsive web interfaces, integrated REST APIs, authentication flows, and AI-powered features. Supported testing, debugging, and user acceptance testing (UAT) to improve product reliability and user experience.",
  },
  {
    title: "Head",
    org: "CodeKrafters, SRMIST · Chennai",
    period: "Apr 2025 – Jul 2026",
    description:
      "Led and mentored the club’s creative team across UI/UX design, visual design, and video editing. Guided creative direction, maintained design consistency, and encouraged user-centred design practices. Coordinated team contributions to deliver high-quality visual content and digital experiences.",
  },
  {
    title: "Student Coordinator",
    org: "National Service Scheme (NSS), SRMIST · Chennai",
    period: "Dec 2023 – Sep 2026",
    description:
      "Coordinate student participation in community outreach initiatives and campus events. Support the planning and execution of awareness programmes, including blood donation drives and dental camps, contributing to community wellbeing and student engagement.",
  },
  {
    title: "Executive Member",
    org: "Computer Society of India (CSI), SRMIST · Chennai",
    period: "Mar 2024 – Mar 2025",
    description:
      "Contributed to organising technical workshops and student learning initiatives. Supported event coordination and helped create opportunities for students to explore technology, exchange knowledge, and engage with the computing community.",
  },
  {
    title: "And I'm Just Getting Started.",
  },
];

/**
 * YOUR OWN 3D MODEL (optional)
 * ────────────────────────────
 * Export your Blender character as .glb and save it as
 *   public/models/woman.glb
 * The site uses it automatically; if the file isn't there, the built-in
 * figure is used instead.
 */
export const walkerModel = {
  /** Path of the .glb inside /public. Set to "" to always use the built-in figure. */
  src: "/models/woman.glb",
  /** Name of the walk animation in the file. "" = use one with "walk" in its name, or the first one. */
  walkClip: "",
  /** Turn the model if it faces the wrong way (degrees, e.g. 180). */
  rotateY: 0,
  /**
   * Only for models WITHOUT a walk animation: the exact object (or bone) names
   * to swing, comma-separated, exactly as shown in Blender's Outliner.
   * Leave all empty to detect them automatically from names like
   * "Left Leg", "Leg.R", "Arm_L", "LeftShoe", "mixamorigLeftUpLeg".
   */
  parts: {
    leftLeg: "",
    rightLeg: "",
    leftArm: "",
    rightArm: "",
  },
};