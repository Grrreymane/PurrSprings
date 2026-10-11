// ============================================================ v2.1 garden pieces + rare guests (SPEC_v2 16.7), core B
// From star 5 the garden's chain pad (34,26) sells eight pieces, each set on its own ground. A piece brings its rare
// guest 2-5 min after it is bought, then about every 20 min (at most one rare guest every RARE_GAP s, a first visit
// excepted). A rare guest comes in the VIP's place - the VIP flow, one guest of honour at a time - so there is never more
// to do than before: greet it on the carpet, lead it to a suite, do its three wishes, take the photo. Two new wishes:
//   stay  (a cat sitting still) stand beside it without moving for RARE_STAY_T s (a ring fills over its head)
//   show  (a blossom) it gets up (stand by it a moment), follows you like on the way in; walk to its garden piece and it is done -
//         it admires it, then walks back to its suite by itself
// Both show as the same big gold wish bubble the VIPs use (v2.0.1 G1), the arrow carries that bubble (or the piece) as
// its icon, and each has a first-time picture card. Milk / rice wishes come off the tray like tea. Its first photo
// leaves a keepsake in the album (S.rare: rare id -> visits done). Some only come in their season or at night (when).
// Hooks: vip.js (arrival, wishes, show / back states, the photo), guide.js (targets), render-world.js (the three kittens).
RARES.forEach(r => { VIP[r.id] = r; });   // the VIP flow reads VIP[id] (name, wishes); the album's VIPS list stays the six
SEEN_KEYS.push('stay', 'show');           // their first-time cards (7.4)
RUN.rares = 0;
const RARE_DUE = NUL();   // rare id -> game time (stats.time) it may come next; runtime (a load gives each owned one a new time)
let rareLast = -1e9;      // when the last rare guest came in (runtime)
const rareCond = r => r.when === undefined ? true : r.when === 'night' ? dayLight().night > .5 : seasonB() === r.when;
const rareOf = gzId => RARES.find(r => r.piece === gzId) || null;
const rareSeen = id => (S.rare[id] | 0) > 0;
// a piece bought (unlockB): its guest is due in 2-5 min; the next guest of honour is pulled forward to then (only if it
// could come now - a winter guest bought in summer just waits for winter)
function rareBought(u) {
  const r = rareOf(u.id); if (!r) return;
  RARE_DUE[r.id] = S.stats.time + rand(RARE_FIRST[0], RARE_FIRST[1]);
  if (!VIPG && rareCond(r)) vipT = Math.min(vipT, RARE_DUE[r.id]);
}
// every owned piece's guest has a due time (after a load: soon if never seen, else within a few minutes)
function rareSync() {
  for (const r of RARES) if (S.unlocked[r.piece] && RARE_DUE[r.id] === undefined)
    RARE_DUE[r.id] = S.stats.time + (rareSeen(r.id) ? rand(RARE_FIRST[1], RARE_AGAIN[0]) : rand(RARE_FIRST[0], RARE_FIRST[1]));
}
// the rare guest who comes when the VIP slot opens: due, its condition holds, the gap since the last one (a first visit
// never waits for the gap); the longest-waiting first
function rarePick() {
  rareSync();
  let best = null;
  for (const r of RARES) {
    const due = RARE_DUE[r.id];
    if (due === undefined || due > S.stats.time || !S.unlocked[r.piece] || !rareCond(r)) continue;
    if (rareSeen(r.id) && S.stats.time - rareLast < RARE_GAP) continue;
    if (!best || due < RARE_DUE[best.id]) best = r;
  }
  return best;
}
// the VIP slot opened (vip.js updVip): a rare guest if one is due (true), else the VIP comes as before
function rareArrive() {
  const r = rarePick(); if (!r) return false;
  VIPG = { id: r.id, vip: true, rare: true, look: RARE_LOOK[r.id], x: EXIT[0], y: EXIT[1], dir: 'up', moving: false, walkT: 0,
    path: [], goal: null, q: [], st: 'arrive', t: 0, tt: 0, halt: false, greetT: 0, actT: 0, wi: 0, suite: null, G: vipGift(), paid: 0, t0: S.stats.time, greetAt: null, trailT: 0, noSuite: 0 };
  if (r.kits) VIPG.kits = r.kits.slice(1).map((fur, i) => ({ fur, x: EXIT[0] + (i ? 6 : -6), y: EXIT[1] + 8, dir: 'up', moving: false, walkT: 0, q: [] }));
  RARE_DUE[r.id] = 1e9; rareLast = S.stats.time; RUN.vips++; RUN.rares++; news('vip');
  sfx('vip');
  if (!rareSeen(r.id)) banner('rare', r.id);   // the first time: a banner with its face (the album shows it as "?" until its photo)
  markDirty();
  return true;
}
// it left: done (the photo) = a visit counted, its keepsake the first time; not done (no suite for 4 min) = soon again
function rareLeave(v, happy) {
  const r = RARE[v.id]; if (!r) return;
  RARE_DUE[r.id] = S.stats.time + (happy ? rand(RARE_AGAIN[0], RARE_AGAIN[1]) : rand(RARE_FIRST[0], RARE_FIRST[1]));
}
function rarePhoto(v) {   // vip.js, the last wish: the visit counts; the first one leaves its keepsake
  const first = !rareSeen(v.id);
  S.rare[v.id] = (S.rare[v.id] | 0) + 1;
  if (first) { banner('keep', v.id); news('rare'); }
  markDirty();
}
// ---- the two new wishes, while it sits in its suite (vip.js updVip 'seated')
function rareSeated(v, k, dt) {
  const near = dist(P.x, P.y, v.x, v.y) <= VIP_NEAR;
  if (k === 'stay') {   // beside it, not moving
    if (near && !P.moving) { v.actT += dt; if (v.actT >= RARE_STAY_T - 1e-6) { v.actT = 0; vipWishDone(); } } else v.actT = 0;
  } else if (k === 'show') {   // stand by it a moment: it gets up and follows you
    if (near) { v.greetT += dt; if (v.greetT >= VIP_GREET_T) { v.greetT = 0; setSt(v, 'show'); v.q = []; v.halt = false; v.path = []; v.goal = null; lineSay(v, 'V07'); } } else v.greetT = 0;
  }
}
// where its piece stands (the wish 'show'), and the tile beside it the arrow / a bot walks to (the nearest walkable one
// below / beside / above it)
const showPiece = v => { const r = RARE[v.id]; return r ? UNLOCK[r.piece].at : null; };
function showTile(v) {
  const at = showPiece(v); if (!at) return null;
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) if (walkable(at[0] + dx, at[1] + dy)) return [at[0] + dx, at[1] + dy];
  return at;
}
// the 'show' walk (following you, like on the way in) and the walk back to its seat ('back')
function rareUpd(v, dt) {
  if (v.st === 'show') {
    const d = dist(P.x, P.y, v.x, v.y);
    if (!v.halt && d > VIP_HALT) { v.halt = true; lineSay(v, 'V08'); }
    else if (v.halt && d <= VIP_RESUME) { v.halt = false; lineSay(v, 'V07'); const [vx, vy] = tileOf(v), [px, py] = tileOf(P), p = findPath(vx, vy, px, py); v.q = (p || []).map(([x, y]) => [x * TILE + 8, y * TILE + 8]); }
    if (v.halt) v.moving = false; else { crumbTo(P, v); followStep(v, P, VIP_FOLLOW, playerSpeed() * .9, dt); }
    const at = showPiece(v);
    if (at && dist(v.x, v.y, tcx(at), tcy(at)) <= RARE_SHOW_R) { v.moving = false; v.dir = tcy(at) < v.y ? 'up' : 'down'; fxSpark(tcx(at), tcy(at) - 12, 6); vipWishDone(); }
    else if (v.t >= VIP_LEAD_MAX) { v.x = tcx(showTile(v)); v.y = tcy(showTile(v)); }   // a very long detour: it finds the piece itself (never stuck, 14.3)
  } else if (v.st === 'back') {
    if (v.t < RARE_ADMIRE_T) { v.moving = false; kitsFollow(v, dt); return; }   // it looks at the piece a moment first
    const rm = ROOM[v.suite]; goTo(v, rm.stand[0], rm.stand[1]);
    if (stepPath(v, dt, G_SPEED * 1.2) || v.lost) { if (v.lost) { v.x = tcx(rm.stand); v.y = tcy(rm.stand); } setSt(v, 'seated'); v.dir = 'up'; v.actT = 0; vipWishStart(); }
  }
  kitsFollow(v, dt);
}
// a 'show' wish done (vip.js vipWishDone): it admires the piece, then walks back to its seat; the next wish starts there
function rareShowDone(v) { v.hold = 0; setSt(v, 'back'); v.goal = null; v.path = []; }
// the kitten brothers: the two little ones walk the crumbs of the one ahead; parked beside it when it stops
function kitsFollow(v, dt) {
  if (!v.kits) return;
  v.kits.forEach((k, i) => {
    const L = i ? v.kits[i - 1] : v;
    if (v.st === 'seated' || v.st === 'soak') { const tx = v.x + (i ? 8 : -8), ty = v.y + 3; k.x += (tx - k.x) * Math.min(1, dt * 4); k.y += (ty - k.y) * Math.min(1, dt * 4); k.moving = false; k.dir = 'up'; k.q.length = 0; return; }
    crumbTo(L, k); followStep(k, L, 9, (v.st === 'leave' || v.st === 'arrive' || v.st === 'toSuite' || v.st === 'back' ? G_SPEED * 1.3 : playerSpeed()) * 1.05, dt);
  });
}
function rareTick(dt) {
  const v = VIPG;
  if (v && v.kits && v.st !== 'show' && v.st !== 'back') kitsFollow(v, dt);
}
// ---- the arrow (guide.js): leading it to its piece (rule 2's place, like leading a VIP to its suite)
function rareShowGuide() {
  const v = VIPG; if (!v || v.st !== 'show') return null;
  if (v.halt) return T_VIP();
  const t = showTile(v), [ptx, pty] = tileOf(P), r = RARE[v.id];
  return Object.assign(gT('showto', tcx(t), tcy(t), t[0], t[1], ptx === t[0] && pty === t[1], 'showto:' + v.id), { piece: r.piece });
}

