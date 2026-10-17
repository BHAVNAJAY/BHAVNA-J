"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { badge, site } from "@/data/portfolio";
import FloatingRoles from "./FloatingRoles";
import BadgeFallback from "./hero/BadgeFallback";
import type { BadgeController, Face, Rect } from "./hero/types";
import styles from "@/styles/hero.module.css";

// Three.js only ever runs in the browser.
const BadgeScene = dynamic(() => import("./hero/BadgeScene"), { ssr: false, loading: () => null });

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const fallbackRef = useRef<HTMLButtonElement>(null);
  const reduced = !!useReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const controller = useRef<BadgeController>({
    flipRequests: 0,
    desiredFace: null,
    pointer: { x: 0, y: 0, active: false },
    progress: scrollYProgress,
    reducedMotion: reduced,
  });
  controller.current.reducedMotion = reduced;
  controller.current.progress = scrollYProgress;

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [face, setFace] = useState<Face>("front");
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [active, setActive] = useState(true);
  const [announce, setAnnounce] = useState("");
  const userFlipped = useRef(false);

  useEffect(() => setWebgl(hasWebGL()), []);

  // Pause the WebGL loop entirely when the hero is off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onFaceChange = useCallback((f: Face) => {
    setFace(f);
    if (userFlipped.current) {
      setAnnounce(f === "back" ? `Back of badge: ${badge.back.roles.join(", ")}` : `Front of badge: ${badge.front.name}, ${badge.front.title}`);
    }
  }, []);

  const pointerType = useRef("");

  // Mouse: hover shows the back, leaving shows the front again.
  // Touch / keyboard: tap or Enter / Space toggles.
  const flip = (e: React.MouseEvent) => {
    if (pointerType.current === "mouse" && e.detail > 0) return; // hover already handled it
    userFlipped.current = true;
    controller.current.desiredFace = null;
    controller.current.flipRequests += 1;
  };

  const onPointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    pointerType.current = e.pointerType;
    if (e.pointerType !== "mouse") return;
    userFlipped.current = true;
    controller.current.desiredFace = "back";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    controller.current.pointer = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
      active: true,
    };
  };
  const onPointerLeave = () => {
    if (pointerType.current === "mouse") controller.current.desiredFace = "front";
    controller.current.pointer = { x: 0, y: 0, active: false };
  };

  // fallback: lay labels out around the HTML card instead
  useEffect(() => {
    if (webgl !== false) return;
    const measure = () => {
      const el = fallbackRef.current;
      const parent = el?.closest(`.${styles.stage}`) as HTMLElement | null;
      if (!el || !parent) return;
      const a = el.getBoundingClientRect();
      const p = parent.getBoundingClientRect();
      setRect({ left: a.left - p.left, top: a.top - p.top, width: a.width, height: a.height, containerW: p.width, containerH: p.height });
    };
    measure();
    setReady(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [webgl]);

  // page-level scroll choreography (Motion): soften the stage as it hands over to About
  const stageOpacity = useTransform(scrollYProgress, [0.5, 1], [1, reduced ? 1 : 0.6]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const fallbackY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120]);

  return (
    <section id="home" ref={sectionRef} className={styles.hero} data-reduced={reduced || undefined} aria-label="Introduction">
      <div className={styles.stage}>
        <h1 className="visually-hidden">
          {site.name} — {site.positioning}
        </h1>

        <motion.div className={styles.canvasWrap} style={{ opacity: stageOpacity }}>
          {webgl && (
            <SceneBoundary onError={() => setWebgl(false)}>
              <BadgeScene
                controller={controller}
                hitRef={hitRef}
                active={active}
                onFaceChange={onFaceChange}
                onInteractive={() => setInteractive(true)}
                onRestRect={setRect}
                onReady={() => setReady(true)}
              />
            </SceneBoundary>
          )}
          {webgl === false && (
            <motion.div style={{ y: fallbackY }} className={styles.fallbackHolder}>
              <BadgeFallback
                ref={fallbackRef}
                face={face}
                onFlip={() => {
                  userFlipped.current = true;
                  onFaceChange(face === "front" ? "back" : "front");
                }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Accessible, focusable hit-area that the 3D scene keeps glued to the card */}
        {webgl && (
          <button
            ref={hitRef}
            type="button"
            className={styles.hit}
            data-interactive={interactive || undefined}
            onClick={flip}
            onPointerDown={(e) => (pointerType.current = e.pointerType)}
            onPointerEnter={onPointerEnter}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            aria-label={`${badge.ariaLabel}. Showing the ${face}. Hover, tap, or press Enter or Space to flip.`}
            aria-pressed={face === "back"}
          />
        )}

        <FloatingRoles rect={rect} progress={scrollYProgress} show={ready} reduced={reduced} />

        <motion.p className={styles.tagline} style={{ opacity: hintOpacity }}>
          <span className="serif">Mastering the 3D&rsquo;s</span>
          <span>Design · Development · Digital Marketing</span>
        </motion.p>
        <motion.a href="#about" className={styles.scrollHint} style={{ opacity: hintOpacity }}>
          Scroll
          <span aria-hidden className={styles.scrollLine} />
        </motion.a>

        <p className="visually-hidden" aria-live="polite">
          {announce}
        </p>
      </div>
    </section>
  );
}
