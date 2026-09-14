import * as THREE from "three";
import { aabbHit, inRect, EXTRACT_OPEN_AT, MAP, mapRect, STEP_UP, UNIT, type IslandId, type Rect } from "./config";
import {
  buildingMeshes,
  fitBuilding,
  hasBuilding,
  hasProp,
  hasShip,
  hasTerrain,
  makeBuilding,
  makeProp,
  makeShip,
  oceanMaterial,
  placeOceanSparkles,
  registerDriftShip,
  clearDriftShips,
  clearOceanSparkles,
  linkSkirmish,
  type SeaShipSpec,
  terrainMaterial,
  type BuildingId,
  type PropId,
  type ShipId,
  type TerrainId,
} from "./art";
import { islandMap, LAYOUT_SPREAD, stretchGround, stretchPlot, stretchPoint, unionRect, type IslandLook, type IslandMap } from "./maps";

function wx(n: number): number {
  return n * MAP;
}

function copyRect(dst: Rect, src: Rect) {
  dst.x = src.x;
  dst.z = src.z;
  dst.w = src.w;
  dst.d = src.d;
}

function emptyRect(): Rect {
  return { x: 0, z: 0, w: 1, d: 1 };
}

export const LAND: Rect = emptyRect();
export const LANDS: Rect[] = [];
export const NORTH_PIER: Rect = emptyRect();
export const SOUTH_PIER: Rect = emptyRect();
export const TAVERN: Rect = emptyRect();
export const MARKET: Rect = emptyRect();
export const ROPE: Rect = emptyRect();
export const FORT: Rect = emptyRect();
export const N_WARE: Rect = emptyRect();
export const S_WARE: Rect = emptyRect();
export const FOUNDRY: Rect = emptyRect();
export const DOCKS: Rect = emptyRect();
export const EXTRACT_GULL: Rect = emptyRect();
export const EXTRACT_WREN: Rect = emptyRect();
export const EXTRACT_BELL: Rect = emptyRect();

/** Landmark footprints. Voxel shells fill these plots; nobody walks through. */
export const WALLS: Rect[] = [];
const BUILDING_PAD = 4 * MAP;

/** Rim spawns. Off extract pads, off building shells. Each has one starter barrel. */
export const SPAWNS: { x: number; z: number }[] = [];

export type LootKind = "barrel" | "crate" | "lockbox" | "chest" | "trophy-chest";

export type LootSpot = {
  id: string;
  kind: LootKind;
  x: number;
  z: number;
};

export const LOOT_SPOTS: LootSpot[] = [];

let WALKABLE: Rect[] = [];
let activeMap: IslandMap = islandMap(1);
let harborRoot: THREE.Group | null = null;

function harborAdd(obj: THREE.Object3D) {
  harborRoot?.add(obj);
}

function disposeHarborTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geoType = mesh.geometry?.type;
    if (geoType === "BoxGeometry" || geoType === "PlaneGeometry" || geoType === "CylinderGeometry") {
      mesh.geometry.dispose();
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      if (geoType === "BoxGeometry" || geoType === "PlaneGeometry" || geoType === "CylinderGeometry") {
        m.dispose();
      }
    }
  });
}

function teardownHarbor(scene: THREE.Scene) {
  clearDriftShips();
  clearOceanSparkles();
  if (!harborRoot) return;
  scene.remove(harborRoot);
  disposeHarborTree(harborRoot);
  harborRoot = null;
}

export function islandLook(): IslandLook {
  return activeMap.look;
}

export function pierLabel(id: "gull" | "wren"): string {
  return id === "gull" ? activeMap.gullPier : activeMap.wrenPier;
}

export function mapFrameRects(): Rect[] {
  return [...LANDS, NORTH_PIER, SOUTH_PIER, DOCKS];
}

/** Top of the walkable slab at this xz — floors, not crates. */
export function deckHeight(x: number, z: number): number {
  if (inRect(x, z, NORTH_PIER, 0.5) || inRect(x, z, SOUTH_PIER, 0.5) || inRect(x, z, DOCKS, 0.5)) {
    return 0.7;
  }
  if (inRect(x, z, FORT, 0.2)) return 0.9;
  if (inRect(x, z, TAVERN, 0.2) || inRect(x, z, N_WARE, 0.2) || inRect(x, z, S_WARE, 0.2)) {
    return 0.6;
  }
  if (inRect(x, z, FOUNDRY, 0.2)) return 0.6;
  if (inRect(x, z, MARKET, 0.2) || inRect(x, z, ROPE, 0.2)) return 0.55;
  if (LANDS.some((r) => inRect(x, z, r, 0.2))) return 0.4;
  return 0.05;
}

export function extractPadY(r: Rect): number {
  return deckHeight(r.x + r.w / 2, r.z + r.d / 2);
}

export type Cover = {
  rect: Rect;
  y: number;
  h: number;
  los: boolean;
};

/** Solid props. Filled in `buildHarbor`. Ground nav goes around these. */
export const COVER: Cover[] = [];

export function standHeight(x: number, z: number): number {
  let y = deckHeight(x, z);
  for (const c of COVER) {
    if (inRect(x, z, c.rect, -0.08)) y = Math.max(y, c.y + c.h);
  }
  return y;
}

export function coverBlocked(x: number, z: number, feetY: number, radius = 0.85): boolean {
  for (const c of COVER) {
    if (!inRect(x, z, c.rect, radius)) continue;
    const top = c.y + c.h;
    if (feetY >= top - 0.14 * UNIT) continue;
    if (top - feetY <= STEP_UP) continue;
    return true;
  }
  return false;
}

function hitsCover(x: number, z: number, pad = 0.9): boolean {
  return COVER.some((c) => c.h > STEP_UP && inRect(x, z, c.rect, pad));
}

export function isWalkable(x: number, z: number): boolean {
  if (!WALKABLE.some((r) => inRect(x, z, r))) return false;
  return !WALLS.some((w) => inRect(x, z, w, 1.6 * MAP));
}

function onDeck(x: number, z: number): boolean {
  return WALKABLE.some((r) => inRect(x, z, r));
}

