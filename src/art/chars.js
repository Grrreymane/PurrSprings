/*ART:chars:BEGIN*/
// ============================================================ ART: characters (SPEC_v2 12.1; was art/chars.js until the stage M merge)
// Chibi cats for Purr Springs (v2). Every sprite is built once and cached with art(key, ...).
// catSprite: 16x24, anchor (8,23) = ground between the feet. Rows 0-3 are head-room for hats; the body sits exactly
// where it sat in the v1 16x20 sprite (v1 row r = v2 row r + 4), so the drawing code below still uses v1 numbers and
// draws through a shifted view of the grid (_chShift). Light from the top-left (paint's autoShade), coloured outlines
// (selOutline); whiskers, glasses and the 1px contact shadow go straight onto the canvas after paint().
// Walk frames: frame 1 and 2 are the two strides; in frame 2 the head, body and hat ride 1px higher (legs stretch),
// so a walking cat bobs gently.
// v2.1 (SPEC_v2 16.6 / 16.14): the innkeeper's wardrobe look.outfit = o_yukata o_chef o_momiji o_snow o_hakama o_ninja
// o_samurai o_maneki (o_maneki frames 3 / 4 = the beckoning paw, for standing still); look.uniform = sakura / indigo /
// sailor / gold, a palette swap of the six staff outfits; look.acc adds rod palette camera mic bundle tvcam; outfit 'mom'
// = the cat mom (apron shape, her own colours); LOOKS_V21 = ready looks for the press, the mom and the rare guests.
const FURS = {
  orange:    { O: '#f5a04a', D: '#d97a2a', W: '#fff3e0', eye: OUT, stripes: true },
  calico:    { O: '#fbfbf6', D: '#f0a040', D2: '#3a3040', W: '#ffffff', eye: OUT, patch: true },
  white:     { O: '#fbfbf6', D: '#e4dfd8', W: '#ffffff', eye: '#5aa8e8' },
  graytabby: { O: '#a8a29a', D: '#6e675e', W: '#f0ece4', eye: OUT, stripes: true },
  black:     { O: '#3a3a46', D: '#2a2a34', W: '#5a5a6e', eye: '#ffe14a', P: '#4e4e5c' },
  tabby:     { O: '#b8875a', D: '#76502e', W: '#f6ead6', eye: OUT, stripes: true },
  cream:     { O: '#f6dcb2', D: '#e4b882', W: '#fff8ec', eye: OUT, stripes: true },
  siamese:   { O: '#f2e4cc', D: '#5a3a2e', W: '#fbf4e8', eye: '#4a9ae8', points: true, M: '#6a4636', P: '#5a3a2e', ear: '#5a3a2e', T: '#5a3a2e' },
  gray:      { O: '#8a9ab8', D: '#6a7898', W: '#e6ecf4', eye: '#8ad05a' },
  cow:       { O: '#fbfbf6', D: '#2e2e3a', W: '#ffffff', eye: OUT, patch: true, P: '#ffffff' },
};
const _chC = {
  pink: '#ff9fb0', nose: '#f07888', blush: '#ffb4bc', wh: '#f4f0e6',
  happi: '#2f4a7a', happiD: '#22365c', band: '#d8443a',
  kimono: '#f4a8be', obi: '#a8283a', gold: '#f0c45a', sakura: '#fff0f4', pin: '#e8506a',
  lilac: '#a68ad4', lilacD: '#7e64b0', apron: '#fdfcf8', scarf: '#fdfcff', scarfHem: '#c4b8e4', scarfDot: '#9a86cc',
  porter: '#3f7cc4', belt: '#5a3420', pants: '#2c3858', tabi: '#2a2a36', towel: '#ffffff', towelS: '#9cc0ee',
  shorts: '#55648a', yukata: '#f6f4ee', yukS: '#4a6ab4', yukObi: '#22335a',
  bag: '#b4643a', bagD: '#7a4a2a', bagB: '#f0c05a',
  // v2 outfits
  chef: '#f8f6f0', chefS: '#d6dae4', chefBtn: '#9aa0b2', chefPants: '#4a4a5a', shoe: '#2a2a36', kerchief: '#d8443a',
  toque: '#f8f6f1', toqueS: '#d6dae5',   // the toque: one step off the coat colours, so a uniform swap leaves it white
  samue: '#2c3a5e', samueL: '#5a6c98', wApron: '#fbfaf4',
  clerk: '#8c8c9a', clerkK: '#3e3e4e', himo: '#efe4c4',
  shopTop: '#5e4232', shopL: '#8a6a52', maekake: '#3a8a4a', maekakeD: '#2a6a38', cord: '#efe4c4',
  haori: '#8c6440', haoriK: '#4a5a4c',
  trimS: '#c4cee4', trimSW: '#9aa8c8', trimG: '#f4c84a', glasses: '#e2eaf6', cane: '#c89a58', caneD: '#8a5a2c',
  // hats
  straw: '#eccb78', strawD: '#c89a48', strawB: '#d8443a', petal: '#ff8fae', petalW: '#fff4f6', pollen: '#ffd84a', leaf: '#5a9a3a',
  beret: '#9a3040', beretD: '#76243a', capW: '#f8f8f4', capN: '#2a3a6a', visor: '#22222e',
  lens: '#2a2a3a', glint: '#a8c8f0', fox: '#fbfbf6', foxR: '#d8443a', crown: '#f4c84a', crownD: '#c8963a', gem: '#e0304a',
  hair: '#2a2832', ribbon: '#4a8ae8', ribbonD: '#2a5ab8',
  // props
  bowl: '#b8323a', bowlD: '#7a1e28', rice: '#fbfbf6', cup: '#9ab890', cupL: '#e4eedc',
};
// v2.1 innkeeper outfits (o_*): yg = morning-glory yukata, kp = kappogi, mj = red-leaf haori, sn = snow coat,
// hk = student hakama, nj = ninja, sm = samurai kamishimo, mk = lucky-cat costume
const _chOC = {
  ygM: '#40388c', ygF1: '#f67ab8', ygF2: '#86d2f8', ygCol: '#7a70cc', ygObi: '#f6c440', ygObiD: '#d8962a', ygLeaf: '#6ab85a',
  kpW: '#fbfaf2', kpS: '#d8d4c8', kpK: '#8e2e42', kpScarf: '#fefdf8', kpDot: '#c8586a',
  mjR: '#c8402e', mjK: '#3a2e46', mjL1: '#f8cc48', mjL2: '#f49034',
  snC: '#2c7672', snCL: '#4a9a92', snF: '#f8f6f0', snS: '#de4a3c', snSD: '#a8303a', snB: '#6e4834', snTog: '#e8cc8a',
  hkT: '#4c64a8', hkTd: '#e8eef8', hkH: '#5c4e4c', hkHD: '#3c3230', hkCap: '#272739', hkLine: '#f4f4f0', hkVis: '#18182a',
  njS: '#363a5e', njL: '#5c6294', njR: '#d8443a', njW: '#727892', njT: '#24242e',
  smG: '#3c7c54', smGD: '#285a3c', smK: '#ece2c8', smCrest: '#fbfbf6', smHilt: '#30303e', smTsuba: '#ecbc44', smSheath: '#2a2430',
  mkW: '#fbf8f0', mkO: '#f2a040', mkB: '#3a3040', mkR: '#d8303a', mkG: '#f6ca4a', mkGD: '#c8963a',
  // accessories
  rod: '#b8903e', rodD: '#6e5024', line: '#e4e8f0', float: '#e0403a',
  pal: '#dcb27a', palD: '#a87a48', brush: '#7a4a2a', pR: '#e8443a', pB: '#3a78d8', pY: '#f6d040', pG: '#4ab86a',
  cam: '#3a3a4a', camL: '#c8ccd8', lens: '#5a90d0', lensD: '#24304a', rec: '#ff4a4a', strap: '#2a2a36',
  mic: '#b4b8c8', micD: '#44465a', micH: '#2a2a36', micF: '#f6c440',
  furo: '#3a8a4a', furoD: '#28683a', furoW: '#e8f4e0',
  tv: '#aeb4c4', tvD: '#565a6c', tvL: '#1a1c28',
};
const _chRobe = { kimono: 1, apron: 1, yukata: 1, waiter: 1, clerk: 1, shop: 1, haori: 1, robe: 1, o_yukata: 1, o_chef: 1, o_momiji: 1, o_hakama: 1, o_samurai: 1 };
const _chLong = { kimono: 4, yukata: 3, clerk: 4, haori: 4, robe: 4, o_yukata: 3, o_chef: 3, o_momiji: 4, o_hakama: 3, o_samurai: 3 };   // long hanging sleeves (rows)
// [leg, foot]; foot null = the cat's own paw
const _chPants = { porter: [_chC.pants, _chC.tabi], chef: [_chC.chefPants, _chC.shoe], o_snow: [_chOC.snF, _chOC.snB], o_ninja: [_chOC.njW, _chOC.njT], o_maneki: [_chOC.mkW, null] };
const _chOut = { o_yukata: 1, o_chef: 1, o_momiji: 1, o_snow: 1, o_hakama: 1, o_ninja: 1, o_samurai: 1, o_maneki: 1 };
// hats that sit on top of the head: they replace an o_* outfit's own cap / kerchief / beanie
const _chTopHat = { straw: 1, beret: 1, captain: 1, goldband: 1, crown: 1, topknot: 1 };
const _chAccs = { cane: 1, rod: 1, palette: 1, camera: 1, mic: 1, bundle: 1, tvcam: 1 };
// accessories held in a paw: which arm (front view, 0 = screen left / 1 = screen right; mirrored in the back view)
// and whether that paw is hidden behind the prop (-1) or shows (0)
const _chHold = { rod: [1, 0], palette: [0, 0], mic: [1, -1], tvcam: [1, -1] };
const _chTrimOK = { kimono: 1, apron: 1, porter: 1, chef: 1, waiter: 1, clerk: 1 };
const _chHats = { straw: 1, flower: 1, beret: 1, captain: 1, shades: 1, foxmask: 1, crown: 1, goldband: 1, topknot: 1, ribbon: 1 };
const _chCover = { straw: 1, beret: 1, captain: 1, goldband: 1 };    // these replace the outfit's own headwear
const _chHatAlias = { fox: 'foxmask', gold: 'goldband' };
function _chHatId(h) {
  if (!h || typeof h !== 'string') return '';
  let id = h.indexOf('h_') === 0 ? h.slice(2) : h;
  id = _chHatAlias[id] || id;
  return _chHats[id] ? id : '';
}
const _chHex = (s, d) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : d;

// a view of a Grid shifted down by dy rows, so the v1 drawing code (16x20 coordinates) lands in the 16x24 canvas
function _chShift(G, dy) {
  return {
    w: G.w, h: G.h - dy,
    set: (x, y, c) => G.set(x, y + dy, c),
    get: (x, y) => G.get(x, y + dy),
    rect: (x, y, w, h, c) => G.rect(x, y + dy, w, h, c),
    ell: (cx, cy, rx, ry, c) => G.ell(cx, cy + dy, rx, ry, typeof c === 'function' ? (px, py) => c(px, py - dy) : c),
    map: fn => G.map((x, y, c) => fn(x, y - dy, c)),
    clr: (x, y) => { y += dy; if (x >= 0 && y >= 0 && x < G.w && y < G.h) G.d[y * G.w + x] = null; },
  };
}

// view: 'down' | 'up' | 'side' (facing right), frame 0 stand / 1 / 2 walk (o_maneki also 3 / 4: paw up / paw down,
// alternate them while it stands still),
// look = { fur, outfit, shirt?, bag?, robe?, hat?, acc?, trim?, uniform? }
function catSprite(view, frame, look) {
  look = look || {};
  const fur = FURS[look.fur] ? look.fur : 'orange', outfit = look.outfit || 'guest';
  const shirt = look.shirt || '#e0705a', bag = !!look.bag;
  const fr = frame === 1 || frame === 2 || ((frame === 3 || frame === 4) && outfit === 'o_maneki') ? frame : 0;
  const v = view === 'up' || view === 'side' ? view : 'down';
  const x = _chExtra(look, outfit);
  return art('ch:' + v + ':' + fr + ':' + fur + ':' + outfit + ':' + (outfit === 'guest' || !_chKnown[outfit] ? shirt : '') + ':' + (bag ? 1 : 0) +
    ':' + x.hat + ':' + x.acc + ':' + x.trim + ':' + x.robe + ':' + x.uni,
    () => _chBuild(v, fr, FURS[fur], outfit, shirt, bag, x));
}
const _chKnown = { happi: 1, kimono: 1, apron: 1, porter: 1, guest: 1, yukata: 1, chef: 1, waiter: 1, clerk: 1, shop: 1, haori: 1, robe: 1, mom: 1,
  o_yukata: 1, o_chef: 1, o_momiji: 1, o_snow: 1, o_hakama: 1, o_ninja: 1, o_samurai: 1, o_maneki: 1 };
function _chExtra(look, outfit) {
  const t = Math.max(0, Math.min(2, look.trim | 0)), uni = _chTrimOK[outfit] ? _chUniId(look.uniform) : '';
  return {
    hat: _chHatId(look.hat), acc: _chAccs[look.acc] ? look.acc : '', uni,
    trim: _chTrimOK[outfit] ? (uni === 'gold' ? 2 : t) : 0,   // the gold uniform is gold-edged at every level
    robe: outfit === 'robe' ? _chHex(look.robe, '#8a5ac8') : outfit === 'haori' ? _chHex(look.robe, '') : '',   // haori: optional jacket colour
  };
}

function _chBuild(v, fr, f, o, shirt, bag, x) {
  x = x || { hat: '', acc: '', trim: 0, robe: '', uni: '' };
  if (o === 'mom') { o = 'apron'; x = Object.assign({}, x, { uni: 'mom', trim: 0 }); }   // the cat mom: apron shape, her colours
  const bob = fr === 2 ? 1 : 0;
  const c = paint(16, 24, G => {
    const gb = _chShift(G, 4 - bob), gl = _chShift(G, 4);
    if (v === 'side') _chSide(gb, f, o, fr, shirt, bag, gl, x); else _chFront(gb, f, o, fr, shirt, bag, v === 'up', gl, x);
    if (x.uni) { const mp = _chUniMap(o, x.uni); G.map((px, py, col) => mp[col]); }   // uniform = palette swap before shading
  });
  // a raised paw or a shoulder camera covers the whiskers on that side
  const hide = (o === 'o_maneki' && fr > 2) || x.acc === 'tvcam' ? (v === 'up' ? 'l' : 'r') : '';
  if (v === 'side') _chWhiskersSide(c, f, 4 - bob); else _chWhiskersFront(c, f, 4 - bob, hide);
  if (o === 'clerk' && x.hat !== 'shades') _chGlasses(c, v, 4 - bob);
  _chShadow(c, 8, 23, 5);
  return c;
}

