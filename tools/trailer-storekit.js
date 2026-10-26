// 猫猫温泉旅馆 trailer v3: one feeling (cosy and cute: cats soaking in a hot spring) and one promise
// (a quiet little inn grows into a five-star hot-spring resort).
// node record.mjs D:/Minigame/Hotelgame --director tools/trailer.js --hook "requestAnimationFrame(frame);" --lang zh-CN --audio --size 1080x1920 --video 1gp-kit/preview.webm --shots 1gp-kit/shots
let src = await fetch('.shots/stage.js').then(r => r.text());
src = src.replace(/const FREEZE_AT = after => \{[^\n]*\n/, 'const FREEZE_AT = after => { if (after) ff(after, false); };\n')
         .replace('(sc[window.SHOT] || sc.title)();', 'window.__ST = { ff, unl, ALL }; return;');
eval(src);
const { ff, unl, ALL } = window.__ST;
const tidy = () => { if (state === 'card') modalClose(); if (state === 'celebrate') { S.done = true; go('play'); } };
const PX = REC.width / W;                                   // CSS px per game px
const font = '"Fusion Pixel",sans-serif';
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

// a clean picture: no HUD, hint bar, guide arrow, banners or joystick; one song throughout
const quiet = () => {};
drawHUD = quiet; drawBottomCard = quiet; drawGuide = quiet; drawJoy = quiet; drawEdgeNew = quiet; drawBanner = quiet;
const gameMusicWant = musicWant; musicWant = o => gameMusicWant({ ...o, song: 'onsen', night: 0 });
initAudio();
// hold the game's camera still where a shot needs it (it normally follows the innkeeper)
let camFix = null; const gameUpdCam = updCam;
updCam = (dt, snap) => { if (!camFix) return gameUpdCam(dt, snap); cam.x = cam.tx = camFix[0]; cam.y = cam.ty = camFix[1]; cam.gx = cam.gy = 0; };
const place = (x, y, dir) => { Object.assign(P, { x: x * TILE + 8, y: y * TILE + 8, dir: dir || 'down', moving: false }); updCam(0, true); };
const soak = i => { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1);
  Object.assign(gu, { st: 'bathing', t: 0, tt: 999, slot: i, x: SLOTS[i].x * TILE + 8, y: 4 * TILE + 8, inside: true }); SLOT_OCC[i] = gu; return gu; };
const inn = (ids, clock) => { newGame(); S.tut.moved = true; unl(ids); S.done = true; S.clock = clock; resetWorld(); go('play'); spawnT = 1e9; ff(2, false); tidy(); GUESTS.length = 0; SLOT_OCC.fill(null); };
const bathCam = z => REC.camera({ x: (17 * TILE + 8 - cam.x) * PX, y: (4 * TILE + 10 - cam.y) * PX, zoom: z, at: [.5, .5] });
const hearts = (list, gap) => { let next = 0; return t => { if (t >= next) { next = t + gap; list[Math.floor(Math.random() * list.length)].heart = 1; } }; };

// ---- 1. the hot spring, close: cats soaking with towels on their heads, little hearts
inn(ALL.filter(id => id !== 'roten' && id !== 'teaboy'), .32);   // no tea runner: the innkeeper serves the calls himself
const bathers = [0, 1, 2, 3, 4].map(soak);
camFix = [17 * TILE + 8 - W / 2, 0];
place(16, 5, 'right'); P.tray = ['milk', 'milk', 'milk']; P.towels = 0; ff(.3, false); tidy();
for (const i of [1, 2, 4]) bathers[i].call = { k: 'milk', t: 40, max: 40 };   // slots at x 17, 19, 21, along the innkeeper's walk
const served0 = S.stats.calls;
const handOver = () => {   // passing under a cat that wants milk: the game's own hand-over (the cup flies, hearts, fish, the chime)
  for (const gu of bathers) if (gu.call && Math.abs(guestSpot(gu)[0] - P.x) < 6 && P.tray.length) {
    const [x, y] = guestSpot(gu); P.tray.pop(); FX.push({ k: 'give', it: 'milk', x0: P.x, y0: P.y - 12, x1: x, y1: y - 10, t: 0, life: .3 }); serveCall(gu);
  }
};
const love = hearts([bathers[0], bathers[3]], .5);
// one continuous shot: close on the soaking cats, then the innkeeper walks along the edge handing out milk while the camera eases back
REC.start(); REC.mark('hook: cats soaking, milk served');
let shot1 = false;
await REC.wait(4.0, async t => {
  tidy(); love(t); handOver();
  bathCam(3 - .8 * ease(Math.min(1, Math.max(0, t - 1.4) / 1.6)));
  botMove = t > .5 && P.x < 22 * TILE ? { x: .75, y: 0 } : null;
  if (!shot1 && S.stats.calls - served0 >= 1) { shot1 = true; await REC.shot('01-milk'); }
});
REC.log('milk served', S.stats.calls - served0);
await REC.shot('02-soaking');
camFix = null; REC.camera();

