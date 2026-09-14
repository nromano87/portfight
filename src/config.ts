/** Put every craftable skin on the picker. Leave off so extract → craft is the loop. */
export const UNLOCK_ALL_SKINS = false;

/** Pirates, props, and items vs MagicaVoxel buildings. */
export const UNIT = 4;
/** Island, buildings, and ships. Pirates and props stay at UNIT. */
export const MAP = 1.2;
/** Player and bot mesh / body vs UNIT props. */
export const PIRATE_SCALE = 0.6;

/** Match length in real seconds. Navy clock is 5:00 → 0:00 over this span. */
export const MATCH_SECONDS = 300;
export const EXTRACT_OPEN_AT = MATCH_SECONDS * 0.6;
export const BELL_OPEN_AT = MATCH_SECONDS * 0.8;

export const PLAYER_SPEED = 6.4 * 2.2;
export const PLAYER_HP = 300;
export const MELEE_RANGE = 2 * UNIT;
export const MELEE_DAMAGE = 40;
/** Dummies auto-swing and never miss. They hit softer and slower so a landed 1v1 is winnable. */
export const DUMMY_MELEE_DAMAGE = 18;
export const MELEE_COOLDOWN = 0.4;
export const DUMMY_MELEE_COOLDOWN = 0.85;
/** Treat pirates as this wide so a near-miss still connects. */
export const HIT_RADIUS = 0.9 * UNIT * PIRATE_SCALE;
export const FLINT_DAMAGE = 36;
export const FLINT_RANGE = 6 * UNIT;
export const FLINT_AMMO = 6;
export const MUSKET_DAMAGE = 52;
export const MUSKET_RANGE = 10 * UNIT;
export const MUSKET_AMMO = 4;
/** Bots hit softer with guns so a flintlock 1v1 is not an instant death. */
export const DUMMY_FLINT_DAMAGE = 22;
export const DUMMY_MUSKET_DAMAGE = 32;
/** Hunters loot first. They start chasing at this many seconds (clock will read 3:30). */
export const HUNT_AFTER = MATCH_SECONDS * 0.3;
/** Bots only take shots at other bots inside this radius. They do not hunt each other. */
export const DUMMY_NEAR = 10 * UNIT;
export const EXTRACT_CHANNEL = 4;
/** Last minute: bots rotate to a pad and hold it. */
export const EXTRACT_CAMP_SECONDS = 60;
export const PICKUP_RANGE = 2.2 * UNIT;
/** Arcade jump. Peak scales with UNIT so crate stacks stay hoppable. */
export const JUMP_VEL = 8.8 * Math.sqrt(UNIT);
export const GRAVITY = 24;
export const STEP_UP = 0.52 * UNIT;

export type WeaponId = "cutlass" | "flintlock" | "musket";

/** Pirate Nation crafting reagents. Guns stay in the harbor; these extract. */
export type TrophyId =
  | "wood"
  | "cotton"
  | "iron-ore"
  | "flax"
  | "copper-ore"
  | "oak-wood"
  | "wooden-oar"
  | "cotton-net"
  | "iron-anchor"
  | "hemp-rope"
  | "spyglass"
  | "compass"
  | "mermaid-scale"
  | "cotton-sail"
  | "wooden-helm"
  | "iron-sights"
  | "iron-cannon"
  | "iron-armor";

export type TrophyTier = 1 | 2 | 3 | 4;
export type IslandId = 1 | 2 | 3 | 4 | 5;

export const ISLAND_IDS: IslandId[] = [1, 2, 3, 4, 5];

/** Name, sky, fog, and a unique map per island. */
export const ISLANDS: Record<IslandId, { name: string; sky: number; fog: number }> = {
  1: { name: "Gull Harbor", sky: 0x082040, fog: 0x0c3a72 },
  2: { name: "Wren Reach", sky: 0x0a3040, fog: 0x0c5a62 },
  3: { name: "Copper Cay", sky: 0x2a2018, fog: 0x6a4030 },
  4: { name: "Oak Atoll", sky: 0x081820, fog: 0x1a4a48 },
  5: { name: "Blackwater", sky: 0x080610, fog: 0x2a1838 },
};

