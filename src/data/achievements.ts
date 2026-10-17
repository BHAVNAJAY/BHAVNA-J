/**
 * ACHIEVEMENTS FLIPBOOK
 * ─────────────────────
 * Export each Canva page as a PNG and drop it into /public/achievements/
 * using the same file names (or edit the list below — add or remove pages
 * freely; an even total page count gives the cleanest spreads).
 *
 * All pages should share one aspect ratio. Set it in `pageAspect`
 * (width / height). The bundled placeholders are 900×1200 → 0.75.
 */

export type Page = { src: string; alt: string };

export const achievements: {
  heading: string;
  subtitle: string;
  turnDirection: "left-to-right" | "right-to-left";
  pageAspect: number;
  pages: Page[];
  pdf: string;
} = {
  heading: "The Chapters of My Journey",
  subtitle: "Every achievement tells a story.",
  turnDirection: "right-to-left",
  pageAspect: 900 / 1200,
  pages: [
    { src: "/achievements/cover.png", alt: "Achievements booklet — cover" },
    { src: "/achievements/page-01.png", alt: "Achievements — page 1" },
    { src: "/achievements/page-02.png", alt: "Achievements — page 2" },
    { src: "/achievements/page-03.png", alt: "Achievements — page 3" },
    { src: "/achievements/page-04.png", alt: "Achievements — page 4" },
    { src: "/achievements/back-cover.png", alt: "Achievements booklet — back cover" },
  ],
  /** Optional: a downloadable PDF version, e.g. "/achievements/achievements.pdf". Empty = hidden. */
  pdf: "",
};
