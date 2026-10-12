// ============================================================ v2.0 additions (SPEC_v2 section 12.3)
// Same rules as above: 3/4 top-down, light from the top-left, 1px contact shadow, anchor = bottom-left of the
// footprint unless the comment says otherwise, every canvas cached with art(). No randomness: _obH() hashes.
const _obQ = {
  cu: '#c8743a', cuL: '#eaa266', cuD: '#94502a',                          // copper
  iron: '#4a4650', ironL: '#6a6674', ironD: '#2e2a34',                     // cast iron
  clay: '#c27a52', clayL: '#dc9a6c', clayD: '#9a5a3a', clayDD: '#7a4430',  // kamado clay
  rice: '#fbfaf4', riceD: '#d8d2c4', nori: '#26342c',
  lac: '#a8302a', lacL: '#cc5040', lacD: '#6a1c1c', blk: '#3a2a2e', blkL: '#5a4448',   // lacquer
  hin: '#e6c48c', hinL: '#f6dcaa', hinD: '#c49a62', hoop: '#b0602c',     // hinoki wood + copper hoops
  navy: '#2a3a6a', cream: '#fff3d0', paper: '#f4ecd8',
  tea: '#b8d050', teaD: '#8aa838', cel: '#8ac0a0', celL: '#c0e4cc', celD: '#5a9a7a',
  ember: '#c8402a', flame: '#ff8a3a', flameL: '#ffd27a', soot: '#2a1410',
};
const _obGOLD = ['#8a5a10', '#b07818', '#d89a20', '#f0b830', '#ffd23f', '#ffe680', '#fff6c8'];
// remove a pixel from a grid (carving notches)
function _obCut(G, x, y) { if (x >= 0 && y >= 0 && x < G.w && y < G.h) G.d[y * G.w + x] = null; }
// wavy steam wisp rising from (x0, y0), n px tall; f (frame) moves the wave up 2px. Drawn in a post pass
// (semi-transparent white, never outlined). Two frames swapped at <= 2 Hz read as rising steam, not a flash.
function _obSteam(px, x0, y0, n, f) {
  const WV = [0, 1, 1, 0, 0, -1, -1, 0];
  for (let j = 0; j < n; j++) {
    const a = j < n * .4 ? .7 : j < n * .75 ? .45 : .25;
    px('rgba(255,255,255,' + a + ')', [[x0 + WV[(j + 2 + (f | 0) * 2) & 7], y0 - j]]);
  }
}
// lit() picker for a palette ordered dark -> light
const _obLit = (pal, cx, cy, rx, ry, o) => lit(pal, cx, cy, rx, ry, o || { base: .62, lx: .3 });

// ------------------------------------------------------------ dining / kitchen
function urnArt() {   // 16x22 tea stand: side table + copper kettle + two cups; footprint 1x1, anchor (0,22)
  return art('ob:urn', () => _obObj(16, 22, G => {
    const P = _obP, Q = _obQ;
    G.rect(1, 13, 14, 2, P.woodL); G.rect(1, 13, 14, 1, '#e8bc88');
    G.rect(1, 15, 14, 2, P.dk); G.rect(1, 16, 14, 1, P.dk2);
    G.rect(2, 17, 2, 3, P.dk2); G.rect(12, 17, 2, 3, P.dk2); G.rect(4, 18, 8, 1, P.dk);
    G.rect(2, 13, 9, 2, '#5a8a4a'); G.rect(2, 13, 9, 1, '#7aa860');                         // tea cloth
    G.ell(6.5, 10.4, 4.5, 3.2, _obLit([Q.cuD, Q.cu, Q.cu, Q.cuL, Q.cuL], 5.5, 9.4, 5, 3.6)); // kettle body
    G.rect(4, 12, 6, 1, Q.cuD);
    G.ell(6.5, 7.6, 2.6, 1, Q.cuD); G.rect(5, 7, 3, 1, Q.cu);                                // lid
    G.rect(6, 6, 2, 1, Q.ironD);                                                             // knob
    G.set(2, 10, Q.cu); G.set(1, 9, Q.cu); G.set(0, 8, Q.cuL);                              // spout
    G.set(4, 9, '#ffd0a0'); G.set(5, 9, '#ffd0a0');
    [[11, 11], [13, 12]].forEach(([x, y]) => {                                               // two cups of green tea
      G.rect(x, y, 2, 2, '#f4f0e6'); G.set(x + 1, y + 1, '#d0c8b8'); G.rect(x, y, 2, 1, Q.tea);
    });
  }, [[1, 15, 21, .3]], (x, px) => {
    px(_obQ.ironD, [[2, 7], [2, 6], [3, 5], [4, 4], [5, 4], [6, 3], [7, 3], [8, 4], [9, 4], [10, 5], [11, 6], [11, 7]]);   // bail handle
    px('rgba(255,255,255,.55)', [[0, 6], [1, 5]]); px('rgba(255,255,255,.3)', [[0, 4]]);
  }));
}

function stoveArt(frame) {   // 32x30 clay kamado with two pots, footprint 2x1, anchor (0,30); frame 0/1 fire + steam, 2 = cold
  const f = clamp(frame | 0, 0, 2);
  return art('ob:stove:' + f, () => _obObj(32, 30, G => {
    const P = _obP, Q = _obQ;
    G.rect(1, 12, 30, 5, Q.clayL); G.rect(1, 12, 30, 1, '#ecb488'); G.rect(1, 16, 30, 1, Q.clay);
    G.rect(1, 17, 30, 10, Q.clay); G.rect(1, 26, 30, 1, Q.clayD); G.rect(1, 27, 30, 1, Q.clayDD);
    for (let y = 18; y < 26; y++) for (let x = 2; x < 30; x++) if (_obH(x, y, 31) < .08) G.set(x, y, Q.clayD);
    const FL = [['...a...', '..aoa..', '.aoyoa.', 'aoyyyoa'], ['....a..', '.a.aoa.', '.aoyoa.', 'aoyyyoa']];
    [8, 23].forEach(cx => {
      G.rect(cx - 4, 19, 9, 8, Q.clayDD); G.set(cx - 4, 19, Q.clay); G.set(cx + 4, 19, Q.clay);   // arch rim
      G.rect(cx - 3, 20, 7, 6, Q.soot); G.set(cx - 3, 20, Q.clayDD); G.set(cx + 3, 20, Q.clayDD);
      if (f < 2) {
        _obPat(G, cx - 3, 21, FL[f], { a: Q.ember, o: Q.flame, y: Q.flameL });
        G.rect(cx - 3, 25, 7, 1, '#6a3a20'); G.set(cx - 2, 25, '#ffb060'); G.set(cx + 1, 25, '#ff9040');
      } else { G.rect(cx - 3, 25, 7, 1, '#5e5a5a'); G.set(cx, 25, '#8a3020'); G.set(cx - 2, 24, '#4a4646'); }
      // iron pot sunk into the top + wooden lid
      G.ell(cx + .5, 14, 6.6, 2, Q.clayDD);
      G.ell(cx + .5, 12, 5.8, 3.2, _obLit([Q.ironD, Q.iron, Q.iron, Q.ironL], cx + .5, 12, 5.8, 3.2));
      G.ell(cx + .5, 9.6, 4.8, 1.7, P.woodL); G.rect(cx - 4, 10, 10, 1, P.woodD);
      G.rect(cx - 1, 8, 3, 1, P.dk2);
    });
  }, [[1, 31, 28, .34], [2, 30, 29, .14]], f < 2 ? (x, px) => {
    [8, 23].forEach((cx, i) => { _obSteam(px, cx - 1, 7, 6, f + i); _obSteam(px, cx + 2, 7, 5, f + i + 1); });
  } : null));
}

function ricePotArt(frame) {   // 16x22 iron rice pot (hagama) on a clay stand, 1x1, anchor (0,22); frame 1 = lid hops 1px
  const f = frame ? 1 : 0;
  return art('ob:ricepot:' + f, () => _obObj(16, 22, G => {
    const P = _obP, Q = _obQ;
    G.rect(2, 14, 12, 2, Q.clayL); G.rect(2, 14, 12, 1, '#ecb488');
    G.rect(2, 16, 12, 4, Q.clay); G.rect(2, 19, 12, 1, Q.clayDD);
    G.rect(6, 17, 4, 2, Q.soot); G.rect(6, 18, 4, 1, '#7a2a1a');
    G.ell(8, 12.6, 5.2, 2.8, _obLit([Q.ironD, Q.iron, Q.iron, Q.ironL], 8, 12.6, 5.2, 2.8));
    G.ell(8, 10.6, 7.2, 1.5, Q.ironL); G.rect(1, 11, 14, 1, Q.iron);                         // brim (tsuba)
    G.ell(8, 9.4, 4.6, 1.6, Q.iron);
    const ly = f ? -1 : 0;
    G.ell(8, 7.8 + ly, 5, 1.8, P.woodL); G.rect(3, 8 + ly, 10, 1, P.woodD); G.rect(7, 5 + ly, 2, 1, P.dk);
  }, [[2, 13, 21, .32]], f ? (x, px) => {
    px('rgba(255,255,255,.65)', [[2, 7], [13, 7], [1, 6], [14, 5]]); px('rgba(255,255,255,.35)', [[1, 5], [14, 4], [2, 4]]);
  } : null));
}

function passArt(n) {   // 48x24 serving counter, footprint 3x1, anchor (0,24); n = 0..6 rice-ball trays, filled left to right
  const k = clamp(Math.floor(n) || 0, 0, 6);
  return art('ob:pass:' + k, () => _obObj(48, 24, G => {
    const P = _obP, Q = _obQ;
    G.rect(1, 10, 46, 4, P.woodL); G.rect(1, 10, 46, 1, '#e8bc88');
    for (let x = 2; x < 46; x++) { if (_obH(x, 11, 41) < .22) G.set(x, 11, '#cf9c66'); if (_obH(x, 13, 42) < .22) G.set(x, 13, '#e6b888'); }
    G.rect(1, 14, 46, 1, '#e8bc88'); G.rect(1, 15, 46, 1, P.woodD);
    G.rect(2, 16, 44, 6, P.dk); G.rect(2, 16, 44, 1, P.dk2); G.rect(2, 21, 44, 1, P.dk2);
    [4, 19, 34].forEach(x0 => {                                    // three white half-cloths on the front
      G.rect(x0, 16, 10, 4, P.cloth); G.rect(x0, 19, 10, 1, '#d8d0c0'); G.rect(x0 + 5, 17, 1, 3, '#d8d0c0');
    });
    for (let i = 0; i < k; i++) {
      const x0 = 4 + i * 7;
      G.rect(x0 - 1, 12, 7, 2, Q.lacD); G.rect(x0, 12, 5, 1, Q.lac);                              // little tray
      _obPat(G, x0, 7, ['..W..', '.WWW.', 'WWWWW', 'WWNWW', 'WNNNW'], { W: Q.rice, N: Q.nori });
      G.set(x0 + 1, 9, '#ffffff'); G.set(x0 + 2, 8, '#ffffff');
    }
  }, [[1, 47, 23, .32]]));
}

function dTableArt(state) {   // 16x16 low dining table, 1x1, anchor (0,16); 'empty' | 'set' (rice, miso, grilled fish) | 'eaten'
  const st = state === 'set' || state === 'eaten' ? state : 'empty';
  return art('ob:dtable:' + st, () => _obObj(16, 16, G => {
    const P = _obP, Q = _obQ;
    G.rect(1, 3, 14, 8, Q.blk); G.rect(1, 3, 14, 1, Q.blkL);
    G.rect(1, 11, 14, 1, Q.lac); G.rect(1, 12, 14, 1, Q.lacD);
    G.rect(2, 13, 2, 1, P.dk2); G.rect(12, 13, 2, 1, P.dk2);
    const pal = { W: Q.rice, w: Q.riceD, B: '#3a5a9a', b: '#5a7aba', R: Q.lac, r: Q.lacL, s: '#b07a40', S: '#d8a060',
      p: '#f4f0e6', F: '#c8743a', f: '#e09a5a', e: OUT, c: '#e0c080', n: '#d0d0d0', i: '#e8e4dc', k: Q.lacD, g: '#7aa838' };
    if (st === 'set') {
      _obPat(G, 2, 3, ['.WW.', 'WWWW', 'BbBB', '.BB.'], pal);          // rice
      _obPat(G, 10, 3, ['RssR', 'RSsR', 'RrRR', '.RR.'], pal);         // miso soup
      _obPat(G, 4, 7, ['pppppppp', 'peFFFFfp', 'pppppppp'], pal);     // grilled fish on a plate
      G.rect(3, 10, 6, 1, pal.c); G.set(9, 10, '#b89050');            // chopsticks
    } else if (st === 'eaten') {
      _obPat(G, 2, 3, ['.ii.', 'iWii', 'BbBB', '.BB.'], pal);
      _obPat(G, 10, 3, ['RkkR', 'RkkR', 'RrRR', '.RR.'], pal);
      _obPat(G, 4, 7, ['pppppppp', 'pennnnnp', 'pppppppp'], pal);
      G.set(1, 4, pal.c); G.set(2, 5, pal.c); G.set(3, 6, pal.c); G.set(4, 7, '#b89050');   // chopsticks laid across
    } else {
      G.rect(5, 9, 6, 1, pal.c); G.set(4, 9, '#b89050');               // chopsticks on a rest
      _obPat(G, 11, 5, ['.pp.', 'pggp', '.pp.'], pal);                // small tea cup
    }
  }, [[1, 15, 15, .3]]));
}

function cushionArt() {   // 12x6 zabuton seat (ground layer, not blocking), anchor (6,3) = centre
  return art('ob:cushion', () => _obObj(12, 6, G => {
    G.rect(1, 1, 10, 4, '#3a5a9a'); G.rect(2, 1, 8, 1, '#5a7aba'); G.rect(1, 4, 10, 1, '#2a447a');
    G.set(5, 2, _obP.cloth); G.set(6, 3, _obP.cloth);
  }));
}

