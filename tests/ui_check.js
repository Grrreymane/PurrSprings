// SPEC_v2 7 (stage 3 UI): the menu pauses the game and its pages / taps work; banners slide through the queue (paused in
// the menu); first-time cards; "new" edge tags; the info card target; a new hire walks in; the screen zones (7.7) and
// that every banner / card / page text fits; the album counts 36; the line switch is saved.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/ui_check.js --seed 2
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
function setup(list, money) {
  S = defaults(); for (const id of list || []) { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; } for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; S.stats.time = 300; S.money = money || 0; resetWorld(); go('play');
  BANNER_Q.length = 0; FIRST_Q.length = 0; EDGE_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (f && f()) return true; } return false; };
const at = (tx, ty) => { P.x = tx * TILE + 8; P.y = ty * TILE + 8; updCam(0, true); };
const tryRender = tag => { try { render(); } catch (e) { errs.push(tag + ': render threw ' + (e && e.stack || e)); } };
const STAR4 = UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id);

// ---- 7.5 the menu pauses everything but T: guests, the clock, time played, money, banners
setup(['room2', 'room3', 'onsen', 'recep', 'maid1', 'tea']); spawnT = 0; run(25);
{ const snap = () => JSON.stringify([S.stats.time, S.clock, S.money, S.piles, GUESTS.map(g => [g.x, g.y, g.st, g.t]), STAFF.map(s => [s.x, s.y])]);
  banner('buy', 'tea'); run(.5); const b = BANNER_Q[0], age = b.age;
  ok(inR({ x: 150, y: 8 }, MENU_HIT) && inR({ x: 170, y: 16 }, MENU_HIT) && !inR({ x: 120, y: 8 }, MENU_HIT) && !inR({ x: 150, y: 24 }, MENU_HIT), 'menu hit area: x >= 134, y <= 18');
  openMenu(); eq(state, 'menu', 'the menu opens'); ok(!JOY.on, 'no joystick');
  const a = snap(), t0 = T; run(10);
  eq(snap(), a, 'nothing moves in the menu (guests, staff, clock, time, money, piles)'); ok(T - t0 > 9.9, 'T keeps going'); eq(b.age, age, 'the banner waits in the menu');
  // taps: home -> sound -> toggles -> back -> book -> tabs -> outside = back / close
  const rowY = page => MENU_ROWS.find(r => r[4] === page)[3] + 12;   // v2.1: six rows (装扮 added)
  MENU.page = 'home'; menuPress({ x: 90, y: rowY('sound') }); eq(MENU.page, 'sound', 'tap 声音');
  const m0 = musicOn, s0 = sfxOn; menuPress({ x: 90, y: 88 }); eq(musicOn, !m0, 'music switch'); menuPress({ x: 90, y: 116 }); eq(sfxOn, !s0, 'sfx switch');
  ok(load('music', null) === musicOn && load('sfx', null) === sfxOn, 'music / sfx saved under their own keys');
  setMusicOn(m0); setSfxOn(s0);
  menuPress({ x: 90, y: 144 }); eq(S.opts.lines, false, 'line switch off'); ok(!lineSay(P, 'P01') && !LINE, 'lines off: nothing said');
  saveNow(); eq(loadState().opts.lines, false, 'the line switch is saved (S.opts.lines)'); menuPress({ x: 90, y: 144 }); eq(S.opts.lines, true, 'line switch on');
  menuPress({ x: 40, y: 54 }); eq(MENU.page, 'home', 'back button'); menuPress({ x: 90, y: rowY('book') }); eq(MENU.page, 'book', 'tap 图鉴');
  for (let i = 0; i < BOOK_TABS.length; i++) { menuPress({ x: 24 + i * bookTabW() + 8, y: 71 }); eq(MENU.tab, i, 'album tab ' + i); tryRender('album tab ' + i); }
  menuPress({ x: 40, y: 54 }); menuPress({ x: 90, y: rowY('dress') }); eq(MENU.page, 'dress', 'tap 装扮'); tryRender('dress page');
  menuPress({ x: 4, y: 4 }); eq(MENU.page, 'home', 'outside the panel = back'); menuPress({ x: 4, y: 300 }); eq(state, 'play', 'outside on the home page = close');
  openMenu(); menuPress({ x: 90, y: 84 }); eq(state, 'play', '继续 closes'); }
