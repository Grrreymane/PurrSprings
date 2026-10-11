// ============================================================ decor + combos (4.5)
// Bought once = owned; a piece can stand in any number of rooms. Stand still on a slot: after DECOR_T0 the next piece
// swaps in, then one every DECOR_T while you stay; it stops by itself when the two pieces make a combo (walk off and step
// back on to go on). A combo room: its noren takes the combo's colour + emblem, a 1-char plate shows over the door when
// you are within 3 tiles; a room with decor but no combo shows a small star there instead.
const decorOwned = () => DECOR_IDS.filter(id => S.unlocked[id]);
const otherSlot = sl => DSLOTS.find(o => o.rm === sl.rm && o.k !== sl.k);
const hinted = c => !!c && (c.hint || goldStars() >= (HINT_GOLD[c.id] || 99));   // the arrow may point at it
const comboKnown = c => !!c && (hinted(c) || !!S.combos[c.id]);
// room variety (18.2): how many open guest rooms show each combo; the arrow and a slot's swap order prefer the rarest
function comboUse() { const n = NUL(); for (const rm of GUEST_ROOMS) { const c = roomOpen(rm) && roomCombo(rm); if (c) n[c.id] = (n[c.id] || 0) + 1; } return n; }
// a piece's key for slot sl (lower = first): with a piece in the other slot, the rooms that already have the combo the
// two make (no known combo: 100); in an empty room, the fewest rooms of any known combo it makes with an owned partner (99: none)
function pieceKey(sl, id, n) {
  const other = S.decor[otherSlot(sl).key];
  if (other) { const c = comboOf(other, id); return comboKnown(c) ? n[c.id] || 0 : 100; }
  let b = 99; for (const c of COMBOS) if (comboKnown(c) && (c.a === id || c.b === id) && S.unlocked[c.a] && S.unlocked[c.b]) b = Math.min(b, n[c.id] || 0);
  return b;
}
// re-dress (18.2): a combo room whose combo 2+ rooms share, its other slot holding one piece of a pointed-at combo never
// made: the missing piece (else null)
function redressOf(sl, n) {
  const rc = roomCombo(sl.rm), o = S.decor[otherSlot(sl).key];
  if (!rc || !o || (n[rc.id] || 0) < 2) return null;
  for (const c of COMBOS) if (c !== rc && hinted(c) && !S.combos[c.id] && S.unlocked[c.a] && S.unlocked[c.b] && (o === c.a || o === c.b)) return o === c.a ? c.b : c.a;
  return sl.k === 'A' ? seasonStart() : null;   // v2.1: a seasonal combo whose pieces stand in no room yet: start it here (seasons.js)
}
const DOOR_OF = NUL(); DOORS.forEach(d => { if (d.room) DOOR_OF[d.room] = d; });
// what a slot cycles through (4.5): (1) pieces that make a known combo with the other slot, (2) pieces standing in no room
// yet, (3) the rest in table order, (4) empty - then back to what it held. The piece in the other slot is skipped.
// Room variety (18.2): (1)-(3) are sorted by pieceKey (the combo the fewest rooms have first); equal keys keep that order.
function slotCycle(sl) {
  const other = S.decor[otherSlot(sl).key] || null, cur = S.decor[sl.key] || null, placed = new Set(Object.values(S.decor));
  const own = decorOwned().filter(id => id !== other && id !== cur), known = id => comboKnown(comboOf(other, id));
  const L0 = own.filter(known).concat(own.filter(id => !known(id) && !placed.has(id)), own.filter(id => !known(id) && placed.has(id)));
  const n = comboUse(), L = L0.map((id, i) => [id, i, pieceKey(sl, id, n)]).sort((a, b) => a[2] - b[2] || a[1] - b[1]).map(x => x[0]);
  const rd = redressOf(sl, n), ri = rd ? L.indexOf(rd) : -1; if (ri > 0) { L.splice(ri, 1); L.unshift(rd); }   // v2.1: the piece the arrow shows comes first,
  if (ri >= 0) L.rd = rd;                                                                                       // and the swaps stop on it (slotZone)
  if (cur) L.push(null);
  L.push(cur);
  return L;
}
function setDecor(sl, id) {
  const rm = sl.rm, before = roomCombo(rm);
  if (id) S.decor[sl.key] = id; else delete S.decor[sl.key];
  POPA['decor:' + sl.key] = T; sfx('swap'); markDirty();
  const c = roomCombo(rm);
  if (c !== before) paintDoor(DOOR_OF[rm.id]);
  if (c && c !== before) comboMade(rm, c);
  if (id) firstDone('decor');
  return c;
}
function comboMade(rm, c) {
  S.stats.combosMade++;
  const mx = (tcx(rm.slotA) + tcx(rm.slotB)) / 2, my = (tcy(rm.slotA) + tcy(rm.slotB)) / 2 - 6;
  fxSpark(mx, my, 8);
  if (!S.combos[c.id]) {   // the first time: gong, gold banner, hearts +10, the album lights up
    S.combos[c.id] = S.day; addHearts(10); sfx('gong'); banner('combo', c.id); news('combo');
  }
  pop('组合！', mx, my - 10, '#ffd8f0', 8, 1.2);
  markDirty();
}
// standing on a decor slot (called from zones)
function slotZone(dt, ptx, pty) {
  const sl = DSLOT_AT[pty * MW + ptx], ps = P.slot;
  if (!sl || !roomOpen(sl.rm) || !decorOwned().length) { ps.key = null; ps.t = 0; return; }
  if (ps.key !== sl.key) Object.assign(ps, { key: sl.key, t: 0, n: 0, stop: false, cyc: null });
  if (P.moving) { ps.t = 0; return; }   // only while standing still (4.5 / 18.1)
  if (ps.stop) return;
  ps.t += dt;
  if (ps.t < (ps.n ? DECOR_T : DECOR_T0)) return;
  ps.t = 0;
  if (!ps.cyc) ps.cyc = slotCycle(sl);
  if (ps.cyc.length < 2) { ps.stop = true; return; }   // nothing to swap to
  const id = ps.cyc[ps.n % ps.cyc.length]; ps.n++;
  if (setDecor(sl, id) || (id && id === ps.cyc.rd)) ps.stop = true;   // a combo: stop here (v2.1: or the re-dress piece the arrow showed)
}
// rule 14 of the arrow (6): slots where an owned piece completes a combo the arrow may point at (hint), nearest first;
// if there are none, the A slots of the open rooms without any decor (while you own some), nearest first; with no bare
// room left, re-dress slots (redressOf, 18.2). Hidden combos are pointed at only once hinted. slotTarget() = the first.
function slotCands() {
  const own = decorOwned(); if (!own.length) return [];
  const d = sl => Math.abs(tcx(sl.at) - P.x) + Math.abs(tcy(sl.at) - P.y), by = (a, b) => d(a) - d(b);
  const combo = DSLOTS.filter(sl => roomOpen(sl.rm) && !roomCombo(sl.rm) && !!slotPiece(sl, true));
  // v2.1: a combo never made before goes first (a seasonal combo started by a re-dress, not its old combo back)
  const made = sl => S.combos[(comboOf(S.decor[otherSlot(sl).key], slotPiece(sl, true)) || {}).id] ? 1 : 0;
  if (combo.length) return combo.sort((a, b) => made(a) - made(b) || by(a, b));
  const bare = DSLOTS.filter(sl => sl.k === 'A' && roomOpen(sl.rm) && !S.decor[sl.key] && !S.decor[otherSlot(sl).key]);
  if (bare.length) return bare.sort(by);
  const n = comboUse();
  return DSLOTS.filter(sl => roomOpen(sl.rm) && !!redressOf(sl, n)).sort(by);
}
const slotTarget = () => slotCands()[0] || null;
// arrow timers (stage 4, 18.2): a pointed-at combo never made yet goes before the pads for COMBO_RUSH s; after STALL_T s
// without a purchase, buying (or the pile that pays for it) goes before the chores
const COMBO_RUSH = 90, STALL_T = 100;
let lastBuyAt = 0;   // the last purchase (the arrow's anti-stall: rule 6 moved up)
let comboRushAt = NUL();   // combo id -> when rule 14 first went ahead of the pads for it (not saved: a load gives another go)
function comboRush() {
  let on = false;
  for (const c of COMBOS) if (hinted(c) && !S.combos[c.id] && S.unlocked[c.a] && S.unlocked[c.b]) {
    if (comboRushAt[c.id] === undefined) comboRushAt[c.id] = S.stats.time;
    if (S.stats.time - comboRushAt[c.id] < COMBO_RUSH) on = true;
  }
  return on;
}
// the owned piece that would make a pointed-at combo with the other slot - the one the fewest rooms have (comboOnly: else
// null), else the first owned one; an empty room: the piece with the lowest pieceKey (table order on ties); a re-dress
// slot: its missing piece (18.2)
function slotPiece(sl, comboOnly) {
  const own = decorOwned(), other = S.decor[otherSlot(sl).key], n = comboUse();
  if (other) {
    const rd = redressOf(sl, n); if (rd) return rd;
    const xs = own.filter(x => x !== other && x !== S.decor[sl.key] && hinted(comboOf(other, x)));
    const id = xs.map((x, i) => [x, i, n[comboOf(other, x).id] || 0]).sort((a, b) => a[2] - b[2] || a[1] - b[1]).map(x => x[0])[0];
    return id || (comboOnly ? null : own[0] || null);
  }
  if (comboOnly) return null;
  return own.map((id, i) => [id, i, pieceKey(sl, id, n)]).sort((a, b) => a[2] - b[2] || a[1] - b[1]).map(x => x[0])[0] || null;
}

