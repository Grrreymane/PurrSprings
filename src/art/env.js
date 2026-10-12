/*ART:env:BEGIN*/
// ============================================================ ART: env - scenery tiles (SPEC_v2 12.2; was art/env.js until the stage M merge)
// v1 API (SPEC 4.2, signatures kept): tileArt(ch, tx, ty, nb) , waterArt(frame, tx, ty) , doorArt(kind, open) ,
//   entranceNoren() , lockedShade()
// v2 API (SPEC_v2 12.2):
//   tileArt(ch, tx, ty, nb, season)          16x16, tile top-left. New chars k m z x q o; season 0..3 is in the cache key
//                                             (v2.0 always 0, drawn the same). 'o' = static pond tile (frame 0 of pondArt).
//   doorArt(kind, open, col, emb, gold, tx, ty)  16x16, opaque. kind: left | right | onsen | hdoor | gate | gateH.
//   v2.4: + floor, season, span ('w' 32x16 / 'h' 16x32: a door 2 tiles wide / tall), beyond (hdoor: 'din' | 'sand').
//                                             left/right/hdoor open: noren in colour col (null = v1 indigo / hdoor tea
//                                             brown), 5x5 crest emb (see _EN_EMB), gold = 1px gold edge (suites).
//                                             gate / gateH paint their own paving: pass tx, ty so it lines up
//                                             (defaults (24,4) / (25,29)). The roten gate (24,4) gets the little star
//                                             lamp (also forced by emb 'star'); doorArt('gate', o, 0, 0, 0, 10, 4) = plain.
//   pondArt(frame, tx, ty)                    16x16, tile top-left, opaque, 4 frames; rim from the neighbours seen by tileArt('o').
//   waterfallArt(frame)                       32x40, anchor (0,0) at (31*16, 0), 4 frames, transparent around the fall.
//   wallDecorArt(kind)                        16x16 over a wall-face tile: giftshelf | photo | menu | lantern | bell.
//                                             giftshelf: gift centres (4,8) and (12,8). photo: 8x8 window x 4..11, y 5..12.
//   bambooGroveArt(tx, ty)                    16x24, anchor (0,24) = tile bottom-left (8px overhang above the tile).
//   areaSignArt(n, lit)                       14x18, anchor (7,17).
//   ropeArt(dir)                              16x16, tile top-left; dir 'v' (or 'h').
//   glowArt(r, col)                           2r x 2r, anchor (r,r); draw with 'lighter'.
//   plazaDecor(tx, ty)                        16x16, tile top-left, transparent overlay for 'q' tiles.
// v2.1 API (SPEC_v2 16.14; details next to each function in env-api.js):
//   tileArt(..., season) four outdoor palettes | pondArt / waterfallArt / bambooGroveArt / doorArt take a season too
//   treeArt(kind, season, size) | wallDecorArt trophy / cover / family | hokoraArt(lv, season) 48x44 |
//   toriiArt(season) 48x36 | komainuArt(side, season) 14x18 | shrineLanternArt(lit, season) 12x22 |
//   chochinString(lit) 32x10 | snowCapArt(c) | seasonWarm(season, budget)
// Floor-type tiles are painted as a function of WORLD pixels (tx*16+x, ty*16+y), so plank joints, paving stones,
// grass patches, rocks, bushes and ripples run on across tile borders. Variation is hashed from coordinates.
// Light comes from the top-left; transitions are dithered (4x4 Bayer); private names start with _en.
// v2 map = the v1 map moved right by 10 columns: the few v1 spots baked in here (lobby carpet, facade windows) moved too.

const _EN = {
  wood: '#c8935a', woodS: '#b07a45', woodH: '#dba876',
  dw: '#7a4a2a', dwD: '#5a3420', dwH: '#9a6038',
  tat: '#cdbf7a', tatW: '#b8aa62', tatH: '#e0d494', heri: '#3d5a3a',
  pl: '#f0e6d0', plS: '#d8cbb0',
  top: '#4a3a3a', topD: '#3a2c30',
  paper: '#fbf6e8', paperF: '#8a5a34',
  ind: '#2f4a7a', wht: '#f4f0e6', red: '#c8463a',
  sl: '#a8a8a0', slD: '#8a8a84', slH: '#c4c2b8', rk: '#7a7a78', rkD: '#5e5e60',
  wa: '#4cbaa4', waD: '#2f9a88', waH: '#86dcc4', foam: '#e6faf2',   // v2.0.1 A4: jade-green onsen water (was cyan)
  gr: '#6aa84a', grD: '#5a9640', grH: '#84c060', step: '#b8b2a4',
  bam: '#7cb84a', bamD: '#5a9a3a', rope: '#c8a860',
  lan: '#e0503a', warm: '#ffd27a',
  // v2 materials (SPEC_v2 2.1)
  kit: '#8e9cac', kitD: '#7c8a9c', kitG: '#566072', kitH: '#adb8c4',
  din: '#9a6038', dinD: '#7a4a2a', dinS: '#55321e', dinH: '#b47c4a',
  goza: '#c9b46c', gozaW: '#b19c58', gozaH: '#dccb86',
  sand: '#e0dccf', sandS: '#c6bfac', sandH: '#f3f0e8',
  deck: '#d2a870', deckD: '#b88c56', deckH: '#e6c48e', deckS: '#6e4e30',   // v2.0.1 A4: hinoki deck (was cedar)
  qs: '#b8b2a4', qsD: '#a09a8c', qsJ: '#7e786c', qsH: '#d2ccbe',
  pond: '#2f7f86', pondD: '#24666e', pondH: '#5aa4a4',
  cedar: '#8a5a34', cedarH: '#b07a45', cedarD: '#5a3420', dry: '#c9b273', dryD: '#8f7a3e', dryH: '#e2cf92',
};
// v1 spots, moved with the map (+10 columns)
const _EN_CARPET = [259, 300];                                       // lobby runner, world x (v1 99..140)
const _EN_WIN = { 29: [12, 21], 14: [28, 35], 23: [28, 35] };       // facade windows: row -> left tile of each 2-tile window
const _EN_ZEN = [[35 * 16 + 8, 16 * 16 + 10], [37 * 16 + 8, 17 * 16 + 10]];   // karesansui rocks (SPEC_v2 2.4): rake rings
const _EN_FACADE = new Set(['b', 'g', 'p', 'q', 'o', 'z', 'x', 'f']);   // a wall face with one of these below is an outside wall
const _EN_B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function _enBay(x, y) { return (_EN_B4[y & 3][x & 3] + .5) / 16; }
function _enH(a, b, s) {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n = Math.imul(n ^ (n >>> 16), 668265263);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}
function _enVN(x, y, s) {   // smooth value noise in 0..1
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = _enH(xi, yi, s), b = _enH(xi + 1, yi, s), c = _enH(xi, yi + 1, s), d = _enH(xi + 1, yi + 1, s);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
const _EN_MX = new Map();
function _enM(a, b, t) {   // memoised mixHex (t quantised so the cache stays small)
  t = Math.round(t * 40) / 40; if (t <= 0) return a; if (t >= 1) return b;
  const k = a + b + t; let v = _EN_MX.get(k); if (v === undefined) _EN_MX.set(k, v = mixHex(a, b, t)); return v;
}
// Grid -> canvas. v2.1: one putImageData like Grid.canvas (CRP-1: fillRect-painted canvases cost the renderer far more
// memory, and four seasons of outdoor tiles end up in the ART cache); same pixels as the old fillRect runs
function _enCanvas(G) { return G.canvas(); }
function _enMake(w, h, fn) { const G = new Grid(w, h); fn(G); return _enCanvas(G); }
// ambient occlusion along walls: walls / doors / fences above or to the left cast a soft shadow onto the floor
function _enAO(G, nb, dark, k) {
  const hard = c => c === '#' || c === 'D' || c === 'b';
  const u = hard(nb.u), l = hard(nb.l), r = hard(nb.r);
  if (!u && !l && !r) return;
  k = k || 1;
  G.map((x, y, c) => {
    let t = 0;
    if (u) t = Math.max(t, y === 0 ? .42 : y === 1 ? .26 : y === 2 && _enBay(x, y) < .5 ? .13 : 0);
    if (l) t = Math.max(t, x === 0 ? .32 : x === 1 ? .17 : x === 2 && _enBay(x, y) < .5 ? .08 : 0);
    if (r) t = Math.max(t, x === 15 ? .14 : 0);
    return t ? _enM(c, dark, t * k) : c;
  });
}

// ------------------------------------------------------------ v2.1 seasons (SPEC_v2 16.1 / 16.14)
// season 0 spring = the v2.0 look + fallen sakura petals; 1 summer = deep lush green, hydrangeas in the bushes;
// 2 autumn = golden lawn, red / orange bushes, fallen leaves; 3 winter = snow on lawns, bushes, rocks, walks, fences,
// the outer walls' tops and eaves. Only outdoor chars change; rooms, corridors, the lobby, kitchen and dining never do.
const _EN_SEA = [
  { gr: '#6aa84a', grD: '#5a9640', grH: '#84c060', tuft: '#4a8636', ao: '#24402a' },
  { gr: '#589e40', grD: '#478a35', grH: '#73b650', tuft: '#36742c', ao: '#1c3622' },
  { gr: '#94a84a', grD: '#7c8e3e', grH: '#b0bc5c', tuft: '#627030', ao: '#363a20' },
  { gr: '#e3eaf3', grD: '#ccd6e5', grH: '#f2f6fb', tuft: '#6a7e5a', ao: '#5a6888' },
];
const _EN_SN = { w: '#ffffff', h: '#f2f6fb', b: '#e3eaf3', s: '#ccd6e5', d: '#aebbd0', e: '#8d9bb5', ice: '#c4e2ee', iceH: '#eaf8fc' };
const _enSP = s => _EN_SEA[(s | 0) & 3];
// a snow-field pixel at world (wx, wy): soft drifts, lit and shaded patches dithered (no blur)
function _enSnowAt(wx, wy, x, y) {
  const n = _enVN(wx / 12, wy / 9, 501), d = _enBay(x, y);
  if (n > .7 && d < (n - .7) * 3.2) return _EN_SN.w;
  if (n > .55 && d < (n - .55) * 2.6) return _EN_SN.h;
  if (n < .33 && d < (.33 - n) * 3.2) return _EN_SN.s;
  return _EN_SN.b;
}
// snow lying on part of a tile: cover(x, y) (tile px, may be asked for -1..16 so the edges match the neighbours) says
// where. A lit top rim, the drift's thickness on its lower edge and a soft shadow on the ground just under it.
function _enSnowOver(G, tx, ty, cover) {
  const M = new Uint8Array(18 * 18), at = (x, y) => M[(y + 1) * 18 + x + 1];   // the cover asked once per pixel (-1..16)
  for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++) M[(y + 1) * 18 + x + 1] = cover(x, y) ? 1 : 0;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (at(x, y)) {
      let c = _enSnowAt(tx * 16 + x, ty * 16 + y, x, y);
      if (!at(x, y + 1)) c = _EN_SN.s; else if (!at(x, y - 1) || !at(x - 1, y)) c = c === _EN_SN.s ? _EN_SN.b : _EN_SN.w;
      G.set(x, y, c);
    } else if (at(x, y - 1) && G.get(x, y)) G.set(x, y, _enM(G.get(x, y), '#2a3450', .3));
  }
}
// where a drift piles up against a tile's edges: fully along sides whose neighbour is in `against`, ragged (2..5 px)
function _enDrift(tx, ty, nb, against, depth) {
  const on = c => against.indexOf(c == null ? 'b' : c) >= 0, U = on(nb.u), D = on(nb.d), L = on(nb.l), Rr = on(nb.r);
  depth = depth || 4;
  const f = s => 1 + Math.floor(_enVN(s / 4, tx * 3 + ty, 511) * depth), A = k => Array.from({ length: 18 }, (_, i) => f(i - 1 + k));
  const fU = A(tx * 16), fL = A(ty * 16 + 40), fR = A(ty * 16 + 80), fD = A(tx * 16 + 120);
  return (x, y) => (U && y < fU[x + 1]) || (L && x < fL[y + 1]) || (Rr && 15 - x < fR[y + 1] - 1) || (D && 15 - y < fD[x + 1] - 1);
}
// fallen petals (spring) / leaves (autumn): hashed, a few per tile, more near the sakura grove / the maples (map.js
// SCENERY) and under the shrine's trees; ok(x, y) keeps them off what they must not cover (stones, the pond rim)
const _EN_GROVE = [[29.5 * 16, 25.5 * 16, 6 * 16], null, [35 * 16, 16.5 * 16, 5 * 16]];
const _EN_LEAF = [['#d8442a', '#f07a4a', '#9a2a1e'], ['#e0702a', '#f8a050', '#a8461a'], ['#e8b030', '#fcd868', '#a87818'], ['#b86a34', '#d8904c', '#7a4220']];
function _enScatter(G, tx, ty, season, base, ok) {
  if (season !== 0 && season !== 2) return;
  const gv = _EN_GROVE[season], near = clamp(1 - Math.hypot(tx * 16 + 8 - gv[0], ty * 16 + 8 - gv[1]) / gv[2], 0, 1);
  const n = Math.floor(_enH(tx, ty, 601 + season) * (base + near * 3.6) + near * .8);
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < 16 && y < 16 && (!ok || ok(x, y))) G.set(x, y, c); };
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(_enH(tx, ty, 610 + i) * 13), y = 1 + Math.floor(_enH(ty, tx, 620 + i) * 13), h = _enH(tx + i, ty, 630);
    if (ok && !ok(x, y)) continue;
    const sh = (px, py) => { if (px < 16 && py < 16 && G.get(px, py) && (!ok || ok(px, py))) G.set(px, py, _enM(G.get(px, py), '#2a2430', .22)); };
    if (season === 0) {   // a sakura petal: two or three pink pixels, lit on the left
      put(x, y, '#fde2ea'); put(x + 1, y, '#f4b0c4');
      if (h < .4) put(x + 1, y + 1, '#e898b0'); else if (h > .8) put(x - 1, y + 1, '#f8c8d8');
      sh(x + 1, y + (h < .4 ? 2 : 1));
    } else {              // an autumn leaf: a little maple star (red / orange) or a ginkgo / oak leaf (yellow / brown)
      const L = _EN_LEAF[Math.floor(h * 4)];
      if (h < .5) { sh(x + 1, y + 2); sh(x + 2, y + 1); put(x, y - 1, L[1]); put(x - 1, y, L[1]); put(x, y, L[0]); put(x + 1, y, L[0]); put(x, y + 1, L[2]); }
      else { sh(x + 1, y + 1); sh(x + 2, y + 1); put(x, y, L[1]); put(x + 1, y, L[0]); put(x + 1, y - 1, L[0]); if (h > .75) put(x + 2, y, L[2]); }
    }
  }
}

// ------------------------------------------------------------ walls
function _enCap(G, under) {   // top 5 rows of every wall face: rim + wall-top cap, then the beam (nageshi) (v2.4: G.w wide)
  const W = G.w;
  G.rect(0, 0, W, 1, under ? _EN.top : '#8a7470'); G.rect(0, 1, W, 1, _EN.topD);
  G.rect(0, 2, W, 1, _EN.dwH); G.rect(0, 3, W, 1, _EN.dw); G.rect(0, 4, W, 1, _EN.dwD);
}
function _enWallFace(G, tx, ty, nb, season) {
  if (nb.d === 'D' && (nb.u === '#' || nb.u === 'b')) {   // v2.5: a vertical wall ending at a doorway: its top runs on, only a low end face shows (no transom box)
    _enWallTop(G, tx, ty, Object.assign({}, nb, { d: '#' }), season);
    for (let x = 0; x < 16; x++) { G.set(x, 11, _EN.plS); G.set(x, 12, _EN.pl); G.set(x, 13, _EN.pl); G.set(x, 14, _EN.dwH); G.set(x, 15, _EN.dwD); }
    return;
  }
  const facade = _EN_FACADE.has(nb.d);
  if (facade) {   // outside: a little tiled eave (kawara) over plaster and dark cedar boards
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, k = wx % 4;
      G.set(x, 0, nb.u === '#' ? '#3c4252' : '#6e7890');
      G.set(x, 1, k === 0 ? '#3a4050' : '#5a6478');
      G.set(x, 2, k === 0 ? '#343a4a' : k === 1 ? '#74809a' : '#525c70');
      G.set(x, 3, k === 0 ? '#2c3040' : '#48506a');
      G.set(x, 4, k === 0 || k === 3 ? '#2a2c3c' : '#3e4558');
      G.set(x, 5, '#2a2430');
    }
  } else {
    _enCap(G, nb.u === '#');
  }
  for (let y = facade ? 6 : 5; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c = _EN.pl;
    if (y === (facade ? 6 : 5)) c = _EN.plS; else if (y === (facade ? 7 : 6) && _enBay(x, y) < .5) c = _EN.plS;
    else if (_enH(tx * 16 + x, ty * 16 + y, 9) < .07) c = _enM(_EN.pl, _EN.plS, .45);
    G.set(x, y, c);
  }
  const postTop = facade ? 6 : 5;
  if (facade) {
    const wl = _EN_WIN[ty] || [], left = wl.indexOf(tx) >= 0, win = left || wl.indexOf(tx - 1) >= 0;   // lattice windows
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, b = wx % 4;
      G.set(x, 10, _EN.dw);
      for (let y = 11; y < 15; y++) G.set(x, y, b === 0 ? '#3a2418' : b === 1 ? '#6a4630' : '#55382a');
      G.set(x, 15, _enH(wx, 3, 5) < .5 ? '#8a8a84' : '#7a7a78');
    }
    if (win) {
      const x0 = left ? 3 : 0, x1 = left ? 15 : 12;
      for (let x = x0; x <= x1; x++) for (let y = 6; y <= 11; y++) {
        const edge = (left && x === x0) || (!left && x === x1) || y === 6 || y === 11;
        G.set(x, y, edge ? _EN.dwD : (x & 1) ? _EN.dw : (y < 8 ? '#fff4d8' : '#f6e6c0'));
      }
      for (let x = x0; x <= x1; x++) G.set(x, 12, x === x0 || x === x1 ? _EN.dwD : _EN.dwH);
    }
  } else {
    G.rect(0, 13, 16, 1, _EN.plS); G.rect(0, 14, 16, 1, _EN.dwH); G.rect(0, 15, 16, 1, _EN.dwD);
  }
  // posts (hashira) every two tiles and at every free end of a wall
  const post = (x0, lit) => {
    for (let y = postTop; y < 16; y++) { G.set(x0, y, lit ? _EN.dwH : _EN.dw); G.set(x0 + 1, y, lit ? _EN.dw : _EN.dwD); }
    if (lit) for (let y = postTop; y < 13; y++) if (G.get(2, y) === _EN.pl) G.set(2, y, _enM(_EN.pl, _EN.plS, .5));
  };
  if ((tx & 1) || nb.l !== '#') post(0, true);
  if (nb.r !== '#') post(14, false);
  if (season === 3 && facade) {   // winter: snow on the tiled eave, a few short icicles under it
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, k = wx % 4, lip = 2 + (_enH(wx >> 1, ty, 521) < .35 ? 1 : 0);
      for (let y = 0; y < lip; y++) G.set(x, y, y === 0 ? (nb.u === '#' ? _EN_SN.s : _EN_SN.w) : y === lip - 1 ? _EN_SN.s : _enSnowAt(wx, ty * 16 + y, x, y));
      if (k === 1 && lip === 2) G.set(x, 2, _EN_SN.d);
      const ic = _enH(wx, ty, 522);
      if (ic < .16 && x > 1 && x < 14) { G.set(x, 6, _EN_SN.iceH); G.set(x, 7, _EN_SN.ice); if (ic < .07) G.set(x, 8, _EN_SN.ice); }
    }
  }
}
// v2.1: is this wall-top tile on the outside of a building (snow lies on it in winter)? Inside walls stay as they are.
const _EN_OUTCH = new Set(['g', 'f', 'b', 'r', 'p', 'z', 'x', 'q', 's', 'o', '~', 'E']);
function _enExposed(nb) { return [nb.u, nb.d, nb.l, nb.r].some(c => c == null || _EN_OUTCH.has(c)); }
function _enWallTop(G, tx, ty, nb, season) {
  const open = c => c !== '#' && c != null;
  const vert = nb.u === '#' || nb.d === '#';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, a = vert ? wx : wy, b = vert ? wy : wx;   // a: across the run, b: along it
    let c = _EN.top;
    if (a % 16 === 5 || a % 16 === 11) c = _enH(a, b >> 2, 31) < .7 ? '#423236' : _EN.top;   // two quiet grain lines
    else if (a % 16 === 8 && _enH(a, b >> 3, 32) < .35) c = '#52424a';
    G.set(x, y, c);
  }
  if (open(nb.l)) for (let y = 0; y < 16; y++) { G.set(0, y, '#9a8480'); G.set(1, y, '#5e4c4c'); }
  if (open(nb.r)) for (let y = 0; y < 16; y++) { G.set(15, y, '#76625e'); G.set(14, y, _EN.topD); }
  if (open(nb.u)) for (let x = 0; x < 16; x++) { G.set(x, 0, '#9a8480'); G.set(x, 1, '#5e4c4c'); }
  if (season === 3 && _enExposed(nb)) {   // winter: a band of snow along each side of the wall top that faces the outside
    const out = c => c == null || _EN_OUTCH.has(c);
    const band = (k, s0) => Array.from({ length: 18 }, (_, i) => 3 + Math.floor(_enVN((s0 + i - 1) / 5, k, 523) * 3));   // ragged inner edge, 3..5 px
    const bU = band(1, tx * 16), bL = band(2, ty * 16), bR = band(3, ty * 16), bD = band(4, tx * 16);
    const oU = out(nb.u), oL = out(nb.l), oR = out(nb.r), oD = nb.d == null;
    const cov = (x, y) => x >= -1 && x <= 16 && y >= -1 && y <= 16 && ((oU && y >= 0 && y < bU[x + 1] - 1) || (oL && x >= 2 && x < 2 + bL[y + 1]) ||
      (oR && x <= 13 && x > 13 - bR[y + 1]) || (oD && y <= 13 && y > 13 - bD[x + 1]));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!cov(x, y)) { if (cov(x - 1, y) || cov(x, y - 1)) G.set(x, y, _enM(G.get(x, y), '#1a1422', .35)); continue; }
      let c = _enSnowAt(tx * 16 + x, ty * 16 + y, x, y);
      if (!cov(x + 1, y) || !cov(x, y + 1)) c = _EN_SN.s; else if (!cov(x - 1, y) || (y > 0 && !cov(x, y - 1))) c = _EN_SN.w;
      G.set(x, y, c);
    }
  }
}
// winter, a wall face with the outside right above it: a line of snow on the wall's top edge (rows 0-1, the cap)
function _enCapSnow(G, tx) {
  for (let x = 0; x < G.w; x++) {
    const wx = tx * 16 + x;
    G.set(x, 0, _EN_SN.w); G.set(x, 1, _enH(wx, 1, 524) < .6 ? _EN_SN.b : _EN_SN.s);
    if (_enH(wx >> 1, 2, 525) < .25) G.set(x, 2, _EN_SN.s);
  }
}