/** True if the point is on deck with room to stand — not on a water/pier corner. */
export function walkClear(x: number, z: number, r = 2.2 * MAP): boolean {
  if (!isWalkable(x, z)) return false;
  if (hitsCover(x, z, 0.55)) return false;
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
    for (const dist of [step, step * 1.7, 1.15 * UNIT]) {
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
  const dists = [10, 18, 28, 40].map(wx);
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
  if (WALLS.some((w) => aabbHit(ox, oz, dx, dz, dist, w) !== null)) return true;
  for (const c of COVER) {
    if (!c.los) continue;
    if (inRect(ox, oz, c.rect, 0.2)) continue;
    if (aabbHit(ox, oz, dx, dz, dist, c.rect) !== null) return true;
  }
  return false;
}

/** How far a shot travels before a wall or LOS cover. Same blockers as `blockedByWall`. */
export function shotReach(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  maxDist: number,
): number {
  let reach = maxDist;
  const clip = (r: Rect) => {
    const t = aabbHit(ox, oz, dx, dz, reach, r);
    if (t !== null && t > 0.12 && t < reach) reach = t;
  };
  for (const w of WALLS) clip(w);
  for (const c of COVER) {
    if (!c.los) continue;
    if (inRect(ox, oz, c.rect, 0.2)) continue;
    clip(c.rect);
  }
  return reach;
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
const NAV_MIN_X = Math.round(-200 * MAP);
const NAV_MIN_Z = Math.round(-200 * MAP);
const NAV_COLS = Math.round(420 * MAP);
const NAV_ROWS = Math.round(420 * MAP);
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
  _scene: THREE.Scene,
  r: Rect,
  y: number,
  h: number,
  color: number,
  opacity = 1,
  dress?: TerrainId,
  tile = 8,
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
  if (dress) {
    mesh.userData.harborDress = dress;
    mesh.userData.tileRepeat = [Math.max(0.5, r.w / tile), Math.max(0.5, r.d / tile)];
    mesh.userData.terrainTint = color;
  }
  harborAdd(mesh);
  return mesh;
}

function inBuilding(x: number, z: number, pad = BUILDING_PAD): boolean {
  return WALLS.some((w) => inRect(x, z, w, pad));
}

function onExtract(x: number, z: number): boolean {
  return (
    inRect(x, z, EXTRACT_GULL, 2) ||
    inRect(x, z, EXTRACT_WREN, 2) ||
    inRect(x, z, EXTRACT_BELL, 2)
  );
}

function landCentroid(): { x: number; z: number } {
  const u = unionRect(LANDS.length ? LANDS : [LAND]);
  return { x: u.x + u.w / 2, z: u.z + u.d / 2 };
}

function sampleDeck(step = 3.6 * MAP): { x: number; z: number }[] {
  const u = unionRect(WALKABLE.length ? WALKABLE : [LAND]);
  const pts: { x: number; z: number }[] = [];
  for (let x = u.x + step; x < u.x + u.w; x += step) {
    for (let z = u.z + step; z < u.z + u.d; z += step) {
      if (!walkClear(x, z)) continue;
      if (inBuilding(x, z)) continue;
      if (onExtract(x, z)) continue;
      pts.push({ x, z });
    }
  }
  return pts;
}

function isRim(p: { x: number; z: number }, r = 7 * MAP): boolean {
  return !onDeck(p.x + r, p.z) || !onDeck(p.x - r, p.z) || !onDeck(p.x, p.z + r) || !onDeck(p.x, p.z - r);
}

function farthest(
  candidates: { x: number; z: number }[],
  n: number,
  existing: { x: number; z: number }[] = [],
): { x: number; z: number }[] {
  if (!candidates.length || n <= 0) return [];
  const picked = [...existing];
  const left = candidates.slice();
  if (!picked.length) {
    const seed = left.splice(Math.floor(left.length / 3), 1)[0];
    if (seed) picked.push(seed);
  }
  const want = existing.length + n;
  while (picked.length < want && left.length) {
    let bestI = 0;
    let bestD = -1;
    for (let i = 0; i < left.length; i++) {
      const c = left[i]!;
      let d = Infinity;
      for (const p of picked) d = Math.min(d, Math.hypot(c.x - p.x, c.z - p.z));
      if (d > bestD) {
        bestD = d;
        bestI = i;
      }
    }
    const next = left.splice(bestI, 1)[0];
    if (!next) break;
    picked.push(next);
  }
  return picked.slice(existing.length, existing.length + n);
}

function inlandOf(p: { x: number; z: number }, dist: number): { x: number; z: number } {
  const c = landCentroid();
  const dx = c.x - p.x;
  const dz = c.z - p.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: p.x + (dx / len) * dist, z: p.z + (dz / len) * dist };
}

function fillSpawns() {
  SPAWNS.length = 0;
  const rim = sampleDeck().filter((p) => isRim(p));
  const pool = rim.length >= 8 ? rim : sampleDeck();
  const picked = farthest(pool, 8);
  for (const p of picked) SPAWNS.push(p);
  for (let i = 0; SPAWNS.length < 8 && pool.length; i++) {
    SPAWNS.push(pool[i % pool.length]!);
  }
}

function fillLoot() {
  LOOT_SPOTS.length = 0;
  const deck = sampleDeck(4.2 * MAP);
  const inland = deck.filter((p) => !isRim(p, 9 * MAP));
  const pool = inland.length > 12 ? inland : deck;
  for (let i = 0; i < SPAWNS.length; i++) {
    const p = inlandOf(SPAWNS[i]!, 6.2 * MAP);
    LOOT_SPOTS.push({ id: `B${i + 1}`, kind: "barrel", x: p.x, z: p.z });
  }
  const extraBarrels = farthest(pool, 8, LOOT_SPOTS);
  extraBarrels.forEach((p, i) => LOOT_SPOTS.push({ id: `B${9 + i}`, kind: "barrel", x: p.x, z: p.z }));
  const crates = farthest(pool, 8, LOOT_SPOTS);
  crates.forEach((p, i) => LOOT_SPOTS.push({ id: `U${i + 1}`, kind: "crate", x: p.x, z: p.z }));
  const dock = { x: DOCKS.x + DOCKS.w / 2, z: DOCKS.z + DOCKS.d / 2 };
  const lock = inlandOf(dock, 8 * MAP);
  LOOT_SPOTS.push({ id: "R2", kind: "lockbox", x: lock.x, z: lock.z });
  const fort = { x: FORT.x + FORT.w / 2, z: FORT.z + FORT.d + 8 * MAP };
  LOOT_SPOTS.push({ id: "E1", kind: "chest", x: fort.x, z: fort.z });
  const trophies = farthest(pool, 10, LOOT_SPOTS);
  trophies.forEach((p, i) => LOOT_SPOTS.push({ id: `T${i + 1}`, kind: "trophy-chest", x: p.x, z: p.z }));
}

