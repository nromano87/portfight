import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { assets } from "./asset";
import type { WeaponId } from "./config";
import { PLAYER_SPEED, UNIT, MAP, PIRATE_SCALE, weaponArt } from "./config";
import type { LootKind } from "./harbor";
import type { SkinId } from "./skins";

export type PirateId =
  | "rustbeard"
  | "captainhightide"
  | "ladylara"
  | "admiralironsides"
  | "royalnavyadmiral";

export type BodyId = PirateId | SkinId;

export type ChestId = "gold" | "silver" | "copper";

export type PropId =
  | "barrel"
  | "crate"
  | "crate-yellow"
  | "palm"
  | "cannon"
  | "rock"
  | "coastal-rock"
  | "fence"
  | "sand"
  | "driftwood";

export type BuildingId =
  | "tiki-bar"
  | "marketplace"
  | "distillery"
  | "town-hall"
  | "shipwright"
  | "foundry"
  | "docks";

export type TerrainId = "sand" | "wood" | "stone" | "wood-deck";

export type ShipId = "sloop" | "skiff" | "navy-sloop" | "galleon" | "frigate" | "navy-frigate";

/** MagicaVoxel Root is +90° Y (bind forward +X). Game yaw 0 walks +Z; -90° maps +X → +Z. */
export const PIRATE_YAW = -Math.PI / 2;

const PIRATE_H = 2.18 * UNIT * PIRATE_SCALE;
const CHEST_H = 0.95 * UNIT;

const PIRATE_URL: Record<PirateId, string> = assets({
  rustbeard: "/art/pirates/rustbeard.gltf",
  captainhightide: "/art/pirates/captainhightide.gltf",
  ladylara: "/art/pirates/ladylara.gltf",
  admiralironsides: "/art/pirates/admiralironsides.gltf",
  royalnavyadmiral: "/art/pirates/royalnavyadmiral.gltf",
});

const SKIN_URL: Record<SkinId, string> = assets({
  barrel: "/art/skins/barrel.gltf",
  catpajama: "/art/skins/catpajama.gltf",
  hotdog: "/art/skins/hotdog.gltf",
  scarecrow: "/art/skins/scarecrow.gltf",
  knight: "/art/skins/knight.gltf",
  astronaut: "/art/skins/astronaut.gltf",
  skeleton: "/art/skins/skeleton.gltf",
  samurai: "/art/skins/samurai.gltf",
  deepdiver: "/art/skins/deepdiver.gltf",
  "ice-queen": "/art/skins/ice-queen.gltf",
  squidly: "/art/skins/squidly.gltf",
  anubis: "/art/skins/anubis.gltf",
  "anubis-gold": "/art/skins/anubis-gold.gltf",
  "skeleton-limited": "/art/skins/skeleton-limited.gltf",
  "ghost-limited": "/art/skins/ghost-limited.gltf",
  "black-knight": "/art/skins/black-knight.gltf",
});

const CHEST_URL: Record<ChestId, string> = assets({
  gold: "/art/chests/gold.gltf",
  silver: "/art/chests/silver.gltf",
  copper: "/art/chests/copper.gltf",
});

const PROP_URL: Record<PropId, string> = assets({
  barrel: "/art/props/barrel.gltf",
  crate: "/art/props/crate.gltf",
  "crate-yellow": "/art/props/crate-yellow.gltf",
  palm: "/art/props/palm.gltf",
  cannon: "/art/props/cannon.gltf",
  rock: "/art/props/rock.gltf",
  "coastal-rock": "/art/props/coastal-rock.gltf",
  fence: "/art/props/fence.gltf",
  sand: "/art/props/sand.gltf",
  driftwood: "/art/props/driftwood.gltf",
});

const BUILDING_URL: Record<BuildingId, string> = assets({
  "tiki-bar": "/art/buildings/tiki-bar.gltf",
  marketplace: "/art/buildings/marketplace.gltf",
  distillery: "/art/buildings/distillery.gltf",
  "town-hall": "/art/buildings/town-hall.gltf",
  shipwright: "/art/buildings/shipwright.gltf",
  foundry: "/art/buildings/foundry.gltf",
  docks: "/art/buildings/docks.gltf",
});

const TERRAIN_URL: Record<TerrainId, string> = assets({
  sand: "/art/terrain/sand.png",
  wood: "/art/terrain/wood.png",
  stone: "/art/terrain/stone.png",
  "wood-deck": "/art/terrain/wood-deck.png",
});

const SHIP_URL: Record<ShipId, string> = assets({
  sloop: "/art/ships/sloop.gltf",
  skiff: "/art/ships/skiff.gltf",
  "navy-sloop": "/art/ships/navy-sloop.gltf",
  galleon: "/art/ships/galleon.gltf",
  frigate: "/art/ships/frigate.gltf",
  "navy-frigate": "/art/ships/navy-frigate.gltf",
});

export const PIRATE_NAMES: Record<PirateId, string> = {
  rustbeard: "Rustbeard",
  captainhightide: "Captain Hightide",
  ladylara: "Lady Lara",
  admiralironsides: "Admiral Ironsides",
  royalnavyadmiral: "Royal Navy Admiral",
};

export const PLAYABLE_PIRATES: PirateId[] = [
  "rustbeard",
  "captainhightide",
  "ladylara",
  "royalnavyadmiral",
  "admiralironsides",
];

export const PIRATE_ART: Record<PirateId, string> = assets({
  rustbeard: "/art/pfps/rustbeard.png",
  captainhightide: "/art/pfps/captainhightide.png",
  ladylara: "/art/pfps/ladylara.png",
  admiralironsides: "/art/pfps/admiralironsides.png",
  royalnavyadmiral: "/art/pfps/royalnavyadmiral.png",
});

export function pirateArt(id: PirateId): string {
  return PIRATE_ART[id];
}

const DUMMY_PIRATES: PirateId[] = [
  "captainhightide",
  "ladylara",
  "admiralironsides",
  "royalnavyadmiral",
  "captainhightide",
  "ladylara",
  "admiralironsides",
  "royalnavyadmiral",
];

export type HeldKit = {
  root: THREE.Group;
  held: THREE.Group | null;
  heldBone: THREE.Object3D | null;
  slashT: number;
  slashDur: number;
};

export type PirateRig = HeldKit & {
  mixer: THREE.AnimationMixer;
  idle: THREE.AnimationAction;
  walk: THREE.AnimationAction;
  run: THREE.AnimationAction;
  jump: THREE.AnimationAction;
  swing: THREE.AnimationAction;
  current: string;
};

const DIE_DUR = 0.68;

function dieEase(t: number): number {
  const u = Math.min(1, Math.max(0, t / DIE_DUR));
  return u * u * (3 - 2 * u);
}

export type ChestRig = {
  root: THREE.Group;
  lid: THREE.Object3D | null;
};

