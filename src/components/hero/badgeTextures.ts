/**
 * Canvas-drawn artwork for the badge inserts and the lanyard ribbon.
 *
 * Drawing the inserts in a 2D canvas (instead of a baked image) keeps every
 * word editable from src/data/portfolio.ts and lets the portrait be swapped
 * by replacing a single file. The canvases become THREE.CanvasTexture maps.
 */
import { badge } from "@/data/portfolio";

export const INSERT_PX_W = 1024;

const C = {
  paper: "#fbf5f9",
  paper2: "#f4edf8",
  ink: "#1d1726",
  inkSoft: "#5d5070",
  meta: "#8b7f9d",
  line: "#e6dbee",
  pink: "#efbad4",
  pinkDeep: "#d986b0",
  lavender: "#d9c8f2",
  lavDeep: "#8d6fc4",
  peach: "#f8d6bd",
  peachDeep: "#d0895a",
};

const F = {
  display: "'Archivo Variable', 'Arial Black', sans-serif",
  body: "'Manrope Variable', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
};

/** Wait for the web fonts used on the badge so the first draw is correct. */
export async function loadBadgeFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = [
    `800 64px ${F.display}`,
    `900 64px ${F.display}`,
    `600 32px ${F.body}`,
    `700 32px ${F.body}`,
    `italic 400 48px ${F.serif}`,
  ];
  try {
    await Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s))),
      new Promise((r) => setTimeout(r, 2500)), // never block the hero on fonts
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ── helpers ─────────────────────────────────────────────── */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Ctx = CanvasRenderingContext2D;

function setFont(ctx: Ctx, font: string, stretch = "normal") {
  ctx.font = font;
  if ("fontStretch" in ctx) {
    try {
      // Chromium/Safari 17+: selects the wdth axis of the variable display font
      (ctx as unknown as { fontStretch: string }).fontStretch = stretch;
    } catch {
      /* unsupported */
    }
  }
}

/** Draw text with manual tracking (letter-spacing) – works in every browser. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "right" = "left") {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let cx = align === "right" ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + tracking;
  });
  ctx.textAlign = prev;
  return total;
}

/** Largest font size (≤ max) at which `text` fits in `maxWidth`. */
function fitSize(ctx: Ctx, text: string, family: string, weight: number, max: number, maxWidth: number, stretch = "normal") {
  let size = max;
  for (; size > 12; size -= 2) {
    setFont(ctx, `${weight} ${size}px ${family}`, stretch);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return size;
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C.paper);
  g.addColorStop(1, C.paper2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // faint print grain so the insert reads as card stock, not a flat colour
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = i % 2 ? "#6b5a80" : "#ffffff";
    ctx.fillRect((i * 9301 + 49297) % w, (i * 233280 + 7) % h, 2, 2);
  }
  ctx.globalAlpha = 1;
}

/** Fine keyline inset from the insert's (square) edge. */
function frame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const inset = 22;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
}

/** Deterministic decorative barcode. */
function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed = 7) {
  ctx.fillStyle = C.ink;
  let cx = x;
  let s = seed;
  while (cx < x + w) {
    s = (s * 16807) % 2147483647;
    const bw = 2 + (s % 4) * 1.6;
    if (cx + bw > x + w) break;
    ctx.fillRect(cx, y, bw, h);
    s = (s * 16807) % 2147483647;
    cx += bw + 2 + (s % 3) * 2;
  }
}

/* ── FRONT ───────────────────────────────────────────────── */

