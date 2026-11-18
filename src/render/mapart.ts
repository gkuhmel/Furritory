// Peinture des paysages de la carte (un par monde), avec le chemin pavé entre les niveaux.
export interface MapPt { x: number; y: number }
type C2D = CanvasRenderingContext2D;

// Hasard reproductible : le même monde est toujours peint pareil.
function rng(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Courbe lisse (Catmull-Rom) échantillonnée tous les quelques pixels.
function sampleCurve(pts: MapPt[], step = 6): MapPt[] {
  const out: MapPt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

interface Look {
  base: [string, string, string]; // dégradé du sol (haut, milieu, bas)
  blobs: string[]; // taches de couleur du terrain
  road: string; roadEdge: string; stone: string;
}

const LOOKS: Look[] = [
  { base: ['#8fd77a', '#5fbf62', '#3f9f55'], blobs: ['rgba(255,255,255,0.10)', 'rgba(20,90,40,0.16)', 'rgba(255,240,120,0.12)'], road: '#f5e2b4', roadEdge: '#9a6a35', stone: '#e2c68c' },
  { base: ['#ffb27a', '#b8b860', '#5f9a58'], blobs: ['rgba(255,190,120,0.18)', 'rgba(40,80,40,0.16)', 'rgba(120,80,160,0.12)'], road: '#f0d8a8', roadEdge: '#7a4a2a', stone: '#d8b878' },
  { base: ['#f2c48a', '#e2a06a', '#c47a4a'], blobs: ['rgba(255,240,200,0.18)', 'rgba(120,40,20,0.14)', 'rgba(255,120,80,0.12)'], road: '#fbe9c8', roadEdge: '#8a2a1a', stone: '#e8c89a' },
  { base: ['#f4f9ff', '#dceaff', '#b8d2f2'], blobs: ['rgba(255,255,255,0.6)', 'rgba(90,130,200,0.14)', 'rgba(180,210,255,0.3)'], road: '#ffffff', roadEdge: '#6a8ac0', stone: '#d6e6fb' },
  { base: ['#ffe6b0', '#e6c8ff', '#b8a0f0'], blobs: ['rgba(255,255,255,0.45)', 'rgba(255,220,120,0.22)', 'rgba(140,110,220,0.18)'], road: '#fff6dc', roadEdge: '#c89a20', stone: '#ffe39a' },
];

export function paintWorld(c: C2D, w: number, W: number, H: number, nodes: MapPt[], first: boolean, last: boolean): void {
  const L = LOOKS[w], r = rng(w + 1);
  // sol
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, L.base[0]); g.addColorStop(0.5, L.base[1]); g.addColorStop(1, L.base[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    c.fillStyle = L.blobs[i % L.blobs.length];
    c.beginPath(); c.ellipse(r() * W, r() * H, 30 + r() * 90, 18 + r() * 50, r() * 3, 0, 7); c.fill();
  }
  const path = sampleCurve(nodes);
  const farFromPath = (x: number, y: number, d: number) => path.every(p => Math.hypot(p.x - x, p.y - y) > d);

  // grands éléments de fond propres au monde
  if (w === 0) river(c, W, H, r, '#7fd4ee', '#4fb0d8');
  if (w === 1) terraces(c, W, H, r);
  if (w === 2) plaza(c, W, H);
  if (w === 3) { frozenLake(c, W * 0.2, H * 0.55, 90, 50); frozenLake(c, W * 0.82, H * 0.25, 70, 40); }
  if (w === 4) for (let i = 0; i < 14; i++) cloudPuff(c, r() * W, r() * H, 40 + r() * 40, 'rgba(255,255,255,0.55)');

  // chemin : ombre, bord, pavés
  const stroke = (col: string, wd: number, dy = 0) => {
    c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); path.forEach((p, i) => (i ? c.lineTo(p.x, p.y + dy) : c.moveTo(p.x, p.y + dy))); c.stroke();
  };
  stroke('rgba(0,0,0,0.22)', 46, 6);
  stroke(L.roadEdge, 44);
  stroke(L.road, 36);
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    acc += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    if (acc < 26) continue;
    acc = 0;
    const p = path[i], a = Math.atan2(path[i].y - path[i - 1].y, path[i].x - path[i - 1].x);
    c.save(); c.translate(p.x, p.y); c.rotate(a);
    c.fillStyle = L.stone; c.beginPath(); c.ellipse(0, 0, 9, 13, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-2, -3, 4, 6, 0, 0, 7); c.fill();
    c.restore();
  }

  // décor éparpillé hors du chemin, dessiné de haut en bas pour la profondeur
  const props: { x: number; y: number; s: number; k: number }[] = [];
  for (let tries = 0; props.length < 34 && tries < 600; tries++) {
    const x = r() * W, y = 150 + r() * (H - 190);
    if (!farFromPath(x, y, 52)) continue;
    if (props.some(p => Math.hypot(p.x - x, p.y - y) < 40)) continue;
    props.push({ x, y, s: 0.75 + r() * 0.5, k: r() });
  }
  props.sort((a, b) => a.y - b.y);
  for (const p of props) prop(c, w, p.x, p.y, p.s, p.k);

  // bandes de nuages qui cachent les raccords entre mondes
  if (!last) cloudBand(c, W, 0, r, true);
  if (!first) cloudBand(c, W, H, r, false);
  if (last) { const sg = c.createLinearGradient(0, 0, 0, 160); sg.addColorStop(0, 'rgba(255,240,200,0.9)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, 160); }
}

// ---------- Grands éléments ----------
function river(c: C2D, W: number, H: number, r: () => number, light: string, dark: string): void {
  const pts: MapPt[] = [];
  let x = W * (0.1 + r() * 0.2);
  for (let y = H + 40; y > -40; y -= 120) { pts.push({ x, y }); x = Math.max(-20, Math.min(W + 20, x + (r() - 0.5) * W * 0.9)); }
  const s = sampleCurve(pts, 10);
  const line = (col: string, wd: number) => { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); s.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke(); };
  line('rgba(40,90,60,0.25)', 42); line(dark, 34); line(light, 24);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  s.forEach((p, i) => { if (i % 9 === 0) c.fillRect(p.x - 6, p.y, 12, 2); });
}

function terraces(c: C2D, W: number, H: number, r: () => number): void {
  for (let y = 60; y < H; y += 46 + r() * 20) {
    const off = r() * 60;
    c.fillStyle = 'rgba(60,110,50,0.35)';
    c.beginPath(); c.moveTo(0, y + 8);
    for (let x = -off; x <= W + 60; x += 60) c.quadraticCurveTo(x + 30, y - 6 + 8, x + 60, y + 8);
    c.lineTo(W, y + 30); c.lineTo(0, y + 30); c.fill();
    const g = c.createLinearGradient(0, y, 0, y + 24);
    g.addColorStop(0, 'rgba(255,190,140,0.65)'); g.addColorStop(1, 'rgba(120,170,200,0.55)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, y);
    for (let x = -off; x <= W + 60; x += 60) c.quadraticCurveTo(x + 30, y - 6, x + 60, y);
    c.lineTo(W, y + 22); c.lineTo(0, y + 22); c.fill();
    c.fillStyle = 'rgba(80,140,60,0.8)';
    for (let x = r() * 10; x < W; x += 9 + r() * 6) c.fillRect(x, y + 6 + r() * 10, 2, 5);
  }
}

function plaza(c: C2D, W: number, H: number): void {
  c.strokeStyle = 'rgba(140,60,30,0.15)'; c.lineWidth = 1.5;
  for (let y = 0; y < H; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let y = 0; y < H; y += 34) for (let x = (y / 34) % 2 ? 0 : 24; x < W; x += 48) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 34); c.stroke(); }
}

