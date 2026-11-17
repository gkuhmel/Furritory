// Effets sonores synthétisés (Web Audio API).
import { MASTER_VOLUME } from '../config';
import { S } from '../save';

export const audio = { ac: null as AudioContext | null, master: null as GainNode | null };

// Crée (ou réveille) le contexte audio : doit être appelé sur un geste de l'utilisateur.
export function initAudio(): void {
  if (audio.ac) { if (audio.ac.state === 'suspended') audio.ac.resume(); return; }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio.ac = new AC();
    audio.master = audio.ac.createGain();
    audio.master.gain.value = S.sound ? MASTER_VOLUME : 0;
    audio.master.connect(audio.ac.destination);
  } catch { /* pas d'audio */ }
}

export function applySound(): void {
  if (audio.master) audio.master.gain.value = S.sound ? MASTER_VOLUME : 0;
}

export function tone(f: number, d: number, type: OscillatorType, v: number, slide = 0, time?: number): void {
  const { ac, master } = audio;
  if (!ac || !master) return;
  const t0 = time || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + 0.05);
}

export const sfx = {
  flap: () => tone(520, 0.07, 'triangle', 0.05, 260),
  point: () => { tone(880, 0.06, 'square', 0.025); setTimeout(() => tone(1320, 0.08, 'square', 0.025), 50); },
  bao: () => [660, 880, 1100].forEach((f, i) => setTimeout(() => tone(f, 0.07, 'triangle', 0.05), i * 45)),
  power: () => [440, 660, 990, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.09, 'sine', 0.06), i * 60)),
  near: () => tone(1500, 0.08, 'sine', 0.05, -500),
  hit: () => tone(200, 0.4, 'sawtooth', 0.08, -150),
  shield: () => tone(300, 0.25, 'triangle', 0.08, 500),
  gong: () => { [110, 221, 332, 441].forEach((f, i) => tone(f, 2.4, 'sine', 0.09 / (i + 1))); },
  throw: () => tone(700, 0.15, 'triangle', 0.04, -400),
};
