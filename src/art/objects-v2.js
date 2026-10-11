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
function decorArt(id, frame) {   // 16x22, 1x1 ground item (not blocking), anchor (0,22); frame 0/1 animates d_tank and d_maneki
  if (_obDECOR.indexOf(id) < 0) id = 'd_scroll';
  const f = (id === 'd_tank' || id === 'd_maneki') && frame ? 1 : 0;
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
// Tree crown (WORKFLOW 3.5): an egg of small round leaf clumps; global light from the top-left in pal.length tones,
// each clump also lit on its own top-left; bumpy silhouette from the clumps. pal = dark -> light.
function _obCrown(G, cx, cy, rx, ry, pal, seed, cr) {
  cr = cr || 2.4;
  const pts = [];
  for (let gy = -ry; gy <= ry + .01; gy += cr * 1.2) for (let gx = -rx; gx <= rx + .01; gx += cr * 1.25) {
    const qx = R(gx * 4), qy = R(gy * 4);
    const px = gx + (_obH(qx, qy, seed) - .5) * cr * .9, py = gy + (_obH(qx, qy, seed + 1) - .5) * cr * .9;
    if ((px / rx) * (px / rx) + (py / ry) * (py / ry) <= 1) pts.push([cx + px, cy + py]);
  }
  const r2 = cr * cr * 1.2;
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    let best = -1, bd = 1e9;
    for (let i = 0; i < pts.length; i++) { const dx = x + .5 - pts[i][0], dy = y + .5 - pts[i][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    if (best < 0 || bd > r2) continue;
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
    const glob = .6 - ny * .36 - nx * .22 - Math.max(0, nx * nx + ny * ny - .6) * .4;
    const loc = -((x + .5 - pts[best][0]) + (y + .5 - pts[best][1])) / (cr * 2);
    const v = glob + loc * .3 + (DITHER[y & 1][x & 1] - .375) * .1;
    G.set(x, y, pal[clamp(Math.floor(v * pal.length), 0, pal.length - 1)]);
  }
}
// trunk along a polyline from the base up; width w0 -> w1; pal [dark, mid, light] (light on the left)
function _obTrunk(G, pts, w0, w1, pal) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    for (let y = y1; y <= y0; y++) {
      const t = (y0 - y) / Math.max(1, y0 - y1), c = x0 + (x1 - x0) * t, w = w0 + (w1 - w0) * ((i + t) / (pts.length - 1));
      const a = R(c - w / 2), b = Math.max(a, R(c + w / 2) - 1);
      for (let x = a; x <= b; x++) { const u = (x - a + .5) / (b - a + 1); G.set(x, y, u < .38 ? pal[2] : u < .72 ? pal[1] : pal[0]); }
    }
  }
}
function _obTreeCanvas(w, h, fn, dark, shCx, shRx) {   // own outline (crown colour mixed with a dark tone, not black) + soft ground shadow
  const G = new Grid(w, h); fn(G);
  const add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (G.get(x, y)) continue;
    const below = G.get(x, y + 1), n = below || G.get(x - 1, y) || G.get(x + 1, y) || G.get(x, y - 1);
    if (n) add.push([x, y, mixHex(n, dark, below ? .5 : .62)]);
  }
  add.forEach(([x, y, c]) => G.set(x, y, c));
  const c = mk(w, h), cx = c.getContext('2d');
  for (let y = h - 3; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + .5 - shCx) / shRx, dy = (y + .5 - (h - 1.5)) / 1.7;
    if (dx * dx + dy * dy <= 1) { cx.fillStyle = 'rgba(30,40,24,' + (dx * dx + dy * dy < .45 ? .32 : .18) + ')'; cx.fillRect(x, y, 1, 1); }
  }
  cx.drawImage(G.canvas(), 0, 0);
  return c;
}
const _obTREE = {
  sakura: [32, 44], maple: [28, 36], pine: [32, 40],
};
function treeArt(kind) {   // sakura 32x44 / maple 28x36 / pine 32x40; anchor = (width/2, height) = bottom-centre of the footprint tile
  if (!_obTREE[kind]) kind = 'sakura';
  return art('ob:tree:' + kind, () => {
    const [w, h] = _obTREE[kind], TR = ['#4a3024', '#6a4632', '#8a6246'];
    if (kind === 'sakura') return _obTreeCanvas(w, h, G => {
      _obTrunk(G, [[16, 41], [16, 34], [15, 27]], 5, 3, TR);
      G.set(13, 41, TR[1]); G.set(19, 41, TR[0]); G.set(12, 41, TR[0]);
      [[15, 30, 9, 24], [17, 29, 23, 23], [16, 28, 16, 22]].forEach(([a, b, c2, d]) => { gLine(G, a, b, c2, d, TR[1]); gLine(G, a + 1, b, c2 + 1, d, TR[0]); });
      _obCrown(G, 16, 15.5, 14.5, 13, ['#8a3a5a', '#a8506e', '#c66a88', '#de86a0', '#eea2b8', '#f8c0d0', '#fde0ea'], 7, 2.5);
      for (let y = 4; y < 24; y++) for (let x = 3; x < 28; x++) { const c = G.get(x, y); if (c && (c === '#f8c0d0' || c === '#eea2b8') && _obH(x, y, 9) < .07) G.set(x, y, '#ffffff'); }
      G.set(10, 41, '#f8c0d0'); G.set(22, 40, '#eea2b8'); G.set(25, 42, '#f8c0d0');
    }, '#5a1e38', 16, 10);
    if (kind === 'maple') return _obTreeCanvas(w, h, G => {
      _obTrunk(G, [[14, 33], [14, 26], [13, 21]], 4, 3, TR);
      G.set(11, 33, TR[1]); G.set(16, 33, TR[0]);
      [[13, 24, 8, 19], [15, 23, 20, 18]].forEach(([a, b, c2, d]) => { gLine(G, a, b, c2, d, TR[1]); });
      _obCrown(G, 14, 13.5, 12.5, 11, ['#6a1e1a', '#8a2a1e', '#ae3a22', '#cc5226', '#e4702c', '#f29a40', '#fac46a'], 17, 2.1);
      G.set(6, 33, '#e4702c'); G.set(21, 34, '#cc5226'); G.set(18, 32, '#f29a40');
    }, '#4a1410', 14, 9);
    return _obTreeCanvas(w, h, G => {   // pine: S-curved trunk + cloud-pruned pads
      _obTrunk(G, [[16, 37], [17, 31], [15, 24], [13, 17], [14, 11], [15, 6]], 5, 2, TR);
      G.set(13, 37, TR[1]); G.set(19, 37, TR[0]);
      [[15, 22, 23, 19], [14, 16, 8, 13], [16, 26, 22, 26], [14, 27, 9, 24]].forEach(([a, b, c2, d]) => { gLine(G, a, b, c2, d, TR[1]); gLine(G, a, b + 1, c2, d + 1, TR[0]); });
      const PP = ['#183224', '#21452e', '#2a5636', '#376a40', '#4a8048', '#62984e', '#84b05a'];
      [[15, 5.5, 6.5, 3.2], [8, 12, 7, 3], [23, 15.5, 8, 3.2], [9, 21.5, 6.5, 2.8], [22.5, 24.5, 6, 2.6]].forEach(([cx, cy, rx, ry], i) => _obCrown(G, cx, cy, rx, ry, PP, 31 + i * 3, 1.7));
    }, '#0e2016', 16, 9);
  });
}

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

