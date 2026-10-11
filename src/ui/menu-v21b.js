// ============================================================ v2.1 core B: menu 「装扮」, album tabs, icons, banners, lines
// SPEC_v2 16.6 / 16.10 / 16.12. Hooks in menu.js (rows, pages, presses, book tabs, album count), cards.js
// (unlockIcon -> unlockIconB, the info card's rare silhouette, the preview, bannerParts -> bannerPartsB).
// ---- icons the art contract doesn't name (16.14 has none for these pads / menu rows): core-drawn, 10 x 10 + outline
const PADB_ROWS = {
  outfit: [['..WW..WW..', '.BBWWWWBB.', 'BBBBWWBBBB', 'BBBBWWBBBB', '.BBBRRBBB.', '..BBRRBB..', '..BBBBBB..', '..BBBBBB..', '..BBBBBB..', '..BBBBBB..'], { B: '#5a8ad8', W: '#f4ecd8', R: '#d84a3a' }],
  uniform: [['...WWWW...', '..PWWWWP..', '.PPPWWPPP.', 'PPPPWWPPPP', 'PP.PWWP.PP', '...PWWP...', '...WWWW...', '...WWWW...', '...PPPP...', '...P..P...'], { P: '#f4a8be', W: '#fbfaf4' }],
  shrine: [['RRRRRRRRRR', '.RRRRRRRR.', '..R....R..', '.RRRRRRRR.', '..R....R..', '..R....R..', '..R....R..', '..R....R..', '..R....R..', '.GG....GG.'], { R: '#d8442e', G: '#6a6a6a' }],
  offer: [['....YY....', '...YYYY...', '...YYYY...', '..YYYYYY..', '....BB....', '.WWWWWWWW.', '.WKKKKKKW.', '.WWWWWWWW.', '.WWWWWWWW.', '.WW....WW.'], { Y: '#ffd23f', B: '#3a2a20', W: '#b8844e', K: '#3a2a20' }],
  plaza: [['...KKKK...', '..RRRRRR..', '.RRWWWWRR.', 'RRRRRRRRRR', 'RRWWWWWWRR', 'RRRRRRRRRR', '.RRWWWWRR.', '..RRRRRR..', '...KKKK...', '....K.....'], { R: '#e8503a', W: '#ffd890', K: '#3a2a20' }],
  stall: [['RWRWRWRWRW', 'RWRWRWRWRW', 'RWRWRWRWRW', '.B......B.', '.B......B.', '.BYYYYYYB.', '.BBBBBBBB.', '.BBBBBBBB.', '.B......B.', '.B......B.'], { R: '#e8503a', W: '#fbfaf4', B: '#8a5a34', Y: '#ffd890' }],
  firework: [['....P.....', '.Y..P..Y..', '..Y.P.Y...', '...YPY....', 'PPPP.PPPP.', '...YPY....', '..Y.P.Y...', '.Y..P..Y..', '....P.....', '....S.....'], { P: '#ff9ab8', Y: '#ffd27a', S: '#c8a878' }],
  dress: [['....WW....', '...W..W...', '......W...', '.....W....', '..WWWWWW..', '.WWPPPPWW.', 'WWWPPPPWWW', '...PPPP...', '...PPPP...', '...PPPP...'], { W: '#ffffff', P: '#ffd8e8' }],
  map: [['WWWWWWWWWW', 'WGGWWWBBWW', 'WGGGWWBBWW', 'WWGGWWWWWW', 'WWWWWRWWWW', 'WWWWRRRWWW', 'WBBWWRWGGW', 'WBBWWWGGGW', 'WBBWWWWGGW', 'WWWWWWWWWW'], { W: '#fff3d0', G: '#7ac05a', B: '#5ab0e0', R: '#e04a3a' }],
  none: [['..KKKKKK..', '.K......K.', 'K......K.K', 'K.....K..K', 'K....K...K', 'K...K....K', 'K..K.....K', 'K.K......K', '.K......K.', '..KKKKKK..'], { K: '#a89a88' }],
};
const padIconB = k => art('core:padB:' + k, () => { const [rs, pal] = PADB_ROWS[k]; return rows(rs, pal); });
// a 12 x 12 pad icon from a 10 x 10 one (a garden piece, a gold piece: a gold glint in the corner)
const pad12 = (key, ic, gold) => art('core:pad12:' + key, () => { const c = mk(12, 12), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(ic, 1, 1); if (gold) { x.fillStyle = '#ffd23f'; x.fillRect(9, 0, 3, 1); x.fillRect(10, 0, 1, 3); x.fillRect(9, 1, 3, 1); x.fillStyle = '#fff6c0'; x.fillRect(10, 1, 1, 1); } return c; });
// padIcon / menuIcon get the v2.1 kinds (wrapped once: every caller - the pad, the HUD bar, the banner - sees them).
// The art's own icon wins whenever it has one: an unknown kind comes back as the art's fallback ('room' / 'play'), and
// only then is the core-drawn one used (the object art adds shrine offer plaza stall firework outfit uniform goldfish
// takoyaki ice shoot)
const STALL_KINDS = new Set(STALLS_B.map(s => s[3]));
{
  const p0 = padIcon;
  padIcon = function (kind) {
    const c = p0(kind); if (kind === 'room' || c !== p0('room')) return c;
    if (PADB_ROWS[kind]) return padIconB(kind);
    if (STALL_KINDS.has(kind)) return padIconB('stall');
    if (GZ_IDS.includes(kind)) return pad12(kind, gzIcon(kind));
    if (typeof kind === 'string' && kind.startsWith('gold:')) return pad12(kind, decorIcon(kind.slice(5), true), true);
    return c;
  };
  const m0 = menuIcon;
  menuIcon = function (kind) { const c = m0(kind); return (kind === 'dress' || kind === 'map') && c === m0('play') ? padIconB(kind) : c; };
}
// the icon of a v2.1 unlock (cards.js unlockIcon): the piece itself where there is one
function unlockIconB(u) {
  if (u.outfit) return outfitIcon(u.id);
  if (u.uniform) return uniformIcon(u.id);
  if (u.goldOf) return decorIcon(u.goldOf, true);
  if (u.gz) return gzIcon(u.id);
  return padIcon(u.icon);
}
// ---- faces (album, banners, the info card): a rare guest's face (the kittens: one kitten), its silhouette
const RFACE = new Map();
function rareFace(id) {
  let c = RFACE.get(id); if (c) return c;
  const r = RARE[id];
  if (r && r.kits) { c = mk(14, 13); const x = c.getContext('2d'); x.drawImage(kittenSprite('down', 0, r.kits[0]), 0, 0, 10, 10, 2, 1, 10, 10); }
  else c = faceOf(RARE_LOOK[id]);
  RFACE.set(id, c); return c;
}
// the info card of a garden piece (cards.js): the silhouette of the guest it may bring, "?" and when it comes
function infoRareB(u, x, cy) {
  const r = RARE[u.rare]; if (!r) return;
  const f = rareSeen(r.id) ? rareFace(r.id) : silOf(rareFace(r.id));
  g.drawImage(f, R(x), R(cy - 7)); x += 15;
  if (!rareSeen(r.id)) { txt('?', x, cy + .5, 7, '#ffe9a8', 'left'); x += 6; }
  if (r.when !== undefined) drawC(r.when === 'night' ? moonIcon() : seasonIcon(r.when), x + 4, cy);
}
// the preview on the info card (cards.js drawPreview): the next shrine hall
function drawPreviewB(u, gh) { shrinePreview(u, gh); }
// ---- banners (cards.js bannerParts falls through to here)
function bannerPartsB(b) {
  const dk = '#5a3a1a', NEW = { t: '新！', c: '#e04a3a', z: 8, gap: 3 };
  switch (b.kind) {
    case 'rare': { const r = RARE[b.id]; return r && { rim: '#ffc21f', parts: [{ img: rareFace(b.id), gap: 3 }, { t: r.name, c: dk, gap: 4 }, { t: '稀客来访！', c: '#c03a8a', z: 8 }] }; }
    case 'keep': { const r = RARE[b.id]; return r && { rim: '#ffc21f', rim2: '#a070e0', parts: [NEW, { img: keepsakeArt(r.keep), s: 2, gap: 3 }, { t: r.keepName + ' · 图鉴', c: dk }] }; }
    case 'shrine': return { rim: '#ffc21f', rim2: '#d8442e', parts: [{ img: padIcon('shrine'), gap: 3 }, { t: '金猫像落成！', c: dk, z: 8, gap: 3 }, { t: '收费+10%', c: '#c03a8a' }] };
    case 'fw': return { rim: '#e88ab0', rim2: '#ffd27a', parts: [{ img: padIcon('firework'), gap: 3 }, { t: '烟花大会！', c: '#c03a8a', z: 8 }] };
  }
  return null;
}
// ---- first-time picture cards (7.4) for the two new wishes; the lines (16.12 E11 + the innkeeper's three new ones)
FIRST_CARD.stay = () => [{ img: bubbleArt('stay', 0, true) }, { img: ARROW_R }, { img: faceOf(PLAYER_LOOK) }, '站着别动'];
FIRST_CARD.show = () => [{ img: bubbleArt('show', 0, true) }, { img: ARROW_R }, { img: PAWS }, { img: gzIcon((RARE[VIPG && VIPG.id] || RARES[4]).piece) }, '带去看看'];
RARES.forEach(r => { LINES[r.lineId] = { id: r.lineId, who: 'v', text: r.line, p: 1, ev: true }; });
[['P12', '新衣服！'], ['P13', '换新制服！'], ['P14', '放烟花啦！']].forEach(([id, text]) => { LINES[id] = { id, who: 'p', text, p: 1, ev: true }; });
BUY_POP.offer = '收费+1%';

