// ============================================================ drawing helpers
function disc(x, y, r, col) {
  x = R(x); y = R(y); g.fillStyle = col;
  if (r <= .6) { g.fillRect(x, y, 1, 1); return; }
  const Rr = Math.ceil(r);
  for (let dy = -Rr; dy <= Rr; dy++) { if (r * r - dy * dy < 0) continue; const hw = R(Math.sqrt(r * r - dy * dy)); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
}
// Text is queued (txt) and drawn crisp at device resolution on top of the pixel layer.
const TQ = [];
// a string with any character the display font (ZCOOL QingKe) lacks is drawn in the pixel font as a whole (WORKFLOW 6):
// never half one font, half the other. textSprite() and textW() share this test. (Symbols: middle dot, arrows, shapes,
// stars, hearts; U+8429 in case an old name comes back.)
const NOQK = /[\u00b7\u2190-\u27bf\u8429]/;
const fontFor = (s, size) => size >= 11 && !NOQK.test(s) ? FONT : PFONT;
// the width of a string in logical px with the real font (measured once per character and size; cleared when fonts load)
const TW = new Map(); let twCtx = null;
function textW(s, size) {
  s = String(s); const f = fontFor(s, size), fk = f === FONT ? 'q' : 'p';
  if (!twCtx) twCtx = mk(8, 8).getContext('2d');
  let w = 0;
  for (const c of s) { const k = fk + size + c; let v = TW.get(k); if (v === undefined) { twCtx.font = size * 8 + 'px ' + f; v = twCtx.measureText(c).width / 8; TW.set(k, v); } w += v; }
  return w;
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
function ring(x, y, p, col) {
  x = R(x); y = R(y);
  g.fillStyle = OUT; for (const [dx, dy] of RING) g.fillRect(x + dx, y + dy, 1, 1);
  g.fillStyle = '#6a6a7e'; for (const [dx, dy, , d] of RING) if (d < 5) g.fillRect(x + dx, y + dy, 1, 1);
  g.fillStyle = col || '#7ae07a'; for (const [dx, dy, a, d] of RING) if (a <= p && d < 5) g.fillRect(x + dx, y + dy, 1, 1);
}