export function drawFront(canvas: HTMLCanvasElement, portrait: HTMLImageElement | null) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d") as Ctx;
  const p = 60;
  const f = badge.front;
  paper(ctx, W, H);
  frame(ctx, W, H);

  // meta row
  ctx.fillStyle = C.meta;
  ctx.textBaseline = "middle";
  setFont(ctx, `700 21px ${F.body}`);
  spaced(ctx, f.metaLeft, p, 80, 5);

  // portrait window
  const px = p,
    py = 118,
    pw = W - p * 2,
    ph = H - 118 - 262, // portrait runs down to the name block, which is anchored to the bottom
    pr = 34;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, pr);
  ctx.clip();
  const bg = ctx.createLinearGradient(px, py, px + pw, py + ph);
  bg.addColorStop(0, "#f6d3e4");
  bg.addColorStop(1, "#e2d5f6");
  ctx.fillStyle = bg;
  ctx.fillRect(px, py, pw, ph);

  if (portrait) {
    // cover-crop around the configured focus point
    const { x: fx, y: fy, zoom } = badge.portraitFocus;
    const scale = Math.max(pw / portrait.width, ph / portrait.height) * zoom;
    const dw = portrait.width * scale;
    const dh = portrait.height * scale;
    let dx = px + pw / 2 - fx * dw;
    let dy = py + ph / 2 - fy * dh;
    dx = Math.min(px, Math.max(px + pw - dw, dx));
    dy = Math.min(py, Math.max(py + ph - dh, dy));
    ctx.drawImage(portrait, dx, dy, dw, dh);
    // tint the (white) studio backdrop towards the brand blush
    ctx.globalCompositeOperation = "multiply";
    const tint = ctx.createLinearGradient(px, py, px + pw * 0.4, py + ph);
    tint.addColorStop(0, "#f9dcea");
    tint.addColorStop(1, "#f1eaf9");
    ctx.fillStyle = tint;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(px, py, pw, ph);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  } else {
    // No photo supplied: a neutral monogram, never a generated face.
    ctx.fillStyle = "rgba(29,23,38,0.55)";
    setFont(ctx, `900 220px ${F.display}`, "ultra-expanded");
    ctx.textAlign = "center";
    ctx.fillText("BJ", px + pw / 2, py + ph / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();
  roundRect(ctx, px + 1, py + 1, pw - 2, ph - 2, pr);
  ctx.strokeStyle = "rgba(141,111,196,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // bottom block: name + title on the left; signature, barcode and name tag on the right
  const by = py + ph; // bottom edge of the portrait
  const leftW = 560;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  const nameSize = fitSize(ctx, f.name, F.display, 900, 104, leftW, "ultra-expanded");
  setFont(ctx, `900 ${nameSize}px ${F.display}`, "ultra-expanded");
  ctx.fillText(f.name, p - 2, by + 112);
  ctx.fillStyle = C.inkSoft;
  const tSize = fitSize(ctx, f.title, F.body, 600, 40, leftW);
  setFont(ctx, `600 ${tSize}px ${F.body}`);
  ctx.fillText(f.title, p, by + 174);

  ctx.fillStyle = C.lavDeep;
  setFont(ctx, `italic 400 68px ${F.serif}`);
  ctx.textAlign = "right";
  ctx.fillText(f.signature, W - p, by + 92);
  ctx.textAlign = "left";
  barcode(ctx, W - p - 240, by + 116, 240, 58);
  ctx.fillStyle = C.meta;
  setFont(ctx, `700 16px ${F.body}`);
  spaced(ctx, "BHAVNA J.", W - p, by + 200, 6, "right");
}

/* ── BACK ────────────────────────────────────────────────── */

type IconKind = "code" | "pen" | "people";

function icon(ctx: CanvasRenderingContext2D, kind: IconKind, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "code") {
    ctx.moveTo(cx - 12, cy - 20);
    ctx.lineTo(cx - 30, cy);
    ctx.lineTo(cx - 12, cy + 20);
    ctx.moveTo(cx + 12, cy - 20);
    ctx.lineTo(cx + 30, cy);
    ctx.lineTo(cx + 12, cy + 20);
    ctx.moveTo(cx + 5, cy - 26);
    ctx.lineTo(cx - 5, cy + 26);
    ctx.stroke();
  } else if (kind === "pen") {
    // pen nib
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx + 22, cy + 6);
    ctx.lineTo(cx, cy + 30);
    ctx.lineTo(cx - 22, cy + 6);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx, cy + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // people / facilitator
    ctx.arc(cx - 13, cy - 12, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 15, cy - 8, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy + 26);
    ctx.quadraticCurveTo(cx - 13, cy - 4, cx + 8, cy + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 10);
    ctx.quadraticCurveTo(cx + 18, cy + 2, cx + 32, cy + 22);
    ctx.stroke();
  }
  ctx.restore();
}

const ROLE_STYLE: { fill: string; ink: string; icon: IconKind }[] = [
  { fill: C.lavender, ink: C.lavDeep, icon: "code" },
  { fill: "#f7cfe2", ink: C.pinkDeep, icon: "pen" },
  { fill: C.peach, ink: C.peachDeep, icon: "people" },
];

