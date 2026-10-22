// ============================================================ UI (SPEC_v2 7): info card + preview, banners, "new" tags, first-time cards, menu
// Screen zones (7.7) never overlap: y 0-28 the HUD (two rows), y 30-48 the top banner, the world in between (icon bubbles,
// the one cat line, the arrow, pads, previews, wish boards, names), the screen edges (the off-screen arrow, <= 2 "new"
// tags, kept between y 56 and 280), y 288-314 the bottom card (the info card, else a first-time picture card). render()
// draws the world, then layerBreak(), then the UI: world text (prices, names, pops) never shows through the UI.
const NEW_TAG_T = 15, EDGE_T = 4, FIRST_T = 20, EDGE_Y0 = 56, EDGE_Y1 = 280, CARD_Y = 290;
const BANNER_IN = .2, BANNER_OUT = .2, bannerHold = b => b.kind === 'day' ? 2.5 : b.kind === 'level' ? 2 : b.kind === 'rep' ? 3.5 : 2.6;
const unlockIcon = u => u.decor ? decorIcon(u.id) : u.hat ? hatIcon(u.id) : u.pet ? petIcon(u.id) : u.v21b ? unlockIconB(u) : padIcon(u.icon);   // v2.1 core B: menu-v21b.js
// album faces: (1,4)-(15,17) of the front sprite, 14 x 13 (12.1); silhouettes for "not seen yet"
const FACES = new Map(), SILS = new Map();
function faceOf(look) {
  let c = FACES.get(look); if (c) return c;
  c = mk(14, 13); c.getContext('2d').drawImage(catSprite('down', 0, look), 1, 4, 14, 13, 0, 0, 14, 13); FACES.set(look, c); return c;
}
function silOf(c) { let s = SILS.get(c); if (!s) { s = tintC(c, '#3a2c40'); SILS.set(c, s); } return s; }
const VIP_LOOK = NUL(); VIPS.forEach(v => { VIP_LOOK[v.id] = { fur: v.fur, outfit: 'robe', robe: v.robe, hat: v.hat || null, acc: v.acc || null }; });
const staffDefLook = NUL(); for (const id in STAFF_DEF) staffDefLook[id] = STAFF_DEF[id].look;

// ---- a row of pictures and words (banner, cards): [{ img, s } | { t, c, z, o } | { gap }], laid out left to right
function partW(p) { return p.img ? p.img.width * (p.s || 1) : p.t !== undefined ? textW(p.t, p.z || 7) : 0; }
function partsW(parts) { let w = 0; parts.forEach((p, i) => { w += partW(p) + (i < parts.length - 1 ? (p.gap !== undefined ? p.gap : 2) : 0); }); return w; }
function drawParts(parts, x, cy, a) {
  a = a === undefined ? 1 : a;
  for (const p of parts) {
    if (p.img) { const s = p.s || 1, w = p.img.width * s, h = p.img.height * s; g.globalAlpha = a * (p.a === undefined ? 1 : p.a); g.drawImage(p.img, R(x), R(cy - h / 2), w, h); g.globalAlpha = 1; }
    else if (p.t !== undefined) txt(p.t, x, cy + .5, p.z || 7, p.c || '#5a3a1a', 'left', p.o === undefined ? null : p.o, a);
    x += partW(p) + (p.gap !== undefined ? p.gap : 2);
  }
}
// a pixel arrow "->" (7 x 5) for the picture cards
const ARROW_R = (() => { const c = mk(7, 5), x = c.getContext('2d'); x.fillStyle = '#8a5a34'; x.fillRect(0, 2, 5, 1); x.fillRect(4, 0, 1, 5); x.fillRect(5, 1, 1, 3); x.fillRect(6, 2, 1, 1); return c; })();
// two paw prints (7 x 7): "follow me"
const PAWS = (() => { const c = mk(9, 9), x = c.getContext('2d'); x.fillStyle = '#8a5a34'; for (const [px, py] of [[0, 5], [5, 0]]) { x.fillRect(px + 1, py + 2, 2, 2); x.fillRect(px, py, 1, 1); x.fillRect(px + 2, py, 1, 1); x.fillRect(px + 3, py + 1, 1, 1); } return c; })();
// a green tick (7 x 6): you can afford it
const TICK = (() => { const c = mk(7, 6), x = c.getContext('2d'); x.fillStyle = OUT; x.fillRect(0, 2, 3, 3); x.fillRect(2, 3, 2, 3); x.fillRect(3, 0, 4, 4); x.fillStyle = '#5ad05a'; x.fillRect(1, 3, 1, 1); x.fillRect(2, 4, 1, 1); x.fillRect(3, 3, 1, 1); x.fillRect(4, 2, 1, 1); x.fillRect(5, 1, 1, 1); return c; })();

