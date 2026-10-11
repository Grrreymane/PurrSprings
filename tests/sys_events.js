// SPEC_v2 4.13: the v2.0 events list - every "something new" event fires what the table says (sound / banner / line /
// effect) and is logged in RUN.news (the bots measure 14.2 B3 from it): area opens, calls, VIP arrivals, a new combo,
// overtaking a rival, a staff level-up, dusk / dawn, milestone guests, the 8 first-time cards. (The v2.1 rows are not
// built yet.) Banners / cards / lines are only queued here; stage 3 draws them.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_events.js --seed 6
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SFXLOG = [], LINES = [];
const _sfx = sfx; sfx = (k, a) => { SFXLOG.push(k); return _sfx(k, a); };
const _ls = lineSay; lineSay = (who, key) => { LINES.push([who, key]); return _ls(who, key); };
function setup(list) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; resetWorld(); go('play'); spawnT = 1e9;
  SFXLOG.length = 0; LINES.length = 0; BANNER_Q.length = 0; FIRST_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (f && f()) return true; } return false; };
const newsOf = k => RUN.news.filter(n => n[1] === k).length;
const line = k => LINES.some(([, x]) => x.split('|').includes(k));
const buy = id => { S.money += padNeed(UNLOCK[id]); unlock(id); };
// ---- area opens (onsen / shop / dining / garden / roten): fade, banner, chime, the innkeeper's line (P04 when it adds a star)
setup();
{ buy('room2'); buy('room3'); SFXLOG.length = 0; LINES.length = 0; buy('onsen');
  ok(AREA_FADE.some(f => f.a.id === 'onsen'), 'onsen: shade fades'); ok(BANNER_Q.some(b => b.kind === 'area' && b.id === 'onsen'), 'onsen: area banner');
  ok(SFXLOG.includes('areaOpen'), 'onsen: area chime'); ok(line('P04'), 'onsen adds a star: P04'); eq(newsOf('area'), 1, 'news: area');
  buy('recep'); LINES.length = 0; buy('shop'); ok(BANNER_Q.some(b => b.kind === 'area' && b.id === 'shop') && line('P03'), 'shop: banner + P03 (no star)');
  LINES.length = 0; buy('basket1'); ok(line('P09') && !BANNER_Q.some(b => b.id === 'basket1' && b.kind === 'area') && BANNER_Q.some(b => b.id === 'basket1' && b.kind === 'buy'), 'a plain pad (a tool): P09, a buy banner (not an area one)');
  LINES.length = 0; buy('room4'); ok(line('P07'), 'a room: P07'); LINES.length = 0; buy('d_scroll'); ok(line('P08'), 'decor: P08');
  LINES.length = 0; buy('maid1'); ok(line('P02'), 'staff: P02'); ok(newsOf('buy') >= 6, 'news: every buy'); }
// ---- calls: ring + the guest's line + the first-time card
setup(['room2', 'room3', 'onsen', 'recep', 'tea']);
{ addGuest('regular'); const gu = GUESTS[0]; lastCallAt = -99; tryCall(gu, 'tea', 1);
  ok(gu.call && SFXLOG.includes('ring') && LINES.some(([w, k]) => w === gu && k === 'G22'), 'call: ring + G22'); ok(FIRST_Q.some(f => f.key === 'call'), 'call: first-time card'); eq(newsOf('first'), 1, 'news: first'); }
// ---- a VIP arrives: the jingle (music ducks), its line, the card, news
setup(UNLOCKS.filter(u => !u.need5 && UNLOCK.garden.req.concat(['dining', 'onsen', 'garden']).includes(u.id)).map(u => u.id));
{ vipT = S.stats.time; run(.1); ok(!!VIPG, 'a VIP came'); ok(SFXLOG.includes('vip') && !line('V01'), 'vip: jingle (its own line waits for the greeting)'); ok(FIRST_Q.some(f => f.key === 'vip'), 'vip card'); eq(newsOf('vip'), 1, 'news: vip');
  run(30, () => VIPG.st === 'carpet'); P.x = VIPG.x; P.y = VIPG.y + 8; run(VIP_GREET_T + 1, () => VIPG.st === 'follow');
  ok(VIPG.st === 'follow' && line('V01') && !line('V07'), 'greeted: its own line V01 (' + VIPG.st + ')');
  // the three wish cards (bath / kaiseki / photo) come with the wishes
  VIPG = null; S.vipNext = 1; vipArrive(); const v = VIPG; v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated');
  for (let i = 0; i < 3; i++) { v.wi = i; vipWishStart(); }
  for (const k of ['kaiseki', 'bath', 'photo']) ok(FIRST_Q.some(f => f.key === k), 'card: ' + k); ok(line('V10'), 'photo wish: V10'); }
