// ============================================================ v2.1 seasonal festivals (SPEC_v2 16.2)
// From star 3, on the 2nd day of every season at dusk (clock .62) for 72 s: 花见祭 / 烟花大会 / 月见祭 / 新年初诣.
// Meanwhile guests come 1.3x as often (spawnGap() / festSpawnK()) and wait 20 s longer in line, lantern strings hang over
// the front door and along the lobby wall, the music is 'fest' (audioTick). The lantern progress on the HUD's second row:
// every check-in lights one (core B's stalls: festLantern(1) a sale, festTargetExtra() +6); the goal is
// ceil(1.4 x open guest rooms). All lit when it ends: a gold banner, hearts +40, a medal (S.medals) and a red packet
// round(30 x room fee x Q) in the cash box. Not all lit: "明年再来！" and nothing else - a festival is a treat, never a
// penalty, and never a new chore (the arrow does nothing special for it). The season's first festival (lit or not) puts
// its two seasonal decor pieces on sale for good (S.fests). Summer: fireworks over the onsen and the front door, <= 2
// new bursts a second, radius <= 16, alpha .6, no white, no screen flash. Saved: S.fest = { s: the absolute season of
// the last one (0: none yet - a new game's first spring has none: nobody is at star 3 by then), n, goal, end } so a
// load during the 72 s carries on with its lanterns; S.fests[season] = how many of that season's were held.
const FEST = { on: false, boomK: -1 };   // runtime: a festival is on (S.fest has its numbers); the last firework slot heard
const festHeld = s => !!S && (S.fests[s] | 0) > 0;
function festTargetExtra() { return S.unlocked.plaza && stallsOwned().length ? FEST_STALLS : 0; }   // core B (16.9): stalls add 6 lanterns (a sale lights one: plaza.js)
const festGoal = () => Math.ceil(FEST_LANTERN * guestRoomsOpen()) + festTargetExtra();
const festSpawnK = () => FEST.on ? FEST_SPAWN : 1;
const festWindow = () => seasonDay(S.day) === 1 && S.clock >= FEST_AT && S.clock < FEST_AT + FEST_T / DAY_LEN;
SEEN_KEYS.push('fest');   // the first festival's picture card: [bell] -> [lantern] 入住点灯 (cards.js FIRST_CARD.fest)
function festTick() {
  const as = absSeason(S.day), win = festWindow();
  if (!FEST.on) {
    if (win && S.fest.s === as && !S.fest.end) { FEST.on = true; return; }   // a load during the festival: go on with its lanterns
    if (win && S.fest.s < as && star() >= FEST_STAR) festStart(as);
  } else if (!win || S.fest.s !== as) festEnd();
}
function festStart(as) {
  S.fest = { s: as, n: 0, goal: festGoal(), end: false }; FEST.on = true; FEST.boomK = -1;
  for (const gu of GUESTS) gu.v21in = gu.v21in || gu.inside;   // only guests walking in from now on say "祭典来啦！"
  banner('fest', seasonNow()); firstTime('fest'); news('fest'); markDirty();
}
// a check-in (or, core B, a stall sale): one more lantern; all lit = the gold rim on the HUD string (the reward comes at the end)
function festLantern(n) {
  if (!FEST.on) return;
  const was = S.fest.n; S.fest.n += n | 0; firstDone('fest'); markDirty();
  if (was < S.fest.goal && S.fest.n >= S.fest.goal) { sfx('levelup'); pop('祭典！', P.x, P.y - 40, '#ffd23f', 8, 1.4); }
}
function festEnd() {
  FEST.on = false;
  if (S.fest.end) return;
  S.fest.end = true;
  const s = seasonOf(S.fest.s * SEASON_DAYS + 1), first = !festHeld(s), y = yearOf(S.fest.s * SEASON_DAYS + 1);
  S.fests[s] = (S.fests[s] | 0) + 1;
  if (S.fest.n >= S.fest.goal) {
    const red = R(FEST_RED * STARS[star()].room * qualityQ());
    S.piles.recep = (S.piles.recep || 0) + red; S.medals.push({ s, y }); if (S.medals.length > 40) S.medals.shift();
    banner('festok', s, { red }); sfx('gong'); addHearts(FEST_HEARTS); news('festok');
  } else banner('festno', s);
  if (first) { V21.e12 = HELLO_T; news('seasonal'); }   // the season's two pieces go on sale: the shop owner says so when you come by
  markDirty();
}
// ---- drawing: the lantern strings (on the walls, under the cats: drawWallV21a), their glow at night, the fireworks
const FEST_STRINGS = [[11, 25, 29 * TILE + 4], [11, 24, 22 * TILE + 4]];   // [first tile x, end tile x, y]: along the facade over the front door, along the lobby's north wall
function drawFestStrings() {
  const c = chochinString(dayLight().night > .4);   // lit after dusk
  for (const [x0, x1, y] of FEST_STRINGS) for (let x = x0 * TILE; x < x1 * TILE; x += c.width) {
    const w = Math.min(c.width, x1 * TILE - x); if (!VIS(x + w / 2, y + 5, 24)) continue;
    g.drawImage(c, 0, 0, w, c.height, x - CX, y - CY, w, c.height);
  }
}
function drawFestGlow() {
  if (!FEST.on) return;
  const nt = dayLight().night;
  if (nt > .05) {
    g.globalCompositeOperation = 'lighter'; const add = g.globalCompositeOperation === 'lighter';
    g.globalAlpha = nt * (add ? .3 : .12); if (!add) g.globalCompositeOperation = 'source-over';
    for (const [x0, x1, y] of FEST_STRINGS) for (let x = x0 * TILE + 16; x < x1 * TILE; x += 32) if (VIS(x, y + 6, 12)) drawA(glowArt(10, '#ffb070'), x, y + 6, 10, 10);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  if (seasonNow() === 1) drawFireworks();
}
// summer fireworks: one slot every 0.5 s (<= 2 bursts a second), each slot 80 % a burst, over the onsen or the front door;
// a rocket climbs 0.4 s, the burst opens to <= 16 px in 0.6 s and fades over 0.8 s; alpha <= .6, no white; a function of T
function drawFireworks() {
  const k1 = Math.floor(T * FIREWORK_MAX);
  for (let k = k1 - 2; k <= k1; k++) {
    if (_v21h(k, 7) >= .8) continue;
    const front = _v21h(k, 8) < .5, cx = 17 * TILE + 8 + (_v21h(k, 9) - .5) * 110, cy = (front ? 29 * TILE + 2 : 3 * TILE + 2) + (_v21h(k, 10) - .5) * 24;   // over the facade / the onsen water (merge fun check: over the rocks (row 1) they opened under the HUD)
    const age = T - k / FIREWORK_MAX - .4, col = FIREWORK_COLS[Math.floor(_v21h(k, 11) * FIREWORK_COLS.length)];
    if (age < -.4 || age > 1.4 || !VIS(cx, cy, FIREWORK_R + 34)) continue;
    if (age < 0) { const ry = cy + 30 * (-age / .4); g.globalAlpha = FIREWORK_A; g.fillStyle = col; g.fillRect(R(cx) - CX, R(ry) - CY, 1, 2); g.globalAlpha = FIREWORK_A * .5; g.fillRect(R(cx) - CX, R(ry) + 3 - CY, 1, 2); g.globalAlpha = 1; continue; }   // the rocket
    const p = Math.min(1, age / .6), r = FIREWORK_R * (1 - (1 - p) * (1 - p)), a = FIREWORK_A * (age < .6 ? 1 : 1 - (age - .6) / .8);
    if (k === k1 - 1 && FEST.boomK !== k && (k & 1) === 0) { FEST.boomK = k; sfx('firework'); }   // the soft "pop": <= 1 a second, only when you see it
    if (age < .5) {   // a soft coloured bloom where it opens (its own colour, never white; no screen flash)
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 * (1 - age / .5); drawA(glowArt(18, col), cx, cy, 18, 18); g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = a; g.fillStyle = col;
    for (let i = 0; i < 16; i++) {   // the outer ring: 2 x 2 stars, each with a short tail towards the centre
      const t = i / 16 * Math.PI * 2 + k, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * .85 + age * age * 4;
      g.fillRect(R(x) - CX, R(y) - CY, 2, 2);
      if (p > .2) { g.globalAlpha = a * .5; g.fillRect(R(cx + Math.cos(t) * r * .78) - CX, R(cy + Math.sin(t) * r * .66 + age * age * 4) - CY, 1, 1); g.globalAlpha = a; }
    }
    for (let i = 0; i < 9; i++) { const t = i / 9 * Math.PI * 2 + k * 2; g.fillRect(R(cx + Math.cos(t) * r * .5) - CX, R(cy + Math.sin(t) * r * .42) - CY, 1, 1); }
    g.globalAlpha = 1;
  }
}