// a round green badge with a white tick (9 x 9 + the painter's outline = 11 x 11): a VIP wish done (G1) - big over its
// head (FX 'vipok'), small on the wish board
const okBadge = () => art('core:okbadge', () => rows(['..GGGGG..', '.GGGGGGG.', 'GGGGGGGWG', 'GGGGGGWWG', 'GWGGGWWGG', 'GWWGWWGGG', 'GGWWWGGGG', '.GGWGGGG.', '..GGGGG..'], { G: '#4ab84a', W: '#ffffff' }));
// ---- 7.2 the info card: the nearest visible pad within 2 tiles (or the one you stand on); data for render, set in uiUpdate
let INFO = null;
function infoPad() {
  if (state !== 'play' || !S.tut.moved) return null;
  let best = null, bd = 2 * TILE + .01;
  for (const [id, xy] of PADPOS) { if (padLocked(UNLOCK[id])) continue;   // just bought here: the banner names what you got; the next piece's card waits until you step off
    const d = dist(P.x, P.y, tcx(xy), tcy(xy)); if (d < bd) { bd = d; best = UNLOCK[id]; } }
  return best;
}
function cardBase(x, y, w, h, wood) {
  g.fillStyle = OUT; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  if (wood) {   // the info card: a dark wooden plaque
    g.fillStyle = '#8a5a34'; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = '#b77b46'; g.fillRect(x + 2, y + 1, w - 4, 1);
    g.fillStyle = '#4a2e1c'; g.fillRect(x + 2, y + 3, w - 4, h - 5); g.fillStyle = '#5a3a24'; g.fillRect(x + 2, y + 3, w - 4, 1);
  } else {      // a picture card: cream paper with a wooden rim
    g.fillStyle = '#b77b46'; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = '#fff3d0'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 2, w - 4, 1);
  }
}
function drawInfoCard(u) {
  const two = !!u.rare, x = 12, y = CARD_Y - (two ? 12 : 0), w = 156, h = two ? 36 : 24, cy = y + 12, need = Math.max(0, padNeed(u)), ok = S.money >= need;   // v2.5: a garden piece's card has a second row
  cardBase(x, y, w, h, true);
  let lx = x + 20;
  if (u.decor || u.goldOf) { const ic = unlockIcon(u); g.fillStyle = OUT; g.fillRect(x + 1, y - 5, 24, 24); g.fillStyle = '#fff3d0'; g.fillRect(x + 2, y - 4, 22, 22); g.drawImage(ic, x + 3, y - 3, 20, 20); lx = x + 29; }   // 7.2: a bigger decor icon
  else drawC(unlockIcon(u), x + 11, cy);
  txt(u.name, lx, cy + .5, 8, '#ffd23f', 'left'); lx += textW(u.name, 8) + 3;
  if (two) { gzBonusB(lx, cy); infoRareB(u, x + 6, y + 26); }   // v2.5: [cottage] +3% | 会引来 [face ?] [when] -> [keepsake]
  else {
    txt('·', lx, cy + .5, 7, '#c8a878', 'left', null); lx += textW('·', 7) + 3;
    txt(u.card, lx, cy + .5, 7, '#ffffff', 'left'); lx += textW(u.card, 7) + 3;
    if (u.shrine) txt('收费+1%', lx, cy + .5, 7, '#ff9ad0', 'left');   // v2.5: what an offering does (the shrine's torii is not the garden's)
  }
  // the price on the right: fish + amount (+ a green tick when you can pay it all)
  let rx = x + w - 5;
  if (ok) { g.drawImage(TICK, rx - 7, cy - 3); rx -= 9; }
  const lab = fmt(need); txt(lab, rx, cy + .5, 7, ok ? '#ffe9a8' : '#ffffff', 'right'); rx -= textW(lab, 7) + 1;
  drawC(fishIcon(), rx - 5, cy);
  if (P.pouring === u.id || (S.paid[u.id] || 0) > 0) {   // pouring: how far it is (gold bar along the bottom)
    const f = clamp((S.paid[u.id] || 0) / u.price, 0, 1), bw = w - 8;
    g.fillStyle = '#2a1a10'; g.fillRect(x + 4, y + h - 4, bw, 2); g.fillStyle = '#ffd23f'; g.fillRect(x + 4, y + h - 4, Math.max(1, R(bw * f)), 2);
  }
}
// ---- 7.2 preview: what this pad brings, faint where it will be (alpha .35-.55, breathing once a second: never blinks)
const BUY_LABEL = { shoes: '▲', basket: '+3', tray: '+1' }, GHOSTS = new Map();

