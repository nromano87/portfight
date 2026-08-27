import * as THREE from "three";
import { aabbHit, inRect, EXTRACT_OPEN_AT, type Rect } from "./config";

export const LAND: Rect = { x: -42, z: -52, w: 108, d: 104 };
export const NORTH_PIER: Rect = { x: -78, z: -46, w: 40, d: 10 };
export const SOUTH_PIER: Rect = { x: -78, z: 36, w: 40, d: 10 };
export const GALLEON: Rect = { x: -64, z: -6, w: 24, d: 12 };
export const TAVERN: Rect = { x: -38, z: -14, w: 16, d: 28 };
export const MARKET: Rect = { x: -14, z: -12, w: 24, d: 24 };
export const ROPE: Rect = { x: 16, z: -14, w: 8, d: 28 };
export const FORT: Rect = { x: 32, z: -26, w: 28, d: 52 };
export const N_WARE: Rect = { x: -8, z: -48, w: 26, d: 16 };
export const S_WARE: Rect = { x: -8, z: 32, w: 26, d: 16 };

export const EXTRACT_GULL: Rect = { x: -78, z: -46, w: 24, d: 10 };
export const EXTRACT_WREN: Rect = { x: -78, z: 36, w: 24, d: 10 };
export const EXTRACT_BELL: Rect = { x: 44, z: -6, w: 12, d: 12 };

/** Thin wall AABBs. Door gaps are simply missing segments. */
export const WALLS: Rect[] = [
  // Tavern — door on east toward market
  { x: -38, z: -14, w: 16, d: 1.2 },
  { x: -38, z: 12.8, w: 16, d: 1.2 },
  { x: -38, z: -14, w: 1.2, d: 28 },
  { x: -23.2, z: -14, w: 1.2, d: 8 },
  { x: -23.2, z: 6, w: 1.2, d: 8 },
  // North warehouse — door south
  { x: -8, z: -48, w: 26, d: 1.2 },
  { x: -8, z: -48, w: 1.2, d: 16 },
  { x: 16.8, z: -48, w: 1.2, d: 16 },
  { x: -8, z: -33.2, w: 8, d: 1.2 },
  { x: 6, z: -33.2, w: 12, d: 1.2 },
  // South warehouse — door north
  { x: -8, z: 46.8, w: 26, d: 1.2 },
  { x: -8, z: 32, w: 1.2, d: 16 },
  { x: 16.8, z: 32, w: 1.2, d: 16 },
  { x: -8, z: 32, w: 8, d: 1.2 },
  { x: 6, z: 32, w: 12, d: 1.2 },
  // Fort — gate west
  { x: 32, z: -26, w: 28, d: 1.4 },
  { x: 32, z: 24.6, w: 28, d: 1.4 },
  { x: 58.6, z: -26, w: 1.4, d: 52 },
  { x: 32, z: -26, w: 1.4, d: 18 },
  { x: 32, z: 8, w: 1.4, d: 18 },
];

/** Rim spawns. Off extract pads, off interiors. Each has one starter barrel. */
export const SPAWNS: { x: number; z: number }[] = [
  { x: -50, z: -41 },
  { x: -14, z: -36 },
  { x: -40, z: -20 },
  { x: -14, z: 36 },
  { x: -50, z: 41 },
  { x: 26, z: 0 },
  { x: 18, z: -18 },
  { x: 18, z: 18 },
];

export type LootKind = "barrel" | "crate" | "lockbox" | "chest";

export type LootSpot = {
  id: string;
  kind: LootKind;
  x: number;
  z: number;
};

/**
 * First loot is fair: one barrel ~6m from every spawn.
 * Crates, the galleon lockbox, and the keep chest are rotate loot — not at anyone’s feet.
 */