// ------------------------------------------------------------ room decor (ground items, 16x22, anchor (0,22))
const _obDECOR = ['d_scroll', 'd_ikebana', 'd_bonsai', 'd_screen', 'd_tank', 'd_tower', 'd_maneki', 'd_daruma'];
// v2.1 (SPEC_v2 16.1 / 16.6): 8 seasonal pieces + gold versions of 4 v2.0 pieces. A gold piece is decorArt(id, f, true)
// or its own id 'd_maneki_gold' / 'd_daruma_gold' / 'd_tank_gold' / 'd_screen_gold' (same picture).
const _obDECOR21 = ['d_sakura', 'd_lantern', 'd_windbell', 'd_fan', 'd_momiji', 'd_dango', 'd_kotatsu', 'd_mikan'];
const _obDECORG = ['d_maneki', 'd_daruma', 'd_tank', 'd_screen'];
const _obDECOR_ANIM = { d_tank: 1, d_maneki: 1, d_windbell: 1, d_kotatsu: 1 };
// -> [id, gold] with unknown ids folded to d_scroll and gold only where a gold version exists
function _obDecorId(id, gold) {
  id = String(id || '');
  if (/_gold$/.test(id)) { id = id.slice(0, -5); gold = true; }
  if (_obDECOR.indexOf(id) < 0 && _obDECOR21.indexOf(id) < 0) id = 'd_scroll';
  return [id, !!gold && _obDECORG.indexOf(id) >= 0];
}
function decorArt(id, frame, gold) {   // 16x22, 1x1 ground item (not blocking), anchor (0,22); frame 0/1 animates d_tank,
  // d_maneki, d_windbell (paper strip) and d_kotatsu (a cat's tail); gold = the 16.6 gold version (maneki daruma tank screen)
  [id, gold] = _obDecorId(id, gold);
  const f = _obDECOR_ANIM[id] && frame ? 1 : 0;
  if (gold) return art('ob:decor:' + id + ':' + f + ':g', () => _obDecorGold(id, f));
  if (_obDECOR21.indexOf(id) >= 0) return art('ob:decor:' + id + ':' + f, () => _obDecor21(id, f));
  return art('ob:decor:' + id + ':' + f, () => {
    const P = _obP, Q = _obQ, LP = [P.leafD, P.leafD, P.leaf, P.leaf, P.leafL, P.leafLL];
    let post = null;
    const fn = G => {
      if (id === 'd_scroll') {
        G.rect(1, 17, 14, 3, P.dk); G.rect(1, 17, 14, 1, P.dkL); G.rect(1, 19, 14, 1, P.dk2);      // low dais
        G.rect(2, 2, 1, 15, P.dk2); G.rect(13, 2, 1, 15, P.dk2); G.rect(1, 1, 14, 1, P.dk);         // stand
        G.rect(4, 3, 8, 12, '#5a6a8a'); G.rect(4, 3, 8, 1, '#7a8aaa');                             // mount
        G.rect(5, 4, 6, 10, Q.paper);                                                               // paper
        G.tri(4.5, 12, 7.5, 7, 10.5, 12, '#a8b4c8'); G.tri(6, 14, 9, 9.5, 11.5, 14, '#5a6a7a');   // mountains
        G.rect(5, 11, 6, 1, '#e8e4d8'); G.set(9, 5, P.red); G.set(10, 5, P.red); G.set(9, 6, '#e05a4a');
        G.rect(5, 14, 6, 1, Q.paper);
        G.rect(3, 15, 10, 1, '#3a2a20'); G.set(2, 15, '#c8a870'); G.set(13, 15, '#c8a870');        // bottom roller
        G.rect(4, 2, 8, 1, '#3a2a20');
      } else if (id === 'd_ikebana') {
        G.rect(2, 18, 12, 2, Q.blk); G.rect(2, 18, 12, 1, Q.blkL);
        for (let y = 11; y <= 17; y++) for (let x = (y < 13 ? 6 : 5); x <= (y < 13 ? 9 : 10); x++)
          G.set(x, y, y === 11 ? P.weaveL : (((x + (y & 1) * 2) >> 1) & 1) ? P.weave : P.weaveD);
        G.rect(5, 17, 6, 1, P.weaveDk);
        [[3.5, 9, 2.2, 1.4], [11.5, 8, 2.2, 1.4], [8, 9.5, 1.8, 1.2]].forEach(([cx, cy, rx, ry]) => G.ell(cx, cy, rx, ry, _obLit(LP, cx, cy, rx, ry)));
        [[3, 3, '#ff8aa8'], [5.5, 5.5, '#ff6a8a'], [12, 3.5, '#ff8aa8'], [10, 6, '#fff0f4'], [7.5, 3, '#ffb0c4']].forEach(([cx, cy, c]) => {
          G.ell(cx, cy, 1.6, 1.4, c); G.set(R(cx - .5), R(cy - .5), '#fff6f8');
        });
        post = (x, px) => { px('#6a4a30', [[7, 10], [6, 9], [5, 8], [4, 7], [8, 10], [9, 9], [10, 8], [11, 7], [11, 6]]); };
      } else if (id === 'd_bonsai') {
        G.rect(2, 18, 12, 2, P.dk); G.rect(2, 18, 12, 1, P.dkL);
        G.rect(3, 14, 10, 4, '#3a5a9a'); G.rect(3, 14, 10, 1, '#6a8aca'); G.rect(4, 17, 8, 1, '#2a447a'); G.set(4, 15, '#5a7aba');
        G.rect(4, 13, 8, 1, '#5a8a3a');
        [[7, 12], [7, 11], [6, 10], [6, 9], [7, 8], [8, 7], [8, 6], [9, 9], [10, 10], [5, 9], [4, 8]].forEach(([x, y]) => G.set(x, y, '#7a5238'));
        G.set(8, 12, '#5e3e2a'); G.set(6, 11, '#5e3e2a');
        [[4, 7, 3.4, 1.8], [11.5, 8.6, 3.4, 1.8], [8, 4, 4.2, 2.2]].forEach(([cx, cy, rx, ry]) => G.ell(cx, cy, rx, ry, _obLit(LP, cx - .6, cy - .8, rx + .4, ry + .4, { base: .62, lx: .35 })));
      } else if (id === 'd_screen') {
        G.rect(1, 3, 7, 16, '#2a2228'); G.rect(8, 4, 7, 15, '#2a2228');
        for (let y = 4; y <= 17; y++) for (let x = 2; x <= 6; x++) G.set(x, y, (x + y * .5 + DITHER[y & 1][x & 1] * 2) < 9 ? '#fff0a0' : '#ffd84a');
        for (let y = 5; y <= 17; y++) for (let x = 9; x <= 13; x++) G.set(x, y, (x + y * .5 + DITHER[y & 1][x & 1] * 2) < 18 ? '#e8b838' : '#c8962a');
        G.rect(2, 12, 5, 1, '#fffbe6'); G.rect(9, 13, 5, 1, '#f0d890');                             // gold cloud band
        G.ell(4.5, 8.5, 2.2, 1.3, P.leafD); G.ell(3.5, 10, 1.6, 1, P.leaf); G.set(5, 10, '#6a4a30'); G.set(5, 11, '#6a4a30');
        G.ell(11.5, 8.5, 1.6, 1.6, P.red);                                                          // red sun
        G.rect(1, 19, 2, 1, '#2a2228'); G.rect(13, 19, 2, 1, '#2a2228');
      } else if (id === 'd_tank') {
        G.rect(4, 17, 8, 3, P.dk); G.rect(4, 17, 8, 1, P.dkL); G.rect(5, 19, 6, 1, P.dk2);
        G.ell(8, 11, 6.2, 5.8, (x, y) => y < 8 ? '#e2f6f8' : y < 13 ? '#7ad0e0' : '#5ab8cc');
        G.ell(8, 5.6, 3.8, 1.1, '#9ad8e0'); G.rect(5, 5, 6, 1, '#ffffff');                           // rim
        G.rect(3, 8, 10, 1, '#a8e4ee');
        [[5, 15], [7, 16], [9, 15], [11, 15], [8, 15]].forEach(([x, y], i) => G.set(x, y, i & 1 ? '#c8b890' : '#a89870'));
        G.set(4, 13, P.leaf); G.set(4, 14, P.leaf); G.set(5, 12, P.leafL); G.set(11, 14, P.leaf); G.set(12, 13, P.leafL);
        const FS = f ? [[7, 10, 1], [7, 13, -1]] : [[5, 10, 1], [9, 13, -1]];
        FS.forEach(([x, y, d]) => { const h = d > 0 ? x + 2 : x; G.rect(x, y, 3, 1, '#ff7a2a'); G.set(h, y, '#ffb060'); G.set(d > 0 ? x - 1 : x + 3, y, '#ff9a4a'); G.set(x + 1, y + 1, '#e0602a'); });
        post = (x, px) => { px('rgba(255,255,255,.85)', [[4, 8], [4, 9], [5, 7]]); px('rgba(255,255,255,.5)', [[4, 11]]); };
      } else if (id === 'd_tower') {
        G.rect(1, 17, 14, 3, '#d8c8a8'); G.rect(1, 17, 14, 1, '#ece0c8'); G.rect(1, 19, 14, 1, '#b8a888');
        G.rect(7, 6, 2, 11, '#d8b878'); for (let y = 7; y < 17; y += 2) G.rect(7, y, 2, 1, '#b8985a');
        G.rect(9, 11, 5, 6, '#e0d0b0'); G.rect(9, 11, 5, 1, '#f0e4cc'); G.ell(11.5, 14.5, 1.5, 1.6, '#5a4a3a');   // cubby
        G.rect(1, 10, 6, 2, '#e8d8b8'); G.rect(1, 11, 6, 1, '#c8b898'); G.rect(2, 12, 1, 5, '#d8b878');           // side step
        G.rect(3, 4, 10, 2, '#e8d8b8'); G.rect(3, 5, 10, 1, '#c8b898');                                             // top
        G.ell(12.5, 9, 1.8, 1.8, '#e0503a'); G.set(12, 8, '#ff8a6a');                                              // yarn ball
        post = (x, px) => { px('#a87a4a', [[13, 6], [13, 7]]); px('#b03a2a', [[12, 9], [13, 10]]); };
      } else if (id === 'd_maneki') {
        const Wc = '#fbfbf6';
        G.rect(2, 18, 12, 2, P.red); G.rect(2, 18, 12, 1, '#dc6450'); G.set(2, 19, P.gold); G.set(13, 19, P.gold);
        G.ell(8, 14.4, 4.6, 3.8, Wc); G.ell(8, 8.8, 4.6, 3.8, Wc);
        G.tri(3.5, 7.5, 4.2, 3.4, 7, 5.6, Wc); G.tri(9, 5.6, 11.8, 3.4, 12.5, 7.5, Wc);
        G.set(4, 5, P.pink); G.set(11, 5, P.pink);
        G.ell(5.5, 6.6, 1.6, 1.2, '#f0a040'); G.set(10, 7, '#3a3a40'); G.set(11, 7, '#3a3a40');                   // calico patches
        if (!f) { G.rect(12, 3, 2, 6, Wc); G.set(12, 3, P.pink); G.set(13, 3, P.pink); }
        else { G.rect(12, 6, 2, 4, Wc); G.set(13, 5, Wc); G.set(13, 6, P.pink); }
        G.rect(4, 12, 8, 1, P.red); G.set(8, 13, P.gold);
        G.ell(5.5, 15.5, 1.6, 2.2, P.gold); G.set(5, 15, '#fff2a8'); G.set(6, 16, '#d89a20');                     // koban
        G.set(6, 9, OUT); G.set(10, 9, OUT); G.set(8, 10, P.pink);
      } else {   // d_daruma
        G.rect(3, 18, 10, 2, '#6a4a8a'); G.rect(3, 18, 10, 1, '#8a6aaa');
        G.ell(8, 11.5, 6, 7, _obLit(['#7a1a1a', '#a8302a', '#c8463a', '#c8463a', '#e0604a', '#f08070'], 8, 11.5, 6, 7));
        G.ell(8, 9.2, 3.6, 3, '#fbf4e8'); G.rect(5, 7, 2, 1, OUT); G.rect(9, 7, 2, 1, OUT);
        G.set(6, 9, OUT); G.ell(10, 9.4, 1, 1, '#fbf4e8'); G.set(10, 9, '#c8c0b0');                               // one eye painted
        G.rect(6, 11, 4, 1, '#8a8a8a');
        [[5, 14], [6, 15], [8, 14], [10, 15], [11, 14], [7, 16], [9, 16]].forEach(([x, y]) => G.set(x, y, P.gold));
      }
    };
    return _obObj(16, 22, fn, [[2, 13, 21, .3]], (x, px) => { if (post) post(x, px); });
  });
}

function slotMarkArt() {   // 12x6 faint diamond on an empty decor slot (ground layer), anchor (6,3)
  return art('ob:slot', () => {
    const c = mk(12, 6), x = c.getContext('2d');
    const rs = ['.....XX.....', '...XXooXX...', '.XXooooooXX.', '.XXooooooXX.', '...XXooXX...', '.....XX.....'];
    rs.forEach((r, j) => [...r].forEach((ch, i) => {
      if (ch === 'X') { x.fillStyle = 'rgba(255,248,220,.75)'; x.fillRect(i, j, 1, 1); }
      else if (ch === 'o') { x.fillStyle = 'rgba(255,248,220,.2)'; x.fillRect(i, j, 1, 1); }
    }));
    x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(5, 2, 2, 2);
    return c;
  });
}

// ------------------------------------------------------------ shop + boutique
function displayShelfArt() {   // 64x24 shop display shelf (empty), footprint 4x1, anchor (0,24).
  // Core puts decorIcon samples on it: two per 16px cell, left edges at x = cell*16 + 2 / + 9, icon rows 2..11
  // (drawC centre y = 7), so they stand on the shelf board (top surface y 11..12) against the paper back.
  return art('ob:dshelf', () => _obObj(64, 24, G => {
    const P = _obP;
    G.rect(3, 1, 58, 10, '#f4ecd8');                                                  // shoji paper back
    for (let x = 3; x < 61; x++) if ((x - 3) % 8 === 7) G.rect(x, 1, 1, 10, '#d8c8a4');
    G.rect(3, 5, 58, 1, '#e4d8bc');
    G.rect(1, 0, 62, 1, P.dk); G.rect(1, 1, 2, 20, P.dk); G.rect(61, 1, 2, 20, P.dk); G.rect(1, 1, 1, 20, P.dkL);
    G.rect(3, 11, 58, 2, P.woodL); G.rect(3, 11, 58, 1, '#e8bc88'); G.rect(1, 13, 62, 1, P.woodD);   // shelf board
    G.rect(3, 14, 58, 7, P.dk); G.rect(1, 21, 62, 1, P.dk2);                         // cabinet
    for (let i = 0; i < 4; i++) {
      const x0 = 3 + i * 14 + (i > 1 ? 2 : 0);
      G.rect(x0 + 1, 15, 12, 5, '#6e4226'); G.rect(x0 + 1, 15, 12, 1, P.dk2); G.rect(x0 + 1, 19, 12, 1, P.dkL);
      G.set(i & 1 ? x0 + 2 : x0 + 11, 17, '#c8a870');                                 // door pulls
    }
  }, [[1, 63, 23, .32]]));
}

function shopCounterArt() {   // 32x24 shop counter (abacus, wrapped gifts, green cloth front), footprint 2x1, anchor (0,24)
  return art('ob:scounter', () => _obObj(32, 24, G => {
    const P = _obP;
    G.rect(1, 7, 30, 4, P.woodL); G.rect(1, 7, 30, 1, '#e8bc88');
    for (let x = 2; x < 30; x++) if (_obH(x, 9, 51) < .25) G.set(x, 9, '#cf9c66');
    G.rect(1, 11, 30, 1, '#e8bc88'); G.rect(1, 12, 30, 1, P.woodD);
    G.rect(2, 13, 28, 8, '#3d7a4a'); G.rect(2, 13, 28, 1, '#2a5a36'); G.rect(2, 20, 28, 1, '#2a5a36');
    for (let x = 4; x < 30; x += 6) G.rect(x, 14, 1, 6, '#357040');                  // cloth folds
    _obPat(G, 13, 14, ['.W.W.', '..W..', '.WWW.', 'WWWWW', '.WWW.'], { W: P.cloth });   // purse (kinchaku) motif
    // abacus
    G.rect(3, 4, 10, 4, '#5a3420'); G.rect(4, 5, 8, 2, '#a86a3c'); G.rect(3, 5, 10, 1, '#5a3420');
    [5, 7, 9, 11].forEach(x => { G.set(x, 4, '#3a2014'); G.set(x, 6, '#3a2014'); });
    // wrapped souvenir boxes
    G.rect(20, 3, 7, 5, '#e8453c'); G.rect(20, 3, 7, 1, '#ff7a6a'); G.rect(23, 3, 1, 5, '#fff2a8');
    G.rect(21, 1, 5, 2, '#f4f0e6'); G.rect(23, 1, 1, 2, '#e8453c');
    G.rect(27, 5, 3, 3, '#4a8ad8'); G.rect(27, 5, 3, 1, '#7ab0f0');
    G.ell(16.5, 6.2, 1.8, 1.4, P.gold); G.set(16, 5, '#fff2a8');                       // bell
  }, [[1, 31, 23, .32]]));
}

function awningArt() {   // 144x16 striped shop awning + small noren (overlay), anchor (0,0) at world (16, 30*16 - 12)
  return art('ob:awning', () => {
    const c = mk(144, 16), x = c.getContext('2d'), px = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w || 1, h || 1); };
    px('#4a2a18', 0, 0, 144, 2); px('#7a4a2a', 0, 0, 144, 1);                          // batten on the wall
    for (let y = 2; y < 10; y++) for (let i = 0; i < 18; i++) {
      const g = i & 1, lo = y >= 6;
      px(g ? (lo ? '#f4ecd6' : '#e2d8be') : (lo ? '#3d8a4a' : '#2f7440'), i * 8, y, 8, 1);
    }
    px('rgba(20,10,10,.18)', 0, 2, 144, 1);
    for (let i = 0; i < 18; i++) {                                                     // scalloped valance
      const g = i & 1, col = g ? '#f4ecd6' : '#3d8a4a', dk = g ? '#bdb296' : '#24562e', X = i * 8;
      px(col, X, 10, 8, 1); px(col, X + 1, 11, 6, 1); px(col, X + 2, 12, 4, 1);
      px(dk, X, 11); px(dk, X + 7, 11); px(dk, X + 1, 12); px(dk, X + 6, 12); px(dk, X + 2, 13, 4, 1);
      px(g ? '#ffffff' : '#5aa860', X + 2, 10, 3, 1);
    }
    px('rgba(20,10,10,.3)', 0, 9, 144, 1);
    // small indigo noren (three panels), white purse (kinchaku) crest on the middle panel
    const nx = 114, ny = 9;
    px(OUT, nx - 1, ny, 22, 7); px('#2f4a7a', nx, ny, 20, 6); px('#25395f', nx, ny, 20, 1); px('#3a5a90', nx, ny + 1, 20, 1);
    px(OUT, nx + 6, ny + 2, 1, 5); px(OUT, nx + 13, ny + 2, 1, 5);
    ['X.X', '.X.', 'XXX', 'XXX'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') px(j === 3 ? '#d8d0c0' : '#f4f0e6', nx + 8 + i, ny + 1 + j); }));
    px('#f4f0e6', nx + 7, ny + 4, 1, 1); px('#f4f0e6', nx + 11, ny + 4, 1, 1);
    return c;
  });
}

