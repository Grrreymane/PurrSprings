// SPEC_v2 4.8: less fetching money. The net (v2.0.1 G5: pickup radius 10 / 34 / 58 / 82 px, every pile inside - small ones
// and the cash box too - flies over to you; the new reach rings out on buying and a faint ring shows while it pulls); the
// clerk 老墨 takes the oldest pile >= 2 x the star's tip lying > 48 px from the innkeeper, bags it (the fish are in the
// cash box from that moment), carries the bag home; piles within 3 tiles of you are yours. The cash box (= the desk pile)
// shows a chest over 200 (glowing over 1,000) and pays out with 10 fish; a 2 px bar under the HUD number shows money /
// the cheapest visible progress pad.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_clerk.js --seed 4
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const BASE = ['room2', 'room3', 'onsen', 'recep', 'room4', 'room5', 'room6', 'maid1', 'milk', 'porter', 'dining', 'table3', 'waiter1', 'chef', 'room7', 'w1', 'w2'];
function st(list, peak) {
  S = defaults(); for (const id of BASE.concat(list || [])) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); S.basket = BASKET_MAX; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9;
  for (let i = STAFF.length - 1; i >= 0; i--) if (STAFF[i].role !== 'clerk') STAFF.splice(i, 1);   // only the clerk walks about
  P.x = 2 * 16 + 8; P.y = 33 * 16 + 8;   // far away in the shop corner
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const fish = () => S.money + Object.values(S.piles).reduce((a, b) => a + b, 0);
const clerk = () => STAFF.find(s => s.role === 'clerk');
// ---- no clerk: piles just wait
st([], 3); S.piles.room1 = 40; run(20); eq(S.piles.room1, 40, 'no clerk: the pile waits');
// ---- the clerk: walks to a pile >= 2 x tip, bags it (cash box +v that moment), carries it home
st(['clerk'], 3);
{ const c = clerk(); ok(!!c, 'clerk hired'); eq(c.name, '老墨', 'his name');
  const tip = STARS[3].tip; S.piles.room1 = 2 * tip - 1; S.piles.room2 = 2 * tip; const f0 = fish(), r0 = S.piles.recep || 0;
  let bagAt = null, sameFrame = true, conserved = true;
  run(40, () => { if (fish() !== f0) conserved = false; if (bagAt === null && c.bag > 0) { bagAt = S.stats.time; sameFrame = S.piles.room2 === 0 && (S.piles.recep || 0) === r0 + 2 * tip; } return bagAt !== null && c.bag === 0; });
  ok(bagAt !== null, 'bagged the pile >= 2 x tip'); ok(sameFrame, 'the fish are in the cash box the moment it is bagged'); ok(conserved, 'no fish made or lost on the way');
  eq(S.piles.room1, 2 * tip - 1, 'a pile under 2 x tip stays'); eq(c.bag, 0, 'bag emptied at the cash box'); eq(tileOf(c) + '', CHEST_SPOT + '', 'tipped in at the cash box');
  eq(S.staff.clerk, 1, 'clerk xp +1 per bag'); }
// ---- oldest first; a pile within 3 tiles of the innkeeper is never taken; walking up to a claimed pile makes him give it up
st(['clerk'], 3);
{ const c = clerk(), tip = STARS[3].tip; S.piles.onsen = 30; run(1); S.piles.room3 = 30; run(.1);
  eq(c.job, 'onsen', 'the oldest pile first (' + c.job + ')');
  P.x = tcx(PILE_AT.onsen) + 30; P.y = tcy(PILE_AT.onsen); run(.1); ok(c.job !== 'onsen', 'you came near it: he gives it up'); eq(c.job, 'room3', 'and takes the next one');
  P.x = tcx(PILE_AT.room3); P.y = tcy(PILE_AT.room3) + 40; run(.1); ok(c.job !== 'room3', 'room3 is yours now');
  run(20); ok(S.piles.onsen === 30 || !pileNearP('onsen'), 'never takes a pile next to you'); ok(S.piles.room3 >= 30 || !pileNearP('room3'), 'never takes a pile next to you (room3)'); }