export const LOOT_SPOTS: LootSpot[] = [
  { id: "B1", kind: "barrel", x: -44, z: -41 },
  { id: "B6", kind: "barrel", x: -14, z: -30 },
  { id: "B7", kind: "barrel", x: -34, z: -18 },
  { id: "B8", kind: "barrel", x: -14, z: 30 },
  { id: "B3", kind: "barrel", x: -44, z: 41 },
  { id: "B15", kind: "barrel", x: 26, z: 6 },
  { id: "B13", kind: "barrel", x: 18, z: -12 },
  { id: "B14", kind: "barrel", x: 18, z: 12 },
  { id: "B2", kind: "barrel", x: -70, z: -41 },
  { id: "B4", kind: "barrel", x: -70, z: 41 },
  { id: "B9", kind: "barrel", x: -20, z: 0 },
  { id: "B10", kind: "barrel", x: -4, z: -4 },
  { id: "B11", kind: "barrel", x: 2, z: 2 },
  { id: "B12", kind: "barrel", x: 6, z: -6 },
  { id: "U1", kind: "crate", x: 0, z: -40 },
  { id: "U3", kind: "crate", x: 0, z: 40 },
  { id: "U5", kind: "crate", x: -30, z: 0 },
  { id: "R2", kind: "lockbox", x: -60, z: 0 },
  { id: "E1", kind: "chest", x: 50, z: 0 },
];

const WALKABLE: Rect[] = [
  LAND,
  NORTH_PIER,
  SOUTH_PIER,
  GALLEON,
];

export function deckHeight(x: number, z: number): number {
  if (inRect(x, z, GALLEON, 0.5)) return 1.8;
  if (inRect(x, z, NORTH_PIER, 0.5) || inRect(x, z, SOUTH_PIER, 0.5)) return 0.7;
  if (inRect(x, z, FORT, 0.2)) return 0.9;
  if (inRect(x, z, TAVERN, 0.2) || inRect(x, z, N_WARE, 0.2) || inRect(x, z, S_WARE, 0.2)) {
    return 0.6;
  }
  if (inRect(x, z, MARKET, 0.2) || inRect(x, z, ROPE, 0.2)) return 0.55;
  if (inRect(x, z, LAND, 0.2)) return 0.4;
  return 0.05;
}

export function isWalkable(x: number, z: number): boolean {
  if (!WALKABLE.some((r) => inRect(x, z, r))) return false;
  return !WALLS.some((w) => inRect(x, z, w, 0.55));
}

function onDeck(x: number, z: number): boolean {
  return WALKABLE.some((r) => inRect(x, z, r));
}

/** True if the point is on deck with room to stand — not on a water/pier corner. */
export function walkClear(x: number, z: number, r = 1.6): boolean {
  if (!isWalkable(x, z)) return false;
  if (!onDeck(x + r, z) || !onDeck(x - r, z) || !onDeck(x, z + r) || !onDeck(x, z - r)) {
    return false;
  }
  return (
    onDeck(x + r, z + r) &&
    onDeck(x + r, z - r) &&
    onDeck(x - r, z + r) &&
    onDeck(x - r, z - r)
  );
}

/** Step off a convex deck corner toward interior, preferring the nav goal. */
export function nudgeOffCorner(
  x: number,
  z: number,
  tx: number,
  tz: number,
  step: number,
): { x: number; z: number } | null {
  let best: { x: number; z: number } | null = null;
  let bestScore = -1e9;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    for (const dist of [step, step * 1.7, 1.15]) {
      const nx = x + Math.sin(a) * dist;
      const nz = z + Math.cos(a) * dist;
      if (!isWalkable(nx, nz)) continue;
      const inland = walkClear(nx, nz) ? 40 : 0;
      const toward = -Math.hypot(tx - nx, tz - nz);
      if (inland + toward > bestScore) {
        bestScore = inland + toward;
        best = { x: nx, z: nz };
      }
    }
  }
  return best;
}

