import * as THREE from "three";
import { RangeRing, weaponReach } from "./aim";
import {
  PIRATE_NAMES,
  PIRATE_ART,
  PLAYABLE_PIRATES,
  PIRATE_YAW,
  artReady,
  chestForLoot,
  dummyPirate,
  flashPirate,
  hasBody,
  hasProp,
  loadArt,
  makeChest,
  makePirate,
  makeProp,
  pirateSwing,
  playPirate,
  pirateDie,
  pirateDeathLift,
  poseHeld,
  resetPirateLive,
  setChestOpen,
  showHeld,
  tickOcean,
  tickPirateDie,
  weaponBoom,
  weaponTexture,
  type BodyId,
  type ChestRig,
  type HeldKit,
  type PirateId,
  type PirateRig,
} from "./art";
import {
  BELL_OPEN_AT,
  EXTRACT_CAMP_SECONDS,
  EXTRACT_CHANNEL,
  EXTRACT_OPEN_AT,
  FLINT_AMMO,
  FLINT_DAMAGE,
  HIT_RADIUS,
  HUNT_AFTER,
  MATCH_SECONDS,
  MAP,
  MELEE_COOLDOWN,
  MELEE_DAMAGE,
  DUMMY_FLINT_DAMAGE,
  DUMMY_MELEE_COOLDOWN,
  DUMMY_MELEE_DAMAGE,
  DUMMY_MUSKET_DAMAGE,
  DUMMY_NEAR,
  MUSKET_AMMO,
  MUSKET_DAMAGE,
  PICKUP_RANGE,
  PLAYER_HP,
  PLAYER_SPEED,
  JUMP_VEL,
  GRAVITY,
  UNIT,
  PIRATE_SCALE,
  UNLOCK_ALL_SKINS,
  ISLAND_IDS,
  ISLANDS,
  islandName,
  isIslandId,
  nextIsland,
  rectCenter,
  rollTrophy,
  trophyName,
  trophyRarity,
  trophyRarityColor,
  trophyArt,
  weaponArt,
  trophyTier,
  type IslandId,
  type TrophyId,
  type WeaponId,
} from "./config";
import {
  CRAFT_SKINS,
  SKINS,
  canAfford,
  consumeNeed,
  markerColor,
  needLabel,
  needStatus,
  type SkinId,
} from "./skins";
import {
  EXTRACT_BELL,
  EXTRACT_GULL,
  EXTRACT_WREN,
  allLootSpots,
  SPAWNS,
  COVER,
  blockedByWall,
  buildHarbor,
  coverBlocked,
  deckHeight,
  dressHarbor,
  standHeight,
  extractPadY,
  extractZone,
  pulseExtractGlows,
  isWalkable,
  mapFrameRects,
  navStep,
  nearestClearPoint,
  pickFleePoint,
  walkClear,
  emptyNav,
  pierWithoutShip,
  pierLabel,
  placeDecor,
  placeNavyShips,
  revealRoofs,
  type LootKind,
  type LootSpot,
  type NavCache,
  type NavyShip,
  type ExtractGlow,
  type Roof,
} from "./harbor";
import { combatGain, sfxCraft, sfxExtract, sfxHit, sfxHurt, sfxKill, sfxNavySting, sfxOpen, sfxPickup, sfxReload, sfxShot, sfxSwing, startMatchAudio, startMenuMusic, unlockAudio } from "./sfx";
import { loadProgress, saveProgress } from "./save";

type Primary = WeaponId | null;

type LootBox = {
  spot: LootSpot;
  mesh: THREE.Object3D;
  opened: boolean;
  closedColor: number;
  chest?: ChestRig;
  hintOpen: THREE.Sprite;
  hintReload: THREE.Sprite | null;
  loot: ContainerLoot;
};

type ContainerLoot = {
  weapon?: WeaponId;
  ammo?: number;
  trophy?: TrophyId;
  rum?: boolean;
};

type GroundItem = {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  weapon?: WeaponId;
  ammo?: number;
  trophy?: TrophyId;
  hintPickup: THREE.Sprite | null;
};

type Fighter = {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  hp: number;
  yaw: number;
  primary: Primary;
  bag: Primary;
  ammo: number;
  trophy: TrophyId | null;
  cooldown: number;
  alive: boolean;
  corpse: boolean;
  dieT: number;
  fallSide: number;
  dummy: boolean;
  wanderT: number;
  tx: number;
  tz: number;
  spawnIndex: number;
  color: number;
  aim: RangeRing;
  hpPip?: THREE.Mesh;
  trophyIcon?: THREE.Sprite;
  rummage: number;
  lootReadyAt: number;
  extractHold: number;
  nav: NavCache;
  marker?: THREE.Mesh;
  y: number;
  vy: number;
  grounded: boolean;
  jumpCool: number;
  rig?: PirateRig;
  kit?: HeldKit;
  pirate?: PirateId;
  px: number;
  pz: number;
};

function bodyHalf(f: Fighter): number {
  return (f.dummy ? 1 : 1.12) * UNIT * PIRATE_SCALE;
}

function deathEase(t: number): number {
  const u = Math.min(1, Math.max(0, t / 0.68));
  return u * u * (3 - 2 * u);
}

function weaponName(w: Primary): string {
  if (w === "flintlock") return "Flintlock";
  if (w === "musket") return "Musket";
  return "Cutlass";
}

function containerLabel(kind: LootKind): string {
  if (kind === "trophy-chest") return "trophy chest";
  return kind;
}

function pirateCoat(color: number): string {
  if (color === 0x4a7c59) return "Green coat";
  if (color === 0xc4a35a) return "Gold coat";
  if (color === 0x7c5a3a) return "Brown coat";
  if (color === 0x7c4a4a) return "Red coat";
  if (color === 0x2e6b5a) return "Teal coat";
  if (color === 0x6a4a7c) return "Plum coat";
  if (color === 0x4a4a7c) return "Blue coat";
  if (color === 0xe8d5a3) return "Sand coat";
  return "Pirate";
}

function navyClock(elapsed: number): string {
  const t = Math.min(1, elapsed / MATCH_SECONDS);
  const remain = Math.max(0, MATCH_SECONDS * (1 - t));
  const m = Math.floor(remain / 60);
  const s = Math.floor(remain % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function paintTrophyCard(card: HTMLElement, id: TrophyId | null) {
  const portrait = card.querySelector(".trophy-portrait") as HTMLElement;
  const held = card.querySelector(".trophy-held") as HTMLElement;
  const rarity = card.querySelector(".trophy-rarity") as HTMLElement;
  if (!id) {
    card.classList.add("empty");
    held.textContent = "";
    rarity.textContent = "";
    portrait.style.borderColor = "";
    portrait.style.backgroundImage = "";
    portrait.style.backgroundColor = "";
    rarity.style.color = "";
    portrait.title = "";
    return;
  }
  card.classList.remove("empty");
  const edge = trophyRarityColor(id);
  held.textContent = trophyName(id);
  rarity.textContent = trophyRarity(id);
  rarity.style.color = edge;
  portrait.style.borderColor = edge;
  portrait.style.backgroundImage = `url("${trophyArt(id)}")`;
  portrait.style.backgroundColor = "#1a1612";
  portrait.title = `${trophyName(id)} · ${trophyRarity(id)}`;
}

function lootSize(kind: LootKind): { w: number; d: number; h: number } {
  if (kind === "barrel") return { w: 1.1 * UNIT, d: 1.1 * UNIT, h: 1.15 * UNIT };
  if (kind === "crate") return { w: 1.12 * UNIT, d: 1.12 * UNIT, h: 0.85 * UNIT };
  if (kind === "lockbox" || kind === "chest" || kind === "trophy-chest") {
    return { w: 1.9 * UNIT, d: 1.35 * UNIT, h: 0.95 * UNIT };
  }
  return { w: 1.15 * UNIT, d: 0.85 * UNIT, h: 0.7 * UNIT };
}

function lootHeight(kind: LootKind): number {
  return lootSize(kind).h;
}

const HINT_TEX = new Map<string, THREE.CanvasTexture>();

function hintSprite(text: string, color: string): THREE.Sprite {
  const key = `${text}|${color}`;
  let tex = HINT_TEX.get(key);
  if (!tex) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 160;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 768, 160);
    g.font = "700 78px Palatino, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.strokeStyle = "rgba(13, 20, 24, 0.92)";
    g.lineWidth = 18;
    g.strokeText(text, 384, 80);
    g.fillStyle = color;
    g.fillText(text, 384, 80);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    HINT_TEX.set(key, tex);
  }
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  s.scale.set(10.2, 2.15, 1);
  s.center.set(0.5, 0);
  s.renderOrder = 9;
  return s;
}

function lootStand(tx: number, tz: number): { x: number; z: number } {
  let best: { x: number; z: number } | null = null;
  let bestScore = 1e9;
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const px = tx + Math.sin(ang) * 1.45 * UNIT;
    const pz = tz + Math.cos(ang) * 1.45 * UNIT;
    if (!walkClear(px, pz)) continue;
    if (Math.hypot(px - tx, pz - tz) > PICKUP_RANGE) continue;
    const score = pz * 1000 + px;
    if (score < bestScore) {
      bestScore = score;
      best = { x: px, z: pz };
    }
  }
  return best ?? nearestClearPoint(tx, tz);
}

const LOOT_GLOW = 0xd4a017;
const RELOAD_GLOW = 0x7ec8e3;
const OUTLINE_RELOAD_DIM = new THREE.Color(0x2a6a88);
const OUTLINE_RELOAD_HOT = new THREE.Color(0xb8eefc);

function xrayMat(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: LOOT_GLOW,
    transparent: true,
    opacity: 0.45,
    depthTest: true,
    depthFunc: THREE.GreaterDepth,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

const OUTLINE_DIM = new THREE.Color(0x8a6410);
const OUTLINE_HOT = new THREE.Color(0xfff4b0);

function outlineMat(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xffd24a,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.9,
    depthTest: true,
    depthWrite: false,
  });
}

function isLootFx(obj: THREE.Object3D): boolean {
  return !!(obj.userData.isXray || obj.userData.isOutline);
}

function shineOutline(obj: THREE.Object3D, wave: number, tint: "loot" | "reload" = "loot") {
  const on = wave > 0.001;
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || isLootFx(mesh)) return;
    const prev = mesh.userData.outline as THREE.Object3D | undefined;
    if (prev instanceof THREE.LineSegments) {
      mesh.remove(prev);
      mesh.userData.outline = undefined;
    }
    if (!mesh.userData.outline) {
      const outline = new THREE.Mesh(mesh.geometry, outlineMat());
      outline.userData.isOutline = true;
      outline.frustumCulled = false;
      outline.renderOrder = 6;
      mesh.add(outline);
      mesh.userData.outline = outline;
    }
    const outline = mesh.userData.outline as THREE.Mesh;
    outline.visible = on;
    if (!on) return;
    outline.scale.setScalar(1.05 + 0.1 * wave);
    const mat = outline.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.4 + 0.6 * wave;
    const dim = tint === "reload" ? OUTLINE_RELOAD_DIM : OUTLINE_DIM;
    const hot = tint === "reload" ? OUTLINE_RELOAD_HOT : OUTLINE_HOT;
    mat.color.copy(dim).lerp(hot, wave);
  });
}

function glowLoot(obj: THREE.Object3D, amount: number, color = LOOT_GLOW) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || isLootFx(mesh)) return;
    if (!mesh.userData.xray) {
      const xray = new THREE.Mesh(mesh.geometry, xrayMat());
      xray.userData.isXray = true;
      xray.frustumCulled = false;
      xray.renderOrder = 8;
      mesh.add(xray);
      mesh.userData.xray = xray;
    }
    const xray = mesh.userData.xray as THREE.Mesh;
    const on = amount > 0.001;
    xray.visible = on;
    if (on) {
      const mat = xray.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + amount * 0.18;
      mat.color.setHex(color);
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mat = m as THREE.MeshLambertMaterial;
      if (!mat.emissive) continue;
      if (!on) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      } else {
        mat.emissive.setHex(color);
        mat.emissiveIntensity = amount;
      }
    }
  });
}

function rollContainer(kind: LootKind, island: IslandId): ContainerLoot {
  if (kind === "chest") return { trophy: rollTrophy("ship", island) };
  if (kind === "trophy-chest") return { trophy: rollTrophy("chest", island) };
  if (kind === "lockbox") {
    const n = Math.random();
    if (n < 0.55) return { weapon: "musket", ammo: MUSKET_AMMO };
    if (n < 0.8) return { weapon: "flintlock", ammo: FLINT_AMMO };
    return { trophy: rollTrophy("t2", island) };
  }
  if (kind === "crate") {
    if (Math.random() < 0.55) return { weapon: "flintlock", ammo: FLINT_AMMO };
    return { weapon: "musket", ammo: MUSKET_AMMO };
  }
  if (kind === "barrel") return { trophy: rollTrophy("t1", island) };
  return {};
}