// 1px contact shadow under the feet, drawn behind everything already on the canvas
function _chShadow(c, cx, y, hw) {
  const x = c.getContext('2d');
  x.save(); x.globalCompositeOperation = 'destination-over';
  x.fillStyle = 'rgba(27,27,47,0.32)'; x.fillRect(cx - hw, y, hw * 2, 1);
  x.fillStyle = 'rgba(27,27,47,0.16)'; x.fillRect(cx - hw - 1, y, 1, 1); x.fillRect(cx + hw, y, 1, 1);
  x.restore();
}
function _chPx(c, col, pts) { const x = c.getContext('2d'); x.fillStyle = col; pts.forEach(p => x.fillRect(p[0], p[1], 1, 1)); }
const _chTip = '#6e5a50';
// whisker tips poke out past the cheeks (front and back views alike)
function _chWhiskersFront(c, f, oy, hide) {
  oy = oy || 0;
  if (hide !== 'l') _chPx(c, _chTip, [[1, 9 + oy], [0, 9 + oy], [1, 10 + oy], [0, 11 + oy]]);
  if (hide !== 'r') _chPx(c, _chTip, [[14, 9 + oy], [15, 9 + oy], [14, 10 + oy], [15, 11 + oy]]);
}
function _chWhiskersSide(c, f, oy) { oy = oy || 0; _chPx(c, _chTip, [[15, 9 + oy], [15, 11 + oy]]); }
// clerk's round glasses: a 1px frame round each eye, drawn after paint so the outline pass can't thicken it
function _chGlasses(c, v, oy) {
  const g = _chC.glasses, P = (x, y) => [x, y + oy];
  if (v === 'down') _chPx(c, g, [P(4, 6), P(5, 6), P(6, 6), P(4, 7), P(6, 7), P(4, 8), P(6, 8), P(5, 9), P(9, 6), P(10, 6), P(11, 6), P(9, 7), P(11, 7), P(9, 8), P(11, 8), P(10, 9), P(7, 7), P(8, 7)]);
  else if (v === 'side') _chPx(c, g, [P(10, 6), P(11, 6), P(12, 6), P(10, 7), P(12, 7), P(10, 8), P(12, 8), P(11, 9), P(9, 7), P(8, 7), P(7, 7)]);
  else _chPx(c, g, [P(2, 7), P(13, 7)]);
}
const _chBlush = f => mixHex(f.O, _chC.blush, .55);
// closed-eye line: dark on light fur, a pale line on dark fur so it still shows
const _chLid = f => parseInt(f.O.slice(1, 3), 16) + parseInt(f.O.slice(3, 5), 16) + parseInt(f.O.slice(5, 7), 16) < 300 ? '#a8a8c0' : OUT;

// ---------------------------------------------------------------- heads
// shared silhouette for front/back: ear tips at row 1, head rows 3..11, 12px wide (cols 2..13)
function _chSkull(G, f, oy, earIn) {
  const ear = f.ear || f.O, S = (x, y, c) => G.set(x, y + oy, c);
  S(3, 1, ear); S(12, 1, ear); S(3, 2, ear); S(12, 2, ear);
  G.rect(3, 3 + oy, 10, 1, f.O); S(3, 3, ear); S(5, 3, ear); S(10, 3, ear); S(12, 3, ear);
  G.rect(2, 4 + oy, 12, 6, f.O); G.rect(3, 10 + oy, 10, 1, f.O); G.rect(4, 11 + oy, 8, 1, f.O);
  S(4, 2, earIn); S(4, 3, earIn); S(11, 2, earIn); S(11, 3, earIn);
}
function _chHeadDown(G, f, oy) {
  const S = (x, y, c) => G.set(x, y + oy, c);
  _chSkull(G, f, oy, _chC.pink);
  if (f.stripes) [[7, 4], [8, 4], [7, 5], [8, 5], [5, 4], [10, 4], [2, 7], [2, 8], [13, 7], [13, 8]].forEach(p => S(p[0], p[1], f.D));
  if (f.patch) {
    G.ell(4, 4.5 + oy, 2.8, 2.6, f.D); S(3, 1, f.D); S(3, 2, f.D);
    if (f.D2) { G.ell(11.5, 3.5 + oy, 2.2, 1.6, f.D2); S(12, 1, f.D2); S(12, 2, f.D2); S(11, 2, _chC.pink); S(11, 3, _chC.pink); }
    else { S(12, 9, f.D); S(13, 9, f.D); S(12, 8, f.D); }
    S(4, 2, _chC.pink); S(4, 3, _chC.pink);
  }
  if (f.points) { G.ell(8, 9.4 + oy, 3.8, 2.3, mixHex(f.O, f.D, .3)); G.rect(6, 9 + oy, 4, 2, mixHex(f.O, f.D, .55)); S(5, 10, mixHex(f.O, f.D, .3)); S(10, 10, mixHex(f.O, f.D, .3)); }
}
function _chFaceDown(G, f, oy, mood) {
  const S = (x, y, c) => G.set(x, y + oy, c), M = f.M || f.W, lo = f.eye === OUT ? OUT : shade(f.eye, -40);
  if (mood === 'happy') { const L = _chLid(f); S(4, 8, L); S(5, 7, L); S(6, 8, L); S(9, 8, L); S(10, 7, L); S(11, 8, L); }
  else { S(5, 7, f.eye); S(5, 8, lo); S(10, 7, f.eye); S(10, 8, lo); }
  if (!f.points) { S(6, 9, M); S(9, 9, M); G.rect(6, 10 + oy, 4, 1, M); }
  const n = f.points ? f.D : _chC.nose; S(7, 9, n); S(8, 9, n);
  if (mood !== 'happy') { S(4, 9, _chBlush(f)); S(11, 9, _chBlush(f)); }
}
function _chHeadUp(G, f, oy) {
  const S = (x, y, c) => G.set(x, y + oy, c), nape = shade(f.O, -12);
  _chSkull(G, f, oy, shade(f.ear || f.O, -18));
  if (f.stripes) { G.rect(6, 4 + oy, 4, 1, f.D); G.rect(3, 6 + oy, 10, 1, f.D); G.rect(3, 8 + oy, 10, 1, f.D); }
  if (f.patch) {
    G.ell(11.5, 4.5 + oy, 2.8, 2.6, f.D); S(12, 1, f.D); S(12, 2, f.D);
    if (f.D2) { G.ell(4.5, 3.5 + oy, 2.2, 1.6, f.D2); S(3, 1, f.D2); S(3, 2, f.D2); }
    else { S(2, 7, f.D); S(2, 8, f.D); S(3, 8, f.D); S(2, 9, f.D); }
  }
  G.map((x, y, c) => (y - oy === 11 || (y - oy === 10 && x > 3 && x < 12)) && c === f.O ? nape : c);
}
function _chHeadSide(G, f, oy) {
  const ear = f.ear || f.O, far = shade(ear, -22), S = (x, y, c) => G.set(x, y + oy, c), M = f.M || f.W;
  S(4, 1, far); S(4, 2, far); S(5, 2, far); S(4, 3, far); S(5, 3, far); S(6, 3, far);
  G.rect(3, 3 + oy, 10, 1, f.O);
  S(9, 1, ear); S(9, 2, ear); S(10, 2, _chC.pink); S(9, 3, ear); S(10, 3, _chC.pink); S(11, 3, ear);
  G.rect(2, 4 + oy, 12, 6, f.O); G.rect(3, 10 + oy, 10, 1, f.O); G.rect(4, 11 + oy, 8, 1, f.O);
  S(14, 8, f.O); S(14, 9, M);
  if (f.stripes) [[5, 4], [6, 4], [7, 4], [3, 6], [3, 7], [4, 8]].forEach(p => S(p[0], p[1], f.D));
  if (f.patch) {
    G.ell(4.5, 6.5 + oy, 2.8, 3, f.D);
    if (f.D2) { S(9, 1, f.D2); S(9, 2, f.D2); S(9, 3, f.D2); S(11, 3, f.D2); S(8, 4, f.D2); S(9, 4, f.D2); S(10, 4, f.D2); }
  }
  if (f.points) { G.ell(12.8, 9.2 + oy, 2.4, 1.8, mixHex(f.O, f.D, .6)); S(14, 8, f.D); S(14, 9, f.D); S(9, 1, f.D); S(9, 2, f.D); S(9, 3, f.D); }
  if (!f.points) { S(12, 9, M); S(13, 9, M); S(11, 10, M); S(12, 10, M); S(13, 10, M); S(14, 8, _chC.nose); }
  S(11, 7, f.eye); S(11, 8, f.eye === OUT ? OUT : shade(f.eye, -40));
  S(9, 9, _chBlush(f));
}

// ---------------------------------------------------------------- headwear that belongs to an outfit (drawn over the head)
function _chHatFront(G, f, o, oy, back) {
  const S = (x, y, c) => G.set(x, y + oy, c);
  if (o === 'happi') {
    G.rect(2, 5 + oy, 12, 1, _chC.band);
    if (back) { S(2, 4, _chC.band); S(1, 4, _chC.band); S(1, 6, _chC.band); }
    else { S(13, 4, _chC.band); S(14, 4, _chC.band); S(14, 6, _chC.band); }
  } else if (o === 'porter') {
    for (let x = 2; x < 14; x++) S(x, 5, (x & 1) ? _chC.towel : _chC.towelS);
    if (back) { S(4, 4, _chC.towel); S(3, 4, _chC.towelS); S(4, 3, _chC.towel); }
    else { S(11, 4, _chC.towel); S(12, 4, _chC.towelS); S(11, 3, _chC.towel); }
  } else if (o === 'apron') {
    // tenugui headscarf: ears poke through, lilac hem so it reads on white fur too
    G.rect(5, 3 + oy, 6, 1, _chC.scarf); S(4, 3, _chC.scarf); S(11, 3, _chC.scarf); G.rect(2, 4 + oy, 12, 1, _chC.scarf); G.rect(2, 5 + oy, 12, 1, _chC.scarfHem);
    [[6, 3], [9, 3], [4, 4], [8, 4], [12, 4]].forEach(p => S(p[0], p[1], _chC.scarfDot));
    if (back) { G.rect(2, 6 + oy, 12, 1, _chC.scarfHem); G.rect(6, 6 + oy, 4, 1, _chC.scarf); S(6, 7, _chC.scarf); S(9, 7, _chC.scarf); S(5, 8, _chC.scarfHem); S(10, 8, _chC.scarfHem); }
  } else if (o === 'kimono') {
    const cx = back ? 4 : 11;   // kanzashi flower by the right ear
    S(cx, 4, _chC.pin); S(cx - 1, 5, _chC.pin); S(cx + 1, 5, _chC.pin); S(cx, 5, _chC.gold);
  } else if (o === 'chef') {
    // tall toque: pleated puff over a band that hides the ears
    G.rect(4, -2 + oy, 8, 1, _chC.toque); G.rect(3, -1 + oy, 10, 3, _chC.toque); G.rect(4, 2 + oy, 8, 1, _chC.toque);
    G.rect(3, 3 + oy, 10, 2, _chC.toque); S(2, 4, _chC.toque); S(13, 4, _chC.toque);
    [[5, 0], [8, -1], [8, 0], [10, 0], [5, 1], [10, 1]].forEach(p => S(p[0], p[1], _chC.toqueS));
    G.rect(3, 4 + oy, 10, 1, _chC.toqueS);
  }
}
function _chHatSide(G, f, o, oy) {
  const S = (x, y, c) => G.set(x, y + oy, c);
  if (o === 'happi') { G.rect(2, 5 + oy, 12, 1, _chC.band); S(1, 5, _chC.band); S(1, 6, _chC.band); S(0, 7, _chC.band); }
  else if (o === 'porter') { for (let x = 2; x < 14; x++) S(x, 5, (x & 1) ? _chC.towel : _chC.towelS); S(1, 5, _chC.towel); S(1, 6, _chC.towelS); }
  else if (o === 'apron') {
    G.rect(4, 3 + oy, 6, 1, _chC.scarf); G.rect(2, 4 + oy, 11, 1, _chC.scarf); G.rect(2, 5 + oy, 11, 1, _chC.scarfHem); S(9, 2, null);
    S(1, 5, _chC.scarf); S(1, 6, _chC.scarfHem); [[5, 3], [7, 4], [3, 4], [11, 4]].forEach(p => S(p[0], p[1], _chC.scarfDot));
  }
  else if (o === 'kimono') { S(6, 3, _chC.pin); S(5, 4, _chC.pin); S(7, 4, _chC.pin); S(6, 4, _chC.gold); }
  else if (o === 'chef') {
    G.rect(4, -2 + oy, 7, 1, _chC.toque); G.rect(3, -1 + oy, 9, 4, _chC.toque); G.rect(2, 3 + oy, 11, 2, _chC.toque);
    [[5, 0], [8, -1], [8, 0], [5, 1], [10, 1]].forEach(p => S(p[0], p[1], _chC.toqueS));
    G.rect(2, 4 + oy, 11, 1, _chC.toqueS);
  }
}

