// v2.4 (player feedback "the guests of honour run off right after the photo"): after its photo a VIP / rare guest / mom
// walks to the futon of its suite and sleeps (futon 'sleep' art + its head, Zzz, the andon glows) until the next dawn -
// at least VIP_SLEEP_MIN s, else the dawn after - then says goodbye and leaves; the suite is messy (the long clean). The
// VIP slot frees at the photo, but nobody comes while every suite has a sleeper in it (the other suite is used when it is
// free); a save mid-sleep loads with the sleeper back in its futon; odd S.vsleep rows are dropped.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_vipsleep.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4' && u.id !== 'suiteB').map(u => u.id);
function st(extra, clock) {
  S = defaults(); for (const id of ALL.concat(extra || [])) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = 4; S.tut.moved = true; S.clock = clock === undefined ? .3 : clock; S.stats.vips = 2; S.vipNext = 2; S.day = 4; S.stats.time = 500; S.done = true;
  resetWorld(); go('play'); spawnT = 1e9; vipT = 1e9; STAFF.length = 0;
}
// a guest of honour `who` seated in suite `sid` with only its photo left, then the photo
function photo(who, sid) {
  vipArrive(); const v = VIPG, rm = ROOM[sid || 'c3'];
  if (RARE[who]) Object.assign(v, { id: who, rare: true, look: RARE_LOOK[who], kits: RARE[who].kits ? RARE[who].kits.slice(1).map(fur => ({ fur, x: tcx(rm.stand), y: tcy(rm.stand), dir: 'up', moving: false, walkT: 0, q: [] })) : undefined });
  else if (who) Object.assign(v, { id: who, look: VIP_LOOK[who] });
  v.ws = null; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = rm.id; RT[rm.id].guest = v; setSt(v, 'seated'); v.wi = vipWs(v).length - 1; vipWishStart(); firstDone('vip'); FIRST_Q.length = 0;
  vipPhoto(); return v;
}
// ---- the photo: the slot frees, it walks to its futon and sleeps
st();
{ const n0 = S.stats.vips, v = photo('kawa'); eq(S.stats.vips, n0 + 1, 'the visit counts at the photo'); ok(!VIPG, 'the VIP slot is free');
  const e = VSLEEP[0]; ok(e && e.id === 'kawa' && e.room === 'c3' && RT.c3.guest === e, 'a sleeper in 月见亭'); eq(e && e.st, 'toBed', 'walking to the futon');
  eq(S.vsleep.length, 1, 'saved: one sleeper'); eq(S.vsleep[0].w, S.day + 1, 'wakes the next dawn');
  run(6); eq(e.st, 'sleep', 'asleep'); eq(S.rooms.c3, 'occupied', 'the suite reads occupied'); eq(tileOf(e) + '', ROOM.c3.cleanT + '', 'on its futon');
  // drawn: the futon in 'sleep', its head, the Zzz bubble; the andon glows (r18)
  const fa = [], hd = [], bz = []; const _f = futonArt, _h = catSleepHead, _b = bubbleArt;
  futonArt = (k, f, fu) => { fa.push(k); return _f(k, f, fu); }; catSleepHead = fur => { hd.push(fur); return _h(fur); }; bubbleArt = (k, u, gd) => { bz.push(k); return _b(k, u, gd); };
  P.x = tcx(ROOM.c3.stand); P.y = tcy(ROOM.c3.stand) + 20; updCam(0, true); render(); futonArt = _f; catSleepHead = _h; bubbleArt = _b;
  ok(fa.includes('sleep') && hd.includes(VIP.kawa.fur) && bz.includes('zzz'), 'drawn asleep: futon ' + fa.join() + ', head ' + hd.join() + ', bubbles ' + bz.join());
  eq(lightR(LIGHTS.find(L => L.room === ROOM.c3)), 18, 'its andon glows');
  // nobody else comes: the only suite is taken (a VIP due, a rare guest due)
  vipT = S.stats.time; run(3); ok(!VIPG, 'a VIP due waits while the only suite has a sleeper');
  S.unlocked.gd_zen = true; rareSync(); RARE_DUE.r_zen = S.stats.time; run(3); ok(!VIPG, 'a rare guest due waits too');
  // the night passes: at dawn it gets up, says goodbye, walks out; the suite is messy (the long clean)
  const said = []; const _say = say; say = (w, id, a) => { const r = _say(w, id, a); if (r && w === e) said.push(id); return r; };
  S.clock = DAWN_AT - .002; P.x = tcx(ROOM.c3.stand); P.y = tcy(ROOM.c3.stand) + 20; updCam(0, true); lineCD = -99; LINE = null; run(.5); say = _say;
  eq(e.st, 'leave', 'up at dawn'); ok(said.includes('V11'), 'goodbye: V11 (' + said.join() + ')'); eq(S.rooms.c3, 'messy', 'suite messy'); ok(RT.c3.vipMess, 'the long clean'); eq(S.vsleep.length, 0, 'not saved any more');
  run(3, () => !!VIPG); ok(!!VIPG, 'the suite is free again: the next guest of honour comes'); VIPG = null;
  run(45, () => !VSLEEP.length); ok(!VSLEEP.length, 'out of the door'); }
