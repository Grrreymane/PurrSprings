// ------------------------------------------------------------ public API
// look (v2.0.1, optional): a preset from map.js TILE_LOOK on top of the char (room floors / walls, the west hall, the
// star-view bath, the lower garden); see the looks section at the end of env.js
// season (v2.1): 0 spring | 1 summer | 2 autumn | 3 winter (SPEC_v2 16.1). Only outdoor chars change with it
// (g f b r p z x q s o, the outer walls' tops and eaves); rooms, corridors, the lobby, kitchen and dining never do.
// Omitted = 0 (spring = the v2.0 look plus fallen petals).
function tileArt(ch, tx, ty, nb, season, look) {
  nb = nb || {};
  season = (season | 0) & 3;
  if (ch === '~') {   // static water; the animated frames are drawn on top by the core
    if (look === 'milky') { _EN_ROTENNB.set(tx + ',' + ty, { u: nb.u, d: nb.d, l: nb.l, r: nb.r }); return rotenWaterArt(0, tx, ty); }
    return waterArt(0, tx, ty);
  }
  if (ch === 'o') {   // static pond tile; remember its neighbours so pondArt() can draw the same rim every frame
    _EN_PONDNB.set(tx + ',' + ty, { u: nb.u, d: nb.d, l: nb.l, r: nb.r });
    return pondArt(0, tx, ty, season);
  }
  const lf = look ? _enLookFn(ch, look, nb) : null, f = lf || _EN_TILE[ch];
  if (!f) return null;   // 'D' (doors are drawn by doorArt) and anything unknown
  // indoor tiles look the same all year: one canvas for every season. A wall face only changes in winter, and only
  // its top edge (snow on the cap) when the outside is right above it, or its eave on an outer (facade) wall.
  let cap = false;
  if (ch === '#') {
    const face = nb.d !== '#' && nb.d != null, facade = face && _EN_FACADE.has(nb.d);
    cap = face && !facade && season === 3 && (nb.u == null || _EN_OUTCH.has(nb.u));
    if (face ? !(facade || cap) : !_enExposed(nb)) season = 0;
  } else if (!_EN_OUTCH.has(ch) || ch === 'E') season = 0;
  const k = 'en:t:' + ch + ':' + tx + ',' + ty + ':' + nb.u + ',' + nb.d + ',' + nb.l + ',' + nb.r + ':' + season + (lf ? ':' + look : '');
  return art(k, () => _enMake(16, 16, G => { f(G, tx, ty, nb, season); if (cap) _enCapSnow(G, tx); }));
}
// the painter for a look, or null (unknown look: the plain char)
function _enLookFn(ch, look, nb) {
  const L = _enLook(look);
  if (ch === 't' && _EN_FLOOR[L.id]) return (G, tx, ty, nb2) => _enRoomFloor(G, tx, ty, nb2, _EN_FLOOR[L.id], L.a, L.b, L.c);
  if (ch === 'r' && L.id === 'rockdry') return (G, tx, ty, nb2, s) => _enRock(G, tx, ty, Object.assign({}, nb2, { d: nb2.d === '~' ? 'x' : nb2.d }), s);   // behind a rimmed bath: no wet edge
  if (ch === '#' && _EN_WALL[L.id]) return nb.d !== '#' && nb.d != null ? (G, tx, ty, nb2) => _enRoomWall(G, tx, ty, nb2, _EN_WALL[L.id], L.a, L.b) : null;
  if (ch === '.' && L.id === 'hall') return _enHall;
  if (ch === 's' && L.id === 'sunoko') return (G, tx, ty, nb2, s) => _enSunoko(G, tx, ty, nb2, false, s);
  if (ch === 'r' && L.id === 'roten') return _enRotenSide;
  return _enGardenLook(ch, L);
}
// the star-view bath's own water: milky, in a hinoki rim; 4 frames like waterArt (the core steps them every 0.4 s)
const _EN_ROTENNB = new Map();
function rotenWaterArt(frame, tx, ty) {
  frame = (((frame | 0) % 4) + 4) % 4;
  const isW = (x, y) => x >= 27 && x <= 37 && y >= 2 && y <= 3;   // SPEC_v2 2.4 pool, used before tileArt has run
  const nb = _EN_ROTENNB.get(tx + ',' + ty) || { u: isW(tx, ty - 1) ? '~' : 'r', d: isW(tx, ty + 1) ? '~' : 's', l: isW(tx - 1, ty) ? '~' : 'r', r: isW(tx + 1, ty) ? '~' : 'r' };
  const k = 'en:rw:' + frame + ':' + tx + ',' + ty + ':' + (nb.u === '~' ? 1 : 0) + (nb.d === '~' ? 1 : 0) + (nb.l === '~' ? 1 : 0) + (nb.r === '~' ? 1 : 0);
  return art(k, () => _enMake(16, 16, G => _enRotenWater(G, frame, tx, ty, nb)));
}
function waterArt(frame, tx, ty) {
  frame = (((frame | 0) % 4) + 4) % 4;
  return art('en:w:' + frame + ':' + tx + ',' + ty, () => _enMake(16, 16, G => _enWaterPx(G, frame, tx, ty)));
}
// doors: 'left' (left room, in the corridor's west wall) | 'right' (mirror) | 'onsen' (in the horizontal wall, red noren)
// v2: 'hdoor' (horizontal wall, west wing) | 'gate' (bamboo wicket gate in a north-south fence) | 'gateH' (in the hedge)
// floor (v2.0.1, optional): [room floor look, outside look or char] for a room door, so the doorway shows that room's
// floor (and the west hall's parquet); without it the floors come from the crest (_EN_DOORFLOOR) as before
// season (v2.1, optional; pass it for every door): the gates stand outdoors, so their ground and top rail follow the
// season; the onsen door gets the winter snow line of the outer wall it sits in. Room doors ignore it.
// v2.4: span 'w' = a door 2 tiles wide (32 x 16: onsen / hdoor / gateH), 'h' = 2 tiles tall (16 x 32: left / right /
// gate); anchor = its top-left tile. beyond (hdoor): what the doorway shows past the noren - 'din' the dining floor,
// 'sand' the shrine's raked sand, else the west wing hall.
function doorArt(kind, open, col, emb, gold, tx, ty, floor, season, span, beyond) {
  open = !!open;
  const gate = kind === 'gate' || kind === 'gateH';
  const DW = span === 'w' ? 32 : 16, DH = span === 'h' ? 32 : 16;
  let sty = !gate && kind !== 'onsen' && open && !!(col || emb || gold);   // a closed door is the same shoji in every style
  if (kind === 'hdoor') sty = open;
  if (gate) { tx = tx == null ? (kind === 'gate' ? 24 : 25) : tx | 0; ty = ty == null ? (kind === 'gate' ? 4 : 29) : ty | 0; }
  const fl = sty && Array.isArray(floor) ? floor : null, sea = gate || kind === 'onsen' ? (season | 0) & 3 : 0;
  const k = 'en:d:' + kind + ':' + (open ? 1 : 0) + (sty ? ':' + (col || '') + ':' + (emb || '') + ':' + (gold ? 1 : 0) : '') + (gate ? ':' + tx + ',' + ty + ':' + (emb || '') + ':' + sea : '') + (fl ? ':' + fl.join('/') : '') + (kind === 'onsen' && sea === 3 ? ':w' : '') + ':' + DW + 'x' + DH + (beyond ? ':' + beyond : '');
  return art(k, () => {
    if (kind === 'onsen') return _enMake(DW, DH, G => _enOnsenDoor(G, open, sea === 3 ? tx | 0 : null));   // winter: the snow line on the outer wall's top runs over it
    if (kind === 'hdoor') return _enMake(DW, DH, G => _enHDoor(G, open, col, emb, gold, beyond));
    if (gate) return _enMake(DW, DH, G => _enGate(G, open, tx, ty, kind === 'gateH', emb === 'star' || (kind === 'gate' && tx === 24 && ty === 4), sea));
    if (!sty) {
      if (kind === 'right') return flipC(doorArt('left', open, null, null, false, null, null, null, 0, span));
      return _enMake(DW, DH, G => _enRoomDoor(G, open));
    }
    const right = kind === 'right', dfl = _EN_DOORFLOOR[emb];
    return _enMake(DW, DH, G => {
      _enRoomDoor(G, open, { col, gold, floor: fl ? [_enLook(fl[0]).id, fl[1] === 'p' ? 'grav' : fl[1] === 'hall' ? 'hall' : (dfl ? dfl[1] : null)] : dfl });
      if (right) _enFlipG(G);
      if (emb) _enEmblem(G, emb, right ? 5 : 6, 2, col || _EN.ind);
    });
  });
}
// v2.4: paint a 16 x 16 tile painter into a bigger grid at (ox, oy) (the wide gates' paving, tile by tile)
function _enSub(G, ox, oy, fn) { const T = new Grid(16, 16); fn(T); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = T.get(x, y); if (c) G.set(ox + x, oy + y, c); } }
const _EN_HDOOR_TEA = '#7a5a3a';   // tea-brown noren for the west wing door (pass as col)
function _enFlipG(G) { for (let y = 0; y < G.h; y++) { const r = G.d.slice(y * G.w, y * G.w + G.w).reverse(); for (let x = 0; x < G.w; x++) G.d[y * G.w + x] = r[x]; } }
// what you see through an open styled door: [room side, corridor side] (before mirroring a 'right' door)
const _EN_DOORFLOOR = { rice: ['din', 'lobby'], pinebranch: ['grav', 'lobby'], hana: ['tat', 'grav'], firefly: ['tat', 'grav'], moon: ['tat', 'grav'], snow: ['tat', 'grav'] };
// 5x5 noren crests (SPEC_v2 12.2 emb ids). X = crest colour, o = accent (warm yellow on dark cloth, softer on light cloth)
const _EN_EMB = {
  pine:       ['..X..', '.XXX.', 'XXXXX', '..X..', '..X..'],
  bamboo:     ['X.X.X', 'X.X.X', '.XXX.', '..X..', '..X..'],
  plum:       ['..X..', 'XXXXX', 'XXoXX', '.XXX.', '.X.X.'],
  sakura:     ['X...X', 'XX.XX', 'XXXXX', '.XXX.', '..X..'],
  chrys:      ['X.X.X', '.XXX.', 'XXoXX', '.XXX.', 'X.X.X'],
  maple:      ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', '..X..'],
  bush:       ['...XX', '..X.o', '.X..o', 'X.o..', 'X....'],
  camellia:   ['.XXX.', 'XXoXX', 'XoooX', 'XXoXX', '.XXX.'],
  tea:        ['.X.X.', 'XX.XX', 'XX.XX', '.X.X.', '..X..'],
  wisteria:   ['XXXXX', 'X.X.X', 'X.X.X', '.X.X.', '.X...'],
  orchid:     ['X...X', 'XX.XX', '.XoX.', '..X..', '..X..'],
  hana:       ['.XXX.', 'XXoXX', '.XXX.', '..X..', '.XX..'],
  firefly:    ['.X.X.', 'XXXXX', '.XXX.', '..o..', '.ooo.'],
  moon:       ['.XXX.', 'XX...', 'X..o.', 'XX...', '.XXX.'],
  snow:       ['..X..', 'X.X.X', '.XXX.', 'X.X.X', '..X..'],
  rice:       ['X.X..', '.X.X.', 'XXXXX', 'XXXXX', '.XXX.'],
  pinebranch: ['X...X', 'X...X', '.X.X.', '.X.X.', '..X..'],
  ga:         ['XXXXX', 'XoXoX', '.XXX.', '..X..', '..X..'],
  zen:        ['.XXX.', 'X...X', 'X...X', 'X..X.', '.X...'],
  cat:        ['X.X.X', '.....', '.XXX.', 'XXXXX', '.XXX.'],
  fuku:       ['.X.X.', '..X..', 'XXXXX', 'XXXXX', '.XXX.'],
  fish:       ['.....', '.XX.X', 'XXXXX', '.XX.X', '.....'],
  tea2:       ['.XX..', 'X.X..', 'XXXXX', 'XXXXX', '.XXX.'],
  // v2.1 seasonal combos (16.1): night sakura (a blossom over two lanterns), summer cool (a wind chime and its paper
  // strip), moon viewing (a full moon over pampas tips), kotatsu (the quilted table), the cat's dream (a cat curled
  // asleep), new year (kagami mochi with its bitter orange)
  yozakura:   ['.X.X.', 'XXoXX', '.XXX.', '.X.X.', 'o...o'],
  suzumi:     ['..X..', '.XXX.', 'XXXXX', '..o..', '..o..'],
  tsukimi:    ['.XXX.', 'XXXXX', 'XXXXX', '.XXX.', 'o.o.o'],
  kotatsu:    ['.....', 'XXXXX', 'XoXoX', 'XXXXX', 'X...X'],
  yume:       ['X.X..', 'XXXX.', 'XoXXX', '.XXXX', '..XX.'],
  shinnen:    ['..o..', '.XXX.', 'XXXXX', '.XXX.', 'XXXXX'],
  torii:      ['XXXXX', '.X.X.', 'XXXXX', '.X.X.', '.X.X.'],   // v2.4: the west wing's gate to the shrine
};
function _enLum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) / 255; }
function _enEmblem(G, emb, x0, y0, cloth) {
  const rs = _EN_EMB[emb]; if (!rs) return;
  const light = _enLum(cloth) > .6, main = light ? _enM(cloth, OUT, .68) : _EN.wht, acc = light ? _enM(cloth, OUT, .4) : _EN.warm;
  rs.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(x0 + i, y0 + j, main); else if (ch === 'o') G.set(x0 + i, y0 + j, acc); }));
}
function _enShoji(G, x0, y0, x1, y1, kick) {   // a pair of sliding paper doors filling x0..x1, y0..y1
  const mid = (x0 + x1) >> 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const stile = x === x0 || x === mid || x === mid + 1 || x === x1, rail = y === y0 || y === y1;
    let c = (y - y0) % 3 === 0 ? '#a8764a' : _EN.paper;
    if (y > (y0 + y1) / 2 + 1 && c === _EN.paper) c = '#f4eedc';
    if (y >= y1 - kick) c = y === y1 - kick ? _EN.dwH : _EN.dw;
    if (stile || rail) c = x === mid + 1 || x === x1 ? '#6e4428' : _EN.paperF;
    G.set(x, y, c);
  }
  G.set(mid - 1, (y0 + y1) >> 1, _EN.dwD); G.set(mid + 2, (y0 + y1) >> 1, _EN.dwD);   // finger pulls (hikite)
}
// v2.5 (player feedback "the box outline round the door does not look like a way through"): an open door is a
// passage. The floors of both sides run through the opening, the wall just ends (the tile above a door in a
// vertical wall is that wall's end face, see _enWallFace), and the noren hangs from a rod at the top edge, short,
// with the floor showing under it. Only a locked door is closed (shoji in a frame).
function _enDoorFloorPx(k, x, y, dflt) {   // one pixel of a floor seen in a doorway (k: a floor look id | hall | din | lobby | grav | sand | null)
  const F = k ? _EN_FLOOR[k] : null;
  if (F && F.wood) return _enWoodPx(F.k, F.wood, x + 3, y);   // v2.0.1: the room's own floor (A1)
  if (F && F.tat) return (y & 1) ? _enM(F.tat, F.tatW, .55) : F.tat;
  if (k === 'hall') return _enWoodPx('chevron', _EN_HALLW, x + 2, y);
  if (k === 'din') return y % 6 === 0 ? _EN.dinS : y % 6 === 1 ? _EN.dinH : _EN.din;
  if (k === 'lobby') return y % 8 === 0 ? _EN.dw : y % 8 === 1 ? _enM(_EN.wood, _EN.dwH, .2) : _enM(_EN.wood, _EN.dwH, .42);
  if (k === 'grav') return (x + y * 3) % 5 === 0 ? '#b4ad9e' : '#d2cbbb';
  if (k === 'sand') return (y + (x >> 3)) % 3 === 0 ? '#cfc8b4' : '#e0dccf';
  return dflt === 'tat' ? ((y & 1) ? _enM(_EN.tat, _EN.tatW, .55) : _EN.tat) : (y % 4 === 0) ? _enM(_EN.woodS, _EN.dw, .25) : y % 4 === 1 ? _enM(_EN.wood, _EN.woodH, .45) : _EN.wood;
}
// a noren hung from a rod on row ry over x0..x1, cloth rows ry+1..y1; tongues = slit columns (open below row sy)
function _enNoren(G, x0, x1, ry, y1, base, gold, slits, sy) {
  const L = _enM(base, '#ffffff', .2), Lm = _enM(base, '#ffffff', .1), D = _enM(base, OUT, .32), Dm = _enM(base, OUT, .16);
  for (let x = x0; x <= x1; x++) G.set(x, ry, x === x0 || x === x1 ? '#3a2418' : _EN.dwD);
  for (let y = ry + 1; y <= y1; y++) for (let x = x0 + 1; x < x1; x++) {
    if (y > sy && slits.includes(x)) continue;
    let c = base;
    if (y === ry + 1) c = L; else if (y === y1 || x === x1 - 1 || (y > sy && slits.includes(x + 1))) c = D;
    else if (x === x0 + 1 || (y > sy && slits.includes(x - 1))) c = Lm;
    else if ((x === x0 + 3 || x === x1 - 3) && y > ry + 4) c = Dm;
    if (gold && (x === x0 + 1 || y === ry + 1)) c = '#f2d478'; else if (gold && (x === x1 - 1 || y === y1)) c = '#c8962e';
    G.set(x, y, c);
  }
  for (let x = x0 + 1; x < x1; x++) { const c = G.get(x, y1 + 1); if (c) G.set(x, y1 + 1, _enM(c, OUT, .28)); }   // its shadow on the floor
}
function _enRoomDoor(G, open, sty) {   // left room's door; its room is to the left, the corridor to the right (v2.4: G.h 32 = 2 tiles tall)
  const DH = G.h;
  if (!open) {   // locked: shoji in a dark frame
    for (let y = 0; y < DH; y++) { G.set(0, y, _EN.dwH); G.set(1, y, _EN.dw); G.set(14, y, _EN.dw); G.set(15, y, _EN.dwD); }
    _enShoji(G, 2, 0, 13, DH - 2, 2); for (let x = 1; x < 15; x++) G.set(x, DH - 1, _EN.dwH); return;
  }
  const fl = sty && sty.floor;
  for (let y = 0; y < DH; y++) for (let x = 0; x < 16; x++) {   // room floor | corridor floor
    let c = x < 8 ? _enDoorFloorPx(fl && fl[0], x, y, 'tat') : _enDoorFloorPx(fl && fl[1], x, y, 'wood');
    if (x === 7) c = _enM(c, OUT, .14);   // a faint threshold line where the wall stood
    G.set(x, y, y === 0 ? _enM(c, OUT, .35) : y === 1 ? _enM(c, OUT, .18) : c);   // the wall end above shades the first rows
  }
  const NH = DH > 16 ? 10 : 8, base = (sty && sty.col) || _EN.ind;
  _enNoren(G, 0, 15, 0, NH, base, sty && sty.gold, [8], NH - 3);
  if (!sty || !sty.col) [[7, 2], [8, 2], [9, 2], [6, 3], [10, 3], [6, 4], [10, 4], [7, 5], [9, 5]].forEach(([x, y]) => G.set(x, y, _EN.wht));   // v1: white ring crest
}
// the two wall-end posts of a doorway in a horizontal wall: the wall cap stops at them, the face ends in a wooden post
function _enWallEnds(G) {
  const W = G.w;
  for (const [a, b] of [[0, 1], [W - 2, W - 1]]) {
    for (const x of [a, b]) {
      G.set(x, 0, '#8a7470'); G.set(x, 1, _EN.topD); G.set(x, 2, _EN.dwH); G.set(x, 3, _EN.dw); G.set(x, 4, _EN.dwD);
      for (let y = 5; y < 16; y++) G.set(x, y, x === a ? (a ? _EN.dw : _EN.dwH) : (a ? _EN.dwD : _EN.dw));
    }
  }
  for (let y = 5; y < 16; y++) { const l = G.get(2, y), r = G.get(W - 3, y); if (l) G.set(2, y, _enM(l, OUT, .22)); if (r) G.set(W - 3, y, _enM(r, OUT, .22)); }   // posts' shadow on the floor
}
// v2: door in a horizontal wall (west wing (8,18) and the v2.4 links). Open (v2.5): a passage - the floor beyond (the
// west hall's parquet + runner, the dining boards, the shrine's sand) runs through, wall-end posts at the sides, a short
// three-tongue noren (colour col, crest emb or a white ring) hanging from a rod
function _enHDoor(G, open, col, emb, gold, beyond) {   // v2.4: G.w = 32 for a door 2 tiles wide; beyond: 'din' | 'sand' | the hall
  const W = G.w, t1 = Math.floor(W / 3), t2 = Math.floor(2 * W / 3);
  if (!open) { _enCap(G, false); G.rect(0, 5, W, 1, _EN.dwD); _enShoji(G, 0, 6, W - 1, 14, 2); for (let x = 0; x < W; x++) G.set(x, 15, _EN.dwH); return; }
  for (let y = 0; y < 16; y++) for (let x = 0; x < W; x++) {
    const c = beyond === 'din' ? _enDoorFloorPx('din', x, y) : beyond === 'sand' ? _enDoorFloorPx('sand', x, y) : _enHallPx(8 * 16 + x, 17 * 16 + y);
    G.set(x, y, y === 15 ? _enM(c, _EN.dwH, .35) : c);   // a faint sill on the last row
  }
  const base = col || _EN.ind;
  _enNoren(G, 1, W - 2, 2, 9, base, gold, [t1, t2], 6);
  _enWallEnds(G);
  const ox = (W - 16) >> 1;
  if (emb) _enEmblem(G, emb, ox + 5, 3, base);
  else [[6, 3], [7, 3], [8, 3], [5, 4], [9, 4], [5, 5], [9, 5], [6, 6], [7, 6], [8, 6]].forEach(([x, y]) => G.set(ox + x, y, _EN.wht));
}
// v2: bamboo wicket gate (shiorido), seen from the front: cedar posts, a capped top rail, a woven dried-bamboo leaf.
// It paints its own paving (slate for 'gate', the gravel walk for 'gateH') lined up with tile (tx, ty).
function _enGate(G, open, tx, ty, horiz, lamp, season) {   // v2.4: G.w = 32 (gateH 2 wide) or G.h = 32 (gate 2 tall): one wide / tall gate
  const W = G.w, H = G.h, nx = W >> 4, ny = H >> 4;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) _enSub(G, i * 16, j * 16, T => {
    if (horiz) _enGardenPath(T, tx + i, ty + j, { u: 'p', d: 'p', l: i ? 'D' : 'f', r: i < nx - 1 ? 'D' : 'f' }, season); else _enSlate(T, tx + i, ty + j, {}, season);   // v2.0.1: the gravel walk between the two gardens
  });
  const post = x0 => {
    for (let y = 0; y < H - 1; y++) { G.set(x0, y, _EN.cedarH); G.set(x0 + 1, y, _EN.cedar); G.set(x0 + 2, y, _EN.cedarD); }
    G.set(x0, 0, _EN.dryH); G.set(x0 + 1, 0, _EN.dry); G.set(x0 + 2, 0, _EN.dryD);
    for (let x = x0 - 1; x <= x0 + 3; x++) G.set(x, H - 1, _enM(G.get(x, H - 1) || '#888888', '#2a2430', .4));   // contact shadow
  };
  if (!open) {   // the leaf: diamond-woven dried bamboo in a thin frame
    for (let y = 4; y < H - 2; y++) for (let x = 3; x < W - 3; x++) {
      const a = (x + y) & 3, b = (x - y + 64) & 3;
      let c = (a === 0 || b === 0) ? _EN.dryD : ((x + y) & 1) ? _EN.dry : _enM(_EN.dry, _EN.dryH, .5);
      if (a === 0 && b === 0) c = _enM(_EN.dryD, OUT, .3);
      if (x === 3 || y === 4) c = _EN.dryH; else if (x === W - 4 || y === H - 3) c = _enM(_EN.dryD, OUT, .2);
      G.set(x, y, c);
    }
    for (let x = 3; x < W - 3; x++) G.set(x, H - 2, _enM(G.get(x, H - 2), '#2a2430', .45));
    G.set(W - 5, H >> 1, _EN.cedarD); G.set(W - 5, (H >> 1) + 1, _EN.cedarD);   // latch
  } else {   // swung back against the right post: only its edge shows, with its shadow on the ground
    for (let y = 4; y < H - 2; y++) { G.set(W - 5, y, _EN.dryH); G.set(W - 4, y, _EN.dryD); }
    for (let y = 5; y < H - 1; y++) G.set(W - 6, y, _enM(G.get(W - 6, y), '#2a2430', .3));
    for (let x = 3; x < W - 5; x++) G.set(x, 4, _enM(G.get(x, 4), '#2a2430', .35));
  }
  post(0); post(W - 3);
  for (let x = 0; x < W; x++) {   // the top rail (kasagi) with a little cap
    G.set(x, 1, x === 0 || x === W - 1 ? _EN.cedarD : _EN.cedarH); G.set(x, 2, _EN.cedar); G.set(x, 3, _EN.cedarD);
  }
  for (let x = 1; x < W - 1; x++) G.set(x, 0, x === 1 || x === W - 2 ? _EN.cedarD : '#6a4428');
  if (season === 3) { for (let x = 1; x < W - 1; x++) G.set(x, 0, x < 4 ? _EN_SN.w : _EN_SN.h); for (let x = 2; x < W - 2; x++) if (_enH(x, ty, 641) < .5) G.set(x, 1, _EN_SN.s); for (const x of [0, 1, W - 3, W - 2, W - 1]) G.set(x, 0, _EN_SN.b); }   // winter: snow along the top rail
  if (lamp) {   // a small star lantern hanging from the rail (the roten gate)
    const ox = (W - 16) >> 1;
    G.set(ox + 9, 4, '#3a2418');
    const ST = ['..X..', 'XXXXX', '.XXX.', 'X...X'];
    ST.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(ox + 7 + i, 5 + j, j === 0 || (j === 1 && i < 3) ? '#fff2a8' : j === 3 ? '#e0a020' : '#ffd23a'); }));
    G.set(ox + 9, 6, '#fffbe0');
  }
}
function _enOnsenDoor(G, open, snowTx) {   // sits in a wall-face row (v2.4: G.w 32 = 2 tiles wide); snowTx != null = winter
  const W = G.w, t1 = Math.floor(W / 3), t2 = Math.floor(2 * W / 3), ox = (W - 16) >> 1;
  if (!open) { _enCap(G, false); G.rect(0, 5, W, 1, _EN.dwD); _enShoji(G, 0, 6, W - 1, 14, 2); for (let x = 0; x < W; x++) G.set(x, 15, _EN.dwH); if (snowTx != null) _enCapSnow(G, snowTx); return; }
  for (let y = 0; y < 16; y++) for (let x = 0; x < W; x++) {   // v2.5: the bath's stone floor runs through the doorway
    const c = (x + (y >> 2) * 5) % 8 === 0 || y % 4 === 0 ? _EN.slD : _EN.sl;
    G.set(x, y, y === 15 ? _enM(c, _EN.dwH, .35) : c);
  }
  // red noren with a white yu (hot water) glyph, the hem cut into three tongues
  _enNoren(G, 1, W - 2, 1, 11, _EN.red, false, [t1, t2], 9);
  const GLY = [
    'X..XXXXX.',
    '.X.X...X.',
    '...XXXXX.',
    'X.XXXXXXX',
    '.X..X...X',
    '...X.X..X',
    '.XX.X.X.X',
    'X..X...X.',
  ];
  GLY.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(ox + 3 + i, 2 + j, _EN.wht); }));
  _enWallEnds(G);
  if (snowTx != null) for (let x = 0; x < W; x++) if (x < 2 || x >= W - 2) { G.set(x, 0, _EN_SN.w); G.set(x, 1, _EN_SN.s); }   // winter: snow on the wall ends' caps
}
// the indigo noren over the main entrance: 48x14, anchor (0,0) at (6*16, 29*16-6); drawn over the cats
function entranceNoren() {
  return art('en:noren', () => _enMake(48, 14, G => {
    for (let x = 0; x < 48; x++) { G.set(x, 0, _EN.dwH); G.set(x, 1, _EN.dwD); }
    G.rect(0, 0, 2, 2, '#3a2418'); G.rect(46, 0, 2, 2, '#3a2418');
    for (let y = 2; y < 14; y++) for (let x = 1; x < 47; x++) {
      if ((x === 16 || x === 31) && y > 3) continue;   // slits between the three panels
      if (y === 13 && (x === 1 || x === 15 || x === 17 || x === 30 || x === 32 || x === 46)) continue;   // rounded hem corners
      let c = _EN.ind;
      if (y === 2) c = '#22365e'; else if (y === 3) c = '#46629a';
      else if (x === 1 || x === 17 || x === 32) c = '#3e5a90';
      else if (x === 15 || x === 30 || x === 46 || y === 13) c = '#243a62';
      else if (y === 12) c = '#f4f0e6';
      G.set(x, y, c);
    }
    for (const cx of [8, 39]) [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-2, 1], [2, 1], [-1, 2], [0, 2], [1, 2]]
      .forEach(([dx, dy]) => G.set(cx + dx, 7 + dy, '#d8dcea'));   // a white ring crest (maru) on each side panel
    const YU = [   // hiragana yu
      '....X.....',
      '.X..X.....',
      '.X.XXXXX..',
      '.XX.X...X.',
      '.X..X...X.',
      '.X..X...X.',
      '.X..X..X..',
      '...XX.X...',
      '..X.......',
    ];
    YU.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(19 + i, 3 + j, _EN.wht); }));
  }));
}
function lockedShade() {
  return art('en:locked', () => { const c = mk(16, 16), x = c.getContext('2d'); x.fillStyle = 'rgba(22,18,40,0.52)'; x.fillRect(0, 0, 16, 16); return c; });
}