// ---------------------------------------------------------------- hats (look.hat), all three views. oy = head offset.
// Drawn after the head and the outfit's own headwear, so they follow the head wherever it goes (walk bob, bow, sit).
function _chHatOn(G, hat, v, oy) {
  const S = (x, y, c) => G.set(x, y + oy, c), Rr = (x, y, w, h, c) => G.rect(x, y + oy, w, h, c), K = (x, y) => G.clr(x, y + oy);
  const C = _chC, back = v === 'up', side = v === 'side';
  if (hat === 'straw') {
    if (side) {
      Rr(4, 0, 5, 1, C.straw); Rr(3, 1, 7, 2, C.straw); Rr(3, 3, 7, 1, C.strawB);
      Rr(0, 4, 15, 1, C.straw); Rr(1, 5, 12, 1, C.strawD);
      [[5, 1], [7, 2], [4, 2]].forEach(p => S(p[0], p[1], C.strawD));
      [[4, 1], [4, 2], [5, 2], [4, 3], [5, 3], [6, 3]].forEach(p => K(p[0], p[1]));
    } else {
      Rr(5, 0, 6, 1, C.straw); Rr(4, 1, 8, 2, C.straw); Rr(4, 3, 8, 1, C.strawB);
      Rr(1, 4, 14, 1, C.straw); Rr(2, 5, 12, 1, C.strawD);
      [[6, 1], [9, 1], [7, 2], [10, 2], [5, 2]].forEach(p => S(p[0], p[1], C.strawD));
      S(back ? 5 : 10, 3, shade(C.strawB, -30));   // ribbon knot
    }
  } else if (hat === 'flower') {
    const fl = (cx, cy, p, mid) => { S(cx, cy - 1, p); S(cx - 1, cy, p); S(cx + 1, cy, p); S(cx, cy + 1, p); S(cx, cy, mid); };
    if (side) { fl(7, 2, C.petal, C.pollen); S(5, 3, C.petalW); S(6, 4, C.leaf); S(8, 4, C.leaf); }
    else if (back) { fl(3, 2, C.petal, C.pollen); S(5, 3, C.petalW); S(5, 4, C.leaf); S(2, 4, C.leaf); }
    else { fl(12, 2, C.petal, C.pollen); S(10, 3, C.petalW); S(10, 4, C.leaf); S(13, 4, C.leaf); }
  } else if (hat === 'beret') {
    if (side) {
      [[4, 1], [4, 2], [5, 2], [4, 3], [5, 3], [6, 3], [9, 1], [9, 2], [10, 2], [9, 3], [10, 3], [11, 3]].forEach(p => K(p[0], p[1]));
      S(7, -1, C.beretD); Rr(4, 0, 6, 1, C.beret); Rr(2, 1, 10, 2, C.beret); Rr(2, 3, 10, 1, C.beretD); S(1, 2, C.beret);
    } else {
      const s = back ? -1 : 1, cx = back ? 9 : 6;   // tilted towards one side
      S(cx + 1, -1, C.beretD); Rr(back ? 6 : 4, 0, 6, 1, C.beret); Rr(back ? 4 : 1, 1, 11, 2, C.beret); Rr(back ? 5 : 2, 3, 9, 1, C.beretD);
      if (s > 0) { K(3, 1); K(3, 2); K(4, 2); } else { K(12, 1); K(12, 2); K(11, 2); }
    }
  } else if (hat === 'captain') {
    if (side) {
      [[4, 1], [4, 2], [5, 2], [4, 3], [5, 3], [6, 3], [9, 1], [9, 2], [10, 2], [9, 3], [10, 3], [11, 3]].forEach(p => K(p[0], p[1]));
      Rr(3, -1, 8, 1, C.capW); Rr(2, 0, 10, 3, C.capW); Rr(2, 3, 10, 1, C.capN); Rr(9, 4, 5, 1, C.visor);
      S(10, 1, C.gold); S(11, 1, C.gold);
    } else {
      [[3, 1], [3, 2], [12, 1], [12, 2]].forEach(p => K(p[0], p[1]));
      Rr(4, -1, 8, 1, C.capW); Rr(3, 0, 10, 3, C.capW); Rr(3, 3, 10, 1, C.capN);
      if (!back) { Rr(4, 4, 8, 1, C.visor); S(7, 1, C.gold); S(8, 1, C.gold); S(7, 2, C.gold); S(8, 2, C.gold); S(5, 4, '#4a4a5e'); }
    }
  } else if (hat === 'shades') {
    if (side) { Rr(11, 7, 3, 2, C.lens); S(10, 7, C.lens); S(9, 7, C.lens); S(8, 7, C.lens); S(12, 7, C.glint); }
    else if (back) { S(2, 7, C.lens); S(13, 7, C.lens); }
    else { Rr(3, 7, 4, 2, C.lens); Rr(9, 7, 4, 2, C.lens); S(7, 7, C.lens); S(8, 7, C.lens); S(4, 7, C.glint); S(10, 7, C.glint); S(3, 8, null); }
  } else if (hat === 'foxmask') {
    // a white fox mask pushed to the side of the head (over one ear): pointed ears, red markings, black eyes and nose
    const mask = (x0, y0, face) => {
      const W = face ? C.fox : '#e8dcc6';
      S(x0, y0, W); S(x0 + 4, y0, W);
      Rr(x0, y0 + 1, 5, 3, W); Rr(x0 + 1, y0 + 4, 3, 1, W); S(x0 + 2, y0 + 5, face ? OUT : W);
      if (face) { S(x0 + 1, y0 + 1, C.foxR); S(x0 + 3, y0 + 1, C.foxR); S(x0 + 1, y0 + 3, OUT); S(x0 + 3, y0 + 3, OUT); }
      else { S(x0 + 2, y0 + 2, C.foxR); S(x0 + 1, y0 + 2, C.foxR); }
    };
    if (side) mask(3, 1, true);
    else if (back) mask(10, 1, false);
    else mask(1, 1, true);
  } else if (hat === 'crown') {
    const x0 = side ? 5 : 5;
    S(x0, -1, C.crown); S(x0 + 2, -1, C.crown); S(x0 + 3, -1, C.crown); S(x0 + 5, -1, C.crown);
    Rr(x0, 0, 6, 2, C.crown); Rr(x0, 2, 6, 1, C.crownD);
    if (!back) { S(x0 + 2, 1, C.gem); S(x0 + 3, 1, C.gem); } else { S(x0 + 2, 1, C.crownD); S(x0 + 3, 1, C.crownD); }
  } else if (hat === 'goldband') {
    const B = C.crown, D = C.crownD;
    // gold headband with a little bell hanging from the knot
    const bell = (x, y) => { S(x, y, '#fff0a0'); S(x + 1, y, B); S(x, y + 1, D); S(x + 1, y + 1, D); };
    if (side) { Rr(2, 5, 12, 1, B); S(1, 5, B); S(1, 6, B); bell(0, 7); }
    else {
      Rr(2, 5, 12, 1, B); for (let x = 3; x < 13; x += 3) S(x, 5, D);
      if (back) { S(2, 4, B); S(1, 4, B); bell(0, 6); }
      else { S(13, 4, B); S(14, 4, B); bell(14, 6); }
    }
  } else if (hat === 'topknot') {
    // sumo topknot: a ginkgo-leaf fan of oiled hair on a short stem (wide on top, so it never reads as a hat)
    const H = C.hair, Hl = '#4e4c5e';
    if (side) {
      S(5, 2, H); S(6, 2, H); S(7, 2, H); S(5, 1, H); S(6, 1, H);
      S(4, 0, H); S(5, 0, Hl); S(6, 0, H); S(7, 0, H); S(8, 0, H); S(8, 1, H); S(9, 1, H); S(5, -1, H); S(6, -1, H);
    } else {
      S(6, -1, H); S(9, -1, H); S(7, -1, Hl); S(8, -1, H);
      Rr(5, 0, 6, 1, H); S(6, 0, Hl); S(7, 1, H); S(8, 1, H); S(7, 2, H); S(8, 2, H);
      if (back) { S(6, 2, H); S(9, 2, H); }
    }
  } else if (hat === 'ribbon') {
    const bow = x0 => { S(x0, 1, C.ribbon); S(x0 + 1, 1, C.ribbon); S(x0 + 3, 1, C.ribbon); S(x0 + 4, 1, C.ribbon); Rr(x0, 2, 5, 1, C.ribbon); S(x0 + 2, 2, C.ribbonD); S(x0 + 1, 3, C.ribbonD); S(x0 + 3, 3, C.ribbonD); };
    if (side) bow(7); else if (back) bow(1); else bow(10);
  }
}

// ---------------------------------------------------------------- outfit palettes
function _chCloth(o, shirt, robe) {
  switch (o) {
    case 'happi': return { m: _chC.happi, sleeve: _chC.happi, cuff: _chC.wh };
    case 'kimono': return { m: _chC.kimono, sleeve: _chC.kimono };
    case 'apron': return { m: _chC.lilac, sleeve: _chC.lilac };
    case 'porter': return { m: _chC.porter, sleeve: _chC.porter };
    case 'yukata': return { m: _chC.yukata, sleeve: _chC.yukata };
    case 'chef': return { m: _chC.chef, sleeve: _chC.chef };
    case 'waiter': return { m: _chC.samue, sleeve: _chC.samue };
    case 'clerk': return { m: _chC.clerk, sleeve: _chC.clerk };
    case 'shop': return { m: _chC.shopTop, sleeve: _chC.shopTop };
    case 'haori': return { m: robe || _chC.haori, sleeve: robe || _chC.haori };
    case 'robe': return { m: robe || '#8a5ac8', sleeve: robe || '#8a5ac8' };
    case 'o_yukata': return { m: _chOC.ygM, sleeve: _chOC.ygM };
    case 'o_chef': return { m: _chOC.kpW, sleeve: _chOC.kpW };
    case 'o_momiji': return { m: _chOC.mjR, sleeve: _chOC.mjR };
    case 'o_snow': return { m: _chOC.snC, sleeve: _chOC.snC, cuff: _chOC.snF };
    case 'o_hakama': return { m: _chOC.hkT, sleeve: _chOC.hkT };
    case 'o_ninja': return { m: _chOC.njS, sleeve: _chOC.njS, cuff: _chOC.njW };
    case 'o_samurai': return { m: _chOC.smG, sleeve: _chOC.smK };
    case 'o_maneki': return { m: _chOC.mkW, sleeve: _chOC.mkW };
    default: return { m: shirt, sleeve: shirt };
  }
}
const _chYukPat = (x, y) => x % 3 === 1;
// garment colours a trim may recolour (hem row + cuffs)
function _chTrimCols(o) {
  switch (o) {
    case 'kimono': return [_chC.kimono, _chC.sakura];
    case 'apron': return [_chC.lilac, _chC.apron];
    case 'porter': return [_chC.belt];
    case 'chef': return [_chC.chef];
    case 'waiter': return [_chC.samue, _chC.wApron];
    case 'clerk': return [_chC.clerk, _chC.clerkK];
    default: return [];
  }
}
// trim: silver (1) / gold (2) edge on the hem row (porter: the belt) and the sleeve cuffs
function _chTrim(G, o, t, side) {
  if (!t || !_chTrimOK[o]) return;
  const cols = _chTrimCols(o), has = c => cols.indexOf(c) >= 0;
  const tcOf = c => t === 2 ? _chC.trimG : (parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16) > 640 ? _chC.trimSW : _chC.trimS);
  const row = o === 'porter' ? 15 : o === 'chef' ? 16 : 17;
  for (let x = 2; x < 14; x++) { const c = G.get(x, row); if (has(c)) G.set(x, row, tcOf(c)); }
  if (side) return;
  const sl = o === 'porter' ? _chC.porter : _chCloth(o).sleeve;
  [2, 3, 12, 13].forEach(x => { for (let y = 17; y >= 12; y--) if (G.get(x, y) === sl) { G.set(x, y, tcOf(sl)); break; } });
}

// ---------------------------------------------------------------- staff uniforms (look.uniform, SPEC_v2 16.6)
// A uniform recolours the garment (never the shapes) of the six staff outfits: per outfit, _chC colour name -> new colour.
// The swap runs on the grid before paint() shades and outlines it, so shading and outlines follow the new colours.
// 'mom' is internal: the cat mom's apron colours (outfit 'mom').
const _chUni = {
  sakura: {
    kimono: { kimono: '#fcd8e4', obi: '#d84c7c', sakura: '#ffffff' },
    apron: { lilac: '#f2a2be', lilacD: '#c8587e', scarfHem: '#f6c4d4', scarfDot: '#e27aa0' },
    porter: { porter: '#ec8cae', pants: '#7a3a58', belt: '#fde8f0' },
    chef: { chef: '#fff0f5', chefS: '#f4c4d4', chefBtn: '#d86a92', kerchief: '#e8608c', chefPants: '#8a4a62' },
    waiter: { samue: '#d0668c', samueL: '#f6b4ca', wApron: '#fff4f8' },
    clerk: { clerk: '#e29cb6', clerkK: '#8a3a5c', himo: '#fff0f5' },
  },
  indigo: {
    kimono: { kimono: '#3a5a9e', obi: '#e8e0c8', sakura: '#dce8f8' },
    apron: { lilac: '#3a5496', lilacD: '#1e2c5c', scarfHem: '#7a96d0', scarfDot: '#3a5496' },
    porter: { porter: '#24366e', pants: '#3a4a6e', belt: '#e8e0c8', towelS: '#5a78c0' },
    chef: { chef: '#dfe8f6', chefS: '#a8bce0', chefBtn: '#3a5496', kerchief: '#2c4282', chefPants: '#24305a' },
    waiter: { samue: '#dfe8f8', samueL: '#3a5496', wApron: '#24306a' },
    clerk: { clerk: '#3e5694', clerkK: '#1e2850', himo: '#e4ecfa' },
  },
  sailor: {
    kimono: { kimono: '#f6f7fa', obi: '#2a3e7a', sakura: '#2a3e7a' },
    apron: { lilac: '#2a3e7a', lilacD: '#d83a3a', scarfHem: '#2a3e7a', scarfDot: '#d83a3a' },
    porter: { porter: '#f4f6fa', pants: '#2a3e7a', belt: '#d83a3a' },
    chef: { chef: '#f8faff', chefS: '#9cb0dc', chefBtn: '#d83a3a', kerchief: '#2a3e7a', chefPants: '#2a3e7a' },
    waiter: { samue: '#f2f4f8', samueL: '#2a3e7a', wApron: '#2a3e7a' },
    clerk: { clerk: '#f2f4f8', clerkK: '#2a3e7a', himo: '#d83a3a' },
  },
  gold: {
    kimono: { kimono: '#7a2440', obi: '#1e1420', sakura: '#f0c040' },
    apron: { lilac: '#6e2240', lilacD: '#f0c040', scarfHem: '#f0c040', scarfDot: '#6e2240', apron: '#fff4dc' },
    porter: { porter: '#6e2240', pants: '#24161e', belt: '#f0c040' },
    chef: { chef: '#fff4dc', chefS: '#ecd49a', chefBtn: '#e0a828', kerchief: '#7a2440', chefPants: '#24161e' },
    waiter: { samue: '#5a1c36', samueL: '#f0c040', wApron: '#fff4dc' },
    clerk: { clerk: '#6e2240', clerkK: '#1e1420', himo: '#f0c040' },
  },
  mom: { apron: { lilac: '#bc6a80', lilacD: '#8a4258', scarf: '#fff6e6', scarfHem: '#f2b48a', scarfDot: '#d47a5a', apron: '#fffaf0' } },
};
const _chUniAlias = { sakura: 'sakura', pink: 'sakura', indigo: 'indigo', aizome: 'indigo', sailor: 'sailor', gold: 'gold', goldtrim: 'gold', 'gold-trim': 'gold', kinbuchi: 'gold' };
function _chUniId(u) {
  if (!u || typeof u !== 'string') return '';
  const id = u.indexOf('u_') === 0 ? u.slice(2) : u;
  return _chUniAlias[id] || '';
}
// colour -> colour for one outfit + uniform; the darker / lighter shades the drawing derives from a garment colour
// (far legs, lap, lapels, obi highlight) are swapped to the same shade of the new colour. Fur, eye and outline colours
// are never swapped (a near-white garment shaded +30 clamps to #ffffff = white fur).
const _CH_UNIMAP = {};
let _chKeep = null;
function _chUniMap(o, u) {
  const k = o + ':' + u; if (_CH_UNIMAP[k]) return _CH_UNIMAP[k];
  if (!_chKeep) {
    _chKeep = new Set(['#ffffff', '#000000', OUT, _chC.wh, _chC.pink, _chC.nose, _chTip]);
    for (const f in FURS) for (const c in FURS[f]) if (typeof FURS[f][c] === 'string') _chKeep.add(FURS[f][c]);
  }
  const t = (_chUni[u] || {})[o] || {}, m = {};
  for (const n in t) for (const a of [-16, -26, -30, -34, -36, 30]) { const sc = shade(_chC[n], a); if (!_chKeep.has(sc)) m[sc] = shade(t[n], a); }
  for (const n in t) if (!_chKeep.has(_chC[n])) m[_chC[n]] = t[n];
  return (_CH_UNIMAP[k] = m);
}

