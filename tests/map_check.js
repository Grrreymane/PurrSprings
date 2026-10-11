// SPEC_v2 2.8 map check on the game's OWN tables (MAP, AREAS, DOORS, ROOMS, PROPS, UNLOCKS, spots), ported from
// docs/design/spec2_map_check.py. Run after any change to the map, props, pads or spots:
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/map_check.js
// 1. static: every 'D' has a DOORS entry (and back), room furniture stands on tatami, pads are never on a queue spot,
//    the desk spot, a door, a seat, a room stand or inside a pick-up zone (3.5 rule 5)
// 2. the SPEC states (start ... v2.0 final): walkable / reached counts (start 467 / 209, final 717 / 717)
// 3. EVERY unlock state along a full buy order: from the desk, every spot / pad / pile / seat / slot that is in use
//    in that state is reachable, and no open floor is cut off (cells behind a closed room door don't count)
const errs = [], bad = m => { if (errs.length < 60) errs.push(m); };
const K = (x, y) => x + ',' + y;
const reachFrom = (x0, y0) => {
  const D = new Int16Array(MW * MH).fill(-1), q = [y0 * MW + x0]; D[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const n = ny * MW + nx; if (D[n] < 0 && !BLOCK[n]) { D[n] = D[c] + 1; q.push(n); }
    }
  }
  return D;
};
function setState(ids, star5) {
  S = defaults();
  for (const id of ids) S.unlocked[id] = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = star5 ? 5 : starOf(S);
  for (const v of VIPS) S.album.vip[v.id] = 1;   // the "hosted that VIP" hats
  resetWorld();
}
// points in use in the current state: name -> [tx, ty]
function points() {
  const P_ = {}, p = (n, xy) => { P_[n] = xy; };
  p('desk', DESK_SPOT); p('carpet', SPOT.carpet); p('clerkHome', SPOT.clerk); p('exit', EXIT_TILE);
  QSPOTS.forEach((q, i) => p('queue' + i, q)); REST.forEach((q, i) => p('rest' + i, q));
  for (const [id, xy] of PADPOS) p('pad:' + id, xy);
  for (const u of UNLOCKS) if (!u.dyn && !S.unlocked[u.id] && areaOpen(AREA[u.area])) p('futurePad:' + u.id, u.pad);
  for (const id in PILE_AT) if (pileOpen(id)) p('pile:' + id, PILE_AT[id]);
  for (const rm of ROOMS) if (roomOpen(rm)) for (const k of ['stand', 'pile', 'slotA', 'slotB', 'tap', 'cleanT']) if (rm[k]) p(rm.id + '.' + k, rm[k]);
  if (S.unlocked.onsen) { p('shelf', SHELF_SPOT); p('basket', BASKET_SPOT); p('towel', TOWEL_SPOT); p('wait', WAIT_SPOT); p('milkSpot', MILK_SPOT); }
  SLOTS.forEach((s, i) => { if (slotOpen(i)) p('slot' + i, [s.x, 4]); });
  if (S.unlocked.tea) p('urn1', SPOT.urn1);
  if (S.unlocked.garden) p('urn2', SPOT.urn2);
  if (S.unlocked.shop) { DECOR_PADS.forEach((d, i) => p('decorPad' + i, d)); p('browse', SPOT.browse); p('owner', SPOT.owner); p('hatPad', HAT_PAD); p('petPad', PET_PAD); p('petCushion', SPOT.petCushion); if (star() >= 5) p('mirror', SPOT.mirror); }
  if (S.unlocked.dining) {
    p('stoveA', [2, 20]); p('stoveB', SPOT.chef); p('passA', [2, 22]); p('passB', [3, 22]); p('passC', [4, 22]);
    SPOT.waiterIdle.forEach((w, i) => p('waiter' + i, w));
    SEATS.forEach((s, i) => { if (S.unlocked[s.need]) p('seat' + i, s.at); });
  }
  for (const id in STAFF_DEF) if (S.unlocked[STAFF_DEF[id].need]) p('home:' + id, STAFF_DEF[id].home);
  // v2.1 core B: where a rare guest is led to see its garden piece (a free tile beside it), the stall fronts guests stand on
  for (const u of UNLOCKS) if (u.gz && S.unlocked[u.id]) { const n = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => [u.at[0] + dx, u.at[1] + dy]).find(([x, y]) => walkable(x, y)); p('beside:' + u.id, n || u.at); }
  for (const u of UNLOCKS) if (u.stall && S.unlocked[u.id]) p('stallFront:' + u.id, [u.at[0], 31]);
  return P_;
}
const inLockedRoom = (x, y) => ROOMS.some(rm => !roomOpen(rm) && x >= rm.box[0] && x <= rm.box[2] && y >= rm.box[1] && y <= rm.box[3]);
function check(name, expect) {
  const D = reachFrom(DESK_SPOT[0], DESK_SPOT[1]);
  let walk = 0, reached = 0; const dead = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (BLOCK[y * MW + x]) continue; walk++;
    if (D[y * MW + x] >= 0) reached++;
    else if (areaOpen(areaAt(x, y)) && !inLockedRoom(x, y)) dead.push(K(x, y));
  }
  const pts = points(), un = [];
  for (const n in pts) { const [x, y] = pts[n]; if (D[y * MW + x] < 0) un.push(n + '@' + K(x, y) + (BLOCK[y * MW + x] ? '(blocked)' : '')); }
  if (un.length) bad(name + ': unreachable ' + un.join(' '));
  if (dead.length) bad(name + ': open floor cut off ' + dead.slice(0, 12).join(' '));
  if (expect && (walk !== expect[0] || reached !== expect[1])) bad(name + ': walkable/reached ' + walk + '/' + reached + ' (SPEC 2.8: ' + expect.join('/') + ')');
  return { walk, reached, pts: Object.keys(pts).length };
}
// ---- 1. static tables
for (let y = 0; y < MH; y++) { if (MAP[y].length !== MW) bad('MAP row ' + y + ' has ' + MAP[y].length + ' cols'); for (let x = 0; x < MW; x++) if (MAP[y][x] === 'D' && !DOOR_AT[y * MW + x]) bad('door without DOORS entry ' + K(x, y)); }
if (MAP.length !== MH) bad('MAP has ' + MAP.length + ' rows');
for (const d of DOORS) if (ch(d.at[0], d.at[1]) !== 'D') bad('DOORS entry on a non-door tile ' + K(d.at[0], d.at[1]));
for (const rm of ROOMS) for (const k of ['andon', 'table', 'futon', 'stand', 'pile'].concat(rm.futonB ? ['futonB', 'slotA', 'slotB'] : rm.tub ? ['tub', 'tap'] : ['slotA', 'slotB'])) {
  const [x, y] = rm[k]; if (ch(x, y) !== 't') bad(rm.id + '.' + k + ' on ' + ch(x, y) + ' at ' + K(x, y));
}
{
  const forbid = new Map();
  QSPOTS.forEach(q => forbid.set(K(...q), 'queue')); forbid.set(K(...DESK_SPOT), 'desk');
  DOORS.forEach(d => forbid.set(K(...d.at), 'door')); SEATS.forEach(s => forbid.set(K(...s.at), 'seat'));
  ROOMS.forEach(rm => forbid.set(K(...rm.stand), rm.id + ' stand'));
  const zones = [[SHELF_C, 22, 'shelf'], [BASKET_C, 20, 'basket'], [ZONE.milk.c, ZONE.milk.r, 'milk'], [ZONE.urn1.c, ZONE.urn1.r, 'urn1', 'tea'], [ZONE.urn2.c, ZONE.urn2.r, 'urn2'], [ZONE.stove.c, ZONE.stove.r, 'stove'], [ZONE.pass.c, ZONE.pass.r, 'pass']];
  const pads = UNLOCKS.filter(u => !u.dyn).map(u => [u.id, u.pad]).concat(DECOR_PADS.map((d, i) => ['decor' + i, d]), [['hat', HAT_PAD], ['pet', PET_PAD]]);
  for (const [id, [x, y]] of pads) {
    if (forbid.has(K(x, y))) bad('pad ' + id + ' on a ' + forbid.get(K(x, y)) + ' at ' + K(x, y));
    if (!WALK_CH.has(ch(x, y))) bad('pad ' + id + ' on a ' + ch(x, y) + ' tile');
    for (const [c, r, zn, own] of zones) if (own !== id && dist(x * TILE + 8, y * TILE + 8, c[0], c[1]) <= r) bad('pad ' + id + ' inside the ' + zn + ' pick-up zone');
  }
}
// ---- 2. the SPEC 2.8 states
const lines = [];
const ALLV2 = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
const V21_FINAL = [773, 773];   // v2.1 core B: + the shrine approach and the plaza (lawn + path), less what the shrine parts, garden pieces and stalls block
const SPECSTATES = [
  ['start', [], false, [467, 209]],
  ['onsen', ['room2', 'room3', 'onsen']],
  ['shop', ['room2', 'room3', 'onsen', 'recep', 'tea', 'shop', 'milk', 'room4']],
  ['dining', ['room2', 'room3', 'room4', 'room5', 'onsen', 'recep', 'tea', 'shop', 'milk', 'maid1', 'dining']],
  ['west', ['room2', 'room3', 'room4', 'room5', 'room6', 'onsen', 'recep', 'tea', 'shop', 'milk', 'maid1', 'dining', 'w1', 'w2', 'w3', 'waiter1', 'table3']],
  ['garden', ALLV2.filter(id => id !== 'c2' && id !== 'suiteB' && id !== 'roten')],
  ['v2.0 final', UNLOCKS.filter(u => !u.v21b).map(u => u.id), true, [717, 717]],
  ['v2.1 final', UNLOCKS.filter(u => !u.repeat).map(u => u.id), true, [V21_FINAL[0], V21_FINAL[1]]],   // core B: shrine + plaza open, every garden piece / shrine part / stall placed
];
for (const [name, ids, s5, exp] of SPECSTATES) { setState(ids, s5); const r = check(name, exp); lines.push(name.padEnd(11) + ' walkable ' + r.walk + ' reached ' + r.reached + ' points ' + r.pts); }
// ---- 3. every unlock state along a full buy order (the first buyable item in table order each time)
setState([], false);
let n = 0, guard = 0;
while (guard++ < 200) {
  const u = UNLOCKS.find(x => padEligible(x) && !x.repeat);   // v2.1: the fireworks are bought again and again (never "unlocked")
  if (!u) break;
  S.unlocked[u.id] = true; for (const rm of ROOMS) if (rm.open === u.id) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(S.peak, starOf(S)); resetWorld(); n++;
  check('after ' + u.id);
}
const left = UNLOCKS.filter(u => !S.unlocked[u.id] && !u.repeat && !u.ok).map(u => u.id);   // v2.1: seasonal outfits / gold decor come by condition
if (left.length) bad('never buyable along the buy order: ' + left.join(' '));
// distances the SPEC quotes (2.8), v2.0 final
setState(UNLOCKS.filter(u => !u.v21b).map(u => u.id), true);
const Dd = reachFrom(DESK_SPOT[0], DESK_SPOT[1]), dd = (x, y) => Dd[y * MW + x];
const quoted = [['R1 stand', 13, 20, 10], ['R8 stand', 21, 8, 24], ['basket spot', 14, 5, 28], ['tea pick-up', 12, 24, 1], ['stove', 3, 20, 22], ['pass', 3, 22, 20], ['W1 stand', 4, 16, 25], ['W3 stand', 4, 8, 33], ['shop decor pad', 2, 32, 25], ['C1 stand', 28, 21, 22], ['C2 stand', 35, 21, 29], ['roten slot 37', 37, 4, 44], ['exit', 17, 35, 15]];
for (const [nm, x, y, want] of quoted) if (dd(x, y) !== want) bad('desk -> ' + nm + ' is ' + dd(x, y) + ' tiles (SPEC 2.8: ' + want + ')');
console.log(lines.join('\n'));
console.log('buy-order states checked: ' + n + ' (all ' + UNLOCKS.length + ' unlocks bought: ' + (left.length ? 'NO' : 'yes') + ')');
console.log(errs.length ? 'MAP CHECK FAIL\n  ' + errs.join('\n  ') : 'MAP CHECK OK');
if (errs.length) process.exitCode = 1;