let pirateGltf: Record<PirateId, GLTF> | null = null;
let skinGltf: Partial<Record<SkinId, GLTF>> | null = null;
let chestGltf: Record<ChestId, GLTF> | null = null;
let propGltf: Partial<Record<PropId, GLTF>> | null = null;
let buildingGltf: Partial<Record<BuildingId, GLTF>> | null = null;
let terrainTex: Partial<Record<TerrainId, THREE.Texture>> | null = null;
let shipGltf: Partial<Record<ShipId, GLTF>> | null = null;
let sparkleTex: THREE.CanvasTexture | null = null;
let oceanMat: THREE.ShaderMaterial | null = null;
const oceanSparkles: {
  sprite: THREE.Sprite;
  phase: number;
  rate: number;
  x: number;
  z: number;
  fade: number;
}[] = [];
type DriftKind = "idle" | "patrol" | "lane" | "skirmish";

type DriftShip = {
  mesh: THREE.Object3D;
  hull: THREE.Object3D;
  x: number;
  z: number;
  yaw: number;
  phase: number;
  homeX: number;
  homeZ: number;
  homeYaw: number;
  kind: DriftKind;
  patrolR: number;
  patrolW: number;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  cx: number;
  cz: number;
  orbitR: number;
  orbitW: number;
  orbitA: number;
  foe: DriftShip | null;
  lastVolley: number;
};

export type SeaShipSpec = {
  kind?: DriftKind;
  patrolR?: number;
  patrolW?: number;
  ax?: number;
  az?: number;
  bx?: number;
  bz?: number;
  cx?: number;
  cz?: number;
  orbitR?: number;
  orbitW?: number;
  orbitA?: number;
};

const driftShips: DriftShip[] = [];
const seaShots: {
  flash: THREE.Mesh;
  tracer: THREE.Mesh;
  hit: THREE.Mesh;
  born: number;
}[] = [];

let shotGeo: { flash: THREE.SphereGeometry; tracer: THREE.CylinderGeometry; hit: THREE.SphereGeometry } | null =
  null;

const weaponTex = new Map<string, THREE.Texture>();

export function weaponTexture(id: WeaponId | null): THREE.Texture {
  const url = weaponArt(id);
  const hit = weaponTex.get(url);
  if (hit) return hit;
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  weaponTex.set(url, tex);
  return tex;
}

export function artReady(): boolean {
  return !!pirateGltf && !!chestGltf;
}

export function hasBody(id: BodyId): boolean {
  if (id in PIRATE_URL) return !!pirateGltf?.[id as PirateId];
  return !!skinGltf?.[id as SkinId];
}

export function hasProp(id: PropId): boolean {
  return !!propGltf?.[id];
}

export function hasBuilding(id: BuildingId): boolean {
  return !!buildingGltf?.[id];
}

export function hasTerrain(id: TerrainId): boolean {
  return !!terrainTex?.[id];
}

export function hasShip(id: ShipId): boolean {
  return !!shipGltf?.[id];
}

async function loadShips(loader: GLTFLoader): Promise<void> {
  const shipIds = Object.keys(SHIP_URL) as ShipId[];
  const nextShips: Partial<Record<ShipId, GLTF>> = { ...(shipGltf ?? {}) };
  const missing = shipIds.filter((id) => !nextShips[id]);
  if (missing.length === 0) {
    shipGltf = nextShips;
    return;
  }
  const shipFiles = await Promise.allSettled(missing.map((id) => loader.loadAsync(SHIP_URL[id])));
  missing.forEach((id, i) => {
    const result = shipFiles[i];
    if (result.status !== "fulfilled") {
      console.warn("ship failed", id, result.reason);
      return;
    }
    voxelize(result.value.scene);
    doubleSide(result.value.scene);
    nextShips[id] = result.value;
  });
  shipGltf = nextShips;
}

export async function loadArt(): Promise<void> {
  if (pirateGltf) {
    await loadShips(new GLTFLoader());
    await loadSkins(new GLTFLoader());
    return;
  }
  const loader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();
  const load = (url: string) => loader.loadAsync(url);
  const pirateIds = Object.keys(PIRATE_URL) as PirateId[];
  const chestIds = Object.keys(CHEST_URL) as ChestId[];
  const propIds = Object.keys(PROP_URL) as PropId[];
  const buildingIds = Object.keys(BUILDING_URL) as BuildingId[];
  const terrainIds = Object.keys(TERRAIN_URL) as TerrainId[];
  const [pirateFiles, chestFiles, propFiles, buildingFiles, terrainFiles] = await Promise.all([
    Promise.all(pirateIds.map((id) => load(PIRATE_URL[id]))),
    Promise.all(chestIds.map((id) => load(CHEST_URL[id]))),
    Promise.allSettled(propIds.map((id) => load(PROP_URL[id]))),
    Promise.allSettled(buildingIds.map((id) => load(BUILDING_URL[id]))),
    Promise.allSettled(terrainIds.map((id) => texLoader.loadAsync(TERRAIN_URL[id]))),
    loadShips(loader),
    loadSkins(loader),
  ]);
  const nextPirates = {} as Record<PirateId, GLTF>;
  pirateIds.forEach((id, i) => {
    voxelize(pirateFiles[i].scene, true);
    nextPirates[id] = pirateFiles[i];
  });
  const nextChests = {} as Record<ChestId, GLTF>;
  chestIds.forEach((id, i) => {
    voxelize(chestFiles[i].scene);
    nextChests[id] = chestFiles[i];
  });
  const nextProps: Partial<Record<PropId, GLTF>> = {};
  propIds.forEach((id, i) => {
    const result = propFiles[i];
    if (result.status !== "fulfilled") {
      console.warn("prop failed", id, result.reason);
      return;
    }
    voxelize(result.value.scene);
    nextProps[id] = result.value;
  });
  const nextBuildings: Partial<Record<BuildingId, GLTF>> = {};
  buildingIds.forEach((id, i) => {
    const result = buildingFiles[i];
    if (result.status !== "fulfilled") {
      console.warn("building failed", id, result.reason);
      return;
    }
    voxelize(result.value.scene);
    nextBuildings[id] = result.value;
  });
  const nextTerrain: Partial<Record<TerrainId, THREE.Texture>> = {};
  terrainIds.forEach((id, i) => {
    const result = terrainFiles[i];
    if (result.status !== "fulfilled") {
      console.warn("terrain failed", id, result.reason);
      return;
    }
    voxelTex(result.value);
    nextTerrain[id] = result.value;
  });
  pirateGltf = nextPirates;
  chestGltf = nextChests;
  propGltf = nextProps;
  buildingGltf = nextBuildings;
  terrainTex = nextTerrain;
}