/** A walkable inland point away from a pursuer — along the shore if the straight line is water. */
export function pickFleePoint(
  ox: number,
  oz: number,
  ex: number,
  ez: number,
  sideBias: number,
): { x: number; z: number } {
  const ux = ox - ex;
  const uz = oz - ez;
  const len = Math.hypot(ux, uz) || 1;
  const ax = ux / len;
  const az = uz / len;
  const angs = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.85, -1.85, 2.4, -2.4];
  const dists = [10, 18, 28, 40];
  let best = { x: ox, z: oz };
  let bestScore = -1e9;
  for (const ang of angs) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const dx = ax * c - az * s;
    const dz = ax * s + az * c;
    const bias = ang === 0 || Math.sign(ang) === Math.sign(sideBias) ? 4 : 0;
    for (const dist of dists) {
      const x = ox + dx * dist;
      const z = oz + dz * dist;
      if (!walkClear(x, z)) continue;
      const fromEnemy = Math.hypot(x - ex, z - ez);
      const away = dx * ax + dz * az;
      let inland = 0;
      if (walkClear(x, z, 3.2)) inland += 14;
      if (walkClear(x, z, 6.5)) inland += 10;
      const score = fromEnemy + away * 12 + inland + bias;
      if (score > bestScore) {
        bestScore = score;
        best = { x, z };
      }
    }
  }
  if (bestScore > -1e8) return best;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = ox + Math.sin(a) * 6;
    const z = oz + Math.cos(a) * 6;
    if (!walkClear(x, z)) continue;
    const fromEnemy = Math.hypot(x - ex, z - ez);
    if (fromEnemy > bestScore) {
      bestScore = fromEnemy;
      best = { x, z };
    }
  }
  return best;
}

export function blockedByWall(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  dist: number,
): boolean {
  return WALLS.some((w) => aabbHit(ox, oz, dx, dz, dist, w) !== null);
}

export type NavCache = {
  tx: number;
  tz: number;
  path: { x: number; z: number }[];
  i: number;
};

export function emptyNav(): NavCache {
  return { tx: Number.NaN, tz: Number.NaN, path: [], i: 0 };
}

const NAV_CELL = 1;
const NAV_MIN_X = -80;
const NAV_MIN_Z = -54;
const NAV_COLS = 150;
const NAV_ROWS = 110;
const NAV_DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, 1.414],
  [1, -1, 1.414],
  [-1, 1, 1.414],
  [-1, -1, 1.414],
];

let navGrid: Uint8Array | null = null;
const navG = new Float32Array(NAV_COLS * NAV_ROWS);
const navCame = new Int32Array(NAV_COLS * NAV_ROWS);
const navClosed = new Uint8Array(NAV_COLS * NAV_ROWS);

function navIndex(c: number, r: number): number {
  return r * NAV_COLS + c;
}

function worldToCell(x: number, z: number): { c: number; r: number } {
  return {
    c: Math.round((x - NAV_MIN_X) / NAV_CELL),
    r: Math.round((z - NAV_MIN_Z) / NAV_CELL),
  };
}

function cellToWorld(c: number, r: number): { x: number; z: number } {
  return { x: NAV_MIN_X + c * NAV_CELL, z: NAV_MIN_Z + r * NAV_CELL };
}

function inNav(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < NAV_COLS && r < NAV_ROWS;
}

function ensureNavGrid() {
  if (navGrid) return;
  navGrid = new Uint8Array(NAV_COLS * NAV_ROWS);
  for (let r = 0; r < NAV_ROWS; r++) {
    for (let c = 0; c < NAV_COLS; c++) {
      const p = cellToWorld(c, r);
      navGrid[navIndex(c, r)] = walkClear(p.x, p.z) ? 1 : 0;
    }
  }
}

function walkLine(ox: number, oz: number, tx: number, tz: number): boolean {
  const dist = Math.hypot(tx - ox, tz - oz);
  if (dist < 0.08) return true;
  const n = Math.max(1, Math.ceil(dist / 0.35));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (!isWalkable(ox + (tx - ox) * t, oz + (tz - oz) * t)) return false;
    if (!walkClear(ox + (tx - ox) * t, oz + (tz - oz) * t)) return false;
  }
  return true;
}

function nearestWalkableCell(c: number, r: number): { c: number; r: number } {
  ensureNavGrid();
  const grid = navGrid!;
  if (inNav(c, r) && grid[navIndex(c, r)]) return { c, r };
  for (let rad = 1; rad <= 8; rad++) {
    for (let dc = -rad; dc <= rad; dc++) {
      for (let dr = -rad; dr <= rad; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (inNav(nc, nr) && grid[navIndex(nc, nr)]) return { c: nc, r: nr };
      }
    }
  }
  return { c, r };
}

