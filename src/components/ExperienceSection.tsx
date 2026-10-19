"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { experienceSection, experiences } from "@/data/experience";
import Reveal from "./Reveal";
import styles from "@/styles/experience.module.css";

// Three.js only runs in the browser.
const Businesswoman3D = dynamic(() => import("./experience/Businesswoman3D"), { ssr: false, loading: () => null });

/** Where each experience's dot sits, measured from the top of its row (keep in sync with .node in the CSS). */
const NODE_OFFSET = 56;
/** How strongly she "sticks" at each experience before walking on (px). */
const DWELL = 150;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Simple flat silhouette, only used when the device has no WebGL. */
function FallbackFigure() {
  return (
    <svg viewBox="0 0 60 120" className={styles.fallback} aria-hidden>
      <circle cx="30" cy="14" r="10" fill="#1b1210" />
      <path d="M14 34 Q30 24 46 34 L44 70 L16 70 Z" fill="#16141a" />
      <path d="M26 30 L30 46 L34 30 Z" fill="#f7f2f5" />
      <rect x="18" y="70" width="10" height="44" rx="4" fill="#121015" />
      <rect x="32" y="70" width="10" height="44" rx="4" fill="#121015" />
    </svg>
  );
}

/**
 * Experience timeline.
 * A vertical line runs down the middle (down the left on phones). As you
 * scroll, a 3D woman in a black suit walks along the line, pauses at each
 * experience and turns toward its card. Cards alternate left / right.
 */
export default function ExperienceSection() {
  const reduced = !!useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const facingRef = useRef(0);

  const [nodes, setNodes] = useState<number[]>([]);
  const [lineH, setLineH] = useState(0);
  const [walkerH, setWalkerH] = useState(0);
  const [stacked, setStacked] = useState(false);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => setWebgl(hasWebGL()), []);

  // Measure where every dot is on the line.
  const measure = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    const top = tl.getBoundingClientRect().top;
    setNodes(itemRefs.current.map((li) => (li ? li.getBoundingClientRect().top - top + NODE_OFFSET : 0)));
    setLineH(tl.offsetHeight);
    setWalkerH(walkerRef.current?.offsetHeight ?? 0);
    setStacked(window.matchMedia("(max-width: 760px)").matches);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (timelineRef.current) ro.observe(timelineRef.current);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Only animate the 3D figure while the section is on screen.
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── scroll → her position on the line ──────────────────────────────
     The point of the line at the middle of the screen is where she wants
     to be. Near each dot that target is "magnetised" onto the dot, so she
     walks, stops at the experience for a while, then walks on. A spring
     smooths it so the motion feels like walking, not sliding. */
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start center", "end center"] });
  const target = useMotionValue(0);

  const computeTarget = useCallback(
    (p: number) => {
      if (!nodes.length) return 0;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const t = Math.min(last, Math.max(first, p * lineH));
      let out = t;
      for (const n of nodes) {
        const d = t - n;
        out -= d * Math.exp(-(d * d) / (DWELL * DWELL));
      }
      return out;
    },
    [nodes, lineH]
  );

  const pos = useSpring(target, { stiffness: 70, damping: 20, mass: 1 });

  useEffect(() => {
    // place her correctly right away (e.g. page reloaded mid-section)
    const v = computeTarget(scrollYProgress.get());
    target.set(v);
    pos.jump(v);
  }, [computeTarget, scrollYProgress, target, pos]);

  useMotionValueEvent(scrollYProgress, "change", (p) => target.set(computeTarget(p)));

  useMotionValueEvent(pos, "change", (v) => {
    if (!nodes.length) return;
    let best = 0;
    nodes.forEach((n, i) => {
      if (Math.abs(n - v) < Math.abs(nodes[best] - v)) best = i;
    });
    setActive((a) => (a === best ? a : best));
    const near = Math.abs(nodes[best] - v) < 60;
    // turn toward the card she's standing at (cards sit to the right on phones)
    facingRef.current = near ? (stacked ? 1 : best % 2 === 0 ? -1 : 1) : 0;
  });

  const walkerY = useTransform(pos, (v) => v - walkerH * 0.5);
  // On phones the line runs from the first dot to the last (no stub above the first dot),
  // so she starts at the very beginning of the line.
  const lineTop = stacked && nodes.length ? nodes[0] : 0;
  const fillH = useTransform(pos, (v) => Math.max(0, v - lineTop));

  return (
    <section id="experience" className={styles.section} aria-labelledby="exp-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <Reveal delay={0.05}>
            <h2 id="exp-title" className={`${styles.title} display`}>
              {experienceSection.heading}
            </h2>
          </Reveal>
        </div>

        <div className={styles.timeline} ref={timelineRef} style={{ "--line-h": `${lineH}px` } as React.CSSProperties}>
          {/* the line, filling in black as she walks down it */}
          <div className={styles.line} style={nodes.length ? { top: lineTop, height: nodes[nodes.length - 1] - lineTop, bottom: "auto" } : undefined} aria-hidden>
            <motion.div className={styles.lineFill} style={{ height: fillH }} />
          </div>

          {/* the 3D woman */}
          <motion.div ref={walkerRef} className={styles.walker} style={{ y: walkerY }} aria-hidden>
            {webgl && <Businesswoman3D y={pos} facingRef={facingRef} active={inView} reduced={reduced} />}
            {webgl === false && <FallbackFigure />}
            <span className={styles.walkerShadow} />
          </motion.div>

          <ol className={styles.list}>
            {experiences.map((x, i) => (
              <li
                key={x.title + i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={styles.item}
                data-side={i % 2 === 0 ? "left" : "right"}
                data-active={i === active || undefined}
              >
                <span className={styles.node} aria-hidden />
                <motion.article
                  className={styles.card}
                  data-placeholder={x.placeholder || undefined}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, x: stacked ? 0 : i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                    {x.period && <span className={styles.period}>{x.period}</span>}
                  </div>
                  <h3 className={`${styles.cardTitle} display`}>{x.title}</h3>
                  {x.org && <p className={styles.org}>{x.org}</p>}
                  {x.description && <p className={styles.desc}>{x.description}</p>}
                  {x.tags?.length ? (
                    <ul className={styles.tags}>
                      {x.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  ) : null}
                </motion.article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}