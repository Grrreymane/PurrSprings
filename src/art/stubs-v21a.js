// ------------------------------------------------------------ v2.1 placeholders, core A (SPEC_v2 16.14)
// Flat stand-ins for the v2.1 art core A uses, with the sizes and anchors of 16.14. Function declarations ONLY: the
// real art (src/art/env*.js, objects*.js, chars*.js) declares the same names later in the script and wins. After the
// art merge delete the ones the art blocks provide. Existing functions that gain an argument in v2.1 need no stub:
// tileArt(ch, tx, ty, nb, season), treeArt(kind, season, size), decorArt(id, frame, gold) / decorIcon(id) (an unknown
// decor id draws d_scroll until the art lands), wallDecorArt('trophy' | 'cover' | 'family') (an unknown kind = blank).
function _sAH(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
// a w x h box with a 1 px outline, an optional inner box (o.inset) and a few dots (o.dots + o.at)
function _sABox(key, w, h, col, o) {
  return art('sA:' + key, () => {
    o = o || {};
    const c = mk(w, h), x = c.getContext('2d'), [bx, by, bw, bh] = o.inset || [0, 0, w, h];
    x.fillStyle = OUT; x.fillRect(bx, by, bw, bh);
    x.fillStyle = col; x.fillRect(bx + 1, by + 1, Math.max(0, bw - 2), Math.max(0, bh - 2));
    x.clearRect(bx, by, 1, 1); x.clearRect(bx + bw - 1, by, 1, 1); x.clearRect(bx, by + bh - 1, 1, 1); x.clearRect(bx + bw - 1, by + bh - 1, 1, 1);
    if (o.dots) { x.fillStyle = o.dots; for (const [px, py] of o.at || []) x.fillRect(bx + px, by + py, 1, 1); }
    return c;
  });
}
// 7x7 season icon, centre anchor: 0 spring (blossom) 1 summer (sun) 2 autumn (leaf) 3 winter (snowflake)
function seasonIcon(s) {
  s = (s | 0) & 3;
  const P = [['.X.X.', 'XXoXX', '.XXX.', 'X.X.X'], ['X.X.X', '.XXX.', 'XXoXX', '.XXX.', 'X.X.X'], ['..XX.', '.XXX.', 'XXoX.', '.X...', 'X....'], ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', 'X.X.X']][s];
  return art('sA:season:' + s, () => rows(P, { X: ['#f49ab8', '#ffc83a', '#e0702a', '#cfe6ff'][s], o: ['#ffe6ee', '#fff6c0', '#ffc070', '#ffffff'][s] }));
}
// 5x7 paper lantern for the festival progress (HUD row 2): on = lit warm, off = dark
function lanternIcon(on) { return art('sA:lantern:' + (on ? 1 : 0), () => rows(['.D.', 'RRR', 'RLR', 'RRR', '.D.'], on ? { D: '#3a2418', R: '#e8503a', L: '#ffe08a' } : { D: '#3a2418', R: '#6a4a52', L: '#7a5a62' })); }
// 12x14 trophy for the lobby wall / the year report, anchor bottom-centre (6,14): gold silver bronze pop effort (or 0-4)
function trophyArt(k) {
  const col = { gold: '#ffd23f', silver: '#d8e0ec', bronze: '#d08a4a', pop: '#f08ab0', effort: '#9ac0e0' }[k] || '#c8b898';
  return _sABox('trophy:' + k, 12, 14, col, { inset: [1, 0, 10, 14], dots: '#ffffff', at: [[2, 2], [3, 2], [2, 3]] });
}
// 10x12 magazine cover / TV still for the lobby wall, the press card and the HUD's "popular" icon: stars 1-5, tv, season
function coverArt(stars, tv, season) { return _sABox('cover:' + (stars | 0) + (tv ? 't' : 'm'), 10, 12, tv ? '#5a8ac8' : '#f0e0c0', { dots: '#c83a3a', at: Array.from({ length: clamp(stars | 0, 1, 5) }, (_, i) => [2 + i, 2]) }); }
// 9x9 festival medal, centre anchor, one per season
function medalArt(season) { return _sABox('medal:' + (season | 0), 9, 9, ['#f49ab8', '#7ad0ff', '#e0702a', '#cfe6ff'][(season | 0) & 3], { dots: '#ffd23f', at: [[3, 3], [4, 3], [3, 4], [4, 4]] }); }
// the scenery art's season plumbing: build the next season's tiles ahead of sunrise (true = done); a prop with snow on top
function seasonWarm(s) { return true; }
function snowCapArt(c) { return c; }
// 32x10 string of festival lanterns, tiles across (the core repeats it along the lobby wall and over the door); lit = at night
function chochinString(lit) {
  return art('sA:chochin', () => {
    const c = mk(32, 10), x = c.getContext('2d');
    x.fillStyle = '#3a2418'; for (let i = 0; i < 32; i++) x.fillRect(i, 1 + R(Math.sin(i / 32 * Math.PI) * 2), 1, 1);
    for (const lx of [3, 13, 23]) { x.fillStyle = OUT; x.fillRect(lx, 3, 6, 7); x.fillStyle = '#e8503a'; x.fillRect(lx + 1, 4, 4, 5); x.fillStyle = '#ffe08a'; x.fillRect(lx + 2, 5, 2, 3); }
    return c;
  });
}
