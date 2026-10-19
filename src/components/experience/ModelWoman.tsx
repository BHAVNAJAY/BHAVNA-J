"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { MotionValue } from "motion/react";
import { walkerModel } from "@/data/experience";
import { withBase } from "@/lib/base";

/**
 * Your own Blender model (exported as .glb), walking down the timeline.
 *
 * Two ways it can walk — picked automatically:
 *  1. The file contains a walk animation (e.g. from Mixamo) → the animation
 *     is played forward/backward in step with the scroll.
 *  2. No animation → the legs and arms are found by name ("Left Leg",
 *     "Leg.R", "mixamorigLeftUpLeg", …) and swung like the built-in figure.
 *     Each limb automatically pivots at its top (hip / shoulder), so the
 *     object origins you set in Blender don't matter.
 */

type Props = {
  y: MotionValue<number>;
  facingRef: React.RefObject<number>;
  reduced: boolean;
};

const TARGET_HEIGHT = 1.9; // world units — matches the camera framing

const IS_LEFT = /left|(^|[^a-z])l([^a-z]|$)/i;
const IS_RIGHT = /right|(^|[^a-z])r([^a-z]|$)/i;
const LEG_PART = /leg|thigh|shin|calf|knee|foot|feet|shoe|boot|heel|toe|trouser|pant/i;
const ARM_PART = /arm|sleeve|elbow|hand|wrist|cuff|finger|thumb|palm/i;
// for rigged models only the top bone of each limb is rotated
const UPPER_LEG_BONE = /up.?leg|thigh|(^|[^a-z])leg([^a-z]|$)/i;
const UPPER_ARM_BONE = /(up(per)?.?arm|(^|[^a-z])arm([^a-z]|$))/i;
const NOT_UPPER = /fore|lower|low|hand|shin|calf|foot|toe|twist|roll|end/i;

type Limb = { target: THREE.Object3D; restQ: THREE.Quaternion; parentQ: THREE.Quaternion; parentQInv: THREE.Quaternion };

