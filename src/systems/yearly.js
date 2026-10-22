// ============================================================ v2.1 the yearly award (SPEC_v2 16.3) + paused cards
// Before sunrise ends the year's last day (clock .05 of day 12, 24, ...) the year report pauses the game: "第1年 年度报告",
// three numbers (guests, income, new combos this year) and the award by this year's hearts (AWARDS: >= 3,000 金奖, >= 2,400
// 银奖, >= 2,000 铜奖, >= 600 人气奖, else 努力奖 - there is always one; set from the bots, SPEC_v2 18.2 / 19.3: 36-min years). The prize - 15,000 / 8,000 / 4,000 / 2,000 / 1,000 x
// min(year, 3) - waits in the cash box; the trophy stands on the lobby's north wall (23,22), the newest two. Gold three
// years running: the sign by the door gets a gold frame, "殿堂旅馆" (hallOfFame(), from S.awards).
// S.year holds the totals at the start of this year ({ g: guests, e: earned, h: hearts, combos: combos found, n: the
// year }); this year's numbers are the differences, so nothing else has to count for it. A save from before v2.1 starts
// its year at its first load (loadV21a).
// ---- paused cards (state 'card'): the year report, the press result (press.js), the family photo (mom.js). Queued by
// modalPush(), shown from gameUpdate (modalPump: never pushed from a draw call) one at a time while you play; the game
// and the clock wait (gameUpdate doesn't run, like the menu); a tap after 0.8 s closes it (onPress -> modalPress).
const MODAL_Q = [];
function modalPush(m) { MODAL_Q.push(m); }
// v2.3 (19.3): not in the evening rush (the reporter walking out at sunset paused the big rush halfway): it waits for the
// rush's result
function modalPump() { if (state === 'play' && MODAL_Q.length && !rushOn() && RUSH5.end === null) { go('card'); MODAL_Q[0].stamp = false; } }
function modalPress() { if (st < CARD_CLOSE_T) return; SFX.click(); modalClose(); }
function modalClose() {
  MODAL_Q.shift();
  if (MODAL_Q.length) { go('card'); MODAL_Q[0].stamp = false; } else if (state === 'card') go('play');
}
function yearTick() {
  if (S.day % YEAR_DAYS !== 0 || S.clock < YEAR_AT || S.clock >= DAWN_AT) return;
  const y = yearOf(S.day); if (S.year.n > y) return;
  yearReport(y);
}
const awardOf = h => AWARDS.find(a => h >= a.h) || AWARDS[AWARDS.length - 1];
function yearReport(y) {
  const nc = Object.keys(S.combos).length, Y = S.year;
  const g = Math.max(0, S.stats.guests - Y.g), e = Math.max(0, S.earned - Y.e), h = Math.max(0, S.hearts - Y.h), c = Math.max(0, nc - Y.combos);
  const aw = awardOf(h), prize = aw.prize * Math.min(y, 3), hall0 = hallOfFame();
  S.piles.recep = (S.piles.recep || 0) + prize;
  S.awards.push({ y, k: aw.k, h }); if (S.awards.length > 40) S.awards.shift();
  S.year = { g: S.stats.guests, e: S.earned, h: S.hearts, combos: nc, n: y + 1 };
  modalPush({ kind: 'year', y, g, e, h, c, k: aw.k, name: aw.name, prize, hall: !hall0 && hallOfFame() });
  news('year'); RUN.years = (RUN.years || 0) + 1; markDirty();
}
// gold three years running (any three in a row, once is enough)
function hallOfFame() {
  const A = S.awards; let run = 0;
  for (let i = 0; i < A.length; i++) {
    if (A[i].k !== 'gold') { run = 0; continue; }
    run = i > 0 && A[i - 1].k === 'gold' && A[i - 1].y === A[i].y - 1 ? run + 1 : 1;
    if (run >= 3) return true;
  }
  return false;
}
// ---- drawing the card on top of everything (render(): layerBreak() first)
function drawModal() {
  const m = MODAL_Q[0]; if (!m) return;
  g.globalAlpha = .55 * Math.min(1, st / .3); g.fillStyle = '#0c0818'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  if (st < .12) return;
  if (m.kind === 'year') drawYearCard(m); else if (m.kind === 'press') drawPressCard(m); else if (m.kind === 'family') drawFamilyCard(m);
  if (st >= CARD_CLOSE_T) { const b = R(Math.sin(T * 4) * 1.5); drawC(handArt(), 150, 252 + b); }   // tap anywhere
}
function drawYearCard(m) {
  panel(18, 64, 144, 196);
  txt(L('第{0}年 年度报告', m.y), 90, 84, 11, '#8a3a1a', 'center', null);
  const row = (y, ic, lab, v) => { drawC(ic, 44, y); txt(lab, 54, y + .5, 8, '#6a4a2a', 'left', null); txt(v, 138, y + .5, 8, '#8a3a1a', 'right', null); };
  row(104, menuIcon('cat'), '接待', L('{0} 位', m.g)); row(119, fishIcon(), '收入', fmt(m.e)); row(134, starIcon(true), '新组合', L('{0} 个', m.c));
  g.fillStyle = '#c89a5a'; g.fillRect(30, 145, 120, 1);
  // the award lands like a stamp (0.35-0.5 s), with its sound
  const k = clamp((st - .35) / .15, 0, 1), s = 4 - 2 * k, c = trophyArt(m.k);
  if (st >= .35) {
    if (!m.stamp) { m.stamp = true; sfx('stamp'); }
    g.globalAlpha = k; g.drawImage(c, R(90 - c.width * s / 2), R(196 - c.height * s), R(c.width * s), R(c.height * s)); g.globalAlpha = 1;
  }
  if (st >= .5) {
    txt(m.name, 90, 208, 13, m.k === 'gold' ? '#d08a10' : '#8a3a1a', 'center', null);
    drawC(fishIcon(), 76, 226); txt('+' + fmt(m.prize), 84, 226.5, 8, '#8a3a1a', 'left', null);
    if (m.hall) txt('殿堂旅馆！', 90, 243, 9, '#d08a10', 'center', null);
  }
}
function drawPressCard(m) {
  panel(18, 64, 144, 196);
  txt(m.tv ? '《喵视新闻》' : '《喵游周刊》', 90, 84, 11, '#8a3a1a', 'center', null);
  txt('温泉特辑', 90, 99, 8, '#6a4a2a', 'center', null);
  const sc = starIcon(true), so = starIcon(false);   // the stars pop in one by one
  for (let i = 0; i < 5; i++) { const on = i < m.stars && st >= .25 + i * .1; g.drawImage(on ? sc : so, 49 + i * 17, 108, sc.width * 2, sc.height * 2); }
  // the four checks: desk bell / combo plate / towel / milk, each with a tick or a dash under it
  const ics = [padIcon('recep'), padIcon('decor'), padIcon('basket'), padIcon('milk')];
  ics.forEach((ic, i) => {
    const x = 42 + i * 32, y = 140; g.fillStyle = '#e8cf98'; g.fillRect(x - 12, y - 11, 24, 32); g.fillStyle = '#fff3d0'; g.fillRect(x - 11, y - 10, 22, 30);
    drawC(ic, x, y);
    if (st >= .3 + i * .1) { if (m.checks[i]) g.drawImage(TICK, x - 3, y + 9); else { g.fillStyle = '#a89a88'; g.fillRect(x - 3, y + 12, 7, 1); } }
  });
  txt(LINES.E09.text(m.stars), 90, 182, 11, m.stars >= 4 ? '#c0392b' : '#8a3a1a', 'center', null);
  drawC(heartIcon(), 50, 204); txt('+' + m.hearts, 57, 204.5, 8, '#8a3a1a', 'left', null);
  const ca = coverArt(m.stars, m.tv, seasonNow()); g.drawImage(ca, 92, 198); txt('人气爆棚', 105, 204.5, 8, '#c0392b', 'left', null);
  txt(L('{0}秒', m.tv ? POP_TV_T : POP_T), 90, 222, 7, '#8a5a34', 'center', null);
}