// ---- v2.0 audit F5: a hire that reaches its post out of view says its first words once it is in view near you (<= 3 min)
setup(['room2', 'room3', 'onsen', 'recep']);
{ S.stats.time = 100; P.x = 17 * TILE + 8; P.y = 4 * TILE + 8; updCam(0, true); unlock('maid1'); const m = STAFF.find(s => s.id === 'maid1');
  run(25, () => !m.arrive); ok(!m.arrive && m.hello === 'S04', 'maid1 reached her post out of view: S04 waits (' + m.arrive + ' ' + m.hello + ')');
  const n0 = LINES.filter(([, k]) => k === 'S04').length; P.x = m.x; P.y = m.y + 24; updCam(0, true); run(1);
  ok(!m.hello && LINES.filter(([, k]) => k === 'S04').length > n0, 'you came by: S04 said'); }
// ---- a new combo: gong, gold banner, hearts +10, news
setup(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana']);
{ const h0 = S.hearts; S.decor['room1:A'] = 'd_scroll'; setDecor(DSLOT_AT[ROOM.room1.slotB[1] * MW + ROOM.room1.slotB[0]], 'd_ikebana');
  ok(SFXLOG.includes('gong') && BANNER_Q.some(b => b.kind === 'combo' && b.id === 'c_ga'), 'combo: gong + banner'); eq(S.hearts - h0, 10, 'combo: hearts +10'); eq(newsOf('combo'), 1, 'news: combo'); }
// ---- overtaking, a level-up, dusk / dawn, a milestone guest
setup(['room2', 'room3', 'onsen', 'recep', 'maid1']); ensureStaff();
{ S.hearts = 29; addHearts(1); ok(SFXLOG.includes('rankup') && BANNER_Q.some(b => b.kind === 'rank') && line('P06'), 'overtake: horn + banner + P06'); eq(newsOf('rank'), 1, 'news: rank');
  const m = STAFF.find(s => s.id === 'maid1'); gainXp(m, 20); ok(SFXLOG.includes('levelup') && BANNER_Q.some(b => b.kind === 'level') && line('S18'), 'level-up: sound + banner + S18'); eq(newsOf('level'), 1, 'news: level');
  S.clock = .675; run(2.5); ok(SFXLOG.includes('dusk'), 'dusk: temple bell');
  S.clock = .095; run(2.5); ok(SFXLOG.includes('dawn') && BANNER_Q.some(b => b.kind === 'day') && line('S03'), 'dawn: birds + day banner + S03'); eq(newsOf('day'), 1, 'news: day');
  S.stats.guests = 499; addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); checkIn(gu, ROOM.room2);
  ok(BANNER_Q.some(b => b.kind === 'milestone' && b.id === 500) && line('G36'), 'the 500th guest: banner + G36'); eq(newsOf('milestone'), 1, 'news: milestone'); }
// ---- every first-time card key has its trigger in a normal game (the dine / decor / try-on cards come with their buys)
setup(['room2', 'room3', 'onsen', 'recep', 'room4', 'room5', 'maid1', 'shop']);
{ buy('dining'); ok(FIRST_Q.some(f => f.key === 'dine'), 'dining opens: dine card'); buy('d_scroll'); ok(FIRST_Q.some(f => f.key === 'decor'), 'first decor: decor card');
  for (const id of UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id)) S.unlocked[id] = true; S.peak = starOf(S); resetWorld(); go('play'); buy('roten'); run(.1);
  ok(FIRST_Q.some(f => f.key === 'tryon'), 'star 5 boutique: try-on card');
  eq(SEEN_KEYS.filter(k => S.seen[k]).sort().join(','), 'decor,dine,tryon', 'cards seen in this save'); }
// ---- a played hour: the events keep coming (informational B3 numbers; the eager bot prints them too)
setup(); newGame(); S.tut.moved = true;
{ let path = [], key = '', think = 0;
  for (let i = 0; i < 30 * 60 * 20; i++) {
    think -= DT;
    if (think <= 0) { think = .3; const t = guideTarget(); if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
    if (path.length) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
    update(DT); if (state === 'celebrate') { S.done = true; go('play'); }
  }
  botMove = null;
  const B3 = ['buy', 'first', 'vip', 'combo', 'rank', 'level', 'area'], ts = RUN.news.filter(n => B3.includes(n[1])).map(n => n[0]);
  let gap = 0; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]);
  const kinds = {}; for (const [, k] of RUN.news) kinds[k] = (kinds[k] || 0) + 1;
  ok(gap <= 150, 'B3: longest gap between new things in 20 min ' + gap.toFixed(0) + ' s (target <= 150)');
  console.log('  20 min eager: ' + Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(', ') + ' | B3 max gap ' + gap.toFixed(0) + ' s'); }
console.log(errs.length ? 'SYS EVENTS FAIL\n  ' + errs.join('\n  ') : 'SYS EVENTS OK');
if (errs.length) process.exitCode = 1;