// ---------------------------------------------------------------- DOWN / UP (front and back share the silhouette)
// G = body view (rides up 1px on frame 2), L = leg view (feet stay on the ground)
function _chFront(G, f, o, fr, shirt, bag, back, L, x) {
  L = L || G; x = x || {};
  const robe = _chRobe[o], P = f.P || f.W, cl = _chCloth(o, shirt, x.robe), T = f.T || f.O, bob = L !== G && fr === 2 ? 1 : 0;
  // the "back" leg of the stride is drawn shorter (lifted); frame 1 lifts the cat's own left leg
  const lift = fr === 0 || fr > 2 ? -1 : ((fr === 1) !== back ? 1 : 0);   // 0 = screen-left foot, 1 = screen-right
  const pn = _chPants[o], leg = pn ? pn[0] : f.O, foot = pn ? pn[1] || P : P, ankle = _chAnkle(o, f);
  // down view: tail tip peeks out on the left behind the body
  if (!back) { const s = fr === 2 ? 1 : 0; [[3, 17], [2, 16], [1, 15 + s], [1, 14 + s], [2, 13 + s]].forEach(p => G.set(p[0], p[1], T)); }
  [5, 9].forEach((lx, i) => {
    if (robe) { if (lift !== i) { L.rect(lx, 18, 2, 1, P); if (bob) L.rect(lx, 17, 2, 1, ankle); } return; }
    if (lift === i) G.rect(lx, 17, 2, 1, foot); else { L.rect(lx, 17, 2, 1, leg); L.rect(lx, 18, 2, 1, foot); if (bob) L.rect(lx, 16, 2, 1, leg); }
  });
  const bot = robe ? 17 : 16;
  G.rect(4, 12, 8, bot - 11, cl.m);
  if (o === 'happi') {
    if (back) { G.rect(5, 12, 6, 1, _chC.wh); [[7, 13], [8, 13], [6, 14], [9, 14], [7, 15], [8, 15]].forEach(p => G.set(p[0], p[1], _chC.wh)); }
    else { G.rect(7, 12, 2, 2, f.W); G.rect(7, 14, 2, 3, _chC.happiD); G.rect(6, 12, 1, 5, _chC.wh); G.rect(9, 12, 1, 5, _chC.wh); }
  } else if (o === 'kimono' || o === 'robe') {
    const obi = o === 'robe' ? _chC.gold : _chC.obi, dot = o === 'robe' ? shade(cl.m, -40) : _chC.gold;
    if (back) {
      G.rect(4, 14, 8, 2, obi); G.rect(5, 13, 6, 3, obi); G.rect(6, 13, 4, 1, shade(obi, 30)); G.set(7, 15, dot); G.set(8, 15, dot);
      G.rect(6, 12, 4, 1, _chC.wh);
    } else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, _chC.wh); G.set(9, 12, _chC.wh); G.set(7, 13, _chC.wh); G.set(8, 13, _chC.wh);
      G.rect(4, 14, 8, 2, obi); G.set(7, 15, dot); G.set(8, 15, dot);
    }
    if (o === 'kimono') [[5, 16], [10, 17], [9, 13]].forEach(p => { if (G.get(p[0], p[1]) === _chC.kimono) G.set(p[0], p[1], _chC.sakura); });
    else { G.rect(4, 17, 8, 1, shade(cl.m, -34)); [[5, 17], [8, 17], [10, 16]].forEach(p => G.set(p[0], p[1], mixHex(cl.m, '#ffffff', .55))); }
  } else if (o === 'yukata') {
    for (let y = 12; y <= 17; y++) for (let x = 4; x < 12; x++) if (_chYukPat(x, y)) G.set(x, y, _chC.yukS);
    if (back) { G.rect(4, 14, 8, 1, _chC.yukObi); G.rect(6, 15, 4, 1, _chC.yukObi); G.rect(6, 12, 4, 1, _chC.yukS); }
    else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, _chC.yukObi); G.set(9, 12, _chC.yukObi); G.set(7, 13, _chC.yukObi); G.set(8, 13, _chC.yukata);
      G.rect(4, 14, 8, 1, _chC.yukObi);
    }
  } else if (o === 'apron') {
    if (back) {
      G.rect(4, 14, 8, 1, _chC.lilacD); G.rect(6, 12, 4, 1, _chC.wh);
      [[5, 13], [6, 14], [10, 13], [9, 14], [7, 14], [8, 14], [7, 15], [8, 15], [6, 16], [9, 16]].forEach(p => G.set(p[0], p[1], _chC.apron));
    }
    else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, _chC.wh); G.set(9, 12, _chC.wh); G.set(7, 13, _chC.wh); G.set(8, 13, _chC.wh);
      G.rect(4, 14, 8, 1, _chC.lilacD); G.rect(5, 15, 6, 3, _chC.apron); G.set(4, 14, _chC.apron); G.set(11, 14, _chC.apron);
    }
  } else if (o === 'porter') {
    G.rect(4, 15, 8, 1, _chC.belt); G.rect(4, 16, 8, 1, _chC.pants);
    if (!back) { G.set(7, 12, _chC.wh); G.set(8, 12, _chC.wh); G.set(7, 13, shade(_chC.porter, -36)); G.set(7, 14, shade(_chC.porter, -36)); }
  } else if (o === 'chef') {
    // white double-breasted coat, red neckerchief
    if (back) { G.rect(6, 12, 4, 1, _chC.kerchief); G.set(7, 13, _chC.kerchief); G.rect(7, 14, 1, 3, _chC.chefS); }
    else {
      G.rect(6, 12, 4, 1, _chC.kerchief); G.set(7, 13, _chC.kerchief); G.set(8, 13, shade(_chC.kerchief, -30));
      [[6, 14], [9, 14], [6, 16], [9, 16]].forEach(p => G.set(p[0], p[1], _chC.chefBtn)); G.rect(8, 14, 1, 3, _chC.chefS);
    }
  } else if (o === 'waiter') {
    // indigo samue with a crossed collar, white half apron
    if (back) { G.rect(6, 12, 4, 1, _chC.samueL); G.rect(4, 14, 8, 1, _chC.wApron); G.set(7, 15, _chC.wApron); G.set(8, 15, _chC.wApron); G.set(6, 16, _chC.wApron); G.set(9, 16, _chC.wApron); }
    else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, _chC.samueL); G.set(9, 12, _chC.samueL); G.set(7, 13, _chC.samueL); G.set(8, 13, _chC.samueL);
      G.rect(4, 14, 8, 1, _chC.wApron); G.rect(5, 15, 6, 3, _chC.wApron);
    }
  } else if (o === 'clerk' || o === 'haori') {
    // haori jacket open over a dark kimono, cream cords; a crest on the back
    const K = o === 'clerk' ? _chC.clerkK : _chC.haoriK;
    if (back) { G.rect(6, 12, 4, 1, K); G.set(7, 13, _chC.himo); G.set(8, 13, _chC.himo); }
    else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, K); G.set(9, 12, K); G.rect(7, 13, 2, 5, K);
      G.set(7, 14, _chC.himo); G.set(8, 14, _chC.himo); G.set(6, 14, _chC.himo); G.set(9, 14, _chC.himo);
    }
  } else if (o === 'shop') {
    // the shop owner: work jacket and a long green maekake apron with a white mark
    if (back) { G.rect(6, 12, 4, 1, _chC.shopL); G.rect(4, 14, 8, 1, _chC.cord); G.rect(4, 15, 1, 3, _chC.maekake); G.rect(11, 15, 1, 3, _chC.maekake); }
    else {
      G.set(7, 12, f.W); G.set(8, 12, f.W); G.set(6, 12, _chC.shopL); G.set(9, 12, _chC.shopL); G.set(7, 13, _chC.shopL);
      G.rect(4, 14, 8, 1, _chC.cord); G.rect(4, 15, 8, 3, _chC.maekake); G.rect(4, 17, 8, 1, _chC.maekakeD);
      G.set(7, 15, '#ffffff'); G.set(8, 15, '#ffffff'); G.set(7, 16, '#ffffff'); G.set(8, 16, _chC.maekakeD);
    }
  } else if (_chOut[o]) {
    _chOFront(G, f, o, back, fr);
  } else {
    G.rect(4, 15, 8, 2, _chC.shorts);
    if (!back) { G.set(7, 12, f.O); G.set(8, 12, f.O); G.rect(7, 16, 2, 1, shade(_chC.shorts, -20)); }
  }
  // arms: on the lifted-leg side the arm swings forward (paw shows, a little inward); the other swings back (paw hidden)
  const cane = x.acc === 'cane', caneArm = back ? 0 : 1;
  const hd = _chHold[x.acc], holdArm = hd ? (back ? 1 - hd[0] : hd[0]) : -9;   // a held prop keeps that arm still
  const wave = o === 'o_maneki' && fr > 2, waveArm = back ? 0 : 1;            // the lucky cat's beckoning arm (drawn later)
  [[3, 0, 4], [12, 1, 11]].forEach(([ax, i, xi]) => {
    let sw = lift === -1 ? 0 : lift === i ? 1 : -1;
    if (cane && i === caneArm) sw = 0;
    if (i === holdArm) sw = hd[1];
    if (wave && i === waveArm) return;
    const lg = _chLong[o];
    if (lg) {
      const x2 = ax === 3 ? 2 : 13, py = 12 + lg;
      G.rect(x2, 12, 1, lg + (lg === 4 ? 1 : 0) - (sw < 0 ? 1 : 0), cl.sleeve); G.rect(ax, 12, 1, lg, cl.sleeve);
      if (o === 'yukata') G.set(x2, 13, _chC.yukS);
      if (o === 'robe') G.set(x2, 12 + lg + (sw < 0 ? -1 : 0), shade(cl.m, -34));
      if (_chOut[o]) _chOSleeve(G, o, x2, ax, lg, sw);
      if (sw >= 0) G.set(ax, py, P); if (sw > 0) G.set(xi, py, P);
    } else {
      if (o === 'guest') { G.rect(ax, 12, 1, 2, cl.sleeve); G.set(ax, 14, f.O); }
      else { G.rect(ax, 12, 1, 3, cl.sleeve); if (cl.cuff) G.set(ax, 14, cl.cuff); }
      const pw = o === 'o_snow' ? _chOC.snS : P;   // snow coat: red mittens
      if (sw >= 0) G.set(ax, 15, pw); if (sw > 0) G.set(xi, 15, pw);
    }
  });
  if (_chOut[o]) _chOArms(G, f, o, back, fr);
  _chTrim(G, o, x.trim, false);
  if (!back) {
    _chHeadDown(G, f, 0); _chFaceDown(G, f, 0, x.mood || 'open');
  } else {
    // back view: tail curls out from under the hem on the right
    const s = fr === 1 ? 1 : 0;
    [[10, 17], [11, 17], [12, 17], [13, 16], [13 + s, 15], [13 + s, 14], [12 + s, 13]].forEach(p => G.set(p[0], p[1], T));
    _chHeadUp(G, f, 0);
  }
  if (_chOut[o]) _chOHead(G, f, o, 0, back ? 'up' : 'down', x.hat);
  else if (!_chCover[x.hat]) _chHatFront(G, f, o, 0, back);
  if (x.hat) _chHatOn(G, x.hat, back ? 'up' : 'down', 0);
  if (wave) _chWave(G, back ? 'up' : 'down', fr, P);
  if (bag) _chBagFront(G, back ? 1 : 12, (fr === 1) !== back ? 14 : 15);
  if (cane) _chCane(G, L, back ? 1 : 14, bob, P, false);
  else if (x.acc) _chAccFront(G, x.acc, back, fr, P);
}
// suitcase seen end-on (front/back views): handle on top, held at the side
function _chBagFront(G, x, y) {
  G.rect(x, y + 1, 3, 4, _chC.bag); G.set(x + 1, y, _chC.bagD); G.rect(x, y + 3, 3, 1, _chC.bagD); G.set(x + 1, y + 3, _chC.bagB);
}
// walking cane: crook in the paw (rides with the body), tip on the ground
function _chCane(G, L, cx, bob, P, side) {
  const dir = cx < 8 ? 1 : -1;
  for (let y = 15 - bob; y <= 18; y++) L.set(cx, y, _chC.cane);
  G.set(cx, 13, _chC.caneD); G.set(cx + dir, 13, _chC.caneD); G.set(cx, 14, _chC.cane);
  if (side) G.set(cx - 1, 14, P); else G.set(cx + dir, 15, P);
}