export function nearestClearPoint(x: number, z: number): { x: number; z: number } {
  ensureNavGrid();
  const { c, r } = worldToCell(x, z);
  const n = nearestWalkableCell(c, r);
  return cellToWorld(n.c, n.r);
}

function astarPath(sx: number, sz: number, tx: number, tz: number): { x: number; z: number }[] {
  ensureNavGrid();
  const grid = navGrid!;
  const start = nearestWalkableCell(worldToCell(sx, sz).c, worldToCell(sx, sz).r);
  const goal = nearestWalkableCell(worldToCell(tx, tz).c, worldToCell(tx, tz).r);
  const startI = navIndex(start.c, start.r);
  const goalI = navIndex(goal.c, goal.r);
  if (!inNav(start.c, start.r) || !grid[startI]) return [{ x: tx, z: tz }];
  if (startI === goalI) return [{ x: tx, z: tz }];

  navG.fill(1e9);
  navCame.fill(-1);
  navClosed.fill(0);
  navG[startI] = 0;

  const heapC: number[] = [start.c];
  const heapR: number[] = [start.r];
  const heapF: number[] = [Math.hypot(goal.c - start.c, goal.r - start.r)];

  const popMin = (): { c: number; r: number } | null => {
    if (!heapC.length) return null;
    let best = 0;
    for (let i = 1; i < heapF.length; i++) if (heapF[i] < heapF[best]) best = i;
    const c = heapC[best];
    const r = heapR[best];
    const last = heapC.length - 1;
    heapC[best] = heapC[last];
    heapR[best] = heapR[last];
    heapF[best] = heapF[last];
    heapC.pop();
    heapR.pop();
    heapF.pop();
    return { c, r };
  };

  let found = false;
  let guard = 0;
  while (guard++ < 9000) {
    const cur = popMin();
    if (!cur) break;
    const { c, r } = cur;
    const i = navIndex(c, r);
    if (navClosed[i]) continue;
    navClosed[i] = 1;
    if (i === goalI) {
      found = true;
      break;
    }
    for (const [dc, dr, cost] of NAV_DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!inNav(nc, nr)) continue;
      if (dc !== 0 && dr !== 0) {
        if (!grid[navIndex(c + dc, r)] || !grid[navIndex(c, r + dr)]) continue;
      }
      const ni = navIndex(nc, nr);
      if (!grid[ni] || navClosed[ni]) continue;
      const g = navG[i] + cost;
      if (g >= navG[ni]) continue;
      navG[ni] = g;
      navCame[ni] = i;
      heapC.push(nc);
      heapR.push(nr);
      heapF.push(g + Math.hypot(goal.c - nc, goal.r - nr));
    }
  }

  if (!found) return [{ x: tx, z: tz }];

  const cells: { c: number; r: number }[] = [];
  let i = goalI;
  while (i >= 0) {
    cells.push({ c: i % NAV_COLS, r: Math.floor(i / NAV_COLS) });
    i = navCame[i];
  }
  cells.reverse();
  const path = cells.map((p) => cellToWorld(p.c, p.r));
  path[path.length - 1] = { x: tx, z: tz };
  return path;
}

