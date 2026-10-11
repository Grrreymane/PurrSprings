// ============================================================ v2.1 the minimap (SPEC_v2 16.10), core B
// The whole inn at 3 px a tile (120 x 108; 16.10 says 2 px - 18.2: 3 reads better on a phone and the map has its own
// view, the inn page's 「地图」 button): ground by tile kind, areas still shut darkened with their star (or the shrine /
// plaza price) on top; live dots: a dirty room red, a guest asleep warm yellow, the VIP gold, you a white dot that
// fades in and out once a second (no blinking).
const MM = 3, MM_W = MW * MM, MM_H = MH * MM;
const MM_COL = { b: '#2a3a2a', '#': '#7a5a44', f: '#3f6e3c', r: '#8a857a', '~': '#4ab0c8', s: '#c8a878', t: '#d8c88a', '.': '#b8925a', l: '#dcb47e',
  D: '#a06a3a', E: '#d84a3a', g: '#6ab04a', p: '#d8c8a0', k: '#8a9ab0', m: '#9a6038', z: '#e8e2d2', o: '#2f7f86', x: '#b98b5a', q: '#b8b2a4' };
let MM_CV = null, MM_KEY = '';
// the ground layer, redrawn when what is open changes
function miniMapCanvas() {
  const key = Object.keys(S.unlocked).filter(k => S.unlocked[k]).sort().join(',');
  if (MM_CV && MM_KEY === key) return MM_CV;
  MM_KEY = key; MM_CV = mk(MM_W, MM_H);
  const x = MM_CV.getContext('2d');
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const c = MAP[ty][tx]; x.fillStyle = MM_COL[c] || '#5a5a5a'; x.fillRect(tx * MM, ty * MM, MM, MM);
    if (c === 't' || c === 'l' || c === 'm') { x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(tx * MM, ty * MM, MM, 1); }
  }
  // what stands there (blocking props): a darker dot, so the rooms' furniture and the garden's things show
  for (const o of OBJS) if (o.block && o.img) { x.fillStyle = 'rgba(40,24,16,.55)'; x.fillRect(o.tx * MM + 1, o.ty * MM + 1, o.fw * MM - 2 || 1, o.fh * MM - 2 || 1); }
  // shut: areas (except the open-from-the-start ones) and rooms not open yet
  x.fillStyle = 'rgba(16,12,32,.62)';
  for (const a of AREAS) if (!areaOpen(a)) x.fillRect(a.r[0] * MM, a.r[1] * MM, (a.r[2] - a.r[0] + 1) * MM, (a.r[3] - a.r[1] + 1) * MM);
  for (const rm of ROOMS) if (!roomOpen(rm) && areaOpen(areaAt(rm.box[0], rm.box[1]))) x.fillRect(rm.box[0] * MM, rm.box[1] * MM, 4 * MM, 3 * MM);
  return MM_CV;
}
function drawMiniMap(x0, y0) {
  g.fillStyle = OUT; g.fillRect(x0 - 1, y0 - 1, MM_W + 2, MM_H + 2);
  g.drawImage(miniMapCanvas(), x0, y0);
  const dot = (wx, wy, col, a) => { const x = R(x0 + wx / TILE * MM), y = R(y0 + wy / TILE * MM); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = OUT; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = col; g.fillRect(x - 1, y - 1, 3, 3); g.globalAlpha = 1; };
  for (const rm of ROOMS) {
    if (!roomOpen(rm)) continue;
    const st = S.rooms[rm.id], cx = (rm.box[0] + 2) * TILE, cy = (rm.box[1] + 1.5) * TILE;
    if (st === 'messy') dot(cx, cy, '#e04a3a'); else if (st === 'occupied' || (rm.vip && RT[rm.id].guest)) dot(cx, cy, '#ffc84a');
  }
  if (VIPG && VIPG.y < MAPH) dot(VIPG.x, VIPG.y, '#ffd23f');
  // shut areas: their star, or (shrine / plaza) a lock - the price is listed under the map
  for (const a of AREAS) if (a.open && !areaOpen(a) && UNLOCK[a.open]) {
    const cx = x0 + (a.r[0] + a.r[2] + 1) / 2 * MM, cy = y0 + (a.r[1] + a.r[3] + 1) / 2 * MM;
    drawC(a.n ? starIcon(true) : menuIcon('lock'), cx, cy);
  }
  dot(P.x, P.y, '#ffffff', .55 + .45 * Math.sin(T * Math.PI * 2));   // you: 1 Hz, a slow fade (never a hard blink)
}