// ---------------------------------------------------------------- SIDE (facing right)
function _chSide(G, f, o, fr, shirt, bag, L, x) {
  L = L || G; x = x || {};
  const robe = _chRobe[o], P = f.P || f.W, cl = _chCloth(o, shirt, x.robe), T = f.T || f.O, bob = L !== G && fr === 2 ? 1 : 0;
  const tt = fr === 2 ? 1 : 0, pn = _chPants[o], ankle = _chAnkle(o, f);
  [[4, 16], [3, 16], [2, 15], [1, 14], [1, 13], [1 + tt, 12], [2 + tt, 11]].forEach(p => G.set(p[0], p[1], T));
  // legs: near (lit) and far (shaded); frame 1 = near leg forward
  const legs = fr === 1 ? [[4, 0], [10, 1]] : fr === 2 ? [[10, 0], [4, 1]] : [[6, 0], [8, 1]];
  legs.forEach(([lx, near]) => {
    const leg = pn ? pn[0] : f.O, foot = pn ? pn[1] || P : P, k = near ? 0 : -26;
    if (robe) { L.rect(lx, 18, 2, 1, shade(foot, k)); if (near) L.set(lx + 2, 18, shade(foot, k)); if (bob) L.rect(lx, 17, 2, 1, shade(ankle, k)); return; }
    L.rect(lx, 17, 2, 1, shade(leg, k)); L.rect(lx, 18, 3, 1, shade(foot, k)); if (bob) L.rect(lx, 16, 2, 1, shade(leg, k));
  });
  const bot = robe ? 17 : 16;
  G.rect(5, 12, 6, bot - 11, cl.m);
  if (robe) { G.set(4, 17, cl.m); G.set(11, 17, cl.m); }
  if (o === 'happi') { G.rect(10, 12, 1, 5, _chC.wh); G.set(11, 13, _chC.happiD); G.rect(5, 12, 2, 1, _chC.wh); }
  else if (o === 'kimono') { G.rect(5, 14, 6, 2, _chC.obi); G.rect(4, 13, 2, 3, _chC.obi); G.set(9, 15, _chC.gold); G.set(10, 12, _chC.wh); G.set(9, 13, _chC.wh); G.set(7, 16, _chC.sakura); }
  else if (o === 'robe') {
    G.rect(5, 14, 6, 2, _chC.gold); G.rect(4, 13, 2, 3, _chC.gold); G.set(9, 15, shade(cl.m, -40)); G.set(10, 12, _chC.wh); G.set(9, 13, _chC.wh);
    G.rect(4, 17, 8, 1, shade(cl.m, -34)); G.set(6, 17, mixHex(cl.m, '#ffffff', .55)); G.set(9, 17, mixHex(cl.m, '#ffffff', .55));
  }
  else if (o === 'yukata') {
    for (let y = 12; y <= 17; y++) for (let x = 4; x < 12; x++) if (_chYukPat(x, y) && G.get(x, y) === _chC.yukata) G.set(x, y, _chC.yukS);
    G.rect(5, 14, 6, 1, _chC.yukObi); G.set(4, 14, _chC.yukObi); G.set(4, 15, _chC.yukObi); G.set(10, 12, _chC.yukObi); G.set(9, 13, _chC.yukObi);
  } else if (o === 'apron') { G.rect(5, 14, 6, 1, _chC.lilacD); G.rect(9, 14, 3, 4, _chC.apron); G.set(10, 12, _chC.wh); G.set(4, 14, _chC.apron); G.set(4, 15, _chC.apron); G.set(3, 15, _chC.apron); }
  else if (o === 'porter') { G.rect(5, 15, 6, 1, _chC.belt); G.rect(5, 16, 6, 1, _chC.pants); G.set(10, 12, _chC.wh); }
  else if (o === 'chef') { G.set(10, 12, _chC.kerchief); G.set(9, 12, _chC.kerchief); G.set(11, 13, _chC.kerchief); G.set(10, 14, _chC.chefBtn); G.set(10, 16, _chC.chefBtn); }
  else if (o === 'waiter') { G.set(10, 12, _chC.samueL); G.set(9, 13, _chC.samueL); G.rect(5, 14, 6, 1, _chC.wApron); G.rect(9, 15, 3, 3, _chC.wApron); G.set(4, 14, _chC.wApron); G.set(4, 15, _chC.wApron); }
  else if (o === 'clerk' || o === 'haori') {
    const K = o === 'clerk' ? _chC.clerkK : _chC.haoriK;
    G.rect(10, 13, 1, 5, K); G.set(10, 12, K); G.set(11, 17, K); G.set(10, 14, _chC.himo); G.set(9, 14, _chC.himo);
  }
  else if (o === 'shop') { G.set(10, 12, _chC.shopL); G.set(9, 13, _chC.shopL); G.rect(5, 14, 6, 1, _chC.cord); G.rect(8, 15, 4, 3, _chC.maekake); G.set(4, 14, _chC.cord); G.set(4, 15, _chC.cord); }
  else if (_chOut[o]) _chOSide(G, f, o, fr);
  else { G.rect(5, 15, 6, 2, _chC.shorts); G.set(10, 12, f.O); }
  // near arm swings opposite to the near leg; a cane or a held prop keeps it forward, the lucky cat's wave is drawn later
  const cane = x.acc === 'cane', held = _chSideArm[x.acc], wave = o === 'o_maneki' && fr > 2;
  const a = wave ? [] : held || (cane ? [[9, 12], [10, 13], [11, 13], [12, 14]] : fr === 1 ? [[6, 12], [6, 13], [5, 14], [4, 15]] : fr === 2 ? [[9, 12], [9, 13], [10, 14], [11, 15]] : [[7, 12], [7, 13], [7, 14], [7, 15]]);
  const lg = _chLong[o];
  a.forEach((p, i) => {
    let c = cl.sleeve;
    if (i === 3) c = o === 'o_snow' ? _chOC.snS : P; else if (i === 2 && o === 'guest') c = f.O; else if (i === 2 && cl.cuff) c = cl.cuff;
    G.set(p[0], p[1], c);
    if (lg && i > 0 && i < 3 && !cane && !held) G.set(p[0] - (fr === 1 ? -1 : 1), p[1] + 1, cl.sleeve);
    if (lg && (cane || held) && i === 1) G.set(p[0] - 1, p[1] + 1, cl.sleeve);
  });
  if (_chOut[o]) _chOArmsSide(G, f, o, fr);
  _chTrim(G, o, x.trim, true);
  if (x.acc === 'rod') _chRodSide(G);   // the rod rests on the shoulder, behind the head
  _chHeadSide(G, f, 0);
  if (_chOut[o]) _chOHead(G, f, o, 0, 'side', x.hat);
  else if (!_chCover[x.hat]) _chHatSide(G, f, o, 0);
  if (x.hat) _chHatOn(G, x.hat, 'side', 0);
  if (wave) _chWave(G, 'side', fr, P);
  if (bag) {
    const bx = fr === 2 ? 9 : fr === 1 ? 3 : 6, by = 14;
    G.rect(bx, by + 1, 5, 4, _chC.bag); G.set(bx + 1, by, _chC.bagD); G.set(bx + 3, by, _chC.bagD);
    G.rect(bx, by + 3, 5, 1, _chC.bagD); G.set(bx + 2, by + 3, _chC.bagB);
  }
  if (cane) _chCane(G, L, 14, bob, P, true);
  else if (x.acc && x.acc !== 'rod') _chAccSide(G, x.acc, fr, P);
}

