"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { netraShowcase } from "@/data/netra";
import { projects } from "@/data/projects";
import { GithubIcon } from "./BrandIcons";
import { withBase } from "@/lib/base";
import styles from "@/styles/netra.module.css";

// Three.js is only downloaded when the viewer is opened.
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
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** A caption that fades in and out over a slice of the viewer's scroll (0 → 1). */
function useChapter(travel: MotionValue<number>, from: number, to: number, last = false) {
  // each caption fades OUT completely before the next one fades IN, so two never overlap
  const fade = 0.06;
  const opacity = useTransform(
    travel,
    last ? [from, from + fade] : [from, from + fade, to - fade, to],
    last ? [0, 1] : [0, 1, 1, 0]
  );
  const y = useTransform(opacity, [0, 1], [18, 0]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return { opacity, y, pointerEvents };
}

/**
 * Full-screen viewer for the Netra 3D model, opened from the Netra card in the Projects section.
 *
 * - Scroll (wheel or swipe up/down): the cinematic sequence — the model moves/rotates/zooms and three captions appear.
 * - Drag sideways (touch) or in any direction (mouse): turn the model yourself. Pinch to zoom. Double-tap/click resets.
 * - "View projects" (or Esc) closes it and returns to the projects carousel exactly where you were.
 * The page behind is frozen while it is open; the model file is only requested once it is opened.
 */
export default function NetraViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Everything (including the scroll hook that needs the viewer's DOM) is created only when it opens.
  return open ? <ViewerBody open onClose={onClose} /> : null;
}

function ViewerBody({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = projects.find((p) => p.slug === netraShowcase.projectSlug);
  const prefersReduced = !!useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const corridorRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hintGone, setHintGone] = useState(false);

  const enter = useMotionValue(0);
  const manual = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const still = { enter: useMotionValue(1), travel: useMotionValue(0.45) };

  const { scrollYProgress: travel } = useScroll({ container: scrollRef, target: corridorRef, offset: ["start start", "end end"] });

  // open: reset, freeze the page behind, fade the model in
  useEffect(() => {
    if (!open) return;
    setWebgl(hasWebGL());
    setReady(false);
    setFailed(false);
    setHintGone(false);
    manual.current = { yaw: 0, pitch: 0, zoom: 1 };
    enter.set(0);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.__lenis?.stop();
    closeRef.current?.focus();
    return () => {
      html.style.overflow = prevOverflow;
      window.__lenis?.start();
    };
  }, [open, enter]);

  const onReady = useCallback(() => {
    setReady(true);
    if (!prefersReduced) animate(enter, 1, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
    else enter.set(1);
  }, [enter, prefersReduced]);
  const onError = useCallback(() => setFailed(true), []);

  // Esc closes; Tab stays inside the viewer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        const nodes = overlayRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  /* ── drag to turn · pinch to zoom ── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ d: number; zoom: number } | null>(null);
  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) pinchStart.current = { d: dist(), zoom: manual.current.zoom };
    setHintGone(true);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    const m = manual.current;
    if (pointers.current.size === 2 && pinchStart.current) {
      m.zoom = clamp(pinchStart.current.zoom * (dist() / pinchStart.current.d), 0.7, 1.9);
      return;
    }
    m.yaw += (next.x - prev.x) * 0.009;
    // on a touch screen, up/down belongs to scrolling; with a mouse, dragging up/down tilts the model
    if (e.pointerType === "mouse") m.pitch = clamp(m.pitch + (next.y - prev.y) * 0.006, -0.55, 0.55);
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };
  const reset = () => {
    manual.current = { yaw: 0, pitch: 0, zoom: 1 };
  };

  const chapA = useChapter(travel, 0.04, 0.36);
  const chapB = useChapter(travel, 0.36, 0.68);
  const chapC = useChapter(travel, 0.68, 1, true);
  const barScale = useTransform(travel, [0, 1], [0.03, 1]);
  const layerOpacity = useTransform(enter, (e) => clamp01(e * 1.6));
  const layerY = useTransform(enter, [0, 1], [50, 0]);

  if (!open || !project || typeof document === "undefined") return null;

  const reduced = prefersReduced;
  const noScene = webgl === false || failed;
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

  const scene =
    webgl && !failed ? (
      <NetraScene
        url={withBase(netraShowcase.modelPath)}
        enter={reduced ? still.enter : enter}
        travel={reduced ? still.travel : travel}
        reduced={reduced}
        manual={manual}
        active
        onReady={onReady}
        onError={onError}
      />
    ) : null;

  const loading = webgl !== false && !ready && !failed && (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      Loading the 3D model…
    </div>
  );

  return createPortal(
    <div ref={overlayRef} className={`${styles.overlay} starfield`} role="dialog" aria-modal="true" aria-labelledby="netra-title">
      <button ref={closeRef} type="button" className={styles.back} onClick={onClose}>
        <ArrowLeft size={16} aria-hidden /> View projects
      </button>

      {/* the viewer's own scroll area; Lenis (smooth scroll) is told to leave it alone */}
      <div ref={scrollRef} className={styles.scroller} data-lenis-prevent>
        <div ref={corridorRef} className={reduced || noScene ? styles.plainCorridor : styles.corridor}>
          <div className={reduced || noScene ? styles.plainStage : styles.stage}>
            <div className={styles.glow} aria-hidden />

            {!noScene && (
              <motion.div
                className={styles.canvasWrap}
                style={{ opacity: reduced ? 1 : layerOpacity, y: reduced ? 0 : layerY }}
                role="img"
                aria-label={`Interactive 3D model of the ${project.title} hospital scene. Drag to turn it, scroll to explore.`}
              >
                {scene}
              </motion.div>
            )}

            {/* the drag surface: horizontal swipes turn the model, vertical swipes still scroll */}
            {!noScene && (
              <div
                className={styles.dragLayer}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onDoubleClick={reset}
                aria-hidden
              />
            )}

            <div className={styles.headWrap}>{heading}</div>
            {loading}

            {noScene && project.thumbnail && (
              <div className={styles.fallbackMedia}>
                <Image src={withBase(project.thumbnail)} alt={`${project.title} project cover`} fill sizes="(max-width: 900px) 92vw, 70vw" style={{ objectFit: "cover" }} />
                <p className={styles.note}>{netraShowcase.fallbackNote}</p>
              </div>
            )}

            {reduced || noScene ? (
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
            ) : (
              <>
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
                  <span className={styles.hint} data-gone={hintGone || undefined}>
                    Drag to turn · Scroll to explore
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
