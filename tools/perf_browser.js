// Real-browser render profile (desktop Chrome, headless) of the busiest pictures. Run with the frame-exact recorder,
// which pastes this into the game closure (it records one dummy frame at the end):
//   python D:/Minigame/_workflow/tools/record_video.py D:/Minigame/Hotelgame tools/perf_browser.js --size 540x960 --out .shots/perf.mp4
// (--size 540x960 = K 3; 1170x2080 = K 6.5, a 390 css px phone at DPR 3). For each scene: 90 warm-up frames, then 600
// frames of update(1/60) + render() while the innkeeper walks a loop; logs update / render CPU ms (avg, p95) and render
// + a 1-px readback (forces the GPU to finish the frame: the real cost of the draw calls).
(() => {
  const unl = ids => ids.forEach(id => { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; });
  function stage(where, opt) {
    newGame(); S.tut.moved = true;
    for (const u of UNLOCKS) if (!u.need5 || u.id === 'h_straw' || u.id === 'p_shiba' || u.id === 'plaza' || u.id === 'shrine') unl([u.id]);
    for (const u of UNLOCKS) if (u.need5 && /^(gd_|st_|of|plaza|shrine)/.test(u.id)) unl([u.id]);
    for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
    S.peak = 5; S.done = true; S.equip = { hat: 'h_straw', pet: 'p_shiba' }; S.clock = opt.night ? .85 : .3; S.day = opt.day || 1; S.stats.time = 3000;
    for (const sl of DSLOTS) if (roomOpen(sl.rm)) S.decor[sl.key] = sl.k === 'A' ? 'd_scroll' : 'd_ikebana';
    resetWorld(); go('play');
    for (let i = 0; i < 60 * 30; i++) { update(1 / 60); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); }
    const tiles = []; for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const ar = areaAt(tx, ty); if (ar && ar.id === where && walkable(tx, ty)) tiles.push([tx, ty]); }
    const crowd = () => { let n = 0; while (GUESTS.length < GUEST_MAX && n++ < 60) { const q = Q.length < QSPOTS.length - 1; addGuest(); if (q) continue; const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); const t = tiles[Math.floor(Math.random() * tiles.length)]; gu.x = tcx(t); gu.y = tcy(t); guestLeave(gu, false); } };
    const open = ([x, y]) => [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].every(([dx, dy]) => walkable(x + dx, y + dy));
    const c = tiles.reduce((a, t) => [a[0] + t[0] / tiles.length, a[1] + t[1] / tiles.length], [0, 0]);
    const spot = tiles.filter(open).sort((a, b) => Math.hypot(a[0] - c[0], a[1] - c[1]) - Math.hypot(b[0] - c[0], b[1] - c[1]))[0];
    P.x = tcx(spot); P.y = tcy(spot); updCam(0, true);
    for (const id in S.piles) S.piles[id] = 50;
    return crowd;
  }
  const SCENES = [
    ['garden night winter + 40 guests + fireworks', 'garden', { night: 1, day: 10, fw: 1 }],
    ['plaza night + fireworks', 'plaza', { night: 1, day: 4, fw: 1 }],
    ['lobby night winter', 'lobby', { night: 1, day: 10 }],
    ['garden day spring', 'garden', { night: 0, day: 1 }],
  ];
  const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  REC.run({ fps: 30, seconds: 1 / 30, canvas: cv, async setup() {
    await REC.log(`K=${K.toFixed(3)} canvas ${cv.width}x${cv.height}`);
    for (const [name, where, opt] of SCENES) {
      const crowd = stage(where, opt);
      const U = [], Rn = [], RF = [];
      if (typeof PROF !== 'undefined') for (const k in PROF) delete PROF[k];   // optional per-function breakdown (a wrapper script prepended)
      for (let i = 0; i < 690; i++) {
        const a = i / 240 * Math.PI * 2; botMove = { x: Math.cos(a) * .6, y: Math.sin(a) * .45 };
        crowd(); if (opt.fw && FWS.t < 3) { FWS.t = FW_T; FWS.acc = 0; }
        const t0 = performance.now(); update(1 / 60); const t1 = performance.now(); render(); const t2 = performance.now();
        ctx.getImageData(0, 0, 1, 1); const t3 = performance.now();
        if (i >= 90) { U.push(t1 - t0); Rn.push(t2 - t1); RF.push(t3 - t1); }
      }
      botMove = null;
      await REC.log(`${name.padEnd(46)} guests ${GUESTS.length} lamps ${LIGHT_N} bursts ${BURSTS.length} | update ${avg(U).toFixed(2)} | render ${avg(Rn).toFixed(2)} (p95 ${pct(Rn, .95).toFixed(2)}) | render+flush ${avg(RF).toFixed(2)} (p95 ${pct(RF, .95).toFixed(2)}) ms`);
      if (typeof PROF !== 'undefined') await REC.log('   ' + Object.entries(PROF).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (v / 690).toFixed(2)).join(', '));
    }
  }, step() { render(); } });
})();