export function applyIslandLayout(id: IslandId) {
  activeMap = islandMap(id);
  const spec = activeMap;
  LANDS.length = 0;
  for (const r of spec.land) LANDS.push(mapRect(stretchGround(r)));
  copyRect(LAND, unionRect(LANDS));
  copyRect(NORTH_PIER, mapRect(stretchGround(spec.northPier)));
  copyRect(SOUTH_PIER, mapRect(stretchGround(spec.southPier)));
  copyRect(DOCKS, mapRect(stretchGround(spec.docks)));
  copyRect(TAVERN, mapRect(stretchPlot(spec.tavern)));
  copyRect(MARKET, mapRect(stretchPlot(spec.market)));
  copyRect(ROPE, mapRect(stretchPlot(spec.rope)));
  copyRect(FORT, mapRect(stretchPlot(spec.fort)));
  copyRect(N_WARE, mapRect(stretchPlot(spec.nWare)));
  copyRect(S_WARE, mapRect(stretchPlot(spec.sWare)));
  copyRect(FOUNDRY, mapRect(stretchPlot(spec.foundry)));
  copyRect(EXTRACT_GULL, mapRect(stretchPlot(spec.extractGull)));
  copyRect(EXTRACT_WREN, mapRect(stretchPlot(spec.extractWren)));
  copyRect(EXTRACT_BELL, mapRect(stretchPlot(spec.extractBell)));
  WALLS.length = 0;
  WALLS.push(TAVERN, MARKET, N_WARE, S_WARE, FORT, FOUNDRY);
  WALKABLE = [...LANDS, NORTH_PIER, SOUTH_PIER, DOCKS];
  COVER.length = 0;
  navGrid = null;
  fillSpawns();
  fillLoot();
}

/** Keep props and loot from sharing a footprint after UNIT scale. */
const FOOT_GAP = 3.5;
type Foot = { x: number; z: number; r: number };
const FEET: Foot[] = [];
let laidLoot: LootSpot[] | null = null;

function lootRadius(kind: LootKind): number {
  if (kind === "lockbox" || kind === "chest" || kind === "trophy-chest") return 4.4;
  return 2.9;
}

function footHits(x: number, z: number, r: number): boolean {
  for (const f of FEET) {
    if (Math.hypot(f.x - x, f.z - z) < f.r + r + FOOT_GAP) return true;
  }
  return false;
}

function claimFoot(x: number, z: number, r: number) {
  FEET.push({ x, z, r });
}

function canStand(x: number, z: number): boolean {
  if (inBuilding(x, z)) return false;
  if (!isWalkable(x, z)) return false;
  return onDeck(x, z);
}

function nudgeClear(x: number, z: number, r: number): { x: number; z: number } | null {
  const tryAt = (nx: number, nz: number) => {
    const p = outsideWalls(nx, nz);
    if (!canStand(p.x, p.z) || footHits(p.x, p.z, r)) return null;
    return p;
  };
  const here = tryAt(x, z);
  if (here) return here;
  for (let ring = 1; ring <= 10; ring++) {
    const dist = ring * 3.4;
    const n = 8 + ring * 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const hit = tryAt(x + Math.sin(a) * dist, z + Math.cos(a) * dist);
      if (hit) return hit;
    }
  }
  return null;
}

function lootCoverSize(kind: LootKind): { w: number; d: number; h: number } {
  if (kind === "barrel") return { w: 1.1 * UNIT, d: 1.1 * UNIT, h: 1.15 * UNIT };
  if (kind === "crate") return { w: 1.12 * UNIT, d: 1.12 * UNIT, h: 0.85 * UNIT };
  return { w: 1.9 * UNIT, d: 1.35 * UNIT, h: 0.95 * UNIT };
}

function solidLoot(x: number, z: number, kind: LootKind) {
  const { w, d, h } = lootCoverSize(kind);
  pushCover({ x: x - w / 2, z: z - d / 2, w, d }, deckHeight(x, z), h, true);
}

function layoutLoot(): LootSpot[] {
  if (laidLoot) return laidLoot;
  FEET.length = 0;
  laidLoot = [];
  for (const s of LOOT_SPOTS) {
    const r = lootRadius(s.kind);
    const p = nudgeClear(s.x, s.z, r) ?? outsideWalls(s.x, s.z);
    laidLoot.push({ ...s, ...p });
    claimFoot(p.x, p.z, r);
    solidLoot(p.x, p.z, s.kind);
  }
  return laidLoot;
}

function pushCover(rect: Rect, y: number, h: number, los: boolean) {
  COVER.push({ rect, y, h, los });
  navGrid = null;
}

function putProp(
  scene: THREE.Scene,
  id: PropId,
  cx: number,
  cz: number,
  w: number,
  d: number,
  h: number,
  los: boolean,
  yaw = 0,
  fitH?: number,
) {
  if (inBuilding(cx, cz)) return;
  if (!onDeck(cx, cz)) return;
  const r = Math.max(w, d) * UNIT * 0.55;
  if (footHits(cx, cz, r)) return;
  w *= UNIT;
  d *= UNIT;
  h *= UNIT;
  if (fitH !== undefined) fitH *= UNIT;
  const y = deckHeight(cx, cz);
  if (hasProp(id)) {
    const mesh = makeProp(id, fitH ?? h);
    mesh.position.set(cx, y, cz);
    mesh.rotation.y = yaw;
    harborAdd(mesh);
  } else {
    box(scene, { x: cx - w / 2, z: cz - d / 2, w, d }, y, h, 0x9a6b3c);
  }
  claimFoot(cx, cz, r);
  pushCover({ x: cx - w / 2, z: cz - d / 2, w, d }, y, h, los);
}

function crate(scene: THREE.Scene, cx: number, cz: number) {
  putProp(scene, "crate", cx, cz, 1.2, 1.15, 0.95, true);
}

