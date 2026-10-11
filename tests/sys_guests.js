// SPEC_v2 4.6 + 4.12: guest types (weights per star, a type whose favourite room doesn't exist counts as a regular;
// looks, elder speed x0.8), favourite rooms (elder -> near the onsen, couple -> combo room, family -> cottage, regular ->
// the plainest), what a met preference gives (♥ +1, tip x1.5), followers (partner / kitten), and the v2 flow
// room -> breakfast -> bath -> souvenirs (30%) -> leave with every closed / full step skipped; a happy leave ♥ +1.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_guests.js --seed 11
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + a.toFixed(3) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
function st(list, peak) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); resetWorld(); go('play'); spawnT = 1e9; P.x = 40; P.y = 34 * 16 + 4;
}
function guest(s, o) { addGuest(o && o.type || 'regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, { st: s, t: 0, inside: true }, o || {}); return gu; }
function mix(n) { const c = { regular: 0, elder: 0, couple: 0, family: 0 }; for (let i = 0; i < n; i++) c[pickType()]++; for (const k in c) c[k] /= n; return c; }
const N = 3000, TOL = .03;
const ST2 = ['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'room6', 'maid1', 'shop', 'd_scroll', 'd_ikebana'];
const ST3 = ST2.concat(['dining', 'room7', 'w1']), ST4 = ST3.concat(['garden']);
// ---- spawn weights
st([], 1); eq(mix(500).regular, 1, 'star 1: all regulars');
st(ST2, 2); eq(mix(500).regular, 1, 'star 2 without a near-onsen room: elders count as regulars');
S.unlocked.room7 = true; S.rooms.room7 = 'clean'; near(mix(N).elder, .15, TOL, 'star 2 elders 15%');
st(ST3, 3); { const m = mix(N); near(m.elder, .15, TOL, 'star 3 elders'); eq(m.couple, 0, 'star 3 without a combo room: no couples'); }
S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; { const m = mix(N); near(m.couple, .2, TOL, 'star 3 couples 20% with a combo room'); near(m.regular, .65, TOL, 'star 3 regulars 65%'); }
st(ST4, 4); S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; { const m = mix(N); near(m.family, .15, TOL, 'star 4 families 15% (cottage C1)'); near(m.regular, .5, TOL, 'star 4 regulars 50%'); }
st(ST4.concat(['roten', 'c2', 'bigbath']), 5); S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; { const m = mix(N); near(m.regular, .45, TOL, 'star 5 regulars'); near(m.family, .2, TOL, 'star 5 families'); }
// ---- looks, followers, speed
st(ST4, 4);
{ let sp = { elder: [], regular: [] };
  for (let i = 0; i < 300; i++) { addGuest('elder'); addGuest('regular'); }
  for (const gu of GUESTS) if (sp[gu.type]) sp[gu.type].push(gu.spd);
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  near(avg(sp.elder) / avg(sp.regular), .8, .03, 'elders walk x0.8');
  const e = GUESTS.find(g => g.type === 'elder'); eq(e.look.outfit, 'haori', 'elder haori'); eq(e.look.acc, 'cane', 'elder cane'); ok(ELDER_FURS.includes(e.look.fur), 'elder fur');
  GUESTS.length = 0; Q.length = 0;
  addGuest('couple'); const c = GUESTS[0]; eq(c.look.hat, 'flower', 'couple leader flower'); eq(c.mate.kind, 'cat', 'partner is a cat'); eq(c.mate.look.hat, 'straw', 'partner straw hat');
  addGuest('family'); const f = GUESTS[1]; eq(f.mate.kind, 'kitten', 'family kitten'); eq(f.mate.look.fur, f.look.fur, 'kitten takes after its parent');
  eq(GUESTS.length, 2, 'followers are not guests (GUEST_MAX counts leaders only)'); }
// ---- favourite rooms
st(ST4, 4);
{ S.decor['room2:A'] = 'd_scroll'; S.decor['room2:B'] = 'd_ikebana'; S.decor['room3:A'] = 'd_scroll';
  const mk = t => ({ type: t });
  eq(freeRoom(mk('regular')).id, 'room1', 'regular -> plainest room');
  ok(['room7', 'room8'].includes(freeRoom(mk('elder')).id), 'elder -> near-onsen room');
  eq(freeRoom(mk('couple')).id, 'room2', 'couple -> combo room');
  eq(freeRoom(mk('family')).id, 'c1', 'family -> cottage');
  S.rooms.room2 = 'messy'; ok(!['c1', 'room2'].includes(freeRoom(mk('couple')).id) && !roomCombo(freeRoom(mk('couple'))), 'couple, no combo free -> plainest');
  for (const rm of GUEST_ROOMS) if (!rm.cottage) S.rooms[rm.id] = 'messy';
  eq(freeRoom(mk('regular')).id, 'c1', 'regular takes a cottage only when nothing else is free'); }
// ---- preference met: ♥ +1, sparkly heart, tip x1.5 on waking; a combo room ♥ +1 more
st(ST4, 4);
{ S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana';
  addGuest('couple'); const c = GUESTS[0]; Object.assign(c, { st: 'queue', ready: true }); const h0 = S.hearts;
  checkIn(c, ROOM.room1); ok(c.pref, 'couple in a combo room: preference met'); eq(S.hearts - h0, 2, 'favourite ♥1 + combo room ♥1'); ok(c.heart2 > 0, 'sparkly heart');
  Object.assign(c, { st: 'sleep', tt: .01, t: 2, rolled: true }); S.rooms.room1 = 'occupied'; const p0 = S.piles.room1 || 0; updGuest(c, DT);
  eq((S.piles.room1 || 0) - p0, fee('tip', { rm: ROOM.room1, gu: c, pref: true }), 'tip with preference'); ok(fee('tip', { rm: ROOM.room1, pref: true }) > fee('tip', { rm: ROOM.room1 }), 'x1.5 is more');
  addGuest('elder'); const e = GUESTS[GUESTS.length - 1]; Object.assign(e, { st: 'queue', ready: true }); checkIn(e, ROOM.room2); ok(!e.pref, 'elder in a standard room: not met (no penalty)');
  eq(S.album.types.couple, true, 'album: couple seen'); ok(S.album.furs[c.look.fur], 'album: fur seen'); }
// ---- the flow: room -> seat -> bath -> browse (30%) -> leave, skipping what is closed / full
st(ST4, 4);
{ const flow = () => { const gu = guest('sleep', { room: null }); guestNext(gu, 'room'); if (gu.st === 'toTea') { TEA_AT.occ = null; guestNext(gu, 'tea'); }   // G3: half stop at the urn first
    const s = gu.st; if (gu.seat >= 0) leaveSeat(gu); if (BROWSE.occ === gu) BROWSE.occ = null; GUESTS.length = 0; return s; };
  eq(flow(), 'toSeat', 'dining open: breakfast first');
  for (let i = 0; i < 4; i++) SEAT_OCC[i] = { seat: i };   // all seats taken
  const s2 = flow(); eq(s2, 'toBath', 'no seat -> bath'); SEAT_OCC.fill(null);
  let b = 0; const M = 2000; for (let i = 0; i < M; i++) { const gu = guest('milk'); guestNext(gu, 'bath'); if (gu.st === 'toBrowse') b++; BROWSE.occ = null; GUESTS.length = 0; }
  near(b / M, BROWSE_P, .03, 'after the bath: 30% browse the shop');
  const g1 = guest('milk'); BROWSE.occ = { x: 1 }; guestNext(g1, 'bath'); eq(g1.st, 'leave', 'browse spot taken -> leave'); BROWSE.occ = null;
  const g2 = guest('toBrowse', { x: tcx(SPOT.browse), y: tcy(SPOT.browse) }); BROWSE.occ = g2; const sp0 = S.piles.shop || 0, h0 = S.hearts;
  for (let i = 0; i < 30 * 3; i++) updGuest(g2, DT);
  eq((S.piles.shop || 0) - sp0, fee('souv', { gu: g2 }), 'souvenir fee in the shop pile'); eq(g2.st, 'leave', 'then home'); eq(S.hearts - h0, 1, 'a happy leave: ♥ +1'); ok(!BROWSE.occ, 'browse spot freed'); }
st(ST2.filter(id => id !== 'shop'), 2); { const gu = guest('milk'); guestNext(gu, 'bath'); eq(gu.st, 'leave', 'no shop -> leave'); }
st(['room2'], 1); { const gu = guest('sleep'); guestNext(gu, 'room'); eq(gu.st, 'leave', 'star 1: straight home'); }
// ---- a long busy run at star 5 with every type: followers keep up, nobody stuck, caps hold
st(UNLOCKS.filter(u => !u.need5).map(u => u.id), 5);
{ for (const rm of GUEST_ROOMS) { S.decor[rm.id + ':A'] = 'd_scroll'; if (rm.id < 'room5') S.decor[rm.id + ':B'] = 'd_ikebana'; }
  spawnT = 1; S.basket = 10; S.tut.moved = true;
  const seen = {}; let far = 0, stuck = 0, maxG = 0, parkedOk = true;
  for (let i = 0; i < 30 * 900; i++) {
    update(DT); if (S.basket < 3) S.basket = 10;
    if (i % 30) continue;
    try { render(); } catch (e) { errs.push('render threw ' + (e && e.stack || e)); break; }
    if (i % 900 === 0) { P.x = [17, 5, 30, 17, 8][(i / 900) % 5] * 16 + 8; P.y = [26, 24, 20, 4, 12][(i / 900) % 5] * 16 + 8; updCam(0, true); }   // look around (draws dining / garden / onsen)
    maxG = Math.max(maxG, GUESTS.length);
    for (const gu of GUESTS) {
      seen[gu.type] = true;
      if (gu.mate && gu.mate.mode === 'follow' && dist(gu.x, gu.y, gu.mate.x, gu.mate.y) > 200) far++;
      if (gu.mate && gu.mate.mode === 'park' && !['sleep', 'bathing', 'seated', 'eat'].includes(gu.st)) parkedOk = false;
      if (gu.t > 180 && !['sleep', 'bathing', 'eat'].includes(gu.st)) stuck++;
    }
  }
  eq(Object.keys(seen).sort().join(), 'couple,elder,family,regular', 'every type showed up');
  eq(far, 0, 'followers within 200 px'); eq(stuck, 0, 'no guest stuck > 180 s'); ok(parkedOk, 'followers only parked while the leader sleeps / bathes / sits');
  ok(maxG <= GUEST_MAX, 'at most 40 guests: ' + maxG); ok(S.stats.diners > 0 && S.stats.guests > 100, 'busy inn: ' + S.stats.guests + ' guests, ' + S.stats.diners + ' diners'); }
console.log(errs.length ? 'SYS GUESTS FAIL\n  ' + errs.join('\n  ') : 'SYS GUESTS OK');
if (errs.length) process.exitCode = 1;
