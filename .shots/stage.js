// Screenshot staging (eval'd inside the game closure from _test.html#...). window.SHOT picks the scene.
//   python D:/Minigame/_workflow/tools/make_test_page.py D:/Minigame/Hotelgame
//   python D:/Minigame/_workflow/tools/shot.py D:/Minigame/Hotelgame --page _test.html --size 540x960 --wait 3000 \
//     --hash "#window.SHOT='onsen';fetch('.shots/stage.js').then(r=>r.text()).then(t=>eval(t))" --out D:/Minigame/Hotelgame/.shots/x.png
// v2 map (SPEC_v2 2): every v1 coordinate is x + 10. Scene 'map' / 'mapAll' draw the whole 640x576 world (x2) instead
// of the phone view (set window.MAPU = [unlock ids] for a custom state). 'migrated_v1_s5' loads tests/fixtures/v1_s5.json.
(() => {
  const DT = 1 / 30;
  let path = [], key = '', think = 0;
  function drive(dt) {
    think -= dt;
    if (think <= 0) {
      think = .3;
      const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
      if (!t || t.here) { path = []; key = ''; }
      else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
    }
    if (path.length) {
      const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
      if (d < 1.5) path.shift();
      botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    } else botMove = null;
  }
  const ff = (sec, bot) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { if (bot) drive(DT); update(DT); if (state === 'celebrate' && bot) { S.done = true; go('play'); } } botMove = null; };
  const unl = ids => { ids.forEach(id => { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; for (const rm of ROOMS) if (rm.open === id) S.rooms[rm.id] = S.rooms[rm.id] || 'clean'; }); S.peak = Math.max(S.peak, starOf(S)); };
  const place = (x, y, dir) => { Object.assign(P, { x: x * TILE + 8, y: y * TILE + 8, dir: dir || 'down', moving: false }); updCam(0, true); };
  const guest = (o) => { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); return gu; };
  const party = (type, o) => { addGuest(type); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); if (gu.mate) { gu.mate.x = gu.x; gu.mate.y = gu.y + 9; } return gu; };
  const bathe = (slot, room) => { const gu = guest({ st: 'bathing', t: 0, tt: 60, slot, room, x: SLOTS[slot].x * TILE + 8, y: 4 * TILE + 8 }); SLOT_OCC[slot] = gu; RT[room].guest = gu; S.rooms[room] = 'reserved'; return gu; };
  const sleepIn = (room) => { const rm = ROOM[room]; const gu = guest({ st: 'sleep', t: 0, tt: 60, room, x: rm.stand[0] * TILE + 8, y: rm.stand[1] * TILE + 8 }); RT[room].guest = gu; S.rooms[room] = 'occupied'; return gu; };
  const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
  // freeze the scene now (or after `after` more seconds of play): the next frames only render (14.4 shot scenes)
  const FREEZE_AT = after => { if (after) ff(after, false); update = dt => {}; };
  // the whole world at 2x (debug overview): the phone-sized view is rendered window by window and pasted together
  const mapView = () => {
    const big = mk(MAPW, MAPH), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false;
    g = low.getContext('2d'); g.imageSmoothingEnabled = false;
    for (let cy = 0; cy < MAPH; cy += H) for (let cx = 0; cx < MAPW; cx += W) {
      TQ.length = 0; CX = cx; CY = cy; padsUpdate(); drawScene(W, H, true); drawOverlays();
      bx.drawImage(low, 0, 0, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy), cx, cy, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy));
    }
    TQ.length = 0;
    const out = mk(MAPW * 2, MAPH * 2), o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(big, 0, 0, MAPW * 2, MAPH * 2);
    o.font = '14px monospace'; o.fillStyle = 'rgba(255,255,255,.85)';
    for (let x = 0; x < MW; x += 5) o.fillText(String(x), x * 32 + 2, 12);
    for (let y = 0; y < MH; y += 5) o.fillText(String(y), 2, y * 32 + 14);
    document.body.innerHTML = ''; out.style.cssText = 'position:fixed;left:0;top:0;width:' + MAPW * 2 + 'px;height:' + MAPH * 2 + 'px;image-rendering:pixelated';
    document.body.appendChild(out); document.title = 'MAP READY';
    update = dt => {}; render = () => {};
  };
  const sc = {
    title() { go('title'); },
    fresh() { newGame(); ff(20, false); },
    desk() { newGame(); S.tut.moved = true; ff(52, true); },
    desk2() {   // a guest at the desk, a tip pile, the desk pile, and pads for room3 / shoes1
      newGame(); S.tut.moved = true; unl(['room2']); S.money = 18; S.piles.recep = 24; S.piles.room1 = 5; resetWorld(); go('play');
      ff(14, false); place(13, 24, 'down'); ff(.4, false);
    },
    pads() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen']); S.money = 75; resetWorld(); go('play'); ff(6, false); place(13, 27, 'left'); ff(.5, false); },
    pour() { newGame(); S.tut.moved = true; unl(['room2']); S.money = 40; resetWorld(); go('play'); ff(4, false); place(16, 16, 'up'); ff(1.0, false); },
    onsen() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'basket1', 'room4', 'milk']); S.basket = 5; S.money = 64; resetWorld(); go('play');
      ff(3, false);
      bathe(0, 'room2'); bathe(1, 'room3'); bathe(2, 'room4');
      S.piles.onsen = 30; S.piles.milk = 10;
      const gm = guest({ st: 'milk', tt: 60, x: MILK_SPOT[0] * TILE + 8, y: MILK_SPOT[1] * TILE + 8, dir: 'up', room: 'room1' }); gm.look = { fur: gm.look.fur, outfit: 'yukata' }; RT.room1.guest = gm; S.rooms.room1 = 'reserved';
      guest({ st: 'towel', wait: 9, x: TOWEL_SPOT[0] * TILE + 8, y: TOWEL_SPOT[1] * TILE + 8, dir: 'left', room: null });
      place(20, 4, 'left'); P.x += 4; P.towels = 6; updCam(0, true);
    },
    rooms() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'basket1', 'room4']); resetWorld(); go('play');
      S.rooms.room1 = 'messy'; S.piles.room1 = 6; S.rooms.room3 = 'messy'; S.piles.room3 = 5;
      sleepIn('room2'); sleepIn('room4');
      RT.room3.cleanP = .45;
      place(17, 18, 'down');
      ff(.2, false);
    },
    shop() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop']); S.money = 90; resetWorld(); go('play'); ff(3, false); place(8, 33, 'up'); ff(.3, false); },
    dining() { newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'w1'))); resetWorld(); go('play'); ff(30, false); place(9, 24, 'left'); ff(.3, false); },
    garden() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); ff(40, false); place(29, 24, 'down'); ff(.3, false); },
    roten() { newGame(); S.tut.moved = true; unl(ALL); S.done = true; resetWorld(); go('play'); ff(60, false); place(31, 6, 'up'); ff(.3, false); },
    late() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten' && id !== 'bigbath' && id !== 'shoes3')); S.basket = 8; S.money = 412; resetWorld(); go('play'); ff(70, false); place(17, 17, 'down'); },
    celebrate() {
      newGame(); S.tut.moved = true; unl(ALL); S.stats.guests = 512; S.earned = 18420; S.stats.time = 1330; resetWorld(); go('play');
      ff(20, false); place(17, 30, 'up'); go('celebrate'); st = 1;
    },
    share() { sc.celebrate(); makeShare(); },
    // ---- stage 2A (SPEC_v2 4.1-4.6): breakfast in full swing, calls + the tray, parties walking in / bathing
    dining_busy() {
      newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'chef')).concat(['table4'])); resetWorld(); go('play'); spawnT = 1e9;
      PASS.n = 4;
      const sit = (i, o) => { const se = SEATS[i], gu = guest(Object.assign({ st: 'seated', t: 8, seat: i, x: tcx(se.at), y: tcy(se.at), dir: se.face, inside: true }, o)); SEAT_OCC[i] = gu; return gu; };
      sit(0); sit(3, { t: 24 }); const e = sit(4); serveSeat(e); e.tt = 3;
      const c = party('couple', { st: 'seated', t: 12, seat: 6, seat2: 7, x: tcx(SEATS[6].at), y: tcy(SEATS[6].at), dir: SEATS[6].face, inside: true }); SEAT_OCC[6] = SEAT_OCC[7] = c;
      Object.assign(c.mate, { mode: 'park', x: tcx(SEATS[7].at), y: tcy(SEATS[7].at), dir: SEATS[7].face });
      ff(1.2, false); place(5, 24, 'up'); P.tray = ['rice', 'rice']; ff(.1, false);
    },
    calls() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'basket1', 'room4', 'milk', 'maid1']); resetWorld(); go('play'); spawnT = 1e9;
      const a = sleepIn('room2'); a.call = { k: 'tea', t: 30, max: 40 };
      const b = sleepIn('room3'); b.call = { k: 'tea', t: 7, max: 40 };
      const c = guest({ st: 'toBath', x: 17 * TILE + 8, y: 20 * TILE + 8, dir: 'up', inside: true }); c.call = { k: 'milk', t: 18, max: 40 };
      place(17, 18, 'left'); P.tray = ['tea', 'milk']; ff(.15, false);
    },
    parties() {   // a couple (pink heart), a family with its kitten and an elder come in through the front garden
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; resetWorld(); go('play'); spawnT = 1e9;
      for (const t of ['family', 'couple', 'elder']) { addGuest(t); ff(.9, false); }
      ff(.6, false); place(19, 31, 'left'); ff(.1, false);
    },
    bath_party() {   // a couple sharing a slot, a family's kitten sitting on the edge
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      const c = party('couple', { st: 'bathing', t: 0, tt: 60, slot: 0, x: SLOTS[0].x * TILE + 8, y: 4 * TILE + 8, inside: true }); SLOT_OCC[0] = c; c.mate.mode = 'park';
      const f = party('family', { st: 'bathing', t: 0, tt: 60, slot: 1, x: SLOTS[1].x * TILE + 8, y: 4 * TILE + 8, inside: true }); SLOT_OCC[1] = f; f.mate.mode = 'park';
      f.call = { k: 'milk', t: 25, max: 50 };
      place(18, 5, 'up'); ff(.1, false);
    },
    // ---- stage 2B (SPEC_v2 4.4 / 4.5 / 4.8): decor + combos, the VIP, the clerk + the cash box
    shop_decor() {   // the shop: two decor pads (with their piece), owned pieces on the display shelf, the owner
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana', 'dining', 'd_tank']); S.money = 120; resetWorld(); go('play'); spawnT = 1e9;
      ff(2, false); place(5, 32, 'left'); ff(.3, false);
    },
    decor_room() {   // the main corridor: 松 a combo room (noren + plate), 梅 decor without combo (star), standing on 竹's slot
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'room4', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana', 'd_bonsai', 'd_screen']);
      S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; S.decor['room3:A'] = 'd_bonsai'; S.decor['room4:A'] = 'd_bonsai'; S.decor['room4:B'] = 'd_screen'; S.combos.c_ga = 1; S.combos.c_zen = 1;
      resetWorld(); go('play'); spawnT = 1e9; sleepIn('room1');
      place(20, 19, 'right'); ff(.5, false); FREEZE_AT();
    },
    combo_banner() {   // the moment a combo is made: sparkles + 组合！
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana']); S.decor['room1:A'] = 'd_scroll'; resetWorld(); go('play'); spawnT = 1e9;
      place(12, 21, 'up'); ff(1.0, false); FREEZE_AT();
    },
    vip_carpet() {   // 猫川先生 on the red carpet (gold card), the innkeeper greeting (gold ring)
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); ff(8, false); place(17, 25, 'down'); P.y += 6; ff(.3, false); FREEZE_AT();
    },
    vip_escort() {   // it follows the innkeeper through the garden, glints behind it
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); ff(8, false); place(17, 26, 'right'); ff(.7, false);
      const [sx, sy] = tileOf(P); let path = findPath(sx, sy, 25, 20) || [];
      for (let i = 0; i < 30 * 12 && path.length; i++) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) { path.shift(); continue; } botMove = { x: dx / d, y: dy / d }; update(1 / 30); }
      botMove = null; ff(.05, false); FREEZE_AT();
    },
    vip_wishboard() {   // seated in 月见亭: the wish board over the door (tea done, bath current), filling its tub
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 1;
      place(rm.tap[0], rm.tap[1], 'right'); ff(.8, false); FREEZE_AT();
    },
    vip_soak() {   // soaking in the hinoki tub
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'soak'); v.tt = 99; v.wi = 1;
      place(26, 14, 'up'); ff(.5, false); FREEZE_AT();
    },
    chest_clerk() {   // the clerk carries a bag home to the glowing cash box; the HUD bar under the fish number
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.money = 300; S.piles.recep = 1400; S.gifts = ['kawa', 'ozeki', 'sakura'];
      S.album.photos = [{ v: 'kawa', d: 3, h: null, p: null }, { v: 'ozeki', d: 4, h: null, p: null }, { v: 'sakura', d: 5, h: null, p: null }]; resetWorld(); go('play'); spawnT = 1e9;
      const c = STAFF.find(s => s.role === 'clerk'); c.bag = 120; c.x = 19 * TILE + 8; c.y = 26 * TILE + 8; c.path = []; c.goal = null;
      place(17, 27, 'up'); ff(.1, false); FREEZE_AT();
    },
    netring() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'shoes1', 'tea', 'basket1', 'shop']); S.money = 90; resetWorld(); go('play'); spawnT = 1e9; place(21, 28, 'up'); ff(1.9, false); FREEZE_AT(.2); },
    combo_plate() {   // walking past a combo room: its 1-char plate over the door (within 3 tiles)
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana']); S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; S.combos.c_ga = 1;
      resetWorld(); go('play'); spawnT = 1e9; sleepIn('room1'); place(17, 21, 'left'); ff(.3, false); FREEZE_AT();
    },
    // ---- stage 2C (SPEC_v2 4.7 / 4.9 / 4.10 / 4.11): night light, staff levels, the boutique, the statue
    lobby_night() {   // the lobby at night: lamps, the entrance noren, the hand lantern; HUD row 2 (moon, #rank, bell)
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.hearts = 420; resetWorld(); go('play'); ff(30, false);
      sleepIn('room1').call = { k: 'tea', t: 30, max: 50 }; S.piles.recep = 160; S.clock = .88; place(17, 26, 'down'); ff(.3, false); FREEZE_AT();
    },
    corridor_night() {   // the main corridor at night: taken rooms' andons glow brighter than empty ones
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9; ff(5, false);
      for (const r of ['room1', 'room4', 'room5', 'room8']) sleepIn(r); S.clock = .9; place(17, 14, 'down'); ff(.3, false); FREEZE_AT();
    },
    dusk() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); ff(30, false); S.clock = .69; place(29, 26, 'up'); ff(.3, false); FREEZE_AT(); },
    garden_day() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); ff(40, false); S.clock = .3; place(29, 24, 'down'); ff(.3, false); FREEZE_AT(); },
    garden_night() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); ff(40, false); S.clock = .86; place(29, 24, 'down'); ff(.3, false); FREEZE_AT(); },
    roten_night() {   // the star-view bath at night: stars on the water, deck lanterns, bathers
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; resetWorld(); go('play'); spawnT = 1e9; ff(3, false);
      for (const [i, r] of [[5, 'room2'], [7, 'room3'], [8, 'room4']]) { const gu = bathe(i, r); }
      S.clock = .93; place(31, 5, 'up'); ff(.3, false); FREEZE_AT();
    },
    celebrate5() { sc.celebrate(); },
    boutique_tryon() {   // star 5: trying the straw hat on at the hat booth; the mirror, the pet booth, the covered statue
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.money = 3400; resetWorld(); go('play'); spawnT = 1e9; ff(2, false);
      place(5, 31, 'down'); ff(.4, false); FREEZE_AT();
    },
    boutique_mirror() {   // wearing the flower hat at the mirror, the duck at your feet
      newGame(); S.tut.moved = true; unl(ALL.concat(['h_straw', 'h_flower', 'p_duck'])); S.equip = { hat: 'h_flower', pet: 'p_duck' }; S.done = true; resetWorld(); go('play'); spawnT = 1e9;
      place(4, 32, 'left'); ff(.6, false); FREEZE_AT();
    },
    statue() {   // the covered golden statue, 40 % poured: the cloth has slid down
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.paid.statue = 400000; S.money = 20000; resetWorld(); go('play'); spawnT = 1e9; ff(2, false);
      place(14, 32, 'left'); ff(.3, false); FREEZE_AT();
    },
    statue_gold() { newGame(); S.tut.moved = true; unl(ALL.concat(['statue'])); S.done = true; resetWorld(); go('play'); spawnT = 1e9; ff(2, false); place(14, 32, 'left'); ff(.3, false); FREEZE_AT(); },
    staff_names() {   // walking past the staff rest spots: the nearest one's name + level badge; Lv3 / Lv5 trims
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.staff = { maid1: 300, maid2: 70, porter: 25, recep: 150 }; resetWorld(); go('play'); spawnT = 1e9;
      for (const s of STAFF) { s.x = tcx(homeOf(s)); s.y = tcy(homeOf(s)); }
      place(21, 26, 'up'); ff(.2, false); FREEZE_AT();
    },
    levelup() {   // a maid levels up: gold Lv2 over her head + sparkles
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1']); S.staff.maid1 = 19; resetWorld(); go('play'); spawnT = 1e9;
      const m = STAFF.find(s => s.id === 'maid1'); m.x = tcx(REST[0]); m.y = tcy(REST[0]); place(19, 27, 'up'); ff(.2, false); gainXp(m, 1); FREEZE_AT(.3);
    },
    map() { newGame(); S.tut.moved = true; if (window.MAPU) unl(window.MAPU); resetWorld(); go('play'); ff(25, false); place(17, 27, 'up'); mapView(); },
    mapAll() { newGame(); S.tut.moved = true; unl(ALL.concat(['maid4'])); S.done = true; resetWorld(); go('play'); ff(40, false); place(17, 27, 'up'); mapView(); },
    migrated_v1_s5() {
      fetch('tests/fixtures/v1_s5.json').then(r => r.text()).then(t => { localStorage.setItem(SAVE + 'state', t); continueGame(); updCam(0, true); });
    },
    ['b' + 'ot']() { newGame(); ff(+(window.SECS || 300), true); updCam(0, true); },
  };
  (sc[window.SHOT] || sc.title)();
  if (window.HOLD) { update = dt => { T += dt; }; }
  if (window.FREEZE) { update = dt => {}; }
})();
