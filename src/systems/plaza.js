// ============================================================ v2.1 the festival plaza (SPEC_v2 16.9), core B
// The lower garden (v2.0.1 A3: flower beds, the parasol bench, the basin, the sleeping cats) stays as it is; from star 5
// a gate pad in the front yard (23,32) opens it (its hedge gate (25,29) joins the garden). Four stalls along its north
// hedge (one pad at a time, under each stall's left tile) stand under a cloth and open during a festival (core A, 16.2)
// or a fireworks show - and every night (a night market, 18.2): then half the guests on their way home stop at one, 1 s,
// and pay 8 x star into the plaza's pile
// (31,32) (a festival lantern +1 when core A's lanterns are lit). A string of paper lanterns hangs along the hedge (lit
// at night); at night the plaza plays the festival song.
// Fireworks (the pad on the lawn (32,33)): 5,000, +500 a show (8,000 at most), then 8 min before the next (the pad shows
// a slow clock meanwhile). A show lasts 45 s: a faint night tint over the view (alpha .25 by day, less at dusk), at most
// two bursts a second up in the sky - soft colours, radius <= 16, alpha <= .6, never white, no screen flash - guests come
// x1.5, every fee x1.3, hearts +10, the festival song. It earns back about half its price: you pay to watch. The arrow
// never points at it.
const FWS = { t: 0, acc: 0 };   // the show running now (runtime, not saved: a load ends it - the cool-down is saved)
const BURSTS = [];              // fireworks in the sky: world px, so they stay put when the view moves
const FW_COLS = ['#ff9ab8', '#ffd27a', '#9ae0c8', '#b8a8f0', '#ffb08a', '#8ac8f8'];
const fwOn = () => FWS.t > 0;
// for the music (core A's audioTick passes musicWant({ fest: true }) while it is on; the plaza at night is the engine's)
const fireworksOn = () => FWS.t > 0;
// the whistle plays at launch, the soft "pomp" FIREWORK_POP s later (the audio block): the burst opens with it
const fwRise = () => typeof FIREWORK_POP === 'number' ? FIREWORK_POP : .75;
const fwCooling = () => S.stats.time < ((S.fw && S.fw.cool) || 0);
const spawnMulB = () => fwOn() ? FW_SPAWN : 1;
// core A's festival (16.2, festival.js FEST.on)
const festB = () => FEST.on;
// open at a festival, a fireworks show - and every night: the plaza at night is a night market (its song is the festival's;
// 18.2: under the cloth all day long the stalls were only scenery you had paid 43,000 for)
const stallsOpen = () => fwOn() || festB() || (!!S.unlocked.plaza && dayLight().night > .5);
const stallsOwned = () => STALLS_B.filter(s => S.unlocked[s[0]]);
// a repeat purchase (unlock.js -> buyAgain): the fireworks
function buyAgain(u) {
  if (u.id !== 'fw') return;
  delete S.paid.fw; P.pourAcc = 0; P.pouring = null; P.padLock = tileOf(P); lastBuyAt = S.stats.time; guideClock = 0;
  S.fw.n = (S.fw.n | 0) + 1; S.fw.cool = Math.ceil(S.stats.time + FW_COOL);
  FWS.t = FW_T; FWS.acc = .4; RUN.fw = (RUN.fw | 0) + 1; news('fw');
  banner('fw', S.fw.n); addHearts(FW_HEARTS); lineSay(P, 'P14');
  fxSpark(tcx(FW_PAD), tcy(FW_PAD) - 6, 8); FX.push({ k: 'poof', x: tcx(FW_PAD), y: tcy(FW_PAD) - 4, t: 0, life: .45 });
  saveNow();
}
RUN.fw = 0;
function plazaTick(dt) {
  if (FWS.t > 0) {
    FWS.t = Math.max(0, FWS.t - dt); FWS.acc -= dt;
    if (FWS.acc <= 0 && FWS.t > 1.5) {   // the next burst: at most two a second, up in the sky over where you are
      FWS.acc = rand(.5, .9);
      const x = cam.x + rand(34, W - 34), y = cam.y + rand(56, 128), k = Math.floor(Math.random() * FW_COLS.length);
      BURSTS.push({ x, y, y0: y + rand(40, 70), k, col: FW_COLS[k], t: 0, rise: fwRise(), life: fwRise() + FW_FRAMES / FW_FPS });
      sfx('firework');   // rate-limited in the audio block (1 per 0.3 s); silent before the audio merge
      if (Math.random() < .3) { const gu = GUESTS.find(e => e.inside && !e.gone && VIS(e.x, e.y, -8)); if (gu) lineSay(gu, 'E05'); }   // 烟花好美 (16.12, core A's line)
    }
  }
  for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); }
}
// ---- guests at the stalls (guests.js: the last step on the way home, 'toStall' -> 'stall')
const STALL_OCC = NUL();   // stall id -> the guest standing at it
function stallDetour(gu) {
  if (!stallsOpen() || !S.unlocked.plaza || Math.random() >= YATAI_P) return false;
  const free = stallsOwned().filter(s => !STALL_OCC[s[0]]); if (!free.length) return false;
  const st = free[Math.floor(Math.random() * free.length)]; STALL_OCC[st[0]] = gu; gu.stall = st[0];
  setSt(gu, 'toStall'); gu.goal = null; return true;
}
function stallGuest(gu, dt, walk) {
  const st = STALLS_B.find(s => s[0] === gu.stall), done = () => { if (STALL_OCC[gu.stall] === gu) delete STALL_OCC[gu.stall]; gu.stall = null; guestLeave(gu, false); };
  if (!st) { done(); return; }
  if (gu.st === 'toStall') { goTo(gu, st[4], 31); if (walk()) { setSt(gu, 'stall'); gu.tt = YATAI_T; gu.dir = 'up'; } else if (gu.lost && gu.t > 3) done(); return; }
  gu.tt -= dt;
  if (gu.tt <= 0) {
    const v = 8 * star(); S.piles.plaza = (S.piles.plaza || 0) + v; RUN.stall = (RUN.stall | 0) + v; gu.heart = 1; markDirty();
    festLantern(1);   // core A's festival lantern row (16.2; nothing outside a festival)
    done();
  }
}
// ---- drawing
// the paper lanterns along the hedge: chochinString (32 x 10) tiled n tiles wide
function chochinRow(n) {
  return art('core:chochinRow:' + n, () => { const c = mk(n * TILE, 12), x = c.getContext('2d'); x.imageSmoothingEnabled = false; const s = chochinString(); for (let px = 0; px < n * TILE; px += s.width) x.drawImage(s, px, 1); return c; });
}
// after the light pass: the show's faint night tint, then the bursts (never white, no flash)
function drawSkyB() {
  if (FWS.t <= 0 && !BURSTS.length) return;
  const k = clamp(Math.min((FW_T - FWS.t) / 1.5, FWS.t / 1.5), 0, 1), dl = dayLight();
  // the show's own dusk (fun check, SPEC_v2 18.2): a multiply tint like the night's, eased in / out over 1.5 s - with the
  // old plain .25 veil the soft bursts were all but invisible by day (on snow not at all); at night it adds nothing
  const a = FW_DUSK * k * (1 - dl.night);
  if (a > .004) {
    g.globalCompositeOperation = 'multiply'; const mul = g.globalCompositeOperation === 'multiply'; if (!mul) g.globalCompositeOperation = 'source-over';
    g.globalAlpha = mul ? a : a * .55; g.fillStyle = '#2a3468'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  for (const b of BURSTS) {
    const sx = b.x - CX, sy = b.y - CY; if (sx < -36 || sx > W + 36 || sy < -36 || sy > H + 36) continue;
    if (b.t < b.rise) {   // a dim trail rising, then it opens
      const p = b.t / b.rise, y = lerp(b.y0, b.y, 1 - (1 - p) * (1 - p));
      g.globalAlpha = .55; g.fillStyle = b.col; g.fillRect(R(sx), R(y - CY), 2, 3); g.globalAlpha = .25; g.fillRect(R(sx), R(y - CY) + 4, 2, 3);
      continue;
    }
    // it opens with the "pomp": a soft bloom in its own colour for 0.5 s (never white, no screen flash, like the festival's),
    // then fireworkArt frames 0-5 at FW_FPS (<= 8 a second), alpha .6 (the art fades its last frames)
    const age = b.t - b.rise;
    if (age < .5) {
      g.globalCompositeOperation = 'lighter'; const add = g.globalCompositeOperation === 'lighter'; if (!add) g.globalCompositeOperation = 'source-over';
      g.globalAlpha = (add ? .35 : .15) * (1 - age / .5); drawA(glowArt(28, b.col), b.x, b.y, 28, 28); g.globalCompositeOperation = 'source-over';
    }
    // drawn at 2x (64 x 64, every dot 2 x 2 like the festival's stars): at 1x the 1-px dots were lost on snow and in the sky
    g.globalAlpha = FW_ALPHA; const c = fireworkArt(b.k, Math.min(FW_FRAMES - 1, Math.floor(age * FW_FPS)));
    g.drawImage(c, R(sx) - c.width, R(sy) - c.height, c.width * 2, c.height * 2);
  }
  g.globalAlpha = 1;
}
// the fireworks pad while it cools down: a dim pad frame with a slow clock (one turn = the 8 minutes)
function fwClock() {
  if (!S.unlocked.plaza || PADPOS.has('fw') || !fwCooling()) return;
  const [tx, ty] = FW_PAD, x = tx * TILE - CX, y = ty * TILE - CY; if (x < -16 || x > W || y < -16 || y > H) return;
  g.fillStyle = 'rgba(27,27,47,.28)'; g.fillRect(x + 1, y + 1, 14, 14);
  const p = clamp(1 - (S.fw.cool - S.stats.time) / FW_COOL, 0, 1);
  g.fillStyle = OUT; disc(x + 8, y + 8, 5.6, OUT); disc(x + 8, y + 8, 4.6, '#fff6d8');
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + p * Math.PI * 2 * i / 12; g.fillStyle = '#e8a030'; g.fillRect(R(x + 8 + Math.cos(a) * 3.2), R(y + 8 + Math.sin(a) * 3.2), 1, 1); }
  const a = -Math.PI / 2 + p * Math.PI * 2; g.fillStyle = OUT; for (let r = 0; r <= 3; r++) g.fillRect(R(x + 8 + Math.cos(a) * r), R(y + 8 + Math.sin(a) * r), 1, 1);
}

