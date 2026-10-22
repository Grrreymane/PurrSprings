// Languages (src/core/i18n.js): for en / ja / ko / es (or the one given: -- en) every original has a translation, the
// placeholders are filled, and the text fits: banners, the info card next to its price, first cards, speech bubbles, the
// title, the HUD and every menu page stay on the screen.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/i18n_check.js --seed 1 [-- en]
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 30;
const STAR4 = UNLOCKS.filter(u => !u.need5 && !u.when && u.id !== 'roten').map(u => u.id);
function setup(list, money) {
  S = defaults(); for (const id of list || []) { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; } for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; S.stats.time = 300; S.money = money || 0; resetWorld(); go('play');
  BANNER_Q.length = 0; FIRST_Q.length = 0; EDGE_Q.length = 0;
}
// every text drawn this frame stays on the screen (x from its alignment, 1 px of slack)
function onScreen(tag) {
  TQ.length = 0; try { render(); } catch (e) { errs.push(tag + ': render threw ' + (e && e.stack || e)); return; }
  for (const t of TQ) {
    const w = textW(t.s, t.size), x0 = t.align === 'left' ? t.x : t.align === 'right' ? t.x - w : t.x - w / 2;
    ok(x0 >= -1 && x0 + w <= W + 1, `${LANG} ${tag}: "${t.s}" runs off the screen (${x0.toFixed(0)}..${(x0 + w).toFixed(0)})`);
  }
}
const langs = ARGS && ARGS[0] ? [ARGS[0]] : ['en', 'ja', 'ko', 'es'];
for (const l of langs) {
  setLang(l); ok(LANG === l, 'setLang ' + l);
  const D = LANG_DATA[l] || {}, n = Object.keys(D).length;
  ok(n > 400, l + ': only ' + n + ' translations bundled');
  ok(!/[{}]/.test(L('第{0}天', 12)) && L('第{0}天', 12).includes('12'), l + ': template filled: ' + L('第{0}天', 12));
  ok(!/[\u4e00-\u9fff]/.test(L('{0} 鱼干', fmt(123456))) || l === 'ja', l + ': no Chinese left in ' + L('{0} 鱼干', fmt(123456)));
  // banners (the same rule as ui_check)
  setup(['room2', 'room3'], 60);
  const fits = (b, tag) => { const st = bannerParts(b); if (st) { const w = partsW(st.parts); ok(w + 16 <= W - 8, `${l} ${tag}: banner ${w.toFixed(0)} px too wide`); } };
  for (const u of UNLOCKS) fits({ kind: u.gate ? 'area' : u.id === 'statue' ? 'statue' : 'buy', id: u.id, star: !!u.star }, 'banner ' + u.id);
  for (const c of COMBOS) fits({ kind: 'combo', id: c.id }, 'combo ' + c.id);
  for (const r of RIVALS) if (r.id) fits({ kind: 'rank', id: r.id, rank: 10 }, 'rank ' + r.id);
  for (const id in STAFF_DEF) if (id !== 'owner') fits({ kind: 'level', id, lv: 5 }, 'level ' + id);
  for (let s = 0; s < 4; s++) { fits({ kind: 'season', id: s, y: 3 }, 'season ' + s); fits({ kind: 'fest', id: s }, 'fest ' + s); }
  fits({ kind: 'gold', id: 5 }, 'gold 5'); fits({ kind: 'day', id: 999, g: 9999, h: 9999, rec: true }, 'day'); fits({ kind: 'milestone', id: 5000 }, 'milestone'); fits({ kind: 'gift', id: 0 }, 'gift');
  // the info card: name · line, then the price
  for (const u of UNLOCKS) {
    const lx = 12 + (u.decor ? 29 : 20) + textW(u.name, 8) + 3 + textW('·', 7) + 3 + textW(u.card, 7), rx = 12 + 156 - 5 - 9 - textW(fmt(u.price), 7) - 1 - 10;
    ok(lx + 3 <= rx, `${l} info card ${u.id}: "${tr(u.name)} · ${tr(u.card)}" ends at ${lx.toFixed(0)}, price at ${rx.toFixed(0)}`);
  }
  // first-time cards
  for (const k of SEEN_KEYS) { const C = FIRST_CARD[k](), label = C.pop(), parts = C.map(p => Object.assign({ gap: 3 }, p)).concat([{ gap: 4 }, { t: label, z: 8 }]); ok(partsW(parts) <= 150, `${l} first card ${k}: ${partsW(parts).toFixed(0)} px`); }
  // speech bubbles: one line, inside the screen
  for (const id in LINES) { const t = LINES[id].text, s = typeof t === 'function' ? t(88) : t; ok(textW(s, 7) + 8 <= W - 4, `${l} line ${id}: "${tr(s)}" too long`); }
  // screens: title, play (HUD, a banner, a line, a card), the celebration, every menu page and tab
  setup(STAR4.concat(['maid4']), 123456); S.hearts = 2345; S.day = 123; S.stats.guests = 4567; S.earned = 1234567;
  S.album.vip = { kawa: 2, ozeki: 1 }; S.album.photos = [{ v: 'kawa', d: 3, h: null, p: null }]; S.gifts = ['kawa'];
  go('title'); st = 1; onScreen('title');
  go('play'); banner('buy', 'tea'); say(P, 'P01'); firstTime('decor'); for (let i = 0; i < 30; i++) update(DT); onScreen('play');
  go('celebrate'); st = 1; onScreen('celebrate');
  openMenu();
  for (const p of ['home', 'sound', 'book', 'bought', 'inn', 'dress']) { MENU.page = p; MENU.sel = null; for (let t = 0; t < BOOK_TABS.length; t++) { MENU.tab = t; DRESS.tab = t & 3; onScreen('menu ' + p + ' ' + t); } }
  MENU.page = 'inn'; MENU.sel = 'map'; onScreen('inn map'); MENU.sel = null; BOARD.rank = 1234; onScreen('inn with 1GP rank'); BOARD.rank = 0;
  closeMenu();
}
setLang('zh');
const u = [...new Set(errs)];
console.log(u.length ? 'I18N CHECK FAIL (' + u.length + ')\n  ' + u.slice(0, 60).join('\n  ') : 'I18N CHECK OK  ' + langs.join(' ') + ': banners, info cards, first cards, lines, title, HUD, menu pages fit');
if (u.length) process.exitCode = 1;
