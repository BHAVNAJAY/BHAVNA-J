"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { about } from "@/data/portfolio";
import { withBase } from "@/lib/base";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // slow parallax on the photo for depth
  const photoY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [40, -40]);

  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-heading">
      <div className={`container ${styles.aboutHead}`}>
        <Reveal>
          <h2 id="about-heading" className={`${styles.aboutTitle} display`}>
            {about.title}
          </h2>
        </Reveal>
      </div>
      <div className={`container ${styles.aboutGrid}`} ref={ref}>
        <div className={styles.aboutLeft}>
          <Reveal className={styles.aboutPhotoWrap}>
            <motion.div className={styles.aboutPhoto} style={{ y: photoY }}>
              <Image src={withBase(about.photo)} alt={about.photoAlt} fill priority sizes="(max-width: 860px) 90vw, 40vw" style={{ objectFit: "cover", objectPosition: "50% 45%" }} />
            </motion.div>
          </Reveal>
        </div>

        <div className={styles.aboutText}>
          <Reveal delay={0.05}>
            <h3 className={styles.aboutHeading}>
              {about.heading}
            </h3>
          </Reveal>
          {about.paragraphs.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.06}>
              <p className={styles.aboutPara}>{p}</p>
            </Reveal>
          ))}
          <Reveal delay={0.1 + about.paragraphs.length * 0.06}>
            <p className={`${styles.signoff} display`}>{about.signoff}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <dl className={styles.facts}>
              {about.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