// ============================================================ v2.1 core B glue: one tick, one reset, the save
function tickB(dt) { wardrobeTick(dt); rareTick(dt); plazaTick(dt); }
// a new game / a load (title.js resetWorld): nothing of the runtime above is carried over
function resetB() {
  for (const k in RARE_DUE) delete RARE_DUE[k]; rareLast = -1e9;
  FWS.t = 0; FWS.acc = 0; BURSTS.length = 0; for (const k in STALL_OCC) delete STALL_OCC[k];
  TRY.outfit = TRY.uniform = null; PETFX.lantern = 0; PETFX.next = 30; maneki = 0;
}
// the save (state-save.js loadState -> loadStateB): equip.outfit / uniform (bought ones only), rare (known ids, whole
// numbers), fw (shows so far; a cool-down never more than one away), the outfit in a photo - an old save gets the
// defaults (never wiped)
function loadStateB(s, raw) {
  const e = objOr(raw.equip), o = e.outfit, u = e.uniform;   // absent = your own clothes (a v2.0 save keeps its equip as it was)
  if (o !== undefined) s.equip.outfit = UNLOCK[o] && UNLOCK[o].outfit && s.unlocked[o] ? o : null;
  if (u !== undefined) s.equip.uniform = UNLOCK[u] && UNLOCK[u].uniform && s.unlocked[u] ? u : null;
  { const r = objOr(raw.rare), c = {}; for (const k in r) if (RARE[k] && int0(r[k])) c[k] = int0(r[k]); s.rare = c; }
  { const f = objOr(raw.fw); s.fw = { n: int0(f.n), cool: Math.min(int0(f.cool), Math.ceil(s.stats.time) + FW_COOL) }; }
  const ph = objOr(raw.album).photos;
  if (Array.isArray(ph)) {   // loadState kept the last 40 valid photos in order: give each its outfit back
    const src = ph.slice(-40).filter(p => p && typeof p === 'object' && VIP[p.v]);
    s.album.photos.forEach((p, i) => { if (!src[i] || src[i].o === undefined) return; const o2 = src[i].o; p.o = UNLOCK[o2] && UNLOCK[o2].outfit && s.unlocked[o2] ? o2 : null; });
  }
}
