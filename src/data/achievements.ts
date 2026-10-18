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
    { src: "/achievements/cover.png", alt: "Bhavna's Book of Achievements — cover" },
    { src: "/achievements/page-01.png", alt: "Organizer — Poster Design Competition" },
    { src: "/achievements/page-02.png", alt: "AI Webinar — Speaker" },
    { src: "/achievements/page-03.png", alt: "Designed for CoinEx Global" },
    { src: "/achievements/page-04.png", alt: "Builders Qoneqt — Management" },
    { src: "/achievements/page-05.png", alt: "Guest Speaker — AI Awareness Session" },
    { src: "/achievements/page-06.png", alt: "AI Webinar — Speaker (Ignite 2025)" },
    { src: "/achievements/page-07.png", alt: "Performance Excellence Award — Finan Consulting" },
    { src: "/achievements/page-08.png", alt: "Hackverse'24 — Organizer & Designer" },
    { src: "/achievements/page-09.png", alt: "Runner Up — Nxt Gen Hackathon" },
    { src: "/achievements/page-10.png", alt: "Smart India Hackathon (SIH 2025) — Winner" },
    { src: "/achievements/back-cover.png", alt: "More milestones to achieve — back cover" },
  ],

  /** Optional: a downloadable PDF version, e.g. "/achievements/achievements.pdf". Empty = hidden. */
  pdf: "",
};
