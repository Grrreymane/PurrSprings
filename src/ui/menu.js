// ---- 7.5 the menu (state 'menu'): the game pauses (gameUpdate doesn't run: guests, the clock, the kitchen all wait; T and
// the UI keep going; the music drops to half behind it). Pages: home, sound, book (the album, 4 tabs), bought, inn.
const MENU = { page: 'home', tab: 0, pg: 0, sel: null };
const MENU_HIT = [134, 0, 46, 18], MPANEL = [16, 40, 148, 240], MBACK = [22, 46, 44, 16];
// v2.1 core B: + 装扮 (16.6, ui/menu-v21b.js); six rows 28 px apart, sound last
const MENU_ROWS = [['play', '继续', 'orange', 70, null], ['dress', '装扮', 'wood', 98, 'dress'], ['book', '图鉴', 'wood', 126, 'book'], ['bag', '已购', 'wood', 154, 'bought'], ['house', '旅馆', 'wood', 182, 'inn'], ['sound', '声音', 'wood', 210, 'sound']];
const SOUND_ROWS = [['music', '音乐', 76], ['sfx', '音效', 104], ['talk', '台词', 132]];
const BOOK_TABS = ['贵宾', '组合', '客人', '伙伴'];   // v2.1: + 稀客 纪念 装扮 (menu-v21b.js pushes them)
const bookTabW = () => BOOK_TABS.length > 4 ? 19 : 33;
function toggleSound() { const on = !(musicOn || sfxOn); setMusicOn(on); setSfxOn(on); }
function openMenu() { if (state !== 'play') return; go('menu'); Object.assign(MENU, { page: 'home', sel: null }); hold = false; sfx('menu'); }
function closeMenu() { if (state === 'menu') go('play'); }
function menuBack() { SFX.click(); if (MENU.sel) MENU.sel = null; else if (MENU.page !== 'home') MENU.page = 'home'; else closeMenu(); }
function menuGo(page) { SFX.click(); sfx('page'); Object.assign(MENU, { page, pg: 0, sel: null }); }
function menuPress(p) {
  if (!inR(p, MPANEL)) { menuBack(); return; }                 // outside the panel = back one level
  if (MENU.page !== 'home' && inR(p, MBACK)) { menuBack(); return; }
  const pg = MENU.page;
  if (pg === 'home') { for (const [, , , y, to] of MENU_ROWS) if (inR(p, [32, y, 116, 24])) { if (to) menuGo(to); else { SFX.click(); closeMenu(); } } return; }
  if (pg === 'sound') {
    for (const [k, , y] of SOUND_ROWS) if (inR(p, [26, y, 128, 24])) {
      if (k === 'music') setMusicOn(!musicOn); else if (k === 'sfx') setSfxOn(!sfxOn); else { S.opts.lines = !S.opts.lines; LINE = LINE_NEXT = null; markDirty(); }
      SFX.click();
    }
    return;
  }
  if (pg === 'dress') { dressPress(p); return; }   // v2.1 (menu-v21b.js)
  if (pg === 'book') {
    if (MENU.sel) { MENU.sel = null; SFX.click(); return; }
    for (let i = 0; i < BOOK_TABS.length; i++) if (inR(p, [24 + i * bookTabW(), 64, bookTabW() - 2, 15])) { if (MENU.tab !== i) { MENU.tab = i; MENU.pg = 0; sfx('page'); } return; }   // v2.1: 7 tabs (menu-v21b.js)
    if (MENU.tab === 1) { const pages = Math.ceil(COMBOS.length / 6); if (inR(p, PG_PREV) && MENU.pg > 0) { MENU.pg--; sfx('page'); } if (inR(p, PG_NEXT) && MENU.pg < pages - 1) { MENU.pg++; sfx('page'); } return; }   // v2.1: 12 combos, 6 a page
    if (MENU.tab === 0) VIPS.forEach((v, i) => { if ((S.album.vip[v.id] | 0) > 0 && inR(p, [24 + (i % 3) * 45, 84 + (i / 3 | 0) * 94, 44, 90])) { MENU.sel = v.id; SFX.click(); } });
    return;
  }
  if (pg === 'bought') {
    const n = boughtList().length, pages = Math.max(1, Math.ceil(n / 12));
    if (inR(p, PG_PREV) && MENU.pg > 0) { MENU.pg--; sfx('page'); }
    if (inR(p, PG_NEXT) && MENU.pg < pages - 1) { MENU.pg++; sfx('page'); }
    return;
  }
  if (pg === 'inn' && !MENU.sel && inR(p, INN_MAP_BTN)) { SFX.click(); sfx('page'); MENU.sel = 'map'; return; }   // v2.1: the map (16.10)
  if (pg === 'inn' && !MENU.sel && inR(p, [50, 246, 80, 22])) { SFX.click(); makeShare(); }
}
const boughtList = () => Object.keys(S.unlocked).filter(id => UNLOCK[id] && id !== 'room1').reverse();   // newest first (keys keep the buying order)
// album counts (7.6): VIPs 6, combos 6, guests 9 furs + 3 types, the 10 staff + the shop owner = 35
const ALBUM_FURS = Object.keys(FURS).filter(k => k !== 'orange');
const ALBUM_TYPES = ['elder', 'couple', 'family'];
const ALBUM_LOOK = NUL();
ALBUM_FURS.forEach(f => { ALBUM_LOOK[f] = { fur: f, outfit: 'guest', shirt: '#5a9ae0' }; });
Object.assign(ALBUM_LOOK, { elder: { fur: 'gray', outfit: 'haori', acc: 'cane' }, couple: { fur: 'cream', outfit: 'guest', shirt: '#e08ac0', hat: 'flower' }, family: { fur: 'tabby', outfit: 'guest', shirt: '#6ac06a' } });
const STAFF_IDS = Object.keys(STAFF_DEF);   // recep maid1-4 porter chef waiter1-2 clerk owner
function albumCount() {
  const v = VIPS.filter(x => (S.album.vip[x.id] | 0) > 0).length, c = COMBOS.filter(x => S.combos[x.id]).length;
  const gs = ALBUM_FURS.filter(f => S.album.furs[f]).length + ALBUM_TYPES.filter(t => S.album.types[t]).length;
  const st = STAFF_IDS.filter(id => S.unlocked[STAFF_DEF[id].need]).length;
  const b = albumCountB();   // v2.1: rare guests + what you can wear
  return { n: v + c + gs + st + b.n, m: VIPS.length + COMBOS.length + ALBUM_FURS.length + ALBUM_TYPES.length + STAFF_IDS.length + b.m };
}
const MBTN_COL = { orange: BTN_COL.orange, blue: BTN_COL.blue, wood: ['#6a4426', '#a8784a', '#d8a870'], dim: ['#5a5a64', '#8a8a94', '#a8a8b0'] };
function menuBtn(r, icon, label, col, size) {
  const [x, y, w, h] = r, c = MBTN_COL[col] || MBTN_COL.wood;
  g.fillStyle = OUT; g.fillRect(x, y, w, h); g.fillStyle = c[0]; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = c[1]; g.fillRect(x + 1, y + 1, w - 2, h - 4); g.fillStyle = c[2]; g.fillRect(x + 2, y + 2, w - 4, 1);
  const z = size || (h >= 20 ? 11 : 7), lw = textW(label, z), iw = icon ? 12 + 4 : 0, x0 = R(x + (w - iw - lw) / 2);
  if (icon) drawC(icon, x0 + 6, y + h / 2 - 1);
  if (label) txt(label, x0 + iw, y + h / 2 - 1, z, '#ffffff', 'left', OUT);
}
function drawMenu() {
  g.fillStyle = 'rgba(12,8,28,.6)'; g.fillRect(0, 0, W, H);
  panel(16, 40, 148, 240);
  const pg = MENU.page, title = { home: '菜单', sound: '声音', book: '图鉴', bought: '已购', inn: MENU.sel === 'map' ? '地图' : '旅馆', dress: '装扮' }[pg];
  txt(title, 90, 56, pg === 'home' ? 13 : 11, '#8a3a1a', 'center', null);
  if (pg !== 'home') menuBtn(MBACK, menuIcon('back'), '返回', 'wood', 7);
  if (pg === 'home') { for (const [ic, lab, col, y] of MENU_ROWS) menuBtn([32, y, 116, 24], menuIcon(ic), lab, col); drawMenuFoot(); }
  else if (pg === 'sound') drawSoundPage();
  else if (pg === 'book') drawBookPage();
  else if (pg === 'bought') drawBoughtPage();
  else if (pg === 'inn') { if (MENU.sel === 'map') drawInnMapPage(); else { drawInnPage(); menuBtn(INN_MAP_BTN, menuIcon('map'), '地图', 'wood', 7); } }   // v2.1: the map
  else if (pg === 'dress') drawDressPage();
}
// under the home buttons: the day, your stars (gold ones too) and hearts - one glance, no words
function drawMenuFoot() {
  for (let i = 0; i < 5; i++) drawC(starIcon(i < star(), i < goldStars()), 62 + i * 9, 246);
  drawC(heartIcon(), 64, 260); txt(String(S.hearts), 70, 260.5, 7, '#8a3a1a', 'left', null);
  drawC(menuIcon('day'), 104, 260); txt(String(S.day), 112, 260.5, 7, '#8a3a1a', 'left', null);
}
function drawSoundPage() {
  for (const [k, lab, y] of SOUND_ROWS) {
    const on = k === 'music' ? musicOn : k === 'sfx' ? sfxOn : S.opts.lines;
    g.fillStyle = '#e8cf98'; g.fillRect(26, y, 128, 24); g.fillStyle = '#f6e3b4'; g.fillRect(27, y + 1, 126, 22);
    g.fillStyle = '#8a5a34'; g.fillRect(28, y + 4, 16, 16); drawC(menuIcon(k), 36, y + 12);
    txt(lab, 50, y + 12, 11, '#6a4a2a', 'left', null);
    drawC(toggleArt(on), 136, y + 12);
  }
}
function drawBookPage() {
  const { n, m } = albumCount();
  txt(n + '/' + m, 158, 56.5, 7, '#8a3a1a', 'right', null);
  const tw = bookTabW();   // v2.1: seven tabs, 19 px each
  BOOK_TABS.forEach((lab, i) => {
    const x = 24 + i * tw, on = MENU.tab === i;
    g.fillStyle = OUT; g.fillRect(x, 64, tw - 2, 15); g.fillStyle = on ? '#f0a048' : '#c8a070'; g.fillRect(x + 1, 65, tw - 4, 13);
    if (on) { g.fillStyle = '#ffc878'; g.fillRect(x + 2, 66, tw - 6, 1); }
    txt(lab, x + (tw - 2) / 2, 71.5, 7, on ? '#ffffff' : '#5a3a1a', 'center', on ? OUT : null);
  });
  if (MENU.sel) { drawVipPhoto(MENU.sel); return; }
  [drawBookVip, drawBookCombo, drawBookGuest, drawBookStaff, drawBookRare, drawBookKeep, drawBookDress][MENU.tab]();
}
function cell(x, y, w, h, on) { g.fillStyle = on ? '#c89a5a' : '#c8b898'; g.fillRect(x, y, w, h); g.fillStyle = on ? '#fff8e4' : '#e8dcc0'; g.fillRect(x + 1, y + 1, w - 2, h - 2); }
function drawBookVip() {
  VIPS.forEach((v, i) => {
    const x = 24 + (i % 3) * 45, y = 84 + (i / 3 | 0) * 94, seen = (S.album.vip[v.id] | 0) > 0, f = faceOf(VIP_LOOK[v.id]);
    cell(x, y, 44, 90, seen);
    g.drawImage(seen ? f : silOf(f), x + 1, y + 6, 42, 39);
    if (!seen) { txt('?', x + 22, y + 26, 13, '#ffffff', 'center'); return; }
    txt(v.name, x + 22, y + 54, 7, '#5a3a1a', 'center', null);
    txt('×' + S.album.vip[v.id], x + 22, y + 66, 7, '#8a3a1a', 'center', null);
    if (S.gifts.includes(v.id)) drawC(giftArt(v.gift), x + 22, y + 79);
    else if (S.album.photos.some(p => p.v === v.id)) drawC(menuIcon('camera'), x + 22, y + 79);
  });
}
// a photo with a VIP (7.6), redrawn from data: the VIP, the innkeeper in the hat of that day, the pet; 40 x 46 polaroid
const PHOTOS = new Map();
function photoCanvas(p) {
  const key = p.v + ':' + p.h + ':' + p.p + ':' + (p.o || ''); let c = PHOTOS.get(key); if (c) return c;
  c = mk(40, 46); const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = OUT; x.fillRect(0, 0, 40, 46); x.fillStyle = '#fbfbf6'; x.fillRect(1, 1, 38, 44);
  x.fillStyle = '#bfe3f0'; x.fillRect(3, 3, 34, 22); x.fillStyle = '#d8f0f8'; x.fillRect(3, 3, 34, 4);
  x.fillStyle = '#9ccf7a'; x.fillRect(3, 25, 34, 10); x.fillStyle = '#86bc66'; x.fillRect(3, 25, 34, 1);
  x.save(); x.beginPath(); x.rect(3, 3, 34, 32); x.clip();
  x.drawImage(catSprite('down', 0, VIP_LOOK[p.v]), 4, 9);
  x.drawImage(catSprite('down', 0, lookWith(hatOf(p.h), outfitOf(p.o))), 19, 9);   // v2.1: + the outfit of that day
  const pk = petOf(p.p); if (pk) { const pc = petSprite(pk, 'down', pk === 'shiba' ? 3 : 0); x.drawImage(pc, 37 - pc.width, 35 - pc.height); }
  x.restore();
  PHOTOS.set(key, c); return c;
}
function drawVipPhoto(id) {
  const v = VIP[id], ph = S.album.photos.filter(p => p.v === id).pop();
  cell(30, 84, 120, 182, true);
  if (ph) { g.drawImage(photoCanvas(ph), 50, 92, 80, 92); txt('第' + ph.d + '天', 90, 196, 8, '#5a3a1a', 'center', null); }
  else { g.drawImage(faceOf(VIP_LOOK[id]), 69, 100, 42, 39); drawC(menuIcon('camera'), 90, 160); txt('?', 99, 156, 8, '#8a3a1a', 'left', null); }
  txt(v.name, 90, 212, 9, '#8a3a1a', 'center', null);
  if (S.gifts.includes(id)) { const gi = giftArt(v.gift); g.drawImage(gi, 82, 222, 16, 16); }
  txt('×' + (S.album.vip[id] | 0), 90, 250, 7, '#8a3a1a', 'center', null);
}
function drawBookCombo() {   // v2.1: 12 combos, 6 a page (the seasonal ones show their season's icon)
  const pages = Math.ceil(COMBOS.length / 6); MENU.pg = clamp(MENU.pg, 0, pages - 1);
  COMBOS.slice(MENU.pg * 6, MENU.pg * 6 + 6).forEach((c, i) => {
    const y = 82 + i * 27, found = !!S.combos[c.id], ownA = !!S.unlocked[c.a], ownB = !!S.unlocked[c.b];
    cell(24, y, 132, 25, found);
    if (found) { g.fillStyle = OUT; g.fillRect(29, y + 5, 15, 15); g.fillStyle = c.col; g.fillRect(30, y + 6, 13, 13); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(30, y + 6, 13, 1); txt(c.plate, 36.5, y + 12.5, 8, '#ffffff'); }
    else if (!hinted(c)) { drawC(menuIcon('lock'), 36, y + 12); txt('？？？', 52, y + 12.5, 8, '#8a7a68', 'left', null); return; }
    else { g.fillStyle = '#b0a088'; g.fillRect(30, y + 6, 13, 13); txt('?', 36.5, y + 12.5, 8, '#ffffff'); }
    const slot = (own, id, x) => { if (own) { g.globalAlpha = found ? 1 : .45; drawC(decorIcon(id), x, y + 12); g.globalAlpha = 1; } else { g.fillStyle = '#d8c8a8'; g.fillRect(x - 5, y + 7, 10, 10); txt('?', x, y + 12.5, 7, '#8a7a68', 'center', null); } };
    slot(ownA, c.a, 55); txt('+', 63, y + 12.5, 7, '#8a7a68', 'center', null); slot(ownB, c.b, 71);
    if (c.season !== undefined) drawC(seasonIcon(c.season), 125, y + 12);
    if (found) {
      txt(c.name, 82, y + 12.5, 8, '#5a3a1a', 'left', null);
      const n = GUEST_ROOMS.filter(rm => roomOpen(rm) && roomCombo(rm) === c).length;
      drawC(padIcon('room'), 139, y + 12); txt(String(n), 146, y + 12.5, 7, '#8a3a1a', 'left', null);
    }
  });
  if (pages > 1) {
    menuBtn(PG_PREV, menuIcon('prev'), '上页', MENU.pg > 0 ? 'wood' : 'dim', 7);
    menuBtn(PG_NEXT, menuIcon('next'), '下页', MENU.pg < pages - 1 ? 'wood' : 'dim', 7);
    txt((MENU.pg + 1) + '/' + pages, 90, 263, 8, '#8a3a1a', 'center', null);
  }
}
function drawBookGuest() {
  const L = ALBUM_FURS.map(f => [ALBUM_LOOK[f], !!S.album.furs[f], null]).concat(ALBUM_TYPES.map(t => [ALBUM_LOOK[t], !!S.album.types[t], t]));
  L.forEach(([look, seen, t], i) => {
    const x = 26 + (i % 4) * 33, y = 84 + (i / 4 | 0) * 62, f = faceOf(look), fy = y + (t || !seen ? 8 : 16);   // a fur alone: face in the middle
    cell(x, y, 31, 58, seen);
    g.drawImage(seen ? f : silOf(f), x + 1, fy, 28, 26);
    if (t === 'family') { const k = kittenSprite('down', 0, look.fur); g.globalAlpha = seen ? 1 : 0; g.drawImage(k, x + 20, y + 24); g.globalAlpha = 1; }
    if (t === 'couple' && seen) drawC(heartIcon(), x + 25, y + 10);
    if (t) txt({ elder: '老人', couple: '情侣', family: '一家' }[t], x + 15.5, y + 46, 7, seen ? '#5a3a1a' : '#8a7a68', 'center', null);
    else if (!seen) txt('?', x + 15.5, y + 46, 8, '#8a7a68', 'center', null);
  });
}
function drawBookStaff() {
  STAFF_IDS.forEach((id, i) => {
    const d = STAFF_DEF[id], x = 24 + (i % 3) * 45, y = 84 + (i / 3 | 0) * 47, hired = !!S.unlocked[d.need];
    const s = STAFF.find(q => q.id === id), f = faceOf(s ? staffLook(s) : d.look);
    cell(x, y, 44, 45, hired);
    g.drawImage(hired ? f : silOf(f), x + 8, y + 3, 28, 26);
    if (!hired) { const u = UNLOCK[d.need]; drawC(fishIcon(), x + 9, y + 37); txt(fmt(u.price), x + 15, y + 37.5, 7, '#8a3a1a', 'left', null); return; }
    txt(d.name, x + 22, y + 34, 7, '#5a3a1a', 'center', null);
    if (d.role === 'owner') return;
    const lv = lvOf(S.staff[id] | 0), xp = S.staff[id] | 0, f0 = LV_XP[lv - 1] || 0, f1 = LV_XP[lv] || xp, fr = lv >= 5 ? 1 : clamp((xp - f0) / Math.max(1, f1 - f0), 0, 1);
    g.fillStyle = OUT; g.fillRect(x + 4, y + 40, 36, 3); g.fillStyle = '#e8dcc0'; g.fillRect(x + 5, y + 41, 34, 1); g.fillStyle = lv >= 5 ? '#ffd23f' : '#7ac05a'; g.fillRect(x + 5, y + 41, Math.max(1, R(34 * fr)), 1);
    g.fillStyle = OUT; g.fillRect(x + 31, y + 2, 12, 9); g.fillStyle = lv >= 5 ? '#ffd23f' : lv >= 3 ? '#d8e0ec' : '#c8955a'; g.fillRect(x + 32, y + 3, 10, 7);
    txt(String(lv), x + 37, y + 6.5, 7, OUT, 'center', null);
  });
}
const PG_PREV = [24, 254, 44, 18], PG_NEXT = [112, 254, 44, 18];   // the bought list's page buttons (icon + 2 chars)
function drawBoughtPage() {
  const L = boughtList(), pages = Math.max(1, Math.ceil(L.length / 12)); MENU.pg = clamp(MENU.pg, 0, pages - 1);
  if (!L.length) { drawC(menuIcon('bag'), 90, 150); txt('…', 90, 168, 9, '#8a7a68', 'center', null); }
  L.slice(MENU.pg * 12, MENU.pg * 12 + 12).forEach((id, i) => {
    const u = UNLOCK[id], x = 24 + (i & 1) * 67, y = 70 + (i >> 1) * 30;
    cell(x, y, 65, 28, true);
    drawC(unlockIcon(u), x + 9, y + 8);
    txt(u.name, x + 17, y + 8.5, 7, '#8a3a1a', 'left', null);
    txt(u.card, x + 3, y + 21, 7, '#5a3a1a', 'left', null);
  });
  if (pages > 1) {
    menuBtn(PG_PREV, menuIcon('prev'), '上页', MENU.pg > 0 ? 'wood' : 'dim', 7);
    menuBtn(PG_NEXT, menuIcon('next'), '下页', MENU.pg < pages - 1 ? 'wood' : 'dim', 7);
    txt((MENU.pg + 1) + '/' + pages, 90, 263, 8, '#8a3a1a', 'center', null);
  }
}
function drawInnPage() {
  const c = S.clock, day = c >= .08 && c < .72;
  const items = [[menuIcon('day'), '第' + S.day + '天', day ? sunIcon() : moonIcon()], [menuIcon('cat'), S.stats.guests + '位'], [fishIcon(), fmt(S.earned)], [padIcon('room'), guestRoomsOpen() + '/' + GUEST_ROOMS.length],
    [heartIcon(), String(S.hearts)], [trophyIcon(), '#' + rankOf(S.hearts)], [starIcon(true, true), String(goldStars())], [menuIcon('chart'), String(Math.max(S.dayLog.best, S.dayLog.g))]];
  items.forEach(([ic, s, ex], i) => {
    const x = 26 + (i & 1) * 68, y = 72 + (i >> 1) * 13;
    drawC(ic, x + 6, y); txt(s, x + 14, y + .5, 8, '#5a3a1a', 'left', null);
    if (ex) drawC(ex, x + 16 + textW(s, 8) + 3, y);
  });
  g.fillStyle = '#c89a5a'; g.fillRect(24, 121, 132, 1);
  // the rank board: the nine rival inns + you, by hearts (passed rivals in grey)
  const rows = RIVALS.filter(r => r.id).map(r => ({ id: r.id, name: r.name, h: r.h })).concat([{ id: 'me', name: '我的旅馆', h: S.hearts, me: true }]);
  rows.sort((a, b) => b.h - a.h || (a.me ? -1 : b.me ? 1 : 0));
  rows.forEach((r, i) => {
    const y = 125 + i * 11, passed = !r.me && S.hearts >= r.h, col = r.me ? '#8a3a1a' : passed ? '#a89a88' : '#5a3a1a';
    if (r.me) { g.fillStyle = '#ffd88a'; g.fillRect(24, y, 132, 10); g.fillStyle = '#ffe9b0'; g.fillRect(24, y, 132, 1); }
    txt(String(i + 1), 31, y + 5.5, 7, col, 'center', null);
    drawC(rankBadge(r.id), 42, y + 5);
    txt(r.name, 49, y + 5.5, 7, col, 'left', null);
    txt(String(r.h), 146, y + 5.5, 7, col, 'right', null); drawC(heartIcon(), 151, y + 5);
  });
  menuBtn([50, 246, 80, 22], menuIcon('camera'), '分享', 'blue');   // the share card, any time (G2)
}
