// the light pass (4.10): after the y-sorted scene, before the overlays. One multiply tint over the whole view (falls back
// to a thin plain tint where multiply is missing), then additive glows (glowArt) for the visible lamps nearest the view
// centre (<= LIGHT_MAX), the innkeeper's hand lantern at night, small glints on fish piles and the stars in the star-view
// bath. Pad frames are drawn again on top so they stay bright; bubbles, rings, the arrow, towels, trays and the HUD all
// come after this anyway. Everything is a smooth function of the clock: nothing blinks.
// The night tint is its own layer: each lamp (and the hand lantern) cuts a soft hole into it before the one multiply,
// so what stands under a lamp keeps its day colours and its dark outline; a weaker additive glow on top adds the warm
// colour (stage M: with the glow only added on top, a cat under a corridor lamp washed out to a pale blur).
const WM = 1;   // the world canvases' margin round the view (logical px): room for the camera's sub-pixel shift (render)
let VM = 0;     // the margin of the canvas drawn into now: WM in the world layers, 0 elsewhere (full-view fills cover it)
const DARK = mk(W + 2 * WM, H + 2 * WM);   // pixel (0, 0) = world (CX - WM, CY - WM)
let LGT = null;   // this frame's light pass (null by day): the small player / occluder layers are lit the same way (lightLayer)
const holeArt = r => art('hole:' + r, () => { const c = mk(2 * r, 2 * r), x = c.getContext('2d'), gl = glowArt(r, '#ffffff'); x.drawImage(gl, 0, 0); x.drawImage(gl, 0, 0); return c; });   // glowArt's rings x2: .75 / .51 / .33 / .15
function drawLighting() {
  const dl = dayLight(); LIGHT_N = 0; LGT = null;
  if (dl.a < .004 && dl.night < .004) return;
  const cx = CX + W / 2, cy = CY + H / 2, vis = [];   // lamps in view, the nearest to the view centre first (<= 16)
  if (dl.night > .02) {
    for (const L of LIGHTS) { const r = lightR(L); if (VIS(L.x, L.y, r)) vis.push({ d: Math.abs(L.x - cx) + Math.abs(L.y - cy), L, r }); }
    vis.sort((a, b) => a.d - b.d); if (vis.length > LIGHT_MAX) vis.length = LIGHT_MAX;
  }
  let lant = 0; const [lx, ly] = lanternXY();   // the hand lantern adds less under a lamp (stacked on one, the innkeeper burnt out white)
  if (dl.night > .5 && state !== 'title') { let under = 0; for (const v of vis) under = Math.max(under, 1 - Math.hypot(v.L.x - lx, v.L.y - ly) / v.r); lant = (dl.night - .5) * 2 * (1 - .8 * clamp(under, 0, 1)); }
  const d = DARK.getContext('2d'), dw = DARK.width, dh = DARK.height; d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1; d.clearRect(0, 0, dw, dh); d.fillStyle = dl.col; d.fillRect(0, 0, dw, dh);
  if (vis.length || lant > 0) {
    d.globalCompositeOperation = 'destination-out'; d.globalAlpha = dl.night;
    for (const v of vis) d.drawImage(holeArt(v.r), R(v.L.x) - v.r - CX + WM, R(v.L.y) - v.r - CY + WM);
    if (lant > 0) { d.globalAlpha = lant; d.drawImage(holeArt(24), lx - 24 - CX + WM, ly - 24 - CY + WM); }
    d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
  }
  LGT = { dl, vis, lant, lx, ly, dx: CX - WM, dy: CY - WM };
  LIGHT_N = applyLight();
  if (dl.night > .02 && S.unlocked.roten && dl.night > .3) for (const st of STAR_SPOTS) {   // stars on the water, each fading in and out slowly
    if (!VIS(st.x, st.y, 4)) continue;
    const a = (dl.night - .3) / .7 * (.3 + .7 * (.5 + .5 * Math.sin(T * Math.PI * 2 * st.f + st.ph)));
    g.globalAlpha = a; g.fillStyle = '#fff6c0'; g.fillRect(st.x - CX, st.y - CY, 1, 1);
    if (a > .6) { g.globalAlpha = (a - .6) * 1.5; g.fillRect(st.x - 1 - CX, st.y - CY, 3, 1); g.fillRect(st.x - CX, st.y - 1 - CY, 1, 3); }
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  if (dl.a > .02 && state !== 'title') for (const u of visiblePads()) {   // pad frames stay bright at night
    const [tx, ty] = padXY(u); if (!VIS(tx * TILE + 8, ty * TILE + 8, 20) || popScale(POPA['pad:' + u.id]) < 1) continue;
    padDash(tx * TILE - CX, ty * TILE - CY, P.pouring === u.id || INFO === u);
    if (raisesStar(u)) drawC(starIcon(true), tx * TILE - CX + 14, ty * TILE - CY + 2);
  }
}
// the light pass proper (LGT, from drawLighting) onto g at the camera CX / CY: one multiply of DARK (a thin plain tint
// where multiply is missing), then the additive glows - lamps, the hand lantern, fish-pile glints. Returns the lamps drawn.
function applyLight() {
  const { dl, vis, lant, lx, ly } = LGT;
  g.globalCompositeOperation = 'multiply';
  const mul = g.globalCompositeOperation === 'multiply';
  if (!mul) g.globalCompositeOperation = 'source-over';
  g.globalAlpha = mul ? dl.a : dl.a * .55; g.drawImage(DARK, LGT.dx - CX, LGT.dy - CY);
  let lamps = 0;
  if (dl.night > .02) {
    g.globalCompositeOperation = 'lighter';
    const add = g.globalCompositeOperation === 'lighter', k = add ? 1 : .45;
    if (!add) g.globalCompositeOperation = 'source-over';
    g.globalAlpha = dl.night * k * GLOW_K;
    for (const v of vis) { drawA(glowArt(v.r, v.L.col), v.L.x, v.L.y, v.r, v.r); lamps++; }
    if (lant > 0) { g.globalAlpha = lant * k * GLOW_K; drawA(glowArt(24, LAMP_COL), lx, ly, 24, 24); }
    g.globalAlpha = dl.night * .7 * k; let n = 0;   // fish piles glint softly
    for (const id in S.piles) { if (n >= GLINT_MAX) break; if (!(S.piles[id] > 0)) continue; const [tx, ty] = PILE_AT[id], x = tx * TILE + 8, y = ty * TILE + 10; if (VIS(x, y, 10)) { drawA(glowArt(10, '#ffe9a8'), x, y, 10, 10); n++; } }
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  return lamps;
}
// ---- the world in layers, moved by the camera's sub-pixel remainder (18.2, "walking feels choppy"). The view is drawn with a
// whole-pixel camera (CX, CY) into lowW, a world canvas 1 px bigger than the view on every side, and put on the screen
// shifted by the remainder (cam - CX) * K device px; the innkeeper has his own small layer put at his exact position, so
// while the camera is locked to him he stays on one device pixel and the world scrolls in even device-pixel steps. Pixel
// art stays nearest-neighbour; text lands on whole device px. Order: world (to the innkeeper's row of the y-sort, then the
// rest, the light pass, the sky) -> the innkeeper -> what stands in front of him again (its own small layer, on the world's
// grid) -> overlays (bubbles, rings, the arrow) -> what he carries -> the line bubble -> the HUD (no shift).
const lowW = mk(W + 2 * WM, H + 2 * WM);
const PLW = 64, PLH = 80, PAX = 32, PAY = 60;   // the small layers: size, where the innkeeper's feet sit in them
const lowP = mk(PLW, PLH), lowO = mk(PLW, PLH), LMASK = mk(PLW, PLH);
let SUBX = 0, SUBY = 0, WDX = 0, WDY = 0;   // the camera's remainder (logical px); where lowW's pixel (0, 0) lands (device px)
let PSPLIT = false; const OCC = [];         // drawScene: leave the innkeeper out, collect what is drawn in front of him
function worldBegin() {
  const x = lowW.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, lowW.width, lowW.height); x.setTransform(1, 0, 0, 1, WM, WM); g = x; VM = WM; CX = R(cam.x); CY = R(cam.y);
}
function worldFlush() {
  layerOn(true); g.setTransform(1, 0, 0, 1, 0, 0);   // lowW is opaque and reaches past every screen edge
  WDX = -(WM + SUBX) * K; WDY = -(WM + SUBY) * K;   // not rounded: nearest-neighbour sampling puts each logical pixel on the device pixels nearest its exact place (even steps also at a K like 4.33)
  flushLayer(lowW, WDX, WDY, -SUBX * K, -SUBY * K);
}
function smallBegin(c, gx, gy) {
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, c.width, c.height); g = x; VM = 0; CX = gx; CY = gy;
}
// light a small layer exactly like the world under it (the night tint, the glows, the fireworks' dusk), kept to the
// layer's own pixels: its alpha, saved first, cuts away what the tint and the glows put round them
function lightLayer(c, gx, gy) {
  const fa = fwDuskA(); if (!LGT && fa <= .004) return;
  const x = c.getContext('2d'), m = LMASK.getContext('2d');
  m.globalCompositeOperation = 'copy'; m.drawImage(c, 0, 0); m.globalCompositeOperation = 'source-over';
  const cx0 = CX, cy0 = CY; CX = gx; CY = gy;
  if (LGT) applyLight();
  if (fa > .004) fwDusk(fa, 0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(LMASK, 0, 0); x.globalCompositeOperation = 'source-over';
  CX = cx0; CY = cy0;
}
// the innkeeper at his exact (sub-pixel) place, then whatever the y-sort draws in front of him, again, on the world's grid
function playerLayer() {
  const gx = R(P.x) - PAX, gy = R(P.y) - PAY, cw = R(cam.x), ch = R(cam.y);
  smallBegin(lowP, gx, gy); drawCat(P, playerLook()); lightLayer(lowP, gx, gy);
  flushLayer(lowP, (P.x - PAX - cam.x) * K, (P.y - PAY - cam.y) * K);
  if (OCC.length) {
    smallBegin(lowO, gx, gy); for (const f of OCC) f(); lightLayer(lowO, gx, gy);
    flushLayer(lowO, WDX + (gx - cw + WM) * K, WDY + (gy - ch + WM) * K);   // the same device grid as lowW
  }
}
// what he carries (towels, the tray, the lantern, rings at his feet) in his small layer, over the overlays
function attachLayer() {
  const gx = R(P.x) - PAX, gy = R(P.y) - PAY;
  smallBegin(lowP, gx, gy);
  if (drawPlayerAttach()) flushLayer(lowP, (P.x - PAX - cam.x) * K, (P.y - PAY - cam.y) * K);
}
// where the innkeeper holds the little lantern at night (the paw on the side away from the tray)
const lanternXY = () => [R(P.x) + (P.dir === 'left' || P.dir === 'up' ? -6 : 6), R(P.y) - 7];
// the head-bubble anchor of a guest: over the futon / in the bath / over the seat / over the head
function guestHead(gu) {
  return gu.st === 'sleep' && gu.room ? [ROOM[gu.room].futon[0] * TILE + 8 + (ROOM[gu.room].left ? 5 : -5), ROOM[gu.room].y0 * TILE + 3]
    : gu.st === 'bathing' && gu.slot >= 0 ? [SLOTS[gu.slot].x * TILE + 8, 3 * TILE] : (gu.st === 'seated' || gu.st === 'eat') && gu.seat >= 0 ? [tcx(SEATS[gu.seat].at), tcy(SEATS[gu.seat].at) - 16] : [R(gu.x) + gu.ox, R(gu.y) - 20];
}
// the one staff cat whose name shows (4.7): the nearest within 2 tiles of the innkeeper, on screen
function badgeStaff() { let bs = null, bd = 2 * TILE + .01; for (const s of STAFF) { const d = dist(P.x, P.y, s.x, s.y); if (d < bd && s.x - cam.x > -8 && s.x - cam.x < W + 8 && s.y - cam.y > -8 && s.y - cam.y < H + 8) { bd = d; bs = s; } } return bs; }
// world overlays: steam, rings, bubbles, head towels, sparkles, pad labels, pops
function drawOverlays() {
  const steam = (x0, n, o) => { for (let i = 0; i < n; i++) {   // steam over a bath (pure function of T); o: a second set out of phase
    const t = T + (o || 0), ph = (t * .35 + i * .37) % 1, x = (x0 + (i * 7) % n) * TILE + 8 + R(Math.sin(t * 1.3 + i) * 3), y = R(3 * TILE + 6 - ph * 22);
    if (!VIS(x, y, 4)) continue;
    g.globalAlpha = .45 * Math.sin(ph * Math.PI); g.fillStyle = '#ffffff'; g.fillRect(x - CX, y - CY, 2, 1); g.fillRect(x + 1 - CX, y - 1 - CY, 1, 1);
  } };
  if (S.unlocked.onsen) steam(13, 9);
  if (S.unlocked.roten) steam(27, 11);
  if (winterSteam()) { if (S.unlocked.onsen) steam(13, 9, 1.43); if (S.unlocked.roten) steam(27, 11, 1.43); }   // v2.1 winter: twice the steam
  g.globalAlpha = 1;
  const f = Q[0]; if (f && f.ck > 0 && f.ready) ring(R(f.x) - CX, R(f.y) - 30 - CY, f.ck, '#ffe14a');
  for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && RT[rm.id].cleanP > 0) ring(rm.cleanC[0] - CX, rm.y0 * TILE - 2 - CY, RT[rm.id].cleanP);
  for (const rm of ROOMS) { const gu = RT[rm.id].guest; if (S.rooms[rm.id] === 'occupied' && gu && !gu.call) drawA(bubbleArt('zzz', 0), rm.futon[0] * TILE + 8 + (rm.left ? 5 : -5), rm.y0 * TILE + 3 + R(Math.sin(T * 2)), 7, 12); }
  for (const gu of GUESTS) {
    const [bx, by] = guestHead(gu);
    if (gu.bub && gu.st !== 'sleep') {
      const wob = gu.urg === 2 ? R(Math.sin(T * 6)) : 0;
      if (gu.bub === 'emb') { drawA(bubbleArt('blank', 0), bx, by, 7, 12); if (gu.room) drawA(emblemArt(ROOM[gu.room].emb), bx, by - 7, 3, 3); }
      else drawA(bubbleArt(gu.bub, gu.urg), bx, by + wob, 7, 12);
    }
    // a call (4.2): gold-rimmed bubble with the wanted thing over the normal bubble when there is one; a sleeper's shows
    // over the futon and a little bell lights over the room's door. v2.0.1 G3: an optional tip - the rim stays gold (no
    // orange / red hurry, no wobble)
    const cy = by - (gu.bub && gu.st !== 'sleep' ? 13 : 0);
    if (gu.call) {
      drawA(bubbleArt(gu.call.k, 0, true), bx, cy, 7, 12);
      if (gu.st === 'sleep' && gu.room) { const d = ROOM[gu.room].door; if (VIS(tcx(d), tcy(d), 24)) g.drawImage(wallDecorArt('bell'), d[0] * TILE - CX, (d[1] - 1) * TILE - CY); }
    }
    if (gu.ex) {   // v2.3 (19.3): a picky rush guest's extra - orange / red as its time runs out (it wobbles when red); a guest
      // further back in the line has it beside its head, not over the face of the one ahead
      const u = urgOf(gu.ex.t / gu.ex.max), qi = Q.indexOf(gu), side = qi > 0 && gu.st === 'queue' ? 10 : 0, ey = (gu.call ? cy - 13 : cy) + (side ? 6 : 0);
      drawA(bubbleArt(gu.ex.k, Math.max(1, u)), bx + side, ey + (u === 2 ? R(Math.sin(T * 6)) : 0), 7, 12);
    } else if (gu.callGone > 0 && gu.st !== 'sleep') {   // a call / an extra that timed out shrinks away
      const k = gu.callGone / .25, c = bubbleArt('blank', 0, true), w = Math.max(1, R(14 * k)), h = Math.max(1, R(13 * k));
      g.drawImage(c, R(bx - w / 2) - CX, R(cy - h) - CY, w, h);
    }
  }
  gzHintDraw(); dressHintDraw();   // v2.5: a garden piece's "?" guest bubble; the mirror's wardrobe bubble + owned-count ticks on the booths
  // decor rooms (4.5): a combo room shows its 1-char plate over the door while you're within 3 tiles; a room with decor
  // but no combo a small star
  for (const rm of GUEST_ROOMS) {
    if (!rm.slotA || !roomOpen(rm)) continue;
    const [a, b] = decorOf(rm); if (!a && !b) continue;
    const d = rm.door, x = tcx(d), y = d[1] * TILE - 5; if (!VIS(x, y, 12)) continue;
    const c = comboOf(a, b);
    if (!c) { drawA(starIcon(true), x, y, 3, 3); continue; }
    if (dist(P.x, P.y, x, tcy(d)) > 3 * TILE) continue;
    g.fillStyle = OUT; g.fillRect(x - 5 - CX, y - 5 - CY, 11, 11); g.fillStyle = c.col; g.fillRect(x - 4 - CX, y - 4 - CY, 9, 9);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 4 - CX, y - 4 - CY, 9, 1);
    if (y - CY > 30) txt(c.plate, x - CX, y - CY + .5, 7, '#ffffff');
  }
  // 4.7: the nearest staff cat within 2 tiles shows its name (7 px pixel font) and a small level badge
  { const bs = badgeStaff();
    if (bs) {
      const x = R(bs.x) - CX, y = R(bs.y) - 31 - CY - (bs.carry > 0 ? bs.carry * 2 : 0), lv = bs.role === 'owner' ? 0 : staffLv(bs), nw = bs.name.length * 7;
      if (y > 30) {
        txt(bs.name, x - (lv ? 5 : 0), y, 7, '#ffffff');
        if (lv) { const bx = x - 5 + (nw >> 1) + 6; g.fillStyle = OUT; g.fillRect(bx - 4, y - 4, 9, 8); g.fillStyle = lv >= 5 ? '#ffd23f' : lv >= 3 ? '#d8e0ec' : '#c8955a'; g.fillRect(bx - 3, y - 3, 7, 6); txt(String(lv), bx + .5, y, 6, OUT, 'center', null); }
      }
    }
  }
  // a new hire: a small red "new" tag over its head for 15 s (7.3.4)
  for (const s of STAFF) if (T - (s.newT === undefined ? -99 : s.newT) < NEW_TAG_T && VIS(s.x, s.y, 16)) {
    const nt = newTagArt(), x = R(s.x) - CX, y = R(s.y) - 30 - CY - (s === badgeStaff() ? 10 : 0) - (s.carry > 0 ? 4 + s.carry * 2 : 0);
    if (y > 34) { drawC(nt, x, y); txt('新', x, y + .5, 6, '#ffffff', 'center', null); }
  }
  // the VIP (4.4): name card / "..." / its wish, progress rings, the wish board over the door. v2.0.1 G1: the current wish
  // is a big gold bubble (the 14 x 13 bubble at 2x, pixel exact, a slow 1 px bob) - no red rim, a wish never runs out;
  // a wish done pops a big tick over its head (FX 'vipok') and gets a tick on the board
  if (VIPG) {
    const v = VIPG, hx = R(v.x), hy = R(v.y) - 20, k = vipWish();
    if (v.st === 'arrive' || v.st === 'carpet') drawA(cleanSuite() ? bubbleArt('card', 0, true) : bubbleArt('dots', 0), hx, hy, 7, 12);
    else if (v.st === 'follow' && v.halt) drawA(bubbleArt('dots', 0), hx, hy, 7, 12);
    else if (v.st === 'seated' && k) { const c = vipBubbleImg(k), bob = T % 1 < .5 ? 0 : -1; g.drawImage(c, hx - c.width - CX, hy + 2 - 2 * c.height + bob - CY, 2 * c.width, 2 * c.height); }   // v2.2: [station] > [item] while it still has to be made
    drawWishGlow();   // v2.2: the station that makes the wish glows (vipguide.js)
    if (v.st === 'carpet' && v.greetT > 0) ring(hx - CX, hy - 18 - CY, v.greetT / VIP_GREET_T, '#ffd23f');
    if (v.st === 'seated' && k === 'photo' && v.actT > 0) ring(hx - CX, hy - 32 - CY, v.actT / VIP_PHOTO_T, '#ffd23f');
    if (v.st === 'seated' && k === 'bath' && v.actT > 0) { const tp = ROOM[v.suite].tap; ring(tcx(tp) - CX, tcy(tp) - 22 - CY, v.actT / VIP_TAP_T, '#ffd23f'); }
    if ((v.st === 'seated' || v.st === 'soak') && v.suite) {
      const d = ROOM[v.suite].door, bx = tcx(d), by = d[1] * TILE - 1, ws = vipWs(v);
      if (VIS(bx, by - 7, 30)) {
        drawA(wishBoardArt(), bx, by, 20, 14);
        ws.forEach((w, i) => {
          const cx = bx - 20 + 3 + i * 12 - CX, cy = by - 14 + 2 - CY + (i === v.wi && !(v.hold > 0) && T % 1 < .5 ? -1 : 0);
          if (i === v.wi) { g.fillStyle = '#ffc21f'; g.fillRect(cx - 1, cy - 1, 12, 12); g.fillStyle = '#fff3d0'; g.fillRect(cx, cy, 10, 10); }
          g.globalAlpha = i < v.wi ? .35 : 1; g.drawImage(bubbleArt(w, 0), 2, 2, 10, 7, cx, cy + 1, 10, 7); g.globalAlpha = 1;
          if (i < v.wi) g.drawImage(okBadge(), cx, cy);   // done: a green tick badge on it
        });
      }
    }
  }
  for (const fx of FX) if (fx.k === 'vipok' && fx.t >= 0) {   // a wish done: a big tick rises over the VIP and fades (no flash)
    const p = fx.t / fx.life, a = p < .15 ? p / .15 : clamp((1 - p) / .35, 0, 1), s = p < .15 ? 1 + p / .15 : 2, c = okBadge(), w = c.width * s;
    g.globalAlpha = a; g.drawImage(c, R(fx.x - w / 2) - CX, R(fx.y - 18 - p * 6 - w / 2) - CY, R(w), R(w)); g.globalAlpha = 1;   // where the wish bubble was
  }
  // the fish net's reach (G5): a faint dotted ring round the innkeeper while the net pulls a pile in (and fading 0.8 s
  // after), so you see what it does; fish pulled in fly over to the innkeeper
  if (netLvl() && T - netPullAt < .8) netRing(NET_R[netLvl()], .4 * (1 - (T - netPullAt) / .8));
  for (const fx of FX) if (fx.k === 'suck' && fx.t >= 0) {
    const p = clamp(fx.t / fx.life, 0, 1), e = p * p;
    drawA(fishIcon(), lerp(fx.x0, P.x, e), lerp(fx.y0, P.y - 12, e) - Math.sin(p * Math.PI) * 8, 4, 3);
  }
  // the clerk's bag (its fish are already in the cash box) and the net's new reach ringing out once (4.8)
  for (const s of STAFF) if (s.bag > 0 && VIS(s.x, s.y, 24)) drawA(pileArt(clamp(R(Math.sqrt(s.bag) / 2), 1, 5)), R(s.x), R(s.y) - 17, 8, 17);
  for (const fx of FX) if (fx.k === 'netring' && fx.t >= 0) {   // a net just bought: the ring opens out (0.6 s), then stays a while and fades (G5)
    const p = clamp(fx.t / .6, 0, 1), r = lerp(fx.r0, fx.r1, 1 - (1 - p) * (1 - p));
    netRing(r, .6 * clamp((fx.life - fx.t) / (fx.life - .6), 0, 1));
  } else if (fx.k === 'vtrail' && fx.t >= 0) {   // the VIP's gold glints: each fades in and out once (slow, no blinking)
    const p = fx.t / fx.life; g.globalAlpha = .9 * Math.sin(p * Math.PI); g.fillStyle = '#ffe14a';
    g.fillRect(R(fx.x) - CX, R(fx.y - p * 4) - CY, 1, 1); if (p > .3 && p < .7) { g.globalAlpha *= .5; g.fillRect(R(fx.x) - 1 - CX, R(fx.y - p * 4) - CY, 3, 1); g.fillRect(R(fx.x) - CX, R(fx.y - p * 4) - 1 - CY, 1, 3); }
    g.globalAlpha = 1;
  }
  // towel stacks on the staff's heads and the waiters' trays (the innkeeper's own: drawPlayerAttach)
  for (const s of STAFF) if (s.carry > 0) towelStack(s, s.carry, 0);
  for (const s of STAFF) if (s.tray.length) drawTray(s, s.tray);
  for (const fx of FX) {
    if (fx.t < 0) continue;
    const fr = clamp(Math.floor(fx.t / fx.life * 4), 0, 3);
    if (fx.k === 'spark') drawA(sparkleArt(fr), fx.x, fx.y, 4, 4);
    else if (fx.k === 'poof') drawA(poofArt(fr), fx.x, fx.y, 8, 6);
    else if (fx.k === 'pour') { const p = fx.t / fx.life; drawA(fishIcon(), lerp(fx.x0, fx.x1, p), lerp(fx.y0, fx.y1, p) - Math.sin(p * Math.PI) * 12, 4, 3); }
    else if (fx.k === 'give') { const p = fx.t / fx.life; drawA(itemIcon(fx.it), lerp(fx.x0, fx.x1, p), lerp(fx.y0, fx.y1, p) - Math.sin(p * Math.PI) * 8, 3, 3); }   // handed over: the portion hops across
  }
  for (const u of visiblePads()) { const [tx, ty] = padXY(u); if (VIS(tx * TILE + 8, ty * TILE + 8, 20)) padLabels(u); }
  drawFullPiles();   // v2.2: 满 over a full pile (business.js)
  manekiPaw(); rareOverlay(); fwClock();   // v2.1 core B: the maneki outfit's wave, rare guests' rings / bubble, the fireworks' clock
  for (const p of POPS) if (!(p.wait > 0)) txt(p.s, p.x - CX, p.y - CY, p.size, p.col, 'center', OUT, Math.min(1, p.life / p.max * 2));
}
// towel stacks on heads (the top layers lag a little when walking); the first towel rests on the head (ear tips are 18px up)
function towelStack(e, n, sway) { const tw = towelArt(), b = headBob(e); for (let i = 0; i < n; i++) drawA(tw, R(e.x + sway * i / Math.max(4, n)), R(e.y) - 17 - b - i * 2, 5, 2); }
// what the innkeeper carries / shows on himself, drawn in his own small layer so it moves with him to the device pixel
// (render: attachLayer); returns whether anything was drawn
function drawPlayerAttach() {
  let any = false;
  // bought shoes: speed lines at your feet for 2 s (7.3.4)
  for (const fx of FX) if (fx.k === 'speed' && fx.t >= 0) {
    const a = 1 - fx.t / fx.life, sd = P.dir === 'left' ? 1 : P.dir === 'right' ? -1 : 0, up = P.dir === 'up' ? 1 : P.dir === 'down' ? -1 : 0;
    g.globalAlpha = .8 * a; g.fillStyle = '#ffffff'; any = true;
    for (let i = 0; i < 3; i++) { const o = ((fx.t * 40 + i * 5) % 12); if (sd) g.fillRect(R(P.x) + sd * (6 + o) - CX, R(P.y) - 9 + i * 4 - CY, 3, 1); else g.fillRect(R(P.x) - 5 + i * 5 - CX, R(P.y) + up * (4 + o) - (up < 0 ? 22 : 0) - CY, 1, 3); }
    g.globalAlpha = 1;
  }
  // the hand lantern at night (3 x 4 px) and two sparkles round a hat you are trying on (4.10 / 4.11)
  if (dayLight().night > .5) { const [lx, ly] = lanternXY(), x = lx - CX, y = ly - CY; g.fillStyle = OUT; g.fillRect(x, y - 3, 1, 1); g.fillStyle = '#7a4a2a'; g.fillRect(x - 1, y - 2, 3, 1); g.fillStyle = '#ffd27a'; g.fillRect(x - 1, y - 1, 3, 2); g.fillStyle = '#fff3c0'; g.fillRect(x, y - 1, 1, 1); any = true; }
  if (TRY.hat && !P.towels) { const fr = Math.floor(T * 3) & 3, b = headBob(P); drawA(sparkleArt(fr), R(P.x) - 7, R(P.y) - 25 - b, 4, 4); drawA(sparkleArt((fr + 2) & 3), R(P.x) + 7, R(P.y) - 21 - b, 4, 4); any = true; }
  // the decor slot you stand on: a small ring at your feet until the next piece swaps in
  if (P.slot.key && !P.slot.stop && P.slot.t > 0) { ring(R(P.x) - CX, R(P.y) + 6 - CY, P.slot.t / (P.slot.n ? DECOR_T : DECOR_T0), '#ffe9a8'); any = true; }
  // v2.4: standing still on a price pad - a gold ring at your feet fills before the first fish goes in (PAD_DELAY)
  if (P.padOn && !P.pouring && P.padT > 0 && P.padT < PAD_DELAY) { ring(R(P.x) - CX, R(P.y) + 6 - CY, P.padT / PAD_DELAY, '#ffd23f'); any = true; }
  if (MIRROR.t > 0 && MIRROR.armed) { ring(R(P.x) - CX, R(P.y) + 6 - CY, MIRROR.t / MIRROR_OPEN_T, '#ffd23f'); any = true; }   // v2.5: the mirror opens the 装扮 page
  if (P.towels > 0) { towelStack(P, P.towels, P.sway); any = true; }
  // the tray (4.1); a new tray: its new empty place glows once (7.3.4)
  if (P.tray.length) { drawTray(P, P.tray); any = true; }
  for (const fx of FX) if (fx.k === 'trayslot' && fx.t >= 0) {
    const up = P.dir === 'up', sd = P.dir === 'left' ? -1 : P.dir === 'right' ? 1 : 0, x = R(P.x) + (up ? 7 : sd * 5) - CX, y = R(P.y) - (up ? 14 : 8) - headBob(P) - CY, n = P.tray.length;
    const sx = x - 3 + n * 2 - 3, sy = y - 3 - (n & 1) - 3; any = true;
    g.globalAlpha = Math.sin(fx.t / fx.life * Math.PI); g.fillStyle = '#ffd23f'; g.fillRect(sx, sy, 7, 1); g.fillRect(sx, sy + 6, 7, 1); g.fillRect(sx, sy, 1, 7); g.fillRect(sx + 6, sy, 1, 7); g.globalAlpha = 1;
  }
  if (P.cookK) { ring(R(P.x) - CX, R(P.y) - 30 - CY, P.cookT / (P.cookK === 'kaiseki' ? KAISEKI_T : STOVE_T), P.cookK === 'kaiseki' ? '#ffd23f' : '#ffe9a8'); any = true; }   // cooking at the stove (kaiseki: gold)
  return any;
}
function drawGuide() {
  if (!S.tut.moved) {   // first-time hint: a hand dragging a ghost joystick + 拖动走路
    const t = T % 1.6, k = clamp((t - .3) / .8, 0, 1), e = k * k * (3 - 2 * k);
    g.globalAlpha = .6; drawC(joyBase(), 90, 236); g.globalAlpha = 1;
    drawC(joyKnob(), 90 + e * 11, 236 - e * 5);
    g.globalAlpha = t > 1.3 ? clamp((1.6 - t) / .3, 0, 1) : 1; drawC(handArt(), 94 + e * 11, 243 - e * 5); g.globalAlpha = 1;
    txt('拖动走路', 90, 262, 9, '#ffffff');
    return;
  }
  const gt = GUIDE; if (!gt || gt.here) return;
  const fr = Math.floor(T * 2.5) & 1, sx = gt.x - CX, sy = gt.y - CY;
  let lift = { shelf: 26, desk: 22, clean: 22, pile: 19, deliver: 22, vip: 22, photo: 22, urn: 20, milk: 20, pass: 20, stove: 20, slot: 14, suite: 15 }[gt.kind] || 15;   // 6: lift by kind
  if (gt.kind === 'pad' && PADPOS.has(gt.id)) { const { over, named } = padLayout(UNLOCK[gt.id]); lift = 15 + (over ? 8 : 0) + (named ? 9 : 0); }   // stay clear of the price / name
  const ic = guideIcon(gt);   // what you go there for, beside the arrow (6)
  const bt = GUIDE_BUBBLED.has(gt.kind) ? bubbleTop(gt.e) : null, onx = bt ? bt[0] - CX : sx, ony = bt ? bt[1] - CY - 6 : sy - lift;   // over its bubble
  if (sx > 4 && sx < W - 4 && ony > 18 && sy < H - 2) {
    const ay = ony + R(Math.sin(T * 4) * 2); drawC(arrowArt(fr), onx, ay);
    // a guest / the VIP already shows what it wants in its bubble right under the arrow: no second icon on screen
    if (ic && !GUIDE_BUBBLED.has(gt.kind) && !glowTagged(gt)) { const k = (ic.width >> 1) + 7, side = onx + k + (ic.width >> 1) + 2 > W ? -1 : 1; guideTag(ic, onx + side * k, ay); }
    return;
  }
  // off screen: an arrow on the screen edge pointing at it (inside the edge box: clear of the banner and the bottom card);
  // the icon sits on its tail
  const { x: ex, y: ey, q } = edgePoint(sx, sy);
  const b = R(Math.sin(T * 5) * 1.5), bx = q === 3 ? b : q === 1 ? -b : 0, by = q === 0 ? b : q === 2 ? -b : 0;
  const ax = clamp(ex, 6, W - 6) + bx, ay = ey + by;
  drawC(rotOf(arrowArt(fr), q), ax, ay);
  if (ic) {
    const kx = (ic.width >> 1) + 7, ky = (ic.height >> 1) + 7;
    guideTag(ic, clamp(ax + (q === 1 ? kx : q === 3 ? -kx : 0), (ic.width >> 1) + 2, W - (ic.width >> 1) - 2), ay + (q === 0 ? -ky : q === 2 ? ky : 0));
  }
}
const GUIDE_BUBBLED = new Set(['deliver', 'vip', 'photo', 'stay']);   // v2.1: + a rare guest's 'stay' wish
// a dotted ring of radius r round the innkeeper's feet (the net's reach)
// (one cached image per whole radius: 18.2 perf)
const NETC = new Map();
function netRing(r, a) {
  if (a <= 0) return;
  r = R(r); let c = NETC.get(r);
  if (!c) {
    c = mk(2 * r + 3, 2 * r + 3); const o = c.getContext('2d'), n = Math.ceil(r * 2.4); o.fillStyle = '#fff6d8';
    for (let i = 0; i < n; i++) { if (i % 3 === 2) continue; const t = i / n * Math.PI * 2; o.fillRect(r + 1 + R(Math.cos(t) * r), r + 1 + R(Math.sin(t) * r), 1, 1); }
    NETC.set(r, c);
  }
  g.globalAlpha = a; g.drawImage(c, R(P.x) - r - 1 - CX, R(P.y - 2) - r - 1 - CY); g.globalAlpha = 1;
}
// the top centre (world px) of the bubble a guest / the VIP shows (the same places drawOverlays draws them), or null
function bubbleTop(e) {
  if (!e) return null;
  if (e === VIPG) {
    if (e.st === 'seated' && vipWish()) return [R(e.x), R(e.y) - 20 + 2 - 2 * vipBubbleImg(vipWish()).height + 1];   // the big wish bubble (G1; v2.2: the route bubble is taller)
    const shows = e.st === 'arrive' || e.st === 'carpet' || (e.st === 'follow' && e.halt) || e.st === 'show';   // v2.1: a rare guest you lead to its piece shows its wish (rare.js)
    return shows ? [R(e.x), R(e.y) - 20 - 12] : null;
  }
  if (e.gone || !GUESTS.includes(e)) return null;
  const [bx, by] = guestHead(e), bub = e.bub && e.st !== 'sleep';
  return e.call ? [bx, by - (bub ? 13 : 0) - 12] : bub ? [bx, by - 12] : null;
}
// the arrow's icon on a small dark pill (readable on light and dark floors); x, y = the icon's centre
function guideTag(ic, x, y) { const w = ic.width + 2, h = ic.height + 2; pill(R(x - w / 2), R(y - h / 2), w, h); drawC(ic, x, y); }
function drawJoy() {
  if (!JOY.on || state !== 'play') return;
  const d = Math.hypot(JOY.dx, JOY.dy), m = d > 14 ? 14 / d : 1;
  g.globalAlpha = .75; drawC(joyBase(), JOY.bx, JOY.by); drawC(joyKnob(), JOY.bx + JOY.dx * m, JOY.by + JOY.dy * m); g.globalAlpha = 1;
}
function pill(x, y, w, h) { g.globalAlpha = .5; g.fillStyle = OUT; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2); g.globalAlpha = 1; }
function drawHUD() {
  const n = fmt(R(DISP)), w = Math.max(30, 19 + n.length * 4.5) | 0;
  pill(2, 2, w, 13);
  drawC(fishIcon(), 9, 8 - (hudBump > 0 ? 1 : 0));
  // 4.8: a 2 px bar under the number = fish on you / what the cheapest visible progress pad still needs (gold: enough)
  let need = 0, nu = null; for (const u of visiblePads()) if (!u.booth && !u.decor && !u.goldOf && !u.noArrow) { const k = padNeed(u); if (k > 0 && (!need || k < need)) { need = k; nu = u; } }   // v2.1: not gold decor / the fireworks
  txt(n, 16, need ? 7.5 : 8.5, 8, '#ffe9a8', 'left');
  if (need) {
    const bw = w - 18, f = clamp(S.money / need, 0, 1); g.fillStyle = OUT; g.fillRect(16, 12, bw, 2); g.fillStyle = f >= 1 ? '#ffd23f' : '#7ae07a'; g.fillRect(16, 12, Math.max(1, R(bw * f)), 2);
    pill(2 + w - 1, 2, 15, 13); g.drawImage(padIcon(nu.icon), 2 + w, 3);   // what the bar is filling up for
  }
  const sx = 2 + w + (need ? 17 : 3); pill(sx, 2, 43, 13);
  for (let i = 0; i < 5; i++) {
    const x = sx + 6 + i * 8;
    if (i === star() - 1 && T - starPopAt < .6) {   // a star just earned: scales in (0 -> 1.15 -> 1) under a sparkle, no flash
      const w = R(7 * popScale(starPopAt));
      if (w > 0) g.drawImage(starIcon(true), R(x - w / 2), R(8 - w / 2), w, w);
      drawC(sparkleArt(clamp(Math.floor((T - starPopAt) / .6 * 4), 0, 3)), x, 8);
    } else if (i === goldStars() - 1 && T - goldPopAt < .6) {   // a gold star just lit: it scales in the same way (4.9)
      const w = R(7 * popScale(goldPopAt)); if (w > 0) g.drawImage(starIcon(true, true), R(x - w / 2), R(8 - w / 2), w, w);
    } else drawC(starIcon(i < star(), i < goldStars()), x, 8);
  }
  // the menu button (7.1): pause sign + 2 characters, top right; pressing x >= 134, y <= 18 opens it (no joystick)
  if (dressNew()) { g.globalAlpha = .45 + .25 * Math.sin(T * Math.PI * 1.6); g.fillStyle = '#ffd23f'; g.fillRect(136, 0, 44, 17); g.globalAlpha = 1; }   // v2.5: something new to wear - a soft glow (no blinking) + a red dot
  pill(138, 2, 40, 13); drawC(pauseIcon(), 149, 8); txt('菜单', 155, 8.5, 7, '#ffffff', 'left');
  if (dressNew()) { g.fillStyle = OUT; g.fillRect(173, 0, 7, 7); g.fillStyle = '#e04a3a'; g.fillRect(174, 1, 5, 5); g.fillStyle = '#ff9a8a'; g.fillRect(175, 2, 2, 1); }
  // second row (7.1, from star 2): the sky dial (sun / moon on the arc, no text), the rank pill, the bell pill (open calls)
  if (star() < 2) return;
  const dl = dayLight(); g.drawImage(skyDialArt(dl.night), 2, 17);
  { const c = S.clock, day = c >= .08 && c < .72, p = day ? (c - .08) / .64 : ((c - .72 + 1) % 1) / .36, a = Math.PI * (1 - p);
    drawC(day ? sunIcon() : moonIcon(), R(2 + 10.5 + Math.cos(a) * 7), R(17 + 10 - Math.sin(a) * 7)); }
  const rk = '#' + rankOf(S.hearts), rw = 13 + rk.length * 4; pill(26, 17, rw, 11); drawC(trophyIcon(), 32, 22); txt(rk, 37, 22.5, 7, '#ffe9a8', 'left');
  const nc = callCount(), bx = 26 + rw + 3;
  if (nc > 0) { pill(bx, 17, 21, 11); drawC(bellIcon(), bx + 6, 22); txt(String(nc), bx + 12, 22.5, 7, '#ffe9a8', 'left'); }
  drawHudV21a(drawBizHud(bx + (nc > 0 ? 24 : 0)));   // v2.2: the evening rush's clock / today's stars (business.js)   // v2.1: the festival lanterns, the "popular" cover + ring (seasons.js)
}
function drawFly() {
  for (const f of FX) if (f.k === 'fly' && f.t >= 0) {
    const p = clamp(f.t / f.life, 0, 1), e = p * p;
    drawC(fishIcon(), lerp(f.x0, 9, e), lerp(f.y0, 8, e) - Math.sin(p * Math.PI) * 14);
  } else if (f.k === 'polaroid' && f.t >= 0) {   // a VIP photo flies to the menu button (top right; 7.1)
    const p = clamp(f.t / f.life, 0, 1), e = p * p, x = R(lerp(f.x0, 158, e)), y = R(lerp(f.y0, 9, e) - Math.sin(p * Math.PI) * 18);
    drawC(polaroidArt(), x, y); g.drawImage(vipFace(f.id), x - 6 + 2, y - 7 + 2);
  }
}
function render() {
  TQ.length = 0; TQ0 = 0; VM = 0; LGT = null; g = low.getContext('2d'); g.imageSmoothingEnabled = false; g.globalAlpha = 1;
  padsUpdate();
  if (state === 'title') {   // a still camera: one layer as before; the speaker stays on the title (7.1)
    CX = R(cam.x); CY = R(cam.y); SUBX = SUBY = 0;
    drawScene(W, H, false); drawSeasonFx(0); drawTitle(); drawC(soundIcon(musicOn || sfxOn), 172, 8); present(); return;
  }
  // the world layers (see worldBegin): whole-pixel camera + the remainder on the screen
  SUBX = cam.x - R(cam.x); SUBY = cam.y - R(cam.y);
  worldBegin(); OCC.length = 0; PSPLIT = true;
  drawScene(W, H, true); PSPLIT = false;
  drawSeasonFx(0);   // v2.1: petals / leaves / snow, under the night tint
  drawLighting(); drawSkyB(); drawSeasonFx(1);   // v2.1: drawSkyB = the plaza's fireworks show (plaza.js); drawSeasonFx(1) = fireflies, festival fireworks, the full moon, lantern glow (seasons.js)
  worldFlush();
  playerLayer();
  worldBegin(); if (INFO && state === 'play') drawPreview(INFO); drawOverlays(); drawGuide(); worldFlush();
  attachLayer();
  if (LINE) { worldBegin(); drawLine(); worldFlush(); }   // the line bubble covers the world's words under it (prices, names)
  // the HUD layer: no shift
  g = low.getContext('2d'); VM = 0; CX = R(cam.x); CY = R(cam.y); g.clearRect(0, 0, W, H);
  drawJoy(); drawEdgeNew(); drawBanner(); drawHUD(); drawBottomCard(); drawFly();
  if (state === 'celebrate') { layerBreak(); drawCelebrate(); }
  if (state === 'menu') { layerBreak(); drawMenu(); }
  if (state === 'card') { layerBreak(); drawModal(); }   // v2.1: the year report / press result / family photo (yearly.js)
  present();
}
