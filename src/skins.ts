import { ISLANDS, TROPHY, type IslandId, type TrophyId } from "./config";

export type SkinId =
  | "barrel"
  | "catpajama"
  | "hotdog"
  | "scarecrow"
  | "knight"
  | "astronaut"
  | "skeleton"
  | "samurai"
  | "deepdiver"
  | "ice-queen"
  | "squidly"
  | "anubis"
  | "anubis-gold"
  | "skeleton-limited"
  | "ghost-limited"
  | "black-knight";

export type SkinRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type SkinDef = {
  id: SkinId;
  name: string;
  /** Island whose loot table first includes every named item in the recipe. */
  recipe: string;
  rarity: SkinRarity;
  pfp: string | null;
  color: number;
  need: TrophyId[] | null;
  /** CC0 / Pirate Nation flavor, if the dump shipped any. */
  blurb?: string;
};

function recipeFor(need: TrophyId[]): string {
  let island: IslandId = 1;
  for (const id of need) {
    const n = TROPHY[id].island;
    if (n > island) island = n;
  }
  return ISLANDS[island].name;
}

function items(...need: TrophyId[]): Pick<SkinDef, "recipe" | "need"> {
  return { recipe: recipeFor(need), need };
}

/**
 * Each skin burns specific named booty. Island N recipes always include
 * at least one item that first appears on island N. Extracting unlocks N+1.
 */
export const SKINS: Record<SkinId, SkinDef> = {
  barrel: {
    id: "barrel",
    name: "Barrel",
    rarity: "uncommon",
    pfp: "/art/pfps/barrel.png",
    color: 0xb87333,
    ...items("wooden-oar"),
  },
  catpajama: {
    id: "catpajama",
    name: "Cat Pajama",
    rarity: "uncommon",
    pfp: "/art/pfps/catpajama.png",
    color: 0xd4a0b8,
    ...items("cotton-net"),
  },
  hotdog: {
    id: "hotdog",
    name: "Hot Dog",
    rarity: "uncommon",
    pfp: "/art/pfps/hotdog.png",
    color: 0xc45c3e,
    ...items("cotton"),
  },
  scarecrow: {
    id: "scarecrow",
    name: "Scarecrow",
    rarity: "uncommon",
    pfp: "/art/pfps/scarecrow.png",
    color: 0xc4a35a,
    ...items("wood"),
  },
  knight: {
    id: "knight",
    name: "Sir Clankalot",
    rarity: "rare",
    pfp: "/art/pfps/knight.png",
    color: 0x3d6a9c,
    ...items("spyglass", "wood"),
  },
  astronaut: {
    id: "astronaut",
    name: "Stargazer",
    rarity: "rare",
    pfp: "/art/pfps/astronaut.png",
    color: 0xc8d0d8,
    ...items("hemp-rope", "cotton"),
  },
  skeleton: {
    id: "skeleton",
    name: "Skeleton",
    rarity: "rare",
    pfp: "/art/pfps/skeleton.png",
    color: 0xe8e0d0,
    ...items("iron-ore", "flax"),
  },
  samurai: {
    id: "samurai",
    name: "Samurai",
    rarity: "rare",
    pfp: "/art/pfps/samurai.png",
    color: 0x8b1e1e,
    ...items("spyglass", "wooden-oar"),
  },
  deepdiver: {
    id: "deepdiver",
    name: "Deep Diver",
    rarity: "rare",
    pfp: "/art/pfps/deepdiver.png",
    color: 0x1a4a6a,
    ...items("hemp-rope", "cotton-net"),
  },
  "ice-queen": {
    id: "ice-queen",
    name: "Ice Queen",
    rarity: "rare",
    pfp: "/art/pfps/ice-queen.png",
    color: 0xa8d4e8,
    ...items("iron-ore", "wooden-oar"),
  },
  squidly: {
    id: "squidly",
    name: "Squidly",
    rarity: "epic",
    pfp: "/art/pfps/squidly.png",
    color: 0x6a4a7c,
    ...items("compass", "hemp-rope"),
  },
  anubis: {
    id: "anubis",
    name: "Anubis",
    rarity: "legendary",
    pfp: "/art/pfps/anubis.png",
    color: 0xc9a227,
    ...items("iron-anchor", "spyglass"),
  },
  "anubis-gold": {
    id: "anubis-gold",
    name: "Anubis Gold",
    rarity: "legendary",
    pfp: "/art/pfps/anubis-gold.png",
    color: 0xe8c547,
    ...items("mermaid-scale", "wooden-helm"),
  },
  "skeleton-limited": {
    id: "skeleton-limited",
    name: "Skeleton Limited",
    rarity: "legendary",
    pfp: "/art/pfps/skeleton-limited.png",
    color: 0xb8862a,
    ...items("iron-sights", "compass"),
  },
  "ghost-limited": {
    id: "ghost-limited",
    name: "Ghost Limited",
    rarity: "legendary",
    pfp: "/art/pfps/ghost-limited.png",
    color: 0x9aa8c8,
    ...items("iron-cannon", "mermaid-scale"),
  },
  "black-knight": {
    id: "black-knight",
    name: "Black Knight Spirit",
    rarity: "legendary",
    pfp: "/art/pfps/black-knight.png",
    color: 0x2a2a32,
    ...items("iron-armor", "cotton-sail", "spyglass"),
  },
};

export const CRAFT_SKINS: SkinId[] = (
  Object.keys(SKINS) as SkinId[]
).filter((id) => SKINS[id].need);

export function needLabel(need: TrophyId[]): string {
  return need.map((id) => TROPHY[id].name).join(" + ");
}

export type Stash = Partial<Record<TrophyId, number>>;

function wantCounts(need: TrophyId[]): Stash {
  const want: Stash = {};
  for (const id of need) want[id] = (want[id] ?? 0) + 1;
  return want;
}

export function canAfford(stash: Stash, need: TrophyId[]): boolean {
  const want = wantCounts(need);
  for (const [id, n] of Object.entries(want)) {
    if ((stash[id as TrophyId] ?? 0) < (n ?? 0)) return false;
  }
  return true;
}

export function needStatus(
  stash: Stash,
  need: TrophyId[],
): { id: TrophyId; have: boolean }[] {
  const left: Stash = { ...stash };
  return need.map((id) => {
    const n = left[id] ?? 0;
    if (n > 0) {
      left[id] = n - 1;
      return { id, have: true };
    }
    return { id, have: false };
  });
}

export function consumeNeed(stash: Stash, need: TrophyId[]) {
  for (const id of need) {
    const have = stash[id] ?? 0;
    if (have <= 1) delete stash[id];
    else stash[id] = have - 1;
  }
}

export function markerColor(skin: SkinDef | null | undefined): number {
  if (!skin) return 0xd4a017;
  if (skin.rarity === "legendary") return 0xffe08a;
  if (skin.rarity === "epic") return 0xc9a227;
  if (skin.rarity === "rare") return 0xd4a017;
  if (skin.rarity === "uncommon") return 0x6a9c7a;
  return 0x7ec8e3;
}
