"use client";

import { Edges, Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SCENE } from "@/lib/studio/sceneColors";
import { appearanceFor, boardAppearance, type SurfaceAppearance } from "@/lib/studio/appearance";
import type { FurnitureLayout, Metrics, Panel, SurfaceGroup } from "@/lib/studio/geometry";
import { buildPanels } from "@/lib/studio/geometry";
import { buildHotspots, type Hotspot, type SpecIds } from "@/lib/studio/partMaterials";
import { inr } from "@/lib/studio/format";

/**
 * The 3D view. Loaded only when the visitor asks for it — see FurnitureViewer,
 * which dynamic-imports this file — so nobody pays for three.js to read the
 * elevation.
 *
 * Everything on screen is a box positioned from the same `buildPanels` output
 * the SVG elevation reads. There are no models to download and the whole scene
 * is a few hundred triangles, which is what lets it run on a mid-range phone.
 */

/** Model millimetres to scene units. 1 unit = 1 metre keeps the camera sane. */
const S = 0.001;

// --------------------------------------------------------------- textures ---

/**
 * Woodgrain, drawn once into a canvas rather than fetched.
 *
 * A real laminate shade image is the right thing eventually, and
 * `SurfaceAppearance.textureUrl` is the seam for it. Until those exist, a
 * procedural grain communicates "this is a woodgrain finish, not a solid
 * colour" at zero network cost — which is the actual job at this fidelity.
 */
function makeGrainTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Long, slightly wandering lines along one axis — the only thing that
  // separates grain from noise at a glance.
  for (let i = 0; i < 150; i += 1) {
    const y = Math.random() * size;
    const dark = Math.random() * 0.22;
    ctx.strokeStyle = `rgba(90,60,35,${dark})`;
    ctx.lineWidth = Math.random() * 2.4 + 0.3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin((x / size) * Math.PI * 2 + i) * 3.5);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ----------------------------------------------------------------- panels ---

/**
 * Opening a door is a rotation about its hinge edge, not about its centre — so
 * the leaf is offset inside a group whose origin sits on that edge. Getting
 * this wrong is what makes a door look like it is floating away from the
 * carcass instead of swinging on it.
 */
function doorTransform(
  panel: Panel,
  open: number,
  doorType: string
): { pivot: [number, number, number]; offset: [number, number, number]; rotationY: number } {
  const halfW = panel.size[0] / 2;
  if (doorType === "sliding") {
    // Sliding leaves travel sideways across the opening; nothing rotates.
    return {
      pivot: [panel.center[0] + (panel.slide ?? 1) * halfW * 0.92 * open, panel.center[1], panel.center[2]],
      offset: [0, 0, 0],
      rotationY: 0,
    };
  }
  const sign = panel.hinge === "left" ? -1 : 1;
  return {
    pivot: [panel.center[0] + sign * halfW, panel.center[1], panel.center[2]],
    offset: [-sign * halfW, 0, 0],
    // Negative for a right-hinged leaf so both doors open towards the viewer.
    rotationY: -sign * open * (Math.PI / 2) * 0.82,
  };
}