// ------------------------------------------------------------ floors
function _enTatami(G, tx, ty, nb) {
  const top = ((tx + ty) & 1) === 0, v = _enH(tx, top ? ty : ty - 1, 3);
  const base = v < .33 ? _enM(_EN.tat, _EN.tatW, .2) : v > .7 ? _enM(_EN.tat, _EN.tatH, .25) : _EN.tat;
  const weave = _enM(base, _EN.tatW, .55), hi = _enM(base, _EN.tatH, .6);
  for (let y = 0; y < 16; y++) for (let x = 1; x < 15; x++) G.set(x, y, (y & 1) ? weave : base);
  for (let y = 0; y < 16; y++) { G.set(0, y, _EN.heri); G.set(15, y, _enM(_EN.heri, OUT, .2)); G.set(1, y, hi); G.set(14, y, _enM(base, _EN.tatW, .8)); }
  if (top) { for (let x = 1; x < 15; x++) { G.set(x, 0, _enM(base, '#6a5a28', .7)); G.set(x, 1, hi); } }
  else for (let x = 1; x < 15; x++) { G.set(x, 15, _enM(base, '#8a7a3a', .55)); G.set(x, 14, _enM(base, _EN.tatW, .7)); }
  _enAO(G, nb, OUT);
}
function _enPlanks(G, tx, ty, o) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, row = Math.floor(wy / o.ph), py = wy - row * o.ph;
    const sx = wx + Math.floor(_enH(row, o.salt, 11) * o.len), seg = Math.floor(sx / o.len), jx = sx - seg * o.len;
    const tone = _enH(row, seg, o.salt);
    let c = tone < .3 ? o.lo : tone > .72 ? o.lt : o.base;
    if (py === 0 || jx === 0) c = o.seam;
    else if (py === 1) c = _enM(c, o.hi, o.hiK);
    else if (py === o.ph - 1) c = _enM(c, o.seam, .3);
    else if (py === (o.ph >> 1) && _enH(Math.floor(wx / 6), row, o.salt + 7) < o.grain) c = _enM(c, o.seam, .45);
    if (jx === 1 && py > 0) c = _enM(c, o.hi, .4);
    G.set(x, y, c);
  }
}
function _enCorridor(G, tx, ty, nb) {
  _enPlanks(G, tx, ty, { ph: 4, len: 44, salt: 1, grain: .1, hiK: .28, base: _EN.wood, lt: _enM(_EN.wood, _EN.woodH, .2), lo: _enM(_EN.wood, _EN.woodS, .25), seam: _enM(_EN.woodS, _EN.dw, .12), hi: _EN.woodH });
  if (nb.d === 'l') for (let x = 0; x < 16; x++) { G.set(x, 14, _EN.dwH); G.set(x, 15, _EN.dwD); }   // threshold into the lobby
  _enAO(G, nb, OUT);
}
function _enLobby(G, tx, ty, nb) {
  const base = _enM(_EN.wood, _EN.dwH, .42);
  _enPlanks(G, tx, ty, { ph: 8, len: 60, salt: 2, grain: .22, hiK: .45, base, lt: _enM(base, _EN.wood, .35), lo: _enM(base, _EN.dw, .25), seam: _EN.dw, hi: _enM(base, _EN.woodH, .55) });
  const C0 = _EN_CARPET[0], C1 = _EN_CARPET[1];
  if (tx * 16 + 16 >= C0 && tx * 16 <= C1 + 1) {   // red felt runner (mosen) from the entrance to the corridor
    const RD = '#b8443a', RDk = '#9a3430', RDh = '#cc5a46', ED = '#7a2626', GO = '#d8a04a';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, wy = ty * 16 + y, a = wx - C0, b = C1 - wx;   // carpet spans world x C0..C1
      if (a < 0 || b < 0) { if (a === -1 || b === -1) G.set(x, y, _enM(G.get(x, y), OUT, .25)); continue; }
      const e = Math.min(a, b);
      let c = e === 0 ? ED : e === 2 ? GO : e === 1 ? RDk : e === 3 ? RDh : (_enH(wx, wy, 41) < .015 ? RDk : RD);
      if (b === 0 || (b === 1)) c = _enM(c, OUT, .15);
      G.set(x, y, c);
    }
    if (nb.u !== 'l') for (let x = 0; x < 16; x++) { const wx = tx * 16 + x; if (wx >= C0 && wx <= C1) { G.set(x, 0, ED); G.set(x, 1, _EN.dwD); G.set(x, 2, (wx & 1) ? GO : ED); } }
    if (nb.d !== 'l') for (let x = 0; x < 16; x++) { const wx = tx * 16 + x; if (wx >= C0 && wx <= C1) { G.set(x, 13, (wx & 1) ? GO : ED); G.set(x, 14, ED); G.set(x, 15, _enM(G.get(x, 15), OUT, .3)); } }
  }
  _enAO(G, nb, OUT);
}
function _enSlate(G, tx, ty, nb, season) {
  season = (season | 0) & 3;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, row = Math.floor(wy / 8), py = wy - row * 8;
    const L = 14 + Math.floor(_enH(row, 0, 51) * 8), sx = wx + Math.floor(_enH(row, 1, 52) * L), seg = Math.floor(sx / L), jx = sx - seg * L;
    const t = _enH(row, seg, 53);
    let c = t < .3 ? _enM(_EN.sl, _EN.slD, .3) : t > .75 ? _enM(_EN.sl, _EN.slH, .3) : _EN.sl;
    if (py === 0 || jx === 0) c = _EN.slD;
    else if (py === 1 || jx === 1) c = _enM(c, _EN.slH, .6);
    else if (py === 7 || jx === L - 1) c = _enM(c, _EN.slD, .45);
    else if (_enH(wx, wy, 54) < .05) c = _enM(c, _EN.slD, .4);
    else if (py === 3 && jx === 3 && _enH(seg, row, 55) < .4) c = _enM(c, '#eef4f4', .5);   // wet glints
    G.set(x, y, c);
  }
  if (nb.u === '~') {   // the pool's stone lip
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x;
      G.set(x, 0, '#2a7e6e'); G.set(x, 1, '#dcdad0'); G.set(x, 2, _EN.slH); G.set(x, 3, (wx % 20 === 0) ? _EN.slD : '#b4b2aa'); G.set(x, 4, _EN.slD);
      if (_enBay(x, 5) < .5) G.set(x, 5, _enM(G.get(x, 5), '#5a8c80', .3));
    }
  }
  const soft = { u: nb.u === 'r' || nb.u === '#' || nb.u === 'D' ? '#' : null, l: nb.l === 'f' || nb.l === 'r' ? '#' : null, r: nb.r === 'f' || nb.r === 'r' ? '#' : null };
  if (season === 3) _enSnowOver(G, tx, ty, _enDrift(tx, ty, nb, 'frbg', 4));   // winter: snow banked against the bushes and rocks; the warm wet stone stays clear
  else _enScatter(G, tx, ty, season, 1.15, (x, y) => !(nb.u === '~' && y < 5));
  _enAO(G, soft, OUT, .8);
}
function _enGenkan(G, tx, ty, nb) {   // entrance stone (genkan): shaded doorway at the top, big slabs, a light sill at the bottom
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, jx = (wx + 4) % 16, t = _enH(Math.floor((wx + 4) / 16), 7, 61);
    let c = t < .5 ? '#b4aea0' : '#bcb6a8';
    if (jx === 0 || y === 6) c = _EN.slD; else if (jx === 1 || y === 7) c = _enM(c, _EN.slH, .6);
    if (y < 6) c = _enM(c, '#2a2430', y < 3 ? .7 : (y < 5 || _enBay(x, y) < .5) ? .55 : .4);
    G.set(x, y, c);
  }
  for (let x = 0; x < 16; x++) { G.set(x, 14, '#d0ccc0'); G.set(x, 15, _EN.slD); }
  if (nb.l === '#') for (let y = 0; y < 14; y++) G.set(0, y, _enM(G.get(0, y), OUT, .3));
}
function _enGrass(G, tx, ty, nb, season) {
  season = (season | 0) & 3;
  if (season === 3) { _enSnowLawn(G, tx, ty, nb); return; }
  const P = _EN_SEA[season];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, n = _enVN(wx / 11, wy / 9, 71), d = _enBay(x, y);
    let c = P.gr;
    if (n > .64 && d < (n - .64) * 4) c = P.grH; else if (n < .34 && d < (.34 - n) * 4) c = P.grD;
    if (season === 2 && _enVN(wx / 7, wy / 6, 541) > .7 && d < .5) c = _enM(c, '#c8a85a', .45);   // autumn: dry straw-coloured patches
    G.set(x, y, c);
  }
  const tuft = (x, y) => {   // a little three-blade tuft, lit on the left blade
    [[0, 0, P.tuft], [-1, 0, P.grD], [1, 0, P.grD], [-1, -1, P.grH], [1, -1, P.tuft], [0, -1, P.grD], [-2, -2, P.grH], [2, -2, P.grD], [0, -2, P.grH]]
      .forEach(([dx, dy, c]) => G.set(x + dx, y + dy, c));
    if (season === 1 && _enH(x, y + tx, 542) < .5) { G.set(x, y - 3, P.grH); G.set(x + 1, y - 3, P.grD); }   // summer: taller blades
  };
  const n = Math.floor(_enH(tx, ty, 72) * (season === 1 ? 3.6 : 2.6));
  for (let i = 0; i < n; i++) tuft(3 + Math.floor(_enH(tx, ty, 73 + i) * 10), 4 + Math.floor(_enH(ty, tx, 75 + i) * 10));
  const f = _enH(tx, ty, 77);
  if (season === 0 && f < .32) {   // spring: a pair of tiny flowers
    const cols = [['#ffffff', '#ffe27a'], ['#ff9ab8', '#fff0f4'], ['#ffe066', '#ffffff']][Math.floor(_enH(tx, ty, 78) * 3)];
    const fx = 3 + Math.floor(_enH(tx, ty, 79) * 10), fy = 3 + Math.floor(_enH(ty, tx, 80) * 10);
    const flower = (x, y) => { G.set(x, y + 1, '#4a8636'); G.set(x - 1, y, cols[0]); G.set(x + 1, y, cols[0]); G.set(x, y - 1, cols[0]); G.set(x, y, cols[1]); };
    flower(fx, fy); if (f < .16) flower(fx + (fx > 8 ? -3 : 3), fy + 2);
  } else if (season === 1 && f < .2) {   // summer: white clover heads in the long grass
    const fx = 3 + Math.floor(_enH(tx, ty, 79) * 10), fy = 3 + Math.floor(_enH(ty, tx, 80) * 10);
    G.set(fx, fy + 1, P.tuft); G.set(fx, fy, '#f4f4ec'); G.set(fx + 1, fy, '#ffffff'); G.set(fx, fy - 1, '#ffffff'); G.set(fx + 1, fy + 1, '#d8dcd0');
    if (f < .07) { G.set(fx + 4, fy + 3, '#ffe066'); G.set(fx + 4, fy + 4, P.tuft); }
  }
  _enScatter(G, tx, ty, season, season === 0 ? 1.8 : 2.2);
  _enAO(G, nb, P.ao, .9);
}
// winter lawn: deep snow with soft drifts, a few dry blades poking through, now and then a line of cat paw prints
function _enSnowLawn(G, tx, ty, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) G.set(x, y, _enSnowAt(tx * 16 + x, ty * 16 + y, x, y));
  const n = Math.floor(_enH(tx, ty, 72) * 2.2);
  for (let i = 0; i < n; i++) {   // dry grass poking through, its little blue hollow in the snow
    const x = 3 + Math.floor(_enH(tx, ty, 73 + i) * 10), y = 4 + Math.floor(_enH(ty, tx, 75 + i) * 10);
    G.set(x - 1, y + 1, _EN_SN.s); G.set(x, y + 1, _EN_SN.s); G.set(x + 1, y + 1, _EN_SN.s);
    G.set(x, y, '#7a8a5a'); G.set(x - 1, y - 1, '#9aa070'); G.set(x + 1, y - 1, '#6a7a4e'); if (i & 1) G.set(x, y - 2, '#b0a878');
  }
  if (_enH(tx, ty, 543) < .14) {   // paw prints crossing the tile
    const dir = _enH(ty, tx, 544) < .5 ? 1 : -1, y0 = 3 + Math.floor(_enH(tx, ty, 545) * 6);
    for (let k = 0; k < 4; k++) {
      const px = 2 + k * 4, py = y0 + (dir > 0 ? k : 3 - k) + ((k & 1) ? 2 : 0);
      G.set(px, py, _EN_SN.d); G.set(px + 1, py, _EN_SN.s); G.set(px, py + 1, _EN_SN.s);
    }
  }
  _enAO(G, nb, _EN_SEA[3].ao, .7);
}
function _enPath(G, tx, ty, nb, season) {   // fitted-stone walk (nobedan) in the middle, raked gravel with a grass fringe at the sides
  season = (season | 0) & 3;
  if (!(ty >= 30 && tx >= 15 && tx <= 19)) { _enGardenPath(G, tx, ty, nb, season); return; }   // only the front approach is the v1 wide walk
  const P = _EN_SEA[season], snow = season === 3, edgeL = nb.l === 'g' || nb.l === 'b', edgeR = nb.r === 'g' || nb.r === 'b';
  const STONES = ['#bcb6a8', '#c6c0b2', '#b0aa9c', '#c0b8a4', '#b8b4aa'];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    let c;
    if (edgeL || edgeR) {
      const h = _enH(wx, wy, 81);
      c = h < .14 ? '#b4ad9e' : h > .9 ? '#e4dfd2' : (wy % 3 === 0 && _enH(wx >> 2, wy, 82) < .5) ? '#c6bfae' : '#d2cbbb';
      const inner = edgeL ? 15 - x : x;    // distance from the stone walk
      if (inner === 0) c = '#8a8478'; else if (inner === 1) c = '#d6d2c6'; else if (inner === 2) c = '#a8a294';
      const outer = edgeL ? x : 15 - x, fr = 1 + Math.floor(_enVN(wy / 3, tx, 83) * 4);
      if (outer < fr) c = (outer === fr - 1) ? P.grD : (_enH(wx, wy, 84) < .3 ? P.grH : P.gr);
      else if (outer === fr) c = _enM(c, '#5a5040', .3);
      if (snow) {   // winter: the gravel strips are banked with snow up to the kerb; the kerb's top still shows
        const bank = 2 + Math.floor(_enVN(wy / 4, tx, 551) * 2);
        c = inner === 0 ? '#8a8478' : inner < bank ? (inner === bank - 1 ? _EN_SN.s : _EN_SN.d) : inner === bank ? _EN_SN.w : _enSnowAt(wx, wy, x, y);
      }
    } else {
      // Voronoi stones on a jittered 9px lattice
      const S = 9, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
      let d1 = 99, d2 = 99, bx = 0, by = 0, bi = 0, bj = 0;
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const px = i * S + 1 + _enH(i, j, 85) * (S - 2), py = j * S + 1 + _enH(j, i, 86) * (S - 2), d = Math.hypot(wx + .5 - px, wy + .5 - py);
        if (d < d1) { d2 = d1; d1 = d; bx = px; by = py; bi = i; bj = j; } else if (d < d2) d2 = d;
      }
      const e = d2 - d1, base = STONES[Math.floor(_enH(bi, bj, 87) * STONES.length)];
      if (e < 1.1) c = snow ? (((wx + wy) & 1) ? _EN_SN.b : _EN_SN.s) : _enH(wx, wy, 88) < .15 ? '#6e8a4a' : '#7e786c';   // mortar, a little moss (winter: snow in the joints)
      else if (e < 2.4) c = (wx + .5 - bx) + (wy + .5 - by) < 0 ? _enM(base, '#ffffff', .3) : _enM(base, '#5a5040', .22);
      else c = _enH(wx, wy, 89) < .06 ? _enM(base, '#5a5040', .15) : base;
      if (snow && e >= 1.1) c = _enM(c, '#dfe6f0', .14);
    }
    G.set(x, y, c);
  }
  _enScatter(G, tx, ty, season, 1.3);
  _enAO(G, nb, snow ? _EN_SEA[3].ao : '#3a3428', .8);
}
// v2: narrow garden walks (1 tile wide, junctions, the hedge gap): fine gravel, a grass fringe where grass meets it,
// flat stepping stones (tobi-ishi) laid along every arm of the walk. v2.1 winter: snow over the gravel, the stones swept.
function _enGardenPath(G, tx, ty, nb, season) {
  season = (season | 0) & 3;
  const P = _EN_SEA[season], snow = season === 3;
  const arm = c => c === 'p' || c === 'D' || c === 'E';
  const green = c => c === 'g' || c === 'f' || c === 'o' || c === 'z';
  const aU = arm(nb.u), aD = arm(nb.d), aL = arm(nb.l), aR = arm(nb.r);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, h = _enH(wx, wy, 221);
    let c = h < .12 ? '#b4ad9e' : h > .92 ? '#e6e1d4' : ((wx + wy) % 5 === 0 && _enH(wx >> 2, wy >> 1, 222) < .45) ? '#c6bfae' : '#d4cdbd';
    const fr = s => 1 + Math.floor(_enVN(s / 3, tx * 7 + ty, 223) * 3);   // ragged fringe width
    const sides = [[green(nb.l), x, wy], [green(nb.r), 15 - x, wy + 50], [green(nb.u), y, wx], [green(nb.d), 15 - y, wx + 90]];
    for (const [on, o, s] of sides) {
      if (!on) continue;
      const f = fr(s);
      if (o < f) c = o === f - 1 ? P.grD : (_enH(wx, wy, 224) < .3 ? P.grH : P.gr);
      else if (o === f) c = _enM(c, '#5a5040', .28);
    }
    if (snow) c = _enSnowAt(wx, wy, x, y);
    G.set(x, y, c);
  }
  // stepping stones: centre stone + one per arm, staggered a little by hash
  const spots = [[8, 8]];   // one stone per tile, longer across the walk (tobi-ishi are spaced a stride apart)
  const STONES = ['#bcb6a8', '#c6c0b2', '#b0aa9c', '#c0b8a4', '#b8b4aa'];
  for (const [sx, sy] of spots) {
    const wx = tx * 16 + sx, wy = ty * 16 + sy;   // world centre: shared by the two tiles that meet at an arm
    const vert = (aU || aD) && !(aL || aR), horiz = (aL || aR) && !(aU || aD), jx = (_enH(wx, wy, 225) - .5) * 2, jy = (_enH(wy, wx, 226) - .5) * 2;
    const rx = (horiz ? 4.2 : 5.4) + _enH(wx, wy, 227) * 1.2, ry = (vert ? 3.6 : 4.4) + _enH(wy, wx, 228) * .8;
    const cx = sx + (vert ? jx : jx * .4), cy = sy + (horiz ? jy : jy * .4), base = STONES[Math.floor(_enH(wx, wy, 229) * 5)];
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      if (x < 0 || y < 0 || x > 15 || y > 15) continue;
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, r2 = nx * nx + ny * ny;
      const sh = ((x + .5 - cx - .8) / rx) ** 2 + ((y + .5 - cy - 1.3) / ry) ** 2;
      if (r2 > 1) { if (sh <= 1) G.set(x, y, snow ? _EN_SN.d : _enM(G.get(x, y), '#3a3428', .32)); continue; }   // contact shadow, down-right
      let c = base;
      if (r2 > .62 && nx + ny > .35) c = _enM(base, '#5a5040', .3);
      else if (r2 > .5 && nx + ny < -.45) c = _enM(base, '#ffffff', .32);
      else if (_enH(x + tx * 16, y + ty * 16, 230) < .07) c = _enM(base, '#5a5040', .18);
      if (snow) c = r2 > .72 && nx + ny < -.3 ? _EN_SN.h : _enM(c, '#dfe6f0', .14);   // swept; a rim of snow left on its upper edge
      G.set(x, y, c);
    }
  }
  _enScatter(G, tx, ty, season, 1.3);
  _enAO(G, nb, snow ? _EN_SEA[3].ao : '#3a3428', .8);
}