function drawPreview(u) {
  // each ghost = the real sprite, faint, under a pale-blue sheen (ghostTint): it reads as "this will be here" on light floors too
  const a = .45 + .1 * Math.sin(UIT * Math.PI * 2), gh = c => { const k = GHOSTS.get(c); if (k) return k; const o = mk(c.width, c.height), x = o.getContext('2d'); x.globalAlpha = .8; x.drawImage(c, 0, 0); x.globalAlpha = .55; x.drawImage(ghostTint(c), 0, 0); GHOSTS.set(c, o); return o; };
  g.globalAlpha = a;
  for (const p of PROPS) if (p.need === u.id) {   // the props it brings (tea urn, milk, tables, garden things, shop shelves ...)
    const fw = p.fw || 1, fh = p.fh || 1, by = (p.at[1] + fh) * TILE;
    if (VIS(p.at[0] * TILE + fw * 8, by - 8, 48)) drawObj(gh(p.img()), p.at[0], by, fw);
  }
  for (const rm of ROOMS) if (rm.open === u.id && VIS(rm.cleanC[0], rm.cleanC[1], 48)) {   // a room: futon, table, andon (+ the suite's tub)
    const by = (rm.y0 + 1) * TILE;
    drawObj(gh(futonArt('clean', 0, rm.furn)), rm.futon[0], (rm.y0 + 2) * TILE, 1);
    if (rm.futonB) drawObj(gh(futonArt('clean', 0, rm.furn)), rm.futonB[0], (rm.y0 + 2) * TILE, 1);
    drawObj(gh(tableArt(rm.furn)), rm.table[0], by, 1); drawObj(gh(andonArt(rm.furn)), rm.andon[0], by, 1);
    if (rm.tub) drawObj(gh(tubArt(2)), rm.tub[0], (rm.tub[1] + 1) * TILE, 1);
  }
  for (const id in STAFF_DEF) {   // a new hire: its ghost at its post
    const d = STAFF_DEF[id]; if (d.need !== u.id || STAFF.some(s => s.id === id)) continue;
    const h = d.role === 'recep' ? DESK_SPOT : d.home, x = tcx(h), y = tcy(h);
    if (VIS(x, y, 24)) g.drawImage(gh(catSprite('down', 0, d.look)), R(x) - 8 - CX, R(y) - 23 - CY);
  }
  SLOTS.forEach(sl => { if (sl.need === u.id && VIS(sl.x * TILE + 8, 3 * TILE + 10, 24)) drawA(gh(catBathing('white', 0)), sl.x * TILE + 8, 3 * TILE + 10, 9, 9); });   // new bath places
  SEATS.forEach(se => { if (se.need === u.id && VIS(tcx(se.at), tcy(se.at), 16)) drawA(gh(cushionArt()), tcx(se.at), tcy(se.at), 6, 3); });            // new seats
  if (u.id === 'koi') for (let i = 0; i < 3; i++) { const x = (POND[0] + POND[1] + 1) / 2 * TILE + (i - 1) * 14, y = 16 * TILE + 8 + (i & 1) * 6; if (VIS(x, y, 8)) drawA(gh(koiArt(['red', 'gold', 'black'][i], 0)), x, y, 4, 2); }
  drawPreviewB(u, gh);   // v2.1 core B: the next shrine hall, an outfit / uniform on you
  if (/^net\d$/.test(u.id)) {   // the net: its new reach round your feet
    const r = NET_R[Math.min(3, netLvl() + 1)], n = Math.ceil(r * 1.6); g.fillStyle = '#fff6d8';
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; g.fillRect(R(P.x + Math.cos(t) * r) - CX, R(P.y - 2 + Math.sin(t) * r) - CY, 1, 1); }
  }
  const lab = BUY_LABEL[u.icon];
  if (lab && !P.towels) {   // shoes / basket / tray: a small sign over your head (shoe up / basket +3 / tray +1)
    const ic = padIcon(u.icon), w = 12 + 2 + Math.ceil(textW(lab, 7)) + 4, x = R(P.x - w / 2) - CX, y = R(P.y) - 40 - CY;

    pill(x, y, w, 14); g.drawImage(ic, x + 2, y + 1); g.globalAlpha = 1; txt(lab, x + 16, y + 7.5, 7, '#ffe9a8', 'left', OUT, a / .55);
  }
  g.globalAlpha = 1;
}