function crateStack(scene: THREE.Scene, cx: number, cz: number) {
  if (inBuilding(cx, cz)) return;
  if (!onDeck(cx, cz)) return;
  const r = 1.28 * UNIT * 0.6;
  if (footHits(cx, cz, r)) return;
  const y = deckHeight(cx, cz);
  const w = 1.28 * UNIT;
  const d = 1.22 * UNIT;
  const h = 1.45 * UNIT;
  if (hasProp("crate")) {
    const a = makeProp("crate", 0.74 * UNIT);
    a.position.set(cx, y, cz);
    harborAdd(a);
    const b = makeProp("crate", 0.66 * UNIT);
    b.position.set(cx + 0.12 * UNIT, y + 0.74 * UNIT, cz + 0.08 * UNIT);
    b.rotation.y = 0.35;
    harborAdd(b);
  } else {
    box(scene, { x: cx - w / 2, z: cz - d / 2, w, d }, y, 0.74 * UNIT, 0x9a6b3c);
    box(
      scene,
      { x: cx - 0.54 * UNIT, z: cz - 0.5 * UNIT, w: 1.08 * UNIT, d: UNIT },
      y + 0.74 * UNIT,
      0.66 * UNIT,
      0x8a5a32,
    );
  }
  pushCover({ x: cx - w / 2, z: cz - d / 2, w, d }, y, h, true);
  claimFoot(cx, cz, r);
}

/** Cover only — the openable barrel mesh is spawned from `allLootSpots`. */
const DECOR_BARRELS: { x: number; z: number }[] = [];

function decorBarrel(_scene: THREE.Scene, cx: number, cz: number) {
  const r = lootRadius("barrel");
  const p = nudgeClear(cx, cz, r);
  if (!p) return;
  DECOR_BARRELS.push({ x: p.x, z: p.z });
  claimFoot(p.x, p.z, r);
  const y = deckHeight(p.x, p.z);
  const cr = 0.48 * UNIT;
  pushCover({ x: p.x - cr, z: p.z - cr, w: cr * 2, d: cr * 2 }, y, 1.05 * UNIT, true);
}

/** Push a point off a solid building pad so loot stays reachable. */
function outsideWalls(x: number, z: number, margin = BUILDING_PAD): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let n = 0; n < 6; n++) {
    const wall = WALLS.find((w) => inRect(px, pz, w, margin));
    if (!wall) break;
    const left = px - (wall.x - margin);
    const right = wall.x + wall.w + margin - px;
    const north = pz - (wall.z - margin);
    const south = wall.z + wall.d + margin - pz;
    const m = Math.min(left, right, north, south);
    if (m === left) px = wall.x - margin;
    else if (m === right) px = wall.x + wall.w + margin;
    else if (m === north) pz = wall.z - margin;
    else pz = wall.z + wall.d + margin;
  }
  return { x: px, z: pz };
}

export function allLootSpots(): LootSpot[] {
  const base = layoutLoot();
  return [
    ...base,
    ...DECOR_BARRELS.map((p, i) => ({
      id: `B${17 + i}`,
      kind: "barrel" as const,
      x: p.x,
      z: p.z,
    })),
  ];
}

function coil(scene: THREE.Scene, cx: number, cz: number) {
  putProp(scene, "rock", cx, cz, 1.2, 1.2, 0.7, true);
}

function bollard(scene: THREE.Scene, cx: number, cz: number) {
  putProp(scene, "rock", cx, cz, 0.7, 0.7, 0.45, false, 0.8, 0.5);
}

function timber(scene: THREE.Scene, cx: number, cz: number, alongX: boolean) {
  putProp(scene, "driftwood", cx, cz, alongX ? 2.8 : 0.9, alongX ? 0.9 : 2.8, 0.5, false, alongX ? 0 : Math.PI / 2);
}

function stall(scene: THREE.Scene, cx: number, cz: number, alongX: boolean) {
  if (inBuilding(cx, cz)) return;
  crate(scene, cx, cz);
  decorBarrel(scene, cx + (alongX ? 1.15 * UNIT : 0), cz + (alongX ? 0 : 1.15 * UNIT));
}

function cannon(scene: THREE.Scene, cx: number, cz: number, yaw: number) {
  const alongX = Math.abs(Math.sin(yaw)) < 0.7;
  putProp(
    scene,
    "cannon",
    cx,
    cz,
    alongX ? 2.1 : 0.95,
    alongX ? 0.95 : 2.1,
    0.95,
    true,
    yaw,
    1.05,
  );
}

function bench(scene: THREE.Scene, cx: number, cz: number, alongX: boolean) {
  putProp(scene, "driftwood", cx, cz, alongX ? 1.7 : 0.55, alongX ? 0.55 : 1.7, 0.48, false, alongX ? 0 : Math.PI / 2, 0.45);
}

function palm(scene: THREE.Scene, cx: number, cz: number) {
  putProp(scene, "palm", cx, cz, 1.15, 1.15, 2.2, true, (cx * 0.13 + cz * 0.07) % (Math.PI * 2), 5.1);
}

function sand(scene: THREE.Scene, cx: number, cz: number, yaw = 0) {
  putProp(scene, "sand", cx, cz, 2.1, 2.1, 0.4, false, yaw, 0.42);
}

function boulder(scene: THREE.Scene, cx: number, cz: number, yaw = 0) {
  putProp(scene, "coastal-rock", cx, cz, 2.3, 1.6, 1.25, true, yaw, 1.35);
}

function rectMid(r: Rect): { x: number; z: number } {
  return { x: r.x + r.w / 2, z: r.z + r.d / 2 };
}

function yard(r: Rect, dir: "n" | "s" | "e" | "w", dist: number): { x: number; z: number } {
  dist *= MAP * LAYOUT_SPREAD;
  const m = rectMid(r);
  if (dir === "n") return { x: m.x, z: r.z - dist };
  if (dir === "s") return { x: m.x, z: r.z + r.d + dist };
  if (dir === "w") return { x: r.x - dist, z: m.z };
  return { x: r.x + r.w + dist, z: m.z };
}

