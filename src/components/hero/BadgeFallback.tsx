"use client";

import { forwardRef } from "react";
import { badge } from "@/data/portfolio";
import type { Face } from "./types";
import styles from "@/styles/hero.module.css";

/**
 * Shown only when WebGL is unavailable (very old devices, disabled GPU).
 * A static, still-flippable HTML badge so the hero never renders empty.
 */
const BadgeFallback = forwardRef<HTMLButtonElement, { face: Face; onFlip: () => void }>(function BadgeFallback(
  { face, onFlip },
  ref
) {
  const f = badge.front;
  const b = badge.back;
  return (
    <div className={styles.fallback}>
      <span className={styles.fallbackStrap} aria-hidden />
      <button
        ref={ref}
        type="button"
        className={styles.fallbackCard}
        data-face={face}
        onClick={onFlip}
        aria-label={`${badge.ariaLabel}. Showing the ${face}. Press to flip.`}
      >
        <span className={styles.fallbackInner}>
          <span className={styles.fallbackFront}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badge.portrait} alt="" />
            <strong className="display">{f.name}</strong>
            <span>{f.title}</span>
          </span>
          <span className={styles.fallbackBack}>
            <em className="serif">{b.heading}</em>
            {b.roles.map((r) => (
              <strong key={r} className="display">
                {r}
              </strong>
            ))}
          </span>
        </span>
      </button>
    </div>
  );
});

export default BadgeFallback;
