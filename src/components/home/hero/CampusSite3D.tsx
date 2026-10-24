"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { cx } from "@/lib/cx";

const Pause = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const Play = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);

/**
 * Campus Site 3D: the CST campus as an engineering site model.
 *
 * A circular cut of the hillside with the soil and rock strata exposed on its edge, floating
 * above a blueprint survey disc. On load the campus assembles itself from wireframe; then a
 * survey drone sweeps the site and a scan ring passes up the section now and then.
 *
 * The campus is built from photographs, not a survey: the stepped multi-storey blocks with red
 * hip roofs and yellow/blue facades, the green-roofed building with solar panels spelling CST,
 * the red-and-white checkered water tower, the traditional gate, the turf ground and running
 * track, the covered walkway, globe street lamps, cypress-lined roads and  and the blueprint survey disc below.
 *
 * Procedural three.js, no 3D models: the drone photo (aerialSrc) colours the ground and trees.
 * Dependencies: react, three.
 * `embed`: on frames wider than 900 px the model sits in the right ~58% of its box and the
 * wheel scrolls the page. Control it with window.__campusSite: play, pause, rebuild.
 */

export type CampusSite3DProps = {
  height?: number | string;
  className?: string;
  embed?: boolean;
  /** Top-down drone photo draped over the terrain and roofs (1920 x 960, north up). */
  aerialSrc?: string;
  onReady?: () => void;
};

type SiteApi = { play: () => void; pause: () => void; rebuild: () => void; finish: () => void };
declare global {
  interface Window {
    __campusSite?: SiteApi;
  }
}

