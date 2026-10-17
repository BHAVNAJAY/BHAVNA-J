"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { walkerModel } from "@/data/experience";
import ModelWoman from "./ModelWoman";

/** If the .glb fails to load, quietly show the built-in figure instead. */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn("[walker] could not load the 3D model, using the built-in figure:", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * A stylised 3D woman in a black blazer suit, built entirely from code
 * (no model files). She walks while the page scrolls her along the
 * timeline, and when she stops at an experience she turns toward it.
 *
 *  y          – her position on the line (px); its movement drives the walk cycle
 *  facingRef  – -1 = turn toward a card on the left, 1 = right, 0 = face forward
 */
type Props = {
  y: MotionValue<number>;
  facingRef: React.RefObject<number>;
  active: boolean;
  reduced: boolean;
};

const C = {
  blazer: "#16141a",
  lapel: "#2a2630",
  trousers: "#121015",
  shoes: "#0a090b",
  shirt: "#f7f2f5",
  // ── skin tone: pick one (or any hex colour) ──
  //   "#f1d3bf" fair · "#e0b394" light · "#c68e6a" medium · "#a8704f" tan · "#7d4f33" deep · "#5a3824" rich
  skin: "#c68e6a",
  hair: "#1b1210",
  gold: "#d8b26a",
};

function Woman({ y, facingRef, reduced }: Omit<Props, "active">) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const st = useRef({ phase: 0, amp: 0, yaw: 0, lastY: y.get() });

  const geo = useMemo(() => {
    // Fitted blazer: a lathe profile (radius, height) from waist to shoulders.
    const torsoPts = [
      [0.0, 0.98],
      [0.172, 0.98],
      [0.158, 1.06],
      [0.152, 1.13],
      [0.17, 1.25],
      [0.196, 1.36],
      [0.206, 1.44],
      [0.192, 1.5],
      [0.12, 1.555],
      [0.05, 1.57],
      [0.0, 1.57],
    ].map(([r, h]) => new THREE.Vector2(r, h));
    const torso = new THREE.LatheGeometry(torsoPts, 28);

    const tri = (pts: [number, number][]) => {
      const s = new THREE.Shape();
      s.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => s.lineTo(p[0], p[1]));
      s.closePath();
      return new THREE.ShapeGeometry(s);
    };
    const shirt = tri([
      [-0.068, 1.52],
      [0.068, 1.52],
      [0, 1.27],
    ]);
    const lapelL = tri([
      [-0.068, 1.52],
      [-0.118, 1.43],
      [-0.018, 1.27],
      [0, 1.27],
    ]);
    const lapelR = tri([
      [0.068, 1.52],
      [0.118, 1.43],
      [0.018, 1.27],
      [0, 1.27],
    ]);

    return { torso, shirt, lapelL, lapelR };
  }, []);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => (g as THREE.BufferGeometry).dispose?.());
    },
    [geo]
  );

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    const cur = y.get();
    const dy = cur - s.lastY;
    s.lastY = cur;
    const speed = Math.abs(dy) / Math.max(dt, 1e-3); // px per second

    // walk cycle: stride advances with distance travelled
    const targetAmp = reduced ? 0 : Math.min(1, speed / 320);
    s.amp = THREE.MathUtils.damp(s.amp, targetAmp, 7, dt);
    s.phase += Math.min(Math.abs(dy), 40) * 0.05;
    const swing = Math.sin(s.phase) * 0.8 * s.amp;

    if (legL.current && legR.current) {
      legL.current.rotation.x = swing;
      legR.current.rotation.x = -swing;
    }
    if (armL.current && armR.current) {
      armL.current.rotation.x = -swing * 0.75;
      armR.current.rotation.x = swing * 0.75;
    }
    if (foreL.current && foreR.current) {
      foreL.current.rotation.x = -0.18 - 0.35 * s.amp - Math.max(0, swing) * 0.4;
      foreR.current.rotation.x = -0.18 - 0.35 * s.amp - Math.max(0, -swing) * 0.4;
    }

    const t = state.clock.elapsedTime;
    if (root.current) {
      // bob while walking, breathe while standing
      root.current.position.y = Math.abs(Math.cos(s.phase)) * 0.035 * s.amp;
      // walking → face forward; standing at an experience → turn toward its card
      const facing = facingRef.current ?? 0;
      const targetYaw = s.amp > 0.15 ? 0 : facing * 0.62;
      s.yaw = THREE.MathUtils.damp(s.yaw, targetYaw, 4, dt);
      root.current.rotation.y = s.yaw;
    }
    if (torso.current && !reduced) {
      torso.current.scale.y = 1 + Math.sin(t * 1.6) * 0.006 * (1 - s.amp);
      torso.current.rotation.z = Math.sin(s.phase) * 0.03 * s.amp;
    }
    if (head.current) {
      const facing = facingRef.current ?? 0;
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, s.amp > 0.15 ? 0 : -facing * 0.08, 4, dt);
      head.current.rotation.x = reduced ? 0 : Math.sin(t * 0.9) * 0.025;
    }
  });

  const blazer = <meshStandardMaterial color={C.blazer} roughness={0.5} metalness={0.12} />;
  const skin = <meshStandardMaterial color={C.skin} roughness={0.65} />;
  const hair = <meshStandardMaterial color={C.hair} roughness={0.85} />;

  return (
    <group ref={root}>
      {/* ── legs (pivot at hip) ── */}
      {[
        { ref: legL, x: -0.085 },
        { ref: legR, x: 0.085 },
      ].map(({ ref, x }) => (
        <group key={x} ref={ref} position={[x, 0.93, 0]}>
          <mesh position={[0, -0.43, 0]}>
            <cylinderGeometry args={[0.072, 0.064, 0.86, 18]} />
            <meshStandardMaterial color={C.trousers} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.875, 0.045]}>
            <boxGeometry args={[0.085, 0.055, 0.2]} />
            <meshStandardMaterial color={C.shoes} roughness={0.25} metalness={0.2} />
          </mesh>
        </group>
      ))}

      <group ref={torso}>
        {/* hips + blazer hem */}
        <mesh position={[0, 0.94, 0]} scale={[1.18, 1, 0.74]}>
          <cylinderGeometry args={[0.168, 0.19, 0.16, 28]} />
          {blazer}
        </mesh>
        {/* blazer body */}
        <mesh geometry={geo.torso} scale={[1.18, 1, 0.74]}>{blazer}</mesh>
        {/* shirt V + lapels + button */}
        <mesh geometry={geo.shirt} position={[0, 0, 0.152]}>
          <meshStandardMaterial color={C.shirt} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.lapelL} position={[0, 0, 0.156]} rotation={[0, -0.18, 0]}>
          <meshStandardMaterial color={C.lapel} roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.lapelR} position={[0, 0, 0.156]} rotation={[0, 0.18, 0]}>
          <meshStandardMaterial color={C.lapel} roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.2, 0.124]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* shoulders */}
        {[-0.222, 0.222].map((x) => (
          <mesh key={x} position={[x, 1.49, 0]}>
            <sphereGeometry args={[0.068, 18, 18]} />
            {blazer}
          </mesh>
        ))}

        {/* ── arms (pivot at shoulder, elbow joint) ── */}
        {[
          { ref: armL, fore: foreL, x: -0.238, tilt: 0.07 },
          { ref: armR, fore: foreR, x: 0.238, tilt: -0.07 },
        ].map(({ ref, fore, x, tilt }) => (
          <group key={x} ref={ref} position={[x, 1.48, 0]} rotation={[0, 0, tilt]}>
            <mesh position={[0, -0.17, 0]}>
              <cylinderGeometry args={[0.058, 0.052, 0.34, 16]} />
              {blazer}
            </mesh>
            <group ref={fore} position={[0, -0.34, 0]}>
              <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.051, 0.046, 0.3, 16]} />
                {blazer}
              </mesh>
              <mesh position={[0, -0.33, 0.005]} scale={[0.85, 1.15, 0.7]}>
                <sphereGeometry args={[0.045, 16, 16]} />
                {skin}
              </mesh>
            </group>
          </group>
        ))}

        {/* neck */}
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.044, 0.05, 0.1, 16]} />
          {skin}
        </mesh>

        {/* ── head ── */}
        <group ref={head} position={[0, 1.76, 0]}>
          <mesh scale={[0.92, 1.06, 0.96]}>
            <sphereGeometry args={[0.125, 32, 32]} />
            {skin}
          </mesh>
          {/* eyes */}
          {[-0.042, 0.042].map((x) => (
            <mesh key={x} position={[x, 0.012, 0.112]}>
              <sphereGeometry args={[0.011, 10, 10]} />
              <meshStandardMaterial color="#1a1214" roughness={0.3} />
            </mesh>
          ))}
          {/* soft smile */}
          <mesh position={[0, -0.05, 0.112]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.022, 0.005, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#7a3b3b" roughness={0.5} />
          </mesh>
          {/* hoop earrings */}
          {[-0.112, 0.112].map((x) => (
            <mesh key={x} position={[x, -0.045, 0.01]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.02, 0.004, 8, 20]} />
              <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.25} />
            </mesh>
          ))}
          {/* hair: crown + back of head */}
          <mesh position={[0, 0.035, -0.03]} scale={[1.02, 0.98, 1]}>
            <sphereGeometry args={[0.136, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            {hair}
          </mesh>
          <mesh position={[0, 0.0, -0.04]}>
            <sphereGeometry args={[0.135, 24, 24]} />
            {hair}
          </mesh>
          {/* straight hair: one smooth sheet down the back… */}
          <mesh position={[0, -0.2, -0.075]} scale={[1.22, 1, 0.5]}>
            <capsuleGeometry args={[0.12, 0.34, 8, 20]} />
            {hair}
          </mesh>
          {/* …and two straight panels framing the face, falling over the shoulders */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.112, -0.19, 0.005]} scale={[0.85, 1, 0.75]}>
              <capsuleGeometry args={[0.042, 0.38, 6, 14]} />
              {hair}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function AimCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 1.0, 0);
  }, [camera]);
  return null;
}