function listFromConfig(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ModelWoman({ y, facingRef, reduced }: Props) {
  const { scene, animations } = useGLTF(withBase(walkerModel.src));

  const rig = useMemo(() => {
    const model = cloneSkinned(scene) as THREE.Object3D;
    // drop anything that isn't the character (lights / cameras from Blender)
    const junk: THREE.Object3D[] = [];
    model.traverse((o) => {
      if ((o as THREE.Light).isLight || (o as THREE.Camera).isCamera) junk.push(o);
      const m = o as THREE.Mesh;
      if (m.isMesh) m.frustumCulled = false;
    });
    junk.forEach((o) => o.parent?.remove(o));
    model.updateMatrixWorld(true);

    // ── fit: feet on the ground, centred, fixed height ──
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);

    // ── walk animation clip, if any ──
    const clip =
      (walkerModel.walkClip && animations.find((a) => a.name === walkerModel.walkClip)) ||
      animations.find((a) => /walk/i.test(a.name)) ||
      animations[0] ||
      null;

    // ── otherwise: find the limbs ──
    const limbs: { legL: Limb[]; legR: Limb[]; armL: Limb[]; armR: Limb[] } = { legL: [], legR: [], armL: [], armR: [] };
    if (!clip) {
      const cfg = walkerModel.parts;
      const named = {
        legL: listFromConfig(cfg.leftLeg),
        legR: listFromConfig(cfg.rightLeg),
        armL: listFromConfig(cfg.leftArm),
        armR: listFromConfig(cfg.rightArm),
      };
      const groups: Record<keyof typeof limbs, THREE.Object3D[]> = { legL: [], legR: [], armL: [], armR: [] };
      const bones: Record<keyof typeof limbs, THREE.Bone[]> = { legL: [], legR: [], armL: [], armR: [] };

      model.traverse((o) => {
        const n = o.name || "";
        const isBone = (o as THREE.Bone).isBone;
        const isMesh = (o as THREE.Mesh).isMesh && !(o as THREE.SkinnedMesh).isSkinnedMesh;
        if (!isBone && !isMesh) return;
        (Object.keys(named) as (keyof typeof limbs)[]).forEach((k) => {
          if (named[k].length && named[k].includes(n)) (isBone ? bones[k] : groups[k]).push(o as THREE.Bone);
        });
        const anyNamed = Object.values(named).some((l) => l.length);
        if (anyNamed) return; // explicit names given → no guessing
        const side = IS_LEFT.test(n) && !/right/i.test(n) ? "L" : IS_RIGHT.test(n) ? "R" : null;
        if (!side) return;
        if (isBone) {
          if (NOT_UPPER.test(n)) return;
          if (UPPER_LEG_BONE.test(n)) bones[side === "L" ? "legL" : "legR"].push(o as THREE.Bone);
          else if (UPPER_ARM_BONE.test(n) && !/shoulder|clav/i.test(n)) bones[side === "L" ? "armL" : "armR"].push(o as THREE.Bone);
        } else {
          if (LEG_PART.test(n)) groups[side === "L" ? "legL" : "legR"].push(o);
          else if (ARM_PART.test(n)) groups[side === "L" ? "armL" : "armR"].push(o);
        }
      });

      const mk = (target: THREE.Object3D): Limb => {
        const parentQ = new THREE.Quaternion();
        target.parent?.getWorldQuaternion(parentQ);
        return { target, restQ: target.quaternion.clone(), parentQ, parentQInv: parentQ.clone().invert() };
      };

      (Object.keys(limbs) as (keyof typeof limbs)[]).forEach((k) => {
        // rigged: rotate the top bone of the limb
        const topBones = bones[k].filter((b) => !bones[k].some((other) => other !== b && isAncestor(other, b)));
        topBones.forEach((b) => limbs[k].push(mk(b)));
        // separate meshes: wrap all pieces of the limb in a pivot at the top of the limb
        const meshes = groups[k].filter((m) => !groups[k].some((other) => other !== m && isAncestor(other, m)));
        if (meshes.length && !topBones.length) {
          const lb = new THREE.Box3();
          meshes.forEach((m) => lb.union(new THREE.Box3().setFromObject(m)));
          const pivot = new THREE.Group();
          pivot.name = `__pivot_${k}`;
          const c = lb.getCenter(new THREE.Vector3());
          pivot.position.set(c.x, lb.max.y, c.z);
          model.add(pivot);
          pivot.updateMatrixWorld(true);
          meshes.forEach((m) => pivot.attach(m));
          limbs[k].push(mk(pivot));
        }
      });

      if (process.env.NODE_ENV !== "production") {
        const found = Object.fromEntries(Object.entries(limbs).map(([k, v]) => [k, v.length]));
        // eslint-disable-next-line no-console
        console.info("[walker] no walk animation in the model — swinging limbs found by name:", found);
      }
    }

    const mixer = clip ? new THREE.AnimationMixer(model) : null;
    const action = clip && mixer ? mixer.clipAction(clip) : null;
    if (action) {
      action.play();
      action.paused = true; // time is driven by the scroll, not the clock
    }

    return { model, scale, offset, clip, mixer, action, limbs };
  }, [scene, animations]);

  useEffect(
    () => () => {
      rig.mixer?.stopAllAction();
    },
    [rig]
  );

  const outer = useRef<THREE.Group>(null);
  const st = useRef({ phase: 0, amp: 0, yaw: 0, lastY: y.get() });
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), x: new THREE.Vector3(1, 0, 0) }), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    const cur = y.get();
    const dy = cur - s.lastY;
    s.lastY = cur;
    const speed = Math.abs(dy) / Math.max(dt, 1e-3);
    s.amp = THREE.MathUtils.damp(s.amp, reduced ? 0 : Math.min(1, speed / 320), 7, dt);
    s.phase += Math.min(Math.abs(dy), 40) * 0.05;

    if (rig.action && rig.mixer && rig.clip) {
      // scrub the walk animation with the stride; blend back to the rest pose when standing
      const cycle = (s.phase / (Math.PI * 2)) % 1;
      rig.action.time = cycle * rig.clip.duration;
      rig.action.setEffectiveWeight(Math.max(0.0001, s.amp));
      rig.mixer.update(0);
    } else {
      const swing = Math.sin(s.phase) * 0.55 * s.amp;
      const apply = (list: Limb[], angle: number) =>
        list.forEach((l) => {
          // rotate about the model's side-to-side axis, whatever the bone's own axes are
          tmp.q.setFromAxisAngle(tmp.x, angle);
          l.target.quaternion.copy(l.parentQInv).multiply(tmp.q).multiply(l.parentQ).multiply(l.restQ);
        });
      apply(rig.limbs.legL, swing);
      apply(rig.limbs.legR, -swing);
      apply(rig.limbs.armL, -swing * 0.7);
      apply(rig.limbs.armR, swing * 0.7);
    }

    if (outer.current) {
      outer.current.position.y = Math.abs(Math.cos(s.phase)) * 0.03 * s.amp;
      const facing = facingRef.current ?? 0;
      s.yaw = THREE.MathUtils.damp(s.yaw, s.amp > 0.15 ? 0 : facing * 0.62, 4, dt);
      outer.current.rotation.y = s.yaw + THREE.MathUtils.degToRad(walkerModel.rotateY);
    }
  });

  return (
    <group ref={outer}>
      <group scale={rig.scale}>
        <primitive object={rig.model} position={rig.offset} />
      </group>
    </group>
  );
}

function isAncestor(a: THREE.Object3D, b: THREE.Object3D) {
  let p = b.parent;
  while (p) {
    if (p === a) return true;
    p = p.parent;
  }
  return false;
}