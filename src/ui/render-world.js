// ============================================================ render
// cat sprites are 16x24 with the anchor at (8,23) (4 rows of head room for hats): catSprite / catBow (art block).
// Tiles: tileArt(ch, tx, ty, nb, season) draws every v2 char; season is 0 until v2.1's calendar.
// static world layer: tiles, doors, locked shade, scenery - redrawn only when something unlocks
const WORLD = mk(MAPW, MAPH);
// one door tile of the static layer; a combo room's noren takes the combo's colour + emblem (4.5), so it is repainted
// whenever a room's combo changes
function paintDoor(dr) {
  if (!dr) return;
  const [tx, ty] = dr.at, wg = WORLD.getContext('2d'), nb = { u: ch(tx, ty - 1), d: ch(tx, ty + 1), l: ch(tx - 1, ty), r: ch(tx + 1, ty) };
  wg.imageSmoothingEnabled = false; wg.clearRect(tx * TILE, ty * TILE, TILE, TILE);
  const base = tileArt(dr.base || '.', tx, ty, nb, 0); if (base) wg.drawImage(base, tx * TILE, ty * TILE);
  const c = dr.room ? roomCombo(ROOM[dr.room]) : null;
  wg.drawImage(doorArt(dr.kind, doorIsOpen(dr), c ? c.col : dr.col || null, c ? c.emb : dr.emb || null, !!dr.gold, tx, ty), tx * TILE, ty * TILE);   // gates paint their own ground: they need where they stand
}
const tubBusy = rm => !!VIPG && VIPG.suite === rm.id && (VIPG.st === 'soak' || (VIPG.st === 'seated' && VIPG.actT > 0 && vipWish() === 'bath'));
// a VIP's face, 8x8 from its front sprite (photo frames, the polaroid; the album crops its own)
function vipFace(id) { return art('vipface:' + id, () => { const v = VIP[id], c = mk(8, 8); c.getContext('2d').drawImage(catSprite('down', 0, { fur: v.fur, outfit: 'robe', robe: v.robe, hat: v.hat || null }), 4, 6, 8, 8, 0, 0, 8, 8); return c; }); }
function rebuildWorld() {
  buildObjects(); buildBlock(); padsUpdate(); buildLights();
  const wg = WORLD.getContext('2d'); wg.imageSmoothingEnabled = false; wg.clearRect(0, 0, MAPW, MAPH);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const c = MAP[ty][tx], nb = { u: ch(tx, ty - 1), d: ch(tx, ty + 1), l: ch(tx - 1, ty), r: ch(tx + 1, ty) };
    if (c === 'D') paintDoor(DOOR_AT[ty * MW + tx]);
    else { const t = tileArt(c, tx, ty, nb, 0); if (t) wg.drawImage(t, tx * TILE, ty * TILE); }
  }
  // wall decor (2.4): gift shelf + photo frames on the lobby's north wall, the dining menu boards, the garden wall lamp
  const wall = (k, tx, ty) => wg.drawImage(wallDecorArt(k), tx * TILE, ty * TILE);
  for (const x of [12, 13, 14]) wall('giftshelf', x, 22);
  for (const x of [20, 21, 22]) wall('photo', x, 22);
  if (S.unlocked.dining) { wall('menu', 6, 18); wall('menu', 7, 18); }
  if (S.unlocked.garden) wall('lantern', 26, 10);
  // scenery on the two v2.1 areas: a bamboo grove over the shrine ground, flagstone clutter on the plaza (no shade, no sign)
  for (const a of AREAS) if (a.scenery && !areaOpen(a)) {
    for (let y = a.r[1]; y <= a.r[3]; y++) for (let x = a.r[0]; x <= a.r[2]; x++) {
      if (a.scenery === 'bamboo') wg.drawImage(bambooGroveArt(x, y), x * TILE, (y + 1) * TILE - 24);
      else wg.drawImage(plazaDecor(x, y), x * TILE, y * TILE);
    }
  }
  // locked: closed rooms and areas are shaded; the shop gets a rope of posts along col 10
  const sh = lockedShade(), shadeTile = (tx, ty) => { if (typeof sh === 'string') { wg.fillStyle = sh; wg.fillRect(tx * TILE, ty * TILE, TILE, TILE); } else wg.drawImage(sh, tx * TILE, ty * TILE); };
  for (const a of AREAS) if (a.dim && !areaOpen(a)) for (let y = a.r[1]; y <= a.r[3]; y++) for (let x = a.r[0]; x <= a.r[2]; x++) shadeTile(x, y);
  for (const rm of ROOMS) if (!roomOpen(rm) && areaOpen(areaAt(rm.box[0], rm.box[1]))) for (let y = rm.box[1]; y <= rm.box[3]; y++) for (let x = rm.box[0]; x <= rm.box[2]; x++) shadeTile(x, y);
  if (!S.unlocked.shop) for (let y = 30; y <= 34; y++) wg.drawImage(ropeArt('v'), 10 * TILE, y * TILE);
}
const VIS = (wx, wy, m) => wx - CX > -m && wx - CX < W + m && wy - CY > -m && wy - CY < H + m;
// walk frame 2 lifts the head (and the body) 1 px (art 12.1): what sits on a head (towels, a tray, try-on sparkles) bobs with it
const catFrame = e => e.moving ? 1 + (Math.floor(e.walkT * 6) & 1) : 0, headBob = e => catFrame(e) === 2 ? 1 : 0;
function drawCat(e, look, ox) {
  const view = e.dir === 'left' || e.dir === 'right' ? 'side' : e.dir;
  const fr = catFrame(e);
  let c = catSprite(view, fr, look); if (e.dir === 'left') c = flipOf(c);
  g.drawImage(c, R(e.x) + (ox || 0) - CX - 8, R(e.y) - CY - 23);
}
function drawPad(u) {
  const [tx, ty] = padXY(u), x = tx * TILE - CX, y = ty * TILE - CY, s = popScale(POPA['pad:' + u.id]);
  if (s <= .02) return;
  const on = P.pouring === u.id, frac = clamp((S.paid[u.id] || 0) / u.price, 0, 1);
  if (s !== 1) { const w = R(16 * s); g.fillStyle = 'rgba(255,246,216,.6)'; g.fillRect(x + 8 - (w >> 1), y + 8 - (w >> 1), w, w); g.drawImage(padIcon(u.icon), x + 8 - R(6 * s), y + 8 - R(6 * s), R(12 * s) || 1, R(12 * s) || 1); return; }
  g.fillStyle = 'rgba(27,27,47,.28)'; g.fillRect(x + 1, y + 1, 14, 14);
  if (frac > 0) { const h = Math.max(1, R(14 * frac)); g.fillStyle = 'rgba(255,200,90,.6)'; g.fillRect(x + 1, y + 15 - h, 14, h); }
  padDash(x, y, on || INFO === u);
  if (u.decor) drawC(decorIcon(u.id), x + 8, y + 8); else g.drawImage(padIcon(u.icon), x + 2, y + 2);   // a decor pad shows its piece
  if (raisesStar(u)) drawC(starIcon(true), x + 14, y + 2);   // "buying this adds a star" badge (1)
}
// dashed rounded frame of a pad; the dashes creep slowly round
function padDash(x, y, on) {
  const off = Math.floor(T * 4);
  g.fillStyle = on ? '#ffe14a' : '#fff6d8';
  for (let i = 0; i < 52; i++) {
    if (((i + off) % 5) >= 3) continue;
    const k = i % 13, side = (i / 13) | 0;
    const px = side === 0 ? 1 + k : side === 1 ? 15 : side === 2 ? 14 - k : 0, py = side === 0 ? 0 : side === 1 ? 1 + k : side === 2 ? 15 : 14 - k;
    g.fillRect(x + px, y + py, 1, 1);
  }
}
// The price goes under the pad; beside it (right) when another visible pad sits right below, or when you stand just
// below the pad (it would cover your head); over it when another visible pad sits right beside it (跑鞋 / 竹篮,
// 仲居 / 搬运). The 2-char name shows over the pad when you're within 2 tiles. The guide arrow reads this layout.
function padLayout(u) {
  const [ux, uy] = padXY(u);
  const vis = (dx, dy) => { for (const [id, xy] of PADPOS) if (id !== u.id && xy[0] === ux + dx && xy[1] === uy + dy) return true; return false; };
  const head = Math.abs(P.x - (ux * TILE + 8)) < 16 && P.y > uy * TILE + 16 && P.y < uy * TILE + 44;   // just below: the price would cover your head
  const side = vis(0, 1) ? 'right' : vis(1, 0) ? 'over' : head ? 'right' : 'under';
  const on = Math.floor(P.x / TILE) === ux && Math.floor(P.y / TILE) === uy;   // standing on it: the name would cover your head
  // the info card (7.2) already names the pad you are nearest to: no second name floating over it (it would cover your head)
  return { side, over: side === 'over', named: !on && u !== INFO && dist(P.x, P.y, ux * TILE + 8, uy * TILE + 8) <= 2 * TILE };
}
function padLabels(u) {
  if (popScale(POPA['pad:' + u.id]) < 1) return;
  const [ux, uy] = padXY(u), cx = ux * TILE + 8 - CX, y = uy * TILE - CY, { side, over, named } = padLayout(u);
  if (cx < 0 || cx > W || y + 8 < 29 || y + 8 > H) return;   // the pad itself is off screen or under the HUD rows: no stray digits
  const need = Math.max(0, padNeed(u)), fi = fishIcon(), label = fmt(need), w = label.length * 3.8;
  const py = side === 'over' ? y - 4 : side === 'right' ? y + 8 : y + 20, lx = side === 'right' ? cx + 9 : R(cx - (w + fi.width) / 2);
  if (py < 29) return;   // would sit on the HUD rows (text is drawn last, over the HUD)
  const card = state === 'play' && (INFO || FIRST_Q[0]) ? CARD_Y - 1 : H;   // the bottom card covers what is under it:
  if (py + 4 <= card) {                                                      // no half-cut price peeking out above it
    g.drawImage(fi, lx, R(py - fi.height / 2));
    txt(label, lx + fi.width + 1, py, 7, S.money >= need ? '#ffe9a8' : '#ffffff', 'left');
  }
  if (named && (over ? y - 13 : y - 5) + 4 <= card) txt(u.name, cx, over ? y - 13 : y - 5, 7, '#ffffff');
}
// futons of a room (ground layer): main / west rooms one, cottages two (A + B), suites one. A couple shares one futon
// (two heads); a family's kitten takes futon B in a cottage, else squeezes in beside its parent (4.6).
function drawFutons(rm) {
  const by = (rm.y0 + 2) * TILE, rs = S.rooms[rm.id], s = popScale(POPA[rm.id]), gu = RT[rm.id] && RT[rm.id].guest;
  const one = (fx, heads) => {
    if (heads && rs === 'occupied' && s === 1) {   // sleeping: futon, head(s) on the pillow, duvet over
      const fr = Math.floor(T * 1.2) & 1;
      drawObj(futonArt('sleep', fr), fx, by, 1);
      for (const [fur, dx] of heads) drawA(catSleepHead(fur), fx * TILE + 8 + dx, rm.y0 * TILE + 13, 6, 8);
      drawObj(futonArt('cover', fr), fx, by, 1);
    } else drawObj(futonArt(rs === 'messy' ? 'messy' : 'clean', 0), fx, by, 1, s);
  };
  let hA = null, hB = null;
  if (gu && gu.st === 'sleep') {
    const m = gu.mate; hA = [[gu.look.fur, 0]];
    if (m && m.kind === 'kitten' && rm.futonB) hB = [[m.look.fur, 0]];
    else if (m) hA = [[gu.look.fur, -3], [m.look.fur, 3]];
  }
  one(rm.futon[0], hA);
  if (rm.futonB) one(rm.futonB[0], hB);
}
// a follower walking (partner = a cat sprite, kitten = kittenSprite 10x14 anchored (5,13))
function drawMate(m) {
  if (m.kind === 'cat') { drawCat(m, m.look); return; }
  const view = m.dir === 'left' || m.dir === 'right' ? 'side' : m.dir, fr = m.moving ? 1 + (Math.floor(m.walkT * 7) & 1) : 0;
  let c = kittenSprite(view, fr, m.look.fur); if (m.dir === 'left') c = flipOf(c);
  drawA(c, R(m.x), R(m.y), 5, 13);
}
// a pet (4.11): duck 10x10 anchored (5,9), shiba 16x16 anchored (8,15); a shiba sitting still wags (frames 3 / 4)
function drawPet(e, ghost) {
  const view = e.dir === 'left' || e.dir === 'right' ? 'side' : e.dir;
  const fr = e.moving ? 1 + (Math.floor(e.walkT * 7) & 1) : e.kind === 'shiba' && e.idle > 1 ? 3 + (Math.floor(T * 2) & 1) : 0;
  let c = petSprite(e.kind, view, fr); if (e.dir === 'left') c = flipOf(c);
  if (ghost) g.globalAlpha = .5;
  if (e.kind === 'shiba') drawA(c, R(e.x), R(e.y), 8, 15); else drawA(c, R(e.x), R(e.y), 5, 9);
  g.globalAlpha = 1;
}
// a cat sitting on a seat cushion, side-on to its table (catSit faces right; eating = frames 1 / 3, bowl up / down, so the
// bowl never pops in and out), or a kitten (kittenSit)
function drawSitter(seat, look, kitten, eating) {
  const se = SEATS[seat], x = tcx(se.at), y = tcy(se.at) + 4, left = se.face === 'left';
  let c = kitten ? kittenSit(look.fur) : catSit(eating ? (Math.floor(T * 2) & 1 ? 3 : 1) : 0, look);
  if (left) c = flipOf(c);
  if (kitten) drawA(c, x, y, 5, 11); else drawA(c, x, y, 8, 23);
}
// a guest and its partner / kitten in the y-sorted list
function guestDraws(L, gu) {
  const m = gu.mate;
  if (gu.st === 'sleep') return;
  if (gu.st === 'bathing') {   // a couple shares one slot (8 px apart); a kitten sits on the edge where its parent stood
    const bx = SLOTS[gu.slot].x * TILE + 8, by = 3 * TILE + 10, fr = Math.floor(T * 1.4 + gu.id * .37) & 1;
    if (m && m.kind === 'cat') L.push({ y: by, f: () => { drawA(catBathing(gu.look.fur, fr), bx - 4, by, 9, 9); drawA(catBathing(m.look.fur, fr ^ 1), bx + 4, by + 1, 9, 9); } });
    else L.push({ y: by, f: () => drawA(catBathing(gu.look.fur, fr), bx, by, 9, 9) });
    if (m && m.kind === 'kitten') L.push({ y: 4 * TILE + 12, f: () => drawA(kittenSit(m.look.fur), bx, 4 * TILE + 12, 5, 11) });
    return;
  }
  if ((gu.st === 'seated' || gu.st === 'eat') && gu.seat >= 0) {
    const y = tcy(SEATS[gu.seat].at) + 4;
    L.push({ y, f: () => drawSitter(gu.seat, gu.look, false, gu.st === 'eat') });
    if (m && m.mode === 'park' && gu.seat2 >= 0) L.push({ y: y + .01, f: () => drawSitter(gu.seat2, m.look, m.kind === 'kitten', gu.st === 'eat') });
    else if (m && VIS(m.x, m.y, 24)) L.push({ y: m.y, f: () => drawMate(m) });
    return;
  }
  if (VIS(gu.x, gu.y, 24)) L.push({ y: gu.y, f: () => drawCat(gu, gu.look, gu.ox) });
  if (m && m.mode !== 'park' && VIS(m.x, m.y, 24)) L.push({ y: m.y, f: () => drawMate(m) });
}
// the hand tray (4.1): in front of the chest, beside the head when walking up; portions stagger 2 px each
function drawTray(e, items) {
  if (!items || !items.length) return;
  const up = e.dir === 'up', sd = e.dir === 'left' ? -1 : e.dir === 'right' ? 1 : 0;
  const x = R(e.x) + (up ? 7 : sd * 5) - CX, y = R(e.y) - (up ? 14 : 8) - headBob(e) - CY;
  g.fillStyle = OUT; g.fillRect(x - 6, y, 12, 3); g.fillStyle = '#b07a48'; g.fillRect(x - 5, y + 1, 10, 1);
  items.forEach((k, i) => drawC(itemIcon(k), x - 3 + i * 2, y - 3 - (i & 1)));
}
// live: guests, staff, pads, piles; card (the share card): the people without the game's markers (pads, empty slots)
function drawScene(vw, vh, live, noPlayer, card) {
  const marks = live && !card;
  g.fillStyle = '#243a22'; g.fillRect(0, 0, vw, vh);
  const sx = clamp(CX, 0, MAPW), sy = clamp(CY, 0, MAPH), sw = Math.min(vw - (sx - CX), MAPW - sx), sh = Math.min(vh - (sy - CY), MAPH - sy);
  if (sw > 0 && sh > 0) g.drawImage(WORLD, sx, sy, sw, sh, sx - CX, sy - CY, sw, sh);
  // animated water (visible tiles only): onsen, roten, the koi pond
  const fr = Math.floor(T / .4) & 3, water = (x0, x1, y0, y1, fn) => { for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (VIS(tx * TILE + 8, ty * TILE + 8, 12)) g.drawImage(fn(fr, tx, ty), tx * TILE - CX, ty * TILE - CY); };
  if (S.unlocked.onsen) water(13, 21, 2, 3, waterArt);
  if (S.unlocked.roten) { water(27, 37, 2, 3, waterArt); if (VIS(32 * TILE, 20, 40)) g.drawImage(waterfallArt(fr), 31 * TILE - CX, -CY); }
  if (S.unlocked.garden) water(27, 30, 15, 17, pondArt);
  if (S.unlocked.koi) for (let i = 0; i < 3; i++) {   // three koi circle the pond
    const a = T * .35 + i * 2.1, x = 29 * TILE + Math.cos(a) * 22, y = 16 * TILE + 8 + Math.sin(a) * 12;
    if (VIS(x, y, 8)) { let c = koiArt(['red', 'gold', 'black'][i], Math.floor(T * 3 + i) & 1); if (Math.sin(a) > 0) c = flipOf(c); drawA(c, x, y, 4, 2); }
  }
  // an area that just opened: its shade fades out (0.8 s)
  for (const f of AREA_FADE) {
    const a = f.a, k = 1 - clamp((T - f.t0) / .8, 0, 1); if (k <= 0 || !a.dim) continue;
    g.globalAlpha = .52 * k; g.fillStyle = '#161228'; g.fillRect(a.r[0] * TILE - CX, a.r[1] * TILE - CY, (a.r[2] - a.r[0] + 1) * TILE, (a.r[3] - a.r[1] + 1) * TILE); g.globalAlpha = 1;
  }
  // the lobby's north wall (4.4): VIP gifts on the shelf (two per tile), the newest photos in the three frames
  if (VIS(17 * TILE, 22 * TILE + 8, 80)) {
    S.gifts.forEach((id, i) => { if (i < 6) drawA(giftArt(VIP[id].gift), (12 + (i >> 1)) * TILE + (i & 1 ? 12 : 4), 22 * TILE + 8, 4, 4); });
    S.album.photos.slice(-3).reverse().forEach((p, i) => g.drawImage(vipFace(p.v), (20 + i) * TILE + 4 - CX, 22 * TILE + 5 - CY));
  }
  // ---- ground layer: desk spot hint, price pads, futons, cushions, ground props, fish piles
  if (marks && !S.unlocked.recep && Q[0] && Q[0].st === 'queue' && Q[0].ready && !P.atDesk) {   // "stand here" glow behind the counter while a guest waits
    g.globalAlpha = .4 + .25 * Math.sin(T * 5); g.fillStyle = '#ffe9a8';
    const x = DESK_SPOT[0] * TILE - CX, y = DESK_SPOT[1] * TILE - CY;
    g.fillRect(x + 3, y + 1, 10, 1); g.fillRect(x + 2, y + 2, 12, 2); g.fillRect(x + 3, y + 4, 10, 1);
    g.globalAlpha = 1;
  }
  if (marks) for (const u of visiblePads()) { const [tx, ty] = padXY(u); if (VIS(tx * TILE + 8, ty * TILE + 8, 20)) drawPad(u); }
  for (const rm of ROOMS) if (roomOpen(rm) && VIS(rm.cleanC[0], rm.cleanC[1], 48)) drawFutons(rm);
  for (const se of SEATS) if (S.unlocked[se.need] && VIS(tcx(se.at), tcy(se.at), 16)) drawA(cushionArt(), tcx(se.at), tcy(se.at), 6, 3);
  for (const o of OBJS) if (o.ground && VIS(o.tx * TILE + o.fw * 8, (o.ty + o.fh) * TILE - 8, 48)) drawObj(o.img(), o.tx, (o.ty + o.fh) * TILE, o.fw, popScale(POPA[o.uid]));
  if (marks && decorOwned().length) for (const sl of DSLOTS) if (!S.decor[sl.key] && roomOpen(sl.rm) && VIS(tcx(sl.at), tcy(sl.at), 12)) drawA(slotMarkArt(), tcx(sl.at), tcy(sl.at) + 2, 6, 3);   // empty decor slots (4.5)
  if (live) for (const id in S.piles) if (S.piles[id] > 0) {
    const [tx, ty] = PILE_AT[id]; if (!VIS(tx * TILE + 8, ty * TILE + 8, 24)) continue;
    if (id === 'recep' && S.piles[id] > 200) drawA(chestArt(S.piles[id] > 1000 ? 2 : 1), tx * TILE + 8, ty * TILE + 14, 8, 14);   // the cash box (4.8)
    else drawA(pileArt(clamp(R(Math.sqrt(S.piles[id])), 1, 12)), tx * TILE + 8, ty * TILE + 13, 8, 17);
  }
  // ---- y-sorted props, area boards and cats
  const L = [];
  for (const o of OBJS) { if (o.ground) continue; const by = (o.ty + o.fh) * TILE; if (VIS(o.tx * TILE + o.fw * 8, by - 16, 64)) L.push({ y: by, f: () => drawObj(o.img(), o.tx, by, o.fw, popScale(POPA[o.uid])) }); }
  for (const a of AREAS) if (a.sign && !areaOpen(a)) {   // star-n board at a locked area; lights up (and pops) once its gate pad shows
    const gate = UNLOCK[a.open], lit = PADPOS.has(gate.id), x = tcx(a.sign), y = (a.sign[1] + 1) * TILE - 1;
    if (VIS(x, y - 8, 24)) L.push({ y, f: () => { const c = areaSignArt(a.n, lit), s = lit ? popScale(POPA['pad:' + gate.id]) : 1; if (s >= 1) drawA(c, x, y, 7, 17); else if (s > .02) g.drawImage(c, R(x - 7 * s) - CX, R(y - 17 * s) - CY, R(c.width * s) || 1, R(c.height * s) || 1); } });
  }
  // decor in the rooms (ground items sorted by the tile centre: you can stand on them) and samples on the shop shelf
  for (const sl of DSLOTS) {
    const id = S.decor[sl.key]; if (!id || !roomOpen(sl.rm) || !VIS(tcx(sl.at), tcy(sl.at), 32)) continue;
    L.push({ y: tcy(sl.at), f: () => drawObj(decorArt(id, Math.floor(T) & 1), sl.at[0], (sl.at[1] + 1) * TILE, 1, popScale(POPA['decor:' + sl.key])) });
  }
  if (S.unlocked.shop && VIS(48, 31 * TILE - 12, 48)) L.push({ y: 31 * TILE + .02, f: () => decorOwned().forEach((id, i) => { if (i < 8) drawA(decorIcon(id), TILE + (i >> 1) * TILE + (i & 1 ? 9 : 2) + 5, 31 * TILE - 24 + 7, 5, 5); }) });
  if (live && VIPG && VIS(VIPG.x, VIPG.y, 24)) {
    const v = VIPG;
    if (v.st === 'soak') { const tb = ROOM[v.suite].tub; L.push({ y: (tb[1] + 1) * TILE + .02, f: () => drawA(catBathing(v.look.fur, Math.floor(T * 1.4) & 1), tcx(tb), tb[1] * TILE + 8, 9, 9) }); }
    else L.push({ y: v.y, f: () => drawCat(v, v.look) });
  }
  if (live) {
    for (const gu of GUESTS) guestDraws(L, gu);
    for (const s of STAFF) if (VIS(s.x, s.y, 24)) L.push({ y: s.y, f: () => drawCat(s, staffLook(s)) });
    if (!noPlayer) L.push({ y: P.y + .01, f: () => drawCat(P, playerLook()) });
    if (PET && !noPlayer && VIS(PET.x, PET.y, 24)) L.push({ y: PET.y, f: () => drawPet(PET) });   // (the share card draws its own, 2x)
    if (TRY.pet && !noPlayer) { const gh = { kind: TRY.pet, x: P.x - 11, y: P.y + 2, dir: P.dir, moving: P.moving, walkT: P.walkT, idle: 0 }; L.push({ y: gh.y, f: () => drawPet(gh, true) }); }   // try-on: its ghost at your feet
  }
  // the shop awning (once open) sorts just above row 30: the tanuki at (6,30) and the shelf's samples stand in front of it
  // (drawn over everyone it hid them - stage 2B note)
  if (S.unlocked.shop && VIS(88, 30 * TILE, 100)) L.push({ y: 30 * TILE - .5, f: () => g.drawImage(awningArt(), 16 - CX, 30 * TILE - 12 - CY) });
  L.sort((a, b) => a.y - b.y); for (const e of L) e.f();
  // ---- over everyone: the entrance noren
  g.drawImage(entranceNoren(), 16 * TILE - CX, 29 * TILE - 6 - CY);
}