export function CampusSite3D({
  height = "100vh",
  className,
  embed = false,
  aerialSrc = "/images/home/campus-aerial.jpg",
  onReady,
}: CampusSite3DProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SiteApi | null>(null);
  const readyRef = useRef(onReady);
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const root = rootRef.current,
      host = sceneRef.current;
    if (!root || !host) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const start = (aerial: HTMLImageElement | null) => {
      if (cancelled) return;
      initSite(root, host, {
        embedded: embed,
        aerial,
        onReady: () => readyRef.current?.(),
      }).then(
        (r) => {
          // taken down while it was being built: build it down again
          if (cancelled) return r.dispose();
          apiRef.current = r.api;
          dispose = r.dispose;
        },
        (e) => {
          console.error("Campus site: failed to start", e);
          if (!cancelled) setError(true);
        },
      );
    };
    // Load the drone photo first; without it the model falls back to procedural ground.
    const img = new Image();
    img.decoding = "async";
    img.onload = () => start(img);
    img.onerror = () => start(null);
    img.src = aerialSrc;
    return () => {
      cancelled = true;
      img.onload = img.onerror = null;
      apiRef.current = null;
      dispose?.();
    };
  }, [embed, aerialSrc]);

  useEffect(() => void (playing ? apiRef.current?.play() : apiRef.current?.pause()), [playing]);

  return (
    <div
      ref={rootRef}
      className={cx("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      <div
        ref={sceneRef}
        role="img"
        aria-label="3D model of the College of Science and Technology campus in Rinchending, cut from the hillside like an engineering site model. Drag to rotate."
        className="absolute inset-0 touch-pan-y outline-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      />
      <button
        aria-label={playing ? "Pause animation" : "Resume animation"}
        aria-pressed={!playing}
        onClick={() => setPlaying((v) => !v)}
        className="absolute bottom-5 right-5 grid size-9 place-items-center rounded-full border border-[#2e7d8f]/30 bg-white/80 text-[#2e7d8f] backdrop-blur transition-colors hover:bg-white"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      {error && (
        <p
          role="alert"
          className="absolute bottom-16 right-5 max-w-[260px] rounded-md bg-white/90 px-3 py-2 text-xs text-copy shadow-sm"
        >
          The 3D campus needs WebGL. Turn on hardware acceleration in your browser to see it.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site layout, traced from the top-down drone shot in the Silver Jubilee video
// (1920 x 1080 frame, north up). 105 px = 1 world unit; centre at (1000, 560).
// x east, z south, y up. Rotations are degrees clockwise on screen.
// ---------------------------------------------------------------------------

const RX = 9.0; // the cut is an ellipse that fits the campus footprint
const RZ = 6.0;
const FH = 0.27; // storey height
const SC = 105;
const deg = (d: number) => (d * Math.PI) / 180;
const wx = (px: number) => (px - 1000) / SC;
const wz = (py: number) => (py - 560) / SC;

type Facade = "modern" | "glass" | "heritage" | "yellow" | "cream" | "white";
type RoofKind = "hip" | "gable";
type BlockDef = {
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  floors: number;
  front: Facade;
  side: Facade;
  roof: RoofKind;
  roofColor: number;
  roofH?: number;
  cst?: boolean;
  solar?: boolean;
};

// roof colours sampled from the drone footage
const TEAL = 0x12a594;
const TEAL_DARK = 0x16857a;
const TEAL_DEEP = 0x2f6f6c;
const MAROON = 0x6a2f37;
const SALMON = 0xd9634a;
const PINK = 0xe48aa8;
const SAGE = 0x9aae7c;
const SLATE = 0x4d555e;
const STEEL = 0xd9dcdf;

const B = (
  px: [number, number, number, number],
  rot: number,
  floors: number,
  roof: RoofKind,
  roofColor: number,
  front: Facade = "white",
  side: Facade = front,
  extra: Partial<BlockDef> = {},
): BlockDef => ({
  x: wx(px[0]),
  z: wz(px[1]),
  w: px[2] / SC,
  d: px[3] / SC,
  rot,
  floors,
  roof,
  roofColor,
  front,
  side,
  ...extra,
});

/** A hostel built round a courtyard: four wings around an open square. */
const courtyard = (
  px: [number, number, number, number],
  rot: number,
  floors: number,
  roofColor: number,
  front: Facade = "white",
): BlockDef[] => {
  const w = px[2] / SC,
    d = px[3] / SC,
    t = Math.min(w, d) * 0.3;
  const cx = wx(px[0]),
    cz = wz(px[1]),
    c = Math.cos(deg(rot)),
    s = Math.sin(deg(rot));
  const wing = (u: number, v: number, ww: number, dd: number): BlockDef => ({
    x: cx + u * c - v * s,
    z: cz + u * s + v * c,
    w: ww,
    d: dd,
    rot,
    floors,
    roof: "hip",
    roofColor,
    front,
    side: front,
    roofH: t * 0.45,
  });
  return [
    wing(0, -(d - t) / 2, w, t),
    wing(0, (d - t) / 2, w, t),
    wing(-(w - t) / 2, 0, t, d - 2 * t + 0.02),
    wing((w - t) / 2, 0, t, d - 2 * t + 0.02),
  ];
};

const ALL_BLOCKS: BlockDef[] = [
  // Indoor Stadium, west of the ground
  B([754, 256, 102, 163], 2, 3, "hip", TEAL, "cream", "cream", { roofH: 0.38 }),
  // CST Laboratory block and workshop, north of the ground
  B([890, 160, 95, 100], 0, 3, "hip", TEAL_DEEP, "white"),
  B([955, 160, 40, 100], 0, 3, "gable", SLATE, "white"),
  B([1016, 158, 52, 105], 0, 2, "gable", 0x5b4a48, "cream"),
  B([1142, 88, 190, 48], 4, 3, "hip", TEAL, "white"),
  B([1320, 135, 48, 150], -32, 2, "gable", SAGE, "cream"),
  // the solar-roofed blocks east of the ground, the last one spelling CST
  B([1110, 168, 98, 72], 0, 2, "hip", TEAL, "yellow", "yellow", { solar: true, roofH: 0.3 }),
  B([1121, 252, 84, 66], 0, 2, "hip", TEAL, "yellow", "yellow", { solar: true, roofH: 0.3 }),
  B([1121, 318, 84, 64], 0, 2, "hip", TEAL, "yellow", "yellow", { solar: true, roofH: 0.3 }),
  B([1121, 384, 84, 64], 0, 2, "hip", TEAL, "yellow", "yellow", { solar: true, roofH: 0.3 }),
  B([1123, 453, 84, 72], 0, 2, "hip", TEAL, "yellow", "yellow", { cst: true, roofH: 0.32 }),
  // east of CST-Boundary Road
  B([1233, 220, 100, 118], 0, 3, "hip", TEAL_DEEP, "white"),
  B([1208, 393, 40, 163], 0, 1, "gable", STEEL, "cream"),
  B([1295, 318, 45, 50], 0, 2, "hip", TEAL, "white"),
  B([1278, 405, 45, 50], 0, 2, "hip", TEAL, "white"),
  B([1494, 178, 60, 130], 15, 3, "gable", MAROON, "white"),
  B([1296, 474, 92, 30], 12, 2, "gable", MAROON, "cream"),
  B([1385, 505, 36, 44], 12, 2, "hip", MAROON, "cream"),
  B([1800, 505, 110, 90], 22, 3, "hip", TEAL, "white"),
  // Information Technology Building
  B([430, 446, 76, 50], 0, 4, "hip", TEAL, "modern", "white"),
  B([430, 500, 76, 50], 0, 4, "hip", TEAL, "modern", "white"),
  B([350, 548, 84, 110], -6, 5, "hip", TEAL, "modern", "white", { roofH: 0.36 }),
  B([418, 598, 108, 84], -6, 5, "hip", TEAL, "modern", "white", { roofH: 0.36 }),
  // the long L-shaped academic block with the courts inside it
  B([528, 585, 58, 210], 0, 3, "hip", TEAL, "white", "cream"),
  B([618, 662, 200, 48], -4, 3, "hip", TEAL, "white", "cream"),
  B([615, 562, 100, 24], 0, 2, "gable", 0xc9a07a, "cream"),
  // CST Convention Hall
  B([215, 712, 150, 112], -15, 3, "hip", TEAL, "cream", "white", { roofH: 0.42 }),
  // NEW Academic Building
  B([650, 755, 120, 70], -6, 4, "hip", TEAL, "modern", "white"),
  B([530, 790, 100, 68], -6, 4, "hip", TEAL, "modern", "white"),
  B([560, 822, 60, 30], -6, 3, "hip", TEAL, "white"),
  // residences south-west
  B([80, 860, 80, 50], 15, 3, "hip", TEAL_DARK, "white"),
  B([155, 885, 65, 50], 5, 3, "hip", TEAL_DARK, "white"),
  B([285, 900, 50, 60], 0, 3, "hip", TEAL_DARK, "white"),
  B([225, 965, 75, 45], 10, 3, "hip", TEAL_DARK, "white"),
  B([310, 975, 70, 50], 0, 3, "hip", TEAL_DARK, "white"),
  // library and the long teal blocks south of the ground
  B([1110, 672, 292, 50], -12, 3, "hip", TEAL, "white", "white"),
  B([1088, 742, 165, 58], -12, 3, "hip", TEAL_DARK, "white"),
  // hostels: salmon-roofed blocks and the maroon courtyard blocks
  B([1255, 708, 105, 70], -10, 4, "hip", SALMON, "yellow", "glass"),
  B([1350, 762, 72, 110], -10, 4, "hip", SALMON, "yellow", "glass"),
  B([1500, 808, 92, 60], -10, 3, "hip", SALMON, "yellow"),
  ...courtyard([1125, 812, 140, 125], -10, 4, MAROON),
  ...courtyard([1175, 942, 140, 130], -10, 4, MAROON),
  B([1350, 948, 170, 50], -10, 4, "hip", MAROON, "white"),
  B([1425, 990, 82, 50], -10, 3, "hip", SALMON, "yellow"),
  B([1225, 1002, 130, 40], -10, 3, "hip", PINK, "white"),
  // staff quarters along CST Road
  B([1300, 578, 50, 50], 12, 2, "hip", MAROON, "cream"),
  B([1445, 632, 62, 40], 18, 2, "hip", MAROON, "cream"),
  B([1505, 676, 62, 40], 18, 2, "hip", MAROON, "cream"),
  B([1580, 726, 66, 40], 12, 2, "hip", 0x5f8ea4, "cream"),
  B([1600, 628, 34, 40], 0, 1, "gable", STEEL, "cream"),
  B([1800, 832, 100, 90], 15, 3, "hip", MAROON, "white"),
];

// keep only what fits on the cut (fringe buildings beyond the rim are dropped)
const BLOCKS = ALL_BLOCKS.filter((b) => (b.x / RX) ** 2 + (b.z / RZ) ** 2 < 0.8);

const FIELD = { x: wx(927), z: wz(405), w: 230 / SC, d: 346 / SC, rot: 0 }; // CST Football Ground (turf)
const COURT = { x: wx(615), z: wz(612), w: 96 / SC, d: 56 / SC, rot: 0 }; // courts inside the L block
const HELIPAD = { x: wx(1322), z: wz(1070), w: 230 / SC, d: 115 / SC, rot: -10 }; // behind (south of) the hostel row
// concrete paths across the lawn between the hostels, traced from the drone frame
const HOSTEL_PATHS: Array<Array<[number, number]>> = [
  [
    [1163, 737],
    [1205, 830],
    [1257, 940],
  ], // along the courtyard hostel
  [
    [1287, 810],
    [1262, 852],
    [1240, 888],
  ], // south-west diagonal
  [
    [1300, 813],
    [1310, 858],
    [1320, 900],
  ], // south
  [
    [1313, 800],
    [1370, 850],
    [1425, 897],
  ], // south-east diagonal
  [
    [1167, 743],
    [1210, 747],
  ],
  [
    [1190, 767],
    [1210, 750],
  ],
];
// the open lawn the paths cross: kept clear of trees
const HOSTEL_LAWN: Array<[number, number]> = [
  [1160, 732],
  [1310, 720],
  [1445, 895],
  [1262, 948],
];
const inPoly = (x: number, z: number, poly: Array<[number, number]>) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = [wx(poly[i][0]), wz(poly[i][1])],
      [bx, bz] = [wx(poly[j][0]), wz(poly[j][1])];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) c = !c;
  }
  return c;
};
const HOSTEL_PLAZA: Array<[number, number]> = [
  [1208, 748],
  [1303, 726],
  [1309, 806],
  [1286, 812],
  [1240, 790],
];
const TOWER = { x: wx(1607), z: wz(870) }; // red-and-white water tower
const MAST = { x: wx(838), z: wz(118) }; // telecom lattice tower
const SHRINES = {
  mani: [wx(805), wz(645)] as [number, number],
  wheel: [wx(595), wz(488)] as [number, number],
};
const WALKWAY: [[number, number], [number, number]] = [
  [wx(1068), wz(218)],
  [wx(1068), wz(560)],
];

type Road = { pts: Array<[number, number]>; w: number; color: number; lamps: boolean };
const road = (pts: Array<[number, number]>, w: number, color: number, lamps: boolean): Road => ({
  pts: pts.map(([px, py]) => [wx(px), wz(py)] as [number, number]),
  w,
  color,
  lamps,
});
const LANE = 0x8b8f93;
const ROADS: Road[] = [
  // CST Road: from the gate past the hostels, round the south of the ground
  road(
    [
      [1820, 1060],
      [1760, 900],
      [1700, 830],
      [1620, 775],
      [1520, 720],
      [1420, 662],
      [1330, 615],
      [1250, 578],
      [1150, 562],
      [1050, 578],
      [960, 598],
      [880, 628],
      [800, 660],
      [700, 690],
      [600, 700],
      [500, 702],
      [440, 700],
    ],
    0.12,
    LANE,
    true,
  ),
  // CST-Boundary Road, north between the solar blocks and the east buildings
  road(
    [
      [1150, 562],
      [1172, 470],
      [1174, 300],
      [1166, 170],
      [1192, 128],
      [1250, 140],
      [1300, 190],
      [1348, 270],
    ],
    0.1,
    LANE,
    true,
  ),
  // the hairpin to the Convention Hall
  road(
    [
      [440, 700],
      [400, 690],
      [350, 688],
      [320, 715],
      [300, 770],
      [230, 792],
      [150, 790],
      [120, 740],
      [118, 690],
    ],
    0.1,
    LANE,
    true,
  ),
  // the western road down the hill
  road(
    [
      [240, 90],
      [228, 200],
      [215, 300],
      [160, 380],
      [100, 470],
      [70, 600],
      [75, 720],
      [90, 800],
      [180, 822],
      [300, 822],
      [420, 836],
      [480, 860],
    ],
    0.12,
    LANE,
    false,
  ),
  // the southern serpentine
  road(
    [
      [560, 1040],
      [600, 960],
      [680, 860],
      [760, 805],
      [830, 800],
      [880, 840],
      [930, 930],
      [960, 1040],
    ],
    0.12,
    LANE,
    false,
  ),
  // east side lanes
  road(
    [
      [1440, 320],
      [1490, 410],
      [1540, 510],
      [1590, 610],
      [1640, 700],
    ],
    0.08,
    LANE,
    false,
  ),
  road(
    [
      [1560, 520],
      [1650, 480],
      [1740, 420],
      [1820, 400],
    ],
    0.08,
    LANE,
    false,
  ),
];

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

type Pad = { x: number; z: number; hw: number; hd: number; rot: number; level: number };
const smooth = (x: number, z: number) =>
  -0.12 * z - 0.03 * x + 0.12 * Math.sin(x * 0.5 + 1) * Math.cos(z * 0.45);
const bumps = (x: number, z: number) =>
  Math.sin(x * 1.3 + z * 0.6) * 0.06 + Math.sin(x * 0.5 - z * 1.4 + 2) * 0.05;
const pad = (x: number, z: number, w: number, d: number, rotDeg: number): Pad => ({
  x,
  z,
  hw: w / 2,
  hd: d / 2,
  rot: deg(rotDeg),
  level: smooth(x, z),
});
const PADS: Pad[] = [
  ...BLOCKS.map((b) => pad(b.x, b.z, b.w, b.d, b.rot)),
  pad(FIELD.x, FIELD.z, FIELD.w + 0.5, FIELD.d + 0.5, FIELD.rot),
  pad(HELIPAD.x, HELIPAD.z, HELIPAD.w + 0.2, HELIPAD.d + 0.2, HELIPAD.rot),
  pad(TOWER.x, TOWER.z, 0.7, 0.7, 0),
  pad(COURT.x, COURT.z, COURT.w, COURT.d, COURT.rot),
  pad(MAST.x, MAST.z, 0.4, 0.4, 0),
  pad(SHRINES.mani[0], SHRINES.mani[1], 0.4, 0.4, 0),
  pad(SHRINES.wheel[0], SHRINES.wheel[1], 0.3, 0.3, 0),
];
const local = (p: Pad, x: number, z: number) => {
  const dx = x - p.x,
    dz = z - p.z,
    c = Math.cos(p.rot),
    s = Math.sin(p.rot);
  return [dx * c + dz * s, -dx * s + dz * c] as const;
};
const sstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function terrain(x: number, z: number) {
  let h = smooth(x, z) + bumps(x, z);
  let lawn = 0;
  for (const p of PADS) {
    const [u, v] = local(p, x, z);
    const d = Math.hypot(
      Math.max(0, Math.abs(u) - p.hw - 0.06),
      Math.max(0, Math.abs(v) - p.hd - 0.06),
    );
    const w = 1 - sstep(0, 0.6, d);
    if (w > 0) {
      h = h * (1 - w) + p.level * w;
      lawn = Math.max(lawn, w);
    }
  }
  return { h, lawn };
}
const heightAt = (x: number, z: number) => terrain(x, z).h;
const inPad = (x: number, z: number, grow: number) =>
  PADS.some((p) => {
    const [u, v] = local(p, x, z);
    return Math.abs(u) < p.hw + grow && Math.abs(v) < p.hd + grow;
  });
const rand = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

// ---------------------------------------------------------------------------
// The environment light
// ---------------------------------------------------------------------------

/** The parts of three's PMREMGenerator that build its filter shaders (three is pinned exactly). */
type PmremInternals = {
  _setSize(size: number): void;
  _allocateTargets(): THREE.WebGLRenderTarget;
  _blurMaterial: THREE.Material | null;
  _ggxMaterial: THREE.Material | null;
};

/**
 * The soft studio light (three's RoomEnvironment) as an environment map. PMREMGenerator compiles
 * its shaders as it first draws with them, which blocks the page for seconds on some GPUs (the GGX
 * filter loops 256 times); here they are compiled in the background first. Returns null if the
 * model was taken down in the meantime.
 */
async function environmentMap(renderer: THREE.WebGLRenderer, alive: () => boolean) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  try {
    const gen = pmrem as unknown as PmremInternals;
    if (typeof gen._allocateTargets === "function") {
      gen._setSize(256); // fromScene's default size
      const target = gen._allocateTargets(); // also creates the blur and GGX filter materials
      const filters = new THREE.Scene();
      // a position attribute, as the filters' own quads have: it is part of the shader's cache key
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
      for (const m of [gen._blurMaterial, gen._ggxMaterial])
        if (m) filters.add(new THREE.Mesh(geometry, m));
      // fromScene draws into render targets (linear colour, no tone mapping): compile for that
      const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
      renderer.setRenderTarget(target);
      const compiling = Promise.all([
        renderer.compileAsync(room, camera),
        renderer.compileAsync(filters, camera),
      ]);
      renderer.setRenderTarget(null);
      await compiling;
      target.dispose();
      geometry.dispose();
    }
    return alive() ? pmrem.fromScene(room, 0.04) : null;
  } finally {
    room.dispose();
    pmrem.dispose();
  }
}

// ---------------------------------------------------------------------------
// Batching: one draw call per look per building
// ---------------------------------------------------------------------------
// The campus is built from about 900 small meshes, nearly each with its own material, and every
// one costs a draw call per frame (two with its shadow). batch() merges the meshes of one group
// that look the same into one mesh, baked into the group's space, so a building still rises as
// a whole. Nothing is drawn differently: materials are only shared when every setting matches,
// and a texture's repeat/offset is moved into the UVs, which is the sum the shader does anyway.

const PLACEMENT_FREE = (t: THREE.Texture) =>
  [
    t.source.uuid,
    t.mapping,
    t.channel,
    t.wrapS,
    t.wrapT,
    t.magFilter,
    t.minFilter,
    t.anisotropy,
    t.format,
    t.type,
    t.colorSpace,
    t.flipY,
    t.premultiplyAlpha,
    t.generateMipmaps,
    t.unpackAlignment,
  ].join(",");
const textureKey = (t: THREE.Texture, placed: boolean) =>
  placed
    ? `${PLACEMENT_FREE(t)},${(t.updateMatrix(), t.matrix.elements.join(","))}`
    : PLACEMENT_FREE(t);

const IGNORED = new Set(["uuid", "name", "id", "version", "userData", "_listeners"]);
/** Every setting of a material, so two materials with the same key render identically. */
function materialKey(m: THREE.Material, unplacedMap: boolean) {
  const parts = [m.type];
  for (const [k, v] of Object.entries(m)) {
    if (IGNORED.has(k) || typeof v === "function") continue;
    let s: string;
    if (v instanceof THREE.Texture) s = `tex(${textureKey(v, !(unplacedMap && k === "map"))})`;
    else if (v instanceof THREE.Color) s = `rgb(${v.r},${v.g},${v.b})`;
    else if (v && typeof v === "object" && "toArray" in v) s = JSON.stringify(v.toArray());
    else s = typeof v === "object" ? JSON.stringify(v) : String(v);
    parts.push(`${k}=${s}`);
  }
  return parts.join(";");
}

/** A colour map whose placement can move into the UVs: the only texture, repeating both ways. */
function bakeableMap(m: THREE.Material) {
  const map = (m as THREE.MeshStandardMaterial).map;
  if (!map || map.channel !== 0) return null;
  if (map.wrapS !== THREE.RepeatWrapping || map.wrapT !== THREE.RepeatWrapping) return null;
  const textures = Object.values(m).filter((v) => v instanceof THREE.Texture);
  return textures.length === 1 ? map : null;
}

/** Vertices [start, start + count) of a non-indexed geometry. */
function slice(g: THREE.BufferGeometry, start: number, count: number) {
  const out = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(g.attributes)) {
    const attr = a as THREE.BufferAttribute;
    const n = attr.itemSize;
    const array = attr.array.slice(start * n, (start + count) * n);
    out.setAttribute(name, new THREE.BufferAttribute(array, n, attr.normalized));
  }
  return out;
}