// ------------------------------------------------------------ v2 floors
function _enKitchen(G, tx, ty, nb) {   // grey-blue stone tiles, checkerboard, darker grout
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, ci = wx >> 3, cj = wy >> 3, jx = wx & 7, jy = wy & 7;
    let base = ((ci + cj) & 1) ? _EN.kit : _EN.kitD;
    const t = _enH(ci, cj, 141);
    if (t < .25) base = _enM(base, _EN.kitG, .12); else if (t > .8) base = _enM(base, _EN.kitH, .2);
    let c = base;
    if (jx === 0 || jy === 0) c = _EN.kitG;
    else if (jx === 1 || jy === 1) c = _enM(base, _EN.kitH, .5);
    else if (jx === 7 || jy === 7) c = _enM(base, _EN.kitG, .35);
    else if (_enH(wx, wy, 142) < .05) c = _enM(base, _EN.kitG, .3);
    G.set(x, y, c);
  }
  _enAO(G, nb, OUT);
}
function _enDining(G, tx, ty, nb) {   // wide dark boards; a straw-mat (goza) runner down the aisle, cols 5-6
  _enPlanks(G, tx, ty, { ph: 6, len: 52, salt: 4, grain: .16, hiK: .35, base: _EN.din, lt: _enM(_EN.din, _EN.dinH, .3), lo: _enM(_EN.din, _EN.dinD, .5), seam: _EN.dinS, hi: _EN.dinH });
  if (ty >= 21 && tx >= 5 && tx <= 6) {
    const X0 = 84, X1 = 107, top = ty === 21;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, wy = ty * 16 + y;
      if (wx < X0 - 1 || wx > X1 + 1) continue;
      if (wx === X0 - 1 || wx === X1 + 1) { G.set(x, y, _enM(G.get(x, y), OUT, .3)); continue; }   // soft drop shadow at the mat edge
      const e = Math.min(wx - X0, X1 - wx);
      let c = (wy & 1) ? _enM(_EN.goza, _EN.gozaW, .6) : _EN.goza;
      if ((wy % 6 === 0) && _enH(wx >> 3, wy, 145) < .5) c = _EN.gozaH;
      if (e === 0) c = _enM(_EN.heri, OUT, .25); else if (e === 1) c = wx < X0 + 2 ? '#5a7a52' : _EN.heri; else if (e === 2) c = _enM(c, _EN.gozaW, .7);
      if (top && y < 2 && e > 1) c = y === 0 ? _enM(_EN.heri, OUT, .25) : _EN.heri;
      G.set(x, y, c);
    }
  }
  _enAO(G, nb, OUT);
}
function _enSand(G, tx, ty, nb, season) {   // raked white gravel (karesansui): wavy rake lines, rings round the stones, a dark kerb
  season = (season | 0) & 3;
  const snow = season === 3;   // winter: the raked pattern still shows through the snow as soft blue furrows
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    let ph = wy + Math.sin(wx / 8 + _enVN(wx / 30, wy / 30, 151) * 3) * 1.3, ring = false;
    for (const [cx, cy] of _EN_ZEN) {
      const d = Math.hypot(wx + .5 - cx, (wy + .5 - cy) * 1.3);
      if (d < 17) { ph = d; ring = true; }
    }
    const m = ((Math.floor(ph) % 4) + 4) % 4;
    let c = m === 0 ? _EN.sandS : m === 1 ? _EN.sandH : _EN.sand;
    if (!ring && m === 3 && _enBay(x, y) < .25) c = _enM(_EN.sand, _EN.sandS, .3);
    if (_enH(wx, wy, 152) < .045) c = _enM(c, '#9a9282', .35);
    if (snow) c = m === 0 ? (_enBay(x, y) < .6 ? _EN_SN.s : _EN_SN.b) : m === 1 ? _EN_SN.w : _enSnowAt(wx, wy, x, y);
    G.set(x, y, c);
  }
  const out = c => c !== 'z';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    const dk = Math.min(out(nb.u) ? y : 9, out(nb.d) ? 15 - y : 9, out(nb.l) ? x : 9, out(nb.r) ? 15 - x : 9);
    if (dk < 2) {
      if (snow) G.set(x, y, dk === 0 ? (_enH(wx >> 1, wy >> 1, 153) < .5 ? '#7e8698' : '#8e96a6') : _enH(wx >> 1, wy >> 1, 154) < .6 ? _EN_SN.w : _EN_SN.h);   // kerb stones, capped
      else G.set(x, y, dk === 0 ? (_enH(wx >> 1, wy >> 1, 153) < .5 ? '#6e6a62' : '#7e7a70') : (_enH(wx >> 1, wy >> 1, 154) < .5 ? '#8e8a80' : '#9e998e'));
    } else if (dk === 2 && ((out(nb.u) && y === 2) || (out(nb.l) && x === 2))) G.set(x, y, _enM(G.get(x, y), snow ? '#5a6888' : '#8a8272', .35));   // kerb shadow
  }
  _enScatter(G, tx, ty, season, 1.4, (x, y) => Math.min(x, y, 15 - x, 15 - y) > 1 || !(out(nb.u) || out(nb.d) || out(nb.l) || out(nb.r)));
  _enAO(G, nb, snow ? _EN_SEA[3].ao : '#3a3428', .6);
}
function _enDeck(G, tx, ty, nb, season) {   // open-air deck: 6px cedar boards running north-south, staggered butt joints, nail heads
  season = (season | 0) & 3;
  const out = c => c !== 'x';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, bd = Math.floor(wx / 6), bx = wx - bd * 6;
    const off = Math.floor(_enH(bd, 0, 161) * 48), seg = Math.floor((wy + off) / 48), jy = (wy + off) % 48;
    const t = _enH(bd, seg, 162);
    let c = t < .3 ? _enM(_EN.deck, _EN.deckD, .3) : t > .72 ? _enM(_EN.deck, _EN.deckH, .22) : _EN.deck;
    if (bx === 0) c = _enM(_EN.deckS, _EN.deckD, .3);           // gap between boards
    else if (jy === 0) c = _enM(_EN.deckS, _EN.deckD, .45);     // butt joint
    else if (bx === 1) c = _enM(c, _EN.deckH, .3);
    else if (bx === 5) c = _enM(c, _EN.deckD, .25);
    else if (_enH(bd, wy >> 2, 163) < .08) c = _enM(c, _EN.deckD, .3);   // grain
    if ((jy === 2 || jy === 46) && (bx === 2 || bx === 4)) c = '#6a5040';   // a pair of nail heads at each board end
    G.set(x, y, c);
  }
  const nails = y => { for (let x = 0; x < 16; x++) if ((tx * 16 + x) % 6 === 3) G.set(x, y, '#5a4434'); };
  if (out(nb.u)) { for (let x = 0; x < 16; x++) G.set(x, 0, _enM(_EN.deckS, _EN.deckD, .3)); nails(2); }
  if (out(nb.d)) {   // the deck's front edge: a fascia board with a row of nails, then its shadow
    for (let x = 0; x < 16; x++) { G.set(x, 12, _EN.deckS); G.set(x, 13, _enM(_EN.deckD, _EN.deckH, .25)); G.set(x, 14, _EN.deckD); G.set(x, 15, '#3a2a1e'); }
    for (let x = 0; x < 16; x++) if ((tx * 16 + x) % 6 === 3) { G.set(x, 14, '#4a3626'); G.set(x, 13, '#e0d0b0'); }
  }
  if (out(nb.l)) for (let y = 0; y < 16; y++) G.set(0, y, _EN.deckS);
  if (out(nb.r)) for (let y = 0; y < 16; y++) G.set(15, y, _enM(_EN.deckS, OUT, .2));
  if (season === 3) {   // winter: frost in the board gaps, snow drifted along the deck's outer edges (the walk to the bath swept)
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((tx * 16 + x) % 6 === 0 && G.get(x, y) === _enM(_EN.deckS, _EN.deckD, .3) && _enBay(x, y) < .55) G.set(x, y, _EN_SN.s);
    const side = c => c === 'f' || c === 'g' || c === 'b' || c === '#' || c == null;
    const f = s => 1 + Math.floor(_enVN(s / 4, tx * 3 + ty, 561) * 4);
    _enSnowOver(G, tx, ty, (x, y) => {
      const wx = tx * 16 + x, wy = ty * 16 + y;
      if (side(nb.l) && x < f(wy)) return true;
      if (side(nb.r) && 15 - x < f(wy + 40) && x <= 15) return true;
      if (out(nb.d) && side(nb.d)) return y <= 11 && y >= 12 - f(wx + 80) - 1 && y >= 0;   // along the front edge, above the fascia
      return false;
    });
  } else _enScatter(G, tx, ty, season, 1.25);
  _enAO(G, nb, OUT, .8);
}
// paving stones (shop / plaza): uneven course heights (6..9 px), slab lengths 12..22 in running bond, soft joints
const _EN_QROW = [];
(function () { let y = 0, i = 0; while (y < 1200) { const h = 6 + Math.floor(_enH(i, 0, 176) * 4); for (let k = 0; k < h; k++) _EN_QROW.push([i, k, h]); y += h; i++; } })();
function _enQCell(wx, wy) {
  const [row, py, ph] = _EN_QROW[clamp(wy, 0, _EN_QROW.length - 1)];
  const L = 12 + Math.floor(_enH(row, 0, 171) * 11), sx = wx + Math.floor(_enH(row, 1, 172) * L), seg = Math.floor(sx / L), jx = sx - seg * L;
  return { row, py, ph, seg, jx, L };
}
function _enStoneQ(G, tx, ty, nb, season) {
  season = (season | 0) & 3;
  const TONES = ['#b8b2a4', '#aea898', '#a09a8c', '#bdb7a9', '#b3ad9f'], snow = season === 3;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, q = _enQCell(wx, wy);
    const base = TONES[Math.floor(_enH(q.row, q.seg, 173) * TONES.length)];
    let c = base;
    const jt = q.py === 0 || q.jx === 0;
    if (jt) c = snow ? _EN_SN.s : _enH(wx, wy, 174) < .1 ? '#8a9468' : '#8c8678';   // joints, a little moss (winter: snow)
    else if ((q.py === 1 && q.jx === 1)) c = base;                  // rounded corner
    else if (q.py === 1 || q.jx === 1) c = _enM(base, _EN.qsH, .38);
    else if (q.py === q.ph - 1 || q.jx === q.L - 1) c = _enM(base, _EN.qsJ, .22);
    else if (_enH(wx, wy, 175) < .06) c = _enM(base, _EN.qsJ, .3);
    else if (_enVN(wx / 5, wy / 5, 178) > .78 && _enBay(x, y) < .4) c = _enM(base, '#ffffff', .12);   // worn patches
    if (snow && !jt) c = _enM(c, '#dfe6f0', .12);
    G.set(x, y, c);
  }
  if (snow) {   // winter: packed snow lying in patches, deeper along the edges
    const op = c => c !== 'q' && c !== 'D' && c !== 'p';
    _enSnowOver(G, tx, ty, (x, y) => {
      const wx = tx * 16 + x, wy = ty * 16 + y, e = Math.min(op(nb.u) ? y : 9, op(nb.d) ? 15 - y : 9, op(nb.l) ? x : 9, op(nb.r) ? 15 - x : 9);
      return _enVN(wx / 10, wy / 7, 562) + (e < 4 ? (4 - e) * .09 : 0) > .6;
    });
  } else _enScatter(G, tx, ty, season, 1.3);
  _enAO(G, nb, snow ? _EN_SEA[3].ao : '#3a3428', .8);
}
// koi pond: deep teal water inside a rim of natural stones on every side that is not pond
const _EN_PONDNB = new Map();
function _enPondNb(tx, ty) {
  const k = tx + ',' + ty;
  if (_EN_PONDNB.has(k)) return _EN_PONDNB.get(k);
  const isP = (x, y) => x >= 27 && x <= 30 && y >= 15 && y <= 17;   // SPEC_v2 2.1 pond, used before tileArt('o') has run
  return { u: isP(tx, ty - 1) ? 'o' : 'g', d: isP(tx, ty + 1) ? 'o' : 'g', l: isP(tx - 1, ty) ? 'o' : 'g', r: isP(tx + 1, ty) ? 'o' : 'g' };
}
function _enPond(G, frame, tx, ty, nb, season) {
  season = (season | 0) & 3;
  const eU = nb.u !== 'o', eD = nb.d !== 'o', eL = nb.l !== 'o', eR = nb.r !== 'o', snow = season === 3;
  const rimW = (on, s, base) => on ? base + Math.floor(_enVN(s / 5, 0, 181) * 2.2) : 0;
  const RIM = ['#8a8a84', '#9c988e', '#7a7a76', '#aaa69c', '#86827a'];
  const stone = (wx, wy) => {   // Voronoi cobbles, lit top-left
    const S = 5, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
    let d1 = 99, d2 = 99, bx = 0, by = 0, bi = 0, bj = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const px = i * S + .5 + _enH(i, j, 182) * (S - 1), py = j * S + .5 + _enH(j, i, 183) * (S - 1), d = Math.hypot(wx + .5 - px, wy + .5 - py);
      if (d < d1) { d2 = d1; d1 = d; bx = px; by = py; bi = i; bj = j; } else if (d < d2) d2 = d;
    }
    const base = RIM[Math.floor(_enH(bi, bj, 184) * RIM.length)];
    if (d2 - d1 < 1) return snow ? _EN_SN.d : '#4e4c48';
    if (snow) {   // winter: every cobble wears a cap of snow on its upper side
      const t = (wx + .5 - bx) + (wy + .5 - by) * 1.3;
      return t < -1.6 ? _EN_SN.w : t < -.2 ? _EN_SN.b : t < .8 ? _EN_SN.s : _enM(base, '#4a5470', .25);
    }
    if ((wx + .5 - bx) + (wy + .5 - by) < -1.2) return _enM(base, '#ffffff', .25);
    if ((wx + .5 - bx) + (wy + .5 - by) > 1.4) return _enM(base, '#3a3836', .25);
    if (season === 2 && _enH(bi, bj, 185) < .3 && wy + .5 < by) return _enM(base, '#9a8a42', .45);   // autumn: the moss turns ochre
    return _enH(bi, bj, 185) < .3 && wy + .5 < by ? _enM(base, '#6a8a4a', .45) : base;
  };
  const iceW = (s, k) => 2 + Math.floor(_enVN(s / 6, k, 571) * 3);   // winter: a thin skin of ice along the rim
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    const u = rimW(eU, wx, 4), d = rimW(eD, wx + 40, 3), l = rimW(eL, wy, 4), r = rimW(eR, wy + 40, 3);
    const inside = Math.min(eU ? y - u : 99, eD ? 15 - y - d : 99, eL ? x - l : 99, eR ? 15 - x - r : 99);
    if (inside < 0) { G.set(x, y, stone(wx, wy)); continue; }
    const n = _enVN(wx / 14, wy / 9, 186), b = _enBay(x, y);
    let c = n < .4 && b < (.4 - n) * 2.4 ? _EN.pondD : n > .72 && b < (n - .72) * 2 ? _enM(_EN.pond, _EN.pondH, .35) : _EN.pond;
    if (inside === 0) c = (eU && y - u === 0) || (eL && x - l === 0) ? '#1a4a52' : _enM(_EN.pondD, '#1a4a52', .5);   // shade under the rim
    else if (inside === 1 && ((eU && y - u === 1) || (eL && x - l === 1)) && b < .5) c = _EN.pondD;
    if (snow) {
      const ice = Math.min(eU ? y - u - iceW(wx, 1) : 99, eD ? 15 - y - d - iceW(wx, 2) : 99, eL ? x - l - iceW(wy, 3) : 99, eR ? 15 - x - r - iceW(wy, 4) : 99);
      if (ice < 0) c = ice === -1 ? _EN_SN.iceH : (wx + wy * 2) % 9 === 0 ? _EN_SN.iceH : _EN_SN.ice;   // a bright edge where the ice ends, faint streaks
      else if (ice === 0) c = '#16424a';
      else c = _enM(c, '#1a3a4a', .25);   // the open water looks colder
    }
    G.set(x, y, c);
  }
  // slow glints, 4 stages each with its own phase (like the onsen water, but fewer and dimmer)
  const y0 = ty * 16, x0 = tx * 16;
  for (let r = Math.floor(y0 / 7) - 1; r <= Math.floor((y0 + 15) / 7) + 1; r++) {
    const off = (r * 5) % 13;
    for (let s = Math.floor((x0 - off) / 13) - 1; s <= Math.floor((x0 + 16 - off) / 13) + 1; s++) {
      if (_enH(s, r, 187) < .35) continue;
      const st = (frame + Math.floor(_enH(r, s, 188) * 4)) % 4, len = [1, 3, 3, 2][st];
      const cx = s * 13 + off + 3 + Math.floor(_enH(s, r, 189) * 6), cy = r * 7 + Math.floor(_enH(s, r, 190) * 3);
      const col = st === 0 || st === 3 ? _enM(_EN.pond, _EN.pondH, .6) : _EN.pondH;
      for (let i = 0; i < len; i++) {
        const px = cx - (len >> 1) + i + (st >= 2 ? 1 : 0) - x0, py = cy - y0;
        const w = G.get(px, py); if (w === _EN.pond || w === _EN.pondD) G.set(px, py, col);   // water only, never the rim
      }
    }
  }
  // lily pads (static), kept off the rim; none in winter, yellowing in autumn, in flower in summer
  const n = snow ? 0 : Math.floor(_enH(tx, ty, 191) * 2.4);
  const PAD = season === 2 ? ['#8a7a2a', '#c8b04a', '#d8c060', '#aa9636'] : ['#3e7a34', '#6aac52', '#7cbc5a', '#5a9a46'];
  for (let i = 0; i < n; i++) {
    const lo = 3 + (eL ? 4 : 0), hi = 12 - (eR ? 4 : 0), lo2 = 3 + (eU ? 4 : 0), hi2 = 12 - (eD ? 3 : 0);
    if (hi < lo || hi2 < lo2) break;
    const cx = lo + Math.floor(_enH(tx, ty, 192 + i) * (hi - lo + 1)) + .5, cy = lo2 + Math.floor(_enH(ty, tx, 194 + i) * (hi2 - lo2 + 1)) + .5;
    const rr = 2.2 + _enH(tx + i, ty, 196) * 1.2, notch = Math.floor(_enH(tx, ty + i, 197) * 4);
    for (let y = Math.floor(cy - rr - 1); y <= cy + rr + 1; y++) for (let x = Math.floor(cx - rr - 1); x <= cx + rr + 1; x++) {
      if (x < 0 || y < 0 || x > 15 || y > 15) continue;
      const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy);
      if (d > rr) { if (Math.hypot(dx - .9, dy - .9) <= rr) G.set(x, y, '#1c5258'); continue; }   // pad shadow on the water
      const q = [dx > 0 && dy < 0, dx > 0 && dy > 0, dx < 0 && dy > 0, dx < 0 && dy < 0][notch];
      if (q && Math.abs(Math.abs(dx) - Math.abs(dy)) < .9 && d > .6) continue;   // the little wedge cut into a lily pad
      G.set(x, y, d > rr - .9 ? (dx + dy > 0 ? PAD[0] : PAD[1]) : (dx + dy < -1 ? PAD[2] : PAD[3]));
    }
    if (season === 1 && _enH(tx, ty + i, 198) < .45) {   // summer: a water-lily flower on some pads
      const fx = Math.round(cx - .5), fy = Math.round(cy - 1.5);
      G.set(fx, fy, '#f8c8d8'); G.set(fx - 1, fy + 1, '#f0a8c0'); G.set(fx + 1, fy + 1, '#e890a8'); G.set(fx, fy + 1, '#fff2a0');
    }
  }
  if (season === 0 || season === 2) {   // spring: petals afloat in little rafts (hanaikada); autumn: a few floating leaves
    const lo = eL ? 6 : 1, hi = eR ? 10 : 14, lo2 = eU ? 6 : 1, hi2 = eD ? 10 : 14;
    _enScatter(G, tx, ty, season, season ? 1.6 : 2.4, (x, y) => x >= lo && x <= hi && y >= lo2 && y <= hi2);
  }
}