function frozenLake(c: C2D, x: number, y: number, rx: number, ry: number): void {
  c.fillStyle = 'rgba(90,140,200,0.25)'; c.beginPath(); c.ellipse(x, y + 5, rx + 6, ry + 5, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
  g.addColorStop(0, '#d8f0ff'); g.addColorStop(1, '#8ac0ea');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - rx * 0.5, y - ry * 0.2); c.lineTo(x - rx * 0.1, y - ry * 0.5); c.moveTo(x + rx * 0.1, y + ry * 0.3); c.lineTo(x + rx * 0.5, y); c.stroke();
}

function cloudPuff(c: C2D, x: number, y: number, s: number, col: string): void {
  c.fillStyle = col; c.beginPath();
  c.arc(x, y, s * 0.5, 0, 7); c.arc(x + s * 0.45, y + s * 0.1, s * 0.4, 0, 7); c.arc(x - s * 0.45, y + s * 0.12, s * 0.36, 0, 7); c.arc(x + s * 0.1, y - s * 0.25, s * 0.38, 0, 7);
  c.fill();
}

function cloudBand(c: C2D, W: number, y: number, r: () => number, top: boolean): void {
  const g = c.createLinearGradient(0, top ? y : y - 70, 0, top ? y + 70 : y);
  g.addColorStop(top ? 0 : 1, 'rgba(255,255,255,0.95)'); g.addColorStop(top ? 1 : 0, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, top ? y : y - 70, W, 70);
  for (let x = -20; x < W + 40; x += 34 + r() * 20) {
    const s = 40 + r() * 34;
    c.fillStyle = 'rgba(200,210,240,0.6)'; c.beginPath(); c.arc(x + 3, y + (top ? 8 : -2), s * 0.5, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y + (top ? 4 : -6), s * 0.5, 0, 7); c.fill();
  }
}