const mergeable = (o: THREE.Object3D) => {
  const m = o as THREE.Mesh;
  const isMesh =
    m.isMesh &&
    !(m as THREE.InstancedMesh).isInstancedMesh &&
    !(m as THREE.SkinnedMesh).isSkinnedMesh;
  const isSegments = (o as THREE.LineSegments).isLineSegments;
  if (!isMesh && !isSegments) return false;
  const g = m.geometry;
  if (
    !o.visible ||
    o.renderOrder !== 0 ||
    o.layers.mask !== 1 ||
    Object.keys(g.morphAttributes).length
  )
    return false;
  if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return false;
  if (
    Object.values(g.attributes).some(
      (a) => (a as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute,
    )
  )
    return false;
  const mats = Array.isArray(m.material) ? m.material : [m.material];
  // transparent surfaces are sorted object by object; merging would change their order
  return !isMesh || mats.every((x) => !x.transparent);
};

/**
 * Merges the meshes and line segments under `group` (not those under `keep`, which move on their
 * own) into one object per look. `pinned` materials are changed while running, so they are never
 * swapped for a lookalike. New geometries are passed to `track` so they are disposed later.
 */
function batch(
  group: THREE.Object3D,
  opts: {
    keep: Set<THREE.Object3D>;
    pinned: Set<THREE.Material>;
    shared: Map<string, THREE.Material>;
    track: (g: THREE.BufferGeometry) => void;
  },
) {
  group.updateMatrixWorld(true);
  const toGroup = group.matrixWorld.clone().invert();
  const rel = new THREE.Matrix4(),
    uv = new THREE.Vector3();
  const buckets = new Map<
    string,
    {
      line: boolean;
      cast: boolean;
      receive: boolean;
      material: THREE.Material;
      geos: THREE.BufferGeometry[];
    }
  >();
  const merged: THREE.Object3D[] = [];

  const visit = (o: THREE.Object3D) => {
    if (opts.keep.has(o)) return;
    for (const c of o.children) visit(c);
    if (o === group || !mergeable(o)) return;
    rel.multiplyMatrices(toGroup, o.matrixWorld);
    if (rel.determinant() <= 0) return; // a mirrored part would turn inside out once baked
    const line = !!(o as THREE.LineSegments).isLineSegments;
    const src = (o as THREE.Mesh).geometry;
    const g = src.index ? src.toNonIndexed() : src.clone();
    g.applyMatrix4(rel);
    const mats = (o as THREE.Mesh).material;
    const parts = Array.isArray(mats)
      ? g.groups.map((gr) => ({
          geo: slice(g, gr.start, gr.count),
          material: mats[gr.materialIndex ?? 0],
        }))
      : [{ geo: g, material: mats }];
    for (const { geo, material } of parts) {
      if (!material || !geo.attributes.position?.count) continue;
      const pinned = opts.pinned.has(material);
      const map = !pinned && !line && geo.attributes.uv ? bakeableMap(material) : null;
      if (map) {
        // the shader samples the map at mapTransform * uv: do that sum here instead
        map.updateMatrix();
        const a = geo.attributes.uv as THREE.BufferAttribute;
        for (let i = 0; i < a.count; i++) {
          uv.set(a.getX(i), a.getY(i), 1).applyMatrix3(map.matrix);
          a.setXY(i, uv.x, uv.y);
        }
      }
      const look = pinned ? `pinned:${material.uuid}` : materialKey(material, !!map);
      let shared = opts.shared.get(look);
      if (!shared) {
        shared = material;
        if (map) {
          // the same picture, placed nowhere: the UVs now carry the placement
          const plain = map.clone();
          plain.offset.set(0, 0);
          plain.repeat.set(1, 1);
          plain.rotation = 0;
          plain.center.set(0, 0);
          plain.matrixAutoUpdate = true;
          plain.needsUpdate = true;
          shared = material.clone();
          (shared as THREE.MeshStandardMaterial).map = plain;
        }
        opts.shared.set(look, shared);
      }
      const attrs = Object.entries(geo.attributes)
        .map(([n, a]) => `${n}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`)
        .sort()
        .join(",");
      const key = `${line}|${o.castShadow}|${o.receiveShadow}|${attrs}|${look}`;
      let b = buckets.get(key);
      if (!b)
        buckets.set(
          key,
          (b = { line, cast: o.castShadow, receive: o.receiveShadow, material: shared, geos: [] }),
        );
      b.geos.push(geo);
    }
    merged.push(o);
  };
  visit(group);

  // take the merged parts out, keeping anything that hangs from them and was not merged
  const gone = new Set(merged);
  for (const o of merged) {
    for (const c of [...o.children]) if (!gone.has(c)) group.attach(c);
    o.removeFromParent();
  }
  for (const b of buckets.values()) {
    const one = b.geos.length > 1 ? mergeGeometries(b.geos) : b.geos[0];
    for (const g of one ? [one] : b.geos) {
      opts.track(g);
      const o = b.line ? new THREE.LineSegments(g, b.material) : new THREE.Mesh(g, b.material);
      o.castShadow = b.cast;
      o.receiveShadow = b.receive;
      group.add(o);
    }
  }
}

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

/**
 * Lets the browser handle input and paint between the heavy steps of building the model (on a
 * slow phone the whole build is several seconds of work).
 */
const pause = () => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return s?.yield ? s.yield() : new Promise<void>((done) => setTimeout(done, 0));
};