// ---------------------------------------------------------------- v2.1 innkeeper outfits (o_*, SPEC_v2 16.6)
// Same skeleton as the staff outfits (robe = hem down to the feet, _chLong = hanging sleeves, _chPants = [leg, foot]);
// these add the details over the shared body. Every one keeps the innkeeper's own orange head and face.
function _chAnkle(o, f) { return o === 'waiter' ? _chC.samue : o === 'o_hakama' ? _chOC.hkH : o === 'o_samurai' ? _chOC.smG : f.O; }
function _chOFront(G, f, o, back, fr) {
  const C = _chOC, S = (x, y, c) => G.set(x, y, c), pts = (L, c) => L.forEach(p => G.set(p[0], p[1], c));
  const collar = (k, inner) => { S(7, 12, f.W); S(8, 12, f.W); S(6, 12, k); S(9, 12, k); S(7, 13, inner || k); };
  if (o === 'o_yukata') {
    // morning-glory yukata: indigo with pink and sky-blue blooms, a soft yellow obi tied in a big bow at the back
    if (back) {
      G.rect(6, 12, 4, 1, C.ygCol); G.rect(4, 14, 8, 1, C.ygObi);
      pts([[5, 13], [6, 13], [9, 13], [10, 13], [6, 15], [9, 15], [7, 15]], C.ygObi); pts([[5, 15], [10, 15], [7, 14], [8, 14], [8, 16]], C.ygObiD);
      S(5, 17, C.ygF1); S(10, 16, C.ygF2);
    } else {
      collar(C.ygCol); G.rect(4, 14, 8, 1, C.ygObi); S(8, 14, C.ygObiD);
      S(5, 13, C.ygF1); S(9, 16, C.ygF1); S(10, 13, C.ygF2); S(5, 16, C.ygLeaf);
    }
  } else if (o === 'o_chef') {
    // kappogi: a white smock with sleeves over a wine kimono (its collar and hem show); ties at the back
    G.rect(4, 16, 8, 1, C.kpS); G.rect(4, 17, 8, 1, C.kpK);
    if (back) { G.rect(6, 12, 4, 1, C.kpK); pts([[6, 14], [9, 14], [7, 15], [8, 15]], C.kpS); S(7, 14, C.kpK); S(8, 14, C.kpK); }
    else { collar(C.kpK, C.kpK); S(8, 13, C.kpW); pts([[5, 14], [10, 14]], C.kpS); }
  } else if (o === 'o_momiji') {
    // red-leaf haori: crimson jacket open over a dark kimono (longer, so it shows at the hem), gold and orange maple leaves
    const K = C.mjK;
    G.rect(4, 17, 8, 1, K);
    if (back) {
      G.rect(6, 12, 4, 1, shade(C.mjR, -30));
      pts([[7, 13], [8, 13], [6, 14], [9, 14], [7, 15], [8, 15]], C.mjL1); pts([[7, 14], [8, 14]], C.mjL2); S(8, 16, C.mjL2);
      pts([[4, 16], [11, 13]], C.mjL2);
    } else {
      S(7, 12, f.W); S(8, 12, f.W); S(6, 12, K); S(9, 12, K); G.rect(7, 13, 2, 5, K);
      pts([[6, 14], [7, 14], [8, 14], [9, 14]], _chC.himo);
      pts([[5, 13], [10, 16]], C.mjL1); pts([[10, 12], [5, 16]], C.mjL2);
    }
  } else if (o === 'o_snow') {
    // snow-country coat: teal padded coat, white fluffy hem, red knitted scarf (and mittens, boots)
    G.rect(4, 16, 8, 1, C.snF);
    if (back) {
      G.rect(5, 12, 6, 1, C.snF); G.rect(6, 13, 4, 1, C.snCL); S(4, 12, C.snS); S(11, 12, C.snS);   // the hood lies on the shoulders
      pts([[5, 13], [5, 14]], C.snS); S(5, 15, C.snSD);
    } else {
      G.rect(4, 12, 8, 1, C.snS); pts([[5, 12], [8, 12]], C.snSD); pts([[9, 13], [9, 14]], C.snS); S(9, 15, C.snSD);
      G.rect(7, 13, 1, 3, C.snCL); pts([[6, 13], [6, 15]], C.snTog);
    }
  } else if (o === 'o_hakama') {
    // student: blue kasuri kimono, white under-collar, a brown striped hakama tied high
    G.rect(4, 14, 8, 4, C.hkH); G.rect(4, 14, 8, 1, C.hkHD);
    if (back) { pts([[5, 13], [10, 13], [7, 12]], C.hkTd); G.rect(6, 14, 4, 2, C.hkHD); pts([[6, 14], [9, 14]], _chC.himo); pts([[5, 16], [5, 17], [10, 16], [10, 17]], C.hkHD); }
    else {
      collar(_chC.wh); pts([[5, 13], [10, 13], [4, 12]], C.hkTd);
      pts([[7, 14], [8, 14]], _chC.himo); pts([[6, 16], [6, 17], [9, 16], [9, 17]], C.hkHD);
    }
  } else if (o === 'o_ninja') {
    // ninja: night-indigo suit, crossed collar, red sash (the hood is headwear: _chOHead)
    G.rect(4, 15, 8, 1, C.njR);
    if (back) { G.rect(6, 12, 4, 1, C.njL); pts([[7, 15], [8, 15]], C.snSD); pts([[7, 16], [8, 16]], C.njR); }
    else { pts([[9, 12], [8, 13], [7, 14]], C.njL); S(6, 12, C.njL); S(8, 15, C.snSD); S(9, 16, C.njR); }
  } else if (o === 'o_samurai') {
    // kamishimo: pine-green winged vest and hakama over a cream kimono, white crests (wings + sword: _chOArms)
    G.rect(4, 15, 8, 1, C.smGD);
    if (back) { pts([[7, 13], [8, 13]], C.smCrest); G.rect(6, 12, 4, 1, C.smK); pts([[6, 16], [6, 17], [9, 16], [9, 17]], C.smGD); }
    else {
      S(7, 12, f.W); S(8, 12, f.W); S(6, 12, C.smK); S(9, 12, C.smK); S(7, 13, C.smK); S(8, 13, C.smK); S(7, 14, C.smK); S(8, 14, C.smK);
      pts([[5, 13], [10, 13]], C.smCrest); pts([[6, 16], [6, 17], [9, 16], [9, 17]], C.smGD);
    }
  } else if (o === 'o_maneki') {
    // lucky-cat costume: white suit with calico patches, red collar, a big gold bell
    G.rect(4, 12, 8, 1, C.mkR);
    if (back) { pts([[7, 13], [8, 13]], C.mkR); pts([[5, 14], [6, 14], [5, 15]], C.mkB); pts([[9, 15], [10, 15], [10, 16], [9, 16]], C.mkO); }
    else {
      pts([[7, 13], [8, 13]], C.mkG); pts([[7, 14], [8, 14]], C.mkGD);
      pts([[5, 15], [6, 15], [5, 16]], C.mkO); pts([[10, 14], [10, 15]], C.mkB);
    }
  }
}
// pattern on the hanging sleeves (outer column x2, inner ax)
function _chOSleeve(G, o, x2, ax, lg, sw) {
  const C = _chOC;
  if (o === 'o_yukata') G.set(x2, 13, x2 < 8 ? C.ygF2 : C.ygF1);
  else if (o === 'o_momiji') G.set(x2, 14, C.mjL1);
  else if (o === 'o_hakama') G.set(x2, 13, C.hkTd);
  else if (o === 'o_chef') G.set(ax, 12 + lg - 1, C.kpS);   // gathered at the wrist
}
// over the arms: the samurai's shoulder wings and sword hilt
function _chOArms(G, f, o, back, fr) {
  const C = _chOC;
  if (o === 'o_samurai') {
    G.rect(0, 12, 4, 1, C.smG); G.rect(12, 12, 4, 1, C.smG); G.rect(1, 11, 2, 1, C.smG); G.rect(13, 11, 2, 1, C.smG);
    if (back) { G.set(4, 15, C.smTsuba); G.set(3, 14, C.smHilt); G.set(2, 13, C.smHilt); }
    else { G.set(11, 15, C.smTsuba); G.set(12, 14, C.smHilt); G.set(13, 13, C.smHilt); }
  }
}
function _chOSide(G, f, o, fr) {
  const C = _chOC, S = (x, y, c) => G.set(x, y, c), pts = (L, c) => L.forEach(p => G.set(p[0], p[1], c));
  if (o === 'o_yukata') {
    G.rect(5, 14, 6, 1, C.ygObi); pts([[4, 13], [3, 13], [3, 15], [4, 15]], C.ygObi); S(4, 14, C.ygObiD);
    S(10, 12, C.ygCol); S(9, 13, C.ygCol); pts([[6, 13], [9, 16]], C.ygF1); pts([[6, 16]], C.ygF2); S(7, 17, C.ygLeaf);
  } else if (o === 'o_chef') {
    G.rect(4, 16, 8, 1, C.kpS); G.rect(4, 17, 8, 1, C.kpK); S(10, 12, C.kpK); S(9, 13, C.kpK); S(9, 15, C.kpS);
    pts([[4, 14], [3, 14], [3, 15]], C.kpS);   // apron ties at the back
  } else if (o === 'o_momiji') {
    G.rect(4, 17, 8, 1, C.mjK); G.rect(10, 13, 1, 4, C.mjK); S(10, 12, C.mjK); S(10, 14, _chC.himo); S(9, 14, _chC.himo);
    pts([[6, 13], [8, 16]], C.mjL1); pts([[5, 15]], C.mjL2);
  } else if (o === 'o_snow') {
    G.rect(5, 16, 6, 1, C.snF); G.rect(6, 12, 5, 1, C.snS); S(10, 13, C.snS); S(10, 14, C.snS); S(10, 15, C.snSD);
    S(5, 12, C.snF); S(4, 12, C.snF); S(4, 13, C.snF);   // hood down at the back
    S(9, 13, C.snTog); S(9, 15, C.snTog);
  } else if (o === 'o_hakama') {
    G.rect(4, 14, 8, 4, C.hkH); G.rect(5, 14, 6, 1, C.hkHD); S(4, 14, C.hkHD); S(3, 14, C.hkHD); S(4, 15, C.hkHD);
    S(10, 12, _chC.wh); S(9, 13, _chC.wh); S(6, 13, C.hkTd); pts([[7, 16], [7, 17]], C.hkHD); S(10, 14, _chC.himo);
  } else if (o === 'o_ninja') {
    G.rect(5, 15, 6, 1, C.njR); S(4, 15, C.snSD); S(3, 16, C.njR); S(10, 12, C.njL); S(9, 13, C.njL);
  } else if (o === 'o_samurai') {
    G.rect(5, 15, 6, 1, C.smGD); S(10, 12, C.smK); S(9, 13, C.smK); S(10, 13, C.smK); S(7, 13, C.smCrest); pts([[6, 16], [6, 17], [9, 16], [9, 17]], C.smGD);
  } else if (o === 'o_maneki') {
    G.rect(6, 12, 5, 1, C.mkR); S(10, 13, C.mkG); S(11, 13, C.mkG); S(10, 14, C.mkGD); S(11, 14, C.mkGD);
    pts([[6, 14], [7, 14], [6, 15]], C.mkO); pts([[8, 16], [9, 16]], C.mkB);
  }
}
// over the near arm (side view): wings and the sword at the waist, hilt forward, scabbard slanting back
function _chOArmsSide(G, f, o, fr) {
  const C = _chOC;
  if (o === 'o_samurai') {
    G.set(4, 12, C.smG); G.set(3, 12, C.smG); G.set(11, 12, C.smG); G.set(12, 12, C.smG); G.set(3, 11, C.smG); G.set(12, 11, C.smG);
    gLine(G, 9, 15, 3, 17, C.smSheath); G.set(10, 14, C.smTsuba); G.set(11, 13, C.smHilt); G.set(12, 12, C.smHilt);
  }
}
function _chOSit(G, f, o) {
  const C = _chOC;
  if (o === 'o_yukata') { G.rect(5, 16, 6, 1, C.ygObi); G.set(10, 14, C.ygCol); G.set(7, 15, C.ygF1); G.set(11, 17, C.ygF2); }
  else if (o === 'o_chef') { G.set(10, 14, C.kpK); G.rect(5, 18, 9, 1, C.kpK); }
  else if (o === 'o_momiji') { G.rect(10, 14, 1, 3, C.mjK); G.set(10, 15, _chC.himo); G.set(7, 15, C.mjL1); }
  else if (o === 'o_snow') { G.rect(5, 14, 6, 1, C.snS); G.rect(5, 16, 6, 1, C.snF); }
  else if (o === 'o_hakama') { G.set(10, 14, _chC.wh); G.rect(5, 16, 6, 1, C.hkHD); }
  else if (o === 'o_ninja') { G.rect(5, 16, 6, 1, C.njR); G.set(10, 14, C.njL); }
  else if (o === 'o_samurai') { G.set(10, 14, C.smK); G.set(4, 14, C.smG); G.set(11, 14, C.smG); G.set(7, 15, C.smCrest); }
  else if (o === 'o_maneki') { G.rect(5, 14, 6, 1, C.mkR); G.set(10, 15, C.mkG); }
}
// the outfit's own headwear: ninja hood (always, hats go over it; red band unless the hat covers it); kappogi kerchief,
// snow beanie, student cap (replaced by any hat that sits on top: _chTopHat); red-leaf pin (replaced like the kimono's)
function _chOHead(G, f, o, oy, v, hat) {
  const C = _chOC, S = (x, y, c) => G.set(x, y + oy, c), Rr = (x, y, w, h, c) => G.rect(x, y + oy, w, h, c), K = (x, y) => G.clr(x, y + oy);
  const side = v === 'side', back = v === 'up';
  if (o === 'o_ninja') {
    const H = C.njS;
    if (side) { Rr(3, 3, 6, 1, H); Rr(2, 4, 12, 2, H); Rr(2, 6, 7, 4, H); Rr(3, 10, 6, 1, H); Rr(4, 11, 5, 1, H); }
    else if (back) { Rr(4, 3, 8, 1, H); Rr(2, 4, 12, 6, H); Rr(3, 10, 10, 1, H); Rr(4, 11, 8, 1, H); }
    else { Rr(4, 3, 8, 1, H); Rr(2, 4, 12, 2, H); Rr(2, 6, 1, 4, H); Rr(13, 6, 1, 4, H); S(3, 10, H); S(12, 10, H); }
    if (_chCover[hat]) return;
    const B = C.njR;
    if (side) { Rr(2, 5, 12, 1, B); S(1, 5, B); S(1, 6, B); S(0, 7, B); }
    else { Rr(2, 5, 12, 1, B); if (back) { S(2, 4, B); S(1, 4, B); S(1, 6, B); } else { S(13, 4, B); S(14, 4, B); S(14, 6, B); } }
    return;
  }
  if (o === 'o_momiji') {
    if (_chCover[hat]) return;
    const leaf = (cx, cy) => { S(cx, cy, C.mjR); S(cx - 1, cy + 1, C.mjR); S(cx + 1, cy + 1, C.mjR); S(cx, cy + 1, C.mjL1); S(cx, cy + 2, C.mjL2); };
    if (side) leaf(6, 2); else leaf(back ? 4 : 11, 3);
    return;
  }
  if (_chTopHat[hat]) return;
  if (o === 'o_chef') {
    const W = C.kpScarf, D = C.kpS;
    const Dt = C.kpDot;
    if (side) { Rr(3, 3, 6, 1, W); Rr(2, 4, 11, 1, W); Rr(2, 5, 3, 1, W); S(1, 5, Dt); S(1, 6, W); S(0, 7, W); [[4, 3], [7, 4], [10, 4], [3, 5]].forEach(p => S(p[0], p[1], Dt)); }
    else if (back) { Rr(4, 3, 8, 1, W); Rr(2, 4, 12, 1, W); Rr(3, 5, 10, 1, W); Rr(5, 6, 6, 1, W); S(7, 7, Dt); S(8, 7, Dt); S(6, 8, W); S(9, 8, W); [[5, 3], [9, 3], [3, 4], [7, 4], [11, 4], [5, 5], [9, 5], [7, 6]].forEach(p => S(p[0], p[1], Dt)); }
    else { Rr(4, 3, 8, 1, W); Rr(2, 4, 12, 1, W); [[5, 3], [9, 3], [3, 4], [7, 4], [11, 4]].forEach(p => S(p[0], p[1], Dt)); }
  } else if (o === 'o_snow') {
    const R0 = C.snS, D = C.snSD, F = C.snF;
    if (side) { Rr(4, 2, 5, 1, R0); Rr(3, 3, 6, 1, R0); Rr(2, 4, 11, 1, R0); Rr(2, 5, 11, 1, F); Rr(5, 0, 2, 2, F); S(5, 4, D); S(8, 4, D); S(11, 4, D); }
    else {
      Rr(5, 2, 6, 1, R0); Rr(4, 3, 8, 1, R0); Rr(2, 4, 12, 1, R0); Rr(2, 5, 12, 1, F); Rr(7, 0, 2, 2, F);
      [4, 7, 10].forEach(x => S(x + (back ? 1 : 0), 4, D)); S(6, 3, D); S(9, 3, D);
    }
  } else if (o === 'o_hakama') {
    const Cp = C.hkCap, Ln = C.hkLine;
    if (side) {
      [[4, 1], [4, 2], [5, 2], [4, 3], [5, 3], [6, 3], [9, 1], [9, 2], [10, 2], [9, 3], [10, 3], [11, 3]].forEach(p => K(p[0], p[1]));
      Rr(3, -1, 8, 1, Cp); Rr(2, 0, 10, 2, Cp); Rr(2, 2, 10, 1, Ln); Rr(2, 3, 10, 1, Cp); Rr(9, 4, 5, 1, C.hkVis); S(10, 0, _chC.gold);
    } else {
      [[3, 1], [3, 2], [12, 1], [12, 2]].forEach(p => K(p[0], p[1]));
      Rr(4, -1, 8, 1, Cp); Rr(3, 0, 10, 2, Cp); Rr(3, 2, 10, 1, Ln); Rr(3, 3, 10, 1, Cp);
      if (!back) { Rr(4, 4, 8, 1, C.hkVis); S(7, 0, _chC.gold); S(8, 0, _chC.gold); }
    }
  }
}
// o_maneki frames 3 / 4: the beckoning paw raised by the face (palm out, pink pad), 4 = bent down to beckon
function _chWave(G, v, fr, P) {
  const W = _chOC.mkW, S = (x, y, c) => G.set(x, y, c), pad = _chC.pink, up = fr === 3;
  if (v === 'side') {
    S(9, 12, W); S(10, 11, W); S(11, 10, W);
    if (up) { S(11, 9, W); S(12, 8, P); S(13, 8, P); S(12, 7, P); S(13, 7, P); S(13, 8, pad); }
    else { S(12, 9, P); S(13, 9, P); S(13, 10, P); S(12, 10, P); }
  } else {
    const back = v === 'up', ax = back ? 3 : 12, d = back ? -1 : 1, px = ax + d;
    S(ax, 12, W); S(px, 11, W); S(px, 10, W);
    if (up) { S(px, 9, W); S(px, 8, P); S(px + d, 8, P); S(px, 7, P); S(px + d, 7, P); if (!back) S(px, 8, pad); }
    else { S(px, 9, P); S(px + d, 9, P); S(px + d, 10, P); }
  }
}

