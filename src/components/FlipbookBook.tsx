"use client";

import { useCallback, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import type { Page } from "@/data/achievements";
import { withBase } from "@/lib/base";
import styles from "@/styles/achievements.module.css";

export type FlipApi = {
  flipNext: () => void;
  flipPrev: () => void;
  flipTo: (page: number) => void;
  turnTo: (page: number) => void;
};

type PageFlipInstance = {
  flipNext: (corner?: "top" | "bottom") => void;
  flipPrev: (corner?: "top" | "bottom") => void;
  flip: (page: number, corner?: "top" | "bottom") => void;
  turnToPage: (page: number) => void;
};

type FlipBookHandle = {
  pageFlip: () => PageFlipInstance;
};

type Props = {
  pages: Page[];
  aspect: number;
  portrait: boolean;
  flippingTime: number;
  apiRef: React.RefObject<FlipApi | null>;
  onReady: () => void;
  onFlip: (page: number) => void;
  onIdle: () => void;
};

export default function FlipbookBook({
  pages,
  aspect,
  portrait,
  flippingTime,
  apiRef,
  onReady,
  onFlip,
  onIdle,
}: Props) {
  const bookRef = useRef<FlipBookHandle | null>(null);

  const handleInit = useCallback(() => {
    const pageFlip = bookRef.current?.pageFlip();
    if (!pageFlip) return;

    apiRef.current = {
      flipNext: () => pageFlip.flipNext(),
      flipPrev: () => pageFlip.flipPrev(),
      flipTo: (page) => pageFlip.flip(page),
      turnTo: (page) => pageFlip.turnToPage(page),
    };
    onReady();
  }, [apiRef, onReady]);

  return (
    <HTMLFlipBook
      ref={bookRef}
      className={styles.book}
      style={{}}
      width={600}
      height={Math.round(600 / aspect)}
      size="stretch"
      // The library only switches to its one-page layout when the block is narrower than 2 × minWidth.
      // On phones (portrait) that needs a large minWidth, otherwise a 374px-wide book still shows a tiny
      // two-page spread and the page counter drifts out of step with what is on screen.
      minWidth={portrait ? 400 : 160}
      maxWidth={1600}
      minHeight={220}
      maxHeight={2000}
      startPage={0}
      drawShadow
      flippingTime={flippingTime}
      usePortrait={portrait}
      startZIndex={0}
      autoSize={false}
      maxShadowOpacity={0.35}
      showCover
      mobileScrollSupport={false}
      clickEventForward={false}
      useMouseEvents={false}
      swipeDistance={30}
      showPageCorners={false}
      // false: the library only rejects programmatic turns outside its page-corner zones when this is on,
      // and in one-page mode the "turn back" start point sits outside them (no back-turn animation).
      // Mouse/touch handling is off (useMouseEvents={false}), so nothing can flip by tapping.
      disableFlipByClick={false}
      onInit={handleInit}
      onFlip={(event: { data: number }) => onFlip(event.data)}
      onChangeState={(event: { data: string }) => {
        if (event.data === "read") onIdle();
      }}
    >
      {pages.map((page, index) => (
        <div key={`${page.src}-${index}`} className={styles.page}>
          <img src={withBase(page.src)} alt={page.alt} draggable={false} />
          <span
            className={styles.gutterShade}
            data-side={index % 2 === 1 ? "right" : "left"}
            aria-hidden
          />
        </div>
      ))}
    </HTMLFlipBook>
  );
}
