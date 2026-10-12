// ============================================================ v2.1 the four seasons (SPEC_v2 16.1) + core A's frame
// A season is 3 days, a year 4 seasons = 12 days (36 min of play since v2.3: a day is 3 min). The season is computed from S.day (nothing saved),
// so it changes at sunrise: the morning banner of that day becomes "夏天来了" (one banner, not two) and the static world
// is rebuilt once with the season's outdoor colours - tileArt(..., season) and treeArt(kind, season) (map.js /
// pathfinding.js / render-world.js pass seasonNow()). Slow, capped particles on outdoor tiles: petals <= 12 (spring),
// fireflies <= 8 in the garden on summer nights (each fades in and out over 1.5 s), leaves <= 10 (autumn), snow <= 20
// (winter, 1 / 2 px); they are pure functions of T and the camera (no Math.random: the seeded bots don't drift), drawn
// under the night tint (fireflies over it), never blinking. Seasonal fees (feeV21a, called from fee()): 花见亭 x1.3 in
// spring, 萤见亭 x1.3 and the milk machine x1.5 in summer, every bath x1.2 in winter, a seasonal combo room x2.0 in its
// own season. Autumn's 2nd night is a full moon: a big moon on the water (and the autumn festival is 月见祭 that night).
// Winter doubles the steam over the baths.
// Core A's v2.1 frame lives here too: v21aReset() (called by resetWorld), v21aTick() (gameUpdate), the HUD row-2 hook,
// the banner kinds (bannerV21a, from bannerParts) and the wall of the lobby (drawWallV21a, from drawScene).
const seasonOf = d => Math.floor((d - 1) / SEASON_DAYS) % 4;
const seasonNow = () => S ? seasonOf(S.day) : 0;
const seasonDay = d => (d - 1) % SEASON_DAYS;                 // 0 / 1 / 2: the day within its season
const absSeason = d => Math.floor((d - 1) / SEASON_DAYS);     // seasons since day 1 (0 = the first spring)
const yearOf = d => Math.floor((d - 1) / YEAR_DAYS) + 1;
// the 16.12 lines join the 8.2 table (same fields as lines.js builds)
LINES_V21A.forEach(([id, who, text, p, ev]) => { LINES[id] = { id, who, text, p, ev: !!ev }; });
// runtime (not saved): the day / season the world was last built for, the check-in counter (festival lanterns,
// "popular" hearts), the last guest seen (festival patience), line timers, the shop owner's "本季新品！" waiting to be heard
const V21 = { day: 0, season: 0, guests: 0, gid: 0, chatT: 0, e12: 0, warm: -1 };
function v21aReset() {
  Object.assign(V21, { day: S.day, season: seasonNow(), guests: S.stats.guests, gid: guestN, chatT: 0, e12: 0 });
  FEST.on = false; FEST.boomK = -1; PRESS.gu = null; MODAL_Q.length = 0;
}
function v21aTick(dt) {
  seasonTick();
  if (state === 'play') { festTick(dt); pressTick(dt); momTick(); yearTick(); seasonPrewarm(); }
  // check-ins since the last frame: a lantern each during a festival, hearts +1 each while "popular" (16.2 / 16.4)
  const ng = S.stats.guests - V21.guests; V21.guests = S.stats.guests;
  if (ng > 0) { if (FEST.on) festLantern(ng); if (S.popT > 0) addHearts(ng); }
  // guests who came in since the last frame: +20 s of patience during a festival
  for (const gu of GUESTS) if (gu.id > V21.gid) { if (FEST.on && !gu.press) gu.pat += FEST_PAT; }
  V21.gid = guestN;
  seasonLines(dt);
  modalPump();
}
// ---- the save fields (16.13), cleaned on load (loadState calls this last; never wipes anything else)
function loadV21a(s, raw) {
  const y = yearOf(s.day), Y = objOr(raw.year), arr = (v, f) => Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && f(x)).slice(-40) : [];
  // the year's starting totals; a save from before v2.1 starts its year at this load (its first report counts from here)
  s.year = raw.year && typeof raw.year === 'object' ? { g: int0(Y.g), e: int0(Y.e), h: int0(Y.h), combos: int0(Y.combos), n: clamp(int0(Y.n) || y, 1, y + 1) }
    : { g: s.stats.guests, e: s.earned, h: s.hearts, combos: Object.keys(s.combos).length, n: y };
  s.awards = arr(raw.awards, a => AWARDS.some(w => w.k === a.k)).map(a => ({ y: Math.max(1, int0(a.y)), k: a.k, h: int0(a.h) }));
  s.covers = arr(raw.covers, () => true).map(c => ({ d: Math.max(1, int0(c.d)), n: clamp(int0(c.n), 1, 5), tv: !!c.tv }));
  s.medals = arr(raw.medals, () => true).map(m => ({ s: int0(m.s) & 3, y: Math.max(1, int0(m.y)) }));
  s.mom = int0(raw.mom); s.momY = raw.momY === undefined ? 1 : int0(raw.momY);
  s.pressS = int0(raw.pressS);
  s.fests = [0, 1, 2, 3].map(i => int0(Array.isArray(raw.fests) ? raw.fests[i] : 0));
  const f = objOr(raw.fest); s.fest = { s: int0(f.s), n: int0(f.n), goal: Math.max(1, int0(f.goal)), end: raw.fest && typeof raw.fest === 'object' ? !!f.end : true };
  if (!s.fest.end) {   // left during a festival: it goes on only if this is still its 72 s, else it is over (held, no reward)
    const on = absSeason(s.day) === s.fest.s && seasonDay(s.day) === 1 && s.clock >= FEST_AT && s.clock < FEST_AT + FEST_T / DAY_LEN;
    if (!on) { s.fest.end = true; s.fests[seasonOf(s.fest.s * SEASON_DAYS + 1)]++; }
  }
  s.popT = clamp(Number.isFinite(+raw.popT) ? +raw.popT : 0, 0, POP_TV_T); s.popTV = !!raw.popTV && s.popT > 0;
}
// ---- the calendar
function seasonTick() {
  if (S.day === V21.day) return;
  const s0 = V21.season, s1 = seasonNow(), first = !V21.day; V21.day = S.day; V21.season = s1;
  if (s1 === s0 || first) return;
  // the morning banner of this day becomes the season's (one banner; a jump by a load / a test just adds it)
  const b = BANNER_Q.find(x => x.kind === 'day' && x.id === S.day && !x.age), o = { y: yearOf(S.day), t: T, age: 0 };
  if (b) { for (const k in b) delete b[k]; Object.assign(b, { kind: 'season', id: s1 }, o); } else banner('season', s1, o);
  rebuildWorld(); news('season'); markDirty();
}
// ---- 16.1 the seasonal fees: x this onto fee(k, o) (rooms / tips also take the "popular" boost of 16.4)
function feeV21a(k, o) {
  const s = seasonNow(); let m = 1;
  if (k === 'room') {
    const sr = SEASON_ROOM[s]; if (sr && o.rm && o.rm.id === sr.room) m *= sr.k;
    const c = o.rm ? roomCombo(o.rm) : null; if (c && c.season === s) m *= SEASON_COMBO / 1.6;   // roomMult() already gave x1.6
    if (S.popT > 0) m *= POP_K;
  } else if (k === 'tip') { if (S.popT > 0) m *= POP_K; }
  else if (k === 'bath') { if (s === 3) m *= WINTER_BATH; }
  else if (k === 'milk') { if (s === 1) m *= SUMMER_MILK; }
  return m;
}
// re-dress (decor.js redressOf, slot A of a room whose combo 2+ rooms share): the first piece of a seasonal combo the
// arrow may point at, never made, with both pieces bought and neither standing in any room yet (else null)
function seasonStart() {
  const placed = new Set(Object.values(S.decor));
  for (const c of COMBOS) if (c.season !== undefined && hinted(c) && !S.combos[c.id] && S.unlocked[c.a] && S.unlocked[c.b] && !placed.has(c.a) && !placed.has(c.b)) return c.a;
  return null;
}
// a prop as drawn (drawScene): in winter stone lanterns, the snow lantern, garden lamps, rocks and stalls get a snow cap
// (snowCapArt, scenery art)
const SNOWCAP = new Set(['toro', 'yukimi', 'lamp', 'rock', 'stall']);
const propImg = o => seasonNow() === 3 && SNOWCAP.has(o.k) ? snowCapArt(o.img()) : o.img();
// the night before a season changes, the scenery art builds the next season's tiles a little each frame (seasonWarm(s)
// returns true when done), so the rebuild at sunrise doesn't hitch
function seasonPrewarm() {
  if (V21.warm === absSeason(S.day) || seasonDay(S.day) !== SEASON_DAYS - 1 || (S.clock < .8 && S.clock >= DAWN_AT)) return;
  if (seasonWarm((seasonNow() + 1) % 4)) V21.warm = absSeason(S.day);
}
const moonNight = () => seasonNow() === 2 && seasonDay(S.day) === 1 && dayLight().night > .3;   // autumn's 2nd night
const winterSteam = () => seasonNow() === 3;
// ---- 16.12 the guests' season lines: chat (E01 spring, E02 summer, E05 fireworks), into the water (E03 winter, E04
// under the full moon), walking in during a festival (E06). The odds are the lines' own, rolled here with a hash of the
// time (v21odds), not Math.random: these lines never shift the seeded bots' guests (WORKFLOW 5); say() does the rest.
function seasonLines(dt) {
  if (state !== 'play') return;
  const s = seasonNow();
  for (const gu of GUESTS) {
    if (gu.st === 'bathing' && gu.t === 0 && (s === 3 || moonNight())) { const k = s === 3 ? 'E03' : 'E04'; if (v21odds(k, gu.id)) say(gu, k); }
    if (gu.inside && !gu.v21in) { gu.v21in = true; if (FEST.on && v21odds('E06', gu.id)) say(gu, 'E06'); }
  }
  V21.chatT -= dt;
  if (V21.chatT <= 0) {
    V21.chatT = 6;
    const k = FEST.on && s === 1 ? 'E05' : s === 0 ? 'E01' : s === 1 ? 'E02' : moonNight() ? 'E04' : null;   // winter: only E03 (in the water)
    const L = k ? GUESTS.filter(gu => !gu.press && gu.st !== 'sleep' && lineOk(gu)) : [], gu = L[(V21.day * 7 + L.length + Math.floor(T)) % Math.max(1, L.length)];   // which guest: no Math.random
    if (gu && v21odds(k, gu.id)) say(gu, k);   // the chat lines: 'E05' 'E01' 'E02' 'E04'
  }
  if (V21.e12 > 0) {   // "本季新品！" waits (<= HELLO_T s) for the shop owner to be in view near you (like K02)
    V21.e12 -= dt; const o = shopOwner();
    if (o && lineOk(o) && say(o, 'E12')) V21.e12 = 0;
  }
}
// ---- particles (drawn by render(): layer 0 after the scene, under the night tint; layer 1 after the light pass)
function _v21h(i, k) { let x = (Math.imul(i + 1, 374761393) + Math.imul(k + 7, 668265263)) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
const _v21wrap = (v, a, w) => a + (((v - a) % w) + w) % w;
const v21odds = (id, k) => _v21h(Math.floor(T * 4) + (k | 0) * 131, 29) < LINES[id].p;   // a line's odds without Math.random
const OUTDOOR = new Set(['b', 'f', 'g', 'p', 'z', 'r', 's', 'x', 'o', '~', '#', 'D', 'E']);   // the grounds + the roofs / walls / doors (not the floors inside)
const outdoorAt = (wx, wy) => OUTDOOR.has(ch(Math.floor(wx / TILE), Math.floor(wy / TILE)));
const PETAL_COL = ['#f8b8cc', '#ffd6e2', '#f49ab8'], LEAF_COL = ['#e0702a', '#c8502a', '#f0a040'];
function drawSeasonFx(layer) {
  if (layer === 0) { seasonParticles(); if (state !== 'title') drawHallFrame(); return; }
  drawFireflies(); drawMoon(); drawFestGlow();
}
// petals / leaves / snow: each one drifts down through the world; the field wraps round the view (world-anchored, so
// they stay put when the camera moves and come back in at the far edge); not over the floors inside. Each has a darker
// edge so it reads on grass and on snow alike (fun check: plain 1 px pink / white dots vanished into the grass flowers)
function seasonParticles() {
  const s = seasonNow(); if (s === 1) return;
  const n = SEASON_FX[s], x0 = CX - 12, y0 = CY - 12, ww = W + 24, hh = H + 24;
  for (let i = 0, shown = 0; i < 3 * n && shown < n; i++) {   // the field holds 3n; at most n of them (the cap) are drawn
    const a = _v21h(i, 1), b = _v21h(i, 2), c = _v21h(i, 3), sp = .75 + .5 * c;
    const vx = s === 0 ? 5 : s === 2 ? -4 : 1.5, vy = s === 0 ? 9 : s === 2 ? 8 : c < .5 ? 7 : 10;
    const sw = Math.sin(T * (.5 + c * .4) + i * 1.7) * (s === 3 ? 3 : 6);
    const x = R(_v21wrap(a * 4096 + T * vx * sp + sw, x0, ww)), y = R(_v21wrap(b * 4096 + T * vy * sp, y0, hh));
    if (!outdoorAt(x, y) || x < CX - 2 || x > CX + W + 1 || y < CY - 2 || y > CY + H + 1) continue;
    const sx = x - CX, sy = y - CY; shown++;
    if (s === 0) {   // a petal: 2 x 2, pale on top, deep pink under; it turns over slowly (once every 2-3 s)
      const flip = Math.sin(T * (2 + c) + i) > -.3;
      g.globalAlpha = .95; g.fillStyle = '#ffe2ea'; g.fillRect(sx, sy, flip ? 2 : 1, 1); g.fillStyle = PETAL_COL[2]; g.fillRect(sx + (flip ? 1 : 0), sy + 1, flip ? 2 : 1, 1);
    } else if (s === 2) {   // a leaf: 3 x 2 with a darker vein
      g.globalAlpha = .95; g.fillStyle = LEAF_COL[Math.floor(c * 3)]; g.fillRect(sx, sy, 2, 1); g.fillRect(sx + 1, sy + 1, 2, 1);
      g.fillStyle = '#8a3418'; g.fillRect(sx + (Math.sin(T * 1.5 + i) > 0 ? 0 : 2), sy + (Math.sin(T * 1.5 + i) > 0 ? 1 : 0), 1, 1);
    } else {   // snow: 1 px, or a 2 x 2 flake with a blue-grey rim (it shows on snowy ground too)
      g.globalAlpha = .9;
      if (c < .5) { g.fillStyle = '#ffffff'; g.fillRect(sx, sy, 1, 1); g.globalAlpha = .45; g.fillStyle = '#7a8aa8'; g.fillRect(sx, sy + 1, 1, 1); }
      else { g.fillStyle = '#8a9ab8'; g.globalAlpha = .55; g.fillRect(sx - 1, sy, 4, 2); g.fillRect(sx, sy - 1, 2, 4); g.globalAlpha = .95; g.fillStyle = '#ffffff'; g.fillRect(sx, sy, 2, 2); }
    }
  }
  g.globalAlpha = 1;
}
// summer nights: <= 8 fireflies wander over the garden; each fades in for 1.5 s and out for 1.5 s (no blinking)
function drawFireflies() {
  if (seasonNow() !== 1 || !S.unlocked.garden) return;
  const nt = dayLight().night; if (nt < .3) return;
  const k = (nt - .3) / .7;
  for (let i = 0; i < SEASON_FX[1]; i++) {
    const x = (25.5 + _v21h(i, 4) * 13) * TILE + Math.sin(T * .31 + i * 2.1) * 12, y = (9.5 + _v21h(i, 5) * 18.5) * TILE + Math.cos(T * .23 + i * 1.3) * 9;
    if (!VIS(x, y, 8)) continue;
    const b = .5 - .5 * Math.cos((T / 3 + _v21h(i, 6)) * Math.PI * 2), a = k * b;
    if (a < .03) continue;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 * a; drawA(glowArt(10, '#c8ff70'), x, y, 10, 10);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = a; g.fillStyle = '#f4ffb0'; g.fillRect(R(x) - CX, R(y) - CY, 1, 1);
    if (b > .3) { g.globalAlpha = .7 * a; g.fillStyle = '#d8ff70'; g.fillRect(R(x) - 1 - CX, R(y) - CY, 1, 1); g.fillRect(R(x) + 1 - CX, R(y) - CY, 1, 1); g.fillRect(R(x) - CX, R(y) - 1 - CY, 1, 1); g.fillRect(R(x) - CX, R(y) + 1 - CY, 1, 1); }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// autumn's full moon: a big pale moon on the onsen water (and the star-view bath, the koi pond), rippling slowly
function drawMoon() {
  if (!moonNight()) return;
  const a = clamp((dayLight().night - .3) / .7, 0, 1) * .6;
  const one = (x, y, r) => {
    if (!VIS(x, y, r + 4)) return;
    g.globalAlpha = a;
    for (let dy = -r; dy <= r; dy++) {
      const hw = R(Math.sqrt(Math.max(0, r * r - dy * dy)) * 1.3), sh = R(Math.sin(T * 1.1 + dy * .9) * (Math.abs(dy) > r * .5 ? 1 : 0));
      g.fillStyle = dy < -r * .4 ? '#fff6d0' : '#ffe9a8'; g.fillRect(R(x) - hw + sh - CX, R(y) + dy - CY, hw * 2 + 1, 1);
    }
    g.globalAlpha = a * .5; g.fillStyle = '#fff6d0';
    for (let i = 0; i < 3; i++) { const w = 6 + i * 3, yy = R(y) + r + 2 + i * 2; g.fillRect(R(x) - w + R(Math.sin(T * .8 + i) * 2) - CX, yy - CY, w * 2, 1); }
    g.globalAlpha = 1;
  };
  if (S.unlocked.onsen) one(17 * TILE + 8, 2 * TILE + 8, 5);
  if (S.unlocked.roten) one(32 * TILE + 8, 2 * TILE + 8, 6);
  if (S.unlocked.garden) one((POND[0] + POND[1] + 1) / 2 * TILE, 16 * TILE + 4, 4);
}
// ---- the lobby's north wall (drawScene, before the cats): the trophies (23,22), the newest magazine cover (19,22), the
// family photo (15,22); during a festival the lantern strings over the front door and along the lobby wall
function drawWallV21a() {
  if (!VIS(17 * TILE, 22 * TILE + 8, 100) && !VIS(17 * TILE, 29 * TILE, 100)) return;
  const tx = (x, y) => [x * TILE - CX, y * TILE - CY];
  if (S.awards.length) {
    const [x, y] = tx(23, 22); g.drawImage(wallDecorArt('trophy'), x, y);   // the shelf: the older one stands at x 5, the newest at x 11, on y 12
    const L = S.awards.slice(-2);
    L.forEach((a, i) => { const c = trophyArt(a.k), cx = x + (i === L.length - 1 ? 11 : 5); g.drawImage(c, cx - (c.width >> 1), y + 12 - c.height); });
  }
  if (S.covers.length) { const [x, y] = tx(19, 22), c = S.covers[S.covers.length - 1], ca = coverOf(c); g.drawImage(wallDecorArt('cover'), x, y); g.drawImage(ca, x + 3, y + 2); }
  if (S.mom > 0) { const [x, y] = tx(15, 22); g.drawImage(wallDecorArt('family'), x, y); g.drawImage(familyMini(), x + 1, y + 4); }   // the frame's window: x 1..14, y 4..13
  if (FEST.on) drawFestStrings();
}
// three years of gold in a row (16.3): the sign by the door gets a gold frame - "殿堂旅馆"
function drawHallFrame() {
  if (!hallOfFame()) return;
  const c = signArt(star() >= 5), x = 20 * TILE + ((32 - c.width) >> 1) - CX, y = 31 * TILE - c.height - CY;
  if (!VIS(21 * TILE, 30 * TILE, 40)) return;
  g.fillStyle = '#ffd23f'; g.fillRect(x - 2, y - 2, c.width + 4, 1); g.fillRect(x - 2, y - 2, 1, 12); g.fillRect(x + c.width + 1, y - 2, 1, 12);
  g.fillStyle = '#c08a1c'; g.fillRect(x - 1, y - 1, c.width + 2, 1);
  for (const [px, py] of [[x - 3, y - 3], [x + c.width + 1, y - 3]]) { g.fillStyle = '#fff6c0'; g.fillRect(px, py, 2, 2); }
}
// a saved cover { d: day, n: stars, tv } as drawn: coverArt(stars, tv, season)
const coverOf = c => coverArt(c.n, !!c.tv, seasonOf(c.d));
// ---- the HUD, second row (drawHUD, from star 2): the festival's lanterns, the "popular" newspaper / TV + its ring
function drawHudV21a(x0) {
  let xr = W - 2;
  if (S.popT > 0) {
    const ca = coverOf(S.covers[S.covers.length - 1] || { n: 3, tv: S.popTV, d: S.day }); pill(xr - 27, 16, 27, 13); g.drawImage(ca, xr - 25, 16 + ((13 - ca.height) >> 1));
    ring(xr - 7, 22, S.popT / (S.popTV ? POP_TV_T : POP_T), '#ff8ab0'); xr -= 29;
  }
  if (FEST.on) {
    const goal = Math.max(1, S.fest.goal), N = clamp(Math.min(goal, Math.floor((xr - x0 - 4) / 6)), 1, 12), lit = Math.min(N, Math.floor(N * Math.min(1, S.fest.n / goal) + 1e-9));
    const w = N * 6 + 3, x = xr - w; pill(x, 17, w, 11);
    for (let i = 0; i < N; i++) g.drawImage(lanternIcon(i < lit), x + 2 + i * 6, 19);
  }
}
// ---- banners (bannerParts falls through to this for the v2.1 core A kinds)
function bannerV21a(b) {
  const dk = '#5a3a1a';
  switch (b.kind) {
    case 'season': return { rim: SEASONS[b.id].col, parts: [{ img: seasonIcon(b.id), s: 2, gap: 4 }].concat(b.id === 0 && b.y > 1 ? [{ t: '第' + b.y + '年', c: '#c0392b', z: 8, gap: 4 }] : [], [{ t: SEASONS[b.id].name + '来了', c: dk, z: 8 }]) };
    case 'fest': return { rim: '#e8503a', rim2: '#ffc21f', parts: [{ img: lanternIcon(true), gap: 2 }, { img: lanternIcon(true), gap: 4 }, { t: SEASONS[b.id].fest + '！', c: '#c0392b', z: 8 }] };
    case 'festok': return { rim: '#ffc21f', rim2: '#e8503a', parts: [{ img: medalArt(b.id), gap: 3 }, { t: '祭典大成功！', c: '#c0392b', z: 8, gap: 4 }, { img: heartIcon(), gap: 1 }, { t: '+' + FEST_HEARTS, c: dk }] };
    case 'festno': return { rim: '#8a5a34', parts: [{ img: lanternIcon(false), gap: 3 }, { t: '明年再来！', c: dk }] };
    case 'press': return { rim: '#5a6a8a', parts: [{ img: coverArt(3, !!b.id, seasonNow()), gap: 3 }, { t: b.id ? '电视台来了！' : '记者来了！', c: dk, z: 8 }] };
    case 'mom': return { rim: '#f0a0c0', parts: [{ img: faceOf(MOM_DEF.look), gap: 3 }, { t: '妈妈来了！', c: dk, z: 8 }] };
  }
  return null;
}