// ============================================================ v2 additions (SPEC_v2 12.2)
// koi pond water, 16x16 at the tile's top-left, 4 slow frames (the core steps them every 0.4 s); seamless; the rim
// comes from the neighbours tileArt('o') saw (or the SPEC_v2 pond rectangle before that)
// v2.1 season (optional, 0..3): spring petals afloat, summer water lilies in flower, autumn yellow pads + floating
// leaves, winter a skin of ice along the rim and snow on its stones (the middle stays open for the koi)
function pondArt(frame, tx, ty, season) {
  frame = (((frame | 0) % 4) + 4) % 4; season = (season | 0) & 3;
  const nb = _enPondNb(tx, ty), k = 'en:pond:' + frame + ':' + tx + ',' + ty + ':' + (nb.u === 'o' ? 1 : 0) + (nb.d === 'o' ? 1 : 0) + (nb.l === 'o' ? 1 : 0) + (nb.r === 'o' ? 1 : 0) + ':' + season;
  return art(k, () => _enMake(16, 16, G => _enPond(G, frame, tx, ty, nb, season)));
}
// the roten waterfall: 32x40, its (0,0) goes on world (31*16, 0); a rock lip over the fence, a falling sheet whose
// streaks slide down 4px a frame (period 16 = seamless over 4 frames), wet rocks either side, a foam pool below
// v2.1 season (optional): winter puts snow on the boulders' tops and a few icicles along the lip
function waterfallArt(frame, season) {
  frame = (((frame | 0) % 4) + 4) % 4; const snow = ((season | 0) & 3) === 3;
  return art('en:fall:' + frame + (snow ? ':w' : ''), () => _enMake(32, 40, G => {
    const RAMP = ['#3a3a40', '#4e4e54', '#66666a', '#807e7a', '#9a9890'];
    const rocks = [[4, 9, 7.5, 9], [27, 9, 7.5, 9], [16, 4, 10, 5.5], [2, 24, 4.5, 8], [30, 24, 4.5, 8]];
    for (let y = 0; y < 40; y++) for (let x = 0; x < 32; x++) {   // boulders: lit top-left, wet (darker) low down
      let best = -1, bd = 0, bnx = 0, bny = 0;
      rocks.forEach((r, i) => {
        const nx = (x + .5 - r[0]) / r[2], ny = (y + .5 - r[1]) / r[3], d = nx * nx + ny * ny;
        if (d <= 1 && (best < 0 || r[1] + r[3] > rocks[best][1] + rocks[best][3])) { best = i; bd = d; bnx = nx; bny = ny; }
      });
      if (best < 0) continue;
      const v = -(bnx * .6 + bny * .8) * .9 + (1 - bd) * .5 + (_enBay(x, y) - .5) * .3;
      let c = RAMP[clamp(Math.round(1.8 + v * 2), 0, 4)];
      if (bd > .82) c = '#2c2c34';
      if (y > 14) c = _enM(c, '#1e4650', clamp((y - 14) / 16, 0, .5));   // wet with spray
      if (snow && best < 3 && bd <= .82 && bny + _enVN(x / 3, y / 2, 245) * .4 - .2 < -.35) c = v > .6 ? _EN_SN.w : v > .2 ? _EN_SN.h : v > -.2 ? _EN_SN.b : _EN_SN.s;
      else if (!snow && bny < -.3 && best < 3 && _enVN(x / 3, y / 3, 241) > .55) c = bny < -.6 ? '#7a9a52' : '#5e7e44';   // moss on the tops
      G.set(x, y, c);
    }
    if (snow) for (const [ix, iy, n] of [[7, 15, 3], [9, 16, 2], [24, 15, 3], [22, 16, 2], [12, 8, 2], [20, 8, 2]]) for (let k = 0; k < n; k++) if (G.get(ix, iy + k)) G.set(ix, iy + k, k === 0 ? _EN_SN.iceH : _EN_SN.ice);   // icicles
    // the falling sheet
    for (let y = 5; y < 36; y++) {
      const w0 = 10 - Math.floor((y - 5) * .07), w1 = 21 + Math.floor((y - 5) * .07);
      for (let x = w0; x <= w1; x++) {
        const col = x - w0, edge = x === w0 || x === w1, ph = ((y - frame * 4 + Math.floor(_enH(x, 0, 242) * 16)) % 16 + 16) % 16;
        let c = ph < 2 ? '#ffffff' : ph < 5 ? '#e4f2f0' : ph < 9 ? '#c4dede' : '#a8ccd0';   // v2.0.1: falls into the milky bath
        if (col === 1 || x === w1 - 1) c = _enM(c, '#7aa4b0', .35);
        if (edge) c = x === w0 ? '#9cc4cc' : '#6a96a6';
        if (y < 8) c = y === 5 ? '#9cc4cc' : y === 6 ? '#eef6f4' : '#ffffff';   // the lip where the water tips over
        G.set(x, y, c);
      }
    }
    // foam pool where it lands: soft ellipse, ragged rim that turns with the frame, spray specks rising and fading
    for (let y = 28; y < 40; y++) for (let x = 0; x < 32; x++) {
      const nx = (x + .5 - 16) / 14, ny = (y + .5 - 35) / 4.6, d = nx * nx + ny * ny;
      if (d > 1.15) continue;
      let c = d < .35 ? '#ffffff' : d < .7 ? '#f4f9f8' : '#dbe8e6';
      if (d > .85) { if (((x + y + frame) & 3) > 1) continue; c = '#c6d8d8'; }   // the ragged rim creeps round, no flicker
      if (d > .5 && d < .85 && ((x + frame) % 5 === 0)) c = '#dbe8e6';
      G.set(x, y, c);
    }
    for (let i = 0; i < 6; i++) {
      const sx = 6 + Math.floor(_enH(i, 0, 244) * 20), st = (frame + i) % 4, sy = 31 - st * 2;
      G.set(sx, sy, st < 2 ? '#ffffff' : '#dbe8e6'); if (st === 0) G.set(sx + 1, sy, '#f4f9f8');
    }
  }));
}
// small things fixed on a wall-face tile (16x16, drawn over it; transparent elsewhere)
function wallDecorArt(kind) {
  return art('en:wd:' + kind, () => _enMake(16, 16, G => {
    const SH = '#00000030';
    if (kind === 'giftshelf') {   // open display shelf, two little red stands; gifts (8x8) centred on (4,8) and (12,8)
      for (let x = 0; x < 16; x++) { G.set(x, 11, _EN.dinH); G.set(x, 12, _EN.din); G.set(x, 13, _EN.dinS); G.set(x, 14, SH); }
      for (const bx of [2, 12]) { G.set(bx, 14, _EN.dinD); G.set(bx + 1, 14, _EN.dinS); G.set(bx, 15, SH); G.set(bx + 1, 15, SH); }
      for (const cx of [4, 12]) { for (let x = cx - 3; x <= cx + 2; x++) G.set(x, 10, x === cx - 3 ? '#cc5a46' : x === cx + 2 ? '#7a2626' : '#b8443a'); }
    } else if (kind === 'photo') {   // picture frame hung from a nail; the 8x8 window (x 4..11, y 5..12) is for the core
      G.set(7, 1, '#4a4038'); G.set(8, 1, '#4a4038'); G.set(6, 2, '#6a5a48'); G.set(9, 2, '#6a5a48'); G.set(5, 3, '#6a5a48'); G.set(10, 3, '#6a5a48');
      for (let y = 4; y <= 13; y++) for (let x = 3; x <= 12; x++) {
        const edge = x === 3 || x === 12 || y === 4 || y === 13;
        if (edge) G.set(x, y, x === 3 || y === 4 ? _EN.dinH : _EN.dinS);
        else G.set(x, y, y < 8 ? '#efe8da' : '#e6ddcc');
      }
      for (let y = 5; y <= 14; y++) G.set(13, y, SH);
      for (let x = 4; x <= 13; x++) G.set(x, 14, SH);
    } else if (kind === 'menu') {   // a rail of hanging wooden menu tags (no writing: abstract brush marks)
      for (let x = 0; x < 16; x++) { G.set(x, 5, _EN.dwD); G.set(x, 6, SH); }
      [[1, 0], [6, 1], [11, 2]].forEach(([x0, v]) => {
        for (let y = 6; y <= 13; y++) for (let x = x0; x < x0 + 4; x++) {
          const edge = x === x0 || x === x0 + 3 || y === 13;
          G.set(x, y, edge ? (x === x0 ? '#d8b880' : '#9a7448') : y === 6 ? '#f0dcb0' : '#e6cc98');
        }
        for (let y = 8; y <= 11; y++) if ((y + v) % 3 !== 0) G.set(x0 + 1 + ((y & 1) ? 0 : 1), y, '#3a2a20');
        if (v === 1) { G.set(x0 + 1, 7, '#c8463a'); G.set(x0 + 2, 7, '#c8463a'); }   // a red seal on the middle tag
        for (let y = 7; y <= 14; y++) G.set(x0 + 4, y, SH);
      });
    } else if (kind === 'lantern') {   // bracket lamp on a post: an iron arm, a small paper box lamp
      for (let y = 2; y <= 7; y++) { G.set(1, y, '#3a2418'); G.set(2, y, '#5a3a24'); }
      for (let x = 2; x <= 7; x++) G.set(x, 3, '#2a2420');
      G.set(7, 4, '#2a2420');
      for (let x = 4; x <= 11; x++) { G.set(x, 5, '#3a2418'); G.set(x, 13, '#3a2418'); }
      for (let x = 5; x <= 10; x++) G.set(x, 4, '#5a3a24');
      for (let y = 6; y <= 12; y++) for (let x = 4; x <= 11; x++) {
        const fr = x === 4 || x === 11 || y === 9;
        G.set(x, y, fr ? '#5a3a24' : y < 9 ? (x < 7 ? '#fff4cc' : '#fbe6a8') : (x < 7 ? '#fbe6a8' : '#f0d088'));
      }
      for (let y = 7; y <= 14; y++) G.set(12, y, SH);
    } else if (kind === 'bell') {   // a small gold call bell hanging above a room door
      G.set(7, 3, '#5a3a24'); G.set(8, 3, '#5a3a24'); G.set(7, 4, '#6a4a1a'); G.set(8, 4, '#6a4a1a');
      const B = ['..XXXX..', '.XHHXXX.', '.XHXXXX.', 'XXHXXXXD', 'XXXXXXDD', 'DDDDDDDD'];
      B.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') G.set(4 + i, 5 + j, ch === 'H' ? '#fff2a8' : ch === 'D' ? '#c08a1c' : '#f0c040'); }));
      for (let x = 4; x <= 11; x++) G.set(x, 11, x === 4 ? '#8a5a12' : '#6a4a1a');
      G.set(7, 12, '#8a5a12'); G.set(8, 12, '#6a4a1a');
    } else if (kind === 'trophy') {   // v2.1 (16.3) a lacquered wall shelf on two brackets, a gold name plate on its edge;
      // the core stands the two newest trophies on it: bottoms on y 12, centres x 5 (older, drawn first) and x 11
      for (let x = 0; x < 16; x++) { G.set(x, 12, x < 3 ? '#8a4a3a' : '#6a3428'); G.set(x, 13, '#3a1c18'); G.set(x, 14, SH); }
      for (const bx of [2, 13]) { G.set(bx, 14, '#2a1410'); G.set(bx, 15, '#2a1410'); G.set(bx + 1, 15, SH); }
      for (let x = 6; x <= 9; x++) G.set(x, 13, x === 6 ? '#fff0a0' : '#e0b448');
      for (let x = 1; x <= 14; x++) if (G.get(x, 11) == null) G.set(x, 11, '#00000018');   // a faint shadow on the wall above the shelf
    } else if (kind === 'cover') {   // v2.1 (16.4) a thin black frame hung from the beam; the core draws coverArt (10x12)
      // into its window x 3..12, y 2..13 (left at blank paper)
      G.set(7, 0, '#5a4a40'); G.set(8, 0, '#5a4a40');
      for (let y = 1; y <= 14; y++) for (let x = 2; x <= 13; x++) {
        const edge = x === 2 || x === 13 || y === 1 || y === 14;
        G.set(x, y, edge ? (x === 2 || y === 1 ? '#4a4048' : '#1e1a20') : y < 6 ? '#f8f4ea' : '#efe9dc');
      }
      for (let y = 2; y <= 15; y++) G.set(14, y, SH);
      for (let x = 3; x <= 14; x++) G.set(x, 15, SH);
    } else if (kind === 'family') {   // v2.1 (16.5) the family photo: a gilt frame on a red cord; the window x 1..14,
      // y 4..13 is pre-painted with the inn's door (sky, eave, dark wood, the indigo noren, stone) - the core draws the
      // cats standing on y 13
      G.set(7, 0, '#c8302a'); G.set(8, 0, '#c8302a'); G.set(6, 1, '#c8302a'); G.set(9, 1, '#a8281e'); G.set(5, 2, '#c8302a'); G.set(10, 2, '#a8281e');
      for (let y = 3; y <= 14; y++) for (let x = 0; x <= 15; x++) {
        const edge = x === 0 || x === 15 || y === 3 || y === 14;
        if (edge) { G.set(x, y, (x === 0 || y === 3) ? (((x + y) & 1) ? _EN_GLD[4] : _EN_GLD[5]) : ((x + y) & 1) ? _EN_GLD[1] : _EN_GLD[2]); continue; }
        let c = y < 6 ? (y === 4 ? '#bcdcf0' : '#d8ecf6') : y === 6 ? '#3c4252' : y === 7 ? '#5a6478' : y < 12 ? ((x & 1) ? '#5a3a28' : '#4a2e20') : y === 12 ? '#c4beb0' : '#aaa496';
        if (y >= 7 && y <= 10 && x >= 5 && x <= 10) c = y === 7 ? '#46629a' : (x === 7 || x === 8) && y > 8 ? '#2a1c18' : '#2f4a7a';   // the noren
        if (y === 8 && (x === 7 || x === 8)) c = '#f4f0e6';
        if ((x === 2 || x === 13) && y >= 8 && y <= 10) c = y === 8 ? '#ffe0a0' : '#f0b860';   // two lanterns by the door
        G.set(x, y, c);
      }
      G.set(0, 15, SH); for (let x = 1; x <= 15; x++) G.set(x, 15, SH);
    }
  }));
}
// dense bamboo screening the shrine plot in v2.0: 16x24, anchor (0,24) = tile bottom-left, so it rises 8px above its
// tile. Everything is a function of world pixels, so the overlaps line up; only the topmost row shows the ragged tops.
// v2.1 season (optional): winter = snow caught on the canopy and the leaf sprays
function bambooGroveArt(tx, ty, season) {
  const snow = ((season | 0) & 3) === 3;
  return art('en:grove:' + tx + ',' + ty + (snow ? ':w' : ''), () => _enMake(16, 24, G => {
    const CS = 5;   // one culm slot every 5 px
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, wy = ty * 16 - 8 + y;
      if (y < 8) {   // ragged canopy at the top; now and then a bare culm tip pokes out of it
        const top = 2 + Math.floor(_enVN(wx / 4, ty * 5, 251) * 6);
        if (y < top) {
          const ci = Math.floor(wx / 5), cx = ci * 5 + Math.floor(_enH(ci, 0, 253) * 3);
          if (wx === cx && _enH(ci, ty, 250) < .3 && y >= top - 3) G.set(x, y, y === top - 3 ? '#c8ec90' : '#8cc458');
          continue;
        }
      }
      let c = '#16301e';
      const lv = _enVN(wx / 4.5, wy / 3.5, 252);
      if (lv > .55) c = lv > .7 ? '#2f5a32' : '#22442a';
      for (const ci of [Math.floor(wx / CS), Math.floor(wx / CS) - 1]) {   // culms (two depths)
        const cx = ci * CS + Math.floor(_enH(ci, 0, 253) * 3), w = _enH(ci, 1, 254) < .45 ? 3 : 2, back = _enH(ci, 2, 255) < .4;
        if (wx < cx || wx >= cx + w) continue;
        const P = 11 + Math.floor(_enH(ci, 3, 256) * 5), O = Math.floor(_enH(ci, 4, 257) * P), node = (wy + O) % P;
        const i = wx - cx;
        c = back ? (i === 0 ? '#4e7a3a' : '#3a6230') : (i === 0 ? '#a8d870' : i === w - 1 ? '#4e8a34' : '#78b048');
        if (node === 0) c = back ? '#28482a' : '#3e6a2c'; else if (node === 1 && !back) c = i === 0 ? '#c8ec90' : '#8cc458';
        break;
      }
      const fl = _enVN(wx / 3, wy / 2.5, 258);   // leaf sprays in front of the culms
      if (fl > .66) c = fl > .78 ? (_enBay(x, y) < .5 ? '#7cb84a' : '#5a9a46') : '#3e7a3a';
      if (y < 10 && fl > .5 && _enVN(wx / 2, wy / 2, 259) > .5) c = '#5a9a46';
      G.set(x, y, c);
    }
    for (let i = 0; i < 3; i++) {   // a few lit dagger leaves
      const lx = Math.floor(_enH(tx, ty, 260 + i) * 13), ly = 4 + Math.floor(_enH(ty, tx, 263 + i) * 18), dir = _enH(tx + i, ty, 266) < .5 ? 1 : -1;
      if (!G.get(lx, ly)) continue;
      G.set(lx, ly, '#8cc860'); G.set(lx + dir, ly + 1, '#6aa84a'); G.set(lx + 2 * dir, ly + 1, '#4e8a3e');
    }
    if (snow) for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {   // snow on the canopy's top and on the lit sprays
      const c = G.get(x, y); if (!c) continue;
      const wx = tx * 16 + x, wy = ty * 16 - 8 + y, s = _enVN(wx / 3, wy / 2.5, 631), top = !G.get(x, y - 1) || y === 0;
      if ((top && y < 12) || (s > .64 && (c === '#7cb84a' || c === '#5a9a46' || c === '#3e7a3a'))) G.set(x, y, top ? _EN_SN.w : s > .74 ? _EN_SN.h : _EN_SN.s);
      else if (top && y < 13) G.set(x, y, _EN_SN.b);
    }
  }));
}
// little wooden sign at a locked area's door: a star and a pixel digit (2..5); lit = false is grey
function areaSignArt(n, lit) {
  n = n | 0; lit = !!lit;
  return art('en:sign:' + n + ':' + (lit ? 1 : 0), () => _enMake(14, 18, G => {
    const P = lit
      ? { roof: '#5a3420', roofH: '#7a4a2a', wood: '#d0a066', woodH: '#e6be86', woodD: '#9a6a3c', rim: '#5a3420', star: '#ffd23a', starH: '#fff2a8', starD: '#c8901a', dig: '#3a2418', post: '#7a4a2a', postH: '#9a6038' }
      : { roof: '#4a4648', roofH: '#5e5a5c', wood: '#a8a49e', woodH: '#bcb8b2', woodD: '#86827e', rim: '#4a4648', star: '#d0ccc4', starH: '#e2ded8', starD: '#9a968e', dig: '#4a4648', post: '#6e6a68', postH: '#86827e' };
    for (let y = 11; y < 17; y++) { G.set(6, y, P.postH); G.set(7, y, P.post); }
    for (let x = 4; x <= 9; x++) G.set(x, 17, '#1b1b2f44');   // contact shadow
    for (let y = 1; y <= 10; y++) for (let x = 0; x <= 13; x++) {
      const edge = x === 0 || x === 13 || y === 10;
      G.set(x, y, edge ? P.rim : y === 1 || x === 1 ? P.woodH : x === 12 || y === 9 ? P.woodD : P.wood);
    }
    for (let x = 1; x <= 12; x++) G.set(x, 0, x === 1 || x === 12 ? P.roof : P.roofH);
    for (let x = 0; x <= 13; x++) G.set(x, 1, P.roof);
    const ST = ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'];
    ST.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(2 + i, 3 + j, j < 2 ? P.starH : j === 4 ? P.starD : P.star); }));
    const DG = { 0: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], 1: ['.X.', 'XX.', '.X.', '.X.', 'XXX'], 2: ['XXX', '..X', 'XXX', 'X..', 'XXX'], 3: ['XXX', '..X', 'XXX', '..X', 'XXX'],
      4: ['X.X', 'X.X', 'XXX', '..X', '..X'], 5: ['XXX', 'X..', 'XXX', '..X', 'XXX'], 6: ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], 7: ['XXX', '..X', '.X.', '.X.', '.X.'],
      8: ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'], 9: ['XXX', 'X.X', 'XXX', '..X', 'XXX'] }[clamp(n, 0, 9)];
    DG.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(8 + i, 3 + j, P.dig); }));
  }));
}
// wooden stake + rope, 16x16 at the tile's top-left; 'v' runs north-south (col 10 while the shop is shut), 'h' east-west
function ropeArt(dir) {
  const v = dir !== 'h';
  return art('en:rope:' + (v ? 'v' : 'h'), () => _enMake(16, 16, G => {
    const RP = ['#e0c890', '#b89858'];
    for (let x = 5; x <= 10; x++) G.set(x, 14, '#1b1b2f40');   // stake shadow
    for (let y = 4; y <= 13; y++) { G.set(6, y, _EN.cedarH); G.set(7, y, _EN.cedar); G.set(8, y, _EN.cedar); G.set(9, y, _EN.cedarD); }
    G.set(6, 3, _EN.dryH); G.set(7, 3, _EN.dry); G.set(8, 3, _EN.dry); G.set(9, 3, _EN.dryD);
    if (v) {
      for (let y = 0; y < 16; y++) G.set(7 + ((y >> 1) & 1), y, RP[(y >> 1) & 1]);   // twisted rope, tied over the stake top
      G.set(6, 4, RP[0]); G.set(9, 4, RP[1]);
      [[9, 8], [10, 9], [9, 10], [10, 11]].forEach(([x, y]) => G.set(x, y, '#f8f4ea'));   // a paper streamer on the rope
      G.set(11, 10, '#d8d0c0');
    } else {
      for (let x = 0; x < 16; x++) { const d = Math.abs(x - 7.5) / 8, y = 4 + Math.round(2.2 * d * d); G.set(x, y, RP[(x >> 1) & 1]); G.set(x, y + 1, '#1b1b2f30'); }
    }
  }));
}
// lamp glow for the night pass: 2r x 2r, anchor (r,r); four alpha steps .5/.3/.18/.08 with 4x4-Bayer dithered borders
function glowArt(r, col) {
  r = Math.max(2, r | 0); col = col || _EN.warm;
  return art('en:glow:' + r + ':' + col, () => {
    const hx = col.length === 4 ? '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3] : col, n = parseInt(hx.slice(1, 7), 16) || 0xffd27a;
    const c = mk(2 * r, 2 * r), x = c.getContext('2d'), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    const A = [.5, .3, .18, .08];
    for (let py = 0; py < 2 * r; py++) for (let px = 0; px < 2 * r; px++) {
      const d = Math.hypot(px + .5 - r, py + .5 - r) / r;
      if (d >= 1) continue;
      const i = clamp(Math.floor(d * 4 + (_enBay(px, py) - .5) * .9), 0, 4);
      if (i > 3) continue;
      x.fillStyle = 'rgba(' + rgb + ',' + A[i] + ')'; x.fillRect(px, py, 1, 1);
    }
    return c;
  });
}
// v2.0 festival plaza (shut, not darkened): weeds in the paving joints and a few fallen leaves; transparent overlay.
// v2.0.1: no longer drawn (the plaza became the lower garden, A3); kept for the art contract (sys_art)
function plazaDecor(tx, ty) {
  return art('en:plaza:' + tx + ',' + ty, () => _enMake(16, 16, G => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {   // weeds in the same joints _enStoneQ draws
      const wx = tx * 16 + x, wy = ty * 16 + y, q = _enQCell(wx, wy);
      if (!(q.py === 0 || q.jx === 0) || _enH(wx >> 1, wy >> 1, 271) > .15) continue;
      G.set(x, y, '#5a8a3e');
      if (_enH(wx, wy, 272) < .5) { G.set(x, y - 1, '#7aaa52'); if (_enH(wx, wy, 273) < .4) G.set(x - 1, y - 2, '#8cc060'); }
    }
    const LV = [['#c8904a', '#9a6a36'], ['#b87a48', '#86542e'], ['#c8a050', '#987428']];
    if (_enH(tx, ty, 274) < .38) {   // now and then a fallen leaf
      const lx = 2 + Math.floor(_enH(tx, ty, 275) * 11), ly = 2 + Math.floor(_enH(ty, tx, 277) * 11), p = LV[Math.floor(_enH(tx, ty, 279) * 3)];
      G.set(lx, ly, p[0]); G.set(lx + 1, ly, p[0]); G.set(lx + 1, ly + 1, p[1]); G.set(lx + 2, ly + 1, p[1]); G.set(lx + 1, ly + 2, '#1b1b2f30');
    }
    if (_enH(tx, ty, 281) < .3) { const px = 3 + Math.floor(_enH(tx, ty, 282) * 10), py = 3 + Math.floor(_enH(ty, tx, 283) * 10); G.set(px, py, '#8a8478'); G.set(px + 1, py, '#a8a294'); G.set(px, py + 1, '#1b1b2f30'); }
  }));
}