// ---- the top banner queue (drawBanner shows BANNER_Q[0]; 7.3). SFX unlock / vip / gong / areaOpen duck the music.
const BANNER_Q = [];
// kinds: combo, area, rank {rank}, gold (n), level {lv}, day {g, h, rec}, milestone (n), statue. The same kind + id again
// updates the queued one instead of adding a second (7.3: equal banners merge)
function banner(kind, id, o) {
  const b = BANNER_Q.find(x => x.kind === kind && x.id === id); if (b) { Object.assign(b, o); return; }
  BANNER_Q.push(Object.assign({ kind, id, t: T, age: 0 }, o));
  if (BANNER_Q.length > 3) {   // over 3: drop a waiting rank / level / day banner first, else the oldest waiting one (18.2)
    const i0 = BANNER_Q[0].age > 0 ? 1 : 0, i = BANNER_Q.findIndex((x, j) => j >= i0 && (x.kind === 'rank' || x.kind === 'level' || x.kind === 'day'));
    BANNER_Q.splice(i >= 0 ? i : i0, 1);
  }
}
// the "new" tag on the screen edge for something new out of view (7.3; icon = a padIcon kind or an unlock; drawEdgeNew)
const EDGE_Q = [];
// one tag per place (things within 2 tiles of a tag already up share it); at most 2 at a time - the first ones stay
function edgeNew(tx, ty, icon) {
  if (EDGE_Q.length >= 2 || EDGE_Q.some(e => Math.max(Math.abs(e.tx - tx), Math.abs(e.ty - ty)) <= 2)) return;
  EDGE_Q.push({ tx, ty, icon, t: T, age: 0 });
}
