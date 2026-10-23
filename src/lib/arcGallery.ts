/**
 * Geometry of the curved project gallery (Projects section).
 *
 * The cards sit on ONE shared cylinder, side by side with a small gap:
 *   card i is at angle  φ = (i − position) · step   (0 = straight ahead, + = to the right)
 *   x = R · sin φ        sideways position along the arc
 *   z = −CURVE · R · (1 − cos φ)   depth: with CURVE = 1 the sides curve away into the distance
 *   rotateY = CURVE · φ  each panel is turned to follow the surface, so the centre faces you and the edges turn away
 * Scrolling changes `position` (0 … n−1), which slides every card round the arc together.
 *
 *   CURVE = +1  → like the outside of a drum: edges recede and turn away (the reference).
 *   CURVE = −1  → like the inside of a bowl: edges come toward you.
 */
export const CURVE = 1;

/**
 * Zoom "pop": a card is POP_FAR times its size when it is a full card-slot away from the centre and
 * POP_CENTRE times its size when it is exactly in the middle, easing smoothly in between as you scroll.
 */
export const POP_FAR = 0.92;
export const POP_CENTRE = 1.1;

export type ArcGeometry = {
  /** card width in px */
  width: number;
  /** gap between neighbouring cards in px (measured along the arc) */
  gap: number;
  /** radius of the cylinder in px */
  radius: number;
  /** angle between neighbouring cards, in radians */
  step: number;
  /** CSS perspective distance in px */
  perspective: number;
};

export function arcGeometry(viewportWidth: number): ArcGeometry {
  const phone = viewportWidth < 900;
  const width = phone ? Math.min(viewportWidth * 0.78, 400) : Math.min(Math.max(viewportWidth * 0.34, 300), 560);
  const gap = phone ? 8 : 12;
  // radius ≈ 2.4 card-widths: edges curve away clearly without squashing the cards
  const radius = width * (phone ? 2.1 : 2.4);
  return { width, gap, radius, step: (width + gap) / radius, perspective: phone ? 1000 : 1500 };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where one card sits for a given gallery position. `curved = false` gives a plain flat reel (reduced motion). */
export function cardPose(g: ArcGeometry, index: number, position: number, curved: boolean) {
  const delta = index - position;
  if (!curved) {
    return { x: delta * (g.width + g.gap), z: 0, rotateY: 0, scale: 1, opacity: 1, visible: Math.abs(delta) < 3 };
  }
  const phi = delta * g.step;
  const deg = (phi * 180) / Math.PI;
  const away = Math.abs(deg);
  const near = 1 - smooth(Math.min(1, Math.abs(delta))); // 1 when centred → 0 one slot away
  return {
    x: g.radius * Math.sin(phi),
    z: -CURVE * g.radius * (1 - Math.cos(phi)),
    rotateY: CURVE * deg,
    scale: POP_FAR + (POP_CENTRE - POP_FAR) * near,
    // panels that have turned nearly edge-on fade out instead of showing a sliver
    opacity: 1 - smooth(Math.min(1, Math.max(0, (away - 62) / 30))),
    visible: away < 84,
  };
}
