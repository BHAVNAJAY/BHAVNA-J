"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

/**
 * Physical dimensions of the badge in "badge units" (the whole rig is
 * uniformly scaled to fit the viewport). Ratios follow a standard
 * vertical ID holder (~2:3).
 */
export const CARD = {
  W: 2.0,
  H: 2.95,
  D: 0.075, // acrylic thickness
  R: 0.17, // corner radius
  bevel: 0.022,
  slot: { w: 0.56, h: 0.085, r: 0.042, fromTop: 0.2 },
  insert: { w: 1.8, topInset: 0.36, bottomInset: 0.1, r: 0.09 },
  /** distance from the hang point (lanyard end) down to the card's top edge */
  hang: 0.34,
};
export const INSERT_H = CARD.H - CARD.insert.topInset - CARD.insert.bottomInset;
export const INSERT_CENTER_Y = CARD.H / 2 - CARD.insert.topInset - INSERT_H / 2;
/** card centre relative to the hang point */
export const CARD_OFFSET_Y = -CARD.hang - CARD.H / 2;

function roundedRect<T extends THREE.Path>(path: T, w: number, h: number, r: number, cx = 0, cy = 0): T {
  const x = cx - w / 2;
  const y = cy - h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/** Flat rounded-rect geometry with UVs normalised to 0..1 (ShapeGeometry uses raw coords). */
function insertGeometry(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(new THREE.Shape(), w, h, r), 10);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
  return g;
}

type Props = {
  frontMap: THREE.Texture;
  backMap: THREE.Texture;
  shellMaterialRef?: React.Ref<THREE.MeshPhysicalMaterial>;
};

/**
 * The badge body, built from separate parts:
 *  - extruded acrylic shell with real rounded corners, bevelled edges and a
 *    cut-through attachment slot,
 *  - thin lavender perimeter line on both faces,
 *  - printed insert: one front plane and one back plane, both inside the
 *    same shell, so a single rotation shows the correct reverse side,
 *  - clip assembly (crimp, plastic clip, metal link + bar through the slot).
 * The group's origin is the hang point.
 */
export default function IDCard3D({ frontMap, backMap, shellMaterialRef }: Props) {
  const geo = useMemo(() => {
    const { W, H, D, R, bevel, slot } = CARD;
    // Shell: bevelSize grows the outline, so build the base shape smaller.
    const outer = roundedRect(new THREE.Shape(), W - bevel * 2, H - bevel * 2, R - bevel);
    const slotY = H / 2 - slot.fromTop;
    outer.holes.push(roundedRect(new THREE.Path(), slot.w + bevel * 2, slot.h + bevel * 2, slot.r + bevel, 0, slotY));
    const depth = D - bevel * 2;
    const shell = new THREE.ExtrudeGeometry(outer, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 18,
    });
    shell.translate(0, 0, -depth / 2);
    shell.computeVertexNormals();

    // Perimeter line (a flat ring), drawn on both faces just above the acrylic.
    const ringOuter = roundedRect(new THREE.Shape(), W - 0.045, H - 0.045, R - 0.022);
    ringOuter.holes.push(roundedRect(new THREE.Path(), W - 0.075, H - 0.075, R - 0.037));
    const ring = new THREE.ShapeGeometry(ringOuter, 18);

    const insert = insertGeometry(CARD.insert.w, INSERT_H, CARD.insert.r);
    return { shell, ring, insert, slotY };
  }, []);

  const zFace = CARD.D / 2 + 0.0015;
  const slotYPivot = CARD_OFFSET_Y + geo.slotY; // slot centre relative to hang point
  const clipBottom = -0.25;
  const linkR = (clipBottom - slotYPivot) / 2;

  return (
    <group>
      {/* ── clip assembly ───────────────────────────── */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.19, 0.1, 0.05]} />
        <meshStandardMaterial color="#cfc6dc" metalness={0.55} roughness={0.32} />
      </mesh>
      <RoundedBox args={[0.22, 0.17, 0.08]} radius={0.03} smoothness={4} position={[0, -0.165, 0]}>
        <meshPhysicalMaterial color="#ece6f4" roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.3} />
      </RoundedBox>
      {/* metal link, squashed so it reads as a flat strap passing through the slot */}
      <mesh position={[0, clipBottom - linkR, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.32, 1, 1]}>
        <torusGeometry args={[linkR, 0.014, 10, 40]} />
        <meshStandardMaterial color="#dcd6e6" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, slotYPivot, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.017, 0.017, 0.4, 14]} />
        <meshStandardMaterial color="#e2dcec" metalness={1} roughness={0.2} />
      </mesh>

      {/* ── card ───────────────────────────────────── */}
      <group position={[0, CARD_OFFSET_Y, 0]}>
        {/* printed insert – front & back share one body */}
        <mesh geometry={geo.insert} position={[0, INSERT_CENTER_Y, 0.011]}>
          <meshStandardMaterial map={frontMap} emissiveMap={frontMap} emissive="#ffffff" emissiveIntensity={0.45} roughness={0.62} metalness={0} />
        </mesh>
        <mesh geometry={geo.insert} position={[0, INSERT_CENTER_Y, -0.011]} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial map={backMap} emissiveMap={backMap} emissive="#ffffff" emissiveIntensity={0.45} roughness={0.62} metalness={0} />
        </mesh>
        {/* opaque backing between the two prints so neither shows through */}
        <mesh position={[0, INSERT_CENTER_Y, 0]}>
          <boxGeometry args={[CARD.insert.w - 0.02, INSERT_H - 0.02, 0.018]} />
          <meshStandardMaterial color="#f4edf6" roughness={0.9} />
        </mesh>

        {/* translucent smoky-lavender acrylic shell */}
        <mesh geometry={geo.shell} renderOrder={2}>
          <meshPhysicalMaterial
            ref={shellMaterialRef}
            color="#a593cf"
            transparent
            opacity={0.22}
            roughness={0.1}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.06}
            reflectivity={0.6}
            envMapIntensity={1.4}
            depthWrite={false}
          />
        </mesh>

        {/* lavender perimeter line, front and back */}
        <mesh geometry={geo.ring} position={[0, 0, zFace]} renderOrder={3}>
          <meshBasicMaterial color="#e4d6f8" transparent opacity={0.8} depthWrite={false} />
        </mesh>
        <mesh geometry={geo.ring} position={[0, 0, -zFace]} rotation={[0, Math.PI, 0]} renderOrder={3}>
          <meshBasicMaterial color="#e4d6f8" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