function curtainArt() {   // 64x16 "getting ready" corner before star 5: furled noren on a bamboo pole + star-5 plaque; ground layer, anchor (0,16)
  return art('ob:curtain', () => _obObj(64, 16, G => {
    const P = _obP, B = '#8ac04a', BD = '#5a8a30', BL = '#b8e080';
    G.rect(2, 4, 2, 9, P.dk); G.rect(60, 4, 2, 9, P.dk); G.rect(1, 12, 4, 1, P.dk2); G.rect(59, 12, 4, 1, P.dk2);
    G.rect(1, 3, 62, 2, B); G.rect(1, 3, 62, 1, BL);
    for (let xx = 8; xx < 62; xx += 12) { G.set(xx, 3, BD); G.set(xx, 4, BD); }
    for (let xx = 6; xx <= 57; xx++) for (let y = 5; y <= 8; y++) G.set(xx, y, y === 8 ? '#25395f' : (((xx + 1) >> 2) & 1) ? '#2f4a7a' : '#3a5a90');
    [17, 46].forEach(tx => { G.rect(tx, 4, 2, 6, '#f4f0e6'); G.set(tx, 10, '#f4f0e6'); G.set(tx + 1, 11, '#f4f0e6'); });
    G.rect(26, 8, 12, 6, P.woodL); G.rect(26, 8, 12, 1, '#e8bc88'); G.rect(26, 13, 12, 1, P.woodD);
    _obPat(G, 27, 9, ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'], { X: P.gold });
    _obPat(G, 33, 9, ['XXX', 'X..', 'XXX', '..X', 'XXX'], { X: P.red });
  }, [[1, 5, 14, .3], [59, 63, 14, .3]], (x, px) => { px(_obP.dk2, [[28, 6], [28, 7], [35, 6], [35, 7]]); }));
}

function mirrorArt() {   // 16x28 standing dressing mirror (wood frame, pale-blue glass), 1x1, anchor (0,28)
  return art('ob:mirror', () => _obObj(16, 28, G => {
    const P = _obP;
    G.rect(1, 24, 5, 1, P.dk2); G.rect(10, 24, 5, 1, P.dk2); G.rect(3, 22, 2, 2, P.dk); G.rect(11, 22, 2, 2, P.dk);
    G.rect(2, 2, 12, 21, P.dk); G.rect(3, 1, 10, 1, P.dk); G.rect(5, 0, 6, 1, P.dk);
    G.rect(3, 2, 10, 1, P.dkL); G.rect(2, 3, 1, 19, P.dkL);
    for (let y = 3; y <= 20; y++) for (let xx = 4; xx <= 11; xx++) {
      const v = (xx - 4) / 8 + (y - 3) / 18 + (DITHER[y & 1][xx & 1] - .375) * .3;
      G.set(xx, y, v < .55 ? '#d8eef8' : v < 1.05 ? '#b4d8ec' : v < 1.45 ? '#94c0dc' : '#7aa8cc');
    }
    G.rect(6, 1, 4, 1, '#ffd23f');                                                     // brass crest
    G.rect(2, 22, 12, 1, P.dk2);
    G.rect(3, 3, 3, 1, '#c8463a'); G.rect(3, 4, 2, 2, '#c8463a'); G.set(3, 6, '#c8463a'); G.set(4, 4, '#ffffff');   // red cloth corner
  }, [[1, 15, 26, .32]], (x, px) => {
    px('rgba(255,255,255,.85)', [[9, 5], [8, 6], [7, 7], [10, 5]]); px('rgba(255,255,255,.55)', [[11, 9], [10, 10], [9, 11], [8, 12]]);
  }));
}

function petCushionArt() {   // 16x10 round pet bed (ground layer), anchor (0,10)
  return art('ob:petcush', () => _obObj(16, 10, G => {
    G.ell(8, 4.5, 7, 3.5, (x, y) => y < 3 ? '#e87a64' : '#d8584a');
    G.ell(8, 5, 4.6, 2.2, (x, y) => y < 5 ? '#fbf0dc' : '#efe0c4');
    _obPat(G, 6, 4, ['.b.b', 'b...', '.bb.'], { b: '#c89a78' });
    G.rect(2, 7, 12, 1, '#b04038');
  }, [[2, 13, 9, .28]]));
}

// gold cat statue + stone pedestal (shared by both statue states)
function _obStatue(G) {
  const P = _obP, GP = _obGOLD, EYE = '#5a3008';
  G.rect(2, 38, 28, 3, '#c4c2b8'); G.rect(2, 38, 28, 1, '#dcdad0'); G.rect(3, 41, 26, 4, '#a8a8a0'); G.rect(3, 44, 26, 1, '#8a8a84');
  G.rect(11, 41, 10, 3, '#8a2a22'); [13, 16, 19].forEach(x => G.set(x, 42, '#ffd23f'));
  G.ell(15, 30.5, 9.8, 8, _obLit(GP, 12, 27, 12, 10, { base: .66, lx: .32 }));               // body
  G.ell(26, 16, 2.8, 6, _obLit(GP, 25, 14, 3.5, 6, { base: .6, lx: .3 }));                    // raised arm
  G.ell(26.5, 8.4, 3.6, 3.4, _obLit(GP, 25.5, 7.4, 4, 3.8, { base: .76, lx: .3 }));          // raised paw, palm forward
  G.set(25, 9, '#f0a080'); G.set(26, 9, '#f0a080'); G.set(27, 9, '#f0a080'); G.set(26, 10, '#f0a080');
  G.set(24, 6, '#f0a080'); G.set(26, 5, '#f0a080'); G.set(28, 6, '#f0a080');                  // toe pads
  G.tri(5.5, 12, 7.5, 2.5, 13, 8.5, GP[4]); G.tri(17, 8.5, 21.5, 2.5, 23.5, 12, GP[3]);       // ears
  G.tri(7.6, 10, 8.2, 5.5, 11.6, 8.6, '#e8805a'); G.tri(18.4, 8.6, 21, 5.5, 21.6, 10, '#c86a4a');
  _obSep(G, 15, 16, 10.6, 8.9, GP[1]);                                                         // dark rim where head meets ears / arm
  G.ell(15, 16, 9.8, 8.2, _obLit(GP, 12, 12, 12, 10, { base: .68, lx: .32 }));                // head
  G.rect(6, 22, 18, 2, '#c8463a'); G.rect(7, 22, 16, 1, '#e0604a');                           // collar + bell
  G.ell(15, 25.4, 2.2, 2.2, GP[5]); G.set(14, 24, GP[6]); G.rect(14, 26, 3, 1, GP[1]);
  _obSep(G, 10, 31.5, 4.2, 5.4, GP[1]);
  G.ell(10, 31.5, 3.4, 4.6, (x, y) => y < 30 ? GP[6] : GP[5]);                                // koban
  G.rect(8, 30, 4, 1, GP[2]); G.rect(8, 33, 4, 1, GP[2]); G.set(9, 28, '#ffffff');
  G.ell(10.5, 36.8, 3, 1.5, GP[4]);
  [[9, 16], [10, 15], [11, 15], [12, 16], [18, 16], [19, 15], [20, 15], [21, 16]].forEach(([x, y]) => G.set(x, y, EYE));   // happy eyes
  G.set(15, 18, '#d0604a'); [[13, 19], [14, 20], [15, 19], [16, 20], [17, 19]].forEach(([x, y]) => G.set(x, y, EYE));       // nose + mouth
  G.set(8, 18, '#f09070'); G.set(9, 18, '#f09070'); G.set(21, 18, '#f09070'); G.set(22, 18, '#f09070');
}
function statueArt(state, p) {   // 32x48 golden maneki-neko statue, 2x2, anchor (0,48). 'covered': deep red cloth, p 0..1 = how far it slid (10 steps); 'gold': unveiled
  const cov = state === 'covered', k = cov ? clamp(Math.floor((+p || 0) * 10), 0, 9) : 10;
  return art('ob:statue:' + k, () => _obObj(32, 48, G => {
    _obStatue(G);
    if (!cov) return;
    const m = [];   // statue silhouette (above the pedestal) grown by 1px, plus a rounded lump so it looks shrouded
    for (let y = 0; y < 38; y++) for (let x = 0; x < 32; x++) {
      let on = false;
      for (let dy = -1; dy <= 1 && !on; dy++) for (let dx = -1; dx <= 1 && !on; dx++) if (G.get(x + dx, y + dy) && y + dy < 38) on = true;
      const ex = (x + .5 - 16) / 13, ey = (y + .5 - 21) / 17.5;
      if (ex * ex + ey * ey <= 1) on = true;
      if (on) m.push([x, y]);
    }
    const top = k ? 2 + k * 3.2 : -2;   // k 0 hides everything, ear tips included
    m.forEach(([x, y]) => {
      const wav = [0, 1, 1, 0, -1, -1][x % 6];
      if (y < top + wav) return;
      // one deep red cloth (stage M: red / white stripes read as a popcorn bucket): soft vertical folds, lit from the left
      const s = Math.floor((x + 100 + (y > 30 ? (x - 16) * .15 : 0)) / 4) & 1, edge = (x & 3) === 3;
      let col = s ? '#d24a3e' : '#c0403a';
      if (x < 10 && s && !edge) col = '#e0604e';
      if (edge) col = '#962e28';
      if (x > 20 && !edge) col = s ? '#b83a32' : '#a8352e';
      if (y > 33 && ((x + y) & 3) === 0) col = '#86281f';
      G.set(x, y, col);
    });
    if (k > 0) {   // the cloth bunches on the pedestal as it slides
      G.ell(16, 36.6, 14.2, 1.4 + k * .22, (x, y) => {   // bunched folds: the same cloth, every other row in shade
        const fold = ((y + ((x >> 3) & 1)) & 1) === 0, wht = (Math.floor((x + 100) / 4) & 1) === 1;
        return wht ? (fold ? '#a8362e' : '#d24a3e') : (fold ? '#8e2c26' : '#c0403a');
      });
      for (let x = 0; x < 32; x++) { const y = Math.floor(top + [0, 1, 1, 0, -1, -1][x % 6]); if (G.get(x, y)) G.set(x, y, (x & 1) ? '#ffd23f' : '#c8463a'); }
    } else {
      for (let x = 4; x < 29; x++) if (G.get(x, 24)) G.set(x, 24, (x & 1) ? '#ffd23f' : '#c8463a');   // cord round the neck
      _obPat(G, 13, 23, ['.Y.Y.', 'YYYYY', '.R.R.', 'R...R'], { Y: '#ffd23f', R: '#c8463a' });
    }
  }, [[2, 30, 47, .34], [1, 31, 46, .16]], cov ? null : (x, px) => {
    px('rgba(255,255,255,.95)', [[11, 9], [12, 26], [24, 7]]); px('rgba(255,255,255,.55)', [[10, 10], [12, 9], [9, 26]]);
  }));
}

function tubArt(frame) {   // 16x18 hinoki soaking tub (suite), 1x1, anchor (0,18); frame 0/1 = steam, 2 = still (no steam)
  const f = clamp(frame | 0, 0, 2);
  return art('ob:tub:' + f, () => _obObj(16, 18, G => {
    const Q = _obQ;
    for (let y = 7; y <= 15; y++) {
      const x0 = y === 15 ? 3 : y === 14 ? 2 : 1, x1 = 15 - x0;
      for (let x = x0; x <= x1; x++) G.set(x, y, (x % 3 === 0) ? Q.hinD : x < 5 ? Q.hinL : Q.hin);
    }
    G.rect(1, 9, 14, 1, Q.hoop); G.rect(2, 13, 12, 1, Q.hoop); G.set(2, 9, '#e09050'); G.set(3, 13, '#e09050');
    G.ell(8, 6.5, 7, 3, Q.hinL); G.ell(8, 6.6, 5.6, 2, (x, y) => y < 6 ? '#9ae4e8' : '#62c4cc');
    G.set(5, 6, '#e8fbf8'); G.set(6, 6, '#e8fbf8'); G.set(10, 7, '#8ad8de');
  }, [[2, 13, 17, .32]], f < 2 ? (x, px) => { _obSteam(px, 5, 5, 5, f); _obSteam(px, 9, 5, 6, f + 1); _obSteam(px, 12, 6, 4, f); } : null));
}

// ------------------------------------------------------------ garden
function shishiArt(frame) {   // 16x18 shishi-odoshi (bamboo deer-scarer), 1x1, anchor (0,18); frame 0 = filling (mouth up), 1 = tipped (mouth down)
  const f = frame ? 1 : 0;
  return art('ob:shishi:' + f, () => _obObj(16, 18, G => {
    const P = _obP, B = '#94c850', BL = '#c4e88a', BD = '#5a8a30';
    G.ell(4.5, 14, 4.4, 2, _obLit(['#5e5e60', '#7a7a78', '#8a8a84', '#a8a8a0', '#c4c2b8'], 4, 13, 4.6, 2.4));   // stone basin
    G.ell(4.5, 13.7, 2.8, 1, '#3a7a8a'); G.set(3, 13, '#8ad0dc');
    G.ell(14, 14.4, 1.8, 1.4, '#a8a8a0'); G.set(13, 14, '#c4c2b8');                                              // striking stone
    G.rect(8, 8, 1, 8, P.dk); G.rect(11, 8, 1, 8, P.dk2); G.set(8, 7, P.dkL); G.set(11, 7, P.dk);                 // pivot stakes
    G.rect(0, 1, 6, 2, B); G.rect(0, 1, 6, 1, BL); G.set(3, 1, BD); G.set(3, 2, BD); G.set(5, 2, '#2a3a1a');     // feeding spout
    const [ax, ay, bx, by] = f ? [2, 12, 15, 5] : [3, 5, 15, 12];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
    for (let i = 0; i <= n; i++) {
      const x = R(ax + (bx - ax) * i / n), y = R(ay + (by - ay) * i / n);
      G.set(x, y - 1, BL); G.set(x, y, B); G.set(x, y + 1, BD);
    }
    const mx = R((ax + bx) / 2 + 1), my = R((ay + by) / 2 + (f ? -.5 : .5));
    G.set(mx, my - 1, BD); G.set(mx, my, BD); G.set(mx, my + 1, '#3a6a20');                                      // node ring
    G.set(ax, ay - 1, '#2a3a1a'); G.set(ax, ay, '#2a3a1a');                                                       // open mouth
    G.set(9, R(ay + (by - ay) * (9.5 - ax) / (bx - ax)), P.dkL); G.set(10, R(ay + (by - ay) * (9.5 - ax) / (bx - ax)), P.dkL);   // pin
  }, [[1, 15, 17, .28]], (x, px) => {
    if (!f) px('rgba(150,220,240,.9)', [[5, 3]]);
    else px('rgba(150,220,240,.85)', [[2, 13], [1, 12]]);
  }));
}

function rockArt(k) {   // 16x12 dry-garden rock, 1x1, anchor (0,12); k 0 = upright, 1 = low and wide
  k = k ? 1 : 0;
  return art('ob:rock:' + k, () => _obObj(16, 12, G => {
    const RP = ['#4a4a52', '#5c5c64', '#707078', '#868688', '#9e9c98', '#b8b6ae'];
    const M = new Grid(16, 12), ON = '#000000';
    if (!k) { M.ell(8, 7, 5.8, 3.2, ON); M.tri(3, 7, 6.5, .6, 11.5, 6, ON); M.tri(6, 1, 9.5, 2.5, 12, 7, ON); }
    else { M.ell(9.5, 7.4, 5.8, 2.6, ON); M.ell(3.5, 8.2, 2.6, 1.7, ON); }
    const pk = k ? _obLit(RP, 8.5, 6.4, 6.5, 3.2, { base: .66, lx: .35 }) : _obLit(RP, 7, 4.6, 6, 5.6, { base: .66, lx: .35 });
    for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) if (M.get(x, y)) G.set(x, y, pk(x, y));
    if (!k) { G.set(5, 4, '#6a9a4a'); G.set(6, 3, '#84b05a'); G.set(4, 5, '#5a8a3a'); G.set(9, 6, '#5c5c64'); G.set(10, 7, '#5c5c64'); }
    else { G.set(8, 5, '#6a9a4a'); G.set(9, 5, '#84b05a'); G.set(7, 6, '#5a8a3a'); }
  }, [[2, 14, 11, .3]]));
}

function yukimiArt() {   // 16x22 snow-viewing stone lantern (yukimi-doro): wide umbrella roof, three splayed legs; 1x1, anchor (0,22)
  return art('ob:yukimi', () => _obObj(16, 22, G => {
    const P = _obP, S = P.st, SD = P.stD, SL = P.stL;
    G.rect(7, 14, 2, 5, SD);                                                                     // back leg
    [[3, 14], [3, 15], [3, 16], [2, 17], [2, 18], [1, 19]].forEach(([x, y]) => { G.set(x, y, SL); G.set(x + 1, y, S); G.set(x + 2, y, S); });
    [[11, 14], [11, 15], [11, 16], [12, 17], [12, 18], [13, 19]].forEach(([x, y]) => { G.set(x, y, S); G.set(x + 1, y, S); G.set(x + 2, y, SD); });
    G.rect(1, 19, 3, 1, SD); G.rect(13, 19, 3, 1, '#6e6e6a');                                    // feet
    G.rect(2, 13, 12, 1, S); G.rect(2, 13, 6, 1, SL);                                            // ring under the fire box
    G.rect(5, 9, 6, 4, S); G.rect(5, 9, 6, 1, SD);                                               // fire box
    G.rect(6, 10, 4, 2, '#ffd27a'); G.rect(7, 10, 2, 1, '#fff2c0'); G.rect(6, 11, 4, 1, '#f0a850');
    [[6, 3, 9], [4, 4, 11], [2, 5, 13], [1, 6, 14], [0, 7, 15]].forEach(([x0, y, x1]) => {      // wide, low umbrella roof
      for (let x = x0; x <= x1; x++) G.set(x, y, x < 7 - (y - 3) * .4 ? SL : x > 10 + (y - 3) * .6 ? SD : S);
    });
    G.rect(1, 8, 14, 1, '#6e6e6a');                                                              // roof underside
    G.rect(7, 1, 2, 2, S); G.set(7, 1, SL);                                                      // knob
    G.set(2, 6, P.grassD); G.set(3, 5, P.grass); G.set(13, 7, P.grassD);
  }, [[0, 15, 21, .3]]));
}

