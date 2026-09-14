import { isIslandId, TROPHY, type IslandId, type TrophyId } from "./config";
import { SKINS, type SkinId } from "./skins";

const KEY = "portfight-progress-v1";

const PIRATES = new Set([
  "rustbeard",
  "captainhightide",
  "ladylara",
  "admiralironsides",
  "royalnavyadmiral",
]);

export type SavedPirate =
  | "rustbeard"
  | "captainhightide"
  | "ladylara"
  | "admiralironsides"
  | "royalnavyadmiral";

export type Progress = {
  stash: Partial<Record<TrophyId, number>>;
  owned: SkinId[];
  equipped: SkinId | null;
  pirate: SavedPirate;
  island: IslandId;
  unlocked: IslandId;
};

const EMPTY: Progress = {
  stash: {},
  owned: [],
  equipped: null,
  pirate: "rustbeard",
  island: 1,
  unlocked: 1,
};

function isTrophy(id: string): id is TrophyId {
  return id in TROPHY;
}

function isSkin(id: string): id is SkinId {
  return id in SKINS;
}

function isPirate(id: string): id is SavedPirate {
  return PIRATES.has(id);
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, stash: {} };
    const data = JSON.parse(raw) as {
      stash?: Record<string, unknown>;
      owned?: unknown;
      equipped?: unknown;
      pirate?: unknown;
      island?: unknown;
      unlocked?: unknown;
    };
    const stash: Progress["stash"] = {};
    if (data.stash && typeof data.stash === "object") {
      for (const [id, n] of Object.entries(data.stash)) {
        if (!isTrophy(id) || typeof n !== "number" || n < 1) continue;
        stash[id] = Math.min(99, Math.floor(n));
      }
    }
    const owned = Array.isArray(data.owned)
      ? [...new Set(data.owned.filter((id): id is SkinId => typeof id === "string" && isSkin(id)))]
      : [];
    const equipped =
      typeof data.equipped === "string" && isSkin(data.equipped) && owned.includes(data.equipped)
        ? data.equipped
        : null;
    const pirate = typeof data.pirate === "string" && isPirate(data.pirate) ? data.pirate : "rustbeard";
    const unlocked = isIslandId(data.unlocked) ? data.unlocked : 1;
    const island = isIslandId(data.island) && data.island <= unlocked ? data.island : unlocked;
    return { stash, owned, equipped, pirate, island, unlocked };
  } catch {
    return { ...EMPTY, stash: {} };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        v: 1,
        stash: p.stash,
        owned: p.owned,
        equipped: p.equipped,
        pirate: p.pirate,
        island: p.island,
        unlocked: p.unlocked,
      }),
    );
  } catch {
    /* private mode / quota */
  }
}
