// Musique pentatonique (ré, mi, fa#, la, si) façon guzheng, qui réagit à la partie.
import * as C from '../config';
import { S } from '../save';
import { G } from '../state';
import { clamp, rnd } from '../util';
import { audio, tone } from './sfx';

const SCALE = [0, 2, 4, 7, 9];
const noteF = (i: number): number => {
  const o = Math.floor(i / 5), d = SCALE[((i % 5) + 5) % 5];
  return 293.66 * Math.pow(2, o + d / 12);
};

function pluck(f: number, time: number, v = 0.06, dur = 0.7): void {
  const { ac, master } = audio;
  if (!ac || !master) return;
  const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.025, time); o.frequency.exponentialRampToValueAtTime(f, time + 0.05);
  o2.type = 'sine'; o2.frequency.setValueAtTime(f * 2, time); g2.gain.value = 0.3;
  g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(v, time + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g); o2.connect(g2).connect(g); g.connect(master);
  o.start(time); o2.start(time); o.stop(time + dur + 0.05); o2.stop(time + dur + 0.05);
}
const drum = (time: number, f = 80, v = 0.2, d = 0.22) => tone(f * 1.8, d, 'sine', v, -f * 1.2, time);
const click = (time: number, v = 0.03) => tone(1500, 0.03, 'square', v, 0, time);

let mStep = 0, mNext = 0, mIdx = 5;

// Niveau d'intensité : -1 menu, 0 partie, 1 combo ≥ 2 ou singe, 2 combo ≥ 4, 3 dragon.
function intensity(): number {
  if (G.state !== 'play') return -1;
  return G.dragonT > 0 ? 3 : G.combo >= 4 ? 2 : (G.combo >= 2 || G.boss) ? 1 : 0;
}

function schedule(step: number, time: number): void {
  const inten = intensity();
  const pr = inten >= 2 ? 0.75 : 0.5;
  if (Math.random() < pr) { mIdx = clamp(mIdx + Math.floor(rnd(-2, 3)), 0, 12); pluck(noteF(mIdx), time, inten < 0 ? 0.035 : 0.05); }
  if (step % 8 === 0) pluck(noteF(0) / 2, time, 0.06, 1.4);
  if (step % 8 === 4 && inten >= 0) pluck(noteF(2) / 2, time, 0.045, 1);
  if (inten >= 1 && step % 2 === 1) click(time);
  if (inten >= 2) { if (step % 2 === 0) drum(time, 65, 0.2); if (step % 4 === 2) pluck(noteF(mIdx + 5), time, 0.03, 0.3); }
  if (inten >= 3) { drum(time, 120, 0.08, 0.08); pluck(noteF(mIdx + 3), time, 0.03, 0.25); }
}

export function startMusic(): void {
  setInterval(() => {
    const ac = audio.ac;
    if (!ac || !S.sound) return;
    const tempo = C.TEMPO_BASE + (G.state === 'play'
      ? Math.min(G.combo, C.TEMPO_COMBO_MAX) * C.TEMPO_PER_COMBO + (G.dragonT > 0 ? C.TEMPO_DRAGON : 0) + (G.boss ? C.TEMPO_MONKEY : 0)
      : 0);
    if (mNext < ac.currentTime) mNext = ac.currentTime + 0.03;
    while (mNext < ac.currentTime + C.MUSIC_LOOKAHEAD) { schedule(mStep, mNext); mNext += 60 / tempo / 2; mStep++; }
  }, C.MUSIC_TICK_MS);
}
