import type { IslandId, Rect } from "./config";

export type RawRect = { x: number; z: number; w: number; d: number };

export type IslandLook = {
  sand: number;
  landTint: number;
  landTerrain: "sand" | "stone" | "wood";
  water: number;
  waterDeep: [number, number, number];
  waterMid: [number, number, number];
  waterLite: [number, number, number];
  ambient: number;
  ambientInt: number;
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
  sun: number;
  sunInt: number;
  sunPos: [number, number, number];
  sparkle: number;
};

export type IslandMap = {
  id: IslandId;
  land: RawRect[];
  northPier: RawRect;
  southPier: RawRect;
  docks: RawRect;
  tavern: RawRect;
  market: RawRect;
  rope: RawRect;
  fort: RawRect;
  nWare: RawRect;
  sWare: RawRect;
  foundry: RawRect;
  extractGull: RawRect;
  extractWren: RawRect;
  extractBell: RawRect;
  gullPier: string;
  wrenPier: string;
  fortLabel: string;
  look: IslandLook;
  navy: {
    gull: { from: { x: number; z: number }; to: { x: number; z: number } };
    wren: { from: { x: number; z: number }; to: { x: number; z: number } };
  };
  shore: { palms: number; rocks: number; sand: number; cannons: number };
};

function pt(x: number, z: number): { x: number; z: number } {
  return { x, z };
}

/** Land and piers stretch by this; building footprints stay put so yards open up. */
export const LAYOUT_SPREAD = 1.5;

export function stretchGround(r: RawRect): RawRect {
  const s = LAYOUT_SPREAD;
  return { x: r.x * s, z: r.z * s, w: r.w * s, d: r.d * s };
}

export function stretchPlot(r: RawRect): RawRect {
  const s = LAYOUT_SPREAD;
  const cx = (r.x + r.w / 2) * s;
  const cz = (r.z + r.d / 2) * s;
  return { x: cx - r.w / 2, z: cz - r.d / 2, w: r.w, d: r.d };
}

export function stretchPoint(p: { x: number; z: number }): { x: number; z: number } {
  return { x: p.x * LAYOUT_SPREAD, z: p.z * LAYOUT_SPREAD };
}

/** Gull Harbor — horseshoe, sea to the west, two west piers. */
const GULL: IslandMap = {
  id: 1,
  land: [{ x: -58, z: -76, w: 156, d: 152 }],
  northPier: { x: -98, z: -46, w: 62, d: 24 },
  southPier: { x: -98, z: 22, w: 62, d: 24 },
  docks: { x: -88, z: -11, w: 36, d: 22 },
  tavern: { x: -54, z: -74, w: 16, d: 28 },
  market: { x: -20, z: 16, w: 32, d: 24 },
  rope: { x: 44, z: -10, w: 18, d: 20 },
  fort: { x: 66, z: -26, w: 28, d: 52 },
  nWare: { x: 8, z: -72, w: 26, d: 16 },
  sWare: { x: 8, z: 56, w: 26, d: 16 },
  foundry: { x: -20, z: -40, w: 32, d: 24 },
  extractGull: { x: -98, z: -46, w: 40, d: 24 },
  extractWren: { x: -98, z: 22, w: 40, d: 24 },
  extractBell: { x: 78, z: 34, w: 16, d: 16 },
  gullPier: "North Wharf",
  wrenPier: "South Slip",
  fortLabel: "Inner Fort",
  look: {
    sand: 0xc4a574,
    landTint: 0xffffff,
    landTerrain: "sand",
    water: 0x0a3878,
    waterDeep: [0.02, 0.1, 0.32],
    waterMid: [0.08, 0.38, 0.78],
    waterLite: [0.48, 0.84, 1.0],
    ambient: 0x8a9aaa,
    ambientInt: 1,
    hemiSky: 0xfff0d4,
    hemiGround: 0xc4a574,
    hemiInt: 0.7,
    sun: 0xffe6c2,
    sunInt: 1.2,
    sunPos: [-40, 80, -20],
    sparkle: 0xd8f0ff,
  },
  navy: {
    gull: { from: pt(-128, -72), to: pt(-80, -56) },
    wren: { from: pt(-128, 72), to: pt(-80, 56) },
  },
  shore: { palms: 11, rocks: 6, sand: 7, cannons: 2 },
};

