"use client";

import { Edges, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SCENE } from "@/lib/studio/sceneColors";
import { appearanceFor } from "@/lib/studio/appearance";
import { COUNTER_MATERIALS } from "@/lib/studio/kitchen/pricing";
import { buildBoxes, type Box } from "@/lib/studio/kitchen/geometry";
import type { KitchenProject } from "@/lib/studio/kitchen/types";

/**
 * The 3D kitchen.
 *
 * Boxes only, positioned by `buildBoxes` — the same function the plan and the
 * elevation read. Dynamic-imported by the viewer, so three.js never loads for
 * someone who only opens the plan.
 *
 * `focusCabinetId` is what makes the exploded view legible: exploding a whole
 * kitchen at once is a shower of panels, so the exploded mode takes apart the
 * one unit the customer selected.
 */

const S = 0.001;

function boxColour(
  box: Box,
  looks: ReturnType<typeof appearanceFor>,
  counterColour: string
): { color: string; roughness: number; metalness: number } {
  if (box.surface === "counter") return { color: counterColour, roughness: 0.32, metalness: 0.05 };
  if (box.surface === "appliance") return { color: SCENE.appliance, roughness: 0.34, metalness: 0.7 };
  if (box.surface === "hardware") return { color: SCENE.hardware, roughness: 0.3, metalness: 0.8 };
  const a = looks[box.surface as "carcass" | "shutter" | "internal"];
  return { color: a.color, roughness: a.roughness, metalness: a.metalness };
}

function BoxMesh({
  box,
  looks,
  counterColour,
  explode,
  spanMm,
  selected,
  onSelect,
}: {
  box: Box;
  looks: ReturnType<typeof appearanceFor>;
  counterColour: string;
  explode: number;
  spanMm: number;
  selected: boolean;
  onSelect: (box: Box) => void;
}) {
  const [hover, setHover] = useState(false);
  const spread = explode * Math.max(spanMm, 600) * 0.5;
  const pos = useMemo<[number, number, number]>(
    () => [
      (box.center[0] + box.explode[0] * spread * box.explodeScale) * S,
      (box.center[1] + box.explode[1] * spread * box.explodeScale) * S,
      (box.center[2] + box.explode[2] * spread * box.explodeScale) * S,
    ],
    [box, spread]
  );
  const m = boxColour(box, looks, counterColour);

  return (
    <mesh
      position={pos}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(box);
      }}
    >
      <boxGeometry args={[box.size[0] * S, box.size[1] * S, box.size[2] * S]} />
      <meshStandardMaterial
        color={selected ? SCENE.brandLift : m.color}
        roughness={m.roughness}
        metalness={m.metalness}
        emissive={new THREE.Color(hover || selected ? SCENE.brand : SCENE.none)}
        emissiveIntensity={selected ? 0.3 : hover ? 0.14 : 0}
      />
      <Edges threshold={30} color={selected ? SCENE.brand : SCENE.edge} />
    </mesh>
  );
}

/** Frames whatever is on screen — the whole kitchen, or one exploded unit. */
function Rig({ target, radius }: { target: [number, number, number]; radius: number }) {
  const size = useThree((s) => s.size);
  const fit = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fovV = (34 * Math.PI) / 180;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const dist = (radius / Math.tan(Math.min(fovV, fovH) / 2)) * 1.15;
    return {
      position: [target[0] + dist * 0.62, target[1] + radius * 0.75, target[2] + dist * 0.72] as [number, number, number],
      near: Math.max(0.05, dist * 0.02),
      far: dist * 12,
    };
  }, [radius, target, size.width, size.height]);
  return <PerspectiveCamera makeDefault fov={34} position={fit.position} near={fit.near} far={fit.far} />;
}

export interface KitchenScene3DProps {
  project: KitchenProject;
  explode: number;
  focusCabinetId?: string;
  selectedCabinetId: string | null;
  onSelectCabinet: (id: string | null) => void;
  onInspect?: (box: Box | null) => void;
  resetKey: number;
}

export default function KitchenScene3D({
  project,
  explode,
  focusCabinetId,
  selectedCabinetId,
  onSelectCabinet,
  onInspect,
  resetKey,
}: KitchenScene3DProps) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const boxes = useMemo(() => buildBoxes(project, focusCabinetId), [project, focusCabinetId]);
  const looks = useMemo(
    () =>
      appearanceFor({
        carcassId: project.carcassId,
        shutterId: project.shutterId,
        finishId: project.finishId,
        internalId: project.internalId,
      }),
    [project.carcassId, project.shutterId, project.finishId, project.internalId]
  );
  const counterColour =
    COUNTER_MATERIALS.find((c) => c.id === project.countertop.materialId)?.swatch ?? "#e8e4dc";

  useEffect(() => {
    controls.current?.reset();
  }, [resetKey]);

  // Frame the focused unit when exploding one, the room otherwise.
  const { target, radius, spanMm } = useMemo(() => {
    if (boxes.length === 0) {
      return { target: [0, 1, 0] as [number, number, number], radius: 2, spanMm: 2000 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const b of boxes) {
      minX = Math.min(minX, b.center[0] - b.size[0] / 2);
      maxX = Math.max(maxX, b.center[0] + b.size[0] / 2);
      minY = Math.min(minY, b.center[1] - b.size[1] / 2);
      maxY = Math.max(maxY, b.center[1] + b.size[1] / 2);
      minZ = Math.min(minZ, b.center[2] - b.size[2] / 2);
      maxZ = Math.max(maxZ, b.center[2] + b.size[2] / 2);
    }
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    // The frame has to open as the pieces travel, or they leave the screen.
    const grow = 1 + explode * 1.35;
    return {
      target: [((minX + maxX) / 2) * S, ((minY + maxY) / 2) * S, ((minZ + maxZ) / 2) * S] as [number, number, number],
      radius: ((span / 2) * S || 1) * grow,
      spanMm: span,
    };
  }, [boxes, explode]);

  const lightR = Math.max(radius, 1.5);

  return (
    <Canvas
      dpr={[1, 1.6]}
      shadows
      gl={{ antialias: true, powerPreference: "high-performance" }}
      resize={{ debounce: 0, scroll: false }}
      style={{ touchAction: "none", width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#ffffff"]} />
      <hemisphereLight intensity={0.75} groundColor={SCENE.ground} color="#ffffff" />
      <directionalLight position={[lightR * 2, lightR * 3, lightR * 2.4]} intensity={1.45} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-lightR * 2, lightR, -lightR * 1.6]} intensity={0.35} />

      {boxes.map((b) => (
        <BoxMesh
          key={b.id}
          box={b}
          looks={looks}
          counterColour={counterColour}
          explode={explode}
          spanMm={spanMm}
          selected={b.cabinetId != null && b.cabinetId === selectedCabinetId}
          onSelect={(box) => {
            onSelectCabinet(box.cabinetId ?? null);
            onInspect?.(box);
          }}
        />
      ))}

      {/* Floor, only in the room view — an exploded unit floating over a floor
          plane reads as a room, which it is not. */}
      {focusCabinetId ? null : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(project.room.widthMm / 2) * S, 0, (project.room.depthMm / 2) * S]} receiveShadow>
          <planeGeometry args={[project.room.widthMm * S, project.room.depthMm * S]} />
          <meshStandardMaterial color={SCENE.floor} roughness={0.95} />
        </mesh>
      )}

      <Rig target={target} radius={lightR} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.5}
        target={target}
      />
    </Canvas>
  );
}
