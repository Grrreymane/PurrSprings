// ------------------------------------------------------------ public API
// look (v2.0.1, optional): a preset from map.js TILE_LOOK on top of the char (room floors / walls, the west hall, the
// star-view bath, the lower garden); see the looks section at the end of env.js
function tileArt(ch, tx, ty, nb, season, look) {
  nb = nb || {};
  season = (season | 0) & 3;   // v2.1 seasons; v2.0 always passes 0 and every season draws the same for now
  if (ch === '~') {   // static water; the animated frames are drawn on top by the core
    if (look === 'milky') { _EN_ROTENNB.set(tx + ',' + ty, { u: nb.u, d: nb.d, l: nb.l, r: nb.r }); return rotenWaterArt(0, tx, ty); }
    return waterArt(0, tx, ty);
  }
  if (ch === 'o') {   // static pond tile; remember its neighbours so pondArt() can draw the same rim every frame
    _EN_PONDNB.set(tx + ',' + ty, { u: nb.u, d: nb.d, l: nb.l, r: nb.r });
    return pondArt(0, tx, ty);
  }
  const lf = look ? _enLookFn(ch, look, nb) : null, f = lf || _EN_TILE[ch];
  if (!f) return null;   // 'D' (doors are drawn by doorArt) and anything unknown
  const k = 'en:t:' + ch + ':' + tx + ',' + ty + ':' + nb.u + ',' + nb.d + ',' + nb.l + ',' + nb.r + ':' + season + (lf ? ':' + look : '');
  return art(k, () => _enMake(16, 16, G => f(G, tx, ty, nb, season)));
}
// the painter for a look, or null (unknown look: the plain char)
function _enLookFn(ch, look, nb) {
  const L = _enLook(look);
  if (ch === 't' && _EN_FLOOR[L.id]) return (G, tx, ty, nb2) => _enRoomFloor(G, tx, ty, nb2, _EN_FLOOR[L.id], L.a, L.b, L.c);
  if (ch === 'r' && L.id === 'rockdry') return (G, tx, ty, nb2) => _enRock(G, tx, ty, Object.assign({}, nb2, { d: nb2.d === '~' ? 'x' : nb2.d }));   // behind a rimmed bath: no wet edge
  if (ch === '#' && _EN_WALL[L.id]) return nb.d !== '#' && nb.d != null ? (G, tx, ty, nb2) => _enRoomWall(G, tx, ty, nb2, _EN_WALL[L.id], L.a, L.b) : null;
  if (ch === '.' && L.id === 'hall') return _enHall;
  if (ch === 's' && L.id === 'sunoko') return (G, tx, ty, nb2) => _enSunoko(G, tx, ty, nb2, false);
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
function doorArt(kind, open, col, emb, gold, tx, ty, floor) {
  open = !!open;
  const gate = kind === 'gate' || kind === 'gateH';
  let sty = !gate && kind !== 'onsen' && open && !!(col || emb || gold);   // a closed door is the same shoji in every style
  if (kind === 'hdoor') sty = open;
  if (gate) { tx = tx == null ? (kind === 'gate' ? 24 : 25) : tx | 0; ty = ty == null ? (kind === 'gate' ? 4 : 29) : ty | 0; }
  const fl = sty && Array.isArray(floor) ? floor : null;
  const k = 'en:d:' + kind + ':' + (open ? 1 : 0) + (sty ? ':' + (col || '') + ':' + (emb || '') + ':' + (gold ? 1 : 0) : '') + (gate ? ':' + tx + ',' + ty + ':' + (emb || '') : '') + (fl ? ':' + fl.join('/') : '');
  return art(k, () => {
    if (kind === 'onsen') return _enMake(16, 16, G => _enOnsenDoor(G, open));
    if (kind === 'hdoor') return _enMake(16, 16, G => _enHDoor(G, open, col, emb, gold));
    if (gate) return _enMake(16, 16, G => _enGate(G, open, tx, ty, kind === 'gateH', emb === 'star' || (kind === 'gate' && tx === 24 && ty === 4)));
    if (!sty) {
      if (kind === 'right') return flipC(doorArt('left', open));
      return _enMake(16, 16, G => _enRoomDoor(G, open));
    }
    const right = kind === 'right', dfl = _EN_DOORFLOOR[emb];
    return _enMake(16, 16, G => {
      _enRoomDoor(G, open, { col, gold, floor: fl ? [_enLook(fl[0]).id, fl[1] === 'p' ? 'grav' : fl[1] === 'hall' ? 'hall' : (dfl ? dfl[1] : null)] : dfl });
      if (right) _enFlipG(G);
      if (emb) _enEmblem(G, emb, right ? 5 : 6, 3, col || _EN.ind);
    });
  });
}
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
function _enRoomDoor(G, open, sty) {   // left room's door; its room (tatami) is to the left, the corridor to the right
  for (let y = 0; y < 16; y++) { G.set(0, y, _EN.dwH); G.set(1, y, _EN.dw); G.set(14, y, _EN.dw); G.set(15, y, _EN.dwD); }
  if (!open) { _enShoji(G, 2, 0, 13, 14, 2); for (let x = 1; x < 15; x++) G.set(x, 15, _EN.dwH); return; }
  const fl = sty && sty.floor;
  for (let y = 0; y < 16; y++) for (let x = 2; x < 14; x++) {   // floor seen through the doorway: tatami | wooden sill | corridor boards
    let c = x < 6 ? ((y & 1) ? _enM(_EN.tat, _EN.tatW, .55) : _EN.tat) : x < 8 ? (x === 6 ? _EN.dwH : _EN.dw) : ((y % 4 === 0) ? _enM(_EN.woodS, _EN.dw, .25) : y % 4 === 1 ? _enM(_EN.wood, _EN.woodH, .45) : _EN.wood);
    if (x === 2) c = _EN.heri;
    if (fl) {   // v2: the right floors for doors that are not between a room and the corridor
      const k = x < 6 ? fl[0] : x < 8 ? null : fl[1], F = k ? _EN_FLOOR[k] : null;
      if (F && F.wood) c = _enWoodPx(F.k, F.wood, x + 3, y);   // v2.0.1: the room's own floor (A1)
      else if (F && F.tat) c = x === 2 && F.lay !== 'q' ? F.heri : (y & 1) ? _enM(F.tat, F.tatW, .55) : F.tat;
      else if (k === 'hall') c = _enWoodPx('chevron', _EN_HALLW, x + 2, y);
      else if (k === 'din') c = y % 6 === 0 ? _EN.dinS : y % 6 === 1 ? _EN.dinH : _EN.din;
      else if (k === 'lobby') c = y % 8 === 0 ? _EN.dw : y % 8 === 1 ? _enM(_EN.wood, _EN.dwH, .2) : _enM(_EN.wood, _EN.dwH, .42);
      else if (k === 'grav') c = (x + y * 3) % 5 === 0 ? '#b4ad9e' : '#d2cbbb';
    }
    G.set(x, y, _enM(c, OUT, y < 11 ? .45 : y === 11 ? .3 : .1));
  }
  for (let x = 1; x < 15; x++) G.set(x, 15, _EN.dwH);
  for (let x = 1; x < 15; x++) G.set(x, 0, _EN.dwD);
  if (sty) {   // v2: noren in the room's colour; a short split under the crest; gold edge for suites
    const base = sty.col || _EN.ind, L = _enM(base, '#ffffff', .2), Lm = _enM(base, '#ffffff', .1), D = _enM(base, OUT, .32), Dm = _enM(base, OUT, .16);
    for (let y = 1; y < 10; y++) for (let x = 2; x < 14; x++) {
      if (x === 8 && y > 7) continue;
      let c = base;
      if (y === 1) c = L; else if (x === 2 || (x === 9 && y > 7)) c = Lm; else if (x === 13 || (x === 7 && y > 7) || y === 9) c = D;
      else if ((x === 4 || x === 11) && y > 6) c = Dm;
      G.set(x, y, c);
    }
    if (sty.gold) {
      for (let y = 1; y < 10; y++) { G.set(2, y, '#f2d478'); G.set(13, y, '#c8962e'); }
      for (let x = 2; x < 14; x++) if (x !== 8) G.set(x, 9, x < 8 ? '#e0b448' : '#c8962e');
      for (let x = 3; x < 13; x++) G.set(x, 1, '#f2d478');
    }
    return;
  }
  // indigo noren hanging from a rod, split in the middle, a white ring crest across the split
  for (let y = 1; y < 10; y++) for (let x = 2; x < 14; x++) {
    if (x === 8 && y > 3) continue;
    let c = _EN.ind;
    if (y === 1) c = '#46629a'; else if (x === 2 || x === 9) c = '#3e5a90'; else if (x === 13 || x === 7) c = '#243a62'; else if (y === 9) c = '#243a62';
    else if ((x === 5 || x === 11) && y > 3) c = '#29426e';
    G.set(x, y, c);
  }
  [[7, 3], [8, 3], [9, 3], [6, 4], [10, 4], [6, 5], [10, 5], [7, 6], [9, 6]].forEach(([x, y]) => G.set(x, y, _EN.wht));
}
// v2: door in a horizontal wall (west wing, (8,18)): same geometry as the onsen door; open = a short three-tongue
// noren over the corridor boards beyond: colour col (null = v1 indigo; SPEC_v2 2.3 wants tea brown _EN_HDOOR_TEA for
// (8,18)), crest emb or else a white ring
function _enHDoor(G, open, col, emb, gold) {
  _enCap(G, false);
  G.rect(0, 5, 16, 1, _EN.dwD);
  if (!open) { _enShoji(G, 0, 6, 15, 14, 2); for (let x = 0; x < 16; x++) G.set(x, 15, _EN.dwH); return; }
  for (let y = 6; y < 16; y++) for (let x = 0; x < 16; x++) {   // v2.0.1: the west hall's parquet and runner beyond
    const c = _enHallPx(8 * 16 + x, 17 * 16 + y);
    G.set(x, y, _enM(c, OUT, y < 12 ? .42 : .14));
  }
  for (let x = 0; x < 16; x++) G.set(x, 15, _EN.dwH);
  const base = col || _EN.ind, L = _enM(base, '#ffffff', .2), D = _enM(base, OUT, .32), Dm = _enM(base, OUT, .16);
  for (let x = 0; x < 16; x++) G.set(x, 2, _EN.dwD);
  G.set(0, 2, '#3a2418'); G.set(15, 2, '#3a2418');
  for (let y = 3; y < 12; y++) for (let x = 1; x < 15; x++) {
    if ((x === 5 || x === 10) && y > 8) continue;   // three tongues
    let c = base;
    if (y === 3) c = L; else if (y === 11 || x === 14 || ((x === 4 || x === 9) && y > 8)) c = D; else if (x === 1 || ((x === 6 || x === 11) && y > 8)) c = _enM(base, '#ffffff', .1);
    else if ((x === 3 || x === 12) && y > 5) c = Dm;
    G.set(x, y, c);
  }
  if (gold) for (let y = 3; y < 12; y++) { G.set(1, y, '#f2d478'); G.set(14, y, '#c8962e'); }
  if (emb) _enEmblem(G, emb, 5, 4, base);
  else [[6, 4], [7, 4], [8, 4], [5, 5], [9, 5], [5, 6], [9, 6], [6, 7], [7, 7], [8, 7]].forEach(([x, y]) => G.set(x, y, _EN.wht));
}
// v2: bamboo wicket gate (shiorido), seen from the front: cedar posts, a capped top rail, a woven dried-bamboo leaf.
// It paints its own paving (slate for 'gate', the gravel walk for 'gateH') lined up with tile (tx, ty).
function _enGate(G, open, tx, ty, horiz, lamp) {
  if (horiz) _enGardenPath(G, tx, ty, { u: 'p', d: 'p', l: 'f', r: 'f' }); else _enSlate(G, tx, ty, {});   // v2.0.1: the gravel walk between the two gardens
  const post = x0 => {
    for (let y = 0; y < 15; y++) { G.set(x0, y, _EN.cedarH); G.set(x0 + 1, y, _EN.cedar); G.set(x0 + 2, y, _EN.cedarD); }
    G.set(x0, 0, _EN.dryH); G.set(x0 + 1, 0, _EN.dry); G.set(x0 + 2, 0, _EN.dryD);
    for (let x = x0 - 1; x <= x0 + 3; x++) G.set(x, 15, _enM(G.get(x, 15) || '#888888', '#2a2430', .4));   // contact shadow
  };
  if (!open) {   // the leaf: diamond-woven dried bamboo in a thin frame
    for (let y = 4; y < 14; y++) for (let x = 3; x < 13; x++) {
      const a = (x + y) & 3, b = (x - y + 32) & 3;
      let c = (a === 0 || b === 0) ? _EN.dryD : ((x + y) & 1) ? _EN.dry : _enM(_EN.dry, _EN.dryH, .5);
      if (a === 0 && b === 0) c = _enM(_EN.dryD, OUT, .3);
      if (x === 3 || y === 4) c = _EN.dryH; else if (x === 12 || y === 13) c = _enM(_EN.dryD, OUT, .2);
      G.set(x, y, c);
    }
    for (let x = 3; x < 13; x++) G.set(x, 14, _enM(G.get(x, 14), '#2a2430', .45));
    G.set(11, 8, _EN.cedarD); G.set(11, 9, _EN.cedarD);   // latch
  } else {   // swung back against the right post: only its edge shows, with its shadow on the ground
    for (let y = 4; y < 14; y++) { G.set(11, y, _EN.dryH); G.set(12, y, _EN.dryD); }
    for (let y = 5; y < 15; y++) G.set(10, y, _enM(G.get(10, y), '#2a2430', .3));
    for (let x = 3; x < 11; x++) G.set(x, 4, _enM(G.get(x, 4), '#2a2430', .35));
  }
  post(0); post(13);
  for (let x = 0; x < 16; x++) {   // the top rail (kasagi) with a little cap
    G.set(x, 1, x === 0 || x === 15 ? _EN.cedarD : _EN.cedarH); G.set(x, 2, _EN.cedar); G.set(x, 3, _EN.cedarD);
  }
  for (let x = 1; x < 15; x++) G.set(x, 0, x === 1 || x === 14 ? _EN.cedarD : '#6a4428');
  if (lamp) {   // a small star lantern hanging from the rail (the roten gate)
    G.set(9, 4, '#3a2418');
    const ST = ['..X..', 'XXXXX', '.XXX.', 'X...X'];
    ST.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(7 + i, 5 + j, j === 0 || (j === 1 && i < 3) ? '#fff2a8' : j === 3 ? '#e0a020' : '#ffd23a'); }));
    G.set(9, 6, '#fffbe0');
  }
}
function _enOnsenDoor(G, open) {   // sits in a wall-face row: cap + beam continue from the neighbours
  _enCap(G, false);
  G.rect(0, 5, 16, 1, _EN.dwD);
  if (!open) { _enShoji(G, 0, 6, 15, 14, 2); for (let x = 0; x < 16; x++) G.set(x, 15, _EN.dwH); return; }
  for (let y = 6; y < 16; y++) for (let x = 0; x < 16; x++) {   // steamy bath floor beyond the doorway
    let c = (x + (y >> 2) * 5) % 8 === 0 || y % 4 === 0 ? _EN.slD : _EN.sl;
    G.set(x, y, _enM(c, OUT, y < 13 ? .4 : .15));
  }
  for (let x = 0; x < 16; x++) G.set(x, 15, _EN.dwH);
  // red noren hung in front of the beam; white yu (hot water) glyph; the hem is cut into three tongues
  const RD = _EN.red, RDd = '#9a2e2a', RDl = '#de6450';
  for (let x = 0; x < 16; x++) G.set(x, 2, _EN.dwD);
  G.set(0, 2, '#3a2418'); G.set(15, 2, '#3a2418');
  for (let y = 3; y < 15; y++) for (let x = 1; x < 15; x++) {
    if ((x === 5 || x === 10) && y > 13) continue;
    let c = RD;
    if (y === 3) c = RDl; else if (y === 14 || x === 14) c = RDd; else if (x === 1) c = '#d65846';
    G.set(x, y, c);
  }
  const GLY = [
    'X..XXXXX..',
    '.X.X...X..',
    '...XXXXX..',
    'X..X...X..',
    '.X.XXXXX..',
    '..........',
    '..XXXXXXXX',
    '....X..X.X',
    '.X.X..X..X',
    'X.X..X..X.',
  ];
  GLY.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') G.set(3 + i, 4 + j, _EN.wht); }));
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
function pondArt(frame, tx, ty) {
  frame = (((frame | 0) % 4) + 4) % 4;
  const nb = _enPondNb(tx, ty), k = 'en:pond:' + frame + ':' + tx + ',' + ty + ':' + (nb.u === 'o' ? 1 : 0) + (nb.d === 'o' ? 1 : 0) + (nb.l === 'o' ? 1 : 0) + (nb.r === 'o' ? 1 : 0);
  return art(k, () => _enMake(16, 16, G => _enPond(G, frame, tx, ty, nb)));
}
// the roten waterfall: 32x40, its (0,0) goes on world (31*16, 0); a rock lip over the fence, a falling sheet whose
// streaks slide down 4px a frame (period 16 = seamless over 4 frames), wet rocks either side, a foam pool below
function waterfallArt(frame) {
  frame = (((frame | 0) % 4) + 4) % 4;
  return art('en:fall:' + frame, () => _enMake(32, 40, G => {
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
      if (bny < -.3 && best < 3 && _enVN(x / 3, y / 3, 241) > .55) c = bny < -.6 ? '#7a9a52' : '#5e7e44';   // moss on the tops
      G.set(x, y, c);
    }
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
    }
  }));
}
// dense bamboo screening the shrine plot in v2.0: 16x24, anchor (0,24) = tile bottom-left, so it rises 8px above its
// tile. Everything is a function of world pixels, so the overlaps line up; only the topmost row shows the ragged tops.
function bambooGroveArt(tx, ty) {
  return art('en:grove:' + tx + ',' + ty, () => _enMake(16, 24, G => {
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
/*ART:env:END*/
