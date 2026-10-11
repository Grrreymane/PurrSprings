// SPEC_v2 4.5: decor + combos. Bought once = owned, any number of rooms. Stand still on a slot: 0.8 s -> the next piece,
// then one every 1.2 s; order (1) completes a known combo with the other slot (2) not standing anywhere yet (3) the rest
// in table order (4) empty; stops by itself on a combo (walk off and back to go on). Effects: >= 1 piece room x1.2, combo
// room x1.6 + tip x2; the first time a combo appears ♥ +10 + album; later only the sparkle. Hidden combos are found by
// trying and not pointed at until gold star 3 / 4 hints them; the arrow (rule 14) points at a slot that completes a hinted
// combo, else an empty room's A, else (no bare room) a re-dress slot; pieces of the rarest combo come first (v2.0 audit).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_decor.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const BASE = ['room2', 'room3', 'onsen', 'recep', 'shop', 'porter', 'maid1', 'milk'];
function st(list, peak) {
  S = defaults(); for (const id of BASE.concat(list)) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); S.basket = BASKET_MAX; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9;
  STAFF.length = 0;   // nobody walking around (the maid / porter would only add noise)
}
const SL = key => DSLOTS.find(s => s.key === key);
const at = sl => { P.x = tcx(sl.at); P.y = tcy(sl.at); botMove = null; };
const run = sec => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) update(DT); };
const away = () => { P.x = 17 * 16 + 8; P.y = 27 * 16 + 8; run(.1); };
// ---- geometry: two slots in each of the 13 guest rooms, none in the suites; outside the cleaning zone, on floor
eq(DSLOTS.length, 26, 'decor slots'); ok(!DSLOTS.some(s => s.rm.vip), 'no slots in the suites');
st(UNLOCKS.filter(u => !u.need5).map(u => u.id), 5); rebuildWorld();
for (const s of DSLOTS) {
  ok(walkable(s.at[0], s.at[1]), 'slot on floor ' + s.key);
  ok(dist(tcx(s.at), tcy(s.at), s.rm.cleanC[0], s.rm.cleanC[1]) > s.rm.cleanR, 'slot outside the cleaning zone ' + s.key);
  ok(!!findPath(DESK_SPOT[0], DESK_SPOT[1], s.at[0], s.at[1]), 'slot reachable ' + s.key);
  ok(!PILE_AT[s.rm.id] || PILE_AT[s.rm.id] + '' !== s.at + '', 'slot is not the tip pile ' + s.key);
}
// ---- nothing owned: standing on a slot does nothing
st([], 2); at(SL('room1:A')); run(3); eq(Object.keys(S.decor).length, 0, 'no decor owned, nothing placed');
// ---- timing + order: (2) pieces standing nowhere yet, in table order, then empty
st(['d_scroll', 'd_ikebana'], 2); at(SL('room1:A'));
run(.75); eq(S.decor['room1:A'], undefined, 'not before 0.8 s');
run(.1); eq(S.decor['room1:A'], 'd_scroll', 'first swap at 0.8 s: the first piece in table order');
run(1.05); eq(S.decor['room1:A'], 'd_scroll', 'not before another 1.2 s');
run(.15); eq(S.decor['room1:A'], 'd_ikebana', 'second swap after 1.2 s');
run(1.2); eq(S.decor['room1:A'], undefined, 'then empty');
run(1.2); eq(S.decor['room1:A'], 'd_scroll', 'and round again');
// ---- moving resets the wait (stand still)
away(); at(SL('room2:A')); run(.5);
for (let i = 0; i < 4; i++) { botMove = { x: i & 1 ? -1 : 1, y: 0 }; update(DT); } botMove = null; ok(SL('room2:A').at + '' === tileOf(P) + '', 'still on the slot after the wiggle');
run(.6); eq(S.decor['room2:A'], undefined, 'moving reset the 0.8 s wait');
run(.3); eq(S.decor['room2:A'], 'd_ikebana', 'then it swaps (ikebana: not standing anywhere yet comes before scroll)');
// ---- (1) a known combo partner first; it stops on the combo; ♥ +10 + album the first time
st(['d_scroll', 'd_ikebana', 'd_tank'], 3); S.decor['room1:A'] = 'd_scroll';
{ const h0 = S.hearts; at(SL('room1:B')); eq(slotCycle(SL('room1:B'))[0], 'd_ikebana', 'combo partner first in the order'); run(.85);
  eq(S.decor['room1:B'], 'd_ikebana', 'combo partner first (c_ga)'); ok(!!S.combos.c_ga, 'c_ga discovered'); eq(S.combos.c_ga, S.day, 'album: found on day ' + S.day);
  eq(S.hearts - h0, 10, 'first combo ♥ +10'); eq(S.stats.combosMade, 1, 'combosMade 1');
  ok(POPS.some(p => p.s === '组合！'), '"组合！" pops'); ok(BANNER_Q.some(b => b.kind === 'combo' && b.id === 'c_ga'), 'combo banner queued');
  run(5); eq(S.decor['room1:B'], 'd_ikebana', 'stops on the combo'); ok(P.slot.stop, 'slot stopped'); }