// ---- a long run: everything he takes ends in the cash box; no pile next to the innkeeper is ever bagged
st(['clerk', 'shop', 'bigbath'], 3); spawnT = 1; S.unlocked.maid2 = true; ensureStaff();
{ const f0 = () => S.money + Object.values(S.piles).reduce((a, b) => a + b, 0); let bad = 0, prevPiles = {};
  P.x = 17 * 16 + 8; P.y = 27 * 16 + 8;
  for (let i = 0; i < 30 * 300; i++) {
    const before = Object.assign({}, S.piles); update(DT);
    for (const id in before) if (id !== 'recep' && before[id] > 0 && !S.piles[id] && clerk().bag > 0 && pileNearP(id) && dist(P.x, P.y, tcx(PILE_AT[id]), tcy(PILE_AT[id])) > NET_R[netLvl()]) bad++;
  }
  ok(RUN.clerk > 0, 'the clerk carried ' + RUN.clerk + ' fish in 5 min'); eq(bad, 0, 'never bagged a pile within 3 tiles of you'); }
// ---- the net: radius by level, the new reach rings out once
st([], 2);
{ for (const [lvl, r] of NET_R.entries()) {
    S.unlocked.net1 = lvl >= 1; S.unlocked.net2 = lvl >= 2; S.unlocked.net3 = lvl >= 3; eq(NET_R[netLvl()], r, 'net level ' + lvl + ' radius');
    S.piles.room1 = 500; const [tx, ty] = PILE_AT.room1; P.x = tcx([tx, ty]) + r + 1.5; P.y = tcy([tx, ty]); zones(DT); eq(S.piles.room1, 500, 'out of reach at r+1.5 (' + r + ')');
    P.x -= 2; zones(DT); eq(S.piles.room1, 0, 'picked up inside r (' + r + ')');
    // v2.0.1 G5: no NEAR_MIN gate any more - a 1-fish pile and the cash box come in from the edge of the reach too, and
    // what the net pulls flies over to you (FX 'suck') with the faint ring up for a moment (netPullAt)
    if (r > NET_R[0]) { S.piles.room1 = 1; P.x = tcx([tx, ty]) + r - .5; FX.length = 0; netPullAt = -9; zones(DT); eq(S.piles.room1, 0, 'a 1-fish pile: pulled at the edge (' + r + ')');
      ok(FX.some(f => f.k === 'suck') && !FX.some(f => f.k === 'fly') && netPullAt === T, 'pulled: the fish fly to you, the ring shows (' + r + ')'); }
    if (r > NET_R[0]) { const [cx, cy] = PILE_AT.recep; S.piles.recep = 500; P.x = tcx([cx, cy]) + r - .5; P.y = tcy([cx, cy]); zones(DT); eq(S.piles.recep, 0, 'cash box: pulled by the net too (' + r + ')'); }
    if (lvl) ok(NET_R[lvl] - NET_R[lvl - 1] >= 20, 'each level adds about 1.5 tiles (' + NET_R[lvl - 1] + ' -> ' + NET_R[lvl] + ')'); }
  st(['maid1'], 2); S.money = 200; FX.length = 0; unlock('net1'); const rf = FX.find(f => f.k === 'netring'); ok(rf && rf.r0 === 10 && rf.r1 === 34, 'net1: ring from 10 to 34');
  run(1); ok(FX.some(f => f.k === 'netring'), 'the ring stays a moment after it opens'); run(1.6); ok(!FX.some(f => f.k === 'netring'), 'then it is gone (2.4 s)'); }
// ---- the cash box: chest art over 200 (glow over 1,000); collecting it: 10 fish fly, a rattle
st([], 2);
{ let lv = []; const real = chestArt; chestArt = l => { lv.push(l); return real(l); };
  S.piles.recep = 150; render(); S.piles.recep = 250; render(); S.piles.recep = 1500; render(); chestArt = real;
  eq(lv.join(), '1,2', 'chest only over 200 (glow level 2 over 1,000)'); }
{ S.piles.recep = 500; FX.length = 0; P.x = tcx(PILE_AT.recep); P.y = tcy(PILE_AT.recep); zones(DT); eq(FX.filter(f => f.k === 'fly').length, 10, 'the cash box pays out with 10 fish');
  S.piles.recep = 60; FX.length = 0; zones(DT); ok(FX.filter(f => f.k === 'fly').length <= 6, 'a small pile: up to 6'); }
// ---- the HUD bar: money / the cheapest visible progress pad (decor / booths don't count)
st([], 2); S.money = 10; padsUpdate();
{ let need = 0; for (const u of visiblePads()) if (!u.booth && !u.decor) { const k = padNeed(u); if (k > 0 && (!need || k < need)) need = k; }
  ok(need > 0, 'a progress pad is visible (' + need + ')'); let threw = null; try { render(); S.money = need; render(); } catch (e) { threw = e; } ok(!threw, 'HUD renders: ' + threw); }
console.log(errs.length ? 'SYS CLERK FAIL\n  ' + errs.join('\n  ') : 'SYS CLERK OK');
if (errs.length) process.exitCode = 1;
