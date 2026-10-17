"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { projects, projectsSection, type Project } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import CaseStudy from "./CaseStudy";
import Reveal from "./Reveal";
import styles from "@/styles/projects.module.css";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Desktop (≥ 900px, motion allowed): the section is pinned and vertical
 * scroll drives the card track horizontally — the section is exactly as
 * tall as the horizontal distance, so speed feels 1:1 and nothing jumps.
 * Mobile / reduced motion: a native, swipeable scroll-snap carousel.
 */
export default function ProjectsSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [dims, setDims] = useState({ distance: 0, vw: 1, vh: 1, centers: [] as number[] });
  const [open, setOpen] = useState<Project | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setPinned(mq.matches && !reduced);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  // measure the track so the pinned height maps scroll → translateX exactly
  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const distance = Math.max(0, track.scrollWidth - vw);
      const centers = Array.from(track.children).map((c) => {
        const el = c as HTMLElement;
        return el.offsetLeft + el.offsetWidth / 2;
      });
      setDims({ distance, vw, vh, centers });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dims.distance]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  const openStudy = useCallback((p: Project, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setOpen(p);
  }, []);

  const scrollRail = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
  };

  const header = (
    <div className={`container ${styles.head}`}>
      <div>
        <Reveal>
          <span className="eyebrow">{projectsSection.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id="projects-title" className="section-title display">
            {projectsSection.heading}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={0.1} className={styles.headAside}>
        <p>{projectsSection.intro}</p>
        <span className={styles.count}>
          {String(projects.length).padStart(2, "0")} <span>projects</span>
        </span>
      </Reveal>
    </div>
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={styles.section}
      data-pinned={pinned || undefined}
      aria-labelledby="projects-title"
      style={pinned && dims.distance ? { height: dims.distance + dims.vh } : undefined}
    >
      {pinned ? (
        <div className={styles.sticky}>
          {header}
          <motion.div ref={trackRef} className={styles.track} style={{ x }}>
            {projects.map((p, i) => (
              <ProjectCard
                key={`${p.slug}-${dims.vw}`}
                project={p}
                index={i}
                onOpen={openStudy}
                trackX={x}
                center={dims.centers[i] ?? 0}
                viewportW={dims.vw}
              />
            ))}
          </motion.div>
          <div className={`container ${styles.progressRow}`} aria-hidden>
            <div className={styles.progressBar}>
              <motion.span style={{ scaleX: progressScale }} />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      ) : (
        <div className={styles.mobileWrap}>
          {header}
          <div ref={railRef} className={styles.rail} role="region" aria-label="Projects carousel — swipe sideways" tabIndex={0}>
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} onOpen={openStudy} />
            ))}
          </div>
          <div className={`container ${styles.railControls}`}>
            <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous projects">
              <ArrowLeft size={18} />
            </button>
            <button type="button" onClick={() => scrollRail(1)} aria-label="Next projects">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <CaseStudy
        project={open}
        onClose={() => {
          setOpen(null);
          lastTrigger.current?.focus();
        }}
      />
    </section>
  );
}