// ---------- Petits décors ----------
function shadow(c: C2D, x: number, y: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.35, 0, 0, 7); c.fill();
}

function prop(c: C2D, w: number, x: number, y: number, s: number, k: number): void {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (w === 0) { if (k < 0.45) bambooClump(c, k); else if (k < 0.75) cherryTree(c); else if (k < 0.9) rock(c, '#9aa59a'); else flowers(c, ['#ff8fb3', '#fff', '#ffd27a']); }
  else if (w === 1) { if (k < 0.35) hut(c); else if (k < 0.6) scarecrow(c); else if (k < 0.85) fireflies(c); else rock(c, '#8a8a6a'); }
  else if (w === 2) { if (k < 0.45) house(c, k); else if (k < 0.7) lanternPost(c); else if (k < 0.85) pagodaMini(c); else flowers(c, ['#ff4a3a', '#ffcf4a']); }
  else if (w === 3) { if (k < 0.6) pine(c); else if (k < 0.85) rock(c, '#c8d8ee', true); else snowman(c); }
  else { if (k < 0.4) cloudPuff(c, 0, 0, 46, 'rgba(255,255,255,0.9)'); else if (k < 0.65) goldRoof(c); else if (k < 0.85) island(c); else sparkle(c); }
  c.restore();
}

function bambooClump(c: C2D, k: number): void {
  shadow(c, 0, 2, 22);
  for (let i = 0; i < 4; i++) {
    const x = -14 + i * 9, h = 46 + ((i * 17 + k * 50) % 30);
    c.fillStyle = i % 2 ? '#3f9a3a' : '#5ab84a'; c.fillRect(x, -h, 6, h);
    c.fillStyle = '#2a6b2a'; for (let y = -h + 12; y < 0; y += 14) c.fillRect(x - 1, y, 8, 2);
    c.fillStyle = '#6fd36a'; c.beginPath(); c.ellipse(x + 10, -h + 6, 9, 3, -0.5, 0, 7); c.ellipse(x - 4, -h + 14, 8, 3, 0.5, 0, 7); c.fill();
  }
}

