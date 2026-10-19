"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import { projects, type Project } from "@/data/projects";
import { ProjectCover } from "./ProjectCard";
import { withBase } from "@/lib/base";
import styles from "@/styles/projects.module.css";

const SECTIONS: { key: keyof NonNullable<Project["caseStudy"]>; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Solution" },
  { key: "contribution", label: "My contribution" },
  { key: "process", label: "Process" },
  { key: "results", label: "Results" },
];

/**
 * Accessible case-study view built on the native <dialog> element:
 * focus is trapped, Esc closes it and focus returns to the card.
 * Sections only render when data exists in src/data/projects.ts.
 */
export default function CaseStudy({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (project && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!project && d.open) d.close();
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [project]);

  const cs = project?.caseStudy;
  const filled = SECTIONS.filter((s) => typeof cs?.[s.key] === "string" && cs?.[s.key]);
  const index = project ? Math.max(0, projects.findIndex((p) => p.slug === project.slug)) : 0;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="case-title"
      onClose={onClose}
      onClick={(e) => {
        // click on the backdrop closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {project && (
        <div className={styles.dialogInner}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close case study">
            <X size={20} />
          </button>

          <div className={styles.dialogHero}>
            <ProjectCover project={project} index={index} />
          </div>

          <div className={styles.dialogBody}>
            <span className="eyebrow">{project.category}</span>
            <h2 id="case-title" className={`${styles.dialogTitle} display`}>
              {project.title}
            </h2>
            <p className={styles.dialogSummary}>{project.summary}</p>

            <dl className={styles.dialogFacts}>
              {project.role && (
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
              )}
              {project.stack?.length ? (
                <div>
                  <dt>Technology</dt>
                  <dd>{project.stack.join(" · ")}</dd>
                </div>
              ) : null}
            </dl>

            {filled.length > 0 ? (
              filled.map((s) => (
                <section key={s.key} className={styles.csBlock}>
                  <h3>{s.label}</h3>
                  <p>{cs?.[s.key] as string}</p>
                </section>
              ))
            ) : (
              <p className={styles.csSoon}>The full case study for this project is being written up — check back soon.</p>
            )}

            {cs?.screenshots?.length ? (
              <div className={styles.shots}>
                {cs.screenshots.map((sh) => (
                  <div key={sh.src} className={styles.shot}>
                    <Image src={withBase(sh.src)} alt={sh.alt} fill sizes="(max-width: 900px) 90vw, 45vw" style={{ objectFit: "cover" }} loading="lazy" />
                  </div>
                ))}
              </div>
            ) : null}

            {(project.demoUrl || project.repoUrl) && (
              <div className={styles.links}>
                {project.demoUrl && (
                  <a className="btn btn-primary" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    Live demo <ArrowUpRight size={16} aria-hidden />
                  </a>
                )}
                {project.repoUrl && (
                  <a className="btn" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <GithubIcon size={16} /> Repository
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