function pickIds(ids: string[], n: number): Set<string> {
  const list = [...ids];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = list[i]!;
    list[i] = list[j]!;
    list[j] = a;
  }
  return new Set(list.slice(0, Math.min(n, list.length)));
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1500);
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0 };
  private player!: Fighter;
  private dummies: Fighter[] = [];
  private containers: LootBox[] = [];
  private ground: GroundItem[] = [];
  private extractGlows: ExtractGlow[] = [];
  private extractHints: { id: "gull" | "wren" | "bell"; sprite: THREE.Sprite }[] = [];
  private roofs: Roof[] = [];
  private ships: NavyShip[] = [];
  private elapsed = 0;
  private last = 0;
  private channel = 0;
  private lastHit = -10;
  private toastUntil = 0;
  private toast = "";
  private extractToastDismissed = false;
  private navyStingAt = -1;
  private mode: "select" | "play" | "extracted" | "over" = "select";
  private overlayView: "summary" | "select" | "craft" = "select";
  private craftFocus: SkinId | null = null;
  private ready = false;
  private stash: Partial<Record<TrophyId, number>> = {};
  private extractedTrophy: TrophyId | null = null;
  private owned = new Set<SkinId>();
  private equipped: SkinId | null = null;
  private pickedPirate: PirateId = "rustbeard";
  private island: IslandId = 1;
  private unlocked: IslandId = 1;
  private extractedFrom: IslandId = 1;
  private trophyTex = new Map<TrophyId, THREE.Texture>();
  private just = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private playerAim!: RangeRing;
  private inspect: Fighter | null = null;
  private look = { x: 0, z: 0 };
  private camBlend = 0;
  private camYaw = Math.PI / 4;
  private camZoom = 40 * MAP;
  private camZoomWant = 40 * MAP;
  private pinchY: number | null = null;
  private pinchZoom = 1;
  private shake = 0;
  private hpHealFrom = PLAYER_HP;
  private hpHealAt = -99;

  constructor(root: HTMLElement) {
    const save = loadProgress();
    this.stash = save.stash;
    this.owned = new Set(UNLOCK_ALL_SKINS ? CRAFT_SKINS : save.owned);
    if (UNLOCK_ALL_SKINS) for (const id of save.owned) this.owned.add(id);
    this.equipped = save.equipped && this.owned.has(save.equipped) ? save.equipped : null;
    this.pickedPirate = save.pirate;
    this.island = save.island;
    this.unlocked = save.unlocked;
    this.scene.background = new THREE.Color(ISLANDS[this.island].sky);
    this.scene.fog = new THREE.Fog(ISLANDS[this.island].fog, 110, 280);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    root.appendChild(this.renderer.domElement);
    const harbor = buildHarbor(this.scene, this.island);
    this.extractGlows = harbor.extractGlows;
    this.roofs = harbor.roofs;
    this.ships = harbor.ships;
    this.placeExtractHints();
    placeNavyShips(this.ships, 0);
    this.playerAim = new RangeRing(this.scene, true);
    this.bind();
    this.applyHudSkin();
    this.resize();
    this.camera.position.set(40, 52, 40);
    this.camera.lookAt(0, 0.5 * UNIT, 0);
    this.last = performance.now();
    requestAnimationFrame(this.frame);
    void this.boot();
  }

  private async boot() {
    try {
      await loadArt();
    } catch (err) {
      console.error("voxel art failed to load", err);
    }
    placeDecor(this.scene);
    dressHarbor(this.scene, this.roofs, this.ships);
    this.placeLoot();
    this.spawnPlayer(2);
    this.spawnDummy(0, 0x4a7c59);
    this.spawnDummy(1, 0xc4a35a);
    this.spawnDummy(3, 0x7c5a3a);
    this.spawnDummy(4, 0x7c4a4a);
    this.spawnDummy(5, 0x2e6b5a);
    this.spawnDummy(6, 0x6a4a7c);
    this.spawnDummy(7, 0x4a4a7c);
    this.ready = true;
    this.showSelect();
  }

  private bind() {
    addEventListener("resize", () => this.resize());
    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (e.code === "Space" || k === " ") e.preventDefault();
      const key = e.code === "Space" ? " " : k;
      if (!e.repeat && !this.keys.has(key)) this.just.add(key);
      this.keys.add(key);
      if (k === "escape") {
        if (this.craftFocus) {
          this.closeCraftPop();
          return;
        }
        if (
          this.overlayView === "craft" &&
          !document.getElementById("overlay")!.classList.contains("hidden")
        ) {
          this.showSelect();
        }
      }
      if (k === "r") {
        if (!this.player) return;
        if (this.mode !== "play" || !this.player.alive) {
          unlockAudio();
          const overlayHidden = document.getElementById("overlay")!.classList.contains("hidden");
          if (!overlayHidden && this.overlayView === "craft") this.showSelect();
          else if (!overlayHidden && this.overlayView === "select") this.startMatch();
          else this.showSelect();
        }
      }
      if ((k === "q" || k === "1" || k === "2") && !e.repeat) {
        this.cycleHands(k);
      }
    });
    addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener("contextmenu", (e) => {
      if (e.target === this.renderer.domElement) e.preventDefault();
    });
    addEventListener(
      "wheel",
      (e) => {
        const overlay = document.getElementById("overlay");
        if (overlay && !overlay.classList.contains("hidden") && overlay.contains(e.target as Node)) {
          return;
        }
        e.preventDefault();
        this.nudgeZoom(e.deltaY, e.deltaMode, e.ctrlKey);
      },
      { passive: false },
    );
    const canvas = this.renderer.domElement;
    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 2) {
          this.pinchY = null;
          return;
        }
        this.pinchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this.pinchZoom = this.camZoomWant;
      },
      { passive: true },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length !== 2 || this.pinchY == null) return;
        e.preventDefault();
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this.camZoomWant = this.clampZoom(this.pinchZoom * Math.exp((y - this.pinchY) * 0.004));
      },
      { passive: false },
    );
    canvas.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) this.pinchY = null;
    });
    canvas.addEventListener("touchcancel", () => {
      this.pinchY = null;
    });
    addEventListener("mousemove", (e) => {
      if (this.modalOpen()) return;
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
      this.renderer.domElement.style.cursor = this.pickPirate() ? "pointer" : "default";
    });
    addEventListener("mousedown", (e) => {
      unlockAudio();
      if (e.button !== 0 || this.mode !== "play") return;
      if (e.target !== this.renderer.domElement) return;
      this.inspect = this.pickPirate();
    });
    document.getElementById("again-btn")!.onclick = () => {
      unlockAudio();
      if (this.overlayView === "select") this.startMatch();
      else this.showSelect();
    };
    document.getElementById("extract-toast-close")!.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.extractToastDismissed = true;
      this.syncExtractToast();
    };
    document.getElementById("island-picks")!.onclick = (e) => {
      const btn = (e.target as HTMLElement).closest("button[data-island]") as HTMLButtonElement | null;
      if (!btn) return;
      const n = Number(btn.getAttribute("data-island"));
      if (!isIslandId(n) || n > this.unlocked) return;
      this.island = n;
      this.rebuildIsland();
      this.renderIslands();
      this.persist();
    };
    document.getElementById("owned-skins")!.onclick = (e) => {
      const pirateBtn = (e.target as HTMLElement).closest("button[data-pick-pirate]");
      if (pirateBtn) {
        this.equipPirate(pirateBtn.getAttribute("data-pick-pirate") as PirateId);
        return;
      }
      const btn = (e.target as HTMLElement).closest("button[data-equip]");
      if (!btn) return;
      this.equipSkin(btn.getAttribute("data-equip") as SkinId);
    };
    document.getElementById("craft-toggle")!.onclick = () => this.showCraft();
    document.getElementById("craft-back")!.onclick = () => this.showSelect();
    document.getElementById("craft-list")!.onclick = (e) => {
      const btn = (e.target as HTMLElement).closest("button[data-craft]") as HTMLButtonElement | null;
      if (!btn) return;
      this.openCraftPop(btn.getAttribute("data-craft") as SkinId);
    };
    document.getElementById("craft-pop-close")!.onclick = () => this.closeCraftPop();
    document.getElementById("craft-pop")!.onclick = (e) => {
      if (e.target === document.getElementById("craft-pop")) this.closeCraftPop();
    };
    document.getElementById("craft-pop-btn")!.onclick = () => {
      if (this.craftFocus) this.craft(this.craftFocus);
    };
  }

  private resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private makeBody(color: number, scale = 1, body?: BodyId): { mesh: THREE.Object3D; rig?: PirateRig } {
    if (artReady() && body && hasBody(body)) {
      const rig = makePirate(body);
      this.scene.add(rig.root);
      rig.root.userData.base = color;
      return { mesh: rig.root, rig };
    }
    const g = new THREE.CapsuleGeometry(0.45 * scale * UNIT * PIRATE_SCALE, 1.1 * scale * UNIT * PIRATE_SCALE, 4, 8);
    const m = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(g, m);
    this.scene.add(mesh);
    mesh.userData.base = color;
    return { mesh };
  }

  private makeMarker(color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.92 * UNIT * PIRATE_SCALE, 0.08 * UNIT * PIRATE_SCALE, 8, 28),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.92,
        depthTest: true,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 2;
    this.scene.add(mesh);
    return mesh;
  }

  private makeHpPip(): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2 * UNIT * PIRATE_SCALE, 0.14 * UNIT * PIRATE_SCALE, 0.14 * UNIT * PIRATE_SCALE),
      new THREE.MeshBasicMaterial({ color: 0x3dba7c, depthTest: false }),
    );
    mesh.renderOrder = 9;
    this.scene.add(mesh);
    return mesh;
  }

  private makeTrophyIcon(): THREE.Sprite {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        transparent: true,
        depthTest: true,
        sizeAttenuation: true,
      }),
    );
    sprite.scale.set(0.7 * UNIT * PIRATE_SCALE, 0.7 * UNIT * PIRATE_SCALE, 1);
    sprite.visible = false;
    sprite.renderOrder = 10;
    this.scene.add(sprite);
    return sprite;
  }

  private trophyTexture(id: TrophyId): THREE.Texture {
    const hit = this.trophyTex.get(id);
    if (hit) return hit;
    const tex = new THREE.TextureLoader().load(trophyArt(id));
    tex.colorSpace = THREE.SRGBColorSpace;
    this.trophyTex.set(id, tex);
    return tex;
  }

  private spawnPlayer(spawnIndex: number) {
    const s = SPAWNS[spawnIndex] ?? SPAWNS[0] ?? { x: 0, z: 0 };
    if (this.player) {
      this.player.rig?.mixer.stopAllAction();
      this.scene.remove(this.player.mesh);
      if (this.player.marker) this.scene.remove(this.player.marker);
      if (this.player.hpPip) this.scene.remove(this.player.hpPip);
      if (this.player.trophyIcon) this.scene.remove(this.player.trophyIcon);
    }
    const skin = this.equipped ? SKINS[this.equipped] : null;
    const color = skin?.color ?? 0xe8d5a3;
    const bodyId: BodyId = this.equipped ?? this.pickedPirate;
    const body = this.makeBody(color, 1.12, bodyId);
    this.player = {
      mesh: body.mesh,
      rig: body.rig,
      kit: body.rig,
      pirate: this.pickedPirate,
      x: s.x,
      z: s.z,
      y: standHeight(s.x, s.z),
      vy: 0,
      grounded: true,
      jumpCool: 0,
      hp: PLAYER_HP,
      yaw: 0,
      primary: null,
      bag: null,
      ammo: 0,
      trophy: null,
      cooldown: 0,
      alive: true,
      corpse: false,
      dieT: 0,
      fallSide: 1,
      dummy: false,
      wanderT: 0,
      tx: s.x,
      tz: s.z,
      spawnIndex,
      color,
      aim: this.playerAim,
      rummage: 0,
      lootReadyAt: 0,
      extractHold: 0,
      nav: emptyNav(),
      marker: this.makeMarker(markerColor(skin)),
      hpPip: this.makeHpPip(),
      trophyIcon: this.makeTrophyIcon(),
      px: s.x,
      pz: s.z,
    };
    this.paintSkin(this.player);
    this.placeFighter(this.player);
    this.look.x = this.player.x;
    this.look.z = this.player.z;
  }

  private spawnDummy(spawnIndex: number, color: number) {
    const s = SPAWNS[spawnIndex] ?? SPAWNS[0] ?? { x: 0, z: 0 };
    const pirate = dummyPirate(spawnIndex);
    const body = this.makeBody(color, 1, pirate);
    const f: Fighter = {
      mesh: body.mesh,
      rig: body.rig,
      kit: body.rig,
      pirate,
      x: s.x,
      z: s.z,
      y: standHeight(s.x, s.z),
      vy: 0,
      grounded: true,
      jumpCool: 0,
      hp: PLAYER_HP,
      yaw: 0,
      primary: spawnIndex === 7 ? "flintlock" : null,
      bag: null,
      ammo: spawnIndex === 7 ? FLINT_AMMO : 0,
      trophy: spawnIndex === 7 ? "wood" : null,
      cooldown: 1.4,
      alive: true,
      corpse: false,
      dieT: 0,
      fallSide: 1,
      dummy: true,
      wanderT: 0,
      tx: s.x,
      tz: s.z,
      spawnIndex,
      color,
      aim: new RangeRing(this.scene, false),
      hpPip: this.makeHpPip(),
      trophyIcon: this.makeTrophyIcon(),
      rummage: 0,
      lootReadyAt: spawnIndex === 7 ? 0 : (spawnIndex === 5 ? 1.1 : 1.8 + spawnIndex * 1.5) + Math.random() * 2,
      extractHold: 0,
      nav: emptyNav(),
      px: s.x,
      pz: s.z,
    };
    this.dummies.push(f);
    this.placeFighter(f);
  }

  private placeLoot() {
    const spots = allLootSpots();
    for (const spot of spots) {
      const { w, d, h } = lootSize(spot.kind);
      const deck = deckHeight(spot.x, spot.z);
      const chestId = artReady() ? chestForLoot(spot.kind) : null;
      let mesh: THREE.Object3D;
      let chest: ChestRig | undefined;
      const closedColor =
        spot.kind === "chest"
          ? 0xd4a017
          : spot.kind === "trophy-chest"
            ? 0xb8862a
            : spot.kind === "lockbox"
              ? 0x8a6a2a
              : spot.kind === "crate"
                ? 0xc9a227
                : 0x8b5a2b;
      if (chestId) {
        chest = makeChest(chestId);
        mesh = chest.root;
        mesh.position.set(spot.x, deck, spot.z);
        this.scene.add(mesh);
      } else if (spot.kind === "barrel" && hasProp("barrel")) {
        mesh = makeProp("barrel", 1.12 * UNIT);
        mesh.position.set(spot.x, deck, spot.z);
        this.scene.add(mesh);
      } else if (spot.kind === "crate" && hasProp("crate-yellow")) {
        mesh = makeProp("crate-yellow", 0.88 * UNIT);
        mesh.position.set(spot.x, deck, spot.z);
        this.scene.add(mesh);
      } else if (spot.kind === "crate" && hasProp("crate")) {
        mesh = makeProp("crate", 0.88 * UNIT);
        mesh.position.set(spot.x, deck, spot.z);
        this.scene.add(mesh);
      } else {
        const geo =
          spot.kind === "barrel"
            ? new THREE.CylinderGeometry(0.55, 0.58, h, 8)
            : new THREE.BoxGeometry(w, h, d);
        mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: closedColor }));
        mesh.position.set(spot.x, deck + h / 2, spot.z);
        this.scene.add(mesh);
      }

      const hintOpen = hintSprite("E to open", "#f4e4a4");
      this.scene.add(hintOpen);
      const hintReload =
        spot.kind === "crate" ? hintSprite("E to reload", "#7ec8e3") : null;
      if (hintReload) this.scene.add(hintReload);

      this.containers.push({
        spot,
        mesh,
        opened: false,
        closedColor,
        chest,
        hintOpen,
        hintReload,
        loot: {},
      });
    }
    this.refillContainers();
  }

  private refillContainers() {
    const emptyBarrels = pickIds(
      this.containers.filter((c) => c.spot.kind === "barrel").map((c) => c.spot.id),
      5,
    );
    const emptyCrates = pickIds(
      this.containers.filter((c) => c.spot.kind === "crate").map((c) => c.spot.id),
      3,
    );
    for (const c of this.containers) {
      const empty =
        (c.spot.kind === "barrel" && emptyBarrels.has(c.spot.id)) ||
        (c.spot.kind === "crate" && emptyCrates.has(c.spot.id));
      c.loot = empty ? {} : rollContainer(c.spot.kind, this.island);
      this.syncLootHint(c);
    }
  }

  private paintIsland() {
    const spec = ISLANDS[this.island];
    this.scene.background = new THREE.Color(spec.sky);
    const fog = this.scene.fog;
    if (fog instanceof THREE.Fog) fog.color.setHex(spec.fog);
  }

  private rebuildIsland() {
    this.clearGround();
    this.clearLoot();
    this.clearExtractHints();
    const harbor = buildHarbor(this.scene, this.island);
    this.extractGlows = harbor.extractGlows;
    this.roofs = harbor.roofs;
    this.ships = harbor.ships;
    this.placeExtractHints();
    if (this.ready) {
      placeDecor(this.scene);
      dressHarbor(this.scene, this.roofs, this.ships);
      this.placeLoot();
    }
    if (this.player) this.spawnPlayer(this.player.spawnIndex);
    for (const d of this.dummies) this.resetDummy(d);
    placeNavyShips(this.ships, this.elapsed);
    this.paintIsland();
  }

  private clearGround() {
    for (const g of this.ground) {
      this.scene.remove(g.mesh);
      if (g.hintPickup) this.scene.remove(g.hintPickup);
    }
    this.ground = [];
  }

  private clearLoot() {
    for (const c of this.containers) {
      this.scene.remove(c.mesh);
      this.scene.remove(c.hintOpen);
      if (c.hintReload) this.scene.remove(c.hintReload);
    }
    this.containers = [];
  }

  private clearExtractHints() {
    for (const h of this.extractHints) this.scene.remove(h.sprite);
    this.extractHints = [];
  }

  private hintHeight(c: LootBox): number {
    return deckHeight(c.spot.x, c.spot.z) + lootHeight(c.spot.kind) + 0.22 * UNIT;
  }

  private syncLootHint(c: LootBox) {
    const y = this.hintHeight(c);
    c.hintOpen.visible = !c.opened;
    c.hintOpen.position.set(c.spot.x, y, c.spot.z);
    if (c.hintReload) {
      c.hintReload.visible = c.opened && this.gunNeedsReload(this.player);
      c.hintReload.position.set(c.spot.x, y, c.spot.z);
    }
  }

  private placeExtractHints() {
    const pads: { id: "gull" | "wren" | "bell"; r: typeof EXTRACT_GULL }[] = [
      { id: "gull", r: EXTRACT_GULL },
      { id: "wren", r: EXTRACT_WREN },
      { id: "bell", r: EXTRACT_BELL },
    ];
    for (const pad of pads) {
      const sprite = hintSprite("Hold E to extract", "#e8c45a");
      const c = rectCenter(pad.r);
      sprite.position.set(c.x, extractPadY(pad.r) + 0.42 * UNIT, c.z);
      sprite.visible = false;
      this.scene.add(sprite);
      this.extractHints.push({ id: pad.id, sprite });
    }
  }

  private setContainerOpen(c: LootBox, opened: boolean) {
    c.opened = opened;
    this.syncLootHint(c);
    if (opened) glowLoot(c.mesh, 0);
    if (c.chest) {
      setChestOpen(c.chest, opened);
      return;
    }
    if (c.mesh.userData.voxelProp) {
      const deck = deckHeight(c.spot.x, c.spot.z);
      if (!opened) {
        c.mesh.rotation.set(0, 0, 0);
        c.mesh.position.set(c.spot.x, deck, c.spot.z);
        return;
      }
      if (c.spot.kind === "barrel") {
        c.mesh.rotation.z = Math.PI / 2;
        c.mesh.position.set(c.spot.x, deck + 0.12 * UNIT, c.spot.z);
      } else {
        c.mesh.rotation.x = 0.45;
        c.mesh.position.set(c.spot.x, deck + 0.08 * UNIT, c.spot.z);
      }
      return;
    }
    const mesh = c.mesh as THREE.Mesh;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    if (!opened) {
      mat.color.setHex(c.closedColor);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      const h = lootHeight(c.spot.kind);
      mesh.position.set(c.spot.x, 0.4 + h / 2, c.spot.z);
      return;
    }
    mat.color.setHex(0x3a322c);
    if (c.spot.kind === "barrel") {
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(c.spot.x, 0.58 * UNIT, c.spot.z);
    } else {
      mesh.rotation.x = 0.55;
      mesh.scale.set(1, 0.38, 1);
      mesh.position.set(c.spot.x, 0.52 * UNIT, c.spot.z);
    }
  }

  private placeFighter(f: Fighter) {
    const shown = f.alive || f.corpse;
    f.mesh.position.set(f.x, this.bodyY(f), f.z);
    f.mesh.rotation.y = f.yaw + (f.rig ? PIRATE_YAW : 0);
    f.mesh.visible = shown;
    if (f.marker) {
      f.marker.visible = f.alive;
      f.marker.position.set(f.x, f.y + 0.12 * UNIT * PIRATE_SCALE, f.z);
    }
    if (f.kit) showHeld(f.kit, f.primary, f.alive);
    if (f.hpPip) {
      const ratio = Math.max(0, f.hp / PLAYER_HP);
      f.hpPip.visible = f.alive && f.hp < PLAYER_HP;
      f.hpPip.position.set(f.x, f.y + 2.15 * UNIT * PIRATE_SCALE, f.z);
      f.hpPip.scale.set(Math.max(0.06, ratio), 1, 1);
      (f.hpPip.material as THREE.MeshBasicMaterial).color.setHex(
        ratio > 0.45 ? 0x3dba7c : ratio > 0.2 ? 0xd4a017 : 0xc45c3e,
      );
    }
    if (f.trophyIcon) {
      const held = f.alive && !!f.trophy;
      f.trophyIcon.visible = held;
      f.trophyIcon.position.set(f.x, f.y + 2.62 * UNIT * PIRATE_SCALE, f.z);
      if (held && f.trophy) {
        const mat = f.trophyIcon.material;
        if (mat.map !== this.trophyTexture(f.trophy)) {
          mat.map = this.trophyTexture(f.trophy);
          mat.needsUpdate = true;
        }
      }
    }
  }

  private posePirate(f: Fighter, dt: number) {
    if (f.rig) {
      const moved = Math.hypot(f.x - f.px, f.z - f.pz);
      f.px = f.x;
      f.pz = f.z;
      const step = PLAYER_SPEED * dt;
      const speed = moved > step * 0.3 ? moved / Math.max(dt, 1e-4) : 0;
      if (f.corpse) {
        f.dieT += dt;
        tickPirateDie(f.rig, f.dieT, f.fallSide);
      } else if (f.alive) playPirate(f.rig, speed, f.grounded);
      f.rig.mixer.update(dt);
      f.rig.root.updateWorldMatrix(true, true);
    }
    if (f.kit) poseHeld(f.kit, f.primary, dt);
    else if (f.corpse) {
      f.dieT += dt;
      const e = deathEase(f.dieT);
      f.mesh.rotation.x = -e * 1.42;
      f.mesh.rotation.z = f.fallSide * e * 0.48;
    }
  }

  private bodyY(f: Fighter): number {
    if (f.rig) return f.y + (f.corpse ? pirateDeathLift(f.dieT) : 0);
    const half = bodyHalf(f);
    if (!f.corpse) return f.y + half;
    const e = deathEase(f.dieT);
    const ang = e * (Math.PI / 2);
    return f.y + half * Math.cos(ang) + 0.45 * UNIT * PIRATE_SCALE * Math.sin(ang);
  }

  private syncAim(f: Fighter) {
    f.aim.update({
      x: f.x,
      z: f.z,
      primary: f.primary,
      ammo: f.ammo,
      cooldown: f.cooldown,
      alive: f.alive && this.mode === "play",
      color: f.color,
    });
  }

  private hideAims() {
    this.playerAim.setVisible(false);
    for (const d of this.dummies) d.aim.setVisible(false);
  }

  private phase(): "closed" | "docks" | "bell" {
    if (this.elapsed >= BELL_OPEN_AT) return "bell";
    if (this.elapsed >= EXTRACT_OPEN_AT) return "docks";
    return "closed";
  }

  private holsterGun(f: Fighter) {
    if (!f.primary) return;
    f.bag = f.primary;
    f.primary = null;
  }

  private drawGun(f: Fighter) {
    if (f.primary || !f.bag) return;
    f.primary = f.bag;
    f.bag = null;
  }

  private cycleHands(k: string) {
    if (!this.player) return;
    const p = this.player;
    if (!p.alive || this.mode !== "play") return;
    if (k === "1" || (k === "q" && p.primary)) {
      this.holsterGun(p);
      return;
    }
    if (k === "2" || k === "q") this.drawGun(p);
  }

  private tryMove(f: Fighter, nx: number, nz: number) {
    if (isWalkable(nx, f.z) && !coverBlocked(nx, f.z, f.y)) f.x = nx;
    if (isWalkable(f.x, nz) && !coverBlocked(f.x, nz, f.y)) f.z = nz;
  }

  private tryJump(f: Fighter) {
    if (!f.alive || !f.grounded) return;
    f.vy = JUMP_VEL;
    f.grounded = false;
    f.jumpCool = 0.55;
  }

  private tickAir(f: Fighter, dt: number) {
    if (!f.alive) return;
    f.jumpCool = Math.max(0, f.jumpCool - dt);
    const g = standHeight(f.x, f.z);
    if (f.grounded && f.vy <= 0) {
      if (f.y <= g + 0.1) {
        f.y = g;
        f.vy = 0;
        return;
      }
      f.grounded = false;
    }
    f.grounded = false;
    f.vy -= GRAVITY * dt;
    f.y += f.vy * dt;
    if (f.y <= g && f.vy <= 0) {
      f.y = g;
      f.vy = 0;
      f.grounded = true;
    }
  }

  private wasdAxis(): { mx: number; mz: number } {
    const yaw = this.pointerYaw();
    const s = Math.sin(yaw);
    const c = Math.cos(yaw);
    let mx = 0;
    let mz = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) {
      mx -= s;
      mz -= c;
    }
    if (this.keys.has("s") || this.keys.has("arrowdown")) {
      mx += s;
      mz += c;
    }
    if (this.keys.has("a") || this.keys.has("arrowleft")) {
      mx -= c;
      mz += s;
    }
    if (this.keys.has("d") || this.keys.has("arrowright")) {
      mx += c;
      mz -= s;
    }
    return { mx, mz };
  }

  private wasdMove(p: Fighter, dt: number) {
    if (this.just.has(" ") || this.just.has("space")) this.tryJump(p);
    const { mx, mz } = this.wasdAxis();
    if (mx || mz) {
      const len = Math.hypot(mx, mz);
      p.yaw = Math.atan2(mx, mz);
      this.tryMove(
        p,
        p.x + (mx / len) * PLAYER_SPEED * dt,
        p.z + (mz / len) * PLAYER_SPEED * dt,
      );
    }
    this.tickAir(p, dt);
  }

  private wasdSpectate(dt: number) {
    const { mx, mz } = this.wasdAxis();
    if (!mx && !mz) return;
    const len = Math.hypot(mx, mz);
    const speed = PLAYER_SPEED * 2.4;
    this.look.x = Math.max(-120 * MAP, Math.min(110 * MAP, this.look.x + (mx / len) * speed * dt));
    this.look.z = Math.max(-90 * MAP, Math.min(90 * MAP, this.look.z + (mz / len) * speed * dt));
  }

  private rivals(f: Fighter): Fighter[] {
    const all = [this.player, ...this.dummies];
    return all.filter((o) => o !== f && o.alive);
  }

  private canSee(a: Fighter, b: Fighter): boolean {
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    if (dist < 1.2 * UNIT) return true;
    return !blockedByWall(a.x, a.z, (b.x - a.x) / dist, (b.z - a.z) / dist, dist - 0.4 * UNIT);
  }

  private shotRange(f: Fighter): number {
    return weaponReach(f.primary).range;
  }

  private inReach(f: Fighter, t: Fighter): boolean {
    if (!t.alive) return false;
    const { range, melee } = weaponReach(f.primary);
    const ex = t.x - f.x;
    const ez = t.z - f.z;
    const dist = Math.hypot(ex, ez);
    if (dist > range || dist < 0.15 * UNIT) return false;
    if (dist > 1.2 * UNIT && blockedByWall(f.x, f.z, ex / dist, ez / dist, dist - HIT_RADIUS)) {
      return false;
    }
    if (!melee && !this.canSee(f, t)) return false;
    return true;
  }

  private reachHits(f: Fighter): Fighter[] {
    return this.rivals(f).filter((t) => {
      if (!this.inReach(f, t)) return false;
      if (f.dummy && t.dummy && Math.hypot(t.x - f.x, t.z - f.z) > DUMMY_NEAR) return false;
      return true;
    });
  }

  /** Player inside this pirate's attack circle, or standing on them. */
  private contactThreat(d: Fighter): Fighter | null {
    const p = this.player;
    if (!p.alive) return null;
    const dist = Math.hypot(p.x - d.x, p.z - d.z);
    if (dist < 2.4 * UNIT || this.inReach(d, p)) return p;
    return null;
  }

  private dummyJob(d: Fighter): "hunt" | "seal" | "loot" {
    if (d.spawnIndex === 5) return "seal";
    if (d.spawnIndex === 0 || d.spawnIndex === 4) return "hunt";
    return "loot";
  }

  /** Swing or shoot on cooldown whenever someone is inside the radius. */
  private autoAttack(f: Fighter) {
    if (!f.alive || f.cooldown > 0 || this.mode !== "play") return;
    const { melee } = weaponReach(f.primary);
    if (!melee && f.ammo <= 0) return;
    const hits = this.reachHits(f);
    if (!hits.length) return;

    hits.sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z));
    const focus = hits[0];
    f.yaw = Math.atan2(focus.x - f.x, focus.z - f.z);
    const targets = melee ? hits : [focus];

    if (!melee) {
      f.ammo -= 1;
      f.cooldown = f.primary === "musket" ? 1.15 : 0.55;
    } else {
      f.cooldown = f.dummy ? DUMMY_MELEE_COOLDOWN : MELEE_COOLDOWN;
    }
    f.aim.pulse();
    const hear = !f.dummy || targets.some((t) => !t.dummy)
      ? 1
      : combatGain(Math.hypot(f.x - this.player.x, f.z - this.player.z));
    if (melee) {
      if (hear) sfxSwing(hear);
      if (f.rig) pirateSwing(f.rig, f.dummy ? DUMMY_MELEE_COOLDOWN : MELEE_COOLDOWN);
    } else {
      if (hear) sfxShot(f.primary === "musket", hear);
      if (f.rig) weaponBoom(f.rig);
      if (!f.dummy) this.shake = Math.max(this.shake, 0.34);
    }

    for (const t of targets) {
      const dist = Math.hypot(t.x - f.x, t.z - f.z);
      const fall =
        melee || dist < 8 * UNIT
          ? 1
          : f.primary === "musket"
            ? dist > 22 * UNIT
              ? 1
              : 0.55
            : dist > 22 * UNIT
              ? 0.45
              : 1;
      const dmg = melee
        ? f.dummy
          ? DUMMY_MELEE_DAMAGE
          : MELEE_DAMAGE
        : f.primary === "musket"
          ? (f.dummy ? DUMMY_MUSKET_DAMAGE : MUSKET_DAMAGE) * fall
          : (f.dummy ? DUMMY_FLINT_DAMAGE : FLINT_DAMAGE) * fall;
      this.hurt(t, dmg, f);
      if (t.dummy && hear && melee) sfxHit(hear);
    }
  }

  private hurt(t: Fighter, dmg: number, by: Fighter) {
    t.hp -= dmg;
    if (!t.dummy) {
      this.lastHit = this.elapsed;
      this.shake = 0.55;
      sfxHurt();
      this.clearHpHeal();
      document.getElementById("hp-wrap")?.classList.add("hurt");
      setTimeout(() => document.getElementById("hp-wrap")?.classList.remove("hurt"), 140);
    }
    if (t.dummy) t.extractHold = 0;
    if (t.rig) {
      flashPirate(t.mesh, true);
      setTimeout(() => flashPirate(t.mesh, false), t.hp <= 0 ? 480 : 160);
    } else {
      const mesh = t.mesh as THREE.Mesh;
      mesh.material = new THREE.MeshLambertMaterial({ color: 0xaa3333 });
      const restore = t.color;
      setTimeout(() => {
        if (t.alive) {
          (mesh.material as THREE.MeshLambertMaterial).color.setHex(restore);
        }
      }, 160);
    }
    if (t.hp <= 0) this.kill(t, by);
  }

  private kill(t: Fighter, _by: Fighter) {
    t.alive = false;
    t.corpse = true;
    t.dieT = 0;
    t.fallSide = Math.sin(Math.atan2(t.x - _by.x, t.z - _by.z) - t.yaw) >= 0 ? 1 : -1;
    t.hp = 0;
    t.aim.setVisible(false);
    if (t.hpPip) t.hpPip.visible = false;
    if (t.trophyIcon) t.trophyIcon.visible = false;
    if (t.marker) t.marker.visible = false;
    if (t.rig) pirateDie(t.rig);
    this.dropFrom(t);
    const hear = combatGain(Math.hypot(t.x - this.player.x, t.z - this.player.z));
    if (hear) sfxKill(t.dummy ? hear : 1);
    if (!t.dummy) this.flash("You have died");
    else if (!_by.dummy) {
      const name = t.pirate ? PIRATE_NAMES[t.pirate] : pirateCoat(t.color);
      this.flash(`Killed ${name}`);
    }
  }

  private dropFrom(t: Fighter) {
    const jitter = () => (Math.random() - 0.5) * 1.6 * UNIT;
    const gun = t.primary ?? t.bag;
    if (gun) this.spawnGround(t.x + jitter(), t.z + jitter(), { weapon: gun, ammo: t.ammo });
    if (t.trophy) this.spawnGround(t.x + jitter(), t.z + jitter(), { trophy: t.trophy });
    t.primary = null;
    t.bag = null;
    t.ammo = 0;
    t.trophy = null;
  }

  private spawnGround(
    x: number,
    z: number,
    item: { weapon?: WeaponId; ammo?: number; trophy?: TrophyId },
  ) {
    const y = deckHeight(x, z) + 0.95 * UNIT;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: item.trophy ? this.trophyTexture(item.trophy) : weaponTexture(item.weapon ?? null),
        transparent: true,
        depthTest: true,
      }),
    );
    sprite.scale.set(1.25 * UNIT, 1.25 * UNIT, 1);
    sprite.position.set(x, y, z);
    sprite.renderOrder = 7;
    this.scene.add(sprite);
    const hintPickup =
      item.weapon || item.trophy ? hintSprite("F to pick up", "#f4e4a4") : null;
    if (hintPickup) {
      hintPickup.position.set(x, y + 0.72 * UNIT, z);
      this.scene.add(hintPickup);
    }
    this.ground.push({ mesh: sprite, x, z, hintPickup, ...item });
  }

  private interact(dt: number) {
    const p = this.player;
    if (!p.alive) {
      document.getElementById("prompt")!.textContent =
        "Spectating — click a pirate for their kit · R restart";
      return;
    }
    const holding = this.keys.has("e");
    const zone = extractZone(this.phase(), p.x, p.z);
    let prompt = "";

    const nearCrate = this.containers.find(
      (c) =>
        c.spot.kind === "crate" &&
        Math.hypot(c.spot.x - p.x, c.spot.z - p.z) < PICKUP_RANGE,
    );
    const nearC = this.containers.find(
      (c) =>
        !c.opened &&
        c.spot.kind !== "crate" &&
        Math.hypot(c.spot.x - p.x, c.spot.z - p.z) < PICKUP_RANGE,
    );
    const nearG = this.ground.find(
      (g) => Math.hypot(g.x - p.x, g.z - p.z) < PICKUP_RANGE,
    );

    if (this.just.has("f") && nearG) this.takeGround(nearG);
    if (!zone && this.just.has("e")) {
      if (nearCrate && !nearCrate.opened) this.openContainer(nearCrate);
      else if (nearC) this.openContainer(nearC);
      else if (
        nearCrate?.opened &&
        (p.primary === "flintlock" || p.primary === "musket")
      ) {
        this.refillAmmo(p);
      }
    }

    if (zone) {
      prompt = `Hold E — extract on ${zone === "bell" ? "Fort Bell" : zone === "gull" ? "The Gull" : "The Wren"}`;
      if (nearG) prompt += " · F pick up";
      if (holding) {
        if (this.elapsed - this.lastHit < 0.35) {
          this.channel = 0;
          prompt = "Shot off the plank — channel reset";
        } else {
          this.channel += dt;
          prompt = `Extracting… ${(EXTRACT_CHANNEL - this.channel).toFixed(1)}s`;
          if (this.channel >= EXTRACT_CHANNEL) this.extract();
        }
      } else this.channel = 0;
    } else {
      this.channel = 0;
      const pier = pierWithoutShip(p.x, p.z);
      if (pier && this.phase() !== "closed") {
        prompt =
          pier === "gull"
            ? "The Gull is the green plank west of you — stand on it and hold E"
            : "The Wren is the green plank west of you — stand on it and hold E";
      } else if (nearG) prompt = "F — pick up";
      else if (nearCrate)
        prompt = nearCrate.opened
          ? this.gunNeedsReload(p)
            ? "E — reload"
            : ""
          : `E — open ${nearCrate.spot.id}`;
      else if (nearC)
        prompt =
          nearC.spot.kind === "trophy-chest"
            ? `E — open ${nearC.spot.id} (booty)`
            : `E — open ${nearC.spot.id}`;
    }

    const el = document.getElementById("prompt")!;
    el.textContent = prompt;
  }

  private updateLootHalos() {
    const p = this.player;
    const canGrab = p.alive && this.mode === "play";
    const t = this.elapsed;
    const pulse = 0.14 + 0.06 * (0.5 + 0.5 * Math.sin(t * 2.4));
    const wave = 0.5 + 0.5 * Math.sin(t * 2.1);
    for (const c of this.containers) {
      const openable = !c.opened;
      const dist = Math.hypot(c.spot.x - p.x, c.spot.z - p.z);
      const near = canGrab && openable && dist < PICKUP_RANGE;
      const reload =
        canGrab &&
        c.opened &&
        c.spot.kind === "crate" &&
        dist < PICKUP_RANGE &&
        this.gunNeedsReload(p);
      shineOutline(c.mesh, openable || reload ? wave : 0, reload ? "reload" : "loot");
      glowLoot(c.mesh, near || reload ? pulse : 0, reload ? RELOAD_GLOW : LOOT_GLOW);
      if (c.hintReload) c.hintReload.visible = c.opened && this.gunNeedsReload(p);
    }
    for (const g of this.ground) {
      const near = canGrab && Math.hypot(g.x - p.x, g.z - p.z) < PICKUP_RANGE;
      const sprite = g.mesh as THREE.Sprite;
      if (sprite.isSprite) {
        const s = (1.15 + (near ? pulse * 2.4 : 0.08 * Math.sin(t * 2.1))) * UNIT;
        sprite.scale.set(s, s, 1);
        continue;
      }
      glowLoot(g.mesh, near ? pulse : 0);
    }
  }

  private takeGround(g: GroundItem, f: Fighter = this.player) {
    if (g.weapon) {
      const owned = f.primary ?? f.bag;
      if (owned) this.spawnGround(f.x, f.z + 1.2 * UNIT, { weapon: owned, ammo: f.ammo });
      f.primary = g.weapon;
      f.bag = null;
      f.ammo = g.ammo ?? 0;
    }
    if (g.trophy) {
      if (f.trophy) this.spawnGround(f.x + 1.2 * UNIT, f.z, { trophy: f.trophy });
      f.trophy = g.trophy;
    }
    if (g.ammo && !g.weapon) f.ammo += g.ammo;
    if (!f.dummy) {
      if (g.weapon) this.flash(`Picked up ${weaponName(g.weapon)}`);
      else if (g.trophy) this.flash(`Picked up ${trophyName(g.trophy)}`);
      else if (g.ammo) this.flash("Picked up ammo");
      sfxPickup();
    }
    this.scene.remove(g.mesh);
    if (g.hintPickup) this.scene.remove(g.hintPickup);
    this.ground = this.ground.filter((x) => x !== g);
  }

  private magSize(f: Fighter): number {
    const gun = f.primary ?? f.bag;
    if (gun === "musket") return MUSKET_AMMO;
    if (gun === "flintlock") return FLINT_AMMO;
    return 0;
  }

  private gunNeedsReload(f: Fighter | undefined): boolean {
    if (!f?.alive) return false;
    const gun = f.primary ?? f.bag;
    if (gun !== "flintlock" && gun !== "musket") return false;
    const cap = this.magSize(f);
    return cap > 0 && f.ammo < cap;
  }

  private refillAmmo(f: Fighter, announce = true): boolean {
    const gun = f.primary ?? f.bag;
    if (!gun) return false;
    const cap = this.magSize(f);
    const was = f.ammo;
    f.ammo = Math.max(f.ammo, cap);
    const gained = f.ammo > was;
    if (gained && !f.dummy) sfxReload();
    if (!announce || f.dummy) return gained;
    if (gained) this.flash(`${weaponName(gun)} topped up.`);
    return gained;
  }

  private openContainer(c: LootBox, f: Fighter = this.player) {
    this.setContainerOpen(c, true);
    if (!f.dummy) this.flash(`Opened ${containerLabel(c.spot.kind)}`);
    if (!f.dummy) sfxOpen();
    const roll = c.loot;
    if (c.spot.id === "R2") {
      roll.weapon = "musket";
      roll.ammo = MUSKET_AMMO;
    }
    if (roll.rum) {
      const before = f.hp;
      f.hp = Math.min(PLAYER_HP, f.hp + 28);
      if (!f.dummy && f.hp > before) this.pulseHpHeal(before);
    }
    if (c.spot.kind === "crate") {
      const gun = f.primary ?? f.bag;
      if (gun) this.refillAmmo(f, false);
    } else if (roll.ammo && !roll.weapon) {
      f.ammo += roll.ammo;
    }
    if (roll.weapon) this.spawnGround(c.spot.x, c.spot.z + UNIT * 1.5, { weapon: roll.weapon, ammo: roll.ammo });
    if (roll.trophy) this.spawnGround(c.spot.x + UNIT * 1.5, c.spot.z, { trophy: roll.trophy });
  }

  private extract() {
    this.mode = "extracted";
    this.extractedFrom = this.island;
    this.extractedTrophy = this.player.trophy;
    if (this.player.trophy) this.addStash(this.player.trophy);
    this.player.trophy = null;
    if (this.island < 5) {
      this.island = nextIsland(this.island);
      if (this.island > this.unlocked) this.unlocked = this.island;
    }
    this.persist();
    this.rebuildIsland();
    paintTrophyCard(document.getElementById("trophy-card")!, null);
    this.hideAims();
    sfxExtract();
    this.showOverlay("You got out!", "");
  }

  private navyMissed(): string {
    if (!this.player.alive) return "Match over.";
    const pier = pierWithoutShip(this.player.x, this.player.z);
    if (pier === "gull") {
      return `The Gull left ${pierLabel("gull")}. Extract is the green plank at the seaward end — hold E before 0:00.`;
    }
    if (pier === "wren") {
      return `The Wren left ${pierLabel("wren")}. Extract is the green plank at the seaward end — hold E before 0:00.`;
    }
    return "You were still on the dock. The ships left without you.";
  }

  private showOverlay(title: string, body: string) {
    this.overlayView = "summary";
    this.closeCraftPop();
    document.getElementById("overlay-panel")!.classList.remove("flipped");
    document.getElementById("overlay")!.classList.remove("hidden");
    document.getElementById("overlay-title")!.textContent = title;
    document.getElementById("overlay-title")!.classList.remove("select-heading");
    const bodyEl = document.getElementById("overlay-body")!;
    bodyEl.textContent = body;
    bodyEl.classList.toggle("hidden", !body);
    const stashLine = document.getElementById("stash-line")!;
    stashLine.classList.remove("hidden");
    stashLine.textContent =
      this.mode === "extracted" ? this.extractLine() : this.stashLine();
    document.getElementById("island-block")!.classList.add("hidden");
    document.getElementById("select-pane")!.classList.add("hidden");
    document.getElementById("extract-trophy")!.classList.toggle("hidden", this.mode !== "extracted");
    this.renderStash();
    paintTrophyCard(
      document.getElementById("extract-trophy")!,
      this.mode === "extracted" ? this.extractedTrophy : null,
    );
    document.getElementById("again-btn")!.textContent = "Choose pirate";
    startMenuMusic();
  }

  private showSelect() {
    this.mode = "select";
    this.overlayView = "select";
    this.closeCraftPop();
    document.getElementById("overlay")!.classList.remove("hidden");
    document.getElementById("overlay-panel")!.classList.remove("flipped");
    document.getElementById("overlay-title")!.textContent = "Choose your pirate";
    document.getElementById("overlay-title")!.classList.add("select-heading");
    const bodyEl = document.getElementById("overlay-body")!;
    bodyEl.textContent = "";
    bodyEl.classList.add("hidden");
    const stashLine = document.getElementById("stash-line")!;
    const empty = this.stashEmpty();
    stashLine.textContent = empty
      ? "Pick who you take in. Extract booty to craft skins. Extracting unlocks the next island."
      : "";
    stashLine.classList.toggle("hidden", !empty);
    document.getElementById("extract-trophy")!.classList.add("hidden");
    document.getElementById("island-block")!.classList.remove("hidden");
    document.getElementById("select-pane")!.classList.remove("hidden");
    document.getElementById("again-btn")!.textContent = `Enter ${islandName(this.island)}`;
    this.renderStash();
    this.renderIslands();
    this.renderOwned();
    this.applyHudSkin();
    startMenuMusic();
  }

  private showCraft() {
    this.overlayView = "craft";
    this.closeCraftPop();
    document.getElementById("overlay-panel")!.classList.add("flipped");
    this.renderCraft();
  }

  private loadoutName(): string {
    if (this.equipped) return SKINS[this.equipped].name;
    return PIRATE_NAMES[this.pickedPirate];
  }

  private pickCard(selected: boolean): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pick-card";
    btn.classList.toggle("equipped", selected);
    return btn;
  }

  private renderOwned() {
    const root = document.getElementById("owned-skins")!;
    root.replaceChildren();
    for (const id of PLAYABLE_PIRATES) {
      const btn = this.pickCard(!this.equipped && this.pickedPirate === id);
      btn.dataset.pickPirate = id;
      btn.title = PIRATE_NAMES[id];
      const face = document.createElement("span");
      face.className = "pick-face";
      face.style.backgroundImage = `url(${PIRATE_ART[id]})`;
      const label = document.createElement("span");
      label.className = "pick-label";
      label.textContent = PIRATE_NAMES[id];
      btn.append(face, label);
      root.appendChild(btn);
    }
    for (const id of Object.keys(SKINS) as SkinId[]) {
      if (!this.owned.has(id)) continue;
      const skin = SKINS[id];
      const btn = this.pickCard(this.equipped === id);
      btn.dataset.equip = id;
      btn.title = skin.name;
      const face = document.createElement("span");
      face.className = "pick-face";
      if (skin.pfp) face.style.backgroundImage = `url(${skin.pfp})`;
      const label = document.createElement("span");
      label.className = "pick-label";
      label.textContent = skin.name;
      btn.append(face, label);
      root.appendChild(btn);
    }
    document.getElementById("skins-line")!.textContent = `Selected: ${this.loadoutName()}`;
  }

  private renderIslands() {
    const root = document.getElementById("island-picks")!;
    root.replaceChildren();
    for (const id of ISLAND_IDS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "island-pick";
      btn.dataset.island = String(id);
      const locked = id > this.unlocked;
      btn.classList.toggle("equipped", id === this.island && !locked);
      btn.classList.toggle("locked", locked);
      btn.disabled = locked;
      btn.title = locked ? `Extract from ${islandName((id - 1) as IslandId)} to unlock` : ISLANDS[id].name;
      const num = document.createElement("span");
      num.className = "island-num";
      num.textContent = String(id);
      const label = document.createElement("span");
      label.className = "island-name";
      label.textContent = locked ? "Locked" : ISLANDS[id].name;
      btn.append(num, label);
      root.appendChild(btn);
    }
  }

  private renderCraft() {
    const root = document.getElementById("craft-list")!;
    root.replaceChildren();
    let shown = 0;
    for (const id of CRAFT_SKINS) {
      const skin = SKINS[id];
      if (!skin.need) continue;
      if (this.owned.has(id)) continue;
      const btn = this.pickCard(false);
      btn.dataset.craft = id;
      btn.title = skin.name;
      const face = document.createElement("span");
      face.className = "pick-face";
      if (skin.pfp) face.style.backgroundImage = `url(${skin.pfp})`;
      const label = document.createElement("span");
      label.className = "pick-label";
      label.textContent = skin.name;
      btn.append(face, label);
      root.appendChild(btn);
      shown += 1;
    }
    if (!shown) {
      const empty = document.createElement("p");
      empty.className = "craft-empty";
      empty.textContent = "Every Pirate Nation skin on the list is already on your shelf.";
      root.appendChild(empty);
    }
  }

  private openCraftPop(id: SkinId) {
    const skin = SKINS[id];
    if (!skin?.need) return;
    this.craftFocus = id;
    const pop = document.getElementById("craft-pop")!;
    pop.classList.remove("hidden");
    const face = document.getElementById("craft-pop-face")!;
    face.style.backgroundImage = skin.pfp ? `url(${skin.pfp})` : "";
    document.getElementById("craft-pop-name")!.textContent = skin.name;
    const blurb = document.getElementById("craft-pop-blurb")!;
    blurb.textContent = skin.blurb ?? "";
    blurb.classList.toggle("hidden", !skin.blurb);
    const afford = canAfford(this.stash, skin.need);
    const needEl = document.getElementById("craft-pop-need")!;
    needEl.replaceChildren();
    const prefix = document.createElement("span");
    prefix.className = "need-prefix";
    prefix.textContent = afford ? `${skin.recipe} ·` : "Need";
    needEl.append(prefix);
    for (const [i, part] of needStatus(this.stash, skin.need).entries()) {
      const { id, have } = part;
      if (i > 0) needEl.append(" + ");
      const item = document.createElement("span");
      item.className = have ? "need-item have" : "need-item lack";
      item.title = have ? `Have ${trophyName(id)}` : `Need ${trophyName(id)}`;
      const art = document.createElement("span");
      art.className = "need-art";
      art.style.backgroundImage = `url("${trophyArt(id)}")`;
      const name = document.createElement("span");
      name.className = "need-name";
      name.textContent = trophyName(id);
      item.append(art, name);
      needEl.append(item);
    }
    const btn = document.getElementById("craft-pop-btn") as HTMLButtonElement;
    btn.disabled = !afford || this.owned.has(id);
    btn.textContent = this.owned.has(id) ? "Owned" : afford ? "Craft" : "Not enough Booty";
  }

  private closeCraftPop() {
    this.craftFocus = null;
    document.getElementById("craft-pop")?.classList.add("hidden");
  }

  private addStash(id: TrophyId) {
    this.stash[id] = (this.stash[id] ?? 0) + 1;
    this.persist();
  }

  private persist() {
    saveProgress({
      stash: this.stash,
      owned: [...this.owned],
      equipped: this.equipped,
      pirate: this.pickedPirate,
      island: this.island,
      unlocked: this.unlocked,
    });
  }

  private extractLine(): string {
    const from = islandName(this.extractedFrom);
    const booty = this.extractedTrophy
      ? ` with a ${trophyName(this.extractedTrophy)}`
      : "";
    if (this.extractedFrom < 5) {
      return `You got out of ${from}${booty}. Next island: ${islandName(this.island)}.`;
    }
    return `You got out of ${from}${booty}.`;
  }

  private stashEmpty(): boolean {
    return !Object.values(this.stash).some((n) => n);
  }

  private stashLine(): string {
    const bits: string[] = [];
    for (const [id, count] of Object.entries(this.stash)) {
      if (!count) continue;
      bits.push(`${count}× ${trophyName(id as TrophyId)}`);
    }
    return bits.length ? bits.join(" · ") : "No booty on the shelf.";
  }

  private renderStash() {
    const block = document.getElementById("stash-block")!;
    const root = document.getElementById("stash-shelf")!;
    root.replaceChildren();
    if (this.overlayView !== "select") {
      block.classList.add("hidden");
      return;
    }
    for (const [id, count] of Object.entries(this.stash)) {
      if (!count) continue;
      const tid = id as TrophyId;
      const edge = trophyRarityColor(tid);
      const chip = document.createElement("div");
      chip.className = "stash-chip";
      chip.style.borderColor = edge;
      chip.setAttribute("aria-label", `${trophyName(tid)}, ${trophyRarity(tid)}`);
      const img = document.createElement("span");
      img.className = "stash-art";
      img.style.backgroundImage = `url("${trophyArt(tid)}")`;
      const n = document.createElement("span");
      n.className = "stash-count";
      n.textContent = `${count}`;
      const tip = document.createElement("span");
      tip.className = "stash-tip";
      const tipName = document.createElement("span");
      tipName.className = "stash-tip-name";
      tipName.textContent = trophyName(tid);
      const tipRarity = document.createElement("span");
      tipRarity.className = "stash-tip-rarity";
      tipRarity.textContent = trophyRarity(tid);
      tipRarity.style.color = edge;
      tip.append(tipName, tipRarity);
      chip.append(img, n, tip);
      root.appendChild(chip);
    }
    block.classList.toggle("hidden", !root.childElementCount);
  }

  private craft(id: SkinId) {
    const skin = SKINS[id];
    if (!skin?.need) return;
    if (this.owned.has(id)) return;
    if (!canAfford(this.stash, skin.need)) return;
    consumeNeed(this.stash, skin.need);
    this.owned.add(id);
    this.equipSkin(id);
    this.persist();
    sfxCraft();
    this.flash(`${skin.name} — your PFP.`);
    const stashLine = document.getElementById("stash-line")!;
    stashLine.classList.remove("hidden");
    stashLine.textContent = `${skin.name} from ${needLabel(skin.need)}.`;
    this.renderStash();
    this.renderOwned();
    this.renderCraft();
    this.closeCraftPop();
  }

  private equipPirate(id: PirateId) {
    this.pickedPirate = id;
    this.equipped = null;
    if (this.player && this.mode === "select") this.spawnPlayer(this.player.spawnIndex);
    else if (this.player) this.paintSkin(this.player);
    this.applyHudSkin();
    this.renderOwned();
    this.persist();
  }

  private equipSkin(id: SkinId) {
    if (!this.owned.has(id)) return;
    this.equipped = id;
    this.pickedPirate = "rustbeard";
    if (this.player && this.mode === "select") this.spawnPlayer(this.player.spawnIndex);
    else if (this.player) this.paintSkin(this.player);
    this.applyHudSkin();
    this.renderOwned();
    this.persist();
  }

  private applyHudSkin() {
    const skin = this.equipped ? SKINS[this.equipped] : null;
    const el = document.getElementById("portrait")!;
    el.className = "";
    el.title = this.loadoutName();
    el.style.borderColor = `#${markerColor(skin).toString(16).padStart(6, "0")}`;
    if (skin?.pfp) {
      el.style.background = `center / cover url("${skin.pfp}")`;
      el.classList.add("has-pfp");
    } else {
      el.style.background = `center / cover url("${PIRATE_ART[this.pickedPirate]}")`;
      el.classList.add("has-pfp");
    }
    document.getElementById("portrait-name")!.textContent = this.loadoutName();
  }

  private paintSkin(f: Fighter) {
    const skin = this.equipped ? SKINS[this.equipped] : null;
    f.color = skin?.color ?? 0xe8d5a3;
    f.mesh.userData.base = f.color;
    if (f.marker) {
      (f.marker.material as THREE.MeshBasicMaterial).color.setHex(markerColor(skin));
    }
  }

  private resetDummy(d: Fighter) {
    const s = SPAWNS[d.spawnIndex] ?? SPAWNS[0] ?? { x: 0, z: 0 };
    d.alive = true;
    d.corpse = false;
    d.dieT = 0;
    d.fallSide = 1;
    d.hp = PLAYER_HP;
    d.x = s.x;
    d.z = s.z;
    d.yaw = 0;
    d.primary = d.spawnIndex === 7 ? "flintlock" : null;
    d.bag = null;
    d.ammo = d.spawnIndex === 7 ? FLINT_AMMO : 0;
    d.trophy = d.spawnIndex === 7 ? "wood" : null;
    d.cooldown = 1.4;
    d.rummage = 0;
    d.lootReadyAt =
      d.spawnIndex === 7
        ? this.elapsed
        : this.elapsed + (d.spawnIndex === 5 ? 1.1 : 1.8 + d.spawnIndex * 1.5) + Math.random() * 2;
    d.extractHold = 0;
    d.nav = emptyNav();
    d.wanderT = 0;
    d.tx = s.x;
    d.tz = s.z;
    d.y = standHeight(s.x, s.z);
    d.vy = 0;
    d.grounded = true;
    d.jumpCool = 0;
    d.px = s.x;
    d.pz = s.z;
    d.mesh.rotation.x = 0;
    d.mesh.rotation.z = 0;
    if (!d.rig) {
      (d.mesh as THREE.Mesh).material = new THREE.MeshLambertMaterial({ color: d.color });
    } else {
      resetPirateLive(d.rig);
      flashPirate(d.mesh, false);
    }
    this.placeFighter(d);
    this.syncAim(d);
  }

  private startMatch() {
    if (!this.ready || !this.player) return;
    document.getElementById("overlay")!.classList.add("hidden");
    document.getElementById("overlay-panel")!.classList.remove("flipped");
    this.closeCraftPop();
    this.mode = "play";
    this.elapsed = 0;
    this.channel = 0;
    this.lastHit = -10;
    this.clearHpHeal();
    for (const g of this.ground) {
      this.scene.remove(g.mesh);
      if (g.hintPickup) this.scene.remove(g.hintPickup);
    }
    this.ground = [];
    for (const c of this.containers) this.setContainerOpen(c, false);
    for (const d of this.dummies) this.resetDummy(d);
    this.spawnPlayer(2);
    this.inspect = null;
    this.extractToastDismissed = false;
    this.navyStingAt = -1;
    this.refillContainers();
    this.paintIsland();
    this.syncExtractToast();
    unlockAudio();
    startMatchAudio();
  }

  private flash(msg: string) {
    this.toast = msg;
    this.toastUntil = this.elapsed + 3;
  }

  private syncExtractToast() {
    const el = document.getElementById("extract-toast")!;
    const hud = document.getElementById("hud")!;
    const show =
      this.mode === "play" && !this.extractToastDismissed && this.elapsed >= EXTRACT_OPEN_AT;
    el.classList.toggle("hidden", !show);
    hud.classList.toggle("has-extract-toast", show);
    if (!show) return;
    document.getElementById("extract-toast-msg")!.textContent =
      this.elapsed >= BELL_OPEN_AT
        ? "Extract on The Gull, The Wren, or Fort Bell. Hold E on the gold area."
        : `Extract on The Gull (${pierLabel("gull")}) or The Wren (${pierLabel("wren")}). Hold E on the gold area.`;
  }

  private dummyBrain(d: Fighter, dt: number) {
    if (!d.alive) return;
    if (d.primary && d.ammo <= 0) this.holsterGun(d);
    else if (d.bag && d.ammo > 0) this.drawGun(d);

    const job = this.dummyJob(d);
    const player = this.player.alive ? this.player : null;
    const pDist = player ? Math.hypot(player.x - d.x, player.z - d.z) : 999;
    const poked = this.contactThreat(d);
    const needsGun = !d.primary || d.ammo <= 1;
    const lastMinute = MATCH_SECONDS - this.elapsed <= EXTRACT_CAMP_SECONDS;
    const leaving = !!d.trophy || lastMinute;

    if (player && this.shouldFlee(d, player, pDist)) {
      this.dummyFlee(d, player, pDist, dt);
      return;
    }

    if (leaving) {
      if (needsGun && this.dummyTryLoot(d, dt)) return;
      if (!d.trophy && job !== "hunt" && this.dummyTryTrophy(d, dt, 28)) return;
      this.dummyCampExtract(d, dt, player, pDist);
      return;
    }

    if (needsGun) {
      if (this.dummyTryLoot(d, dt)) return;
    }

    if (poked) {
      const chase = job === "hunt" && this.elapsed >= HUNT_AFTER;
      if (this.dummyFight(d, poked, pDist, dt, chase)) return;
    }

    if (job === "seal" && !d.trophy) {
      if (this.dummyTryTrophy(d, dt)) return;
    }

    if ((job === "loot" || (job === "hunt" && this.elapsed < HUNT_AFTER)) && d.primary && !d.trophy) {
      if (this.dummyTryTrophy(d, dt)) return;
    }

    if (job === "hunt" && d.primary && player && this.elapsed >= HUNT_AFTER) {
      this.dummyFight(d, player, pDist, dt, true);
      return;
    }

    if (needsGun && this.dummyTryLoot(d, dt)) return;
    if (!d.trophy && this.dummyTryTrophy(d, dt)) return;
    if (job === "hunt" && player && this.elapsed >= HUNT_AFTER) {
      this.dummySteer(d, player.x, player.z, dt, 0.5);
      return;
    }
    this.dummyCampExtract(d, dt, player, pDist);
  }

  private shouldFlee(d: Fighter, enemy: Fighter, dist: number): boolean {
    if (enemy.dummy || !this.player.alive) return false;
    const job = this.dummyJob(d);
    if (d.trophy && dist < 20 * UNIT && dist > 4.5 * UNIT) return true;
    if (d.hp < PLAYER_HP * 0.4 && dist < 16 * UNIT && dist > 4.5 * UNIT) return true;
    if (job === "hunt") return false;
    const mine = this.shotRange(d);
    const theirs = this.shotRange(enemy);
    if (mine >= theirs) return false;
    if (dist > theirs + 5 * UNIT) return false;
    return this.canSee(d, enemy) || dist < 10 * UNIT;
  }

  private dummyFlee(d: Fighter, enemy: Fighter, dist: number, dt: number) {
    const keep =
      walkClear(d.tx, d.tz) &&
      Math.hypot(d.tx - d.x, d.tz - d.z) > 3.5 * UNIT &&
      Math.hypot(d.tx - enemy.x, d.tz - enemy.z) > dist + UNIT;
    const goal = keep
      ? { x: d.tx, z: d.tz }
      : pickFleePoint(d.x, d.z, enemy.x, enemy.z, d.spawnIndex % 2 === 0 ? 1 : -1);
    d.tx = goal.x;
    d.tz = goal.z;
    this.dummySteer(d, goal.x, goal.z, dt, 0.95);
  }

  /** True if this pirate is busy fighting instead of looting. */
  private dummyFight(d: Fighter, enemy: Fighter, dist: number, dt: number, chase: boolean): boolean {
    d.yaw = Math.atan2(enemy.x - d.x, enemy.z - d.z);
    if (!chase && this.inReach(d, enemy)) return true;
    if (!chase && dist > 4.2 * UNIT && dist < 16 * UNIT) {
      const keep =
        walkClear(d.tx, d.tz) &&
        Math.hypot(d.tx - d.x, d.tz - d.z) > 0.8 * UNIT &&
        Math.hypot(d.tx - enemy.x, d.tz - enemy.z) > 2.4 * UNIT;
      const hide = keep ? { x: d.tx, z: d.tz } : this.dummyHidePoint(d, enemy);
      if (hide) {
        d.tx = hide.x;
        d.tz = hide.z;
        this.dummySteer(d, hide.x, hide.z, dt, 0.88, false);
        return true;
      }
    }
    if (chase) {
      if (enemy.y > d.y + 0.4 * UNIT && dist < 6 * UNIT && d.grounded) this.tryJump(d);
      if (dist > 3.2 * UNIT) this.dummySteer(d, enemy.x, enemy.z, dt, 0.7, false);
      else {
        const side = d.spawnIndex % 2 === 0 ? 1 : -1;
        this.dummySteer(
          d,
          d.x - (enemy.z - d.z) * side,
          d.z + (enemy.x - d.x) * side,
          dt,
          0.42,
          false,
        );
      }
      return true;
    }
    return dist < 4.2 * UNIT;
  }

  private dummyHidePoint(d: Fighter, enemy: Fighter): { x: number; z: number } | null {
    let best: { x: number; z: number } | null = null;
    let bestScore = 1e9;
    for (const c of COVER) {
      if (!c.los) continue;
      const cx = c.rect.x + c.rect.w / 2;
      const cz = c.rect.z + c.rect.d / 2;
      const dist = Math.hypot(cx - d.x, cz - d.z);
      if (dist > 11 * UNIT || dist < 1.2 * UNIT) continue;
      const ex = cx - enemy.x;
      const ez = cz - enemy.z;
      const len = Math.hypot(ex, ez) || 1;
      const pad = Math.max(c.rect.w, c.rect.d) * 0.5 + 1.15 * UNIT;
      const px = cx + (ex / len) * pad;
      const pz = cz + (ez / len) * pad;
      const gy = standHeight(px, pz);
      if (!isWalkable(px, pz) || coverBlocked(px, pz, gy)) continue;
      const toE = Math.hypot(enemy.x - px, enemy.z - pz);
      if (toE < 2.5) continue;
      if (!blockedByWall(px, pz, (enemy.x - px) / toE, (enemy.z - pz) / toE, toE - 0.4)) continue;
      const score = dist + Math.hypot(px - d.x, pz - d.z) * 0.3;
      if (score < bestScore) {
        bestScore = score;
        best = { x: px, z: pz };
      }
    }
    return best;
  }

  private dummyExtractPad(d: Fighter): { x: number; z: number } {
    if (d.spawnIndex === 7) return rectCenter(EXTRACT_GULL);
    if (d.spawnIndex === 3) return rectCenter(EXTRACT_WREN);
    if (d.spawnIndex === 5) return rectCenter(EXTRACT_BELL);
    const pads = [rectCenter(EXTRACT_GULL), rectCenter(EXTRACT_WREN)];
    if (this.phase() === "bell") pads.push(rectCenter(EXTRACT_BELL));
    let best = pads[0];
    let bestD = 1e9;
    for (const p of pads) {
      const dist = Math.hypot(p.x - d.x, p.z - d.z);
      if (dist < bestD) {
        bestD = dist;
        best = p;
      }
    }
    return best;
  }

  private dummyCampExtract(d: Fighter, dt: number, enemy: Fighter | null, _dist: number) {
    const pad = this.dummyExtractPad(d);
    d.tx = pad.x;
    d.tz = pad.z;
    const toPad = Math.hypot(d.x - pad.x, d.z - pad.z);
    const poked = this.contactThreat(d);
    const pDist = enemy ? Math.hypot(enemy.x - d.x, enemy.z - d.z) : 999;
    const mark = poked ?? (enemy && pDist < 16 * UNIT ? enemy : null);
    const markDist = mark ? Math.hypot(mark.x - d.x, mark.z - d.z) : 999;
    if (mark) {
      d.extractHold = 0;
      const chase = !mark.dummy && markDist < 10 * UNIT && toPad < 8 * UNIT;
      if (this.dummyFight(d, mark, markDist, dt, chase)) return;
      if (toPad > 2.4 * UNIT) this.dummySteer(d, pad.x, pad.z, dt, 0.55);
      if (markDist < 6 * UNIT) return;
    }
    if (toPad > 1.8 * UNIT) {
      d.extractHold = 0;
      this.dummySteer(d, pad.x, pad.z, dt, 0.72);
      return;
    }
    const zone = extractZone(this.phase(), d.x, d.z);
    if (!zone) {
      d.extractHold = 0;
      return;
    }
    d.extractHold += dt;
    if (d.extractHold >= EXTRACT_CHANNEL) this.dummyExtractOut(d, zone);
  }

  private dummyExtractOut(d: Fighter, zone: "gull" | "wren" | "bell") {
    d.alive = false;
    d.corpse = false;
    d.mesh.visible = false;
    d.aim.setVisible(false);
    if (d.hpPip) d.hpPip.visible = false;
    if (d.trophyIcon) d.trophyIcon.visible = false;
    d.primary = null;
    d.bag = null;
    d.ammo = 0;
    d.trophy = null;
    const ship = zone === "bell" ? "Fort Bell" : zone === "gull" ? "The Gull" : "The Wren";
    this.flash(`A pirate extracted on ${ship}.`);
  }

  private weaponRank(w: Primary): number {
    if (w === "musket") return 2;
    if (w === "flintlock") return 1;
    return 0;
  }

  private lootClaimed(x: number, z: number, self: Fighter): boolean {
    return this.dummies.some(
      (o) =>
        o !== self &&
        o.alive &&
        Math.hypot(o.tx - x, o.tz - z) < 2.5 &&
        Math.hypot(o.x - x, o.z - z) < 14,
    );
  }

  private dummyTryLoot(d: Fighter, dt: number): boolean {
    if (this.elapsed < d.lootReadyAt) return false;

    const owned = d.primary ?? d.bag;
    const unarmed = !d.primary;
    const needsAmmo = !!owned && d.ammo <= 1;
    const nearbyMusket = this.nearbyMusket(d, 18);
    const wantsMusket = owned === "flintlock" && nearbyMusket;
    if (!unarmed && !needsAmmo && !wantsMusket) return false;

    let bestX = 0;
    let bestZ = 0;
    let bestD = 1e9;
    let ground: GroundItem | null = null;
    let crate: (typeof this.containers)[number] | null = null;

    for (const g of this.ground) {
      if (g.weapon) {
        if (this.weaponRank(g.weapon) <= this.weaponRank(owned)) continue;
      } else if (!(needsAmmo && g.ammo)) continue;
      if (this.lootClaimed(g.x, g.z, d)) continue;
      const dist = Math.hypot(g.x - d.x, g.z - d.z);
      if (dist < bestD) {
        bestD = dist;
        bestX = g.x;
        bestZ = g.z;
        ground = g;
        crate = null;
      }
    }

    if (unarmed || needsAmmo || wantsMusket) {
      for (const c of this.containers) {
        if (c.opened && (c.spot.kind !== "crate" || !needsAmmo)) continue;
        if (c.spot.kind === "trophy-chest") continue;
        if (this.lootClaimed(c.spot.x, c.spot.z, d)) continue;
        if (wantsMusket && !unarmed && !needsAmmo && c.spot.id !== "R2") continue;
        const dist = Math.hypot(c.spot.x - d.x, c.spot.z - d.z);
        const bonus = c.spot.kind === "crate" && (needsAmmo || unarmed) ? -8 : 0;
        const score = dist + bonus;
        if (score < bestD) {
          bestD = score;
          bestX = c.spot.x;
          bestZ = c.spot.z;
          crate = c;
          ground = null;
        }
      }
    }

    if (bestD > 1e8) return false;
    const dist = Math.hypot(d.x - bestX, d.z - bestZ);
    d.tx = bestX;
    d.tz = bestZ;
    if (dist > PICKUP_RANGE) {
      const stand = lootStand(bestX, bestZ);
      d.rummage = 0;
      if (Math.hypot(d.x - stand.x, d.z - stand.z) < 0.45 * UNIT) {
        d.wanderT = 0;
        d.lootReadyAt = this.elapsed + 3;
        return false;
      }
      return this.dummyGoTo(d, stand.x, stand.z, dt, 0.62);
    }
    d.wanderT = 0;
    d.rummage += dt;
    const hold = ground ? 0.45 : 0.7;
    if (d.rummage < hold) return true;
    d.rummage = 0;
    if (ground) this.takeGround(ground, d);
    else if (crate) {
      if (crate.opened) this.refillAmmo(d);
      else this.openContainer(crate, d);
    }
    return true;
  }

  private dummyTryTrophy(d: Fighter, dt: number, maxDist = 1e4): boolean {
    if (d.trophy || this.elapsed < d.lootReadyAt) return false;

    let bestX = 0;
    let bestZ = 0;
    let bestD = 1e9;
    let ground: GroundItem | null = null;
    let crate: (typeof this.containers)[number] | null = null;

    for (const g of this.ground) {
      if (!g.trophy) continue;
      if (d.spawnIndex === 5 && trophyTier(g.trophy) < 3) continue;
      if (this.lootClaimed(g.x, g.z, d)) continue;
      const dist = Math.hypot(g.x - d.x, g.z - d.z);
      if (dist > maxDist) continue;
      if (dist < bestD) {
        bestD = dist;
        bestX = g.x;
        bestZ = g.z;
        ground = g;
        crate = null;
      }
    }

    for (const c of this.containers) {
      if (c.opened) continue;
      if (c.spot.kind === "crate") continue;
      if (d.spawnIndex === 5 && c.spot.kind !== "chest") continue;
      if (this.lootClaimed(c.spot.x, c.spot.z, d)) continue;
      const dist = Math.hypot(c.spot.x - d.x, c.spot.z - d.z);
      if (dist > maxDist) continue;
      const bonus =
        c.spot.kind === "chest" ? -18 : c.spot.kind === "trophy-chest" ? -12 : c.spot.kind === "lockbox" ? -6 : 0;
      const score = dist + bonus;
      if (score < bestD) {
        bestD = score;
        bestX = c.spot.x;
        bestZ = c.spot.z;
        crate = c;
        ground = null;
      }
    }

    if (bestD > 1e8) return false;
    const dist = Math.hypot(d.x - bestX, d.z - bestZ);
    d.tx = bestX;
    d.tz = bestZ;
    if (dist > PICKUP_RANGE) {
      const stand = lootStand(bestX, bestZ);
      d.rummage = 0;
      if (Math.hypot(d.x - stand.x, d.z - stand.z) < 0.45 * UNIT) {
        d.wanderT = 0;
        d.lootReadyAt = this.elapsed + 3;
        return false;
      }
      return this.dummyGoTo(d, stand.x, stand.z, dt, 0.62);
    }
    d.wanderT = 0;
    d.rummage += dt;
    const hold = ground ? 0.45 : 0.7;
    if (d.rummage < hold) return true;
    d.rummage = 0;
    if (ground) this.takeGround(ground, d);
    else if (crate) this.openContainer(crate, d);
    return true;
  }

  private nearbyMusket(d: Fighter, radius: number): boolean {
    if (this.ground.some((g) => g.weapon === "musket" && Math.hypot(g.x - d.x, g.z - d.z) < radius)) {
      return true;
    }
    return this.containers.some(
      (c) => !c.opened && c.spot.id === "R2" && Math.hypot(c.spot.x - d.x, c.spot.z - d.z) < radius,
    );
  }

  private dummyGoTo(d: Fighter, x: number, z: number, dt: number, speed: number): boolean {
    const before = Math.hypot(x - d.x, z - d.z);
    if (before < 0.35) {
      d.wanderT = 0;
      return true;
    }
    this.dummySteer(d, x, z, dt, speed);
    const after = Math.hypot(x - d.x, z - d.z);
    if (after < before - 0.02) {
      d.wanderT = 0;
      return true;
    }
    d.wanderT += dt;
    if (d.wanderT > 0.45) this.dummyMaybeJump(d);
    if (d.wanderT < 0.9) return true;
    d.wanderT = 0;
    d.nav.path = [];
    d.lootReadyAt = this.elapsed + 3;
    return false;
  }

  private dummySteer(d: Fighter, x: number, z: number, dt: number, speed: number, face = true) {
    const step = PLAYER_SPEED * Math.min(1, speed) * dt;
    const goal = navStep(d.x, d.z, x, z, d.nav);
    const ox = d.x;
    const oz = d.z;
    const dx = goal.x - ox;
    const dz = goal.z - oz;
    const len = Math.hypot(dx, dz);
    if (len < 0.12 * UNIT) return;
    if (face) d.yaw = Math.atan2(dx, dz);
    const nx = ox + (dx / len) * step;
    const nz = oz + (dz / len) * step;
    if (walkClear(ox, oz)) {
      if (walkClear(nx, oz) && !coverBlocked(nx, oz, d.y)) d.x = nx;
      if (walkClear(d.x, nz) && !coverBlocked(d.x, nz, d.y)) d.z = nz;
      return;
    }
    const safe = nearestClearPoint(ox, oz);
    const before = Math.hypot(safe.x - ox, safe.z - oz);
    this.tryMove(
      d,
      ox + Math.sign(safe.x - ox) * Math.min(step, Math.abs(safe.x - ox) || step),
      oz + Math.sign(safe.z - oz) * Math.min(step, Math.abs(safe.z - oz) || step),
    );
    const after = Math.hypot(safe.x - d.x, safe.z - d.z);
    if (after >= before - 0.01) {
      const sx = safe.x - d.x;
      const sz = safe.z - d.z;
      const sl = Math.hypot(sx, sz);
      if (sl > step && sl > 1e-6) {
        d.x += (sx / sl) * step;
        d.z += (sz / sl) * step;
      } else {
        d.x = safe.x;
        d.z = safe.z;
      }
    }
    d.nav.path = [];
  }

  private dummyMaybeJump(d: Fighter) {
    if (!d.grounded || d.jumpCool > 0) return;
    const dx = Math.sin(d.yaw);
    const dz = Math.cos(d.yaw);
    const ax = d.x + dx * 1.7 * UNIT;
    const az = d.z + dz * 1.7 * UNIT;
    if (!coverBlocked(ax, az, d.y)) return;
    if (!coverBlocked(ax, az, d.y + 1.55 * UNIT * PIRATE_SCALE)) this.tryJump(d);
  }

  private pickPirate(): Fighter | null {
    this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
    const ray = this.raycaster.ray;
    const body = new THREE.Vector3();
    let best: Fighter | null = null;
    let bestDist = 1.7 * UNIT;
    for (const d of this.dummies) {
      if (!d.alive) continue;
      body.set(d.x, d.y + 1.15 * UNIT * PIRATE_SCALE, d.z);
      if (body.clone().sub(ray.origin).dot(ray.direction) < 0.4) continue;
      const dist = ray.distanceToPoint(body);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.player && this.mode === "play") this.tick(dt);
    this.updateCam(dt);
    tickOcean(now / 1000);
    this.draw();
    requestAnimationFrame(this.frame);
  };

  private tick(dt: number) {
    this.elapsed += dt;
    if (this.elapsed >= MATCH_SECONDS && this.mode === "play") {
      if (this.player.alive && extractZone(this.phase(), this.player.x, this.player.z)) {
        this.extract();
        return;
      }
      this.mode = "over";
      this.hideAims();
      this.showOverlay("The Navy is here", this.navyMissed());
      return;
    }

    const opened = this.elapsed >= EXTRACT_OPEN_AT;
    const bell = this.elapsed >= BELL_OPEN_AT;
    if (opened && this.navyStingAt < 0) {
      this.navyStingAt = this.elapsed;
      sfxNavySting();
    }
    pulseExtractGlows(this.extractGlows, this.elapsed, opened, bell);
    for (const h of this.extractHints) {
      h.sprite.visible = h.id === "bell" ? bell : opened;
    }
    placeNavyShips(this.ships, this.elapsed);

    const p = this.player;
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (p.alive) {
      this.wasdMove(p, dt);
      this.autoAttack(p);
      this.look.x = p.x;
      this.look.z = p.z;
    } else {
      this.wasdSpectate(dt);
    }
    this.placeFighter(p);
    this.posePirate(p, dt);
    this.syncAim(p);
    for (const d of this.dummies) {
      d.cooldown = Math.max(0, d.cooldown - dt);
      this.dummyBrain(d, dt);
      this.tickAir(d, dt);
      this.autoAttack(d);
      this.placeFighter(d);
      this.posePirate(d, dt);
      this.syncAim(d);
    }
    this.interact(dt);
    this.updateLootHalos();
    revealRoofs(this.roofs, this.look.x, this.look.z, dt);
    this.hud();
    this.just.clear();
    this.shake = Math.max(0, this.shake - dt * 2.8);
  }

  private pulseHpHeal(from: number) {
    this.hpHealFrom = from;
    this.hpHealAt = this.elapsed;
    document.getElementById("hp-wrap")?.classList.add("heal");
  }

  private clearHpHeal() {
    this.hpHealAt = -99;
    document.getElementById("hp-wrap")?.classList.remove("heal");
  }

  private hpBarPct(hp: number): number {
    const dur = 0.55;
    const u = (this.elapsed - this.hpHealAt) / dur;
    if (this.hpHealAt < 0 || u >= 1) {
      if (this.hpHealAt >= 0) this.clearHpHeal();
      return Math.max(0, hp / PLAYER_HP) * 100;
    }
    const eased = 1 - (1 - Math.max(0, u)) ** 3;
    const shown = this.hpHealFrom + (hp - this.hpHealFrom) * eased;
    return Math.max(0, shown / PLAYER_HP) * 100;
  }

  private hud() {
    const p = this.player;
    document.getElementById("navy-clock")!.textContent = navyClock(this.elapsed);
    const islandHud = document.getElementById("island-hud");
    if (islandHud) islandHud.textContent = islandName(this.island);
    const pct = Math.max(0, (p.hp / PLAYER_HP) * 100);
    document.getElementById("hp-ghost")!.style.width = `${pct}%`;
    document.getElementById("hp-bar")!.style.width = `${this.hpBarPct(p.hp)}%`;
    const ammo = p.primary ? ` · ${p.ammo} shot${p.ammo === 1 ? "" : "s"}` : "";
    const holster =
      !p.primary && p.bag ? ` · ${weaponName(p.bag)} holstered` : "";
    document.getElementById("weapon-line")!.textContent = `${weaponName(p.primary)}${ammo}${holster}`;
    const icon = document.getElementById("weapon-icon") as HTMLImageElement;
    icon.src = weaponArt(p.primary);
    icon.classList.remove("hidden");
    paintTrophyCard(document.getElementById("trophy-card")!, p.trophy);
    this.syncExtractToast();
    document.getElementById("event-toast")!.textContent =
      this.elapsed < this.toastUntil ? this.toast : "";
    if (this.inspect && !this.inspect.alive) this.inspect = null;
    const card = document.getElementById("inspect")!;
    if (this.inspect) {
      const ammo = this.inspect.primary
        ? ` · ${this.inspect.ammo} shot${this.inspect.ammo === 1 ? "" : "s"}`
        : "";
      card.classList.remove("hidden");
      document.getElementById("inspect-name")!.textContent = this.inspect.pirate
        ? PIRATE_NAMES[this.inspect.pirate]
        : pirateCoat(this.inspect.color);
      document.getElementById("inspect-weapon")!.textContent = `${weaponName(this.inspect.primary)}${ammo}`;
      document.getElementById("inspect-trophy")!.textContent = `Booty: ${trophyName(this.inspect.trophy)}`;
      const art = document.getElementById("inspect-trophy-art") as HTMLImageElement;
      if (this.inspect.trophy) {
        art.src = trophyArt(this.inspect.trophy);
        art.classList.remove("hidden");
      } else {
        art.removeAttribute("src");
        art.classList.add("hidden");
      }
    } else {
      card.classList.add("hidden");
      const art = document.getElementById("inspect-trophy-art") as HTMLImageElement;
      art.removeAttribute("src");
      art.classList.add("hidden");
    }
  }

  private mapOverview(): { x: number; z: number; height: number } {
    const pad = 18;
    const rects = mapFrameRects();
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const r of rects) {
      minX = Math.min(minX, r.x);
      maxX = Math.max(maxX, r.x + r.w);
      minZ = Math.min(minZ, r.z);
      maxZ = Math.max(maxZ, r.z + r.d);
    }
    const halfW = (maxX - minX) / 2 + pad;
    const halfD = (maxZ - minZ) / 2 + pad;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const aspect = Math.max(0.2, this.camera.aspect || 1);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const height = Math.max(halfD / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2));
    return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, height };
  }

  private modalOpen(): boolean {
    return !document.getElementById("overlay")!.classList.contains("hidden");
  }

  private wantOverview(): boolean {
    if (this.modalOpen()) return true;
    return Boolean(this.player) && !this.player.alive && this.mode === "play";
  }

  private updateCam(dt: number) {
    const want = this.wantOverview() ? 1 : 0;
    this.camBlend += (want - this.camBlend) * (1 - Math.exp(-dt * 3.4));
    this.camZoom += (this.camZoomWant - this.camZoom) * (1 - Math.exp(-dt * 12));
    if (!Number.isFinite(this.camYaw)) this.camYaw = Math.PI / 4;
    this.updateCursorYaw(dt);
  }

  private clampZoom(z: number): number {
    return Math.min(120 * MAP, Math.max(12, z));
  }

  private nudgeZoom(deltaY: number, deltaMode: number, pinch: boolean) {
    const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? innerHeight : 1;
    const k = pinch ? 0.012 : 0.0016;
    this.camZoomWant = this.clampZoom(this.camZoomWant * Math.exp(deltaY * unit * k));
  }

  /**
   * Polar angle of the cursor around screen center (the look target). Using the
   * projected pirate as the pivot made the orbit chase itself and freeze.
   */
  private updateCursorYaw(dt: number) {
    if (this.modalOpen() || this.mode !== "play" || !this.player) return;
    const dx = this.mouse.x;
    const dy = this.mouse.y;
    if (dx * dx + dy * dy < 0.002) return;
    const want = Math.atan2(dx, dy) + Math.PI / 4;
    if (!Number.isFinite(want)) return;
    let d = want - this.camYaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.camYaw += d * (1 - Math.exp(-dt * 16));
    if (!Number.isFinite(this.camYaw)) this.camYaw = Math.PI / 4;
  }

  private pointerYaw(): number {
    return Number.isFinite(this.camYaw) ? this.camYaw : Math.PI / 4;
  }

  /** XZ offset from the look point. Default zoom 40 matches 4× pirates at the old iso angle. */
  private camOffset(dist: number): { x: number; z: number } {
    const r = dist * Math.SQRT2;
    const yaw = this.pointerYaw();
    return { x: Math.sin(yaw) * r, z: Math.cos(yaw) * r };
  }

  private alignHpPips() {
    const q = this.camera.quaternion;
    if (this.player?.hpPip) this.player.hpPip.quaternion.copy(q);
    for (const d of this.dummies) {
      if (d.hpPip) d.hpPip.quaternion.copy(q);
    }
  }

  private draw() {
    const t = this.camBlend;
    const spec = this.mapOverview();
    const x = this.look.x + (spec.x - this.look.x) * t;
    const z = this.look.z + (spec.z - this.look.z) * t;
    const zoom = this.camZoom;
    const dist = zoom * (1 - t);
    const height = zoom * 1.3 + (spec.height - zoom * 1.3) * t;
    const off = this.camOffset(dist);
    const j = this.shake * (1 - t);
    const jx = j ? (Math.random() - 0.5) * 1.4 * j : 0;
    const jy = j ? (Math.random() - 0.5) * 0.8 * j : 0;
    this.camera.up.set(0, 1 - t, -t);
    this.camera.up.normalize();
    this.camera.position.set(x + off.x + jx, height + jy, z + off.z);
    this.camera.lookAt(x, 0.5 * UNIT * (1 - t), z);
    this.alignHpPips();
    const fog = this.scene.fog as THREE.Fog;
    fog.near = 7 * zoom * (1 - t) + spec.height * 0.35 * t;
    fog.far = 16 * zoom * (1 - t) + spec.height * 2.2 * t;
    this.renderer.render(this.scene, this.camera);
  }
}
