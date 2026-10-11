/*ART:env:BEGIN*/
// ============================================================ ART: env - scenery tiles (SPEC_v2 12.2; was art/env.js until the stage M merge)
// v1 API (SPEC 4.2, signatures kept): tileArt(ch, tx, ty, nb) , waterArt(frame, tx, ty) , doorArt(kind, open) ,
//   entranceNoren() , lockedShade()
// v2 API (SPEC_v2 12.2):
//   tileArt(ch, tx, ty, nb, season)          16x16, tile top-left. New chars k m z x q o; season 0..3 is in the cache key
//                                             (v2.0 always 0, drawn the same). 'o' = static pond tile (frame 0 of pondArt).
//   doorArt(kind, open, col, emb, gold, tx, ty)  16x16, opaque. kind: left | right | onsen | hdoor | gate | gateH.
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
  wa: '#5cc8c8', waD: '#3aa6b4', waH: '#8ae0dc', foam: '#e8fbf8',
  gr: '#6aa84a', grD: '#5a9640', grH: '#84c060', step: '#b8b2a4',
  bam: '#7cb84a', bamD: '#5a9a3a', rope: '#c8a860',
  lan: '#e0503a', warm: '#ffd27a',
  // v2 materials (SPEC_v2 2.1)
  kit: '#8e9cac', kitD: '#7c8a9c', kitG: '#566072', kitH: '#adb8c4',
  din: '#9a6038', dinD: '#7a4a2a', dinS: '#55321e', dinH: '#b47c4a',
  goza: '#c9b46c', gozaW: '#b19c58', gozaH: '#dccb86',
  sand: '#e0dccf', sandS: '#c6bfac', sandH: '#f3f0e8',
  deck: '#b98b5a', deckD: '#9a6e44', deckH: '#d2a876', deckS: '#5e3e26',
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
function _enCanvas(G) {   // Grid -> canvas, one fillRect per horizontal run of equal colour
  const c = mk(G.w, G.h), x = c.getContext('2d');
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w;) {
    const col = G.d[j * G.w + i]; let k = i + 1;
    while (k < G.w && G.d[j * G.w + k] === col) k++;
    if (col) { x.fillStyle = col; x.fillRect(i, j, k - i, 1); }
    i = k;
  }
  return c;
}
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

