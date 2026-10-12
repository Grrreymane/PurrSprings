// ============================================================ pathfinding (BFS) + movement / collision
const BLOCK = new Uint8Array(MW * MH);   // 1 = can't walk (walls, closed doors, locked block-areas, furniture)
let OBJS = [];                           // props, rebuilt on unlock
// props (2.4 / 2.5): at = top-left tile of the footprint (fw x fh), drawn with the anchor at the footprint's bottom-left.
// need: unlock id | () => bool. block: false = walk-over. ground: drawn flat under everyone (no y-sort).
const lampLit = () => dayLight().night > .5;
const PROPS = [
  { k: 'desk', at: [12, 25], fw: 3, img: () => deskArt() },
  { k: 'plant', at: [11, 23], img: () => plantArt('pot') },
  { k: 'bonsai', at: [23, 28], img: () => plantArt('bonsai') },
  { k: 'bench', at: [19, 23], fw: 2, img: () => benchArt() },
  { k: 'toro', at: [13, 31], img: () => toroArt() }, { k: 'toro', at: [21, 32], img: () => toroArt() },
  { k: 'sign', at: [20, 30], fw: 2, img: () => signArt(star() >= 5) },
  { k: 'shelf', at: [22, 23], fw: 2, need: 'onsen', img: () => shelfArt() },
  { k: 'basket', at: [15, 5], need: 'onsen', img: () => basketArt(S.basket, BASKET_MAX) },
  { k: 'milk', at: [22, 4], need: 'milk', img: () => milkArt(Math.floor(T * 1.25) & 1) },
  { k: 'urn', at: [11, 24], need: 'tea', img: () => urnArt() },
  // shop (west of the front garden)
  { k: 'display', at: [1, 30], fw: 4, need: 'shop', img: () => displayShelfArt() },
  { k: 'counter', at: [6, 31], fw: 2, need: 'shop', img: () => shopCounterArt() },
  { k: 'curtain', at: [5, 33], fw: 4, need: () => !!S.unlocked.shop && star() < 5, ground: true, block: false, img: () => curtainArt() },
  { k: 'mirror', at: [1, 33], uid: 'boutique', need: () => !!S.unlocked.shop && star() >= 5, img: () => mirrorArt() },
  { k: 'petcushion', at: [8, 34], uid: 'boutique', need: () => !!S.unlocked.shop && star() >= 5, ground: true, block: false, img: () => petCushionArt() },
  { k: 'statue', at: [11, 33], fw: 2, fh: 2, uid: () => S.unlocked.statue ? 'statue' : 'boutique', need: () => star() >= 5 && !!S.unlocked.shop, img: () => S.unlocked.statue ? statueArt('gold', 1) : statueArt('covered', clamp((S.paid.statue || 0) / UNLOCK.statue.price, 0, 1)) },
  // dining + kitchen
  { k: 'stove', at: [2, 19], fw: 2, need: 'dining', img: () => stoveArt(stoveBusy() ? Math.floor(T * 2) & 1 : 0) },   // fire + steam only while cooking
  { k: 'ricepot', at: [4, 19], need: 'dining', img: () => ricePotArt(stoveBusy() ? Math.floor(T * 1.5) & 1 : 0) },
  { k: 'pass', at: [2, 21], fw: 3, need: 'dining', img: () => passArt(PASS.n) },
  { k: 'dtable', at: [3, 23], need: 'dining', img: () => dTableArt(tableState(0)) }, { k: 'dtable', at: [7, 23], need: 'dining', img: () => dTableArt(tableState(1)) },
  { k: 'dtable', at: [3, 26], need: 'table3', img: () => dTableArt(tableState(2)) }, { k: 'dtable', at: [7, 26], need: 'table4', img: () => dTableArt(tableState(3)) },
  // garden
  { k: 'urn', at: [26, 25], need: 'garden', img: () => urnArt() },
  { k: 'shishi', at: [26, 16], need: 'g_shishi', img: () => shishiArt(T % 20 >= .3 && T % 20 < .9 ? 1 : 0) },   // tips over every 20 s (in step with the audio's knock)
  { k: 'tree', at: [38, 9], need: 'garden', img: () => treeArt('pine', seasonNow()) },   // v2.1: the season's tree
  { k: 'yukimi', at: [31, 17], need: 'garden', img: () => yukimiArt() },
  { k: 'rock', at: [35, 16], need: 'garden', img: () => rockArt(0) }, { k: 'rock', at: [37, 17], need: 'garden', img: () => rockArt(1) },
  { k: 'lamp', at: [33, 18], need: 'garden', img: () => gardenLampArt(lampLit()) }, { k: 'lamp', at: [26, 27], need: 'garden', img: () => gardenLampArt(lampLit()) },
  { k: 'lamp', at: [33, 24], need: 'garden', img: () => gardenLampArt(lampLit()) },
  // roten deck
  // deck lanterns 4 tiles either side of the hedge gap (stage M: at the deck's ends (25,7) / (38,7) no view ever showed them)
  { k: 'deckLantern', at: [28, 7], need: 'roten', img: () => deckLanternArt(lampLit()) }, { k: 'deckLantern', at: [36, 7], need: 'roten', img: () => deckLanternArt(lampLit()) },
  // v2.0.1 art scenery (data/map.js SCENERY): the sakura / maple groves (A2), the roten's bamboo lanterns, the lower garden (A3)
  ...SCENERY,
  ...PROPS_V21B,   // v2.1 core B (data/tables-v21b.js): the shrine by level, the garden pieces, the plaza's stalls
];
const propOn = p => !p.need || (typeof p.need === 'function' ? p.need() : !!S.unlocked[p.need]);
function buildObjects() {
  const L = [], add = (o, uid) => L.push(Object.assign({ fw: 1, fh: 1, block: true, ground: false }, o, { tx: o.at[0], ty: o.at[1], uid: uid || (typeof o.uid === 'function' ? o.uid() : o.uid) || (typeof o.need === 'string' ? o.need : null) }));
  for (const p of PROPS) if (propOn(p)) add(p);
  for (const rm of ROOMS) if (roomOpen(rm)) {
    add({ k: 'andon', at: rm.andon, img: () => andonArt(rm.furn) }, rm.id + ':a');   // furn 'west': lamp + tea table (map.js ROOM_LOOK)
    add({ k: 'table', at: rm.table, img: () => tableArt(rm.furn) }, rm.id + ':t');
    if (rm.tub) add({ k: 'tub', at: rm.tub, img: () => tubArt(tubBusy(rm) ? Math.floor(T * 1.5) & 1 : 2) }, rm.id + ':u');
  }
  OBJS = L;
}
function buildBlock() {
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const c = MAP[ty][tx];
    BLOCK[ty * MW + tx] = c === 'D' ? (doorOpen(tx, ty) ? 0 : 1) : WALK_CH.has(c) ? 0 : 1;
  }
  for (const a of AREAS) if (a.lock === 'block' && !areaOpen(a)) for (let y = a.r[1]; y <= a.r[3]; y++) for (let x = a.r[0]; x <= a.r[2]; x++) BLOCK[y * MW + x] = 1;
  for (const o of OBJS) if (o.block) for (let j = 0; j < o.fh; j++) for (let i = 0; i < o.fw; i++) BLOCK[(o.ty + j) * MW + o.tx + i] = 1;
}
const walkable = (tx, ty) => tx >= 0 && ty >= 0 && tx < MW && ty < MH && !BLOCK[ty * MW + tx];
const QBUF = new Int16Array(MW * MH), PREV = new Int16Array(MW * MH);
// BFS over the 1,440 tiles; returns [[tx,ty], ...] from the step after the start to the goal ([] if already there, null if unreachable)
function findPath(tx0, ty0, tx1, ty1) {
  if (tx0 < 0 || ty0 < 0 || tx0 >= MW || ty0 >= MH || !walkable(tx1, ty1)) return null;
  const s = ty0 * MW + tx0, t = ty1 * MW + tx1;
  if (s === t) return [];
  PREV.fill(-1); PREV[s] = s;
  let h = 0, q = 0; QBUF[q++] = s;
  while (h < q) {
    const c = QBUF[h++]; if (c === t) break;
    const cx = c % MW, cy = (c / MW) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const n = ny * MW + nx;
      if (PREV[n] < 0 && !BLOCK[n]) { PREV[n] = c; QBUF[q++] = n; }
    }
  }
  if (PREV[t] < 0) return null;
  const out = []; for (let c = t; c !== s; c = PREV[c]) out.push([c % MW, (c / MW) | 0]);
  return out.reverse();
}
const tileOf = e => [clamp(Math.floor(e.x / TILE), 0, MW - 1), clamp(Math.floor(e.y / TILE), 0, MH - 1)];
// NPC walking: path of pixel waypoints (tile centres), re-planned when the goal changes (or every 0.5 s while lost:
// a door it waits behind may open)
function goTo(e, tx, ty, extra) {
  if (e.goal && e.goal[0] === tx && e.goal[1] === ty && (!e.lost || T - (e.planT || 0) < .5)) return;
  const [sx, sy] = tileOf(e), p = findPath(sx, sy, tx, ty);
  e.path = (p || []).map(([x, y]) => [x * TILE + 8, y * TILE + 8]);
  if (p && p.length === 0 && dist(e.x, e.y, tx * TILE + 8, ty * TILE + 8) > .5) e.path.push([tx * TILE + 8, ty * TILE + 8]);
  if (extra) e.path.push(extra);
  e.goal = [tx, ty]; e.lost = !p; e.planT = T;
}
function stepPath(e, dt, spd) {
  let rem = spd * dt; const moving = e.path.length > 0;
  while (rem > 0 && e.path.length) {
    const [nx, ny] = e.path[0], dx = nx - e.x, dy = ny - e.y, d = Math.hypot(dx, dy);
    if (d > .01) e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    if (d <= rem) { e.x = nx; e.y = ny; rem -= d; e.path.shift(); }
    else { e.x += dx / d * rem; e.y += dy / d * rem; rem = 0; }
  }
  e.moving = moving; if (moving) e.walkT += dt;
  return e.path.length === 0 && !e.lost;
}
// player: 8x5 foot box (x-4..x+4, y-4..y+1), axis-separated moves so walls can be slid along
function boxHit(x, y) {
  const x0 = Math.floor((x - 4) / TILE), x1 = Math.floor((x + 3.999) / TILE), y0 = Math.floor((y - 4) / TILE), y1 = Math.floor((y + .999) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!walkable(tx, ty)) return true;
  return false;
}
// Door magnetism / corner rounding (18.2, "the doorways are tiny, I get stuck"): blocked while pushing mostly (within ~45 deg) into a
// wall or furniture, with a free lane - a door, a gate, a gap - within LANE_R px sideways that the box can slide to:
// slide toward it at walking speed instead of stopping (the nearest lane; on a tie the side the stick leans to). The
// stick's own sideways part is dropped while it pulls the other way. Pushing along a wall (more than 45 deg off it) never
// pulls you into a doorway you pass.
const LANE_R = 8, LANE_K = .7;   // sideways reach (px); how much of the push must point into the wall (cos 45 deg)
function laneOff(e, axis, step, lean) {
  for (let k = 1; k <= LANE_R; k++) for (const s of lean < 0 ? [-1, 1] : [1, -1]) {
    const o = s * k;
    if (axis === 'x' ? boxHit(e.x + step, e.y + o) || boxHit(e.x, e.y + o) : boxHit(e.x + o, e.y + step) || boxHit(e.x + o, e.y)) continue;
    let clear = true;   // the slide over there is free all the way
    for (let j = 1; j < k && clear; j++) if (axis === 'x' ? boxHit(e.x, e.y + s * j) : boxHit(e.x + s * j, e.y)) clear = false;
    if (clear) return o;
  }
  return 0;
}
// moves the box by (dx, dy) in <= 1 px sub-steps, axis by axis (so walls can be slid along); the pushed-into axis first
function moveBox(e, dx, dy) {
  const len = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const sx = dx / n, sy = dy / n, step = len / n, xFirst = Math.abs(dx) >= Math.abs(dy);
  for (let i = 0; i < n; i++) {
    let skipX = false, skipY = false;
    for (const axis of xFirst ? ['x', 'y'] : ['y', 'x']) {
      if (axis === 'x') {
        if (!sx || skipX) continue;
        if (!boxHit(e.x + sx, e.y)) { e.x += sx; continue; }
        if (Math.abs(dx) < len * LANE_K) continue;
        const o = laneOff(e, 'x', sx, sy); if (!o) continue;
        e.y += Math.sign(o) * Math.min(Math.abs(o), step); skipY = true;
      } else {
        if (!sy || skipY) continue;
        if (!boxHit(e.x, e.y + sy)) { e.y += sy; continue; }
        if (Math.abs(dy) < len * LANE_K) continue;
        const o = laneOff(e, 'y', sy, sx); if (!o) continue;
        e.x += Math.sign(o) * Math.min(Math.abs(o), step); skipX = true;
      }
    }
  }
}
// something popped up under the player (a table on its own pad): step to the nearest free spot
function unstick(e) {
  if (!boxHit(e.x, e.y)) return;
  for (let r = 1; r <= 24; r++) for (let a = 0; a < 16; a++) {
    const x = e.x + Math.cos(a / 16 * Math.PI * 2) * r, y = e.y + Math.sin(a / 16 * Math.PI * 2) * r;
    if (!boxHit(x, y)) { e.x = x; e.y = y; return; }
  }
}
