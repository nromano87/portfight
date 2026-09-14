import { assets } from "./asset";
import { UNIT } from "./config";

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
const clips = new Map<string, AudioBuffer>();
let load: Promise<void> | null = null;

type Loop = { src: AudioBufferSourceNode; gain: GainNode };
let theme: Loop | null = null;
let bed: Loop | null = null;

const FILES: Record<string, string> = assets({
  swing: "/audio/cutlass-swing.wav",
  hit: "/audio/cutlass-hit.wav",
  flintlock: "/audio/flintlock.wav",
  musket: "/audio/musket.wav",
  reload: "/audio/reload.wav",
  hurt: "/audio/hurt.wav",
  death: "/audio/death.wav",
  open: "/audio/open.wav",
  pickup: "/audio/pickup.wav",
  extract: "/audio/extract.wav",
  harbor: "/audio/harbor.wav",
  theme: "/audio/harbor-theme.wav",
  sting: "/audio/navy-sting.wav",
});

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function sfxOut(): GainNode {
  if (!sfxBus) {
    sfxBus = ac().createGain();
    sfxBus.gain.value = 1;
    sfxBus.connect(ac().destination);
  }
  return sfxBus;
}

function musicOut(): GainNode {
  if (!musicBus) {
    musicBus = ac().createGain();
    musicBus.gain.value = 1;
    musicBus.connect(ac().destination);
  }
  return musicBus;
}

async function loadClips() {
  const c = ac();
  await Promise.all(
    Object.entries(FILES).map(async ([id, url]) => {
      const res = await fetch(url);
      if (!res.ok) return;
      const raw = await res.arrayBuffer();
      clips.set(id, await c.decodeAudioData(raw.slice(0)));
    }),
  );
}

function ready(): Promise<void> {
  if (!load) load = loadClips().catch((err) => console.error("audio failed", err));
  return load;
}

export function unlockAudio() {
  ac();
  void ready().then(() => startMenuMusic());
}

function play(id: string, vol: number, bus: GainNode) {
  const buf = clips.get(id);
  if (!buf || vol < 0.01) return null;
  const src = ac().createBufferSource();
  src.buffer = buf;
  const gain = ac().createGain();
  gain.gain.value = vol;
  src.connect(gain);
  gain.connect(bus);
  src.start();
  return { src, gain };
}

function startLoop(id: string, vol: number, prev: Loop | null): Loop | null {
  if (prev) return prev;
  const buf = clips.get(id);
  if (!buf) return null;
  const src = ac().createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = ac().createGain();
  gain.gain.value = vol;
  src.connect(gain);
  gain.connect(musicOut());
  src.start();
  src.addEventListener("ended", () => {
    if (theme?.src === src) theme = null;
    if (bed?.src === src) bed = null;
  });
  return { src, gain };
}

function fadeTo(loop: Loop | null, vol: number) {
  if (!loop) return;
  const g = loop.gain.gain;
  const t = ac().currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(vol, t + 0.35);
}

export function startMenuMusic() {
  void ready().then(() => {
    theme = startLoop("theme", 0.32, theme);
    fadeTo(theme, 0.32);
    fadeTo(bed, 0);
  });
}

export function startMatchAudio() {
  void ready().then(() => {
    theme = startLoop("theme", 0.18, theme);
    fadeTo(theme, 0.18);
    bed = startLoop("harbor", 0.14, bed);
    fadeTo(bed, 0.14);
  });
}

export function combatGain(dist: number): number {
  const near = 10 * UNIT;
  const far = 36 * UNIT;
  if (dist > far) return 0;
  if (dist < near) return 1;
  return Math.max(0, 1 - (dist - near) / (far - near));
}

export function sfxSwing(gain = 1) {
  play("swing", 0.7 * gain, sfxOut());
}

export function sfxShot(musket: boolean, gain = 1) {
  play(musket ? "musket" : "flintlock", (musket ? 0.85 : 0.75) * gain, sfxOut());
}

export function sfxHit(gain = 1) {
  play("hit", 0.7 * gain, sfxOut());
}

export function sfxHurt() {
  play("hurt", 0.8, sfxOut());
}

export function sfxKill(gain = 1) {
  play("death", 0.75 * gain, sfxOut());
}

export function sfxOpen() {
  play("open", 0.7, sfxOut());
}

export function sfxPickup() {
  play("pickup", 0.65, sfxOut());
}

export function sfxReload() {
  play("reload", 0.7, sfxOut());
}

export function sfxExtract() {
  play("extract", 0.8, sfxOut());
}

export function sfxCraft() {
  play("pickup", 0.55, sfxOut());
}

export function sfxNavySting() {
  play("sting", 0.7, musicOut());
}