// ============================================================ v2.1 additions (SPEC_v2 16.14, scenery)
// treeArt(kind, season, size)   sakura 32x44 / maple 28x36 / pine 32x40 (size 1 / 2: sakura 26x36 / 20x28, maple
//                               24x30 / 18x24); anchor (w/2, h) = bottom-centre of the footprint tile. season 0..3;
//                               omitted = the v2.0 look (sakura in bloom, maple red) for the cover / title.
//                               (Moved here from the objects block: delete the old treeArt in objects-v2.js on merge.)
function treeArt(kind, season, size) { return _enTree(kind, season, size); }

// seasonWarm(season, budget): paints up to `budget` (default 6) outdoor tiles of that season into the ART cache ahead
// of time; returns true once the whole map is ready. A full outdoor repaint costs ~0.5-0.8 s (winter the most), so the
// core calls this every frame during the last in-game hours before a season turns; rebuildWorld() is then instant.
// Reads MAP / TILE_LOOK / ch from data/map.js at call time.
let _EN_WARM = null;
function seasonWarm(season, budget) {
  season = (season | 0) & 3; budget = budget > 0 ? budget : 6;
  if (!_EN_WARM || _EN_WARM.s !== season) _EN_WARM = { s: season, i: 0 };
  while (budget > 0 && _EN_WARM.i < MW * MH) {
    const i = _EN_WARM.i++, tx = i % MW, ty = (i / MW) | 0, c = MAP[ty][tx];
    if (c === 'D' || (c !== '#' && !_EN_OUTCH.has(c))) continue;
    tileArt(c, tx, ty, { u: ch(tx, ty - 1), d: ch(tx, ty + 1), l: ch(tx - 1, ty), r: ch(tx + 1, ty) }, season, TILE_LOOK[i]);
    budget--;
  }
  return _EN_WARM.i >= MW * MH;
}

