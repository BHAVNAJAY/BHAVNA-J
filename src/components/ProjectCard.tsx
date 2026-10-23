"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Box } from "lucide-react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import type { Project } from "@/data/projects";
import { withBase } from "@/lib/base";
import { cardPose, type ArcGeometry } from "@/lib/arcGallery";
import styles from "@/styles/projects.module.css";

/** Typographic cover used until a real screenshot is added for the project. */
export function ProjectCover({ project, index }: { project: Project; index: number }) {
  if (project.thumbnail) {
    // On phones the card is a tall poster: the full landscape artwork sits in the middle (nothing cropped)
    // over a blurred copy of itself that fills the rest. On desktop the artwork simply covers the card.
    return (
      <>
        <Image src={withBase(project.thumbnail)} alt="" aria-hidden fill sizes="40vw" className={styles.thumbBg} loading="lazy" />
        <Image
          src={withBase(project.thumbnail)}
          alt={`${project.title} cover`}
          fill
          sizes="(max-width: 900px) 85vw, 50vw"
          className={styles.thumbFg}
          loading="lazy"
        />
      </>
    );
  }
  const h = project.hue;
  return (
    <div
      className={styles.cover}
      style={
        {
          "--h1": `hsl(${h} 45% 22%)`,
          "--h2": `hsl(${(h + 40) % 360} 55% 62%)`,
          "--h3": `hsl(${h} 30% 9%)`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <span className={`${styles.coverNum} display`}>{String(index + 1).padStart(2, "0")}</span>
      <span className={styles.coverOrb} />
    </div>
  );
}

type Props = {
  project: Project;
  index: number;
  onOpen: (p: Project, trigger: HTMLElement) => void;
  /** When set, the card shows a "View 3D model" button that calls this. */
  onView3D?: (trigger: HTMLElement) => void;
  /**
   * Curved gallery: the shared arc, this card's slot, and the scroll-driven position of the whole gallery.
   * Omit for a plain card (e.g. the swipe carousel).
   */
  gallery?: { geometry: ArcGeometry; position: MotionValue<number>; curved: boolean };
};

export default function ProjectCard({ project, index, onOpen, onView3D, gallery }: Props) {
  // Every card is placed on the same arc: its position, depth and turn all come from ONE angle (see lib/arcGallery.ts).
  const idle = useMotionValue(0); // cards outside the gallery (swipe carousel) have no position to follow
  const position = gallery?.position ?? idle;
  const pose = (pos: number) => (gallery ? cardPose(gallery.geometry, index, pos, gallery.curved) : null);
  const x = useTransform(position, (p) => pose(p)?.x ?? 0);
  const z = useTransform(position, (p) => pose(p)?.z ?? 0);
  const rotateY = useTransform(position, (p) => pose(p)?.rotateY ?? 0);
  const opacity = useTransform(position, (p) => pose(p)?.opacity ?? 1);
  const scale = useTransform(position, (p) => pose(p)?.scale ?? 1);
  const pointerEvents = useTransform(position, (p) => (pose(p)?.visible === false ? "none" : "auto"));

  // touch: first tap reveals the info (blurred backdrop), second tap opens the project
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setActive(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [active]);

  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.matchMedia("(hover: none)").matches && !active) {
      setActive(true);
      return;
    }
    if (project.externalUrl) {
      window.open(project.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    onOpen(project, e.currentTarget);
  };

  return (
    <motion.article ref={ref} className={styles.card} style={gallery ? { x, z, rotateY, scale, opacity, pointerEvents } : undefined} data-active={active || undefined}>
      <button
        type="button"
        className={styles.cardButton}
        onClick={handle}
        aria-label={`${project.title} — ${project.category}. ${project.externalUrl ? "Opens project site" : "Open case study"}`}
      >
        <div className={styles.media}>
          <ProjectCover project={project} index={index} />
          <div className={styles.shade} />
          <div className={styles.meta}>
            <span className={styles.category}>{project.category}</span>
            <h3 className={`${styles.cardTitle} display`}>{project.title}</h3>
            <div className={styles.more}>
              <div>
              <p>{project.summary}</p>
              {(project.role || project.stack?.length) && (
                <ul className={styles.tags}>
                  {project.role && <li className={styles.roleTag}>{project.role}</li>}
                  {project.stack?.slice(0, 5).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              <span className={styles.open}>
                {project.demoUrl ? `Explore ${project.title} Live` : project.externalUrl ? "Visit Project" : "View case study"} <ArrowUpRight size={16} aria-hidden />
              </span>
              </div>
            </div>
          </div>
        </div>
      </button>
      {onView3D && (
        <button type="button" className={styles.view3d} onClick={(e) => onView3D(e.currentTarget)} aria-label={`View the ${project.title} 3D model`}>
          <Box size={16} aria-hidden /> View 3D model
        </button>
      )}
    </motion.article>
  );
}