// ------------------------------------------------------------ walls
function _enCap(G, under) {   // top 5 rows of every wall face: rim + wall-top cap, then the beam (nageshi)
  G.rect(0, 0, 16, 1, under ? _EN.top : '#8a7470'); G.rect(0, 1, 16, 1, _EN.topD);
  G.rect(0, 2, 16, 1, _EN.dwH); G.rect(0, 3, 16, 1, _EN.dw); G.rect(0, 4, 16, 1, _EN.dwD);
}
function _enWallFace(G, tx, ty, nb) {
  const lintel = nb.d === 'D', facade = _EN_FACADE.has(nb.d);
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
  if (lintel) {   // wall above a door: carved transom (ranma) + door lintel (kamoi)
    G.rect(3, 6, 10, 6, _EN.dwD);
    for (let x = 4; x < 12; x++) for (let y = 7; y < 11; y++) {
      const wave = (y === 8 || y === 9) && ((x + (y === 9 ? 2 : 0)) % 4 < 2);   // a little carved wave between slats
      G.set(x, y, wave ? _EN.dwH : (x & 1) ? _EN.dw : '#f6ecd4');
    }
    G.rect(4, 7, 8, 1, _enM(_EN.dw, _EN.dwD, .5));
    G.rect(0, 12, 16, 1, _EN.plS);
    G.rect(0, 13, 16, 1, _EN.dwH); G.rect(0, 14, 16, 1, _EN.dw); G.rect(0, 15, 16, 1, _EN.dwD);
  } else if (facade) {
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
}
function _enWallTop(G, tx, ty, nb) {
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
function _enSlate(G, tx, ty, nb) {
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
      G.set(x, 0, '#2f7c88'); G.set(x, 1, '#dcdad0'); G.set(x, 2, _EN.slH); G.set(x, 3, (wx % 20 === 0) ? _EN.slD : '#b4b2aa'); G.set(x, 4, _EN.slD);
      if (_enBay(x, 5) < .5) G.set(x, 5, _enM(G.get(x, 5), '#5a8a90', .3));
    }
  }
  const soft = { u: nb.u === 'r' || nb.u === '#' || nb.u === 'D' ? '#' : null, l: nb.l === 'f' || nb.l === 'r' ? '#' : null, r: nb.r === 'f' || nb.r === 'r' ? '#' : null };
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
function _enGrass(G, tx, ty, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, n = _enVN(wx / 11, wy / 9, 71), d = _enBay(x, y);
    let c = _EN.gr;
    if (n > .64 && d < (n - .64) * 4) c = _EN.grH; else if (n < .34 && d < (.34 - n) * 4) c = _EN.grD;
    G.set(x, y, c);
  }
  const tuft = (x, y) => {   // a little three-blade tuft, lit on the left blade
    [[0, 0, '#4a8636'], [-1, 0, _EN.grD], [1, 0, _EN.grD], [-1, -1, _EN.grH], [1, -1, '#4a8636'], [0, -1, _EN.grD], [-2, -2, _EN.grH], [2, -2, _EN.grD], [0, -2, _EN.grH]]
      .forEach(([dx, dy, c]) => G.set(x + dx, y + dy, c));
  };
  const n = Math.floor(_enH(tx, ty, 72) * 2.6);
  for (let i = 0; i < n; i++) tuft(3 + Math.floor(_enH(tx, ty, 73 + i) * 10), 4 + Math.floor(_enH(ty, tx, 75 + i) * 10));
  const f = _enH(tx, ty, 77);
  if (f < .32) {   // a pair of tiny flowers
    const cols = [['#ffffff', '#ffe27a'], ['#ff9ab8', '#fff0f4'], ['#ffe066', '#ffffff']][Math.floor(_enH(tx, ty, 78) * 3)];
    const fx = 3 + Math.floor(_enH(tx, ty, 79) * 10), fy = 3 + Math.floor(_enH(ty, tx, 80) * 10);
    const flower = (x, y) => { G.set(x, y + 1, '#4a8636'); G.set(x - 1, y, cols[0]); G.set(x + 1, y, cols[0]); G.set(x, y - 1, cols[0]); G.set(x, y, cols[1]); };
    flower(fx, fy); if (f < .16) flower(fx + (fx > 8 ? -3 : 3), fy + 2);
  }
  _enAO(G, nb, '#24402a', .9);
}
function _enPath(G, tx, ty, nb) {   // fitted-stone walk (nobedan) in the middle, raked gravel with a grass fringe at the sides
  if (!(ty >= 30 && tx >= 15 && tx <= 19)) { _enGardenPath(G, tx, ty, nb); return; }   // only the front approach is the v1 wide walk
  const edgeL = nb.l === 'g' || nb.l === 'b', edgeR = nb.r === 'g' || nb.r === 'b';
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
      if (outer < fr) c = (outer === fr - 1) ? _EN.grD : (_enH(wx, wy, 84) < .3 ? _EN.grH : _EN.gr);
      else if (outer === fr) c = _enM(c, '#5a5040', .3);
    } else {
      // Voronoi stones on a jittered 9px lattice
      const S = 9, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
      let d1 = 99, d2 = 99, bx = 0, by = 0, bi = 0, bj = 0;
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const px = i * S + 1 + _enH(i, j, 85) * (S - 2), py = j * S + 1 + _enH(j, i, 86) * (S - 2), d = Math.hypot(wx + .5 - px, wy + .5 - py);
        if (d < d1) { d2 = d1; d1 = d; bx = px; by = py; bi = i; bj = j; } else if (d < d2) d2 = d;
      }
      const e = d2 - d1, base = STONES[Math.floor(_enH(bi, bj, 87) * STONES.length)];
      if (e < 1.1) c = _enH(wx, wy, 88) < .15 ? '#6e8a4a' : '#7e786c';   // mortar, a little moss
      else if (e < 2.4) c = (wx + .5 - bx) + (wy + .5 - by) < 0 ? _enM(base, '#ffffff', .3) : _enM(base, '#5a5040', .22);
      else c = _enH(wx, wy, 89) < .06 ? _enM(base, '#5a5040', .15) : base;
    }
    G.set(x, y, c);
  }
  _enAO(G, nb, '#3a3428', .8);
}
// v2: narrow garden walks (1 tile wide, junctions, the hedge gap): fine gravel, a grass fringe where grass meets it,
// flat stepping stones (tobi-ishi) laid along every arm of the walk.
function _enGardenPath(G, tx, ty, nb) {
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
      if (o < f) c = o === f - 1 ? _EN.grD : (_enH(wx, wy, 224) < .3 ? _EN.grH : _EN.gr);
      else if (o === f) c = _enM(c, '#5a5040', .28);
    }
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
      if (r2 > 1) { if (sh <= 1) G.set(x, y, _enM(G.get(x, y), '#3a3428', .32)); continue; }   // contact shadow, down-right
      let c = base;
      if (r2 > .62 && nx + ny > .35) c = _enM(base, '#5a5040', .3);
      else if (r2 > .5 && nx + ny < -.45) c = _enM(base, '#ffffff', .32);
      else if (_enH(x + tx * 16, y + ty * 16, 230) < .07) c = _enM(base, '#5a5040', .18);
      G.set(x, y, c);
    }
  }
  _enAO(G, nb, '#3a3428', .8);
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
function _enSand(G, tx, ty, nb) {   // raked white gravel (karesansui): wavy rake lines, rings round the stones, a dark kerb
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
    G.set(x, y, c);
  }
  const out = c => c !== 'z';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    const dk = Math.min(out(nb.u) ? y : 9, out(nb.d) ? 15 - y : 9, out(nb.l) ? x : 9, out(nb.r) ? 15 - x : 9);
    if (dk < 2) G.set(x, y, dk === 0 ? (_enH(wx >> 1, wy >> 1, 153) < .5 ? '#6e6a62' : '#7e7a70') : (_enH(wx >> 1, wy >> 1, 154) < .5 ? '#8e8a80' : '#9e998e'));
    else if (dk === 2 && ((out(nb.u) && y === 2) || (out(nb.l) && x === 2))) G.set(x, y, _enM(G.get(x, y), '#8a8272', .35));   // kerb shadow
  }
  _enAO(G, nb, '#3a3428', .6);
}
function _enDeck(G, tx, ty, nb) {   // open-air deck: 6px cedar boards running north-south, staggered butt joints, nail heads
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
function _enStoneQ(G, tx, ty, nb) {
  const TONES = ['#b8b2a4', '#aea898', '#a09a8c', '#bdb7a9', '#b3ad9f'];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, q = _enQCell(wx, wy);
    const base = TONES[Math.floor(_enH(q.row, q.seg, 173) * TONES.length)];
    let c = base;
    const jt = q.py === 0 || q.jx === 0;
    if (jt) c = _enH(wx, wy, 174) < .1 ? '#8a9468' : '#8c8678';   // joints, a little moss
    else if ((q.py === 1 && q.jx === 1)) c = base;                  // rounded corner
    else if (q.py === 1 || q.jx === 1) c = _enM(base, _EN.qsH, .38);
    else if (q.py === q.ph - 1 || q.jx === q.L - 1) c = _enM(base, _EN.qsJ, .22);
    else if (_enH(wx, wy, 175) < .06) c = _enM(base, _EN.qsJ, .3);
    else if (_enVN(wx / 5, wy / 5, 178) > .78 && _enBay(x, y) < .4) c = _enM(base, '#ffffff', .12);   // worn patches
    G.set(x, y, c);
  }
  _enAO(G, nb, '#3a3428', .8);
}
// koi pond: deep teal water inside a rim of natural stones on every side that is not pond
const _EN_PONDNB = new Map();
function _enPondNb(tx, ty) {
  const k = tx + ',' + ty;
  if (_EN_PONDNB.has(k)) return _EN_PONDNB.get(k);
  const isP = (x, y) => x >= 27 && x <= 30 && y >= 15 && y <= 17;   // SPEC_v2 2.1 pond, used before tileArt('o') has run
  return { u: isP(tx, ty - 1) ? 'o' : 'g', d: isP(tx, ty + 1) ? 'o' : 'g', l: isP(tx - 1, ty) ? 'o' : 'g', r: isP(tx + 1, ty) ? 'o' : 'g' };
}
function _enPond(G, frame, tx, ty, nb) {
  const eU = nb.u !== 'o', eD = nb.d !== 'o', eL = nb.l !== 'o', eR = nb.r !== 'o';
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
    if (d2 - d1 < 1) return '#4e4c48';
    if ((wx + .5 - bx) + (wy + .5 - by) < -1.2) return _enM(base, '#ffffff', .25);
    if ((wx + .5 - bx) + (wy + .5 - by) > 1.4) return _enM(base, '#3a3836', .25);
    return _enH(bi, bj, 185) < .3 && wy + .5 < by ? _enM(base, '#6a8a4a', .45) : base;
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y;
    const u = rimW(eU, wx, 4), d = rimW(eD, wx + 40, 3), l = rimW(eL, wy, 4), r = rimW(eR, wy + 40, 3);
    const inside = Math.min(eU ? y - u : 99, eD ? 15 - y - d : 99, eL ? x - l : 99, eR ? 15 - x - r : 99);
    if (inside < 0) { G.set(x, y, stone(wx, wy)); continue; }
    const n = _enVN(wx / 14, wy / 9, 186), b = _enBay(x, y);
    let c = n < .4 && b < (.4 - n) * 2.4 ? _EN.pondD : n > .72 && b < (n - .72) * 2 ? _enM(_EN.pond, _EN.pondH, .35) : _EN.pond;
    if (inside === 0) c = (eU && y - u === 0) || (eL && x - l === 0) ? '#1a4a52' : _enM(_EN.pondD, '#1a4a52', .5);   // shade under the rim
    else if (inside === 1 && ((eU && y - u === 1) || (eL && x - l === 1)) && b < .5) c = _EN.pondD;
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
  // lily pads (static), kept off the rim
  const n = Math.floor(_enH(tx, ty, 191) * 2.4);
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
      G.set(x, y, d > rr - .9 ? (dx + dy > 0 ? '#3e7a34' : '#6aac52') : (dx + dy < -1 ? '#7cbc5a' : '#5a9a46'));
    }
    if (_enH(tx, ty + i, 198) < .45) {   // a water-lily flower on some pads
      const fx = Math.round(cx - .5), fy = Math.round(cy - 1.5);
      G.set(fx, fy, '#f8c8d8'); G.set(fx - 1, fy + 1, '#f0a8c0'); G.set(fx + 1, fy + 1, '#e890a8'); G.set(fx, fy + 1, '#fff2a0');
    }
  }
}