// ------------------------------------------------------------ nature
function _enFence(G, tx, ty, nb, season) {   // bamboo privacy fence (kenninji-gaki); v2.1 winter: snow on the top and rails
  const snow = ((season | 0) & 3) === 3;
  if (snow) { _enFenceDry(G, tx, ty, nb); _enFenceSnow(G, tx, ty, nb); return; }
  _enFenceDry(G, tx, ty, nb);
}
// winter on a fence tile painted by _enFenceDry: the leaves of the grove outside hold snow, the capped top rail and the
// cross rails carry a white line, the strip of gravel beside a mid fence is snowed over
function _enFenceSnow(G, tx, ty, nb) {
  const run = nb.l === 'b' || nb.r === 'b', LEAF = { '#4e8a3e': _EN_SN.w }, RAIL = { '#a8da6c': _EN_SN.w, '#7cb84a': _EN_SN.b, '#5a9a3a': _EN_SN.s, '#d8f0a0': _EN_SN.w, '#4a8a32': _EN_SN.s, '#b4e070': _EN_SN.w };
  if (run) {
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x;
      G.set(x, 0, _EN_SN.h); G.set(x, 1, _EN_SN.b); G.set(x, 2, _enH(wx >> 1, 2, 581) < .4 ? _EN_SN.s : _EN_SN.w);
      if (_enH(wx, 3, 582) < .3) G.set(x, 3, _EN_SN.s);
      for (const by of [7, 12]) if (wx % 8 !== 3) G.set(x, by, _EN_SN.w);
    }
    return;
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = G.get(x, y), wx = tx * 16 + x, wy = ty * 16 + y;
    if (LEAF[c]) G.set(x, y, _enVN(wx / 3, (wy + 1) / 3, 94) > .74 ? _EN_SN.w : _EN_SN.s);   // snow on the lit leaf clumps, shaded along their lower edge
    else if (RAIL[c]) G.set(x, y, RAIL[c]);
    else if (c === '#7e786c' || c === '#9a9486' || c === '#b4ae9e') G.set(x, y, _enSnowAt(wx, wy, x, y));
  }
}
function _enFenceDry(G, tx, ty, nb) {
  const run = nb.l === 'b' || nb.r === 'b';
  if (run) {   // seen from the front
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x;
      let c;
      if (y < 2) c = _enH(wx >> 1, y, 91) < .3 ? '#3e6a3a' : '#28462c';
      else if (y === 2) c = '#a8da6c'; else if (y === 3) c = (wx % 16 === 5) ? '#4a8a32' : _EN.bam; else if (y === 4) c = '#3e7a2c';
      else {
        c = (wx & 1) ? _EN.bamD : '#86c052';
        if (y === 5) c = _enM(c, OUT, .35);
        const node = 6 + Math.floor(_enH(wx >> 1, 0, 92) * 8);
        if (y === node) c = _enM(c, '#3e7a2c', .6); else if (y === node + 1 && !(wx & 1)) c = '#a8da6c';
        if (y === 15) c = _enM(c, OUT, .4);
      }
      G.set(x, y, c);
    }
    for (const by of [7, 12]) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x;
      G.set(x, by, wx % 13 === 0 ? '#5a9a3a' : '#b4e070'); G.set(x, by + 1, '#3e7a2c');
      if (wx % 8 === 3) { G.set(x, by - 1, _EN.rope); G.set(x, by, _EN.rope); G.set(x, by + 1, '#9a7a40'); G.set(x, by + 2, '#9a7a40'); }
    }
    return;
  }
  if (nb.l != null && nb.r != null) { _enFenceMid(G, tx, ty, nb); return; }   // v2: a fence between two areas
  // a side run seen from above: bamboo grove outside, the fence's top rail along the inner edge
  const outerRight = nb.r == null && nb.l != null, s = outerRight ? 1 : 10;   // strip x range s..s+4
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    let c = '#203a26';
    const stalk = _enH(wx >> 1, 0, 93) < .38 && (wx & 1) === 0;
    if (stalk) c = (wy % 9 === 0) ? '#2f5a2a' : _EN.bamD;
    else if (_enH(wx >> 1, 0, 93) < .38) c = '#3e7a2c';
    const leaf = _enVN(wx / 3, wy / 3, 94);
    if (leaf > .62) c = leaf > .74 ? '#4e8a3e' : '#2f5a32';
    G.set(x, y, c);
  }
  const C = ['#2a4a26', '#a8da6c', '#7cb84a', '#5a9a3a', '#2a4a26'];
  for (let y = 0; y < 16; y++) {
    const wy = ty * 16 + y;
    for (let i = 0; i < 5; i++) G.set(s + i, y, wy % 8 === 0 && i > 0 && i < 4 ? '#4a8a32' : C[i]);
    if (wy % 16 === 4 || wy % 16 === 5) for (let i = 1; i < 4; i++) G.set(s + i, y, i === 3 ? '#9a7a40' : _EN.rope);
  }
  const inner = outerRight ? 0 : 15;
  for (let y = 0; y < 16; y++) G.set(inner, y, '#2c4a2a');
  if (nb.u !== 'b') for (let i = 0; i < 5; i++) { G.set(s + i, 0, C[0]); G.set(s + i, 1, i === 0 || i === 4 ? C[0] : '#d8f0a0'); G.set(s + i, 2, i === 0 || i === 4 ? C[0] : '#5a9a3a'); }
}
// v2: a north-south fence with an area on both sides (cols 10 and 24 up top): the rail runs down the middle of the
// tile, low bamboo / ferns grow at its foot next to greenery, a pebble strip next to paving
function _enFenceMid(G, tx, ty, nb) {
  const s = 6, green = c => c == null || c === 'f' || c === 'b' || c === 'g' || c === 'r';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, left = x < s, side = left ? nb.l : nb.r;
    let c;
    if (green(side)) {
      c = '#203a26';
      const leaf = _enVN(wx / 3, wy / 3, 94);
      if (leaf > .58) c = leaf > .72 ? '#4e8a3e' : '#2f5a32';
      if (!left && x === s + 5) c = '#162a1c';   // the rail's shadow (light from the top-left)
    } else {
      const h = _enH(wx, wy, 231);
      c = h < .25 ? '#7e786c' : h > .8 ? '#b4ae9e' : '#9a9486';
      if ((left && x === s - 1) || (!left && x === s + 5)) c = _enM(c, '#2a2430', left ? .2 : .45);
      if (!left && x === s + 6) c = _enM(c, '#2a2430', .2);
    }
    G.set(x, y, c);
  }
  const C = ['#2a4a26', '#a8da6c', '#7cb84a', '#5a9a3a', '#2a4a26'];
  for (let y = 0; y < 16; y++) {
    const wy = ty * 16 + y;
    for (let i = 0; i < 5; i++) G.set(s + i, y, wy % 8 === 0 && i > 0 && i < 4 ? '#4a8a32' : C[i]);
    if (wy % 16 === 4 || wy % 16 === 5) for (let i = 1; i < 4; i++) G.set(s + i, y, i === 3 ? '#9a7a40' : _EN.rope);
  }
  if (nb.u !== 'b') for (let i = 0; i < 5; i++) { G.set(s + i, 0, C[0]); G.set(s + i, 1, i === 0 || i === 4 ? C[0] : '#d8f0a0'); G.set(s + i, 2, i === 0 || i === 4 ? C[0] : '#5a9a3a'); }
  if (nb.d !== 'b' && nb.d !== '#') for (let i = 0; i < 5; i++) { G.set(s + i, 14, i === 0 || i === 4 ? C[0] : '#3e6a2c'); G.set(s + i, 15, C[0]); }
}
// v2.1 bush colours by season: spring = v2.0 (azaleas in flower), summer deep green with hydrangea heads, autumn every
// bush its own red / orange / russet (dodan-tsutsuji), winter a dark evergreen under caps of snow
const _EN_BUSHP = [
  [['#1f4a2a', '#2c6a30', '#3f8a38', '#56a040', '#74b84e', '#9ed062']],
  [['#183e26', '#22562a', '#2f7432', '#43903a', '#5eaa46', '#86c45a']],
  [['#4a1812', '#76241a', '#a0361e', '#c44e26', '#de7030', '#f0a248'], ['#4e2410', '#7e3a14', '#a8561a', '#cc7424', '#e69a34', '#f6c458'], ['#2e3a1e', '#4a4a22', '#6e5826', '#946a2a', '#b88430', '#d8a844']],
  [['#16301f', '#1e4228', '#2a5430', '#36663a', '#447444', '#56864e']],
];
function _enBush(G, tx, ty, nb, season) {   // round clipped azalea bushes (tsutsuji), some in flower
  season = (season | 0) & 3;
  const PS = _EN_BUSHP[season], PAL = PS[0];
  const bushes = [];
  const add = (cx, cy) => bushes.push({ x: cx * 16 + 8 + (_enH(cx, cy, 101) - .5) * 2, y: cy * 16 + 8.5, rx: 8.4 + _enH(cx, cy, 102) * .8, ry: 8.6, cx, cy });
  add(tx, ty);
  if (nb.u === 'f') add(tx, ty - 1); if (nb.d === 'f') add(tx, ty + 1); if (nb.l === 'f') add(tx - 1, ty); if (nb.r === 'f') add(tx + 1, ty);
  const own = (wx, wy) => { let best = null; for (const b of bushes) { const nx = (wx + .5 - b.x) / b.rx, ny = (wy + .5 - b.y) / b.ry; if (nx * nx + ny * ny <= 1 && (!best || b.y > best.y)) best = b; } return best; };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, b = own(wx, wy);
    if (!b) {   // mossy soil between bushes, darker right under a bush (winter: snow)
      const under = own(wx, wy - 2);
      if (season === 3) G.set(x, y, under ? _EN_SN.d : _enSnowAt(wx, wy, x, y));
      else G.set(x, y, under ? '#2e3e24' : (_enH(wx, wy, 103) < .2 ? (season === 2 ? '#7a6a3a' : '#56683a') : (season === 2 ? '#62583a' : '#4a5c34')));
      continue;
    }
    const o1 = own(wx - 1, wy), o2 = own(wx + 1, wy), o3 = own(wx, wy - 1), o4 = own(wx, wy + 1);
    if (o1 !== b || o2 !== b || o3 !== b || o4 !== b) {
      const behind = [o1, o2, o3, o4].every(o => !o || o === b || o.y < b.y);
      if (behind) { G.set(x, y, season === 2 ? '#2e1a14' : '#183a22'); continue; }
    }
    const lx = (wx + .5 - b.x) / b.rx, ly = (wy + .5 - b.y) / b.ry, light = -(lx * .55 + ly * .85);
    const S = 4, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
    let best = 99, ox = 0, oy = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const fx = i * S + _enH(i, j, 104) * S, fy = j * S + _enH(j, i, 105) * S, d = Math.hypot(wx - fx, wy - fy);
      if (d < best) { best = d; ox = wx - fx; oy = wy - fy; }
    }
    const v = light * 1.25 - (ox + oy) / S * .42 - best / S * .3 + .25 + (_enBay(x, y) - .5) * .25;
    const pal = season === 2 ? PS[Math.floor(_enH(b.cx, b.cy, 591) * PS.length)] : PAL;
    let c = pal[clamp(Math.round(2.6 + v * 2.2), 0, pal.length - 1)];
    if (season === 3) {   // winter: a cap of snow on the upper side of each dome, ragged at its lower edge
      const cap = ly + _enVN(wx / 3, wy / 2.5, 592) * .5 - .25 < -.18;
      if (cap) c = v > .55 ? _EN_SN.w : v > .1 ? _EN_SN.h : v > -.3 ? _EN_SN.b : _EN_SN.s;
      else if (ly + _enVN(wx / 3, (wy - 1) / 2.5, 592) * .5 - .25 < -.18) c = _enM(c, '#0e1a14', .3);   // the cap's shadow on the leaves
    }
    G.set(x, y, c);
  }
  // blossoms on the lit upper half of this tile's own bush (spring); hydrangea heads in summer
  const me = bushes[0], fl = _enH(tx, ty, 106);
  if (season === 1 && fl > .45) {
    const HY = [['#4a5ac8', '#7a8ae8', '#b4c0ff'], ['#8a4ab8', '#b07ae0', '#dcc0ff'], ['#5a7ad8', '#94b0f0', '#e0e8ff']][Math.floor(_enH(tx, ty, 593) * 3)];
    for (let i = 0; i < 2; i++) {
      const a = -2.4 + _enH(tx, ty, 594 + i) * 2, r = 2.5 + _enH(ty, tx, 596 + i) * 3;
      const fx = Math.round(me.x + Math.cos(a) * r) - tx * 16, fy = Math.round(me.y - 1 + Math.sin(a) * r * .8) - ty * 16;
      if (fx < 2 || fx > 13 || fy < 2 || fy > 13) continue;
      [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => G.set(fx + dx, fy + dy, dx + dy < -1 ? HY[2] : dx + dy > 0 ? HY[0] : HY[1]));
      G.set(fx - 1, fy - 1, '#ffffff'); G.set(fx + 1, fy + 2, '#183e26'); G.set(fx + 2, fy + 1, '#183e26');
    }
  }
  if (season === 0 && fl > .35) {
    const P = fl > .78 ? ['#ffffff', '#f0e8f4'] : ['#ff8ab0', '#ffc4dc'];
    for (let i = 0; i < 4; i++) {
      const a = -2.6 + _enH(tx, ty, 107 + i) * 2.4, r = 2 + _enH(ty, tx, 111 + i) * 4;
      const fx = Math.round(me.x + Math.cos(a) * r) - tx * 16, fy = Math.round(me.y - 1 + Math.sin(a) * r * .8) - ty * 16;
      if (fx < 1 || fx > 14 || fy < 1 || fy > 14) continue;
      G.set(fx, fy, P[0]); G.set(fx + 1, fy + 1, _enM(P[0], '#1f4a2a', .45)); if (i & 1) G.set(fx - 1, fy, P[1]);
    }
  }
}
function _enRock(G, tx, ty, nb, season) {   // onsen boulders; the side facing the water is wet and dark
  season = (season | 0) & 3;
  const RAMP = ['#46464c', '#5e5e60', '#7a7a78', '#94928c', '#b0aea6'];
  const list = [];
  const add = (cx, cy) => {
    const h1 = _enH(cx, cy, 121), h2 = _enH(cx, cy, 122), h3 = _enH(cx, cy, 123);
    list.push({ x: cx * 16 + 8 + (h1 - .5) * 3, y: cy * 16 + 7.5 + (h2 - .5) * 2, rx: 8.4 + h3 * 1.3, ry: 7.4 + h1 * 1.2, warm: h2 > .6, moss: h3 < .45 });
    if (h3 > .6) list.push({ x: cx * 16 + (h1 > .5 ? 12 : 4), y: cy * 16 + 12.5, rx: 4.2, ry: 3.4, warm: !(h2 > .6), moss: false });
  };
  add(tx, ty);
  if (nb.u === 'r') add(tx, ty - 1); if (nb.d === 'r') add(tx, ty + 1); if (nb.l === 'r') add(tx - 1, ty); if (nb.r === 'r') add(tx + 1, ty);
  const own = (wx, wy) => { let best = null; for (const b of list) { const nx = (wx + .5 - b.x) / b.rx, ny = (wy + .5 - b.y) / b.ry; if (nx * nx + ny * ny <= 1 && (!best || b.y + b.ry > best.y + best.ry)) best = b; } return best; };
  const wetD = (x, y) => Math.min(nb.d === '~' ? 15 - y : 99, nb.u === '~' ? y : 99, nb.l === '~' ? x : 99, nb.r === '~' ? 15 - x : 99);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, b = own(wx, wy), wd = wetD(x, y);
    if (!b) {
      if (wd < 6) G.set(x, y, wd < 2 ? '#2a8c7c' : _enBay(x, y) < .5 ? '#2a8c7c' : '#2a665c');
      else G.set(x, y, season === 3 ? (own(wx, wy - 2) ? _EN_SN.d : _enSnowAt(wx, wy, x, y)) : _enH(wx, wy, 124) < .25 ? '#46553a' : '#3a4234');
      continue;
    }
    const ns = [own(wx - 1, wy), own(wx + 1, wy), own(wx, wy - 1), own(wx, wy + 1)];
    let c, snowy = false;
    if (ns.some(o => o !== b && (!o || o.y + o.ry > b.y + b.ry))) c = '#34343c';
    else {
      const nx = (wx + .5 - b.x) / b.rx, ny = (wy + .5 - b.y) / b.ry, r2 = nx * nx + ny * ny;
      const v = -(nx * .6 + ny * .8) * .95 + (1 - r2) * .6 + (_enBay(x, y) - .5) * .35;
      c = RAMP[clamp(Math.round(1.6 + v * 2), 0, 4)];
      if (b.warm) c = _enM(c, '#8a7058', .14);
      if (b.moss && ny < -.2 && _enVN(wx / 3, wy / 3, 125) > .5) c = ny < -.55 ? (season === 2 ? '#a8944a' : '#7a9a52') : (season === 2 ? '#8a7a3e' : '#5e7e44');
      // winter: snow lies on each boulder's upper side; the warm steam keeps the faces by the water bare
      if (season === 3 && wd >= 4 && ny + _enVN(wx / 3, wy / 2, 601) * .45 - .2 < -.3) { snowy = true; c = v > .7 ? _EN_SN.w : v > .25 ? _EN_SN.h : v > -.15 ? _EN_SN.b : _EN_SN.s; }
      else if (season === 3 && wd >= 4 && ny + _enVN(wx / 3, (wy - 1) / 2, 601) * .45 - .2 < -.3) c = _enM(c, '#1a2030', .3);
    }
    const lit = c === RAMP[3] || c === RAMP[4];
    if (wd < 5 && !snowy) { c = _enM(c, '#1e463e', (5 - wd) / 5 * .55); if (wd > 0 && wd < 4 && lit && _enH(wx, wy, 126) < .3) c = '#c2e8d8'; }
    G.set(x, y, c);
  }
  if (season === 0) _enScatter(G, tx, ty, 0, 1.1, (x, y) => wetD(x, y) > 4);
}
function _enWaterPx(G, frame, tx, ty) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, n = _enVN(wx / 18, wy / 11, 131), d = _enBay(x, y);
    G.set(x, y, n < .3 && d < (.3 - n) * 2.6 ? _EN.waD : n > .7 && d < (n - .7) * 2 ? _enM(_EN.wa, _EN.waH, .45) : _EN.wa);
  }
  // ripple crests on a staggered lattice; each one cycles through 4 slow stages with its own phase
  const RH = 6, SW = 12, y0 = ty * 16, x0 = tx * 16;
  for (let r = Math.floor(y0 / RH) - 1; r <= Math.floor((y0 + 15) / RH) + 1; r++) {
    const off = (r * 7) % SW;
    for (let s = Math.floor((x0 - off) / SW) - 1; s <= Math.floor((x0 + 16 - off) / SW) + 1; s++) {
      const h = _enH(s, r, 132), h2 = _enH(r, s, 133), st = (frame + Math.floor(h2 * 4)) % 4;
      const cx = s * SW + off + 3 + Math.floor(h * 6), cy = r * RH + Math.floor(_enH(s, r, 134) * 3);
      const len = [2, 4, 4, 3][st], sh = st >= 2 ? 1 : 0, col = st === 0 || st === 3 ? _enM(_EN.wa, _EN.waH, .6) : _EN.waH;
      for (let i = 0; i < len; i++) {
        const px = cx - (len >> 1) + i + sh - x0, py = cy - y0;
        if (px >= 0 && px < 16 && py >= 0 && py < 16) G.set(px, py, col);
        if (st === 1 || st === 2) { if (px >= 0 && px < 16 && py + 1 >= 0 && py + 1 < 16) G.set(px, py + 1, _EN.waD); }
      }
      if (st === 2) { const px = cx + sh - x0, py = cy - 1 - y0; if (px >= 0 && px < 16 && py >= 0 && py < 16) G.set(px, py, _EN.foam); }
    }
  }
}

