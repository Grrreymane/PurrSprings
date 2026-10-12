// 18.2 (user, v2.1): "我做完饭团后放桌子上，但因为灶台离桌子太近了，做完就会放到我手上". With a waiter hired and no chef,
// the rice the innkeeper cooks goes onto the counter for the waiter - but the stove zone sits inside the counter's pick-up
// zone, so each portion came straight back onto the innkeeper's tray and the waiter had nothing to carry.
// Now: with a waiter the counter's rice is his (the innkeeper only takes a portion for a call / the VIP). Checks, with the
// innkeeper parked at the stove for 4 minutes:
//   waiter, no chef: P.tray never gains rice except what is cooked straight onto it for a call; the counter gets
//     portions; the waiter serves the seated diners, each within 30 s of sitting down
//   no waiter: cooking still lands on the tray (cook -> tray -> serve, as before)
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/repro_waiter_rice.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 60;
let cooked = 0;
const _sfx = sfx; sfx = (k, a) => { if (k === 'cook') cooked++; return _sfx(k, a); };
const served = []; const _ss = serveSeat; serveSeat = gu => { served.push(gu); return _ss(gu); };
function setupInn(waiter) {
  newGame(); S.tut.moved = true;
  for (const id of ['room2', 'room3', 'onsen', 'recep', 'maid1', 'room4', 'room5', 'dining'].concat(waiter ? ['waiter1'] : [])) { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; }
  for (const rm of ROOMS) if (rm.open && S.unlocked[rm.open]) S.rooms[rm.id] = S.rooms[rm.id] || 'clean';
  S.peak = starOf(S); resetWorld(); go('play'); served.length = 0;
}
// where a player coming up from the tables stands at the stove: inside both the stove zone and the counter's pick-up zone
// (they overlap: stove c (48,312) r 20, counter c (56,344) r 22), on a free spot
function spot() {
  let best = null;
  for (let y = 290; y <= 340; y++) for (let x = 20; x <= 80; x++) {
    P.x = x; P.y = y; if (!inZone(ZONE.stove) || !inZone(ZONE.pass) || boxHit(x, y)) continue;
    const d = dist(x, y, ZONE.stove.c[0], ZONE.stove.c[1]); if (!best || d < best[2]) best = [x, y, d];
  }
  return best;
}
function park(sec, each) {
  const sp = spot(); ok(!!sp, 'a free spot in both the stove and the counter zones');
  for (let i = 0, n = Math.round(sec / DT); i < n; i++) {
    P.x = sp[0]; P.y = sp[1];
    const r0 = countK(P.tray, 'rice'), c0 = cooked, forCalls = playerWants().filter(w => w.k === 'rice' && !w.seat).length - r0;
    update(DT); if (state === 'card') modalClose(); if (state === 'celebrate') { S.done = true; go('play'); }
    each(countK(P.tray, 'rice') - r0, cooked > c0, forCalls);
  }
}
// ---- a waiter, no chef
setupInn(true);
{ let picked = 0, passMax = 0, seatedAt = new Map(), unserved = 0;
  park(240, (gain, didCook, forCalls) => {
    if (gain > 0 && !didCook && forCalls <= 0) picked++;   // took a portion off the counter that no call wanted
    passMax = Math.max(passMax, PASS.n);
    for (const gu of GUESTS) if (dinerWaiting(gu) && !seatedAt.has(gu)) seatedAt.set(gu, S.stats.time);
  });
  const byWaiter = served.length;
  for (const [gu, t0] of seatedAt) { const i = served.indexOf(gu); if (i < 0) { if (S.stats.time - t0 > 30) unserved++; } }
  ok(picked === 0, 'the innkeeper never takes the counter\'s rice for seated diners (' + picked + ' portions picked)');
  ok(passMax >= 1, 'cooked rice lands on the counter (max ' + passMax + ')');
  ok(byWaiter >= 5, 'the waiter serves the diners: ' + byWaiter + ' served in 4 min');
  ok(unserved === 0, unserved + ' seated diners waited > 30 s without being served');
  console.log(`waiter, no chef: ${seatedAt.size} diners sat down, ${byWaiter} served, counter max ${passMax}, rice picked off the counter for seats ${picked}`);
}
// timing: each diner served within 30 s of sitting down
setupInn(true);
{ const t0 = new Map(), waits = []; const _s2 = serveSeat; serveSeat = gu => { if (t0.has(gu)) waits.push(S.stats.time - t0.get(gu)); return _s2(gu); };
  park(240, () => { for (const gu of GUESTS) if (dinerWaiting(gu) && !t0.has(gu)) t0.set(gu, S.stats.time); });
  serveSeat = _s2;
  const worst = waits.length ? Math.max(...waits) : 99;
  ok(waits.length >= 5 && worst <= 30, 'diners served within 30 s: ' + waits.length + ' served, worst ' + worst.toFixed(1) + ' s');
  console.log(`  waits: ${waits.length} served, avg ${(waits.reduce((a, b) => a + b, 0) / Math.max(1, waits.length)).toFixed(1)} s, worst ${worst.toFixed(1)} s`); }
// ---- no waiter: cook -> tray as before
setupInn(false);
{ let onTray = 0; park(240, (gain, didCook) => { if (gain > 0 && didCook) onTray++; });
  ok(onTray >= 1, 'no waiter: cooked rice lands on the tray (' + onTray + ' portions)');
  console.log(`no waiter: ${onTray} portions cooked onto the tray`); }
console.log(errs.length ? 'WAITER RICE FAIL\n  ' + errs.join('\n  ') : 'WAITER RICE OK');
if (errs.length) process.exitCode = 1;