// ---------------------------------------------------------------- accessories (look.acc), SPEC_v2 16.14
// rod (fishing grandpa), palette (painter), camera (reporter, on a strap), mic (TV host), bundle (cat mom's furoshiki),
// tvcam (the cameraman's shoulder camera). cane stays where it was (_chCane).
const _chSideArm = {   // near arm (side view) holding a prop: shoulder, elbow, cuff, paw
  rod: [[7, 12], [8, 13], [9, 13], [10, 13]], palette: [[9, 12], [10, 13], [11, 13], [12, 14]],
  mic: [[9, 12], [10, 13], [11, 13], [12, 12]], tvcam: [[9, 12], [10, 12], [11, 12], [12, 12]],
};
function _chAccFront(G, acc, back, fr, P) {
  const C = _chOC, S = (x, y, c) => G.set(x, y, c), Rr = (x, y, w, h, c) => G.rect(x, y, w, h, c);
  if (acc === 'rod') {
    if (back) { gLine(G, 3, 14, 1, 0, C.rod); S(2, 7, C.rodD); S(1, 2, C.rodD); S(3, 15, P); }
    else { gLine(G, 12, 14, 14, 0, C.rod); S(13, 7, C.rodD); S(14, 2, C.rodD); S(12, 15, P); }
  } else if (acc === 'palette') {
    if (back) { Rr(12, 14, 4, 2, C.palD); S(13, 16, C.palD); }
    else {
      Rr(0, 14, 4, 2, C.pal); S(1, 16, C.pal); S(2, 16, C.palD);
      S(0, 14, C.pR); S(1, 14, C.pB); S(2, 14, C.pY); S(0, 15, C.pG); S(3, 15, P);
      S(12, 3, C.brush); S(13, 2, C.brush); S(14, 1, C.pR);   // brush tucked behind the ear
    }
  } else if (acc === 'camera') {
    if (back) { S(5, 12, C.strap); S(10, 12, C.strap); }
    else {
      S(5, 12, C.strap); S(10, 12, C.strap); Rr(6, 13, 4, 3, C.cam); S(6, 13, C.camL); S(9, 13, '#ffffff');
      Rr(7, 14, 2, 2, C.lens); S(7, 14, '#c4e2ff'); S(8, 15, C.lensD);
    }
  } else if (acc === 'mic') {
    if (!back) { Rr(11, 10, 2, 2, C.micD); S(11, 10, C.mic); Rr(11, 12, 2, 1, C.micF); S(11, 13, C.micH); S(11, 14, P); }
  } else if (acc === 'bundle') {
    const x = back ? 1 : 12, y = (fr === 1) !== back ? 14 : 15;
    Rr(x, y + 1, 3, 3, C.furo); S(x, y, C.furo); S(x + 2, y, C.furo); S(x + 1, y + 1, C.furoD);
    S(x, y + 2, C.furoW); S(x + 2, y + 3, C.furoW); S(x + 1, y + 3, C.furoD);
  } else if (acc === 'tvcam') {
    const x0 = back ? 0 : 11;
    Rr(x0, 8, 5, 4, C.tv); Rr(x0 + 1, 7, 3, 1, C.tvD); Rr(x0, 11, 5, 1, C.tvD);
    if (back) { S(x0, 8, C.rec); S(x0 + 3, 9, C.tvD); S(x0 + 3, 10, C.tvD); }
    else { Rr(x0 + 1, 8, 2, 2, C.tvL); S(x0 + 1, 8, '#7aa8e0'); S(x0 + 4, 8, C.rec); }
  }
}
function _chRodSide(G) {
  const C = _chOC;
  gLine(G, 10, 13, 1, -3, C.rod); G.set(3, 0, C.rodD);
  for (let y = -2; y <= 4; y++) G.set(0, y, C.line);
  G.set(0, 5, C.float); G.set(0, 6, '#ffffff');
}
function _chAccSide(G, acc, fr, P) {
  const C = _chOC, S = (x, y, c) => G.set(x, y, c), Rr = (x, y, w, h, c) => G.rect(x, y, w, h, c);
  if (acc === 'palette') {
    Rr(11, 15, 4, 1, C.pal); Rr(12, 16, 3, 1, C.palD); S(12, 15, C.pR); S(13, 15, C.pB); S(14, 15, C.pY); S(12, 14, P);
    S(6, 2, C.brush); S(5, 1, C.brush); S(4, 0, C.pR);
  } else if (acc === 'camera') {
    S(9, 12, C.strap); Rr(10, 13, 2, 3, C.cam); S(10, 13, C.camL); S(12, 14, C.lens); S(12, 15, C.lensD); S(12, 13, C.cam);
  } else if (acc === 'mic') {
    S(13, 12, C.micH); S(13, 11, C.micF); S(14, 11, C.micF); Rr(14, 9, 2, 2, C.micD); S(14, 9, C.mic);
  } else if (acc === 'bundle') {
    const bx = fr === 2 ? 9 : fr === 1 ? 3 : 6, by = 14;
    Rr(bx, by + 1, 4, 3, C.furo); S(bx, by, C.furo); S(bx + 3, by, C.furo); S(bx + 1, by + 1, C.furoD); S(bx + 2, by + 1, C.furoD);
    S(bx + 1, by + 3, C.furoW); S(bx + 3, by + 2, C.furoW); S(bx, by + 2, C.furoW);
  } else if (acc === 'tvcam') {
    Rr(6, 9, 8, 3, C.tv); Rr(7, 8, 4, 1, C.tvD); Rr(6, 11, 8, 1, C.tvD); Rr(14, 9, 2, 3, C.tvL); S(14, 9, '#7aa8e0'); S(6, 9, C.rec);
  }
}

// ---------------------------------------------------------------- SITTING (dining seat, facing right; core flips for left)
// 16x24, anchor (8,23). Kneeling (seiza) on a cushion: the head drops 2px, thighs run forward, soles tucked behind.
// frame 0 sits, 1 holds the rice bowl to the mouth, 2 sips tea, 3 (extra) lowers the bowl to chew - 1 and 3 alternate
// without the bowl popping in and out.
function catSit(frame, look) {
  look = look || {};
  const fur = FURS[look.fur] ? look.fur : 'orange', outfit = look.outfit || 'guest', shirt = look.shirt || '#e0705a';
  const fr = frame === 1 || frame === 2 || frame === 3 ? frame : 0, x = _chExtra(look, outfit);
  return art('cht:' + fr + ':' + fur + ':' + outfit + ':' + (outfit === 'guest' || !_chKnown[outfit] ? shirt : '') + ':' + x.hat + ':' + x.trim + ':' + x.robe +
    ':' + x.acc + ':' + x.uni, () => {
    const f = FURS[fur];
    let o = outfit, xx = x;
    if (o === 'mom') { o = 'apron'; xx = Object.assign({}, x, { uni: 'mom', trim: 0 }); }
    const c = paint(16, 24, Gr => {
      _chSitBody(_chShift(Gr, 4), f, o, fr, shirt, xx);
      if (xx.uni) { const mp = _chUniMap(o, xx.uni); Gr.map((px, py, col) => mp[col]); }
    });
    _chWhiskersSide(c, f, 6);
    if (outfit === 'clerk' && x.hat !== 'shades') _chGlasses(c, 'side', 6);
    _chShadow(c, 8, 23, 6);
    return c;
  });
}
function _chSitBody(G, f, o, fr, shirt, x) {
  const P = f.P || f.W, T = f.T || f.O, cl = _chCloth(o, shirt, x.robe), robe = _chRobe[o], pn = _chPants[o], oy = 2;
  // lower garment colour on the lap
  const lap = robe ? (o === 'o_hakama' ? _chOC.hkH : o === 'o_chef' ? _chOC.kpK : cl.m) : _chOut[o] ? cl.m : pn ? pn[0] : o === 'guest' || !_chKnown[o] ? _chC.shorts : f.O;
  // tail lies on the floor behind and curls up
  [[3, 18], [2, 18], [1, 17], [1, 16], [2, 15]].forEach(p => G.set(p[0], p[1], T));
  // soles tucked under the seat
  G.set(4, 18, P); G.set(4, 17, P);
  // thighs forward + knee
  G.rect(5, 17, 8, 1, lap); G.rect(5, 18, 9, 1, shade(lap, -16)); G.set(13, 17, lap);
  if (!robe && !pn && lap !== f.O) { G.rect(10, 17, 4, 1, f.O); G.rect(9, 18, 5, 1, shade(f.O, -16)); }   // shorts end above the knee
  if (!robe && !pn && o === 'happi') { G.rect(5, 17, 3, 1, cl.m); }
  // torso
  G.rect(5, 14, 6, 3, cl.m);
  if (o === 'happi') { G.rect(10, 14, 1, 3, _chC.wh); G.rect(5, 14, 2, 1, _chC.wh); }
  else if (o === 'kimono' || o === 'robe') { const ob = o === 'robe' ? _chC.gold : _chC.obi; G.rect(5, 16, 6, 1, ob); G.rect(4, 15, 2, 2, ob); G.set(10, 14, _chC.wh); if (o === 'robe') G.rect(5, 18, 9, 1, shade(cl.m, -34)); }
  else if (o === 'yukata') { for (let y = 14; y <= 18; y++) for (let xx = 5; xx < 14; xx++) if (_chYukPat(xx, y) && G.get(xx, y) === _chC.yukata) G.set(xx, y, _chC.yukS); G.rect(5, 16, 6, 1, _chC.yukObi); G.set(10, 14, _chC.yukObi); }
  else if (o === 'apron') { G.rect(5, 16, 6, 1, _chC.lilacD); G.rect(8, 17, 6, 1, _chC.apron); G.rect(9, 18, 5, 1, _chC.apron); G.set(10, 14, _chC.wh); }
  else if (o === 'waiter') { G.rect(5, 16, 6, 1, _chC.wApron); G.rect(8, 17, 6, 1, _chC.wApron); G.set(10, 14, _chC.samueL); }
  else if (o === 'shop') { G.rect(5, 16, 6, 1, _chC.cord); G.rect(8, 17, 6, 2, _chC.maekake); G.set(10, 14, _chC.shopL); }
  else if (o === 'clerk' || o === 'haori') { const K = o === 'clerk' ? _chC.clerkK : _chC.haoriK; G.rect(10, 14, 1, 3, K); G.set(10, 15, _chC.himo); }
  else if (o === 'porter') { G.rect(5, 16, 6, 1, _chC.belt); G.set(10, 14, _chC.wh); }
  else if (o === 'chef') { G.set(10, 14, _chC.kerchief); G.set(9, 14, _chC.kerchief); G.set(10, 16, _chC.chefBtn); }
  else if (_chOut[o]) _chOSit(G, f, o);
  else { G.set(10, 14, f.O); }
  if (x.acc === 'camera') { G.set(9, 14, _chOC.strap); G.rect(9, 15, 2, 2, _chOC.cam); G.set(11, 15, _chOC.lens); G.set(9, 15, _chOC.camL); }
  // head (dropped 2px)
  _chHeadSide(G, f, oy);
  if (fr !== 0) { const L = _chLid(f); G.set(11, 7 + oy, f.O); G.set(11, 8 + oy, L); G.set(10, 8 + oy, L); }
  if (_chOut[o]) _chOHead(G, f, o, oy, 'side', x.hat);
  else if (!_chCover[x.hat]) _chHatSide(G, f, o, oy);
  if (x.hat) _chHatOn(G, x.hat, 'side', oy);
  // near arm + what it holds
  const sl = cl.sleeve, lg = _chLong[o];
  if (fr === 0) { G.set(7, 14, sl); G.set(8, 15, sl); G.set(9, 16, P); if (lg) G.set(7, 15, sl); }
  else if (fr === 1) {
    G.set(8, 14, sl); G.set(9, 14, sl); if (lg) G.set(8, 15, sl);
    G.rect(12, 11, 3, 1, _chC.rice); G.rect(11, 12, 4, 1, _chC.bowl); G.rect(12, 13, 2, 1, _chC.bowlD); G.set(10, 13, P);
  } else if (fr === 2) {
    G.set(8, 14, sl); G.set(9, 14, sl); if (lg) G.set(8, 15, sl);
    G.rect(12, 11, 2, 1, _chC.cupL); G.rect(12, 12, 2, 2, _chC.cup); G.set(11, 13, P);
  } else {
    G.set(7, 14, sl); G.set(8, 15, sl); if (lg) G.set(7, 15, sl);
    G.rect(10, 14, 3, 1, _chC.rice); G.rect(9, 15, 4, 1, _chC.bowl); G.rect(10, 16, 2, 1, _chC.bowlD); G.set(9, 16, P);
  }
}

// ---------------------------------------------------------------- bathing / sleeping / bowing
// 18x12, anchor (9,9) = middle of the water line. Head + shoulders, folded towel on top, content squint.
// water (v2.0.1, optional): the bath the cat sits in tints its water line: default = the jade onsen, 'milky' = the
// star-view bath, 'tub' = a suite's clear hinoki tub
const _CH_BATHW = { jade: ['rgba(46,150,130,0.55)', '#e6faf2', '#86dcc4'], milky: ['rgba(214,226,226,0.7)', '#ffffff', '#c9d8d9'], tub: ['rgba(58,166,180,0.55)', '#e8fbf8', '#8ae0dc'] };
function catBathing(fur, frame, water) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid], fr = frame ? 1 : 0, wk = _CH_BATHW[water] ? water : 'jade', WC = _CH_BATHW[wk];
  return art('chb:' + fid + ':' + fr + ':' + wk, () => {
    const oy = fr ? 0 : 1;   // frame 0 breathes out and sinks 1px, frame 1 rises
    const c = paint(18, 12, G => {
      const S = (x, y, col) => G.set(x, y + oy, col), ear = f.ear || f.O;
      G.ell(9, 10.5 + oy, 7, 2.2, f.O);                       // shoulders just breaking the water
      S(4, 1, ear); S(4, 2, ear); S(5, 2, ear); S(13, 1, ear); S(13, 2, ear); S(12, 2, ear);
      S(5, 2, _chC.pink); S(12, 2, _chC.pink);
      G.rect(4, 3 + oy, 10, 1, f.O); G.rect(3, 4 + oy, 12, 4, f.O); G.rect(4, 8 + oy, 10, 1, f.O);
      if (f.stripes) [[3, 6], [14, 6], [3, 7], [14, 7]].forEach(p => S(p[0], p[1], f.D));
      if (f.patch) { G.ell(5, 4.5 + oy, 2.4, 2, f.D); S(4, 1, f.D); S(4, 2, f.D); if (f.D2) { S(13, 1, f.D2); S(13, 2, f.D2); S(13, 3, f.D2); S(12, 3, f.D2); } }
      if (f.points) { G.ell(9, 7.4 + oy, 2.8, 1.5, mixHex(f.O, f.D, .55)); }
      G.rect(6, 1 + oy, 6, 3, _chC.towel); G.rect(6, 2 + oy, 6, 1, '#4a8ad8');   // folded towel
      const eyeC = _chLid(f);
      S(5, 5, eyeC); S(6, 6, eyeC); S(7, 5, eyeC); S(10, 5, eyeC); S(11, 6, eyeC); S(12, 5, eyeC);
      S(4, 7, _chC.blush); S(5, 7, _chC.blush); S(12, 7, _chC.blush); S(13, 7, _chC.blush);
      const M = f.points ? mixHex(f.O, f.D, .55) : (f.M || f.W);
      S(7, 7, M); S(10, 7, M); G.rect(7, 8 + oy, 4, 1, M);
      S(8, 7, f.points ? f.D : _chC.nose); S(9, 7, f.points ? f.D : _chC.nose);
    });
    const x = c.getContext('2d');
    x.save(); x.globalCompositeOperation = 'source-atop';      // below the water line: tinted by the water
    x.fillStyle = WC[0]; x.fillRect(0, 10, 18, 2);
    x.restore();
    _chPx(c, WC[1], [[1, 9], [2, 10], [16, 9], [15, 10], [4, 11], [13, 11]]);
    _chPx(c, WC[2], [[0, 10], [17, 10], [3, 11], [14, 11]]);
    _chPx(c, _chTip, [[1, 7 + oy], [2, 7 + oy], [15, 7 + oy], [16, 7 + oy]]);
    return c;
  });
}

