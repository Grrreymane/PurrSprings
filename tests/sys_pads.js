// SPEC_v2 3.4 / 3.5: price pads on the ground.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_pads.js
// at most 4 progress pads (gates always shown, then part-paid, then cheapest); decor 2 shop pads with stable slots;
// one hat + one pet booth (cheapest buyable, VIP-gated hats wait); the statue only from star 5 with the shop open;
// pads only in open areas; the star badge only when buying really adds a star; the unlock table itself is sane.
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const ids = () => [...PADPOS.keys()].sort().join(',');
const prog = () => [...PADPOS.keys()].filter(id => !UNLOCK[id].decor && !UNLOCK[id].booth);
function st(list, o) { S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), (o && o.peak) || 1); Object.assign(S, o && o.S || {}); resetWorld(); }
// the table
ok(UNLOCKS.length === 66, 'UNLOCKS has ' + UNLOCKS.length + ' rows (SPEC 3.4: 54 pads + 12 star-5 rows)');
const tot = (a, b) => UNLOCKS.slice(UNLOCKS.findIndex(u => u.id === a), UNLOCKS.findIndex(u => u.id === b) + 1).reduce((s, u) => s + u.price, 0);
ok(tot('room2', 'onsen') === 145 && tot('recep', 'dining') === 2245 && tot('tray1', 'garden') === 7120 && tot('g_shishi', 'roten') === 9770,   // stage 4 prices (SPEC_v2 3.4 / 18.2)
   'star totals ' + [tot('room2', 'onsen'), tot('recep', 'dining'), tot('tray1', 'garden'), tot('g_shishi', 'roten')]);
ok(tot('maid4', 'statue') === 1354800, 'after-star-5 total ' + tot('maid4', 'statue'));
for (const u of UNLOCKS) {
  for (const r of u.req) ok(UNLOCK[r] && UNLOCKS.indexOf(UNLOCK[r]) < UNLOCKS.indexOf(u), u.id + ' requires ' + r + ' listed later / unknown');
  ok(u.card && [...u.card].length <= 9, u.id + ' card longer than 9: ' + u.card);
  ok([...u.name].length === 2, u.id + ' name not 2 chars: ' + u.name);
}
ok(UNLOCKS.filter(u => u.star).map(u => u.id).join() === 'onsen,dining,garden,roten', 'star gates');
// fresh game: only 客房
st([]); ok(ids() === 'room2', 'fresh pads ' + ids());
// part way into star 2: gates always shown, at most 4 progress pads
st(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'maid1', 'room4', 'room5']);
ok(prog().length === 4, 'progress pads ' + prog().length + ' ' + ids());
ok(PADPOS.has('shop') && PADPOS.has('dining'), 'gates shop + dining shown: ' + ids());
// the cheapest non-gates fill the rest
{ const rest = prog().filter(id => !UNLOCK[id].gate).map(id => UNLOCK[id].price); ok(rest.every(p => p <= 80), 'cheapest non-gates: ' + ids()); }
// a part-paid pad stays visible even when cheaper ones appear
S.paid.room6 = 100; padsUpdate(); ok(PADPOS.has('room6'), 'part-paid room6 kept: ' + ids()); ok(prog().length === 4, 'still 4: ' + ids());
// decor: 2 pads in the shop, table order, stable slots
st(['room2', 'room3', 'onsen', 'recep', 'shop']);
ok(PADPOS.get('d_scroll') + '' === '2,32' && PADPOS.get('d_ikebana') + '' === '4,32', 'decor slots ' + JSON.stringify([...PADPOS]));
S.unlocked.d_scroll = true; padsUpdate();
ok(PADPOS.get('d_ikebana') + '' === '4,32' && !PADPOS.has('d_bonsai'), 'ikebana keeps its slot, bonsai waits: ' + JSON.stringify([...PADPOS]));
S.unlocked.d_ikebana = true; padsUpdate();
ok(PADPOS.has('d_bonsai') && PADPOS.has('d_screen'), 'bonsai + screen after both: ' + ids());
// shop locked: no decor pads even when "bought" prerequisites exist
st(['room2', 'room3', 'onsen', 'recep']); ok(!PADPOS.has('d_scroll') && PADPOS.has('shop'), 'no decor before the shop: ' + ids());
// star 5: statue needs the shop; hats one at a time; VIP hats wait for the VIP
st(['room2', 'room3', 'onsen', 'recep'], { peak: 5 });
ok(!PADPOS.has('statue') && !PADPOS.has('h_straw'), 'star 5 without the shop: no statue / hats ' + ids());
st(['room2', 'room3', 'onsen', 'recep', 'shop'], { peak: 5 });
ok(PADPOS.has('statue') && PADPOS.get('h_straw') + '' === '5,33' && PADPOS.get('p_duck') + '' === '7,33', 'star 5 booths ' + JSON.stringify([...PADPOS]));
['h_straw', 'h_flower'].forEach(id => { S.unlocked[id] = true; }); padsUpdate();
ok(PADPOS.has('h_fox') && !PADPOS.has('h_beret'), 'beret waits for 猫川先生: ' + ids());
S.album.vip.kawa = 1; padsUpdate(); ok(PADPOS.has('h_beret'), 'beret after hosting kawa: ' + ids());
S.unlocked.p_duck = true; padsUpdate(); ok(PADPOS.get('p_shiba') + '' === '7,33', 'shiba after the duck: ' + ids());
ok(!guidePads().some(u => u.booth), 'the arrow never points at booths / statue');
// pads only in open areas: the roten pad needs nothing but c2 + bigbath, and it sits in the (open) onsen
st(UNLOCKS.slice(0, UNLOCKS.findIndex(u => u.id === 'roten')).map(u => u.id));
ok(PADPOS.has('roten'), 'roten gate shown: ' + ids());
for (const [id, xy] of PADPOS) ok(areaOpen(areaAt(xy[0], xy[1])), id + ' pad in a closed area');
// star badge: a migrated v1 ★4 (peak 4, only the onsen gate bought) gets no badge on 食堂 / 庭园, one on 星见
st(['room2', 'room3', 'onsen'], { peak: 4 });
ok(!raisesStar(UNLOCK.dining) && !raisesStar(UNLOCK.garden) && !raisesStar(UNLOCK.roten), 'peak 4 + 1 gate: no badge yet');
S.unlocked.dining = true; S.unlocked.garden = true; ok(raisesStar(UNLOCK.roten), 'peak 4 + 3 gates: roten adds a star');
st([]); ok(raisesStar(UNLOCK.onsen), 'fresh: onsen adds a star');
// pouring + unlocking through the real zone code; the bought gate opens its area
st(['room2', 'room3']); S.money = 60; S.tut.moved = true; go('play');
Object.assign(P, { x: 17 * TILE + 8, y: 7 * TILE + 8 }); for (let i = 0; i < 120; i++) update(1 / 30);
ok(S.unlocked.onsen && S.money === 10 && star() === 2 && S.peak === 2 && S.hearts === 20, 'onsen bought by standing on it: ' + JSON.stringify({ u: !!S.unlocked.onsen, m: S.money, star: star(), h: S.hearts }));
ok(doorOpen(17, 6) && walkable(17, 6) && walkable(17, 5), 'onsen door open after buying');
console.log(errs.length ? 'SYS PADS FAIL\n  ' + errs.join('\n  ') : 'SYS PADS OK');
if (errs.length) process.exitCode = 1;