async function initSite(
  root: HTMLElement,
  host: HTMLElement,
  options: { embedded: boolean; aerial: HTMLImageElement | null; onReady: () => void },
) {
  const A = !!options.aerial;
  const cleanups: Array<() => void> = [];
  const listen = (t: EventTarget, type: string, fn: (e: never) => void) => {
    const f = fn as unknown as EventListener;
    t.addEventListener(type, f);
    cleanups.push(() => t.removeEventListener(type, f));
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fw = () => root.clientWidth || 1;
  const fh = () => root.clientHeight || 1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 36, 78);
  const camera = new THREE.PerspectiveCamera(30, fw() / fh(), 0.1, 300);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  // Windows/ANGLE prints harmless X4122 precision warnings for three's built-in shaders; skip the log check.
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(fw(), fh());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 60;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.rotateSpeed = 0.45;
  if (options.embedded) {
    controls.enableZoom = false;
    if (matchMedia("(pointer:coarse)").matches) controls.enableRotate = false;
  }

  // The environment map is made once the scene is built (see "start" below).
  let env: THREE.WebGLRenderTarget | null = null;
  scene.environmentIntensity = 0.32;
  scene.add(new THREE.HemisphereLight(0xe6f0f8, 0x6b5d4a, 1.25));
  const sun = new THREE.DirectionalLight(0xfff2de, 3.3);
  sun.position.set(9, 14, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
    near: 1,
    far: 50,
  });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);

  const geos: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T) => (geos.push(g), g);
  const canvasTex = (
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
    repeat = false,
  ) => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    draw(cv.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const std = (
    color: number,
    roughness = 0.7,
    metalness = 0,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const mesh = (
    g: THREE.BufferGeometry,
    m: THREE.Material | THREE.Material[],
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  };

  const site = new THREE.Group();
  scene.add(site);

  // ---- blueprint survey disc and soft shadow below the model -------------
  const FLOOR_Y = -4.2;
  {
    const bp = canvasTex(1024, 1024, (c, w) => {
      const cx = w / 2;
      c.strokeStyle = "rgba(46,125,143,.55)";
      c.fillStyle = "rgba(46,125,143,.7)";
      c.lineWidth = 2;
      for (const r of [500, 470, 360, 240]) {
        c.beginPath();
        c.arc(cx, cx, r, 0, Math.PI * 2);
        c.stroke();
      }
      c.setLineDash([8, 10]);
      c.beginPath();
      c.arc(cx, cx, 420, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      for (let i = 0; i < 360; i += 2) {
        const a = deg(i),
          long = i % 10 === 0;
        c.lineWidth = long ? 2 : 1;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 470, cx + Math.sin(a) * 470);
        c.lineTo(
          cx + Math.cos(a) * (470 - (long ? 22 : 10)),
          cx + Math.sin(a) * (470 - (long ? 22 : 10)),
        );
        c.stroke();
      }
      c.font = "600 20px ui-monospace, Menlo, monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (let i = 0; i < 360; i += 30) {
        const a = deg(i - 90);
        c.fillText(
          i === 0 ? "N" : String(i).padStart(3, "0"),
          cx + Math.cos(a) * 436,
          cx + Math.sin(a) * 436,
        );
      }
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(cx - 500, cx);
      c.lineTo(cx + 500, cx);
      c.moveTo(cx, cx - 500);
      c.lineTo(cx, cx + 500);
      c.stroke();
    });
    const disc = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(26, 26)),
      new THREE.MeshBasicMaterial({
        map: bp,
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
        fog: false,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = FLOOR_Y;
    scene.add(disc);
    const shadow = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(60, 60)),
      new THREE.ShadowMaterial({ opacity: 0.13 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = FLOOR_Y + 0.01;
    shadow.receiveShadow = true;
    scene.add(shadow);
  }

  // ---- drone photo: texture, colour sampler -------------------------------
  // The cleaned photo frame is 1920 x 960 px (north up). It sits inside a larger canvas
  // padded with generated forest, feathered at the seam, so the whole oval is covered.
  const FRAME_W = 1920,
    FRAME_H = 960,
    OX = 70,
    OY = 180;
  const PW = 2064,
    PH = 1320;
  const photoPx = (x: number, z: number): [number, number] => [
    x * SC + 1000 + OX,
    z * SC + 560 - 60 + OY,
  ];
  const photoUV = (x: number, z: number): [number, number] => {
    const [px, py] = photoPx(x, z);
    return [Math.min(1, Math.max(0, px / PW)), 1 - Math.min(1, Math.max(0, py / PH))];
  };
  let photoTex: THREE.Texture | null = null;
  let photoData: Uint8ClampedArray | null = null;
  if (options.aerial) {
    const cv = document.createElement("canvas");
    cv.width = PW;
    cv.height = PH;
    const cx = cv.getContext("2d", { willReadFrequently: true })!;
    // forest canopy for the padding
    cx.fillStyle = "#28461f";
    cx.fillRect(0, 0, PW, PH);
    const rr = rand(7);
    for (let n = 0; n < 26000; n++) {
      cx.fillStyle = `hsl(${92 + rr() * 22},${32 + rr() * 22}%,${10 + rr() * 16}%)`;
      cx.beginPath();
      cx.arc(rr() * PW, rr() * PH, 3 + rr() * 9, 0, Math.PI * 2);
      cx.fill();
    }
    // the photo, with its edges feathered into the forest
    const ph = document.createElement("canvas");
    ph.width = FRAME_W;
    ph.height = FRAME_H;
    const pc = ph.getContext("2d")!;
    pc.drawImage(options.aerial, 0, 0, FRAME_W, FRAME_H);
    pc.globalCompositeOperation = "destination-out";
    const F = 48;
    const edge = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      rx: number,
      ry: number,
      rw: number,
      rh: number,
    ) => {
      const g = pc.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      pc.fillStyle = g;
      pc.fillRect(rx, ry, rw, rh);
    };
    edge(0, 0, 0, F, 0, 0, FRAME_W, F);
    edge(0, FRAME_H, 0, FRAME_H - F, 0, FRAME_H - F, FRAME_W, F);
    edge(0, 0, F, 0, 0, 0, F, FRAME_H);
    edge(FRAME_W, 0, FRAME_W - F, 0, FRAME_W - F, 0, F, FRAME_H);
    cx.drawImage(ph, OX, OY);
    photoData = cx.getImageData(0, 0, PW, PH).data;
    photoTex = new THREE.CanvasTexture(cv);
    photoTex.colorSpace = THREE.SRGBColorSpace;
    photoTex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    photoTex.wrapS = photoTex.wrapT = THREE.ClampToEdgeWrapping;
  }
  const samplePhoto = (x: number, z: number, out: THREE.Color) => {
    const [px, py] = photoPx(x, z);
    const ix = Math.min(PW - 1, Math.max(0, Math.round(px))),
      iy = Math.min(PH - 1, Math.max(0, Math.round(py)));
    const k = (iy * PW + ix) * 4;
    return out.setRGB(
      photoData![k] / 255,
      photoData![k + 1] / 255,
      photoData![k + 2] / 255,
      THREE.SRGBColorSpace,
    );
  };
  const photoMat = (rough = 0.85) => std(0xffffff, rough, 0, { map: photoTex });

  await pause();
  // ---- terrain top -------------------------------------------------------
  let topMesh: THREE.Mesh;
  {
    const RINGS = 70,
      SEGS = 240;
    const pos: number[] = [],
      col: number[] = [],
      idx: number[] = [],
      uvs: number[] = [];
    const forest = new THREE.Color(0x23501d),
      lawn = new THREE.Color(0x4f8f2b),
      c = new THREE.Color();
    for (let i = 0; i <= RINGS; i++)
      for (let j = 0; j < SEGS; j++) {
        const a = (j / SEGS) * Math.PI * 2,
          rr = i / RINGS;
        const x = Math.cos(a) * rr * RX,
          z = Math.sin(a) * rr * RZ;
        const { h, lawn: lw } = terrain(x, z);
        pos.push(x, h, z);
        uvs.push(...photoUV(x, z));
        const n = Math.sin(x * 1.9 + 1) * Math.cos(z * 1.6) * 0.5 + 0.5;
        c.copy(forest).lerp(lawn, Math.min(1, lw + n * 0.25 + (1 - sstep(0.55, 0.85, rr)) * 0.35));
        col.push(c.r, c.g, c.b);
      }
    for (let i = 0; i < RINGS; i++)
      for (let j = 0; j < SEGS; j++) {
        const a = i * SEGS + j,
          b = i * SEGS + ((j + 1) % SEGS);
        idx.push(a, b, a + SEGS, b, b + SEGS, a + SEGS);
      }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    topMesh = new THREE.Mesh(
      g,
      A ? photoMat(0.95) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    );
    topMesh.receiveShadow = true;
    site.add(topMesh);
  }

  await pause();
  // ---- the cut face: strata ----------------------------------------------
  const BOTTOM = -2.6;
  const rimY = (a: number) => heightAt(Math.cos(a) * RX, Math.sin(a) * RZ);
  {
    const SEG = 240,
      ROWS = 90;
    const bands: Array<[number, THREE.Color]> = [
      [0.06, new THREE.Color(0x4f7d36)], // turf
      [0.38, new THREE.Color(0x5e4029)], // topsoil
      [0.85, new THREE.Color(0x9a6a3c)], // clay
      [1.35, new THREE.Color(0xb59a6c)], // sand and gravel
      [1.95, new THREE.Color(0x868a8f)], // weathered rock
      [99, new THREE.Color(0x5f646b)], // bedrock
    ];
    const pos: number[] = [],
      col: number[] = [],
      idx: number[] = [];
    for (let k = 0; k <= ROWS; k++)
      for (let j = 0; j <= SEG; j++) {
        const a = (j / SEG) * Math.PI * 2,
          top = rimY(a);
        const y = top + (BOTTOM - top) * (k / ROWS);
        pos.push(Math.cos(a) * RX, y, Math.sin(a) * RZ);
        const depth = top - y;
        let c = bands[bands.length - 1][1];
        for (let b = 0; b < bands.length; b++) {
          const wobble = b
            ? 0.07 * Math.sin(a * (3 + b) + b * 1.7) + 0.035 * Math.sin(a * 11 + b)
            : 0;
          if (depth < bands[b][0] + wobble) {
            c = bands[b][1];
            break;
          }
        }
        const grain = 0.94 + 0.06 * Math.sin(a * 40 + k * 0.7);
        col.push(c.r * grain, c.g * grain, c.b * grain);
      }
    for (let k = 0; k < ROWS; k++)
      for (let j = 0; j < SEG; j++) {
        const a = k * (SEG + 1) + j,
          b = a + SEG + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const wall = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
    );
    wall.castShadow = true;
    site.add(wall);
    const base = new THREE.Mesh(keep(new THREE.CircleGeometry(1, 120)), std(0x50555b, 0.9));
    base.rotation.x = Math.PI / 2;
    base.scale.set(RX, RZ, 1);
    base.position.y = BOTTOM;
    site.add(base);
    // model outlines: top edge and base edge
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2e7d8f,
      transparent: true,
      opacity: 0.9,
    });
    const topPts: THREE.Vector3[] = [],
      botPts: THREE.Vector3[] = [];
    for (let j = 0; j <= 240; j++) {
      const a = (j / 240) * Math.PI * 2;
      topPts.push(
        new THREE.Vector3(Math.cos(a) * (RX + 0.01), rimY(a) + 0.01, Math.sin(a) * (RZ + 0.01)),
      );
      botPts.push(new THREE.Vector3(Math.cos(a) * (RX + 0.01), BOTTOM, Math.sin(a) * (RZ + 0.01)));
    }
    site.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(topPts)), lineMat));
    site.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(botPts)), lineMat));
    // survey ticks around the base
    const ticks: THREE.Vector3[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2,
        l = i % 6 === 0 ? 0.35 : 0.15;
      ticks.push(
        new THREE.Vector3(Math.cos(a) * (RX + 0.02), BOTTOM, Math.sin(a) * (RZ + 0.02)),
        new THREE.Vector3(Math.cos(a) * (RX + 0.02), BOTTOM + l, Math.sin(a) * (RZ + 0.02)),
      );
    }
    site.add(
      new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(ticks)), lineMat),
    );
  }

  await pause();
  // ---- surface decals: turf field, lawn court ------------------------------
  const decal = (
    x: number,
    z: number,
    w: number,
    d: number,
    rot: number,
    t: THREE.Texture,
    lift = 0.012,
    keepWithPhoto = false,
  ) => {
    if (A && !keepWithPhoto) return t.dispose(); // the photo already shows the pitch and courts
    const m = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(w, d)),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }),
    );
    m.rotation.set(-Math.PI / 2, 0, -deg(rot));
    m.position.set(x, smooth(x, z) + lift, z);
    m.receiveShadow = true;
    site.add(m);
    return m;
  };
  decal(
    FIELD.x,
    FIELD.z,
    FIELD.d + 0.42,
    FIELD.w + 0.42,
    FIELD.rot - 90,
    canvasTex(1024, 680, (c, w, h) => {
      c.fillStyle = "#9aa29a"; // concrete apron
      c.fillRect(0, 0, w, h);
      const m = 34;
      for (let i = 0; i < 16; i++) {
        c.fillStyle = i % 2 ? "#2f7d33" : "#378a3a";
        c.fillRect(m + (i * (w - 2 * m)) / 16, m, (w - 2 * m) / 16 + 1, h - 2 * m);
      }
      c.strokeStyle = "rgba(255,255,255,.92)";
      c.lineWidth = 4;
      const L = m + 18,
        T = m + 18,
        W = w - 2 * L,
        H = h - 2 * T;
      c.strokeRect(L, T, W, H);
      c.beginPath();
      c.moveTo(w / 2, T);
      c.lineTo(w / 2, T + H);
      c.stroke();
      c.beginPath();
      c.arc(w / 2, h / 2, 64, 0, Math.PI * 2);
      c.stroke();
      for (const side of [0, 1]) {
        const x = side ? L + W - 150 : L;
        c.strokeRect(x, h / 2 - 150, 150, 300);
        c.strokeRect(side ? L + W - 55 : L, h / 2 - 70, 55, 140);
        c.beginPath();
        c.arc(
          side ? L + W - 150 : L + 150,
          h / 2,
          52,
          side ? Math.PI / 2 : -Math.PI / 2,
          side ? -Math.PI / 2 : Math.PI / 2,
          side === 0,
        );
        c.stroke();
      }
    }),
  );
  decal(
    COURT.x,
    COURT.z,
    COURT.w,
    COURT.d,
    COURT.rot,
    canvasTex(512, 300, (c, w, h) => {
      c.fillStyle = "#a2463f";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#3b6fb0";
      c.fillRect(30, 40, 180, 220);
      c.fillRect(w - 210, 40, 180, 220);
      c.strokeStyle = "#f2efe8";
      c.lineWidth = 4;
      c.strokeRect(30, 40, 180, 220);
      c.strokeRect(w - 210, 40, 180, 220);
      c.beginPath();
      c.moveTo(120, 40);
      c.lineTo(120, 260);
      c.moveTo(w - 120, 40);
      c.lineTo(w - 120, 260);
      c.stroke();
    }),
  );
  // ---- helipad: a raised asphalt pad south of the hostels -------------------
  {
    const grp = new THREE.Group();
    grp.position.set(HELIPAD.x, smooth(HELIPAD.x, HELIPAD.z), HELIPAD.z);
    grp.rotation.y = -deg(HELIPAD.rot);
    site.add(grp);
    const top = canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = "#4f565c";
      c.fillRect(0, 0, w, h);
      const r = rand(5);
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.035)`;
        c.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6);
      }
      c.strokeStyle = "rgba(240,238,230,.85)";
      c.lineWidth = 8;
      c.setLineDash([46, 30]);
      c.strokeRect(22, 22, w - 44, h - 44);
      c.setLineDash([]);
      c.lineWidth = 10;
      c.beginPath();
      c.arc(w / 2, h / 2, 150, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "rgba(240,238,230,.9)";
      c.font = "700 190px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("H", w / 2, h / 2 + 10);
    });
    const slabMats = [
      std(0x8e9196, 0.9),
      std(0x8e9196, 0.9),
      std(0xffffff, 0.85, 0, { map: top }),
      std(0x8e9196, 0.9),
      std(0x8e9196, 0.9),
      std(0x8e9196, 0.9),
    ];
    const slab = mesh(
      keep(new THREE.BoxGeometry(HELIPAD.w, 0.06, HELIPAD.d)),
      slabMats,
      grp,
      0,
      0.03,
      0,
    );
    slab.castShadow = false;
    // windsock on the north-east corner
    const pole = mesh(
      keep(new THREE.CylinderGeometry(0.008, 0.01, 0.4, 6)),
      std(0xe9e7e1, 0.4),
      grp,
      HELIPAD.w / 2 + 0.08,
      0.2,
      -HELIPAD.d / 2 - 0.05,
    );
    void pole;
    const sock = mesh(
      keep(new THREE.ConeGeometry(0.028, 0.14, 10, 1, true)),
      std(0xf06a1f, 0.6, 0, { side: THREE.DoubleSide }),
      grp,
      HELIPAD.w / 2 + 0.15,
      0.38,
      -HELIPAD.d / 2 - 0.05,
    );
    sock.rotation.z = Math.PI / 2 + 0.25;
    // the pad is part of the ground, so it does not rise in with the buildings
  }

  // ---- paths and plaza between the hostels ---------------------------------
  {
    const concrete = std(0xe6e1d4, 0.85, 0, {
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const kerb = std(0xb9b3a4, 0.9, 0, {
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const strip = (pts: THREE.Vector3[], W: number, lift: number, mat: THREE.Material) => {
      const p: number[] = [],
        idx: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)],
          b = pts[Math.min(pts.length - 1, i + 1)];
        const tx = b.x - a.x,
          tz = b.z - a.z,
          l = Math.hypot(tx, tz) || 1;
        for (const sgn of [1, -1]) {
          const x = pts[i].x - (tz / l) * W * sgn,
            z = pts[i].z + (tx / l) * W * sgn;
          p.push(x, heightAt(x, z) + lift, z);
        }
        if (i > 0) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
      }
      const g = keep(new THREE.BufferGeometry());
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      site.add(m);
    };
    for (const path of HOSTEL_PATHS) {
      const curve = new THREE.CatmullRomCurve3(
        path.map(([px, py]) => new THREE.Vector3(wx(px), 0, wz(py))),
      );
      const pts = curve.getSpacedPoints(Math.max(4, Math.round(curve.getLength() * 20)));
      strip(pts, 0.072, 0.03, kerb);
      strip(pts, 0.058, 0.036, concrete);
    }
    // paved plaza: a flat polygon following the ground
    const shape = new THREE.Shape(
      HOSTEL_PLAZA.map(([px, py]) => new THREE.Vector2(wx(px), -wz(py))),
    );
    const g = keep(new THREE.ShapeGeometry(shape, 1));
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) + 0.034);
    g.computeVertexNormals();
    const plaza = new THREE.Mesh(g, concrete);
    plaza.receiveShadow = true;
    site.add(plaza);
  }

  await pause();
  // ---- roads, lamps --------------------------------------------------------
  const roads = ROADS.map(
    (r) =>
      new THREE.CatmullRomCurve3(
        r.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
        false,
        "catmullrom",
        0.4,
      ),
  );
  const campusRoads = roads.filter((_, i) => ROADS[i].lamps);
  const roadSamples: THREE.Vector3[] = [];
  const inside = (x: number, z: number, m = 0) => (x / (RX - m)) ** 2 + (z / (RZ - m)) ** 2 < 1;
  {
    const kerb = std(0xe7e2d6, 0.8, 0, {
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    });
    roads.forEach((curve, ri) => {
      const def = ROADS[ri];
      const asphalt = std(def.color, 0.9, 0, {
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.DoubleSide,
      });
      const N = Math.round(curve.getLength() * 28);
      const strip = (W: number, lift: number, mat: THREE.Material) => {
        const p: number[] = [],
          idx: number[] = [];
        let k = 0;
        for (let i = 0; i <= N; i++) {
          const c = curve.getPointAt(i / N),
            t = curve.getTangentAt(i / N);
          if (!inside(c.x, c.z, 0.05)) continue;
          for (const s of [1, -1]) {
            const x = c.x - t.z * W * s,
              z = c.z + t.x * W * s;
            p.push(x, heightAt(x, z) + lift, z);
          }
          if (k > 0)
            idx.push((k - 1) * 2, (k - 1) * 2 + 1, k * 2, (k - 1) * 2 + 1, k * 2 + 1, k * 2);
          k++;
          if (lift > 0.033 && i % 3 === 0) roadSamples.push(c);
        }
        const g = keep(new THREE.BufferGeometry());
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, mat);
        m.receiveShadow = true;
        if (!A) site.add(m); // with the photo, the real roads show through
      };
      strip(def.w + 0.035, 0.03, kerb);
      strip(def.w, 0.036, asphalt);
    });
  }
  // globe street lamps along the roads
  {
    const poleGeo = keep(new THREE.CylinderGeometry(0.011, 0.015, 0.42, 6));
    poleGeo.translate(0, 0.21, 0);
    const globeGeo = keep(new THREE.SphereGeometry(0.04, 12, 8));
    const poleMat = std(0xf2f0ea, 0.4);
    const globeMat = std(0xfffbee, 0.2, 0, { emissive: 0xfff4d0, emissiveIntensity: 0.5 });
    const N = 90;
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, N),
      globes = new THREE.InstancedMesh(globeGeo, globeMat, N);
    poles.castShadow = true;
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const curve of campusRoads) {
      const L = curve.getLength(),
        count = Math.floor(L / 0.7);
      for (let i = 1; i < count && n < N; i++) {
        const u = i / count,
          c = curve.getPointAt(u),
          t = curve.getTangentAt(u);
        const s = i % 2 ? 1 : -1;
        const x = c.x - t.z * 0.22 * s,
          z = c.z + t.x * 0.22 * s;
        if (!inside(x, z, 0.3) || inPad(x, z, 0.05)) continue;
        const y = heightAt(x, z);
        m4.makeTranslation(x, y, z);
        poles.setMatrixAt(n, m4);
        m4.makeTranslation(x, y + 0.45, z);
        globes.setMatrixAt(n, m4);
        n++;
      }
    }
    poles.count = globes.count = n;
    if (!A) site.add(poles, globes);
  }

  // ---- facades ---------------------------------------------------------
  const FACADE: Record<Facade, THREE.Texture> = {
    modern: canvasTex(
      64,
      64,
      (c) => {
        c.fillStyle = "#f0bd36";
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "#c63a2f";
        c.fillRect(0, 0, 7, 64);
        const g = c.createLinearGradient(12, 10, 56, 50);
        g.addColorStop(0, "#5d8fc9");
        g.addColorStop(1, "#2d5591");
        c.fillStyle = "#c63a2f";
        c.fillRect(13, 11, 44, 38);
        c.fillStyle = g;
        c.fillRect(16, 14, 38, 32);
        c.fillStyle = "rgba(255,255,255,.75)";
        c.fillRect(34, 14, 2, 32);
        c.fillStyle = "#f6f2e6";
        c.fillRect(0, 58, 64, 6);
      },
      true,
    ),
    glass: canvasTex(
      64,
      64,
      (c) => {
        const g = c.createLinearGradient(0, 0, 64, 64);
        g.addColorStop(0, "#5c8fd0");
        g.addColorStop(1, "#2b5592");
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "#e9edf2";
        c.fillRect(0, 0, 3, 64);
        c.fillRect(31, 0, 2, 58);
        c.fillRect(0, 28, 64, 2);
        c.fillRect(0, 58, 64, 6);
      },
      true,
    ),
    heritage: canvasTex(
      64,
      64,
      (c) => {
        c.fillStyle = "#eed58e";
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "#a3322b";
        c.fillRect(18, 14, 28, 32);
        c.fillStyle = "#3a4d5e";
        c.fillRect(21, 17, 22, 26);
        c.fillStyle = "#d8c79a";
        c.fillRect(31, 17, 2, 26);
        c.fillStyle = "#a3322b";
        c.fillRect(0, 56, 64, 8);
      },
      true,
    ),
    yellow: canvasTex(
      64,
      64,
      (c) => {
        c.fillStyle = "#f2c43c";
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "rgba(0,0,0,.06)";
        c.fillRect(0, 30, 64, 2);
        c.fillStyle = "#3b5f8c";
        c.fillRect(24, 16, 16, 22);
        c.fillStyle = "#f6f2e6";
        c.fillRect(0, 58, 64, 6);
      },
      true,
    ),
    white: canvasTex(
      64,
      64,
      (c) => {
        c.fillStyle = "#f5f4f0";
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "#c8473c";
        c.fillRect(0, 0, 5, 64);
        c.fillStyle = "#2c3e4f";
        c.fillRect(17, 15, 30, 26);
        c.fillStyle = "rgba(160,200,225,.45)";
        c.fillRect(19, 17, 12, 22);
        c.fillStyle = "#f5f4f0";
        c.fillRect(31, 15, 2, 26);
        c.fillStyle = "#dcd9d0";
        c.fillRect(0, 57, 64, 7);
      },
      true,
    ),
    cream: canvasTex(
      64,
      64,
      (c) => {
        c.fillStyle = "#efe9da";
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = "#41586b";
        c.fillRect(16, 16, 32, 26);
        c.fillStyle = "#efe9da";
        c.fillRect(31, 16, 2, 26);
        c.fillStyle = "#c9c1ad";
        c.fillRect(0, 58, 64, 6);
      },
      true,
    ),
  };
  const facadeMat = (f: Facade, bays: number, floors: number) => {
    const t = FACADE[f].clone();
    t.needsUpdate = true;
    t.repeat.set(bays, floors);
    return std(0xffffff, 0.7, 0, { map: t });
  };

  // ---- roofs -----------------------------------------------------------
  function hipGeo(W: number, D: number, H: number) {
    const swap = D > W;
    const w = swap ? D : W,
      d = swap ? W : D,
      r = (w - d) / 2;
    const A = [-w / 2, 0, -d / 2],
      B = [w / 2, 0, -d / 2],
      C = [w / 2, 0, d / 2],
      Dd = [-w / 2, 0, d / 2],
      R1 = [-r, H, 0],
      R2 = [r, H, 0];
    const tris = [Dd, C, R2, Dd, R2, R1, B, A, R1, B, R1, R2, C, B, R2, A, Dd, R1];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(), 3));
    g.computeVertexNormals();
    if (swap) g.rotateY(Math.PI / 2);
    return keep(g);
  }
  function gableGeo(W: number, D: number, H: number) {
    const alongX = W >= D,
      span = alongX ? D : W,
      len = alongX ? W : D;
    const s = new THREE.Shape([
      new THREE.Vector2(-span / 2, 0),
      new THREE.Vector2(span / 2, 0),
      new THREE.Vector2(0, H),
    ]);
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    if (alongX) g.rotateY(Math.PI / 2);
    return keep(g);
  }

  await pause();
  // ---- buildings ---------------------------------------------------------
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x2e7d8f,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  type Rise = { obj: THREE.Object3D; delay: number };
  const risers: Rise[] = [];
  const addEdges = (g: THREE.Object3D) =>
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh)
        m.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(m.geometry, 25)), edgeMat));
    });
  const trimMat = std(0xf4f1e8, 0.5);
  const solarMat = std(0x1d2c4a, 0.25, 0.6);

  for (const b of BLOCKS) {
    const grp = new THREE.Group();
    grp.position.set(b.x, smooth(b.x, b.z), b.z);
    grp.rotation.y = -deg(b.rot);
    site.add(grp);
    const H = b.floors * FH;
    const mats = [
      facadeMat(b.side, Math.max(1, Math.round(b.d / 0.26)), b.floors),
      facadeMat(b.side, Math.max(1, Math.round(b.d / 0.26)), b.floors),
      trimMat,
      trimMat,
      facadeMat(b.front, Math.max(1, Math.round(b.w / 0.26)), b.floors),
      facadeMat(b.front, Math.max(1, Math.round(b.w / 0.26)), b.floors),
    ];
    mesh(keep(new THREE.BoxGeometry(b.w, H, b.d)), mats, grp, 0, H / 2 - 0.02, 0);
    // plinth and eaves trim
    mesh(
      keep(new THREE.BoxGeometry(b.w + 0.05, 0.05, b.d + 0.05)),
      std(0x8d8a82, 0.8),
      grp,
      0,
      0.0,
      0,
    );
    const ov = 0.09;
    mesh(
      keep(new THREE.BoxGeometry(b.w + ov * 2, 0.045, b.d + ov * 2)),
      trimMat,
      grp,
      0,
      H + 0.0,
      0,
    );
    const roofMat = std(b.roofColor, 0.72, 0);
    const RW = b.w + ov * 2,
      RD = b.d + ov * 2;
    const roofH = b.roofH ?? Math.min(0.32, Math.min(RW, RD) * 0.38);
    const roof = mesh(
      b.roof === "hip" ? hipGeo(RW, RD, roofH) : gableGeo(RW, RD, roofH),
      roofMat,
      grp,
      0,
      H + 0.022,
      0,
    );
    void roof;
    if (b.roof === "hip" && !b.cst && !b.solar && b.floors >= 4 && RW - RD > 0.2) {
      // the raised ridge lantern seen on the drone photo
      mesh(
        keep(new THREE.BoxGeometry(Math.max(0.1, RW - RD) * 0.9 + 0.12, 0.05, 0.14)),
        std(new THREE.Color(b.roofColor).multiplyScalar(0.8).getHex(), 0.5),
        grp,
        0,
        H + roofH - 0.01,
        0,
      );
    }
    if (b.solar) {
      const half = RD / 2,
        slopeLen = Math.hypot(half, roofH),
        tilt = Math.atan2(roofH, half);
      const run = RW - RD - 0.1; // flat stretch of the south slope
      void run;
      const cell = 0.085,
        cols = Math.max(2, Math.floor((RW * 0.86) / cell)),
        rows = Math.max(2, Math.floor((slopeLen * 0.8) / cell));
      const panelGeo = keep(new THREE.BoxGeometry(cell * 0.92, 0.012, cell * 0.88));
      for (let ri = 0; ri < rows; ri++)
        for (let ci = 0; ci < cols; ci++) {
          const x = (ci - (cols - 1) / 2) * cell;
          const f = (slopeLen * 0.12 + (ri + 0.5) * cell) / slopeLen;
          if (Math.abs(x) > RW / 2 - half * f - 0.05) continue; // stay inside the hip
          const p = mesh(panelGeo, solarMat, grp, x, H + 0.022 + roofH * (1 - f) + 0.012, half * f);
          p.rotation.x = tilt;
        }
    }
    if (b.cst) {
      // solar panels spelling C S T on the south slope of the green roof
      const LET: Record<string, string[]> = {
        C: ["###", "#..", "#..", "#..", "###"],
        S: ["###", "#..", "###", "..#", "###"],
        T: ["###", ".#.", ".#.", ".#.", ".#."],
      };
      const half = RD / 2,
        slopeLen = Math.hypot(half, roofH),
        tilt = Math.atan2(roofH, half);
      const cell = Math.min(0.15, (slopeLen * 0.82) / 5),
        cols = 11;
      const panelGeo = keep(new THREE.BoxGeometry(cell * 0.9, 0.012, cell * 0.86));
      ["C", "S", "T"].forEach((L, li) =>
        LET[L].forEach((row, ri) =>
          [...row].forEach((ch, ci) => {
            if (ch !== "#") return;
            const col = li * 4 + ci;
            const x = (col - (cols - 1) / 2) * cell;
            const sAlong = slopeLen * 0.1 + (ri + 0.5) * cell; // distance down from ridge
            const f = sAlong / slopeLen;
            const p = mesh(
              panelGeo,
              solarMat,
              grp,
              x,
              H + 0.022 + roofH * (1 - f) + 0.012,
              half * f,
            );
            p.rotation.x = tilt;
          }),
        ),
      );
    }
    risers.push({ obj: grp, delay: Math.hypot(b.x, b.z) });
  }
  // covered walkway beside the ground
  {
    const [[ax, az], [bx, bz]] = WALKWAY;
    const len = Math.hypot(bx - ax, bz - az);
    const grp = new THREE.Group();
    grp.position.set((ax + bx) / 2, smooth((ax + bx) / 2, (az + bz) / 2), (az + bz) / 2);
    grp.rotation.y = -Math.atan2(bz - az, bx - ax);
    site.add(grp);
    mesh(keep(new THREE.BoxGeometry(len, 0.03, 0.22)), std(0xa9adb1, 0.5, 0.3), grp, 0, 0.3, 0);
    const postG = keep(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6));
    const postM = std(0xb07a3e, 0.6);
    for (let u = -len / 2 + 0.08; u <= len / 2; u += 0.32)
      for (const dz of [-0.09, 0.09]) mesh(postG, postM, grp, u, 0.15, dz);
    risers.push({ obj: grp, delay: 3.2 });
  }

  await pause();
  // ---- pitch fence and floodlights -----------------------------------------
  {
    const grp = new THREE.Group();
    grp.position.set(FIELD.x, smooth(FIELD.x, FIELD.z), FIELD.z);
    grp.rotation.y = -deg(FIELD.rot);
    site.add(grp);
    const hw = FIELD.w / 2 + 0.2,
      hd = FIELD.d / 2 + 0.2;
    const fence = new THREE.MeshStandardMaterial({
      color: 0xdfe3e6,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (const [x, z, w, d] of [
      [0, -hd, hw * 2, 0],
      [0, hd, hw * 2, 0],
      [-hw, 0, 0, hd * 2],
      [hw, 0, 0, hd * 2],
    ] as const) {
      const f = new THREE.Mesh(keep(new THREE.PlaneGeometry(Math.max(w, d), 0.22)), fence);
      f.position.set(x, 0.12, z);
      if (d) f.rotation.y = Math.PI / 2;
      grp.add(f);
    }
    const pole = keep(new THREE.CylinderGeometry(0.018, 0.026, 1.1, 8));
    const head = keep(new THREE.BoxGeometry(0.16, 0.08, 0.04));
    const poleMat = std(0xb9bfc5, 0.4, 0.6),
      lampMat = std(0xffffff, 0.2, 0, { emissive: 0xfff6dd, emissiveIntensity: 0.6 });
    for (const sx of [-1, 1])
      for (const sz of [-1, -0.33, 0.33, 1]) {
        mesh(pole, poleMat, grp, sx * (hw + 0.06), 0.55, sz * hd * 0.92);
        const h = mesh(head, lampMat, grp, sx * (hw + 0.02), 1.12, sz * hd * 0.92);
        h.rotation.y = Math.PI / 2;
      }
    risers.push({ obj: grp, delay: 1.8 });
  }
  // ---- telecom lattice mast ------------------------------------------------
  {
    const grp = new THREE.Group();
    grp.position.set(MAST.x, smooth(MAST.x, MAST.z), MAST.z);
    site.add(grp);
    const steel = std(0xc9cdd2, 0.4, 0.7),
      Hm = 2.4,
      pts: THREE.Vector3[] = [];
    const r = (y: number) => 0.16 * (1 - y / Hm) + 0.03;
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * Math.PI * 2,
        a1 = ((k + 1) / 3) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(a0) * r(0), 0, Math.sin(a0) * r(0)),
        new THREE.Vector3(Math.cos(a0) * r(Hm), Hm, Math.sin(a0) * r(Hm)),
      );
      for (let y = 0; y < Hm; y += 0.2) {
        pts.push(
          new THREE.Vector3(Math.cos(a0) * r(y), y, Math.sin(a0) * r(y)),
          new THREE.Vector3(Math.cos(a1) * r(y + 0.2), y + 0.2, Math.sin(a1) * r(y + 0.2)),
        );
        pts.push(
          new THREE.Vector3(Math.cos(a0) * r(y), y, Math.sin(a0) * r(y)),
          new THREE.Vector3(Math.cos(a1) * r(y), y, Math.sin(a1) * r(y)),
        );
      }
    }
    grp.add(
      new THREE.LineSegments(
        keep(new THREE.BufferGeometry().setFromPoints(pts)),
        new THREE.LineBasicMaterial({ color: 0x9aa1a8 }),
      ),
    );
    mesh(keep(new THREE.CylinderGeometry(0.012, 0.012, Hm, 5)), steel, grp, 0, Hm / 2, 0);
    for (const a of [0, 2.1, 4.2])
      mesh(
        keep(new THREE.BoxGeometry(0.05, 0.16, 0.02)),
        steel,
        grp,
        Math.cos(a) * 0.07,
        Hm - 0.15,
        Math.sin(a) * 0.07,
      ).rotation.y = -a;
    risers.push({ obj: grp, delay: 1.5 });
  }

  // ---- water tower: red and white checkered tank --------------------------
  {
    const grp = new THREE.Group();
    const y0 = smooth(TOWER.x, TOWER.z);
    grp.position.set(TOWER.x, y0, TOWER.z);
    site.add(grp);
    const white = std(0xf3f2ee, 0.45);
    const LEGS = 6,
      legR = 0.24,
      legH = 1.85;
    const legG = keep(new THREE.CylinderGeometry(0.022, 0.026, legH, 8));
    for (let i = 0; i < LEGS; i++) {
      const a = (i / LEGS) * Math.PI * 2;
      mesh(legG, white, grp, Math.cos(a) * legR, legH / 2, Math.sin(a) * legR);
    }
    for (const y of [0.45, 0.9, 1.35]) {
      const ring = mesh(keep(new THREE.TorusGeometry(legR, 0.012, 6, 24)), white, grp, 0, y, 0);
      ring.rotation.x = Math.PI / 2;
    }
    // spiral stair inside the frame
    const helix: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      helix.push(
        new THREE.Vector3(
          Math.cos(t * Math.PI * 6) * 0.11,
          t * legH,
          Math.sin(t * Math.PI * 6) * 0.11,
        ),
      );
    }
    mesh(
      keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 160, 0.012, 5, false)),
      white,
      grp,
    );
    mesh(keep(new THREE.CylinderGeometry(0.012, 0.012, legH, 6)), white, grp, 0, legH / 2, 0);
    // platform, tank, rail, cap
    const plat = mesh(
      keep(new THREE.CylinderGeometry(0.42, 0.3, 0.12, 28)),
      white,
      grp,
      0,
      legH + 0.04,
      0,
    );
    void plat;
    const checks = canvasTex(512, 128, (c, w, h) => {
      const cols = 16,
        rows = 4;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          c.fillStyle = (i + j) % 2 ? "#c43a33" : "#f4f2ec";
          c.fillRect((i * w) / cols, (j * h) / rows, w / cols + 1, h / rows + 1);
        }
    });
    const tank = mesh(
      keep(new THREE.CylinderGeometry(0.4, 0.4, 0.42, 32, 1, true)),
      std(0xffffff, 0.5, 0, { map: checks, side: THREE.DoubleSide }),
      grp,
      0,
      legH + 0.31,
      0,
    );
    void tank;
    mesh(keep(new THREE.CylinderGeometry(0.405, 0.405, 0.03, 32)), white, grp, 0, legH + 0.53, 0);
    mesh(
      keep(new THREE.SphereGeometry(0.4, 32, 8, 0, Math.PI * 2, 0, 0.42)),
      white,
      grp,
      0,
      legH + 0.38,
      0,
    );
    const rail = mesh(
      keep(new THREE.TorusGeometry(0.47, 0.008, 4, 40)),
      std(0x6b7178, 0.4, 0.6),
      grp,
      0,
      legH + 0.2,
      0,
    );
    rail.rotation.x = Math.PI / 2;
    risers.push({ obj: grp, delay: 1.2 });
  }

  // ---- the gate: traditional two-tier roof over the entrance road ----------
  {
    const curve = roads[0];
    let gu = 0;
    while (gu < 0.5 && !inside(curve.getPointAt(gu).x, curve.getPointAt(gu).z, 0.55)) gu += 0.005;
    const p = curve.getPointAt(gu),
      t = curve.getTangentAt(gu);
    const grp = new THREE.Group();
    grp.position.set(p.x, heightAt(p.x, p.z), p.z);
    grp.rotation.y = -Math.atan2(t.z, t.x) + Math.PI / 2;
    site.add(grp);
    const pillarTex = canvasTex(64, 128, (c) => {
      c.fillStyle = "#f2efe6";
      c.fillRect(0, 0, 64, 128);
      c.fillStyle = "#2f62b0";
      c.fillRect(12, 22, 40, 86);
      c.fillStyle = "#d9a63a";
      c.fillRect(12, 16, 40, 6);
      c.fillStyle = "#c4382e";
      c.fillRect(0, 0, 64, 10);
    });
    const band = canvasTex(256, 32, (c) => {
      const cols = ["#c4382e", "#2f62b0", "#e8b630", "#2f9a4a", "#f2efe6"];
      for (let i = 0; i < 32; i++) {
        c.fillStyle = cols[i % 5];
        c.fillRect(i * 8, 0, 8, 32);
      }
      c.fillStyle = "#7a3b22";
      c.fillRect(0, 0, 256, 5);
      c.fillRect(0, 27, 256, 5);
    });
    const pillarMat = std(0xffffff, 0.6, 0, { map: pillarTex });
    for (const s of [-1, 1])
      mesh(keep(new THREE.BoxGeometry(0.1, 0.5, 0.1)), pillarMat, grp, s * 0.3, 0.25, 0);
    mesh(
      keep(new THREE.BoxGeometry(0.72, 0.09, 0.16)),
      std(0xffffff, 0.6, 0, { map: band }),
      grp,
      0,
      0.55,
      0,
    );
    const roofMat = std(0x6b4a3a, 0.6);
    mesh(hipGeo(0.95, 0.38, 0.1), roofMat, grp, 0, 0.6, 0);
    mesh(
      keep(new THREE.BoxGeometry(0.42, 0.07, 0.16)),
      std(0xffffff, 0.6, 0, { map: band }),
      grp,
      0,
      0.71,
      0,
    );
    mesh(hipGeo(0.58, 0.28, 0.1), roofMat, grp, 0, 0.745, 0);
    mesh(
      keep(new THREE.CylinderGeometry(0.012, 0.03, 0.08, 8)),
      std(0xd9a63a, 0.3, 0.8),
      grp,
      0,
      0.88,
      0,
    );
    for (const s of [-1, 1])
      mesh(
        keep(new THREE.BoxGeometry(0.5, 0.16, 0.06)),
        std(0x8f8a7f, 0.85),
        grp,
        s * 0.6,
        0.08,
        0.04,
      );
    risers.push({ obj: grp, delay: 7.5 });
  }

  // ---- Mani Dungkhor and the Prayer Wheel --------------------------------------
  const spinners: THREE.Object3D[] = [];
  {
    const gold = std(0xd9a63a, 0.3, 0.8),
      white = std(0xf4f1e8, 0.7),
      maroon = std(0x8e2f24, 0.6);
    {
      const [x, z] = SHRINES.mani;
      const g = new THREE.Group();
      g.position.set(x, smooth(x, z), z);
      site.add(g);
      mesh(keep(new THREE.BoxGeometry(0.3, 0.26, 0.3)), white, g, 0, 0.13, 0);
      mesh(keep(new THREE.BoxGeometry(0.32, 0.05, 0.32)), maroon, g, 0, 0.25, 0);
      const roof = mesh(keep(new THREE.ConeGeometry(0.28, 0.16, 4)), maroon, g, 0, 0.35, 0);
      roof.rotation.y = Math.PI / 4;
      spinners.push(
        mesh(keep(new THREE.CylinderGeometry(0.03, 0.045, 0.14, 10)), gold, g, 0, 0.49, 0),
      );
      risers.push({ obj: g, delay: 2 });
    }
    {
      const [x, z] = SHRINES.wheel;
      const g = new THREE.Group();
      g.position.set(x, smooth(x, z), z);
      site.add(g);
      spinners.push(
        mesh(keep(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 18)), gold, g, 0, 0.15, 0),
      );
      const c = mesh(keep(new THREE.ConeGeometry(0.18, 0.09, 4)), maroon, g, 0, 0.34, 0);
      c.rotation.y = Math.PI / 4;
      for (const sx of [-1, 1])
        mesh(keep(new THREE.CylinderGeometry(0.011, 0.011, 0.3, 6)), maroon, g, sx * 0.12, 0.15, 0);
      risers.push({ obj: g, delay: 2 });
    }
  }

  risers.forEach((r) => addEdges(r.obj));
  await pause();
  // one draw call per look per building, instead of one per part (see batch)
  {
    const shared = new Map<string, THREE.Material>();
    const keepApart = new Set(spinners);
    for (const r of risers)
      batch(r.obj, { keep: keepApart, pinned: new Set([edgeMat]), shared, track: keep });
  }

  await pause();
  // ---- trees: cypress lines, broadleaf, forest at the rim ------------------
  type TreeInst = { m: THREE.Matrix4; delay: number; c?: THREE.Color };
  const cypressI: TreeInst[] = [],
    broadI: TreeInst[] = [];
  {
    const r = rand(23);
    const add = (
      list: TreeInst[],
      x: number,
      z: number,
      s: number,
      sy: number,
      c?: THREE.Color,
    ) => {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, heightAt(x, z) - 0.02, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6.28, 0)),
        new THREE.Vector3(s, sy, s),
      );
      list.push({ m, delay: Math.hypot(x, z), c });
    };
    const clear = (x: number, z: number, g = 0.2) =>
      inside(x, z, 0.2) &&
      !inPad(x, z, g) &&
      !roadSamples.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 0.09);
    // cypress rows along the roads
    for (const curve of A ? [] : campusRoads) {
      const L = curve.getLength(),
        n = Math.floor(L / 0.45);
      for (let i = 0; i < n; i++) {
        const u = i / n,
          c = curve.getPointAt(u),
          t = curve.getTangentAt(u);
        const s = i % 4 < 2 ? 1 : -1;
        const x = c.x - t.z * 0.42 * s,
          z = c.z + t.x * 0.42 * s;
        if (clear(x, z, 0.12) && r() > 0.25) add(cypressI, x, z, 0.8 + r() * 0.3, 0.9 + r() * 0.5);
      }
    }
    if (A) {
      // a tree wherever the drone photo shows canopy, coloured from the photo
      const col = new THREE.Color(),
        hsl = { h: 0, s: 0, l: 0 };
      for (let gx = -RX; gx <= RX && broadI.length < 4800; gx += 0.1)
        for (let gz = -RZ; gz <= RZ; gz += 0.1) {
          const x = gx + (r() - 0.5) * 0.08,
            z = gz + (r() - 0.5) * 0.08;
          if (!inside(x, z, 0.15) || inPad(x, z, 0.06) || inPoly(x, z, HOSTEL_LAWN)) continue;
          samplePhoto(x, z, col).getHSL(hsl);
          if (hsl.h < 0.17 || hsl.h > 0.45 || hsl.s < 0.2 || hsl.l > 0.3) continue;
          if (r() > 0.8) continue;
          const dark = 1 - hsl.l / 0.3;
          const sc = 0.3 + dark * 0.32 + r() * 0.14;
          add(broadI, x, z, sc, sc * (0.8 + r() * 0.4), col.clone().multiplyScalar(1.25));
        }
    }
    for (let t = 0; !A && t < 26000 && broadI.length < 2400; t++) {
      const a = r() * Math.PI * 2,
        rr = Math.sqrt(r());
      const x = Math.cos(a) * rr * RX,
        z = Math.sin(a) * rr * RZ;
      const edge = sstep(0.55, 0.88, rr);
      if (r() > 0.22 + edge * 0.75) continue;
      if (!clear(x, z, 0.25)) continue;
      const s = 0.48 + r() * 0.42;
      add(broadI, x, z, s, s * (0.85 + r() * 0.3));
    }
  }
  const cypGeo = keep(new THREE.ConeGeometry(0.075, 0.62, 7));
  cypGeo.translate(0, 0.4, 0);
  // a canopy of several leaf clusters reads as a real tree from above
  const lobe = (r: number, x: number, y: number, z: number) =>
    new THREE.IcosahedronGeometry(r, 1).translate(x, y, z);
  const lobes = [
    lobe(0.13, 0, 0.26, 0),
    lobe(0.1, 0.09, 0.22, 0.03),
    lobe(0.1, -0.07, 0.23, -0.06),
    lobe(0.09, 0.01, 0.35, 0.02),
    lobe(0.08, -0.02, 0.2, 0.09),
  ];
  const broadGeo = keep(mergeGeometries(lobes)!);
  lobes.forEach((g) => g.dispose());
  const trunkGeo = keep(new THREE.CylinderGeometry(0.014, 0.02, 0.2, 5));
  trunkGeo.translate(0, 0.1, 0);
  const cyp = new THREE.InstancedMesh(
    cypGeo,
    std(0x2f5d33, 0.9, 0, { flatShading: true }),
    cypressI.length,
  );
  const broad = new THREE.InstancedMesh(
    broadGeo,
    std(0xffffff, 0.9, 0, { flatShading: true }),
    broadI.length,
  );
  const trunks = new THREE.InstancedMesh(
    trunkGeo,
    std(0x5a4130, 1),
    cypressI.length + broadI.length,
  );
  for (const im of [cyp, broad]) im.castShadow = true;
  {
    const r = rand(99),
      c = new THREE.Color();
    broadI.forEach((tr, i) =>
      broad.setColorAt(i, tr.c ?? c.setHSL(0.27 + r() * 0.06, 0.48 + r() * 0.2, 0.11 + r() * 0.1)),
    );
  }
  site.add(cyp, broad, trunks);

  await pause();
  // ---- survey drone --------------------------------------------------------
  const drone = new THREE.Group();
  const props: THREE.Object3D[] = [];
  let led: THREE.MeshStandardMaterial;
  {
    const dark = std(0x26303a, 0.4, 0.5),
      light = std(0xf2f2ee, 0.35, 0.2);
    mesh(keep(new THREE.BoxGeometry(0.18, 0.05, 0.12)), light, drone);
    mesh(keep(new THREE.BoxGeometry(0.06, 0.04, 0.06)), dark, drone, 0.05, -0.04, 0);
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const arm = mesh(
        keep(new THREE.BoxGeometry(0.2, 0.015, 0.02)),
        dark,
        drone,
        sx * 0.07,
        0.01,
        sz * 0.07,
      );
      arm.rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4;
      const p = new THREE.Mesh(
        keep(new THREE.CylinderGeometry(0.07, 0.07, 0.004, 16)),
        new THREE.MeshBasicMaterial({ color: 0x9aa4ad, transparent: true, opacity: 0.45 }),
      );
      p.position.set(sx * 0.14, 0.035, sz * 0.14);
      drone.add(p);
      props.push(p);
    }
    led = std(0xff6a2a, 0.3, 0, { emissive: 0xff6a2a, emissiveIntensity: 2 });
    mesh(keep(new THREE.SphereGeometry(0.014, 8, 6)), led, drone, -0.09, 0.02, 0);
    const cone = new THREE.Mesh(
      keep(new THREE.ConeGeometry(0.75, 2.2, 32, 1, true)),
      new THREE.MeshBasicMaterial({
        color: 0x2e9db3,
        transparent: true,
        opacity: 0.09,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    cone.position.y = -1.1;
    drone.add(cone);
    site.add(drone);
  }
  const dronePath = (p: number, out: THREE.Vector3) => {
    // lawnmower survey over the site, five passes, then back
    const passes = 5,
      seg = p * passes * 2;
    const k = Math.floor(seg),
      f = seg - k;
    const row = Math.floor(k / 2),
      along = k % 2 === 0;
    const zA = -3.6 + row * 1.8,
      dir = row % 2 === 0 ? 1 : -1;
    if (along) out.set(dir * (-6.5 + 13 * f), 0, zA);
    else out.set(dir * 6.5, 0, zA + 1.8 * f);
    if (row >= passes - 1 && !along) out.set(-6.5, 0, 3.6 - 7.2 * f);
    out.y = 2.6;
    return out;
  };

  // ---- scan ring -------------------------------------------------------
  const scan = new THREE.Mesh(
    keep(new THREE.RingGeometry(1.004, 1.032, 160)),
    new THREE.MeshBasicMaterial({
      color: 0x35b5c9,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scan.rotation.x = -Math.PI / 2;
  scan.scale.set(RX, RZ, 1);
  site.add(scan);

  // ---- camera framing ------------------------------------------------------
  let width = fw(),
    height = fh(),
    mobile = width <= 900;
  const dir = new THREE.Vector3(0.18, 0.74, 0.9).normalize();
  const target = new THREE.Vector3(0, -0.5, 0);
  let baseDist = 32;
  let sized = false;
  function layout() {
    if (!fw() || !fh()) return;
    width = fw();
    height = fh();
    mobile = width <= 900;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.setViewOffset(
      width,
      height,
      mobile || !options.embedded ? 0 : -width * 0.24,
      0,
      width,
      height,
    );
    const tanF = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const avail = mobile || !options.embedded ? 0.94 : 0.48;
    const fitW = (RX * 2.24) / (2 * tanF * camera.aspect * avail);
    const fitH = 11.6 / (2 * tanF * 0.9);
    baseDist = Math.max(fitW, fitH);
    camera.updateProjectionMatrix();
    if (!sized) {
      sized = true;
      camera.position.copy(dir).multiplyScalar(baseDist).add(target);
      controls.target.copy(target);
    } else {
      const d = camera.position.clone().sub(controls.target).setLength(baseDist);
      camera.position.copy(controls.target).add(d);
    }
    controls.update();
  }
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(root);
  cleanups.push(() => ro.disconnect());
  let lastInteraction = -1e9,
    dragging = false;
  controls.addEventListener("start", () => {
    dragging = true;
    lastInteraction = performance.now();
  });
  controls.addEventListener("end", () => {
    dragging = false;
    lastInteraction = performance.now();
  });
  let visible = true;
  listen(document, "visibilitychange", () => (visible = !document.hidden));
  const io = new IntersectionObserver(
    (en) => (visible = en[0].isIntersecting && !document.hidden),
    { threshold: 0.01 },
  );
  io.observe(renderer.domElement);
  cleanups.push(() => io.disconnect());

  // ---- api -------------------------------------------------------------
  let playing = !reduceMotion;
  let build = reduceMotion ? 99 : 0;
  let t = 0;
  const api: SiteApi = {
    play: () => (playing = true),
    pause: () => (playing = false),
    rebuild: () => (build = 0),
    finish: () => {
      build = 99;
      t = Math.max(t, 6);
    },
  };
  window.__campusSite = api;
  cleanups.push(() => {
    if (window.__campusSite === api) delete window.__campusSite;
  });

  // ---- loop -------------------------------------------------------------
  const easeBack = (x: number) => {
    const c1 = 1.4,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  const tmpM = new THREE.Matrix4(),
    tmpP = new THREE.Vector3(),
    tmpQ = new THREE.Quaternion(),
    tmpS = new THREE.Vector3(),
    trunkM = new THREE.Matrix4();
  let treesDone = false;
  const updateTrees = (b: number) => {
    let ti = 0;
    const place = (list: TreeInst[], im: THREE.InstancedMesh, base: number) => {
      list.forEach((tr, i) => {
        const k = clamp01((b - base - tr.delay * 0.12) / 0.5);
        tr.m.decompose(tmpP, tmpQ, tmpS);
        tmpS.multiplyScalar(Math.max(0.0001, k < 1 ? easeBack(k) : 1));
        tmpM.compose(tmpP, tmpQ, tmpS);
        im.setMatrixAt(i, tmpM);
        trunkM.copy(tmpM);
        trunks.setMatrixAt(ti++, trunkM);
      });
      im.instanceMatrix.needsUpdate = true;
    };
    place(cypressI, cyp, 1.4);
    place(broadI, broad, 1.7);
    trunks.instanceMatrix.needsUpdate = true;
  };
  updateTrees(build);

  const dp = new THREE.Vector3(),
    dpAhead = new THREE.Vector3();
  let droneYaw = 0;
  // ---- start -------------------------------------------------------------
  // Compiling a shader on its first use blocks the page until the GPU driver is done, and this
  // scene has many (several seconds on a laptop GPU). So every shader is compiled in the
  // background first (KHR_parallel_shader_compile), and the loop only starts rendering, and the
  // campus assembling, once they are ready.
  let started = false,
    disposed = false;
  (async () => {
    env = await environmentMap(renderer, () => !disposed);
    if (!env) return;
    scene.environment = env.texture;
    await renderer.compileAsync(scene, camera);
    started = !disposed;
  })().catch((e) => {
    if (!disposed) console.error("Campus site: failed to prepare the shaders", e);
  });

  let raf = 0,
    last = performance.now(),
    ready = false;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (!visible || !started) return;
    if (playing) t += dt;
    if (build < 99) build += dt;

    // assemble: buildings rise from wireframe, then the lines fade out
    for (const r of risers) {
      const k = clamp01((build - 0.3 - r.delay * 0.13) / 0.8);
      r.obj.scale.set(1, Math.max(0.0001, k < 1 ? easeBack(k) : 1), 1);
      r.obj.visible = k > 0;
    }
    edgeMat.opacity = 1 - clamp01((build - 3.2) / 1.3);
    edgeMat.visible = edgeMat.opacity > 0; // faded out: stop drawing the wireframe at all
    if (build < 6) {
      updateTrees(build);
      treesDone = false;
    } else if (!treesDone) {
      updateTrees(99);
      treesDone = true;
    }

    site.position.y = Math.sin(t * 0.5) * 0.08;

    // drone
    dronePath((t / 40) % 1, dp);
    dronePath(((t / 40) % 1) + 0.002, dpAhead);
    drone.position.lerp(dp, 1 - Math.exp(-dt * 2.5));
    const want = -Math.atan2(dpAhead.z - dp.z, dpAhead.x - dp.x);
    droneYaw +=
      Math.atan2(Math.sin(want - droneYaw), Math.cos(want - droneYaw)) * Math.min(1, dt * 2);
    drone.rotation.set(0, droneYaw, 0);
    drone.position.y += Math.sin(t * 2) * 0.02;
    drone.visible = build > 4;
    if (playing) props.forEach((p, i) => (p.rotation.y += (i % 2 ? 1 : -1) * dt * 60));
    led.emissiveIntensity = Math.sin(t * 6) > 0.6 ? 3 : 0.4;
    for (const sp of spinners) sp.rotation.y = t * 1.5;

    // scan ring every 9 s, rising up the section
    const sp = (t % 9) / 2.4;
    if (sp < 1 && build > 4) {
      scan.position.y = BOTTOM + (rimY(0) + 0.3 - BOTTOM) * sp;
      (scan.material as THREE.MeshBasicMaterial).opacity = Math.sin(sp * Math.PI) * 0.75;
    } else (scan.material as THREE.MeshBasicMaterial).opacity = 0;

    controls.autoRotate =
      playing && !reduceMotion && !dragging && now - lastInteraction > 4000 && build > 4;
    controls.autoRotateSpeed = 0.32;
    controls.update(dt);
    renderer.render(scene, camera);
    if (!ready && sized) {
      ready = true;
      options.onReady();
    }
  }
  raf = requestAnimationFrame(frame);

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(raf);
    for (const fn of cleanups.reverse()) fn();
    cleanups.length = 0;
    controls.dispose();
    const textures = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      const list = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      for (const mat of list) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) textures.add(v);
        mat.dispose();
      }
    });
    geos.forEach((g) => g.dispose());
    textures.forEach((x) => x.dispose());
    Object.values(FACADE).forEach((x) => x.dispose());
    env?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  return { api, dispose };
}