function cherryTree(c: C2D): void {
  shadow(c, 0, 2, 24);
  c.fillStyle = '#7a4a2a'; c.fillRect(-3, -26, 6, 26);
  c.fillStyle = '#ff9ec0'; c.beginPath(); c.arc(-12, -34, 14, 0, 7); c.arc(10, -36, 15, 0, 7); c.arc(0, -48, 16, 0, 7); c.fill();
  c.fillStyle = '#ffd0e0'; c.beginPath(); c.arc(-6, -46, 6, 0, 7); c.arc(8, -40, 5, 0, 7); c.fill();
}

function rock(c: C2D, col: string, snow = false): void {
  shadow(c, 0, 2, 16);
  c.fillStyle = col; c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-14, -18, 0, -20); c.quadraticCurveTo(16, -16, 16, 0); c.fill();
  c.fillStyle = snow ? '#ffffff' : 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-2, -16, 9, 4, 0, 0, 7); c.fill();
}

function flowers(c: C2D, cols: string[]): void {
  for (let i = 0; i < 5; i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(-12 + i * 6, -((i * 7) % 9), 3.2, 0, 7); c.fill(); }
}

function hut(c: C2D): void {
  shadow(c, 0, 2, 26);
  c.fillStyle = '#c89a5a'; c.fillRect(-18, -22, 36, 22);
  c.fillStyle = '#6a4a2a'; c.fillRect(-5, -14, 10, 14);
  c.fillStyle = '#e8c870'; c.beginPath(); c.moveTo(-26, -20); c.lineTo(0, -42); c.lineTo(26, -20); c.fill();
  c.strokeStyle = '#b8903a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-16, -26); c.lineTo(16, -26); c.moveTo(-8, -34); c.lineTo(8, -34); c.stroke();
}

function scarecrow(c: C2D): void {
  shadow(c, 0, 2, 12);
  c.fillStyle = '#7a4a2a'; c.fillRect(-2, -34, 4, 34); c.fillRect(-16, -26, 32, 3);
  c.fillStyle = '#4a6a9a'; c.fillRect(-8, -28, 16, 14);
  c.fillStyle = '#f2d0a0'; c.beginPath(); c.arc(0, -36, 6, 0, 7); c.fill();
  c.fillStyle = '#e8c870'; c.beginPath(); c.moveTo(-12, -38); c.lineTo(12, -38); c.lineTo(0, -48); c.fill();
}

function fireflies(c: C2D): void {
  for (let i = 0; i < 4; i++) {
    const x = -14 + i * 9, y = -10 - ((i * 13) % 20);
    c.fillStyle = 'rgba(255,245,150,0.35)'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill();
    c.fillStyle = '#fff59a'; c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill();
  }
}

function house(c: C2D, k: number): void {
  shadow(c, 0, 2, 28);
  c.fillStyle = k < 0.2 ? '#fff0d8' : '#f2dcc0'; c.fillRect(-20, -26, 40, 26);
  c.fillStyle = '#8a1418'; c.fillRect(-5, -16, 10, 16);
  c.fillStyle = '#ffcf4a'; c.fillRect(-15, -20, 6, 6); c.fillRect(9, -20, 6, 6);
  c.fillStyle = '#c8282e'; c.beginPath(); c.moveTo(-28, -24); c.quadraticCurveTo(0, -30, 28, -24); c.lineTo(22, -40); c.quadraticCurveTo(0, -44, -22, -40); c.fill();
  c.fillStyle = '#2a1a3a'; c.beginPath(); c.moveTo(-30, -24); c.quadraticCurveTo(-26, -20, -22, -24); c.moveTo(30, -24); c.quadraticCurveTo(26, -20, 22, -24); c.fill();
}

