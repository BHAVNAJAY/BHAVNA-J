"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { netraShowcase } from "@/data/netra";
import { projects } from "@/data/projects";
import { GithubIcon } from "./BrandIcons";
import { withBase } from "@/lib/base";
import styles from "@/styles/netra.module.css";

// Three.js only runs in the browser, and is only downloaded when the section is about to be seen.
const NetraScene = dynamic(() => import("./netra/NetraScene"), { ssr: false, loading: () => null });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Fades a caption in and out over a range of the pinned scroll (0 → 1). */
function useChapter(travel: MotionValue<number>, from: number, to: number, last = false) {
  const fade = 0.05;
  // the last caption stays up until the end (values clamp beyond the range)
  // scroll-linked ranges must stay inside 0 → 1 (the browser rejects negative offsets)
  const a = Math.max(0, from - fade);
  const opacity = useTransform(
    travel,
    last ? [a, from + fade] : [a, from + fade, to - fade, Math.min(1, to + fade)],
    last ? [0, 1] : [0, 1, 1, 0]
  );
  const y = useTransform(opacity, [0, 1], [18, 0]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return { opacity, y, pointerEvents };
}

/**
 * Cinematic, scroll-driven showcase of the Netra 3D scene.
 *
 * Layout: a tall section containing a sticky full-screen stage. Normal page scrolling is never intercepted —
 * the scroll position simply drives the model (rotation, position, scale) and the three captions. The 3D
 * canvas is created only when the section is near the viewport, and its render loop only runs while it is
 * on screen.
 */
export default function NetraShowcase() {
  const project = projects.find((p) => p.slug === netraShowcase.projectSlug);
  const prefersReduced = !!useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // only switch layouts after mounting, so the first client render matches the server HTML (no hydration warning)
  const reduced = mounted && prefersReduced;
  const sectionRef = useRef<HTMLElement>(null);

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [near, setNear] = useState(false); // close enough to start loading the model
  const [active, setActive] = useState(false); // on screen → render frames
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWebgl(hasWebGL());
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "900px 0px 900px 0px" });
    const activeIO = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px 0px 120px 0px" });
    nearIO.observe(el);
    activeIO.observe(el);
    return () => {
      nearIO.disconnect();
      activeIO.disconnect();
    };
  }, []);

  // enter: the section sliding up from below; travel: scrolling through the pinned stage
  const { scrollYProgress: enter } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const { scrollYProgress: travel } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const still = { enter: useMotionValue(1), travel: useMotionValue(0.45) };

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const chapA = useChapter(travel, 0.04, 0.36);
  const chapB = useChapter(travel, 0.36, 0.68);
  const chapC = useChapter(travel, 0.68, 1, true);

  // whole 3D layer: rises and fades in as the section arrives, then simply scrolls away with the stage
  const layerOpacity = useTransform(enter, (e) => clamp01(e * 1.5));
  const layerY = useTransform(enter, [0, 1], [70, 0]);
  const glowOpacity = useTransform(enter, [0.2, 1], [0, 1]);
  const headOpacity = useTransform(enter, [0.55, 1], [0, 1]);
  const barScale = useTransform(travel, [0, 1], [0.03, 1]);

  if (!project) return null; // data file has no matching project — render nothing rather than invented content

  const staticMode = reduced || webgl === false || failed;
  const showImage = webgl === false || failed;
  const L = netraShowcase.labels;

  const copy = {
    about: <p>{project.summary}</p>,
    built: (
      <>
        {project.role && <p>{project.role}</p>}
        {project.stack?.length ? (
          <ul className={styles.tags}>
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
      </>
    ),
    explore: (
      <div className={styles.links}>
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
            <GithubIcon size={16} /> View the code <ArrowUpRight size={15} aria-hidden />
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
            Live demo <ArrowUpRight size={15} aria-hidden />
          </a>
        )}
        <a href="#projects">All projects</a>
      </div>
    ),
  };

  const heading = (
    <div className={styles.head}>
      <h2 id="netra-title" className={`section-title display ${styles.title}`}>
        {project.title}
      </h2>
      <p className={`${styles.subtitle} serif`}>{project.category}</p>
    </div>
  );

  const loading = near && !ready && !failed && webgl !== false && (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      Loading the 3D scene…
    </div>
  );

  const canvas =
    near && webgl && !failed ? (
      <NetraScene
        url={withBase(netraShowcase.modelPath)}
        enter={staticMode ? still.enter : enter}
        travel={staticMode ? still.travel : travel}
        reduced={staticMode}
        active={active}
        onReady={onReady}
        onError={onError}
      />
    ) : null;

  /* ── reduced motion / no WebGL / model failed: a plain, readable section ── */
  if (staticMode) {
    return (
      <section id="netra" ref={sectionRef} className={`starfield ${styles.static}`} aria-labelledby="netra-title">
        <div className="container">
          {heading}
          <div className={styles.staticMedia} role="img" aria-label={`${project.title} — ${showImage ? "project cover" : "3D scene of the hospital"}`}>
            {showImage && project.thumbnail ? (
              <>
                <Image src={withBase(project.thumbnail)} alt="" fill sizes="(max-width: 900px) 92vw, 70vw" style={{ objectFit: "cover" }} />
                <p className={styles.note}>{netraShowcase.fallbackNote}</p>
              </>
            ) : (
              <>
                <div className={styles.staticCanvas}>{canvas}</div>
                {loading}
              </>
            )}
          </div>
          <div className={styles.staticCopy}>
            <div>
              <h3>{L.about}</h3>
              {copy.about}
            </div>
            <div>
              <h3>{L.built}</h3>
              {copy.built}
            </div>
            <div>
              <h3>{L.explore}</h3>
              {copy.explore}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── the cinematic version ── */
  return (
    <section id="netra" ref={sectionRef} className={`starfield ${styles.section}`} aria-labelledby="netra-title">
      <div className={styles.stage}>
        <motion.div className={styles.glow} style={{ opacity: glowOpacity }} aria-hidden />

        <motion.div
          className={styles.canvasWrap}
          style={{ opacity: layerOpacity, y: layerY }}
          role="img"
          aria-label={`3D model of the ${project.title} hospital scene, turning slowly as you scroll`}
        >
          {canvas}
        </motion.div>

        <motion.div style={{ opacity: headOpacity }} className={styles.headWrap}>
          {heading}
        </motion.div>

        {loading}

        <div className={styles.captions}>
          {(
            [
              [chapA, L.about, copy.about],
              [chapB, L.built, copy.built],
              [chapC, L.explore, copy.explore],
            ] as const
          ).map(([c, label, body]) => (
            <motion.div key={label} className={styles.cap} style={c}>
              <h3>{label}</h3>
              {body}
            </motion.div>
          ))}
        </div>

        <div className={styles.progressRow} aria-hidden>
          <div className={styles.progressBar}>
            <motion.span style={{ scaleX: barScale }} />
          </div>
          <span>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