// snowCapArt(c): any prop canvas with snow lying on its upward-facing surfaces (winter roofs, lanterns, rocks, benches);
// same size and anchor as c, cached per canvas. Pixels with alpha < 50% (ground shadows) are left alone.
const _EN_SNOWCAP = new WeakMap();
function snowCapArt(c) {
  if (!c || !c.width) return c;
  let o = _EN_SNOWCAP.get(c); if (o) return o;
  const w = c.width, h = c.height, D = c.getContext('2d').getImageData(0, 0, w, h).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && D[(y * w + x) * 4 + 3] > 127;
  const G = new Grid(w, h);
  for (let y = 0; y < h - 2; y++) for (let x = 0; x < w; x++) {
    if (!on(x, y) || on(x, y - 1)) continue;   // the top pixel of a surface
    const flat = on(x - 1, y) && on(x + 1, y) && !on(x - 1, y - 1) && !on(x + 1, y - 1);
    G.set(x, y, _EN_SN.s);
    if (on(x, y + 1)) G.set(x, y + 1, x < w * .45 ? _EN_SN.w : _EN_SN.h);
    if (flat && on(x, y + 2) && _enHt(x, y, 651) < .6) G.set(x, y + 2, _EN_SN.b);
  }
  o = mk(w, h); const x2 = o.getContext('2d'); x2.drawImage(c, 0, 0); x2.drawImage(G.canvas(), 0, 0);
  _EN_SNOWCAP.set(c, o); return o;
}

