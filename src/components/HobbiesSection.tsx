import Image from "next/image";
import { hobbies, hobbiesSection } from "@/data/portfolio";
import Reveal from "./Reveal";
import styles from "@/styles/sections.module.css";

export default function HobbiesSection() {
  return (
    <section id="hobbies" className={`section ${styles.hobbies}`} aria-labelledby="hobbies-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">{hobbiesSection.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="hobbies-title" className={`${styles.hobbiesTitle} serif`}>
              {hobbiesSection.heading}
            </h2>
          </Reveal>
        </div>

        <ul className={styles.hobbyList}>
          {hobbies.map((h, i) => (
            <Reveal as="li" key={h.title + i} delay={i * 0.08} className={styles.hobby} >
              <div className={styles.hobbyMedia} data-placeholder={h.placeholder || undefined}>
                {h.image ? (
                  <Image src={h.image} alt={h.title} fill sizes="(max-width: 760px) 90vw, 30vw" style={{ objectFit: "cover" }} loading="lazy" />
                ) : (
                  <span className={styles.hobbyNum} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                {h.placeholder && <span className={styles.placeholderTag}>Placeholder</span>}
              </div>
              <h3>{h.title}</h3>
              <p>{h.description}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