// ---- a photo just before dawn: it sleeps through to the dawn after (>= VIP_SLEEP_MIN)
st([], DAWN_AT - 20 / DAY_LEN); photo('ozeki'); eq(S.vsleep[0].w, S.day + 2, '20 s before dawn: wakes the dawn after next'); run(25); eq(VSLEEP[0].st, 'sleep', 'still asleep after that dawn');
st([], .5); photo('ozeki'); eq(S.vsleep[0].w, S.day + 1, 'evening photo: the next dawn');
// ---- two suites: the next one is led to the free suite
st(['suiteB']); photo('kawa'); run(6); vipT = S.stats.time; run(1); ok(VIPG && VIPG.st === 'arrive', 'suite B free: the next VIP comes'); eq(cleanSuite() && cleanSuite().id, 'c4', 'suite B is the free one');
// ---- the kitten brothers sleep in a row
st(['gd_tower']); photo('r_kits'); run(6); const kz = VSLEEP[0];
{ const hd = []; const _h = catSleepHead; catSleepHead = fur => { hd.push(fur); return _h(fur); }; P.x = tcx(ROOM.c3.stand); P.y = tcy(ROOM.c3.stand) + 20; updCam(0, true); render(); catSleepHead = _h;
  eq(hd.length, 3, 'three heads on the futon'); kz.rec.w = S.day + 1; S.clock = DAWN_AT - .002; run(2); eq(kz.st, 'leave', 'up'); ok(kz.kits.every(k => dist(k.x, k.y, kz.x, kz.y) < 40), 'the little ones follow it out'); }