async function loadSkins(loader: GLTFLoader): Promise<void> {
  const skinIds = Object.keys(SKIN_URL) as SkinId[];
  const next: Partial<Record<SkinId, GLTF>> = { ...(skinGltf ?? {}) };
  const missing = skinIds.filter((id) => !next[id]);
  if (missing.length === 0) {
    skinGltf = next;
    return;
  }
  const files = await Promise.allSettled(missing.map((id) => loader.loadAsync(SKIN_URL[id])));
  missing.forEach((id, i) => {
    const result = files[i];
    if (result.status !== "fulfilled") {
      console.warn("skin failed", id, result.reason);
      return;
    }
    voxelize(result.value.scene, true);
    next[id] = result.value;
  });
  skinGltf = next;
}

export function dummyPirate(spawnIndex: number): PirateId {
  return DUMMY_PIRATES[spawnIndex] ?? "rustbeard";
}

/** Slice a clip to [t0, t1] so we can drop MagicaVoxel's hold-wiggle. */
function sliceClip(clip: THREE.AnimationClip, t0: number, t1: number): THREE.AnimationClip {
  const duration = Math.max(1e-3, t1 - t0);
  const tracks = clip.tracks.map((track) => {
    const interpolant = track.createInterpolant();
    const times: number[] = [0];
    const values: number[] = [];
    interpolant.evaluate(t0);
    values.push(...(interpolant.resultBuffer as Float32Array));
    for (let i = 0; i < track.times.length; i++) {
      const t = track.times[i];
      if (t <= t0 + 1e-4 || t >= t1 - 1e-4) continue;
      times.push(t - t0);
      interpolant.evaluate(t);
      values.push(...(interpolant.resultBuffer as Float32Array));
    }
    times.push(duration);
    interpolant.evaluate(t1);
    values.push(...(interpolant.resultBuffer as Float32Array));
    const Ctor = track.constructor as new (
      name: string,
      times: number[],
      values: number[],
    ) => THREE.KeyframeTrack;
    const sliced = new Ctor(track.name, times, values);
    sliced.setInterpolation(track.getInterpolation());
    return sliced;
  });
  return new THREE.AnimationClip(clip.name, duration, tracks);
}

function concatClips(name: string, a: THREE.AnimationClip, b: THREE.AnimationClip): THREE.AnimationClip {
  const merged = new Map<string, THREE.KeyframeTrack>();
  for (const track of a.tracks) merged.set(track.name, track.clone());
  for (const track of b.tracks) {
    const times = Array.from(track.times, (t) => t + a.duration);
    const prev = merged.get(track.name);
    const Ctor = track.constructor as new (
      name: string,
      times: number[],
      values: number[],
    ) => THREE.KeyframeTrack;
    const next = new Ctor(
      track.name,
      prev ? [...prev.times, ...times] : times,
      prev ? [...prev.values, ...track.values] : Array.from(track.values),
    );
    next.setInterpolation(track.getInterpolation());
    merged.set(track.name, next);
  }
  return new THREE.AnimationClip(name, a.duration + b.duration, [...merged.values()]);
}

/** MagicaVoxel action clips raise, wiggle at the apex, then chop. Keep raise + chop. */
function compactSlash(src: THREE.AnimationClip): THREE.AnimationClip {
  const raiseEnd = Math.min(0.52, src.duration * 0.28);
  const chopStart = Math.max(raiseEnd, src.duration - 0.36);
  return concatClips("slash", sliceClip(src, 0, raiseEnd), sliceClip(src, chopStart, src.duration));
}

export function makePirate(id: BodyId): PirateRig {
  const gltf = id in PIRATE_URL ? pirateGltf?.[id as PirateId] : skinGltf?.[id as SkinId];
  if (!gltf) throw new Error(`art not loaded: ${id}`);
  const model = cloneSkinned(gltf.scene) as THREE.Group;
  cloneMats(model);
  fitHeight(model, PIRATE_H);
  const root = new THREE.Group();
  root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const act = (name: string) => {
    const clip = THREE.AnimationClip.findByName(gltf.animations, name);
    if (!clip) throw new Error(`missing ${name} on ${id}`);
    return mixer.clipAction(clip.clone());
  };
  const idle = act("01_Idle_1");
  const walk = act("04_Walk");
  const run = act("05_Run");
  const jump = act("07_Jump_Stand");
  const high = THREE.AnimationClip.findByName(gltf.animations, "10_Action_One-Handed_High");
  if (!high) throw new Error(`missing 10_Action_One-Handed_High on ${id}`);
  const swing = mixer.clipAction(compactSlash(high));
  jump.setLoop(THREE.LoopOnce, 1);
  jump.clampWhenFinished = true;
  swing.setLoop(THREE.LoopOnce, 1);
  swing.clampWhenFinished = true;
  idle.play();
  mixer.update(0);
  model.updateWorldMatrix(true, true);
  const { held, heldBone } = bindHeld(model, root);
  const rig: PirateRig = {
    root,
    mixer,
    idle,
    walk,
    run,
    jump,
    swing,
    current: "idle",
    held,
    heldBone,
    slashT: 0,
    slashDur: 0.4,
  };
  mixer.addEventListener("finished", (e) => {
    if (e.action === rig.swing || e.action === rig.jump) rig.current = "";
  });
  poseHeld(rig, null, 0);
  return rig;
}

/**
 * MagicaVoxel names the fist `Hand.R`, but Three.js sanitizes `.` out of node
 * names (it's the animation-path separator), so the live bone is `HandR`.
 */
function findHand(model: THREE.Object3D): THREE.Object3D | null {
  for (const name of ["HandR", "Hand.R"]) {
    const node = model.getObjectByName(name) ?? THREE.PropertyBinding.findNode(model, name);
    if (node) return node;
  }
  return null;
}

function voxelPart(
  mat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  return mesh;
}

function makeCutlassMesh(): THREE.Group {
  const g = new THREE.Group();
  g.name = "cutlass";
  const steel = new THREE.MeshLambertMaterial({ color: 0xf2f5fa, emissive: 0x5a616c });
  const dark = new THREE.MeshLambertMaterial({ color: 0x8a909a, emissive: 0x2a2e34 });
  const wood = new THREE.MeshLambertMaterial({ color: 0xb06a3a, emissive: 0x3a2010 });
  const brass = new THREE.MeshLambertMaterial({ color: 0xffd45a, emissive: 0x5a3a08 });
  g.add(
    voxelPart(brass, 0.14, 0.1, 0.14, 0, -0.12, 0),
    voxelPart(wood, 0.13, 0.22, 0.13, 0, 0, 0),
    voxelPart(brass, 0.38, 0.1, 0.14, 0.03, 0.14, 0),
    voxelPart(steel, 0.2, 0.92, 0.12, 0.04, 0.64, 0),
    voxelPart(dark, 0.08, 0.88, 0.1, 0.13, 0.64, 0),
    voxelPart(steel, 0.15, 0.18, 0.12, 0.07, 1.14, 0),
  );
  return g;
}