function lanternPost(c: C2D): void {
  shadow(c, 0, 2, 10);
  c.fillStyle = '#5a2a1a'; c.fillRect(-2, -40, 4, 40); c.fillRect(-2, -40, 14, 3);
  c.fillStyle = 'rgba(255,200,100,0.35)'; c.beginPath(); c.arc(10, -28, 12, 0, 7); c.fill();
  c.fillStyle = '#ff4a3a'; c.beginPath(); c.ellipse(10, -28, 6, 8, 0, 0, 7); c.fill();
  c.fillStyle = '#ffcf4a'; c.fillRect(6, -37, 8, 2); c.fillRect(6, -21, 8, 2);
}

function pagodaMini(c: C2D): void {
  shadow(c, 0, 2, 22);
  for (let i = 0; i < 3; i++) {
    const wd = 22 - i * 5, y = -i * 18;
    c.fillStyle = '#f2dcc0'; c.fillRect(-wd * 0.5, y - 14, wd, 14);
    c.fillStyle = '#c8282e'; c.beginPath(); c.moveTo(-wd - 6, y - 12); c.quadraticCurveTo(0, y - 22, wd + 6, y - 12); c.lineTo(wd, y - 18); c.lineTo(-wd, y - 18); c.fill();
  }
  c.fillStyle = '#ffcf4a'; c.fillRect(-1, -66, 2, 12);
}

function pine(c: C2D): void {
  shadow(c, 0, 2, 18);
  c.fillStyle = '#6a4a2a'; c.fillRect(-3, -10, 6, 10);
  for (let i = 0; i < 3; i++) {
    const y = -10 - i * 14, wd = 20 - i * 5;
    c.fillStyle = '#2f6a5a'; c.beginPath(); c.moveTo(-wd, y); c.lineTo(0, y - 22); c.lineTo(wd, y); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-wd * 0.6, y - 8); c.lineTo(0, y - 22); c.lineTo(wd * 0.6, y - 8); c.quadraticCurveTo(0, y - 4, -wd * 0.6, y - 8); c.fill();
  }
}

function snowman(c: C2D): void {
  shadow(c, 0, 2, 14);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, -12, 12, 0, 7); c.arc(0, -30, 8, 0, 7); c.fill();
  c.fillStyle = '#ff8a3a'; c.beginPath(); c.moveTo(0, -30); c.lineTo(9, -28); c.lineTo(0, -27); c.fill();
  c.fillStyle = '#1b1030'; c.beginPath(); c.arc(-3, -32, 1.4, 0, 7); c.arc(3, -32, 1.4, 0, 7); c.fill();
  c.fillStyle = '#e8343a'; c.fillRect(-8, -24, 16, 3);
}

function goldRoof(c: C2D): void {
  cloudPuff(c, 0, 0, 40, 'rgba(255,255,255,0.95)');
  c.fillStyle = '#fff0d0'; c.fillRect(-14, -26, 28, 20);
  c.fillStyle = '#e8343a'; c.fillRect(-14, -26, 4, 20); c.fillRect(10, -26, 4, 20);
  c.fillStyle = '#ffcf4a'; c.beginPath(); c.moveTo(-26, -24); c.quadraticCurveTo(0, -30, 26, -24); c.lineTo(18, -40); c.quadraticCurveTo(0, -46, -18, -40); c.fill();
  c.fillStyle = '#ffe98a'; c.fillRect(-1, -52, 2, 10);
}

function island(c: C2D): void {
  c.fillStyle = '#8a6a9a'; c.beginPath(); c.moveTo(-20, -6); c.lineTo(20, -6); c.lineTo(0, 16); c.fill();
  c.fillStyle = '#7ad89a'; c.beginPath(); c.ellipse(0, -8, 22, 7, 0, 0, 7); c.fill();
  c.fillStyle = '#ff9ec0'; c.beginPath(); c.arc(-6, -16, 7, 0, 7); c.arc(5, -18, 8, 0, 7); c.fill();
}

function sparkle(c: C2D): void {
  c.fillStyle = '#fff6c0';
  c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 3 : 12; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill();
}