/** Next point to walk toward. Uses a cached A* path around walls and through doors. */
export function navStep(
  ox: number,
  oz: number,
  tx: number,
  tz: number,
  cache: NavCache,
): { x: number; z: number } {
  if (!walkClear(ox, oz)) {
    const safe = nearestWalkableCell(worldToCell(ox, oz).c, worldToCell(ox, oz).r);
    const p = cellToWorld(safe.c, safe.r);
    cache.path = [];
    return p;
  }
  if (walkLine(ox, oz, tx, tz)) {
    cache.path = [];
    cache.tx = tx;
    cache.tz = tz;
    return { x: tx, z: tz };
  }
  const goalMoved = Number.isNaN(cache.tx) || Math.hypot(tx - cache.tx, tz - cache.tz) > 2.2;
  if (goalMoved || cache.path.length === 0) {
    cache.tx = tx;
    cache.tz = tz;
    cache.path = astarPath(ox, oz, tx, tz);
    cache.i = 0;
  }
  while (cache.i < cache.path.length - 1) {
    const p = cache.path[cache.i];
    if (Math.hypot(p.x - ox, p.z - oz) > 1.35) break;
    cache.i += 1;
  }
  let aim = cache.path[Math.min(cache.i, cache.path.length - 1)] ?? { x: tx, z: tz };
  for (let i = cache.path.length - 1; i >= cache.i; i--) {
    const p = cache.path[i];
    if (walkLine(ox, oz, p.x, p.z)) {
      aim = p;
      cache.i = i;
      break;
    }
  }
  return aim;
}

export function extractZone(
  phase: "closed" | "docks" | "bell",
  x: number,
  z: number,
): "gull" | "wren" | "bell" | null {
  if (phase !== "closed" && inRect(x, z, EXTRACT_GULL, 1)) return "gull";
  if (phase !== "closed" && inRect(x, z, EXTRACT_WREN, 1)) return "wren";
  if (phase === "bell" && inRect(x, z, EXTRACT_BELL, 1)) return "bell";
  return null;
}

/** On the pier, but not on the gangplank yet. */
export function pierWithoutShip(
  x: number,
  z: number,
): "gull" | "wren" | null {
  if (inRect(x, z, NORTH_PIER, 1.5) && !inRect(x, z, EXTRACT_GULL, 1)) return "gull";
  if (inRect(x, z, SOUTH_PIER, 1.5) && !inRect(x, z, EXTRACT_WREN, 1)) return "wren";
  return null;
}

function box(
  scene: THREE.Scene,
  r: Rect,
  y: number,
  h: number,
  color: number,
  opacity = 1,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(r.w, h, r.d);
  const mat = new THREE.MeshLambertMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(r.x + r.w / 2, y + h / 2, r.z + r.d / 2);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function labelSprite(text: string, color = "#e8dcc8"): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 128);
  g.font = "56px Palatino, serif";
  g.fillStyle = color;
  g.textAlign = "center";
  g.fillText(text, 256, 80);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(14, 3.5, 1);
  return s;
}

export function buildHarbor(scene: THREE.Scene): {
  extractMats: THREE.MeshLambertMaterial[];
  roofs: Roof[];
  ships: NavyShip[];
} {
  scene.add(new THREE.AmbientLight(0x6a7a88, 0.85));
  const sun = new THREE.DirectionalLight(0xffe6c2, 1.1);
  sun.position.set(-40, 80, -20);
  scene.add(sun);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 200),
    new THREE.MeshLambertMaterial({ color: 0x1a4a5c }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  scene.add(water);

  box(scene, LAND, 0, 0.4, 0xc4a574);
  box(scene, NORTH_PIER, 0.2, 0.5, 0x6b4423);
  box(scene, SOUTH_PIER, 0.2, 0.5, 0x6b4423);
  box(scene, GALLEON, 0.4, 1.4, 0x4a3420);
  box(scene, MARKET, 0.4, 0.15, 0xd4c4a0);
  box(scene, ROPE, 0.4, 0.15, 0x8a7a62);
  box(scene, FORT, 0.4, 0.5, 0x5c6570);
  box(scene, N_WARE, 0.4, 0.2, 0xb08958);
  box(scene, S_WARE, 0.4, 0.2, 0xb08958);
  box(scene, TAVERN, 0.4, 0.2, 0x8b3a2a);

  for (const w of WALLS) box(scene, w, 0.4, 3.4, 0x3e342c);

  const roofs: Roof[] = [
    makeRoof(scene, TAVERN, 0x5c241c, { side: "e", start: -6, end: 6 }),
    makeRoof(scene, N_WARE, 0x7a5a38, { side: "s", start: 0, end: 6 }),
    makeRoof(scene, S_WARE, 0x7a5a38, { side: "n", start: 0, end: 6 }),
    makeRoof(scene, FORT, 0x3e464e, { side: "w", start: -8, end: 8 }),
  ];

  const extractMats: THREE.MeshLambertMaterial[] = [];
  for (const r of [EXTRACT_GULL, EXTRACT_WREN, EXTRACT_BELL]) {
    const y = r === EXTRACT_BELL ? 0.92 : 0.72;
    const m = box(scene, r, y, 0.18, 0x2a4a3a);
    extractMats.push(m.material as THREE.MeshLambertMaterial);
  }

  const names: [string, number, number][] = [
    ["North Wharf", -52, -41],
    ["South Slip", -52, 41],
    ["The Grog", -30, -18],
    ["Market St", -2, 16],
    ["Inner Fort", 46, -30],
  ];
  for (const [t, x, z] of names) {
    const s = labelSprite(t);
    s.position.set(x, 6, z);
    scene.add(s);
  }

  const ships: NavyShip[] = [
    makeNavyShip(scene, "The Gull", {
      from: { x: -128, z: -72 },
      to: { x: -66, z: -50.5 },
    }),
    makeNavyShip(scene, "The Wren", {
      from: { x: -128, z: 72 },
      to: { x: -66, z: 50.5 },
    }),
  ];

  return { extractMats, roofs, ships };
}