export default function Businesswoman3D({ y, facingRef, active, reduced }: Props) {
  // Use the Blender model when public/models/woman.glb exists, otherwise the built-in figure.
  const [mode, setMode] = useState<"checking" | "model" | "builtin">(walkerModel.src ? "checking" : "builtin");
  useEffect(() => {
    if (!walkerModel.src) return;
    let alive = true;
    fetch(walkerModel.src, { method: "HEAD" })
      .then((r) => alive && setMode(r.ok ? "model" : "builtin"))
      .catch(() => alive && setMode("builtin"));
    return () => {
      alive = false;
    };
  }, []);

  const builtin = <Woman y={y} facingRef={facingRef} reduced={reduced} />;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 1.05, 5.4], fov: 26 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <AimCamera />
      <hemisphereLight args={["#fff6fa", "#d9a7bd", 0.9]} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.7} color="#fff3ec" />
      <directionalLight position={[-3, 2, -2]} intensity={0.9} color="#f1b6d0" />
      {mode === "builtin" && builtin}
      {mode === "model" && (
        <ModelBoundary fallback={builtin}>
          <Suspense fallback={null}>
            <ModelWoman y={y} facingRef={facingRef} reduced={reduced} />
          </Suspense>
        </ModelBoundary>
      )}
    </Canvas>
  );
}