export function isIslandId(n: unknown): n is IslandId {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

export function islandName(id: IslandId): string {
  return ISLANDS[id].name;
}

export function nextIsland(id: IslandId): IslandId {
  return id < 5 ? ((id + 1) as IslandId) : 5;
}

export const TROPHY: Record<TrophyId, { name: string; tier: TrophyTier; color: number; island: IslandId }> = {
  wood: { name: "Wood", tier: 1, color: 0x8b5a2b, island: 1 },
  cotton: { name: "Cotton", tier: 1, color: 0xe8dcc8, island: 1 },
  flax: { name: "Flax", tier: 1, color: 0xc4b46a, island: 1 },
  "wooden-oar": { name: "Wooden Oar", tier: 2, color: 0x9a6b3c, island: 1 },
  "cotton-net": { name: "Cotton Net", tier: 2, color: 0xd4c4a0, island: 1 },
  "iron-ore": { name: "Iron Ore", tier: 1, color: 0x6a6e74, island: 2 },
  "hemp-rope": { name: "Hemp Rope", tier: 2, color: 0xa89060, island: 2 },
  spyglass: { name: "Spyglass", tier: 3, color: 0xc9a227, island: 2 },
  "copper-ore": { name: "Copper Ore", tier: 1, color: 0xb87333, island: 3 },
  "iron-anchor": { name: "Iron Anchor", tier: 2, color: 0x5c6570, island: 3 },
  compass: { name: "Compass", tier: 3, color: 0xd4a017, island: 3 },
  "oak-wood": { name: "Oak Wood", tier: 1, color: 0x6b4423, island: 4 },
  "mermaid-scale": { name: "Mermaid Scale", tier: 3, color: 0x3dba9c, island: 4 },
  "cotton-sail": { name: "Cotton Sail", tier: 4, color: 0xf0e6d2, island: 4 },
  "wooden-helm": { name: "Wooden Helm", tier: 4, color: 0x7a4a28, island: 4 },
  "iron-sights": { name: "Iron Sights", tier: 4, color: 0x8899aa, island: 5 },
  "iron-cannon": { name: "Iron Cannon", tier: 4, color: 0x4a4a52, island: 5 },
  "iron-armor": { name: "Iron Armor", tier: 4, color: 0x8a9098, island: 5 },
};

export const T1_IDS: TrophyId[] = ["wood", "cotton", "iron-ore", "flax", "copper-ore", "oak-wood"];
export const T2_IDS: TrophyId[] = ["wooden-oar", "cotton-net", "iron-anchor", "hemp-rope"];
export const T3_IDS: TrophyId[] = ["spyglass", "compass", "mermaid-scale"];
export const SHIP_IDS: TrophyId[] = [
  "cotton-sail",
  "wooden-helm",
  "iron-sights",
  "iron-cannon",
  "iron-armor",
];

function pickTrophy(pool: TrophyId[]): TrophyId {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

type RollKind = "t1" | "t2" | "t3" | "ship";

function poolFor(kind: RollKind, island: IslandId): TrophyId[] {
  const ids = kind === "t1" ? T1_IDS : kind === "t2" ? T2_IDS : kind === "t3" ? T3_IDS : SHIP_IDS;
  return ids.filter((id) => TROPHY[id].island <= island);
}

/** This island and every earlier one. Higher-island keys stay locked until you get there. */
export function rollTrophy(kind: "t1" | "t2" | "t3" | "ship" | "chest", island: IslandId): TrophyId {
  if (kind === "chest") {
    const n = Math.random();
    if (n < 0.7) return rollTrophy("t1", island);
    if (n < 0.92) return rollTrophy("t2", island);
    return rollTrophy("t3", island);
  }
  const chain: RollKind[] =
    kind === "t1"
      ? ["t1", "t2", "t3", "ship"]
      : kind === "t2"
        ? ["t2", "t1", "t3", "ship"]
        : kind === "t3"
          ? ["t3", "t2", "t1", "ship"]
          : ["ship", "t3", "t2", "t1"];
  for (const k of chain) {
    const pool = poolFor(k, island);
    if (pool.length) return pickTrophy(pool);
  }
  return "wood";
}

export function trophyName(id: TrophyId | null): string {
  return id ? TROPHY[id].name : "—";
}

export function trophyRarity(id: TrophyId): "Common" | "Uncommon" | "Rare" | "Epic" {
  const t = TROPHY[id].tier;
  if (t === 1) return "Common";
  if (t === 2) return "Uncommon";
  if (t === 3) return "Rare";
  return "Epic";
}

/** CSS hex for HUD borders — common gray, uncommon green, rare blue, epic purple. */
export function trophyRarityColor(id: TrophyId): string {
  const t = TROPHY[id].tier;
  if (t === 1) return "#c4c0b8";
  if (t === 2) return "#5cba7a";
  if (t === 3) return "#4a8fd4";
  return "#c45ce8";
}

export function trophyColor(id: TrophyId): number {
  return TROPHY[id].color;
}

export function trophyArt(id: TrophyId): string {
  return `/art/trophies/${id}.png`;
}

export function weaponArt(id: WeaponId | null): string {
  if (id === "flintlock") return "/art/weapons/flintlock.png";
  if (id === "musket") return "/art/weapons/musket.png";
  return "/art/weapons/cutlass.png";
}

export function trophyTier(id: TrophyId): TrophyTier {
  return TROPHY[id].tier;
}

export function isT1Trophy(id: TrophyId): boolean {
  return TROPHY[id].tier === 1;
}

export type Rect = { x: number; z: number; w: number; d: number };

export function mapRect(r: Rect): Rect {
  return { x: r.x * MAP, z: r.z * MAP, w: r.w * MAP, d: r.d * MAP };
}

export function inRect(x: number, z: number, r: Rect, pad = 0): boolean {
  return (
    x >= r.x - pad &&
    x <= r.x + r.w + pad &&
    z >= r.z - pad &&
    z <= r.z + r.d + pad
  );
}

export function rectCenter(r: Rect): { x: number; z: number } {
  return { x: r.x + r.w / 2, z: r.z + r.d / 2 };
}

export function aabbHit(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  maxDist: number,
  r: Rect,
): number | null {
  const minX = r.x;
  const maxX = r.x + r.w;
  const minZ = r.z;
  const maxZ = r.z + r.d;
  const invDx = dx !== 0 ? 1 / dx : 1e9;
  const invDz = dz !== 0 ? 1 / dz : 1e9;
  let t1 = (minX - ox) * invDx;
  let t2 = (maxX - ox) * invDx;
  let t3 = (minZ - oz) * invDz;
  let t4 = (maxZ - oz) * invDz;
  const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
  if (tmax < 0 || tmin > tmax || tmin > maxDist) return null;
  const t = tmin >= 0 ? tmin : tmax;
  if (t < 0 || t > maxDist) return null;
  return t;
}
