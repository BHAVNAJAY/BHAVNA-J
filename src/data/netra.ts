/**
 * NETRA 3D SHOWCASE
 * ─────────────────
 * The scroll-driven 3D section that follows "Skills".
 *
 * Model:   put the exported file at  public/models/netra.glb  (or change `modelPath`).
 * Content: the title, summary, role, stack and links come straight from the Netra entry in
 *          src/data/projects.ts (matched by `projectSlug`) — edit them there, not here.
 *          Only the small UI labels below live in this file.
 */
export const netraShowcase = {
  /** File inside /public. Loaded only when the section is about to be seen. */
  modelPath: "/models/netra.glb",
  /** Which project in projects.ts this section presents. */
  projectSlug: "netra",
  /** Labels for the three captions that appear while scrolling. */
  labels: {
    about: "The project",
    built: "Role & technology",
    explore: "Explore",
  },
  /** Shown for people whose device cannot run WebGL, or if the model fails to load. */
  fallbackNote: "The 3D view isn't available on this device — here's the project cover instead.",
};