const _EN_TILE = {
  '#': (G, tx, ty, nb, s) => (nb.d !== '#' && nb.d != null) ? _enWallFace(G, tx, ty, nb, s) : _enWallTop(G, tx, ty, nb, s),
  't': _enTatami, '.': _enCorridor, 'l': _enLobby, 's': _enSlate, 'E': _enGenkan, 'g': _enGrass, 'p': _enPath,
  'b': _enFence, 'f': _enBush, 'r': _enRock,
  'k': _enKitchen, 'm': _enDining, 'z': _enSand, 'x': _enDeck, 'q': _enStoneQ,
};

// ============================================================ v2.0.1 looks (FEEDBACK A1 / A4)
// map.js (TILE_LOOK) gives some tiles a look on top of their map char; tileArt(ch, tx, ty, nb, season, look).
//   room floors 't'   look 'preset|i,j'  (i, j = the tile's column / row inside its 4x3 room: rugs, mats line up)
//   room walls  '#'   look 'preset|i,n'  (i = index along the room's wall face, n = its width in tiles: windows, posts)
//   west hall   '.'   look 'hall'        (Taisho parquet + runner)      roten  '~' 'milky' / 'r' 'roten' / 's' 'sunoko'
// Presets are plain colour tables, so a room can be re-dressed by changing one word in map.js.
const _EN_HIN = { hin: '#e6c48c', hinL: '#f6dcaa', hinD: '#c49a62', hinS: '#8a6a44', gap: '#5e4430' };   // hinoki
const _EN_FLOOR = {
  // tatami: lay v (mats run north-south, v1) | h (east-west) | q (ryukyu squares, no heri); hp = heri pattern colour
  tatami:   { lay: 'v', tat: '#cdbf7a', tatW: '#b8aa62', tatH: '#e0d494', heri: '#3d5a3a', toko: '#8a5a34' },
  aotatami: { lay: 'h', tat: '#bfc47c', tatW: '#a5ab60', tatH: '#d5db9a', heri: '#2c2c30', toko: '#b88c54' },
  ume:      { lay: 'v', tat: '#d2b06c', tatW: '#b8964e', tatH: '#e6c88a', heri: '#8a2e2a', hp: '#e8a0a0', toko: '#7a4a30' },
  ryukyu:   { lay: 'q', tat: '#dac98c', tatW: '#c2ae6e', tatH: '#eee2aa', heri: '#a8945a', toko: '#d0a86c' },
  kiku:     { lay: 'v', tat: '#d8b868', tatW: '#be9c4e', tatH: '#eacf8a', heri: '#5a3a22', hp: '#e8b830', toko: '#7a4a2a' },
  momiji:   { lay: 'h', tat: '#c8ac6c', tatW: '#ae9254', tatH: '#dcc488', heri: '#2a3456', toko: '#6a4230' },
  hagi:     { lay: 'v', tat: '#c8c690', tatW: '#acaa74', tatH: '#dedcaa', heri: '#5a3a6a', hp: '#c8a0d0', toko: '#9a7048' },
  tsubaki:  { lay: 'h', tat: '#d4b874', tatW: '#b89c58', tatH: '#e8d092', heri: '#8a1e30', hp: '#e8c060', toko: '#5a3436' },
  hana:     { lay: 'v', tat: '#d6c68c', tatW: '#bcaa6e', tatH: '#e8dca8', heri: '#9a5a5a', hp: '#f4c4c8' },
  hotaru:   { lay: 'h', tat: '#c4c280', tatW: '#aaa864', tatH: '#d8d89c', heri: '#23402c' },
  tsuki:    { lay: 'v', tat: '#d8ca8a', tatW: '#c0ae6c', tatH: '#eee2aa', heri: '#22284a', hp: '#e8c860', lux: 1 },
  yuki:     { lay: 'q', tat: '#ded6a8', tatW: '#c8bc8c', tatH: '#f2eac8', heri: '#b4bccc', lux: 1 },
  // west wing: wood under a rug. wood = [base, lo, lt, seam, hi]; rug f / f2 field, b border, e edge, m motif, mk kind
  oak:      { k: 'planks', wood: ['#7a5234', '#684428', '#8a6040', '#3e2818', '#a07450'], rug: { f: '#2f5a3e', f2: '#3a6a4a', b: '#c8a050', e: '#1c3424', m: '#e0c070', mk: 'diamond' } },
  chevron:  { k: 'chevron', wood: ['#c08a54', '#a87444', '#d29c64', '#6a4428', '#e2b27c'], rug: { f: '#6e5294', f2: '#7c62a6', b: '#ece2c8', e: '#3e2c5a', m: '#f8d8ec', mk: 'flower' } },
  basket:   { k: 'basket', wood: ['#8e4e32', '#7a4028', '#a0603e', '#4a2416', '#b8784e'], rug: { f: '#a63a44', f2: '#b44c52', b: '#28386a', e: '#16182e', m: '#ecc474', mk: 'medallion' } },
  bath:     { k: 'sunoko' },   // a suite's bath corner: hinoki duckboards under the tub
};
const _EN_WALL = {
  shikkui:  { pl: '#f0e6d0', plS: '#d8cbb0', low: 'wood', win: 'shoji' },
  uguisu:   { pl: '#dde0bc', plS: '#c0c49c', tex: 'sand', low: 'bamboo' },
  juraku:   { pl: '#e8d4ae', plS: '#ccb48a', tex: 'sand', low: 'paper', lp: '#f8f0e2', ld: '#e0707a' },
  sakura:   { pl: '#f2dcd8', plS: '#dabcb8', win: 'round' },
  kuchiba:  { pl: '#e6cc8e', plS: '#caac6c', tex: 'sand', low: 'wood', win: 'ranma' },
  bengara:  { pl: '#b8583f', plS: '#8e3e2c', tex: 'sand', low: 'paper', lp: '#f0e0c4', ld: '#c8784a' },
  fuji:     { pl: '#dcd2e4', plS: '#c0b4cc', win: 'shoji' },
  gunjo:    { pl: '#36498c', plS: '#24336a', tex: 'gold', low: 'lacquer', gold: 1 },
  stripe:   { pl: '#ece2bc', plS: '#ccc096', pat: 'stripe', c1: '#7e8a48', c2: '#a8ae6e', low: 'panel', pc: '#5a3a24' },
  trellis:  { pl: '#dcd2ec', plS: '#bcb0d0', pat: 'trellis', c1: '#9a84c4', c2: '#fbf6ff', low: 'panelW' },
  damask:   { pl: '#dea8b0', plS: '#be8892', pat: 'damask', c1: '#b26c7a', c2: '#f4d2d6', low: 'panel', pc: '#6a2e24' },
  tsuchi:   { pl: '#c89e6c', plS: '#aa8050', tex: 'straw', win: 'shitaji' },
  itakabe:  { pl: '#86593a', plS: '#5e3c26', tex: 'boards', win: 'hotaru' },
  kinpaku:  { pl: '#dcb24c', plS: '#b08a30', tex: 'leaf', win: 'moon', gold: 1 },
  karakami: { pl: '#dde4ee', plS: '#bcc8d8', pat: 'yukiwa', c1: '#ffffff', c2: '#c0cce0', win: 'yukimi', gold: 1 },
  hall:     { pl: '#ece2bc', plS: '#ccc096', pat: 'stripe', c1: '#8a3a3a', c2: '#b0645a', low: 'panel', pc: '#5a3a24', win: 'frame' },
};
function _enLook(look) {   // 'preset|a,b[,c]' -> { id, a, b, c }
  const s = String(look), k = s.indexOf('|'), ab = k < 0 ? [] : s.slice(k + 1).split(',');
  return { id: k < 0 ? s : s.slice(0, k), a: +ab[0] || 0, b: +ab[1] || 0, c: +ab[2] || 0 };
}

// ------------------------------------------------------------ room floors
function _enTatP(G, tx, ty, nb, p) {
  const T = p.tat, TW = p.tatW, TH = p.tatH, HE = p.heri;
  if (p.lay === 'q') {   // ryukyu: square borderless mats, the weave turning a quarter on every other mat
    const chk = ((tx + ty) & 1) === 0, v = _enH(tx, ty, 3);
    const base = v < .33 ? _enM(T, TW, .22) : v > .7 ? _enM(T, TH, .25) : T, weave = _enM(base, TW, .55), hi = _enM(base, TH, .6);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) G.set(x, y, (chk ? (y & 1) : (x & 1)) ? weave : base);
    for (let k = 0; k < 16; k++) { G.set(k, 0, hi); G.set(0, k, hi); G.set(k, 15, _enM(base, HE, .75)); G.set(15, k, _enM(base, HE, .75)); }
    G.set(0, 0, _enM(hi, '#ffffff', .3));
    if (p.lux) for (let k = 2; k < 14; k += 4) { G.set(k, 15, _enM(HE, '#ffffff', .4)); G.set(15, k, _enM(HE, '#ffffff', .4)); }   // a silver thread in the seams
    _enAO(G, nb, OUT); return;
  }
  const h = p.lay === 'h', first = ((tx + ty) & 1) === 0;   // v: first = the top half of a mat; h: the left half
  const v = _enH(h ? (first ? tx : tx - 1) : tx, h ? ty : (first ? ty : ty - 1), 3);
  const base = v < .33 ? _enM(T, TW, .2) : v > .7 ? _enM(T, TH, .25) : T;
  const weave = _enM(base, TW, .55), hi = _enM(base, TH, .6), seam = _enM(base, '#6a5a28', .7), heriD = _enM(HE, OUT, .2);
  const heriPx = k => p.lux ? ((k & 1) ? p.hp : HE) : (p.hp && k % 4 === 1 ? p.hp : HE);   // dotted / brocade heri
  if (!h) {
    for (let y = 0; y < 16; y++) for (let x = 1; x < 15; x++) G.set(x, y, (y & 1) ? weave : base);
    for (let y = 0; y < 16; y++) { G.set(0, y, heriPx(ty * 16 + y)); G.set(15, y, heriD); G.set(1, y, hi); G.set(14, y, _enM(base, TW, .8)); }
    if (first) { for (let x = 1; x < 15; x++) { G.set(x, 0, seam); G.set(x, 1, hi); } }
    else for (let x = 1; x < 15; x++) { G.set(x, 15, _enM(base, '#8a7a3a', .55)); G.set(x, 14, _enM(base, TW, .7)); }
  } else {
    for (let y = 1; y < 15; y++) for (let x = 0; x < 16; x++) G.set(x, y, (x & 1) ? weave : base);
    for (let x = 0; x < 16; x++) { G.set(x, 0, heriPx(tx * 16 + x)); G.set(x, 15, heriD); G.set(x, 1, hi); G.set(x, 14, _enM(base, TW, .8)); }
    if (first) { for (let y = 1; y < 15; y++) { G.set(0, y, seam); G.set(1, y, hi); } }
    else for (let y = 1; y < 15; y++) { G.set(15, y, _enM(base, '#8a7a3a', .55)); G.set(14, y, _enM(base, TW, .7)); }
  }
  _enAO(G, nb, OUT);
}
// west wing wood floors (world-pixel patterns: joints run on across tiles). W = [base, lo, lt, seam, hi]
function _enWoodPx(k, W, wx, wy) {
  if (k === 'chevron') {   // 8 px bands of 45-degree slats, every other band mirrored: a chevron parquet
    const b = Math.floor(wx / 8), xi = wx - b * 8, d = wy + ((b & 1) ? xi : 7 - xi), s = Math.floor(d / 3), sp = d - s * 3;
    const t = _enH(b, s, 301);
    let c = t < .3 ? W[1] : t > .72 ? W[2] : W[0];
    if (xi === 0) c = _enM(W[3], W[0], .35); else if (sp === 0) c = _enM(c, W[3], .55); else if (sp === 1) c = _enM(c, W[4], .25);
    return c;
  }
  if (k === 'basket') {   // basket weave: 6 px squares of three 2 px slats, turning every square
    const a = Math.floor(wx / 6), b = Math.floor(wy / 6), xi = wx - a * 6, yi = wy - b * 6, hz = ((a + b) & 1) === 0, q = hz ? yi : xi, sl = q >> 1;
    const t = _enH(a * 3 + (hz ? sl : 0), b * 3 + (hz ? 0 : sl), 302);
    let c = t < .3 ? W[1] : t > .7 ? W[2] : W[0];
    if (xi === 0 || yi === 0) c = W[3]; else if ((q & 1) === 0) c = _enM(c, W[4], .22); else c = _enM(c, W[3], .18);
    return c;
  }
  // planks: 4 px boards, staggered butt joints
  const row = wy >> 2, py = wy & 3, sx = wx + Math.floor(_enH(row, 9, 11) * 36), seg = Math.floor(sx / 36), jx = sx - seg * 36, t = _enH(row, seg, 9);
  let c = t < .3 ? W[1] : t > .72 ? W[2] : W[0];
  if (py === 0 || jx === 0) c = W[3]; else if (py === 1) c = _enM(c, W[4], .3); else if (py === 2 && _enH(wx >> 3, row, 303) < .15) c = _enM(c, W[3], .35);
  return c;
}
function _enRug(r, lx, ly, X0, Y0, X1, Y1) {   // rug pixel at room-local (lx, ly); null = no rug here
  if (lx < X0 || lx > X1 || ly < Y0 || ly > Y1) return null;
  const e = Math.min(lx - X0, X1 - lx, ly - Y0, Y1 - ly), W = X1 - X0, H = Y1 - Y0;
  if (e === 0) return r.e;
  if (e === 1 || e === 3) return r.b;
  if (e === 2) return ((lx + ly) & 3) < 2 ? r.m : r.e;   // a running border of little knots
  if (e === 4) return r.e;
  const u = lx - X0, v = ly - Y0, cx = W / 2, cy = H / 2;
  let c = ((u + v) & 1) ? r.f : _enM(r.f, r.f2, .5);
  if (r.mk === 'diamond') {
    const d1 = (u + v) % 8, d2 = (u - v + 64) % 8;
    if (d1 === 0 || d2 === 0) c = r.f2; if (d1 === 4 && d2 === 4) c = r.m;
  } else if (r.mk === 'flower') {
    const gx = (u - 2) % 9, gy = (v + ((Math.floor((u - 2) / 9) & 1) ? 4 : 0)) % 8;
    if ((gx === 4 && gy === 3) || (gx === 4 && gy === 5) || (gx === 3 && gy === 4) || (gx === 5 && gy === 4)) c = r.m;
    else if (gx === 4 && gy === 4) c = '#f0c040'; else if ((gx === 6 && gy === 6) || (gx === 2 && gy === 2)) c = r.f2;
  } else {   // rosettes on a lattice (a single medallion would hide under the bed)
    const gx = (u - 3) % 12, gy = (v - 3 + ((Math.floor((u - 3) / 12) & 1) ? 6 : 0)) % 12, ad = Math.abs(gx - 4) + Math.abs(gy - 4);
    if (ad === 0) c = r.e; else if (ad === 1) c = r.m; else if (ad === 2 && (gx === 4 || gy === 4)) c = r.m; else if (ad === 3 && gx !== 4 && gy !== 4) c = r.f2;
  }
  return c;
}
function _enRoomFloor(G, tx, ty, nb, p, i, j, toko) {
  if (p.k === 'sunoko') { _enSunoko(G, tx, ty, nb, true); return; }
  if (toko && p.toko) { _enToko(G, tx, ty, nb, p, i); return; }
  if (!p.k) { _enTatP(G, tx, ty, nb, p); return; }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) G.set(x, y, _enWoodPx(p.k, p.wood, tx * 16 + x, ty * 16 + y));
  const X0 = 5, Y0 = 6, X1 = 58, Y1 = 41;   // the rug, in room-local pixels (the room is 64 x 48)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const lx = i * 16 + x, ly = j * 16 + y, c = _enRug(p.rug, lx, ly, X0, Y0, X1, Y1);
    if (c) { G.set(x, y, c); continue; }
    if ((lx === X0 - 1 || lx === X1 + 1) && ly >= Y0 + 1 && ly <= Y1 - 1 && (ly & 1)) { G.set(x, y, '#f2ead6'); continue; }   // fringe at the ends
    if ((lx === X1 + 2 && ly > Y0 && ly <= Y1 + 1) || (ly === Y1 + 1 && lx > X0 && lx <= X1 + 1)) G.set(x, y, _enM(G.get(x, y), OUT, .35));   // its shadow
  }
  _enAO(G, nb, OUT);
}

