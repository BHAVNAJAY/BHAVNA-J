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
  org: string;
  period: string;
  description: string;
  tags?: string[];
  placeholder?: boolean;
};

export const experienceSection = {
  eyebrow: "Experience",
  heading: "The path so far",
};

export const experiences: Experience[] = [
  {
    title: "NSS",
    org: "National Service Scheme",
    period: "Add dates",
    description: "Add a line or two about your role and what you did here.",
    placeholder: true,
  },
  {
    title: "CSI",
    org: "Computer Society of India",
    period: "Add dates",
    description: "Add a line or two about your role and what you did here.",
    placeholder: true,
  },
  {
    title: "Creative Head",
    org: "CodeKrafters Club",
    period: "Add dates",
    description: "Add a line or two about what you led and created as Creative Head.",
    placeholder: true,
  },
  {
    title: "Full Stack Development Internship",
    org: "Company name",
    period: "Add dates",
    description: "Add a line or two about what you built and the stack you used.",
    placeholder: true,
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