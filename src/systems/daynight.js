// ============================================================ day / night (4.10)
// One day = DAY_LEN (6 min); S.clock only runs while you play (not under the star-5 celebration; stage 3: not in the
// menu). Sunrise (the clock passes 0.10) starts the next day: a banner with yesterday's guests / hearts (+ a trophy on a
// new record), the receptionist's good-morning line (S03), birdsong. Dusk (0.68): the far temple bell. Night only brings
// good things (the star-view bath pays x1.8); the light pass (drawLighting) tints the world and lights the lamps.
function dayTick(dt) {
  const c0 = S.clock, c1 = (c0 + dt / DAY_LEN) % 1; S.clock = c1;
  const wrap = c1 < c0, crossed = a => wrap ? (a > c0 || a <= c1) : (a > c0 && a <= c1);
  if (crossed(DUSK_AT)) sfx('dusk');
  if (crossed(DAWN_AT)) newDay();
}
function newDay() {
  const g0 = S.dayLog.g, h0 = S.dayLog.h, rec = S.dayLog.best > 0 && g0 > S.dayLog.best;
  S.dayLog.best = Math.max(S.dayLog.best, g0); S.day++; S.dayLog.g = 0; S.dayLog.h = 0;
  banner('day', S.day, { g: g0, h: h0, rec }); sfx('dawn'); RUN.days++; news('day');
  const rc = STAFF.find(s => s.role === 'recep'); if (rc) lineSay(rc, 'S03');
  markDirty();
}
// lamps for the light pass, rebuilt with the world: x, y = the flame (px), r = glow radius (glowArt: 10 / 18 / 24 / 28).
// Every open room's andon glows r10 when empty and r18 with someone in it (at night you see which rooms are taken). The
// west wing's corridor stays dark (the quiet rooms).
const LIGHTS = [], LAMP_COL = '#ffd890', FIRE_COL = '#ff9a48', DECK_COL = '#ffb070';
let LIGHT_N = 0;   // lamps drawn in the last light pass (tests: <= LIGHT_MAX)
function buildLights() {
  LIGHTS.length = 0;
  const add = (tx, ty, r, dy, col, room) => LIGHTS.push({ x: tx * TILE + 8, y: ty * TILE + (dy === undefined ? 8 : dy), r, col: col || LAMP_COL, room: room || null });
  add(14, 23, 28); add(20, 23, 28);                              // lobby
  for (const y of [9, 13, 17, 21]) add(17, y, 18);                // main corridor
  add(13, 31, 18, -1); add(21, 32, 18, -1);                       // stone lanterns at the door (the light box sits high)
  add(17, 29, 28, 2);                                             // the entrance noren
  if (S.unlocked.onsen) { add(12, 1, 18); add(22, 1, 18); }        // onsen stone lamps
  if (S.unlocked.dining) { add(4, 24, 18); add(7, 24, 18); add(3, 19, 10, 12, FIRE_COL); }   // dining lamps, the stove's fire
  if (S.unlocked.garden) { add(33, 18, 18, -3); add(26, 27, 18, -3); add(33, 24, 18, -3); add(26, 10, 18); add(31, 17, 18, 4); }   // path lamps, wall lamp, snow lantern
  if (S.unlocked.roten) { add(28, 7, 18, 0, DECK_COL); add(36, 7, 18, 0, DECK_COL); }        // star-view deck lanterns
  for (const rm of ROOMS) if (roomOpen(rm)) add(rm.andon[0], rm.andon[1], 10, 6, LAMP_COL, rm);
}
const roomBusy = rm => rm.vip ? !!RT[rm.id].guest : S.rooms[rm.id] === 'occupied';
const lightR = L => L.room ? (roomBusy(L.room) ? 18 : 10) : L.r;
// the stars mirrored in the star-view bath at night: 10 fixed spots on the water, each fading in and out slowly (<= .5 Hz)
const STAR_SPOTS = Array.from({ length: 10 }, (_, i) => ({ x: 27 * TILE + 3 + (i * 37) % 170, y: 2 * TILE + 3 + (i * 7) % 11, f: .18 + (i % 4) * .07, ph: i * 1.7 }));