function gardenLampArt(lit) {   // 10x24 garden path lamp (wood post + square paper shade), anchor (5,24); lit = warm paper
  const on = !!lit;
  return art('ob:glamp:' + (on ? 1 : 0), () => _obObj(10, 24, G => {
    const P = _obP;
    G.rect(4, 11, 2, 10, P.dk); G.set(4, 11, P.dkL); G.rect(4, 12, 1, 9, P.dkL);
    G.rect(2, 20, 6, 2, P.stD); G.rect(2, 20, 6, 1, P.stL);
    for (let y = 3; y <= 9; y++) for (let x = 2; x <= 7; x++) {
      const d = Math.abs(x + .5 - 5) / 3 + Math.abs(y + .5 - 6) / 4 + (DITHER[y & 1][x & 1] - .375) * .3;
      G.set(x, y, on ? (d < .5 ? '#fffbe6' : d < .95 ? '#ffeaa8' : P.glow) : (d < .7 ? '#f0ece0' : '#dcd6c6'));
    }
    G.rect(2, 3, 1, 7, P.dk); G.rect(7, 3, 1, 7, P.dk); G.rect(2, 10, 6, 1, P.dk); G.rect(3, 6, 4, 1, on ? '#e8b860' : '#c8c0ae');
    G.rect(1, 2, 8, 1, P.dk); G.rect(2, 1, 6, 1, P.dk2); G.rect(1, 2, 8, 1, P.dk);
  }, [[2, 7, 23, .32]]));
}

// v2.0.1 (A4): the star-view bath's lanterns are bamboo (take-akari): three cut culms of different heights in a little
// stand of pebbles, light showing through carved holes when lit
function deckLanternArt(lit) {   // 12x24 bamboo lantern, anchor (6,24); lit = warm light in the carved holes
  const on = !!lit;
  return art('ob:dlamp:' + (on ? 1 : 0), () => _obObj(12, 24, G => {
    const SK = ['#c4e48c', '#94c860', '#74ac48', '#6aa040', '#5a9038', '#4a7c30', '#3a6428'];   // lit edge -> shaded edge
    const tube = (x0, w, top, bot, nodes) => {   // a culm cut at a slant (higher on the left), hollow showing at the cut
      for (let y = top; y <= bot; y++) for (let x = x0; x < x0 + w; x++) {
        const e = x - x0, cut = top + Math.round(e * 3 / w);
        if (y < cut) continue;
        let c = SK[Math.min(SK.length - 1, Math.round(e * (SK.length - 1) / (w - 1)))];
        if (y === cut) c = '#e8f4c8'; else if (y === cut + 1 && e > 0 && e < w - 1) c = '#3a4a24';   // the cut rim, the hollow
        if (nodes.indexOf(y) >= 0) c = mixHex(c, '#2e5222', .6); else if (nodes.indexOf(y - 1) >= 0) c = mixHex(c, '#d8f0a8', .35);
        G.set(x, y, c);
      }
    };
    tube(7, 4, 9, 21, [15]);          // a short one behind, on the right
    tube(2, 6, 3, 21, [10, 17]);      // the lantern
    const hole = on ? ['#fff6c8', '#ffc860'] : ['#2e3a22', '#3e4a2c'];
    [[4, 6], [5, 6], [4, 7], [5, 7]].forEach(([x, y]) => G.set(x, y, hole[0]));                 // a round window
    [[4, 12], [5, 13], [4, 14], [5, 12], [5, 14], [4, 13]].forEach(([x, y], i) => G.set(x, y, hole[i < 3 ? 0 : 1]));   // a crescent
    G.set(8, 12, hole[1]); G.set(8, 13, hole[0]);
    G.rect(1, 21, 10, 1, '#8a8a84'); G.rect(1, 20, 2, 1, '#a8a8a0'); G.rect(9, 20, 2, 1, '#9a9a94');   // pebbles at the foot
  }, [[1, 11, 23, .32]], on ? (x, px) => { px('rgba(255,236,170,.55)', [[3, 6], [6, 7], [3, 13], [6, 13]]); } : null));
}

function koiArt(col, frame) {   // 9x5 koi seen from above, facing right, centre anchor (4,2); col 'red' | 'gold' | 'black'; frame 0/1 tail swish
  col = col === 'gold' || col === 'black' ? col : 'red';
  const f = frame ? 1 : 0;
  return art('ob:koi:' + col + ':' + f, () => {
    const c = mk(9, 5), x = c.getContext('2d');
    const rs = f ? ['t..f.....', '.tbBBBb..', '.tBBBBBHh', '..bBBBb..', '...f.....'] : ['...f.....', 't.bBBBb..', '.tBBBBBHh', 't.bBBBb..', '...f.....'];
    const PAL = {
      red: { B: '#f8f4ee', b: '#e0d8cc', H: '#e8452e', h: '#f0c0b0', t: 'rgba(255,240,230,.8)', f: 'rgba(255,240,230,.7)', s: '#e8452e' },
      gold: { B: '#f8c838', b: '#e0a020', H: '#ffe070', h: '#fff0a0', t: 'rgba(255,236,150,.85)', f: 'rgba(255,236,150,.7)' },
      black: { B: '#2e2e36', b: '#1c1c22', H: '#44444e', h: '#8a8a96', t: 'rgba(220,224,236,.75)', f: 'rgba(220,224,236,.65)', s: '#e07a3a' },
    }[col];
    rs.forEach((r, j) => [...r].forEach((ch, i) => { if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); } }));
    if (col === 'red') { x.fillStyle = PAL.s; x.fillRect(4, 1, 2, 1); x.fillRect(3, 2, 2, 1); }
    if (col === 'black') { x.fillStyle = PAL.s; x.fillRect(6, 3, 1, 1); }
    return c;
  });
}

function flowerPotArt(k) {   // 12x14 flower pot for the plaza, 1x1, anchor (0,14); k 0 terracotta + red, 1 blue + yellow, 2 wooden box + purple
  k = clamp(k | 0, 0, 2);
  return art('ob:fpot:' + k, () => _obObj(12, 14, G => {
    const P = _obP, LP = [P.leafD, P.leafD, P.leaf, P.leaf, P.leafL, P.leafLL];
    G.ell(6, 5.5, 4.6, 3.4, _obLit(LP, 5.4, 4.6, 5, 3.8));
    const FC = [['#e8403a', '#ff8a7a'], ['#ffd23f', '#fff2a8'], ['#9a6ad8', '#e8dcff']][k];
    [[3, 4], [6, 3], [9, 5], [5, 6], [8, 7], [3, 7]].forEach(([x, y], i) => { G.set(x, y, FC[0]); G.set(x + 1, y, FC[i & 1]); G.set(x, y - 1, FC[1]); });
    if (k === 2) { G.rect(1, 8, 10, 4, P.wood); G.rect(1, 8, 10, 1, P.woodL); G.rect(1, 10, 10, 1, P.woodD); G.rect(1, 11, 10, 1, P.dk); }
    else {
      const PC = k ? ['#3a6aaa', '#6a9ada', '#2a4a80'] : ['#c8643a', '#e8885a', '#9a4a2a'];
      G.rect(2, 8, 8, 2, PC[1]); G.rect(3, 10, 6, 2, PC[0]); G.rect(3, 11, 6, 1, PC[2]); G.set(3, 10, PC[1]);
    }
  }, [[2, 10, 13, .3]]));
}