// ---- 7.3 the top banner: BANNER_Q[0] slides down (0.2 s), stays 2.6 s, slides back; the same banner for a buy, a new area
// (area icon + gold rim), a combo (two icons, purple-gold rim), an overtake, a gold star, a level-up, a new day, a milestone
// guest, the statue, the v1 save's "the inn grew!" - only the icon and the colours change. Timed in UI time (paused in the menu).
function bannerParts(b) {
  const u = UNLOCK[b.id], dk = '#5a3a1a', NEW = { t: '新！', c: '#e04a3a', z: 8, gap: 3 };
  switch (b.kind) {
    case 'buy': return { rim: '#8a5a34', parts: [NEW, { img: unlockIcon(u), gap: 3 }, { t: L('{0} · {1}', u.name, u.card), c: dk }] };
    case 'area': return { rim: '#ffc21f', parts: [NEW, { img: padIcon(u.icon), gap: 3 }, { t: L('{0} · {1}', u.name, u.card), c: dk }].concat(b.star ? [{ gap: 1 }, { img: starIcon(true) }] : []) };
    case 'statue': return { rim: '#ffc21f', parts: [NEW, { img: padIcon('statue'), gap: 3 }, { t: L('{0} · {1}', u.name, u.card), c: dk }] };
    case 'hint': { const c = COMBO[b.id]; return { rim: '#a070e0', parts: [NEW, { img: decorIcon(c.a), gap: 1 }, { t: '+', c: '#8a5ac8', gap: 1 }, { img: decorIcon(c.b), gap: 2 }, { t: '?', c: '#c03a8a', z: 8 }] }; }
    case 'combo': { const c = COMBO[b.id]; return { rim: '#a070e0', rim2: '#ffc21f', parts: [{ img: decorIcon(c.a), gap: 1 }, { t: '+', c: '#8a5ac8', gap: 1 }, { img: decorIcon(c.b), gap: 4 }, { t: '组合！', c: '#c03a8a', z: 8, gap: 2 }, { t: c.name, c: dk }] }; }
    case 'rank': { const rv = RIVALS.find(r => r.id === b.id); return { rim: '#e0a030', parts: [{ img: rankBadge(b.id), gap: 3 }, { t: L('超过了 {0}！', rv ? rv.name : ''), c: dk, gap: 4 }, { t: '#' + b.rank, c: '#c0392b', z: 8 }] }; }
    case 'gold': return { rim: '#ffc21f', parts: Array.from({ length: Math.max(1, b.id | 0) }, () => ({ img: starIcon(true, true), gap: 1 })).concat([{ gap: 2 }, { t: '金星点亮！', c: dk }]) };
    case 'level': { const s = STAFF.find(x => x.id === b.id), look = s ? staffLook(s) : staffDefLook[b.id]; return { rim: '#8a5a34', small: true, parts: [{ img: faceOf(look), gap: 3 }, { t: (STAFF_DEF[b.id] || {}).name || '', c: dk, gap: 3 }, { t: 'Lv' + b.lv, c: '#d08a10', z: 8 }] }; }
    case 'day': return { rim: '#e0a030', parts: [{ img: sunIcon(), gap: 3 }, { t: L('第{0}天', b.id), c: dk, gap: 5 }, { img: rankBadge('me'), gap: 2 }, { t: String(b.g), c: dk, gap: 5 }, { img: heartIcon(), gap: 2 }, { t: String(b.h), c: dk }].concat(b.rec ? [{ gap: 3 }, { img: trophyIcon() }] : []) };
    case 'milestone': return { rim: '#e0a030', parts: [{ img: menuIcon('cat'), gap: 3 }, { t: L('第{0}位客人！', b.id), c: dk }] };
    case 'gift': return { rim: '#ffc21f', parts: [{ img: menuIcon('house'), gap: 3 }, { t: '旅馆扩建啦！', c: dk, z: 8 }] };
    // v2.2 (business.js): the evening rush comes; the evening summary - today's stars, the room fee from now on, hearts
    case 'rush': return b.id ? { rim: '#e8453c', rim2: '#ffc21f', parts: [{ img: clockIcon(), gap: 3 }, { t: '大高峰！', c: '#c0392b', z: 8, gap: 5 }, { img: menuIcon('cat'), gap: 2 }, { t: '×' + (b.k || 2.5).toFixed(1), c: dk }] }   // v2.3: the star-5 rush
      : { rim: '#ff9a2a', parts: [{ img: clockIcon(), gap: 3 }, { t: '客人多起来了', c: dk }] };
    case 'rush5ok': { const n = Math.round(b.id / 10); return { rim: '#ffc21f', rim2: '#e8503a', parts: Array.from({ length: 5 }, (_, i) => ({ img: starIcon(i < n), gap: 1 })).concat([{ gap: 2 },   // v2.3: 高峰大成功
      { t: (b.id / 10).toFixed(1), c: dk, gap: 4 }, { t: '大成功！', c: '#c0392b', z: 8, gap: 4 }, { img: heartIcon(), gap: 1 }, { t: '+' + b.h, c: dk, gap: 4 }, { img: fishIcon(), gap: 1 }, { t: '+' + fmt(b.red || 0), c: dk }]) }; }   // stars rounded: a great rush shows 5
    case 'rep': { const r = b.id / 10, n = Math.floor(r + .01); return { rim: '#e0a030', parts: Array.from({ length: 5 }, (_, i) => ({ img: starIcon(i < n), gap: 1 })).concat([{ gap: 2 }, { t: r.toFixed(1), c: dk, z: 8, gap: 5 },
      { img: fishIcon(), gap: 2 }, { t: (b.pct > 0 ? '+' : '') + b.pct + '%', c: b.pct > 0 ? '#2a8a3a' : b.pct < 0 ? '#c0392b' : dk, gap: 5 }]).concat(b.h ? [{ img: heartIcon(), gap: 2 }, { t: '+' + b.h, c: dk, gap: 5 }] : [])
      .concat(b.why ? [{ img: b.why.startsWith('ex:') ? bubbleArt(b.why.slice(3), 2) : { line: bellIcon(), bed: broomIcon(), towel: towelArt(), food: itemIcon('rice') }[b.why] }, { t: '!', c: '#c0392b', z: 8 }] : []) }; }   // below par: what cost the most (v2.3: a rush guest's extra missed)
  }
  return bannerV21a(b) || bannerPartsB(b);   // v2.1 core A (seasons.js): season, festival, press, mom; core B (menu-v21b.js): rare guests, keepsakes, the shrine, fireworks
}
function drawBanner() {
  const b = BANNER_Q[0]; if (!b) return;
  const st = bannerParts(b); if (!st) return;
  const a = b.age || 0, hold = bannerHold(b), k = clamp(a < BANNER_IN ? a / BANNER_IN : a > BANNER_IN + hold ? 1 - (a - BANNER_IN - hold) / BANNER_OUT : 1, 0, 1);
  const e = k * k * (3 - 2 * k), pw = partsW(st.parts), w = st.small ? Math.max(90, pw + 16) : Math.max(140, Math.min(W - 8, pw + 16)), h = 18;
  const x = R((W - w) / 2), y = R(30 - 12 * (1 - e));
  g.globalAlpha = e;
  g.fillStyle = OUT; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = st.rim; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  if (st.rim2) { g.fillStyle = st.rim2; for (let i = x + 3; i < x + w - 3; i += 4) { g.fillRect(i, y + 1, 2, 1); g.fillRect(i + 2, y + h - 2, 2, 1); } }
  g.fillStyle = '#fff3d0'; g.fillRect(x + 2, y + 2, w - 4, h - 4); g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 2, w - 4, 1);
  g.globalAlpha = 1;
  drawParts(st.parts, x + R((w - pw) / 2), y + h / 2, e);
}