// the tokonoma (main wing): the decor corner is a raised board of the room's own wood, framed on its open sides
function _enToko(G, tx, ty, nb, p, i) {
  const W = p.toko, L = _enM(W, '#ffffff', .22), D = _enM(W, OUT, .3), openL = nb.l === 't', openR = nb.r === 't';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const t = _enH((tx * 16 + x) >> 3, ty * 16 + y, 361);
    let c = (y & 3) === 0 && _enH(x >> 2, y, 362) < .5 ? _enM(W, D, .4) : t < .2 ? _enM(W, L, .3) : W;
    if (y === 1 || y === 2) c = _enM(c, '#ffffff', .12);   // polish catching the light
    G.set(x, y, c);
  }
  for (let x = 0; x < 16; x++) { G.set(x, 13, '#2a1a14'); G.set(x, 14, _enM(W, OUT, .5)); G.set(x, 15, _enM(p.tat, OUT, .35)); }   // the front frame and its shadow
  if (openL) for (let y = 0; y < 15; y++) { G.set(0, y, '#2a1a14'); G.set(1, y, L); }
  if (openR) for (let y = 0; y < 15; y++) { G.set(15, y, '#2a1a14'); G.set(14, y, D); }
  _enAO(G, nb, OUT);
}
// ------------------------------------------------------------ room walls
function _enWallField(p, lx, y) {   // the plaster / paper at wall-local (lx = 0..16n-1, y = 5..12)
  const P = p.pl, PS = p.plS, h = _enH(lx, y * 7 + 3, 311);
  if (p.pat === 'stripe') { const m = lx % 8; return m < 2 ? p.c1 : m === 2 || m === 7 ? p.c2 : P; }
  if (p.pat === 'trellis') { const d1 = (lx + y) % 6, d2 = (lx - y + 60) % 6; return d1 === 0 || d2 === 0 ? p.c1 : (d1 === 3 && d2 === 3 ? p.c2 : P); }
  if (p.pat === 'damask') {
    const cx = (lx % 8), r = ['..X..', '.XXX.', 'XX.XX', '.XXX.', '..X..'][y - 5], k = r && cx >= 2 && cx <= 6 ? r[cx - 2] : '.';
    return k === 'X' ? p.c1 : (cx === 6 && y === 9) || (cx === 2 && y === 5) ? p.c2 : P;
  }
  if (p.pat === 'yukiwa') {
    const col = Math.floor(lx / 8), oy = (col & 1) ? 1 : 0, cx = lx % 8, r = ['.X.X.', 'X...X', '..X..', 'X...X', '.X.X.'][y - 6 - oy], k = r && cx >= 1 && cx <= 5 ? r[cx - 1] : '.';
    if (k === 'X') return p.c1;
    return (cx === 0 && ((y + col) & 1)) ? p.c2 : (h < .06 ? _enM(P, '#ffffff', .5) : P);   // mica sparkle
  }
  if (p.tex === 'leaf') {   // gold leaf: 5 px squares in slightly different golds, lit seams
    const a = Math.floor(lx / 5), b = Math.floor((y - 5) / 4), xi = lx - a * 5, yi = (y - 5) - b * 4, t = _enH(a, b, 312);
    const base = t < .3 ? _enM(P, PS, .35) : t > .7 ? _enM(P, '#f4d880', .4) : P;
    return xi === 0 || yi === 0 ? _enM(base, '#fff0b0', .35) : base;
  }
  if (p.tex === 'boards') {   // dark cedar boards with battens
    const b = Math.floor(lx / 5), xi = lx - b * 5, t = _enH(b, 0, 313);
    const base = t < .35 ? _enM(P, PS, .35) : t > .7 ? _enM(P, '#a07450', .3) : P;
    return xi === 0 ? PS : xi === 1 ? _enM(base, '#b08860', .25) : (_enH(b, y >> 1, 314) < .1 ? _enM(base, PS, .4) : base);
  }
  if (p.tex === 'straw') {   // earthen wall with chopped straw
    const s = _enH(lx >> 1, y, 315);
    return s < .09 ? '#e6c88e' : s > .93 ? _enM(P, PS, .6) : h < .2 ? _enM(P, PS, .3) : P;
  }
  if (p.tex === 'sand') return h < .16 ? _enM(P, PS, .5) : h > .94 ? _enM(P, '#ffffff', .3) : P;
  if (p.tex === 'gold') return h < .04 ? '#e0b850' : h < .07 ? '#f2d478' : h > .9 ? _enM(P, PS, .4) : P;
  return h < .07 ? _enM(P, PS, .45) : P;
}
function _enWinPx(p, lx, y, n) {   // a window across the middle of the wall; null = none here
  const m = n * 8, w = p.win;   // m = the wall's centre (local px)
  if (w === 'shoji' || w === 'yukimi') {
    const x0 = m - 13, x1 = m + 12; if (lx < x0 || lx > x1 || y < 6 || y > 12) return null;
    if (lx === x0 || lx === x1 || y === 6 || y === 12) return y === 12 ? _EN.dwH : _EN.dwD;
    if (w === 'yukimi' && y >= 9) {   // glass in the lower half: the snowy garden outside
      const s = _enH(lx, y, 321);
      if (y === 9) return _EN.dw;
      return (lx - x0) % 9 === 4 && y === 10 ? '#3a5a4a' : ((lx - x0) % 9 >= 3 && (lx - x0) % 9 <= 5 && y === 11) ? '#2e4a3c' : s < .2 ? '#dce8f4' : '#f6fafe';
    }
    return (lx - x0) % 5 === 0 || (y - 6) % 3 === 0 ? _EN.paperF : (y < 9 ? _EN.paper : '#f2ead6');
  }
  if (w === 'round' || w === 'moon') {
    const dx = lx + .5 - m, dy = y + .5 - 8.8, d = Math.hypot(dx, dy * 1.05);
    if (d > 5.2) return null;
    if (d > 4.3) return w === 'moon' ? '#2a2026' : _EN.dwD;
    if (d > 3.6) return w === 'moon' ? '#e0b448' : _EN.dw;
    if (w === 'moon') {
      const md = Math.hypot(dx - 1.2, dy + .9);
      if (md < 1.9) return md < 1.1 ? '#fff8d8' : '#f6e49a';
      return (dx === -1.5 && dy === 1.5) || (Math.round(dx) === -2 && Math.round(dy) === -1) ? '#d8dcf0' : (dy > 1.5 ? '#26305a' : '#1e2850');
    }
    return Math.abs(dx) < .6 || Math.abs(dy) < .6 ? _EN.paperF : (dy < 0 ? _EN.paper : '#f2ead6');
  }
  if (w === 'ranma') {   // carved lattice transom
    const x0 = m - 12, x1 = m + 11; if (lx < x0 || lx > x1 || y < 6 || y > 9) return null;
    if (y === 6 || y === 9 || lx === x0 || lx === x1) return _EN.dwD;
    return ((lx + y) % 4 === 0 || (lx - y + 40) % 4 === 0) ? _EN.dw : '#f6ecd4';
  }
  if (w === 'shitaji') {   // rustic window: a bamboo lattice behind paper, rounded corners
    const x0 = m - 10, x1 = m + 9; if (lx < x0 || lx > x1 || y < 6 || y > 11) return null;
    if ((lx === x0 || lx === x1) && (y === 6 || y === 11)) return null;
    if (lx === x0 || lx === x1 || y === 6 || y === 11) return '#8a6a3a';
    const vx = (lx - x0) === 4 || (lx - x0) === 9 || (lx - x0) === 15, hy = y === 8 || (y === 10 && (lx - x0) > 6);
    return vx || hy ? '#a8884a' : (y < 9 ? '#f6ead0' : '#ecdcbc');
  }
  if (w === 'hotaru') {   // a small window onto the night: dark leaves, a few fireflies
    const x0 = m - 8, x1 = m + 7; if (lx < x0 || lx > x1 || y < 6 || y > 11) return null;
    if (lx === x0 || lx === x1 || y === 6 || y === 11) return '#3a2418';
    const u = lx - x0, f = (u === 4 && y === 8) || (u === 10 && y === 9) || (u === 7 && y === 7);
    return f ? '#e8f890' : (u === 5 && y === 9) || (u === 11 && y === 10) ? '#7a9a40' : (_enVN(lx / 2, y / 2, 322) > .55 ? '#24402c' : '#182a22');
  }
  if (w === 'frame') {   // the west hall: a gilt frame with a little landscape in oils
    const x0 = m - 7, x1 = m + 6; if (lx < x0 || lx > x1 || y < 6 || y > 11) return null;
    if (lx === x0 || y === 6) return '#f0c860'; if (lx === x1 || y === 11) return '#a07020';
    const u = lx - x0;
    return y === 7 ? '#a8c8e0' : y === 8 ? (u > 7 ? '#c8dcec' : '#9ab8d4') : y === 9 ? (u < 6 ? '#4a7a4a' : '#6a9a5a') : '#5a8a4a';
  }
  return null;
}
function _enRoomWall(G, tx, ty, nb, p, i, n) {
  n = n || 4;
  _enCap(G, nb.u === '#');
  if (p.gold) for (let x = 0; x < 16; x++) if (((i * 16 + x) % 16) === 7 || ((i * 16 + x) % 16) === 8) { G.set(x, 3, '#f2d478'); G.set(x, 4, '#c8962e'); }   // gilt nail covers on the beam
  const low = p.low, lowTop = low === 'bamboo' || low === 'panel' || low === 'panelW' ? 9 : 10;
  for (let y = 5; y < 13; y++) for (let x = 0; x < 16; x++) {
    const lx = i * 16 + x;
    let c = _enWallField(p, lx, y);
    if (low && y >= lowTop) {
      const k = y - lowTop;
      if (low === 'wood') c = k === 0 ? _EN.dwH : (lx % 6 === 0 ? _EN.dwD : (k === 1 ? _enM(_EN.dw, _EN.dwH, .3) : _EN.dw));
      else if (low === 'bamboo') { const m3 = lx % 3, node = 10 + Math.floor(_enH(Math.floor(lx / 3), 0, 331) * 2); c = k === 0 ? '#c8a860' : (m3 === 0 ? '#4e7e30' : m3 === 1 ? '#a8d070' : '#7cb04a'); if (y === node && k > 0) c = _enM(c, '#3e6a2c', .6); }
      else if (low === 'paper') { c = k === 0 ? _enM(p.lp, p.plS, .45) : ((lx * 3 + y * 5) % 11 === 0 ? p.ld : ((lx * 3 + y * 5) % 11 === 1 && y === 11) ? _enM(p.ld, p.lp, .5) : p.lp); }
      else if (low === 'lacquer') c = k === 0 ? '#d8b050' : (k === 1 && _enH(lx >> 2, 0, 332) < .3 ? '#4a3a42' : '#2a2026');
      else if (low === 'panel' || low === 'panelW') {
        const P2 = low === 'panelW' ? '#ece6f2' : p.pc, rail = low === 'panelW' ? '#fbf8ff' : '#b07a48', railD = low === 'panelW' ? '#c8c0d4' : '#7a4a2a';
        const q = lx % 16, inset = q >= 2 && q <= 13 && k >= 2;
        c = k === 0 ? rail : k === 1 ? railD : inset ? (q === 2 || k === 2 ? _enM(P2, '#000000', .18) : q === 13 ? _enM(P2, '#ffffff', .15) : P2) : _enM(P2, '#ffffff', .08);
      }
    }
    if (y === 5) c = _enM(c, '#2a2430', .3); else if (y === 6 && _enBay(x, y) < .5) c = _enM(c, '#2a2430', .14);   // the beam's shadow
    const w = p.win ? _enWinPx(p, lx, y, n) : null;
    G.set(x, y, w || c);
  }
  if (p.win === 'round' || p.win === 'moon') for (const y of [4, 13]) for (let x = 0; x < 16; x++) { const w = _enWinPx(p, i * 16 + x, y, n); if (w) G.set(x, y, w); }
  // skirting
  for (let x = 0; x < 16; x++) {
    if (!(p.win === 'round' || p.win === 'moon') || !_enWinPx(p, i * 16 + x, 13, n)) G.set(x, 13, _enM(p.plS, '#2a2430', .15));
    G.set(x, 14, _EN.dwH); G.set(x, 15, _EN.dwD);
  }
  if (p.gold) for (let x = 0; x < 16; x++) G.set(x, 14, (x + i) % 4 === 0 ? '#f2d478' : '#c8962e');
  // posts at the room's two corners, and one in the middle when there is no window there
  const post = (x0, lit) => { for (let y = 5; y < 16; y++) { G.set(x0, y, lit ? _EN.dwH : _EN.dw); G.set(x0 + 1, y, lit ? _EN.dw : _EN.dwD); } };
  if (i === 0) post(0, true);
  if (i === n - 1) post(14, false);
  if (!p.win && n > 2 && i === (n >> 1)) post(0, true);
}

// ------------------------------------------------------------ west wing hall (Taisho): chevron parquet, a red runner
const _EN_HALLW = ['#9a6a40', '#86582f', '#ac7a4c', '#4e3220', '#c8925c'];
function _enHallPx(wx, wy) {
  const R0 = 127, R1 = 144;   // the runner, world x (col 8 centre +- 9)
  if (wx < R0 || wx > R1) return wx === R1 + 1 ? _enM(_enWoodPx('chevron', _EN_HALLW, wx, wy), OUT, .3) : _enWoodPx('chevron', _EN_HALLW, wx, wy);
  const e = Math.min(wx - R0, R1 - wx);
  if (e === 0) return '#4a1a1e'; if (e === 1) return '#c8a050'; if (e === 2) return '#7a2228';
  return ((wy >> 1) + (wx >> 1)) % 5 === 0 ? '#9a3238' : '#8a2a30';
}
function _enHall(G, tx, ty, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) G.set(x, y, _enHallPx(tx * 16 + x, ty * 16 + y));
  _enAO(G, nb, OUT);
}