/** Wren Reach — long north–south spit, jetties off the north tip. */
const WREN: IslandMap = {
  id: 2,
  land: [
    { x: -18, z: -78, w: 52, d: 156 },
    { x: 34, z: -24, w: 54, d: 62 },
    { x: -46, z: -20, w: 28, d: 52 },
  ],
  northPier: { x: -16, z: -114, w: 24, d: 44 },
  southPier: { x: 10, z: -114, w: 24, d: 44 },
  docks: { x: -8, z: -88, w: 32, d: 22 },
  tavern: { x: -44, z: -16, w: 16, d: 28 },
  nWare: { x: -10, z: -74, w: 26, d: 16 },
  foundry: { x: -12, z: -48, w: 32, d: 24 },
  market: { x: -12, z: 10, w: 32, d: 24 },
  rope: { x: 22, z: -8, w: 18, d: 20 },
  fort: { x: 52, z: -16, w: 28, d: 52 },
  sWare: { x: -10, z: 56, w: 26, d: 16 },
  extractGull: { x: -16, z: -114, w: 24, d: 28 },
  extractWren: { x: 10, z: -114, w: 24, d: 28 },
  extractBell: { x: 68, z: 18, w: 16, d: 16 },
  gullPier: "Gull Jetty",
  wrenPier: "Wren Jetty",
  fortLabel: "Reach Keep",
  look: {
    sand: 0xb8c4a8,
    landTint: 0xd8eadc,
    landTerrain: "sand",
    water: 0x0a4858,
    waterDeep: [0.02, 0.16, 0.22],
    waterMid: [0.08, 0.42, 0.48],
    waterLite: [0.55, 0.9, 0.88],
    ambient: 0x7a9aaa,
    ambientInt: 0.95,
    hemiSky: 0xe8fff4,
    hemiGround: 0x8aaa90,
    hemiInt: 0.65,
    sun: 0xe8fff0,
    sunInt: 1.15,
    sunPos: [10, 80, -50],
    sparkle: 0xc8fff4,
  },
  navy: {
    gull: { from: pt(-28, -148), to: pt(-8, -102) },
    wren: { from: pt(36, -148), to: pt(18, -102) },
  },
  shore: { palms: 6, rocks: 10, sand: 5, cannons: 3 },
};

/** Copper Cay — compact cay, cove and piers on the east. */
const COPPER: IslandMap = {
  id: 3,
  land: [
    { x: -56, z: -56, w: 92, d: 112 },
    { x: 36, z: -52, w: 32, d: 42 },
    { x: 36, z: 10, w: 32, d: 42 },
  ],
  northPier: { x: 52, z: -32, w: 52, d: 20 },
  southPier: { x: 52, z: 12, w: 52, d: 20 },
  docks: { x: 28, z: -10, w: 32, d: 20 },
  fort: { x: -52, z: -26, w: 28, d: 52 },
  foundry: { x: -16, z: -16, w: 32, d: 24 },
  market: { x: -16, z: 16, w: 32, d: 24 },
  tavern: { x: -50, z: -54, w: 16, d: 28 },
  nWare: { x: 2, z: -52, w: 26, d: 16 },
  sWare: { x: 18, z: 38, w: 26, d: 16 },
  rope: { x: 38, z: -40, w: 18, d: 20 },
  extractGull: { x: 76, z: -32, w: 28, d: 20 },
  extractWren: { x: 76, z: 12, w: 28, d: 20 },
  extractBell: { x: -48, z: 28, w: 16, d: 16 },
  gullPier: "East Cove",
  wrenPier: "Copper Slip",
  fortLabel: "West Redoubt",
  look: {
    sand: 0xc48a54,
    landTint: 0xe8b070,
    landTerrain: "sand",
    water: 0x3a2818,
    waterDeep: [0.12, 0.08, 0.05],
    waterMid: [0.42, 0.22, 0.1],
    waterLite: [0.85, 0.55, 0.28],
    ambient: 0xaa8870,
    ambientInt: 0.9,
    hemiSky: 0xffe0c4,
    hemiGround: 0xa07048,
    hemiInt: 0.75,
    sun: 0xffd0a0,
    sunInt: 1.35,
    sunPos: [50, 70, 10],
    sparkle: 0xffe0b0,
  },
  navy: {
    gull: { from: pt(138, -48), to: pt(90, -28) },
    wren: { from: pt(138, 48), to: pt(90, 28) },
  },
  shore: { palms: 4, rocks: 7, sand: 10, cannons: 2 },
};