// ---- 7.3 "new" tags on the screen edge for something new out of view (EDGE_Q: <= 2, 4 s each, two small hops a second)
// edge box between the banner and the bottom card: where the line from the view centre to (sx, sy) leaves it
function edgePoint(sx, sy) {
  const cx = W / 2, cy = H / 2 + 8, dx = sx - cx, dy = sy - cy;
  const kx = dx > 0 ? (W - 12 - cx) / dx : dx < 0 ? (12 - cx) / dx : 1e9, ky = dy > 0 ? (EDGE_Y1 - cy) / dy : dy < 0 ? (EDGE_Y0 - cy) / dy : 1e9;
  const k = Math.min(kx, ky);
  return { x: cx + dx * k, y: cy + dy * k, q: kx < ky ? (dx > 0 ? 3 : 1) : (dy > 0 ? 0 : 2) };   // q: arrow quarter turns (0 down, 1 left, 2 up, 3 right)
}
const onView = (wx, wy) => wx - cam.x >= 0 && wx - cam.x < W && wy - cam.y >= 30 && wy - cam.y < H - 34;
function drawEdgeNew() {
  const used = [];
  for (const e of EDGE_Q) {
    const wx = tcx([e.tx, e.ty]), wy = tcy([e.tx, e.ty]), sx = wx - CX, sy = wy - CY;
    if (sx >= 0 && sx < W && sy >= 30 && sy < H - 34) continue;   // in view: nothing to point at
    const p = edgePoint(sx, sy), ic = typeof e.icon === 'string' ? padIcon(e.icon) : e.icon && e.icon.id ? unlockIcon(e.icon) : padIcon('room');
    const hop = R((Math.sin((e.age || 0) * Math.PI * 4) + 1) * .8), ox = p.q === 3 ? hop : p.q === 1 ? -hop : 0, oy = p.q === 0 ? hop : p.q === 2 ? -hop : 0;
    let x = clamp(R(p.x) - 13, 2, W - 28), y = clamp(R(p.y) - 6, EDGE_Y0 - 6, EDGE_Y1 - 6);
    for (const u of used) if (Math.abs(u[0] - x) < 28 && Math.abs(u[1] - y) < 14) { if (p.q & 1) y += y > H / 2 ? -16 : 16; else x += x > W / 2 ? -30 : 30; }
    used.push([x, y]); x += ox; y += oy;
    const nt = newTagArt();
    g.fillStyle = OUT; g.fillRect(x, y, 27, 14); g.fillStyle = '#fff3d0'; g.fillRect(x + 1, y + 1, 25, 12);
    g.drawImage(ic, x + 1, y + 1); g.drawImage(nt, x + 13, y + 3);
    txt('新', x + 13 + nt.width / 2, y + 7.5, 6, '#ffffff', 'center', null);
    // a 3 px pointer on the side that faces the thing
    g.fillStyle = OUT;
    if (p.q === 3) { g.fillRect(x + 27, y + 5, 1, 4); g.fillRect(x + 28, y + 6, 1, 2); } else if (p.q === 1) { g.fillRect(x - 1, y + 5, 1, 4); g.fillRect(x - 2, y + 6, 1, 2); }
    else if (p.q === 0) { g.fillRect(x + 11, y + 14, 5, 1); g.fillRect(x + 12, y + 15, 3, 1); } else { g.fillRect(x + 11, y - 1, 5, 1); g.fillRect(x + 12, y - 2, 3, 1); }
  }
}