function PanelMesh({
  panel,
  appearance,
  explode,
  grainTexture,
  selected,
  dimmed,
  onSelect,
  panelSpan,
  doorOpen,
  doorType,
}: {
  panel: Panel;
  appearance: SurfaceAppearance;
  explode: number;
  /** Largest dimension of the whole object, mm — sets the explode distance. */
  panelSpan: number;
  grainTexture: THREE.Texture;
  selected: boolean;
  dimmed: boolean;
  onSelect: (panel: Panel) => void;
  /** 0 = closed, 1 = fully open. Only read on shutters. */
  doorOpen: number;
  doorType: string;
}) {
  const [hovered, setHovered] = useState(false);

  // Separation is a fraction of the object itself. A flat 260 mm was invisible
  // against a 2.4 m wardrobe and would have blown a vanity apart — the point of
  // the view is reading the construction, and that is a proportion, not a
  // distance.
  const spread = explode * Math.max(panelSpan, 600) * 0.42;
  const isDoor = panel.role === "shutter" || panel.role === "loft-shutter";

  const { position, offset, rotationY } = useMemo(() => {
    const disp: [number, number, number] = [
      panel.explode[0] * spread * panel.explodeScale,
      panel.explode[1] * spread * panel.explodeScale,
      panel.explode[2] * spread * panel.explodeScale,
    ];
    // A door that is being taken off the carcass should not also be swinging;
    // the explode distance wins as the pieces separate.
    const swing = isDoor ? doorOpen * (1 - Math.min(1, explode * 1.6)) : 0;
    const t = isDoor
      ? doorTransform(panel, swing, doorType)
      : { pivot: panel.center, offset: [0, 0, 0] as [number, number, number], rotationY: 0 };
    return {
      position: [
        (t.pivot[0] + disp[0]) * S,
        (t.pivot[1] + disp[1]) * S,
        (t.pivot[2] + disp[2]) * S,
      ] as [number, number, number],
      offset: [t.offset[0] * S, t.offset[1] * S, t.offset[2] * S] as [number, number, number],
      rotationY: t.rotationY,
    };
  }, [panel, spread, isDoor, doorOpen, doorType, explode]);


  const map = appearance.grain > 0.3 ? grainTexture : null;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
    <mesh
      position={offset}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(panel);
      }}
    >
      <boxGeometry args={[panel.size[0] * S, panel.size[1] * S, panel.size[2] * S]} />
      <meshStandardMaterial
        color={selected ? SCENE.brandLift : appearance.color}
        roughness={appearance.roughness}
        metalness={appearance.metalness}
        map={map}
        transparent={dimmed}
        opacity={dimmed ? 0.16 : 1}
        emissive={hovered || selected ? new THREE.Color(SCENE.brand) : new THREE.Color(SCENE.none)}
        emissiveIntensity={selected ? 0.28 : hovered ? 0.14 : 0}
      />
      {dimmed ? null : (
        <Edges threshold={30} color={selected ? SCENE.brand : SCENE.edge} scale={1} />
      )}
    </mesh>
    </group>
  );
}

/**
 * A material callout: a dot on the part, a leader line, and a label parked
 * clear of the model.
 *
 * The label used to open next to the pin, which put it straight over the
 * furniture it was describing. A leader out to open space is how a spec drawing
 * annotates, and it means the label can stay visible without hiding the thing
 * it names.
 *
 * Offsets are assigned per index rather than computed from the projected
 * position: four labels around one object need to not collide with each other,
 * and a fixed quadrant each is both stable under rotation and predictable to
 * read.
 */
const CALLOUT_SLOTS: { dx: number; dy: number; side: "left" | "right" }[] = [
  { dx: -168, dy: -76, side: "left" },
  { dx: 168, dy: -104, side: "right" },
  { dx: -168, dy: 84, side: "left" },
  { dx: 168, dy: 62, side: "right" },
];