// every page, every tab, the photo view, many bought pages: render
setup(STAR4.concat(['maid4']), 500); S.album.vip = { kawa: 2, ozeki: 1 }; S.album.photos = [{ v: 'kawa', d: 3, h: null, p: null }]; S.gifts = ['kawa']; S.combos = { c_ga: 2, s_fish: 4 };
{ openMenu();
  for (const p of ['home', 'sound', 'book', 'bought', 'inn', 'dress']) { MENU.page = p; for (let t = 0; t < BOOK_TABS.length; t++) { MENU.tab = t; DRESS.tab = t & 3; tryRender('menu ' + p + ' ' + t); } }
  MENU.page = 'inn'; MENU.sel = null; menuPress({ x: INN_MAP_BTN[0] + 10, y: INN_MAP_BTN[1] + 8 }); eq(MENU.sel, 'map', 'inn page: the map button'); tryRender('inn map'); menuBack(); eq(MENU.sel, null, 'back from the map');
  MENU.page = 'book'; MENU.tab = 0; menuPress({ x: 46, y: 120 }); eq(MENU.sel, 'kawa', 'tap a VIP seen: its photo'); tryRender('photo'); menuPress({ x: 90, y: 200 }); eq(MENU.sel, null, 'tap again: back to the grid');
  menuPress({ x: 91, y: 120 }); eq(MENU.sel, 'ozeki', 'a VIP seen without a photo: its card'); tryRender('no photo'); MENU.sel = null; menuPress({ x: 136, y: 220 }); eq(MENU.sel, null, 'a VIP not seen: nothing');
  MENU.page = 'bought'; MENU.pg = 0; const n = boughtList().length, pages = Math.ceil(n / 12);
  eq(boughtList()[0], 'maid4', 'bought: newest first'); ok(!boughtList().includes('room1'), 'room1 (free) is not listed');
  menuPress({ x: 130, y: 262 }); eq(MENU.pg, 1, 'next page'); for (let i = 0; i < 10; i++) menuPress({ x: 130, y: 262 }); eq(MENU.pg, pages - 1, 'stops at the last page (' + pages + ')'); tryRender('bought last page');
  menuPress({ x: 48, y: 262 }); eq(MENU.pg, pages - 2, 'previous page');
  MENU.page = 'inn'; tryRender('inn'); menuPress({ x: 90, y: 256 }); ok(!!shareEl, 'the photo button makes the share card'); shareEl = null;
  closeMenu(); }
{ const c = albumCount(); eq(c.m, 69, 'album size (6 VIPs + 6 combos + 9 furs + 3 types + 12 staff: v2.0.1 + the tea runner; v2.1: + 8 rare guests + 8 hats 8 outfits 4 uniforms 5 pets)'); }
// ---- 7.3 banners: a buy shows "new!" with the info card's line; 0.2 + 2.6 + 0.2 s; at most 3 queued, the one on screen stays
setup(['room2', 'room3'], 60); at(18, 21);
{ unlock('shoes1'); const b = BANNER_Q[0]; ok(b && b.kind === 'buy' && b.id === 'shoes1', 'buy banner'); const st = bannerParts(b);
  ok(st && st.parts.some(p => p.t && p.t.includes(UNLOCK.shoes1.card)), 'the banner says the info card line');
  run(1); banner('day', 2, { g: 1, h: 1 }); banner('milestone', 100); banner('gift', 0); banner('rank', 'panda', { rank: 9, t0: T });
  eq(BANNER_Q.length, 3, 'at most 3 queued'); eq(BANNER_Q[0], b, 'the banner on screen is not dropped');
  run(2.05); ok(BANNER_Q[0] !== b, 'gone after 3 s'); run(30); eq(BANNER_Q.length, 0, 'the queue empties'); }
