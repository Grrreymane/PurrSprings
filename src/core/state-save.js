// ============================================================ state + save/load (SPEC_v2 section 10)
function defaults() {
  return {
    v: 2, money: 0, earned: 0,
    unlocked: { room1: true }, paid: {}, basket: 0, piles: {}, rooms: { room1: 'clean' },
    stats: { guests: 0, angry: 0, time: 0, calls: 0, callsFast: 0, vips: 0, diners: 0, combosMade: 0 }, tut: { moved: false }, done: false,
    peak: 1, hearts: 0, clock: .12, day: 1, dayLog: { g: 0, h: 0, best: 0 },
    decor: {}, combos: {}, seen: {}, album: { vip: {}, photos: [], furs: {}, types: {} }, gifts: [],
    equip: { hat: null, pet: null }, staff: {}, vipNext: 0, opts: { lines: true }, gift: false,
    vipOwe: 0,   // the unpaid gift of a VIP seated in a suite right now (10.1: half of it goes to the cash box on load)
    vipAt: 0,    // when the next VIP is due after one left (game seconds, stats.time): a reload must not bring it sooner (18.2)
  };
}
const starOf = s => 1 + (s.unlocked.onsen ? 1 : 0) + (s.unlocked.dining ? 1 : 0) + (s.unlocked.garden ? 1 : 0) + (s.unlocked.roten ? 1 : 0);
const int0 = v => { const n = Math.floor(+v); return Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0; };
// v1 -> v2 (10.2): runs on the raw save before the defaults are filled in. Never takes anything away: the star is kept
// in `peak`, money poured into pads that no longer exist (the v1 招牌) is refunded, hearts are granted for what was built.
function migrateV1(raw) {
  const u = raw.unlocked = objOr(raw.unlocked);
  const v1Star = 1 + !!u.onsen + !!u.room6 + !!u.room8 + !!u.sign;   // the v1 star formula
  raw.peak = Math.max(int0(raw.peak), v1Star);
  raw.paid = objOr(raw.paid);
  for (const k of Object.keys(raw.paid)) if (!UNLOCK[k] && !u[k]) { raw.money = int0(raw.money) + int0(raw.paid[k]); delete raw.paid[k]; }
  raw.hearts = UNLOCKS.reduce((a, x) => a + (u[x.id] ? x.hearts : 0), 0) + Math.min(600, Math.floor(int0(objOr(raw.stats).guests) / 4));
  raw.gift = v1Star >= 2;   // one "the inn grew!" banner on the first v2 visit
  raw.v = 2;
}
function loadState(rawIn) {
  let raw = rawIn !== undefined ? rawIn : load('state', null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  if ((raw.v | 0) < 2) migrateV1(raw);
  const s = Object.assign(defaults(), raw), d = defaults();
  for (const k of ['unlocked', 'paid', 'piles', 'rooms', 'stats', 'tut', 'dayLog', 'decor', 'combos', 'seen', 'album', 'equip', 'staff', 'opts']) s[k] = Object.assign(d[k], objOr(raw[k]));
  s.v = 2;
  s.money = int0(s.money); s.earned = int0(s.earned); s.basket = clamp(int0(s.basket), 0, BASKET_MAX); s.done = !!s.done; s.gift = !!s.gift;
  { const u = {}; for (const k in s.unlocked) if (s.unlocked[k]) u[k] = true; u.room1 = true; s.unlocked = u; }
  { const p = {}; for (const k in s.paid) { const v = int0(s.paid[k]); if (v) p[k] = v; } s.paid = p; }
  s.peak = clamp(Math.max(int0(s.peak), starOf(s)), 1, 5);   // the star never drops (star() = max(starOf, peak))
  s.hearts = int0(s.hearts);
  s.clock = Number.isFinite(+s.clock) && +s.clock >= 0 && +s.clock < 1 ? +s.clock : .12;
  s.day = Math.max(1, int0(s.day));
  for (const k of ['g', 'h', 'best']) s.dayLog[k] = int0(s.dayLog[k]);
  for (const k of ['guests', 'angry', 'calls', 'callsFast', 'vips', 'diners', 'combosMade']) s.stats[k] = int0(s.stats[k]);
  s.stats.time = Number.isFinite(+s.stats.time) ? Math.max(0, +s.stats.time) : 0;
  s.tut = { moved: !!s.tut.moved };
  {   // only piles the map has (and that are open); anything else (a renamed id, an array, a hand edit) goes into the cash box
    const pl = {};
    for (const k in s.piles) {
      const v = int0(s.piles[k]); if (!v) continue;
      const id = PILE_AT[k] && pileOpen(k, s) ? k : 'recep';
      pl[id] = (pl[id] || 0) + v;
    }
    s.piles = pl;
  }
  {   // guests are not saved: a reserved room is free again, a slept-in room is messy and its guest left a tip
    const rs = {};
    for (const rm of ROOMS) {
      if (!roomOpen(rm, s)) continue;
      const st = s.rooms[rm.id];
      if (st === 'occupied') { rs[rm.id] = 'messy'; s.piles[rm.id] = (s.piles[rm.id] || 0) + STARS[s.peak].tip; }
      else rs[rm.id] = st === 'messy' ? 'messy' : 'clean';
    }
    s.rooms = rs;
  }
  {   // decor: only bought decor, only in open rooms that have decor slots ('room3:A' -> 'd_scroll')
    const dc = {};
    for (const k in s.decor) {
      const [rid, slot] = String(k).split(':'), rm = ROOM[rid], v = s.decor[k];
      if (rm && !rm.vip && roomOpen(rm, s) && (slot === 'A' || slot === 'B') && typeof v === 'string' && UNLOCK[v] && UNLOCK[v].decor && s.unlocked[v]) dc[rid + ':' + slot] = v;
    }
    s.decor = dc;
  }
  { const c = {}; for (const k in s.combos) if (COMBO[k]) c[k] = Math.max(1, int0(s.combos[k])); s.combos = c; }
  { const c = {}; for (const k of SEEN_KEYS) if (s.seen[k]) c[k] = true; s.seen = c; }
  {
    const a = objOr(s.album), out = { vip: {}, photos: [], furs: {}, types: {} }, av = objOr(a.vip), af = objOr(a.furs), at = objOr(a.types);
    const own = id => typeof id === 'string' && UNLOCK[id] && s.unlocked[id] ? id : null;
    for (const k in av) if (VIP[k] && int0(av[k])) out.vip[k] = int0(av[k]);
    if (Array.isArray(a.photos)) for (const p of a.photos.slice(-40)) if (p && typeof p === 'object' && VIP[p.v]) out.photos.push({ v: p.v, d: Math.max(1, int0(p.d)), h: own(p.h), p: own(p.p) });
    for (const k in af) if (FURS[k] && af[k]) out.furs[k] = true;
    for (const k in at) if (GUEST_TYPES[k] && at[k]) out.types[k] = true;
    s.album = out;
  }
  s.gifts = Array.isArray(raw.gifts) ? raw.gifts.filter(v => typeof v === 'string' && VIP[v]).slice(-6) : [];
  { const h = s.equip.hat, p = s.equip.pet; s.equip = { hat: UNLOCK[h] && UNLOCK[h].hat && s.unlocked[h] ? h : null, pet: UNLOCK[p] && UNLOCK[p].pet && s.unlocked[p] ? p : null }; }
  { const c = {}; for (const k in s.staff) if (STAFF_DEF[k]) c[k] = int0(s.staff[k]); s.staff = c; }
  s.vipNext = clamp(int0(s.vipNext), 0, VIPS.length);
  s.vipAt = Math.min(int0(s.vipAt), Math.ceil(s.stats.time) + 300);   // a corrupt value never blocks the VIPs for long
  s.opts = { lines: s.opts.lines !== false };
  // a VIP was being served when the game was left: guests are not saved, so half of the gift still owed goes into the
  // cash box (10.1, the work isn't wasted). Applied once: the field is cleared and the next save writes it back as 0.
  if (int0(s.vipOwe) > 0) {
    s.piles.recep = (s.piles.recep || 0) + R(int0(s.vipOwe) * .5);
    Object.defineProperty(s, 'vipRefunded', { value: true });   // not saved: the next VIP then needs the full gap (no reload shortcut)
  }
  s.vipOwe = 0;
  return s;
}
let S;   // set at boot (loadState needs STAFF_DEF, defined below)
let dirty = false, saveClock = 0;
function markDirty() { dirty = true; }
function saveNow() { save('state', S); dirty = false; saveClock = 0; }
const hasSaveRaw = () => { try { return !!localStorage.getItem(SAVE + 'state'); } catch (e) { return false; } };
let hasSave = hasSaveRaw();
const star = () => clamp(Math.max(starOf(S), S.peak | 0), 1, 5);
// gold stars (4.9): from star 5, one per rival passed among the last five thresholds
const goldStars = () => star() < 5 ? 0 : RIVALS.reduce((n, r, i) => n + (i >= 5 && S.hearts >= r.h ? 1 : 0), 0);
const decorOf = rm => [S.decor[rm.id + ':A'] || null, S.decor[rm.id + ':B'] || null];
const comboOf = (a, b) => a && b ? COMBOS.find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a)) || null : null;
const roomCombo = rm => { const [a, b] = decorOf(rm); return comboOf(a, b); };
// room-fee multiplier of a room (3.2): cottage x1.5; combo x1.6 or any decor x1.2
function roomMult(rm) { const [a, b] = decorOf(rm); return rm.mult * (comboOf(a, b) ? 1.6 : (a || b) ? 1.2 : 1); }
// quality Q: average room-fee multiplier over the open guest rooms (suites excluded)
function qualityQ() { let n = 0, s = 0; for (const rm of GUEST_ROOMS) if (roomOpen(rm)) { n++; s += roomMult(rm); } return n ? s / n : 1; }
// a fee (3.1 x 3.2): o = { rm, gu, slot, pref } - whatever applies; everything multiplies, then rounds
function fee(k, o) {
  o = o || {};
  const ty = o.gu && GUEST_TYPES[o.gu.type] || GUEST_TYPES.regular;
  let m = 1;
  if (k === 'room') { if (o.rm) m *= roomMult(o.rm); m *= ty.room || 1; }
  else if (k === 'tip') { if (o.rm && roomCombo(o.rm)) m *= 2; if (o.pref) m *= 1.5; }
  else if (k === 'bath') { if (o.slot && o.slot.roten) m *= dayLight().night >= .5 ? 1.8 : 1.2; else if (S.unlocked.bigbath) m *= 1.5; m *= ty.bath || 1; }
  else if (k === 'milk') m *= ty.milk || 1;
  else if (k === 'meal') m *= ty.meal || 1;
  m *= 1 + .05 * goldStars();
  let v = R((STARS[star()][k] || 0) * m);
  if (k === 'tip' && S.unlocked.statue) v += 1;
  return v;
}
const shoesLvl = () => (S.unlocked.shoes1 ? 1 : 0) + (S.unlocked.shoes2 ? 1 : 0) + (S.unlocked.shoes3 ? 1 : 0) + (S.unlocked.shoes4 ? 1 : 0);
const netLvl = () => (S.unlocked.net1 ? 1 : 0) + (S.unlocked.net2 ? 1 : 0) + (S.unlocked.net3 ? 1 : 0);
const towelCap = () => 4 + 3 * ((S.unlocked.basket1 ? 1 : 0) + (S.unlocked.basket2 ? 1 : 0));
const playerSpeed = () => P_SPEED * (1 + .15 * shoesLvl());
const slotOpen = i => !!S.unlocked[SLOTS[i].need];
const padNeed = u => u.price - (S.paid[u.id] || 0);
const maidCount = () => STAFF.filter(s => s.role === 'maid').length;
const guestRoomsOpen = () => GUEST_ROOMS.reduce((n, r) => n + (roomOpen(r) ? 1 : 0), 0);
const trayCap = () => 2 + (S.unlocked.tray1 ? 1 : 0) + (S.unlocked.tray2 ? 1 : 0);   // 4.1: 2 + 托盘 x2
const callT = () => star() >= 4 ? 60 : 50;                                             // 4.2: CALL_T (the map is bigger from star 4; stage 4: 40 / 50 -> 50 / 60)
const callMax = () => star() >= 3 ? 3 : 2;
const CALL_FAST = .3;   // served within the first 30 % of its time = fast (x1.5, hearts 2; stage 4: was half)
// a call's reward (4.2): 3 x room fee x Q, x1.5 when served in the first half of its time; gold stars +5% each
const callReward = fast => R(3 * STARS[star()].room * qualityQ() * (fast ? 1.5 : 1) * (1 + .05 * goldStars()));
// seconds between guests (3.3): more rooms -> more guests; gold stars -3% each
function spawnGap() { return Math.max(1.8, STARS[star()].gap * Math.min(1, 9 / Math.max(1, guestRoomsOpen()))) * (1 - .03 * goldStars()); }

