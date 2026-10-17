import { ArrowUpRight, Download } from "lucide-react";
import { resume } from "@/data/portfolio";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

export default function ResumeSection({ available }: { available: boolean }) {
  const missing = !available;

  return (
    <section id="resume" className={`section ${styles.resume}`} aria-labelledby="resume-title">
      <div className={`container ${styles.resumeInner}`}>
        <div>
          <Reveal>
            <span className="eyebrow">Curriculum vitae</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="resume-title" className="section-title display">
              {resume.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className={styles.lede}>{missing ? "The latest version of my resume is on its way — check back soon." : resume.line}</p>
          </Reveal>
        </div>
        <Reveal delay={0.15} className={styles.resumeActions}>
          <a
            className="btn btn-primary"
            href={missing ? undefined : resume.path}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={missing || undefined}
            aria-label="View resume (opens PDF in a new tab)"
          >
            View resume <ArrowUpRight size={17} aria-hidden />
          </a>
          <a
            className="btn"
            href={missing ? undefined : resume.path}
            download={resume.downloadName}
            aria-disabled={missing || undefined}
            aria-label="Download resume as PDF"
          >
            Download <Download size={17} aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