function makeFlintlockMesh(): THREE.Group {
  const g = new THREE.Group();
  g.name = "flintlock";
  const wood = new THREE.MeshLambertMaterial({ color: 0xb06a3a, emissive: 0x3a2010 });
  const brass = new THREE.MeshLambertMaterial({ color: 0xffd45a, emissive: 0x5a3a08 });
  const steel = new THREE.MeshLambertMaterial({ color: 0xe8edf4, emissive: 0x4a5058 });
  g.add(
    voxelPart(wood, 0.13, 0.28, 0.13, -0.04, -0.12, 0),
    voxelPart(brass, 0.14, 0.06, 0.14, -0.04, -0.26, 0),
    voxelPart(brass, 0.12, 0.1, 0.1, 0.08, 0.02, 0.05),
    voxelPart(steel, 0.55, 0.11, 0.11, 0.38, 0.05, 0),
    voxelPart(steel, 0.12, 0.14, 0.14, 0.68, 0.05, 0),
  );
  g.userData.muzzle = new THREE.Vector3(0.76, 0.05, 0);
  return g;
}

function makeMusketMesh(): THREE.Group {
  const g = new THREE.Group();
  g.name = "musket";
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a4a22, emissive: 0x2a1408 });
  const brass = new THREE.MeshLambertMaterial({ color: 0xffd45a, emissive: 0x5a3a08 });
  const steel = new THREE.MeshLambertMaterial({ color: 0xe8edf4, emissive: 0x4a5058 });
  g.add(
    voxelPart(wood, 0.14, 0.32, 0.13, -0.04, -0.14, 0),
    voxelPart(brass, 0.14, 0.06, 0.14, -0.04, -0.3, 0),
    voxelPart(wood, 0.4, 0.11, 0.11, 0.24, 0.03, 0),
    voxelPart(steel, 0.85, 0.09, 0.09, 0.78, 0.05, 0),
    voxelPart(brass, 0.12, 0.12, 0.12, 1.22, 0.05, 0),
  );
  g.userData.muzzle = new THREE.Vector3(1.3, 0.05, 0);
  return g;
}

function makeBoom(): THREE.Group {
  const g = new THREE.Group();
  g.name = "boom";
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 7, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 1, depthWrite: false }),
  );
  const blast = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 7, 6),
    new THREE.MeshBasicMaterial({ color: 0xff6a18, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  const puff = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0x8a7a6a, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  g.add(core, blast, puff);
  for (let i = 0; i < 7; i++) {
    const spark = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.035, 0.035),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 1, depthWrite: false }),
    );
    spark.frustumCulled = false;
    spark.userData.kind = "spark";
    g.add(spark);
  }
  g.visible = false;
  g.frustumCulled = false;
  return g;
}

function makeHeld(): THREE.Group {
  const held = new THREE.Group();
  held.name = "held-weapon";
  held.add(makeCutlassMesh(), makeFlintlockMesh(), makeMusketMesh(), makeBoom());
  held.visible = false;
  held.frustumCulled = false;
  held.traverse((child) => {
    child.frustumCulled = false;
  });
  return held;
}

const _worldScl = new THREE.Vector3();
const _localUp = new THREE.Vector3();
const _invWorld = new THREE.Matrix4();
const _identQ = new THREE.Quaternion();
const _bladeAxis = new THREE.Vector3(0, 1, 0);
const _barrelAxis = new THREE.Vector3(1, 0, 0);
const _aimX = new THREE.Vector3();
const _aimY = new THREE.Vector3();
const _aimZ = new THREE.Vector3();
const _aimMat = new THREE.Matrix4();
/** HandR +Y is wrist→fingers. Nudge the grip from the wrist into the fist. */
const FIST = new THREE.Vector3(0, 0.04, 0);

function bindHeld(
  model: THREE.Object3D,
  root: THREE.Group,
): { held: THREE.Group | null; heldBone: THREE.Object3D | null } {
  const heldBone = findHand(model);
  if (heldBone) heldBone.matrixAutoUpdate = true;
  const held = makeHeld();
  (heldBone ?? root).add(held);
  if (heldBone) {
    heldBone.updateWorldMatrix(true, false);
    heldBone.getWorldScale(_worldScl);
    const s = Number.isFinite(_worldScl.x) && _worldScl.x > 1e-4 ? _worldScl.x : 1;
    held.userData.invScale = (UNIT * PIRATE_SCALE) / s;
    // Idle fingers point down; map the blade onto world-up so it stands beside the hip.
    heldBone.updateWorldMatrix(true, false);
    _invWorld.copy(heldBone.matrixWorld).invert();
    _localUp.set(0, 1, 0).transformDirection(_invWorld).normalize();
    held.userData.restQuat = new THREE.Quaternion().setFromUnitVectors(_bladeAxis, _localUp);
    held.userData.grip = 0;
  }
  return { held, heldBone };
}

function weaponNameOf(primary: WeaponId | null): "cutlass" | "flintlock" | "musket" {
  if (primary === "flintlock" || primary === "musket") return primary;
  return "cutlass";
}

/** Barrel is held +X. Keep it on the horizon, facing the way the pirate looks. */
function aimHeldGun(held: THREE.Group, bone: THREE.Object3D, root: THREE.Object3D) {
  _aimX.set(1, 0, 0).transformDirection(root.matrixWorld);
  _aimX.y = 0;
  if (_aimX.lengthSq() < 1e-6) _aimX.set(0, 0, 1);
  else _aimX.normalize();
  _invWorld.copy(bone.matrixWorld).invert();
  _aimX.transformDirection(_invWorld).normalize();
  _localUp.set(0, 1, 0).transformDirection(_invWorld).normalize();
  _aimZ.crossVectors(_aimX, _localUp);
  if (_aimZ.lengthSq() < 1e-6) {
    held.quaternion.setFromUnitVectors(_barrelAxis, _aimX);
    return;
  }
  _aimZ.normalize();
  _aimY.crossVectors(_aimZ, _aimX).normalize();
  _aimMat.makeBasis(_aimX, _aimY, _aimZ);
  held.quaternion.setFromRotationMatrix(_aimMat);
}

/**
 * The cutlass is a child of HandR. Walk and the slash clip already move that
 * bone — extra local chop here fights the animation and jitters the blade.
 */
