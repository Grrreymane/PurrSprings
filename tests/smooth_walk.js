// 18.2 "走起路来卡卡的": walking must look even on a phone. The innkeeper walks for 4 s (60 fps, the stick held) along the
// lobby -> garden row and up the main corridor, rendered every frame at K = 3 and K = 4.33 device px per logical px.
// From the draw calls that reach the screen canvas we read, every frame, the device-pixel position of
//   - the innkeeper (his own layer, or his sprite in the world canvas in the old one-layer render), and
//   - a fixed point of the world (where the world canvas lands + that point's place in it),
// and check that both advance evenly: the per-frame steps of each differ by at most 1 device px (the old render stepped
// 1, 1, 2 logical px = K device px apart), and the innkeeper stays on one device pixel (+-1) while the camera follows him.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/smooth_walk.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 60, NEW = typeof lowW !== 'undefined';
S = defaults(); for (const id of ['room2', 'room3', 'onsen', 'garden']) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
S.peak = starOf(S); S.tut.moved = true; S.done = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; GUESTS.length = 0;
const sctx = cv.getContext('2d'), _di = sctx.drawImage;
let shots = [];
sctx.drawImage = function (c, ...a) { shots.push([c, a.length === 8 ? a[4] : a[0], a.length === 8 ? a[5] : a[1]]); };
let pSprite = null;   // old render: where the innkeeper's sprite went in the world canvas
const _dc = drawCat; drawCat = function (e, look, ox) { if (e === P && !NEW) pSprite = [R(e.x) + (ox || 0) - CX - 8, R(e.y) - CY - 23]; return _dc(e, look, ox); };
function walkRun(k, x0, y0, v, label) {
  K = k; Object.assign(P, { x: x0, y: y0, dir: 'down' }); updCam(0, true);
  for (let i = 0; i < 20; i++) { update(DT); render(); }   // settle (the arrow, the camera)
  Object.assign(P, { x: x0, y: y0 }); updCam(0, true);
  const pl = [], wd = [], cams = [];
  botMove = v;
  for (let i = 0; i < 240; i++) {
    shots = []; update(DT); render();
    let px, py, wx, wy;
    if (NEW) {
      const w = shots.find(s => s[0] === lowW), p = shots.find(s => s[0] === lowP);
      // world point (fixed world px 0,0 - its device position = where lowW lands + (0 - CX + WM) * K)
      wx = w[1] + (0 - R(cam.x) + WM) * K; wy = w[2] + (0 - R(cam.y) + WM) * K; px = p[1]; py = p[2];
    } else {
      wx = (0 - R(cam.x)) * K; wy = (0 - R(cam.y)) * K; px = pSprite[0] * K; py = pSprite[1] * K;
    }
    pl.push([Math.round(px), Math.round(py)]); wd.push([Math.round(wx), Math.round(wy)]);
    { const tx = P.x - W / 2, ty = P.y - H / 2 - 8; cams.push(Math.abs(v.x) > Math.abs(v.y) ? tx > 0 && tx < MAPW - W : ty > camTopB() && ty < MAPH - H + camBotB()); }   // along the walk, the camera's target is not held at the map's edge
  }
  botMove = null;
  // only while the camera's target is not held at the map's edge (a fast run up the corridor reaches the map's top edge, where it stops)
  const keep = cams.map((c, i) => i >= 10 && c && cams[i - 1]);
  const steps = a => a.slice(1).map((q, i) => [q[0] - a[i][0], q[1] - a[i][1]]).filter((_, i) => keep[i + 1]);
  const axis = Math.abs(v.x) > Math.abs(v.y) ? 0 : 1;
  const ws = steps(wd).map(s => s[axis]), ps = steps(pl).map(s => s[axis]);
  const spread = a => Math.max(...a) - Math.min(...a);
  const hist = a => { const h = {}; for (const x of a) h[x] = (h[x] || 0) + 1; return Object.entries(h).sort((p, q) => q[1] - p[1]).map(([s, n]) => s + ':' + n).join(' '); };
  const pPos = pl.filter((_, i) => keep[i]).map(q => q[axis]);
  ok(ws.length >= 100, `${label}: ${ws.length} locked frames (want >= 100)`);
  console.log(`${label} K=${k.toFixed(2)}: world steps {${hist(ws)}} spread ${spread(ws)} | innkeeper steps {${hist(ps)}} spread ${spread(ps)}, screen pos ${Math.min(...pPos)}..${Math.max(...pPos)} (${ws.length} frames) | first world steps ${ws.slice(0, 12).join(',')}`);
  ok(spread(ws) <= 1, `${label} K=${k.toFixed(2)}: world scroll steps spread ${spread(ws)} device px (want <= 1)`);
  ok(spread(ps) <= 1, `${label} K=${k.toFixed(2)}: innkeeper steps spread ${spread(ps)} device px (want <= 1)`);
  ok(spread(pPos) <= 1, `${label} K=${k.toFixed(2)}: innkeeper screen position wanders ${spread(pPos)} device px while the camera follows (want <= 1)`);
}
for (const shoes of [false, true]) {   // P_SPEED 56 px/s (0.93 px a frame) and all four shoes (1.49 px a frame)
  for (const id of ['shoes1', 'shoes2', 'shoes3', 'shoes4']) S.unlocked[id] = shoes;
  const sp = ' ' + playerSpeed().toFixed(0) + ' px/s';
  for (const k of [3, 13 / 3]) {
    walkRun(k, 11 * TILE + 8, 26 * TILE + 8, { x: 1, y: 0 }, 'lobby -> garden (right)' + sp);
    walkRun(k, 17 * TILE + 8, 26 * TILE + 8, { x: 0, y: -1 }, 'lobby -> corridor (up)' + sp);
  }
}
sctx.drawImage = _di; drawCat = _dc; K = 1;
console.log(errs.length ? 'SMOOTH WALK FAIL\n  ' + errs.join('\n  ') : 'SMOOTH WALK OK');
if (errs.length) process.exitCode = 1;
