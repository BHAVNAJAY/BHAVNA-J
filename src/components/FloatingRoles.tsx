"use client";

import { useEffect, useState } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { heroRoles } from "@/data/portfolio";
import type { Rect } from "./hero/types";
import styles from "@/styles/hero.module.css";

type Props = {
  rect: Rect | null;
  progress: MotionValue<number>;
  show: boolean;
  reduced: boolean;
};

const NAV_H = 68;

type Layout = {
  mode: "side" | "stack";
  fontPx: number;
  maxW: number;
  pos: Record<"tl" | "tr" | "bl" | "br", React.CSSProperties>;
};

/** Width of the widest single word at 100px in the label font. */
function widestWordAt100(words: string[]) {
  const c = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D & { fontStretch?: string };
  c.font = `800 100px "Archivo Variable", "Arial Black", sans-serif`;
  try {
    if ("fontStretch" in c) c.fontStretch = "semi-expanded";
  } catch {
    /* ignore */
  }
  // + letter-spacing (0.01em) and a little safety margin
  return Math.max(...words.map((w) => c.measureText(w).width + w.length * 1)) * 1.04;
}

function computeLayout(rect: Rect): Layout {
  const { containerW: W, containerH: H } = rect;
  const gutter = Math.max(20, Math.min(72, W * 0.05));
  const gap = Math.max(26, Math.min(80, W * 0.045));
  const sideW = rect.left - gutter - gap;
  const mode: Layout["mode"] = sideW >= 170 ? "side" : "stack";
  const words = heroRoles.flatMap((r) => r.text.split(/\s+/));
  const widest = widestWordAt100(words);
  const avail = mode === "side" ? sideW : (W - gutter * 2 - 40) / 2;
  const maxPx = mode === "side" ? 84 : 44;
  const fontPx = Math.round(Math.max(20, Math.min(maxPx, (avail * 100) / widest)));

  const right = W - (rect.left - gap);
  const left = rect.left + rect.width + gap;
  const y = (f: number) => rect.top + rect.height * f;

  if (mode === "side") {
    return {
      mode,
      fontPx,
      maxW: sideW,
      pos: {
        tl: { right, top: y(0.12), textAlign: "right" },
        tr: { left, top: y(0.27), textAlign: "left" },
        bl: { right, top: y(0.68), textAlign: "right" },
        br: { left, top: y(0.82), textAlign: "left" },
      },
    };
  }
  const topBand = (NAV_H + rect.top) / 2;
  const bottomBand = (rect.top + rect.height + H - 36) / 2;
  return {
    mode,
    fontPx,
    maxW: avail,
    pos: {
      tl: { left: gutter, top: topBand, textAlign: "left" },
      tr: { right: gutter, top: topBand, textAlign: "right" },
      bl: { left: gutter, top: bottomBand, textAlign: "left" },
      br: { right: gutter, top: bottomBand, textAlign: "right" },
    },
  };
}

/**
 * Four independent HTML labels around the badge. Their text comes from
 * `heroRoles` in src/data/portfolio.ts. Positions are derived from the
 * badge's projected screen rectangle, so they never overlap it.
 */
export default function FloatingRoles({ rect, progress, show, reduced }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    if (!rect) return;
    const run = () => setLayout(computeLayout(rect));
    run();
    // re-measure once web fonts are in (metrics change)
    document.fonts?.ready.then(run).catch(() => {});
  }, [rect]);

  // scroll choreography: drift outward and fade
  const out = useTransform(progress, [0, 1], [0, reduced ? 0 : 160]);
  const outNeg = useTransform(out, (v) => -v);
  const lift = useTransform(progress, [0, 1], [0, reduced ? 0 : -50]);
  const fade = useTransform(progress, [0, 0.6], [1, 0]);

  if (!layout) return null;

  return (
    <div className={styles.roles} data-mode={layout.mode} aria-hidden>
      {heroRoles.map((role, i) => {
        const isLeft = role.position === "tl" || role.position === "bl";
        return (
          <motion.div
            key={role.position + role.text}
            className={styles.roleWrap}
            style={{
              ...layout.pos[role.position],
              maxWidth: layout.maxW,
              x: isLeft ? outNeg : out,
              y: lift,
              opacity: fade,
            }}
          >
            {/* entrance (once) */}
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, filter: "blur(10px)" }}
              animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
              transition={{ duration: reduced ? 0.5 : 1.1, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* independent slow float + breathing opacity (skipped for reduced motion) */}
              <motion.span
                className={`${styles.role} display ${role.accent ? styles.roleAccent : ""}`}
                style={{ fontSize: layout.fontPx }}
                animate={show && !reduced ? { y: [0, -6 - i * 1.5, 0], opacity: [1, 0.8, 1] } : undefined}
                transition={{ duration: 5.5 + i * 1.1, ease: "easeInOut", repeat: Infinity, delay: 1.2 + i * 0.4 }}
              >
                {role.text}
              </motion.span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