// 12x9, anchor (6,8): sleeping face for the pillow; the futon's quilt is drawn over its lower part
function catSleepHead(fur) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid];
  return art('chs:' + fid, () => paint(12, 9, G => {
    const ear = f.ear || f.O;
    G.set(2, 1, ear); G.set(2, 2, ear); G.set(3, 2, _chC.pink); G.set(9, 1, ear); G.set(9, 2, ear); G.set(8, 2, _chC.pink);
    G.rect(2, 3, 8, 1, f.O); G.rect(1, 4, 10, 4, f.O); G.rect(2, 8, 8, 1, f.O);
    if (f.stripes) [[5, 3], [6, 3], [5, 4], [6, 4]].forEach(p => G.set(p[0], p[1], f.D));
    if (f.patch) { G.ell(3, 4, 2.2, 1.8, f.D); G.set(2, 1, f.D); G.set(2, 2, f.D); if (f.D2) { G.set(9, 1, f.D2); G.set(9, 2, f.D2); G.set(8, 3, f.D2); G.set(9, 3, f.D2); } }
    if (f.points) G.ell(6, 6.8, 2.6, 1.4, mixHex(f.O, f.D, .55));
    const L = _chLid(f); G.set(2, 5, L); G.set(3, 6, L); G.set(4, 5, L); G.set(7, 5, L); G.set(8, 6, L); G.set(9, 5, L);   // closed eyes
    const M = f.points ? mixHex(f.O, f.D, .55) : (f.M || f.W);
    G.set(4, 7, M); G.set(7, 7, M); G.set(5, 7, M); G.set(6, 7, M);
    G.set(5, 6, f.points ? f.D : _chC.nose); G.set(6, 6, f.points ? f.D : _chC.nose);
    G.set(1, 6, _chC.blush); G.set(10, 6, _chC.blush);
  }));
}

// 16x24, anchor (8,23): the innkeeper bowing on the title screen (happi). frame 0 stand, 1 bow. hat = look.hat id or null.
// v2.1: optional outfit = an o_* outfit id (S.equip.outfit's look.outfit); anything else = the happi.
function catBow(fur, frame, hat, outfit) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid], fr = frame ? 1 : 0, h = _chHatId(hat);
  if (_chOut[outfit]) return art('chw:' + fid + ':' + fr + ':' + h + ':' + outfit, () => _chBowO(f, fr, h, outfit));
  return art('chw:' + fid + ':' + fr + ':' + h, () => {
    const c = paint(16, 24, Gr => {
      const G = _chShift(Gr, 4), P = f.P || f.W;
      G.rect(5, 17, 2, 1, f.O); G.rect(5, 18, 2, 1, P); G.rect(9, 17, 2, 1, f.O); G.rect(9, 18, 2, 1, P);
      if (!fr) {
        G.rect(4, 12, 8, 5, _chC.happi); G.rect(7, 12, 2, 2, f.W); G.rect(7, 14, 2, 3, _chC.happiD);
        G.rect(6, 12, 1, 5, _chC.wh); G.rect(9, 12, 1, 5, _chC.wh);
        G.rect(3, 12, 1, 2, _chC.happi); G.rect(12, 12, 1, 2, _chC.happi); G.set(4, 14, _chC.wh); G.set(11, 14, _chC.wh);
        G.set(6, 15, P); G.set(7, 15, P); G.set(8, 15, P); G.set(9, 15, P);   // paws together in front
        _chHeadDown(G, f, 0); _chFaceDown(G, f, 0, 'happy');
        if (!_chCover[h]) _chHatFront(G, f, 'happi', 0, false);
        if (h) _chHatOn(G, h, 'down', 0);
      } else {
        // bowing: torso folds forward, we see the top of the head with the headband, eyes closed low on the face
        G.rect(4, 14, 8, 3, _chC.happi); G.rect(6, 14, 1, 3, _chC.wh); G.rect(9, 14, 1, 3, _chC.wh); G.rect(7, 14, 2, 3, _chC.happiD);
        G.set(3, 15, _chC.happi); G.set(12, 15, _chC.happi); G.set(6, 16, P); G.set(7, 16, P); G.set(8, 16, P); G.set(9, 16, P);
        const oy = 4, S = (x, y, col) => G.set(x, y + oy, col), ear = f.ear || f.O;
        S(2, 1, ear); S(13, 1, ear); S(2, 2, ear); S(3, 2, ear); S(12, 2, ear); S(13, 2, ear);
        G.rect(2, 3 + oy, 12, 6, f.O); G.rect(3, 9 + oy, 10, 1, f.O);
        S(3, 2, _chC.pink); S(12, 2, _chC.pink);
        if (f.stripes) [[6, 3], [7, 3], [8, 3], [9, 3], [7, 4], [8, 4]].forEach(p => S(p[0], p[1], f.D));
        if (f.patch) { G.ell(4, 4.5 + oy, 2.5, 2, f.D); S(2, 1, f.D); S(2, 2, f.D); if (f.D2) { G.ell(11.5, 3.5 + oy, 2, 1.5, f.D2); S(13, 1, f.D2); S(13, 2, f.D2); } }
        if (f.points) { G.ell(8, 9 + oy, 3.2, 1.4, mixHex(f.O, f.D, .5)); }
        if (!_chCover[h]) { G.rect(2, 6 + oy, 12, 1, _chC.band); S(14, 6, _chC.band); S(14, 7, _chC.band); }
        const L = _chLid(f); S(5, 8, L); S(6, 8, L); S(9, 8, L); S(10, 8, L);
        S(4, 9, _chBlush(f)); S(11, 9, _chBlush(f));
        S(7, 9, f.points ? f.D : _chC.nose); S(8, 9, f.points ? f.D : _chC.nose);
        if (h) _chHatOn(G, h, 'down', oy + 1);
      }
    });
    if (!fr) _chWhiskersFront(c, f, 4);
    else _chPx(c, _chTip, [[1, 16], [0, 16], [14, 16], [15, 16]]);
    _chShadow(c, 8, 23, 5);
    return c;
  });
}
// catBow in an o_* outfit: frame 0 = the outfit's front sprite with happy closed eyes; frame 1 = bowing, the outfit's
// colours on the folded torso and its own headwear on the bowed head
const _chBowPal = {   // torso, centre line, belt / accent, hem (null = no robe: legs show)
  o_yukata: [_chOC.ygM, _chOC.ygCol, _chOC.ygObi, _chOC.ygM], o_chef: [_chOC.kpW, _chOC.kpK, _chOC.kpS, _chOC.kpK],
  o_momiji: [_chOC.mjR, _chOC.mjK, _chC.himo, _chOC.mjK], o_snow: [_chOC.snC, _chOC.snCL, _chOC.snS, null],
  o_hakama: [_chOC.hkT, _chC.wh, _chOC.hkHD, _chOC.hkH], o_ninja: [_chOC.njS, _chOC.njL, _chOC.njR, null],
  o_samurai: [_chOC.smG, _chOC.smK, _chOC.smCrest, _chOC.smG], o_maneki: [_chOC.mkW, _chOC.mkR, _chOC.mkG, null],
};
function _chBowO(f, fr, h, o) {
  if (!fr) {
    const c = paint(16, 24, Gr => _chFront(_chShift(Gr, 4), f, o, 0, '', false, false, _chShift(Gr, 4), { hat: h, acc: '', trim: 0, robe: '', uni: '', mood: 'happy' }));
    _chWhiskersFront(c, f, 4); _chShadow(c, 8, 23, 5);
    return c;
  }
  const c = paint(16, 24, Gr => {
    const G = _chShift(Gr, 4), P = f.P || f.W, C = _chOC, [m, mid, acc, hem] = _chBowPal[o], cl = _chCloth(o, '', '');
    const pn = _chPants[o];
    if (hem) { G.rect(4, 17, 8, 1, hem); G.rect(5, 18, 2, 1, P); G.rect(9, 18, 2, 1, P); }
    else { const lg = pn[0], ft = pn[1] || P; G.rect(5, 17, 2, 1, lg); G.rect(5, 18, 2, 1, ft); G.rect(9, 17, 2, 1, lg); G.rect(9, 18, 2, 1, ft); }
    G.rect(4, 14, 8, 3, m); G.rect(7, 14, 2, 3, mid); G.set(4, 16, acc); G.set(11, 16, acc);
    if (o === 'o_samurai') { G.rect(2, 14, 2, 1, m); G.rect(12, 14, 2, 1, m); }
    G.set(3, 15, cl.sleeve); G.set(12, 15, cl.sleeve); G.set(6, 16, P); G.set(7, 16, P); G.set(8, 16, P); G.set(9, 16, P);
    if (o === 'o_snow') { G.set(6, 16, C.snS); G.set(9, 16, C.snS); }
    const oy = 4, S = (x, y, col) => G.set(x, y + oy, col), Rr = (x, y, w, hh, col) => G.rect(x, y + oy, w, hh, col), ear = f.ear || f.O;
    S(2, 1, ear); S(13, 1, ear); S(2, 2, ear); S(3, 2, ear); S(12, 2, ear); S(13, 2, ear);
    Rr(2, 3, 12, 6, f.O); Rr(3, 9, 10, 1, f.O);
    S(3, 2, _chC.pink); S(12, 2, _chC.pink);
    if (f.stripes) [[6, 3], [7, 3], [8, 3], [9, 3], [7, 4], [8, 4]].forEach(p => S(p[0], p[1], f.D));
    if (f.patch) { G.ell(4, 4.5 + oy, 2.5, 2, f.D); S(2, 1, f.D); S(2, 2, f.D); if (f.D2) { G.ell(11.5, 3.5 + oy, 2, 1.5, f.D2); S(13, 1, f.D2); S(13, 2, f.D2); } }
    if (f.points) G.ell(8, 9 + oy, 3.2, 1.4, mixHex(f.O, f.D, .5));
    const top = _chTopHat[h];
    if (o === 'o_ninja') { Rr(2, 3, 12, 4, C.njS); if (!_chCover[h]) { Rr(2, 6, 12, 1, C.njR); S(14, 6, C.njR); S(14, 7, C.njR); } }
    else if (o === 'o_chef' && !top) { Rr(3, 3, 10, 3, C.kpScarf); [[4, 3], [8, 3], [11, 3], [6, 4], [10, 4], [4, 5], [8, 5], [12, 5]].forEach(p => S(p[0], p[1], C.kpDot)); }
    else if (o === 'o_snow' && !top) { Rr(3, 3, 10, 3, C.snS); Rr(2, 6, 12, 1, C.snF); Rr(7, 1, 2, 2, C.snF); }
    else if (o === 'o_hakama' && !top) { Rr(3, 2, 10, 3, C.hkCap); Rr(3, 4, 10, 1, C.hkLine); Rr(3, 5, 10, 1, C.hkCap); }
    else if (o === 'o_momiji' && !_chCover[h]) { S(11, 4, C.mjR); S(10, 5, C.mjR); S(12, 5, C.mjR); S(11, 5, C.mjL1); }
    const L = _chLid(f); S(5, 8, L); S(6, 8, L); S(9, 8, L); S(10, 8, L);
    S(4, 9, _chBlush(f)); S(11, 9, _chBlush(f));
    S(7, 9, f.points ? f.D : _chC.nose); S(8, 9, f.points ? f.D : _chC.nose);
    if (h) _chHatOn(G, h, 'down', oy + 1);
  });
  _chPx(c, _chTip, [[1, 16], [0, 16], [14, 16], [15, 16]]);
  _chShadow(c, 8, 23, 5);
  return c;
}

// ---------------------------------------------------------------- ready looks for v2.1 characters (SPEC_v2 16.4 / 16.5 / 16.7)
// Plain look objects for catSprite / catSit (copy before changing). kittens = the three furs for kittenSprite.
const LOOKS_V21 = {
  reporter: { fur: 'tabby', outfit: 'guest', shirt: '#e0b050', hat: 'beret', acc: 'camera' },
  host: { fur: 'white', outfit: 'guest', shirt: '#e8486e', acc: 'mic' },
  cameraman: { fur: 'black', outfit: 'guest', shirt: '#5e6e80', acc: 'tvcam' },
  mom: { fur: 'orange', outfit: 'mom', acc: 'bundle' },
  zen: { fur: 'black', outfit: 'robe', robe: '#e0862a' },
  fisher: { fur: 'tabby', outfit: 'robe', robe: '#5e7e5a', hat: 'straw', acc: 'rod' },
  boy: { fur: 'cream', outfit: 'robe', robe: '#62c0e6', hat: 'straw' },
  yukionna: { fur: 'white', outfit: 'robe', robe: '#acd4f2' },
  kittens: ['calico', 'tabby', 'black'],
  painter: { fur: 'gray', outfit: 'robe', robe: '#4a78b8', hat: 'beret', acc: 'palette' },
  bride: { fur: 'white', outfit: 'robe', robe: '#f6f2ea', hat: 'foxmask' },
  tea: { fur: 'gray', outfit: 'haori', robe: '#4e6a3e' },
};
