// ============================================================ drawing helpers
function disc(x, y, r, col) {
  x = R(x); y = R(y); g.fillStyle = col;
  if (r <= .6) { g.fillRect(x, y, 1, 1); return; }
  const Rr = Math.ceil(r);
  for (let dy = -Rr; dy <= Rr; dy++) { if (r * r - dy * dy < 0) continue; const hw = R(Math.sqrt(r * r - dy * dy)); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
}
// Text is queued (txt) and drawn crisp at device resolution on top of the pixel layer.
const TQ = [];
// One font for every string: the pixel font Fusion Pixel (v2.0.1 F1; the display font is gone). fontFor() stays for callers.
const fontFor = () => PFONT;
// Fusion Pixel is drawn on a 12 px grid, so at size * K device px one glyph pixel is s = size * K / 12 device px. txtPx()
// snaps that to a whole number of device px (crisp edges, no blur): the nearest one if it is at most 20 % larger than
// asked, else the next smaller one (never below 1 = the font's own 12 px). Only below that is the exact size used.
// Snapped sizes: K = 3 (540 px wide): 6 -> 4, 7 -> 8, 8 -> 8, 9 -> 8, 11 -> 12, 13 -> 12, 21 -> 20;
// K = 6.5 (390 px phone at 3x): 6 -> 5.5, 7 -> 7.4, 8 -> 7.4, 9 -> 9.2, 11 -> 11.1, 13 -> 12.9, 21 -> 20.3.
function txtPx(size) { const s = size * K / 12; if (s < 1) return size * K; let n = Math.round(s); if (n > s * 1.2) n = Math.floor(s); return n * 12; }
// the width of a string in logical px as drawn: glyph advances measured once at 12 px (whole pixels in this font) and
// scaled to txtPx(size) (cleared when fonts load)
const TW = new Map(); let twCtx = null;
function textW(s, size) {
  s = String(s);
  if (!twCtx) twCtx = mk(8, 8).getContext('2d');
  let w = 0;
  for (const c of s) { let v = TW.get(c); if (v === undefined) { twCtx.font = '12px ' + PFONT; v = twCtx.measureText(c).width; TW.set(c, v); } w += v; }
  return w * txtPx(size) / 12 / K;
}
function txt(s, x, y, size, col, align, stroke, alpha) { TQ.push({ s, x, y, size: size || 8, col: col || '#ffffff', align: align || 'center', stroke: stroke === undefined ? OUT : stroke, alpha: alpha === undefined ? 1 : alpha }); }
function panel(x, y, w, h) {
  g.fillStyle = OUT; g.fillRect(x, y, w, h); g.fillStyle = '#8a5a34'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#b77b46'; g.fillRect(x + 2, y + 2, w - 4, 1); g.fillStyle = OUT; g.fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle = '#f6e3b4'; g.fillRect(x + 4, y + 4, w - 8, h - 8); g.fillStyle = '#fff3d0'; g.fillRect(x + 4, y + 4, w - 8, 1);
}
const BTN_COL = { orange: ['#b8642a', '#f0a048', '#ffc878'], blue: ['#2a5aa8', '#4a88e0', '#8ab8f8'] };
function button(r, label, col) {
  const [x, y, w, h] = r, c = BTN_COL[col] || BTN_COL.orange;
  g.fillStyle = OUT; g.fillRect(x, y, w, h); g.fillStyle = c[0]; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = c[1]; g.fillRect(x + 1, y + 1, w - 2, h - 4); g.fillStyle = c[2]; g.fillRect(x + 2, y + 2, w - 4, 1);
  txt(label, x + w / 2, y + h / 2 - 1, h >= 20 ? 11 : 9, '#ffffff', 'center', OUT);
}
// floating labels in WORLD coordinates ("+10" over a pile)
const POPS = [];
function pop(s, x, y, col, size, life, wait) { POPS.push({ s, x, y, col: col || '#ffffff', size: size || 8, life: life || 1, max: life || 1, wait: wait || 0 }); }
// sprite helpers: centre-anchored icons, cached flips / quarter turns
let CX = 0, CY = 0;   // integer camera offset used by every world-space draw
function drawC(c, x, y) { g.drawImage(c, R(x - (c.width >> 1)), R(y - (c.height >> 1))); }
function drawA(c, wx, wy, ax, ay) { g.drawImage(c, R(wx - ax) - CX, R(wy - ay) - CY); }
const FLIPS = new Map();
function flipOf(c) { let f = FLIPS.get(c); if (!f) { f = flipC(c); FLIPS.set(c, f); } return f; }
const ROTS = new Map();
function rotOf(c, q) {   // q quarter turns clockwise (pixel exact)
  q &= 3; if (!q) return c;
  let a = ROTS.get(c); if (!a) { a = []; ROTS.set(c, a); }
  if (!a[q]) {
    const w = c.width, h = c.height, o = mk(q & 1 ? h : w, q & 1 ? w : h), x = o.getContext('2d');
    if (q === 1) x.setTransform(0, 1, -1, 0, h, 0); else if (q === 2) x.setTransform(-1, 0, 0, -1, w, h); else x.setTransform(0, -1, 1, 0, 0, w);
    x.drawImage(c, 0, 0); a[q] = o;
  }
  return a[q];
}
// unlock "pop": scale 0 -> 1.15 -> 1 over 0.35 s
function popScale(t0) {
  if (t0 === undefined) return 1;
  const t = T - t0; if (t < 0) return 0; if (t >= .35) return 1;
  return t < .23 ? 1.15 * Math.sin(t / .23 * Math.PI / 2) : 1.15 - .15 * (t - .23) / .12;
}
// object sprite whose anchor is the bottom-left of a footprint fw tiles wide; narrower sprites are centred in it
function drawObj(c, tx, yBottom, fw, s) {
  const ax = tx * TILE + ((fw * TILE - c.width) >> 1);
  if (s === undefined || s === 1) { g.drawImage(c, ax - CX, yBottom - c.height - CY); return; }
  if (s <= .02) return;
  const w = Math.max(1, R(c.width * s)), h = Math.max(1, R(c.height * s)), cx = ax + c.width / 2;
  g.drawImage(c, R(cx - w / 2) - CX, yBottom - h - CY, w, h);
}
// small pixel progress ring (radius ~5)
const RING = (() => { const a = []; for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const d = Math.hypot(x, y); if (d >= 3.6 && d <= 5.6) a.push([x, y, (Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2), d]); } return a; })();
// drawn from a cache (18.2 perf: ~60 one-pixel fills per ring per frame before): one image per colour and filled count
const RING_IN = RING.filter(e => e[3] < 5).sort((a, b) => a[2] - b[2]), RINGC = new Map();
function ring(x, y, p, col) {
  col = col || '#7ae07a';
  let n = 0; while (n < RING_IN.length && RING_IN[n][2] <= p) n++;
  const key = col + n; let c = RINGC.get(key);
  if (!c) {
    c = mk(13, 13); const o = c.getContext('2d');
    o.fillStyle = OUT; for (const [dx, dy] of RING) o.fillRect(6 + dx, 6 + dy, 1, 1);
    o.fillStyle = '#6a6a7e'; for (const [dx, dy] of RING_IN) o.fillRect(6 + dx, 6 + dy, 1, 1);
    o.fillStyle = col; for (let i = 0; i < n; i++) o.fillRect(6 + RING_IN[i][0], 6 + RING_IN[i][1], 1, 1);
    RINGC.set(key, c);
  }
  g.drawImage(c, R(x) - 6, R(y) - 6);
}
