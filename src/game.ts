import * as THREE from "three";
import { AimWedge, weaponReach } from "./aim";
import {
  BELL_OPEN_AT,
  EXTRACT_CHANNEL,
  EXTRACT_OPEN_AT,
  FLINT_AMMO,
  FLINT_DAMAGE,
  HIT_RADIUS,
  HUNT_AFTER,
  MATCH_SECONDS,
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
  EXTRACT_CAMP_SECONDS,
  rectCenter,
  type TrophyId,
  type WeaponId,
} from "./config";
import {
  EXTRACT_BELL,
  EXTRACT_GULL,
  EXTRACT_WREN,
  LOOT_SPOTS,
  SPAWNS,
  blockedByWall,
  buildHarbor,
  deckHeight,
  extractZone,
  isWalkable,
  navStep,
  nudgeOffCorner,
  pickFleePoint,
  walkClear,
  nearestClearPoint,
  emptyNav,
  pierWithoutShip,
  placeNavyShips,
  revealRoofs,
  type LootKind,
  type NavCache,
  type NavyShip,
  type Roof,
} from "./harbor";
import { sfxHit, sfxHurt, sfxKill, sfxShot, sfxSwing, unlockAudio } from "./sfx";

type Primary = WeaponId | null;

type LootBox = {
  spot: (typeof LOOT_SPOTS)[number];
  mesh: THREE.Mesh;
  hoop: THREE.Mesh;
  opened: boolean;
  closedColor: number;
};

type GroundItem = {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  weapon?: WeaponId;
  ammo?: number;
  trophy?: TrophyId;
};

type Fighter = {
  mesh: THREE.Mesh;
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
  dummy: boolean;
  wanderT: number;
  tx: number;
  tz: number;
  spawnIndex: number;
  color: number;
  aim: AimWedge;
  hpPip?: THREE.Mesh;
  rummage: number;
  lootReadyAt: number;
  extractHold: number;
  nav: NavCache;
  marker?: THREE.Mesh;
};

function weaponName(w: Primary): string {
  if (w === "flintlock") return "Flintlock";
  if (w === "musket") return "Musket";
  return "Cutlass";
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
  if (color === 0x7ec8e3) return "Dockhand colorway";
  return "Pirate";
}

function trophyName(t: TrophyId | null): string {
  if (t === "keep-seal") return "Keep Seal";
  if (t === "junk") return "Bent doubloon";
  return "—";
}

