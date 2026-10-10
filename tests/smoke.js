// Headless smoke test (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/smoke.js --seed 1
// New game -> 5 minutes of game time with a guide-following driver -> render every few frames, check no
// errors / NaN; then every screen renders (title, celebration, share card); then a save round trip
// (save -> fresh load -> 5 more minutes) keeps money and unlocks.
const DT = 1 / 30, errs = [];
const bad = (tag, m) => { if (errs.length < 30) errs.push(tag + ': ' + m); };
function check(tag) {
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) bad(tag, 'money ' + S.money);
  if (!Number.isFinite(P.x) || !Number.isFinite(P.y)) bad(tag, 'player NaN');
  for (const gu of GUESTS) if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) bad(tag, 'guest NaN ' + gu.st);
  for (const s of STAFF) if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) bad(tag, 'staff NaN ' + s.role);
  for (const k in S.piles) if (!Number.isFinite(S.piles[k]) || S.piles[k] < 0) bad(tag, 'pile ' + k + ' ' + S.piles[k]);
  if (S.basket < 0 || S.basket > 10) bad(tag, 'basket ' + S.basket);
  if (boxHit(P.x, P.y)) bad(tag, 'player inside a wall at ' + R(P.x) + ',' + R(P.y));
  if (!Number.isFinite(S.hearts) || S.hearts < 0 || S.hearts !== Math.floor(S.hearts)) bad(tag, 'hearts ' + S.hearts);
  if (star() < S.peak) bad(tag, 'star below peak');
}
// tiny guide follower
let path = [], key = '', think = 0;
function drive(dt) {
  think -= dt;
  if (think <= 0) {
    think = .3;
    const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
  } else botMove = null;
}
function run(sec, tag) {
  const n = Math.round(sec / DT);
  for (let i = 0; i < n; i++) {
    drive(DT);
    try { update(DT); } catch (e) { bad(tag, 'update threw ' + (e && e.stack || e)); return; }
    if (i % 3 === 0) try { render(); } catch (e) { bad(tag, 'render threw ' + (e && e.stack || e)); return; }
    if (i % 30 === 0) check(tag + '@' + Math.round(i * DT));
  }
}
// title renders before anything
try { render(); } catch (e) { bad('title', String(e && e.stack || e)); }
newGame();
run(300, 'play');
const mid = { money: S.money, unlocked: Object.keys(S.unlocked).sort().join(','), guests: S.stats.guests };
// every screen renders
try {
  const keep = state; go('celebrate'); st = 1; render(); makeShare(); go('title'); render(); go(keep);
} catch (e) { bad('screens', String(e && e.stack || e)); }
// save round trip: save -> load into a fresh world -> keep playing. Save it mid-service (14.4): a call open, something
// on the tray, rice on the counter - none of that is saved (10.1), and loading must start clean.
{ const gu = GUESTS.find(x => x.st !== 'arrive' && x.st !== 'queue') || GUESTS[0]; if (gu) gu.call = { k: 'tea', t: 20, max: 40 }; P.tray = ['tea']; PASS.n = 3; }
saveNow();
if (/"k":"tea"|"tray":\[/.test(JSON.stringify(S))) bad('roundtrip', 'runtime tray / call state leaked into the save');
S = defaults(); resetWorld();
continueGame();
const back = { money: S.money, unlocked: Object.keys(S.unlocked).sort().join(','), guests: S.stats.guests };
if (back.money !== mid.money || back.unlocked !== mid.unlocked) bad('roundtrip', JSON.stringify(mid) + ' -> ' + JSON.stringify(back));
if (P.tray.length || PASS.n || callCount() || SEAT_OCC.some(Boolean)) bad('roundtrip', 'tray / counter / calls / seats not empty after loading');
run(300, 'after-load');
// stage 2B (14.4): a VIP mid-service + decor + a clerk's bag -> save -> load. Nothing of the VIP is saved but half of its
// unpaid gift (into the cash box, once); decor stays; the bag's fish were already in the cash box.
{ for (const id of ['room4', 'room5', 'room6', 'maid1', 'dining', 'w1', 'room7', 'clerk', 'chef', 'porter', 'milk', 'garden', 'd_ikebana']) if (!S.unlocked[id]) { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; }
  for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(S.peak, starOf(S)); S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; resetWorld(); go('play');
  vipArrive(); const v = VIPG; v.x = tcx(ROOM.c3.stand); v.y = tcy(ROOM.c3.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); S.vipOwe = v.G;
  const ck = STAFF.find(x => x.role === 'clerk'); if (ck) ck.bag = 40;
  try { render(); } catch (e) { bad('vip', 'render threw ' + (e && e.stack || e)); }
  const recep = S.piles.recep || 0, owe = S.vipOwe; saveNow();
  if (/"st":"seated"|"suite":"c3"/.test(JSON.stringify(S))) bad('vip-roundtrip', 'VIP runtime state leaked into the save');
  continueGame();
  if (VIPG) bad('vip-roundtrip', 'a VIP after loading');
  if ((S.piles.recep || 0) - recep !== R(owe * .5)) bad('vip-roundtrip', 'refund ' + ((S.piles.recep || 0) - recep) + ' want ' + R(owe * .5));
  if (S.vipOwe) bad('vip-roundtrip', 'vipOwe not cleared');
  if (S.decor['room1:A'] !== 'd_scroll' || !roomCombo(ROOM.room1)) bad('vip-roundtrip', 'decor lost');
  if (STAFF.some(x => x.bag)) bad('vip-roundtrip', 'a bag after loading');
  run(120, 'after-vip-load'); }
// old / odd save shapes load without throwing
// (+ shapes the game never writes: unknown / array / locked pile keys, Infinity, a part payment above a lowered price;
//  the full v1 fixture set is exercised by tests/migrate_v1.js)
for (const raw of ['{"v":2,"decor":{"room1:A":"d_scroll","zz":1},"equip":{"hat":"h_gold"},"album":{"photos":"x"},"clock":9}','{}', '{"money":"12","unlocked":{"room2":true},"rooms":{"room1":"occupied","room2":"reserved"}}', '{"v":1,"stats":null,"tut":7}', 'not json',
  '{"piles":{"desk":5}}', '{"piles":[3,4]}', '{"piles":{"room5":9,"onsen":4,"constructor":2}}', '{"money":1e999}', '{"money":12,"paid":{"room2":40}}']) {
  try {
    localStorage.setItem(SAVE + 'state', raw); const s = loadState();
    if (!Number.isFinite(s.money) || !s.unlocked.room1) bad('oldsave', raw);
    for (const k in s.piles) if (!Object.prototype.hasOwnProperty.call(PILE_AT, k) || !Number.isFinite(s.piles[k])) bad('oldsave pile ' + k, raw);
    S = s; resetWorld(); go('play'); run(5, 'oldsave');
  }
  catch (e) { bad('oldsave ' + raw, String(e && e.stack || e)); }
}
console.log(errs.length ? 'SMOKE FAIL\n  ' + errs.join('\n  ') : 'SMOKE OK  money ' + mid.money + ', guests ' + mid.guests + ', unlocked [' + mid.unlocked + '] after 5 min; round trip + 5 min OK');
if (errs.length) process.exitCode = 1;
