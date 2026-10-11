// ---- guests (4.6): regular / elder / couple / family. A couple's partner and a family's kitten are followers
// (gu.mate), not guests: they don't count towards GUEST_MAX and never take a room, a slot or a seat of their own.
// the type of the next arrival: per-star weights; a type whose favourite room doesn't exist yet counts as a regular
function pickType() {
  const w = TYPE_W[star()].slice(), open = GUEST_ROOMS.filter(rm => roomOpen(rm));
  for (let i = 1; i < 4; i++) if (w[i] && !open.some(PREF[TYPE_IDS[i]])) { w[0] += w[i]; w[i] = 0; }
  let x = Math.random() * (w[0] + w[1] + w[2] + w[3]);
  for (let i = 0; i < 4; i++) { x -= w[i]; if (x < 0) return TYPE_IDS[i]; }
  return 'regular';
}
const ELDER_FURS = ['gray', 'graytabby', 'white'];
function addGuest(type) {
  const furs = Object.keys(FURS).filter(k => k !== 'orange');
  type = GUEST_TYPES[type] ? type : pickType();
  const fur = type === 'elder' ? pick(ELDER_FURS) : pick(furs);
  const look = type === 'elder' ? { fur, outfit: 'haori', acc: 'cane' } : { fur, outfit: 'guest', shirt: pick(SHIRTS), bag: type === 'regular' && Math.random() < .5 };
  if (type === 'couple') look.hat = 'flower';
  const gu = { id: ++guestN, type, x: EXIT[0], y: EXIT[1], dir: 'up', moving: false, walkT: 0, path: [], goal: null, spd: G_SPEED * rand(.9, 1.1) * (GUEST_TYPES[type].speed || 1),
    look, ox: R(rand(-2, 2)), st: 'arrive', t: 0, pat: S.unlocked.recep ? PATIENCE : PATIENCE_EARLY, wait: 0, ck: 0, front: 0, room: null, slot: -1, heart: 0, heart2: 0, embT: 0,
    tt: 0, ready: false, bub: null, urg: 0, call: null, callGone: 0, rolled: false, seat: -1, seat2: -1, served: false, claim: null, pref: false, inside: false, mate: null };
  if (type === 'couple' || type === 'family') gu.mate = { kind: type === 'couple' ? 'cat' : 'kitten', look: type === 'couple' ? { fur: pick(furs), outfit: 'guest', shirt: pick(SHIRTS), hat: 'straw' } : { fur },
    x: gu.x, y: gu.y, dir: 'up', moving: false, walkT: 0, path: [], goal: null, q: [], mode: 'follow' };
  GUESTS.push(gu); Q.push(gu);
}
// ---- followers (4.6; stage 2B reuses this for the VIP and the pets): the leader drops a crumb every 4 px into the
// follower's queue; the follower walks the crumbs at its own speed and stops `gap` px (path length) behind the leader.
function crumbTo(L, f) { const q = f.q, last = q.length ? q[q.length - 1] : [f.x, f.y]; if (Math.hypot(L.x - last[0], L.y - last[1]) >= 4) q.push([L.x, L.y]); }
function followStep(f, L, gap, spd, dt) {
  const q = f.q;
  if (q.length > 64) { const c = q.splice(0, q.length - 32).pop(); f.x = c[0]; f.y = c[1]; }   // fell far behind: catch up
  let rest = 0, px = f.x, py = f.y;
  for (const c of q) { rest += Math.hypot(c[0] - px, c[1] - py); px = c[0]; py = c[1]; }
  rest += Math.hypot(L.x - px, L.y - py);
  let move = Math.min(spd * dt, Math.max(0, rest - gap));
  f.moving = move > .01;
  while (move > 0 && q.length) {
    const [cx, cy] = q[0], dx = cx - f.x, dy = cy - f.y, d = Math.hypot(dx, dy);
    if (d > .01) f.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    if (d <= move) { f.x = cx; f.y = cy; move -= d; q.shift(); } else { f.x += dx / d * move; f.y += dy / d * move; move = 0; }
  }
  if (f.moving) f.walkT += dt; else if (!q.length && rest > .5) f.dir = L.dir;
}
// a partner / kitten: 'follow' (walks behind), 'seat' (walks to the other seat of the table), 'park' (in bed, in the
// bath, sitting: drawn with the leader)
function updMate(gu, dt) {
  const m = gu.mate; if (!m) return;
  if (m.mode === 'follow') { crumbTo(gu, m); followStep(m, gu, FOLLOW_GAP, gu.spd * 1.3, dt); }
  else if (m.mode === 'seat') { const se = SEATS[gu.seat2]; if (!se) { m.mode = 'follow'; return; } goTo(m, se.at[0], se.at[1]); if (stepPath(m, dt, gu.spd)) { m.mode = 'park'; m.dir = se.face; } }
  else m.moving = false;
}
function unpark(gu, at) { const m = gu.mate; if (!m) return; if (at) { m.x = at[0]; m.y = at[1]; } if (m.mode !== 'follow') { m.mode = 'follow'; m.q = []; m.path = []; m.goal = null; } }
// the free clean room for a guest: its favourite kind first (4.6), then the plainest (no decor -> decor -> combo ->
// cottage), keeping the good rooms for picky guests; suites are VIP-only
function roomRank(rm) { const [a, b] = decorOf(rm); return (rm.cottage ? 4 : 0) + (comboOf(a, b) ? 2 : (a || b) ? 1 : 0); }
const roomFree = rm => roomOpen(rm) && S.rooms[rm.id] === 'clean' && !RT[rm.id].guest;
function freeRoom(gu) {
  if (gu && gu.press) return pressRoom();   // v2.1: the reporter gets the best free room (16.4, press.js)
  const pf = gu && PREF[gu.type];
  let best = null, bp = false;
  for (const rm of GUEST_ROOMS) {
    if (!roomFree(rm)) continue;
    const p = !!(pf && pf(rm));
    if (!best || (p && !bp) || (p === bp && roomRank(rm) < roomRank(best))) { best = rm; bp = p; }
  }
  return best;
}
// 4.12: after the room (woken up, checked out) -> tea at the urn (v2.0.1 G3) -> breakfast -> bath (+ milk) -> souvenirs
// -> home. A step that is closed or full is skipped; only the queue makes guests angry.
const NEXT = ['room', 'tea', 'seat', 'bath', 'browse'];
function guestNext(gu, from) {
  for (let i = NEXT.indexOf(from) + 1; i < NEXT.length; i++) {
    const k = NEXT[i];
    if (k === 'tea' && S.unlocked.tea && !TEA_AT.occ && Math.random() < TEA_P) { TEA_AT.occ = gu; setSt(gu, 'toTea'); gu.goal = null; return; }
    if (k === 'seat' && S.unlocked.dining && takeSeat(gu)) { RUN.seated++; setSt(gu, 'toSeat'); gu.goal = null; return; }
    if (k === 'bath' && S.unlocked.onsen) { setSt(gu, 'toBath'); gu.goal = null; return; }
    if (k === 'browse' && S.unlocked.shop && !BROWSE.occ && Math.random() < BROWSE_P) { BROWSE.occ = gu; setSt(gu, 'toBrowse'); gu.goal = null; return; }
  }
  guestLeave(gu, false);
}
function guestLeave(gu, angry) {
  unpark(gu);
  setSt(gu, angry ? 'angry' : 'leave'); gu.goal = null; goTo(gu, EXIT_TILE[0], EXIT_TILE[1], EXIT.slice());
  if (gu.mate) gu.path.push([EXIT[0], EXIT[1] + 24]);   // walk on a little so the partner / kitten leaves the screen too
  if (!angry) { addHearts(1); lineSay(gu, star() >= 5 ? 'G17|G18|G19' : 'G17|G18'); }   // a happy guest: hearts +1 (4.9)
}
// ---- calls (4.2). Need 茶台; milk needs 牛奶 and a night snack 食堂 (else tea). At most 2 at a time (3 from star 3), 6 s
// apart; the call rides along with the guest until served, timed out, or the guest gets the thing by itself.
// v2.0.1 G3: a call is an optional tip. Until the tea runner (茶房) is hired the innkeeper may bring it (the arrow never
// sends you for one); once hired, the runner brings them all and the tip lands in the cash box. Timing out costs nothing
// and says nothing.
const callCount = () => { let n = 0; for (const gu of GUESTS) if (gu.call) n++; return n; };
const hasTeaboy = () => !!S.unlocked.teaboy;
function tryCall(gu, k, p) {
  if (!S.unlocked.tea || gu.call || Math.random() >= p) return false;
  if (callCount() >= callMax() || S.stats.time - lastCallAt < CALL_GAP) return false;
  if ((k === 'milk' && !S.unlocked.milk) || (k === 'rice' && !S.unlocked.dining)) k = 'tea';
  const t = callT(); gu.call = { k, t, max: t }; gu.callBy = null; lastCallAt = S.stats.time; RUN.calls++;
  sfx('ring'); if (!hasTeaboy()) firstTime('call'); lineSay(gu, { tea: 'G22', milk: 'G23', rice: 'G24' }[k]);
  return true;
}
function callExpire(gu) { gu.call = null; gu.callBy = null; gu.callGone = .25; RUN.callsMissed++; }   // no anger, no fee lost, no hearts lost, no sigh
// the guest got it by itself (tea at the urn, milk at the machine, breakfast): the call just ends - no tip, no sigh
function callSelf(gu, k) { if (!gu.call || gu.call.k !== k) return; gu.call = null; gu.callBy = null; RUN.callsSelf++; }
// by = the tea runner who brought it (its tip goes into the cash box at the desk - one place to pick up, no fast bonus),
// else the innkeeper (the wallet)
function serveCall(gu, by) {
  const c = gu.call, fast = !by && c.t > c.max * (1 - CALL_FAST), [x, y] = guestSpot(gu);
  gu.call = null; gu.callBy = null; gu.heart = 1;
  if (by) { const v = R(callReward(false) * TEA_TIP_K); S.piles.recep = (S.piles.recep || 0) + v; RUN.callsStaff++; gainXp(by, 1); pop('+' + v, x, y - 20, '#ffe9a8', 8, .9); }
  else { earn(callReward(fast), x, y - 12); firstDone('call'); }   // straight into the wallet
  addHearts(fast ? 2 : 1); S.stats.calls++; if (fast) S.stats.callsFast++;
  lineSay(gu, fast ? 'G27|G37|G38' : 'G25|G26|G39'); sfx('serve'); markDirty();
}
// ---- dining seats (4.3): a party (couple / family) takes a whole table; a guest alone sits at a half-taken table
// first, keeping empty tables for parties. No free seat -> no breakfast (nobody queues for a seat).
const seatOpen = i => !!S.unlocked[SEATS[i].need];
function takeSeat(gu) {
  let a = -1, best = 0;
  for (let i = 0; i < SEATS.length; i += 2) {
    if (!seatOpen(i)) continue;
    const f0 = !SEAT_OCC[i], f1 = !SEAT_OCC[i + 1];
    if (gu.mate) { if (f0 && f1) { a = i; break; } continue; }
    const s = f0 && f1 ? 1 : f0 || f1 ? 2 : 0;
    if (s > best) { best = s; a = f0 ? i : i + 1; }
  }
  if (a < 0) return false;
  gu.seat = a; SEAT_OCC[a] = gu; gu.served = false; gu.claim = null;
  if (gu.mate) { gu.seat2 = a + 1; SEAT_OCC[a + 1] = gu; }
  return true;
}
function leaveSeat(gu) {
  for (const i of [gu.seat, gu.seat2]) if (i >= 0 && SEAT_OCC[i] === gu) SEAT_OCC[i] = null;
  if (gu.mate && gu.seat2 >= 0) unpark(gu, gu.mate.mode === 'park' ? [tcx(SEATS[gu.seat2].at), tcy(SEATS[gu.seat2].at)] : null);
  gu.seat = gu.seat2 = -1; gu.served = false; gu.claim = null;
}
function serveSeat(gu) { gu.served = true; gu.claim = null; setSt(gu, 'eat'); gu.tt = EAT_T; sfx('eat'); lineSay(gu, 'G15'); callSelf(gu, 'rice'); }
// plates on a table: 'set' while someone eats there, 'eaten' for 3 s after
function tableState(ti) {
  for (const i of [ti * 2, ti * 2 + 1]) { const gu = SEAT_OCC[i]; if (gu && gu.st === 'eat') return 'set'; }
  return T - TABLE_EATEN[ti] < 3 ? 'eaten' : 'empty';
}
// where the innkeeper hands things over (4.1): a sleeper at the futon's centre, a bather at the water's edge, a diner on
// the seat, anyone else where they stand. guestTile = the tile the arrow / bot goes to for it.
function guestSpot(gu) {
  if (gu.st === 'sleep' && gu.room) return ROOM[gu.room].cleanC;
  if (gu.st === 'bathing' && gu.slot >= 0) return [SLOTS[gu.slot].x * TILE + 8, 4 * TILE - 2];
  if ((gu.st === 'seated' || gu.st === 'eat') && gu.seat >= 0) return [tcx(SEATS[gu.seat].at), tcy(SEATS[gu.seat].at)];
  return [gu.x, gu.y];
}
function guestTile(gu) {
  if (gu.st === 'sleep' && gu.room) return ROOM[gu.room].cleanT;
  if (gu.st === 'bathing' && gu.slot >= 0) return [SLOTS[gu.slot].x, 4];
  if ((gu.st === 'seated' || gu.st === 'eat') && gu.seat >= 0) return SEATS[gu.seat].at;
  const t = tileOf(gu); if (walkable(t[0], t[1])) return t;
  // a guest can be over a tile you can't stand on (walking past a table to its seat): the nearest one around it you can
  let best = t, bd = 1e9;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = t[0] + dx, y = t[1] + dy; if (walkable(x, y)) { const d = dist(gu.x, gu.y, x * TILE + 8, y * TILE + 8); if (d < bd) { bd = d; best = [x, y]; } } }
  return best;
}
// a free bath slot: the onsen first; at night the roten first (4.12) - and for ROTEN_FIRST s after it opens, so the last
// star's reward isn't an empty bath by day (18.2; POPA is runtime-only, a load never re-triggers it)
const ROTEN_FIRST = 180;
function freeSlot() {
  const order = SLOTS.map((s, i) => i), night = dayLight().night >= .5 || (POPA.roten !== undefined && T - POPA.roten < ROTEN_FIRST);   // 18.2
  if (night) order.sort((a, b) => (SLOTS[b].roten ? 1 : 0) - (SLOTS[a].roten ? 1 : 0));
  for (const i of order) if (slotOpen(i) && !SLOT_OCC[i]) return i;
  return -1;
}
// The guest state machine v2 (4.12):
//   arrive -> queue (patience; runs out = angry) -> check-in (zones) -> toRoom -> sleep (a call may come 1 s in)
//   -> wake: messy room, tip, check out -> [tea, TEA_P] toTea -> tea (pays at the urn, G3) -> [dining] toSeat -> seated
//   (<= SEAT_WAIT) -> eat -> breakfast fee -> [onsen] toBath -> towel (<= BATH_WAIT) -> toSlot -> bathing -> [milk] toMilk -> milk
//   -> [shop, 30%] toBrowse -> browse -> souvenir fee -> leave.  Every step that is closed or full is skipped.
function updGuest(gu, dt) {
  gu.t += dt; if (gu.heart > 0) gu.heart -= dt; if (gu.heart2 > 0) gu.heart2 -= dt; if (gu.embT > 0) gu.embT -= dt; if (gu.callGone > 0) gu.callGone -= dt;
  if (gu.call && (gu.call.t -= dt) <= 0) callExpire(gu);
  if (!gu.inside && gu.y < 29 * TILE) {   // in through the door
    gu.inside = true; if (gu.type === 'couple') gu.heart = 1;   // a couple comes in with a pink heart
    lineSay(gu, freeRoom() ? (S.unlocked.onsen ? 'G01|G03' : 'G01') : 'G02');
  }
  const walk = () => stepPath(gu, dt, gu.spd);
  switch (gu.st) {
    case 'arrive': case 'queue': {
      const i = Q.indexOf(gu), sp = QSPOTS[Math.max(0, i)];
      goTo(gu, sp[0], sp[1]);
      gu.ready = walk();
      if (gu.ready) { gu.dir = 'up'; if (gu.st === 'arrive') setSt(gu, 'queue'); }
      if (gu.st === 'queue') {
        gu.pat -= dt;
        if (i === 0 && gu.ready) { gu.front += dt; if (gu.front >= 3 && gu.front - dt < 3 && !deskManned()) lineSay(gu, 'G04'); }
        if (gu.pat < PATIENCE * .4 && gu.pat + dt >= PATIENCE * .4) lineSay(gu, 'G05');
        if (gu.pat <= 0) { Q.splice(i, 1); S.stats.angry++; guestLeave(gu, true); SFX.hmph(); lineSay(gu, 'G20'); markDirty(); }
      }
      break;
    }
    case 'toRoom': {
      const rm = ROOM[gu.room]; goTo(gu, rm.stand[0], rm.stand[1]);
      if (walk()) { setSt(gu, 'sleep'); gu.tt = SLEEP_T; gu.rolled = false; S.rooms[gu.room] = 'occupied'; if (gu.mate) gu.mate.mode = 'park'; lineSay(gu, dayLight().night > .5 ? 'G07|G33' : 'G07'); markDirty(); }
      break;
    }
    case 'sleep':
      gu.tt -= dt;
      if (gu.t >= 3 && gu.t - dt < 3) lineSay(gu, 'G08');   // chat lines while lying / soaking / eating (8.2)
      if (!gu.rolled && gu.t >= 1) { gu.rolled = true; const r = CALL_ROLL[ROOM[gu.room].trait]; if (r) tryCall(gu, r[0], r[1]); }
      if (gu.tt <= 0) {
        const id = gu.room, rm = ROOM[id]; S.rooms[id] = 'messy'; S.piles[id] = (S.piles[id] || 0) + fee('tip', { rm, gu, pref: gu.pref });
        RT[id].guest = null; RT[id].cleanP = 0; gu.room = null; gu.dir = 'down'; markDirty();
        unpark(gu); lineSay(gu, 'G09');
        guestNext(gu, 'room');   // the room is free first: breakfast, the bath and souvenirs come after checking out
      }
      break;
    case 'toSeat': {
      const se = SEATS[gu.seat]; goTo(gu, se.at[0], se.at[1]);
      if (walk()) { setSt(gu, 'seated'); gu.dir = se.face; if (gu.mate) { gu.mate.mode = 'seat'; gu.mate.goal = null; } lineSay(gu, 'G14'); }
      break;
    }
    case 'seated':   // waiting for rice; handed over -> 'eat' (serveSeat)
      if (gu.t >= SEAT_WAIT) { RUN.hungry++; lineSay(gu, 'G21'); leaveSeat(gu); guestNext(gu, 'seat'); }   // not angry, no fee
      break;
    case 'eat':
      gu.tt -= dt;
      if (gu.t >= 2 && gu.t - dt < 2) { if (gu.mate && gu.mate.kind === 'kitten') lineSay(gu.mate, 'G32'); else lineSay(gu, 'G16'); }
      if (gu.tt <= 0) {
        S.piles.dining = (S.piles.dining || 0) + fee('meal', { gu }); S.stats.diners++; gu.heart = 1; SFX.meow();
        TABLE_EATEN[gu.seat >> 1] = T; leaveSeat(gu); markDirty();
        guestNext(gu, 'seat');
      }
      break;
    case 'toBath': goTo(gu, TOWEL_SPOT[0], TOWEL_SPOT[1]); if (walk()) { setSt(gu, 'towel'); gu.wait = BATH_WAIT; gu.dir = 'left'; if (!S.basket) lineSay(gu, 'G12'); } break;
    case 'towel':
      if (S.basket > 0) { S.basket--; SFX.pop(); markDirty(); setSt(gu, 'toSlot'); gu.wait = BATH_WAIT; gu.goal = null; }
      else { gu.wait -= dt; if (gu.wait <= 0) guestNext(gu, 'bath'); }
      break;
    case 'toSlot': {
      if (gu.slot < 0) { const s = freeSlot(); if (s >= 0) { SLOT_OCC[s] = gu; gu.slot = s; } }
      if (gu.slot >= 0) {
        goTo(gu, SLOTS[gu.slot].x, 4);
        if (walk()) {
          setSt(gu, 'bathing'); gu.tt = BATH_T; SFX.splash(); if (gu.mate) gu.mate.mode = 'park';
          lineSay(gu, SLOTS[gu.slot].roten && dayLight().night > .5 ? 'G10|G34' : 'G10');
        }
      }
      else { goTo(gu, WAIT_SPOT[0], WAIT_SPOT[1]); if (walk()) gu.dir = 'up'; gu.wait -= dt; if (gu.wait <= 0) guestNext(gu, 'bath'); }
      break;
    }
    case 'bathing':
      gu.tt -= dt;
      if (gu.t >= 2.5 && gu.t - dt < 2.5) lineSay(gu, 'G11');
      if (gu.tt <= 0) {
        const sl = SLOTS[gu.slot], pid = sl.roten ? 'roten' : 'onsen';
        S.piles[pid] = (S.piles[pid] || 0) + fee('bath', { gu, slot: sl }); markDirty();
        gu.look = Object.assign({}, gu.look, { outfit: 'yukata', bag: false }); gu.heart = 1; SFX.meow();
        if (gu.mate && gu.mate.kind === 'cat') gu.mate.look = Object.assign({}, gu.mate.look, { outfit: 'yukata' });
        unpark(gu, [sl.x * TILE + 8, 4 * TILE + 8]);
        if (SLOT_OCC[gu.slot] === gu) SLOT_OCC[gu.slot] = null; gu.slot = -1; gu.dir = 'down';
        if (S.unlocked.milk) { setSt(gu, 'toMilk'); gu.goal = null; } else guestNext(gu, 'bath');
      }
      break;
    case 'toMilk': goTo(gu, MILK_SPOT[0], MILK_SPOT[1]); if (walk()) { setSt(gu, 'milk'); gu.tt = MILK_T; gu.dir = 'up'; SFX.milk(); lineSay(gu, 'G13'); } break;
    case 'milk':   // G3: nobody waits at the machine for the innkeeper any more - it buys its milk and goes
      gu.tt -= dt;
      if (gu.tt <= 0) { S.piles.milk = (S.piles.milk || 0) + fee('milk', { gu }); callSelf(gu, 'milk'); markDirty(); gu.heart = 1; SFX.meow(); guestNext(gu, 'bath'); }
      break;
    case 'toTea': goTo(gu, TEA_SPOT[0], TEA_SPOT[1]); if (walk()) { setSt(gu, 'tea'); gu.tt = TEA_T; gu.dir = 'left'; SFX.milk(); lineSay(gu, 'G13'); } break;
    case 'tea':    // a cup at the lobby urn (G3): pays into the tea pile, like milk at the machine
      gu.tt -= dt;
      if (gu.tt <= 0) { S.piles.tea = (S.piles.tea || 0) + fee('tea', { gu }); RUN.teaSelf++; callSelf(gu, 'tea'); if (TEA_AT.occ === gu) TEA_AT.occ = null; markDirty(); gu.heart = 1; guestNext(gu, 'tea'); }
      break;
    case 'toBrowse': goTo(gu, SPOT.browse[0], SPOT.browse[1]); if (walk()) { setSt(gu, 'browse'); gu.tt = BROWSE_T; gu.dir = 'up'; lineSay(gu, 'G35'); } break;
    case 'browse':
      gu.tt -= dt;
      if (gu.tt <= 0) { S.piles.shop = (S.piles.shop || 0) + fee('souv', { gu }); if (BROWSE.occ === gu) BROWSE.occ = null; gu.heart = 1; markDirty(); guestLeave(gu, false); }
      break;
    case 'leave': case 'angry': if (walk()) gu.gone = true; break;
  }
  updMate(gu, dt);
}
function checkIn(gu, rm) {
  Q.shift(); gu.room = rm.id; RT[rm.id].guest = gu; S.rooms[rm.id] = 'reserved';
  S.piles.recep = (S.piles.recep || 0) + fee('room', { rm, gu }); S.stats.guests++; S.dayLog.g++; gu.ck = 0;
  if (MILESTONES.includes(S.stats.guests)) { lineSay(gu, 'G36', S.stats.guests); banner('milestone', S.stats.guests); addHearts(10); news('milestone'); }   // the 100th guest ... (4.13)
  setSt(gu, 'toRoom'); gu.goal = null; gu.embT = .8;   // the room's emblem shows over the guest for 0.8 s (2.6)
  const pf = PREF[gu.type]; gu.pref = !!(pf && pf(rm));
  if (gu.pref) { addHearts(1); gu.heart2 = 1.6; lineSay(gu, { elder: 'G29', couple: 'G30', family: 'G31' }[gu.type]); }   // favourite room: hearts +1, tip x1.5
  if (roomCombo(rm)) { addHearts(1); lineSay(gu, 'G28'); }                                                                // a combo room: hearts +1 (4.5)
  S.album.furs[gu.look.fur] = true; if (gu.type !== 'regular') S.album.types[gu.type] = true;
  const rc = STAFF.find(s => s.role === 'recep' && s.atDesk); if (rc && !P.atDesk) { gainXp(rc, 1); lineSay(rc, 'S02'); }
  SFX.bell(); markDirty(); lineSay(gu, 'G06');
}
