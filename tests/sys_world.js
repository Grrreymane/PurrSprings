// SPEC_v2 2: the 40x39 world (v2.4; was 40x36) - areas, doors, rooms, props, camera, staff posts - and the v1 loop on it.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_world.js --seed 2
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 30;
function st(list, peak) { S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), peak || 1); S.tut.moved = true; resetWorld(); go('play'); }
const blockedRect = r => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (!BLOCK[y * MW + x]) return false; return true; };
// ---- tables
ok(MW === 40 && MH === 39 && MAPW === 640 && MAPH === 624 && QBUF.length === 1560, 'world size (v2.4: 39 rows)');
ok(ROOMS.length === 15 && GUEST_ROOMS.length === 13 && ROOMS.filter(r => r.vip).map(r => r.id).join() === 'c3,c4', 'rooms: 13 guest rooms + 2 suites');
ok(AREAS.length === 11, 'areas');
for (const rm of ROOMS) { const d = DOOR_AT[rm.door[1] * MW + rm.door[0]]; ok(d && d.room === rm.id && d.col === rm.col && d.emb === rm.emb && !!d.gold === rm.vip, rm.id + ' door / noren'); }
ok(ROOM.room2.andon + '' === '23,19' && ROOM.room2.futon + '' === '22,19' && ROOM.room2.slotA + '' === '20,19' && ROOM.room2.door + '' === '19,20', 'R2 mirrors R1 (x\' = 34 - x)');
ok(ROOM.w2.y0 === 11 && ROOM.w2.door + '' === '6,12' && ROOM.w2.stand + '' === '4,12', 'W2 layout');
ok(ROOM.c2.futonB + '' === '37,20' && ROOM.c2.stand + '' === '35,21' && ROOM.c2.cleanR === 24 && ROOM.c2.mult === 1.5, 'C2 cottage layout');
ok(ROOM.c4.tub + '' === '37,13' && ROOM.c4.tap + '' === '36,13' && !ROOM.c4.slotA, 'C4 suite layout');
// ---- start: closed doors, blocked locked areas, shaded areas, area signs
st([]);
ok(!doorOpen(17, 6) && !doorOpen(10, 26) && !doorOpen(24, 26) && !doorOpen(8, 18) && !doorOpen(24, 4) && doorOpen(15, 20), 'start doors');
ok(blockedRect(AREA.shop.r) && blockedRect(AREA.garden.r) && blockedRect(AREA.roten.r) && blockedRect(AREA.shrine.r) && blockedRect(AREA.plaza.r), 'block areas blocked');
ok(walkable(13, 24) && walkable(17, 35) && walkable(10, 30), 'desk spot / exit / rope column walkable');
// gates open their areas
st(['room2', 'room3', 'onsen', 'recep', 'shop']);
ok(doorOpen(17, 6) && !blockedRect(AREA.shop.r) && walkable(SPOT.browse[0], SPOT.browse[1]), 'onsen + shop open');
ok(OBJS.some(o => o.k === 'display') && OBJS.some(o => o.k === 'counter') && OBJS.some(o => o.k === 'curtain' && !o.block), 'shop props');
st(['room2', 'room3', 'onsen', 'room4', 'room5', 'recep', 'maid1', 'dining', 'w1']);
ok(doorOpen(10, 26) && doorOpen(8, 18) && doorOpen(6, 16) && !doorOpen(6, 12), 'dining door, west wing door, W1 open, W2 closed');
ok(findPath(13, 24, ROOM.w1.stand[0], ROOM.w1.stand[1]) && !findPath(13, 24, ROOM.w2.stand[0], ROOM.w2.stand[1]), 'W1 reachable, W2 not');
st(['room2', 'room3', 'onsen', 'garden']);
ok(doorOpen(24, 26) && doorOpen(30, 21) && doorOpen(30, 12) && !doorOpen(33, 21) && !doorOpen(33, 12), 'garden opens C1 + C3 (suite A); C2 / C4 stay shut');
ok(findPath(13, 24, ROOM.c1.stand[0], ROOM.c1.stand[1]) && !blockedRect(AREA.garden.r) && blockedRect(AREA.roten.r), 'C1 reachable, roten still blocked');
ok(S.rooms.c1 === 'clean' && S.rooms.c3 === 'clean', 'garden rooms ready');
// unlock() pops + area fade
st(['room2', 'room3']); S.money = 999; unlock('onsen');
ok(AREA_FADE.length === 1 && AREA_FADE[0].a.id === 'onsen' && S.basket === BASKET_MAX && star() === 2 && S.peak === 2, 'onsen unlock: fade, basket, star');
for (let i = 0; i < 30; i++) update(DT); ok(AREA_FADE.length === 0, 'fade gone after 0.8 s');
// ---- camera (2.7): follows, clamps to 0..460 / 0..304 (v2.4), never moves by itself
st([]);
Object.assign(P, { x: 8, y: 8 }); updCam(0, true); ok(cam.x === 0 && cam.y === 0, 'camera clamps top-left');
Object.assign(P, { x: MAPW - 8, y: MAPH - 8 }); updCam(0, true); ok(cam.x === 460 && cam.y === 304, 'camera clamps bottom-right ' + cam.x + ',' + cam.y);
Object.assign(P, { x: 13 * 16 + 8, y: 24 * 16 + 8 }); updCam(0, true); ok(Math.abs(cam.x / 16 - 7.9) < .05 && Math.abs((cam.x + W) / 16 - 19.1) < .05, 'desk view cols ' + (cam.x / 16).toFixed(2) + '-' + ((cam.x + W) / 16).toFixed(2));
go('title'); update(DT); ok(cam.x === TITLE_CAM[0] && cam.y === TITLE_CAM[1], 'title camera');
// ---- staff posts
st(['room2', 'room3', 'onsen', 'recep', 'maid1', 'shop', 'dining', 'room4', 'room5', 'waiter1', 'table3', 'chef', 'milk', 'porter', 'clerk']);
ok(STAFF.map(s => s.id).sort().join() === 'chef,clerk,maid1,owner,porter,recep,waiter1', 'staff hired: ' + STAFF.map(s => s.id));
for (let i = 0; i < 30 * 20; i++) update(DT);
for (const s of STAFF) if (s.role !== 'maid' && s.role !== 'porter') { const h = s.role === 'recep' ? DESK_SPOT : s.home, [tx, ty] = tileOf(s); ok(tx === h[0] && ty === h[1], s.id + ' at its post: ' + tx + ',' + ty); }
// ---- the v1 loop on the new map: desk -> room -> sleep -> tip -> towel -> bath -> milk -> leave, with a maid
st(['room2', 'onsen', 'recep', 'maid1', 'milk']); S.basket = 10;
let left = 0, gotTip = false, bathed = false, milked = false;
for (let i = 0; i < 30 * 120; i++) {
  update(DT);
  for (const gu of GUESTS) { if (gu.st === 'bathing') bathed = true; if (gu.st === 'milk') milked = true; if (gu.gone && gu.st === 'leave') left++; }
  if ((S.piles.room1 || 0) + (S.piles.room2 || 0) > 0) gotTip = true;
}
ok(S.stats.guests >= 6, 'guests checked in by 小樱: ' + S.stats.guests);
ok(gotTip && bathed && milked && S.piles.onsen > 0 && S.piles.milk > 0 && S.piles.recep > 0, 'tip / bath / milk earned: ' + JSON.stringify(S.piles));
ok(Object.values(S.rooms).every(v => v !== 'messy') || STAFF.some(s => s.job), 'the maid keeps the rooms clean');
// roten slots used once the roten opens (at night they come first; by day only once the onsen is full - too rare to test)
st(UNLOCKS.slice(0, UNLOCKS.findIndex(u => u.id === 'roten') + 1).map(u => u.id)); S.basket = 10; S.clock = .9;   // night: the roten first (4.12)
let roten = 0;
for (let i = 0; i < 30 * 150; i++) { update(DT); for (const gu of GUESTS) if (gu.st === 'bathing' && SLOTS[gu.slot].roten) roten++; }
ok(roten > 0 && (S.piles.roten || 0) + S.earned > 0, 'guests bathe in the roten too (' + roten + ' frames)');
console.log(errs.length ? 'SYS WORLD FAIL\n  ' + errs.join('\n  ') : 'SYS WORLD OK');
if (errs.length) process.exitCode = 1;