// walk off and back on: it goes on (breaks the combo), then makes it again - no second ♥ +10
{ away(); const h0 = S.hearts; at(SL('room1:B')); run(.85);
  ok(S.decor['room1:B'] !== 'd_ikebana', 'stepping back on swaps again: ' + S.decor['room1:B']); ok(!roomCombo(ROOM.room1), 'combo broken');
  run(1.2 * 3); eq(S.decor['room1:B'], 'd_ikebana', 'back to the combo'); ok(roomCombo(ROOM.room1) === COMBO.c_ga, 'combo again'); eq(S.hearts, h0, 'no second ♥ +10'); eq(S.stats.combosMade, 2, 'combosMade 2'); }
// the piece in the other slot is skipped (no use twice in one room)
{ st(['d_scroll', 'd_ikebana'], 2); S.decor['room1:A'] = 'd_scroll'; at(SL('room1:B'));
  const seen = new Set(); P.slot.stop = false;
  for (let i = 0; i < 10; i++) { run(1.25); seen.add(S.decor['room1:B'] || '-'); if (P.slot.stop) { away(); at(SL('room1:B')); } }
  ok(!seen.has('d_scroll'), 'the other slot\'s piece never doubles: ' + [...seen]); }
// ---- hidden combos: found by trying (they stop the cycle too), never pointed at
st(['d_scroll', 'd_ikebana', 'd_bonsai', 'dining', 'd_tank'], 3); S.decor['room1:A'] = 'd_scroll'; S.decor['room2:A'] = 'd_tank'; S.decor['room2:B'] = 'd_ikebana';
{ eq(slotCycle(SL('room1:B')).join(','), 'd_ikebana,d_bonsai,d_tank,', 'order: known combo, standing nowhere yet, the rest, empty');
  S.decor['room3:A'] = 'd_scroll'; S.decor['room3:B'] = 'd_ikebana'; delete S.decor['room1:A']; S.decor['room1:A'] = 'd_tank';
  st(['d_scroll', 'd_bonsai'], 2); S.decor['room1:A'] = 'd_scroll';
  eq(slotCycle(SL('room1:B'))[0], 'd_bonsai', 'hidden s_tea is not "known": bonsai only as a piece standing nowhere yet');
  at(SL('room1:B')); run(.85); eq(S.decor['room1:B'], 'd_bonsai', 'bonsai'); ok(!!S.combos.s_tea, 'hidden s_tea found by trying'); ok(P.slot.stop, 'stops on the hidden combo'); }
{ st(['d_scroll', 'd_bonsai'], 2); S.decor['room1:A'] = 'd_scroll'; away();
  const t = slotTarget(); ok(t && t.key === 'room2:A', 'hidden partner owned: the arrow goes to an empty room\'s A, not room1:B (' + (t && t.key) + ')');
  S.combos.s_tea = 1; eq(slotCycle(SL('room1:B'))[0], 'd_bonsai', 'once found, a hidden combo counts as known for the order'); }
