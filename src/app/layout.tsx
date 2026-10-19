import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no runtime request to Google; works offline and on Vercel)
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { site } from "@/data/portfolio";
import SmoothScroll from "@/components/SmoothScroll";
import { withBase } from "@/lib/base";

export const metadata: Metadata = {
  title: `${site.name} — Portfolio`,
  description: site.description,
  openGraph: {
    title: `${site.name} — Portfolio`,
    description: site.description,
    type: "website",
  },
  icons: { icon: withBase("/favicon.svg") },
};

export const viewport: Viewport = {
  themeColor: "#090910",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={
        {
          // star tiles are referenced from CSS, so give it the base-path-aware URLs
          "--stars-a": `url("${withBase("/stars/stars-a.svg")}")`,
          "--stars-b": `url("${withBase("/stars/stars-b.svg")}")`,
        } as React.CSSProperties
      }
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
