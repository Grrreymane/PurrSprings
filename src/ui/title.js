// ============================================================ title / celebration / share card / cover
const BTN = { start: [40, 200, 100, 24], fresh: [50, 230, 80, 18], share: [34, 196, 112, 22], cont: [34, 223, 112, 22] };
function onPress(p) {
  if (state === 'title') {
    if (!CLOUD.ready || CLOUD.err) return;   // cloud.js: nothing starts before the save is restored (or after it failed)
    const old = CLOUD.legacy && !hasSave;    // cloud.js: the device's pre-cloud save, continued only on this choice
    if (old && inR(p, BTN.fresh)) { SFX.click(); newGame(); }
    else if (inR(p, BTN.start)) { SFX.click(); if (old) cloudLegacy(); else if (hasSave) continueGame(); else newGame(); }
    return;
  }
  if (state === 'celebrate') {
    if (st < .6) return;
    if (inR(p, BTN.share)) { SFX.click(); makeShare(); }
    else if (inR(p, BTN.cont)) { SFX.click(); S.done = true; saveNow(); go('play'); }
    return;
  }
  if (state === 'menu') { menuPress(p); return; }
  if (state === 'card') { modalPress(p); return; }   // v2.1: a paused card closes on a tap after 0.8 s (yearly.js)
  if (state === 'play') { JOY.on = true; JOY.bx = p.x; JOY.by = p.y; JOY.dx = 0; JOY.dy = 0; }
}
function resetWorld() {
  GUESTS.length = 0; Q.length = 0; STAFF.length = 0; FX.length = 0; POPS.length = 0; SLOT_OCC.fill(null); SEAT_OCC.fill(null); AREA_FADE.length = 0;
  for (const rm of ROOMS) RT[rm.id] = { guest: null, cleanP: 0, claim: null, vipMess: false };
  for (const k in POPA) delete POPA[k];
  DECOR_SLOT.clear(); padsUpdate();
  PADSEEN.clear(); for (const id of PADPOS.keys()) PADSEEN.add(id);
  // calls, trays, the counter and followers are not saved (10.1): they start empty
  Object.assign(P, { x: 17 * TILE + 8, y: 27 * TILE + 8, dir: 'up', moving: false, walkT: 0, towels: 0, dist: 0, sway: 0, atDesk: false, pourAcc: 0, pouring: null, padOn: null, padT: 0, padLock: null, shelfT: 0, basketT: 0,
    tray: [], pick: {}, cookT: 0, cookK: null, giveT: 0, giveTo: null, giveK: null, putT: 0, slot: { key: null, t: 0, n: 0, stop: false, cyc: null } });
  PASS.n = 0; BROWSE.occ = null; TEA_AT.occ = null; netPullAt = -9; TABLE_EATEN.fill(-9); FIRST_Q.length = 0; BANNER_Q.length = 0; lastCallAt = -99; comboRushAt = NUL(); lastBuyAt = S.stats.time;
  for (const k in PILE_AGE) delete PILE_AGE[k];
  // the VIP is not saved (10.1): after a load the next one comes soon - unless half a gift was just refunded (no shortcut)
  sleepReset();   // v2.4: guests of honour asleep in the suites (vip.js)
  VIPG = null; lastVip = null; vipT = !S.unlocked.garden ? 1e9 : Math.max(S.stats.time + (S.vipRefunded ? vipGap() : S.vipNext ? VIP_RELOAD : VIP_FIRST), S.vipAt || 0);
  for (const k in RUN) RUN[k] = Array.isArray(RUN[k]) ? [] : 0;
  // stage 2C runtime: no replayed gold-star / boutique events after a load; the pet starts at your feet
  goldSeen = goldStars(); goldPopAt = -9; boutiqueWas = boutiqueOpen(); k02Pend = false; TRY.hat = TRY.pet = null; TRY.ids = ''; TRIED.clear(); BOOTH.clear();
  MIRROR.t = CUSHION.t = 0; PET = null; quackT = -99; goldT = 0; EDGE_Q.length = 0;
  LINE = LINE_NEXT = null; lineCD = -99; for (const k in LSAID) delete LSAID[k]; INFO = null;   // stage 3 UI: no line / card carried over
  spawnT = 1.5; guideClock = 0; GUIDE = null; celebrateAt = 0; starPopAt = -9; DISP = S.money; lastEarnT = S.stats.time;
  bizReset();   // v2.2 runtime (business.js): the rush, the pile averages, today's causes
  resetB();   // v2.1 core B runtime (plaza.js): rare guests' due times, a fireworks show, try-on
  rebuildWorld(); ensureStaff(); updCam(0, true); updPet(0);
  v21aReset();   // v2.1 core A runtime: festival / reporter / cards (seasons.js)
}
function newGame() { CLOUD.legacy = null; S = defaults(); resetWorld(); saveNow(); hasSave = true; go('play'); }
function continueGame() {
  if (!CLOUD.on) S = loadState(); resetWorld(); go('play');   // cloud: S is already the restored save if (!S.done && innComplete()) celebrateAt = T + 1;   // the whole inn built, its panel never seen (G2)
  if (S.gift) { banner('gift', 0); S.gift = false; markDirty(); }                                // a v1 save: "the inn grew!" once (10.2)
}
function drawTitle() {
  g.fillStyle = 'rgba(12,8,28,.5)'; g.fillRect(0, 0, W, H);
  g.drawImage(catBow('orange', Math.floor(T / .9) & 1, hatOf(S.equip.hat), outfitOf(S.equip.outfit)), 17 * TILE + 8 - 8 - CX, 30 * TILE + 10 - 23 - CY);   // the innkeeper bows at the door (in its hat, 4.11; v2.1: + its outfit)
  { const k = petOf(S.equip.pet); if (k) drawPet({ kind: k, x: 17 * TILE + 21, y: 30 * TILE + 10, dir: 'down', moving: false, walkT: 0, idle: 2 }); }
  { const tt = tr('猫猫温泉旅馆'); let ts = 21; while (ts > 12 && textW(tt, ts) > W - 12) ts--;   // i18n: a longer title steps down to fit
    txt(tt, 90, 74, ts, '#ffe14a'); if (tt !== 'Purr Springs') txt('Purr Springs', 90, 96, 9, '#dff6ff'); }
  const old = CLOUD.legacy && !hasSave, sn = old ? legacyStar(CLOUD.legacy) : star();
  for (let i = 0; i < 5; i++) drawC(starIcon(i < sn), 74 + i * 8, 112);
  if (CLOUD.err) { txt('存档没读到，请刷新再试', 90, 212, 8, '#ffb0a0'); return; }
  if (!CLOUD.ready) { txt(CLOUD.status === 'conflict' ? '请先在平台上选一份存档' : CLOUD.status === 'offline' ? '存档连不上，请在平台上重试' : '读取存档…', 90, 212, 8, '#dff6ff'); return; }
  if (old) { button(BTN.start, '继续本机进度'); button(BTN.fresh, '重新开张', 'blue'); return; }
  button(BTN.start, hasSave ? '继续营业' : '开张营业');
}
function drawCelebrate() {
  g.globalAlpha = .55 * Math.min(1, st / .4); g.fillStyle = '#0c0818'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  if (st < .15) return;
  panel(18, 84, 144, 170);
  txt('全馆落成！', 90, 106, 17, '#c0392b', 'center', null);   // G2: every room and area open (star 5 alone: a banner)
  const sc = starIcon(true); for (let i = 0; i < 5; i++) g.drawImage(sc, 53 + i * 15, 117, sc.width * 2, sc.height * 2);   // 2x, pixel exact
  const rowT = (y, a, b) => { txt(a, 38, y, 8, '#6a4a2a', 'left', null); txt(b, 142, y, 8, '#8a3a1a', 'right', null); };
  // 4.11: what comes next - the rank board, the boutique, the golden statue (icons only)
  txt('接下来', 58, 142, 7, '#8a3a1a', 'center', null);
  g.drawImage(trophyIcon(), 77, 136, 14, 14); g.drawImage(padIcon('hat'), 96, 137); g.drawImage(padIcon('statue'), 115, 137);
  rowT(158, '接待客人', L('{0} 位', S.stats.guests)); rowT(171, '总收入', L('{0} 鱼干', fmt(S.earned))); rowT(184, '营业时间', L('{0} 分钟', Math.max(1, R(S.stats.time / 60))));
  button(BTN.share, '分享旅馆', 'blue'); button(BTN.cont, '继续营业');
}
