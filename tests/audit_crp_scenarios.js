// Targeted state-machine scenarios (stage 5 audit) that the guide-following bots never walk into:
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_crp_scenarios.js --seed 1
// A. a VIP greeted and then abandoned mid-escort (you walk far away and do nothing)
// B. reload in every VIP state (carpet / follow halted / toSuite / seated holding / soak / leave)
// C. a full tray of things nobody wants any more + a new want of another kind: where does the arrow send you?
// D. the menu opened at awkward moments (celebration due, a key held, a banner / line / first card up)
const DT = 1 / 30;
const step = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); } };
let bad = 0; const check = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
function star4() {
  newGame(); S.tut.moved = true;
  for (const u of UNLOCKS) if (!u.need5 && u.id !== 'roten' && u.id !== 'maid4' && u.id !== 'suiteB') { S.unlocked[u.id] = true; S.paid[u.id] = u.price; }
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = 4; S.done = true; S.clock = .3; S.stats.time = 200;
  resetWorld(); go('play'); vipT = 1e9;
}
const at = (tx, ty) => { P.x = tcx([tx, ty]); P.y = tcy([tx, ty]); updCam(0, true); };
function vipToCarpet() { vipArrive(); for (let i = 0; i < 30 * 60 && VIPG.st === 'arrive'; i++) update(DT); }
// ---------------------------------------------------------------- A
console.log('A. VIP abandoned mid-escort');
star4(); at(20, 27); vipToCarpet();
check(VIPG.st === 'carpet', 'VIP on the carpet (' + VIPG.st + ')');
P.x = VIPG.x; P.y = VIPG.y - 8; step(30);
check(VIPG.st === 'follow', 'greeted -> follow');
at(5, 32);   // walk off to the shop and stand there
step(30 * 5);
check(VIPG.halt === true, 'it stops and waits ("...")');
GUIDE = guideTarget(); check(!!GUIDE && GUIDE.kind === 'vip' && GUIDE.rule === 2, 'arrow: back to the VIP (' + (GUIDE && GUIDE.kind + ' rule ' + GUIDE.rule) + ')');
let t0 = S.stats.time; step(30 * 125, () => {});
console.log('  (vip t ' + (VIPG && R(VIPG.t)) + ')');
check(VIPG && ['toSuite', 'seated'].includes(VIPG.st), 'after ' + R(S.stats.time - t0) + ' s it went to a suite by itself (' + (VIPG && VIPG.st) + ')');
step(30 * 30); const suite = VIPG && VIPG.suite;
check(VIPG && VIPG.st === 'seated', 'seated in ' + suite);
t0 = S.stats.time; step(30 * 130);
check(!VIPG || VIPG.st === 'leave', 'nobody served it: it leaves after ~' + VIP_IDLE + ' s (' + (VIPG ? VIPG.st : 'gone') + ')');
step(30 * 60);
check(!VIPG, 'walked out');
check(!RT[suite].guest, 'no guest link on the suite (now ' + S.rooms[suite] + ')');
check(S.vipOwe === 0 && vipT > S.stats.time, 'nothing owed; next VIP scheduled in ' + R(vipT - S.stats.time) + ' s');
// ---------------------------------------------------------------- B
console.log('B. reload in every VIP state');
const reload = () => { saveNow(); S = loadState(); resetWorld(); go('play'); };
const states = {
  carpet: () => { vipToCarpet(); },
  halted: () => { vipToCarpet(); P.x = VIPG.x; P.y = VIPG.y - 8; step(30); at(5, 32); step(30 * 4); },
  toSuite: () => { vipToCarpet(); vipToSuite(cleanSuite()); step(5); },
  holding: () => { vipToCarpet(); vipToSuite(cleanSuite()); step(30 * 40, () => { if (VIPG.st === 'seated' && vipWish() && !(VIPG.hold > 0) && VIPG.wi === 0) vipWishDone(); }); },
  soak: () => { vipToCarpet(); vipToSuite(cleanSuite()); step(30 * 40); for (let k = 0; k < 3 && VIPG.st !== 'soak'; k++) { if (VIP[VIPG.id].wishes[VIPG.wi] === 'bath') { setSt(VIPG, 'soak'); VIPG.tt = VIP_SOAK_T; } else { VIPG.hold = 0; vipWishDone(); } } step(10); },
  leave: () => { vipToCarpet(); vipToSuite(cleanSuite()); step(30 * 40); vipLeave(false); step(10); },
};
for (const [name, set] of Object.entries(states)) {
  star4(); at(20, 27); set();
  const st0 = VIPG ? VIPG.st : '-', owe = S.vipOwe, recep0 = S.piles.recep || 0, hold = VIPG && VIPG.hold, sui = VIPG && VIPG.suite;
  reload();
  const suiteOk = SUITES.filter(rm => roomOpen(rm)).every(rm => !RT[rm.id].guest && (S.rooms[rm.id] === 'clean' || S.rooms[rm.id] === 'messy'));
  check(!VIPG && S.vipOwe === 0 && suiteOk && (S.piles.recep || 0) - recep0 === R(owe * .5) && vipT > S.stats.time,
    name + ' (was ' + st0 + (hold ? ' hold ' + hold.toFixed(1) : '') + ', owed ' + owe + ') -> refund ' + ((S.piles.recep || 0) - recep0) + ', suite ' + (sui ? S.rooms[sui] : '-') + ', next VIP in ' + R(vipT - S.stats.time) + ' s');
  step(30 * 5); check(true, '  5 s after: ' + (VIPG ? VIPG.st : 'no VIP'));
}
// ---------------------------------------------------------------- C
console.log('C. a full tray of stale things');
star4(); delete S.unlocked.tray1; delete S.unlocked.tray2; resetWorld(); go('play'); vipT = 1e9;
check(trayCap() === 2, 'tray holds ' + trayCap());
// two teas picked for two calls that then ran out
P.tray = ['tea', 'tea']; at(16, 20);
// a VIP seated in its suite wishing kaiseki (ozeki: kaiseki first)
S.vipNext = 1; vipToCarpet(); vipToSuite(cleanSuite()); step(30 * 30);
check(VIPG && VIPG.st === 'seated' && vipWish() === 'kaiseki', 'VIP seated, wish: ' + (VIPG && vipWish()));
VIPG.t = VIP_IDLE - VIP_URGENT + 1;   // its wish is getting late
P.tray = ['tea', 'tea']; for (const g of GUESTS) g.call = null; GUIDE = guideTarget();
console.log('  arrow with [tea, tea] on a 2-slot tray, nobody wants tea, VIP wants kaiseki:', GUIDE ? GUIDE.kind + ' rule ' + GUIDE.rule + ' ' + GUIDE.key : 'none');
check(!!GUIDE && (GUIDE.kind === 'stove' || GUIDE.kind === 'urn' || GUIDE.kind === 'milk' || GUIDE.kind === 'pass'), 'the arrow sends you somewhere the tray can be emptied / the kaiseki cooked');
// with a free slot it does
P.tray = ['tea']; for (const g of GUESTS) g.call = null; GUIDE = guideTarget();
console.log('  same with [tea] (one slot free):', GUIDE ? GUIDE.kind + ' rule ' + GUIDE.rule : 'none');
// and a new tea-less call while the tray is full of stale milk
star4(); delete S.unlocked.tray1; delete S.unlocked.tray2; resetWorld(); go('play'); vipT = 1e9; P.tray = ['milk', 'milk']; at(16, 20);
addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); gu.x = tcx([17, 13]); gu.y = tcy([17, 13]); setSt(gu, 'leave'); gu.st = 'browse'; gu.tt = 99; BROWSE.occ = gu;
gu.call = { k: 'tea', t: 50, max: 50 };
GUIDE = guideTarget();
console.log('  arrow with [milk, milk] stale, a guest calls for tea (50 s left):', GUIDE ? GUIDE.kind + ' rule ' + GUIDE.rule + ' ' + GUIDE.key : 'none');
check(!!GUIDE && GUIDE.rule === 10, 'rule 10 (fetch the tea) despite the full tray');
// ---------------------------------------------------------------- D
console.log('D. the menu at awkward moments');
star4(); at(20, 27);
banner('day', 99, { g: 1, h: 1 }); lineSay(P, 'P01'); firstTime('call');
KEYS.ArrowLeft = true; step(3);
const snapD = () => JSON.stringify([P.x, P.y, S.stats.time, S.clock, BANNER_Q.map(b => b.age), LINE && LINE.t, FIRST_Q.map(f => f.vis), UIT]);
openMenu(); const a = snapD(); step(60); const b = snapD(); closeMenu();
check(a === b, 'key held + banner + line + first card: nothing moves in the menu');
KEYS.ArrowLeft = false;
celebrateAt = T + .5; openMenu(); step(60); check(state === 'menu', 'celebration due while the menu is open: the menu stays (' + state + ')'); closeMenu(); step(2); check(state === 'play' || state === 'celebrate', 'after closing: ' + state);
// ---------------------------------------------------------------- E
console.log('E. a reload right after a VIP leaves (WORKFLOW 5: a reload must not beat playing)');
star4(); S.unlocked.suiteB = true; S.paid.suiteB = UNLOCK.suiteB.price; S.rooms.c4 = 'clean'; S.peak = 5; resetWorld(); go('play');
for (let k = 0; k < 3; k++) {
  vipT = S.stats.time; update(DT); vipToSuite(cleanSuite()); step(30 * 30);
  while (VIPG && VIPG.st !== 'leave') { if (VIPG.st === 'seated' && vipWish()) { VIPG.hold = 0; vipWishDone(); } else update(DT); }
  const played = vipT - S.stats.time; reload(); const after = vipT - S.stats.time;
  check(after >= played - 1, 'VIP served and gone: next VIP in ' + R(played) + ' s; after a reload in ' + R(after) + ' s');
  step(30 * 5);
}
console.log(bad ? 'SCENARIOS: ' + bad + ' FAIL' : 'SCENARIOS OK');
process.exitCode = bad ? 1 : 0;
