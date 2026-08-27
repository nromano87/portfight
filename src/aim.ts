import * as THREE from "three";
import {
  FLINT_RANGE,
  GUN_CONE_HALF,
  MELEE_CONE_HALF,
  MELEE_RANGE,
  MUSKET_RANGE,
  type WeaponId,
} from "./config";
import { deckHeight } from "./harbor";

export function weaponReach(primary: WeaponId | null): {
  range: number;
  half: number;
  melee: boolean;
} {
  const melee = !primary;
  return {
    melee,
    range: melee ? MELEE_RANGE : primary === "musket" ? MUSKET_RANGE : FLINT_RANGE,
    half: melee ? MELEE_CONE_HALF : GUN_CONE_HALF,
  };
}

function sectorGeometry(radius: number, half: number, segments = 28): THREE.BufferGeometry {
  const verts: number[] = [0, 0, 0];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = -half + (i / segments) * half * 2;
    verts.push(Math.sin(a) * radius, 0, Math.cos(a) * radius);
  }
  for (let i = 0; i < segments; i++) idx.push(0, i + 1, i + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  return g;
}

function overlayMat(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export class AimWedge {
  readonly group = new THREE.Group();
  private fan: THREE.Mesh;
  private impact: THREE.Mesh;
  private line: THREE.Line;
  private range = -1;
  private half = -1;
  private kick = 0;

  constructor(
    scene: THREE.Scene,
    private yours: boolean,
  ) {
    this.fan = new THREE.Mesh(
      sectorGeometry(MELEE_RANGE, MELEE_CONE_HALF),
      overlayMat(0xd4a017, yours ? 0.38 : 0.2),
    );
    this.fan.renderOrder = yours ? 12 : 10;

    this.impact = new THREE.Mesh(
      new THREE.CircleGeometry(yours ? 0.7 : 0.45, 20),
      overlayMat(0xf2e6c4, yours ? 0.9 : 0.45),
    );
    this.impact.rotation.x = -Math.PI / 2;
    this.impact.renderOrder = yours ? 13 : 11;
    this.impact.visible = yours;

    this.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, 0.02, MELEE_RANGE),
      ]),
      new THREE.LineBasicMaterial({
        color: 0xf2e6c4,
        transparent: true,
        opacity: yours ? 0.95 : 0.4,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.line.renderOrder = yours ? 13 : 11;

    this.group.add(this.fan, this.line, this.impact);
    scene.add(this.group);
    this.range = MELEE_RANGE;
    this.half = MELEE_CONE_HALF;
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }

  pulse() {
    this.kick = 1;
  }

  update(opts: {
    x: number;
    z: number;
    yaw: number;
    primary: WeaponId | null;
    ammo: number;
    cooldown: number;
    alive: boolean;
    color: number;
    landDist?: number;
  }) {
    this.group.visible = opts.alive;
    if (!opts.alive) return;

    const { range, half, melee } = weaponReach(opts.primary);
    if (range !== this.range || half !== this.half) {
      this.fan.geometry.dispose();
      this.fan.geometry = sectorGeometry(range, half);
      this.line.geometry.dispose();
      this.line.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, 0.02, range),
      ]);
      this.range = range;
      this.half = half;
    }

    const land = this.yours
      ? Math.min(Math.max(opts.landDist ?? range, 0.8), range)
      : range;
    const landX = opts.x + Math.sin(opts.yaw) * Math.min(land, 12);
    const landZ = opts.z + Math.cos(opts.yaw) * Math.min(land, 12);
    const y = Math.max(deckHeight(opts.x, opts.z), deckHeight(landX, landZ)) + 0.28;

    this.group.position.set(opts.x, y, opts.z);
    this.group.rotation.y = opts.yaw;
    this.impact.position.set(0, 0.03, land);

    this.kick *= 0.78;
    const empty = !melee && opts.ammo <= 0;
    const cooling = opts.cooldown > 0;
    const idle = this.yours ? 0xd4a017 : opts.color;
    const fanColor = this.kick > 0.2 ? 0xf2e6c4 : empty ? 0x6a6458 : cooling ? 0xc45c3e : idle;
    const tipColor = this.kick > 0.2 ? 0xffffff : empty ? 0x8a8478 : cooling ? 0xe8a090 : this.yours ? 0xf2e6c4 : opts.color;
    const fanOp = this.yours
      ? empty
        ? 0.14
        : 0.34 + this.kick * 0.35
      : empty
        ? 0.08
        : 0.2 + this.kick * 0.4;

    (this.fan.material as THREE.MeshBasicMaterial).color.setHex(fanColor);
    (this.fan.material as THREE.MeshBasicMaterial).opacity = fanOp;
    (this.impact.material as THREE.MeshBasicMaterial).color.setHex(tipColor);
    (this.line.material as THREE.LineBasicMaterial).color.setHex(tipColor);
    (this.line.material as THREE.LineBasicMaterial).opacity = this.yours ? 0.95 : cooling ? 0.7 : 0.4;
  }
}