// ---- price pads on the ground (3.5). PADPOS = the pads shown right now (id -> tile). At most PAD_MAX progress pads:
// every gate whose prerequisites are met, then part-paid ones, then the cheapest. Decor (2 shop pads, stable slots),
// one hat booth, one pet booth and the statue are extra.
const PADPOS = new Map(), DECOR_SLOT = new Map();
function padEligible(u) {
  if (S.unlocked[u.id]) return false;
  for (const r of u.req) if (!S.unlocked[r]) return false;
  if (u.need5 && star() < 5) return false;
  if (u.vip && !(S.album.vip[u.vip] > 0)) return false;
  return areaOpen(AREA[u.area]);
}
function padsUpdate() {
  PADPOS.clear();
  const prog = [], decor = [];
  let hat = null, pet = null;
  for (const u of UNLOCKS) {
    if (!padEligible(u)) continue;
    if (u.decor) decor.push(u);
    else if (u.hat) { if (!hat || u.price < hat.price) hat = u; }
    else if (u.pet) { if (!pet || u.price < pet.price) pet = u; }
    else if (u.id === 'statue') PADPOS.set(u.id, u.pad);
    else prog.push(u);
  }
  prog.sort((a, b) => (b.gate ? 1 : 0) - (a.gate ? 1 : 0) || ((S.paid[b.id] ? 1 : 0) - (S.paid[a.id] ? 1 : 0)) || a.price - b.price);
  for (const u of prog.slice(0, PAD_MAX)) PADPOS.set(u.id, u.pad);
  // decor: the first two in table order keep the slot they first showed in
  const show = decor.slice(0, 2), used = new Set();
  for (const [id, i] of [...DECOR_SLOT]) if (!show.some(u => u.id === id)) DECOR_SLOT.delete(id); else used.add(i);
  for (const u of show) if (!DECOR_SLOT.has(u.id)) { const i = used.has(0) ? 1 : 0; DECOR_SLOT.set(u.id, i); used.add(i); }
  for (const u of show) PADPOS.set(u.id, DECOR_PADS[DECOR_SLOT.get(u.id)]);
  if (hat) PADPOS.set(hat.id, HAT_PAD);
  if (pet) PADPOS.set(pet.id, PET_PAD);
}
const padVisible = u => PADPOS.has(u.id);
const padXY = u => PADPOS.get(u.id) || (u.dyn ? null : u.pad);
const visiblePads = () => UNLOCKS.filter(u => PADPOS.has(u.id));
// buying this gate really adds a star (draw the little star badge only then)
const raisesStar = u => !!u.star && starOf(S) + 1 > star();