// ------------------------------------------------------------ the cat shrine (SPEC_v2 16.8): NW plot, cols 1-9, rows 1-5
// shared stone / lacquer / gold tones (dark -> light)
const _EN_GRA = ['#5e5e5a', '#7a7a76', '#9a9a92', '#b8b6ae', '#d4d2c8'];
const _EN_VER = ['#6e1c16', '#9a2a1c', '#c83e28', '#e25a38', '#f6865c'];
const _EN_GLD = ['#6a4410', '#9a6618', '#cc8e22', '#eebc3a', '#f8dc74', '#fff4c0'];
const _EN_ROOF = ['#241c20', '#342a2c', '#46393a', '#5c4c4a', '#76625c'];
// hokoraArt(lv, season): 48x44, anchor (0,44) = the bottom-left of the hall's 3x1 footprint (4..6, 1):
// drawObj(hokoraArt(lv, s), 4, 2 * TILE, 3). Its top 12 rows rise above the map's edge (never on screen), so every
// level's change sits in rows 12..43. Levels add up: 1 a small wooden hokora on a stone pedestal; 2 a straw rope with
// paper streamers; 3 a granite platform with a step; 4 an offering box; 5 the vermilion main hall replaces the hokora
// (dark roof, white walls, big rope); 6 two trees behind it (sakura, by season); 7 rows of little red torii either side
// (senbon torii); 8 a gold bell with its red-white rope; 9 a gold roof; 10 a giant golden cat asleep on the roof
// (nemuri-neko) - the core adds a glow at night (glowArt r28 at world (92, 8)). Winter: snow on roofs and stone tops.
function hokoraArt(lv, season) {
  lv = clamp(lv | 0, 1, 10); season = (season | 0) & 3;
  return art('en:hokora:' + lv + ':' + season, () => {
    const G = new Grid(48, 44), snow = season === 3, put = (x, y, c) => G.set(x, y, c);
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, typeof c === 'function' ? c(x, y) : c); };
    if (lv >= 6) _enShrineTrees(G, season);
    if (lv >= 10) _enNemuriNeko(G, 'back');
    // ---- ground: small base slabs (1-2) or the granite platform (3+)
    if (lv >= 3) {
      rect(6, 40, 41, 43, (x, y) => { const j = (x - 6) % 10 === 0, t = _enHt(Math.floor((x - 6) / 10), 0, 661); return y === 40 ? (j ? _EN_GRA[2] : _EN_GRA[4]) : y === 41 ? (j ? _EN_GRA[1] : t < .5 ? _EN_GRA[3] : _EN_GRA[2]) : j ? _EN_GRA[0] : y === 43 ? _EN_GRA[0] : (t < .5 ? _EN_GRA[2] : _EN_GRA[1]); });
      rect(18, 42, 29, 43, (x, y) => y === 42 ? _EN_GRA[4] : x === 18 ? _EN_GRA[3] : _EN_GRA[2]);   // the step
      if (snow) { rect(6, 40, 41, 40, (x) => _enHt(x, 40, 662) < .8 ? _EN_SN.w : _EN_SN.h); rect(18, 42, 29, 42, _EN_SN.w); for (let x = 7; x < 41; x++) if (_enHt(x, 41, 663) < .4) put(x, 41, _EN_SN.b); }
    } else {
      rect(14, 40, 33, 43, (x, y) => x === 23 || x === 24 ? _EN_GRA[1] : y === 40 ? _EN_GRA[4] : y === 43 ? _EN_GRA[1] : _EN_GRA[3]);
      if (snow) rect(14, 40, 33, 40, _EN_SN.w);
    }
    if (lv < 5) _enSmallHokora(G, lv, snow, rect);
    else _enMainHall(G, lv, snow, rect);
    if (lv >= 7) { _enSenbon(G, 0, snow); _enSenbon(G, 1, snow); }
    if (lv >= 10) _enNemuriNeko(G, 'front', snow);
    G.selOutline();
    const c = G.canvas(), x = c.getContext('2d');   // a soft contact shadow under the platform's front edge
    x.fillStyle = 'rgba(27,27,47,.22)'; x.fillRect(lv >= 3 ? 7 : 15, 43, lv >= 3 ? 35 : 19, 1);
    return c;
  });
}
function _enSmallHokora(G, lv, snow, rect) {   // lv 1-4: a small wooden shrine on a stone pedestal
  const W = ['#4e3220', '#6e4a2e', '#946a40', '#b88a58', '#d4aa76'];
  rect(16, 35, 31, 35, (x) => x < 20 ? _EN_GRA[4] : _EN_GRA[3]);                                   // pedestal top slab
  rect(18, 36, 29, 39, (x, y) => x === 18 ? _EN_GRA[3] : x === 29 ? _EN_GRA[1] : y === 39 ? _EN_GRA[1] : _EN_GRA[2]);
  rect(19, 27, 28, 34, (x, y) => x === 19 ? W[3] : x === 28 ? W[1] : y === 34 ? W[1] : W[2]);       // the body
  rect(20, 28, 27, 34, (x, y) => (x === 23 || x === 24) ? W[0] : (y - 28) % 3 === 0 || x === 20 || x === 27 ? '#5a3a24' : '#3a2618');   // two lattice doors
  _enPut2(G, [[22, 31, W[4]], [25, 31, W[4]]]);                                                        // door pulls
  // the gabled roof (cypress bark), lit on the left; crossed chigi at the ridge ends, two katsuogi logs
  const rows = [[21, 26, 20], [19, 28, 21], [18, 29, 22], [17, 30, 23], [16, 31, 24], [16, 31, 25], [15, 32, 26]];
  for (const [x0, x1, y] of rows) for (let x = x0; x <= x1; x++) G.set(x, y, y === 26 ? (x < 24 ? _EN_ROOF[4] : _EN_ROOF[3]) : x < (x0 + x1) / 2 - 1 ? (y & 1 ? _EN_ROOF[3] : _EN_ROOF[4]) : (y & 1 ? _EN_ROOF[1] : _EN_ROOF[2]));
  rect(16, 27, 31, 27, _EN_ROOF[0]);                                                                  // eave shadow
  _enPut2(G, [[20, 18, W[3]], [21, 19, W[2]], [27, 18, W[2]], [26, 19, W[1]], [23, 19, W[3]], [24, 19, W[2]]]);
  if (snow) for (const [x0, x1, y] of rows.slice(0, 5)) for (let x = x0; x <= x1; x++) if (y < 22 || x === x0 || x === x1 || _enHt(x, y, 664) < .7 - (y - 22) * .2) G.set(x, y, x < 23 ? _EN_SN.w : _EN_SN.b);
  if (lv >= 2) {   // straw rope + two zigzag paper streamers (shide)
    for (let x = 18; x <= 29; x++) G.set(x, 28, (x & 1) ? '#e2ca84' : '#b8964e');
    for (const [sx, d] of [[19, 1], [28, -1]]) _enPut2(G, [[sx, 29, '#ffffff'], [sx + d, 30, '#ffffff'], [sx, 31, '#e8ecf2'], [sx + d, 32, '#d8dce6']]);
  }
  if (lv >= 4) {   // offering box (saisen-bako) in front: slatted top, dark front, a lighter frame
    rect(20, 36, 27, 39, (x, y) => y === 36 ? ((x & 1) ? W[4] : W[1]) : y === 37 ? W[3] : x === 20 ? W[2] : x === 27 ? W[0] : y === 39 ? W[0] : W[1]);
    if (snow) rect(20, 36, 27, 36, _EN_SN.w);
  }
}
function _enPut2(G, list) { for (const [x, y, c] of list) G.set(x, y, c); }
function _enMainHall(G, lv, snow, rect) {   // lv 5+: the vermilion main hall (honden)
  const V = _EN_VER, R0 = lv >= 9 ? _EN_GLD : _EN_ROOF, gold = lv >= 9;
  // veranda boards + the body: vermilion pillars, white walls, a red tie beam, dark lower panels, lattice doors
  rect(8, 39, 39, 39, (x) => x < 12 ? '#b07a4a' : x & 1 ? '#9a6a3e' : '#8a5c34');
  rect(9, 30, 38, 38, (x, y) => y >= 36 ? (y === 36 ? '#6a4630' : '#3e2a20') : y === 33 ? V[2] : y === 34 ? V[1] : x < 20 ? '#f6f1e6' : '#e6dfd0');
  for (const px of [9, 17, 29, 37]) rect(px, 30, px + 1, 38, (x) => x === px ? V[3] : V[1]);
  rect(19, 30, 28, 38, (x, y) => (x === 19 || x === 28) ? V[2] : (y - 30) % 3 === 2 ? '#2a1c18' : (x & 1) ? '#4a3226' : '#3a2820');   // lattice doors
  rect(23, 30, 24, 38, '#2a1c18'); _enPut2(G, [[22, 34, _EN_GLD[4]], [25, 34, _EN_GLD[3]]]);
  rect(9, 30, 38, 30, (x) => _enM(G.get(x, 30) || '#000000', '#140c10', .55));   // the eave's shadow on the wall
  // the roof: ridge, a small gable with a gold crest, the long lower slopes, upturned corners
  const RR = (k) => R0[clamp(k, 0, R0.length - 1)];
  rect(14, 21, 33, 22, (x, y) => y === 21 ? (gold ? RR(5) : RR(2)) : RR(0));                         // ridge (munagi)
  _enPut2(G, [[12, 21, RR(1)], [13, 20, RR(2)], [13, 21, RR(1)], [34, 20, RR(1)], [34, 21, RR(0)], [35, 21, RR(0)]]);   // ridge-end tiles curling up
  const slope = [[12, 35, 23], [11, 36, 24], [9, 38, 25], [7, 40, 26], [5, 42, 27], [3, 44, 28]];
  for (const [x0, x1, y] of slope) for (let x = x0; x <= x1; x++) {
    const lit = x < 24 - (y - 22) * 2, course = (y & 1) === 0;
    G.set(x, y, y === 28 ? (x < 24 ? RR(gold ? 5 : 4) : RR(3)) : lit ? (course ? RR(3) : RR(gold ? 4 : 2)) : (course ? RR(1) : RR(2)));
  }
  _enPut2(G, [[2, 27, RR(4)], [1, 26, RR(4)], [45, 27, RR(2)], [46, 26, RR(2)], [3, 27, RR(3)], [44, 27, RR(2)]]);   // upturned corners
  rect(21, 22, 26, 24, (x, y) => y === 22 && (x === 21 || x === 26) ? RR(1) : '#f2ead8');               // little gable (white plaster)
  _enPut2(G, [[23, 23, _EN_GLD[4]], [24, 23, _EN_GLD[3]], [23, 24, _EN_GLD[2]], [24, 24, _EN_GLD[2]], [22, 24, _EN_GLD[3]], [25, 24, _EN_GLD[2]]]);
  rect(4, 29, 43, 29, '#1a1216');                                                                       // underside of the eave
  if (snow) {   // winter: a cap along the ridge, snow lying in the roof's courses (the tiles show between), a lip on the eave
    rect(14, 20, 33, 21, (x, y) => y === 20 ? _EN_SN.w : x < 22 ? _EN_SN.h : _EN_SN.b);
    for (const [x0, x1, y] of slope) for (let x = x0; x <= x1; x++) {
      if (y === 28) { if (_enHt(x, y, 666) < .5) G.set(x, y, _EN_SN.s); continue; }
      if ((y & 1) && y > 23) continue;   // the shaded half of each course stays dark
      if (y <= 24 || _enHt(x, y, 665) < .8) G.set(x, y, x < 24 - (y - 22) * 2 ? _EN_SN.w : _EN_SN.b);
    }
    rect(21, 22, 26, 22, _EN_SN.w);
  }
  // the big straw rope (shimenawa) under the eave with four streamers
  for (let x = 11; x <= 36; x++) { const sag = Math.round(Math.sin((x - 11) / 25 * Math.PI) * 1.2); G.set(x, 30 + sag, (x & 1) ? '#e6d08c' : '#bc9a52'); G.set(x, 31 + sag, (x & 1) ? '#a88a46' : '#c8aa62'); }
  for (const [sx, d] of [[13, 1], [34, -1]]) _enPut2(G, [[sx, 32, '#ffffff'], [sx + d, 33, '#ffffff'], [sx, 34, '#e8ecf2'], [sx + d, 35, '#d0d6e2']]);
  // offering box on the veranda
  rect(20, 36, 27, 39, (x, y) => y === 36 ? ((x & 1) ? '#d4aa76' : '#6e4a2e') : y === 37 ? '#b88a58' : x === 20 ? '#946a40' : x === 27 ? '#4e3220' : y === 39 ? '#3e2a1c' : '#6e4a2e');
  if (snow) rect(20, 36, 27, 36, _EN_SN.w);
  if (lv >= 8) {   // the gold bell (suzu) and its red-white rope
    _enPut2(G, [[23, 31, _EN_GLD[2]], [24, 31, _EN_GLD[2]], [22, 32, _EN_GLD[4]], [23, 32, _EN_GLD[5]], [24, 32, _EN_GLD[3]], [25, 32, _EN_GLD[2]], [22, 33, _EN_GLD[3]], [23, 33, _EN_GLD[3]], [24, 33, _EN_GLD[2]], [25, 33, _EN_GLD[1]], [23, 34, _EN_GLD[1]], [24, 34, _EN_GLD[0]]]);
    for (let y = 35; y <= 37; y++) { G.set(23, y, (y & 1) ? '#e8402e' : '#ffffff'); G.set(24, y, (y & 1) ? '#ffffff' : '#c8302a'); }
    _enPut2(G, [[23, 38, '#c8302a'], [24, 38, '#e8402e']]);
  }
}
// lv 6: two trees behind the hall (sakura by season: pink / green / orange / bare with snow)
function _enShrineTrees(G, season) {
  const P = season === 3 ? null : _EN_TREEP.sakura[season][0];
  for (const [tx, cx] of [[5, 7], [42, 40]]) {
    _enTrunk(G, [[tx, 39], [tx, 30], [tx + (cx < 24 ? 1 : -1), 25]], 3, 2, _EN_TRUNK);
    if (P) _enCrown(G, cx, 19, 6.4, 6.4, P, 81 + cx, 1.9);
    else {
      _enTwigs(G, tx, 26, -Math.PI / 2 + (cx < 24 ? .25 : -.25), 6, 3, 90 + cx, [cx, 19, 6.4, 6.4], _EN_BARE);
      _enTwigs(G, tx, 28, cx < 24 ? -2.3 : -.8, 5, 2, 95 + cx, [cx, 19, 6.4, 6.4], _EN_BARE);
    }
  }
  if (!P) _enSnowOnTwigs(G, 38, 97);
  else if (season === 0) for (let y = 12; y < 27; y++) for (let x = 0; x < 48; x++) if (G.get(x, y) === P[5] && _enHt(x, y, 98) < .1) G.set(x, y, '#ffffff');
}
// lv 7: a short tunnel of little red torii either side of the hall, receding (side 0 left, 1 right)
function _enSenbon(G, side, snow) {   // three torii one behind the other: each further one a little smaller and higher
  const fx = x => side ? 47 - x : x, V = _EN_VER;
  for (const [x0, x1, top, bot, k] of [[2, 8, 30, 37, 0], [1, 9, 32, 40, 1], [0, 10, 34, 43, 2]]) {   // back to front
    const lit = side ? x => x === x1 - 1 : x => x === x0 + 1;
    for (let y = top + 2; y <= bot; y++) for (const px of [x0 + 1, x1 - 1]) {   // pillars, the front pair 2 px wide
      G.set(fx(px), y, y >= bot - 1 && k === 2 ? '#2a2226' : lit(px) ? V[3] : V[1]);
      if (k === 2) G.set(fx(px + (px === x0 + 1 ? 1 : -1)), y, y >= bot - 1 ? '#2a2226' : V[2]);
    }
    for (let x = x0; x <= x1; x++) {
      G.set(fx(x), top, snow && (k === 2 || (x & 1)) ? _EN_SN.w : k === 2 ? '#3a3036' : '#2a2226');   // the black kasagi (winter: snow)
      G.set(fx(x), top + 1, x === x0 || x === x1 ? V[1] : V[k === 2 ? 3 : 2]);
      if (x > x0 && x < x1) G.set(fx(x), top + 3, k === 2 ? V[2] : V[1]);   // the nuki
    }
  }
}
// lv 10: a giant golden cat asleep along the roof ridge (nemuri-neko); 'back' = the tail hanging behind the roof,
// 'front' = the body, the head turned to us, eyes shut
function _enNemuriNeko(G, part, snow) {
  const GD = _EN_GLD;
  if (part === 'back') { for (let i = 0; i < 6; i++) { G.set(13 - i, 20 + i, i & 1 ? GD[2] : GD[3]); G.set(12 - i, 20 + i, GD[1]); } return; }
  const lit = (x, y, cx, cy, rx, ry) => { const v = -((x + .5 - cx) / rx * .6 + (y + .5 - cy) / ry * .8) + (_enBay(x, y) - .5) * .3; return v > .55 ? GD[5] : v > .2 ? GD[4] : v > -.25 ? GD[3] : v > -.6 ? GD[2] : GD[1]; };
  for (let y = 14; y <= 21; y++) for (let x = 12; x <= 34; x++) { const nx = (x + .5 - 23) / 11, ny = (y + .5 - 18.5) / 3.6; if (nx * nx + ny * ny <= 1) G.set(x, y, lit(x, y, 23, 18.5, 11, 3.6)); }   // the loaf
  for (let y = 12; y <= 21; y++) for (let x = 29; x <= 39; x++) { const nx = (x + .5 - 34) / 5, ny = (y + .5 - 16.8) / 4.4; if (nx * nx + ny * ny <= 1) G.set(x, y, lit(x, y, 34, 16.8, 5, 4.4)); }   // the head
  _enPut2(G, [[30, 12, GD[4]], [31, 12, GD[3]], [30, 13, GD[3]], [37, 12, GD[3]], [38, 12, GD[2]], [38, 13, GD[2]], [31, 13, '#e88a8a'], [37, 13, '#d07070']]);   // ears
  _enPut2(G, [[31, 17, GD[0]], [32, 17, GD[0]], [36, 17, GD[0]], [37, 17, GD[0]], [33, 18, '#c86a5a'], [34, 18, '#c86a5a'], [33, 19, GD[1]], [35, 19, GD[1]]]);   // shut eyes, nose, mouth
  _enPut2(G, [[29, 19, '#e8a0a0'], [38, 19, '#e8a0a0']]);   // pink cheeks
  _enPut2(G, [[26, 21, GD[4]], [27, 21, GD[3]], [28, 21, GD[2]], [20, 21, GD[3]], [21, 21, GD[2]]]);   // tucked paws
  if (snow) _enPut2(G, [[16, 15, _EN_SN.w], [17, 15, _EN_SN.w], [18, 14, _EN_SN.w], [19, 14, _EN_SN.h], [20, 15, _EN_SN.b], [33, 12, _EN_SN.w], [34, 12, _EN_SN.h]]);
}
// toriiArt(season): 48x36 vermilion torii, anchor (0,36) = bottom-left of its 3x1 footprint (4..6, 3): drawObj(c, 4,
// 4 * TILE, 3). The two pillars stand on (4,3) and (6,3) (sprite x 6..9 / 38..41), the walk goes through (5,3).
function toriiArt(season) {
  const snow = ((season | 0) & 3) === 3;
  return art('en:torii:' + (snow ? 'w' : 'd'), () => {
    const G = new Grid(48, 36), V = _EN_VER, BK = ['#140e12', '#2a2226', '#4a3e44', '#625660'];
    for (const x0 of [6, 38]) {   // pillars (lit on the left) on black bases
      for (let y = 6; y < 31; y++) { G.set(x0, y, V[4]); G.set(x0 + 1, y, V[3]); G.set(x0 + 2, y, V[2]); G.set(x0 + 3, y, V[1]); }
      for (let y = 30; y < 36; y++) for (let x = x0 - 1; x <= x0 + 4; x++) G.set(x, y, y === 30 ? BK[3] : x === x0 - 1 ? BK[2] : x === x0 + 4 ? BK[0] : BK[1]);
    }
    for (let x = 2; x <= 45; x++) { G.set(x, 10, V[4]); G.set(x, 11, x < 24 ? V[3] : V[2]); G.set(x, 12, V[1]); }   // nuki
    for (let x = 3; x <= 44; x++) { G.set(x, 4, V[3]); G.set(x, 5, V[1]); }                                        // shimaki
    for (let x = 0; x <= 47; x++) {   // kasagi: black cap beam, its ends sweeping up
      const t = x < 5 ? 5 - x : x > 42 ? x - 42 : 0, y0 = 1 - (t > 2 ? 1 : 0);
      G.set(x, y0, BK[3]); G.set(x, y0 + 1, BK[1]); if (t < 4) G.set(x, y0 + 2, BK[0]);
    }
    for (let y = 6; y < 10; y++) for (let x = 20; x <= 27; x++) G.set(x, y, x === 20 || x === 27 || y === 6 || y === 9 ? _EN_GLD[3] : '#2a2226');   // plaque (gaku)
    _enPut2(G, [[23, 7, _EN_GLD[4]], [24, 7, _EN_GLD[4]], [22, 8, _EN_GLD[3]], [25, 8, _EN_GLD[3]], [23, 8, _EN_GLD[2]], [24, 8, _EN_GLD[2]]]);   // a gold paw print on it
    if (snow) {
      for (let x = 0; x <= 47; x++) { const t = x < 5 ? 5 - x : x > 42 ? x - 42 : 0; G.set(x, t > 2 ? 0 : 1, x < 24 ? _EN_SN.w : _EN_SN.h); if (t <= 2 && _enHt(x, 0, 671) < .7) G.set(x, 0, _EN_SN.w); }
      for (let x = 2; x <= 45; x++) if ((x < 6 || x > 9) && (x < 38 || x > 41)) G.set(x, 10, _EN_SN.w);
      for (const x0 of [6, 38]) for (let x = x0 - 1; x <= x0 + 4; x++) G.set(x, 30, _EN_SN.h);
    }
    G.selOutline();
    const c = G.canvas(), x = c.getContext('2d'); x.fillStyle = 'rgba(27,27,47,.25)'; x.fillRect(4, 35, 1, 1); x.fillRect(42, 35, 2, 1);   // contact shadow
    return c;
  });
}
// komainuArt(side, season): 14x18 stone guardian - here a komaneko, a stone cat with a red bib, on a pedestal.
// side 'l' stands at (3,2) and looks right (mouth open, "a"), 'r' at (7,2) looks left (mouth shut, "un").
// 1x1, anchor (7,18) = bottom-centre of its tile (drawObj centres it). Light stays top-left on both.
function komainuArt(side, season) {
  const r = side === 'r', snow = ((season | 0) & 3) === 3;
  return art('en:koma:' + (r ? 'r' : 'l') + (snow ? 'w' : ''), () => paint(14, 18, G => {
    const f = x => r ? 13 - x : x, put = (x, y, c) => G.set(f(x), y, c);
    // a sitting stone cat seen from the front, its face turned a little to the walk; drawn for 'l', mirrored for 'r'
    const CAT = [
      '..X......X..',   // 1 ear tips
      '.XX......XX.',
      '.XXXXXXXXXX.',   // head
      'XXXXXXXXXXXX',
      'XXXeXXXXeXXX',   // eyes
      'XXXXXXnXXXXX',   // nose
      '.XXXXXmXXXX.',   // mouth
      '..RRRRRRRR..',   // red bib
      '.XXrRRRRrXX.',
      'TXXXXXXXXXXX',   // body, the tail curling round the side
      'TXXXXXXXXXXX',
      'TTXPPXXPPXXX',   // front paws
    ];
    const C = { X: '#a8a69e', e: '#3a3a40', n: '#8a6a6a', m: r ? '#8e8c84' : '#5a3a3a', R: '#c8382a', r: '#a8281e', P: '#c2c0b6', T: '#9a988f' };
    CAT.forEach((row, j) => [...row].forEach((ch, i) => { if (C[ch]) put(i + 1, j + 1, C[ch]); }));
    for (let x = 0; x <= 13; x++) { put(x, 13, x < 2 ? '#d0cec4' : '#c2c0b6'); put(x, 14, '#a8a69e'); }   // pedestal
    for (let y = 15; y <= 16; y++) for (let x = 1; x <= 12; x++) put(x, y, y === 16 ? '#86847e' : '#9a988f');
    if (snow) { for (const x of [2, 3, 4, 5, 6, 7, 8, 9, 10]) put(x, 3, '#ffffff'); put(3, 2, '#f2f6fb'); put(10, 2, '#f2f6fb'); for (let x = 0; x <= 13; x++) put(x, 13, x & 1 ? '#ffffff' : '#e3eaf3'); }
  }));
}
// shrineLanternArt(lit, season): 12x22 stone lantern (kasuga-doro) for (2,2) / (8,2); 1x1, anchor (6,22) bottom-centre.
// lit = the fire box glows (the core adds glowArt r18 at (tile centre x, tile top + 2) at night).
function shrineLanternArt(lit, season) {
  const on = !!lit, snow = ((season | 0) & 3) === 3;
  return art('en:slant:' + (on ? 1 : 0) + (snow ? 'w' : ''), () => {
    const c = paint(12, 22, G => {
      const S = '#a8a8a0', SL = '#c4c2b8', SD = '#8a8a84';
      G.rect(2, 19, 8, 2, S); G.rect(2, 19, 8, 1, SL);           // base
      G.rect(3, 17, 6, 2, SD); G.rect(3, 17, 6, 1, S);          // plinth
      G.rect(5, 11, 2, 6, S); G.set(5, 11, SL);                 // pole
      G.rect(2, 9, 8, 2, S); G.rect(2, 9, 8, 1, SL);            // platform
      G.rect(3, 5, 6, 4, SD);                                   // fire box
      G.rect(4, 6, 4, 2, on ? '#ffd27a' : '#3a3430'); if (on) { G.set(5, 6, '#fff4c8'); G.set(6, 6, '#fff4c8'); }
      G.rect(1, 4, 10, 1, S); G.rect(2, 3, 8, 1, SL); G.rect(3, 2, 6, 1, SL); G.set(1, 3, SL); G.set(10, 3, S);   // roof, corners curled up
      G.rect(5, 1, 2, 1, S); G.set(5, 0, SL);                   // jewel
      if (snow) { G.rect(2, 2, 7, 1, '#ffffff'); G.rect(3, 1, 3, 1, '#ffffff'); G.set(5, 0, '#ffffff'); G.rect(2, 9, 8, 1, '#f2f6fb'); G.rect(2, 19, 8, 1, '#f2f6fb'); }
    });
    const x = c.getContext('2d'); x.fillStyle = 'rgba(27,27,47,.25)'; x.fillRect(9, 21, 2, 1);
    return c;
  });
}
// chochinString(lit): 32x10, a festival string of paper lanterns that tiles left-right (draw copies 32 px apart; the
// rope meets itself at x 0 / 32, y 1). A red and a white lantern per tile; lit = their paper glows (night).
function chochinString(lit) {
  const on = !!lit;
  return art('en:chochin:' + (on ? 1 : 0), () => _enMake(32, 10, G => {
    for (let x = 0; x < 32; x++) { const y = 1 + Math.round(Math.sin(x / 32 * Math.PI) * 1.6); G.set(x, y, '#3a2a24'); if (!(x % 16)) G.set(x, y - 1, '#5a4434'); }
    const lantern = (cx, body, hi, lo) => {
      const top = 1 + Math.round(Math.sin(cx / 32 * Math.PI) * 1.6) + 1;
      G.set(cx, top, '#2a2226'); G.set(cx + 1, top, '#2a2226');   // the hanger
      for (let x = cx - 1; x <= cx + 2; x++) G.set(x, top + 1, '#1e1a1e');   // black top rim
      for (let y = top + 2; y <= top + 5; y++) for (let x = cx - 2; x <= cx + 3; x++) {
        const edge = x === cx - 2 || x === cx + 3;
        if (edge && (y === top + 2 || y === top + 5)) continue;   // rounded
        G.set(x, y, edge ? lo : x === cx - 1 && !on ? hi : y === top + 3 || y === top + 4 ? (on ? hi : body) : body);
      }
      for (let x = cx - 1; x <= cx + 2; x++) G.set(x, top + 6, '#1e1a1e');   // black bottom rim
      if (on) { G.set(cx, top + 3, '#fffbe6'); G.set(cx + 1, top + 3, '#fff2c8'); }
      G.set(cx + 1, top + 7, lo);   // tassel
    };
    if (on) { lantern(8, '#f06040', '#ffc890', '#b8301e'); lantern(24, '#ffe8b0', '#fffbe6', '#e0a050'); }
    else { lantern(8, '#d8402c', '#f0705a', '#9a2a1c'); lantern(24, '#f4ecd8', '#ffffff', '#c8b898'); }
    G.set(9, 5, on ? '#fff4d0' : '#f8f0e0'); G.set(24, 5, on ? '#e0603a' : '#d8402c'); G.set(25, 5, on ? '#e0603a' : '#d8402c');   // a stroke of brush lettering on each
  }));
}
/*ART:env:END*/
