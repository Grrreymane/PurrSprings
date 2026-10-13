// Store-page trailer director: ~15 s vertical video (after Fishing/tools/trailer.js).
//   try:   python D:/Minigame/_workflow/tools/record_video.py D:/Minigame/Hotelgame tools/trailer.js --size 540x960 --out .shots/trailer/try.mp4
//   final: python D:/Minigame/_workflow/tools/record_video.py D:/Minigame/Hotelgame tools/trailer.js --out .shots/trailer/trailer.mp4
// Runs inside the game closure (record_video.py), so it calls game functions directly. Shots:
//   1 the hook: fish poured into two price circles - a room pops in, the hot spring opens, a new star
//   2 the camera pulls out to the whole map; the inn grows to five stars as a fast time-lapse
//   3 quick cuts: the busy bath, breakfast, a celebrity guest, the star-view bath at night
//   4 fireworks over the plaza   5 dress-up   6 the title as the end card
{
  // same random numbers every take, so a good take can be re-recorded
  let seed = 11;
  Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const FPS = 30, DT = 1 / FPS;
  setMusicOn(true); setSfxOn(true);
  // one tune all the way through (the area songs would restart at every cut); the festival song is the liveliest
  audioTick = dt => { musicWant({ song: 'fest', night: 0, star: 5, menu: false, area: null, season: 0, fest: false }); musicTick(dt); };
  saveNow = () => {}; markDirty = () => {};   // a trailer never touches the player's save

  // ---- staging helpers (as in .shots/stage.js)
  const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
  const unl = ids => { ids.forEach(id => { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; for (const rm of ROOMS) if (rm.open === id) S.rooms[rm.id] = S.rooms[rm.id] || 'clean'; }); S.peak = Math.max(S.peak, starOf(S)); };
  const place = (x, y, dir) => { Object.assign(P, { x: x * TILE + 8, y: y * TILE + 8, dir: dir || 'down', moving: false }); updCam(0, true); };
  const guest = o => { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); if (!o || o.inside === undefined) gu.inside = gu.y < 29 * TILE; return gu; };
  const party = (type, o) => { addGuest(type); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, o); if (!o || o.inside === undefined) gu.inside = gu.y < 29 * TILE; if (gu.mate) { gu.mate.x = gu.x; gu.mate.y = gu.y + 9; } return gu; };
  const bathe = (slot, room) => { const gu = guest({ st: 'bathing', t: 0, tt: 60, slot, room, x: SLOTS[slot].x * TILE + 8, y: 4 * TILE + 8 }); SLOT_OCC[slot] = gu; RT[room].guest = gu; S.rooms[room] = 'reserved'; return gu; };
  const b5 = extra => { newGame(); S.tut.moved = true; unl(ALL.concat(['maid4', 'roten'], extra || [])); S.done = true; S.peak = 5; S.stats.vips = 3; S.vipNext = VIPS.length; S.stats.time = 3000; for (const c of COMBOS) if (c.hint) S.combos[c.id] = 1; S.decor['room1:A'] = 'd_maneki'; S.decor['room1:B'] = 'd_daruma'; };
  // the bottom info card of a nearby pad, off where it would only cover the picture (the fireworks)
  let noInfo = false; const gameInfoPad = infoPad; infoPad = () => noInfo ? null : gameInfoPad();
  const quiet = () => { BANNER_Q.length = 0; FIRST_Q.length = 0; LINE = null; if (state === 'card') modalClose(); };
  const tick = (dt = DT) => { update(dt); if (state === 'card') modalClose(); if (state === 'celebrate') { S.done = true; go('play'); } };
  // play on without sound (fast-forward while staging a shot)
  const ff = sec => { const s = sfxOn; sfxOn = false; for (let t = 0; t < sec; t += DT) tick(); sfxOn = s; botMove = null; };
  const walkTo = (tx, ty) => { const dx = tx * TILE + 8 - P.x, dy = ty * TILE + 8 - P.y, d = Math.hypot(dx, dy); botMove = d > 1.2 ? { x: dx / d * Math.min(1, d / 4), y: dy / d * Math.min(1, d / 4) } : null; return d <= 1.2; };

  // ---- the whole map, drawn window by window into one canvas (shot 2), the people without the game's markers
  const BIG = mk(MAPW, MAPH), bx = BIG.getContext('2d');
  function drawMap() {
    bx.imageSmoothingEnabled = false; const g0 = g; g = low.getContext('2d'); g.imageSmoothingEnabled = false; VM = 0;
    for (let cy = 0; cy < MAPH; cy += H) for (let cx = 0; cx < MAPW; cx += W) {
      TQ.length = 0; CX = cx; CY = cy; drawScene(W, H, true, false, true);
      bx.drawImage(low, 0, 0, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy), cx, cy, Math.min(W, MAPW - cx), Math.min(H, MAPH - cy));
    }
    TQ.length = 0; g = g0;
  }
  // the time-lapse's purchases, in the game's order, a batch at a time; each lands with a pop, a sparkle and a chime
  const LAPSE = [];
  { const rest = ALL.concat(['maid4']).filter(id => !['room2', 'room3', 'room4', 'room5', 'onsen'].includes(id));
    let b = []; for (const id of rest) { b.push(id); if (UNLOCK[id].gate || b.length >= 5) { LAPSE.push(b); b = []; } } if (b.length) LAPSE.push(b); }
  const SPARK = [];   // [world x, world y, t0]
  function lapseBuy(ids) {
    const s0 = star();
    for (const id of ids) {
      const u = UNLOCK[id]; S.unlocked[id] = true; S.paid[id] = u.price; POPA[id] = T;
      for (const rm of ROOMS) if (rm.open === id) { S.rooms[rm.id] = 'clean'; POPA[rm.id] = T; POPA[rm.id + ':t'] = T + .1; POPA[rm.id + ':a'] = T + .2; POPA[rm.id + ':u'] = T + .3; }
      for (const a of AREAS) if (a.open === id) AREA_FADE.push({ a, t0: T });
      const at = u.at || (Array.isArray(u.pad) ? u.pad : null); if (at) SPARK.push([at[0] * TILE + 8, at[1] * TILE + 8, T]);
    }
    rebuildWorld(); ensureStaff(); S.peak = Math.max(S.peak, star());
    for (const s of STAFF) if (s.newT === undefined) s.newT = T;
    if (star() > s0) { starPopAt = T; sfx('areaOpen'); } else sfx('unlock');
  }

  // ---- shots: { len, caption, start(), during(t) }
  const shots = [];
  // 1. the hook (no caption): up the corridor, every room's tips fly into the fish counter, then the fish go into the
  // hot spring's gate: the bath lights up, a star pops in
  let hook = 0;
  shots.push({ len: 3.3, start() {
    newGame(); S.tut.moved = true; unl(['room2', 'room3', 'room4', 'room5', 'room6', 'room7', 'room8', 'shoes1', 'shoes2', 'shoes3', 'shoes4', 'net1', 'net2', 'net3']); S.money = 12; S.stats.time = 200; S.paid.onsen = 22;
    resetWorld(); go('play'); spawnT = 1e9;
    for (const r of ['room3', 'room6', 'room7']) { const rm = ROOM[r]; const gu = guest({ st: 'sleep', t: 0, tt: 60, room: r, x: rm.stand[0] * TILE + 8, y: rm.stand[1] * TILE + 8 }); RT[r].guest = gu; S.rooms[r] = 'occupied'; }
    for (const [r, n] of [['room3', 85], ['room4', 120], ['room5', 160], ['room6', 95], ['room7', 140], ['room8', 180]]) S.piles[r] = n;
    place(17, 18, 'up'); P.towels = 3; ff(.05); quiet(); hook = 0;
  }, during(t) {
    if (hook === 0 && walkTo(17, 7)) { botMove = null; hook = 1; }
    if (hook === 1 && P.padOn === 'onsen') P.padT = Math.max(P.padT, PAD_DELAY);
  } });
  // 2. pull out to the whole map; the inn grows to five stars (the world runs 3x: a time-lapse)
  let lapseI = 0;
  shots.push({ len: 3.3, caption: '一路开到五星', capY: 56, world: true, start() { lapseI = 0; SPARK.length = 0; spawnT = 0; botMove = null; this.c0 = [cam.x + W / 2, cam.y + H / 2]; },
    during(t) {
      for (let k = 0; k < 3; k++) tick();   // + the frame's own tick below = 4x
      const due = Math.floor(clamp((t - .4) / 2.3, 0, 1) * LAPSE.length);
      while (lapseI < due) lapseBuy(LAPSE[lapseI++]);
    } });
  // 3. quick cuts
  shots.push({ len: .85, caption: '泡温泉', capY: 124, start() {
    newGame(); S.tut.moved = true; unl(['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea', 'basket1', 'maid1', 'room4', 'milk', 'room5', 'porter', 'bigbath']);
    S.basket = 7; S.money = 140; S.stats.time = 900; resetWorld(); go('play'); spawnT = 1e9; ff(1);
    bathe(0, 'room2'); bathe(2, 'room3'); bathe(3, 'room4'); bathe(4, 'room5');
    const c = party('couple', { st: 'bathing', t: 0, tt: 60, slot: 1, x: SLOTS[1].x * TILE + 8, y: 4 * TILE + 8, inside: true }); SLOT_OCC[1] = c; c.mate.mode = 'park';
    S.piles.onsen = 44; S.piles.milk = 12;
    const gm = guest({ st: 'milk', tt: 60, x: MILK_SPOT[0] * TILE + 8, y: MILK_SPOT[1] * TILE + 8, dir: 'up', room: 'room1' }); gm.look = { fur: gm.look.fur, outfit: 'yukata' }; RT.room1.guest = gm; S.rooms.room1 = 'reserved';
    place(20, 6, 'left'); P.towels = 4; ff(.3); quiet();
  }, during() { botMove = { x: -.6, y: 0 }; } });
  shots.push({ len: .85, caption: '吃早饭', start() {
    newGame(); S.tut.moved = true; unl(ALL.filter(id => UNLOCKS.findIndex(u => u.id === id) <= UNLOCKS.findIndex(u => u.id === 'chef')).concat(['table4'])); resetWorld(); go('play'); spawnT = 1e9;
    PASS.n = 4;
    const sit = (i, o) => { const se = SEATS[i], gu = guest(Object.assign({ st: 'seated', t: 8, seat: i, x: tcx(se.at), y: tcy(se.at), dir: se.face, inside: true }, o)); SEAT_OCC[i] = gu; return gu; };
    sit(0); sit(3, { t: 24 }); const e = sit(4); serveSeat(e); e.tt = 3; sit(1, { t: 14 });
    const c = party('couple', { st: 'seated', t: 12, seat: 6, seat2: 7, x: tcx(SEATS[6].at), y: tcy(SEATS[6].at), dir: SEATS[6].face, inside: true }); SEAT_OCC[6] = SEAT_OCC[7] = c;
    Object.assign(c.mate, { mode: 'park', x: tcx(SEATS[7].at), y: tcy(SEATS[7].at), dir: SEATS[7].face });
    ff(1.2); place(5, 24, 'up'); P.tray = ['rice', 'rice']; ff(.1); quiet();
  } });
  shots.push({ len: .85, caption: '迎贵宾', start() {
    newGame(); S.tut.moved = true; unl(ALL.filter(id => id !== 'roten')); resetWorld(); go('play'); spawnT = 1e9;
    vipArrive(); ff(7.6); place(17, 25, 'down'); P.y += 6; ff(.2); quiet();
  } });
  shots.push({ len: .95, caption: '看星星', capY: 124, start() {
    newGame(); S.tut.moved = true; unl(ALL); S.done = true; resetWorld(); go('play'); spawnT = 1e9; ff(2);
    for (const [i, r] of [[5, 'room2'], [6, 'room6'], [7, 'room3'], [8, 'room4']]) bathe(i, r);
    S.clock = .93; place(31, 6, 'up'); ff(.3); quiet();
  } });
  // 4. fireworks over the plaza at dusk
  shots.push({ len: 2.5, caption: '放一场烟花', start() {
    b5(['plaza'].concat(STALLS_B.map(s => s[0]), GARDEN_B.map(g => g[0]))); S.clock = .84; S.fw = { n: 1, cool: 0 }; resetWorld(); go('play'); spawnT = 0;
    noInfo = true; ff(20); FWS.t = FW_T; FWS.acc = 0; ff(2); place(29, 35, 'up'); ff(.4); quiet(); this.nx = 0; this.pre = false;
  }, during(t) {
    if (FWS.t < 3) FWS.t = FW_T;
    // a fuller sky than the game's two a second: an extra burst every 0.3 s
    const burst = t0 => { const x = cam.x + rand(30, W - 30), y = cam.y + rand(50, 150), k = Math.floor(Math.random() * FW_COLS.length);
      BURSTS.push({ x, y, y0: y + rand(40, 70), k, col: FW_COLS[k], t: t0, rise: fwRise(), life: fwRise() + FW_FRAMES / FW_FPS }); };
    if (!this.pre) { this.pre = true; BURSTS.length = 0; for (let j = 0; j < 4; j++) burst(fwRise() - .1 + j * .22); }   // the sky already full on the cut
    if (t >= this.nx) { this.nx = t + .22; burst(0); sfx('firework'); }
  } });
  // 5. dress-up: outfit, hat, a pet at your heels, the staff in uniforms
  shots.push({ len: 1.4, caption: '换装打扮', start() {
    noInfo = false; b5(['o_samurai', 'h_crown', 'p_fox', 'u_sailor']); S.equip = { hat: 'h_crown', pet: 'p_fox', outfit: 'o_samurai', uniform: 'u_sailor' }; S.clock = .3;
    resetWorld(); go('play'); spawnT = 0; ff(4); place(14, 25, 'right'); ff(.4); quiet();
  }, during() { botMove = { x: .8, y: 0 }; } });
  // 6. the title as the end card
  const gameTitle = drawTitle;
  shots.push({ len: 2.5, start() {
    b5(['o_hakama', 'h_straw', 'p_crane']); S.equip = { hat: 'h_straw', pet: 'p_crane', outfit: 'o_hakama' }; S.clock = .3; resetWorld(); go('title');
    drawTitle = () => {
      g.fillStyle = 'rgba(12,8,28,.5)'; g.fillRect(0, 0, W, H);
      g.drawImage(catBow('orange', Math.floor(T / .9) & 1, hatOf(S.equip.hat), outfitOf(S.equip.outfit)), 17 * TILE + 8 - 8 - CX, 30 * TILE + 10 - 23 - CY);
      { const k = petOf(S.equip.pet); if (k) drawPet({ kind: k, x: 17 * TILE + 21, y: 30 * TILE + 10, dir: 'down', moving: false, walkT: 0, idle: 2 }); }
      txt('猫猫温泉旅馆', 90, 74, 21, '#ffe14a');
      txt('Purr Springs', 90, 96, 9, '#dff6ff');
      for (let i = 0; i < 5; i++) drawC(starIcon(true), 74 + i * 8, 112);
      txt('接客 · 泡汤 · 扩建', 90, 132, 9, '#ffffff');
      if (Math.floor(st * 2) % 2 === 0) txt('点击开张营业', 90, 160, 12, '#ffe9a8');
    };
  } });
  const total = shots.reduce((s, x) => s + x.len, 0);

  // shot 2's picture: the map drawn whole, the view easing from the play camera out to the full width
  function drawWorldShot(t, sh) {
    drawMap();
    const z = clamp(t / 1.3, 0, 1), e = z * z * (3 - 2 * z);
    const s1 = W / MAPW, s = Math.exp(lerp(0, Math.log(s1), e));   // logical px per world px
    const c0 = sh.c0, c1 = [MAPW / 2, MAPH / 2 - 10];
    const cx = lerp(c0[0], c1[0], e), cy = lerp(c0[1], c1[1], e), sy = lerp(H / 2, H / 2 + 22, e);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = s < .999; ctx.imageSmoothingQuality = 'high';
    const ox = (W / 2 - cx * s) * K, oy = (sy - cy * s) * K;
    ctx.drawImage(BIG, 0, 0, MAPW, MAPH, ox, oy, MAPW * s * K, MAPH * s * K);
    ctx.imageSmoothingEnabled = false;
    // sparkles where things were just bought (screen size, so they read at map scale)
    for (const [wx, wy, t0] of SPARK) {
      const a = T - t0; if (a > .6) continue;
      const sp = sparkleArt(clamp(Math.floor(a / .6 * 4), 0, 3)), sz = 2.2 * K;
      ctx.drawImage(sp, R(ox + wx * s * K - sp.width * sz / 2), R(oy + wy * s * K - sp.height * sz / 2), sp.width * sz, sp.height * sz);
    }
    // the inn's stars, big, along the bottom
    const sc = 3 * K, n = star();
    for (let i = 0; i < 5; i++) {
      const ic = starIcon(i < n), w = ic.width * sc, x = W / 2 * K + (i - 2) * 26 * K, y = (H - 28) * K;
      let k = 1; if (i === n - 1 && T - starPopAt < .6) k = popScale(starPopAt);
      if (k > .02) ctx.drawImage(ic, R(x - w * k / 2), R(y - ic.height * sc * k / 2), R(w * k), R(ic.height * sc * k));
    }
  }
  // caption: big outlined words that slide in under the HUD
  function caption(s, age, len, capY = 60) {
    if (!s) return;
    const a = Math.min(1, age / .12, (len - age) / .12), c = textSprite({ s, size: 15, col: '#ffffff', stroke: OUT });
    const slide = (1 - Math.min(1, age / .15)) * 8;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.max(0, a); ctx.drawImage(c.cv, R(W * K / 2 - c.w / 2), R((capY + slide) * K - c.h / 2)); ctx.globalAlpha = 1;
  }

  let cur = -1, t0 = 0, capStart = 0, lastCap = null;
  REC.run({ fps: FPS, seconds: total, canvas: cv, audio: true,
    async setup(ac) {
      AC = ac; initAudio(); try { await document.fonts.ready; await document.fonts.load('15px "Fusion Pixel"', ALLTEXT); } catch (e) {} TXC.clear(); TW.clear();
      // exact pixel scale for the requested size (fit() would follow the headless window instead)
      removeEventListener('resize', fit); cv.width = REC.width; cv.height = REC.height; K = cv.width / W;
      REC.log('canvas ' + cv.width + 'x' + cv.height + ' K=' + K + ' total ' + total.toFixed(2) + ' s, lapse batches ' + LAPSE.length);
    },
    step(i, t) {
      let acc = 0, k = 0; while (k < shots.length - 1 && t >= acc + shots[k].len - 1e-6) acc += shots[k++].len;
      if (k !== cur) { cur = k; t0 = acc; shots[k].start(); REC.log('shot ' + k + ' at ' + t.toFixed(2) + ' state ' + state); }
      const sh = shots[k], lt = t - t0;
      if (sh.during) sh.during(lt);
      if (i > 0) tick();
      if (sh.world) drawWorldShot(lt, sh); else render();
      // a caption shared by consecutive shots stays up across the cuts
      if (sh.caption !== lastCap) { lastCap = sh.caption; capStart = t; }
      if (sh.caption) {
        let end = acc + sh.len, j = k + 1; while (j < shots.length && shots[j].caption === sh.caption) end += shots[j++].len;
        caption(sh.caption, t - capStart, end - capStart, sh.capY);
      }
      if (i % 15 === 0) REC.log(`t ${t.toFixed(2)} shot ${k} state ${state} P ${(P.x / TILE).toFixed(1)},${(P.y / TILE).toFixed(1)} star ${star()} money ${S.money}`);
    } });
}
