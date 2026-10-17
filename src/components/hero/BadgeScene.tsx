"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { badge } from "@/data/portfolio";
import IDCard3D, { CARD, CARD_OFFSET_Y, INSERT_H } from "./IDCard3D";
import Lanyard3D, { type LanyardHandle } from "./Lanyard3D";
import { INSERT_PX_W, drawBack, drawFront, drawRibbon, loadBadgeFonts, loadImage } from "./badgeTextures";
import { T, autoFlips, dropOffset, entranceSwing, flipBump, flipValue, type FlipTween } from "./timeline";
import type { BadgeController, Face, Rect } from "./types";

type SceneProps = {
  controller: React.RefObject<BadgeController>;
  hitRef: React.RefObject<HTMLButtonElement | null>;
  active: boolean;
  onFaceChange: (f: Face) => void;
  onInteractive: () => void;
  onRestRect: (r: Rect) => void;
  onReady: () => void;
};

type Textures = { front: THREE.CanvasTexture; back: THREE.CanvasTexture; ribbon: THREE.CanvasTexture };

/* ── Layout: fit the badge to the viewport ───────────────── */
function useLayout() {
  const { viewport, camera, size } = useThree();
  return useMemo(() => {
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const aspect = size.width / size.height;
    const portrait = aspect < 0.9;
    const totalH = CARD.H; // card body height in badge units
    // Desktop: badge ~60% of viewport height, leaving the sides for labels.
    // Portrait/mobile: narrower, leaving bands above & below for labels.
    const s = portrait
      ? Math.min((0.5 * vp.height) / totalH, (0.66 * vp.width) / CARD.W)
      : Math.min((0.6 * vp.height) / totalH, (0.3 * vp.width) / CARD.W);
    const cardCenterY = portrait ? -0.01 * vp.height : -0.045 * vp.height;
    const restPivotY = cardCenterY - CARD_OFFSET_Y * s;
    const topAnchorY = vp.height / 2 + 0.6;
    // start the drop with the whole card above the top edge
    const restBottom = cardCenterY - (CARD.H / 2) * s;
    const dropHeight = (vp.height / 2 + 0.15 - restBottom) / s;
    return { vp, s, restPivotY, topAnchorY, dropHeight, portrait };
  }, [viewport, camera, size]);
}

