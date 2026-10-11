// ============================================================ entities: player / guests / staff
// P.tray = the hand tray (4.1; head towels stay in P.towels). pick: pick-up timers per zone; cookT / cookK: the stove;
// giveT / giveTo / giveK: handing something over (DELIVER_T); putT: putting back what nobody wants any more.
const P = { x: 0, y: 0, dir: 'up', moving: false, walkT: 0, towels: 0, dist: 0, sway: 0, atDesk: false, pourAcc: 0, pouring: null, padOn: null, padT: 0, padLock: null, shelfT: 0, basketT: 0,
  tray: [], pick: {}, cookT: 0, cookK: null, giveT: 0, giveTo: null, giveK: null, putT: 0, slot: { key: null, t: 0, n: 0, stop: false, cyc: null } };
const PLAYER_LOOK = { fur: 'orange', outfit: 'happi' };
const GUESTS = [], Q = [], STAFF = [], SLOT_OCC = SLOTS.map(() => null), SEAT_OCC = SEATS.map(() => null);
const RT = {};   // per room runtime: { guest, cleanP, claim }
const PASS = { n: 0 };                    // rice portions on the dining counter (4.3; runtime only, like the tray)
const BROWSE = { occ: null };             // the one souvenir-browsing spot (7,32)
const TEA_AT = { occ: null };             // the one spot at the lobby urn where a guest serves itself tea (TEA_SPOT, G3)
const TABLE_EATEN = [-9, -9, -9, -9];     // when each table last finished a meal (its plates show 'eaten' for 3 s)
// run counters for tests / balancing (not saved): calls made / timed out, diners seated / gone hungry
// stage 2C: level-ups, overtakes, dawns, boutique buys, and `news` = [game time, kind] of every "something new" event (4.13 / 14.2 B3)
// v2.0.1: callsStaff = calls the tea runner brought, callsSelf = calls that ended because the guest got it by itself
const RUN = { calls: 0, callsMissed: 0, callsStaff: 0, callsSelf: 0, teaSelf: 0, seated: 0, hungry: 0, clerk: 0, vips: 0, vipDone: 0, vipLeft: 0, vipPaid: 0, vipF: [], vipUsed: [],
  levelups: 0, overtakes: 0, days: 0, shop: [], news: [], lines: 0, lineLog: [] };
function news(kind) { RUN.news.push([S.stats.time, kind]); if (RUN.news.length > 2000) RUN.news.splice(0, 1000); }
let spawnT = 1.5, guestN = 0, lastCallAt = -99;
function setSt(e, st) { e.st = st; e.t = 0; }