export function drawBack(canvas: HTMLCanvasElement, qr: HTMLImageElement | null = null) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d") as Ctx;
  const p = 60;
  const b = badge.back;
  paper(ctx, W, H);
  frame(ctx, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  setFont(ctx, `700 50px ${F.body}`);
  ctx.fillText(b.heading, p, 132);
  ctx.fillStyle = C.meta;
  setFont(ctx, `700 18px ${F.body}`);
  spaced(ctx, "BHAVNA J.", W - p, 124, 6, "right");

  const rowH = 210;
  const gap = 30;
  b.roles.forEach((role, i) => {
    const y = 182 + i * (rowH + gap);
    const st = ROLE_STYLE[i % ROLE_STYLE.length];
    roundRect(ctx, p, y, W - p * 2, rowH, 30);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    roundRect(ctx, p + 40, y + (rowH - 116) / 2, 116, 116, 28);
    ctx.fillStyle = st.fill;
    ctx.fill();
    icon(ctx, st.icon, p + 98, y + rowH / 2, st.ink);

    ctx.fillStyle = C.ink;
    ctx.textBaseline = "middle";
    const size = fitSize(ctx, role.toUpperCase(), F.display, 800, 64, W - p * 2 - 330, "ultra-expanded");
    setFont(ctx, `800 ${size}px ${F.display}`, "ultra-expanded");
    ctx.fillText(role.toUpperCase(), p + 196, y + rowH / 2 + 4);

    ctx.fillStyle = C.meta;
    setFont(ctx, `700 22px ${F.body}`);
    spaced(ctx, String(i + 1).padStart(2, "0"), W - p - 40, y + rowH / 2, 4, "right");
    ctx.textBaseline = "alphabetic";
  });

  // "Connect with Me" + curved arrow → QR, in the free space under the role rows
  const qrBox = 262;
  const qx = W - p - qrBox;
  const qy = 912;
  if (qr) {
    roundRect(ctx, qx, qy, qrBox, qrBox, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.imageSmoothingEnabled = false; // keep the QR modules crisp
    ctx.drawImage(qr, qx + 16, qy + 16, qrBox - 32, qrBox - 32);
    ctx.imageSmoothingEnabled = true;
  }

  ctx.fillStyle = C.ink;
  const [first, ...rest] = b.connect.split(" ");
  const lines = [first, rest.join(" ")].filter(Boolean);
  const cSize = fitSize(ctx, lines.reduce((a, l) => (l.length > a.length ? l : a), ""), F.serif, 400, 96, qx - p - 70);
  setFont(ctx, `italic 400 ${cSize}px ${F.serif}`);
  lines.forEach((l, i) => ctx.fillText(l, p + 6, 985 + i * (cSize * 0.98)));

  if (qr) {
    // hand-drawn curved arrow: from under the text, sweeping up into the QR
    const sx = p + 40;
    const sy = 985 + (lines.length - 1) * (cSize * 0.98) + 44;
    const ex = qx - 18;
    const ey = qy + qrBox * 0.6;
    const c1x = sx + 150;
    const c1y = sy + 78;
    const c2x = ex - 120;
    const c2y = ey + 70;
    ctx.strokeStyle = C.pinkDeep;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.stroke();
    const ang = Math.atan2(ey - c2y, ex - c2x);
    ctx.beginPath();
    ctx.moveTo(ex - 30 * Math.cos(ang - 0.5), ey - 30 * Math.sin(ang - 0.5));
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex - 30 * Math.cos(ang + 0.5), ey - 30 * Math.sin(ang + 0.5));
    ctx.stroke();
  }

  ctx.fillStyle = C.line;
  ctx.fillRect(p, 1215, W - p * 2, 2);

  ctx.fillStyle = C.meta;
  setFont(ctx, `700 18px ${F.body}`);
  spaced(ctx, "DEVELOPER · DESIGNER · FACILITATOR", p, H - 92, 4);
  barcode(ctx, W - p - 230, H - 140, 230, 64, 11);
}

/* ── LANYARD ─────────────────────────────────────────────── */

export function drawRibbon(canvas: HTMLCanvasElement) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#efbad4";
  ctx.fillRect(0, 0, W, H);
  // woven texture: fine horizontal ribs
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(255,255,255,0.10)" : "rgba(120,60,90,0.06)";
    ctx.fillRect(0, y, W, 2);
  }
  // folded edges, slightly darker
  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "rgba(150,70,110,0.28)");
  edge.addColorStop(0.12, "rgba(150,70,110,0)");
  edge.addColorStop(0.88, "rgba(150,70,110,0)");
  edge.addColorStop(1, "rgba(150,70,110,0.28)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
  // stitching
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let y = 0; y < H; y += 16) {
    ctx.fillRect(W * 0.16, y, 2, 8);
    ctx.fillRect(W * 0.84 - 2, y, 2, 8);
  }
}