// gate: area banner + star; combo; every banner kind / unlock fits the screen
{ setup(['room2', 'room3'], 60); at(17, 8); unlock('onsen'); const b = BANNER_Q.find(x => x.kind === 'area'); ok(b && b.star, 'gate: area banner with the star');
  const fits = (b, tag) => { const st = bannerParts(b); ok(!!st, tag + ': no banner'); if (st) { const w = partsW(st.parts); ok(w + 16 <= W - 8, tag + ': banner text ' + w.toFixed(0) + ' px too wide'); } };
  for (const u of UNLOCKS) fits({ kind: u.gate ? 'area' : u.id === 'statue' ? 'statue' : 'buy', id: u.id, star: !!u.star }, 'banner ' + u.id);
  for (const c of COMBOS) fits({ kind: 'combo', id: c.id }, 'combo ' + c.id);
  for (const r of RIVALS) if (r.id) fits({ kind: 'rank', id: r.id, rank: 10 }, 'rank ' + r.id);
  for (const id in STAFF_DEF) if (id !== 'owner') fits({ kind: 'level', id, lv: 5 }, 'level ' + id);
  fits({ kind: 'gold', id: 5 }, 'gold 5'); fits({ kind: 'day', id: 999, g: 9999, h: 9999, rec: true }, 'day'); fits({ kind: 'milestone', id: 5000 }, 'milestone'); fits({ kind: 'gift', id: 0 }, 'gift'); }
// ---- 7.2 the info card: the nearest visible pad within 2 tiles; its text never runs into the price
setup([], 30); spawnT = 1e9;
{ at(16, 20); run(.1); eq(INFO, UNLOCK.room2, 'within 2 tiles of the 竹 pad'); at(17, 27); run(.1); eq(INFO, null, 'far from every pad: no card');
  at(18, 20); run(.1); eq(INFO, UNLOCK.room2, 'standing on it'); ok(!padLayout(UNLOCK.room2).named, 'the card names it: no floating name too');
  for (const u of UNLOCKS) {
    const lx = 12 + (u.decor ? 29 : 20) + textW(u.name, 8) + 3 + textW('·', 7) + 3 + textW(u.card, 7);
    const rx = 12 + 156 - 5 - 9 - textW(fmt(u.price), 7) - 1 - 10;
    ok(lx + 3 <= rx, 'info card ' + u.id + ': text ends at ' + lx.toFixed(0) + ', price starts at ' + rx.toFixed(0));
    ok([...u.card].length <= 9, 'card line ' + u.id + ' longer than 9'); ok([...u.name].length <= 2, 'name ' + u.id + ' longer than 2');
  } }
// ---- 7.4 first-time cards: shown at the bottom unless the info card is up; gone when done or after 20 s on screen
setup(['room2', 'room3', 'onsen', 'recep', 'tea']); spawnT = 1e9;
{ at(17, 27); S.seen = {}; firstTime('call'); ok(FIRST_Q[0] && FIRST_Q[0].key === 'call', 'call card'); run(10); ok(FIRST_Q.length === 1, 'still up after 10 s');
  { const xy = padXY(visiblePads()[0]); at(xy[0], xy[1] + 1); } run(5); ok(INFO && FIRST_Q.length === 1 && FIRST_Q[0].vis < 10.5, 'under the info card it waits'); at(17, 27); run(10.5); eq(FIRST_Q.length, 0, 'gone after 20 s on screen');
  S.seen = {}; firstTime('call'); firstDone('call'); eq(FIRST_Q.length, 0, 'done: gone');
  for (const k of SEEN_KEYS) { S.seen = {}; FIRST_Q.length = 0; firstTime(k); const L = FIRST_CARD[k](), label = L.pop(), parts = L.map(p => Object.assign({ gap: 3 }, p)).concat([{ gap: 4 }, { t: label, z: 8 }]);
    ok([...label].length <= 4, 'card ' + k + ': label > 4'); ok(partsW(parts) <= 150, 'card ' + k + ' too wide ' + partsW(parts)); tryRender('card ' + k); } }