/** Oak Atoll — ring with a lagoon, mouth and piers to the south. */
const OAK: IslandMap = {
  id: 4,
  land: [
    { x: -52, z: -76, w: 124, d: 34 },
    { x: -60, z: -52, w: 36, d: 108 },
    { x: 40, z: -52, w: 36, d: 108 },
    { x: -60, z: 48, w: 52, d: 28 },
    { x: 24, z: 48, w: 52, d: 28 },
  ],
  northPier: { x: -50, z: 68, w: 24, d: 44 },
  southPier: { x: 34, z: 68, w: 24, d: 44 },
  docks: { x: -12, z: 50, w: 36, d: 24 },
  tavern: { x: -56, z: -18, w: 16, d: 28 },
  nWare: { x: -48, z: -74, w: 26, d: 16 },
  foundry: { x: -56, z: -48, w: 32, d: 24 },
  market: { x: 10, z: -74, w: 32, d: 16 },
  rope: { x: 42, z: -8, w: 18, d: 20 },
  fort: { x: 44, z: -18, w: 28, d: 52 },
  sWare: { x: 42, z: 52, w: 26, d: 16 },
  extractGull: { x: -50, z: 88, w: 24, d: 24 },
  extractWren: { x: 34, z: 88, w: 24, d: 24 },
  extractBell: { x: 52, z: 36, w: 16, d: 16 },
  gullPier: "West Mouth",
  wrenPier: "East Mouth",
  fortLabel: "Atoll Keep",
  look: {
    sand: 0xb8a068,
    landTint: 0xdcc890,
    landTerrain: "sand",
    water: 0x0c4038,
    waterDeep: [0.02, 0.14, 0.14],
    waterMid: [0.06, 0.4, 0.36],
    waterLite: [0.45, 0.86, 0.72],
    ambient: 0x7a9a88,
    ambientInt: 1,
    hemiSky: 0xe8ffe8,
    hemiGround: 0x6a8a58,
    hemiInt: 0.8,
    sun: 0xf0ffe0,
    sunInt: 1.1,
    sunPos: [-10, 85, 40],
    sparkle: 0xd0ffe8,
  },
  navy: {
    gull: { from: pt(-40, 148), to: pt(-38, 100) },
    wren: { from: pt(44, 148), to: pt(42, 100) },
  },
  shore: { palms: 16, rocks: 4, sand: 6, cannons: 1 },
};

/** Blackwater — angular stone L, fortress inland, piers on the west arm. */
const BLACKWATER: IslandMap = {
  id: 5,
  land: [
    { x: -12, z: -72, w: 72, d: 148 },
    { x: -72, z: 18, w: 72, d: 58 },
  ],
  northPier: { x: -112, z: 20, w: 50, d: 22 },
  southPier: { x: -112, z: 50, w: 50, d: 22 },
  docks: { x: -88, z: 34, w: 36, d: 22 },
  tavern: { x: -8, z: -70, w: 16, d: 28 },
  nWare: { x: 20, z: -70, w: 26, d: 16 },
  foundry: { x: -8, z: -32, w: 32, d: 24 },
  market: { x: -8, z: 8, w: 32, d: 24 },
  rope: { x: 28, z: 4, w: 18, d: 20 },
  fort: { x: 24, z: -36, w: 32, d: 56 },
  sWare: { x: -40, z: 52, w: 26, d: 16 },
  extractGull: { x: -112, z: 20, w: 34, d: 22 },
  extractWren: { x: -112, z: 50, w: 34, d: 22 },
  extractBell: { x: 32, z: 22, w: 16, d: 16 },
  gullPier: "Black Quay",
  wrenPier: "Iron Slip",
  fortLabel: "The Keep",
  look: {
    sand: 0x5a5460,
    landTint: 0x8a8494,
    landTerrain: "stone",
    water: 0x120818,
    waterDeep: [0.04, 0.02, 0.08],
    waterMid: [0.16, 0.08, 0.22],
    waterLite: [0.42, 0.28, 0.55],
    ambient: 0x6a6080,
    ambientInt: 0.75,
    hemiSky: 0xc8b8e0,
    hemiGround: 0x3a3040,
    hemiInt: 0.55,
    sun: 0xd8c8f0,
    sunInt: 0.85,
    sunPos: [-30, 60, 20],
    sparkle: 0xe0d0ff,
  },
  navy: {
    gull: { from: pt(-150, 8), to: pt(-96, 26) },
    wren: { from: pt(-150, 78), to: pt(-96, 64) },
  },
  shore: { palms: 2, rocks: 12, sand: 3, cannons: 5 },
};

export const ISLAND_MAPS: Record<IslandId, IslandMap> = {
  1: GULL,
  2: WREN,
  3: COPPER,
  4: OAK,
  5: BLACKWATER,
};

export function islandMap(id: IslandId): IslandMap {
  return ISLAND_MAPS[id];
}

export function unionRect(rects: Rect[]): Rect {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minZ = Math.min(minZ, r.z);
    maxX = Math.max(maxX, r.x + r.w);
    maxZ = Math.max(maxZ, r.z + r.d);
  }
  return { x: minX, z: minZ, w: maxX - minX, d: maxZ - minZ };
}
