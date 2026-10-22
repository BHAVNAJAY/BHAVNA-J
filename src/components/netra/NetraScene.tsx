"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
/** 0 → 1 between a and b, eased. */
const seg = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));
const lerp = THREE.MathUtils.lerp;

/**
 * The exported file is ~295 separate meshes (one per wall, chair, patient…) that share 57 materials.
 * Drawing each one separately is heavy on phones, so bake every mesh into world space and merge all
 * meshes that use the same material: ~57 draw calls instead of ~295, identical picture.
 * Mirrored (negative-scale) pieces get their triangle winding flipped so they don't render inside-out.
 */
function mergeByMaterial(source: THREE.Object3D): THREE.Group {
  source.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const out = new THREE.Group();

  source.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material;
    // Anything unusual (several materials, a texture map) is kept as a normal mesh rather than merged.
    if (Array.isArray(material) || (material as THREE.MeshStandardMaterial).map) {
      const keep = mesh.clone();
      keep.applyMatrix4(mesh.matrixWorld);
      out.add(keep);
      return;
    }

    let g = mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal") g.deleteAttribute(name); // no textures → uv/colour not needed
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (g.index) g = g.toNonIndexed();
    if (mesh.matrixWorld.determinant() < 0) {
      for (const name of ["position", "normal"] as const) {
        const a = g.attributes[name] as THREE.BufferAttribute;
        for (let i = 0; i + 2 < a.count; i += 3) {
          const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1);
          a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2));
          a.setXYZ(i + 2, x, y, z);
        }
        a.needsUpdate = true;
      }
    }
    const list = buckets.get(material) ?? [];
    list.push(g);
    buckets.set(material, list);
  });

  buckets.forEach((list, material) => {
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (merged) {
      out.add(new THREE.Mesh(merged, material));
    } else {
      list.forEach((g) => out.add(new THREE.Mesh(g, material))); // merge refused: still correct, just not batched
    }
  });
  return out;
}

/* ── the model ───────────────────────────────────────────────────────────── */
type SceneProps = {
  url: string;
  /** 0 → 1 while the section slides into view. */
  enter: MotionValue<number>;
  /** 0 → 1 while the section is pinned and the visitor scrolls through it. */
  travel: MotionValue<number>;
  /** Hold one fixed pose (prefers-reduced-motion). */
  reduced: boolean;
  /** Visitor's own turn / tilt / zoom (drag + pinch), added on top of the scroll-driven pose. */
  manual?: MutableRefObject<{ yaw: number; pitch: number; zoom: number }>;
  onReady: () => void;
};

function NetraModel({ url, enter, travel, reduced, manual, onReady }: SceneProps) {
  const { scene } = useGLTF(url, false, false);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const state = useRef({ e: 0, t: reduced ? 0.45 : 0, ready: false, yaw: 0, pitch: 0, zoom: 1 });

  const model = useMemo(() => {
    const merged = mergeByMaterial(scene);
    const box = new THREE.Box3().setFromObject(merged);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    merged.position.sub(center); // centre on the origin so rotation spins around the middle of the scene
    return { merged, radius: sphere.radius };
  }, [scene]);

  useEffect(() => {
    // let the first frame draw, then tell the page the scene is ready (hides the loading state)
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady, model]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = state.current;
    const targetE = reduced ? 1 : enter.get();
    const targetT = reduced ? 0.45 : travel.get();
    // damped, so quick flicks and touch scrolling never make the model jump
    s.e = THREE.MathUtils.damp(s.e, targetE, 6, dt);
    s.t = THREE.MathUtils.damp(s.t, targetT, 5, dt);
    const m = manual?.current;
    s.yaw = THREE.MathUtils.damp(s.yaw, m?.yaw ?? 0, 8, dt);
    s.pitch = THREE.MathUtils.damp(s.pitch, m?.pitch ?? 0, 8, dt);
    s.zoom = THREE.MathUtils.damp(s.zoom, m?.zoom ?? 1, 8, dt);

    // Camera framing that adapts to the screen: fit the model's bounding sphere into the visible area.
    const dist = 14;
    const aspect = size.width / size.height;
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    const visW = visH * aspect;
    const wide = aspect > 1.15;
    const fit = reduced ? Math.min(visH * 0.46, visW * 0.46) / model.radius : Math.min(visH * (wide ? 0.43 : 0.34), visW * (wide ? 0.4 : 0.46)) / model.radius;

    const enterEase = seg(s.e, 0, 1);
    const travelEase = smooth(clamp01(s.t));
    const exit = seg(s.t, 0.94, 1);

    const scale = fit * lerp(0.74, 1, enterEase) * lerp(1, 1.2, travelEase) * lerp(1, 0.95, exit);
    g.scale.setScalar(scale * s.zoom);
    // a slow orbit that keeps the whole interior readable, starting from a high 3/4 view and settling lower
    g.rotation.set(lerp(0.78, 0.4, travelEase) + s.pitch, lerp(-0.95, 0.75, travelEase) + (1 - enterEase) * -0.5 + s.yaw, 0);
    // the plain (reduced-motion) layout shows the model alone in its own box: keep it centred there
    g.position.set(
      reduced ? 0 : (wide ? visW * 0.12 : 0) + lerp(-0.2, 0.25, travelEase),
      reduced ? 0 : (wide ? -visH * 0.06 : visH * 0.11) + (1 - enterEase) * -1.1, // phones: sit above the caption card
      0
    );
    if (!s.ready) {
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      s.ready = true;
    }
  });

  return (
    <group ref={group}>
      <primitive object={model.merged} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#8c7fa8", 1.0]} />
      <directionalLight position={[6, 10, 7]} intensity={2.1} color="#fff6f0" />
      <directionalLight position={[-8, 4, -4]} intensity={0.9} color="#cdb8ff" />
      <pointLight position={[0, 3, 6]} intensity={30} distance={26} color="#ffc4de" />
    </>
  );
}

/** Catches a failed/missing model download so the page can show its fallback instead of crashing. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn("[netra] could not load the 3D model:", err);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function NetraScene(props: SceneProps & { active: boolean; onError: () => void }) {
  const { active, onError, ...scene } = props;
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <SceneBoundary onError={onError}>
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={coarse ? [1, 1.5] : [1, 1.75]}
        camera={{ fov: 30, position: [0, 0, 14], near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // never steal vertical scrolling or clicks from the page
        style={{ touchAction: "pan-y", pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onError();
          });
        }}
      >
        <Lights />
        <Suspense fallback={null}>
          <NetraModel {...scene} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
