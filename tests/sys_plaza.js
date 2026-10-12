// SPEC_v2 16.9 (v2.1 core B): the festival plaza on the lower garden. From star 5 a gate pad in the front yard (23,32)
// (20,000) opens it (walk in from the front yard; its hedge gate (25,29) to the garden opens). Four stalls on its north
// edge, one pad at a time (8K 10K 10K 15K), under a cloth - open during a festival (core A) or a fireworks show: then half
// the guests going home stop at one for 1 s and pay 8 x star into the plaza's pile. Fireworks (32,33): 5,000 + 500 a show
// (8,000 at most), 8 min cool-down (the pad shows a clock, it can't be bought), a 45 s show: fees x1.3, guests x1.5,
// hearts +10, fireworksOn() for the music, at most two bursts a second (fireworkArt, alpha <= .6, never white); the arrow
// never points at it. fw.n / fw.cool are saved.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_plaza.js --seed 4
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const PRE5 = UNLOCKS.filter(u => !u.need5).map(u => u.id).concat(['maid4']);
function setupB(extra, keepStaff) {
  S = defaults(); for (const id of PRE5.concat(extra || [])) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = 5; S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; for (const c of COMBOS) S.combos[c.id] = 1; S.stats.vips = 3; S.stats.time = 3000;
  resetWorld(); go('play'); spawnT = 1e9; if (!keepStaff) STAFF.length = 0; vipT = 1e9; P.x = 17 * 16 + 8; P.y = 31 * 16 + 8; BANNER_Q.length = 0;
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
// ---- the gate
setupB();
{ eq(PADPOS.get('plaza') + '', PLAZA_GATE_PAD + '', 'star 5: the plaza gate pad (23,32)'); ok(BLOCK[31 * MW + 30] === 1, 'the plaza is shut');
  S.money = 20000; walkB(23, 32); runB(3, () => !!S.unlocked.plaza); ok(S.unlocked.plaza, 'bought'); ok(BANNER_Q.some(b => b.kind === 'area' && b.id === 'plaza'), 'area banner');
  ok(!!findPath(23, 31, 30, 32), 'walk in from the front yard'); ok(!!findPath(25, 28, 25, 31), 'through its hedge gate from the garden');
  eq(PADPOS.get('st_goldfish') + '', '27,31', 'the first stall pad (27,31)'); eq(PADPOS.get('fw') + '', FW_PAD + '', 'the fireworks pad');
  ok(OBJS.some(o => o.k === 'chochin'), 'the lantern string along the hedge'); ok(LIGHTS.filter(L => L.y > 29 * 16 && L.y < 31 * 16 && L.x > 25 * 16).length >= 3, 'its lanterns light up at night'); }
// ---- stalls: a chain; each stands on its two tiles, closed until a festival / a show
{ for (const [id, , price, kind, x] of STALLS_B) { eq([...PADPOS.keys()].filter(k => UNLOCK[k].stall).join(), id, 'one stall pad at a time: ' + id); S.money = price; walkB(x, 31); runB(3, () => !!S.unlocked[id]); ok(S.unlocked[id], kind + ' stall bought'); walkB(30, 32);
    ok(BLOCK[30 * MW + x] === 1 && BLOCK[30 * MW + x + 1] === 1, kind + ' stands at (' + x + '-' + (x + 1) + ',30)'); }
  eq(stallsOpen(), false, 'no festival: the stalls are closed'); const sa = []; const _st = stallArt; stallArt = (k, o, f) => { sa.push(o); return _st(k, o, f); }; P.x = 31 * 16 + 8; P.y = 32 * 16 + 8; updCam(0, true); render(); stallArt = _st;
  ok(sa.length >= 4 && sa.every(o => !o), 'drawn under their cloth');
  const c0 = S.clock; S.clock = .85; DL_C = -1; eq(stallsOpen(), true, 'at night: a night market'); S.clock = c0; DL_C = -1; }
// ---- fireworks: a show; price steps; cool-down; the arrow never points at it
{ const h0 = S.hearts, fee0 = fee('room', { rm: ROOM.room1 }), gap0 = spawnGap();
  S.money = 100000; guideClock = 0; P.x = 30 * 16 + 8; P.y = 33 * 16 + 8; update(DT); ok(!(GUIDE && GUIDE.id === 'fw'), 'the arrow never points at the fireworks');
  eq(padNeed(UNLOCK.fw), 5000, 'first show 5,000'); S.money = 5000; walkB(FW_PAD[0], FW_PAD[1]); runB(2, () => fwOn());
  ok(fwOn() && fireworksOn(), 'a show is on (fireworksOn for the music)'); eq(S.fw.n, 1, 'one show'); eq(S.money, 0, 'paid 5,000'); ok(S.hearts - h0 >= FW_HEARTS, 'hearts +10');
  ok(!S.unlocked.fw, 'never "unlocked": bought again later'); eq(S.paid.fw, undefined, 'its pad is empty again'); ok(BANNER_Q.some(b => b.kind === 'fw'), 'a banner');
  eq(fee('room', { rm: ROOM.room1 }), R(fee0 * 1.3), 'fees x1.3 during the show'); ok(Math.abs(spawnGap() - gap0 / 1.5) < 1e-9, 'guests x1.5'); eq(stallsOpen(), true, 'the stalls open');
  ok(!PADPOS.has('fw'), 'cooling down: no pad'); ok(fwCooling(), 'the clock runs'); let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'the pad clock drawn: ' + threw);
  // the sky: at most two bursts a second, fireworkArt at alpha <= .6, nothing white, no screen flash
  const alphas = [], cols = [], spawned = []; let n0 = BURSTS.length;
  const _fa = fireworkArt; fireworkArt = (k, f) => { alphas.push(g.globalAlpha); return _fa(k, f); };
  const _fr = g.fillRect.bind(g);
  for (let i = 0; i < 30 * 20; i++) { update(DT); if (BURSTS.length > n0) spawned.push(S.stats.time); n0 = BURSTS.length; if (i % 3 === 0) { render(); } }
  fireworkArt = _fa;
  ok(spawned.length >= 15, 'bursts in 20 s: ' + spawned.length); let maxIn1 = 0; for (const t of spawned) maxIn1 = Math.max(maxIn1, spawned.filter(x => x > t - 1 && x <= t).length); ok(maxIn1 <= 2, 'at most 2 a second (' + maxIn1 + ')');
  ok(alphas.length > 0 && alphas.every(a => a <= .6 + 1e-9), 'bursts drawn at alpha <= .6 (max ' + Math.max(...alphas).toFixed(2) + ')');
  ok(FW_COLS.every(c => !/^#f[0-9a-f]f[0-9a-f]f[0-9a-f]$/i.test(c)), 'no white in the palette');
  runB(30); ok(!fwOn(), 'the show is over after 45 s'); eq(fee('room', { rm: ROOM.room1 }), fee0, 'fees back');
  runB(FW_COOL - 70); ok(fwCooling() && !PADPOS.has('fw'), 'still cooling'); runB(30); ok(!fwCooling() && PADPOS.has('fw'), '8 min later: the pad is back');
  eq(padNeed(UNLOCK.fw), 5500, 'the next show 5,500'); S.fw.n = 9; eq(padNeed(UNLOCK.fw), FW_MAX, 'never more than 8,000'); S.fw.n = 1; }
// ---- guests at the stalls during a show: half of them, 8 x star into the plaza pile, nobody stuck
setupB(['plaza'].concat(STALLS_B.map(s => s[0])), true);
{ FWS.t = 1e9; spawnT = 0; let took = 0; const p0 = 0;
  const _sd = stallDetour; stallDetour = gu => { const r = _sd(gu); if (r) took++; return r; };
  let stuck = 0; runB(240, () => { for (const gu of GUESTS) if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') stuck++; return false; });
  stallDetour = _sd; ok(took >= 5, 'guests stopped at the stalls: ' + took); ok((S.piles.plaza || 0) + (RUN.stall || 0) > p0, 'stall money: ' + RUN.stall); eq(RUN.stall % (8 * star()), 0, '8 x star a portion');
  eq(stuck, 0, 'nobody stuck'); FWS.t = 0; }
// ---- saved: shows so far and the cool-down (never more than one cool-down away)
setupB(['plaza']);
{ S.fw = { n: 3, cool: S.stats.time + 100 }; saveNow(); S = loadState(); eq(S.fw.n, 3, 'shows saved'); ok(S.fw.cool > S.stats.time, 'the cool-down survives a load');
  const raw = JSON.parse(JSON.stringify(S)); raw.fw.cool = 1e9; eq(loadState(raw).fw.cool, Math.ceil(raw.stats.time) + FW_COOL, 'a corrupt cool-down is capped'); eq(loadState({ v: 2 }).fw.n, 0, 'an old save: no shows yet'); }
console.log(errs.length ? 'SYS PLAZA FAIL\n  ' + errs.join('\n  ') : 'SYS PLAZA OK');
if (errs.length) process.exitCode = 1;