function MaterialCallout({
  hotspot,
  open,
  onToggle,
  index,
}: {
  hotspot: Hotspot;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const m = hotspot.material;
  const slot = CALLOUT_SLOTS[index % CALLOUT_SLOTS.length];
  const isLeft = slot.side === "left";
  const reach = `min(${Math.abs(slot.dx)}px, 27vw)`;
  const width = `min(186px, 42vw)`;

  return (
    <Html
      position={[hotspot.at[0] * S, hotspot.at[1] * S, hotspot.at[2] * S]}
      center
      zIndexRange={[40, 0]}
      // The wrapper must not eat orbit drags; only the dot and the label do.
      style={{ pointerEvents: "none" }}
    >
      <div className="studio relative" style={{ fontFamily: "var(--font-body), sans-serif" }}>
        {/* Leader line, drawn in an overlay box centred on the pin. */}
        <svg
          width={Math.abs(slot.dx) * 2}
          height={Math.abs(slot.dy) * 2 + 40}
          viewBox={`${-Math.abs(slot.dx)} ${-Math.abs(slot.dy) - 20} ${Math.abs(slot.dx) * 2} ${Math.abs(slot.dy) * 2 + 40}`}
          className="pointer-events-none absolute"
          style={{
            left: `calc(-1 * ${reach})`,
            top: `${-Math.abs(slot.dy) - 20}px`,
            width: `calc(2 * ${reach})`,
            overflow: "visible",
          }}
          aria-hidden="true"
        >
          {/* Dogleg: out horizontally, then along to the label baseline —
              the same path a drawing's leader takes. */}
          <path
            d={`M 0 0 L ${slot.dx * 0.55} ${slot.dy} L ${slot.dx} ${slot.dy}`}
            vectorEffect="non-scaling-stroke"
            fill="none"
            stroke={open ? "var(--burgundy)" : "var(--studio-line-strong)"}
            strokeWidth={open ? 2 : 1.25}
          />
        </svg>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${m.role}: ${m.brand} ${m.material}`}
          className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 shadow-[var(--shadow-md)] transition-transform duration-200 hover:scale-110"
          style={{ pointerEvents: "auto", borderColor: "#fff", background: open ? "var(--burgundy)" : "var(--paper)" }}
        >
          <span className="block h-1.5 w-1.5 rounded-full" style={{ background: open ? "#fff" : "var(--burgundy)" }} />
        </button>

        {/* The label itself, parked at the end of the leader. */}
        <button
          type="button"
          onClick={onToggle}
          aria-hidden="true"
          tabIndex={-1}
          className={`absolute rounded-[3px] p-2 shadow-[var(--shadow-md)] transition-shadow ${
            isLeft ? "text-right" : "text-left"
          }`}
          style={{
            pointerEvents: "auto",
            background: "var(--paper)",
            width,
            left: isLeft ? `calc(-1 * ${reach} - ${width} + 9px)` : `calc(${reach} + 9px)`,
            top: `${slot.dy - 22}px`,
            boxShadow: open ? "0 0 0 1px var(--burgundy), var(--shadow-lg)" : "var(--shadow-md)",
          }}
        >
          <span className={`flex items-start gap-1.5 ${isLeft ? "flex-row-reverse" : ""}`}>
            <span
              className="mt-0.5 block h-5 w-5 shrink-0 rounded-[2px]"
              style={{ background: `linear-gradient(135deg, ${m.swatch}, ${m.swatchTo ?? m.swatch})` }}
            />
            <span className="min-w-0">
              <span className="tracked-caps block text-[8.5px]" style={{ color: "var(--ink-faint)" }}>
                {m.role}
              </span>
              <span className="block text-[11.5px] font-semibold leading-tight">
                {m.brand} {m.material}
              </span>
              <span className="metric block text-[10px]" style={{ color: "var(--ink-soft)" }}>
                {m.spec}
              </span>
            </span>
          </span>

          {open ? (
            <span className="mt-1.5 block border-t pt-1.5" style={{ borderColor: "var(--studio-line)" }}>
              {m.facing ? (
                <span className="block text-[10.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                  Faced in <span className="font-semibold">{m.facing}</span>
                </span>
              ) : null}
              <span className="mt-1 block text-[10px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {m.why}
              </span>
              {m.rate ? (
                <span className="metric mt-1 block text-[10.5px]">
                  {inr(m.rate.amount)}{" "}
                  <span className="font-normal" style={{ color: "var(--ink-faint)" }}>
                    {m.rate.unit}
                  </span>
                </span>
              ) : null}
              {m.catalogue ? (
                <a
                  href={m.catalogue}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 block text-[10.5px] font-semibold"
                  style={{ color: "var(--burgundy)" }}
                >
                  See it in the catalogue →
                </a>
              ) : null}
            </span>
          ) : null}
        </button>
      </div>
    </Html>
  );
}

// ------------------------------------------------------------------ scene ---

function Furniture({
  metrics,
  layout,
  spec,
  explode,
  showShutters,
  selectedPanelId,
  onSelectPanel,
  showBoardColours,
  doorOpen,
  showMaterials,
  openHotspot,
  onToggleHotspot,
}: {
  metrics: Metrics;
  layout: FurnitureLayout;
  spec: SpecIds;
  explode: number;
  showShutters: boolean;
  selectedPanelId: string | null;
  onSelectPanel: (panel: Panel) => void;
  showBoardColours: boolean;
  doorOpen: number;
  showMaterials: boolean;
  openHotspot: string | null;
  onToggleHotspot: (id: string) => void;
}) {
  const panels = useMemo(() => buildPanels(metrics, layout), [metrics, layout]);
  const looks = useMemo(() => appearanceFor(spec), [spec]);
  const boards = useMemo(() => boardAppearance(spec.carcassId, spec.shutterId), [spec.carcassId, spec.shutterId]);
  const grain = useMemo(() => makeGrainTexture(), []);
  useEffect(() => () => grain.dispose(), [grain]);

  const isShutter = (p: Panel) => p.role === "shutter" || p.role === "loft-shutter";
  const span = Math.max(metrics.dims.widthMm, metrics.dims.heightMm, metrics.dims.depthMm);

  // Pins hang off the visible panels only — a callout on a door that is not
  // being drawn would float in mid-air.
  const visible = panels.filter((p) => !(isShutter(p) && !showShutters));
  const hotspots = useMemo(() => (showMaterials ? buildHotspots(visible, spec) : []), [showMaterials, visible, spec]);

  return (
    <group
      // Centre the object on the origin so orbit rotates around the furniture
      // rather than around its corner.
      position={[0, (-metrics.dims.heightMm / 2) * S, (-metrics.dims.depthMm / 2) * S]}
    >
      {panels.map((panel) => {
        if (isShutter(panel) && !showShutters) return null;
        const base = looks[panel.surface as SurfaceGroup];
        // In the exploded view the panel IS the board, so it is painted the
        // board's colour — that is the view where someone is looking at
        // construction rather than at a finished object.
        const appearance =
          showBoardColours && (panel.surface === "carcass" || panel.surface === "internal")
            ? { ...base, color: boards.carcass, grain: 0.5 }
            : showBoardColours && panel.surface === "shutter"
              ? { ...base, color: boards.shutter, grain: 0.5 }
              : base;
        return (
          <PanelMesh
            key={panel.id}
            panel={panel}
            appearance={appearance}
            explode={explode}
            panelSpan={span}
            grainTexture={grain}
            selected={panel.id === selectedPanelId}
            dimmed={selectedPanelId != null && panel.id !== selectedPanelId && explode > 0.05}
            onSelect={onSelectPanel}
            doorOpen={doorOpen}
            doorType={layout.doors.type}
          />
        );
      })}

      {hotspots.map((h, i) => (
        <MaterialCallout
          key={h.id}
          hotspot={h}
          open={openHotspot === h.id}
          onToggle={() => onToggleHotspot(h.id)}
          index={i}
        />
      ))}
    </group>
  );
}

/**
 * Frames the object.
 *
 * Distance is solved from the object's own bounding box against the camera's
 * vertical AND horizontal field of view, rather than guessed from a single
 * span — a 20 ft run and a 3 ft vanity have opposite limiting axes, and fitting
 * only to height clips the wide one off both sides of the frame.
 */
const FOV = 34;

/**
 * Half-extents of the assembly at a given explode amount, in metres.
 *
 * The camera used to open up by a guessed margin, which is why pieces fell off
 * both sides at full separation: a shutter travels `explodeScale` × the spread,
 * and the largest scale is nearly three times the smallest. Measuring the
 * panels where they actually end up is the only way the frame can be right for
 * every layout.
 */
function explodedExtent(panels: Panel[], spanMm: number, explode: number) {
  const spread = explode * Math.max(spanMm, 600) * 0.42;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of panels) {
    const d = spread * p.explodeScale;
    x = Math.max(x, Math.abs(p.center[0] + p.explode[0] * d) + p.size[0] / 2);
    y = Math.max(y, Math.abs(p.center[1] + p.explode[1] * d) + p.size[1] / 2);
    z = Math.max(z, Math.abs(p.center[2] + p.explode[2] * d) + p.size[2] / 2);
  }
  return { x: x * S, y: y * S, z: z * S };
}

function CameraRig({
  metrics,
  extent,
}: {
  metrics: Metrics;
  extent: { x: number; y: number; z: number };
}) {
  // Read the canvas size; never write to the camera. Mutating an object handed
  // back by a hook is what the compiler forbids, and the declarative camera is
  // the idiomatic way to do this in R3F anyway.
  const size = useThree((s) => s.size);
  const w = metrics.dims.widthMm * S;
  const h = metrics.dims.heightMm * S;
  const d = metrics.dims.depthMm * S;

  const fit = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fovV = (FOV * Math.PI) / 180;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);

    // Measured half-extents, falling back to the assembled box when nothing
    // has been laid out yet.
    const halfW = Math.max(extent.x, w / 2);
    const halfH = Math.max(extent.y, h / 2);
    const halfD = Math.max(extent.z, d / 2);

    // Seen from three-quarters the depth swings into the silhouette, so the
    // width the camera has to clear is wider than the front face alone.
    const silhouette = halfW * 1.72 + halfD * 0.9;
    const dist =
      Math.max(halfH / Math.tan(fovV / 2), silhouette / 2 / Math.tan(fovH / 2)) * 1.16 + halfD;
    return {
      position: [dist * 0.5, h * 0.16, dist * 0.84] as [number, number, number],
      near: Math.max(0.05, dist * 0.02),
      far: dist * 10,
    };
  }, [w, h, d, size.width, size.height, extent.x, extent.y, extent.z]);

  return <PerspectiveCamera makeDefault fov={FOV} position={fit.position} near={fit.near} far={fit.far} />;
}

export interface Scene3DProps {
  metrics: Metrics;
  layout: FurnitureLayout;
  spec: SpecIds;
  explode: number;
  showShutters: boolean;
  selectedPanelId: string | null;
  onSelectPanel: (panel: Panel) => void;
  resetKey: number;
  showBoardColours?: boolean;
  /** 0 = shut, 1 = fully open. */
  doorOpen?: number;
  /** Whether the IKEA-style material pins are shown. */
  showMaterials?: boolean;
  openHotspot?: string | null;
  onToggleHotspot?: (id: string) => void;
}

export default function Scene3D({
  metrics,
  layout,
  spec,
  explode,
  showShutters,
  selectedPanelId,
  onSelectPanel,
  resetKey,
  showBoardColours = false,
  doorOpen = 0,
  showMaterials = false,
  openHotspot = null,
  onToggleHotspot,
}: Scene3DProps) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const span = Math.max(metrics.dims.widthMm, metrics.dims.heightMm) * S;

  // Same panel list the scene draws, measured where the pieces actually land.
  const extent = useMemo(() => {
    const panels = buildPanels(metrics, layout).filter(
      (p) => showShutters || (p.role !== "shutter" && p.role !== "loft-shutter")
    );
    const spanMm = Math.max(metrics.dims.widthMm, metrics.dims.heightMm, metrics.dims.depthMm);
    return explodedExtent(panels, spanMm, explode);
  }, [metrics, layout, explode, showShutters]);

  useEffect(() => {
    controls.current?.reset();
  }, [resetKey]);

  return (
    <Canvas
      // dpr capped at 1.6: past that the extra pixels cost real frames on a
      // phone and buy nothing on flat-shaded boxes.
      dpr={[1, 1.6]}
      shadows
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // The canvas is mounted into an absolutely-positioned box inside a
      // sticky column. react-use-measure's default debounced, scroll-aware
      // measurement can settle on the pre-layout size there and leave the
      // renderer at the 300×150 canvas default. Measuring immediately, and
      // stating the size in CSS as well, makes the first paint the right one.
      resize={{ debounce: 0, scroll: false }}
      style={{ touchAction: "none", width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#ffffff"]} />
      <hemisphereLight intensity={0.72} groundColor={SCENE.ground} color="#ffffff" />
      <directionalLight
        position={[span * 1.4, span * 2.2, span * 1.8]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-span * 1.6, span * 0.8, -span]} intensity={0.4} />

      <Furniture
        metrics={metrics}
        layout={layout}
        spec={spec}
        explode={explode}
        showShutters={showShutters}
        selectedPanelId={selectedPanelId}
        onSelectPanel={onSelectPanel}
        showBoardColours={showBoardColours}
        doorOpen={doorOpen}
        showMaterials={showMaterials}
        openHotspot={openHotspot}
        onToggleHotspot={onToggleHotspot ?? (() => {})}
      />

      {/* Ground shadow only — a full floor plane reads as a room, and this is
          explicitly a concept visual of one piece, not a room render. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (-metrics.dims.heightMm / 2) * S - 0.001, 0]} receiveShadow>
        <planeGeometry args={[span * 6, span * 6]} />
        <shadowMaterial opacity={0.14} />
      </mesh>

      <CameraRig metrics={metrics} extent={extent} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={span * 0.6}
        maxDistance={span * 6 + 4}
        // Stops the camera going under the floor, where the object reads as
        // floating and the shadow disappears.
        maxPolarAngle={Math.PI * 0.52}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
