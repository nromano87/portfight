let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

function envGain(t: number, vol: number, attack: number, decay: number): GainNode {
  const g = ac().createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  return g;
}

function tone(freq: number, type: OscillatorType, vol: number, attack: number, decay: number) {
  const t = ac().currentTime;
  const o = ac().createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = envGain(t, vol, attack, decay);
  o.connect(g);
  g.connect(ac().destination);
  o.start(t);
  o.stop(t + decay + 0.02);
}

function noiseBurst(vol: number, decay: number, hp: number) {
  const t = ac().currentTime;
  const n = ac().createBuffer(1, Math.ceil(ac().sampleRate * decay), ac().sampleRate);
  const data = n.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac().createBufferSource();
  src.buffer = n;
  const filter = ac().createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = envGain(t, vol, 0.004, decay);
  src.connect(filter);
  filter.connect(g);
  g.connect(ac().destination);
  src.start(t);
}

export function sfxSwing() {
  noiseBurst(0.12, 0.12, 800);
  tone(220, "triangle", 0.08, 0.004, 0.09);
}

export function sfxShot(musket: boolean) {
  noiseBurst(musket ? 0.28 : 0.18, musket ? 0.22 : 0.12, 200);
  tone(musket ? 90 : 140, "square", musket ? 0.16 : 0.1, 0.002, musket ? 0.18 : 0.1);
}

export function sfxHit() {
  tone(180, "square", 0.11, 0.002, 0.08);
  noiseBurst(0.1, 0.07, 400);
}

export function sfxHurt() {
  tone(140, "sawtooth", 0.14, 0.002, 0.16);
  tone(90, "sine", 0.1, 0.002, 0.2);
}

export function sfxKill() {
  tone(110, "triangle", 0.12, 0.004, 0.22);
}