export function poseHeld(rig: HeldKit, primary: WeaponId | null, dt = 0) {
  const held = rig.held;
  if (!held) return;
  const bone = rig.heldBone;
  if (bone && held.parent !== bone) bone.add(held);

  const gun = primary === "flintlock" || primary === "musket";
  let chop = 0;
  let rise = 0;
  if (!gun && !bone && rig.slashT > 0) {
    rig.slashT += dt;
    const u = Math.min(1, rig.slashT / Math.max(rig.slashDur, 1e-4));
    chop = u * u * (3 - 2 * u);
    rise = Math.sin(chop * Math.PI);
    if (u >= 1) rig.slashT = 0;
  }

  if (bone) {
    const inv = (held.userData.invScale as number | undefined) ?? 1;
    held.scale.setScalar(inv);
    held.position.copy(FIST);
    if (gun) {
      aimHeldGun(held, bone, rig.root);
    } else {
      const rest = held.userData.restQuat as THREE.Quaternion | undefined;
      const pirate = rig as PirateRig;
      const swinging = pirate.current === "swing" || pirate.swing?.isRunning() === true;
      const grip = (held.userData.grip as number | undefined) ?? 0;
      const next = grip + ((swinging ? 1 : 0) - grip) * Math.min(1, dt * 14);
      held.userData.grip = next;
      if (rest) held.quaternion.slerpQuaternions(rest, _identQ, next);
      else held.rotation.set(0, 0, 0);
    }
  } else {
    held.scale.setScalar(PIRATE_SCALE);
    held.position.set(0.35 * UNIT * PIRATE_SCALE, 1.05 * UNIT * PIRATE_SCALE, 0.28 * UNIT * PIRATE_SCALE);
    held.rotation.set(0.4 + rise * 0.4, 0.2, 0.15 + chop * 0.35);
  }

  const recoil = Math.max(0, (held.userData.recoil as number | undefined) ?? 0);
  if (recoil > 0) {
    if (gun) held.rotateZ(recoil * 0.45);
    else held.rotateX(-recoil * 0.4);
    held.userData.recoil = Math.max(0, recoil - dt * 6);
  }
  tickBoom(held, dt);
}

export function showHeld(rig: HeldKit, primary: WeaponId | null, alive: boolean) {
  if (!rig.held) return;
  rig.held.visible = alive;
  const want = weaponNameOf(primary);
  for (const child of rig.held.children) {
    if (child.name === "boom") continue;
    child.visible = child.name === want;
  }
  const boom = rig.held.getObjectByName("boom");
  const gun = rig.held.getObjectByName(want);
  if (boom && gun) {
    const muzzle = gun.userData.muzzle as THREE.Vector3 | undefined;
    if (muzzle) boom.position.copy(muzzle);
    else boom.position.set(0, (gun.userData.muzzleY as number) || 0, 0);
  }
}

export function weaponBoom(rig: HeldKit) {
  const boom = rig.held?.getObjectByName("boom");
  if (!boom || !rig.held) return;
  boom.visible = true;
  boom.userData.age = 0;
  boom.scale.setScalar(0.5);
  rig.held.userData.recoil = 1;
  let i = 0;
  boom.traverse((child) => {
    if (child.userData.kind !== "spark") return;
    const a = (i / 7) * Math.PI * 2;
    child.userData.dir = new THREE.Vector3(Math.cos(a) * 0.6, 0.7 + (i % 3) * 0.15, Math.sin(a) * 0.6).normalize();
    child.position.set(0, 0, 0);
    i += 1;
  });
}

function tickBoom(held: THREE.Group, dt: number) {
  const boom = held.getObjectByName("boom");
  if (!boom || !boom.visible) return;
  const age = ((boom.userData.age as number) || 0) + dt;
  boom.userData.age = age;
  const life = 0.18;
  if (age >= life) {
    boom.visible = false;
    return;
  }
  const u = age / life;
  boom.scale.setScalar(0.5 + u * 2.4);
  boom.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (mat.opacity !== undefined) mat.opacity = 1 - u * u;
    if (mesh.userData.dir instanceof THREE.Vector3) {
      mesh.position.copy(mesh.userData.dir).multiplyScalar(u * 0.55);
    }
  });
}

export function playPirate(rig: PirateRig, speed: number, grounded: boolean) {
  if (rig.current === "die") return;
  let next = "idle";
  if (!grounded) next = "jump";
  else if (speed > PLAYER_SPEED * 0.5) next = "run";
  else if (speed > PLAYER_SPEED * 0.055) next = "walk";
  if (rig.current === "swing") {
    const dur = rig.swing.getClip().duration;
    if (rig.swing.isRunning() || rig.swing.time + 1e-3 < dur) return;
    rig.current = "";
  }
  if (rig.current === next) return;
  const map: Record<string, THREE.AnimationAction> = {
    idle: rig.idle,
    walk: rig.walk,
    run: rig.run,
    jump: rig.jump,
  };
  const incoming = map[next];
  const outgoing = map[rig.current] ?? (rig.current === "swing" ? rig.swing : null);
  incoming.reset().setEffectiveWeight(1).fadeIn(0.12).play();
  outgoing?.fadeOut(0.12);
  rig.current = next;
}

export function slashHeld(kit: HeldKit, seconds = 0.4) {
  kit.slashDur = Math.max(0.32, seconds);
  kit.slashT = 0.0001;
}

export function pirateSwing(rig: PirateRig, seconds = 0.4) {
  const dur = Math.max(0.08, rig.swing.getClip().duration);
  rig.idle.stop();
  rig.walk.stop();
  rig.run.stop();
  rig.jump.stop();
  rig.swing.reset();
  rig.swing.setEffectiveWeight(1);
  // Compact slash is ~0.9s; cap speed so the chop doesn't turn into a shake.
  rig.swing.setEffectiveTimeScale(Math.min(2.2, dur / Math.max(0.32, seconds)));
  rig.swing.play();
  rig.current = "swing";
  if (!rig.heldBone) slashHeld(rig, seconds);
}

function rigActions(rig: PirateRig): THREE.AnimationAction[] {
  return [rig.idle, rig.walk, rig.run, rig.jump, rig.swing];
}

/** Freeze the last pose and mark the mixer so locomotion cannot restart. */
export function pirateDie(rig: PirateRig) {
  for (const a of rigActions(rig)) a.setEffectiveTimeScale(0);
  rig.current = "die";
}

/** Crumple onto the back with a little side twist. Call every frame while dead. */
export function tickPirateDie(rig: PirateRig, dieT: number, fallSide: number) {
  const body = rig.root.children[0];
  if (!body) return;
  const e = dieEase(dieT);
  body.rotation.x = -e * 1.42;
  body.rotation.z = fallSide * e * 0.48;
}

export function pirateDeathLift(dieT: number): number {
  return Math.sin(dieEase(dieT) * (Math.PI / 2)) * PIRATE_H * 0.2;
}

export function resetPirateLive(rig: PirateRig) {
  for (const a of rigActions(rig)) a.setEffectiveTimeScale(1);
  const body = rig.root.children[0];
  if (body) body.rotation.set(0, 0, 0);
  rig.idle.reset().setEffectiveWeight(1).play();
  rig.walk.stop();
  rig.run.stop();
  rig.jump.stop();
  rig.swing.stop();
  rig.current = "idle";
}

export function flashPirate(root: THREE.Object3D, on: boolean) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mat = m as THREE.MeshLambertMaterial;
      if (!mat.emissive) continue;
      if (on) {
        mat.emissive.setHex(0xaa3333);
        mat.emissiveIntensity = 0.85;
      } else {
        const hex = mat.userData.baseEmissiveHex as number | undefined;
        mat.emissive.setHex(hex ?? 0x000000);
        mat.emissiveIntensity = (mat.userData.baseEmissiveIntensity as number | undefined) ?? 0;
      }
    }
  });
}