// ------------------------------------------------------------ the star-view bath (roten): hinoki everywhere, milky water
function _enSunoko(G, tx, ty, nb, inRoom, season) {   // hinoki duckboard: 3 px slats east-west, 1 px gaps, staggered joints
  const H = _EN_HIN;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, row = wy >> 2, py = wy & 3, sx = wx + Math.floor(_enH(row, 0, 341) * 30), seg = Math.floor(sx / 30), jx = sx - seg * 30;
    const t = _enH(row, seg, 342);
    let c = t < .3 ? _enM(H.hin, H.hinD, .35) : t > .7 ? _enM(H.hin, H.hinL, .3) : H.hin;
    if (py === 3) c = H.gap; else if (jx === 0) c = H.hinS; else if (py === 0) c = _enM(c, H.hinL, .45); else if (py === 2) c = _enM(c, H.hinD, .3);
    if ((jx === 2 || jx === 27) && py === 1) c = '#8a6040';   // nails
    G.set(x, y, c);
  }
  if (!inRoom && season === 3) _enSnowOver(G, tx, ty, _enDrift(tx, ty, { u: nb.u, l: nb.l === 'f' ? 'f' : null, r: nb.r === 'f' ? 'f' : null }, 'fr', 3));   // winter: a little drift under the rocks
  _enAO(G, inRoom ? nb : { u: nb.u === 'r' || nb.u === '#' ? '#' : null, l: nb.l === 'D' || nb.l === '#' ? '#' : null, r: null }, OUT, .7);
}
// bath corners (the 'r' tiles at each end of the roten pool): deck, stacked buckets, a bamboo lantern
function _enRotenSide(G, tx, ty, nb, season) {
  const H = _EN_HIN;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {   // north-south boards
    const wx = tx * 16 + x, b = Math.floor(wx / 4), bx = wx & 3, t = _enH(b, ty, 343);
    let c = t < .3 ? _enM(H.hin, H.hinD, .3) : t > .7 ? _enM(H.hin, H.hinL, .3) : H.hin;
    if (bx === 3) c = H.gap; else if (bx === 0) c = _enM(c, H.hinL, .4);
    G.set(x, y, c);
  }
  const bottom = nb.d !== 'r', left = tx < 32, sh = (x, y, k) => G.set(x, y, _enM(G.get(x, y) || H.hin, OUT, k));
  if (!bottom) for (let x = 0; x < 16; x++) { sh(x, 0, .5); sh(x, 1, .25); }   // in the shade of the rocks
  if (left !== bottom) {   // a little stool with two buckets stacked upside down on it
    const cx = left ? 7 : 8;
    for (let x = cx - 6; x <= cx + 5; x++) { G.set(x, 11, H.hinL); G.set(x, 12, H.hinD); sh(x, 14, .35); }   // stool seat
    for (const lx of [cx - 5, cx + 4]) { G.set(lx, 13, H.hinS); G.set(lx, 14, H.hinS); }
    const bucket = (bx, by) => {   // seen upside down: the round wooden bottom on top, the staves, a copper hoop
      for (let y = by; y <= by + 4; y++) for (let x = bx - 4; x <= bx + 3; x++) G.set(x, y, x === bx - 4 ? H.hinL : x === bx + 3 ? H.hinS : (x - bx + 8) % 3 === 0 ? _enM(H.hin, H.hinD, .45) : H.hin);
      for (let x = bx - 4; x <= bx + 3; x++) G.set(x, by + 3, x === bx - 4 ? '#d88a4a' : '#b0602c');
      for (let x = bx - 3; x <= bx + 2; x++) { G.set(x, by - 1, H.hinL); G.set(x, by, x < bx ? '#fbe8c0' : H.hinL); }
      G.set(bx + 3, by, H.hinD);
    };
    bucket(cx, 6); bucket(cx - 1, 1);
    if (season === 3) for (let x = cx - 4; x <= cx + 1; x++) { G.set(x, 0, _EN_SN.w); G.set(x, 1, x < cx - 2 ? _EN_SN.h : _EN_SN.b); }   // winter: snow on the top bucket
  } else {   // the bamboo lantern (a prop, map.js SCENERY) stands here in a ring of pebbles
    for (const [x, y, c] of [[3, 13, '#a8a8a0'], [4, 14, '#8a8a84'], [7, 14, '#b4b2aa'], [10, 14, '#9a9a94'], [12, 13, '#a8a8a0'], [2, 11, '#9a9a94'], [13, 11, '#8a8a84']]) { G.set(x, y, season === 3 ? _EN_SN.h : c); G.set(x + 1, y, season === 3 ? _EN_SN.s : _enM(c, OUT, .2)); }
  }
  if (nb.l === 'f') for (let y = 0; y < 16; y++) { sh(0, y, .35); if (_enBay(1, y) < .5) sh(1, y, .15); }
  if (season === 3) _enSnowOver(G, tx, ty, _enDrift(tx, ty, { u: bottom ? null : 'r', l: nb.l === 'f' ? 'f' : null }, 'rf', 3));   // winter: drifts in the corner by the rocks
}
// milky (nigori) water inside a hinoki rim; 4 slow frames like waterArt, seamless; rim on the sides that are not water.
// Soft wavy bands (big dither patches read as ice), slow white crests, the rim's shadow on the top / left.
const _EN_MILK = { m: '#d8e6e2', mS: '#c0d4d2', mD: '#a8c0c2', mH: '#eef6f3' };
function _enRotenWater(G, frame, tx, ty, nb) {
  const M = _EN_MILK, H = _EN_HIN, eU = nb.u !== '~', eD = nb.d !== '~', eL = nb.l !== '~', eR = nb.r !== '~';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, n = _enVN(wx / 24, wy / 12, 351), w = Math.sin(wx / 7 + wy * .9 + n * 5);
    let c = w > .82 ? M.mH : w < -.86 ? M.mS : M.m;
    if (n < .3 && w < -.5) c = M.mS; else if (n > .72 && w > .5) c = M.mH;
    G.set(x, y, c);
  }
  // slow crests: short white lines with a blue-grey trough under them, each cycling 4 stages with its own phase
  const RH = 6, SW = 13, y0 = ty * 16, x0 = tx * 16;
  for (let r = Math.floor(y0 / RH) - 1; r <= Math.floor((y0 + 15) / RH) + 1; r++) {
    const off = (r * 5) % SW;
    for (let s = Math.floor((x0 - off) / SW) - 1; s <= Math.floor((x0 + 16 - off) / SW) + 1; s++) {
      if (_enH(s, r, 356) < .25) continue;
      const st = (frame + Math.floor(_enH(r, s, 352) * 4)) % 4, cx = s * SW + off + 3 + Math.floor(_enH(s, r, 353) * 6), cy = r * RH + Math.floor(_enH(s, r, 354) * 3);
      const len = [2, 4, 5, 3][st], sh = st >= 2 ? 1 : 0;
      for (let i = 0; i < len; i++) {
        const px = cx - (len >> 1) + i + sh - x0, py = cy - y0;
        if (px >= 0 && px < 16 && py >= 0 && py < 16) G.set(px, py, st === 1 || st === 2 ? '#ffffff' : M.mH);
        if ((st === 1 || st === 2) && px >= 0 && px < 16 && py + 1 >= 0 && py + 1 < 16) G.set(px, py + 1, M.mD);
      }
    }
  }
  // the hinoki rim (3 px: lit edge, top, inner edge) and the soft shadow it casts on the water (top and left sides)
  const rim = [H.hinL, H.hin, H.hinD];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dU = eU ? y : 99, dD = eD ? 15 - y : 99, dL = eL ? x : 99, dR = eR ? 15 - x : 99, d = Math.min(dU, dD, dL, dR);
    if (d < 3) {
      const along = d === dU || d === dD ? tx * 16 + x : ty * 16 + y;
      let c = rim[d];
      if ((d === dD || d === dR) && d === 0) c = H.hinS;
      else if (d === 1 && along % 24 === 0) c = H.hinS;   // butt joints between rim boards
      else if (d === 1 && _enH(along >> 2, d, 355) < .12) c = _enM(c, H.hinD, .4);
      G.set(x, y, c);
    } else if (d === 3) G.set(x, y, dU === 3 || dL === 3 ? '#8aa4ac' : M.mD);
    else if (d === 4 && (dU === 4 || dL === 4)) G.set(x, y, _enM(G.get(x, y), '#8aa4ac', _enBay(x, y) < .5 ? .45 : .2));
    else if (d === 5 && (dU === 5 || dL === 5) && _enBay(x, y) < .3) G.set(x, y, _enM(G.get(x, y), '#8aa4ac', .2));
  }
}
// ------------------------------------------------------------ the lower garden (FEEDBACK A3; the bare v2.0 plaza)
// looks: 'bed|v,f' flower bed on an 'f' tile (v 0 hydrangea, 1 iris, 2 cosmos, 3 marigold), 'hedge|0,f' clipped box
// hedge on 'f', 'gd|s,f' the char's own painter (+ s = 1: a stepping stone in the grass). f = 1: the low bamboo fence
// (yotsume-gaki) along the tile's west edge, between the garden and the front yard.
function _enGardenLook(ch, L) {
  if (L.id === 'bed' && ch === 'f') return (G, tx, ty, nb, s) => { _enFlowerBed(G, tx, ty, nb, L.a, s); if (L.b) _enLowFence(G, tx, ty, s); };
  if (L.id === 'hedge' && ch === 'f') return (G, tx, ty, nb, s) => { _enHedge(G, tx, ty, nb, s); if (L.b) _enLowFence(G, tx, ty, s); };
  if (L.id === 'gd' && _EN_TILE[ch]) return (G, tx, ty, nb, s) => { _EN_TILE[ch](G, tx, ty, nb, s); if (L.a) _enGrassStone(G, tx, ty, s); if (L.b) _enLowFence(G, tx, ty, s); };
  return null;
}
const _EN_BLOOM = [
  [['#4a5ac8', '#7a8ae8', '#b4c0ff'], ['#8a4ab8', '#b07ae0', '#dcc0ff'], ['#5a7ad8', '#94b0f0', '#e0e8ff']],   // hydrangea: blue / violet / sky
  [['#5a2a9a', '#7a4ac0', '#f0d040']],                                                                        // iris: purple, yellow throat
  [['#e0609a', '#f490b8', '#ffe070'], ['#f4f0f4', '#ffffff', '#ffd040'], ['#c03a78', '#e070a0', '#ffe070']],   // cosmos
  [['#e86a10', '#f89a30', '#7a3a10'], ['#f0b010', '#ffd850', '#8a5a10']],                                       // marigold
];
// planting: a mass of leaf clumps (lit top-left, like the azaleas) over dark soil, flowers on a hashed lattice, an edging
// of small stones on every side that is not more planting
// v2.1: what each bed shows by season. Summer = v2.0.1 (hydrangea, iris, cosmos, marigold); spring tulips / pansies and
// iris leaves; autumn dried hydrangea heads, yellowing iris, cosmos and marigold; winter snow over the beds, the red
// berries of nanten showing through
const _EN_BEDS = [
  [[['#d83a3a', '#f06a5a', '#fff0d0'], ['#f0a0c0', '#ffc8dc', '#fff4f8'], ['#f0c020', '#ffe060', '#fffbe0']], null,
    [['#6a3ab8', '#9a6ae0', '#ffe060'], ['#f0d020', '#ffec70', '#5a3a2a'], ['#f4f0f4', '#ffffff', '#8a4ac0']], [['#f08a20', '#ffb050', '#fff0c0'], ['#e8c020', '#ffe060', '#fffbe0']]],
  _EN_BLOOM,
  [[['#9a6a74', '#b88e96', '#d8b8b8'], ['#7e7e5e', '#a0a07c', '#c4c0a0'], ['#8a7088', '#a890a4', '#cab4c4']], null, _EN_BLOOM[2], _EN_BLOOM[3]],
  [null, null, null, null],
];
function _enFlowerBed(G, tx, ty, nb, v, season) {
  v = clamp(v | 0, 0, 3); season = (season | 0) & 3;
  const LP = season === 2 ? (v === 2 || v === 3 ? ['#3a4a22', '#4e6226', '#6a7a2e', '#8a9038', '#a8a844'] : ['#4a4a22', '#6a6026', '#8a7a2e', '#ac9438', '#c8b048'])
    : season === 3 ? ['#16301f', '#1e4228', '#2a5430', '#36663a', '#447444']
    : season === 0 && v !== 1 ? ['#24522a', '#326e32', '#48903c', '#62aa48', '#86c45a']
    : v === 2 ? ['#2e5a26', '#3e7a2c', '#5a9a3a', '#7cb850', '#9ad068'] : ['#1f4a2a', '#2c6a30', '#3f8a38', '#56a040', '#74b84e'];
  const BL = season === 2 ? ['#c8b048', '#7a7a30'] : season === 3 ? ['#6a6a4a', '#4a4a34'] : ['#84c058', '#3e7a2c'];   // iris blades: lit / shaded
  const open = c => c !== 'f' && c !== 'b' && c !== '#' && c != null;
  const eU = open(nb.u), eD = open(nb.d), eL = open(nb.l), eR = open(nb.r);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, edge = Math.min(eU ? y : 9, eD ? 15 - y : 9, eL ? x : 9, eR ? 15 - x : 9);
    let c = _enH(wx, wy, 401) < .2 ? '#6a543a' : '#54402c';   // soil
    if (edge >= 1) {
      if (v === 1) {   // iris: upright blades
        const col = wx % 3, top = 2 + Math.floor(_enH(wx >> 1, 7, 402) * 6) + (season === 3 ? 4 : 0), base = 15 - (eD ? 2 : 0);
        if (col !== 2 && (wy % 16) >= top - (col ? 1 : 0) && y <= base && edge >= 2) c = col === 0 ? BL[0] : BL[1];
        else if (_enVN(wx / 3, wy / 3, 403) > .4) c = edge >= 2 ? LP[2] : LP[1];
      } else {
        const S = 4, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
        let best = 99, ox = 0, oy = 0;
        for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
          const fx = i * S + _enH(i, j, 404) * S, fy = j * S + _enH(j, i, 405) * S, d = Math.hypot(wx - fx, wy - fy);
          if (d < best) { best = d; ox = wx - fx; oy = wy - fy; }
        }
        const mass = _enVN(wx / 6, wy / 5, 406) * .6 + edge * .14;   // a full mound inside, ragged towards the edge
        if (mass > .42) c = LP[clamp(Math.round(2.6 - (ox + oy) / S * .9 - best / S * .6 + (_enBay(x, y) - .5) * .5 - (edge < 2 ? 1 : 0)), 0, 4)];
      }
    }
    if (edge === 0) {   // where the bed meets the lawn / walk: a ragged soil line, a stone now and then
      const t = _enH(wx >> 1, wy >> 1, 408);
      c = t < .3 ? (t < .12 ? '#c4c2b8' : '#9a9a94') : _enM(c, '#3a2c1e', .3);
    }
    G.set(x, y, c);
  }
  if (season === 3) {   // winter: the beds lie under snow; leaves show on the shaded sides, nanten berries here and there
    const leaf = new Set(LP);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, wy = ty * 16 + y, c = G.get(x, y), edge = Math.min(eU ? y : 9, eD ? 15 - y : 9, eL ? x : 9, eR ? 15 - x : 9);
      if (edge === 0) { G.set(x, y, c === '#c4c2b8' ? _EN_SN.h : (eD && y === 15) || (eR && x === 15) ? _EN_SN.d : _EN_SN.s); continue; }   // the bed's edge: a soft blue step in the snow
      const tuft = (leaf.has(c) || c === BL[0] || c === BL[1]) && _enVN(wx / 5, wy / 4, 611) < .3;
      if (!tuft) G.set(x, y, _enSnowAt(wx, wy, x, y));
      else if (_enVN(wx / 5, (wy - 1) / 4, 611) >= .3) G.set(x, y, _EN_SN.h);   // snow on the top of each evergreen tuft
    }
    for (let k = 0; k < 3; k++) {
      if (_enH(tx, ty, 612 + k) < .45) continue;
      const bx = 3 + Math.floor(_enH(tx, ty, 615 + k) * 10), by = 3 + Math.floor(_enH(ty, tx, 618 + k) * 10);
      G.set(bx, by, '#d8302a'); G.set(bx + 1, by, '#b8201e'); G.set(bx, by + 1, '#a01a1a'); G.set(bx - 1, by + 1, '#e85040'); G.set(bx + 1, by - 1, '#2a5430');
    }
    return;
  }
  // flowers on a jittered lattice; hydrangea = big round heads, the others small blooms (spring: tulip cups)
  const PAL = _EN_BEDS[season][v], step = v === 0 ? 7 : 4;
  if (!PAL) return;
  for (let j = Math.floor(ty * 16 / step) - 1; j <= Math.floor((ty * 16 + 15) / step) + 1; j++) for (let i = Math.floor(tx * 16 / step) - 1; i <= Math.floor((tx * 16 + 15) / step) + 1; i++) {
    if (_enH(i, j, 409) < (v === 0 ? .1 : .22)) continue;
    const fx = i * step + Math.floor(_enH(i, j, 410) * (step - 1)), fy = j * step + Math.floor(_enH(j, i, 411) * (step - 1)), p = PAL[Math.floor(_enH(i, j, 412) * PAL.length)];
    const lx = fx - tx * 16, ly = fy - ty * 16, edge = Math.min(eU ? ly : 9, eD ? 15 - ly : 9, eL ? lx : 9, eR ? 15 - lx : 9);
    if (edge < (v === 0 ? 3 : 2)) continue;
    const put = (x, y, col) => { if (x >= 0 && y >= 0 && x < 16 && y < 16) G.set(x, y, col); };
    if (season === 0 && (v === 0 || v === 3)) {   // spring: a tulip cup on its stem (two per hydrangea slot)
      for (const [ox, oy] of v === 0 ? [[-2, 0], [2, 1]] : [[0, 0]]) {
        const x = lx + ox, y = ly + oy;
        put(x, y + 2, '#3e7a2c'); put(x, y + 1, '#3e7a2c'); put(x - 1, y - 1, p[1]); put(x + 1, y - 1, p[0]); put(x - 1, y, p[1]); put(x, y, p[0]); put(x + 1, y, p[0]); put(x, y - 1, p[2]);
      }
    } else if (v === 0) {   // hydrangea head: a 5x4 mound of florets, lit top-left (autumn: dried)
      [[-1, -2], [0, -2], [1, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1]].forEach(([dx, dy]) => put(lx + dx, ly + dy, dx + dy < -1 ? p[2] : dx + dy > 0 ? p[0] : p[1]));
      put(lx - 1, ly - 1, season === 2 ? p[2] : '#ffffff'); put(lx + 1, ly + 2, '#1f4a2a');
    } else if (v === 1) {   // iris flower on a blade top
      put(lx, ly - 1, p[1]); put(lx - 1, ly, p[0]); put(lx + 1, ly, p[0]); put(lx, ly, p[2]); put(lx, ly + 1, p[0]);
    } else {
      put(lx, ly - 1, p[1]); put(lx - 1, ly, p[1]); put(lx + 1, ly, p[0]); put(lx, ly + 1, p[0]); put(lx, ly, p[2]);
    }
  }
}
const _EN_HEDGEP = [['#1e4226', '#2a5a2e', '#357036', '#468a3e', '#62a446', '#84bc56'], ['#183c22', '#225228', '#2c6630', '#3a7e38', '#529a40', '#74b44e'],
  ['#2a3a1e', '#3a4e22', '#4e6226', '#6a7a2e', '#8a9038', '#acaa48'], ['#16301f', '#1e4228', '#2a5430', '#36663a', '#447444', '#56864e']];
