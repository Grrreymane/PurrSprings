// ============================================================ update(dt)
let state = 'title', st = 0, T = 0;
const TITLE_CAM = [190, MAPH - H - 32];   // the entrance noren + the bowing innkeeper below the start button (v1: x 30)
const cam = { x: TITLE_CAM[0], y: TITLE_CAM[1] };
let DISP = 0, hudBump = 0;
const FX = [];
function go(s) { state = s; st = 0; JOY.on = false; }
function fxSpark(x, y, n) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand(0, .5); FX.push({ k: 'spark', x, y, vx: Math.cos(a) * 22, vy: Math.sin(a) * 18 - 6, t: -i * .03, life: .6 }); } }
function updPlayer(dt) {
  const v = state === 'play' ? inputVec() : { x: 0, y: 0 }, m = Math.hypot(v.x, v.y);
  P.moving = false;
  if (m > .05) {
    const sp = playerSpeed() * dt, ox = P.x, oy = P.y;
    moveBox(P, v.x * sp, v.y * sp);
    const moved = Math.hypot(P.x - ox, P.y - oy);
    P.dist += moved; if (!S.tut.moved && P.dist >= 40) { S.tut.moved = true; markDirty(); }
    P.dir = Math.abs(v.x) > Math.abs(v.y) ? (v.x < 0 ? 'left' : 'right') : (v.y < 0 ? 'up' : 'down');
    if (moved > .01) { P.moving = true; P.walkT += dt; }
  }
  P.sway += ((P.moving ? -v.x * 2.5 : 0) - P.sway) * Math.min(1, dt * 5);   // the towel stack lags behind a little
}
// guests (3.3): queue < 5, guests who need or hold a room < open rooms + 3, at most GUEST_MAX guests in the inn
const NEEDS_ROOM = { arrive: 1, queue: 1, toRoom: 1, sleep: 1 };
function spawnGuests(dt) {
  spawnT -= dt; if (spawnT > 0) return;
  let needRoom = 0; for (const gu of GUESTS) if (NEEDS_ROOM[gu.st]) needRoom++;
  if (Q.length < QSPOTS.length && needRoom < guestRoomsOpen() + 3 && GUESTS.length < GUEST_MAX) { addGuest(); spawnT = spawnGap(); } else spawnT = .5;
}
// camera (2.7): follow the player, clamp to the map; never shakes, never pans by itself
function updCam(dt, snap) {
  const tx = clamp(P.x - W / 2, 0, MAPW - W), ty = clamp(P.y - H / 2 - 8, 0, MAPH - H);
  if (snap) { cam.x = tx; cam.y = ty; return; }
  const k = Math.min(1, dt * 6); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
function gameUpdate(dt) {
  S.stats.time += dt;
  if (state === 'play') dayTick(dt);   // the clock stops under the celebration panel (4.10)
  padsUpdate();
  updPlayer(dt);
  spawnGuests(dt);
  for (const gu of GUESTS.slice()) updGuest(gu, dt);
  for (let i = GUESTS.length - 1; i >= 0; i--) if (GUESTS[i].gone) { if (GUESTS[i].call) RUN.callsMissed++; GUESTS.splice(i, 1); }
  pileAges();
  for (const s of STAFF) updStaff(s, dt);
  staffChat();
  updVip(dt);
  zones(dt);
  padsUpdate();
  { const bo = boutiqueOpen(); if (bo && !boutiqueWas) boutiqueOpened(); boutiqueWas = bo; }
  if (k02Pend) { const o = shopOwner(); if (o && lineOk(o) && lineSay(o, 'K02')) k02Pend = false; }
  updPet(dt);
  bubbles();
  padsSeen();
  guideClock -= dt; if (guideClock <= 0) { GUIDE = guideTarget(); guideClock = .25; }
  // a booth piece is pointed at for at most BOOTH_HINT_T s in all (6 rule 6: once)
  if (GUIDE && GUIDE.kind === 'pad' && !GUIDE.here && GUIDE.id && UNLOCK[GUIDE.id].booth && GUIDE.id !== 'statue') { const b = boothOf(GUIDE.id); b.t += dt; if (b.t >= BOOTH_HINT_T) b.done = true; }
  if (celebrateAt && T >= celebrateAt) { celebrateAt = 0; go('celebrate'); }
  saveClock += dt; if (dirty && saveClock >= 2) saveNow();
  updCam(dt);
}
function update(dt) {
  T += dt; st += dt;
  const live = state === 'play' || state === 'celebrate';   // the menu pauses everything but T and the menu itself (7.5)
  if (live) { gameUpdate(dt); uiUpdate(dt); }
  else if (state === 'title') { cam.x = TITLE_CAM[0]; cam.y = TITLE_CAM[1]; }
  const d = S.money - DISP; DISP = Math.abs(d) < .6 ? S.money : DISP + d * Math.min(1, dt * 9);
  if (hudBump > 0) hudBump -= dt;
  if (state !== 'menu') {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt;
    if (f.k === 'spark' && f.t > 0) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .92; f.vy *= .92; }
    if (f.t >= f.life) { if (f.k === 'fly') hudBump = .15; FX.splice(i, 1); }
  }
    for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; if (p.wait > 0) { p.wait -= dt; continue; } p.life -= dt; p.y -= 14 * dt; if (p.life <= 0) POPS.splice(i, 1); }
  }
  for (let i = AREA_FADE.length - 1; i >= 0; i--) if (T - AREA_FADE[i].t0 > .8) AREA_FADE.splice(i, 1);
  audioTick(dt);
}
// what the music should be (SPEC_v2 9 / 13), every frame: the area's song (+ its ambience), fest under the star-5
// celebration, the title song; night arrangement from dayLight(), layers by star; muffled in the menu. The engine debounces.
function audioTick(dt) {
  const a = state === 'title' ? null : areaAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE));
  musicWant({ song: state === 'title' ? 'title' : state === 'celebrate' ? 'fest' : a ? a.music : 'lobby', night: state === 'title' ? 0 : dayLight().night,
    star: star(), menu: state === 'menu', area: a ? a.id : null, shishi: !!S.unlocked.g_shishi, shishiT: T });
  musicTick(dt);
}