// ---- save mid-sleep -> load: back in its futon, wakes as planned; odd rows dropped
st(['suiteB']); photo('sakura'); run(6); const w0 = S.vsleep[0].w; saveNow();
{ const raw = JSON.parse(localStorage.getItem(SAVE + 'state')); S = loadState(raw); resetWorld(); go('play'); spawnT = 1e9;
  eq(VSLEEP.length, 1, 'loaded: one sleeper'); const e = VSLEEP[0]; ok(e && e.id === 'sakura' && e.st === 'sleep' && RT.c3.guest === e, 'sakura asleep in 月见亭'); eq(S.rooms.c3, 'occupied', 'suite occupied');
  eq(e.look.fur, VIP.sakura.fur, 'its own look'); eq(e.rec.w, w0, 'same wake day'); ok(!cleanSuite() || cleanSuite().id === 'c4', 'only suite B free');
  S.clock = DAWN_AT - .002; S.day = w0 - 1; run(.5); eq(e.st, 'leave', 'wakes after the load'); }
{ const raw = JSON.parse(JSON.stringify(defaults())); Object.assign(raw.unlocked, { garden: true }); raw.rooms = { room1: 'clean', c3: 'occupied', c4: 'occupied' }; raw.day = 9;
  raw.vsleep = [{ r: 'c3', id: 'kawa', w: 10 }, { r: 'c3', id: 'ozeki', w: 10 }, { r: 'c4', id: 'star', w: 10 }, { r: 'room1', id: 'kawa', w: 10 }, { r: 'c3', id: 'nobody' }, null, 'x', { r: 'c3', id: 'mom', w: 1e9, y: 'q' }];
  const s = loadState(raw); eq(JSON.stringify(s.vsleep), JSON.stringify([{ r: 'c3', id: 'kawa', w: 10 }]), 'one per suite, open suites, known ids only'); eq(s.rooms.c3, 'occupied', 'its suite stays occupied'); eq(s.rooms.c4, undefined, 'a locked suite: dropped');
  const raw2 = JSON.parse(JSON.stringify(defaults())); Object.assign(raw2.unlocked, { garden: true }); raw2.rooms = { room1: 'clean', c3: 'occupied' }; delete raw2.vsleep;
  const s2 = loadState(raw2); eq(s2.rooms.c3, 'messy', 'an old save: an occupied suite without a sleeper is messy'); eq(s2.vsleep.length, 0, 'no sleepers');
  const raw3 = JSON.parse(JSON.stringify(defaults())); Object.assign(raw3.unlocked, { garden: true }); raw3.day = 3; raw3.vsleep = [{ r: 'c3', id: 'mom', w: 99, y: 2 }];
  const s3 = loadState(raw3); eq(JSON.stringify(s3.vsleep), JSON.stringify([{ r: 'c3', id: 'mom', w: 5, y: 2 }]), 'mom kept, a far wake day clamped to day + 2'); }
// ---- ten minutes of the arrow bot from star 4 (it buys suite B on the way): never stuck, the suites cycle sleeper -> messy -> clean -> next
st(['chef', 'waiter1']); S.stats.vips = 2; vipT = S.stats.time + 5; spawnT = 1; ensureStaff();
{ let path = [], key = '', think = 0, asleep = 0, maxCarpet = 0, carpetT = 0;
  for (let i = 0; i < 30 * 600; i++) {
    think -= DT;
    if (think <= 0) { think = .3; const t = guideTarget(); if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
    if (path.length) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
    update(DT); if (VSLEEP.some(e => e.st === 'sleep')) asleep++; if (state === 'card') modalClose(); if (state === 'celebrate') go('play'); if (typeof DBG !== 'undefined' && i % 300 === 0) console.log(i / 30, state, tileOf(P) + '', VIPG && VIPG.st, VIPG && vipWish(), P.tray.join(), P.cookK, VSLEEP.map(e => e.st).join(), GUIDE && GUIDE.kind, GUIDE && GUIDE.tx, GUIDE && GUIDE.ty, GUIDE && GUIDE.here);
    if (VIPG && VIPG.st === 'carpet') { carpetT += DT; maxCarpet = Math.max(maxCarpet, carpetT); } else carpetT = 0;
  }
  botMove = null;
  ok(S.stats.vips >= 4, '10 min of the bot: VIPs hosted ' + (S.stats.vips - 2)); ok(asleep > 30 * 60, 'someone slept a good while (' + R(asleep / 30) + ' s)');
  ok(maxCarpet < VIP_NOSUITE, 'nobody gave up on the carpet (longest wait ' + R(maxCarpet) + ' s)'); eq(RUN.vipLeft, 0, 'nobody left unhappy');
  console.log('  bot: ' + (S.stats.vips - 2) + ' hosted in 10 min, asleep ' + R(asleep / 30) + ' s, longest carpet wait ' + R(maxCarpet) + ' s'); }
let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'render: ' + threw);
console.log(errs.length ? 'SYS VIPSLEEP FAIL\n  ' + errs.join('\n  ') : 'SYS VIPSLEEP OK');
if (errs.length) process.exitCode = 1;
