// ============================================================ v2.1 the reporter / the TV crew (SPEC_v2 16.4)
// From star 3, on the 1st day of every season 90 s after sunrise (clock .35), a reporter comes (beret + camera); from
// star 4 in autumn and winter a TV host instead (with a mic, a camera cat follows it - only for show: it is the host's
// gu.mate, like a couple's partner). A banner "记者来了！", its own line (E07 / E08). It cuts into the line - at the
// front, or second if the front guest is being checked in - and never gets angry (no patience). Otherwise it is an
// ordinary guest: at check-in it takes the best free room (combo > decor > plain, then the cottage; pressRoom()).
// Score = 1 + four checks: (desk) checked in within 10 s of reaching the front, (combo) its room is a combo room,
// (towel) a towel within 5 s of reaching the basket (no onsen: passed), (milk) the milk machine is open. When it walks out,
// the result card pauses the game: the magazine 《喵游周刊》 (TV 《喵视新闻》) "温泉特辑", the stars, the four check icons
// with a tick or a dash, one line (E09). Reward: hearts = stars x 15 (TV x 30), "popular" for 90 s (TV 120 s): room
// fees and tips x1.3, every check-in hearts +1 (HUD row 2: the cover + a ring), the cover on the lobby wall (19,22).
// The arrow (guide.js, after rule 2): the reporter at the front and nobody at the desk -> the desk; it waits for a towel,
// the basket is empty and there's no porter -> towels. Saved: S.pressS (the absolute season it last came; 0 = none
// yet), S.popT / S.popTV, S.covers. The reporter itself is a guest (not saved): a load mid-visit ends it without a card.
const PRESS = { gu: null };
SEEN_KEYS.push('press');   // the first reporter's picture card: what it checks (cards.js FIRST_CARD.press)
const pressTV = () => star() >= PRESS_TV_STAR && seasonNow() >= 2;
function pressTick(dt) {
  if (S.popT > 0) { S.popT = Math.max(0, S.popT - dt); if (!S.popT) S.popTV = false; }
  const gu = PRESS.gu;
  if (gu) { if (gu.gone || !GUESTS.includes(gu)) PRESS.gu = null; else pressFollow(gu); return; }
  const as = absSeason(S.day);
  if (seasonDay(S.day) === 0 && S.clock >= PRESS_AT && S.clock < PRESS_END && S.pressS < as && star() >= PRESS_STAR && Q.length < QSPOTS.length && !pressBusy()) pressArrive(as);   // (a full line: a moment later)
}
// fun check (SPEC_v2 18.2): the reporter is polite - it waits while a new area has just opened (< PRESS_CALM s) or the
// very first VIP is being shown round (its 3-step card); if the day's window passes, it comes next season (nothing lost).
// v2.1 merge fun check: also while a picture card is up and for PRESS_CARD_CALM s after one came (the first VIP's photo
// card, then the reporter's own card 4 s later, was one lesson too many in a row)
const PRESS_CALM = 60, PRESS_CARD_CALM = 30;
function pressBusy() {
  if (VIPG && !VIPG.mom && !S.stats.vips) return true;
  if (FIRST_Q.length) return true;
  for (let i = RUN.news.length - 1; i >= 0 && RUN.news[i][0] > S.stats.time - PRESS_CALM; i--) {
    const [t, k] = RUN.news[i];
    if (k === 'area' || (k === 'first' && t > S.stats.time - PRESS_CARD_CALM)) return true;
  }
  return false;
}
function pressArrive(as) {
  const tv = pressTV();
  addGuest('regular'); const gu = GUESTS[GUESTS.length - 1];
  Q.splice(Q.indexOf(gu), 1); Q.splice(Q[0] && Q[0].ck > 0 ? 1 : 0, 0, gu);   // the front, or second if the front one is being checked in
  gu.look = Object.assign({}, tv ? TV_LOOK : PRESS_LOOK); gu.pat = 1e9; gu.mate = null;
  if (tv) gu.mate = { kind: 'cat', look: Object.assign({}, CAMERA_LOOK), x: gu.x, y: gu.y + 9, dir: 'up', moving: false, walkT: 0, path: [], goal: null, q: [], mode: 'follow' };
  gu.press = { tv, said: false, front: null, desk: null, combo: false, towelAt: null, towel: null, done: false };
  PRESS.gu = gu; S.pressS = as;
  banner('press', tv ? 1 : 0); sfx('vip'); firstTime('press'); news('press'); markDirty();
}
// the best free clean room for the reporter (freeRoom() asks this): a combo room, else one with decor, else plain;
// a cottage before a main-wing room of the same kind; a seasonal combo in its season first
function pressRoom() {
  let best = null, bk = -1;
  for (const rm of GUEST_ROOMS) {
    if (!roomFree(rm)) continue;
    const [a, b] = decorOf(rm), c = comboOf(a, b), k = (c ? 20 : (a || b) ? 10 : 0) + (c && c.season === seasonNow() ? 5 : 0) + (rm.cottage ? 2 : 0);
    if (k > bk) { bk = k; best = rm; }
  }
  return best;
}
// watching the reporter go through the inn: the four checks are read off its state, nothing in guests.js changes
function pressFollow(gu) {
  const p = gu.press, now = S.stats.time;
  if (gu.look.outfit === 'yukata') { gu.look = Object.assign({}, p.tv ? TV_LOOK : PRESS_LOOK); if (gu.mate) gu.mate.look = Object.assign({}, CAMERA_LOOK); }   // no yukata after the bath: still the press
  if (!p.said && gu.inside) p.said = say(gu, p.tv ? 'E08' : 'E07') || gu.t > 30;   // E07 / E08 (event lines, odds 1: say() directly)
  if ((gu.st === 'queue' || gu.st === 'arrive') && Q[0] === gu && gu.ready && p.front === null) p.front = now;
  if (p.desk === null && gu.st !== 'queue' && gu.st !== 'arrive') { p.desk = p.front === null ? 0 : now - p.front; p.combo = !!(gu.room && roomCombo(ROOM[gu.room])); }
  if (gu.st === 'towel' && p.towelAt === null) p.towelAt = now;
  if (p.towelAt !== null && p.towel === null && gu.st !== 'towel') p.towel = gu.st === 'toSlot' && now - p.towelAt <= PRESS_TOWEL_T + 1e-6;
  if (!p.done && (gu.st === 'leave' || gu.st === 'angry')) pressResult(gu);
}
function pressChecks(p) {
  return [p.desk !== null && p.desk <= PRESS_DESK_T + 1e-6, !!p.combo, !S.unlocked.onsen || p.towel === true, !!S.unlocked.milk];
}
function pressResult(gu) {
  const p = gu.press; p.done = true;
  const checks = pressChecks(p), stars = 1 + checks.filter(Boolean).length, hearts = stars * (p.tv ? PRESS_TV_HEARTS : PRESS_HEARTS);
  S.popT = p.tv ? POP_TV_T : POP_T; S.popTV = p.tv;
  S.covers.push({ d: S.day, n: stars, tv: p.tv }); if (S.covers.length > 40) S.covers.shift();
  sfx('shutter'); say(gu, 'E09', stars); firstDone('press'); news('press'); RUN.press = (RUN.press || 0) + 1;
  modalPush({ kind: 'press', tv: p.tv, stars, checks, hearts });
  addHearts(hearts); markDirty();
}
// rule "2b" of the arrow (6; called right after rule 2): the reporter at the front and nobody at the desk; the reporter
// waiting at the basket, the basket empty and no porter yet
function pressGuide() {
  const gu = PRESS.gu; if (!gu || gu.gone || gu.press.done) return null;
  if ((gu.st === 'queue' || gu.st === 'arrive') && Q[0] === gu && !deskManned() && freeRoom(gu)) return gAt(2, T_DESK(false));
  if (gu.st === 'towel' && S.unlocked.onsen && !S.unlocked.porter && S.basket === 0) return gAt(2, P.towels > 0 ? T_BASKET(false) : T_SHELF(false));
  return null;
}