/** Crates, palms, rocks, sand — yards and walkways only. Building shells stay empty. */
export function placeDecor(scene: THREE.Scene) {
  COVER.length = 0;
  DECOR_BARRELS.length = 0;
  laidLoot = null;
  navGrid = null;
  layoutLoot();

  bollard(scene, NORTH_PIER.x + wx(6), NORTH_PIER.z + wx(4));
  timber(scene, yard(NORTH_PIER, "e", 6).x, yard(NORTH_PIER, "e", 6).z, NORTH_PIER.w >= NORTH_PIER.d);

  bollard(scene, SOUTH_PIER.x + wx(6), SOUTH_PIER.z + SOUTH_PIER.d - wx(4));
  timber(scene, yard(SOUTH_PIER, "e", 6).x, yard(SOUTH_PIER, "e", 6).z, SOUTH_PIER.w >= SOUTH_PIER.d);

  const grogE = yard(TAVERN, "e", 12);
  const grogS = yard(TAVERN, "s", 10);
  bench(scene, grogE.x, grogE.z, false);
  decorBarrel(scene, grogS.x - wx(8), grogS.z);

  stall(scene, yard(MARKET, "e", 10).x, yard(MARKET, "e", 10).z, false);
  crate(scene, yard(MARKET, "s", 10).x, yard(MARKET, "s", 10).z);

  coil(scene, yard(ROPE, "n", 10).x, yard(ROPE, "n", 10).z);
  timber(scene, yard(ROPE, "s", 10).x, yard(ROPE, "s", 10).z, false);

  crate(scene, yard(N_WARE, "e", 12).x, yard(N_WARE, "e", 12).z);
  coil(scene, yard(N_WARE, "w", 12).x, yard(N_WARE, "w", 12).z);
  crate(scene, yard(S_WARE, "e", 12).x, yard(S_WARE, "e", 12).z);
  coil(scene, yard(S_WARE, "w", 12).x, yard(S_WARE, "w", 12).z);

  cannon(scene, yard(FORT, "n", 10).x, yard(FORT, "n", 10).z, Math.PI / 2);
  cannon(scene, yard(FORT, "s", 10).x, yard(FORT, "s", 10).z, Math.PI / 2);
  crateStack(scene, yard(FORT, "e", 12).x, yard(FORT, "e", 12).z);

  crate(scene, yard(FOUNDRY, "s", 12).x, yard(FOUNDRY, "s", 12).z);
  coil(scene, yard(FOUNDRY, "e", 12).x, yard(FOUNDRY, "e", 12).z);

  crate(scene, yard(DOCKS, "e", 8).x, yard(DOCKS, "e", 8).z);
  bollard(scene, DOCKS.x + DOCKS.w * 0.25, DOCKS.z + wx(3));
  bollard(scene, DOCKS.x + DOCKS.w * 0.25, DOCKS.z + DOCKS.d - wx(3));
  bollard(scene, NORTH_PIER.x + wx(4), NORTH_PIER.z + wx(4));
  bollard(scene, NORTH_PIER.x + NORTH_PIER.w - wx(4), NORTH_PIER.z + NORTH_PIER.d - wx(4));
  bollard(scene, SOUTH_PIER.x + wx(4), SOUTH_PIER.z + wx(4));
  bollard(scene, SOUTH_PIER.x + SOUTH_PIER.w - wx(4), SOUTH_PIER.z + SOUTH_PIER.d - wx(4));

  placeShoreDecor(scene);
}

function placeShoreDecor(scene: THREE.Scene) {
  const rim = sampleDeck(5.2 * MAP).filter((p) => isRim(p, 6.2 * MAP));
  const used: { x: number; z: number }[] = SPAWNS.map((s) => ({ x: s.x, z: s.z }));
  const shore = activeMap.shore;
  const palms = farthest(rim, shore.palms, used);
  palms.forEach((p) => {
    palm(scene, p.x, p.z);
    used.push(p);
  });
  const rocks = farthest(rim, shore.rocks, used);
  rocks.forEach((p, i) => {
    boulder(scene, p.x, p.z, i * 0.7);
    used.push(p);
  });
  const dunes = farthest(rim, shore.sand, used);
  dunes.forEach((p, i) => sand(scene, p.x, p.z, i * 0.4));
  const extraCannons = Math.max(0, shore.cannons - 2);
  const cannonPts = farthest(rim, extraCannons, used);
  cannonPts.forEach((p, i) => cannon(scene, p.x, p.z, i * 1.1));
}

/** Terrain tiles + voxel buildings, after `loadArt`. Keeps wall collision; roofs fade with the shells. */
export function dressHarbor(scene: THREE.Scene, roofs: Roof[], ships: NavyShip[]) {
  const look = activeMap.look;
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const kind = mesh.userData.harborDress as TerrainId | "ocean" | undefined;
    if (!kind) return;
    const [u, v] = (mesh.userData.tileRepeat as [number, number] | undefined) ?? [4, 4];
    if (kind === "ocean") {
      mesh.material = oceanMaterial(u, v, {
        deep: look.waterDeep,
        mid: look.waterMid,
        lite: look.waterLite,
      });
      return;
    }
    if (!hasTerrain(kind)) return;
    const tint = kind === look.landTerrain ? look.landTint : 0xffffff;
    const mat = terrainMaterial(kind, u, v, tint);
    if (mat) mesh.material = mat;
  });
  placeBuildings(scene, roofs);
  placeWaves(scene);
  dressNavyShips(ships);
}

type BuildingSlot = {
  id: BuildingId;
  rect: Rect;
  roof: number;
  maxH: number;
  yaw?: number;
  uniform?: boolean;
};

function placeBuildings(scene: THREE.Scene, roofs: Roof[]) {
  const slots: BuildingSlot[] = [
    { id: "tiki-bar", rect: TAVERN, roof: 0, maxH: 9 },
    { id: "distillery", rect: N_WARE, roof: 1, maxH: 8.5 },
    { id: "shipwright", rect: S_WARE, roof: 2, maxH: 8.5 },
    { id: "town-hall", rect: FORT, roof: 3, maxH: 12 },
    { id: "marketplace", rect: MARKET, roof: 4, maxH: 8 },
    { id: "foundry", rect: FOUNDRY, roof: 5, maxH: 10 },
    { id: "docks", rect: DOCKS, roof: 6, maxH: 9, uniform: true },
  ];
  for (const slot of slots) {
    if (!hasBuilding(slot.id)) continue;
    const roof = roofs[slot.roof];
    if (!roof) continue;
    stripGreyRoofs(scene, roof);
    const shell = makeBuilding(slot.id);
    fitBuilding(shell, slot.rect.w + 0.9 * MAP, slot.rect.d + 0.9 * MAP, slot.maxH * MAP, slot.uniform);
    const cx = slot.rect.x + slot.rect.w / 2;
    const cz = slot.rect.z + slot.rect.d / 2;
    shell.position.set(cx, deckHeight(cx, cz), cz);
    shell.rotation.y = slot.yaw ?? 0;
    harborAdd(shell);
    roof.meshes.push(...buildingMeshes(shell));
  }
}