// ============================================================ menu 「装扮」 (16.6): what you (and the staff) wear, one tap
const DRESS = { tab: 0 };
const DRESS_TABS = [['hat', '帽子'], ['outfit', '衣服'], ['uniform', '制服'], ['pet', '宠物']];
const dressItems = k => [null].concat(dressList(k));   // null = no hat / your own clothes / no pet
const DRESS_CELL = i => [26 + (i % 4) * 33, 140 + (i >> 2) * 33, 30, 30];
function dressIcon(k, id) {
  if (!id) return k === 'outfit' ? faceOf(PLAYER_LOOK) : k === 'uniform' ? faceOf(STAFF_DEF.recep.look) : padIconB('none');
  return k === 'hat' ? hatIcon(id) : k === 'outfit' ? outfitIcon(id) : k === 'uniform' ? uniformIcon(id) : petIcon(id);
}
const dressOwned = id => !id || !!S.unlocked[id];
function drawDressPage() {
  DRESS_TABS.forEach(([, lab], i) => {
    const x = 24 + i * 33, on = DRESS.tab === i;
    g.fillStyle = OUT; g.fillRect(x, 64, 31, 15); g.fillStyle = on ? '#f0a048' : '#c8a070'; g.fillRect(x + 1, 65, 29, 13);
    if (on) { g.fillStyle = '#ffc878'; g.fillRect(x + 2, 66, 27, 1); }
    txt(lab, x + 15.5, 71.5, 7, on ? '#ffffff' : '#5a3a1a', 'center', on ? OUT : null);
  });
  const k = DRESS_TABS[DRESS.tab][0];
  // the preview: you (2x) in what you wear, your pet beside you; on the uniform tab the receptionist in the team's uniform
  cell(24, 82, 132, 54, true);
  if (k === 'uniform') {
    const look = Object.assign({}, STAFF_DEF.recep.look, S.equip.uniform ? { uniform: uniformOf(S.equip.uniform) } : {});
    g.drawImage(catSprite('down', 0, look), 58, 86, 32, 48); g.drawImage(catSprite('down', 0, Object.assign({}, STAFF_DEF.maid1.look, S.equip.uniform ? { uniform: uniformOf(S.equip.uniform) } : {})), 92, 86, 32, 48);
  } else {
    g.drawImage(catSprite('down', 0, equipLook()), 74, 86, 32, 48);
    const pk = petOf(S.equip.pet); if (pk) { const c = petSprite(pk, 'down', pk === 'shiba' ? 3 : 0); g.drawImage(c, 110, 134 - c.height * 2, c.width * 2, c.height * 2); }
  }
  dressItems(k).forEach((id, i) => {
    const [x, y, w, h] = DRESS_CELL(i), own = dressOwned(id), on = (S.equip[k] || null) === id, ic = dressIcon(k, id), u = id && UNLOCK[id];
    cell(x, y, w, h, own);
    if (on) { g.fillStyle = '#ffc21f'; g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h); }
    const s = ic.width <= 12 ? 2 : 1, iw = ic.width * s, ih = ic.height * s;
    g.drawImage(own ? ic : silOf(ic), R(x + (w - iw) / 2), y + (own ? R((h - ih) / 2) : 2), iw, ih);
    if (!own) {
      if (u.ok && !u.ok() && u.season !== undefined) drawC(seasonIcon(u.season), x + w / 2, y + h - 6);   // out of season: when it comes back
      else { drawC(fishIcon(), x + 6, y + h - 6); txt(fmt(u.price), x + 11, y + h - 5.5, 7, '#8a3a1a', 'left', null); }
    }
  });
}
function dressPress(p) {
  for (let i = 0; i < 4; i++) if (inR(p, [24 + i * 33, 64, 31, 15])) { if (DRESS.tab !== i) { DRESS.tab = i; sfx('page'); } return; }
  const k = DRESS_TABS[DRESS.tab][0];
  dressItems(k).forEach((id, i) => {
    if (!inR(p, DRESS_CELL(i))) return;
    if (!dressOwned(id)) { SFX.click(); return; }
    if (wear(k, id)) sfx('tryon'); else SFX.click();
  });
}

