// ============================================================ VIPs (4.4)
// One at a time, not saved (10.1). arrive -> carpet (greet: stand within 14 px for 0.5 s; nobody for 60 s -> it walks to
// a suite on its own) -> follow (walks the innkeeper's crumbs 16 px behind; more than 96 px behind it stops with "..." and
// goes on once you're back within 48 px) -> you step into a clean empty suite -> toSuite (walks to its seat) -> seated:
// three wishes in order on the board over the door (tea / kaiseki: the tray; bath: stand on the tap 1.5 s, it soaks 5 s;
// photo: stand by it 1.2 s) -> leave. v2.0.1 G1: the current wish shows as a big gold bubble over its head; a wish never
// runs out - the faster, the bigger the tip: 25% of the gift G x wishF per earlier wish, 50% x the overall speed factor
// at the photo - and each one done pops a big tick. No clean suite: it waits on the carpet, the clock stops.
let VIPG = null, vipT = 1e9, lastVip = null;
const SUITES = ROOMS.filter(r => r.vip);
const suiteFree = rm => roomOpen(rm) && S.rooms[rm.id] === 'clean' && !RT[rm.id].guest;
const suiteAvail = rm => roomOpen(rm) && !RT[rm.id].guest;   // v2.4: nobody asleep in it (it may still need cleaning)
const cleanSuite = () => SUITES.find(suiteFree) || null;   // suite A first, B when A is dirty or taken
const vipNeedsSuite = () => !!VIPG && (VIPG.st === 'arrive' || VIPG.st === 'carpet') && !cleanSuite();
const vipGift = () => R(20 * STARS[star()].room * qualityQ() * (1 + .05 * goldStars()));
const vipGap = () => ((star() >= 5 ? VIP_GAP5 : VIP_GAP) + rand(-VIP_JIT, VIP_JIT)) * (S.unlocked.suiteB ? .7 : 1);
const vipWish = () => VIPG && (VIPG.st === 'seated' || VIPG.st === 'soak') && !(VIPG.hold > 0) ? vipWs(VIPG)[VIPG.wi] : null;   // v2.2: only what the inn can make (vipguide.js)
const inBox = (rm, tx, ty) => tx >= rm.box[0] && tx <= rm.box[2] && ty >= rm.box[1] && ty <= rm.box[3];
const suiteInner = rm => [rm.box[0], rm.door[1]];   // the first tile inside the suite's door
function vipArrive() {
  let id;
  if (S.vipNext < VIPS.length) id = VIPS[S.vipNext++].id;   // the six in order, then at random (never the same twice running)
  else id = pick(VIPS.filter(v => v.id !== lastVip)).id;
  const v = VIP[id]; lastVip = id;
  VIPG = { id, vip: true, look: { fur: v.fur, outfit: 'robe', robe: v.robe, hat: v.hat || null, acc: v.acc || null }, x: EXIT[0], y: EXIT[1], dir: 'up', moving: false, walkT: 0,
    path: [], goal: null, q: [], st: 'arrive', t: 0, tt: 0, halt: false, greetT: 0, actT: 0, wi: 0, suite: null, G: vipGift(), paid: 0, t0: S.stats.time, greetAt: null, trailT: 0, noSuite: 0 };
  S.album.vip[id] = (S.album.vip[id] | 0) + 1; RUN.vips++; news('vip'); markDirty();
  sfx('vip'); firstTime('vip');   // its own line (V01-V06) waits for the greeting: at the gate it is off screen (18.2)
  if (PET && PET.kind === 'shiba') { lineSay(PET, 'A02'); sfx('woof'); }   // the shiba barks when a VIP comes in (4.11)
}
function vipToSuite(rm) { const v = VIPG; v.suite = rm.id; RT[rm.id].guest = v; setSt(v, 'toSuite'); v.goal = null; v.q = []; v.halt = false; if (v.greetAt === null) v.greetAt = S.stats.time; }
function vipLeave(happy) {
  const v = VIPG; if (!v || v.st === 'leave') return;
  firstDone('vip');
  if (v.suite) { const id = v.suite; RT[id].guest = null; S.rooms[id] = 'messy'; RT[id].vipMess = true; RT[id].cleanP = 0; }   // the suite needs a long clean
  S.vipOwe = 0; vipT = S.stats.time + vipGap(); S.vipAt = Math.ceil(vipT); if (!happy) RUN.vipLeft++;
  if (v.mom) momLeaveLine(v); else lineSay(v, happy ? 'V11' : 'V12');   // v2.1: mom's goodbye (mom.js)
  if (v.rare) rareLeave(v, happy);   // v2.1 (rare.js): when it may come again
  setSt(v, 'leave'); v.goal = null; v.halt = false; goTo(v, EXIT_TILE[0], EXIT_TILE[1], EXIT.slice());
  markDirty();
}
function vipWishStart() {   // a new current wish: its first-time card; the photo wish says so
  const k = vipWish(); if (!k) return;
  VIPG.wt = 0;   // how long this wish has waited (its tip: wishF)
  if (k === 'stay' || k === 'show') firstTime(k); else wishCardStart(k);   // v2.2: [station] > [item] > [face] once per kind (vipguide.js)
  if (k === 'photo') lineSay(VIPG, 'V10');
}
// a wish's tip factor: full when done within VIP_WISH_FAST s, then down to 0.6 at VIP_WISH_FAST + VIP_WISH_SLOW s (G1)
const wishF = wt => .6 + .4 * clamp(1 - (wt - VIP_WISH_FAST) / VIP_WISH_SLOW, 0, 1);
function vipWishDone() {
  const v = VIPG, ws = vipWs(v), k = ws[v.wi];
  firstDone(k); wishCardDone(k); firstDone('vip');   // the 3-step card of the first VIP stays up until its first wish is done
  FX.push({ k: 'vipok', x: v.x, y: v.y - 20, t: 0, life: 1.3 }); fxSpark(v.x, v.y - 30, 6);   // a big tick over its head (G1)
  if (v.wi < ws.length - 1) {   // an earlier wish: 25% of the gift x how quick, hearts 2
    const pay = R(v.G * .25 * wishF(v.wt || 0)); v.paid += pay; earn(pay, v.x, v.y - 4); addHearts(2); lineSay(v, 'V09');
    v.wi++; setSt(v, 'seated'); v.actT = 0; S.vipOwe = Math.max(0, v.G - v.paid); markDirty();
    v.hold = VIP_SIP_T[k] || 0; if (k === 'show') rareShowDone(v); else if (!v.hold) vipWishStart();   // tea / kaiseki: it enjoys it first (stage 4); v2.1 show: back to its seat
    return;
  }
  // the last one (always the photo): the other half x the speed factor, hearts 10 (+10 the first photo of this VIP), its gift
  const used = S.stats.time - (v.greetAt !== null ? v.greetAt : v.t0), f = .6 + .4 * clamp(1 - (used - 90) / 120, 0, 1);
  const pay = R(v.G * .5 * f), first = !S.album.photos.some(p => p.v === v.id);
  v.paid += pay; earn(pay, v.x, v.y - 4); addHearts(10 + (first ? 10 : 0));
  if (v.mom) momPhoto(v);   // v2.1: mom's photo is the family photo (mom.js), not a VIP photo / gift
  else {
    S.album.photos.push(Object.assign({ v: v.id, d: S.day, h: S.equip.hat, p: S.equip.pet }, S.equip.outfit ? { o: S.equip.outfit } : {})); if (S.album.photos.length > 40) S.album.photos.shift();   // v2.1: + the outfit
    if (v.rare) rarePhoto(v);   // v2.1: a rare guest's visit counts; its keepsake goes to the album, not the gift shelf
    else if (!S.gifts.includes(v.id)) { S.gifts.push(v.id); if (S.gifts.length > 6) S.gifts.shift(); }
  }
  S.stats.vips++; RUN.vipDone++; RUN.vipF.push(f); RUN.vipUsed.push(used); RUN.vipPaid += v.paid;
  vipBed(v);   // v2.4: it stays the night (was: vipLeave(true) - straight out of the door after the photo)
}
// ---- v2.4 (player feedback "the guests of honour run off right after the photo"): after the photo a VIP / rare guest /
// mom goes to bed in its suite (futon, Zzz, a warm andon) and sleeps until the next dawn - at least VIP_SLEEP_MIN s, else
// the dawn after - then says goodbye at the door of its suite and walks out; the suite is messy after it. The VIP slot
// (VIPG) is free at once (the next one's gap starts at the photo, as before), but a guest of honour only comes while a
// suite has nobody asleep in it (suiteAvail). Saved: S.vsleep = [{ r: suite, id, w: the day it wakes, y: mom's year }].
const VIP_SLEEP_MIN = 45;
let VSLEEP = [];   // the sleepers (runtime entities, rebuilt from S.vsleep on resetWorld)
function vipBed(v) {
  firstDone('vip');
  S.vipOwe = 0; vipT = S.stats.time + vipGap(); S.vipAt = Math.ceil(vipT);
  if (v.rare) rareLeave(v, true);   // when it may come again (counted from the photo, as before)
  const toDawn = (((DAWN_AT - S.clock) % 1) + 1) % 1 * DAY_LEN;
  const rec = { r: v.suite, id: v.id, w: S.day + (toDawn < VIP_SLEEP_MIN ? 2 : 1) }; if (v.mom) rec.y = v.momYear || 1;
  S.vsleep.push(rec);
  const e = sleeperOf(rec, v); setSt(e, 'toBed'); VSLEEP.push(e); RT[v.suite].guest = e;
  VIPG = null; markDirty();
}
// a sleeper entity from its saved record (after the photo: from the guest itself, where it stands)
function sleeperOf(rec, v) {
  const rm = ROOM[rec.r], d = VIP[rec.id] || {}, look = v ? v.look : rec.id === 'mom' ? MOM_DEF.look : RARE_LOOK[rec.id] || VIP_LOOK[rec.id] || { fur: d.fur || 'orange', outfit: 'robe', robe: d.robe || null };
  const e = { id: rec.id, sleeper: true, mom: rec.id === 'mom', momYear: rec.y, look, room: rec.r, x: v ? v.x : tcx(rm.cleanT), y: v ? v.y : tcy(rm.cleanT), ox: 0, dir: 'down', moving: false, walkT: 0, path: [], goal: null, q: [], st: 'sleep', t: 0, rec };
  const r = RARE[rec.id]; if (r && r.kits) e.kits = (v && v.kits) || r.kits.slice(1).map((fur, i) => ({ fur, x: e.x + (i ? 6 : -6), y: e.y + 3, dir: 'down', moving: false, walkT: 0, q: [] }));
  return v ? Object.assign(v, e, { vip: false }) : e;   // the same object (a line it is still saying stays its own)
}
function sleepReset() {   // resetWorld: the saved sleepers back in their futons
  VSLEEP = S.vsleep.map(rec => sleeperOf(rec));
  for (const e of VSLEEP) { RT[e.room].guest = e; S.rooms[e.room] = 'occupied'; }
}
function sleepTick(dt) {
  for (const e of VSLEEP) {
    e.t += dt;
    if (e.st === 'toBed') {
      const rm = ROOM[e.room]; goTo(e, rm.cleanT[0], rm.cleanT[1]);
      if (stepPath(e, dt, G_SPEED) || e.lost || e.t > 20) { e.x = tcx(rm.cleanT); e.y = tcy(rm.cleanT); e.moving = false; setSt(e, 'sleep'); S.rooms[e.room] = 'occupied'; lineSay(e, 'G33|G07'); markDirty(); }
    } else if (e.st === 'sleep') { if (S.day >= e.rec.w) vipWake(e); }
    else if (e.st === 'leave') { if (stepPath(e, dt, G_SPEED)) e.gone = true; }
    if (e.kits && e.st !== 'sleep') kitsFollow(e, dt);
  }
  if (VSLEEP.some(e => e.gone)) VSLEEP = VSLEEP.filter(e => !e.gone);
}
function vipWake(e) {
  const id = e.room; RT[id].guest = null; S.rooms[id] = 'messy'; RT[id].vipMess = true; RT[id].cleanP = 0;   // the long clean (4.4)
  S.vsleep = S.vsleep.filter(r => r !== e.rec);
  const rm = ROOM[id]; e.x = tcx(rm.cleanT); e.y = tcy(rm.cleanT); if (e.kits) e.kits.forEach((k, i) => { k.x = e.x + (i ? 6 : -6); k.y = e.y + 3; });
  setSt(e, 'leave'); e.goal = null; goTo(e, EXIT_TILE[0], EXIT_TILE[1], EXIT.slice());
  if (e.mom) momLeaveLine(e); else lineSay(e, 'V11');   // its goodbye
  markDirty();
}
function vipPhoto() {   // "click" (no flash): a polaroid flies from its head to the menu button
  sfx('shutter'); FX.push({ k: 'polaroid', id: VIPG.id, x0: R(VIPG.x) - R(cam.x), y0: R(VIPG.y) - 26 - R(cam.y), t: 0, life: .9 });
  vipWishDone();
}
function updVip(dt) {
  const v = VIPG;
  sleepTick(dt);   // v2.4: the guests of honour asleep in their suites
  if (!v) { if (S.unlocked.garden && S.stats.time >= vipT && SUITES.some(suiteAvail) && !momDue() && !rareArrive()) vipArrive(); return; }   // v2.1: a rare guest due comes in its place; v2.4: only while a suite has nobody asleep in it, never on mom's day before she came
  v.t += dt;
  const walk = spd => stepPath(v, dt, spd);
  switch (v.st) {
    case 'arrive': goTo(v, SPOT.carpet[0], SPOT.carpet[1]); if (walk(G_SPEED)) { setSt(v, 'carpet'); v.dir = 'down'; } break;
    case 'carpet': {
      v.moving = false;
      const rm = cleanSuite();
      if (!rm) { v.t -= dt; v.greetT = 0; v.noSuite += dt; if (v.noSuite >= VIP_NOSUITE) vipLeave(false); break; }   // no clean suite: the clock stops
      if (dist(P.x, P.y, v.x, v.y) <= VIP_NEAR) { v.greetT += dt; if (v.greetT >= VIP_GREET_T) { setSt(v, 'follow'); v.greetAt = S.stats.time; v.q = []; v.halt = false; v.greetT = 0; lineSay(VIPG, v.rare ? RARE[v.id].lineId : 'V0' + (VIPS.indexOf(VIP[v.id]) + 1)); } }
      else v.greetT = 0;
      if (v.st === 'carpet' && v.t >= VIP_NOGREET) vipToSuite(rm);   // nobody came: it finds its own way
      break;
    }
    case 'follow': {
      const d = dist(P.x, P.y, v.x, v.y);
      if (!v.halt && d > VIP_HALT) { v.halt = true; lineSay(v, 'V08'); }
      else if (v.halt && d <= VIP_RESUME) {   // you came back: walk the shortest way to you, then follow the crumbs again
        v.halt = false; lineSay(v, 'V07'); const [vx, vy] = tileOf(v), [px, py] = tileOf(P), p = findPath(vx, vy, px, py);
        v.q = (p || []).map(([x, y]) => [x * TILE + 8, y * TILE + 8]);
      }
      if (v.halt) v.moving = false; else { crumbTo(P, v); followStep(v, P, VIP_FOLLOW, playerSpeed() * .9, dt); }
      const [ptx, pty] = tileOf(P), rm = SUITES.find(r => suiteFree(r) && inBox(r, ptx, pty));
      if (rm) vipToSuite(rm);                                                                  // you showed it in
      else if (v.t >= VIP_LEAD_MAX) { const r2 = cleanSuite(); if (r2) vipToSuite(r2); }   // a long detour: it goes ahead
      break;
    }
    case 'toSuite': {
      const rm = ROOM[v.suite]; goTo(v, rm.stand[0], rm.stand[1]);
      if (walk(G_SPEED * 1.2)) { setSt(v, 'seated'); v.dir = 'up'; v.wi = 0; v.actT = 0; S.vipOwe = Math.max(0, v.G - v.paid); vipWishStart(); markDirty(); }
      break;
    }
    case 'seated': {
      v.moving = false;
      if (v.hold > 0) { v.hold -= dt; v.t = 0; if (v.hold <= 0) { v.hold = 0; vipWishStart(); } break; }   // enjoying the tea / kaiseki
      const k = vipWish(), rm = ROOM[v.suite];
      v.wt = (v.wt || 0) + dt;   // no time limit any more (G1): the wait only lowers the tip
      if (k === 'photo') { if (dist(P.x, P.y, v.x, v.y) <= VIP_NEAR) { v.actT += dt; if (v.actT >= VIP_PHOTO_T) { v.actT = 0; vipPhoto(); } } else v.actT = 0; }
      else if (k === 'bath') {
        const [ptx, pty] = tileOf(P);
        if (ptx === rm.tap[0] && pty === rm.tap[1]) { v.actT += dt; if (v.actT >= VIP_TAP_T) { v.actT = 0; setSt(v, 'soak'); v.tt = VIP_SOAK_T; sfx('splash'); } }
        else v.actT = 0;
      }
      else if (k === 'stay' || k === 'show') rareSeated(v, k, dt);   // v2.1 rare guests (rare.js)
      break;
    }
    case 'show': case 'back': rareUpd(v, dt); break;   // v2.1: leading a rare guest to its garden piece / its walk back
    case 'soak': v.tt -= dt; if (v.tt <= 0) vipWishDone(); break;   // you can go and do something else meanwhile
    case 'leave': if (walk(G_SPEED)) VIPG = null; break;
  }
  if (VIPG && v.moving) { v.trailT -= dt; if (v.trailT <= 0) { v.trailT = .3; FX.push({ k: 'vtrail', x: v.x + rand(-4, 4), y: v.y - rand(3, 12), t: 0, life: 1 }); } }   // a trail of slow gold glints
}
// the VIP's current tea / kaiseki wish is a tray want (4.1): handed over at its seat
function vipWants(L) {
  const v = VIPG, k = vipWish();
  if (!v || v.st !== 'seated' || (k !== 'tea' && k !== 'kaiseki' && k !== 'milk' && k !== 'rice')) return;   // v2.1: rare guests also want milk / rice
  L.push({ e: v, k, x: v.x, y: v.y, left: 1e9, tile: ROOM[v.suite].stand, give: vipWishDone, vip: true });   // never late (G1)
}