function stripGreyRoofs(_scene: THREE.Scene, roof: Roof) {
  const keep: THREE.Mesh[] = [];
  for (const mesh of roof.meshes) {
    if (mesh.userData.greyRoof) {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
    } else {
      keep.push(mesh);
    }
  }
  roof.meshes = keep;
}

function placeWaves(scene: THREE.Scene) {
  placeOceanSparkles(harborRoot ?? scene, (x, z) => deckHeight(x, z) < 0.12, activeMap.look.sparkle);
  placeDriftShips(scene);
}

function placeDriftShips(_scene: THREE.Scene) {
  clearDriftShips();
  const put = (
    id: ShipId,
    x: number,
    z: number,
    yaw: number,
    length: number,
    spec?: SeaShipSpec,
  ) => {
    if (!hasShip(id)) return null;
    const mesh = makeShip(id, length * MAP);
    if (!mesh) return null;
    mesh.position.set(wx(x), -0.2, wx(z));
    mesh.rotation.y = yaw;
    harborAdd(mesh);
    const scaled = spec
      ? {
          ...spec,
          patrolR: spec.patrolR != null ? spec.patrolR * MAP : undefined,
          ax: spec.ax != null ? spec.ax * MAP : undefined,
          az: spec.az != null ? spec.az * MAP : undefined,
          bx: spec.bx != null ? spec.bx * MAP : undefined,
          bz: spec.bz != null ? spec.bz * MAP : undefined,
          cx: spec.cx != null ? spec.cx * MAP : undefined,
          cz: spec.cz != null ? spec.cz * MAP : undefined,
          orbitR: spec.orbitR != null ? spec.orbitR * MAP : undefined,
        }
      : spec;
    registerDriftShip(mesh, wx(x), wx(z), yaw, scaled);
    return mesh;
  };

  const b = unionRect(mapFrameRects());
  const west = b.x / MAP - 22;
  const east = (b.x + b.w) / MAP + 22;
  const north = b.z / MAP - 22;
  const south = (b.z + b.d) / MAP + 22;
  const mx = (b.x + b.w / 2) / MAP;
  const mz = (b.z + b.d / 2) / MAP;

  put("sloop", west, mz, 0, 16, {
    kind: "lane",
    ax: west - 16, az: mz, bx: west + 10, bz: mz,
    patrolW: 0.16,
  });
  put("skiff", west + 8, mz + 16, 0, 9.5, {
    kind: "lane",
    ax: west - 12, az: mz + 16, bx: west + 18, bz: mz + 16,
    patrolW: -0.22,
  });
  put("skiff", west + 8, mz - 16, 0, 9, {
    kind: "lane",
    ax: west - 12, az: mz - 16, bx: west + 18, bz: mz - 16,
    patrolW: 0.2,
  });
  put("sloop", mx, north, 2.15, 14, { kind: "patrol", patrolR: 12, patrolW: 0.17 });
  put("skiff", east, mz + 12, -0.4, 9, { kind: "patrol", patrolR: 8, patrolW: 0.24 });
  put("sloop", mx, south, -0.2, 15, { kind: "patrol", patrolR: 12, patrolW: 0.16 });
  put("galleon", east, mz, -1.3, 20, { kind: "patrol", patrolR: 14, patrolW: 0.11 });
  put("frigate", mx + 20, north - 4, 2.4, 22, { kind: "patrol", patrolR: 13, patrolW: -0.12 });
  put("navy-sloop", east - 4, mz - 10, -1.1, 18, { kind: "patrol", patrolR: 12, patrolW: 0.13 });

  const nwA = put("sloop", west, north, 0, 16, {
    kind: "skirmish",
    cx: west, cz: north, orbitR: 13, orbitW: 0.34, orbitA: 0,
  });
  const nwB = put("navy-sloop", west, north + 12, 0, 18, {
    kind: "skirmish",
    cx: west, cz: north, orbitR: 13, orbitW: 0.34, orbitA: Math.PI,
  });
  if (nwA && nwB) linkSkirmish(nwA, nwB);

  const seA = put("frigate", east, south, 0, 22, {
    kind: "skirmish",
    cx: east, cz: south, orbitR: 12, orbitW: -0.3, orbitA: 0.4,
  });
  const seB = put("navy-frigate", east - 4, south + 4, 0, 22, {
    kind: "skirmish",
    cx: east, cz: south, orbitR: 12, orbitW: -0.3, orbitA: 0.4 + Math.PI,
  });
  if (seA && seB) linkSkirmish(seA, seB);

  const neA = put("galleon", east, north, 0, 20, {
    kind: "skirmish",
    cx: east, cz: north, orbitR: 15, orbitW: 0.22, orbitA: 1.1,
  });
  const neB = put("navy-frigate", east - 4, north + 4, 0, 24, {
    kind: "skirmish",
    cx: east, cz: north, orbitR: 15, orbitW: 0.22, orbitA: 1.1 + Math.PI,
  });
  if (neA && neB) linkSkirmish(neA, neB);

  const swA = put("sloop", west + 10, south, 0, 15, {
    kind: "skirmish",
    cx: west + 12, cz: south, orbitR: 11, orbitW: 0.4, orbitA: 2.2,
  });
  const swB = put("skiff", west + 14, south + 4, 0, 9.5, {
    kind: "skirmish",
    cx: west + 12, cz: south, orbitR: 11, orbitW: 0.4, orbitA: 2.2 + Math.PI,
  });
  if (swA && swB) linkSkirmish(swA, swB);
}