// ------------------------------------------------------------ nature
function _enFence(G, tx, ty, nb) {   // bamboo privacy fence (kenninji-gaki)
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
function _enBush(G, tx, ty, nb) {   // round clipped azalea bushes (tsutsuji), some in flower
  const PAL = ['#1f4a2a', '#2c6a30', '#3f8a38', '#56a040', '#74b84e', '#9ed062'];
  const bushes = [];
  const add = (cx, cy) => bushes.push({ x: cx * 16 + 8 + (_enH(cx, cy, 101) - .5) * 2, y: cy * 16 + 8.5, rx: 8.4 + _enH(cx, cy, 102) * .8, ry: 8.6, cx, cy });
  add(tx, ty);
  if (nb.u === 'f') add(tx, ty - 1); if (nb.d === 'f') add(tx, ty + 1); if (nb.l === 'f') add(tx - 1, ty); if (nb.r === 'f') add(tx + 1, ty);
  const own = (wx, wy) => { let best = null; for (const b of bushes) { const nx = (wx + .5 - b.x) / b.rx, ny = (wy + .5 - b.y) / b.ry; if (nx * nx + ny * ny <= 1 && (!best || b.y > best.y)) best = b; } return best; };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const wx = tx * 16 + x, wy = ty * 16 + y, b = own(wx, wy);
    if (!b) {   // mossy soil between bushes, darker right under a bush
      const under = own(wx, wy - 2);
      G.set(x, y, under ? '#2e3e24' : (_enH(wx, wy, 103) < .2 ? '#56683a' : '#4a5c34'));
      continue;
    }
    const o1 = own(wx - 1, wy), o2 = own(wx + 1, wy), o3 = own(wx, wy - 1), o4 = own(wx, wy + 1);
    if (o1 !== b || o2 !== b || o3 !== b || o4 !== b) {
      const behind = [o1, o2, o3, o4].every(o => !o || o === b || o.y < b.y);
      if (behind) { G.set(x, y, '#183a22'); continue; }
    }
    const lx = (wx + .5 - b.x) / b.rx, ly = (wy + .5 - b.y) / b.ry, light = -(lx * .55 + ly * .85);
    const S = 4, ci = Math.floor(wx / S), cj = Math.floor(wy / S);
    let best = 99, ox = 0, oy = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const fx = i * S + _enH(i, j, 104) * S, fy = j * S + _enH(j, i, 105) * S, d = Math.hypot(wx - fx, wy - fy);
      if (d < best) { best = d; ox = wx - fx; oy = wy - fy; }
    }
    const v = light * 1.25 - (ox + oy) / S * .42 - best / S * .3 + .25 + (_enBay(x, y) - .5) * .25;
    G.set(x, y, PAL[clamp(Math.round(2.6 + v * 2.2), 0, PAL.length - 1)]);
  }
  // blossoms on the lit upper half of this tile's own bush
  const me = bushes[0], fl = _enH(tx, ty, 106);
  if (fl > .35) {
    const P = fl > .78 ? ['#ffffff', '#f0e8f4'] : ['#ff8ab0', '#ffc4dc'];
    for (let i = 0; i < 4; i++) {
      const a = -2.6 + _enH(tx, ty, 107 + i) * 2.4, r = 2 + _enH(ty, tx, 111 + i) * 4;
      const fx = Math.round(me.x + Math.cos(a) * r) - tx * 16, fy = Math.round(me.y - 1 + Math.sin(a) * r * .8) - ty * 16;
      if (fx < 1 || fx > 14 || fy < 1 || fy > 14) continue;
      G.set(fx, fy, P[0]); G.set(fx + 1, fy + 1, _enM(P[0], '#1f4a2a', .45)); if (i & 1) G.set(fx - 1, fy, P[1]);
    }
  }
}
function _enRock(G, tx, ty, nb) {   // onsen boulders; the side facing the water is wet and dark
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
      if (wd < 6) G.set(x, y, wd < 2 ? '#2a8c98' : _enBay(x, y) < .5 ? '#2a8c98' : '#2a6670');
      else G.set(x, y, _enH(wx, wy, 124) < .25 ? '#46553a' : '#3a4234');
      continue;
    }
    const ns = [own(wx - 1, wy), own(wx + 1, wy), own(wx, wy - 1), own(wx, wy + 1)];
    let c;
    if (ns.some(o => o !== b && (!o || o.y + o.ry > b.y + b.ry))) c = '#34343c';
    else {
      const nx = (wx + .5 - b.x) / b.rx, ny = (wy + .5 - b.y) / b.ry, r2 = nx * nx + ny * ny;
      const v = -(nx * .6 + ny * .8) * .95 + (1 - r2) * .6 + (_enBay(x, y) - .5) * .35;
      c = RAMP[clamp(Math.round(1.6 + v * 2), 0, 4)];
      if (b.warm) c = _enM(c, '#8a7058', .14);
      if (b.moss && ny < -.2 && _enVN(wx / 3, wy / 3, 125) > .5) c = ny < -.55 ? '#7a9a52' : '#5e7e44';
    }
    const lit = c === RAMP[3] || c === RAMP[4];
    if (wd < 5) { c = _enM(c, '#1e4650', (5 - wd) / 5 * .55); if (wd > 0 && wd < 4 && lit && _enH(wx, wy, 126) < .3) c = '#bfe6e2'; }
    G.set(x, y, c);
  }
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
  '#': (G, tx, ty, nb) => (nb.d !== '#' && nb.d != null) ? _enWallFace(G, tx, ty, nb) : _enWallTop(G, tx, ty, nb),
  't': _enTatami, '.': _enCorridor, 'l': _enLobby, 's': _enSlate, 'E': _enGenkan, 'g': _enGrass, 'p': _enPath,
  'b': _enFence, 'f': _enBush, 'r': _enRock,
  'k': _enKitchen, 'm': _enDining, 'z': _enSand, 'x': _enDeck, 'q': _enStoneQ,
};
