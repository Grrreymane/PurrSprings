// Price pads (state-save.js padsUpdate): a progress pad on the ground stays until it is bought, even when cheaper ones
// become available ("I didn't buy the milk right after the onsen and its pad was gone"); only a new gate may push one out.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_padkeep.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const prog = () => [...PADPOS.keys()].filter(id => { const u = UNLOCK[id]; return !(u.decor || u.goldOf || u.hat || u.pet || u.outfit || u.uniform || u.id === 'statue' || u.extra); });
S = defaults(); resetWorld(); go('play');
let milkSeen = false, steps = 0;
// buy the cheapest shown non-milk progress pad again and again, as a player who skips the milk would
for (let i = 0; i < 40; i++) {
  padsUpdate(); const before = prog();
  if (before.includes('milk')) milkSeen = true;
  const pick = before.filter(id => id !== 'milk' && !UNLOCK[id].gate).sort((a, b) => UNLOCK[a].price - UNLOCK[b].price)[0] || before.find(id => id !== 'milk');
  if (!pick) break;
  S.unlocked[pick] = true; S.peak = Math.max(S.peak, starOf(S)); steps++;
  padsUpdate(); const after = prog();
  const newGate = after.some(id => UNLOCK[id].gate && !before.includes(id));
  for (const id of before) if (id !== pick && !S.unlocked[id] && !after.includes(id) && !newGate) errs.push(`step ${steps}: bought ${pick}, "${id}" vanished (${before.join(',')} -> ${after.join(',')})`);
  if (milkSeen && !S.unlocked.milk && !after.includes('milk') && !newGate) errs.push(`step ${steps}: the milk pad is gone (${after.join(',')})`);
}
ok(milkSeen, 'the milk pad never showed');
ok(steps > 10, 'only ' + steps + ' purchases simulated');
console.log(errs.length ? 'SYS PADKEEP FAIL\n  ' + errs.slice(0, 20).join('\n  ') : 'SYS PADKEEP OK  ' + steps + ' purchases skipping the milk: no shown pad vanished');
if (errs.length) process.exitCode = 1;
