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
  const guest = (o) => { addGuest(); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); return gu; };
  const bathe = (slot, room) => { const gu = guest({ st: 'bathing', t: 0, tt: 60, slot, room, x: SLOTS[slot].x * TILE + 8, y: 4 * TILE + 8 }); SLOT_OCC[slot] = gu; RT[room].guest = gu; S.rooms[room] = 'reserved'; return gu; };
  const sleepIn = (room) => { const rm = ROOM[room]; const gu = guest({ st: 'sleep', t: 0, tt: 60, room, x: rm.stand[0] * TILE + 8, y: rm.stand[1] * TILE + 8 }); RT[room].guest = gu; S.rooms[room] = 'occupied'; return gu; };
  const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
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
