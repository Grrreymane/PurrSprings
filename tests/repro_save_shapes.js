// Repro: loadState() keeps whatever keys a saved `piles` object has. Any key that is not in PILE_AT (a renamed
// pile id from an older build, an array, a hand-edited save) makes zones() / drawScene() / guideTarget()
// destructure `PILE_AT[id]` = undefined and throw every frame -> the game is frozen behind the error panel,
// and because the save is never cleared, every reload freezes again.
// Also shows other odd shapes that load "fine" but leave bad numbers in S.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/repro_save_shapes.js --seed 1
const DT = 1 / 30;
function tryShape(raw) {
  localStorage.setItem(SAVE + 'state', raw);
  let err = null, frames = 0;
  try { S = loadState(); resetWorld(); go('play'); } catch (e) { return raw + '  -> LOAD THREW ' + e.message; }
  for (let i = 0; i < 90; i++) {
    try { update(DT); render(); frames++; } catch (e) { err = err || e.message; }
  }
  return raw + '  -> ' + (err ? 'THROWS every frame: "' + err + '" (' + frames + '/90 frames ok)' : 'ok') + ' | money ' + S.money + ' fmt ' + fmt(S.money) + ' | piles ' + JSON.stringify(S.piles);
}
for (const raw of [
  '{"piles":{"desk":5}}',                      // unknown pile id
  '{"piles":[3,4]}',                           // array instead of object
  '{"piles":{"room5":9}}',                     // pile in a locked room (behind a closed door)
  '{"money":1e999}',                           // Infinity survives int0()
  '{"money":12,"paid":{"room2":40}}',          // paid > price (e.g. a price lowered in an update)
]) console.log(tryShape(raw));
// the locked-room pile: the guide arrow points at it (rule 6) though no path exists
localStorage.setItem(SAVE + 'state', '{"piles":{"room5":9},"tut":{"moved":true}}'); S = loadState(); resetWorld(); go('play');
const gt = guideTarget(), [sx, sy] = tileOf(P);
console.log('locked-room pile: guideTarget =', JSON.stringify(gt), '| path from player =', gt ? JSON.stringify(findPath(sx, sy, gt.tx, gt.ty)) : '- (no arrow: a 9-fish pile is under the rule-15 minimum)');
// paid > price with 0 money: standing on the pad never unlocks it (pour() returns on money <= 0 before the unlock check)
localStorage.setItem(SAVE + 'state', '{"money":0,"paid":{"room2":30}}'); S = loadState(); resetWorld(); go('play'); S.tut.moved = true;
Object.assign(P, { x: 18 * TILE + 8, y: 20 * TILE + 8 });
for (let i = 0; i < 150; i++) update(DT);
console.log('paid 30 > price 25, money 0, stood on the room2 pad 5 s: unlocked =', !!S.unlocked.room2, '| pad label would read', fmt(padNeed(UNLOCK.room2)));
S.money = 3; for (let i = 0; i < 30; i++) update(DT);
console.log('  after money = 3: unlocked =', !!S.unlocked.room2, '| money', S.money, '| paid', S.paid.room2, '(the extra 5 is never refunded)');
// an unlocked set that skips a prerequisite (porter without onsen): the porter's basket goal is behind the closed
// onsen door, findPath -> null, s.lost stays true forever (goTo never re-plans the same goal)
localStorage.setItem(SAVE + 'state', '{"unlocked":{"porter":true},"basket":0}'); S = loadState(); resetWorld(); go('play');
for (let i = 0; i < 30 * 60; i++) update(DT);
const po = STAFF.find(s => s.role === 'porter');
console.log('porter without onsen after 60 s: lost =', po.lost, '| carry', po.carry, '| at tile', JSON.stringify(tileOf(po)), '| goal', JSON.stringify(po.goal));