function labelDecal(text: string, width: number, yaw = 0): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 1024, 256);
  g.font = "700 100px Palatino, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(42, 26, 14, 0.72)";
  g.lineWidth = 14;
  g.strokeText(text, 512, 128);
  g.fillStyle = "#f2e6c4";
  g.fillText(text, 512, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshLambertMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -8,
    polygonOffsetUnits: -8,
    alphaTest: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.25), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = yaw;
  mesh.renderOrder = 8;
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

export type ExtractGlow = {
  id: "gull" | "wren" | "bell";
  mat: THREE.MeshBasicMaterial;
  light: THREE.PointLight;
};

let pierGlowTex: THREE.CanvasTexture | null = null;
let bellGlowTex: THREE.CanvasTexture | null = null;

function makePierGlowTex(): THREE.CanvasTexture {
  if (pierGlowTex) return pierGlowTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  const xg = g.createLinearGradient(0, 0, 256, 0);
  xg.addColorStop(0, "rgba(255, 236, 150, 1)");
  xg.addColorStop(0.4, "rgba(255, 196, 64, 0.8)");
  xg.addColorStop(0.78, "rgba(212, 160, 23, 0.18)");
  xg.addColorStop(1, "rgba(212, 160, 23, 0)");
  g.fillStyle = xg;
  g.fillRect(0, 0, 256, 64);
  const yg = g.createLinearGradient(0, 0, 0, 64);
  yg.addColorStop(0, "rgba(0,0,0,1)");
  yg.addColorStop(0.14, "rgba(0,0,0,0)");
  yg.addColorStop(0.86, "rgba(0,0,0,0)");
  yg.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = yg;
  g.fillRect(0, 0, 256, 64);
  pierGlowTex = new THREE.CanvasTexture(c);
  pierGlowTex.colorSpace = THREE.SRGBColorSpace;
  return pierGlowTex;
}

function makeBellGlowTex(): THREE.CanvasTexture {
  if (bellGlowTex) return bellGlowTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  rg.addColorStop(0, "rgba(255, 236, 150, 1)");
  rg.addColorStop(0.5, "rgba(255, 196, 64, 0.55)");
  rg.addColorStop(1, "rgba(212, 160, 23, 0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  bellGlowTex = new THREE.CanvasTexture(c);
  bellGlowTex.colorSpace = THREE.SRGBColorSpace;
  return bellGlowTex;
}

function placeExtractGlow(
  _scene: THREE.Scene,
  id: ExtractGlow["id"],
  r: Rect,
): ExtractGlow {
  const y = extractPadY(r);
  const pier = id !== "bell";
  const mat = new THREE.MeshBasicMaterial({
    map: pier ? makePierGlowTex() : makeBellGlowTex(),
    color: 0xffe08a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(r.x + r.w / 2, y + 0.03, r.z + r.d / 2);
  mesh.renderOrder = 5;
  harborAdd(mesh);
  const light = new THREE.PointLight(0xffc94a, 0, 20 * MAP, 1.8);
  light.position.set(pier ? r.x + wx(3.2) : r.x + r.w / 2, y + 2.2, r.z + r.d / 2);
  harborAdd(light);
  return { id, mat, light };
}

export function pulseExtractGlows(
  glows: ExtractGlow[],
  elapsed: number,
  docksOpen: boolean,
  bellOpen: boolean,
) {
  const wave = 0.5 + 0.5 * Math.sin(elapsed * 3.5);
  for (const g of glows) {
    const on = g.id === "bell" ? bellOpen : docksOpen;
    g.mat.opacity = on ? 0.32 + 0.68 * wave : 0;
    g.light.intensity = on ? 1.6 + 2.6 * wave : 0;
  }
}

export function buildHarbor(scene: THREE.Scene, island: IslandId = 1): {
  extractGlows: ExtractGlow[];
  roofs: Roof[];
  ships: NavyShip[];
} {
  teardownHarbor(scene);
  applyIslandLayout(island);
  harborRoot = new THREE.Group();
  harborRoot.name = "harbor";
  scene.add(harborRoot);

  const look = activeMap.look;
  harborAdd(new THREE.AmbientLight(look.ambient, look.ambientInt));
  harborAdd(new THREE.HemisphereLight(look.hemiSky, look.hemiGround, look.hemiInt));
  const sun = new THREE.DirectionalLight(look.sun, look.sunInt);
  sun.position.set(wx(look.sunPos[0]), look.sunPos[1], wx(look.sunPos[2]));
  harborAdd(sun);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(560 * MAP, 480 * MAP, 96, 80),
    new THREE.MeshLambertMaterial({ color: look.water }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  water.userData.harborDress = "ocean";
  water.userData.tileRepeat = [10, 8];
  harborAdd(water);

  for (const slab of LANDS) {
    box(scene, slab, 0, 0.4, look.sand, 1, look.landTerrain, 12);
  }
  box(scene, NORTH_PIER, 0.2, 0.5, 0x6b4423, 1, "wood-deck", 4);
  box(scene, SOUTH_PIER, 0.2, 0.5, 0x6b4423, 1, "wood-deck", 4);
  box(scene, MARKET, 0.4, 0.15, 0xd4c4a0, 1, "wood", 8);
  box(scene, ROPE, 0.4, 0.15, 0x8a7a62, 1, "wood", 8);
  box(scene, FORT, 0.4, 0.5, 0x5c6570, 1, "stone", 8);
  box(scene, N_WARE, 0.4, 0.2, 0xb08958, 1, "wood", 8);
  box(scene, S_WARE, 0.4, 0.2, 0xb08958, 1, "wood", 8);
  box(scene, TAVERN, 0.4, 0.2, 0x8b3a2a, 1, "wood", 8);
  box(scene, FOUNDRY, 0.4, 0.2, 0x6a5344, 1, "stone", 8);

  const roofs: Roof[] = [
    makeRoof(scene, TAVERN, 0x5c241c, { side: "e", start: wx(-6), end: wx(6) }),
    makeRoof(scene, N_WARE, 0x7a5a38, { side: "s", start: wx(0), end: wx(6) }),
    makeRoof(scene, S_WARE, 0x7a5a38, { side: "n", start: wx(0), end: wx(6) }),
    makeRoof(scene, FORT, 0x3e464e, { side: "w", start: wx(-8), end: wx(8) }),
    { rect: MARKET, meshes: [], shown: 1 },
    { rect: FOUNDRY, meshes: [], shown: 1 },
    { rect: DOCKS, meshes: [], shown: 1 },
  ];

  const extractGlows: ExtractGlow[] = [
    placeExtractGlow(scene, "gull", EXTRACT_GULL),
    placeExtractGlow(scene, "wren", EXTRACT_WREN),
    placeExtractGlow(scene, "bell", EXTRACT_BELL),
  ];

  const nPier = rectMid(NORTH_PIER);
  const sPier = rectMid(SOUTH_PIER);
  const names: [string, number, number, number, number, number][] = [
    [activeMap.gullPier, nPier.x, 0.78, nPier.z, 22 * MAP, pierYaw(NORTH_PIER)],
    [activeMap.wrenPier, sPier.x, 0.78, sPier.z, 22 * MAP, pierYaw(SOUTH_PIER)],
    ["The Grog", TAVERN.x + TAVERN.w / 2, 0.62, TAVERN.z - wx(4), 12 * MAP, 0],
    ["Market St", MARKET.x + MARKET.w / 2, 0.57, MARKET.z - wx(4), 14 * MAP, 0],
    [activeMap.fortLabel, FORT.x + FORT.w / 2, 0.95, FORT.z - wx(4), 14 * MAP, 0],
    ["The Foundry", FOUNDRY.x + FOUNDRY.w / 2, 0.62, FOUNDRY.z + FOUNDRY.d + wx(4), 16 * MAP, 0],
    ["The Docks", DOCKS.x + DOCKS.w / 2, 0.78, DOCKS.z + DOCKS.d / 2, 14 * MAP, 0],
  ];
  for (const [t, x, y, z, w, yaw] of names) {
    const s = labelDecal(t, w, yaw);
    s.position.set(x, y, z);
    harborAdd(s);
  }

  const ships: NavyShip[] = [
    makeNavyShip(scene, "The Gull", {
      from: { x: wx(stretchPoint(activeMap.navy.gull.from).x), z: wx(stretchPoint(activeMap.navy.gull.from).z) },
      to: { x: wx(stretchPoint(activeMap.navy.gull.to).x), z: wx(stretchPoint(activeMap.navy.gull.to).z) },
    }),
    makeNavyShip(scene, "The Wren", {
      from: { x: wx(stretchPoint(activeMap.navy.wren.from).x), z: wx(stretchPoint(activeMap.navy.wren.from).z) },
      to: { x: wx(stretchPoint(activeMap.navy.wren.to).x), z: wx(stretchPoint(activeMap.navy.wren.to).z) },
    }),
  ];

  return { extractGlows, roofs, ships };
}

function pierYaw(r: Rect): number {
  return r.w >= r.d ? 0 : Math.PI / 2;
}

export type NavyShip = {
  group: THREE.Group;
  from: { x: number; z: number };
  to: { x: number; z: number };
};

function makeNavyShip(
  _scene: THREE.Scene,
  name: string,
  path: { from: { x: number; z: number }; to: { x: number; z: number } },
): NavyShip {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.userData.greyShip = true;
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1.7, 5.4),
    new THREE.MeshLambertMaterial({ color: 0x3a2818 }),
  );
  hull.position.y = 0.55;
  body.add(hull);
  const bow = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.35, 3.6),
    new THREE.MeshLambertMaterial({ color: 0x2e2014 }),
  );
  bow.position.set(-11.2, 0.45, 0);
  body.add(bow);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(18.5, 0.22, 4.6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a28 }),
  );
  deck.position.y = 1.38;
  body.add(deck);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.4, 3.4),
    new THREE.MeshLambertMaterial({ color: 0x4a3420 }),
  );
  cabin.position.set(4.2, 2.05, 0);
  body.add(cabin);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 9.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x2a1c12 }),
  );
  mast.position.set(-1.5, 5.9, 0);
  body.add(mast);
  const sail = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 5.4, 6.2),
    new THREE.MeshLambertMaterial({ color: 0xe8dcc8 }),
  );
  sail.position.set(-1.35, 5.4, 0);
  body.add(sail);
  group.add(body);
  const tag = labelSprite(name);
  tag.position.set(0, 13, 0);
  tag.scale.set(12, 3, 1);
  group.add(tag);
  const dx = path.to.x - path.from.x;
  const dz = path.to.z - path.from.z;
  group.rotation.y = Math.atan2(dx, dz);
  group.position.set(path.from.x, 0, path.from.z);
  harborAdd(group);
  return { group, from: path.from, to: path.to };
}

