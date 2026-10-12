// staff (4.7): need = the unlock that hires them; home = where they idle. Roles: recep (stays at the desk), maid
// (cleans the nearest unclaimed messy room), porter (keeps the towel basket stocked), chef (keeps the dining counter
// stocked, 4.3), waiter (counter -> the longest-waiting diners, 2 at a time), clerk (4.8), tea runner (v2.0.1 G3: the
// room calls). The shop owner stands at the shop. A new hire reuses an existing outfit (the runner: a waiter's).
const STAFF_DEF = {
  recep:   { name: '小樱', role: 'recep',  need: 'recep',   home: REST[1],        look: { fur: 'calico', outfit: 'kimono' } },
  maid1:   { name: '雪球', role: 'maid',   need: 'maid1',   home: REST[0],        look: { fur: 'white', outfit: 'apron' } },
  maid2:   { name: '白玉', role: 'maid',   need: 'maid2',   home: REST[1],        look: { fur: 'white', outfit: 'apron', hat: 'ribbon' } },
  maid3:   { name: '奶糖', role: 'maid',   need: 'maid3',   home: [8, 17],        look: { fur: 'cream', outfit: 'apron' }, zone: 'west' },
  maid4:   { name: '豆豆', role: 'maid',   need: 'maid4',   home: [31, 26],       look: { fur: 'gray', outfit: 'apron' }, zone: 'garden' },
  porter:  { name: '阿灰', role: 'porter', need: 'porter',  home: REST[2],        look: { fur: 'graytabby', outfit: 'porter' } },
  chef:    { name: '黑糖', role: 'chef',   need: 'chef',    home: SPOT.chef,      look: { fur: 'black', outfit: 'chef' } },
  waiter1: { name: '阿福', role: 'waiter', need: 'waiter1', home: SPOT.waiterIdle[0], look: { fur: 'cow', outfit: 'waiter' } },
  waiter2: { name: '咪咪', role: 'waiter', need: 'waiter2', home: SPOT.waiterIdle[1], look: { fur: 'siamese', outfit: 'waiter' } },
  clerk:   { name: '老墨', role: 'clerk',  need: 'clerk',   home: SPOT.clerk,     look: { fur: 'tabby', outfit: 'clerk' } },
  teaboy:  { name: '阿麦', role: 'tea',    need: 'teaboy',  home: [14, 23],       look: { fur: 'gray', outfit: 'waiter' } },
  owner:   { name: '狸老板', role: 'owner', need: 'shop',   home: SPOT.owner,     look: { fur: 'tabby', outfit: 'shop' } },
};
// a home behind a door that is still shut (an odd save) falls back to the lobby rest spots
const homeOf = s => areaOpen(areaAt(s.home[0], s.home[1])) && walkable(s.home[0], s.home[1]) ? s.home : REST[0];
function ensureStaff() {
  for (const id in STAFF_DEF) if (S.unlocked[STAFF_DEF[id].need] && !STAFF.some(s => s.id === id)) {
    const d = STAFF_DEF[id], h = d.role === 'recep' ? DESK_SPOT : d.home;
    STAFF.push({ id, name: d.name, role: d.role, home: d.home, zone: d.zone || null, look: d.look, x: h[0] * TILE + 8, y: h[1] * TILE + 8, dir: 'down', moving: false, walkT: 0, path: [], goal: null, job: null, carry: 0, tt: 0, loading: false, atDesk: false, working: false,
      tray: [], jobs: [], cooking: false, bag: 0 });
  }
}
const hasChef = () => !!S.unlocked.chef;
const hasWaiter = () => STAFF.some(s => s.role === 'waiter');
const dinerWaiting = gu => gu.st === 'seated' && !gu.served;
// seated diners still waiting for rice, the longest-waiting first
const waitingDiners = () => GUESTS.filter(dinerWaiting).sort((a, b) => b.t - a.t);
// a waiter serves from the floor beside the seat (above or below it), whichever is nearer
function serveTile(se, s) {
  const [x, y] = se.at, c = [[x, y - 1], [x, y + 1]].filter(([a, b]) => walkable(a, b));
  return c.sort((p, q) => dist(s.x, s.y, tcx(p), tcy(p)) - dist(s.x, s.y, tcx(q), tcy(q)))[0] || se.at;
}
function updWaiter(s, dt, walk) {
  s.jobs = s.jobs.filter(gu => gu.claim === s && dinerWaiting(gu) && GUESTS.includes(gu));   // served by someone else / gave up
  if (s.tray.length > s.jobs.length) for (const gu of waitingDiners()) { if (s.jobs.length >= s.tray.length) break; if (!gu.claim) { gu.claim = s; s.jobs.push(gu); } }
  s.working = false;
  if (s.tray.length && s.jobs.length) {   // carry it to the first claimed diner
    const gu = s.jobs[0]; if (s.jobGu !== gu) { s.jobGu = gu; s.serveAt = serveTile(SEATS[gu.seat], s); }   // picked once per diner (no flip-flopping)
    goTo(s, s.serveAt[0], s.serveAt[1]);
    if (walk()) {
      const [x, y] = guestSpot(gu); s.tray.pop(); s.jobs.shift();
      FX.push({ k: 'give', it: 'rice', x0: s.x, y0: s.y - 12, x1: x, y1: y - 10, t: 0, life: .3 });
      serveSeat(gu); gainXp(s, 1); lineSay(s, 'S15');
    }
    return;
  }
  const at = s.id === 'waiter2' ? [2, 22] : [4, 22];   // below the counter
  if (s.tray.length) { goTo(s, at[0], at[1]); if (walk()) { while (s.tray.length) { s.tray.pop(); if (PASS.n < PASS_MAX) PASS.n++; } } return; }   // nobody left: back on the counter
  const want = waitingDiners().filter(gu => !gu.claim).length;
  if (PASS.n > 0 && want > 0) {
    goTo(s, at[0], at[1]);
    if (walk()) { s.dir = 'up'; const n = Math.min(WAITER_CARRY, PASS.n, want); for (let i = 0; i < n; i++) s.tray.push('rice'); PASS.n -= n; sfx('take'); }
    return;
  }
  const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down';
}
function updStaff(s, dt) {
  const walk = () => stepPath(s, dt, staffSpeed(s));   // maids / waiters / the clerk walk +5 % a level (4.7)
  if (s.arrive) {   // just hired: in through the front door to the post, then the first words (no way there: it is simply there)
    const h = s.role === 'recep' ? DESK_SPOT : homeOf(s); goTo(s, h[0], h[1]);
    if (walk() || s.lost) {
      if (s.lost) { s.x = tcx(h); s.y = tcy(h); } s.arrive = false; s.dir = 'down'; s.path = []; s.goal = null;
      const k = ARRIVE_LINE[s.id] || 'S01'; if (!lineSay(s, k)) { s.hello = k; s.helloT = S.stats.time; }   // off screen: said when you come by (18.2)
    }
    return;
  }
  if (s.hello) { if (S.stats.time - s.helloT > HELLO_T) s.hello = null; else if (lineOk(s) && lineSay(s, s.hello)) s.hello = null; }
  if (s.role === 'recep') { goTo(s, DESK_SPOT[0], DESK_SPOT[1]); s.atDesk = walk(); if (s.atDesk) s.dir = 'down'; return; }
  if (s.role === 'maid') {
    if (s.job && (S.rooms[s.job] !== 'messy' || RT[s.job].claim !== s)) { if (RT[s.job].claim === s) RT[s.job].claim = null; s.job = null; }
    if (!s.job && !(s.carry > 0) && !s.loading) {   // 4.7: a dirty suite a VIP waits for > a room in the maid's own zone > the nearest dirty room
      let best = null, bd = 1e9; const vipWait = vipNeedsSuite();
      for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && !RT[rm.id].claim) {
        const tier = rm.vip && vipWait ? 0 : s.zone && zoneOf(rm) === s.zone ? 1 : 2;
        const d = tier * 1e5 + Math.abs(rm.stand[0] * TILE + 8 - s.x) + Math.abs(rm.stand[1] * TILE + 8 - s.y); if (d < bd) { bd = d; best = rm; }
      }
      if (best) { s.job = best.id; RT[best.id].claim = s; }
    }
    s.working = false;
    if (s.job) {
      const rm = ROOM[s.job]; goTo(s, rm.stand[0], rm.stand[1]);
      if (walk()) { s.working = true; s.dir = rm.left ? 'left' : 'right'; RT[s.job].cleanP += dt * repStaff() / (MAID_CLEAN_T * cleanMulOf(rm) * lvMul(s, .9)); if (RT[s.job].cleanP >= 1) { gainXp(s, 4); finishClean(s.job); lineSay(s, 'S08'); } }
    } else if (!maidTowels(s, dt, walk)) { const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down'; }
    return;
  }
  if (s.role === 'porter' && S.unlocked.onsen) {
    if (s.loading) {
      goTo(s, SHELF_SPOT[0], SHELF_SPOT[1]);
      if (walk()) { s.dir = 'up'; s.tt += dt; const cap = porterCap(s); while (s.tt >= .12 && s.carry < cap) { s.tt -= .12; s.carry++; } if (s.carry >= cap) { s.loading = false; s.tt = 0; lineSay(s, 'S10'); } }
    } else if (s.carry > 0 && S.basket < BASKET_MAX) {
      goTo(s, BASKET_SPOT[0], BASKET_SPOT[1]);
      if (walk()) { s.dir = 'right'; s.tt += dt; while (s.tt >= .1 && s.carry > 0 && S.basket < BASKET_MAX) { s.tt -= .1; s.carry--; S.basket++; gainXp(s, 1); markDirty(); } }
      else s.tt = 0;
    } else if (s.carry === 0 && S.basket <= 6) { s.loading = true; s.tt = 0; }
    else { const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down'; }
    return;
  }
  if (s.role === 'chef') {   // at the stove: one portion onto the counter every CHEF_T until it holds PASS_MAX (then the fire rests)
    const h = homeOf(s); goTo(s, h[0], h[1]); s.cooking = false;
    if (walk()) {
      s.dir = 'up';
      if (S.unlocked.dining && PASS.n < PASS_MAX) { s.cooking = true; s.tt += dt; if (s.tt >= CHEF_T * lvMul(s, .92)) { s.tt = 0; PASS.n++; gainXp(s, 1); sfx('cook'); lineSay(s, 'S12'); } }
      else s.tt = 0;
    }
    return;
  }
  if (s.role === 'waiter') { updWaiter(s, dt, walk); return; }
  if (s.role === 'clerk') { updClerk(s, dt, walk); return; }
  if (s.role === 'tea') { updTeaboy(s, dt, walk); return; }
  // the shop owner (and a porter without an onsen): stand at the post
  const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down';
}
// stage 4 (18.2): a maid with no room to clean tops up a low towel basket while there is no porter yet - MAID_TOWELS a
// run, one maid at a time - so the baths keep going when you step away (A4). The porter takes the job over.
const MAID_TOWELS = 6, MAID_TOWEL_LOW = 2;
function maidTowels(s, dt, walk) {
  if (s.carry > 0 && !s.loading) {   // loaded: to the basket (a basket that fills up first takes what fits; the rest go back on the shelf)
    goTo(s, BASKET_SPOT[0], BASKET_SPOT[1]);
    if (walk()) { s.dir = 'right'; s.tt += dt; while (s.tt >= .1 && s.carry > 0 && S.basket < BASKET_MAX) { s.tt -= .1; s.carry--; S.basket++; markDirty(); } if (S.basket >= BASKET_MAX) s.carry = 0; }
    else s.tt = 0;
    return true;
  }
  if (!S.unlocked.onsen || S.unlocked.porter || (!s.loading && (S.basket > MAID_TOWEL_LOW || STAFF.some(o => o !== s && o.role === 'maid' && (o.loading || o.carry > 0))))) { s.loading = false; return false; }
  if (!s.loading) { s.loading = true; s.tt = 0; }
  goTo(s, SHELF_SPOT[0], SHELF_SPOT[1]);
  if (walk()) { s.dir = 'up'; s.tt += dt; while (s.tt >= .12 && s.carry < MAID_TOWELS) { s.tt -= .12; s.carry++; } if (s.carry >= MAID_TOWELS) { s.loading = false; s.tt = 0; } }
  return true;
}
function finishClean(id) {
  S.rooms[id] = 'clean'; RT[id].cleanP = 0; RT[id].claim = null; RT[id].vipMess = false;
  const c = futonC(ROOM[id]); fxSpark(c[0], c[1], 3); SFX.sweep(); markDirty();
}
// cleaning time: cottages x1.5; a suite a VIP has just left x2 (4.4)
const cleanMulOf = rm => rm.cleanMul * (RT[rm.id].vipMess ? 2 : 1);
const zoneOf = rm => rm.wing === 'west' ? 'west' : rm.wing === 'cottage' || rm.wing === 'suite' ? 'garden' : 'main';

// ---- the clerk (Lao Mo) (4.8): takes the oldest pile >= 2 x the star's tip lying more than 48 px from the innkeeper (piles
// within 3 tiles of you are yours), bags it - the fish are in the cash box from that moment, so a save is always
// consistent - and carries the bag home. The bag on his back is only the picture of the trip.
const PILE_AGE = NUL();   // pile id -> game time it started (the oldest goes first)
function pileAges() { for (const id in S.piles) { if (S.piles[id] > 0) { if (PILE_AGE[id] === undefined) PILE_AGE[id] = S.stats.time; } else delete PILE_AGE[id]; } }
const pileNearP = id => { const [tx, ty] = PILE_AT[id]; return dist(P.x, P.y, tx * TILE + 8, ty * TILE + 8) <= CLERK_KEEP; };
function clerkPick() {
  const min = CLERK_MIN * STARS[star()].tip;
  let best = null;
  if (capOn() && (S.piles.recep || 0) >= pileCap('recep')) return null;   // v2.2: the cash box is full - nowhere to put a bag
  for (const id in S.piles) if (id !== 'recep' && S.piles[id] >= min && !pileNearP(id) && !STAFF.some(o => o.role === 'clerk' && o.job === id)
    && (best === null || (PILE_AGE[id] || 0) < (PILE_AGE[best] || 0))) best = id;
  return best;
}
function updClerk(s, dt, walk) {
  if (s.bag > 0) {
    goTo(s, CHEST_SPOT[0], CHEST_SPOT[1]);
    if (walk()) { s.dir = 'left'; s.tt += dt; if (s.tt >= CLERK_DUMP_T) { s.tt = 0; if (s.bag >= 200) lineSay(s, 'S17'); s.bag = 0; SFX.pop(); } }
    return;
  }
  if (s.job && (!(S.piles[s.job] > 0) || pileNearP(s.job))) { s.job = null; s.tt = 0; }   // you took it / you're by it now
  if (!s.job) { s.job = clerkPick(); s.tt = 0; }
  if (s.job) {
    const [tx, ty] = PILE_AT[s.job]; goTo(s, tx, ty);
    if (walk()) {
      s.tt += dt;
      if (s.tt >= CLERK_BAG_T) {
        const room = capOn() ? Math.max(0, pileCap('recep') - (S.piles.recep || 0)) : 1e9, v = Math.min(S.piles[s.job], room);   // v2.2: what fits in the cash box
        PILE_RATE.recep = (PILE_RATE.recep || 0) + v / CAP_TAU; S.piles[s.job] -= v; S.piles.recep = (S.piles.recep || 0) + v; if (!S.piles[s.job]) delete PILE_AGE[s.job];
        s.bag = v; s.job = null; s.tt = 0; gainXp(s, 1); RUN.clerk += v; markDirty(); lineSay(s, 'S10');
      }
    }
    return;
  }
  const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down';
}

// ---- the tea runner 阿麦 (茶房, v2.0.1 G3): the room calls the innkeeper used to run. Claims the open call with the least
// time left (and up to TEABOY_CARRY - 1 more of the same thing), fetches it - tea from the nearer urn, milk from the
// machine, a snack from the dining counter or cooked at the stove (1 s) - and walks it to the guest wherever the guest is
// now; within DELIVER_R it hands it over and the tip goes into the cash box at the desk (serveCall). A call that ends on
// the way (timed out, the guest got it by itself) is let go; what is left on its tray just goes back.
function teaSource(k, s) {
  if (k === 'milk') return !S.unlocked.milk2 || dist(s.x, s.y, ZONE.milk.c[0], ZONE.milk.c[1]) <= dist(s.x, s.y, ZONE.milk2.c[0], ZONE.milk2.c[1]) ? 'milk' : 'milk2';   // v2.4: the nearer machine
  if (k === 'rice') return PASS.n > 0 ? 'pass' : 'stove';
  const a = !!S.unlocked.tea, b = !!S.unlocked.garden;
  if (!a || !b) return a ? 'urn1' : 'urn2';
  return dist(s.x, s.y, ZONE.urn1.c[0], ZONE.urn1.c[1]) <= dist(s.x, s.y, ZONE.urn2.c[0], ZONE.urn2.c[1]) ? 'urn1' : 'urn2';
}
const TEA_SRC_TILE = { urn1: SPOT.urn1, urn2: SPOT.urn2, milk: MILK_SPOT, milk2: MILK2_SPOT, pass: [3, 22], stove: [2, 20] };
function updTeaboy(s, dt, walk) {
  s.jobs = s.jobs.filter(gu => gu.call && gu.callBy === s && GUESTS.includes(gu) && !gu.gone);
  s.cooking = false; s.working = false;
  if (s.tray.length > s.jobs.length) s.tray.length = s.jobs.length;   // a call that ended on the way: that cup goes back
  if (!s.jobs.length) {   // the call with the least time left that nobody runs yet
    let best = null; for (const gu of GUESTS) if (gu.call && !gu.callBy && (!best || gu.call.t < best.call.t)) best = gu;
    if (best) { best.callBy = s; s.jobs.push(best); s.src = null; s.tt = 0; s.tray.length = 0; }
  }
  if (!s.jobs.length) { s.src = null; const h = homeOf(s); goTo(s, h[0], h[1]); if (walk()) s.dir = 'down'; return; }
  const k = s.jobs[0].call.k;
  if (s.tray.length < s.jobs.length) {   // fetch: one more call of the same thing first (a second cup for another room)
    if (s.jobs.length < TEABOY_CARRY && !s.tray.length) for (const gu of GUESTS) if (gu.call && !gu.callBy && gu.call.k === k) { gu.callBy = s; s.jobs.push(gu); break; }
    if (!s.src || (s.src === 'pass' && PASS.n <= 0 && !s.tray.length)) s.src = teaSource(k, s);
    const at = TEA_SRC_TILE[s.src]; goTo(s, at[0], at[1]);
    if (walk()) {
      s.dir = s.src === 'pass' || s.src === 'stove' || s.src === 'milk' ? 'up' : 'left'; s.working = true;
      if (s.src === 'pass' && PASS.n <= 0) { s.src = 'stove'; s.tt = 0; return; }   // the counter ran out meanwhile: cook it
      s.cooking = s.src === 'stove'; s.tt += dt;
      if (s.tt >= (s.src === 'stove' ? STOVE_T : TEABOY_PICK_T)) { s.tt = 0; if (s.src === 'pass') PASS.n--; s.tray.push(k); sfx(s.src === 'stove' ? 'cook' : 'take'); }
    } else s.tt = 0;
    return;
  }
  // deliver: the nearest of its guests first
  s.src = null;
  let gu = s.jobs[0], bd = 1e9;
  for (const j of s.jobs) { const [x, y] = guestSpot(j), d = dist(s.x, s.y, x, y); if (d < bd) { bd = d; gu = j; } }
  const [x, y] = guestSpot(gu);
  if (bd <= DELIVER_R) {
    s.tray.pop(); s.jobs.splice(s.jobs.indexOf(gu), 1);
    FX.push({ k: 'give', it: k, x0: s.x, y0: s.y - 12, x1: x, y1: y - 10, t: 0, life: .3 });
    serveCall(gu, s); lineSay(s, 'S21'); return;
  }
  const t = guestTile(gu); goTo(s, t[0], t[1]); walk();
}
