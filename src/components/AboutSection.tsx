"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { about } from "@/data/portfolio";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // slow parallax on the photo for depth
  const photoY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [40, -40]);

  return (
    <section id="about" className={`section ${styles.about}`} aria-labelledby="about-title">
      <div className={`container ${styles.aboutGrid}`} ref={ref}>
        <Reveal className={styles.aboutPhotoWrap}>
          <motion.div className={styles.aboutPhoto} style={{ y: photoY }}>
            <Image src={about.photo} alt={about.photoAlt} fill priority sizes="(max-width: 860px) 90vw, 40vw" style={{ objectFit: "cover", objectPosition: "50% 45%" }} />
          </motion.div>
          <span className={`${styles.photoCaption} serif`}>Bhavna J.</span>
        </Reveal>

        <div className={styles.aboutText}>
          <Reveal delay={0.05}>
            <h2 id="about-title" className={styles.aboutHeading}>
              {about.heading}
            </h2>
          </Reveal>
          {about.paragraphs.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.06}>
              <p className={styles.aboutPara}>{p}</p>
            </Reveal>
          ))}
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