// ------------------------------------------------------------ v2.0.1 lower garden (FEEDBACK A3)
function tsukubaiArt() {   // 16x18 stone water basin: round basin, a bamboo spout dripping into it, a ladle across; 1x1, anchor (0,18)
  return art('ob:tsukubai', () => _obObj(16, 18, G => {
    const RP = ['#5e5e60', '#7a7a78', '#8a8a84', '#a8a8a0', '#c4c2b8'];
    G.ell(3.2, 15.6, 2.8, 1.5, _obLit(RP, 2.6, 15, 3.2, 2));                              // front stone
    G.ell(8.5, 12.4, 5.8, 3.8, _obLit(RP, 7.4, 11.2, 6.4, 4.4, { base: .66, lx: .35 }));   // the basin
    G.ell(8.5, 10.8, 4.2, 1.9, '#4a4c50');
    G.ell(8.5, 11.1, 3.4, 1.4, (x, y) => (y < 11 ? '#5ab4a4' : '#3a9688'));               // water
    G.set(7, 10, '#c8f0e4'); G.set(4, 13, '#6a9a4a'); G.set(5, 14, '#84b05a'); G.set(12, 14, '#5a8a3a');   // moss
    G.rect(14, 3, 1, 10, '#7cb04a'); G.set(14, 3, '#a8d070'); G.rect(15, 4, 1, 9, '#4e7e30');   // the stake
    for (let x = 9; x <= 14; x++) { G.set(x, 5, '#a8d070'); G.set(x, 6, '#5a8a3a'); }        // the spout
    G.set(9, 6, '#2a3a1a');
    gLine(G, 2, 9, 10, 8, '#c8a060'); G.ell(2.5, 9.6, 1.6, 1, '#b08848');                  // a ladle laid across
  }, [[2, 15, 17, .3]], (x, px) => { px('rgba(170,230,240,.9)', [[9, 7], [9, 8]]); px('rgba(255,255,255,.7)', [[9, 9]]); }));
}
// tea-ceremony red bench (the lobby's bench) under a big red parasol, a cat asleep on the felt: 36x46, footprint 2x1
// (drawObj centres it: 2 px either side of the two tiles), anchor = bottom-left of the footprint
function nodateArt(fur) {
  return art('ob:nodate:' + (fur || ''), () => {
    const c = mk(36, 46), x = c.getContext('2d');
    x.drawImage(paint(36, 46, G => {
      G.rect(26, 12, 1, 31, '#8a6246'); G.rect(27, 12, 1, 31, '#4a3024');   // the pole
      const cx = 22, cy = 10, rx = 15.5, ry = 6.4;
      for (let y = 0; y < 22; y++) for (let px = 0; px < 36; px++) {
        const nx = (px + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny;
        if (d <= 1) {
          const a = Math.atan2(ny, nx), rib = Math.abs(((a / (Math.PI / 6)) % 1 + 1) % 1 - .5) > .42;
          const v = -nx * .35 - ny * .55 + (DITHER[y & 1][px & 1] - .375) * .2;
          G.set(px, y, rib ? '#e86a60' : v > .35 ? '#e04848' : v > -.2 ? '#c8323a' : '#a8262e');
        } else if (y > cy && ((px + .5 - cx) / rx) ** 2 + ((y - 1.5 - cy) / ry) ** 2 <= 1) G.set(px, y, (px & 1) ? '#7a1a20' : '#d8b878');   // the underside, bamboo ribs
      }
      G.rect(21, 3, 3, 2, '#3a2418'); G.set(22, 3, '#6a4a2a');   // finial
    }), 0, 0);
    x.drawImage(benchArt(), 2, 30);
    if (fur) x.drawImage(catCurl(fur), 4, 28);
    return c;
  });
}

function chestArt(level) {   // 16x16 money chest at the front desk, anchor (8,14); level 1 wooden coin box, 2 = gold showing + soft warm glow
  const lv = level >= 2 ? 2 : 1;
  return art('ob:chest:' + lv, () => {
    const c = mk(16, 16), x = c.getContext('2d');
    if (lv === 2) for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {   // steady glow: two dithered rings, no animation
      const d = Math.hypot((i + .5 - 8) / 8, (j + .5 - 8.5) / 7.5);
      if (d > 1) continue;
      const a = d > .86 ? (((i + j) & 1) ? .12 : 0) : .2;
      if (a) { x.fillStyle = 'rgba(255,214,90,' + a + ')'; x.fillRect(i, j, 1, 1); }
    }
    x.drawImage(_obObj(16, 16, G => {
      const P = _obP;
      G.rect(2, 7, 12, 5, '#7a4426'); G.rect(2, 11, 12, 1, '#5a3018');
      if (lv === 2) {
        G.rect(2, 2, 12, 2, '#8a5030'); G.rect(3, 1, 10, 1, '#a86a40'); G.rect(2, 4, 12, 1, '#5a3018');
        _obPat(G, 2, 5, ['.YLY.YLY.YLY', 'YYYYYYYYYYYY'], { Y: P.gold, L: '#fff2a8' });
      } else { G.rect(2, 4, 12, 3, '#8a5030'); G.rect(3, 3, 10, 1, '#a86a40'); G.rect(2, 6, 12, 1, '#5a3018'); }
      [4, 11].forEach(sx => G.rect(sx, lv === 2 ? 1 : 3, 1, lv === 2 ? 11 : 9, '#2e2a30'));
      [[2, 7], [13, 7], [2, 11], [13, 11]].forEach(([cx, cy]) => G.set(cx, cy, P.gold));
      G.rect(7, 8, 2, 3, P.gold); G.set(7, 9, '#8a5a10'); G.set(8, 8, '#fff2a8');
    }, [[2, 13, 13, .32]]), 0, 0);
    return c;
  });
}

// ------------------------------------------------------------ VIP keepsakes
function giftArt(id) {   // 8x8 VIP gift for the lobby shelf / album, centre anchor: 'book' | 'hand' | 'pin' | 'ship' | 'photo' | 'bowl'
  const K = ['book', 'hand', 'pin', 'ship', 'photo', 'bowl'];
  if (K.indexOf(id) < 0) id = 'book';
  return art('ob:gift:' + id, () => paint(8, 8, G => {
    if (id === 'book') { G.rect(1, 1, 5, 6, '#3a8a5a'); G.rect(1, 1, 1, 6, '#2a6a44'); G.rect(6, 2, 1, 5, '#f4ecd8'); G.rect(2, 3, 4, 1, '#ffd23f'); G.set(3, 5, '#8ac8a0'); }
    else if (id === 'hand') {   // sumo hand-print board: cream with gold edges, a red paw print
      G.rect(1, 1, 6, 6, '#fbf4e0'); G.rect(1, 1, 6, 1, '#e8b838'); G.rect(1, 6, 6, 1, '#e8b838');
      _obPat(G, 2, 2, ['.X.X.', 'X...X', '.XXX.', '.XXX.'], { X: '#c8302a' });
    } else if (id === 'pin') {
      G.set(1, 6, '#c88a18'); G.set(2, 5, '#f0b830'); G.set(3, 4, '#f0b830'); G.set(4, 3, '#ffd23f');
      G.ell(5, 2.5, 1.8, 1.6, '#ff7a9a'); G.set(5, 2, '#fff2a8'); G.set(6, 5, '#ff7a9a'); G.set(6, 6, '#ffffff');
    } else if (id === 'ship') {
      G.rect(1, 5, 6, 1, '#8a5a3a'); G.rect(2, 6, 4, 1, '#6a4028'); G.rect(3, 1, 1, 4, '#5a3420');
      G.tri(4, 1, 4, 4.5, 6.8, 4.5, '#f4f0e6'); G.set(3, 0, '#e8453c'); G.set(2, 4, '#f4f0e6');
    } else if (id === 'photo') { G.rect(1, 1, 6, 6, '#8a5a3a'); G.rect(2, 2, 4, 4, '#bfe0f0'); G.set(3, 3, '#ffd23f'); G.set(4, 4, '#2a2228'); G.set(5, 3, '#2a2228'); G.set(2, 5, '#2a2228'); }
    else { G.ell(4, 4.6, 3.2, 2.6, (x, y) => y < 4 ? '#8ab840' : '#5a3a3a'); G.rect(1, 4, 6, 1, '#7a5050'); G.rect(3, 7, 2, 1, '#4a2a2a'); G.set(2, 5, '#7a5a5a'); }
  }, 'plain'));
}

function polaroidArt() {   // 12x14 instant-photo frame, centre anchor; core draws the 8x8 face at (2,2) over the pale-blue window
  return art('ob:polaroid', () => {
    const c = mk(12, 14), x = c.getContext('2d'), px = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    px('#5a5a6a', 1, 0, 10, 1); px('#5a5a6a', 1, 13, 10, 1); px('#5a5a6a', 0, 1, 1, 12); px('#5a5a6a', 11, 1, 1, 12);
    px('#fbfbf6', 1, 1, 10, 12); px('#e4e2da', 1, 12, 10, 1); px('#e4e2da', 10, 1, 1, 12);
    px('#bfe0f0', 2, 2, 8, 8); px('#d8eef8', 2, 2, 8, 2);
    return c;
  });
}

function wishBoardArt() {   // 40x14 wooden wish board over a suite door, anchor (20,14); three 10x10 empty slots at x = 3 / 15 / 27, y = 2
  return art('ob:wish', () => _obObj(40, 14, G => {
    const P = _obP;
    G.rect(1, 1, 38, 12, P.wood); G.rect(1, 1, 38, 1, P.woodL); G.rect(1, 12, 38, 1, P.woodD);
    G.set(1, 1, P.woodD); G.set(38, 1, P.woodD);
    [3, 15, 27].forEach(sx => { G.rect(sx, 2, 10, 10, '#fff3d0'); G.rect(sx, 2, 10, 1, '#d8c090'); G.rect(sx, 2, 1, 10, '#e8d4a8'); });
    [13, 25].forEach(sx => { G.set(sx + 1, 4, P.red); G.set(sx + 1, 9, P.red); });
  }));
}

// ============================================================ v2.1 "four seasons" objects (SPEC_v2 16.14 objects / icons)
// Same rules as the v2.0 objects above. Seasonal room decor (16.1), 16x22, anchor (0,22), drawn through decorArt():
//   d_sakura   spring: a sakura branch in a tall indigo vase      d_lantern  spring: bonbori (paper lantern on a red stand)
//   d_windbell summer: glass wind bell on a hanger (strip sways)  d_fan      summer: two uchiwa fans in a bamboo holder
//   d_momiji   autumn: a little maple in a cream pot               d_dango    autumn: moon-viewing dumplings + pampas grass
//   d_kotatsu  winter: kotatsu, red quilt (a cat's tail sways)    d_mikan    winter: a basket of mandarins
// Also here: gardenDecorArt (16.7), stallArt (16.9), fireworkArt (16.2 / 16.9). Icons + keepsakes are in objects-ui.js.

// like _obObj, but the shadow / post / under passes come from get() AFTER fn ran (one function draws several variants and
// sets them per variant). under(x, px) paints ground patches (raked gravel) beneath the contact shadow and the sprite.
function _obObjL(w, h, fn, get) {
  const p = paint(w, h, fn, true), c = mk(w, h), x = c.getContext('2d'), [sh, post, under] = get();
  const px = (col, pts) => { x.fillStyle = col; pts.forEach(([i, j]) => x.fillRect(i, j, 1, 1)); };
  if (under) under(x, px);
  (sh || []).forEach(([x0, x1, y, a]) => { x.fillStyle = 'rgba(46,24,30,' + (a || .3) + ')'; x.fillRect(x0, y, x1 - x0 + 1, 1); });
  x.drawImage(p, 0, 0);
  if (post) post(x, px);
  return c;
}
const _obSAK = ['#a8506e', '#c66a88', '#de86a0', '#eea2b8', '#f8c0d0', '#fde0ea'];
const _obMIK = ['#b04c0e', '#d06a18', '#ea8424', '#f6a034', '#ffc05a', '#ffd88a'];
function _obDecor21(id, f) {
  const P = _obP, Q = _obQ;
  let post = null, sh = [[2, 13, 21, .3]];
  const fn = G => {
    if (id === 'd_sakura') {
      G.rect(3, 18, 10, 2, Q.blk); G.rect(3, 18, 10, 1, Q.blkL);                                             // lacquer stand
      G.ell(8, 15, 3.4, 3.1, _obLit(['#1e3058', '#26386a', '#2f4a7a', '#3a5a90', '#5a7aba'], 7, 14, 3.6, 3.4)); // tall indigo vase
      G.rect(7, 11, 2, 2, '#2f4a7a'); G.set(7, 11, '#3a5a90'); G.rect(6, 10, 4, 1, '#5a7aba');
      G.set(6, 15, '#7a9ad0'); G.set(6, 16, '#5a7aba');
      const BR = '#5a3828';                                                                                  // the branch
      [[8, 10, 7, 7], [7, 7, 4, 4], [4, 4, 2, 2], [7, 7, 6, 5], [8, 10, 10, 6], [10, 6, 12, 3], [12, 3, 14, 2], [10, 6, 13, 7]].forEach(([a, b, c, d]) => gLine(G, a, b, c, d, BR));
      [[2.4, 2.4, 1.8, 1.5], [5.6, 2, 1.4, 1.2], [6.2, 5.2, 1.2, 1], [3.4, 5.8, 1.2, 1.1], [11.4, 2, 1.6, 1.3], [14, 3.6, 1.4, 1.2],
        [9.4, 4.2, 1.2, 1.1], [13.4, 7.2, 1.4, 1.1], [1.6, 5, 1, 1]].forEach(([cx, cy, rx, ry]) => G.ell(cx, cy, rx, ry, _obLit(_obSAK, cx - .4, cy - .5, rx + .3, ry + .3, { base: .7, lx: .3 })));
      post = (x, px) => { px('#ffffff', [[2, 2], [5, 1], [11, 1], [13, 3]]); px('#d8406a', [[3, 3], [11, 2], [14, 4]]); };
    } else if (id === 'd_lantern') {   // bonbori: a silk shade on a red-lacquer pole, sakura crest, warm and steady (no flicker)
      G.ell(8, 18.8, 4.6, 1.5, (x, y) => y < 18 ? Q.blkL : Q.blk);                                           // round foot
      G.rect(7, 12, 2, 6, Q.lac); G.rect(7, 12, 1, 6, Q.lacL);                                               // pole
      for (let y = 2; y <= 11; y++) {                                                                         // shade
        const hw = y === 2 || y === 11 ? 3 : y === 3 || y === 10 ? 4 : 5;
        for (let x = 8 - hw; x < 8 + hw; x++) {
          const d = Math.abs(x + .5 - 7.4) / 5 + Math.abs(y + .5 - 6.6) / 6 + (DITHER[y & 1][x & 1] - .375) * .3;
          G.set(x, y, d < .4 ? '#fffbea' : d < .7 ? '#ffeef0' : d < .95 ? '#ffd8de' : '#f4b8c4');
        }
      }
      G.rect(5, 1, 6, 1, Q.lac); G.rect(4, 2, 8, 1, Q.lacD); G.rect(7, 0, 2, 1, Q.lacD);                     // cap + finial
      G.rect(4, 11, 8, 1, Q.lacD); G.rect(5, 12, 6, 1, Q.lac);                                               // bottom ring
      _obPat(G, 6, 5, ['.P.P', 'PPPP', '.PyP', 'P..P'], { P: '#e8789a', y: '#ffd23f' });                      // sakura crest
      G.set(3, 5, '#f8c8d0'); G.set(12, 5, '#e8a0b0'); G.set(12, 6, '#e8a0b0');
    } else if (id === 'd_windbell') {   // furin: glass dome painted with a goldfish, paper strip on the clapper; f sways the strip
      G.rect(10, 18, 5, 2, P.dk); G.rect(10, 18, 5, 1, P.dkL);                                               // hanger: foot, post, arm
      G.rect(13, 2, 1, 16, P.dk); G.set(13, 2, P.dkL);
      G.rect(4, 1, 10, 2, P.dk); G.rect(4, 1, 10, 1, P.dkL);
      G.set(7, 3, '#3a2a20');                                                                                 // cord
      G.ell(7.5, 9.6, 4.1, 5.4, (x, y) => y > 9 ? null : y < 6 ? '#eef9fc' : y < 8 ? '#d4eef6' : '#bce4f0');  // glass dome
      G.rect(3, 9, 9, 1, '#4a8ad8'); [4, 7, 10].forEach(x => G.set(x, 9, '#7ab0f0'));                         // painted rim band
      _obPat(G, 5, 6, ['.RRr', 'RRR.', '.R..'], { R: '#e8452e', r: '#ffb060' });                              // a goldfish painted on the glass
      G.set(7, 10, '#5a4a40'); G.set(7, 11, '#5a4a40');                                                       // clapper string
      const sx = f ? [7, 7, 8, 8, 8, 9] : [7, 7, 7, 6, 6, 6];                                                 // paper strip (tanzaku)
      sx.forEach((x, i) => { G.set(x, 12 + i, i === 5 ? '#e8b0c0' : '#fbe6ee'); G.set(x + 1, 12 + i, '#f4c8d8'); });
      sh = [[9, 15, 21, .3]];
      post = (x, px) => { px('rgba(255,255,255,.95)', [[5, 5], [4, 6]]); px('rgba(255,255,255,.55)', [[4, 7], [6, 4]]); };
    } else if (id === 'd_fan') {   // two uchiwa in a woven holder: water + goldfish, cream + morning glory
      gLine(G, 7, 13, 5, 9, '#c8a060'); gLine(G, 8, 13, 10, 8, '#c8a060');                                  // handles
      G.ell(4.6, 5.6, 3.7, 3.6, (x, y) => (y > 6 ? '#78bce6' : '#b4def4'));                                   // left fan
      [[2, 7], [4, 7], [6, 7], [3, 8], [5, 8]].forEach(([x, y]) => G.set(x, y, '#4a8ad8'));
      _obPat(G, 3, 4, ['rRR', '.R.'], { R: '#ff6a2a', r: '#ffb060' });
      _obSep(G, 11.4, 4.8, 4.5, 4.4, '#8a7a6a');
      G.ell(11.4, 4.8, 3.7, 3.6, (x, y) => (x + y < 14 ? '#fff8ea' : '#f0e4cc'));                             // right fan
      G.ell(11.6, 4.4, 1.7, 1.6, '#6a74e0'); G.set(11, 4, '#e8eaff'); G.set(12, 4, '#a8b0f8'); G.set(9, 6, P.leaf); G.set(10, 7, P.leafD); G.set(13, 7, P.leaf);
      for (let y = 13; y <= 19; y++) for (let x = (y > 17 ? 5 : 4); x <= (y > 17 ? 10 : 11); x++) G.set(x, y, y === 13 ? P.weaveL : (((x + (y & 1) * 2) >> 1) & 1) ? P.weave : P.weaveD);
      G.rect(5, 19, 6, 1, P.weaveDk);
      sh = [[3, 12, 21, .3]];
    } else if (id === 'd_momiji') {   // a little maple tree in a cream glazed pot
      G.rect(2, 18, 12, 2, P.dk); G.rect(2, 18, 12, 1, P.dkL);
      G.rect(3, 14, 10, 1, '#f8f0dc'); G.rect(4, 15, 8, 2, '#e4d8bc'); G.rect(5, 17, 6, 1, '#c4b494'); G.set(4, 15, '#f4ecd8'); G.set(6, 16, '#5a7aba'); G.set(9, 15, '#5a7aba');
      G.rect(4, 13, 8, 1, '#6a4a30');
      [[8, 12], [8, 11], [7, 10], [7, 9], [6, 8], [5, 8], [8, 9], [9, 8], [10, 8], [11, 7], [7, 7], [8, 6]].forEach(([x, y]) => G.set(x, y, '#6a4632'));
      const MP = ['#8a2a1e', '#ae3a22', '#cc5226', '#e4702c', '#f29a40', '#fac46a'];
      [[4.2, 6.2, 3.4, 2.4], [11.6, 6.4, 3.2, 2.3], [8, 2.9, 3.9, 2.4]].forEach(([cx, cy, rx, ry], i) => {
        if (i) _obSep(G, cx, cy, rx + .8, ry + .8, '#7a2418');
        G.ell(cx, cy, rx, ry, _obLit(MP, cx - .7, cy - .9, rx + .5, ry + .5, { base: .66, lx: .4 }));
      });
      [[1, 5], [14, 5], [8, 0], [3, 8], [12, 8]].forEach(([x, y]) => G.set(x, y, '#e4702c'));                  // leaf tips
      [[3, 5], [6, 5], [10, 6], [13, 6], [7, 2], [10, 2]].forEach(([x, y]) => G.set(x, y, '#fac46a'));
      post = (x, px) => { px('#e4702c', [[3, 18], [12, 19]]); px('#f29a40', [[11, 18]]); };
    } else if (id === 'd_dango') {   // tsukimi: a pyramid of white dumplings on a sanbo stand, pampas grass behind
      G.ell(11.4, 4.2, 3.3, 3.2, (x, y) => (x + .5 - 11.4) + (y + .5 - 4.2) < -1 ? '#fff6c8' : '#f6dc8a');     // the full moon behind
      gLine(G, 3, 13, 3, 5, '#8a8a4a'); gLine(G, 4, 13, 5, 7, '#8a8a4a');                                      // pampas
      [[3, 4], [3, 3], [2, 2], [2, 1], [5, 6], [5, 5], [6, 4]].forEach(([x, y], n) => G.set(x, y, n & 1 ? '#e8d8a8' : '#d4bc84'));
      [[2, 4], [2, 3], [1, 2], [4, 6], [4, 5], [5, 4]].forEach(([x, y], n) => G.set(x, y, n & 1 ? '#f0e4c0' : '#c8a868'));
      G.rect(3, 13, 10, 2, '#e8d0a0'); G.rect(3, 13, 10, 1, '#f6e4bc'); G.rect(3, 14, 10, 1, '#d4b880');      // sanbo tray
      G.rect(4, 15, 8, 4, '#dcc08c'); G.rect(4, 18, 8, 1, '#b89a64'); G.ell(8, 16.8, 1.6, 1.2, '#8a6a40');    // stand + cut-out
      G.rect(3, 19, 10, 1, '#c8a870');
      [[4.4, 11.2], [8, 11.2], [11.6, 11.2], [6.2, 8], [9.8, 8], [8, 4.8]].forEach(([cx, cy]) => {
        _obSep(G, cx, cy, 2.6, 2.5, '#8e8474');
        G.ell(cx, cy, 1.85, 1.8, (x, y) => (x + .5 - cx) + (y + .5 - cy) < -.6 ? '#ffffff' : (x + .5 - cx) + (y + .5 - cy) > .9 ? '#dcd4c2' : '#f4f0e6');
      });
      sh = [[3, 13, 21, .3]];
    } else if (id === 'd_kotatsu') {   // kotatsu: wood top, a teapot, a thick red quilt; f = the cat's tail under it curls up
      for (let y = 6; y <= 18; y++) {                                                                         // the quilt round the table, draping to the floor
        const x0 = y === 6 || y === 18 ? 2 : 1, x1 = y === 6 || y === 18 ? 13 : 14;
        for (let x = x0; x <= x1; x++) {
          const band = y >= 15 && y <= 16, dot = ((x + (y >> 1) * 2) & 3) === 0 && (y & 1);
          G.set(x, y, band ? ((x + y) & 1 ? '#f0b050' : '#e09838') : y === 18 ? '#9a3028' : dot ? '#e8885a' : y < 12 ? '#d65446' : '#c8463a');
        }
      }
      G.rect(3, 5, 10, 6, P.woodL); G.rect(3, 5, 10, 1, '#ecc49a'); G.rect(3, 5, 1, 6, '#ecc49a');            // the square wood top
      G.rect(3, 11, 10, 1, P.dk); G.rect(12, 6, 1, 5, P.woodD); G.rect(4, 12, 9, 1, '#8a2a22');
      for (let x = 5; x < 12; x++) if (_obH(x, 8, 61) < .3) G.set(x, 8, P.wood);
      G.ell(6.2, 7.2, 2, 1.7, _obLit([Q.celD, Q.cel, Q.cel, Q.celL], 5.6, 6.6, 2.2, 2)); G.set(6, 5, Q.celD); G.set(3, 7, Q.cel);   // teapot
      G.rect(9, 7, 2, 2, '#f4f0e6'); G.rect(9, 7, 2, 1, Q.tea); G.set(10, 8, '#d0c8b8');                      // cup
      const TL = f ? [[8, 19], [9, 19], [10, 19], [11, 19], [12, 18], [12, 17]] : [[8, 19], [9, 19], [10, 19], [11, 19], [12, 19], [13, 18]];
      TL.forEach(([x, y], i) => G.set(x, y, i & 1 ? '#c8742a' : '#f0a048'));                                 // a cat's tail sticking out
      sh = [[2, 13, 20, .32], [3, 12, 21, .16]];
    } else {   // d_mikan: a shallow bamboo basket heaped with mandarins on a little stand
      G.rect(3, 18, 10, 2, P.dk); G.rect(3, 18, 10, 1, P.dkL);
      G.ell(8, 13.4, 6.4, 2.2, P.weaveL); G.ell(8, 13.2, 5.2, 1.3, '#6a4a2a');
      [[4.2, 12], [8, 12.2], [11.8, 12], [6.1, 9], [9.9, 9], [8, 6]].forEach(([cx, cy]) => {
        _obSep(G, cx, cy, 2.8, 2.6, '#6a2408');
        G.ell(cx, cy, 2, 1.85, _obLit(_obMIK, cx - .6, cy - .7, 2.4, 2.2, { base: .62, lx: .38 }));
      });
      for (let y = 14; y <= 17; y++) for (let x = (y > 15 ? 3 : 2); x <= (y > 15 ? 12 : 13); x++) G.set(x, y, y === 14 ? P.weaveL : (((x + (y & 1) * 2) >> 1) & 1) ? P.weave : P.weaveD);
      G.rect(3, 17, 10, 1, P.weaveDk);
      G.set(8, 4, '#3d7a3a'); G.set(9, 3, '#5a9a3a'); G.set(10, 3, '#84c060'); G.set(10, 2, '#84c060'); G.set(9, 4, '#5a9a3a');   // leaf
    }
  };
  return _obObjL(16, 22, fn, () => [sh, (x, px) => {
    if (id === 'd_mikan') { px('#ffe8b0', [[3, 11], [7, 11], [11, 11], [5, 8], [9, 8], [7, 5]]); px('#4a3020', [[8, 5]]); }
    if (post) post(x, px);
  }]);
}

// gold decor (16.6): the v2.0 maneki / daruma / tank / screen in gold. Same footprint and anchor, a static sparkle.
function _obDecorGold(id, f) {
  const P = _obP, Q = _obQ, GP = _obGOLD;
  const gl = (cx, cy, rx, ry, b) => _obLit(GP, cx, cy, rx, ry, { base: b || .66, lx: .32 });
  let post = null;
  const fn = G => {
    if (id === 'd_maneki') {
      G.rect(2, 18, 12, 2, Q.lac); G.rect(2, 18, 12, 1, Q.lacL); G.set(2, 19, GP[4]); G.set(13, 19, GP[4]);   // red-lacquer cushion
      G.ell(8, 14.4, 4.6, 3.8, gl(6.6, 12.8, 5.6, 4.6));
      G.tri(3.5, 7.5, 4.2, 3.4, 7, 5.6, GP[4]); G.tri(9, 5.6, 11.8, 3.4, 12.5, 7.5, GP[3]);
      G.set(4, 5, '#e8805a'); G.set(11, 5, '#c86a4a');
      G.ell(8, 8.8, 4.6, 3.8, gl(6.6, 7.4, 5.6, 4.6, .7));
      if (!f) { G.rect(12, 3, 2, 6, GP[5]); G.set(12, 3, '#f0a080'); G.set(13, 3, '#f0a080'); }
      else { G.rect(12, 6, 2, 4, GP[5]); G.set(13, 5, GP[5]); G.set(13, 6, '#f0a080'); }
      G.rect(4, 12, 8, 1, P.red); G.set(8, 13, GP[6]);
      G.ell(5.5, 15.5, 1.6, 2.2, GP[6]); G.set(5, 15, '#ffffff'); G.set(6, 16, GP[3]);
      [[5, 9], [6, 8], [7, 9], [9, 9], [10, 8], [11, 9]].forEach(([x, y]) => G.set(x, y, '#6a3a08'));              // happy eyes
      G.set(8, 10, '#d0604a');
      post = (x, px) => { px('#ffffff', [[5, 7], [12, 13]]); px('rgba(255,255,255,.6)', [[4, 8], [6, 6]]); };
    } else if (id === 'd_daruma') {
      G.rect(3, 18, 10, 2, Q.lac); G.rect(3, 18, 10, 1, Q.lacL);
      G.ell(8, 11.5, 6, 7, gl(6.6, 9.4, 7, 7.6));
      G.ell(8, 9.2, 3.6, 3, '#fbf4e8'); G.rect(5, 7, 2, 1, OUT); G.rect(9, 7, 2, 1, OUT);
      G.set(6, 9, OUT); G.set(10, 9, OUT); G.set(5, 9, '#fbf4e8');                                            // both eyes painted: a wish come true
      G.rect(6, 11, 4, 1, '#c8a060');
      [[5, 14], [6, 15], [8, 14], [10, 15], [11, 14], [7, 16], [9, 16]].forEach(([x, y]) => G.set(x, y, Q.lac));
      post = (x, px) => { px('#ffffff', [[4, 7], [13, 15]]); px('rgba(255,255,255,.6)', [[5, 6], [3, 8]]); };
    } else if (id === 'd_tank') {
      G.rect(4, 17, 8, 3, GP[3]); G.rect(4, 17, 8, 1, GP[5]); G.rect(5, 19, 6, 1, GP[1]);                    // gold stand
      G.ell(8, 11, 6.2, 5.8, (x, y) => y < 8 ? '#e2f6f8' : y < 13 ? '#7ad0e0' : '#5ab8cc');
      G.ell(8, 5.6, 3.8, 1.1, GP[4]); G.rect(5, 5, 6, 1, GP[6]);                                               // gold rim
      G.rect(3, 8, 10, 1, '#a8e4ee'); G.rect(3, 15, 10, 1, GP[3]); G.set(3, 15, GP[5]);                       // gold band
      [[5, 14], [7, 14], [9, 14], [11, 14]].forEach(([x, y], i) => G.set(x, y, i & 1 ? '#ffe680' : '#f0b830'));   // gold pebbles
      G.set(4, 12, P.leaf); G.set(4, 13, P.leaf); G.set(5, 11, P.leafL); G.set(12, 12, P.leafL);
      const FS = f ? [[7, 10, 1], [7, 12, -1]] : [[5, 10, 1], [9, 12, -1]];
      FS.forEach(([x, y, d]) => { const h = d > 0 ? x + 2 : x; G.rect(x, y, 3, 1, '#ffc020'); G.set(h, y, '#fff2a0'); G.set(d > 0 ? x - 1 : x + 3, y, '#ffe060'); G.set(x + 1, y + 1, '#e09018'); });
      post = (x, px) => { px('rgba(255,255,255,.85)', [[4, 8], [4, 9], [5, 7]]); px('#ffffff', [[6, 5], [12, 16]]); };
    } else {   // d_screen: gold frame, gold-leaf panels, silver clouds, a red sun over blue waves
      G.rect(1, 3, 7, 16, GP[2]); G.rect(8, 4, 7, 15, GP[1]);
      G.rect(1, 3, 7, 1, GP[5]); G.rect(1, 3, 1, 16, GP[4]);
      for (let y = 4; y <= 17; y++) for (let x = 2; x <= 6; x++) G.set(x, y, (x + y * .5 + DITHER[y & 1][x & 1] * 2) < 9 ? GP[6] : GP[5]);
      for (let y = 5; y <= 17; y++) for (let x = 9; x <= 13; x++) G.set(x, y, (x + y * .5 + DITHER[y & 1][x & 1] * 2) < 18 ? GP[5] : GP[4]);
      G.rect(2, 7, 5, 1, '#f4f4ec'); G.rect(3, 6, 3, 1, '#f4f4ec'); G.rect(9, 9, 5, 1, '#e8e8e0'); G.rect(10, 8, 2, 1, '#e8e8e0');   // clouds
      G.ell(11.5, 6.6, 1.6, 1.6, '#e0402a');                                                                   // red sun
      for (let x = 2; x <= 13; x++) if (x !== 7 && x !== 8) { G.set(x, 15, (x & 1) ? '#5a8ad8' : '#3a6ab8'); G.set(x, 16, '#3a6ab8'); G.set(x, 17, (x & 1) ? '#2a4a90' : '#5a8ad8'); }
      G.set(4, 11, '#3d7a3a'); G.set(5, 11, '#5a9a3a'); G.set(3, 12, '#3d7a3a'); G.set(4, 12, '#6a4a30'); G.set(4, 13, '#6a4a30');   // a pine sprig
      G.rect(1, 19, 2, 1, GP[1]); G.rect(13, 19, 2, 1, GP[1]);
      post = (x, px) => { px('#ffffff', [[2, 4], [9, 5]]); };
    }
  };
  return _obObj(16, 22, fn, [[2, 13, 21, .3]], (x, px) => { if (post) post(x, px); });
}

// ------------------------------------------------------------ v2.1 garden decor (16.7): 16x24, 1x1, anchor (0,24)
// (sprite bottom on the footprint's bottom edge, 8px over the tile above). They block like the v2.0 garden pieces.
//   gd_zen      zen stone (shimenawa rope) on raked gravel   gd_mill     bamboo water wheel over a stone basin (f turns)
//   gd_chime    bamboo rack of three wind bells (f sways)     gd_lantern  tall stone lantern, curled roof, lit window
//   gd_tower    outdoor cat tower with a little red-roof house gd_wisteria wisteria trellis, hanging purple flowers
//   gd_torii    small vermilion torii                         gd_teahouse thatched tea house with a round window
const _obGDECOR = ['gd_zen', 'gd_mill', 'gd_chime', 'gd_lantern', 'gd_tower', 'gd_wisteria', 'gd_torii', 'gd_teahouse'];
const _obGD_ANIM = { gd_mill: 1, gd_chime: 1 };
function gardenDecorArt(id, frame) {   // 16x24 garden piece, 1x1, anchor (0,24); frame 0/1 animates gd_mill and gd_chime
  if (_obGDECOR.indexOf(id) < 0) id = 'gd_zen';
  const f = _obGD_ANIM[id] && frame ? 1 : 0;
  return art('ob:gdecor:' + id + ':' + f, () => {
    const P = _obP, Q = _obQ, S = P.st, SD = P.stD, SL = P.stL;
    const RP = ['#4a4a52', '#5c5c64', '#707078', '#868688', '#9e9c98', '#b8b6ae'];
    let post = null, under = null, sh = [[2, 13, 23, .3]];
    const fn = G => {
      if (id === 'gd_zen') {
        const M = new Grid(16, 24), ON = '#000000';
        M.ell(8, 13.6, 5.2, 7.4, ON); M.tri(3.2, 11, 6.4, 1.6, 11.6, 9, ON); M.ell(8.2, 18.6, 6, 2.4, ON);
        const pk = _obLit(RP, 6.2, 9.4, 6.4, 9.6, { base: .66, lx: .35 });
        for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) if (M.get(x, y)) G.set(x, y, pk(x, y));
        for (let x = 0; x < 16; x++) {                                                                       // shimenawa (twisted straw rope)
          if (G.get(x, 9)) G.set(x, 9, (x & 1) ? '#e8d088' : '#c8a458');
          if (G.get(x, 10)) G.set(x, 10, (x & 1) ? '#b8944a' : '#e8d088');
        }
        [[5, 11], [6, 12], [5, 13], [6, 14], [10, 11], [11, 12], [10, 13], [11, 14]].forEach(([x, y]) => G.set(x, y, '#fbfaf4'));   // shide papers
        [[4, 18], [5, 19], [11, 19], [12, 18], [9, 5]].forEach(([x, y]) => G.set(x, y, '#6a9a4a')); G.set(4, 17, '#84b05a');   // moss
        under = (x, px) => {   // raked gravel rings round the stone
          for (let y = 17; y < 24; y++) for (let i = 0; i < 16; i++) {
            const d = Math.hypot((i + .5 - 8) / 8, (y + .5 - 20.6) / 3.2);
            if (d > 1) continue;
            x.fillStyle = d > .86 ? '#c6bfac' : (Math.floor(d * 7) & 1) ? '#d4cebd' : '#ebe7dc'; x.fillRect(i, y, 1, 1);
          }
        };
        sh = [[3, 12, 21, .3]];
      } else if (id === 'gd_mill') {
        G.ell(8, 19.4, 7, 2.6, _obLit(['#5e5e60', '#7a7a78', '#8a8a84', '#a8a8a0', '#c4c2b8'], 6.4, 18.6, 7.6, 3, { base: .64, lx: .35 }));   // stone basin
        G.ell(8.4, 18.9, 5.4, 1.3, (x, y) => y < 19 ? '#5ab4a4' : '#3a9688');
        G.rect(14, 10, 1, 9, P.dk); G.set(14, 10, P.dkL);                                                     // axle post
        const cx = 9.5, cy = 10.5, a0 = f ? Math.PI / 8 : 0;
        for (let y = 3; y <= 18; y++) for (let x = 2; x <= 15; x++) {
          const dx = x + .5 - cx, dy = y + .5 - cy, r = Math.hypot(dx, dy);
          if (r > 7.2) continue;
          let a = Math.atan2(dy, dx) - a0; a = ((a % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4);
          const onSpoke = Math.min(a, Math.PI / 4 - a) * r < .55;
          let col = null;
          if (r > 5.6) col = onSpoke || Math.min(a, Math.PI / 4 - a) * r < 1.1 ? (dy < 0 ? '#a87848' : '#7a5232') : null;   // paddles
          else if (r > 4.4) col = dx + dy < 0 ? '#b08050' : '#8a5a34';                                                     // rim
          else if (onSpoke) col = '#7a5232';
          else if (r < 1.3) col = '#4a3024';
          if (col) G.set(x, y, col);
        }
        G.set(9, 10, '#c8a060');
        for (let x = 0; x <= 7; x++) { G.set(x, 2, '#a8d070'); G.set(x, 3, '#7cb04a'); G.set(x, 4, '#4e7e30'); }   // bamboo spout
        G.set(3, 2, '#5a8a30'); G.set(3, 3, '#5a8a30'); G.set(7, 3, '#2a3a1a'); G.set(7, 4, '#2a3a1a');
        G.rect(0, 5, 1, 15, '#7cb04a'); G.set(0, 5, '#a8d070');
        post = (x, px) => {
          px('rgba(170,230,240,.9)', [[8, 5], [8, 6]]); px('rgba(255,255,255,.75)', [[f ? 7 : 8, 7]]);
          px('rgba(170,230,240,.7)', [[f ? 4 : 5, 17], [f ? 12 : 11, 18]]);
        };
        sh = [[1, 14, 23, .3]];
      } else if (id === 'gd_chime') {
        const BM = ['#a8d070', '#7cb04a', '#4e7e30'];
        [1, 13].forEach(px0 => { for (let y = 3; y <= 21; y++) { G.set(px0, y, BM[0]); G.set(px0 + 1, y, BM[2]); } G.set(px0, 9, BM[2]); G.set(px0, 15, BM[2]); });
        for (let x = 0; x <= 15; x++) { G.set(x, 2, BM[0]); G.set(x, 3, BM[1]); }
        G.set(5, 2, BM[2]); G.set(10, 2, BM[2]); G.set(0, 3, BM[2]); G.set(15, 3, BM[2]);
        [[1, 20], [2, 20], [13, 20], [14, 20], [0, 21], [3, 21], [12, 21], [15, 21]].forEach(([x, y]) => G.set(x, y, S));
        const BL = [[5, '#c4e8f8', '#6aa8d8', '#e8452e', '#fbe6ee'], [10, '#fadce4', '#d88aa4', '#4a8ad8', '#e6f4d8']];
        BL.forEach(([cx, g1, g2, paint1, strip], i) => {
          const sw = f ? (i ? -1 : 1) : 0;
          G.set(cx, 4, '#5a4a40');
          G.rect(cx - 1, 5, 3, 1, g1); G.rect(cx - 2, 6, 5, 2, g1); G.rect(cx - 2, 8, 5, 1, g2); G.set(cx - 1, 7, paint1); G.set(cx, 7, paint1);
          G.set(cx, 9, '#5a4a40');
          for (let j = 0; j < 6; j++) G.set(cx + (j >= 3 ? sw : 0), 10 + j, j === 5 ? mixHex(strip, '#8a6a7a', .3) : strip);
        });
        post = (x, px) => { px('rgba(255,255,255,.9)', [[4, 6], [9, 6]]); };
        sh = [[0, 4, 23, .3], [11, 15, 23, .3]];
      } else if (id === 'gd_lantern') {
        G.rect(7, 0, 2, 2, S); G.set(7, 0, SL); G.rect(6, 2, 4, 1, SD);                                       // jewel
        [[5, 3, 10], [3, 4, 12], [1, 5, 14], [1, 6, 14]].forEach(([x0, y, x1]) => { for (let x = x0; x <= x1; x++) G.set(x, y, y === 6 ? '#6e6e6a' : x < 7 - (y - 3) ? SL : x > 9 + (y - 3) ? SD : S); });   // roof
        G.set(0, 4, SL); G.set(15, 4, SD); G.set(0, 3, SL); G.set(15, 3, S);                                 // curled tips
        G.rect(4, 7, 8, 5, S); G.rect(4, 7, 1, 5, SL); G.rect(11, 7, 1, 5, SD); G.rect(4, 7, 8, 1, SD);     // fire box
        G.rect(6, 8, 4, 3, '#ffd27a'); G.rect(7, 8, 2, 2, '#fff2c0'); G.rect(6, 10, 4, 1, '#f0a850');
        G.rect(3, 12, 10, 2, S); G.rect(3, 12, 10, 1, SL); G.rect(3, 13, 10, 1, SD);                         // platform
        G.rect(6, 14, 4, 6, S); G.rect(6, 14, 1, 6, SL); G.rect(9, 14, 1, 6, SD); G.rect(6, 16, 4, 1, SD);    // pillar
        G.rect(3, 20, 10, 2, S); G.rect(3, 20, 10, 1, SL); G.rect(4, 19, 8, 1, S);                            // base
        [[2, 5], [3, 12], [11, 21], [6, 19], [13, 6], [12, 13]].forEach(([x, y]) => G.set(x, y, '#6a9a4a')); G.set(3, 5, '#84b05a');
        sh = [[3, 12, 23, .32]];
      } else if (id === 'gd_tower') {
        const SI = (x, y) => ((y & 1) ? '#c8a868' : '#e0c888');                                                 // sisal rope
        for (let y = 12; y <= 19; y++) { G.set(5, y, SI(5, y)); G.set(6, y, SI(6, y + 1)); }
        for (let y = 16; y <= 19; y++) { G.set(12, y, SI(12, y)); G.set(13, y, SI(13, y + 1)); }
        G.rect(1, 20, 14, 2, P.wood); G.rect(1, 20, 14, 1, P.woodL); G.rect(1, 21, 14, 1, P.woodD);            // base board
        G.rect(9, 14, 6, 2, P.wood); G.rect(9, 14, 6, 1, P.woodL); G.rect(10, 13, 4, 1, '#f4a8b8');            // side step + pink cushion
        G.rect(1, 10, 10, 2, P.wood); G.rect(1, 10, 10, 1, P.woodL); G.rect(1, 11, 10, 1, P.woodD);           // platform under the house
        G.rect(2, 5, 8, 5, '#e8d4a8'); G.rect(2, 5, 1, 5, '#f4e4c0'); G.rect(9, 5, 1, 5, '#c8b088');          // house
        G.ell(6, 8.4, 1.7, 1.9, '#3a2a24'); G.set(6, 7, '#5a4030');
        G.tri(.5, 5.5, 6, -.5, 11.5, 5.5, '#c8463a'); for (let x = 1; x <= 10; x++) G.set(x, 5, '#a8302a');    // red gable roof
        G.set(5, 1, '#e0604a'); G.set(4, 2, '#e0604a'); G.set(3, 3, '#e0604a');
        G.set(2, 12, '#5a4a40'); G.set(2, 13, '#5a4a40'); G.ell(2.5, 14.8, 1.2, 1.2, '#f07a9a');               // pompom toy
        sh = [[1, 14, 23, .3]];
      } else if (id === 'gd_wisteria') {
        [1, 13].forEach(px0 => { G.rect(px0, 5, 2, 17, P.dk); G.rect(px0, 5, 1, 17, P.dkL); });                // posts
        G.rect(0, 4, 16, 1, P.dk); G.rect(0, 5, 16, 1, P.dk2);                                                  // beam
        const LP = [P.leafD, P.leafD, P.leaf, P.leaf, P.leafL, P.leafLL];
        [[3, 2.6, 3.4, 1.8], [8, 2, 3.8, 2], [13, 2.6, 3.4, 1.8]].forEach(([cx, cy, rx, ry]) => G.ell(cx, cy, rx, ry, _obLit(LP, cx - .5, cy - .6, rx + .4, ry + .4)));
        [[2, 4], [7, 4], [12, 4], [4, 1], [10, 1]].forEach(([x, y]) => G.set(x, y, P.dkL));                   // slats peeking
        const WI = ['#6a4ab8', '#8a6ad8', '#a88ae8', '#c8b4f4', '#e4dafa'];
        [[3, 6, 8], [5.5, 6, 6], [8, 6, 9], [10.5, 6, 6], [13, 6, 7]].forEach(([cx, y0, n], i) => {
          for (let j = 0; j < n; j++) {
            const t = j / n, w = t < .45 ? 2 : t < .8 ? 1.5 : 1, x0 = R(cx - w / 2 + ((j >> 1) & 1 ? .3 : -.2));
            for (let k = 0; k < Math.max(1, R(w)); k++) G.set(x0 + k, y0 + j, WI[clamp(Math.floor(t * 4.2 + ((x0 + k + j) & 1) * .6), 0, 4)]);
          }
        });
        post = (x, px) => { px('#c8b4f4', [[4, 22], [9, 21], [12, 22]]); };
        sh = [[0, 4, 23, .3], [12, 15, 23, .3]];
      } else if (id === 'gd_torii') {
        const V = '#d8402a', VL = '#f06a4a', BK = '#2e2628';
        G.rect(3, 3, 2, 17, V); G.rect(3, 3, 1, 17, VL); G.rect(11, 3, 2, 17, V); G.rect(11, 3, 1, 17, VL);    // pillars
        G.rect(1, 7, 14, 2, V); G.rect(1, 7, 14, 1, VL);                                                        // nuki
        G.rect(1, 3, 14, 1, V);                                                                                 // shimaki
        G.rect(0, 1, 16, 2, BK); G.rect(1, 1, 14, 1, '#4a4044'); G.set(0, 0, BK); G.set(15, 0, BK);             // kasagi, upturned ends
        G.rect(6, 4, 4, 3, '#3a2a2a'); G.rect(7, 5, 2, 1, '#ffd23f');                                           // plaque
        G.rect(2, 19, 4, 3, BK); G.rect(10, 19, 4, 3, BK); G.rect(2, 19, 4, 1, '#4a4044'); G.rect(10, 19, 4, 1, '#4a4044');   // black feet
        sh = [[2, 5, 23, .32], [10, 13, 23, .32]];
      } else {   // gd_teahouse
        for (let y = 1; y <= 9; y++) {                                                                           // thatched hip roof
          const x0 = Math.max(0, 6 - (y - 1)), x1 = Math.min(15, 9 + (y - 1));
          for (let x = x0; x <= x1; x++) G.set(x, y, y <= 2 ? '#6a5a3a' : x < x0 + 2 ? '#e0c880' : (x + (y >> 1)) % 3 === 0 ? '#a8864a' : '#c8a860');
        }
        G.rect(0, 10, 16, 1, '#7a6038');                                                                       // eaves
        G.rect(1, 11, 14, 10, '#e6d8b8'); G.rect(1, 11, 14, 1, '#5a4430');                                      // clay wall + beam
        G.rect(1, 11, 1, 10, P.dk); G.rect(14, 11, 1, 10, P.dk); G.rect(8, 11, 1, 10, P.dk);
        G.ell(4.6, 15, 2.2, 2.4, '#5a4a30'); [[3, 14], [5, 14], [4, 15], [3, 16], [5, 16], [4, 13], [6, 15]].forEach(([x, y]) => G.set(x, y, '#c8b080'));   // round lattice window
        G.rect(10, 15, 3, 5, '#8a6a44'); G.rect(11, 15, 1, 5, '#6a4e30'); G.rect(10, 15, 3, 1, '#5a4430');    // nijiri-guchi
        G.rect(1, 20, 14, 1, '#c8b898');
        post = (x, px) => { px('#9a9a94', [[10, 22], [11, 22], [12, 22]]); px('#b8b6ae', [[10, 21], [11, 21]]); };
        sh = [[1, 14, 23, .32]];
      }
    };
    return _obObjL(16, 24, fn, () => [sh, post, under]);
  });
}

// ------------------------------------------------------------ v2.1 festival stalls (16.9): 32x34, footprint 2x1, anchor (0,34)
// stallArt(kind, open, frame): kind 'goldfish' | 'takoyaki' | 'ice' | 'shoot'; open false = covered with a tied canvas sheet
// (the rolled awning keeps the stall's colours, a patch shows its sign); frame 0/1 (open) = fish swim / steam rises.
const _obSTALL = {
  goldfish: { a: '#3a7ac8', b: '#f4f8fc', fr: '#2f5a9a', frD: '#22447a' },
  takoyaki: { a: '#e8702a', b: '#fff0d8', fr: '#c8463a', frD: '#9a3028' },
  ice: { a: '#5ab8e0', b: '#f4f8fc', fr: '#4aa8d8', frD: '#3a86b8' },
  shoot: { a: '#c8463a', b: '#fff4e6', fr: '#7a2a2a', frD: '#5a1e1e' },
};
// sign motifs (5x5), white on the front cloth / the closed cover's patch
const _obSTALLSIGN = {
  goldfish: ['.....', '.XX.X', 'XXXXX', '.XX.X', '.....'],
  takoyaki: ['.XXX.', 'XXXXX', 'X.X.X', 'X.X.X', '.X.X.'],
  ice: ['..X..', 'XXXXX', '..X..', 'X.X.X', '.X.X.'],
  shoot: ['.XXX.', 'X...X', 'X.X.X', 'X...X', '.XXX.'],
};
function stallArt(kind, open, frame) {
  if (!_obSTALL[kind]) kind = 'goldfish';
  const op = !!open, f = op && frame ? 1 : 0;
  return art('ob:stall:' + kind + ':' + (op ? 1 : 0) + ':' + f, () => {
    const P = _obP, Q = _obQ, C = _obSTALL[kind];
    let post = null;
    const fn = G => {
      const posts = () => { [1, 29].forEach(x0 => { G.rect(x0, 6, 2, 26, P.dk); G.rect(x0, 6, 1, 26, P.dkL); }); };
      if (!op) {
        posts();
        G.rect(0, 2, 32, 1, P.dk2);                                                                            // roof batten
        for (let y = 3; y <= 6; y++) for (let x = 1; x <= 30; x++) {                                          // the rolled-up awning
          const s = ((x >> 2) & 1) ? C.a : C.b;
          G.set(x, y, y === 3 ? shade(s, 18) : y === 6 ? shade(s, -40) : s);
        }
        for (let y = 7; y <= 31; y++) {                                                                       // canvas sheet: hangs from the roll, bulges over the counter
          const t = clamp((y - 7) / 12, 0, 1), x0 = R(4 - 3 * t * t), x1 = R(27 + 3 * t * t);
          for (let x = x0; x <= x1; x++) {
            if (y === 31 && ((x + 1) % 5 === 0)) continue;                                                     // ragged hem
            const fold = ((x + R(Math.sin(y * .3 + x * .15) * 1.2)) % 5 + 5) % 5;
            let v = fold === 0 ? '#a8987a' : fold === 1 ? '#e2d6b6' : '#ccbc9c';
            if (x > 24 && fold > 1) v = '#bcac8c';
            G.set(x, y, y === 31 ? '#a8987a' : v);
          }
        }
        for (let x = 3; x <= 28; x++) { const sag = R(Math.sin((x - 3) / 25 * Math.PI) * 2); G.set(x, 12 + sag, '#8a6a3a'); G.set(x, 13 + sag, '#b8945a'); }   // rope
        G.rect(12, 18, 8, 7, '#efe6cc'); G.rect(12, 18, 8, 1, '#fffaea'); G.rect(12, 24, 8, 1, '#d8cbaa');      // sign patch
        _obPat(G, 13, 19, _obSTALLSIGN[kind], { X: C.fr });
        return;
      }
      // awning + valance
      G.rect(0, 0, 32, 2, P.dk2); G.rect(0, 0, 32, 1, P.dk);
      for (let y = 2; y <= 7; y++) for (let x = 0; x <= 31; x++) { const s = ((x >> 2) & 1) ? C.a : C.b; G.set(x, y, y === 2 ? shade(s, 16) : s); }
      for (let i = 0; i < 8; i++) {                                                                            // scallops
        const s = (i & 1) ? C.a : C.b, X = i * 4;
        G.rect(X, 8, 4, 1, s); G.rect(X + 1, 9, 2, 1, s);
      }
      posts();
      // the back of the stall
      G.rect(3, 10, 26, 10, kind === 'shoot' ? '#6a2e2e' : '#5a4440'); G.rect(3, 10, 26, 1, '#3a2c2c');
      // counter + front cloth
      G.rect(1, 20, 30, 2, P.woodL); G.rect(1, 20, 30, 1, '#e8bc88'); G.rect(1, 22, 30, 1, P.woodD);
      G.rect(2, 23, 28, 8, C.fr); G.rect(2, 23, 28, 1, C.frD); G.rect(2, 30, 28, 1, C.frD);
      for (let x = 7; x < 30; x += 7) G.rect(x, 24, 1, 6, C.frD);                                              // cloth panels
      _obPat(G, 13, 25, _obSTALLSIGN[kind], { X: '#fbf6ea' });
      if (kind === 'goldfish') {
        [6, 11, 20, 25].forEach((x0, i) => {                                                                   // fish in bags on a string
          G.rect(x0 - 1, 11, 3, 1, '#d8b070');
          G.rect(x0 - 1, 12, 3, 3, '#c8ecf6'); G.set(x0 - 1, 12, '#e8f8fc'); G.set(x0, 13 + ((i + f) & 1), '#ff6a2a');
        });
        G.ell(16, 18.4, 13, 3.2, (x, y) => y < 17 ? '#5a9ae8' : '#3a6ab8');                                   // the tub
        G.ell(16, 18.1, 11.6, 2.2, (x, y) => (y < 18 ? '#8ad8ec' : '#62c0dc'));
        const FI = f ? [[8, 18, 1], [14, 17, -1], [19, 19, 1], [24, 18, -1], [11, 19, 1, 1]] : [[10, 18, -1], [15, 19, 1], [21, 17, -1], [6, 18, 1], [23, 19, 1, 1]];
        FI.forEach(([x, y, d, blk]) => { G.set(x, y, blk ? '#2a2a36' : '#ff5a20'); G.set(x + d, y, blk ? '#4a4a5a' : '#ff8a4a'); G.set(x - d, y, blk ? '#2a2a36' : '#e8401a'); });
        [[27, 20], [4, 20]].forEach(([x, y]) => { G.rect(x - 1, y - 1, 3, 2, '#fbfaf4'); G.set(x, y - 1, '#d8eef4'); G.set(x + (x > 16 ? 2 : -2), y, '#e8453c'); });   // paper scoops
      } else if (kind === 'takoyaki') {
        G.rect(9, 11, 14, 7, '#fff0d8'); G.rect(9, 11, 14, 1, '#e8d4b0');                                      // sign board with an octopus
        _obPat(G, 13, 12, ['.RRRR.', 'RRwRwR', 'RRRRRR', 'R.RR.R', '.R..R.'], { R: '#e0503a', w: '#fbf6ea' });
        G.rect(3, 16, 18, 5, '#2e2a34'); G.rect(3, 16, 18, 1, '#4a4650');                                      // iron griddle
        for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) {
          const bx = 4 + i * 3 + j, by = 17 + j * 2;
          G.set(bx, by, '#a8641e'); G.set(bx + 1, by, '#d89040'); G.set(bx, by + 1, '#e0a050'); G.set(bx + 1, by + 1, '#c07830');
          if ((i + j) & 1) G.set(bx + 1, by, '#5a2a14');
        }
        [[23, 18], [24, 17], [25, 18]].forEach(([x, y]) => G.set(x, y, '#f4e8d0')); G.rect(23, 19, 4, 1, '#d8c8a8');   // boat trays
        G.rect(27, 15, 2, 5, '#6a2a14'); G.set(27, 14, '#e8453c');                                             // sauce bottle
        post = (x, px) => { [6, 11, 16].forEach((x0, i) => _obSteam(px, x0, 15, 5, f + i)); };
      } else if (kind === 'ice') {
        G.rect(19, 11, 9, 9, '#fbfaf4'); G.rect(19, 11, 9, 1, '#e8453c'); G.rect(19, 18, 9, 2, '#4a8ad8'); G.set(20, 18, '#8ab8f0'); G.set(23, 18, '#8ab8f0'); G.set(26, 18, '#8ab8f0');   // the ice flag
        _obPat(G, 21, 12, ['..R..', 'R.RR.', '.RRR.', 'R.R.R', '.R..R'], { R: '#e8453c' });
        G.ell(8, 12, 3.2, 3.2, '#5a5a6a'); G.ell(8, 12, 1.8, 1.8, '#c8463a'); G.set(8, 12, '#3a3a48');         // ice shaver: wheel
        G.rect(5, 15, 7, 5, '#c8463a'); G.rect(5, 15, 1, 5, '#e0604a'); G.rect(6, 16, 5, 2, '#d8f0f8'); G.set(7, 16, '#ffffff');   // body + ice block
        [[14, '#e8453c'], [17, '#5ac85a'], [24, '#4a8ad8']].forEach(([x0, syr]) => {                         // cups of shaved ice
          G.rect(x0, 19, 3, 1, '#c8dce8'); G.rect(x0, 17, 3, 2, syr); G.rect(x0, 16, 3, 1, '#ffffff'); G.set(x0 + 1, 15, '#ffffff');
        });
      } else {   // shoot: two prize shelves, cork guns on the counter
        G.rect(3, 13, 26, 1, P.woodL); G.rect(3, 18, 26, 1, P.woodL);
        _obPat(G, 5, 10, ['.RR..WW..BBB..YY..RR..', 'RwRR.WkW.BBB.YYY.RwRR.', 'RRRR.WWW.BBB.YYY.RRRR.'], { R: '#d8402a', w: '#fbf4e8', W: '#fbfbf6', k: OUT, B: '#4a8ad8', Y: '#ffd23f' });
        _obPat(G, 5, 15, ['..G...pp...OO...cc..', '.GGG..pp..OOOO..cc..', '.GGG.pppp.OOOO.cccc.'], { G: '#5ac85a', p: '#f4a8c0', O: '#f08a3a', c: '#c8a070' });
        gLine(G, 5, 21, 12, 20, '#8a5a34'); gLine(G, 12, 20, 16, 20, '#6a6a7a');                                 // cork guns
        gLine(G, 20, 21, 25, 20, '#8a5a34'); gLine(G, 25, 20, 28, 19, '#6a6a7a');
        G.set(18, 21, '#e8d4b0'); G.set(19, 21, '#e8d4b0');
      }
    };
    return _obObjL(32, 34, fn, () => [[[1, 30, 33, .32], [2, 29, 32, .16]], post]);
  });
}

