import * as THREE from "three";
import { MELEE_RANGE, MUSKET_RANGE, FLINT_RANGE, type WeaponId } from "./config";
import { deckHeight, shotReach } from "./harbor";

const SEGS = 80;
const LOOPS = 12;
const LIFT = 0.07;

export function weaponReach(primary: WeaponId | null): {
  range: number;
  melee: boolean;
} {
  const melee = !primary;
  return {
    melee,
    range: melee ? MELEE_RANGE : primary === "musket" ? MUSKET_RANGE : FLINT_RANGE,
  };
}

function overlayMat(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

function fillGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts = SEGS * (LOOPS + 1);
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
  const idx: number[] = [];
  for (let k = 0; k < LOOPS; k++) {
    for (let i = 0; i < SEGS; i++) {
      const a = k * SEGS + i;
      const b = k * SEGS + ((i + 1) % SEGS);
      const c = (k + 1) * SEGS + i;
      const d = (k + 1) * SEGS + ((i + 1) % SEGS);
      idx.push(a, c, b, b, c, d);
    }
  }
  geo.setIndex(idx);
  return geo;
}

function rimGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SEGS * 2 * 3), 3));
  const idx: number[] = [];
  for (let i = 0; i < SEGS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = ((i + 1) % SEGS) * 2;
    const d = c + 1;
    idx.push(a, b, c, c, b, d);
  }
  geo.setIndex(idx);
  return geo;
}

/** Attack circle draped on decks, occluded by props, bitten where shots are blocked. */
export class RangeRing {
  readonly group = new THREE.Group();
  private fill: THREE.Mesh;
  private edge: THREE.Mesh;
  private kick = 0;
  private reach = new Float32Array(SEGS);
  private radii = new Float32Array(LOOPS + 1);

  constructor(
    scene: THREE.Scene,
    private yours: boolean,
  ) {
    this.fill = new THREE.Mesh(fillGeometry(), overlayMat(0xd4a017, 0.2));
    this.edge = new THREE.Mesh(rimGeometry(), overlayMat(0xf2e6c4, 0.85));
    this.fill.frustumCulled = false;
    this.edge.frustumCulled = false;
    this.fill.renderOrder = yours ? 2 : 1;
    this.edge.renderOrder = yours ? 3 : 2;
    this.group.add(this.fill, this.edge);
    scene.add(this.group);
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
    primary: WeaponId | null;
    ammo: number;
    cooldown: number;
    alive: boolean;
    color: number;
  }) {
    this.group.visible = opts.alive;
    if (!opts.alive) return;

    const { range, melee } = weaponReach(opts.primary);
    this.group.position.set(opts.x, 0, opts.z);
    this.layout(opts.x, opts.z, range);

    this.kick *= 0.78;
    const empty = !melee && opts.ammo <= 0;
    const cooling = opts.cooldown > 0;
    const idle = this.yours ? 0xd4a017 : opts.color;
    const fillColor = this.kick > 0.2 ? 0xf2e6c4 : empty ? 0x6a6458 : cooling ? 0xc45c3e : idle;
    const rimColor =
      this.kick > 0.2 ? 0xffffff : empty ? 0x8a8478 : cooling ? 0xe8a090 : this.yours ? 0xf2e6c4 : opts.color;
    const fillOp = this.yours
      ? empty
        ? 0.08
        : 0.16 + this.kick * 0.28
      : empty
        ? 0.04
        : 0.08 + this.kick * 0.22;
    const rimOp = this.yours ? (empty ? 0.35 : 0.9) : cooling ? 0.55 : 0.4;

    (this.fill.material as THREE.MeshBasicMaterial).color.setHex(fillColor);
    (this.fill.material as THREE.MeshBasicMaterial).opacity = fillOp;
    (this.edge.material as THREE.MeshBasicMaterial).color.setHex(rimColor);
    (this.edge.material as THREE.MeshBasicMaterial).opacity = rimOp;
  }

  private layout(ox: number, oz: number, range: number) {
    const half = this.yours ? 0.08 : 0.06;
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2;
      this.reach[i] = shotReach(ox, oz, Math.sin(a), Math.cos(a), range);
    }

    const fill = this.fill.geometry.attributes.position as THREE.BufferAttribute;
    const fp = fill.array as Float32Array;
    let p = 0;
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2;
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      this.fitRadii(ox, oz, dx, dz, Math.max(0, this.reach[i]! - 0.04));
      for (let k = 0; k <= LOOPS; k++) {
        const r = this.radii[k]!;
        const x = dx * r;
        const z = dz * r;
        fp[(k * SEGS + i) * 3] = x;
        fp[(k * SEGS + i) * 3 + 1] = deckHeight(ox + x, oz + z) + LIFT;
        fp[(k * SEGS + i) * 3 + 2] = z;
      }
    }
    fill.needsUpdate = true;

    const edge = this.edge.geometry.attributes.position as THREE.BufferAttribute;
    const ep = edge.array as Float32Array;
    p = 0;
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2;
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      const reach = this.reach[i]!;
      const inner = Math.max(0, reach - half);
      const outer = reach + half;
      const yIn = deckHeight(ox + dx * inner, oz + dz * inner) + LIFT;
      const yOut = deckHeight(ox + dx * outer, oz + dz * outer) + LIFT;
      ep[p++] = dx * inner;
      ep[p++] = yIn;
      ep[p++] = dz * inner;
      ep[p++] = dx * outer;
      ep[p++] = yOut;
      ep[p++] = dz * outer;
    }
    edge.needsUpdate = true;
  }

  /** Pack sample radii so a deck step (extract pad, pier lip) is a short vertical stitch, not a slope under the slab. */
  private fitRadii(ox: number, oz: number, dx: number, dz: number, reach: number) {
    for (let k = 0; k <= LOOPS; k++) this.radii[k] = (k / LOOPS) * reach;
    let prevY = deckHeight(ox, oz);
    for (let k = 1; k <= LOOPS; k++) {
      const r = this.radii[k]!;
      const y = deckHeight(ox + dx * r, oz + dz * r);
      if (Math.abs(y - prevY) > 0.08) {
        let lo = this.radii[k - 1]!;
        let hi = r;
        for (let s = 0; s < 8; s++) {
          const mid = (lo + hi) / 2;
          const my = deckHeight(ox + dx * mid, oz + dz * mid);
          if (Math.abs(my - prevY) > 0.08) hi = mid;
          else lo = mid;
        }
        this.radii[k - 1] = Math.max(0, lo);
        this.radii[k] = Math.min(reach, hi);
      }
      prevY = deckHeight(ox + dx * this.radii[k]!, oz + dz * this.radii[k]!);
    }
  }
}
