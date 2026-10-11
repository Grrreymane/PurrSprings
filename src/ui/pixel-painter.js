// ============================================================ pixel painter
const _RGBA = new Map(); let _rgbaX = null;   // colour string -> [r, g, b, a] (Grid.canvas)
function rgbaOf(col) {
  let q = _RGBA.get(col); if (q) return q;
  if (/^#[0-9a-f]{6}$/i.test(col)) { const n = parseInt(col.slice(1), 16); q = [n >> 16, (n >> 8) & 255, n & 255, 255]; }
  else { if (!_rgbaX) _rgbaX = mk(1, 1).getContext('2d', { willReadFrequently: true }); _rgbaX.clearRect(0, 0, 1, 1); _rgbaX.fillStyle = col; _rgbaX.fillRect(0, 0, 1, 1); q = Array.from(_rgbaX.getImageData(0, 0, 1, 1).data); }
  _RGBA.set(col, q); return q;
}
// Draw a sprite into a Grid with shapes, then paint() turns it into a canvas with soft top-left shading
// and a coloured outline (each outline pixel is a dark version of the colour it wraps).
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x |= 0; y |= 0; if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
  ell(cx, cy, rx, ry, c) {   // c may be a function (x, y) => colour | null
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
  tri(ax, ay, bx, by, cx, cy, c) {
    const e = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx));
    const y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5, w0 = e(bx, by, cx, cy, px, py), w1 = e(cx, cy, ax, ay, px, py), w2 = e(ax, ay, bx, by, px, py);
      if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) this.set(x, y, c);
    }
  }
  map(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) this.d[y * this.w + x] = fn(x, y, c) || c; } }
  outline(col = OUT) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => this.set(x, y, col));
  }
  autoShade() {   // light from the top-left; 1px details keep their exact colour
    const src = this.d.slice(), at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : src[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = at(x, y); if (!c || c === OUT) continue;
      const u = at(x, y - 1), d = at(x, y + 1), l = at(x - 1, y), r = at(x + 1, y);
      if (u !== c && d !== c && l !== c && r !== c) continue;
      if (!u || (!l && u !== c)) this.d[y * this.w + x] = shade(c, 22);
      else if (!d || !r) this.d[y * this.w + x] = shade(c, -24);
    }
  }
  selOutline() {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const below = this.get(x, y + 1), n = below || this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1);
      if (n) add.push([x, y, mixHex(n, OUT, below ? .55 : .75)]);
    }
    add.forEach(([x, y, c]) => this.set(x, y, c));
  }
  canvas() {   // one putImageData, not a fillRect per pixel (those cost ~100 KB of renderer memory per canvas: 18.2)
    const c = mk(this.w, this.h), x = c.getContext('2d'), im = x.createImageData(this.w, this.h), D = im.data;
    for (let p = 0; p < this.w * this.h; p++) { const col = this.d[p]; if (col) D.set(rgbaOf(col), p * 4); }
    x.putImageData(im, 0, 0); return c;
  }
}
// outline: true = shaded + coloured outline, 'plain' = flat dark outline (icons), false = none
function paint(w, h, fn, outline = true) {
  const G = new Grid(w, h); fn(G);
  if (outline === 'plain') G.outline(); else if (outline) { G.autoShade(); G.selOutline(); }
  return G.canvas();
}
function shade(hex, a) { const n = parseInt(hex.slice(1), 16), c = v => clamp(v + a, 0, 255); return '#' + ((1 << 24) | (c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1); }
function mixHex(a, b, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b);
  return '#' + A.map((v, i) => R(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
// tiny icons from strings: rows(['.XX.', 'XXXX'], { X: '#ff0' })
function rows(rs, pal, outline = true) { return paint(rs[0].length + 2, rs.length + 2, G => rs.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) G.set(x + 1, y + 1, pal[ch]); })), outline && 'plain'); }
function flipC(c) { const o = mk(c.width, c.height), x = o.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; }
function tintC(c, col, a) { const o = mk(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a === undefined ? 1 : a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return o; }
// sprite set: r/l facing, white flash, yellow flash, silhouette (for "not found yet" in collections)
function makeSpr(c) { const f = flipC(c); return { w: c.width, h: c.height, r: c, l: f, wr: tintC(c, '#ffffff'), wl: tintC(f, '#ffffff'), yr: tintC(c, '#fff27a'), yl: tintC(f, '#fff27a'), sil: tintC(c, '#3a2c40') }; }
const ART = {}; const art = (k, make) => ART[k] || (ART[k] = make());   // lazy sprite cache
// richer shading for big sprites (bosses): lit(pal, ...) returns a colour picker for G.ell/G.map
const DITHER = [[0, .5], [.75, .25]];
function lit(pal, cx, cy, rx, ry, o = {}) {
  const lx = o.lx === undefined ? .2 : o.lx, bl = o.bl === undefined ? .4 : o.bl, base = o.base === undefined ? .6 : o.base;
  return (x, y) => {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, rr = nx * nx + ny * ny, p = o.belly && ny > bl ? o.belly : pal;
    const v = base - ny * .5 + nx * lx - Math.max(0, rr - .65) * .7 + (DITHER[y & 1][x & 1] - .375) * .09;
    return p[clamp(Math.floor(v * p.length), 0, p.length - 1)];
  };
}
function gLine(G, x0, y0, x1, y1, c, only) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) { const x = R(x0 + (x1 - x0) * i / n), y = R(y0 + (y1 - y0) * i / n); if (!only || G.get(x, y)) G.set(x, y, c); } }
function eyeG(G, x, y, r, iris, pupil = 'round') {
  G.ell(x, y, r + 1, r + 1, OUT); G.ell(x, y, r, r, (px, py) => py + .5 > y + r * .25 ? shade(iris, -34) : iris);
  if (pupil === 'slit') G.rect(R(x - .5), R(y - r * .7), 1, Math.max(2, R(r * 1.4)), OUT); else if (pupil === 'round') G.ell(x + .3, y + .2, Math.max(.8, r * .45), Math.max(.8, r * .5), OUT);
  const hx = R(x - r * .5), hy = R(y - r * .5); G.set(hx, hy, '#ffffff'); if (r >= 3) { G.set(hx + 1, hy, '#ffffff'); G.set(hx, hy + 1, '#ffffff'); }
}