// ------------------------------------------------------------ v2.1 fireworks: soft bursts for the festival sky (16.2 / 16.9)
// fireworkArt(k, frame): 32x32, anchor (16,16) = burst centre. k 0..5 = colour (pink, gold, mint, lilac, peach, sky),
// frame 0..5 = open -> spread -> full -> droop -> fade. No white anywhere, radius <= 15; core draws it at alpha ~.6,
// <= 2 new bursts a second, and steps frames at <= 8 fps (each burst is a one-off, so nothing flashes on and off).
const _obFW = [['#b84870', '#e87a9c', '#f6b4c8'], ['#b88420', '#e8b440', '#f6d888'], ['#2e8a6c', '#52c09a', '#a2e6cc'],
  ['#6a50b0', '#9a80e0', '#cebcf6'], ['#b85a36', '#ea8a5c', '#f6bea0'], ['#3a6eb0', '#64a0e0', '#acd0f6']];
function fireworkArt(k, frame) {
  const kk = clamp(k | 0, 0, 5), f = clamp(frame | 0, 0, 5);
  return art('ob:fw:' + kk + ':' + f, () => {
    const c = mk(32, 32), x = c.getContext('2d'), pal = _obFW[kk], pal2 = _obFW[(kk + 2) % 6];
    const dot = (px, py, col, a) => { x.globalAlpha = a; x.fillStyle = col; x.fillRect(R(px), R(py), 1, 1); };
    const RR = [2.5, 6, 10, 13, 14.5, 15][f], N = f >= 2 ? 16 : 12, TL = [1, 3, 4, 5, 4, 2][f], droop = [0, 0, 0, .6, 1.8, 3.2][f];
    for (let i = 0; i < N; i++) {
      if (f === 5 && (i & 1)) continue;
      const a = i / N * Math.PI * 2 + kk * .21, ca = Math.cos(a), sa = Math.sin(a);
      for (let t = TL; t >= 0; t--) {
        const r = RR - t * 1.15; if (r < 1) continue;
        const dy = droop * (r / RR) * (r / RR), hx = 16 + ca * r, hy = 16 + sa * r + dy;
        const col = t === 0 ? (f >= 4 ? pal[1] : pal[2]) : t <= 2 ? pal[1] : pal[0];
        dot(hx, hy, col, f === 5 ? .6 : t >= 3 ? .7 : 1);
        if (t === 0 && (f === 2 || f === 3)) { dot(hx + 1, hy, pal[1], .7); dot(hx - 1, hy, pal[1], .7); dot(hx, hy + 1, pal[1], .7); dot(hx, hy - 1, pal[1], .7); dot(hx, hy, pal[2], 1); }
      }
    }
    if (f >= 2 && f <= 3) for (let i = 0; i < 8; i++) {   // a smaller inner ring in a second soft colour
      const a = (i + .5) / 8 * Math.PI * 2, r = RR * .5;
      dot(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, pal2[f === 2 ? 2 : 1], 1);
    }
    if (f <= 1) { dot(16, 16, pal[2], 1); dot(15, 16, pal[1], .8); dot(17, 16, pal[1], .8); dot(16, 15, pal[1], .8); dot(16, 17, pal[1], .8); }
    x.globalAlpha = 1;
    return c;
  });
}