function deckLanternArt(lit) {   // 12x24 deck lantern: wood post with a hanging paper chochin, anchor (6,24); lit = warm glow
  const on = !!lit;
  return art('ob:dlamp:' + (on ? 1 : 0), () => _obObj(12, 24, G => {
    const P = _obP;
    G.rect(2, 2, 2, 19, P.dk); G.rect(2, 2, 1, 19, P.dkL); G.rect(2, 2, 8, 1, P.dk2); G.rect(1, 20, 4, 2, P.dk2);
    G.ell(7.5, 10.5, 3.4, 4.6, (x, y) => {
      const d = Math.abs(x + .5 - 7) / 3.4 + Math.abs(y + .5 - 10) / 5 + (DITHER[y & 1][x & 1] - .375) * .3;
      return on ? (d < .55 ? '#fff6d0' : d < 1 ? '#ffd27a' : '#f0a040') : (d < .8 ? '#f6f2ea' : '#d8d2c4');
    });
    [8, 10, 12].forEach(y => G.rect(5, y, 6, 1, on ? '#e8a040' : '#c8c0b0'));
    G.rect(6, 5, 3, 1, '#2a2228'); G.rect(6, 15, 3, 1, '#2a2228');
    G.rect(4, 9, 7, 1, P.red); G.rect(4, 13, 7, 1, P.red);
    G.set(7, 3, P.dk2); G.set(7, 4, P.dk2);
  }, [[1, 6, 23, .32]]));
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
