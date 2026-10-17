"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

const SEGMENTS = 48;

export type LanyardHandle = {
  /**
   * Rebuild the ribbon for this frame.
   * @param top     fixed anchor above the viewport
   * @param bottom  hang point (where the clip is)
   * @param swing   badge swing around the hang point (rad, z axis)
   * @param yaw     badge rotation around the vertical axis (rad)
   * @param width   ribbon width in world units
   */
  update: (top: THREE.Vector3, bottom: THREE.Vector3, swing: number, yaw: number, width: number) => void;
};

/**
 * A lightweight ribbon instead of cloth simulation: a strip of quads swept
 * along a cubic Bézier from an off-screen anchor down to the clip.
 *  - The lower control point follows the badge's swing, so the strap bends
 *    into the clip instead of pivoting rigidly.
 *  - The strip twists progressively toward the bottom by the badge's yaw, so
 *    when the badge flips the strap twists with it and stays attached.
 */
const Lanyard3D = forwardRef<LanyardHandle, { map: THREE.Texture }>(function Lanyard3D({ map }, ref) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts = (SEGMENTS + 1) * 2;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(verts * 2), 2));
    const idx: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    g.setIndex(idx);
    return g;
  }, []);

  const tmp = useMemo(
    () => ({
      p0: new THREE.Vector3(),
      p1: new THREE.Vector3(),
      p2: new THREE.Vector3(),
      p3: new THREE.Vector3(),
      c: new THREE.Vector3(),
      side: new THREE.Vector3(),
      curve: new THREE.CubicBezierCurve3(),
    }),
    []
  );

  useImperativeHandle(ref, () => ({
    update(top, bottom, swing, yaw, width) {
      const { p0, p1, p2, p3, c, side, curve } = tmp;
      const len = top.distanceTo(bottom);
      p0.copy(top);
      p3.copy(bottom);
      // gentle sag toward the viewer near the top, straight into the clip at the bottom
      p1.set(top.x, top.y - len * 0.35, top.z + 0.08);
      // badge "up" vector after swing: (−sin θ, cos θ)
      p2.set(bottom.x - Math.sin(swing) * len * 0.22, bottom.y + Math.cos(swing) * len * 0.22, bottom.z);
      curve.v0.copy(p0);
      curve.v1.copy(p1);
      curve.v2.copy(p2);
      curve.v3.copy(p3);

      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const uv = geometry.attributes.uv as THREE.BufferAttribute;
      const half = width / 2;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        curve.getPoint(t, c);
        // twist is concentrated toward the badge end, like a real strap
        const tw = yaw * Math.pow(t, 2.2);
        const sw = swing * Math.pow(t, 3);
        side.set(Math.cos(tw), 0, -Math.sin(tw));
        // tilt the width direction with the swing near the clip
        const sx = side.x * Math.cos(sw);
        const sy = side.x * Math.sin(sw);
        pos.setXYZ(i * 2, c.x - sx * half, c.y - sy * half, c.z - side.z * half);
        pos.setXYZ(i * 2 + 1, c.x + sx * half, c.y + sy * half, c.z + side.z * half);
        const v = (1 - t) * len * 0.9;
        uv.setXY(i * 2, 0, v);
        uv.setXY(i * 2 + 1, 1, v);
      }
      pos.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    },
  }));

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial map={map} side={THREE.DoubleSide} roughness={0.85} metalness={0} />
    </mesh>
  );
});

export default Lanyard3D;