// ---- hooks the later stages fill in (kept tiny on purpose)
// first-time picture cards (7.4): stage 3 draws FIRST_Q[0] at the bottom and hides it on firstDone(key) / after 20 s
const FIRST_Q = [];
function firstTime(key) { if (!SEEN_KEYS.includes(key) || S.seen[key]) return false; S.seen[key] = true; FIRST_Q.push({ key, t: T, vis: 0 }); news('first'); markDirty(); return true; }
function firstDone(key) { for (let i = FIRST_Q.length - 1; i >= 0; i--) if (FIRST_Q[i].key === key) FIRST_Q.splice(i, 1); }
// cat lines (8): lineSay(who, key) - key = a line id from 8.2, or several joined by '|' (picked by their own odds); the
// line system is in the section "cat lines" below. Called at every event that has a line; returns true if it was said.
// ---- hearts, the rival board, gold stars (4.9). Hearts only ever go up. Your rank = 1 + the rival inns (9, fixed heart
// thresholds) you have not reached yet: 10th at the start. Passing one: a banner "passed X! #n" (several within 10 s
// share one), the rank-up horn, line P06. From star 5 the last five thresholds light the gold stars (each: every fee
// +5 %, guests 3 % sooner); the ones passed before star 5 light up together when star 5 comes.
const rankOf = h => 1 + RIVALS.reduce((n, r) => n + (r.id && h < r.h ? 1 : 0), 0);
let goldSeen = 0, goldPopAt = -9;   // runtime: gold stars already announced (set on load: no replay)
function addHearts(n) {
  n = n | 0; if (n <= 0) return;
  const h0 = S.hearts; S.hearts += n; S.dayLog.h += n; markDirty();
  if (rankOf(S.hearts) < rankOf(h0)) overtake(h0);
  goldCheck();
}
function overtake(h0) {
  let rv = null; for (const r of RIVALS) if (r.id && h0 < r.h && S.hearts >= r.h) rv = r;   // the last one passed by this gain
  const rank = rankOf(S.hearts), b = BANNER_Q.find(x => x.kind === 'rank' && T - x.t0 <= RANK_MERGE);
  if (b) Object.assign(b, { id: rv.id, rank }); else banner('rank', rv.id, { rank, t0: T });
  sfx('rankup'); lineSay(P, 'P06'); RUN.overtakes++; news('rank');
}
function goldCheck() {
  const n = goldStars(); if (n <= goldSeen) { goldSeen = n; return; }
  const n0 = goldSeen; goldSeen = n; goldPopAt = T; banner('gold', n); news('gold'); markDirty();
  // a hidden combo's recipe (18.2): its banner, and P11 when that banner comes up (now an overtake's P06 would drop it)
  for (const c of COMBOS) if (HINT_GOLD[c.id] > n0 && HINT_GOLD[c.id] <= n && !S.combos[c.id]) banner('hint', c.id, { line: 'P11' });
}
// ---- staff levels (4.7): one Lv number per cat. Each level: receptionist checks in x0.92; maids clean x0.9 and walk +5 %;
// the porter carries +1 towel a trip; the chef cooks x0.92; waiters and the clerk walk +5 %. A level-up: gold "Lv2"
// over the head, a sparkle, line S18, a small banner [face] name Lv2. Lv3 silver trim, Lv5 gold trim (look.trim).
const lvOf = xp => { let l = 1; while (l < 5 && xp >= LV_XP[l]) l++; return l; };
const staffLv = s => lvOf(S.staff[s.id] | 0);
const lvMul = (s, per) => Math.pow(per, staffLv(s) - 1);
const staffSpeed = s => STAFF_SPEED * (s.role === 'maid' || s.role === 'waiter' || s.role === 'clerk' || s.role === 'tea' ? 1 + .05 * (staffLv(s) - 1) : 1);
const porterCap = s => 6 + staffLv(s) - 1;
function gainXp(s, n) {
  if (!s || !STAFF_DEF[s.id] || s.role === 'owner') return;
  const l0 = staffLv(s); S.staff[s.id] = (S.staff[s.id] | 0) + n;
  const l1 = staffLv(s); if (l1 > l0) levelUp(s, l1);
}
function levelUp(s, lv) {
  pop('Lv' + lv, s.x, s.y - 46, '#ffd23f', 8, 1.4); fxSpark(s.x, s.y - 14, 6); sfx('levelup');   // over the S18 bubble
  lineSay(s, 'S18'); banner('level', s.id, { lv }); RUN.levelups++; news('level'); markDirty();
}
// the look a staff cat is drawn with: its clothes get a silver (Lv3-4) / gold (Lv5) edge (one cached object per trim)
const LOOK_TRIM = new Map();
function staffLook(s) {
  const lv = staffLv(s), trim = TRIM_OUTFITS.has(s.look.outfit) ? (lv >= 5 ? 2 : lv >= 3 ? 1 : 0) : 0;
  const uni = s.role === 'owner' ? null : staffUniform();   // v2.1 (16.6): the uniform everyone wears (look.uniform)
  if (!trim && !uni) return s.look;
  const k = s.id + ':' + trim + ':' + (uni || ''); let l = LOOK_TRIM.get(k); if (!l) { l = Object.assign({}, s.look, { trim }, uni ? { uniform: uni } : {}); LOOK_TRIM.set(k, l); }
  return l;
}
// money straight into the wallet (calls; stage 2B: VIP gifts): fish fly from (wx, wy) in the world to the HUD
function earn(v, wx, wy) {
  v = v | 0; if (v <= 0) return;
  S.money += v; S.earned += v; lastEarnT = S.stats.time;
  const n = Math.min(6, Math.max(1, Math.ceil(v / 12)));
  for (let i = 0; i < n; i++) FX.push({ k: 'fly', x0: wx - R(cam.x) + rand(-4, 4), y0: wy - R(cam.y) + rand(-3, 3), t: -i * .05, life: .55 + i * .02 });
  pop('+' + v, wx, wy - 8, '#ffe9a8', 8, .9); SFX.coin(0); markDirty();
}
