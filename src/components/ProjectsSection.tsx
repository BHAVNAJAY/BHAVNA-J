"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { projects, projectsSection, type Project } from "@/data/projects";
import { arcGeometry } from "@/lib/arcGallery";
import ProjectCard from "./ProjectCard";
import CaseStudy from "./CaseStudy";
import NetraViewer from "./NetraViewer";
import { netraShowcase } from "@/data/netra";
import Reveal from "./Reveal";
import styles from "@/styles/projects.module.css";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Motion allowed (desktop and phones): the section is pinned and vertical
 * scroll drives the card track horizontally — the section is exactly as
 * tall as the horizontal distance, so speed feels 1:1 and nothing jumps.
 * Reduced motion: a native, swipeable scroll-snap carousel.
 */
export default function ProjectsSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [dims, setDims] = useState({ vw: 1280, vh: 800 });
  const [open, setOpen] = useState<Project | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const [view3d, setView3d] = useState(false);

  // Pinned on every screen size, phones included. The sideways slide is driven directly by the
  // visitor's own scrolling (it never plays on its own), so it stays on even when the phone is in a
  // battery-saver / "reduce motion" mode — those settings otherwise swapped it for a plain carousel.
  useIsoLayoutEffect(() => {
    setPinned(true);
  }, []);

  // measure the viewport (the arc and the pinned height both depend on it)
  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // phone browsers resize the window as the address bar slides away — keep the first height
      // unless the change is a real one (rotation / desktop resize), so the section never jitters
      setDims((d) => {
        const keepVh = d.vw === vw && d.vh > 1 && Math.abs(d.vh - vh) < 160;
        return { vw, vh: keepVh ? d.vh : vh };
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // Scrolling slides the whole gallery along the arc: position 0 = first card centred … n−1 = last card centred.
  const position = useTransform(scrollYProgress, [0, 1], [0, projects.length - 1]);
  const geometry = arcGeometry(dims.vw);
  // each card takes about 70% of a screen of scrolling to pass through the centre
  const sectionHeight = dims.vh + (projects.length - 1) * Math.max(380, dims.vh * 0.7);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  const openStudy = useCallback((p: Project, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setOpen(p);
  }, []);

  const open3D = useCallback((trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setView3d(true);
  }, []);
  const close3D = useCallback(() => {
    setView3d(false);
    window.setTimeout(() => lastTrigger.current?.focus(), 0);
  }, []);

  const scrollRail = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
  };

  const header = (
    <div className={`container ${styles.head}`}>
      <div>
        <Reveal delay={0.05}>
          <h2 id="projects-title" className="section-title display">
            {projectsSection.heading}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={0.1} className={styles.headAside}>
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
      className={`${styles.section} starfield`}
      data-pinned={pinned || undefined}
      aria-labelledby="projects-title"
      style={pinned ? { height: sectionHeight } : undefined}
    >
      {pinned ? (
        <div className={styles.sticky} style={{ perspective: geometry.perspective }}>
          {header}
          {/* one shared 3D space: every card is placed on the same cylinder (see lib/arcGallery.ts) */}
          <div ref={trackRef} className={styles.track} style={{ ["--card-w" as string]: `${geometry.width}px` }}>
            {projects.map((p, i) => (
              <ProjectCard
                key={p.slug}
                project={p}
                index={i}
                onOpen={openStudy}
                onView3D={p.slug === netraShowcase.projectSlug ? open3D : undefined}
                gallery={{ geometry, position, curved: !reduced }}
              />
            ))}
          </div>
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
              <ProjectCard key={p.slug} project={p} index={i} onOpen={openStudy} onView3D={p.slug === netraShowcase.projectSlug ? open3D : undefined} />
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

      <NetraViewer open={view3d} onClose={close3D} />

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
