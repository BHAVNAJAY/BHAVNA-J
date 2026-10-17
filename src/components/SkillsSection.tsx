import { BarChart3, Code2, PenTool, Wrench } from "lucide-react";
import { skills } from "@/data/portfolio";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

const ICONS = { pen: PenTool, code: Code2, chart: BarChart3 };

export default function SkillsSection() {
  return (
    <section id="skills" className={`section ${styles.skills}`} aria-labelledby="skills-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Toolkit</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="skills-title" className="section-title display">
              {skills.heading.split("&")[0]}
              <span className="serif" style={{ color: "var(--pink)", textTransform: "none" }}>
                &amp;
              </span>
              {skills.heading.split("&")[1]}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className={styles.lede}>{skills.intro}</p>
          </Reveal>
        </div>

        <div className={styles.skillCols}>
          {skills.groups.map((g, gi) => {
            const Icon = ICONS[g.icon];
            return (
              <Reveal key={g.title} delay={gi * 0.08} className={styles.skillCol}>
                <div className={styles.skillHead}>
                  <span className={styles.skillNum}>{String(gi + 1).padStart(2, "0")}</span>
                  <Icon size={18} strokeWidth={1.6} aria-hidden />
                </div>
                <h3 className={styles.skillTitle}>{g.title}</h3>
                <ul className={styles.skillList}>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>

        <Reveal className={styles.extraTools}>
          <span className={styles.extraLabel}>
            <Wrench size={15} strokeWidth={1.6} aria-hidden /> {skills.additional.title}
          </span>
          <ul>
            {skills.additional.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