// ---- 7.4 first-time picture cards: icons + <= 4 characters, gone once you have done it (at most 20 s on screen)
const FIRST_CARD = {
  call: () => [{ img: padIcon('tea') }, { img: ARROW_R }, { img: bubbleArt('tea', 0, true) }, '端茶有赏'],   // G3: an optional tip
  decor: () => [{ img: decorIcon(decorOwned()[0] || 'd_scroll') }, { img: ARROW_R }, { img: padIcon('room') }, '站着摆放'],
  dine: () => [{ img: padIcon('chef') }, { img: ARROW_R }, { img: itemIcon('rice'), s: 2 }, { img: ARROW_R }, { img: padIcon('table') }, '做饭上菜'],
  vip: () => { const L = []; vipCardSteps().forEach((st, i) => { if (i) L.push({ img: ARROW_R, gap: 2 }); st.forEach(p => L.push(typeof p === 'string' ? { t: p, z: 8, gap: 2 } : Object.assign({ gap: 1 }, p))); }); L.push(L.pop().t); return L; },   // drawn by drawVipCard
  bath: () => [{ img: tubArt(0) }, '站着放水'],
  kaiseki: () => [{ img: padIcon('chef') }, { img: itemIcon('kaiseki'), s: 2 }, '亲手做'],
  photo: () => [{ img: menuIcon('camera') }, { img: faceOf(VIP_LOOK.kawa) }, '站在旁边'],
  tryon: () => [{ img: padIcon('hat') }, { img: ARROW_R }, { img: faceOf(lookWith('straw')) }, '站着换装'],
  // v2.1 core A: the first festival (a check-in lights a lantern), the first reporter (what it checks: 16.4)
  fest: () => [{ img: bellIcon(), s: 2 }, { img: ARROW_R }, { img: lanternIcon(true), s: 2 }, '入住点灯'],
  press: () => [{ img: padIcon('recep') }, { img: padIcon('decor') }, { img: padIcon('basket') }, { img: padIcon('milk') }, '记者打分'],
  // v2.2 (vipguide.js): each kind of wish once - [station] > [item] > [face] + the verb
  w_tea: () => wishCardParts('tea'), w_kai: () => wishCardParts('kaiseki'), w_milk: () => wishCardParts('milk'), w_rice: () => wishCardParts('rice'),
  w_bath: () => wishCardParts('bath'), w_photo: () => wishCardParts('photo'),
  // v2.2 (business.js): the evening rush (more guests: help out), the reputation (stars -> the room fee), a full pile
  rush: () => [{ img: clockIcon(), s: 2 }, { img: faceOf(VIP_LOOK.kawa) }, { img: faceOf(VIP_LOOK.sakura) }, { img: ARROW_R }, { img: padIcon('recep') }, '高峰帮忙'],
  rep: () => [{ img: menuIcon('cat') }, { img: starIcon(true) }, { img: starIcon(true) }, { img: starIcon(true) }, { img: ARROW_R }, { img: fishIcon(), s: 2 }, '口碑'],
  full: () => [{ img: pileArt(8) }, { img: bubbleArt('blank', 0) }, { img: ARROW_R }, { img: faceOf(PLAYER_LOOK) }, '满了去收'],
  rush5: () => [{ img: bubbleArt('tea', 2) }, { img: bubbleArt('towel', 2) }, { img: ARROW_R }, { img: faceOf(PLAYER_LOOK) }, '急客快送'],   // v2.3: the star-5 rush's picky guests - only you bring it
};
// the first VIP's 3-step picture card (G1): greet it -> lead it to a suite -> do what its gold bubble shows. One row of
// icons + 2-character labels; the step you are on sits in a gold frame, the ones done are ticked. It stays up until the
// first wish is done (at most VIP_CARD_T s on screen).
function vipCardSteps() {
  const id = VIPG ? VIPG.id : 'kawa', w = (VIPG && vipWish()) || vipWs(VIPG || { id })[0], st = TRAY_WISH.has(w) && wishStations(w).length ? STATION_ICON[nearStation(wishStations(w))] : null;
  return [[{ img: bubbleArt('card', 0, true) }, { img: faceOf(VIP_LOOK[id] || VIPG.look) }, '迎宾'], [{ img: PAWS }, { img: padIcon('suite') }, '带路'], [{ img: st ? routeIcon(w, st) : bubbleArt(w, 0, true) }, '照办']];   // v2.2: step 3 shows where it is made
}
function drawVipCard(fc) {
  const v = VIPG, cur = !v || v.st === 'arrive' || v.st === 'carpet' ? 0 : v.st === 'follow' || v.st === 'toSuite' ? 1 : 2;
  const steps = vipCardSteps().map(st => st.map((p, i) => typeof p === 'string' ? { t: p, z: 8, c: '#5a3a1a' } : Object.assign({ gap: i < st.length - 2 ? 1 : 3 }, p)));
  const sw = steps.map(partsW), aw = ARROW_R.width + 8, tot = sw.reduce((a, b) => a + b, 0) + aw * 2;
  const x = 12, y = CARD_Y, w = 156, h = 24, a = clamp((fc.vis || 0) / .25, 0, 1);
  g.globalAlpha = a; cardBase(x, y, w, h, false); g.globalAlpha = 1;
  let px = x + R((w - tot) / 2);
  steps.forEach((parts, i) => {
    if (i) { g.globalAlpha = a; g.drawImage(ARROW_R, px + 4, y + 10); g.globalAlpha = 1; px += aw; }
    if (i === cur) { g.globalAlpha = a; g.fillStyle = '#ffc21f'; g.fillRect(px - 2, y + 3, sw[i] + 4, h - 6); g.fillStyle = '#fff8dc'; g.fillRect(px - 1, y + 4, sw[i] + 2, h - 8); g.globalAlpha = 1; }
    drawParts(parts, px, y + h / 2, a * (i < cur ? .45 : 1));
    if (i < cur) { g.globalAlpha = a; g.drawImage(TICK, px + sw[i] - 7, y + 3); g.globalAlpha = 1; }
    px += sw[i];
  });
}
function drawFirstCard(fc) {
  if (fc.key === 'vip') { drawVipCard(fc); return; }
  const def = FIRST_CARD[fc.key]; if (!def) return;
  const L = def(), label = L.pop(), parts = L.map(p => Object.assign({ gap: 3 }, p)).concat([{ gap: 4 }, { t: label, c: '#5a3a1a', z: 8 }]);
  const x = 12, y = CARD_Y, w = 156, h = 24, a = clamp((fc.vis || 0) / .25, 0, 1);
  g.globalAlpha = a; cardBase(x, y, w, h, false); g.globalAlpha = 1;
  drawParts(parts, x + R((w - partsW(parts)) / 2), y + h / 2, a);
}
function drawBottomCard() {
  if (state !== 'play') return;
  if (INFO) drawInfoCard(INFO); else if (FIRST_Q[0]) drawFirstCard(FIRST_Q[0]);
}

// ---- per-frame UI data (no drawing): the info card target, banner / tag / card timers, the line. Banners and the
// first-time card only age while you play (not behind the celebration panel); nothing ages in the menu.
function uiUpdate(dt) {
  UIT += dt;
  INFO = infoPad();
  linesTick(dt);
  for (let i = EDGE_Q.length - 1; i >= 0; i--) { const e = EDGE_Q[i]; e.age = (e.age || 0) + dt; if (e.age >= EDGE_T) EDGE_Q.splice(i, 1); }
  if (state !== 'play') return;
  const b = BANNER_Q[0]; if (b) { if (!b.age && b.line) lineSay(P, b.line); b.age = (b.age || 0) + dt; if (b.age >= BANNER_IN + bannerHold(b) + BANNER_OUT) BANNER_Q.shift(); }   // b.line: said as it comes up
  const fc = FIRST_Q[0]; if (fc && !INFO) { fc.vis = (fc.vis || 0) + dt; if (fc.vis >= (fc.key === 'vip' ? VIP_CARD_T : FIRST_T)) FIRST_Q.shift(); }   // the VIP's 3 steps stay longer (G1)
}