// ---- 3. the promise: the whole inn from above, live, growing from one star to five while the camera pulls out
REC.mark('growth');
const big = mk(MAPW, MAPH), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false;
const view = document.createElement('canvas'), vx = view.getContext('2d');
view.width = 352; view.height = MAPH;
view.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;image-rendering:pixelated;z-index:10';
const crop = [128, 300, 176, 312], from = crop.slice(), to = [144, 0, 352, MAPH];   // from the lobby out to the whole resort
const gameRender = render;
render = () => {   // the whole map, window by window (like the stager's map view), then the 9:16 crop
  g = low.getContext('2d'); g.imageSmoothingEnabled = false;
  for (let cy = 0; cy < MAPH; cy += H) for (let cx = 0; cx < MAPW; cx += W) {
    TQ.length = 0; CX = cx; CY = cy; SUBX = SUBY = 0; padsUpdate(); drawScene(W, H, true); drawOverlays();
    bx.drawImage(low, 0, 0, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy), cx, cy, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy));
  }
  TQ.length = 0; vx.imageSmoothingEnabled = false; vx.clearRect(0, 0, view.width, view.height);
  vx.drawImage(big, crop[0], crop[1], crop[2], crop[3], 0, 0, view.width, view.height);
};
const cap = (t, y) => REC.caption(t, { y, size: .08, font, weight: 400, color: '#ffe04a', stroke: '#2a1638' });
const build = UNLOCKS.slice(0, UNLOCKS.findIndex(u => u.id === 'maid4') + 1).filter(u => !(u.hat || u.pet || u.outfit || u.decor) && u.id !== 'room2').map(u => u.id)
  .concat(['shrine', 'plaza', 'gd_chime', 'gd_zen', 'gd_lantern', 'gd_wisteria', 'st_goldfish', 'st_tako', 'st_ice']);
newGame(); S.tut.moved = true; S.clock = .3; unl(['room2']); resetWorld(); go('play'); ff(20, false); tidy(); place(17, 27, 'up');
document.body.appendChild(view);
let built = 0;
await REC.wait(5.0, t => {
  tidy(); botMove = null; S.clock = .3;
  for (let k = 0; k < 3; k++) { update(1 / 30); tidy(); }                     // 4x speed: guests stream in
  spawnT = Math.min(spawnT, .3);
  const want = Math.floor(build.length * Math.min(1, Math.max(0, (t - .6) / 3.6)));
  while (built < want) { const id = build[built++]; if (!S.unlocked[id]) { S.money += UNLOCK[id].price; unlock(id); } }
  if (built >= build.length) { S.done = true; cap('五星温泉乡', .86); } else cap(t < 1.4 ? '一星小馆' : '', .86);
  const e = ease(Math.min(1, t / 4.6));
  for (let i = 0; i < 4; i++) crop[i] = from[i] + (to[i] - from[i]) * e;
});
await REC.shot('03-resort');
view.remove(); render = gameRender; cap('');

// ---- 4. the five-star night: the star-view bath full of cats, fireworks overhead
REC.mark('night fireworks');
inn(ALL.concat(['roten', 'plaza']), .9);
for (let i = 5; i < SLOTS.length; i++) soak(i);
camFix = [32 * TILE - W / 2, 0]; place(24, 12, 'up'); ff(.4, false); tidy();
let next = 0, clock = 0;
const burst = () => {
  tidy(); botMove = null; clock += 1 / 30; if (clock < next) return;
  next = clock + .3; const k = Math.floor(Math.random() * FW_COLS.length), x = cam.x + 90 + rand(-26, 26), y = cam.y + rand(20, 50);
  BURSTS.push({ x, y, y0: y + rand(40, 70), k, col: FW_COLS[k], t: 0, rise: fwRise(), life: fwRise() + FW_FRAMES / FW_FPS }); sfx('firework');
};
const rotenCam = () => REC.camera({ x: (32 * TILE - cam.x) * PX, y: (4 * TILE - cam.y) * PX, zoom: 3.1, at: [.5, .5] });
for (let i = 0; i < 36; i++) { burst(); rotenCam(); await REC.skip(1 / 30); }   // cut in once the sky is already full
await REC.wait(3.0, () => { burst(); rotenCam(); });
await REC.shot('04-night');
camFix = null; REC.camera();

// ---- 5. end card: back to the cats in the hot spring, the name and a call to action
REC.mark('end');
inn(ALL.filter(id => id !== 'roten'), .32);
const last = [0, 1, 2, 3, 4].map(soak);
camFix = [17 * TILE + 8 - W / 2, 0]; place(17, 20, 'up'); ff(.3, false); tidy();   // the innkeeper out of the shot
const card = document.createElement('div');
card.style.cssText = `position:fixed;left:0;right:0;top:56%;z-index:2147483646;text-align:center;font-family:${font};pointer-events:none`;
card.innerHTML = '<div style="font-size:15vw;color:#ffe14a;-webkit-text-stroke:1.6vw #2a1638;paint-order:stroke fill;line-height:1.1">猫猫温泉旅馆</div>'
  + '<div style="margin-top:2vw;font-size:5.5vw;color:#dff6ff;-webkit-text-stroke:1vw #2a1638;paint-order:stroke fill">Purr Springs</div>'
  + '<div class="cta" style="margin-top:12vw;font-size:6.5vw;color:#fff;-webkit-text-stroke:1.1vw #2a1638;paint-order:stroke fill">点击开始营业</div>';
document.documentElement.appendChild(card);
const love2 = hearts(last.slice(1, 4), .35);
await REC.wait(2.6, t => { tidy(); botMove = null; bathCam(2.4); love2(t);
  card.querySelector('.cta').style.visibility = Math.floor(t * 2) % 2 ? 'hidden' : 'visible'; });