// ---- 7.3 "new" tags: things that appear out of view get a tag on the screen edge (<= 2, 4 s); no camera move
setup(['room2', 'room3'], 60); spawnT = 1e9;
{ at(17, 8); const cx = cam.x, cy = cam.y; unlock('onsen'); run(.1);
  ok(EDGE_Q.length >= 1 && EDGE_Q.length <= 2, 'onsen opened: new pads far below get edge tags (' + EDGE_Q.length + ')');
  ok(EDGE_Q.every(e => !onView(tcx([e.tx, e.ty]), tcy([e.tx, e.ty]))), 'tags only for things out of view'); eq(cam.x + ',' + cam.y, cx + ',' + cy, 'the camera did not move');
  tryRender('edge tags'); run(4); eq(EDGE_Q.length, 0, 'gone after 4 s');
  for (let i = 0; i < 2000; i++) { const p = edgePoint(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000); ok(p.x >= 11.9 && p.x <= W - 11.9 && p.y >= EDGE_Y0 - .1 && p.y <= EDGE_Y1 + .1, 'edge point out of the box ' + p.x + ',' + p.y); if (errs.length > 40) break; } }
// ---- 7.3.4 a new hire walks in from the front door and says its line at the post; a "new" tag over its head
setup(['room2', 'room3', 'onsen'], 60); spawnT = 1e9;
{ at(16, 25); unlock('recep'); const s = STAFF.find(x => x.id === 'recep');
  ok(s && s.arrive && s.y > 30 * TILE, 'the receptionist starts at the front door'); ok(T - s.newT < .1, 'new tag');
  const said = []; const _sh = showLine; showLine = ln => { said.push(ln.id); return _sh(ln); };
  run(10, () => !s.arrive); showLine = _sh;
  ok(!s.arrive && tileOf(s)[0] === DESK_SPOT[0] && tileOf(s)[1] === DESK_SPOT[1], 'at the desk within 10 s'); ok(said.includes('S01'), 'S01 at the desk: ' + said.join(','));
  run(20); ok(s.atDesk, 'then she works'); }
// ---- 7.7 screen zones + layers: render with a banner, a line, the info card, a first card, tags: nothing throws; the
// banner stays in y 30-48, cards in y 288-314
setup(STAR4, 400); spawnT = 0; run(20);
{ banner('buy', 'tea'); at(12, 25); say(P, 'P01'); firstTime('decor'); run(1); tryRender('everything at once');
  for (const a of [0, .1, .2, 1.5, 2.8, 2.9, 3]) { const y = R(30 - 12 * (1 - (k => k * k * (3 - 2 * k))(clamp(a < BANNER_IN ? a / BANNER_IN : a > BANNER_IN + 2.6 ? 1 - (a - BANNER_IN - 2.6) / BANNER_OUT : 1, 0, 1)))); ok(y >= 18 && y + 18 <= 48, 'banner y ' + y); }
  ok(CARD_Y >= 288 && CARD_Y + 24 <= 314, 'bottom card zone'); ok(!LAYERED, 'layers closed after present()');
  for (const s of ['play', 'celebrate', 'menu', 'title']) { go(s); st = 1; tryRender('state ' + s); } go('play'); }
// ---- WORKFLOW 6: names the display font lacks: none left in the data (room 7 is 桔 now); NOQK strings use the pixel font
ok(!ROOMS.some(r => /\u8429/.test(r.name)), 'room names'); eq(fontFor('+♥3', 12), PFONT, 'a string with a heart: pixel font'); eq(fontFor('五星旅馆', 12), FONT, 'plain big text: display font');
console.log(errs.length ? 'UI CHECK FAIL\n  ' + [...new Set(errs)].slice(0, 40).join('\n  ') : 'UI CHECK OK  menu pause + taps, banners, info card, first cards, edge tags, new hire, zones, text fits');
if (errs.length) process.exitCode = 1;