function navyClock(elapsed: number): string {
  const t = Math.min(1, elapsed / MATCH_SECONDS);
  const remain = Math.max(0, 600 - t * 600);
  const m = Math.floor(remain / 60);
  const s = Math.floor(remain % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function rollContainer(kind: LootKind): {
  weapon?: WeaponId;
  ammo?: number;
  trophy?: TrophyId;
  rum?: boolean;
} {
  const n = Math.random();
  if (kind === "chest") return { trophy: "keep-seal" };
  if (kind === "lockbox") {
    if (n < 0.55) return { weapon: "musket", ammo: MUSKET_AMMO };
    if (n < 0.8) return { weapon: "flintlock", ammo: FLINT_AMMO };
    return { trophy: "junk" };
  }
  if (kind === "crate") {
    if (n < 0.5) return { weapon: "flintlock", ammo: FLINT_AMMO };
    if (n < 0.8) return { weapon: "musket", ammo: MUSKET_AMMO };
    return { ammo: 4 };
  }
  if (n < 0.4) return { weapon: "flintlock", ammo: FLINT_AMMO };
  if (n < 0.65) return { rum: true };
  if (n < 0.85) return { ammo: 3 };
  if (n < 0.9) return { trophy: "junk" };
  return {};
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0 };
  private aim = { x: 0, z: 0 };
  private player!: Fighter;
  private dummies: Fighter[] = [];
  private containers: LootBox[] = [];
  private ground: GroundItem[] = [];
  private extractMats: THREE.MeshLambertMaterial[] = [];
  private roofs: Roof[] = [];
  private ships: NavyShip[] = [];
  private elapsed = 0;
  private last = 0;
  private channel = 0;
  private lastHit = -10;
  private toastUntil = 0;
  private toast = "";
  private mode: "play" | "extracted" | "over" = "play";
  private junkStash = 0;
  private extractedTrophy: TrophyId | null = null;
  private colorway = false;
  private just = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private playerAim!: AimWedge;
  private inspect: Fighter | null = null;
  private look = { x: 0, z: 0 };
  private camBlend = 0;
  private shake = 0;

  constructor(root: HTMLElement) {
    this.scene.background = new THREE.Color(0x0d1418);
    this.scene.fog = new THREE.Fog(0x0d1418, 70, 160);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    root.appendChild(this.renderer.domElement);
    const harbor = buildHarbor(this.scene);
    this.extractMats = harbor.extractMats;
    this.roofs = harbor.roofs;
    this.ships = harbor.ships;
    placeNavyShips(this.ships, 0);
    this.playerAim = new AimWedge(this.scene, true);
    this.placeLoot();
    this.spawnPlayer(2);
    this.spawnDummy(0, 0x4a7c59);
    this.spawnDummy(1, 0xc4a35a);
    this.spawnDummy(3, 0x7c5a3a);
    this.spawnDummy(4, 0x7c4a4a);
    this.spawnDummy(5, 0x2e6b5a);
    this.spawnDummy(6, 0x6a4a7c);
    this.spawnDummy(7, 0x4a4a7c);
    this.bind();
    this.resize();
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  private bind() {
    addEventListener("resize", () => this.resize());
    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (!e.repeat && !this.keys.has(k)) this.just.add(k);
      this.keys.add(k);
      if (k === "r") {
        unlockAudio();
        this.resetMatch();
      }
      if ((k === "q" || k === "1" || k === "2") && !e.repeat) {
        this.cycleHands(k);
      }
    });
    addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
      this.renderer.domElement.style.cursor = this.pickPirate() ? "pointer" : "default";
    });
    addEventListener("mousedown", (e) => {
      unlockAudio();
      if (e.button !== 0 || this.mode !== "play") return;
      if (e.target !== this.renderer.domElement) return;
      this.inspect = this.pickPirate();
      if (this.player.alive) this.tryFire(this.player);
    });
    document.getElementById("again-btn")!.onclick = () => this.resetMatch();
    document.getElementById("craft-btn")!.onclick = () => this.craft();
  }

  private resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private makeBody(color: number, scale = 1): THREE.Mesh {
    const g = new THREE.CapsuleGeometry(0.45 * scale, 1.1 * scale, 4, 8);
    const m = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(g, m);
    this.scene.add(mesh);
    mesh.userData.base = color;
    return mesh;
  }

  private makeMarker(color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.08, 8, 28),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.92,
        depthTest: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 8;
    this.scene.add(mesh);
    return mesh;
  }

  private spawnPlayer(spawnIndex: number) {
    const s = SPAWNS[spawnIndex];
    if (this.player) {
      this.scene.remove(this.player.mesh);
      if (this.player.marker) this.scene.remove(this.player.marker);
    }
    const color = this.colorway ? 0x7ec8e3 : 0xe8d5a3;
    const mesh = this.makeBody(color, 1.12);
    this.player = {
      mesh,
      x: s.x,
      z: s.z,
      hp: PLAYER_HP,
      yaw: 0,
      primary: null,
      bag: null,
      ammo: 0,
      trophy: null,
      cooldown: 0,
      alive: true,
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
      marker: this.makeMarker(this.colorway ? 0x7ec8e3 : 0xd4a017),
    };
    this.placeFighter(this.player);
    this.look.x = this.player.x;
    this.look.z = this.player.z;
  }

  private spawnDummy(spawnIndex: number, color: number) {
    const s = SPAWNS[spawnIndex];
    const mesh = this.makeBody(color, 1);
    const hpPip = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x3dba7c, depthTest: false }),
    );
    hpPip.renderOrder = 9;
    this.scene.add(hpPip);
    const f: Fighter = {
      mesh,
      x: s.x,
      z: s.z,
      hp: PLAYER_HP,
      yaw: 0,
      primary: spawnIndex === 7 ? "flintlock" : null,
      bag: null,
      ammo: spawnIndex === 7 ? FLINT_AMMO : 0,
      trophy: spawnIndex === 7 ? "junk" : null,
      cooldown: 1.4,
      alive: true,
      dummy: true,
      wanderT: 0,
      tx: s.x,
      tz: s.z,
      spawnIndex,
      color,
      aim: new AimWedge(this.scene, false),
      hpPip,
      rummage: 0,
      lootReadyAt: spawnIndex === 7 ? 0 : (spawnIndex === 5 ? 1.1 : 1.8 + spawnIndex * 1.5) + Math.random() * 2,
      extractHold: 0,
      nav: emptyNav(),
    };
    this.dummies.push(f);
    this.placeFighter(f);
  }

  private placeLoot() {
    for (const spot of LOOT_SPOTS) {
      const h = spot.kind === "barrel" ? 1.15 : 0.85;
      const geo = new THREE.CylinderGeometry(
        spot.kind === "barrel" ? 0.55 : 0.7,
        0.58,
        h,
        8,
      );
      const closedColor =
        spot.kind === "chest"
          ? 0xd4a017
          : spot.kind === "lockbox"
            ? 0x8a6a2a
            : spot.kind === "crate"
              ? 0xc9a227
              : 0x8b5a2b;
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: closedColor }));
      mesh.position.set(spot.x, 0.4 + h / 2, spot.z);
      this.scene.add(mesh);

      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(spot.kind === "barrel" ? 0.52 : 0.62, 0.07, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe08a }),
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(spot.x, 0.4 + h + 0.08, spot.z);
      hoop.renderOrder = 4;
      this.scene.add(hoop);

      this.containers.push({ spot, mesh, hoop, opened: false, closedColor });
    }
  }

  private setContainerOpen(c: LootBox, opened: boolean) {
    c.opened = opened;
    c.hoop.visible = !opened;
    const mat = c.mesh.material as THREE.MeshLambertMaterial;
    if (!opened) {
      mat.color.setHex(c.closedColor);
      c.mesh.rotation.set(0, 0, 0);
      c.mesh.scale.set(1, 1, 1);
      const h = c.spot.kind === "barrel" ? 1.15 : 0.85;
      c.mesh.position.set(c.spot.x, 0.4 + h / 2, c.spot.z);
      return;
    }
    mat.color.setHex(0x3a322c);
    if (c.spot.kind === "barrel") {
      c.mesh.rotation.z = Math.PI / 2;
      c.mesh.position.set(c.spot.x, 0.58, c.spot.z);
    } else {
      c.mesh.rotation.x = 0.55;
      c.mesh.scale.set(1, 0.38, 1);
      c.mesh.position.set(c.spot.x, 0.52, c.spot.z);
    }
  }

  private placeFighter(f: Fighter) {
    const h = f.dummy ? 1.1 : 1.22;
    f.mesh.position.set(f.x, h, f.z);
    f.mesh.rotation.y = f.yaw;
    f.mesh.visible = f.alive;
    if (f.marker) {
      f.marker.visible = f.alive;
      f.marker.position.set(f.x, deckHeight(f.x, f.z) + 0.12, f.z);
    }
    if (f.hpPip) {
      const ratio = Math.max(0, f.hp / PLAYER_HP);
      f.hpPip.visible = f.alive;
      f.hpPip.position.set(f.x, 2.35, f.z);
      f.hpPip.scale.set(Math.max(0.06, ratio), 1, 1);
      (f.hpPip.material as THREE.MeshBasicMaterial).color.setHex(
        ratio > 0.45 ? 0x3dba7c : ratio > 0.2 ? 0xd4a017 : 0xc45c3e,
      );
    }
  }

  private syncAim(f: Fighter) {
    f.aim.update({
      x: f.x,
      z: f.z,
      yaw: f.yaw,
      primary: f.primary,
      ammo: f.ammo,
      cooldown: f.cooldown,
      alive: f.alive && this.mode === "play",
      color: f.color,
      landDist: f.dummy ? undefined : Math.hypot(this.aim.x - f.x, this.aim.z - f.z),
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
    const p = this.player;
    if (!p.alive || this.mode !== "play") return;
    if (k === "1" || (k === "q" && p.primary)) {
      this.holsterGun(p);
      return;
    }
    if (k === "2" || k === "q") this.drawGun(p);
  }

  private tryMove(f: Fighter, nx: number, nz: number) {
    if (isWalkable(nx, f.z)) f.x = nx;
    if (isWalkable(f.x, nz)) f.z = nz;
  }

  private wasdAxis(): { mx: number; mz: number } {
    let mx = 0;
    let mz = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) {
      mx -= 1;
      mz -= 1;
    }
    if (this.keys.has("s") || this.keys.has("arrowdown")) {
      mx += 1;
      mz += 1;
    }
    if (this.keys.has("a") || this.keys.has("arrowleft")) {
      mx -= 1;
      mz += 1;
    }
    if (this.keys.has("d") || this.keys.has("arrowright")) {
      mx += 1;
      mz -= 1;
    }
    return { mx, mz };
  }

  private wasdMove(p: Fighter, dt: number) {
    const { mx, mz } = this.wasdAxis();
    if (!mx && !mz) return;
    const len = Math.hypot(mx, mz);
    this.tryMove(
      p,
      p.x + (mx / len) * PLAYER_SPEED * dt,
      p.z + (mz / len) * PLAYER_SPEED * dt,
    );
  }

  private wasdSpectate(dt: number) {
    const { mx, mz } = this.wasdAxis();
    if (!mx && !mz) return;
    const len = Math.hypot(mx, mz);
    const speed = PLAYER_SPEED * 2.4;
    this.look.x = Math.max(-90, Math.min(78, this.look.x + (mx / len) * speed * dt));
    this.look.z = Math.max(-62, Math.min(62, this.look.z + (mz / len) * speed * dt));
  }

  private rivals(f: Fighter): Fighter[] {
    const all = [this.player, ...this.dummies];
    return all.filter((o) => o !== f && o.alive);
  }

  private canSee(a: Fighter, b: Fighter): boolean {
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    if (dist < 1.2) return true;
    return !blockedByWall(a.x, a.z, (b.x - a.x) / dist, (b.z - a.z) / dist, dist - 0.4);
  }

  private shotRange(f: Fighter): number {
    return weaponReach(f.primary).range;
  }

  private inPie(f: Fighter, t: Fighter): boolean {
    if (!t.alive) return false;
    const { range, half } = weaponReach(f.primary);
    const ex = t.x - f.x;
    const ez = t.z - f.z;
    const dist = Math.hypot(ex, ez);
    if (dist > range || dist < 0.15) return false;
    const dx = Math.sin(f.yaw);
    const dz = Math.cos(f.yaw);
    return (ex * dx + ez * dz) / dist >= Math.cos(half);
  }

  private nearestShot(f: Fighter): Fighter | null {
    const shot = this.shotRange(f);
    let best: Fighter | null = null;
    let bestD = shot + 0.01;
    for (const o of this.rivals(f)) {
      const d = Math.hypot(o.x - f.x, o.z - f.z);
      if (d >= bestD || d > shot) continue;
      if (!this.canSee(f, o)) continue;
      if (f.primary && f.ammo <= 0) continue;
      bestD = d;
      best = o;
    }
    return best;
  }

  /** Player already in the pie or on top of us. Other pirates are ignored. */
  private contactThreat(d: Fighter): Fighter | null {
    const p = this.player;
    if (!p.alive) return null;
    const dist = Math.hypot(p.x - d.x, p.z - d.z);
    if (dist < 5.2 || this.inPie(d, p)) return p;
    return null;
  }

  /** Fire if another bot is close. Do not chase. Skip if the player is already on us. */
  private dummyShootNearby(d: Fighter) {
    if (!d.alive) return;
    if (this.contactThreat(d)) return;
    const reach = Math.min(this.shotRange(d), DUMMY_NEAR);
    let best: Fighter | null = null;
    let bestD = reach + 0.01;
    for (const o of this.dummies) {
      if (o === d || !o.alive) continue;
      const dist = Math.hypot(o.x - d.x, o.z - d.z);
      if (dist > reach || dist < 0.15) continue;
      if (!this.canSee(d, o)) continue;
      if (dist < bestD) {
        bestD = dist;
        best = o;
      }
    }
    if (!best) return;
    d.yaw = Math.atan2(best.x - d.x, best.z - d.z);
    this.tryFire(d);
  }

  private dummyJob(d: Fighter): "hunt" | "seal" | "loot" {
    if (d.spawnIndex === 5) return "seal";
    if (d.spawnIndex === 0 || d.spawnIndex === 4) return "hunt";
    return "loot";
  }

  private tryFire(f: Fighter) {
    if (!f.alive || f.cooldown > 0 || this.mode !== "play") return;
    if (!f.dummy) {
      this.updateAim();
      f.yaw = Math.atan2(this.aim.x - f.x, this.aim.z - f.z);
      this.syncAim(f);
    }

    const { range, half, melee } = weaponReach(f.primary);
    if (!melee) {
      if (f.ammo <= 0) {
        if (!f.dummy) this.flash("Empty. Find a barrel.");
        return;
      }
      f.ammo -= 1;
      f.cooldown = f.primary === "musket" ? 1.15 : 0.55;
    } else {
      f.cooldown = f.dummy ? DUMMY_MELEE_COOLDOWN : MELEE_COOLDOWN;
    }
    f.aim.pulse();
    if (melee) sfxSwing();
    else sfxShot(f.primary === "musket");

    const dx = Math.sin(f.yaw);
    const dz = Math.cos(f.yaw);
    const cone = Math.cos(half);
    const targets = this.rivals(f);
    for (const t of targets) {
      const ex = t.x - f.x;
      const ez = t.z - f.z;
      const dist = Math.hypot(ex, ez);
      if (dist > range || dist < 0.15) continue;
      const dir = dist < 0.001 ? 1 : (ex * dx + ez * dz) / dist;
      if (dir < cone) continue;
      if (dist > 1.2 && blockedByWall(f.x, f.z, ex / dist, ez / dist, dist - HIT_RADIUS)) {
        continue;
      }
      const fall =
        melee || dist < 8
          ? 1
          : f.primary === "musket"
            ? dist > 22
              ? 1
              : 0.55
            : dist > 22
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
      if (t.dummy) sfxHit();
      if (melee) break;
    }
  }

  private hurt(t: Fighter, dmg: number, by: Fighter) {
    t.hp -= dmg;
    if (!t.dummy) {
      this.lastHit = this.elapsed;
      this.shake = 0.55;
      sfxHurt();
      document.getElementById("hp-wrap")?.classList.add("hurt");
      setTimeout(() => document.getElementById("hp-wrap")?.classList.remove("hurt"), 140);
    }
    if (t.dummy) t.extractHold = 0;
    t.mesh.material = new THREE.MeshLambertMaterial({ color: 0xaa3333 });
    const restore = t.color;
    setTimeout(() => {
      if (t.alive) {
        (t.mesh.material as THREE.MeshLambertMaterial).color.setHex(restore);
      }
    }, 160);
    if (t.hp <= 0) this.kill(t, by);
  }

  private kill(t: Fighter, _by: Fighter) {
    t.alive = false;
    t.hp = 0;
    t.mesh.visible = false;
    t.aim.setVisible(false);
    if (t.hpPip) t.hpPip.visible = false;
    this.dropFrom(t);
    if (t.marker) t.marker.visible = false;
    sfxKill();
    if (!t.dummy) this.flash("You have died. WASD to watch the harbor. R restarts.");
  }

  private dropFrom(t: Fighter) {
    const jitter = () => (Math.random() - 0.5) * 1.6;
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
    const color = item.trophy === "keep-seal" ? 0xd4a017 : item.trophy ? 0xb8a078 : 0x8899aa;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 6),
      new THREE.MeshLambertMaterial({ color }),
    );
    mesh.position.set(x, 0.7, z);
    this.scene.add(mesh);
    this.ground.push({ mesh, x, z, ...item });
  }

  private interact(dt: number) {
    const p = this.player;
    if (!p.alive) {
      document.getElementById("prompt")!.textContent =
        "Spectating — WASD pan the harbor · click a pirate for their kit · R restart";
      return;
    }
    const holding = this.keys.has("e");
    const zone = extractZone(this.phase(), p.x, p.z);
    let prompt = "";

    const nearBarrel = this.containers.find(
      (c) =>
        c.spot.kind === "barrel" &&
        Math.hypot(c.spot.x - p.x, c.spot.z - p.z) < PICKUP_RANGE,
    );
    const nearC = this.containers.find(
      (c) =>
        !c.opened &&
        c.spot.kind !== "barrel" &&
        Math.hypot(c.spot.x - p.x, c.spot.z - p.z) < PICKUP_RANGE,
    );
    const nearG = this.ground.find(
      (g) => Math.hypot(g.x - p.x, g.z - p.z) < PICKUP_RANGE,
    );

    if (zone) {
      prompt = `Hold E — extract on ${zone === "bell" ? "Fort Bell" : zone === "gull" ? "The Gull" : "The Wren"}`;
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
      } else if (nearG) prompt = "E — take loot";
      else if (nearBarrel)
        prompt = nearBarrel.opened
          ? "E — refill ammo"
          : `E — open ${nearBarrel.spot.id} (refills ammo)`;
      else if (nearC) prompt = `E — open ${nearC.spot.id}`;
      if (this.just.has("e")) {
        if (nearG) this.takeGround(nearG);
        else if (nearBarrel) this.useBarrel(nearBarrel);
        else if (nearC) this.openContainer(nearC);
      }
    }

    const el = document.getElementById("prompt")!;
    el.textContent = prompt;
  }

  private takeGround(g: GroundItem, f: Fighter = this.player) {
    if (g.weapon) {
      const owned = f.primary ?? f.bag;
      if (owned) this.spawnGround(f.x, f.z + 1.2, { weapon: owned, ammo: f.ammo });
      f.primary = g.weapon;
      f.bag = null;
      f.ammo = g.ammo ?? 0;
    }
    if (g.trophy) {
      if (f.trophy) this.spawnGround(f.x + 1.2, f.z, { trophy: f.trophy });
      f.trophy = g.trophy;
    }
    if (g.ammo && !g.weapon) f.ammo += g.ammo;
    this.scene.remove(g.mesh);
    this.ground = this.ground.filter((x) => x !== g);
  }

  private magSize(f: Fighter): number {
    const gun = f.primary ?? f.bag;
    return gun === "musket" ? MUSKET_AMMO : FLINT_AMMO;
  }

  private refillAmmo(f: Fighter, announce = true): boolean {
    const cap = this.magSize(f);
    const was = f.ammo;
    f.ammo = Math.max(f.ammo, cap);
    const gained = f.ammo > was;
    if (!announce || f.dummy) return gained;
    const gun = f.primary ?? f.bag;
    if (!gained) this.flash("Already full.");
    else this.flash(gun ? `${weaponName(gun)} topped up.` : "Powder. Take a gun.");
    return gained;
  }

  private useBarrel(c: LootBox, f: Fighter = this.player) {
    if (!c.opened) this.openContainer(c, f);
    else this.refillAmmo(f);
  }

  private openContainer(c: LootBox, f: Fighter = this.player) {
    this.setContainerOpen(c, true);
    const roll = rollContainer(c.spot.kind);
    if (c.spot.id === "U1" && !roll.weapon) {
      roll.weapon = "flintlock";
      roll.ammo = FLINT_AMMO;
    }
    if (c.spot.id === "R2") {
      roll.weapon = "musket";
      roll.ammo = MUSKET_AMMO;
    }
    if (roll.rum) {
      f.hp = Math.min(PLAYER_HP, f.hp + 28);
      if (!f.dummy && c.spot.kind !== "barrel") this.flash("Rum. +HP");
    }
    if (c.spot.kind === "barrel") {
      const gained = this.refillAmmo(f, false);
      if (!f.dummy) {
        if (roll.rum) this.flash("Rum. +HP · ammo refilled.");
        else if (gained) this.flash("Ammo refilled.");
        else this.flash("Already full.");
      }
    } else if (roll.ammo && !roll.weapon) {
      f.ammo += roll.ammo;
    }
    if (roll.weapon) this.spawnGround(c.spot.x, c.spot.z + 1.1, { weapon: roll.weapon, ammo: roll.ammo });
    if (roll.trophy) this.spawnGround(c.spot.x + 1.1, c.spot.z, { trophy: roll.trophy });
  }

  private extract() {
    this.mode = "extracted";
    this.extractedTrophy = this.player.trophy;
    if (this.player.trophy === "junk") this.junkStash += 1;
    this.player.trophy = null;
    this.hideAims();
    this.showOverlay(
      "You got out",
      `The ship leaves with ${trophyName(this.extractedTrophy)}. Guns stay in the harbor.`,
    );
  }

  private navyMissed(): string {
    if (!this.player.alive) return "Match over.";
    const pier = pierWithoutShip(this.player.x, this.player.z);
    if (pier === "gull") {
      return "The Gull left North Wharf. Extract is the green plank at the west end — hold E before 10:00.";
    }
    if (pier === "wren") {
      return "The Wren left South Slip. Extract is the green plank at the west end — hold E before 10:00.";
    }
    return "You were still on the dock. The ships left without you.";
  }

  private showOverlay(title: string, body: string) {
    document.getElementById("overlay")!.classList.remove("hidden");
    document.getElementById("overlay-title")!.textContent = title;
    document.getElementById("overlay-body")!.textContent = body;
    document.getElementById("stash-line")!.textContent = `Junk on the shelf: ${this.junkStash}${this.colorway ? " · Dockhand colorway crafted" : ""}`;
    const craft = document.getElementById("craft-btn")!;
    craft.classList.toggle("hidden", this.junkStash < 5 || this.colorway);
  }

  private craft() {
    if (this.junkStash < 5 || this.colorway) return;
    this.junkStash -= 5;
    this.colorway = true;
    document.getElementById("portrait")!.classList.add("colorway");
    this.flash("Dockhand colorway — your PFP.");
    this.showOverlay(
      "Crafted",
      "Five bent doubloons become a colorway. The house still does not sell Ironsides.",
    );
  }

  private resetDummy(d: Fighter) {
    const s = SPAWNS[d.spawnIndex];
    d.alive = true;
    d.hp = PLAYER_HP;
    d.x = s.x;
    d.z = s.z;
    d.yaw = 0;
    d.primary = d.spawnIndex === 7 ? "flintlock" : null;
    d.bag = null;
    d.ammo = d.spawnIndex === 7 ? FLINT_AMMO : 0;
    d.trophy = d.spawnIndex === 7 ? "junk" : null;
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
    (d.mesh.material as THREE.MeshLambertMaterial).color.setHex(d.color);
    this.placeFighter(d);
    this.syncAim(d);
  }

  private resetMatch() {
    document.getElementById("overlay")!.classList.add("hidden");
    this.mode = "play";
    this.elapsed = 0;
    this.channel = 0;
    this.lastHit = -10;
    for (const g of this.ground) this.scene.remove(g.mesh);
    this.ground = [];
    for (const c of this.containers) this.setContainerOpen(c, false);
    for (const d of this.dummies) this.resetDummy(d);
    this.spawnPlayer(2);
    this.inspect = null;
  }

  private flash(msg: string) {
    this.toast = msg;
    this.toastUntil = this.elapsed + 3;
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
      if (this.dummyTryLoot(d, dt)) {
        if (poked) {
          d.yaw = Math.atan2(poked.x - d.x, poked.z - d.z);
          this.tryFire(d);
        }
        return;
      }
      if (poked) {
        this.dummyFight(d, poked, pDist, dt, false);
        return;
      }
    }

    if (poked) {
      this.dummyFight(d, poked, pDist, dt, job === "hunt" && this.elapsed >= HUNT_AFTER);
      if (job !== "hunt" || this.elapsed < HUNT_AFTER) return;
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
    if (d.trophy && dist < 20 && dist > 4.5) return true;
    if (d.hp < PLAYER_HP * 0.4 && dist < 16 && dist > 4.5) return true;
    if (job === "hunt") return false;
    const mine = this.shotRange(d);
    const theirs = this.shotRange(enemy);
    if (mine >= theirs) return false;
    if (dist > theirs + 5) return false;
    return this.canSee(d, enemy) || dist < 10;
  }

  private dummyFlee(d: Fighter, enemy: Fighter, dist: number, dt: number) {
    const keep =
      walkClear(d.tx, d.tz) &&
      Math.hypot(d.tx - d.x, d.tz - d.z) > 3.5 &&
      Math.hypot(d.tx - enemy.x, d.tz - enemy.z) > dist + 1;
    const goal = keep
      ? { x: d.tx, z: d.tz }
      : pickFleePoint(d.x, d.z, enemy.x, enemy.z, d.spawnIndex % 2 === 0 ? 1 : -1);
    d.tx = goal.x;
    d.tz = goal.z;
    this.dummySteer(d, goal.x, goal.z, dt, 0.95);
    const mine = this.shotRange(d);
    if (dist < mine && this.canSee(d, enemy)) {
      d.yaw = Math.atan2(enemy.x - d.x, enemy.z - d.z);
      this.tryFire(d);
    }
  }

  private dummyFight(d: Fighter, enemy: Fighter, dist: number, dt: number, chase: boolean) {
    if (chase) {
      if (dist > 3.2) this.dummySteer(d, enemy.x, enemy.z, dt, 0.7, false);
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
    }
    d.yaw = Math.atan2(enemy.x - d.x, enemy.z - d.z);
    const shot = this.shotRange(d);
    if (dist < shot && this.canSee(d, enemy)) this.tryFire(d);
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
    const mark = poked ?? (enemy && pDist < 16 ? enemy : null);
    const markDist = mark ? Math.hypot(mark.x - d.x, mark.z - d.z) : 999;
    if (mark) {
      d.extractHold = 0;
      const chase = !mark.dummy && markDist < 10 && toPad < 8;
      this.dummyFight(d, mark, markDist, dt, chase);
      if (!chase && toPad > 2.4) this.dummySteer(d, pad.x, pad.z, dt, 0.55);
      if (chase || markDist < 6) return;
    }
    if (toPad > 1.8) {
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
    d.mesh.visible = false;
    d.aim.setVisible(false);
    if (d.hpPip) d.hpPip.visible = false;
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
        if (c.opened && (c.spot.kind !== "barrel" || !needsAmmo)) continue;
        if (this.lootClaimed(c.spot.x, c.spot.z, d)) continue;
        if (wantsMusket && !unarmed && !needsAmmo && c.spot.id !== "R2") continue;
        const dist = Math.hypot(c.spot.x - d.x, c.spot.z - d.z);
        const bonus = c.spot.kind === "barrel" && needsAmmo ? -8 : 0;
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
    d.tx = bestX;
    d.tz = bestZ;
    this.dummySteer(d, bestX, bestZ, dt, 0.62);
    if (bestD > PICKUP_RANGE) {
      d.rummage = 0;
      return true;
    }
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
      if (d.spawnIndex === 5 && g.trophy !== "keep-seal") continue;
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
      const bonus = c.spot.kind === "chest" ? -18 : c.spot.kind === "lockbox" ? -6 : 0;
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
    d.tx = bestX;
    d.tz = bestZ;
    this.dummySteer(d, bestX, bestZ, dt, 0.62);
    if (Math.hypot(d.x - bestX, d.z - bestZ) > PICKUP_RANGE) {
      d.rummage = 0;
      return true;
    }
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

  private dummySteer(d: Fighter, x: number, z: number, dt: number, speed: number, face = true) {
    const step = PLAYER_SPEED * speed * dt;
    const goal = navStep(d.x, d.z, x, z, d.nav);
    const ox = d.x;
    const oz = d.z;
    const dx = goal.x - ox;
    const dz = goal.z - oz;
    const len = Math.hypot(dx, dz);
    if (len < 0.1) return;
    if (face) d.yaw = Math.atan2(dx, dz);
    const nx = ox + (dx / len) * step;
    const nz = oz + (dz / len) * step;
    const onMesh = walkClear(ox, oz);
    const accept = (px: number, pz: number) =>
      walkClear(px, pz) || (!onMesh && isWalkable(px, pz));
    if (accept(nx, nz)) {
      d.x = nx;
      d.z = nz;
      return;
    }
    if (accept(nx, oz)) {
      d.x = nx;
      return;
    }
    if (accept(ox, nz)) {
      d.z = nz;
      return;
    }
    if (!onMesh) {
      const safe = nearestClearPoint(ox, oz);
      const sx = ox + Math.sign(safe.x - ox) * Math.min(step, Math.abs(safe.x - ox));
      const sz = oz + Math.sign(safe.z - oz) * Math.min(step, Math.abs(safe.z - oz));
      if (isWalkable(sx, sz)) {
        d.x = sx;
        d.z = sz;
        d.nav.path = [];
        return;
      }
    }
    const slip = nudgeOffCorner(ox, oz, goal.x, goal.z, step);
    if (slip && Math.hypot(slip.x - ox, slip.z - oz) > 0.04) {
      d.x = slip.x;
      d.z = slip.z;
      if (face) d.yaw = Math.atan2(slip.x - ox, slip.z - oz);
      d.nav.path = [];
      return;
    }
    const side = d.spawnIndex % 2 === 0 ? 1 : -1;
    const hx = ox - (dz / len) * step * side;
    const hz = oz + (dx / len) * step * side;
    if (accept(hx, hz)) {
      d.x = hx;
      d.z = hz;
      d.nav.path = [];
    }
  }

  private pickPirate(): Fighter | null {
    this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
    const ray = this.raycaster.ray;
    const body = new THREE.Vector3();
    let best: Fighter | null = null;
    let bestDist = 1.7;
    for (const d of this.dummies) {
      if (!d.alive) continue;
      body.set(d.x, 1.15, d.z);
      if (body.clone().sub(ray.origin).dot(ray.direction) < 0.4) continue;
      const dist = ray.distanceToPoint(body);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  private updateAim() {
    this.raycaster.setFromCamera(
      new THREE.Vector2(this.mouse.x, this.mouse.y),
      this.camera,
    );
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      this.aim.x = hit.x;
      this.aim.z = hit.z;
    }
  }

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.mode === "play") this.tick(dt);
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
    this.extractMats[0].color.setHex(opened ? 0x3dba7c : 0x2a4a3a);
    this.extractMats[1].color.setHex(opened ? 0x3dba7c : 0x2a4a3a);
    this.extractMats[2].color.setHex(bell ? 0x3dba7c : 0x2a4a3a);
    placeNavyShips(this.ships, this.elapsed);

    if (this.elapsed >= EXTRACT_OPEN_AT && this.elapsed < EXTRACT_OPEN_AT + 1.2) {
      this.flash("The Gull and The Wren drop gangplanks.");
    }
    if (this.elapsed >= BELL_OPEN_AT && this.elapsed < BELL_OPEN_AT + 1.2) {
      this.flash("Fort Bell is open.");
    }

    const p = this.player;
    p.cooldown = Math.max(0, p.cooldown - dt);
    this.updateAim();
    if (p.alive) {
      p.yaw = Math.atan2(this.aim.x - p.x, this.aim.z - p.z);
      this.wasdMove(p, dt);
      this.look.x = p.x;
      this.look.z = p.z;
    } else {
      this.wasdSpectate(dt);
    }
    this.placeFighter(p);
    this.syncAim(p);
    for (const d of this.dummies) {
      d.cooldown = Math.max(0, d.cooldown - dt);
      this.dummyBrain(d, dt);
      this.dummyShootNearby(d);
      this.placeFighter(d);
      this.syncAim(d);
    }
    this.interact(dt);
    revealRoofs(this.roofs, this.look.x, this.look.z, dt, !p.alive);
    this.hud();
    this.just.clear();
    const wantCam = !p.alive && this.mode === "play" ? 1 : 0;
    this.camBlend += (wantCam - this.camBlend) * (1 - Math.exp(-dt * 3.4));
    this.shake = Math.max(0, this.shake - dt * 2.8);
  }

  private hud() {
    const p = this.player;
    document.getElementById("navy-clock")!.textContent = navyClock(this.elapsed);
    document.getElementById("hp-bar")!.style.width = `${Math.max(0, (p.hp / PLAYER_HP) * 100)}%`;
    const ammo = p.primary ? ` · ${p.ammo} shot${p.ammo === 1 ? "" : "s"}` : "";
    const holster =
      !p.primary && p.bag ? ` · ${weaponName(p.bag)} holstered` : "";
    document.getElementById("weapon-line")!.textContent = `${weaponName(p.primary)}${ammo}${holster}`;
    document.getElementById("trophy-line")!.textContent = `Trophy: ${trophyName(p.trophy)}`;
    document.getElementById("event-toast")!.textContent =
      this.elapsed < this.toastUntil ? this.toast : "";
    if (this.inspect && !this.inspect.alive) this.inspect = null;
    const card = document.getElementById("inspect")!;
    if (this.inspect) {
      const ammo = this.inspect.primary
        ? ` · ${this.inspect.ammo} shot${this.inspect.ammo === 1 ? "" : "s"}`
        : "";
      card.classList.remove("hidden");
      document.getElementById("inspect-name")!.textContent = pirateCoat(this.inspect.color);
      document.getElementById("inspect-weapon")!.textContent = `${weaponName(this.inspect.primary)}${ammo}`;
      document.getElementById("inspect-trophy")!.textContent = `Trophy: ${trophyName(this.inspect.trophy)}`;
    } else {
      card.classList.add("hidden");
    }
  }

  private draw() {
    const t = this.camBlend;
    const x = this.look.x;
    const z = this.look.z;
    const dist = 22 + 10 * t;
    const height = 28 + 14 * t;
    const j = this.shake;
    const jx = j ? (Math.random() - 0.5) * 1.4 * j : 0;
    const jy = j ? (Math.random() - 0.5) * 0.8 * j : 0;
    this.camera.position.set(x + dist + jx, height + jy, z + dist);
    this.camera.lookAt(x, 0.5, z);
    const fog = this.scene.fog as THREE.Fog;
    fog.near = 70 + 20 * t;
    fog.far = 160 + 60 * t;
    this.renderer.render(this.scene, this.camera);
  }
}
