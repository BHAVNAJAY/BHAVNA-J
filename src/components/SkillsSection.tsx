import {
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  Code2,
  Database,
  Eye,
  Languages,
  LayoutDashboard,
  MessageSquare,
  Network,
  PenTool,
  Plug,
  Search,
  Shapes,
  Sparkles,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import { skills } from "@/data/portfolio";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

const GROUP_ICONS: Record<string, LucideIcon> = { pen: PenTool, code: Code2, chart: BarChart3, ai: BrainCircuit };

/** Marks for skills that have no brand logo. */
const SKILL_ICONS: Record<string, LucideIcon> = {
  database: Database,
  plug: Plug,
  layout: LayoutDashboard,
  shapes: Shapes,
  pen: PenTool,
  badge: BadgeCheck,
  sparkles: Sparkles,
  message: MessageSquare,
  terminal: SquareTerminal,
  search: Search,
  network: Network,
  bot: Bot,
  languages: Languages,
  eye: Eye,
};

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
        </div>

        <div className={styles.skillCols}>
          {skills.groups.map((g, gi) => {
            const GroupIcon = GROUP_ICONS[g.icon];
            return (
              <Reveal key={g.title} delay={(gi % 2) * 0.08} className={styles.skillCol}>
                <div className={styles.skillHead}>
                  <span className={styles.skillNum}>{String(gi + 1).padStart(2, "0")}</span>
                  <GroupIcon size={18} strokeWidth={1.6} aria-hidden />
                </div>
                <h3 className={styles.skillTitle}>{g.title}</h3>
                <ul className={styles.skillChips}>
                  {g.items.map((it) => {
                    const Icon = it.icon ? SKILL_ICONS[it.icon] : undefined;
                    return (
                      <li key={it.name}>
                        {it.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.logo} alt="" width={18} height={18} loading="lazy" className={styles.chipLogo} />
                        ) : Icon ? (
                          <Icon size={16} strokeWidth={1.7} aria-hidden className={styles.chipIcon} />
                        ) : null}
                        {it.name}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