export function makeChest(id: ChestId): ChestRig {
  if (!chestGltf) throw new Error("art not loaded");
  const model = chestGltf[id].scene.clone(true);
  cloneMats(model);
  fitHeight(model, CHEST_H, ["Bottom-Local", "Top-Local"]);
  const root = new THREE.Group();
  root.add(model);
  let lid: THREE.Object3D | null = null;
  model.traverse((child) => {
    if (child.name === "Top-Global") lid = child;
  });
  return { root, lid };
}

export function setChestOpen(chest: ChestRig, open: boolean) {
  if (chest.lid) chest.lid.rotation.x = open ? -1.05 : 0;
}

export function chestForLoot(kind: LootKind): ChestId | null {
  if (kind === "chest") return "gold";
  if (kind === "lockbox") return "silver";
  if (kind === "trophy-chest") return "copper";
  return null;
}

export function makeProp(id: PropId, height: number): THREE.Group {
  const gltf = propGltf?.[id];
  if (!gltf) throw new Error(`prop not loaded: ${id}`);
  const model = gltf.scene.clone(true);
  cloneMats(model);
  fitHeight(model, height);
  const root = new THREE.Group();
  root.add(model);
  root.userData.voxelProp = true;
  return root;
}

export function makeBuilding(id: BuildingId): THREE.Group {
  const gltf = buildingGltf?.[id];
  if (!gltf) throw new Error(`building not loaded: ${id}`);
  const model = cloneSkinned(gltf.scene);
  cloneMats(model);
  doubleSide(model);
  poseSkeletons(model);
  const root = new THREE.Group();
  root.add(model);
  root.userData.voxelBuilding = true;
  return root;
}

/**
 * Fill a harbor plot in XZ. Y follows the tighter ground scale so voxels stay
 * upright — a separate height cap is what flattened the fort keep.
 * `uniform` keeps XZ square too (docks over a long pier plot).
 */
export function fitBuilding(
  root: THREE.Group,
  w: number,
  d: number,
  _maxH: number,
  uniform = false,
) {
  const obj = root.children[0];
  if (!obj) return;
  obj.rotation.set(0, 0, 0);
  obj.scale.set(1, 1, 1);
  obj.position.set(0, 0, 0);
  poseSkeletons(obj);
  const box = worldBox(obj);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  if (size.x < 1e-4 || size.y < 1e-4 || size.z < 1e-4) return;
  const rot90 = size.x >= size.z !== w >= d;
  const sx = (rot90 ? d : w) / size.x;
  const sz = (rot90 ? w : d) / size.z;
  const s = Math.min(sx, sz);
  obj.scale.set(uniform ? s : sx, s, uniform ? s : sz);
  obj.rotation.y = rot90 ? Math.PI / 2 : 0;
  const fitted = worldBox(obj);
  const mid = fitted.getCenter(new THREE.Vector3());
  obj.position.x -= mid.x;
  obj.position.z -= mid.z;
  obj.position.y -= fitted.min.y;
}

export function makeShip(id: ShipId, length: number, sink?: number): THREE.Group | null {
  const gltf = shipGltf?.[id];
  if (!gltf) return null;
  const model = cloneSkinned(gltf.scene);
  cloneMats(model);
  doubleSide(model);
  poseSkeletons(model);
  fitShipLength(model, length, sink);
  const hull = new THREE.Group();
  hull.add(model);
  const root = new THREE.Group();
  root.add(hull);
  root.userData.voxelShip = true;
  return root;
}

/** Scale longest XZ span to `length`. Keel a little under the waterline — not the mast. */
function fitShipLength(obj: THREE.Object3D, length: number, sink?: number) {
  obj.position.set(0, 0, 0);
  poseSkeletons(obj);
  const box = worldBox(obj);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z);
  if (span < 1e-4) return;
  obj.scale.multiplyScalar(length / span);
  poseSkeletons(obj);
  const fitted = worldBox(obj);
  const mid = fitted.getCenter(new THREE.Vector3());
  obj.position.x -= mid.x;
  obj.position.z -= mid.z;
  // AABB includes masts; a % of height drowned the deck. Draft from the keel only.
  const draft = sink ?? 0.9;
  obj.position.y -= fitted.min.y + draft;
}

export function buildingMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) meshes.push(mesh);
  });
  return meshes;
}

export function terrainMaterial(
  id: TerrainId,
  repeatU: number,
  repeatV: number,
  color = 0xffffff,
): THREE.MeshLambertMaterial | null {
  const src = terrainTex?.[id];
  if (!src) return null;
  const map = src.clone();
  map.needsUpdate = true;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatU, repeatV);
  return new THREE.MeshLambertMaterial({ map, color });
}

export type OceanPalette = {
  deep: [number, number, number];
  mid: [number, number, number];
  lite: [number, number, number];
};

const DEFAULT_OCEAN: OceanPalette = {
  deep: [0.02, 0.1, 0.32],
  mid: [0.08, 0.38, 0.78],
  lite: [0.48, 0.84, 1],
};