// ---- drawing: the kittens, the wish rings / the blossom bubble while it follows you, the two wish bubbles
// a kitten brother (10 x 14, anchor (5,13)); the first one is VIPG itself
function drawKit(e, fur) {
  const view = e.dir === 'left' || e.dir === 'right' ? 'side' : e.dir, fr = e.moving ? 1 + (Math.floor(e.walkT * 7) & 1) : 0;
  let c = kittenSprite(view, fr, fur); if (e.dir === 'left') c = flipOf(c);
  drawA(c, R(e.x), R(e.y), 5, 13);
}
function rareDraws(L) {
  const v = VIPG; if (!v || !v.kits || !VIS(v.x, v.y, 32)) return;
  for (const k of v.kits) L.push({ y: k.y, f: () => drawKit(k, k.fur) });
}
function rareOverlay() {
  const v = VIPG; if (!v || !v.rare) return;
  const hx = R(v.x), hy = R(v.y) - 20, k = vipWish();
  if (v.st === 'seated' && k === 'stay' && v.actT > 0) ring(hx - CX, hy - 32 - CY, v.actT / RARE_STAY_T, '#ffd23f');
  if (v.st === 'seated' && k === 'show' && v.greetT > 0) ring(hx - CX, hy - 32 - CY, v.greetT / VIP_GREET_T, '#ffd23f');
  if (v.st === 'show') {   // on the way: its blossom bubble stays over its head (not "...": that means it waits for you)
    drawA(v.halt ? bubbleArt('dots', 0) : bubbleArt('show', 0, true), hx, hy, 7, 12);
    const at = showPiece(v); if (at && !v.halt && VIS(tcx(at), tcy(at), 16)) { const a = .5 + .3 * Math.sin(T * 3); g.globalAlpha = a; drawA(sparkleArt(Math.floor(T * 3) & 3), tcx(at), tcy(at) - 20, 4, 4); g.globalAlpha = 1; }
  }
}
// the wish bubbles for 'stay' and 'show': the same 14 x 13 bubble (gold rim + bell when gold) with a core-drawn icon
// (16.14 has no bubble art for them). bubbleArt is wrapped once here, so every caller (the big bubble over its head, the
// wish board, the arrow's icon, the picture cards) gets them.
const WISH_ICON = {
  stay: [['...Y...', '.K...K.', '.KKKKK.', '..KKK..', '.CCCCC.', 'CCCCCCC', '.BBBBB.'], { Y: '#ffd23f', K: '#4a4a5a', C: '#e08a2a', B: '#c8a878' }],   // a cat sitting still (ears, robe, cushion), a halo
  show: [['.P.P...', 'PpPpP..', '.PYP...', 'PpPpP.G', '.P.P.GG', '....G..', '...GG..'], { P: '#f4a8be', p: '#e87898', Y: '#ffd23f', G: '#5a9a3a' }],   // two blossoms on a twig
};
{
  const b0 = bubbleArt;
  bubbleArt = function (kind, urgency, gold) {
    if (!WISH_ICON[kind]) return b0(kind, urgency, gold);
    const own = b0(kind, urgency, gold); if (own !== b0('dots', urgency, gold)) return own;   // the art drew it: use that
    return art('core:wish:' + kind + ':' + (urgency | 0) + (gold ? ':g' : ''), () => {
      const c = mk(14, 13), x = c.getContext('2d'), base = b0('blank', urgency, gold), [rs, pal] = WISH_ICON[kind];
      x.drawImage(base, 0, 0);
      for (let j = 0; j < rs.length; j++) for (let i = 0; i < rs[j].length; i++) { const col = pal[rs[j][i]]; if (col) { x.fillStyle = col; x.fillRect(3 + i, 2 + j, 1, 1); } }
      return c;
    });
  };
}
// a keepsake (8 x 8, centre anchor) in the album's 稀客 / 纪念 tabs - core-drawn (16.14 has none)
const KEEP_ART = {
  beads: [['.BBBB.', 'B....B', 'B....B', 'B....B', '.BBBB.', '..RR..'], { B: '#6a3a2a', R: '#c83a3a' }],
  gyotaku: [['WWWWWW', 'WKKKKW', 'KKKKKK', 'WKKKKW', 'WWWWWW'], { W: '#f4ecd8', K: '#2a2a3a' }],
  chime: [['..BB..', '.GGGG.', '.GGGG.', '.G..G.', '..WW..', '..WW..'], { B: '#3a2a20', G: '#8ad0e8', W: '#fbfaf4' }],
  snowball: [['.WWWW.', 'WWWWWW', 'WWBWBW', 'WWWWWW', '.WWWW.'], { W: '#f4f8ff', B: '#8ab0d8' }],
  teaser: [['....F.', '...FFF', '..S.F.', '.S....', 'S.....'], { F: '#f4a8be', S: '#c8a878' }],
  painting: [['WWWWWW', 'WBBBBW', 'WGPGGW', 'WGGGGW', 'WWWWWW'], { W: '#c8a060', B: '#8ad0f0', G: '#6ab04a', P: '#a88ad8' }],
  foxmask: [['W....W', 'WW..WW', 'WWWWWW', 'WRWWRW', '.WWWW.', '..RR..'], { W: '#fbfbf6', R: '#d8443a' }],
  chawan: [['......', 'GGGGGG', 'GTTTTG', '.GGGG.', '..BB..'], { G: '#4a6a3a', T: '#8ac070', B: '#3a2a20' }],
};
function keepsakeArt(k) { return art('core:keep:' + k, () => { const [rs, pal] = KEEP_ART[k] || KEEP_ART.beads; return rows(rs, pal); }); }
// a garden piece's 10 x 10 icon: decorIcon(id) once the object art knows the garden ids (it falls back to the scroll
// otherwise), else its sprite scaled down
function gzIcon(id) {
  const c = decorIcon(id); if (c !== decorIcon('d_scroll')) return c;
  return art('core:gzi:' + id, () => { const o = mk(10, 10), x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(gardenDecorArt(id, 0), 0, 0, 16, 24, 2, 0, 7, 10); return o; });
}
