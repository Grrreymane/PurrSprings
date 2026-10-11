// ============================================================ ART placeholders, v2.1 core B (SPEC_v2 16.14)
// Function declarations only: the real art (src/art/chars*.js, env*.js, objects*.js) declares the same names later in
// the script, and the later declaration wins. Names and sizes follow 16.14; where 16.14 leaves a name open (the garden
// decor), the core picked one - see the v2.1 core B report. Rough shapes only, no Math.random, ASCII only.
// outfitIcon(id) / uniformIcon(id): 10x10 shop / album icons, centre anchor (id = unlock id o_yukata ... / u_sakura ...)
function outfitIcon(id) {
  const col = { o_yukata: '#6a9ae0', o_chef: '#f4f0e6', o_momiji: '#d8602a', o_snow: '#e8f0f8', o_hakama: '#5a4a8a', o_ninja: '#2a2a3a', o_samurai: '#a83a3a', o_maneki: '#f8f4ec' }[id] || '#6a9ae0';
  return art('stb:outfit:' + id, () => paint(10, 10, G => { G.rect(2, 1, 6, 8, col); G.rect(1, 2, 8, 3, col); G.rect(4, 1, 2, 3, '#f4e4c8'); G.rect(2, 5, 6, 1, '#c84a3a'); }, 'plain'));
}
function uniformIcon(id) {
  const col = { u_sakura: '#f4a8be', u_aizome: '#2f4a8a', u_sailor: '#f4f4f8', u_gold: '#e8b838' }[id] || '#f4a8be';
  return art('stb:uniform:' + id, () => paint(10, 10, G => { G.rect(2, 2, 6, 7, col); G.rect(1, 3, 8, 2, col); G.rect(4, 2, 2, 2, '#fbfaf4'); if (id === 'u_sailor') G.rect(2, 5, 6, 1, '#2f4a8a'); }, 'plain'));
}
// the cat shrine (16.8): hokoraArt(lv) 48x44 (lv 0 bare ground .. 10 the giant gold cat), toriiArt() 48x36,
// komainuArt(side) 14x18, shrineLanternArt() 12x22; all anchored bottom-left on their footprint
function hokoraArt(lv) {
  lv = clamp(lv | 0, 0, 10);
  return art('stb:hokora:' + lv, () => paint(48, 44, G => {
    if (lv < 1) { G.rect(20, 34, 8, 8, '#9a958a'); G.rect(21, 33, 6, 1, '#b8b2a4'); return; }
    const big = lv >= 5, wood = big ? '#c8463a' : '#8a6a4a', roof = lv >= 9 ? '#e8b838' : '#4a4a5a';
    const x0 = big ? 6 : 14, w = big ? 36 : 20, top = big ? 14 : 22;
    G.rect(x0, top + 8, w, 44 - top - 10, wood); G.rect(x0 + 4, top + 12, w - 8, 44 - top - 16, '#3a2a20');
    G.tri(x0 - 4, top + 9, x0 + w / 2, top, x0 + w + 4, top + 9, roof);
    if (lv >= 8) G.ell(24, top + 12, 3, 3, '#ffd23f');
    if (lv >= 10) { G.ell(24, 10, 9, 9, '#f0c040'); G.ell(20, 9, 1, 1, OUT); G.ell(28, 9, 1, 1, OUT); G.tri(16, 3, 18, -2, 21, 3, '#f0c040'); G.tri(27, 3, 30, -2, 32, 3, '#f0c040'); }
    G.rect(0, 42, 48, 2, '#b8b2a4');
  }));
}
function toriiArt() {
  return art('stb:torii', () => paint(48, 36, G => { G.rect(1, 2, 46, 3, '#c8382a'); G.rect(4, 8, 40, 2, '#c8382a'); G.rect(7, 4, 3, 32, '#c8382a'); G.rect(38, 4, 3, 32, '#c8382a'); G.rect(0, 1, 48, 1, '#2a2a2a'); }));
}
function komainuArt(side) {
  return art('stb:komainu:' + side, () => { const c = paint(14, 18, G => { G.rect(2, 13, 10, 5, '#9a958a'); G.ell(7, 9, 4, 4, '#b8b2a4'); G.ell(7, 5, 3.5, 3.5, '#c8c2b4'); G.set(6, 5, OUT); G.set(8, 5, OUT); }); return side === 'r' ? flipC(c) : c; });
}
function shrineLanternArt() {
  return art('stb:slantern', () => paint(12, 22, G => { G.rect(4, 12, 4, 10, '#a8a296'); G.rect(2, 6, 8, 6, '#b8b2a4'); G.rect(4, 8, 4, 3, '#ffe9a8'); G.tri(1, 6, 6, 1, 11, 6, '#8a857a'); }));
}
// chochinString(): 32 x 10, a string of paper lanterns that tiles sideways (festivals, the plaza at night)
function chochinString() {
  return art('stb:chochin', () => paint(32, 10, G => { for (let x = 0; x < 32; x++) G.set(x, 1 + (x % 16 < 8 ? (x % 8 > 3 ? 1 : 0) : 0), '#3a2a20'); for (const cx of [6, 22]) { G.ell(cx, 6, 3, 3.5, '#e8503a'); G.rect(cx - 2, 2, 4, 1, '#3a2a20'); G.rect(cx - 1, 6, 2, 1, '#ffd890'); } }, 'plain'));
}
// festival stalls (16.9): stallArt(kind, open, frame) 32 x 34, 2 tiles wide, anchored (0,34); closed = under a cloth;
// kinds goldfish takoyaki ice shoot (the object artist's names)
function stallArt(kind, open, frame) {
  const col = { goldfish: '#e8503a', takoyaki: '#c8783a', ice: '#4ab0e0', shoot: '#6a8a3a' }[kind] || '#e8503a';
  return art('stb:stall:' + kind + ':' + (open ? 1 : 0), () => paint(32, 34, G => {
    G.rect(2, 10, 2, 24, '#7a5a3a'); G.rect(28, 10, 2, 24, '#7a5a3a'); G.rect(3, 22, 26, 10, '#a0784a');
    if (!open) { G.rect(1, 8, 30, 24, '#8a9ab0'); G.rect(1, 8, 30, 2, '#6a7a90'); return; }
    G.rect(0, 4, 32, 7, col); for (let x = 0; x < 32; x += 4) G.rect(x, 4, 2, 7, '#fbfaf4');
    G.rect(6, 16, 20, 5, kind === 'ice' ? '#d8f0fa' : '#3a2a20'); G.ell(10, 2, 3, 2.5, '#e8503a'); G.ell(22, 2, 3, 2.5, '#e8503a');
  }));
}
// the album's keepsakes from the year / the press (core A data, drawn here when the album shows them)
function trophyArt(k) { return art('stb:trophy:' + k, () => paint(12, 14, G => { const c = ['#e8b838', '#c8d0dc', '#c8783a', '#e88aa8', '#8ac08a'][clamp(k | 0, 0, 4)] || '#e8b838'; G.ell(6, 4, 4, 4, c); G.rect(5, 7, 2, 4, c); G.rect(3, 11, 6, 2, '#7a5a3a'); })); }
function coverArt(k) { return art('stb:cover:' + k, () => paint(10, 12, G => { G.rect(1, 1, 8, 10, '#f4ecd8'); G.rect(1, 1, 8, 3, '#c8382a'); G.ell(5, 7, 2, 2, '#f5a04a'); }, 'plain')); }
function medalArt(season) { return art('stb:medal:' + season, () => paint(9, 9, G => { G.ell(4.5, 5, 3.5, 3.5, ['#f4a8be', '#4ab0e0', '#e0703a', '#e8f0f8'][clamp(season | 0, 0, 3)]); G.rect(3, 0, 3, 2, '#c8382a'); }, 'plain')); }
function seasonIcon(s) { return art('stb:season:' + s, () => paint(7, 7, G => { G.ell(3.5, 3.5, 3, 3, ['#f4a8be', '#5ab04a', '#e0703a', '#e8f0f8'][clamp(s | 0, 0, 3)]); }, 'plain')); }
// the eight garden pieces (16.7; the object artist's names): gardenDecorArt(id, frame) 16 x 24, one tile, anchored (0,24)
// on its tile; their 10 x 10 icons come from decorIcon(id) (the core falls back to this sprite scaled, see gzIcon). id =
// gd_chime gd_zen gd_mill gd_lantern gd_tower gd_wisteria gd_torii gd_teahouse (gd_mill / gd_chime animate, frame 0 / 1)
function gardenDecorArt(id, frame) {
  const f = frame ? 1 : 0;
  return art('stb:gz:' + id + ':' + f, () => paint(16, 24, G => {
    if (id === 'gd_chime') { G.rect(7, 4, 2, 20, '#7a5a3a'); G.rect(3, 4, 10, 2, '#7a5a3a'); G.ell(4, 9, 2, 2.5, '#8ad0e8'); G.rect(4 + f, 12, 1, 4, '#fbfaf4'); }
    else if (id === 'gd_zen') { G.ell(8, 18, 7, 5, '#8a857a'); G.ell(7, 16, 5, 4, '#a8a296'); G.rect(0, 22, 16, 2, '#e0dccf'); }
    else if (id === 'gd_mill') { G.ell(8, 14, 7, 7, '#9a7a4a'); G.ell(8, 14, 4, 4, '#7a5a3a'); G.rect(0, 20, 16, 4, '#4a90b8'); G.rect(7 + f, 7, 2, 14, '#6a4a2a'); }
    else if (id === 'gd_lantern') { G.rect(6, 12, 4, 12, '#a8a296'); G.rect(3, 7, 10, 6, '#b8b2a4'); G.rect(6, 9, 4, 3, '#ffe9a8'); G.tri(2, 7, 8, 1, 14, 7, '#8a857a'); }
    else if (id === 'gd_tower') { G.rect(6, 2, 4, 22, '#c8a878'); G.rect(2, 4, 12, 3, '#e8d0a8'); G.rect(2, 12, 12, 3, '#e8d0a8'); G.rect(0, 21, 16, 3, '#c8a878'); }
    else if (id === 'gd_wisteria') { G.rect(1, 2, 14, 2, '#7a5a3a'); G.rect(2, 2, 2, 22, '#7a5a3a'); G.rect(12, 2, 2, 22, '#7a5a3a'); for (const x of [4, 7, 10]) G.rect(x, 4, 2, 7 + (x & 1) * 2, '#a88ad8'); }
    else if (id === 'gd_torii') { G.rect(0, 3, 16, 2, '#c8382a'); G.rect(1, 7, 14, 1, '#c8382a'); G.rect(2, 4, 2, 20, '#c8382a'); G.rect(12, 4, 2, 20, '#c8382a'); }
    else { G.rect(1, 10, 14, 14, '#c8a878'); G.tri(0, 11, 8, 3, 16, 11, '#6a5a4a'); G.rect(5, 15, 6, 9, '#3a2a20'); G.rect(6, 16, 4, 4, '#f4ecd8'); }
  }));
}
// fireworkArt(k, frame): one burst, 32 x 32, anchor (16,16); k = colour 0-5, frame 0-5 (opening .. fading); drawn at
// alpha ~.6, <= 2 bursts a second, <= 8 frames a second (the plaza's show, 16.9)
function fireworkArt(k, frame) {
  const cols = ['#ff9ab8', '#ffd27a', '#9ae0c8', '#b8a8f0', '#ffb08a', '#8ac8f8'], i0 = clamp(k | 0, 0, 5), f = clamp(frame | 0, 0, 5);
  return art('stb:fw:' + i0 + ':' + f, () => {
    const c = mk(32, 32), x = c.getContext('2d'), r = [3, 7, 11, 13, 14, 15][f], n = 12;
    x.globalAlpha = f >= 4 ? (6 - f) / 3 : 1;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      x.fillStyle = i & 1 ? cols[(i0 + 2) % 6] : cols[i0];
      x.fillRect(R(16 + Math.cos(a) * r), R(16 + Math.sin(a) * r + f * f * .2), 1, 1);
      if (f >= 1 && f <= 3) x.fillRect(R(16 + Math.cos(a) * r * .6), R(16 + Math.sin(a) * r * .6), 1, 1);
    }
    return c;
  });
}