// ---- v2.0 audit ROOM-1 (room variety): the order and the arrow's piece prefer the combo the fewest rooms have
st(['d_scroll', 'd_ikebana', 'd_bonsai', 'd_screen'], 2);
{ for (const r of ['room1', 'room2']) { S.decor[r + ':A'] = 'd_scroll'; S.decor[r + ':B'] = 'd_ikebana'; }   // two 雅致和室 already
  eq(slotPiece(SL('room3:A')), 'd_bonsai', 'empty room: the arrow shows a piece of the rarer combo (zen), not the scroll again');
  eq(slotCycle(SL('room3:A')).slice(0, 2).join(','), 'd_bonsai,d_screen', 'empty room: zen pieces first in the swap order'); }
// ---- v2.0 audit ROOM-2: the hidden combos are hinted from gold star 3 / 4 (a banner + P11); with no bare room left the
// arrow re-dresses a room whose combo 2+ rooms share
st(UNLOCKS.filter(u => !u.need5).map(u => u.id).concat(['d_maneki', 'd_daruma', 'd_tank']), 5);
{ eq(star(), 5, 'star 5'); S.stats.time = 100; S.hearts = 2999; goldSeen = goldStars(); ok(!hinted(COMBO.s_fish), 'gold x2: s_fish still hidden');
  BANNER_Q.length = 0; const said = []; const _ls = lineSay; lineSay = (w, k) => { said.push(k); return _ls(w, k); }; addHearts(1);
  eq(goldStars(), 3, 'gold x3'); ok(hinted(COMBO.s_fish) && !hinted(COMBO.s_tea), 'gold x3: s_fish hinted, s_tea not yet');
  ok(BANNER_Q.some(b => b.kind === 'hint' && b.id === 's_fish'), 'the reveal: hint banner (' + BANNER_Q.map(b => b.kind).join(',') + ')');
  for (let i = 0; i < 30 * 12 && !said.includes('P11'); i++) update(DT); lineSay = _ls;
  ok(said.includes('P11') && LINE && LINE.id === 'P11', 'P11 when the hint banner comes up, after the overtake P06 (' + said.join(',') + ')');
  for (const rm of GUEST_ROOMS) if (roomOpen(rm)) { S.decor[rm.id + ':A'] = 'd_scroll'; S.decor[rm.id + ':B'] = 'd_ikebana'; }
  for (const r of ['room1', 'room2']) { S.decor[r + ':A'] = 'd_maneki'; S.decor[r + ':B'] = 'd_daruma'; }
  const c = slotCands(); ok(c.length && c[0].rm.id.match(/^room[12]$/) && c[0].k === 'B', 're-dress: a B slot of a 好运连连 room (' + (c[0] && c[0].key) + ')');
  eq(slotPiece(c[0]), 'd_tank', 'its missing piece: the tank');
  at(c[0]); run(.85); ok(S.combos.s_fish, 'standing there makes 招财进鱼'); away();
  ok(!slotCands().length || !slotCands().some(sl => S.decor[otherSlot(sl).key] === 'd_maneki' && roomCombo(sl.rm)), 'made once: no more re-dressing for it');
  S.hearts = 6000; ok(hinted(COMBO.s_tea), 'gold x4: s_tea hinted'); }
// ---- fees (3.2): >= 1 piece x1.2, combo x1.6 (either, not both), cottage x1.5; tip x2 in a combo room
st(['d_scroll', 'd_ikebana', 'dining', 'w1', 'room7', 'garden'], 4);
{ const rm = ROOM.room1, c1 = ROOM.c1, base = STARS[4].room;
  eq(roomMult(rm), 1, 'no decor x1'); eq(fee('room', { rm }), base, 'plain room fee');
  S.decor['room1:A'] = 'd_scroll'; eq(roomMult(rm), 1.2, 'one piece x1.2'); eq(fee('room', { rm }), R(base * 1.2), 'decor room fee');
  S.decor['room1:B'] = 'd_ikebana'; eq(roomMult(rm), 1.6, 'combo x1.6'); eq(fee('room', { rm }), R(base * 1.6), 'combo room fee');
  eq(fee('tip', { rm }), STARS[4].tip * 2, 'combo room tip x2'); eq(fee('tip', { rm: ROOM.room2 }), STARS[4].tip, 'plain tip');
  S.decor['c1:A'] = 'd_scroll'; eq(roomMult(c1), 1.5 * 1.2, 'cottage with decor 1.8');
  ok(qualityQ() > 1, 'Q rises with decor: ' + qualityQ().toFixed(3)); }