/* ── The animated rig ───────────────────────────────────── */
function Rig({ controller, hitRef, active, onFaceChange, onInteractive, onRestRect, onReady }: SceneProps) {
  const { gl, camera, size, clock, invalidate } = useThree();
  const layout = useLayout();
  const [tex, setTex] = useState<Textures | null>(null);

  const pivot = useRef<THREE.Group>(null);
  const swingGroup = useRef<THREE.Group>(null);
  const yawGroup = useRef<THREE.Group>(null);
  const lanyard = useRef<LanyardHandle>(null);
  const shellMat = useRef<THREE.MeshPhysicalMaterial>(null);

  // timeline state (mutable, never triggers renders)
  const s = useRef({
    t0: -1,
    userTween: null as FlipTween | null,
    seenRequests: 0,
    face: "front" as Face,
    interactiveSent: false,
    tiltX: 0,
    tiltY: 0,
    hover: 0,
    yaw: 0,
    lastHit: "",
  });

  // Build the canvas textures once fonts + portrait are ready.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, portrait] = await Promise.all([loadBadgeFonts(), loadImage(badge.portrait)]);
      if (cancelled) return;
      const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
      const make = (w: number, h: number, draw: (c: HTMLCanvasElement) => void, repeat = false) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        draw(c);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = aniso;
        if (repeat) t.wrapT = THREE.RepeatWrapping;
        return t;
      };
      const ih = Math.round((INSERT_PX_W * INSERT_H) / CARD.insert.w);
      setTex({
        front: make(INSERT_PX_W, ih, (c) => drawFront(c, portrait)),
        back: make(INSERT_PX_W, ih, (c) => drawBack(c)),
        ribbon: make(64, 256, drawRibbon, true),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [gl]);

  useEffect(
    () => () => {
      tex?.front.dispose();
      tex?.back.dispose();
      tex?.ribbon.dispose();
    },
    [tex]
  );

  useEffect(() => {
    if (!tex) return;
    s.current.t0 = clock.elapsedTime;
    onReady();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);

  // Report the badge's resting screen rectangle (for laying out the labels).
  const projectRect = (pivotY: number, scale: number) => {
    const v = new THREE.Vector3();
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    const top = pivotY - CARD.hang * scale;
    const bottom = pivotY + CARD_OFFSET_Y * scale - (CARD.H / 2) * scale;
    for (const [x, y] of [
      [-CARD.W / 2, top],
      [CARD.W / 2, top],
      [-CARD.W / 2, bottom],
      [CARD.W / 2, bottom],
    ]) {
      v.set(x * scale, y, 0).project(camera);
      const px = ((v.x + 1) / 2) * size.width;
      const py = ((1 - v.y) / 2) * size.height;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY, containerW: size.width, containerH: size.height };
  };

  useEffect(() => {
    onRestRect(projectRect(layout.restPivotY, layout.s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, size]);

  const v3 = useMemo(() => ({ top: new THREE.Vector3(), bottom: new THREE.Vector3() }), []);

  useFrame((_, dtRaw) => {
    const st = s.current;
    const ctl = controller.current;
    if (!pivot.current || !swingGroup.current || !yawGroup.current || st.t0 < 0 || !ctl) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const reduced = ctl.reducedMotion;
    // Reduced motion: skip the choreographed sequence entirely.
    const t = reduced ? T.done + 10 : clock.elapsedTime - st.t0;
    const p = ctl.progress?.get() ?? 0; // hero scroll progress 0..1
    const scrollP = reduced ? 0 : p;

    /* 1. user flip requests take priority over the auto sequence */
    // (a click during the drop-in is queued until the badge has landed)
    const toggle = ctl.flipRequests !== st.seenRequests;
    const wanted = ctl.desiredFace && ctl.desiredFace !== st.face ? ctl.desiredFace : null;
    if ((toggle || wanted) && t >= T.entrance) {
      if (toggle) st.seenRequests += 1;
      {
        const next: Face = toggle ? (st.face === "front" ? "back" : "front") : wanted!;
        const to = next === "back" ? Math.PI : 0;
        const dist = Math.abs(to - st.yaw) / Math.PI;
        st.userTween = {
          from: st.yaw,
          to,
          start: t,
          dur: reduced ? 0.45 : Math.max(0.35, 0.85 * dist),
          overshoot: !reduced,
        };
        st.face = next;
        onFaceChange(next);
      }
    }

    /* 2. yaw (rotation about the strap axis) */
    let yaw = 0;
    let sway = 0;
    if (st.userTween) {
      yaw = flipValue(st.userTween, t);
      sway = flipBump(st.userTween, t) * 0.03 * Math.sign(st.userTween.to - st.userTween.from);
    } else if (!reduced) {
      const [out, back] = autoFlips();
      const f = t < T.flipBack ? out : back;
      yaw = t < T.flipOut ? 0 : flipValue(f, t);
      sway = flipBump(f, t) * 0.035 * Math.sign(f.to - f.from);
      const logical: Face = t >= T.flipOut + T.flipDur / 2 && t < T.flipBack + T.flipDur / 2 ? "back" : "front";
      if (logical !== st.face) {
        st.face = logical;
        onFaceChange(logical);
      }
    }
    st.yaw = yaw;

    /* 3. hover tilt (only once the visitor can interact) */
    const hoverEnabled = !reduced && (t >= T.done || st.userTween !== null);
    const ptr = ctl.pointer;
    const targetTx = hoverEnabled && ptr.active ? -ptr.y * 0.09 : 0;
    const targetTy = hoverEnabled && ptr.active ? ptr.x * 0.16 : 0;
    st.tiltX = THREE.MathUtils.damp(st.tiltX, targetTx, 6, dt);
    st.tiltY = THREE.MathUtils.damp(st.tiltY, targetTy, 6, dt);
    st.hover = THREE.MathUtils.damp(st.hover, hoverEnabled && ptr.active ? 1 : 0, 5, dt);

    if (!st.interactiveSent && t >= T.entrance) {
      st.interactiveSent = true;
      onInteractive();
    }

    /* 4. hang point position: drop-in + scroll lift */
    const scale = layout.s * (1 - 0.22 * scrollP);
    const drop = reduced ? 0 : dropOffset(t, layout.dropHeight) * layout.s;
    const pivotY = layout.restPivotY + drop + scrollP * 0.2 * layout.vp.height;

    /* 5. swing around the hang point */
    const idle = !reduced && t > T.done ? 0.008 * Math.sin(0.85 * (t - T.done)) * Math.min(1, (t - T.done) / 1.5) : 0;
    const swing = (reduced ? 0 : entranceSwing(t)) + sway + idle;

    pivot.current.position.set(0, pivotY, 0);
    pivot.current.scale.setScalar(scale);
    swingGroup.current.rotation.z = swing;
    yawGroup.current.rotation.set(st.tiltX, yaw + st.tiltY, 0);

    // subtle highlight on hover: the acrylic catches a little more light
    if (shellMat.current) shellMat.current.envMapIntensity = 1.4 + st.hover * 0.9;

    /* 6. lanyard follows the hang point, swing and twist */
    v3.top.set(0, layout.topAnchorY + 0.4, -0.35);
    v3.bottom.set(0, pivotY, 0);
    lanyard.current?.update(v3.top, v3.bottom, swing, yaw + st.tiltY, 0.17 * scale);

    /* 7. keep the HTML hit area glued to the card */
    const hit = hitRef.current;
    if (hit) {
      const r = projectRect(pivotY, scale);
      const key = `${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0}`;
      if (key !== st.lastHit) {
        st.lastHit = key;
        hit.style.transform = `translate(${r.left}px, ${r.top}px)`;
        hit.style.width = `${r.width}px`;
        hit.style.height = `${r.height}px`;
      }
    }
  });

  // Keep rendering one frame when re-activated so positions are fresh.
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);

  if (!tex) return null;

  return (
    <>
      <Lanyard3D ref={lanyard} map={tex.ribbon} />
      <group ref={pivot}>
        <group ref={swingGroup}>
          <group ref={yawGroup}>
            <IDCard3D frontMap={tex.front} backMap={tex.back} shellMaterialRef={shellMat} />
          </group>
        </group>
      </group>
    </>
  );
}

/* ── Canvas wrapper ─────────────────────────────────────── */
export default function BadgeScene(props: SceneProps) {
  return (
    <Canvas
      // Render only while the hero is on screen; nothing runs once scrolled away.
      frameloop={props.active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 26, near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      {/* soft key + fill; the environment supplies reflections on acrylic & metal */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[-3, 4, 6]} intensity={1.35} color="#fff6fb" />
      <directionalLight position={[4, -1, 3]} intensity={0.45} color="#d9c8f2" />
      <Environment resolution={128} frames={1}>
        {/* procedural studio: no HDR download needed */}
        <Lightformer form="rect" intensity={2.2} position={[0, 3, 4]} scale={[8, 2.5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-5, 0, 2]} rotation={[0, Math.PI / 2.5, 0]} scale={[1.2, 8, 1]} color="#efbad4" />
        <Lightformer form="rect" intensity={1.4} position={[5, 0, 2]} rotation={[0, -Math.PI / 2.5, 0]} scale={[1.2, 8, 1]} color="#d9c8f2" />
        <Lightformer form="ring" intensity={0.8} position={[0, -2, -5]} scale={4} color="#8f7ab8" />
      </Environment>
      <Rig {...props} />
    </Canvas>
  );
}
