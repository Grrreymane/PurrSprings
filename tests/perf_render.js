// Per-frame cost probe (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/perf_render.js --seed 1
// Plays to ★5 with the guide-following driver (update only), then renders EVERY frame for 5 minutes like the
// real rAF loop and counts: new outlined-text sprites created (each = a fresh <canvas> + 33 fillText calls),
// TXC full clears, BFS calls per frame, and the pixel memory TXC holds (scaled to a 3x-DPR phone).
// Then SPEC_v2 14.2 P1: the most crowded picture - night, everything open, the camera on the garden with a VIP following
// you, GUEST_MAX guests, every lamp - update + render per frame must stay < 4 ms (headless estimate: canvas calls are
// no-ops, so this is the game's own JS cost). Exit 1 when it doesn't.
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
newGame();
for (let i = 0; i < 30 * 60 * 30 && star() < 5; i++) { drive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); }
S.done = true; if (state !== 'play') go('play');
let created = 0, clears = 0, bfs = 0, bfsMax = 0, framesWithNew = 0;
const _ts = textSprite; textSprite = function (t) { const k = t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K; if (!TXC.has(k)) { created++; if (TXC.size > 400) clears++; } return _ts(t); };
const _fp = findPath; findPath = function (a, b, c, d) { bfs++; return _fp(a, b, c, d); };
const N = 5 * 60 * 30, w0 = Date.now();
for (let i = 0; i < N; i++) {
  drive(DT); const c0 = created, b0 = bfs;
  update(DT); render();
  if (created > c0) framesWithNew++;
  bfsMax = Math.max(bfsMax, bfs - b0);
}
let px = 0; for (const v of TXC.values()) px += v.w * v.h;
const k = 6.5 / K;   // 390-css-px-wide phone at DPR 3: K = 1170 / 180 = 6.5
console.log(`after ★5 (${R(S.stats.time / 60)} min), 5 min rendered every frame at 30 fps:`);
console.log(`  new text sprites ${created} (${(created / 5).toFixed(0)}/min), frames that created at least one: ${framesWithNew}/${N} (${(framesWithNew / N * 100).toFixed(1)}%), TXC full clears ${clears}`);
console.log(`  TXC now ${TXC.size} entries = ${(px * 4 / 1e6).toFixed(1)} MB at K=${K}; ~${(px * 4 * k * k / 1e6).toFixed(0)} MB at K=6.5 (scaled)`);
console.log(`  BFS calls: ${bfs} total, max ${bfsMax} in one frame | update + render ${((Date.now() - w0) / N).toFixed(3)} ms per frame (headless: canvas calls are no-ops)`);

// ---------------------------------------------------------------- P1: the most crowded picture
{
  for (const u of UNLOCKS) if (!u.need5 || u.id === 'h_straw' || u.id === 'p_shiba') { S.unlocked[u.id] = true; S.paid[u.id] = u.price; }
  for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
  S.peak = 5; S.done = true; S.equip = { hat: 'h_straw', pet: 'p_shiba' }; S.clock = .85;
  for (const sl of DSLOTS) if (roomOpen(sl.rm)) S.decor[sl.key] = sl.k === 'A' ? 'd_scroll' : 'd_ikebana';
  resetWorld(); go('play');
  for (let i = 0; i < 30 * 40; i++) { update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); }   // staff out, guests flowing
  // GUEST_MAX guests: the queue takes what it can, the rest walk out through the garden (spread over its paths)
  const garden = []; for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const ar = areaAt(tx, ty); if (ar && ar.id === 'garden' && walkable(tx, ty)) garden.push([tx, ty]); }
  const crowd = () => { while (GUESTS.length < GUEST_MAX) { const q = Q.length < QSPOTS.length - 1; addGuest(); if (q) continue; const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); const t = garden[Math.floor(Math.random() * garden.length)]; gu.x = tcx(t); gu.y = tcy(t); guestLeave(gu, false); } };
  crowd();
  // stand on an open garden tile with room around it (not in a suite: the VIP would go in and sit down)
  const open = ([x, y]) => [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].every(([dx, dy]) => walkable(x + dx, y + dy)) && !SUITES.some(rm => inBox(rm, x, y));
  const spot = garden.filter(open).sort((a, b) => Math.hypot(a[0] - 30, a[1] - 22) - Math.hypot(b[0] - 30, b[1] - 22))[0];
  P.x = tcx(spot); P.y = tcy(spot);
  const keepVip = () => { if (!VIPG) vipArrive(); if (VIPG.st !== 'follow') { VIPG.x = P.x + 12; VIPG.y = P.y + 4; setSt(VIPG, 'follow'); VIPG.q = []; VIPG.halt = false; VIPG.greetAt = S.stats.time; } VIPG.t = 0; };
  keepVip();
  for (const id in S.piles) S.piles[id] = 50;
  updCam(0, true);
  let worst = 0, sum = 0, n = 0, lamps = 0, guestsMin = 1e9, vipIn = 0;
  const w0 = Date.now();
  for (let i = 0; i < 30 * 20; i++) {
    // walk a small loop in the garden so the VIP keeps following and the camera keeps moving
    const a = i / 90 * Math.PI * 2; botMove = { x: Math.cos(a) * .5, y: Math.sin(a) * .4 };
    crowd(); keepVip();
    const t1 = process.hrtime.bigint(); update(DT); render(); const ms = Number(process.hrtime.bigint() - t1) / 1e6;
    if (i >= 30) { worst = Math.max(worst, ms); sum += ms; n++; lamps = Math.max(lamps, LIGHT_N); guestsMin = Math.min(guestsMin, GUESTS.length); if (VIPG && VIPG.st === 'follow' && onView(VIPG.x, VIPG.y)) vipIn++; }
  }
  botMove = null;
  const avg = sum / n, ok = avg < 4;
  console.log(`P1 crowded night (garden + a following VIP in view ${R(vipIn / n * 100)}% of frames, ${guestsMin}+ guests, ${lamps} lamps drawn, ${STAFF.length} staff): update + render avg ${avg.toFixed(3)} ms, worst ${worst.toFixed(2)} ms per frame (target avg < 4 ms) ${ok ? 'OK' : 'FAIL'}  [${((Date.now() - w0) / 600).toFixed(2)} ms wall/frame]`);
  if (!ok) process.exitCode = 1;
}