// ---- a combo room changes its noren (repainted door) and the couples' favourite room exists
{ const d = DOOR_OF.room1; ok(d && d.room === 'room1', 'door of room1'); ok(PREF.couple(ROOM.room1), 'couples like the combo room');
  let threw = null; try { paintDoor(d); rebuildWorld(); render(); } catch (e) { threw = e; } ok(!threw, 'repaint + render: ' + threw); }
// ---- the arrow (rule 14): an empty room's A first when nothing completes a combo; the partner slot next; standing there = here
st(['d_scroll', 'd_ikebana'], 2); S.money = 0;
{ away(); let t = guideTarget(); ok(t && t.kind === 'slot', 'decor owned, nothing else to do: slot (' + (t && t.kind) + ')');
  const sl = DSLOT_AT[t.ty * MW + t.tx]; ok(sl && sl.k === 'A', 'an empty room\'s A slot');
  at(sl); run(.3); t = guideTarget(); ok(t && t.here && t.kind === 'slot', 'standing on it = here');
  run(.6); ok(!!S.decor[sl.key], 'placed ' + S.decor[sl.key]);
  t = guideTarget(); const nx = t && DSLOT_AT[t.ty * MW + t.tx]; ok(nx && nx.rm === sl.rm && nx.k === 'B', 'then the partner slot of the same room (' + (nx && nx.key) + ')');
  at(nx); run(.9); ok(!!roomCombo(sl.rm), 'combo made by following the arrow');
  t = guideTarget(); ok(t && t.kind === 'slot' && DSLOT_AT[t.ty * MW + t.tx].rm !== sl.rm, 'then the next empty room'); }
// a combo room is never pointed at (no breaking it), closed rooms neither
{ for (const s of DSLOTS) if (!roomOpen(s.rm)) ok(slotTarget() !== s, 'closed room ' + s.key); }
// ---- saves: only bought pieces, only open guest rooms (10.1)
{ const raw = JSON.parse(JSON.stringify(defaults())); Object.assign(raw.unlocked, { room2: true, d_scroll: true });
  raw.decor = { 'room1:A': 'd_scroll', 'room2:B': 'd_ikebana', 'room3:A': 'd_scroll', 'c3:A': 'd_scroll', 'room1:C': 'd_scroll', 'room2:A': 'zz', 'room2:B ': 'd_scroll' };
  const s = loadState(raw); eq(JSON.stringify(s.decor), JSON.stringify({ 'room1:A': 'd_scroll' }), 'decor sanitized'); }
// ---- a follow-the-arrow run: owning the first pair, the bot makes a combo and dresses rooms (couples become possible)
st(['d_scroll', 'd_ikebana', 'room4', 'room5', 'room6', 'tea', 'basket1'], 2); spawnT = 1; S.money = 0;
{ let path = [], key = '', think = 0;
  for (let i = 0; i < 30 * 240; i++) {
    think -= DT;
    if (think <= 0) { think = .3; const t = guideTarget(); if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
    if (path.length) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
    update(DT);
  }
  botMove = null;
  const combos = GUEST_ROOMS.filter(rm => roomOpen(rm) && roomCombo(rm)).length;
  ok(combos >= 1, 'combo rooms after 4 min of following the arrow: ' + combos);
  for (const k in S.decor) ok(S.unlocked[S.decor[k]] && roomOpen(ROOM[k.split(':')[0]]), 'only owned pieces in open rooms: ' + k); }
console.log(errs.length ? 'SYS DECOR FAIL\n  ' + errs.join('\n  ') : 'SYS DECOR OK');
if (errs.length) process.exitCode = 1;
