// Contour « dessin animé » : le dessin est fait hors écran, puis posé sur une silhouette sombre décalée.
type C2D = CanvasRenderingContext2D;

const spr = document.createElement('canvas');
const sil = document.createElement('canvas');
const sc = spr.getContext('2d')!;
const lc = sil.getContext('2d')!;
const OFFS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];

// Dessine draw() centré, dans une boîte w×h (unités du contexte cible), entouré d'un contour de thick unités.
export function drawOutlined(ctx: C2D, w: number, h: number, draw: (c: C2D) => void, color = '#3a1408', thick = 1.6, alpha = 1): void {
  const m = ctx.getTransform();
  const scale = Math.max(0.5, Math.hypot(m.a, m.b));
  const pw = Math.ceil(w * scale), ph = Math.ceil(h * scale);
  if (spr.width !== pw || spr.height !== ph) { spr.width = sil.width = pw; spr.height = sil.height = ph; }
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, pw, ph);
  sc.setTransform(scale, 0, 0, scale, pw / 2, ph / 2);
  draw(sc);
  // silhouette teintée
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, pw, ph);
  lc.globalCompositeOperation = 'source-over'; lc.drawImage(spr, 0, 0);
  lc.globalCompositeOperation = 'source-in'; lc.fillStyle = color; lc.fillRect(0, 0, pw, ph);
  lc.globalCompositeOperation = 'source-over';
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * alpha;
  // en transparence (clignotement), pas de contour : il assombrirait le dessin
  if (alpha >= 1) for (const [dx, dy] of OFFS) ctx.drawImage(sil, -w / 2 + dx * thick, -h / 2 + dy * thick, w, h);
  ctx.drawImage(spr, -w / 2, -h / 2, w, h);
  ctx.globalAlpha = a0;
}