// ------------------------------------------------------------ v2.1 festival plaza, lower half: scenery
// thin snow line (winter): in rows y0..y1, top pixels (nothing above) that sit in a level run of >= 2 turn to snow
// (thin diagonal sticks stay bare); long flat runs get a broken 2nd row
function _obSnowTop(G, y0, y1) {
  const src = G.d.slice(), at = (x, y) => (x < 0 || y < 0 || x >= G.w || y >= G.h) ? null : src[y * G.w + x];
  const top = (x, y) => at(x, y) && !at(x, y - 1);
  for (let y = Math.max(0, y0); y <= Math.min(G.h - 1, y1); y++) for (let x = 0; x < G.w; x++) {
    if (!top(x, y) || !(top(x - 1, y) || top(x + 1, y))) continue;
    G.set(x, y, '#f4f8fc');
    if (at(x - 1, y) && at(x + 1, y) && !at(x - 1, y - 1) && !at(x + 1, y - 1) && at(x, y + 1) && _obH(x, y, 77) < .55) G.set(x, y + 1, '#dce5f0');
  }
}
// small paper lantern (3x6) hanging from (x, y) = its cap; on = warm lit paper
function _obChochin(G, x, y, on) {
  G.set(x + 1, y, '#3a2a2e'); G.rect(x, y + 1, 3, 1, '#3a2a2e'); G.rect(x, y + 5, 3, 1, '#3a2a2e');
  if (on) { G.rect(x, y + 2, 3, 3, '#ffd27a'); G.set(x + 1, y + 3, '#fff2c0'); G.set(x + 1, y + 2, '#fff2c0'); G.set(x + 2, y + 4, '#f0a850'); }
  else { G.rect(x, y + 2, 3, 3, '#e0503a'); G.set(x, y + 2, '#f07a5a'); G.set(x, y + 3, '#f07a5a'); G.set(x + 2, y + 4, '#a8302a'); }
}
// bon-odori drum tower: 48x56, footprint 3x2, anchor (0,56) = bottom-left of the footprint (rows 24..55 are the
// footprint). lit = the lanterns glow (static); s = season 0..3, winter puts snow on the rails, drum and lanterns.
function yaguraArt(lit, s) {
  const on = !!lit, ss = (s | 0) & 3;
  return art('ob:yagura:' + (on ? 1 : 0) + ':' + ss, () => _obObj(48, 56, G => {
    const P = _obP;
    // back legs + tie, front legs
    G.rect(6, 36, 2, 5, P.dk2); G.rect(40, 36, 2, 5, P.dk2); G.rect(8, 39, 32, 1, P.dk2);
    [3, 42].forEach(x0 => { G.rect(x0, 36, 3, 19, P.dk); G.rect(x0, 36, 1, 19, P.dkL); });
    G.rect(6, 45, 36, 1, P.dk2);                                                                // front tie beam
    gLine(G, 6, 37, 13, 44, P.dk2); gLine(G, 41, 37, 34, 44, P.dk2);                          // braces
    // deck (planks run left-right) + front beam
    G.rect(2, 17, 44, 8, P.woodL);
    for (let x = 2; x < 46; x++) { G.set(x, 19, _obH(x, 19, 5) < .5 ? '#cf9c66' : P.wood); G.set(x, 22, _obH(x, 22, 6) < .5 ? '#cf9c66' : P.wood); }
    G.rect(2, 25, 44, 1, P.dk); G.rect(2, 26, 44, 1, P.dk2);
    // kohaku maku: red and white stripes, black rope band on top
    G.rect(2, 27, 44, 1, '#3a2a2e');
    for (let y = 28; y <= 35; y++) for (let x = 2; x <= 45; x++) {
      const red = ((x - 2) >> 2) & 1, bot = y === 35;
      G.set(x, y, red ? (bot ? '#a83a30' : '#d0483a') : (bot ? '#d8d0c0' : '#f4f0e6'));
    }
    // back rail
    G.rect(5, 11, 1, 7, P.dk); G.rect(42, 11, 1, 7, P.dk);
    G.rect(5, 11, 38, 1, P.dk); G.rect(5, 14, 38, 1, P.dk2);
    // the taiko on its stand
    G.rect(18, 15, 2, 7, P.dk2); G.rect(28, 15, 2, 7, P.dk2); G.rect(17, 20, 14, 1, P.dk);
    const BP = ['#4a1e12', '#6a2c1a', '#8a3e24', '#a8562e', '#c8743c'], bk = _obLit(BP, 22, 9, 9, 6.4);
    for (let x = 17; x <= 31; x++) {                                                            // barrel, bulging in the middle
      const u = (x + .5 - 24.5) / 7.5, hh = 4.6 + 1.6 * (1 - u * u);
      for (let y = R(11 - hh); y <= R(11 + hh); y++) G.set(x, y, bk(x, y));
    }
    for (let x = 18; x <= 30; x++) G.set(x, 11, (x & 1) ? '#d8a040' : '#b07818');               // rope band
    [16, 32].forEach(hx => {                                                                    // drum heads, tacks on the rims
      G.ell(hx + .5, 11, 1.6, 5.6, hx < 24 ? '#f4ecd8' : '#d8ccb0');
      for (let y = 6; y <= 16; y += 2) G.set(hx < 24 ? hx + 1 : hx - 1, y, '#2e1e14');
    });
    gLine(G, 30, 3, 35, 7, '#e8c890'); gLine(G, 33, 2, 36, 6, '#d8b070');                       // bachi (sticks)
    // front corner poles, a low front rail with a gap for the ladder, a sagging lantern string
    G.rect(2, 3, 2, 22, P.dk); G.set(2, 3, P.dkL); G.rect(44, 3, 2, 22, P.dk); G.set(44, 3, P.dkL);
    G.rect(4, 18, 16, 1, P.dk); G.rect(28, 18, 16, 1, P.dk);
    // ladder up the front
    [20, 27].forEach(x0 => { G.rect(x0, 24, 1, 31, P.dk); });
    for (let y = 28; y <= 52; y += 4) { G.rect(21, y, 6, 1, P.woodL); G.rect(21, y + 1, 6, 1, P.woodD); }
    if (ss === 3) _obSnowTop(G, 0, 12);
    for (let x = 4; x <= 43; x++) G.set(x, 4 + R(Math.sin((x - 4) / 39 * Math.PI) * 2), '#5a4a40');
    [[5, 4], [11, 5], [36, 5], [41, 4]].forEach(([lx, ly]) => { _obChochin(G, lx, ly + 1, on); if (ss === 3) G.rect(lx, ly + 2, 3, 1, '#f4f8fc'); });
  }, [[3, 6, 55, .34], [42, 45, 55, .34], [19, 28, 55, .3], [6, 41, 41, .2]], on ? (x, px) => {
    const halo = [];
    [[5, 5], [11, 6], [36, 6], [41, 5]].forEach(([lx, ly]) => { halo.push([lx - 1, ly + 3], [lx + 3, ly + 3], [lx + 1, ly + 7]); });
    px('rgba(255,210,122,.45)', halo);
  } : null));
}

