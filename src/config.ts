/** Match length in real seconds. Navy clock is 10:00 → 0:00 over this span. */
export const MATCH_SECONDS = 600;
export const EXTRACT_OPEN_AT = MATCH_SECONDS * 0.6;
export const BELL_OPEN_AT = MATCH_SECONDS * 0.8;

export const PLAYER_SPEED = 6.4;
export const PLAYER_HP = 300;
export const MELEE_RANGE = 4;
export const MELEE_DAMAGE = 40;
/** Dummies auto-swing and never miss. They hit softer and slower so a landed 1v1 is winnable. */
export const DUMMY_MELEE_DAMAGE = 18;
export const MELEE_COOLDOWN = 0.4;
export const DUMMY_MELEE_COOLDOWN = 0.85;
/** Half-angle of the cutlass pie. Visual and hit test share this. */
export const MELEE_CONE_HALF = (58 * Math.PI) / 180;
export const GUN_CONE_HALF = (16 * Math.PI) / 180;
/** Treat pirates as this wide so a near-miss still connects. */
export const HIT_RADIUS = 0.9;
export const FLINT_DAMAGE = 36;
export const FLINT_RANGE = 8;
export const FLINT_AMMO = 6;
export const MUSKET_DAMAGE = 52;
export const MUSKET_RANGE = 28;
export const MUSKET_AMMO = 4;
/** Bots hit softer with guns so a flintlock 1v1 is not an instant death. */
export const DUMMY_FLINT_DAMAGE = 22;
export const DUMMY_MUSKET_DAMAGE = 32;
/** Hunters loot first. They start chasing at this many seconds (clock will read 7:00). */
export const HUNT_AFTER = 180;
/** Bots only take shots at other bots inside this radius. They do not hunt each other. */
export const DUMMY_NEAR = 10;
export const EXTRACT_CHANNEL = 4;
/** Last minute: bots rotate to a pad and hold it. */
export const EXTRACT_CAMP_SECONDS = 60;
export const PICKUP_RANGE = 2.2;

export type WeaponId = "cutlass" | "flintlock" | "musket";
export type TrophyId = "junk" | "keep-seal";

export type Rect = { x: number; z: number; w: number; d: number };

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