// ============================================================ album tabs (16.10): 稀客 / 纪念 / 装扮
const BOOK_TABS_B = ['稀客', '纪念', '装扮'];
// rare guests: face (silhouette until its first photo), its keepsake, the visits, when it comes; the name under
function drawBookRare() {
  RARES.forEach((r, i) => {
    const x = 24 + (i & 1) * 67, y = 84 + (i >> 1) * 47, seen = rareSeen(r.id), f = rareFace(r.id), have = !!S.unlocked[r.piece];
    cell(x, y, 65, 45, seen);
    g.drawImage(seen ? f : silOf(f), x + 2, y + 2, 28, 26);
    if (seen) { g.drawImage(keepsakeArt(r.keep), x + 34, y + 3, 16, 16); txt('×' + S.rare[r.id], x + 54, y + 11.5, 7, '#8a3a1a', 'left', null); }
    else { g.drawImage(have ? gzIcon(r.piece) : silOf(gzIcon(r.piece)), x + 36, y + 6); txt('?', x + 50, y + 11.5, 8, '#8a7a68', 'left', null); }
    if (r.when !== undefined) drawC(r.when === 'night' ? moonIcon() : seasonIcon(r.when), x + 59, y + 24);
    txt(seen ? r.name : '？？？', x + 32.5, y + 38, 7, seen ? '#5a3a1a' : '#8a7a68', 'center', null);
  });
}
// keepsakes: the VIPs' gifts, the rare guests' keepsakes, then core A's trophies, magazine covers and festival medals
// (S.awards / S.covers / S.medals: read as lists of kinds; 16.3 / 16.4 / 16.2)
const listOf = v => Array.isArray(v) ? v : [];
const kindOf = x => x && typeof x === 'object' ? (x.k !== undefined ? x.k : x.kind !== undefined ? x.kind : x.season !== undefined ? x.season : x.s !== undefined ? x.s : 0) : x;
function drawBookKeep() {
  const row = (y, label, items, n, draw) => {
    cell(24, y, 132, 34, items.length > 0);
    txt(label, 28, y + 7.5, 7, '#8a3a1a', 'left', null);
    for (let i = 0; i < n; i++) {
      const x = 28 + i * 16, it = items[i];
      if (it === undefined) { g.fillStyle = '#e0d4b8'; g.fillRect(x + 2, y + 17, 12, 12); continue; }
      draw(it, x + 8, y + 23);
    }
  };
  const big = (c, x, y) => g.drawImage(c, R(x - c.width), R(y - c.height), c.width * 2, c.height * 2);
  row(84, '贵宾', S.gifts.map(id => VIP[id].gift), 6, (k, x, y) => big(giftArt(k), x, y));
  row(121, '稀客', RARES.filter(r => rareSeen(r.id)).map(r => r.keep), 8, (k, x, y) => big(keepsakeArt(k), x, y));
  row(158, '奖杯', listOf(S.awards).slice(-8).map(kindOf), 8, (k, x, y) => drawC(trophyArt(k), x, y));
  row(195, '封面', listOf(S.covers).slice(-8).map(kindOf), 8, (k, x, y) => drawC(coverArt(k), x, y));
  row(232, '奖章', listOf(S.medals).slice(-8).map(kindOf), 8, (k, x, y) => drawC(medalArt(k), x, y));
}
// everything you can wear: owned in colour, the rest as silhouettes
function drawBookDress() {
  DRESS_TABS.forEach(([k, lab], j) => {
    const y = 84 + j * 47, L = dressList(k);
    cell(24, y, 132, 45, L.some(id => S.unlocked[id]));
    txt(lab, 28, y + 8.5, 7, '#8a3a1a', 'left', null);
    txt(L.filter(id => S.unlocked[id]).length + '/' + L.length, 152, y + 8.5, 7, '#8a3a1a', 'right', null);
    L.forEach((id, i) => { const ic = dressIcon(k, id), x = 28 + i * 16, own = !!S.unlocked[id]; g.drawImage(own ? ic : silOf(ic), x + 3 - (ic.width - 10) / 2 | 0, y + 22); });
  });
}
// the album's count (menu.js albumCount): + the rare guests met and the pieces you can wear
function albumCountB() {
  const dress = DRESS_KINDS.reduce((a, k) => a.concat(dressList(k)), []);
  return { n: RARES.filter(r => rareSeen(r.id)).length + dress.filter(id => S.unlocked[id]).length, m: RARES.length + dress.length };
}

