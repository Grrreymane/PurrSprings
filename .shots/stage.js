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
  const ff = (sec, bot) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { if (bot) drive(DT); update(DT); if (state === 'celebrate' && bot) { S.done = true; go('play'); } if (state === 'card') modalClose(); } botMove = null; };
  const unl = ids => { ids.forEach(id => { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; for (const rm of ROOMS) if (rm.open === id) S.rooms[rm.id] = S.rooms[rm.id] || 'clean'; }); S.peak = Math.max(S.peak, starOf(S)); };
  const place = (x, y, dir) => { Object.assign(P, { x: x * TILE + 8, y: y * TILE + 8, dir: dir || 'down', moving: false }); updCam(0, true); };
  // placed guests are already indoors (inside = true), or they say their arrival line on the first frame
  const guest = (o) => { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); if (!o || o.inside === undefined) gu.inside = gu.y < 29 * TILE; return gu; };
  const party = (type, o) => { addGuest(type); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); if (!o || o.inside === undefined) gu.inside = gu.y < 29 * TILE; if (gu.mate) { gu.mate.x = gu.x; gu.mate.y = gu.y + 9; } return gu; };
  const bathe = (slot, room) => { const gu = guest({ st: 'bathing', t: 0, tt: 60, slot, room, x: SLOTS[slot].x * TILE + 8, y: 4 * TILE + 8 }); SLOT_OCC[slot] = gu; RT[room].guest = gu; S.rooms[room] = 'reserved'; return gu; };
  const sleepIn = (room) => { const rm = ROOM[room]; const gu = guest({ st: 'sleep', t: 0, tt: 60, room, x: rm.stand[0] * TILE + 8, y: rm.stand[1] * TILE + 8 }); RT[room].guest = gu; S.rooms[room] = 'occupied'; return gu; };
  const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
  // v2.1 core B: a star-5 inn (every v2.0 room and area, its combos made) + the given unlocks
  const b5 = extra => { newGame(); S.tut.moved = true; unl(ALL.concat(['maid4', 'roten'], extra || [])); S.done = true; S.peak = 5; S.stats.vips = 3; S.vipNext = VIPS.length; S.stats.time = 3000; for (const c of COMBOS) if (c.hint) S.combos[c.id] = 1; S.decor['room1:A'] = 'd_maneki'; S.decor['room1:B'] = 'd_daruma'; };
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
  // icon check (stage M): every pad icon at 1x / 3x / 6x on a light and a dark floor (window.ICONS = [kinds] to pick)
  const iconSheet = () => {
    const kinds = window.ICONS || ['room', 'onsen', 'recep', 'maid', 'porter', 'shoes', 'basket', 'milk', 'bath', 'sign', 'tea', 'shop', 'net', 'dining', 'waiter', 'chef', 'tray', 'table', 'west', 'garden', 'cottage', 'suite', 'roten', 'clerk', 'shishi', 'sakura', 'maple', 'koi', 'hat', 'pet', 'statue', 'decor'];
    const cw = 120, out = mk(cw * 4, 110 * Math.ceil(kinds.length / 4)), o = out.getContext('2d'); o.imageSmoothingEnabled = false;
    kinds.forEach((k, i) => {
      const x = (i % 4) * cw, y = ((i / 4) | 0) * 110, ic = padIcon(k);
      o.fillStyle = i & 1 ? '#c8a070' : '#3a3046'; o.fillRect(x, y, cw, 110);
      o.drawImage(ic, x + 4, y + 4, 72, 72); o.drawImage(ic, x + 80, y + 4, 36, 36); o.drawImage(ic, x + 92, y + 46, 12, 12);
      o.fillStyle = '#fff'; o.font = '12px monospace'; o.fillText(k, x + 4, y + 96);
    });
    document.body.innerHTML = ''; out.style.cssText = 'position:fixed;left:0;top:0;image-rendering:pixelated'; document.body.appendChild(out); document.title = 'ICONS READY';
    update = dt => {}; render = () => {};
  };
  const sc = {
    icons() { iconSheet(); },
    sprites() {   // v2.2: window.SPR = 'expr;expr;...' (each returns a canvas), drawn at 6x on dark and light
      const cs = String(window.SPR).split(';').map(e => eval(e)), sc = window.SCALE || 6, cw = Math.max(...cs.map(c => c.width)) * sc + 8, ch = Math.max(...cs.map(c => c.height)) * sc + 8;
      const out = mk(cw * cs.length, ch * 2), o = out.getContext('2d'); o.imageSmoothingEnabled = false;
      cs.forEach((c, i) => { for (let j = 0; j < 2; j++) { o.fillStyle = j ? '#c8a070' : '#3a3046'; o.fillRect(i * cw, j * ch, cw, ch); o.drawImage(c, i * cw + 4, j * ch + 4, c.width * sc, c.height * sc); } });
      document.body.innerHTML = ''; out.style.cssText = 'position:fixed;left:0;top:0;image-rendering:pixelated'; document.body.appendChild(out);
      update = dt => {}; render = () => {};
    },
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
      firstDone('vip'); vipWishStart();   // as if walked here: the escort card is done, the bath wish brings its own card
      place(rm.tap[0], rm.tap[1], 'right'); ff(.8, false); FREEZE_AT();
    },
    vip_tea_wish() {   // seated in 月见亭 wanting tea; the innkeeper back in the lobby: what does the screen say to do?
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 0;
      firstDone('vip'); vipWishStart(); place(18, 25, 'up'); ff(.4, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    vip_tea_near() {   // the same, the innkeeper in the garden by the suite: the VIP's own bubble and the arrow
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 0;
      firstDone('vip'); vipWishStart(); place(26, 17, 'up'); ff(.4, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    // ---- v2.0.1 G1-G5: the VIP flow step by step, the tea runner, the guests' own cups, the net pulling piles
    vip_tea_carry() {   // tea on the tray: the arrow over the VIP's big gold bubble
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 0;
      vipWishStart(); place(26, 18, 'up'); P.tray = ['tea']; ff(.4, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    vip_tick() {   // the tea handed over: a big tick over its head, the board ticks wish 1, the 3-step card is done
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 0;
      vipWishStart(); place(rm.stand[0], rm.stand[1] + 1, 'up'); P.y -= 6; P.tray = ['tea']; ff(.55, false); FREEZE_AT();
    },
    vip_bath_wish() {   // the second wish: the big bath bubble, the arrow at the tap with the same gold bubble
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = 1;
      firstDone('vip'); vipWishStart(); FIRST_Q.length = 0; place(26, 18, 'up'); ff(.4, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    teaboy_run() {   // the tea runner carries a cup to a guest's room; a call bubble over the futon
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'teaboy', 'maid1', 'room4']); resetWorld(); go('play'); spawnT = 1e9; ff(.5, false);
      const gu = sleepIn('room3'); gu.call = { k: 'tea', t: 40, max: 50 };
      const rn = STAFF.find(s => s.role === 'tea'); Object.assign(rn, { arrive: false, x: tcx(SPOT.urn1), y: tcy(SPOT.urn1), path: [], goal: null });
      ff(5, false); place(16, 18, 'down'); ff(.2, false); FREEZE_AT();
    },
    tea_self() {   // a guest buys its own cup at the lobby urn; the tea pile beside it; the runner at its post
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'teaboy', 'maid1']); S.piles.tea = 24; resetWorld(); go('play'); spawnT = 1e9; ff(8, false);
      const gu = guest({ st: 'tea', tt: 60, x: tcx(TEA_SPOT), y: tcy(TEA_SPOT), dir: 'left' }); TEA_AT.occ = gu;
      place(15, 27, 'up'); ff(.3, false); FREEZE_AT();
    },
    net_pull() {   // net 2: walking the main corridor pulls the room tips in - the faint ring, fish flying over
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'maid1', 'net1', 'room4', 'room5', 'room6', 'dining', 'porter', 'milk', 'clerk', 'net2']); resetWorld(); go('play'); spawnT = 1e9;
      S.piles.room4 = 14; S.piles.room3 = 9; place(18, 19, 'up'); ff(.12, false); FREEZE_AT();
    },
    vip_soak() {   // soaking in the hinoki tub
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'soak'); v.tt = 99; v.wi = 1; firstDone('vip');
      place(28, 13, 'up'); ff(.5, false); FREEZE_AT();
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
      place(2, 33, 'left'); ff(.6, false); FREEZE_AT();
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
    // ---- stage 3 (SPEC_v2 7 / 8): HUD, info card + preview, banners, "new" tags, first-time cards, lines, menu, share card
    start() { newGame(); ff(1.5, false); FREEZE_AT(); },
    infocard() {   // near the 竹 pad: the info card at the bottom, a ghost futon / table / andon in the dark room, the gold frame
      newGame(); S.tut.moved = true; S.stats.time = 100; S.money = 30; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(17, 20, 'right'); ff(.6, false); FREEZE_AT();
    },
    infocard_staff() {   // near the 前台 pad: 小樱's ghost behind the counter; not enough fish yet (no tick)
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen']); S.stats.time = 200; S.money = 40; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(18, 26, 'up'); ff(.6, false); FREEZE_AT();
    },
    infocard_decor() {   // in the shop by the decor pads: a big decor icon on the card
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop']); S.stats.time = 300; S.money = 70; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(3, 33, 'up'); ff(.6, false); FREEZE_AT();
    },
    infocard_gate() {   // by the dining gate: the stove, counter, tables and cushions float faintly in the dark hall
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'room4', 'room5', 'shoes1']); S.stats.time = 400; S.money = 300; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(11, 27, 'up'); ff(.6, false); FREEZE_AT();
    },
    infocard_shoes() {   // by the shoes pad: a small sign over the head (shoe + up)
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.stats.time = 120; S.money = 50; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(18, 27, 'right'); ff(.6, false); FREEZE_AT();
    },
    infocard_net() {   // by the net pad: the new reach as a dotted ring round the feet
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1']); S.stats.time = 300; S.money = 100; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(21, 27, 'down'); ff(.6, false); FREEZE_AT();
    },
    banner_buy() {   // just bought 竹: "new! [room] 客房 . 开「竹」房", +3 hearts over the head, 好耶！, furniture popping in
      newGame(); S.tut.moved = true; S.stats.time = 100; S.money = 30; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(18, 21, 'up'); unlock('room2'); ff(.45, false); FREEZE_AT();
    },
    banner_area() {   // the onsen gate: area banner with the gold rim + star, the HUD star popping, 升星啦！
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.stats.time = 130; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(17, 8, 'up'); unlock('onsen'); ff(.5, false); FREEZE_AT();
    },
    edge_new() {   // the onsen just opened: new pads appear far below -> "new" tags on the bottom edge (no camera move)
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.stats.time = 130; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(17, 8, 'up'); unlock('onsen'); ff(3.5, false); FREEZE_AT();
    },
    banner_combo() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll', 'd_ikebana']); S.stats.time = 400; S.decor['room1:A'] = 'd_scroll'; resetWorld(); go('play'); spawnT = 1e9;
      place(12, 21, 'up'); ff(.2, false); setDecor(DSLOT_AT[ROOM.room1.slotB[1] * MW + ROOM.room1.slotB[0]], 'd_ikebana'); ff(.5, false); FREEZE_AT();
    },
    banner_rank() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen']); S.stats.time = 300; S.hearts = 29; resetWorld(); go('play'); spawnT = 1e9; place(17, 26, 'down'); ff(.3, false); addHearts(1); ff(.5, false); FREEZE_AT(); },
    banner_day() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep']); S.stats.time = 600; S.dayLog = { g: 48, h: 31, best: 40 }; resetWorld(); go('play'); spawnT = 1e9; place(16, 26, 'down'); S.clock = .098; ff(1.2, false); FREEZE_AT(); },
    banner_level() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1']); S.stats.time = 300; S.staff.maid1 = 19; resetWorld(); go('play'); spawnT = 1e9;
      const m = STAFF.find(s => s.id === 'maid1'); m.x = tcx(REST[0]); m.y = tcy(REST[0]); place(19, 27, 'up'); ff(.2, false); gainXp(m, 1); ff(.6, false); FREEZE_AT();
    },
    banner_gold() { newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.stats.time = 2000; S.hearts = 1499; resetWorld(); go('play'); spawnT = 1e9; place(17, 26, 'down'); ff(.3, false); addHearts(1); ff(.6, false); FREEZE_AT(); },
    banner_milestone() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep']); S.stats.time = 900; S.stats.guests = 99; resetWorld(); go('play'); spawnT = 1e9; place(15, 26, 'up');
      const gu = guest({ st: 'queue', x: tcx(QSPOTS[0]), y: tcy(QSPOTS[0]), ready: true }); Q.unshift(gu); ff(.1, false); checkIn(gu, ROOM.room2); ff(.6, false); FREEZE_AT();
    },
    new_staff() {   // 前台 just hired: 小樱 walks in from the front door, says 欢迎光临！ at the desk, a red "new" tag over her head
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen']); S.stats.time = 200; resetWorld(); go('play'); spawnT = 1e9; place(17, 26, 'left'); unlock('recep');
      for (let i = 0; i < 30 * 12 && !(LINE && LINE.id === 'S01'); i++) update(1 / 30); ff(.4, false); FREEZE_AT();
    },
    line_guest() {   // a guest's line in a white bubble (one on screen)
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep']); S.stats.time = 300; resetWorld(); go('play'); spawnT = 1e9; ff(3, false); place(15, 25, 'right');
      const gu = guest({ st: 'queue', x: tcx(QSPOTS[1]), y: tcy(QSPOTS[1]), ready: true, inside: true }); Q.push(gu); ff(.1, false); say(gu, 'G05'); ff(.5, false); FREEZE_AT();
    },
    line_player() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen']); S.stats.time = 300; P.towels = 4; resetWorld(); go('play'); spawnT = 1e9; place(17, 22, 'down'); P.towels = 3; ff(.2, false); say(P, 'P01'); ff(.6, false); FREEZE_AT(); },
    firstcard_call() {
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'tea']); S.stats.time = 300; resetWorld(); go('play'); spawnT = 1e9; ff(1, false);
      sleepIn('room2').call = { k: 'tea', t: 30, max: 40 }; firstTime('call'); place(16, 22, 'up'); ff(.5, false); FREEZE_AT();
    },
    firstcard_dine() { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'room4', 'room5', 'dining']); S.stats.time = 500; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); firstTime('dine'); place(6, 24, 'up'); ff(.5, false); FREEZE_AT(); },
    firstcard_vip() { newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.stats.time = 900; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); vipArrive(); ff(6, false); place(17, 24, 'down'); ff(.3, false); FREEZE_AT(); },
    firstcard_tryon() { newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.stats.time = 2000; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); firstTime('tryon'); place(12, 31, 'down'); ff(.5, false); FREEZE_AT(); },
    // ---- stage 5 audit fixes
    chain_lock() {   // F1: the straw hat bought at the booth, then 2 s standing still: the next hat waits (no card, no pour)
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.stats.time = 2000; S.money = 60000; resetWorld(); go('play'); spawnT = 1e9; ff(1, false);
      place(HAT_PAD[0], HAT_PAD[1], 'down'); ff(3, false); FREEZE_AT();
    },
    gate_onsen() {   // F4: the onsen gate also passes a rival: the area banner + P04 come first, the rank banner waits
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.stats.time = 130; S.hearts = 26; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(17, 8, 'up'); unlock('onsen'); ff(.5, false); FREEZE_AT();
    },
    banner_hint() {   // ROOM-2: gold star 3 lights: the hidden combo's banner and P11 when it comes up (after the rank + gold ones)
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.stats.time = 3000; S.hearts = 2999; resetWorld(); go('play'); spawnT = 1e9; place(17, 26, 'down'); ff(.3, false);
      addHearts(1); for (let i = 0; i < 30 * 12 && !(LINE && LINE.id === 'P11'); i++) update(1 / 30); ff(.4, false); FREEZE_AT();
    },
    arrow_statue() {   // END-1: every hat and pet bought, 60,000 on hand: the arrow points at the statue
      newGame(); S.tut.moved = true; unl(ALL.concat(UNLOCKS.filter(u => u.hat || u.pet).map(u => u.id), ['maid4'])); S.equip = { hat: 'h_crown', pet: 'p_shiba' };
      S.done = true; S.stats.time = 6000; S.money = 60000; for (const c of COMBOS) S.combos[c.id] = 1; resetWorld(); go('play'); spawnT = 1e9; ff(2, false);
      place(17, 28, 'down'); guideClock = 0; ff(.5, false); FREEZE_AT();
    },
    roten_open() {   // F7: the star-view bath 60 s after it opened, by day: guests fill it first for 3 minutes
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.clock = .3; S.stats.time = 1500; resetWorld(); go('play'); ff(40, false);
      S.money = 5000; S.done = true; unlock('roten'); ff(60, false); place(31, 6, 'up'); ff(.3, false); FREEZE_AT();
    },
    rooms_mix() {   // ROOM-1: the west wing after the arrow dressed every room (map view of the rooms' noren colours)
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.stats.time = 2000; resetWorld(); go('play');
      for (let k = 0; k < 40; k++) { const sl = slotTarget(); if (!sl) break; const id = slotPiece(sl); if (!id) break; setDecor(sl, id); }
      place(17, 14, 'down'); ff(4, false); BANNER_Q.length = 0; LINE = null; ff(.3, false); FREEZE_AT();
    },
    menu_main() { sc.late(); S.stats.time = 900; S.hearts = 260; S.day = 4; openMenu(); ff(.3, false); FREEZE_AT(); },
    menu_sound() { sc.late(); openMenu(); MENU.page = 'sound'; setSfxOn(false); ff(.3, false); FREEZE_AT(); },
    book_vip() {
      newGame(); S.tut.moved = true; unl(ALL); S.done = true; S.album.vip = { kawa: 3, ozeki: 2, sakura: 1, captain: 1 }; S.gifts = ['kawa', 'ozeki', 'sakura'];
      S.album.photos = [{ v: 'kawa', d: 5, h: null, p: null }, { v: 'ozeki', d: 7, h: 'h_straw', p: null }, { v: 'sakura', d: 9, h: 'h_flower', p: 'p_duck' }];
      resetWorld(); go('play'); spawnT = 1e9; ff(1, false); openMenu(); MENU.page = 'book'; MENU.tab = 0; ff(.3, false); FREEZE_AT();
    },
    book_vip_photo() { sc.book_vip(); MENU.sel = 'sakura'; S.unlocked.h_flower = S.unlocked.p_duck = true; },
    book_combo() {
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'd_daruma')); S.done = true; S.combos = { c_ga: 3, c_zen: 6, s_tea: 9 };
      S.decor = { 'room1:A': 'd_scroll', 'room1:B': 'd_ikebana', 'room3:A': 'd_scroll', 'room3:B': 'd_ikebana', 'room4:A': 'd_bonsai', 'room4:B': 'd_screen', 'room5:A': 'd_scroll', 'room5:B': 'd_bonsai' };
      resetWorld(); go('play'); spawnT = 1e9; ff(1, false); openMenu(); MENU.page = 'book'; MENU.tab = 1; ff(.3, false); FREEZE_AT();
    },
    book_guest() {
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); S.album.furs = { calico: true, white: true, black: true, tabby: true, gray: true, cow: true }; S.album.types = { elder: true, couple: true };
      resetWorld(); go('play'); spawnT = 1e9; ff(1, false); openMenu(); MENU.page = 'book'; MENU.tab = 2; ff(.3, false); FREEZE_AT();
    },
    book_staff() {
      newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'clerk'))); S.staff = { recep: 150, maid1: 320, maid2: 70, porter: 25, chef: 12, waiter1: 61 };
      resetWorld(); go('play'); spawnT = 1e9; ff(1, false); openMenu(); MENU.page = 'book'; MENU.tab = 3; ff(.3, false); FREEZE_AT();
    },
    bought() { sc.late(); openMenu(); MENU.page = 'bought'; ff(.3, false); FREEZE_AT(); },
    inn_rank() { sc.late(); S.hearts = 420; S.day = 6; S.dayLog = { g: 31, h: 22, best: 57 }; openMenu(); MENU.page = 'inn'; ff(.3, false); FREEZE_AT(); },
    buy_shoes() {   // shoes bought while walking: speed lines at the feet, the speed + hearts pops over the line bubble
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.stats.time = 120; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(18, 26, 'right');
      unlock('shoes1'); botMove = { x: -1, y: 0 }; ff(.5, false); botMove = null; P.moving = true; FREEZE_AT();
    },
    buy_tray() {   // a tray bought with two portions on it: the new slot flashes once
      newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'dining'))); S.stats.time = 600; resetWorld(); go('play'); spawnT = 1e9; ff(1, false);
      place(6, 22, 'down'); P.tray = ['rice', 'tea']; unlock('tray1'); ff(.25, false); FREEZE_AT();
    },
    night_info() {   // at night: the info card, the ghost preview and the pad frame stay bright over the night tint
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'room4']); S.stats.time = 400; S.money = 300; resetWorld(); go('play'); spawnT = 1e9; ff(1, false);
      S.clock = .9; place(18, 27, 'right'); ff(.5, false); FREEZE_AT();
    },
    input_menu() {   // real input events: tap the HUD menu button -> menu; Esc closes; P opens; tap 声音; M = music + sfx off
      sc.late(); setMusicOn(true); setSfxOn(true); update(1 / 30); render();
      const r = cv.getBoundingClientRect(), cl = (x, y) => ({ clientX: r.left + x / W * r.width, clientY: r.top + y / H * r.height, pointerId: 7, bubbles: true });
      const tap = (x, y) => { window.dispatchEvent(new PointerEvent('pointerdown', cl(x, y))); window.dispatchEvent(new PointerEvent('pointerup', cl(x, y))); };
      const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: c, bubbles: true })); };
      const log = []; tap(156, 8); log.push(state); key('Escape'); log.push(state); key('KeyP'); log.push(state); tap(90, 114); log.push(MENU.page); key('KeyM'); log.push('music ' + musicOn, 'sfx ' + sfxOn);
      const d = document.createElement('div'); d.textContent = log.join(' | '); d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;background:#000;color:#0f0;font:14px monospace;padding:4px;z-index:9';
      document.body.appendChild(d); FREEZE_AT();
    },
    // stage 3 guide v2 (SPEC_v2 6): the arrow with its icon (and the edge arrow with the icon on its tail)
    arrow_deliver() { sc.calls(); GUIDE = guideTarget(); FREEZE_AT(); },
    arrow_pile() {
      newGame(); S.tut.moved = true; unl(['room2']); S.money = 0; S.piles.room2 = 30; resetWorld(); go('play'); spawnT = 1e9;
      place(16, 22, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    arrow_edge() {   // the biggest pile is up at the onsen, you are at the desk
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep']); S.money = 0; S.piles.onsen = 60; resetWorld(); go('play'); spawnT = 1e9;
      place(15, 25, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    arrow_clean() {   // a guest waits at the counter, both rooms messy, no maid
      newGame(); S.tut.moved = true; unl(['room2']); resetWorld(); go('play'); spawnT = 1e9;
      S.rooms.room1 = S.rooms.room2 = 'messy'; addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Object.assign(gu, { x: tcx(QSPOTS[0]), y: tcy(QSPOTS[0]), st: 'queue', ready: true });
      place(16, 21, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    arrow_vip() {   // the VIP waits on the red carpet, a clean suite
      newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); ff(8, false); place(19, 24, 'left'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    arrow_slot() {   // you own decor and a room has none: its A slot
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shop', 'd_scroll']); S.money = 0; resetWorld(); go('play'); spawnT = 1e9; S.basket = BASKET_MAX;
      place(17, 21, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    arrow_pad() {   // money for a pad
      newGame(); S.tut.moved = true; unl(['room2', 'room3']); S.money = 40; resetWorld(); go('play'); spawnT = 1e9;
      place(15, 24, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    // ---- stage M (SPEC_v2 14.4): the scenes the list names that had no script yet
    lobby_queue() {   // star 2 lobby: every room taken, guests walk in and line up at the desk, the receptionist, tips on the desk
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'basket1']); S.money = 48; S.stats.time = 300; resetWorld(); go('play'); spawnT = 1e9; ff(1, false);
      sleepIn('room1'); sleepIn('room2'); S.rooms.room3 = 'messy'; S.piles.recep = 36; S.piles.room1 = 8;
      for (const t of ['regular', 'couple', 'regular', 'elder']) { addGuest(t); ff(1.6, false); }
      place(16, 25, 'left'); ff(7, false); FREEZE_AT();
    },
    onsen_busy() {   // star 3 onsen: five bathers (big bath open), a couple in one slot, a towel guest, milk, the porter
      newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'basket1', 'maid1', 'room4', 'milk', 'room5', 'porter', 'basket2', 'bigbath']);
      S.basket = 7; S.money = 140; S.stats.time = 900; resetWorld(); go('play'); spawnT = 1e9; ff(2, false);
      bathe(0, 'room2'); bathe(2, 'room3'); bathe(3, 'room4'); bathe(4, 'room5');
      const c = party('couple', { st: 'bathing', t: 0, tt: 60, slot: 1, x: SLOTS[1].x * TILE + 8, y: 4 * TILE + 8, inside: true }); SLOT_OCC[1] = c; c.mate.mode = 'park';
      S.piles.onsen = 44; S.piles.milk = 12;
      const gm = guest({ st: 'milk', tt: 60, x: MILK_SPOT[0] * TILE + 8, y: MILK_SPOT[1] * TILE + 8, dir: 'up', room: 'room1' }); gm.look = { fur: gm.look.fur, outfit: 'yukata' }; RT.room1.guest = gm; S.rooms.room1 = 'reserved';
      guest({ st: 'towel', wait: 9, x: TOWEL_SPOT[0] * TILE + 8, y: TOWEL_SPOT[1] * TILE + 8, dir: 'left', room: null });
      place(20, 5, 'left'); P.towels = 4; ff(.4, false); FREEZE_AT();
    },
    west_wing() {   // star 3 west wing: the quiet corridor, 茶 / 藤 / 兰 rooms, a night-snack call, the third maid
      newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'w3')).concat(['maid3']));
      S.money = 260; S.stats.time = 1000; S.decor['w1:A'] = 'd_bonsai'; resetWorld(); go('play'); spawnT = 1e9; ff(2, false);
      sleepIn('w1'); sleepIn('w3').call = { k: 'tea', t: 26, max: 40 }; S.rooms.w2 = 'messy'; S.piles.w1 = 12;
      place(8, 14, 'up'); P.tray = ['tea']; ff(.4, false); FREEZE_AT();
    },
    share_v2() {
      newGame(); S.tut.moved = true; unl(ALL.concat(['h_straw', 'h_beret', 'p_duck'])); S.done = true; S.equip = { hat: 'h_beret', pet: 'p_duck' }; S.hearts = 3200; S.stats.guests = 1840; S.earned = 412000; S.album.vip = { kawa: 3, ozeki: 2, sakura: 1 };
      S.album.photos = [{ v: 'kawa', d: 5, h: null, p: null }, { v: 'ozeki', d: 11, h: 'h_straw', p: 'p_duck' }]; S.combos = { c_ga: 3, c_zen: 6 }; S.album.furs = { calico: true, white: true }; resetWorld(); go('play'); ff(.5, false); makeShare();
    },
    // ---- v2.1 core A fun check (SPEC_v2 16.1-16.5): open a moment of the timeline (.shots/timeline.js saves the game
    // every 30 s to .shots/tl/NNNNN.json, NNNNN = game seconds) and play on with the arrow bot for window.FF s, stopping
    // early when window.UNTIL (an expression) is true; window.CARD: stop on the first paused card (shown 1.2 s in)
    tl() {
      const dir = window.TLDIR || '.shots/tl/';
      fetch(dir + window.TL + '.json').then(r => r.json()).then(j => {
        S = loadState(j.S); resetWorld(); go('play'); Object.assign(P, j.P, { moving: false }); updCam(0, true);
        if (window.BEFORE) eval(window.BEFORE);   // BEFORE: code run right after the load (start a fireworks show ...)
        const until = window.UNTIL ? () => eval(window.UNTIL) : null;
        for (let i = 0, n = Math.round((window.FF || 5) / DT); i < n; i++) {
          drive(DT); update(DT);
          if (state === 'celebrate') { S.done = true; go('play'); }
          if (state === 'card') { if (window.CARD) break; modalClose(); }
          if (until && until()) break;
        }
        botMove = null;
        if (state === 'card') st = window.CARDT || 1.2;
        else { if (window.PLACE) place(window.PLACE[0], window.PLACE[1], window.PLACE[2] || 'down'); for (let i = 0; i < (window.EXTRA || 0) * 30; i++) update(DT); }
        if (window.CLOCK !== undefined) S.clock = window.CLOCK;   // CLOCK: jump the time of day (no day roll-over)
        GUIDE = guideTarget(); if (window.AFTER) eval(window.AFTER); if (state !== 'menu') FREEZE_AT(); if (window.TLHOLD) update = dt => { T += dt; };   // TLHOLD: the world stops, animations (T) go on; AFTER: code run last (open a menu page ...)
        document.title = 'TL READY ' + state + ' d' + S.day + ' c' + S.clock.toFixed(2);
      });
    },
    // ---- v2.1 core B (SPEC_v2 16.6-16.10): window.V21 = extra unlock ids; window.LV = shrine level
    b_shop() {   // star 5 boutique: six booths (hat, pet, outfit, uniform, two gold decor); standing between three of them tries them all on
      b5(DECOR_IDS); S.combos = { c_fuku: 1, c_cat: 1, c_zen: 1, c_ga: 1 }; S.money = 30000; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(4, 33, 'down'); ff(.4, false); FREEZE_AT();
    },
    b_outfit() {   // wearing the samurai outfit + crown, the fox following, the staff in sailor uniforms (lobby)
      b5(['o_samurai', 'h_crown', 'p_fox', 'u_sailor', 'p_tanuki', 'o_maneki']); S.equip = { hat: window.HAT || 'h_crown', pet: window.PET || 'p_fox', outfit: window.OUT || 'o_samurai', uniform: 'u_sailor' }; resetWorld(); go('play'); ff(2, false); place(16, 25, 'down'); ff(window.STILL || .5, false); FREEZE_AT();
    },
    b_dress() { b5(['h_straw', 'h_flower', 'o_yukata', 'o_chef', 'o_ninja', 'u_sakura', 'p_duck', 'p_fox']); S.equip = { hat: 'h_flower', pet: 'p_fox', outfit: 'o_ninja', uniform: 'u_sakura' }; resetWorld(); go('play'); ff(.5, false); openMenu(); MENU.page = 'dress'; DRESS.tab = window.TAB === undefined ? 1 : window.TAB; },
    b_book() {
      b5(['gd_zen', 'gd_chime', 'gd_tower', 'h_straw', 'o_yukata', 'u_gold', 'p_duck']); S.rare = { r_zen: 3, r_boy: 1, r_kits: 2 }; S.gifts = ['kawa', 'ozeki', 'sakura'];
      S.awards = [{ y: 1, k: 'silver', h: 4600 }, { y: 2, k: 'gold', h: 5400 }]; S.covers = [{ d: 1, n: 5, tv: false }, { d: 19, n: 4, tv: true }]; S.medals = [{ s: 0, y: 1 }, { s: 1, y: 1 }, { s: 2, y: 1 }]; resetWorld(); go('play'); ff(.5, false); openMenu(); MENU.page = 'book'; MENU.tab = window.TAB === undefined ? 4 : window.TAB;
    },
    b_map() {
      b5(['shrine']); resetWorld(); go('play'); ff(.5, false); S.rooms.room2 = 'messy'; S.rooms.w1 = 'messy'; sleepIn('room3'); sleepIn('c1'); place(29, 21, 'down'); openMenu(); MENU.page = 'inn'; MENU.sel = window.SEL === undefined ? 'map' : window.SEL;
    },
    b_rare() {   // a rare guest led by the arrow bot until its wish window.WISH shows (stay / show / milk ...), then frozen
      const r = RARE[window.RID || 'r_zen']; b5([r.piece]); if (typeof r.when === 'number') S.day = 1 + 3 * r.when; if (r.when === 'night') S.clock = .85;
      resetWorld(); go('play'); spawnT = 1e9; vipT = S.stats.time; RARE_DUE[r.id] = S.stats.time; ff(.2, false);
      const want = window.WISH || 'stay', stop = () => VIPG && ((VIPG.st === 'seated' && vipWish() === want && !(VIPG.hold > 0)) || VIPG.st === want);
      for (let i = 0; i < 30 * 400 && !stop(); i++) { drive(DT); update(DT); }
      botMove = null; if (window.NEAR && VIPG) { const [vx, vy] = tileOf(VIPG); place(vx + window.NEAR[0], vy + window.NEAR[1], 'up'); }
      ff(window.MORE || .4, !!window.BOTMORE); GUIDE = guideTarget(); FREEZE_AT();
    },
    b_rare_t() {   // a rare guest's visit, the arrow bot playing it: frozen window.SEC s after it came (a screenshot timeline)
      const r = RARE[window.RID || 'r_kits']; b5([r.piece]); if (typeof r.when === 'number') S.day = 1 + 3 * r.when; if (r.when === 'night') S.clock = .85;
      resetWorld(); go('play'); spawnT = 1e9; place(17, 27, 'up'); vipT = S.stats.time; RARE_DUE[r.id] = S.stats.time; ff(.1, false);
      ff(window.SEC || 10, true); GUIDE = guideTarget(); FREEZE_AT();
    },
    b_shrine() {   // the shrine at level window.LV (default 10), by day / night (window.CLOCK)
      const lv = window.LV === undefined ? 10 : window.LV; b5(['shrine'].concat(Array.from({ length: lv }, (_, i) => 'of' + (i + 1)))); S.clock = window.CLOCK || .3; S.money = window.MONEY || 0;
      resetWorld(); go('play'); spawnT = 1e9; ff(.5, false); place(window.PX || 7, window.PY || 4, 'up'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    b_plaza() {   // the plaza at dusk: stalls open for a fireworks show, guests at the stalls, bursts in the sky
      b5(['plaza'].concat(STALLS_B.map(s => s[0]), GARDEN_B.map(g => g[0]))); S.clock = window.CLOCK || .64; S.fw = { n: 1, cool: 0 }; resetWorld(); go('play'); spawnT = 0;
      ff(30, false); FWS.t = FW_T; FWS.acc = 0; ff(window.MORE || 12, false); place(31, 32, 'up'); ff(1.2, false); FREEZE_AT();
    },
    b_garden() {   // every garden piece on its ground; by the chain pad its info card shows the guest it may bring
      b5(GARDEN_B.slice(0, window.NGZ === undefined ? 4 : window.NGZ).map(g => g[0])); S.money = 40000; resetWorld(); go('play'); spawnT = 1e9; ff(1, false); place(window.PX || 34, window.PY || 27, 'up'); ff(.4, false); FREEZE_AT();
    },
    b_snap() {   // a save the shopper bot wrote (tests/bot_balance.js snap=dir): window.SNAP = url, window.VIEW = where to look, window.CLOCK
      const views = { garden: [33, 25], shrine: [6, 3], plaza: [31, 32], shop: [5, 32], lobby: [17, 25], rooms: [17, 14], onsen: [17, 4] };
      fetch(window.SNAP).then(r => r.json()).then(j => {
        S = loadState(j); if (window.CLOCK !== undefined) S.clock = window.CLOCK; resetWorld(); go('play'); spawnT = 0; ff(25, false);
        const v = views[window.VIEW] || [j._P[0] / 16 | 0, j._P[1] / 16 | 0]; place(v[0], v[1], 'down'); ff(.5, false);
        if (window.MENU_PAGE) { openMenu(); MENU.page = window.MENU_PAGE; MENU.tab = window.TAB || 0; DRESS.tab = window.TAB || 0; if (window.SEL) MENU.sel = window.SEL; } else FREEZE_AT();
      });
    },
    // v2.2: a guest of honour seated in 月见亭 with wish window.WISH (tea / kaiseki / bath / photo / milk / rice), the
    // innkeeper at window.PX / PY (default: the lobby), window.WHO = a VIP or rare guest id (default: one whose wishes
    // include it), window.VIPS = VIPs already hosted (0 = the first VIP ever), window.WT = how long the wish has waited,
    // window.TRAY = what is on the tray, window.MORE = seconds of play after placing (bot: window.BOTMORE)
    v22vip() {
      const want = window.WISH || 'tea', who = window.WHO || (VIPS.find(v => v.wishes.includes(want)) || RARES.find(r => r.wishes.includes(want))).id;
      b5(RARE[who] ? [RARE[who].piece] : []); S.stats.vips = window.VIPS === undefined ? 1 : window.VIPS; if (!S.stats.vips) S.seen = {}; S.clock = .3;
      resetWorld(); go('play'); spawnT = 1e9;
      vipArrive(); const v = VIPG, rm = ROOM.c3;
      if (RARE[who]) Object.assign(v, { id: who, rare: true, look: RARE_LOOK[who], kits: undefined });
      else Object.assign(v, { id: who, look: VIP_LOOK[who] });
      v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up'; v.wi = VIP[who].wishes.indexOf(want);
      firstDone('vip'); vipWishStart(); v.wt = window.WT || 0; if (window.NOCARD) FIRST_Q.length = 0;
      place(window.PX || 17, window.PY || 25, 'up'); P.tray = window.TRAY || [];
      ff(window.MORE || .4, !!window.BOTMORE); GUIDE = guideTarget(); FREEZE_AT();
    },
    v22full() {   // v2.2: hands off at star 2 (window.STAR5: a star-5 inn with the clerk) for window.IDLE s: full piles show 满
      if (window.STAR5) b5([]); else { newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'tea', 'shop', 'basket1']); }
      S.clock = .3; S.day = 3; resetWorld(); go('play'); place(window.PX || 17, window.PY || 25, 'down'); ff(window.IDLE || 240, false);
      if (window.PX2) place(window.PX2, window.PY2, 'down'); ff(.3, false); GUIDE = guideTarget(); FREEZE_AT();
    },
    b_title() { b5(['o_hakama', 'h_straw', 'p_crane']); S.equip = { hat: 'h_straw', pet: 'p_crane', outfit: 'o_hakama' }; resetWorld(); go('title'); },
    mapV21() { newGame(); S.tut.moved = true; unl(ALL.concat(['maid4'], UNLOCKS.filter(u => u.v21b && !u.repeat && !u.ok && (!u.shrine || u.shrine <= (window.LV === undefined ? 10 : window.LV))).map(u => u.id))); S.done = true; resetWorld(); go('play'); ff(30, false); place(17, 27, 'up'); mapView(); },
  };
  (sc[window.SHOT] || sc.title)();
  if (window.HOLD) { update = dt => { T += dt; }; }
  if (window.FREEZE) { update = dt => {}; }
})();