export function oceanMaterial(
  _repeatU: number,
  _repeatV: number,
  palette: OceanPalette = DEFAULT_OCEAN,
): THREE.ShaderMaterial {
  oceanMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Vector3(...palette.deep) },
        uMid: { value: new THREE.Vector3(...palette.mid) },
        uLite: { value: new THREE.Vector3(...palette.lite) },
      },
    ]),
    vertexShader: `
      uniform float uTime;
      varying float vCrest;
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec3 p = position;
        float t = uTime;
        float slosh = sin(t * 0.45);
        float h =
          sin(p.x * 0.16 + slosh * 0.9) * cos(t * 1.15) * 0.32 +
          sin(p.y * 0.13 - slosh * 0.7) * cos(t * 0.92 + 1.1) * 0.20 +
          sin((p.x + p.y) * 0.28 + slosh * 0.4) * sin(t * 1.25 + 0.3) * 0.11;
        p.z += h;
        vCrest = h;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uMid;
      uniform vec3 uLite;
      varying float vCrest;
      varying vec2 vUv;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        float crest = smoothstep(-0.38, 0.44, vCrest);
        vec3 deep = uDeep;
        vec3 mid = uMid;
        vec3 lite = uLite;
        vec3 col = mix(deep, mid, crest);
        col = mix(col, lite, smoothstep(0.52, 1.0, crest));
        float flow = sin(vUv.x * 36.0 + sin(uTime * 0.48) * 2.2 + vUv.y * 14.0) * 0.5 + 0.5;
        col = mix(col, lite, flow * 0.16 * crest);
        float foam = smoothstep(0.16, 0.40, vCrest);
        col = mix(col, vec3(0.94, 0.98, 1.0), foam * 0.72);
        vec2 sway = vec2(sin(uTime * 0.42), sin(uTime * 0.31 + 1.3));
        float n1 = fract(sin(dot(floor(vUv * vec2(960.0, 720.0) - sway * 16.0), vec2(127.1, 311.7))) * 43758.5453);
        float n2 = fract(sin(dot(floor(vUv * vec2(360.0, 600.0) - sway * vec2(-11.0, 8.0)), vec2(269.5, 183.3))) * 43758.5453);
        float speckle = step(mix(0.988, 0.95, crest), n1) * mix(0.18, 1.0, fract(n1 * 7.13));
        float dash = step(mix(0.992, 0.97, crest), n2) * mix(0.15, 0.85, fract(n2 * 5.91));
        col = mix(col, vec3(1.0), speckle);
        col = mix(col, vec3(0.96, 0.99, 1.0), dash);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
    fog: true,
  });
  return oceanMat;
}

function oceanWaveY(x: number, z: number, t: number): number {
  const y = -z;
  const slosh = Math.sin(t * 0.45);
  return (
    Math.sin(x * 0.16 + slosh * 0.9) * Math.cos(t * 1.15) * 0.32 +
    Math.sin(y * 0.13 - slosh * 0.7) * Math.cos(t * 0.92 + 1.1) * 0.20 +
    Math.sin((x + y) * 0.28 + slosh * 0.4) * Math.sin(t * 1.25 + 0.3) * 0.11
  );
}

export function tickOcean(elapsed: number) {
  const t = elapsed * 0.4;
  if (oceanMat) oceanMat.uniforms.uTime.value = t;
  const waterY = -0.2;
  for (const s of oceanSparkles) {
    const twinkle = Math.sin(t * s.rate * 0.7 + s.phase);
    const on = Math.max(0, twinkle);
    (s.sprite.material as THREE.SpriteMaterial).opacity = on * on * s.fade;
    const sway = Math.sin(t * 0.32 + s.phase);
    const x = s.x + sway * 2.6;
    const z = s.z + sway * 0.7;
    s.sprite.position.set(x, waterY + oceanWaveY(x, z, t) + 0.08, z);
  }
  for (const s of driftShips) {
    steerSeaShip(s, t);
    const y = waterY + oceanWaveY(s.x, s.z, t) * 0.42;
    s.mesh.position.set(s.x, y, s.z);
    s.mesh.rotation.y = s.yaw;
    s.hull.rotation.z = Math.sin(t * 0.85 + s.phase) * 0.045;
    s.hull.rotation.x = Math.sin(t * 0.62 + s.phase + 0.9) * 0.03;
  }
  tickSeaShots(elapsed);
}

function steerSeaShip(s: DriftShip, t: number) {
  if (s.kind === "lane") {
    const dx = s.bx - s.ax;
    const dz = s.bz - s.az;
    const a = t * s.patrolW + s.phase;
    const u = (Math.sin(a) + 1) / 2;
    s.x = s.ax + dx * u;
    s.z = s.az + dz * u;
    const heading = Math.atan2(dx, dz);
    s.yaw = Math.cos(a) * Math.sign(s.patrolW || 1) < 0 ? heading + Math.PI : heading;
    return;
  }
  if (s.kind === "patrol") {
    const a = t * s.patrolW + s.phase;
    s.x = s.homeX + Math.cos(a) * s.patrolR;
    s.z = s.homeZ + Math.sin(a) * s.patrolR;
    s.yaw = a + Math.PI / 2 * Math.sign(s.patrolW || 1);
    return;
  }
  if (s.kind === "skirmish") {
    const a = t * s.orbitW + s.orbitA;
    s.x = s.cx + Math.cos(a) * s.orbitR;
    s.z = s.cz + Math.sin(a) * s.orbitR;
    s.yaw = a + Math.PI / 2 * Math.sign(s.orbitW || 1);
    return;
  }
  if (s.kind === "idle") {
    const a = t * 0.16 + s.phase;
    s.x = s.homeX + Math.cos(a) * 6;
    s.z = s.homeZ + Math.sin(a) * 6;
    s.yaw = a + Math.PI / 2;
    return;
  }
}

function tickSeaShots(elapsed: number) {
  for (const s of driftShips) {
    if (s.kind !== "skirmish" || !s.foe) continue;
    const volley = Math.floor(elapsed * 1.2 + s.phase * 4);
    if (volley === s.lastVolley) continue;
    s.lastVolley = volley;
    if ((volley + Math.floor(s.phase * 8)) % 2 !== 0) continue;
    spawnSeaShot(s, s.foe, elapsed);
  }
  for (let i = seaShots.length - 1; i >= 0; i--) {
    const shot = seaShots[i];
    const u = (elapsed - shot.born) / 0.28;
    if (u >= 1) {
      shot.flash.parent?.remove(shot.flash);
      shot.tracer.parent?.remove(shot.tracer);
      shot.hit.parent?.remove(shot.hit);
      (shot.flash.material as THREE.Material).dispose();
      (shot.tracer.material as THREE.Material).dispose();
      (shot.hit.material as THREE.Material).dispose();
      seaShots.splice(i, 1);
      continue;
    }
    const flashMat = shot.flash.material as THREE.MeshBasicMaterial;
    const tracerMat = shot.tracer.material as THREE.MeshBasicMaterial;
    const hitMat = shot.hit.material as THREE.MeshBasicMaterial;
    flashMat.opacity = Math.max(0, 1 - u * 2.4);
    tracerMat.opacity = Math.max(0, 0.9 - u * 1.8);
    shot.flash.scale.setScalar(1 + u * 1.8);
    hitMat.opacity = u < 0.35 ? 0 : Math.max(0, 1.15 - u);
    shot.hit.scale.setScalar(0.4 + u * 2.2);
  }
}

function shotGeos() {
  if (!shotGeo) {
    shotGeo = {
      flash: new THREE.SphereGeometry(0.62, 6, 6),
      tracer: new THREE.CylinderGeometry(0.07, 0.03, 1, 5),
      hit: new THREE.SphereGeometry(0.5, 6, 6),
    };
  }
  return shotGeo;
}

function spawnSeaShot(from: DriftShip, to: DriftShip, elapsed: number) {
  const scene = from.mesh.parent;
  if (!scene) return;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dz) || 1;
  const ux = dx / dist;
  const uz = dz / dist;
  const y0 = 2.35;
  const mx = from.x + ux * 3.4;
  const mz = from.z + uz * 3.4;
  const hx = to.x - ux * 2.2;
  const hz = to.z - uz * 2.2;
  const hy = 1.7;
  const geos = shotGeos();
  const flash = new THREE.Mesh(
    geos.flash,
    new THREE.MeshBasicMaterial({ color: 0xffe39a, transparent: true, depthWrite: false }),
  );
  flash.position.set(mx, y0, mz);
  const tracer = new THREE.Mesh(
    geos.tracer,
    new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true, opacity: 0.88, depthWrite: false }),
  );
  const tx = hx - mx;
  const ty = hy - y0;
  const tz = hz - mz;
  const len = Math.hypot(tx, ty, tz) || 1;
  tracer.scale.set(1, len, 1);
  tracer.position.set((mx + hx) / 2, (y0 + hy) / 2, (mz + hz) / 2);
  tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(tx / len, ty / len, tz / len));
  const hit = new THREE.Mesh(
    geos.hit,
    new THREE.MeshBasicMaterial({ color: 0xf4d2a0, transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.set(hx, hy, hz);
  scene.add(flash, tracer, hit);
  seaShots.push({ flash, tracer, hit, born: elapsed });
}

export function registerDriftShip(
  mesh: THREE.Object3D,
  x: number,
  z: number,
  yaw: number,
  spec: SeaShipSpec = {},
) {
  driftShips.push({
    mesh,
    hull: mesh.children[0] ?? mesh,
    x,
    z,
    yaw,
    phase: Math.random() * Math.PI * 2,
    homeX: x,
    homeZ: z,
    homeYaw: yaw,
    kind: spec.kind ?? "patrol",
    patrolR: spec.patrolR ?? 10,
    patrolW: spec.patrolW ?? 0.18,
    ax: spec.ax ?? x - 12,
    az: spec.az ?? z,
    bx: spec.bx ?? x + 12,
    bz: spec.bz ?? z,
    cx: spec.cx ?? x,
    cz: spec.cz ?? z,
    orbitR: spec.orbitR ?? 12,
    orbitW: spec.orbitW ?? 0.32,
    orbitA: spec.orbitA ?? 0,
    foe: null,
    lastVolley: -1,
  });
}

export function linkSkirmish(a: THREE.Object3D, b: THREE.Object3D) {
  const da = driftShips.find((s) => s.mesh === a);
  const db = driftShips.find((s) => s.mesh === b);
  if (!da || !db) return;
  da.foe = db;
  db.foe = da;
}

export function clearDriftShips() {
  for (const shot of seaShots) {
    shot.flash.parent?.remove(shot.flash);
    shot.tracer.parent?.remove(shot.tracer);
    shot.hit.parent?.remove(shot.hit);
    (shot.flash.material as THREE.Material).dispose();
    (shot.tracer.material as THREE.Material).dispose();
    (shot.hit.material as THREE.Material).dispose();
  }
  seaShots.length = 0;
  driftShips.length = 0;
}

export function clearOceanSparkles() {
  for (const s of oceanSparkles) s.sprite.parent?.remove(s.sprite);
  oceanSparkles.length = 0;
}

export function placeOceanSparkles(
  parent: THREE.Object3D,
  onWater: (x: number, z: number) => boolean,
  color = 0xd8f0ff,
) {
  clearOceanSparkles();
  const map = sparkleTexture();
  let n = 0;
  let tries = 0;
  while (n < 55 && tries < 500) {
    tries += 1;
    const x = (Math.random() - 0.5) * 460 * MAP;
    const z = (Math.random() - 0.5) * 400 * MAP;
    if (!onWater(x, z)) continue;
    const mat = new THREE.SpriteMaterial({
      map,
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    const w = 0.09 + Math.random() * 0.21;
    sprite.scale.set(w, w * (0.28 + Math.random() * 0.22), 1);
    sprite.position.set(x, -0.08, z);
    sprite.renderOrder = 3;
    parent.add(sprite);
    oceanSparkles.push({
      sprite,
      phase: Math.random() * Math.PI * 2,
      rate: 1.8 + Math.random() * 2.2,
      x,
      z,
      fade: 0.18 + Math.random() * 0.82,
    });
    n += 1;
  }
}

function sparkleTexture(): THREE.CanvasTexture {
  if (sparkleTex) return sparkleTex;
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 8;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 16, 8);
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fillRect(1, 2, 14, 4);
  g.fillStyle = "#ffffff";
  g.fillRect(2, 3, 12, 2);
  g.fillStyle = "rgba(160, 210, 255, 0.9)";
  g.fillRect(5, 3, 6, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  sparkleTex = tex;
  return tex;
}

function voxelize(root: THREE.Object3D, lift = false) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const srcs = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = srcs.map((src) => voxelMat(src, lift));
    mesh.material = Array.isArray(mesh.material) ? next : next[0];
  });
}

function doubleSide(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) (m as THREE.Material).side = THREE.DoubleSide;
  });
}

function poseSkeletons(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  root.traverse((child) => {
    const mesh = child as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.pose();
    mesh.skeleton.update();
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  });
}

function worldBox(obj: THREE.Object3D): THREE.Box3 {
  obj.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(obj);
}

function voxelTex(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
}

function voxelMat(src: THREE.Material, lift = false): THREE.MeshLambertMaterial {
  const std = src as THREE.MeshStandardMaterial;
  const map = std.map ?? null;
  if (map) {
    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    map.generateMipmaps = false;
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.needsUpdate = true;
  }
  const color = std.color ? std.color.clone() : new THREE.Color(0xffffff);
  const emissive = std.emissive ? std.emissive.clone() : new THREE.Color(0x000000);
  const emissiveIntensity = std.emissiveIntensity ?? 1;
  const invert = src.name.includes("invert_emissive");
  const blend = invert || src.transparent || src.opacity < 1 || src.alphaTest > 0;
  if (lift && map) color.multiplyScalar(1.35);
  const mat = new THREE.MeshLambertMaterial({
    map,
    color,
    emissive,
    emissiveMap: std.emissiveMap ?? null,
    emissiveIntensity,
    transparent: blend,
    opacity: src.opacity,
    alphaTest: src.alphaTest,
    side: src.side,
    vertexColors: std.vertexColors,
    blending: invert ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: invert ? false : !blend,
  });
  mat.name = src.name;
  mat.userData.baseEmissiveHex = mat.emissive.getHex();
  mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
  return mat;
}

function cloneMats(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => m.clone());
    else mesh.material = mesh.material.clone();
  });
}

function fitHeight(obj: THREE.Object3D, height: number, names?: string[]) {
  obj.updateWorldMatrix(true, true);
  const box = namedBox(obj, names);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  if (size.y < 1e-4) return;
  obj.scale.multiplyScalar(height / size.y);
  obj.updateWorldMatrix(true, true);
  const fitted = namedBox(obj, names);
  const mid = fitted.getCenter(new THREE.Vector3());
  obj.position.x -= mid.x;
  obj.position.z -= mid.z;
  obj.position.y -= fitted.min.y;
}

function namedBox(obj: THREE.Object3D, names?: string[]): THREE.Box3 {
  if (!names) return new THREE.Box3().setFromObject(obj);
  const box = new THREE.Box3();
  obj.traverse((child) => {
    if (names.includes(child.name)) box.expandByObject(child);
  });
  return box;
}
