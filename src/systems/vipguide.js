// ============================================================ v2.2 guests of honour: where a wish is made (SPEC_v2 19.1)
// Player feedback (2026-10-12): "VIP care is still not obvious - I don't know where the things it wants are made". The
// big gold bubble said WHAT (v2.0.1 G1), never WHERE. Now, while a guest of honour waits for something made at a
// station and you don't hold it yet:
//   - the station glows: a gold ring breathing slowly (0.5 Hz, no blinking) round the spot you stand on, and a small tag
//     over it with the item + a 2-character verb (泡茶 / 做饭 / 拿奶 / 拿饭 / 放水); it stops once it is on your tray
//   - its bubble draws the route: [station] > [item] (the item alone once you hold it)
//   - the arrow goes in two steps: the station (its icon = the same [station] > [item] picture), then the guest
//   - each kind of wish has a one-time picture card [station] > [item] > [face] + the verb (new keys, so players who saw
//     the old cards get these once)
//   - a guest only wishes for what the inn can make now (milk needs the milk machine; else it wishes for tea)
// The wish list of a visit is fixed when it is first read (VIPG.ws).
const WISH_MAKE = { tea: () => !!(S.unlocked.tea || S.unlocked.garden), milk: () => !!S.unlocked.milk, rice: () => !!S.unlocked.dining, kaiseki: () => !!S.unlocked.dining };
const wishOk = k => !WISH_MAKE[k] || WISH_MAKE[k]();
function vipWs(v) { if (!v) return []; if (!v.ws) v.ws = (VIP[v.id] ? VIP[v.id].wishes : ['tea', 'bath', 'photo']).map(k => wishOk(k) ? k : 'tea'); return v.ws; }
const STATION_ICON = { urn1: 'urn', urn2: 'urn', milk: 'milk', milk2: 'milk', stove: 'stove', pass: 'pass', tap: 'tub' };
const WISH_VERB = { tea: '泡茶', kaiseki: '做饭', milk: '拿奶', rice: '拿饭', bath: '放水', photo: '合影' };
const TRAY_WISH = new Set(['tea', 'kaiseki', 'milk', 'rice']);
// the stations that make wish k right now: pick-up zone ids (ZONE / PICK_TILE) or 'tap' (the suite's tub)
function wishStations(k) {
  if (k === 'tea') return [S.unlocked.tea ? 'urn1' : null, S.unlocked.garden ? 'urn2' : null].filter(Boolean);
  if (k === 'milk') return [S.unlocked.milk ? 'milk' : null, S.unlocked.milk2 ? 'milk2' : null].filter(Boolean);   // v2.4: + the machine by the front door
  if (k === 'kaiseki') return S.unlocked.dining ? ['stove'] : [];
  if (k === 'rice') return !S.unlocked.dining ? [] : PASS.n > 0 || hasChef() ? ['pass'] : ['stove'];
  if (k === 'bath') return VIPG && VIPG.suite ? ['tap'] : [];
  return [];
}
const wishVerb = (k, id) => k === 'rice' && id === 'stove' ? '做饭' : WISH_VERB[k] || '';
// the wish whose station glows now: { k, ids } - a seated guest of honour waits for it and it isn't on your tray yet
function wishGlow() {
  const v = VIPG, k = vipWish();
  if (!v || v.st !== 'seated' || !k) return null;
  if (TRAY_WISH.has(k) && P.tray.includes(k)) return null;
  const ids = wishStations(k); return ids.length ? { k, ids } : null;
}
// where a station is: g = the spot to stand on (the glow ring: centre, radii), tag = over the station's sprite (world px)
function stationAt(id) {
  if (id === 'tap') { const rm = ROOM[VIPG.suite], tp = rm.tap, tb = rm.tub; return { gx: tcx(tp), gy: tcy(tp) + 3, rx: 9, ry: 5, tx: tcx(tb), ty: (tb[1] + 1) * TILE - 24, tile: tp }; }
  const z = ZONE[id], dy = { urn1: 30, urn2: 30, milk: 46, milk2: 46, stove: 30, pass: 24 }[id] || 28;
  return { gx: z.c[0], gy: z.c[1] + 4, rx: z.r, ry: R(z.r * .55), tx: z.c[0], ty: z.c[1] - dy, tile: PICK_TILE[id] };
}
// ---- pictures
// a 4 x 5 pointer between the station and the item
const ROUTE_ARROW = (() => { const c = mk(4, 5), x = c.getContext('2d'); x.fillStyle = '#8a5a34'; x.fillRect(0, 2, 3, 1); x.fillRect(2, 1, 1, 3); x.fillRect(3, 2, 1, 1); x.fillRect(1, 0, 1, 1); x.fillRect(1, 4, 1, 1); return c; })();
// [station] > [item], 24 x 11 (the arrow's icon, the cards)
function routeIcon(k, st) {
  return art('core:route:' + k + ':' + st, () => { const c = mk(24, 11), x = c.getContext('2d'); x.drawImage(stationIcon(st), 0, 0); x.drawImage(ROUTE_ARROW, 12, 3); x.drawImage(itemIcon(k), 17, 2); return c; });
}
// the same in a wide gold wish bubble (30 x 17): over the guest's head at 2x
function routeBubble(k, st) {
  return art('core:routebub:' + k + ':' + st, () => { const c = mk(30, 17), x = c.getContext('2d'); x.drawImage(wideBubbleArt(30), 0, 0); x.drawImage(routeIcon(k, st), 3, 2); return c; });
}
// the bubble over the seated guest: the route while the wish still has to be made, else its plain gold wish bubble
function vipBubbleImg(k) {
  const gl = wishGlow();
  if (gl && TRAY_WISH.has(k)) return routeBubble(k, STATION_ICON[nearStation(gl.ids)]);
  return bubbleArt(k, 0, true);
}
// of several stations (two urns), the one nearest to you - the arrow's pick (sourceOf) when it shows one
function nearStation(ids) {
  if (ids.length === 1) return ids[0];
  if (GUIDE && GUIDE.vip && GUIDE.key && GUIDE.key.startsWith('pick:')) { const id = GUIDE.key.slice(5); if (ids.includes(id)) return id; }
  let b = ids[0], bd = 1e9; for (const id of ids) { const s = stationAt(id), d = dist(P.x, P.y, s.gx, s.gy); if (d < bd) { bd = d; b = id; } }
  return b;
}
// ---- drawing (render.js drawOverlays): the breathing gold ring + the tag over every glowing station
const GLOWC = new Map();
function glowRing(rx, ry) {
  const k = rx + 'x' + ry; let c = GLOWC.get(k);
  if (!c) {
    c = mk(2 * rx + 5, 2 * ry + 5); const o = c.getContext('2d'), n = Math.ceil((rx + ry) * 3.2);
    for (const [d, col, a] of [[0, '#ffd23f', 1], [1, '#fff3a0', .7], [-1, '#ffb020', .5]]) {
      o.globalAlpha = a; o.fillStyle = col;
      for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; o.fillRect(rx + 2 + R(Math.cos(t) * (rx + d)), ry + 2 + R(Math.sin(t) * (ry + d * .6)), 1, 1); }
    }
    o.globalAlpha = .18; o.fillStyle = '#ffe14a'; o.beginPath(); o.ellipse(rx + 2.5, ry + 2.5, rx, ry, 0, 0, Math.PI * 2); o.fill();
    GLOWC.set(k, c);
  }
  return c;
}
function drawWishGlow() {
  const gl = wishGlow(); if (!gl) return;
  const br = .55 + .35 * Math.sin(T * Math.PI);   // breathing, one slow cycle every 2 s
  for (const id of gl.ids) {
    const s = stationAt(id);
    if (VIS(s.gx, s.gy, 40)) { const c = glowRing(s.rx, s.ry); g.globalAlpha = br; g.drawImage(c, R(s.gx - c.width / 2) - CX, R(s.gy - c.height / 2) - CY); g.globalAlpha = 1; }
    if (!VIS(s.tx, s.ty, 30)) continue;
    // the tag: [item] verb on cream paper with a gold rim, a slow 1 px bob
    const verb = wishVerb(gl.k, id), ic = gl.k === 'bath' ? stationIcon('tub') : itemIcon(gl.k), tw = textW(verb, 7), w = ic.width + tw + 7, h = 13;
    const x = clamp(R(s.tx - w / 2) - CX, 2, W - w - 2), y = R(s.ty - h) - CY + (T % 2 < 1 ? 0 : -1);
    if (y < 30) continue;   // never under the HUD
    g.fillStyle = OUT; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = '#ffc21f'; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = '#fff8dc'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    { const px = clamp(R(s.tx) - CX, x + 2, x + w - 3); g.fillStyle = OUT; g.fillRect(px - 1, y + h, 3, 1); g.fillRect(px, y + h + 1, 1, 1); }   // a little pointer down at the station
    g.drawImage(ic, x + 2, y + R((h - ic.height) / 2));
    txt(verb, x + 3 + ic.width + 1, y + h / 2 + .5, 7, '#5a3a1a', 'left', null);
  }
}
// ---- the one-time picture card of each kind of wish: [station] > [item] > [face] + the verb (cards.js FIRST_CARD)
const WISH_CARD = { tea: 'w_tea', kaiseki: 'w_kai', milk: 'w_milk', rice: 'w_rice', bath: 'w_bath', photo: 'w_photo' };
SEEN_KEYS.push('w_tea', 'w_kai', 'w_milk', 'w_rice', 'w_bath', 'w_photo');
const vipCardFace = () => faceOf(VIPG ? VIPG.look : VIP_LOOK.kawa);
function wishCardParts(k) {
  if (k === 'photo') return [{ img: faceOf(PLAYER_LOOK) }, { img: menuIcon('camera') }, { img: ARROW_R }, { img: vipCardFace() }, WISH_VERB.photo];
  if (k === 'bath') return [{ img: stationIcon('tub') }, { img: ARROW_R }, { img: vipCardFace() }, '站着' + WISH_VERB.bath];
  const ids = wishStations(k), id = ids.length ? nearStation(ids) : k === 'milk' ? 'milk' : k === 'tea' ? 'urn1' : 'stove';
  return [{ img: stationIcon(STATION_ICON[id]) }, { img: ARROW_R }, { img: itemIcon(k), s: 2 }, { img: ARROW_R }, { img: vipCardFace() }, wishVerb(k, id)];
}
// a new current wish (vip.js vipWishStart): its kind's card once. While the first VIP's 3-step card is still up its
// third step already shows the route, so that wish's card is just marked seen (no second card queued behind it)
function wishCardStart(k) {
  const key = WISH_CARD[k]; if (!key) return;
  if (FIRST_Q.some(f => f.key === 'vip')) { if (!S.seen[key]) { S.seen[key] = true; markDirty(); } return; }
  firstTime(key);
}
const wishCardDone = k => { if (WISH_CARD[k]) firstDone(WISH_CARD[k]); };
// the arrow points at a glowing station that is on screen: its tag already shows what to do there (no second icon)
function glowTagged(gt) {
  const gl = gt && gt.vip ? wishGlow() : null; if (!gl) return false;
  const id = gt.kind === 'tap' ? 'tap' : gt.key.startsWith('pick:') ? gt.key.slice(5) : null; if (!id || !gl.ids.includes(id)) return false;
  const s = stationAt(id); return VIS(s.tx, s.ty, -8);
}
