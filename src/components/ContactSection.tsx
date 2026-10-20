import { ArrowUpRight, Download, FileText, Mail } from "lucide-react";
import { contact, resume } from "@/data/portfolio";
import { withBase } from "@/lib/base";
import { BehanceIcon, LinkedinIcon } from "./BrandIcons";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

export default function ContactSection({ resumeAvailable }: { resumeAvailable: boolean }) {
  const resumeOk = resumeAvailable;

  const links = [
    {
      key: "email",
      icon: <Mail size={22} strokeWidth={1.5} aria-hidden />,
      label: "Email",
      sub: contact.email,
      href: `mailto:${contact.email}`,
      indicator: <ArrowUpRight size={20} aria-hidden />,
    },
    {
      key: "linkedin",
      icon: <LinkedinIcon size={22} />,
      label: "LinkedIn",
      sub: contact.linkedin ? "Connect professionally" : "Profile link coming soon",
      href: contact.linkedin || undefined,
      external: true,
      indicator: <ArrowUpRight size={20} aria-hidden />,
    },
    {
      key: "behance",
      icon: <BehanceIcon size={22} />,
      label: "Behance",
      sub: contact.behance ? "See my design work" : "Portfolio link coming soon",
      href: contact.behance || undefined,
      external: true,
      indicator: <ArrowUpRight size={20} aria-hidden />,
    },
    {
      key: "resume",
      icon: <FileText size={22} strokeWidth={1.5} aria-hidden />,
      label: "Resume",
      sub: resumeOk === false ? "Coming soon" : "View or download my resume",
      href: resumeOk === false ? undefined : withBase(resume.path),
      external: true,
      indicator: <Download size={18} aria-hidden />,
    },
  ];

  return (
    <section id="contact" className={`section starfield ${styles.contact}`} aria-labelledby="contact-title">
      <div className={`container ${styles.contactInner}`}>
        <Reveal>
          <h2 id="contact-title" className={`${styles.contactTitle} display`}>
            {contact.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className={`${styles.contactSub} serif`}>{contact.subtitle}</p>
        </Reveal>

        <ul className={styles.contactList}>
          {links.map((l, i) => (
            <Reveal as="li" key={l.key} delay={0.08 + i * 0.06}>
              <a
                className={styles.contactLink}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noopener noreferrer" : undefined}
                aria-disabled={!l.href || undefined}
              >
                <span className={styles.contactIcon}>{l.icon}</span>
                <span className={styles.contactText}>
                  <strong>{l.label}</strong>
                  <span>{l.sub}</span>
                </span>
                <span className={styles.contactArrow}>{l.indicator}</span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