function _enHedge(G, tx, ty, nb, season) {   // clipped box hedge: small leaf clumps lit top-left, a flat bright top edge, a shaded front
  season = (season | 0) & 3;
  const PAL = _EN_HEDGEP[season];
  const front = nb.d !== 'f', top = nb.u !== 'f', l = nb.l !== 'f', r = nb.r !== 'f';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, S = 3, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
    let best = 99, ox = 0, oy = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const fx = i * S + _enH(i, j, 421) * S, fy = j * S + _enH(j, i, 422) * S, d = Math.hypot(wx - fx, wy - fy);
      if (d < best) { best = d; ox = wx - fx; oy = wy - fy; }
    }
    let k = Math.round(3.2 - (ox + oy) / S * .8 - best / S * .7 + (_enBay(x, y) - .5) * .4);
    if (front && y >= 12) k = y === 15 ? 0 : Math.min(k - 2, 2);   // the front face, in shade
    else if (top && y < 2) k = y === 0 ? 3 : 5;                    // the clipped top edge catches the light
    if (l && x < 1) k = Math.min(5, k + 1);
    if (r && x > 14) k = Math.max(1, k - 2);
    let c = PAL[clamp(k, 0, 5)];
    if (season === 2 && _enH(ci, cj, 621) < .18 && k >= 2) c = k >= 4 ? '#d8803a' : '#a8502a';   // autumn: russet leaves among the green
    if (season === 3 && !(front && y >= 12)) {   // winter: snow on the clipped top, flecks lower down
      const s = _enVN(wx / 3, wy / 2, 622);
      if ((top && y < 4 + s * 3) || (k >= 4 && s > .62)) c = top && y === 0 ? _EN_SN.h : k >= 4 ? _EN_SN.w : k >= 2 ? _EN_SN.b : _EN_SN.s;
    }
    G.set(x, y, c);
  }
}
function _enLowFence(G, tx, ty, season) {   // a knee-high bamboo fence along the tile's west edge, tied at each post
  for (let y = 0; y < 16; y++) {
    const wy = ty * 16 + y, post = wy % 8 === 3 || wy % 8 === 4;
    G.set(0, y, '#2a3a1a'); G.set(1, y, post ? '#e0c890' : '#c8a860'); G.set(2, y, post ? '#b89858' : '#9a7a40');
    G.set(3, y, post ? '#5a4024' : _enM(G.get(3, y), OUT, .25));
    if (wy % 8 === 4) G.set(1, y, '#5a3a1e');   // rope tie
    if (season === 3 && post && wy % 8 === 3) { G.set(1, y, _EN_SN.w); G.set(2, y, _EN_SN.b); }   // winter: a pinch of snow on each post
  }
}
function _enGrassStone(G, tx, ty, season) {   // a flat stepping stone set in the grass (tobi-ishi), lit top-left, contact shadow
  const snow = ((season | 0) & 3) === 3;
  const wx0 = tx * 16 + 8, wy0 = ty * 16 + 8, cx = 8 + (_enH(wx0, wy0, 431) - .5) * 3, cy = 8 + (_enH(wy0, wx0, 432) - .5) * 2, rx = 4.8, ry = 3.6;
  const base = ['#bcb6a8', '#c6c0b2', '#b0aa9c'][Math.floor(_enH(tx, ty, 433) * 3)];
  for (let y = 2; y < 15; y++) for (let x = 1; x < 15; x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, r2 = nx * nx + ny * ny, sh = ((x + .5 - cx - .8) / rx) ** 2 + ((y + .5 - cy - 1.2) / ry) ** 2;
    if (r2 > 1) { if (sh <= 1) G.set(x, y, snow ? _EN_SN.d : _enM(G.get(x, y), '#24402a', .35)); continue; }
    const c = r2 > .6 && nx + ny > .35 ? _enM(base, '#5a5040', .3) : r2 > .5 && nx + ny < -.45 ? _enM(base, '#ffffff', .32) : base;
    G.set(x, y, snow ? (r2 > .7 && nx + ny < -.3 ? _EN_SN.h : _enM(c, '#dfe6f0', .14)) : c);
  }
}

// ============================================================ v2.1 trees (SPEC_v2 16.14: treeArt(kind, season, size))
// Same shapes as the v2.0 trees (sakura 32x44 / maple 28x36 / pine 32x40, sizes 1 / 2 for the groves), now by season:
// sakura  spring in bloom | summer green | autumn thinning orange leaves | winter bare, snow on the twigs
// maple   spring fresh yellow-green | summer deep green | autumn red | winter bare, snow on the twigs
// pine    evergreen; spring new candles | winter snow on every pad + yukitsuri ropes from a pole (Kenroku-en)
// WORKFLOW 3.5 technique: an egg of small round leaf clumps lit top-left in 7 tones, each clump lit on its own top-left,
// a dark-green (not black) outline, the trunk lit on the left, flaring at the roots.
const _enHt = (x, y, s) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// keep(i, px, py) may drop clumps (autumn thinning); returns how many clumps were kept
function _enCrown(G, cx, cy, rx, ry, pal, seed, cr, keep) {
  cr = cr || 2.4;
  const pts = [];
  for (let gy = -ry; gy <= ry + .01; gy += cr * 1.2) for (let gx = -rx; gx <= rx + .01; gx += cr * 1.25) {
    const qx = R(gx * 4), qy = R(gy * 4);
    const px = gx + (_enHt(qx, qy, seed) - .5) * cr * .9, py = gy + (_enHt(qx, qy, seed + 1) - .5) * cr * .9;
    if ((px / rx) * (px / rx) + (py / ry) * (py / ry) <= 1) pts.push([cx + px, cy + py, qx, qy]);
  }
  const r2 = cr * cr * 1.2;
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    let best = -1, bd = 1e9;
    for (let i = 0; i < pts.length; i++) { const dx = x + .5 - pts[i][0], dy = y + .5 - pts[i][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    if (best < 0 || bd > r2) continue;
    if (keep && !keep(pts[best][2], pts[best][3], (pts[best][1] - cy) / ry)) continue;
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
    const glob = .6 - ny * .36 - nx * .22 - Math.max(0, nx * nx + ny * ny - .6) * .4;
    const loc = -((x + .5 - pts[best][0]) + (y + .5 - pts[best][1])) / (cr * 2);
    const v = glob + loc * .3 + (DITHER[y & 1][x & 1] - .375) * .1;
    G.set(x, y, pal[clamp(Math.floor(v * pal.length), 0, pal.length - 1)]);
  }
}
// trunk along a polyline from the base up; width w0 -> w1; pal [dark, mid, light] (light on the left)
function _enTrunk(G, pts, w0, w1, pal) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    for (let y = y1; y <= y0; y++) {
      const t = (y0 - y) / Math.max(1, y0 - y1), c = x0 + (x1 - x0) * t, w = w0 + (w1 - w0) * ((i + t) / (pts.length - 1));
      const a = R(c - w / 2), b = Math.max(a, R(c + w / 2) - 1);
      for (let x = a; x <= b; x++) { const u = (x - a + .5) / (b - a + 1); G.set(x, y, u < .38 ? pal[2] : u < .72 ? pal[1] : pal[0]); }
    }
  }
}
// bare twigs: from (x, y) at angle a (radians, -PI/2 = up), each branch forks in two; kept inside the crown's egg
function _enTwigs(G, x, y, a, len, depth, seed, eg, pal) {
  const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
  const nx = (x1 - eg[0]) / eg[2], ny = (y1 - eg[1]) / eg[3];
  const k = nx * nx + ny * ny > 1 ? 1 / Math.sqrt(nx * nx + ny * ny) : 1;   // pull a tip back inside the egg
  const ex = eg[0] + (x1 - eg[0]) * k, ey = eg[1] + (y1 - eg[1]) * k;
  gLine(G, x, y, ex, ey, len > 5 ? pal[1] : len > 3 ? pal[2] : depth > 0 ? pal[3] : pal[4]);
  if (len > 5.5) gLine(G, x + 1, y, ex + 1, ey, pal[0]);   // thick limbs: a shaded second line on the right
  if (depth <= 0) return;
  const h1 = _enHt(R(ex * 4), R(ey * 4), seed), h2 = _enHt(R(ey * 4), R(ex * 4), seed + 1);
  const sp = .38 + h1 * .3;
  _enTwigs(G, ex, ey, a - sp, len * (.62 + h2 * .18), depth - 1, seed + 2, eg, pal);
  _enTwigs(G, ex, ey, a + sp * (.8 + h2 * .4), len * (.6 + h1 * .2), depth - 1, seed + 3, eg, pal);
}
// snow on every branch pixel that has open sky above it (winter)
function _enSnowOnTwigs(G, top, seed) {
  const add = [];
  for (let y = 1; y < top; y++) for (let x = 0; x < G.w; x++) if (G.get(x, y) && !G.get(x, y - 1) && _enHt(x, y, seed) < .72) add.push([x, y - 1, _enHt(y, x, seed + 1) < .5 ? _EN_SN.w : _EN_SN.h]);
  for (const [x, y, c] of add) G.set(x, y, c);
}
// own outline (crown colour mixed with a dark tone, not black; bare winter twigs get none) + soft ground shadow
function _enTreeCanvas(w, h, fn, dark, shCx, shRx, snow, bare) {
  const G = new Grid(w, h); fn(G);
  const add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (G.get(x, y) || (bare && y < h - 8)) continue;
    const below = G.get(x, y + 1), n = below || G.get(x - 1, y) || G.get(x + 1, y) || G.get(x, y - 1);
    if (n) add.push([x, y, mixHex(n, dark, below ? .5 : .62)]);
  }
  add.forEach(([x, y, c]) => G.set(x, y, c));
  const c = mk(w, h), cx = c.getContext('2d');
  for (let y = h - 3; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + .5 - shCx) / shRx, dy = (y + .5 - (h - 1.5)) / 1.7;
    if (dx * dx + dy * dy <= 1) { cx.fillStyle = (snow ? 'rgba(60,72,120,' : 'rgba(30,40,24,') + (dx * dx + dy * dy < .45 ? .32 : .18) + ')'; cx.fillRect(x, y, 1, 1); }
  }
  cx.drawImage(G.canvas(), 0, 0);
  return c;
}
const _EN_TREE = { sakura: [32, 44], maple: [28, 36], pine: [32, 40] };
// the full trees (size 0) and the grove sizes 1 (medium) / 2 (sapling): [w, h, trunk pts, trunk w0, w1, branches,
// crown cx, cy, rx, ry, clump seed, clump r]. Anchor (w/2, h) in every size.
const _EN_TREE_S = {
  sakura: [[32, 44, [[16, 41], [16, 34], [15, 27]], 5, 3, [[15, 30, 9, 24], [17, 29, 23, 23], [16, 28, 16, 22]], 16, 15.5, 14.5, 13, 7, 2.5],
    [26, 36, [[13, 33], [13, 27], [12, 22]], 4, 3, [[12, 25, 7, 19], [14, 24, 19, 18]], 13, 13, 11.5, 10.5, 11, 2.3],
    [20, 28, [[10, 25], [10, 20], [10, 16]], 3, 2, [[10, 19, 6, 14], [10, 18, 14, 13]], 10, 10, 8.5, 8, 13, 2]],
  maple: [[28, 36, [[14, 33], [14, 26], [13, 21]], 4, 3, [[13, 24, 8, 19], [15, 23, 20, 18]], 14, 13.5, 12.5, 11, 17, 2.1],
    [24, 30, [[12, 27], [12, 21], [11, 17]], 4, 3, [[11, 20, 7, 15], [13, 19, 17, 14]], 12, 11.5, 10.5, 9.5, 19, 2],
    [18, 24, [[9, 21], [9, 17], [9, 13]], 3, 2, [[9, 16, 5, 12], [9, 15, 13, 11]], 9, 9, 7.5, 7, 23, 1.8]],
};
// crown palettes (dark -> light) + the outline tone, by kind and season (4 = the classic v2.0 look: no season given)
const _EN_TREEP = {
  sakura: [[['#8a3a5a', '#a8506e', '#c66a88', '#de86a0', '#eea2b8', '#f8c0d0', '#fde0ea'], '#5a1e38'],
    [['#1c4626', '#265a2c', '#327034', '#42863c', '#569c44', '#70b050', '#90c662'], '#10301a'],
    [['#5a3414', '#7e4a18', '#a2641e', '#c08028', '#d89c34', '#eab848', '#f6d468'], '#3a200c'], null],
  maple: [[['#3a5a1e', '#4a7024', '#5e8a2c', '#78a436', '#94bc44', '#b2d258', '#d0e67a'], '#22381a'],
    [['#163c22', '#1e5028', '#2a662e', '#367c34', '#48923c', '#62a84a', '#84be5c'], '#0e2a16'],
    [['#6a1e1a', '#8a2a1e', '#ae3a22', '#cc5226', '#e4702c', '#f29a40', '#fac46a'], '#4a1410'], null],
};
const _EN_TRUNK = ['#4a3024', '#6a4632', '#8a6246'], _EN_BARE = ['#3a2a24', '#5a4234', '#6e5444', '#7a6050', '#8e7462'];
function _enTree(kind, season, size) {
  if (!_EN_TREE[kind]) kind = 'sakura';
  const classic = season == null;   // no season: the v2.0 look (sakura in bloom, maple red) for the cover / title
  season = classic ? (kind === 'maple' ? 2 : 0) : (season | 0) & 3;
  if (kind === 'pine') return art('en:tree:pine:' + season, () => _enPine(season));
  size = size === 1 || size === 2 ? size : 0;
  return art('en:tree:' + kind + ':' + size + ':' + season, () => {
    const [w, h, tp, w0, w1, br, cx, cy, rx, ry, seed, cr] = _EN_TREE_S[kind][size], TR = _EN_TRUNK;
    const P = _EN_TREEP[kind][season], winter = season === 3, mottle = kind === 'sakura' && season === 2;
    const dark = P ? P[1] : '#2a201c', egg = [cx, cy, rx * .95, ry * .95];
    const big = size === 0, sak = kind === 'sakura';
    return _enTreeCanvas(w, h, G => {
      _enTrunk(G, tp, w0, w1, TR);
      if (big && sak) { G.set(13, 41, TR[1]); G.set(19, 41, TR[0]); G.set(12, 41, TR[0]); }   // roots
      else if (big) { G.set(11, 33, TR[1]); G.set(16, 33, TR[0]); }
      else { G.set(tp[0][0] - 2, tp[0][1], TR[1]); G.set(tp[0][0] + 2, tp[0][1], TR[0]); }
      br.forEach(([a, b, c2, d]) => { gLine(G, a, b, c2, d, TR[1]); if (size === 1 || (big && sak)) gLine(G, a + 1, b, c2 + 1, d, TR[0]); });
      if (winter) {   // bare twigs, a haze of the finest ones inside the crown's egg, snow along the tops of the branches
        const top = tp[tp.length - 1], depth = size === 0 ? 5 : size === 1 ? 4 : 3;
        const L0 = ry * (size === 0 ? .4 : .46);
        br.forEach(([a, b, c2, d], i) => _enTwigs(G, c2, d, Math.atan2(d - b, c2 - a), L0 * .8, depth, seed + 10 * i, egg, _EN_BARE));
        _enTwigs(G, top[0], top[1], -Math.PI / 2, L0, depth, seed + 40, egg, _EN_BARE);
        for (let y = 0; y < h - 6; y++) for (let x = 0; x < w; x++) {
          const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, r = nx * nx + ny * ny;
          if (r < .92 && !G.get(x, y) && _enHt(x, y, seed + 70) < .2 * (1 - r * .5) && _enVN(x / 3, y / 3, seed) > .42) G.set(x, y, r < .5 ? '#7e6c62' : '#988a80');
        }
        _enSnowOnTwigs(G, h - 4, seed + 50); return;
      }
      _enCrown(G, cx, cy, rx, ry, P[0], seed, cr);
      if (mottle) _enCrown(G, cx, cy, rx, ry, ['#4a1a14', '#6e2418', '#94301c', '#b84222', '#d45a2c', '#e87a3c', '#f49c58'], seed, cr, (qx, qy) => _enHt(qx, qy, seed + 60) < .38);   // autumn sakura: red clumps among the orange
      if (sak && season === 0) {   // white glints in the blossom
        const [x0, x1, y0, y1] = big ? [3, 28, 4, 24] : [1, w - 1, 2, h - 8];
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const c = G.get(x, y); if (c && (c === P[0][5] || c === P[0][4]) && _enHt(x, y, big ? 9 : seed + 2) < .07) G.set(x, y, '#ffffff'); }
      }
      if (season === 0 || season === 2) {   // a fallen petal / leaf or three at the foot
        const fall = big ? (sak ? [[10, 41, 5], [22, 40, 4], [25, 42, 5]] : [[6, 33, 4], [21, 34, 3], [18, 32, 5]]) : [[cx - 6, h - 2, sak ? 5 : 4], [cx + 5, h - 3, sak ? 4 : 3]];
        for (const [x, y, i] of fall) G.set(x, y, P[0][i]);
      }
    }, dark, cx, big ? (sak ? 10 : 9) : rx * .62, winter, winter);
  });
}
// pine: S-curved trunk + cloud-pruned pads (niwaki). Winter: snow on every pad and the yukitsuri ropes.
function _enPine(season) {
  const TR = _EN_TRUNK, PP = ['#183224', '#21452e', '#2a5636', '#376a40', '#4a8048', '#62984e', '#84b05a'];
  const pads = [[15, 5.5, 6.5, 3.2], [8, 12, 7, 3], [23, 15.5, 8, 3.2], [9, 21.5, 6.5, 2.8], [22.5, 24.5, 6, 2.6]];
  return _enTreeCanvas(32, 40, G => {
    _enTrunk(G, [[16, 37], [17, 31], [15, 24], [13, 17], [14, 11], [15, 6]], 5, 2, TR);
    G.set(13, 37, TR[1]); G.set(19, 37, TR[0]);
    [[15, 22, 23, 19], [14, 16, 8, 13], [16, 26, 22, 26], [14, 27, 9, 24]].forEach(([a, b, c2, d]) => { gLine(G, a, b, c2, d, TR[1]); gLine(G, a, b + 1, c2, d + 1, TR[0]); });
    pads.forEach(([cx, cy, rx, ry], i) => _enCrown(G, cx, cy, rx, ry, PP, 31 + i * 3, 1.7));
    if (season === 0) pads.forEach(([cx, cy, rx, ry], i) => {   // spring: pale new candles on the pads' tops
      for (let k = 0; k < 4; k++) { const x = R(cx - rx * .7 + k * rx * .45), y = R(cy - ry + .6 + (_enHt(i, k, 77) < .5 ? 0 : 1)); if (G.get(x, y)) { G.set(x, y, '#c4e08a'); G.set(x, y - 1, '#a8cc6c'); } }
    });
    if (season === 3) {
      pads.forEach(([cx, cy, rx, ry], i) => {   // a soft cap of snow over the top of each pad
        for (let y = R(cy - ry - 1); y <= cy; y++) for (let x = R(cx - rx - 1); x <= cx + rx + 1; x++) {
          const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, r = nx * nx + ny * ny;
          if (r > 1.05 || !G.get(x, y) || ny > -.05 - _enHt(x, i, 78) * .35) continue;
          G.set(x, y, r > .7 ? (nx < 0 ? _EN_SN.w : _EN_SN.s) : nx + ny < -.6 ? _EN_SN.w : nx > .4 ? _EN_SN.b : _EN_SN.h);
        }
      });
      gLine(G, 16, 6, 16, 0, '#c8a86a'); G.set(17, 1, '#8a7040'); G.set(16, 0, '#e8d4a0');   // the pole above the crown
      for (const [x, y] of [[2, 13], [6, 21], [10, 6], [23, 4], [27, 16], [28, 24]]) gLine(G, 16, 0, x, y, '#cdb98a', true);   // ropes, only over the pads
      for (const [x, y] of [[1, 12], [31, 17], [29, 25], [3, 22]]) gLine(G, 16, 0, x, y, '#c4ae7e');                   // the outer ropes, seen against the sky
    }
  }, '#0e2016', 16, 9, season === 3);
}