// keijiban: little notice board with a gabled roof on two posts, three pinned papers. 16x26, anchor (0,26)
// = bottom-left of the 1x1 footprint (the board is centred in it). s = season: one paper's colour, winter snow.
function noticeBoardArt(s) {
  const ss = (s | 0) & 3;
  return art('ob:notice:' + ss, () => _obObj(16, 26, G => {
    const P = _obP;
    G.rect(2, 6, 2, 19, P.dk); G.rect(2, 6, 1, 19, P.dkL); G.rect(12, 6, 2, 19, P.dk); G.rect(12, 6, 1, 19, P.dkL);   // posts
    G.rect(1, 7, 14, 12, P.dk2);                                                                // frame
    G.rect(2, 8, 12, 10, '#b88a58'); for (let y = 9; y < 18; y += 3) G.rect(2, y, 12, 1, '#a87a4a');   // board
    const PAP = { L: '#fbfaf4', l: '#8a7a6a' };
    _obPat(G, 3, 9, ['LLLL', 'LllL', 'LLLL', 'LlLL', 'LLLL'], PAP);
    _obPat(G, 8, 9, ['LLLLL', 'LlllL', 'LLLLL', 'LllLL', 'LLLLL', 'LlllL', 'LLLLL'], PAP);
    const TC = ['#f8c8d8', '#c8e4f4', '#f8d098', '#eef2f6'][ss];
    _obPat(G, 3, 15, ['CCCC', 'CkkC'], { C: TC, k: '#7a5a5a' });
    G.set(4, 9, '#e8453c'); G.set(10, 9, '#4a8ad8'); G.set(4, 15, '#e8453c');                 // pins
    G.tri(-.6, 6.2, 8, -.2, 16.6, 6.2, '#5c4c4a');                                              // gabled roof
    for (let y = 1; y <= 5; y++) for (let x = 0; x < 16; x++) if (G.get(x, y)) G.set(x, y, x < 8 - (y & 1) ? '#76625c' : (x + y) % 3 ? '#5c4c4a' : '#46393a');
    G.rect(0, 6, 16, 1, '#342a2c'); G.rect(7, 0, 2, 1, '#342a2c');
    if (ss === 3) _obSnowTop(G, 0, 7);
  }, [[1, 4, 25, .32], [11, 14, 25, .32], [5, 10, 25, .14]]));
}

// fujidana: wisteria pergola over a long bench. 48x40, footprint 3x1, anchor (0,40) = bottom-left of the footprint.
// s = season: 0 purple racemes, 1 green leaves, 2 yellow-brown leaves, 3 bare vines + snow. The seat (rows 26..29,
// x 6..41) stays clear for cats.
function pergolaArt(s) {
  const ss = (s | 0) & 3;
  return art('ob:pergola:' + ss, () => _obObj(48, 40, G => {
    const P = _obP;
    G.rect(5, 6, 2, 20, P.dk2); G.rect(41, 6, 2, 20, P.dk2);                                   // back posts
    // bench
    G.rect(6, 26, 36, 3, P.woodL); for (let x = 6; x < 42; x++) if (_obH(x, 27, 9) < .3) G.set(x, 27, '#cf9c66');
    G.rect(6, 29, 36, 1, P.wood); G.rect(6, 30, 36, 1, P.woodD);
    [8, 23, 38].forEach(x0 => { G.rect(x0, 31, 2, 7, P.dk); G.set(x0, 31, P.dkL); });
    G.rect(8, 34, 32, 1, P.dk2);
    // front posts
    [1, 45].forEach(x0 => { G.rect(x0, 8, 2, 31, P.dk); G.rect(x0, 8, 1, 31, P.dkL); });
    // lattice: back beam, front beam, cross slats, a middle purlin
    G.rect(2, 3, 44, 1, P.dk2); G.rect(1, 6, 46, 1, '#8a5a34');
    for (let x = 3; x <= 45; x += 6) G.rect(x, 3, 1, 6, '#8a5a34');
    G.rect(0, 8, 48, 2, P.dk); G.rect(0, 8, 48, 1, P.dkL);
    const LEAF = [[P.leafD, P.leafD, P.leaf, P.leaf, P.leafL, P.leafLL],
      ['#2e6a32', '#3d7a3a', '#4a8a3a', '#5a9a3a', '#72b04a', '#8ac85a'],
      ['#8a5a1a', '#a8701e', '#c88a2a', '#dca838', '#ecc456', '#f6dc80']][Math.min(ss, 2)];
    if (ss < 3) {
      [[5, 4.6, 5.4, 3], [14, 3.8, 5.6, 3.2], [24, 4.4, 6, 3], [34, 3.8, 5.6, 3.2], [43, 4.6, 5, 3]].forEach(([cx, cy, rx, ry]) => {
        const lk = _obLit(LEAF, cx - .6, cy - .8, rx + .4, ry + .4);
        G.ell(cx, cy, rx, ry, (x, y) => (ss === 2 && _obH(x, y, 31) < .16 ? null : lk(x, y)));
      });
      [[9, 6], [21, 7], [27, 5], [39, 6]].forEach(([x, y]) => G.set(x, y, '#8a5a34'));        // slats peeking through
      // hanging racemes (spring) / leafy drapes (summer, autumn) under the front beam
      const WI = ['#6a4ab8', '#8a6ad8', '#a88ae8', '#c8b4f4', '#e4dafa'];
      const HANG = ss === 0 ? [[4, 9], [8, 12], [12, 8], [16, 11], [20, 7], [25, 12], [29, 9], [33, 11], [37, 8], [41, 12], [44, 7]]
        : [[4, 4], [9, 6], [14, 3], [19, 5], [25, 6], [30, 4], [35, 5], [40, 3], [44, 5]];
      HANG.forEach(([cx, n], i) => {
        if (ss === 2 && (i & 1)) n = Math.max(2, n - 2);
        for (let j = 0; j < n; j++) {
          const t = j / n, w = ss === 0 ? (t < .45 ? 2 : 1) : (t < .6 ? 2 : 1), x0 = cx - (w > 1 ? 1 : 0) + (ss === 0 && ((j >> 1) & 1) ? 1 : 0);
          for (let k = 0; k < w; k++) {
            const c = ss === 0 ? WI[clamp(Math.floor(t * 4.2 + ((x0 + k + j) & 1) * .6), 0, 4)] : LEAF[clamp(2 + ((x0 + k + j) & 1) * 2 - (t > .6 ? 1 : 0), 0, 5)];
            G.set(x0 + k, 10 + j, c);
          }
        }
      });
    } else {
      // bare vines twisting along the beams
      for (let x = 1; x <= 46; x++) { const y = 5 + ((x >> 2) & 1) - ((x >> 3) & 1); if (_obH(x, 5, 41) < .8) G.set(x, y, '#6a4a34'); }
      [[6, 10, 7, 13], [19, 10, 18, 12], [30, 10, 31, 14], [40, 10, 39, 12]].forEach(([a, b, c2, d]) => gLine(G, a, b, c2, d, '#6a4a34'));
      _obSnowTop(G, 0, 3); _obSnowTop(G, 8, 8);
      for (let x = 7; x <= 40; x++) if (_obH(x, 26, 43) < .5) G.set(x, 26, '#f4f8fc');   // a dusting on the seat
    }
  }, [[0, 3, 39, .34], [44, 47, 39, .34], [7, 40, 38, .26]], ss === 0 ? (x, px) => {
    px('#c8b4f4', [[6, 38], [17, 39], [29, 38], [35, 39]]);
  } : ss === 2 ? (x, px) => { px('#dca838', [[12, 38], [26, 39], [33, 38]]); px('#a8701e', [[19, 39]]); } : null));
}