// ============================================================ the inn page's map (16.10): a button opens it
const INN_MAP_BTN = [118, 46, 40, 16];
function drawInnMapPage() {
  cell(24, 64, 132, 196, true);
  drawMiniMap(30, 70);
  // the legend (icons, no words): a dirty room, a guest asleep, you
  const ly = 190;
  g.fillStyle = OUT; g.fillRect(34, ly - 3, 7, 7); g.fillStyle = '#e04a3a'; g.fillRect(35, ly - 2, 5, 5); drawC(broomIcon(), 49, ly);
  g.fillStyle = OUT; g.fillRect(64, ly - 3, 7, 7); g.fillStyle = '#ffc84a'; g.fillRect(65, ly - 2, 5, 5); drawC(bubbleArt('zzz', 0), 81, ly - 1);
  g.fillStyle = OUT; g.fillRect(98, ly - 3, 7, 7); g.fillStyle = '#ffffff'; g.fillRect(99, ly - 2, 5, 5); g.drawImage(faceOf(PLAYER_LOOK), 108, ly - 7);
  g.fillStyle = OUT; g.fillRect(128, ly - 3, 7, 7); g.fillStyle = '#ffd23f'; g.fillRect(129, ly - 2, 5, 5); drawC(starIcon(true, true), 142, ly);
  // the areas still shut: their star / their price, under the map
  let x = 30; const yy = 212;
  for (const a of AREAS) {
    if (!a.open || areaOpen(a) || !UNLOCK[a.open]) continue;
    const u = UNLOCK[a.open], lab = a.n ? String(a.n) : fmt(u.price);
    drawC(unlockIcon(u), x + 6, yy); x += 13;
    if (a.n) { drawC(starIcon(true), x + 3, yy); x += 8; } else { drawC(fishIcon(), x + 4, yy); x += 9; }
    txt(lab, x, yy + .5, 7, '#8a3a1a', 'left', null);
    x += textW(lab, 7) + 6; if (x > 130) break;
  }
}
BOOK_TABS.push(...BOOK_TABS_B);
RARES.forEach(r => { VIP_LOOK[r.id] = RARE_LOOK[r.id]; });   // a rare guest's photo (menu.js photoCanvas) in its own look