export type NavyShip = {
  group: THREE.Group;
  from: { x: number; z: number };
  to: { x: number; z: number };
};

function makeNavyShip(
  scene: THREE.Scene,
  name: string,
  path: { from: { x: number; z: number }; to: { x: number; z: number } },
): NavyShip {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1.7, 5.4),
    new THREE.MeshLambertMaterial({ color: 0x3a2818 }),
  );
  hull.position.y = 0.55;
  group.add(hull);
  const bow = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.35, 3.6),
    new THREE.MeshLambertMaterial({ color: 0x2e2014 }),
  );
  bow.position.set(-11.2, 0.45, 0);
  group.add(bow);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(18.5, 0.22, 4.6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a28 }),
  );
  deck.position.y = 1.38;
  group.add(deck);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.4, 3.4),
    new THREE.MeshLambertMaterial({ color: 0x4a3420 }),
  );
  cabin.position.set(4.2, 2.05, 0);
  group.add(cabin);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 9.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x2a1c12 }),
  );
  mast.position.set(-1.5, 5.9, 0);
  group.add(mast);
  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 5.4, 6.2),
    new THREE.MeshLambertMaterial({ color: 0xe8dcc8 }),
  );
  sail.position.set(-1.35, 5.4, 0);
  group.add(sail);
  const tag = labelSprite(name);
  tag.position.set(0, 9.2, 0);
  tag.scale.set(12, 3, 1);
  group.add(tag);
  group.position.set(path.from.x, 0, path.from.z);
  scene.add(group);
  return { group, from: path.from, to: path.to };
}

/** 0 at sea, 1 docked at Navy 6:00. */
export function shipDockT(elapsed: number): number {
  const arrive = EXTRACT_OPEN_AT;
  const start = Math.max(0, arrive - 22);
  if (elapsed <= start) return 0;
  if (elapsed >= arrive) return 1;
  const u = (elapsed - start) / (arrive - start);
  return 1 - (1 - u) * (1 - u) * (1 - u);
}

export function placeNavyShips(ships: NavyShip[], elapsed: number) {
  const t = shipDockT(elapsed);
  const bob = Math.sin(elapsed * 1.25) * 0.11;
  for (const s of ships) {
    s.group.position.set(
      s.from.x + (s.to.x - s.from.x) * t,
      bob,
      s.from.z + (s.to.z - s.from.z) * t,
    );
  }
}

export type Roof = {
  rect: Rect;
  meshes: THREE.Mesh[];
  shown: number;
};

type DoorCut = { side: "n" | "s" | "e" | "w"; start: number; end: number };

function mulHex(color: number, k: number): number {
  const r = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * k)));
  const g = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * k)));
  const b = Math.max(0, Math.min(255, Math.round((color & 255) * k)));
  return (r << 16) | (g << 8) | b;
}