function dressNavyShips(ships: NavyShip[]) {
  for (const s of ships) {
    if (!hasShip("navy-sloop")) continue;
    const voxel = makeShip("navy-sloop", 22 * MAP);
    if (!voxel) continue;
    const keep: THREE.Object3D[] = [];
    for (const child of [...s.group.children]) {
      if (child.userData.greyShip) s.group.remove(child);
      else keep.push(child);
    }
    voxel.rotation.y = 0;
    s.group.add(voxel);
    for (const child of keep) {
      if ((child as THREE.Sprite).isSprite) child.position.y = 16;
    }
  }
}

/** 0 at sea, 1 docked when extract opens (clock 2:00). */
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
      -0.2 + bob,
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
    mesh.userData.greyRoof = true;
    meshes.push(mesh);
  }
  const well = box(scene, divot, 3.38, 0.28, mulHex(color, 0.42));
  well.renderOrder = 2;
  well.userData.greyRoof = true;
  meshes.push(well);
  const sill = box(scene, lip, 3.52, 0.2, 0xcbb892);
  sill.renderOrder = 3;
  sill.userData.greyRoof = true;
  meshes.push(sill);
  return { rect: r, meshes, shown: 1 };
}

/** Buildings stay solid — roofs no longer fade for an interior. */
export function revealRoofs(roofs: Roof[], _x: number, _z: number, _dt: number) {
  for (const roof of roofs) {
    roof.shown = 1;
    for (const mesh of roof.meshes) {
      fadeMesh(mesh, 1, true);
    }
  }
}

function fadeMesh(mesh: THREE.Mesh, shown: number, visible: boolean) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    const mat = m as THREE.MeshLambertMaterial;
    if (mat.opacity === undefined) continue;
    mat.transparent = shown < 0.98;
    mat.opacity = Math.max(0, Math.min(1, shown));
    mat.depthWrite = shown > 0.55;
  }
  mesh.visible = visible;
}
