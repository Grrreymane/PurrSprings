// SPEC_v2 16.8 (v2.1 core B): the cat shrine. From star 5 a gate pad by the onsen's west fence (11,4) (10,000) opens the
// bamboo: the gate (10,4) opens, the approach (9,4) -> (5,4) -> (5,2) is walkable, the offering pad (5,2) shows the first
// of ten offerings (10K 20K 35K 50K 70K 90K 120K 160K 220K 300K = 1,075,000). Every level shows on the shrine (the hall
// grows at 1 / 5 / 8 / 9 / 10; torii 2, lanterns 3 (lit at night), komainu 4, sakura 6, a tunnel of small torii 7, the
// gold cat's glow 10), rings the shrine bell (in place of the unlock chime), and adds 1 % to every fee. The offering pad is
// reachable at every level; the arrow points at it when you can afford it; level 10 has its own banner.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_shrine.js --seed 2
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SFXB = [];
const _sfxB = sfx; sfx = (k, a) => { SFXB.push(k); return _sfxB(k, a); };
const _unlB = SFX.unlock; SFX.unlock = function () { SFXB.push('unlock'); return _unlB.apply(SFX, arguments); };
const PRE5 = UNLOCKS.filter(u => !u.need5).map(u => u.id).concat(['maid4']);
function setupB(extra) {
  S = defaults(); for (const id of PRE5.concat(extra || [])) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = 5; S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; for (const c of COMBOS) S.combos[c.id] = 1; S.stats.vips = 3;
  resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; vipT = 1e9; P.x = 17 * 16 + 8; P.y = 27 * 16 + 8; BANNER_Q.length = 0; SFXB.length = 0;
}
const runB = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (f && f()) return true; } return false; };
function walkB(tx, ty, maxSec) {
  const [sx, sy] = tileOf(P); const path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 40) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
  }
  botMove = null; update(DT);
}
const has = (k, at) => OBJS.some(o => o.k === k && (!at || (o.tx === at[0] && o.ty === at[1])));
// ---- before star 5 nothing; at star 5 the gate pad in the onsen; the shrine is bamboo until it is bought
setupB();
{ S.peak = 4; delete S.unlocked.roten; resetWorld(); go('play'); ok(!PADPOS.has('shrine'), 'star 4: no shrine gate'); }
setupB();
{ eq(PADPOS.get('shrine') + '', SHRINE_GATE_PAD + '', 'star 5: the gate pad at (11,4)'); ok(BLOCK[4 * MW + 9] === 1 && BLOCK[4 * MW + 10] === 1, 'the bamboo and the gate are shut');
  ok(!padEligible(UNLOCK.of1), 'no offering before the gate');
  S.money = 10000; walkB(11, 4); runB(3, () => !!S.unlocked.shrine);
  ok(S.unlocked.shrine, 'bought the gate'); ok(BANNER_Q.some(b => b.kind === 'area' && b.id === 'shrine'), 'an area banner'); eq(BLOCK[4 * MW + 10], 0, 'the gate (10,4) opens');
  ok(!!findPath(11, 4, 5, 2), 'the approach to the offering pad is walkable'); eq(PADPOS.get('of1') + '', OFFER_PAD + '', 'the first offering at (5,2)');
  ok(!has('hokora'), 'level 0: the bare shrine ground (the small shrine comes with the first offering)'); eq(shrineLv(), 0, 'level 0'); ok(!innComplete() || S.done, 'the shrine is an extra: never needed for "the whole inn built"'); }
// ---- ten levels: each shows, rings the bell, +1 % fees; the pad stays reachable
{ const base = fee('room', { rm: ROOM.room1 }), baseM = (() => { const m = feeMulB(); return m; })();
  eq(baseM, 1, 'level 0: fees x1'); const parts = { 1: 'hokora', 2: 'torii', 3: 'slantern', 4: 'komainu', 6: 'tree', 7: 'senbon', 10: 'glow' };
  let total = 0;
  for (let lv = 1; lv <= 10; lv++) {
    const u = UNLOCK['of' + lv]; total += u.price; eq(PADPOS.get(u.id) + '', OFFER_PAD + '', 'level ' + lv + ' on the pad');
    S.money = u.price; SFXB.length = 0; walkB(5, 3); walkB(5, 2); runB(3, () => !!S.unlocked[u.id]);
    ok(S.unlocked[u.id], 'offering ' + lv + ' made'); eq(shrineLv(), lv, 'level ' + lv);
    ok(SFXB.includes('bellShrine') && !SFXB.includes('unlock'), 'level ' + lv + ': the shrine bell, not the unlock chime');
    if (parts[lv]) ok(has(parts[lv]), 'level ' + lv + ': the ' + parts[lv] + ' appears');
    ok(Math.abs(feeMulB() - (1 + .01 * lv)) < 1e-9, 'level ' + lv + ': fees x' + (1 + .01 * lv).toFixed(2));
    ok(lv === 10 || !!findPath(9, 4, OFFER_PAD[0], OFFER_PAD[1]), 'level ' + lv + ': the offering pad is reachable');
    walkB(9, 4);
  }
  eq(total, 1075000, 'ten offerings: 1,075,000'); ok(BANNER_Q.some(b => b.kind === 'shrine'), 'level 10: the gold cat banner');
  eq(fee('room', { rm: ROOM.room1 }), R(base / 1 * 1.1), 'a room fee at level 10: x1.10 (' + base + ' -> ' + fee('room', { rm: ROOM.room1 }) + ')');
  ok(LIGHTS.some(L => Math.abs(L.x - (5 * 16 + 8)) < 9 && L.y < 32), 'the gold cat glows at night (a lamp)'); ok(LIGHTS.filter(L => L.y < 3 * 16 && L.x < 10 * 16).length >= 3, 'the two stone lanterns are lit too');
  ok(!PADPOS.has('of11'), 'nothing after level 10'); }
// ---- the arrow: an offering you can afford is pointed at; the preview of the next hall on the info card renders
setupB(['shrine', 'of1', 'of2', 'of3', 'of4']);
{ S.money = 80000; P.x = 13 * 16 + 8; P.y = 4 * 16 + 8; guideClock = 0; update(DT); ok(GUIDE && GUIDE.kind === 'pad' && GUIDE.id === 'of5', 'the arrow: the offering (' + (GUIDE && GUIDE.key) + ')');
  P.x = 5 * 16 + 8; P.y = 3 * 16 + 8; updCam(0, true); runB(.1); eq(INFO && INFO.id, 'of5', 'its info card'); let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'card + preview of the vermilion hall: ' + threw);
  ok(TQ.some(t => t.s === UNLOCK.of5.card), 'the card names what comes: ' + UNLOCK.of5.card); }
// ---- every shrine level is drawn without errors, day and night
for (let lv = 0; lv <= 10; lv++) {
  setupB(['shrine'].concat(Array.from({ length: lv }, (_, i) => 'of' + (i + 1)))); P.x = 5 * 16 + 8; P.y = 4 * 16 + 8; updCam(0, true);
  for (const c of [.3, .9]) { S.clock = c; let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'shrine level ' + lv + ' clock ' + c + ': ' + threw); }
}
console.log(errs.length ? 'SYS SHRINE FAIL\n  ' + errs.join('\n  ') : 'SYS SHRINE OK');
if (errs.length) process.exitCode = 1;