function roofLayout(
  r: Rect,
  door: DoorCut,
  inset: number,
): { high: Rect[]; divot: Rect; lip: Rect } {
  const high: Rect[] = [];
  let divot: Rect;
  let lip: Rect;
  const lipW = 0.9;
  if (door.side === "e") {
    high.push({ x: r.x, z: r.z, w: r.w - inset, d: r.d });
    high.push({ x: r.x + r.w - inset, z: r.z, w: inset, d: door.start - r.z });
    high.push({
      x: r.x + r.w - inset,
      z: door.end,
      w: inset,
      d: r.z + r.d - door.end,
    });
    divot = { x: r.x + r.w - inset, z: door.start, w: inset, d: door.end - door.start };
    lip = { x: r.x + r.w - lipW, z: door.start, w: lipW, d: door.end - door.start };
  } else if (door.side === "w") {
    high.push({ x: r.x + inset, z: r.z, w: r.w - inset, d: r.d });
    high.push({ x: r.x, z: r.z, w: inset, d: door.start - r.z });
    high.push({ x: r.x, z: door.end, w: inset, d: r.z + r.d - door.end });
    divot = { x: r.x, z: door.start, w: inset, d: door.end - door.start };
    lip = { x: r.x, z: door.start, w: lipW, d: door.end - door.start };
  } else if (door.side === "s") {
    high.push({ x: r.x, z: r.z, w: r.w, d: r.d - inset });
    high.push({ x: r.x, z: r.z + r.d - inset, w: door.start - r.x, d: inset });
    high.push({
      x: door.end,
      z: r.z + r.d - inset,
      w: r.x + r.w - door.end,
      d: inset,
    });
    divot = { x: door.start, z: r.z + r.d - inset, w: door.end - door.start, d: inset };
    lip = { x: door.start, z: r.z + r.d - lipW, w: door.end - door.start, d: lipW };
  } else {
    high.push({ x: r.x, z: r.z + inset, w: r.w, d: r.d - inset });
    high.push({ x: r.x, z: r.z, w: door.start - r.x, d: inset });
    high.push({ x: door.end, z: r.z, w: r.x + r.w - door.end, d: inset });
    divot = { x: door.start, z: r.z, w: door.end - door.start, d: inset };
    lip = { x: door.start, z: r.z, w: door.end - door.start, d: lipW };
  }
  return { high: high.filter((p) => p.w > 0.08 && p.d > 0.08), divot, lip };
}

function makeRoof(scene: THREE.Scene, r: Rect, color: number, door: DoorCut): Roof {
  const inset = Math.min(4.6, (door.side === "e" || door.side === "w" ? r.w : r.d) * 0.3);
  const { high, divot, lip } = roofLayout(r, door, inset);
  const meshes: THREE.Mesh[] = [];
  for (const piece of high) {
    const mesh = box(scene, piece, 3.75, 0.5, color);
    mesh.renderOrder = 2;
    meshes.push(mesh);
  }
  const well = box(scene, divot, 3.38, 0.28, mulHex(color, 0.42));
  well.renderOrder = 2;
  meshes.push(well);
  const sill = box(scene, lip, 3.52, 0.2, 0xcbb892);
  sill.renderOrder = 3;
  meshes.push(sill);
  return { rect: r, meshes, shown: 1 };
}

/** Hide a building's roof only while standing inside it. All roofs lift when dead. */
export function revealRoofs(
  roofs: Roof[],
  x: number,
  z: number,
  dt: number,
  allOpen = false,
) {
  for (const roof of roofs) {
    const inside = allOpen || inRect(x, z, roof.rect, -0.35);
    const want = inside ? 0 : 1;
    roof.shown += (want - roof.shown) * (1 - Math.exp(-dt * 7));
    const visible = roof.shown > 0.03;
    for (const mesh of roof.meshes) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      mat.transparent = roof.shown < 0.98;
      mat.opacity = Math.max(0, Math.min(1, roof.shown));
      mat.depthWrite = roof.shown > 0.55;
      mesh.visible = visible;
    }
  }
}
