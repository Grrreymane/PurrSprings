// ---- unlocking
const POPA = {};           // id -> time it popped in (objects / furniture scale in)
const PADSEEN = new Set(); // pads already shown (a newly visible pad pops in once)
const AREA_FADE = [];      // areas just opened: their shade fades out over 0.8 s (2.2)
let celebrateAt = 0, starPopAt = -9;   // starPopAt: when the HUD's newest star last popped in
function unlock(id) {
  if (S.unlocked[id]) return;
  const u = UNLOCK[id], s0 = star(), xy = padXY(u) || [P.x / TILE | 0, P.y / TILE | 0];
  const over = (S.paid[id] || 0) - u.price; if (over > 0) S.money += over;   // paid in before a price cut: give the rest back
  S.unlocked[id] = true; S.paid[id] = u.price;
  lastBuyAt = S.stats.time; guideClock = 0;   // the arrow re-picks this frame (the map may have changed under it: a table now stands on the pad)
  if (id === 'dining') firstTime('dine');   // the "[stove] -> [rice] -> [table]" card (7.4; stage 3 draws it)
  if (u.decor) firstTime('decor');          // "[decor] -> [room]" (7.4)
  if (id === 'garden') vipT = S.stats.time + VIP_FIRST;   // the first VIP comes 20 s later (4.4)
  if (/^net\d$/.test(id)) FX.push({ k: 'netring', r0: NET_R[netLvl() - 1], r1: NET_R[netLvl()], t: 0, life: .6 });   // the new reach rings out once (4.8)
  for (const rm of ROOMS) if (rm.open === id) { S.rooms[rm.id] = 'clean'; POPA[rm.id] = T; POPA[rm.id + ':t'] = T + .15; POPA[rm.id + ':a'] = T + .3; POPA[rm.id + ':u'] = T + .45; }
  if (id === 'onsen') S.basket = BASKET_MAX;
  if (u.hat) S.equip.hat = id;   // bought = worn (4.11)
  if (u.pet) S.equip.pet = id;
  for (const a of AREAS) if (a.open === id) AREA_FADE.push({ a, t0: T });
  POPA[id] = T; P.pourAcc = 0; P.pouring = null;
  const had = new Set(STAFF.map(s => s.id)), b0 = BLOCK.slice();
  rebuildWorld(); ensureStaff(); unstick(P); P.padLock = tileOf(P);
  for (const e of GUESTS.concat(STAFF, VIPG ? [VIPG] : [], PET ? [PET] : [])) { const [tx, ty] = tileOf(e), i = ty * MW + tx; if (BLOCK[i] && !b0[i]) unstick(e); }   // newly blocked (a table): step off it
  for (const s of STAFF) if (!had.has(s.id)) Object.assign(s, { x: 17 * TILE + 8, y: 31 * TILE + 8, arrive: true, newT: T, path: [], goal: null, dir: 'up' });   // in through the front door (7.3.4)
  if (star() > s0) starPopAt = T;   // the new HUD star pops (the unlock chime already plays)
  S.peak = Math.max(S.peak, star());
  // 4.13 events: a new area (banner + its chime), the innkeeper's line (8.2 P01-P05), the shop owner on a hat, the statue
  news('buy');
  if (u.gate) { banner('area', id, { star: star() > s0 }); sfx('areaOpen'); news('area'); }
  else if (id !== 'statue') banner('buy', id);   // 7.3: "new! [icon] name . the info card's line"
  { const bp = BUY_POP[u.icon], y0 = P.y - 48 - (P.towels > 0 ? 4 + P.towels * 2 : 0);   // over the line bubble (P01-P05 sits right over the head)
    if (bp) pop(bp, P.x, y0, '#ffffff', 8, 1.4); if (u.hearts) pop('+♥' + u.hearts, P.x, y0 - (bp ? 13 : 0), '#ffb0c8', 8, 1.4); }

  if (u.icon === 'shoes') FX.push({ k: 'speed', t: 0, life: 2 });
  if (u.icon === 'tray') FX.push({ k: 'trayslot', t: 0, life: .5 });
  lineSay(P, star() > s0 ? 'P04' : u.gate ? 'P03' : u.staff ? 'P02' : u.hat || u.pet ? 'P05' : buyLine(u), !!u.pet);
  addHearts(u.hearts);   // after the purchase's own banner + line: a rank overtake it causes queues behind them (18.2)
  if (u.hat) lineSay(shopOwner(), 'K04');
  if (u.booth) RUN.shop.push([S.stats.time, id]);
  if (id === 'statue') { banner('statue', id); fxSpark(tcx(u.at) + 8, tcy(u.at) - 8, 10); }
  goldCheck();
  const rm = ROOMS.find(r => r.open === id), at = rm ? rm.cleanC : u.at ? [tcx(u.at), tcy(u.at)] : STAFF_DEF[id] ? (id === 'recep' ? [tcx(DESK_SPOT), tcy(DESK_SPOT)] : [tcx(STAFF_DEF[id].home), tcy(STAFF_DEF[id].home)]) : [tcx(xy), tcy(xy)];
  fxSpark(at[0], at[1], 6); FX.push({ k: 'poof', x: at[0], y: at[1], t: 0, life: .45 });
  if (at[0] !== tcx(xy) || at[1] !== tcy(xy)) fxSpark(tcx(xy), tcy(xy), 4);
  if (!onView(at[0], at[1])) edgeNew(Math.floor(at[0] / TILE), Math.floor(at[1] / TILE), u);   // out of view: a "new" tag points at it (7.3.3)
  SFX.unlock(); saveNow();
  if (star() >= 5 && s0 < 5 && !S.done) celebrateAt = T + 1.4;
}
// the innkeeper's line for an ordinary purchase (8.2): a room, a decor piece, a tool, a garden piece, else P01
function buyLine(u) {
  if (/^(room\d|w\d|c2|suiteB)$/.test(u.id)) return 'P07';
  if (u.decor) return 'P08';
  if (/^(shoes|basket|net|tray)\d$/.test(u.id)) return 'P09';
  if (/^g_|^koi$|^bigbath$/.test(u.id)) return 'P10';
  return 'P01';
}
// a pad shows for the first time: it pops in; out of view a "new" tag on the screen edge points at it (7.3.3)
function padsSeen() {
  for (const [id, xy] of PADPOS) if (!PADSEEN.has(id)) { PADSEEN.add(id); POPA['pad:' + id] = T; if (state === 'play' && !onView(tcx(xy), tcy(xy))) edgeNew(xy[0], xy[1], UNLOCK[id]); }
}
// the value pops over your head when you buy (7.3.5); hearts pop for everything
const BUY_POP = { shoes: '▲速度', basket: '+3 毛巾', tray: '+1 托盘', net: '▲范围' };
