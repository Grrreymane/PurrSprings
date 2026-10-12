// Doorways are forgiving (18.2, "房间门口很小，容易卡住"): every door / gate in DOORS (rooms on both corridor sides, the
// west wing, cottages, suites, the onsen, the gates), approached from both sides at lateral offsets -7..+7 px, with the
// joystick pushed straight along the passage, aimed at the door's centre, and 35 deg diagonal from a start whose line meets the wall -7..+7 px off the door's centre
// - the innkeeper must get through within 1.6x the straight walk + 0.3 s (all shoes / no shoes / a half-pushed stick). And the other way round: walking along a wall past a door without
// pushing toward it (straight, or a little away from the wall) never pulls you into the doorway, and the foot box
// never overlaps a wall or furniture tile on any frame.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/door_check.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 60;
S = defaults(); for (const u of UNLOCKS) S.unlocked[u.id] = true; for (const rm of ROOMS) S.rooms[rm.id] = 'clean';
S.peak = 5; S.done = true; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; GUESTS.length = 0;
let clip = 0;
// walk with input v until done() or t seconds; checks the foot box never sits in a blocked tile
function walk(v, t, done) {
  botMove = v;
  for (let i = 0, n = Math.round(t / DT); i < n; i++) {
    updPlayer(DT);
    if (boxHit(P.x, P.y)) clip++;
    if (done && done()) { botMove = null; return (i + 1) * DT; }
  }
  botMove = null; return null;
}
// the straight line from the start along v up to where the foot box meets the door's wall row / column is free
// (box x-4..x+4, y-4..y+1), so a failure is the doorway's fault, not furniture's
function clearLine(px, py, v, tx, ty, ax, ay) {
  const stopAt = ax > 0 ? tx * TILE - 4.01 : ax < 0 ? (tx + 1) * TILE + 4 : ay > 0 ? ty * TILE - 1.01 : (ty + 1) * TILE + 4;
  for (let i = 0; i < 400; i++) {
    const x = px + v.x * i * .5, y = py + v.y * i * .5, f = ax ? x : y;
    if ((ax || ay) > 0 ? f > stopAt : f < stopAt) return true;
    if (boxHit(x, y)) return false;
  }
  return false;
}
let skipped = 0, worstK = 0;
const res = [], fails = [];
let tries = 0;
// three walkers: all shoes (the fastest), no shoes (P_SPEED), no shoes with the stick pushed half way
const SHOES = UNLOCKS.filter(u => /^shoes/.test(u.id)).map(u => u.id);
let CFG = '', MAG = 1;
for (const [cfg, shoes, mag] of [['shoes4', true, 1], ['no shoes', false, 1], ['no shoes, half stick', false, .5]]) {
  CFG = cfg; MAG = mag; for (const id of SHOES) S.unlocked[id] = shoes;
  for (const d of DOORS) {
    const [tx, ty] = d.at; if (!doorOpen(tx, ty)) { errs.push('door ' + tx + ',' + ty + ' closed with everything bought'); continue; }
    const horiz = walkable(tx - 1, ty) && walkable(tx + 1, ty);   // passage runs along x (a door in a vertical wall)
    const vert = walkable(tx, ty - 1) && walkable(tx, ty + 1);
    const axes = []; if (horiz) axes.push([1, 0], [-1, 0]); if (vert) axes.push([0, 1], [0, -1]);
    if (!axes.length) { errs.push('door ' + tx + ',' + ty + ': no straight passage through it'); continue; }
    for (const [ax, ay] of axes) {
      // start 2 tiles before the door (1.5 if that tile is blocked), on the approach side; goal: the tile past the door
      const lx = ay ? 1 : 0, ly = ax ? 1 : 0;   // lateral unit
      let back = 2; if (!walkable(tx - ax * 2, ty - ay * 2)) back = 1;
      const sx = tcx([tx, ty]) - ax * back * TILE, sy = tcy([tx, ty]) - ay * back * TILE;
      const past = () => { const [px, py] = tileOf(P); return px === tx + ax && py === ty + ay; };
      let worst = 0, n = 0, bad = [];
      for (let o = -7; o <= 7; o++) {
        // straight: start o px off the door's line, push along the passage; aimed: push at the door's centre from there;
        // diag35 (both sides): push 35 deg off the passage from a start whose straight line meets the wall o px off centre
        const runs = [], x0 = sx + lx * o, y0 = sy + ly * o, toC = [tcx([tx, ty]) - x0, tcy([tx, ty]) - y0], l = Math.hypot(toC[0], toC[1]);
        runs.push(['straight', x0, y0, { x: ax, y: ay }], ['aimed', x0, y0, { x: toC[0] / l, y: toC[1] / l }]);
        for (const deg of [10, 20, 30, 35, 40]) for (const side of [1, -1]) {
          const a = deg * Math.PI / 180, dl = back * TILE * Math.tan(a);   // lateral travel before the wall
          runs.push(['diag' + deg + (side > 0 ? '+' : '-'), sx + lx * (o - side * dl), sy + ly * (o - side * dl), { x: ax * Math.cos(a) + lx * side * Math.sin(a), y: ay * Math.cos(a) + ly * side * Math.sin(a) }]);
        }
        for (const [kind, px, py, v] of runs) {
          if (!clearLine(px, py, v, tx, ty, ax, ay)) { skipped++; continue; }   // furniture / a wall between the start and the door: not this door's approach
          Object.assign(P, { x: px, y: py, dir: 'down' }); tries++;
          const lim = .3 + 1.6 * (Math.hypot(P.x - tcx([tx + ax, ty + ay]), P.y - tcy([tx + ax, ty + ay])) / (playerSpeed() * MAG));   // 1.6x the straight walk + 0.3 s
          const t = walk({ x: v.x * MAG, y: v.y * MAG }, lim, past); n++;
          if (t !== null) worstK = Math.max(worstK, t / (lim - .3) * 1.6);
          if (t === null) bad.push(kind + "@" + o + (typeof DBG !== "undefined" ? "[" + R(px) + "," + R(py) + "->" + P.x.toFixed(1) + "," + P.y.toFixed(1) + "]" : "")); else worst = Math.max(worst, t);
        }
      }
      res.push({ door: tx + ',' + ty + (d.room ? ' ' + d.room : ' ' + d.kind), dir: ax + ',' + ay, n, worst, bad });
      if (bad.length) fails.push(`[${CFG}] door ${tx},${ty} ${d.room || d.kind} going ${ax},${ay}: stuck ${bad.length}/${n} (${bad.slice(0, 8).join(' ')}${bad.length > 8 ? ' ...' : ''})`);
    }
  }
}
for (const id of SHOES) S.unlocked[id] = true;
// ---- at the wall beside a door, pushing 30 deg off straight-in with the stick leaning AWAY from the door (the slide
// would carry you past it): within 8 px of lining up you are pulled into the doorway (door magnetism)
let faceN = 0;
for (const d of DOORS) {
  const [tx, ty] = d.at;
  for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!walkable(tx - ax, ty - ay) || !walkable(tx + ax, ty + ay)) continue;
    const lx = ay ? 1 : 0, ly = ax ? 1 : 0, bad = [];
    for (let o = -8; o <= 8; o++) {
      // the box against the door's wall line, o px off the door tile's centre
      const startX = ax > 0 ? tx * TILE - 4.01 : ax < 0 ? (tx + 1) * TILE + 4 : tcx([tx, ty]) + o, startY = ay > 0 ? ty * TILE - 1.01 : ay < 0 ? (ty + 1) * TILE + 4 : tcy([tx, ty]) + o;
      if (boxHit(startX, startY)) continue;
      const away = Math.sign(o) || 1, a = 30 * Math.PI / 180;
      const v = { x: ax * Math.cos(a) + lx * away * Math.sin(a), y: ay * Math.cos(a) + ly * away * Math.sin(a) };
      Object.assign(P, { x: startX, y: startY }); faceN++;
      const t = walk(v, .3 + 1.6 * 24 / playerSpeed(), () => { const [qx, qy] = tileOf(P); return qx === tx + ax && qy === ty + ay; });
      if (t === null) bad.push(o);
    }
    if (bad.length) errs.push(`wall face: door ${tx},${ty} ${d.room || d.kind} going ${ax},${ay} leaning away: stuck at offsets ${bad.join(' ')}`);
  }
}
for (const f of fails) errs.push(f);
// ---- walking past doors along the wall: not pulled in
let pulled = [], passN = 0;
for (const d of DOORS) {
  const [tx, ty] = d.at;
  for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    // the wall runs across (ax, ay); you walk along it on the side (tx - ax, ty - ay), hugging the wall
    const fx = tx - ax, fy = ty - ay; if (!walkable(fx, fy)) continue;
    if (walkable(tx + ay, ty + ax) || walkable(tx - ay, ty - ax)) continue;   // a gap in a wall only (both neighbours along the wall blocked)
    const lx = ay ? 1 : 0, ly = ax ? 1 : 0;
    for (const dir of [1, -1]) {
      // start 2 tiles before the door along the wall, foot box touching the wall
      const sxT = fx - lx * dir * 2, syT = fy - ly * dir * 2, exT = fx + lx * dir * 2, eyT = fy + ly * dir * 2;
      if (!walkable(sxT, syT) || !walkable(exT, eyT) || !walkable(fx - lx * dir, fy - ly * dir) || !walkable(fx + lx * dir, fy + ly * dir)) continue;
      // foot box x-4..x+4, y-4..y+1: pushed against the wall
      const x0 = ax > 0 ? tx * TILE - 4.01 : ax < 0 ? fx * TILE + 4 : tcx([sxT, syT]), y0 = ay > 0 ? ty * TILE - 1.01 : ay < 0 ? fy * TILE + 4 : tcy([sxT, syT]);
      if (boxHit(x0, y0)) continue;
      for (const [kind, k] of [['straight', 0], ['away10', -Math.sin(.17)]]) {
        Object.assign(P, { x: x0, y: y0, dir: 'down' }); passN++;
        const v = { x: lx * dir * Math.cos(.17 * (k ? 1 : 0)) + ax * k, y: ly * dir * Math.cos(.17 * (k ? 1 : 0)) + ay * k };
        let inDoor = false;
        const t = walk(v, 1.6, () => { const [px, py] = tileOf(P); if (px === tx && py === ty) inDoor = true; return Math.hypot(P.x - tcx([exT, eyT]), P.y - tcy([exT, eyT])) < 9 || inDoor; });
        if (inDoor || t === null) pulled.push(`${tx},${ty} ${d.room || d.kind} along ${lx * dir},${ly * dir} ${kind}: ${inDoor ? 'pulled into the door' : 'did not get past (' + R(P.x) + ',' + R(P.y) + ')'}`);
      }
    }
  }
}
for (const p of pulled) errs.push('walk-past: ' + p);
ok(passN >= 40, 'walk-past cases ' + passN);
ok(clip === 0, 'foot box never in a blocked tile (' + clip + ' frames)');
const worst = res.reduce((a, r) => Math.max(a, r.worst), 0), stuck = res.reduce((a, r) => a + r.bad.length, 0);
console.log(`doors ${DOORS.length}, passages ${res.length}, runs ${tries} (${skipped} starts skipped: something in the way): stuck ${stuck}, slowest ${worst.toFixed(2)} s, slowest vs a straight walk x${worstK.toFixed(2)} (limit x1.6 + 0.3 s); wall-face runs ${faceN}; walk-past runs ${passN}: pulled / blocked ${pulled.length}`);
console.log(errs.length ? 'DOOR CHECK FAIL\n  ' + errs.slice(0, 40).join('\n  ') + (errs.length > 40 ? '\n  ... ' + (errs.length - 40) + ' more' : '') : 'DOOR CHECK OK');
if (errs.length) process.exitCode = 1;
