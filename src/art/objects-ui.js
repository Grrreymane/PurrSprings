// ------------------------------------------------------------ v2 icons (centre anchor, flat dark outline)
// small icon from a pattern: rows of chars -> colours, 1px OUT outline added around (like rows())
function _obIco(key, rs, pal) { return art(key, () => rows(rs, pal)); }

function itemIcon(kind) {   // 7x7 tray / arrow / bubble item: 'tea' | 'milk' | 'rice' | 'kaiseki'
  const K = {
    tea: [['GgggG', 'CCCCC', 'cCCCC', 'CCCCd', '.CCC.'], { G: '#c0e4cc', g: '#b8d050', C: '#7ab894', c: '#c0e4cc', d: '#5a9a7a' }],
    milk: [['.BBB.', '.WWW.', 'WWWWW', 'WSSSW', 'WWWWW'], { B: '#4a8ad8', W: '#ffffff', S: '#4a8ad8' }],
    rice: [['..W..', '.WWW.', '.WhW.', 'WNNNW', 'WNNNW'], { W: '#fbfaf4', h: '#ffffff', N: '#26342c' }],
    kaiseki: [['LLLLL', 'YYYYY', 'RRrRR', 'YYYYY', 'DDDDD'], { L: '#fff2a8', Y: '#ffd23f', R: '#c8463a', r: '#ff8a6a', D: '#d89a20' }],
  };
  if (!K[kind]) kind = 'tea';
  return _obIco('ob:item:' + kind, K[kind][0], K[kind][1]);
}

// 10x10 decor thumbnail (price pad, shop shelf, album, info card), centre anchor. v2.1: also the 8 seasonal pieces, the
// gold ones (decorIcon(id, true) or 'd_maneki_gold' ...) and the 8 garden pieces (gd_zen ...)
function decorIcon(id, gold) {
  if (_obGDECOR.indexOf(id) >= 0) return art('ob:dico:' + id, () => paint(10, 10, G => _obGDecorIcon(G, id), 'plain'));
  [id, gold] = _obDecorId(id, gold);
  if (gold) return art('ob:dico:' + id + ':g', () => { const c = paint(10, 10, G => _obDecorIconGold(G, id), 'plain'); const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(id === 'd_screen' ? 2 : 3, 2, 1, 1); return c; });
  if (_obDECOR21.indexOf(id) >= 0) return art('ob:dico:' + id, () => paint(10, 10, G => _obDecorIcon21(G, id), 'plain'));
  return art('ob:dico:' + id, () => paint(10, 10, G => {
    const P = _obP;
    if (id === 'd_scroll') {
      G.rect(2, 1, 6, 8, '#5a6a8a'); G.rect(3, 2, 4, 5, '#f4ecd8'); G.set(4, 5, '#5a6a7a'); G.set(5, 4, '#5a6a7a'); G.set(6, 5, '#5a6a7a'); G.set(6, 3, P.red);
      G.rect(1, 1, 8, 1, '#3a2a20'); G.rect(1, 8, 8, 1, '#3a2a20');
    } else if (id === 'd_ikebana') {
      G.rect(3, 5, 4, 4, P.weave); G.rect(3, 5, 4, 1, P.weaveL); G.set(4, 7, P.weaveD); G.set(5, 6, P.weaveD); G.set(6, 8, P.weaveD);
      G.set(2, 4, P.leaf); G.set(7, 4, P.leafL);
      G.ell(2.5, 2.5, 1.5, 1.4, '#ff6a8a'); G.ell(7, 2, 1.5, 1.4, '#ff8aa8'); G.ell(5, 1.8, 1.2, 1.1, '#fff0f4'); G.set(2, 2, '#ffd0dc');
    } else if (id === 'd_bonsai') {
      G.rect(2, 7, 6, 2, '#3a5a9a'); G.rect(2, 7, 6, 1, '#6a8aca');
      G.set(5, 6, '#7a5238'); G.set(4, 5, '#7a5238');
      G.ell(3, 4, 2.4, 1.3, P.leaf); G.ell(7, 4.5, 2.2, 1.3, P.leafD); G.ell(5, 2, 2.6, 1.4, P.leafL); G.set(4, 1, P.leafLL);
    } else if (id === 'd_screen') {
      G.rect(1, 2, 4, 6, '#ffe070'); G.rect(5, 2, 4, 6, '#d8a830'); G.set(2, 3, '#fff6c0');
      G.set(2, 5, P.leafD); G.set(3, 5, P.leaf); G.set(6, 4, P.red); G.set(7, 4, P.red);
      G.rect(1, 6, 8, 1, '#fffbe6'); G.rect(1, 8, 1, 1, '#2a2228'); G.rect(8, 8, 1, 1, '#2a2228');
    } else if (id === 'd_tank') {
      G.ell(5, 5, 3.8, 3.6, (x, y) => y < 4 ? '#e2f6f8' : '#7ad0e0'); G.rect(3, 1, 4, 1, '#ffffff');
      G.rect(4, 5, 2, 1, '#ff7a2a'); G.set(6, 5, '#ffb060'); G.set(3, 5, '#ff9a4a'); G.set(2, 3, '#ffffff');
    } else if (id === 'd_tower') {
      G.rect(4, 2, 2, 6, '#d8b878'); G.rect(4, 4, 2, 1, '#b8985a'); G.rect(4, 6, 2, 1, '#b8985a');
      G.rect(1, 1, 8, 2, '#e8d8b8'); G.rect(1, 8, 8, 1, '#d8c8a8'); G.ell(7.5, 5, 1.5, 1.5, '#e0503a'); G.set(7, 4, '#ff8a6a');
    } else if (id === 'd_maneki') {
      const Wc = '#fbfbf6';
      G.ell(5, 6.5, 3.2, 2.6, Wc); G.ell(5, 3.6, 3.2, 2.6, Wc); G.set(2, 1, Wc); G.set(7, 1, Wc);
      G.rect(8, 1, 1, 3, Wc); G.set(8, 1, P.pink);
      G.rect(3, 5, 4, 1, P.red); G.set(5, 6, P.gold); G.set(4, 3, OUT); G.set(6, 3, OUT); G.set(2, 2, '#f0a040');
    } else {
      G.ell(5, 5.2, 3.8, 4, (x, y) => (x + y < 7 ? '#e0604a' : '#c8463a')); G.ell(5, 4.2, 2.2, 1.8, '#fbf4e8');
      G.set(4, 3, OUT); G.set(6, 4, OUT); G.set(4, 7, P.gold); G.set(6, 7, P.gold);
    }
  }, 'plain'));
}

const _obHATS = { h_straw: 'straw', h_flower: 'flower', h_beret: 'beret', h_captain: 'captain', h_shades: 'shades', h_fox: 'foxmask', h_crown: 'crown', h_gold: 'goldband' };
function hatIcon(id) {   // 10x10 hat icon, centre anchor; id = unlock id (h_straw ...) or look.hat name (straw flower beret captain shades foxmask crown goldband topknot ribbon)
  let k = _obHATS[id] || id;
  if (['straw', 'flower', 'beret', 'captain', 'shades', 'foxmask', 'crown', 'goldband', 'topknot', 'ribbon'].indexOf(k) < 0) k = 'straw';
  return art('ob:hat:' + k, () => paint(10, 10, G => {
    const P = _obP;
    if (k === 'straw') {
      G.ell(5, 6.6, 4.6, 1.8, '#e8c870'); G.ell(5, 4.4, 2.6, 2.4, '#f0d488'); G.rect(3, 5, 5, 1, P.red);
      G.set(4, 3, '#fff0b8'); G.set(2, 7, '#c8a050'); G.set(7, 7, '#c8a050');
    } else if (k === 'flower') {
      G.set(2, 8, '#c88a18'); G.set(3, 7, '#f0b830'); G.set(4, 6, '#f0b830');
      [[5, 2.4], [7.4, 4], [6.6, 6.6], [3.6, 6.4], [3, 3.8]].forEach(([x, y]) => G.ell(x, y, 1.5, 1.4, '#ff7a9a'));
      G.ell(5, 4.6, 1.2, 1.2, '#ffd23f'); G.set(4, 2, '#ffd0dc');
    } else if (k === 'beret') {
      G.ell(5, 5.6, 4.4, 2.4, (x, y) => x + y < 8 ? '#b84a4a' : '#9a3a3a'); G.set(5, 2, '#9a3a3a'); G.set(5, 3, '#9a3a3a'); G.rect(2, 7, 6, 1, '#7a2a2a');
    } else if (k === 'captain') {
      G.ell(5, 4.2, 3.8, 2.4, '#f6f4ee'); G.rect(1, 5, 8, 2, '#2a3a6a'); G.rect(2, 7, 7, 1, '#1e1e2a');
      G.set(5, 4, '#ffd23f'); G.set(4, 5, '#ffd23f'); G.set(5, 5, '#ffd23f'); G.set(3, 3, '#ffffff');
    } else if (k === 'shades') {
      G.rect(1, 4, 3, 2, '#1e1e2a'); G.rect(6, 4, 3, 2, '#1e1e2a'); G.rect(4, 4, 2, 1, '#3a3a48'); G.rect(1, 3, 8, 1, '#3a3a48');
      G.set(1, 4, '#ffffff'); G.set(6, 4, '#8ab8f8');
    } else if (k === 'foxmask') {
      G.ell(5, 5.4, 3.6, 3, '#fbfbf6'); G.tri(1.5, 4, 2, .5, 4.5, 3, '#fbfbf6'); G.tri(5.5, 3, 8, .5, 8.5, 4, '#fbfbf6');
      G.set(2, 2, P.red); G.set(7, 2, P.red); G.set(3, 5, P.red); G.set(6, 5, P.red); G.set(5, 7, '#2a2228'); G.set(4, 4, P.red); G.set(5, 4, P.red);
    } else if (k === 'crown') {
      G.rect(2, 4, 6, 4, '#ffd23f'); G.set(2, 2, '#ffd23f'); G.set(2, 3, '#ffd23f'); G.set(5, 1, '#ffd23f'); G.set(5, 2, '#ffd23f'); G.set(5, 3, '#ffd23f'); G.set(7, 2, '#ffd23f'); G.set(7, 3, '#ffd23f');
      G.rect(2, 7, 6, 1, '#d89a20'); G.set(5, 5, P.red); G.set(3, 5, '#4a8ad8'); G.set(7, 5, '#3aa860'); G.set(3, 4, '#fff6c0');
    } else if (k === 'goldband') {   // gold headband with a knot + tails on the right and a little bell hanging in the middle
      G.rect(1, 3, 7, 2, '#ffd23f'); G.rect(1, 3, 7, 1, '#fff2a8'); G.rect(8, 3, 1, 2, '#d89a20');
      G.set(9, 5, '#f0b830'); G.set(8, 6, '#f0b830');
      G.ell(4.5, 7, 1.7, 1.6, '#f0b830'); G.set(4, 6, '#fff2a8'); G.set(4, 8, '#8a5a10'); G.set(4, 5, '#d89a20');
    } else if (k === 'topknot') {
      G.ell(5, 6, 3.4, 2, '#2a2228'); G.rect(4, 2, 3, 3, '#2a2228'); G.rect(3, 2, 2, 1, '#2a2228'); G.set(5, 4, '#ffffff'); G.set(4, 5, '#4a4250');
    } else {
      G.ell(3, 4.5, 2.2, 1.8, '#4a8ad8'); G.ell(7, 4.5, 2.2, 1.8, '#4a8ad8'); G.rect(4, 4, 2, 2, '#2a5aa8');
      G.set(3, 7, '#4a8ad8'); G.set(6, 7, '#4a8ad8'); G.set(2, 4, '#8ab8f8');
    }
  }, 'plain'));
}

// 10x10 pet icon, centre anchor: 'duck' | 'shiba' | v2.1 'fox' | 'tanuki' | 'crane' (unlock ids p_duck p_shiba p_fox
// p_tanuki p_crane accepted; unknown = duck)
function petIcon(id) {
  let k = String(id || '').replace(/^p_/, '');
  if (['duck', 'shiba', 'fox', 'tanuki', 'crane'].indexOf(k) < 0) k = 'duck';
  return art('ob:pet:' + k, () => paint(10, 10, G => {
    if (k === 'duck') {
      G.ell(5.5, 6.5, 3.6, 2.4, '#ffd23f'); G.ell(4, 3.6, 2.2, 2.2, '#ffe060'); G.rect(1, 4, 2, 1, '#ff8a2a'); G.set(1, 5, '#e06a1a');
      G.set(4, 3, OUT); G.set(7, 6, '#f0b030'); G.set(6, 5, '#fff2a8'); G.set(8, 5, '#f0b030');
    } else if (k === 'shiba') {
      G.ell(5, 5.4, 3.8, 3.2, '#e88a3a'); G.tri(1.5, 4, 2, .5, 4, 2.6, '#e88a3a'); G.tri(6, 2.6, 8, .5, 8.5, 4, '#e88a3a');
      G.ell(5, 7, 2.6, 1.6, '#fbf4e8'); G.set(3, 5, '#fbf4e8'); G.set(7, 5, '#fbf4e8');
      G.set(3, 4, OUT); G.set(7, 4, OUT); G.set(5, 6, OUT); G.set(2, 2, '#c86a2a'); G.set(7, 2, '#c86a2a');
    } else if (k === 'fox') {   // sitting fox, side view: big brush tail with a white tip, tall ears, pointed snout
      const O = '#f0883a', OD = '#c8642a', Wt = '#fbf4e8';
      G.ell(2.6, 6.8, 2, 2.4, O); G.set(1, 8, Wt); G.set(2, 8, Wt); G.set(1, 7, Wt);
      G.ell(5.6, 6.6, 2.2, 2.6, O); G.set(6, 7, Wt); G.set(6, 8, Wt); G.set(5, 8, OD);
      G.ell(6.6, 3.2, 2, 1.8, O); G.set(5, 1, O); G.set(5, 0, '#3a2a24'); G.set(7, 1, O); G.set(7, 0, '#3a2a24');
      G.rect(8, 3, 1, 2, O); G.set(9, 4, '#3a2a24'); G.set(7, 4, Wt); G.set(8, 4, Wt); G.set(7, 3, OUT);
    } else if (k === 'tanuki') {   // round face, dark eye mask, a leaf on the head (it can turn into a lantern)
      const B = '#9a8268', D = '#3a3230', Wt = '#ece2d0';
      G.ell(5, 5.6, 3.8, 3.2, B); G.set(2, 2, B); G.set(2, 3, B); G.set(7, 2, B); G.set(7, 3, B); G.set(2, 2, D); G.set(7, 2, D);
      G.ell(3.4, 5.2, 1.5, 1.1, D); G.ell(6.6, 5.2, 1.5, 1.1, D); G.set(3, 5, '#ffffff'); G.set(6, 5, '#ffffff');
      G.ell(5, 7.4, 1.8, 1, Wt); G.set(5, 6, D); G.set(4, 6, Wt);
      G.set(4, 1, '#5aa83a'); G.set(5, 1, '#5aa83a'); G.set(5, 0, '#84c060'); G.set(6, 1, '#3d7a3a'); G.set(4, 2, '#6a4a30');
    } else {   // crane: white body, black neck + tail, red crown, long legs
      const Wt = '#fbfbf6', K = '#2a2a32';
      G.ell(4.6, 5.2, 3.2, 1.9, Wt); G.rect(1, 5, 2, 1, K); G.set(1, 4, K); G.set(2, 6, '#d8dce6');
      G.rect(7, 2, 1, 3, K); G.set(6, 4, K); G.ell(7.6, 1.6, 1.2, 1.1, Wt); G.set(7, 1, '#e0402a'); G.set(9, 2, '#c8a050'); G.set(8, 2, OUT);
      G.rect(4, 7, 1, 2, '#5a5a6a'); G.rect(6, 7, 1, 2, '#5a5a6a');
    }
  }, 'plain'));
}

// ------------------------------------------------------------ v2.1 decor thumbnails (decorIcon helpers)
function _obDecorIcon21(G, id) {
  const P = _obP;
  if (id === 'd_sakura') {
    G.rect(4, 6, 2, 3, '#2f4a7a'); G.set(4, 6, '#5a7aba'); G.rect(3, 7, 4, 2, '#2f4a7a'); G.set(3, 7, '#5a7aba');
    gLine(G, 5, 5, 2, 2, '#5a3828'); gLine(G, 5, 5, 8, 2, '#5a3828');
    [[2, 2, 1.6], [4.6, 1.4, 1.3], [7.6, 2, 1.6], [6.4, 4, 1.2], [2.6, 4.6, 1.1]].forEach(([cx, cy, r]) => G.ell(cx, cy, r, r * .9, (x, y) => (x + y < cx + cy - .5 ? '#fde0ea' : '#f0a8c0')));
    G.set(2, 2, '#d8406a'); G.set(7, 2, '#d8406a');
  } else if (id === 'd_lantern') {
    G.rect(3, 1, 4, 5, '#ffeef0'); G.rect(2, 2, 6, 3, '#ffeef0'); G.set(4, 3, '#fffbea'); G.set(3, 2, '#fffbea');
    G.rect(3, 0, 4, 1, '#a8302a'); G.rect(3, 6, 4, 1, '#a8302a'); G.set(5, 3, '#e8789a'); G.set(6, 3, '#e8789a'); G.set(6, 4, '#f4b8c4'); G.set(2, 4, '#f4b8c4'); G.set(7, 4, '#f4b8c4');
    G.rect(4, 7, 2, 1, '#c8463a'); G.rect(3, 8, 4, 1, '#3a2a2e');
  } else if (id === 'd_windbell') {
    G.rect(4, 0, 2, 1, '#5a4a40'); G.ell(5, 4, 3.4, 3.4, (x, y) => y > 3 ? null : y < 2 ? '#e6f6fa' : '#c4e8f2');
    G.rect(2, 4, 6, 1, '#4a8ad8'); G.set(4, 3, '#e8452e'); G.set(5, 3, '#e8452e'); G.set(6, 3, '#ffb060');
    G.rect(4, 5, 2, 4, '#fbe6ee'); G.rect(5, 5, 1, 4, '#f4c8d8'); G.set(4, 8, '#e8b0c0');
  } else if (id === 'd_fan') {
    G.ell(5, 3.8, 3.8, 3.6, (x, y) => (y > 4 ? '#78bce6' : '#b4def4')); G.rect(4, 7, 2, 2, '#c8a060'); G.set(5, 7, '#a8803a');
    G.set(3, 5, '#4a8ad8'); G.set(5, 5, '#4a8ad8'); G.set(7, 5, '#4a8ad8');
    G.set(4, 3, '#ff6a2a'); G.set(5, 3, '#ff6a2a'); G.set(3, 3, '#ffb060'); G.set(5, 4, '#ff6a2a');
  } else if (id === 'd_momiji') {
    G.rect(3, 7, 4, 2, '#e4d8bc'); G.rect(3, 7, 4, 1, '#f4ecd8'); G.set(5, 6, '#6a4632');
    G.ell(5, 3.4, 4, 3, _obLit(['#8a2a1e', '#ae3a22', '#cc5226', '#e4702c', '#f29a40', '#fac46a'], 4.4, 2.8, 4.4, 3.4));
    G.set(1, 5, '#cc5226'); G.set(8, 5, '#ae3a22');
  } else if (id === 'd_dango') {
    G.rect(1, 7, 8, 1, '#f6e4bc'); G.rect(2, 8, 6, 1, '#d4b880');
    [[2.5, 5.5], [5, 5.5], [7.5, 5.5], [3.8, 3.4], [6.2, 3.4], [5, 1.4]].forEach(([cx, cy]) => { _obSep(G, cx, cy, 1.6, 1.5, '#a89c88'); G.ell(cx, cy, 1.2, 1.1, '#fbf8f0'); });
  } else if (id === 'd_kotatsu') {
    G.rect(1, 4, 8, 4, '#c8463a'); G.rect(2, 4, 6, 1, '#dc6450'); G.set(3, 6, '#f0b050'); G.set(6, 5, '#f0b050'); G.rect(1, 7, 8, 1, '#a8362e');
    G.rect(0, 2, 10, 2, P.woodL); G.rect(0, 3, 10, 1, P.woodD); G.set(3, 1, '#8ac0a0'); G.set(4, 1, '#8ac0a0'); G.set(7, 1, '#f4f0e6');
  } else {   // d_mikan
    [[3, 6, 2.2], [6.8, 6, 2.2], [5, 3, 2.2]].forEach(([cx, cy, r]) => { _obSep(G, cx, cy, r + .7, r + .6, '#8a3a10'); G.ell(cx, cy, r, r * .92, _obLit(_obMIK, cx - .5, cy - .6, r + .3, r + .2)); });
    G.set(5, 1, '#3d7a3a'); G.set(6, 0, '#84c060'); G.set(6, 1, '#5a9a3a');
  }
}
function _obDecorIconGold(G, id) {
  const GP = _obGOLD, gl = (cx, cy, rx, ry) => _obLit(GP, cx, cy, rx, ry, { base: .66, lx: .32 });
  if (id === 'd_maneki') {
    G.ell(5, 6.5, 3.2, 2.6, gl(4.4, 6, 3.6, 3)); G.ell(5, 3.6, 3.2, 2.6, gl(4.4, 3, 3.6, 3)); G.set(2, 1, GP[4]); G.set(7, 1, GP[4]);
    G.rect(8, 1, 1, 3, GP[5]); G.set(8, 1, '#f0a080');
    G.rect(3, 5, 4, 1, '#c8463a'); G.set(5, 6, GP[6]); G.set(4, 3, '#6a3a08'); G.set(6, 3, '#6a3a08');
  } else if (id === 'd_daruma') {
    G.ell(5, 5.2, 3.8, 4, gl(4.2, 4.4, 4.2, 4.4)); G.ell(5, 4.2, 2.2, 1.8, '#fbf4e8');
    G.set(4, 4, OUT); G.set(6, 4, OUT); G.set(4, 7, '#c8463a'); G.set(6, 7, '#c8463a');
  } else if (id === 'd_tank') {
    G.ell(5, 4.6, 3.8, 3.4, (x, y) => y < 4 ? '#e2f6f8' : '#7ad0e0'); G.rect(3, 1, 4, 1, GP[5]); G.rect(3, 8, 4, 1, GP[3]); G.set(3, 8, GP[5]);
    G.rect(4, 5, 2, 1, '#ffc020'); G.set(6, 5, '#fff2a0'); G.set(3, 5, '#ffe060');
  } else {
    G.rect(1, 2, 4, 6, GP[5]); G.rect(5, 2, 4, 6, GP[4]); G.rect(0, 1, 10, 1, GP[3]); G.rect(0, 8, 10, 1, GP[2]);
    G.set(7, 3, '#e0402a'); G.rect(1, 6, 8, 1, '#3a6ab8'); G.set(2, 6, '#5a8ad8'); G.set(6, 6, '#5a8ad8'); G.rect(2, 4, 3, 1, '#f4f4ec');
  }
}
function _obGDecorIcon(G, id) {
  const P = _obP, S = P.st, SD = P.stD, SL = P.stL;
  if (id === 'gd_zen') {
    G.ell(5, 8, 4.8, 1.4, (x, y) => ((x + y) & 1 ? '#ebe7dc' : '#d4cebd'));
    G.ell(5, 4.8, 2.9, 3.6, _obLit(['#5c5c64', '#707078', '#868688', '#9e9c98', '#b8b6ae'], 4, 3.4, 3.4, 4.2)); G.tri(2.2, 3.5, 4, -.4, 7, 2.5, '#9e9c98');
    for (let x = 2; x <= 7; x++) G.set(x, 4, (x & 1) ? '#e8d088' : '#b8944a');
    G.set(3, 5, '#fbfaf4'); G.set(3, 6, '#fbfaf4'); G.set(6, 5, '#fbfaf4'); G.set(6, 6, '#fbfaf4');
  } else if (id === 'gd_mill') {
    G.ell(5, 4.6, 3.8, 3.8, (x, y) => (Math.abs(x - 4.5) < .6 || Math.abs(y - 4.1) < .6) ? '#7a5232' : Math.hypot(x + .5 - 5, y + .5 - 4.6) > 2.6 ? '#a87848' : null);
    G.set(5, 4, '#4a3024'); G.rect(0, 0, 4, 1, '#7cb04a'); G.ell(5, 8.6, 4, 1, '#3a9688');
  } else if (id === 'gd_chime') {
    G.rect(0, 0, 10, 1, '#7cb04a');
    [[2, '#b4e0f4'], [7, '#fad4de']].forEach(([x0, g1]) => { G.rect(x0 - 1, 2, 3, 2, g1); G.rect(x0 - 1, 3, 3, 1, mixHex(g1, '#4a6a8a', .3)); G.set(x0, 1, '#5a4a40'); G.rect(x0, 4, 1, 4, '#fbf4e0'); });
  } else if (id === 'gd_lantern') {
    G.rect(4, 0, 2, 1, S); G.rect(1, 1, 8, 2, S); G.rect(1, 1, 3, 1, SL); G.set(0, 1, SL); G.set(9, 1, SD);
    G.rect(3, 3, 4, 2, S); G.rect(4, 3, 2, 2, '#ffd27a'); G.rect(2, 5, 6, 1, SL); G.rect(4, 6, 2, 2, S); G.rect(2, 8, 6, 1, SD);
  } else if (id === 'gd_tower') {
    G.tri(.5, 3.5, 4.5, -.5, 8.5, 3.5, '#c8463a'); G.rect(1, 3, 7, 3, '#e8d4a8'); G.set(4, 4, '#3a2a24'); G.set(4, 5, '#3a2a24');
    G.rect(0, 6, 9, 1, P.wood); G.rect(3, 7, 2, 2, '#e0c888'); G.set(3, 8, '#c8a868'); G.rect(1, 9, 8, 1, P.woodD);
  } else if (id === 'gd_wisteria') {
    G.ell(5, 1.4, 4.8, 1.6, '#5a9a3a'); G.rect(0, 2, 10, 1, P.dk);
    [[1, 5], [3, 6], [5, 7], [7, 5], [9, 4]].forEach(([x0, n]) => { for (let j = 0; j < n; j++) G.set(x0, 3 + j, j < n - 2 ? '#8a6ad8' : '#c8b4f4'); });
  } else if (id === 'gd_torii') {
    G.rect(0, 0, 10, 1, '#2e2628'); G.rect(1, 1, 8, 1, '#d8402a'); G.rect(1, 3, 8, 1, '#d8402a');
    G.rect(2, 1, 2, 8, '#d8402a'); G.rect(6, 1, 2, 8, '#d8402a'); G.rect(2, 1, 1, 8, '#f06a4a'); G.rect(6, 1, 1, 8, '#f06a4a'); G.rect(4, 2, 2, 1, '#3a2a2a');
  } else {   // gd_teahouse
    G.tri(-.5, 4.5, 5, -.5, 10.5, 4.5, '#c8a860'); G.set(4, 1, '#e0c880'); G.set(3, 2, '#e0c880'); G.rect(0, 4, 10, 1, '#7a6038');
    G.rect(1, 5, 8, 4, '#e6d8b8'); G.set(3, 6, '#5a4a30'); G.set(2, 7, '#5a4a30'); G.set(3, 7, '#c8b080'); G.rect(6, 6, 2, 3, '#8a6a44');
  }
}

// ------------------------------------------------------------ v2.1 wardrobe icons (16.6): 10x10, centre anchor
// outfitIcon(id): player outfits o_yukata o_chef (kappogi) o_momiji o_snow o_hakama o_ninja o_samurai o_maneki.
// uniformIcon(id): staff uniforms u_sakura u_aizome u_sailor u_gold (bare 'sakura' ... accepted).
const _obOUTFIT = {   // kimono-shaped: [sleeve/body, dark edge, collar, sash, pattern colour, pattern pts]
  o_yukata: ['#f4f0e6', '#c8c4d8', '#3a4a8a', '#c8463a', '#6a74e0', [[2, 2], [7, 3], [5, 6], [2, 4]]],
  o_chef: ['#fbfbf6', '#d8dce6', '#e8e4dc', '#e8e4dc', '#c8463a', [[4, 3]]],
  o_momiji: ['#e07a3a', '#a8482a', '#3a2a24', '#3a2a24', '#ffd060', [[2, 3], [7, 2], [6, 6], [3, 7]]],
  o_snow: ['#3a5a9a', '#2a3a6a', '#fbfbf6', '#c8463a', '#e8f0fc', [[2, 2], [7, 4], [4, 6], [6, 7], [2, 5]]],
  o_hakama: ['#3a4a7a', '#2a3460', '#f4f0e6', '#7a2a3a', '#e8ecf4', [[2, 2], [7, 3]]],
};
function outfitIcon(id) {
  const k = String(id || '').replace(/^o_/, '');
  id = ['yukata', 'chef', 'momiji', 'snow', 'hakama', 'ninja', 'samurai', 'maneki'].indexOf(k) >= 0 ? 'o_' + k : 'o_yukata';
  return art('ob:outfit:' + id, () => paint(10, 10, G => {
    if (_obOUTFIT[id]) {
      const [B, D, C, O, pc, pts] = _obOUTFIT[id];
      G.rect(1, 1, 8, 4, B); G.rect(2, 5, 6, 4, B); G.rect(1, 4, 2, 1, D); G.rect(7, 4, 2, 1, D);   // sleeves + body
      G.rect(2, 8, 6, 1, D);
      G.set(3, 1, C); G.set(4, 2, C); G.set(5, 3, C); G.set(6, 1, C); G.set(5, 2, C); G.set(4, 1, '#f0c8a0'); G.set(5, 1, '#f0c8a0');   // crossed collar
      G.rect(2, 5, 6, 1, O);                                                                                        // sash
      pts.forEach(([x, y]) => G.set(x, y, pc));
      if (id === 'o_chef') { G.rect(2, 5, 6, 1, '#fbfbf6'); G.set(7, 5, '#c8463a'); G.set(8, 6, '#c8463a'); G.rect(1, 4, 2, 1, '#d8dce6'); }   // kappogi: tie at the back
      if (id === 'o_hakama') { G.rect(2, 6, 6, 3, '#7a2a3a'); G.set(4, 6, '#5a1e2a'); G.set(5, 7, '#5a1e2a'); G.set(4, 8, '#5a1e2a'); G.set(6, 8, '#5a1e2a'); }   // maroon hakama
      if (id === 'o_snow') { G.rect(1, 1, 8, 1, '#fbfbf6'); G.set(4, 1, '#fbfbf6'); G.set(5, 1, '#fbfbf6'); }   // fur collar
    } else if (id === 'o_ninja') {   // hood with an eye slit (orange fur), knot tails
      G.ell(5, 5.2, 4, 3.8, '#2a2a3a'); G.rect(2, 4, 6, 2, '#f0a048'); G.set(3, 4, OUT); G.set(6, 4, OUT); G.set(2, 5, '#c8742a'); G.set(7, 5, '#c8742a');
      G.set(8, 2, '#2a2a3a'); G.set(9, 1, '#2a2a3a'); G.set(9, 3, '#3a3a4a'); G.rect(2, 2, 5, 1, '#3a3a4e'); G.set(4, 8, '#c8463a'); G.set(5, 8, '#c8463a');
    } else if (id === 'o_samurai') {   // kabuto: lacquer bowl, gold horns, red-laced neck guard
      G.ell(5, 5, 3.6, 2.6, '#3a2a2e'); G.rect(1, 6, 8, 1, '#5a3a3a');
      G.rect(1, 7, 8, 1, '#a8302a'); G.rect(2, 8, 6, 1, '#c8463a'); G.set(3, 7, '#e8c070'); G.set(6, 7, '#e8c070');
      gLine(G, 4, 3, 2, 0, '#ffd23f'); gLine(G, 5, 3, 7, 0, '#ffd23f'); G.set(4, 3, '#d89a20'); G.set(5, 3, '#d89a20'); G.set(4, 4, '#5a4448');
    } else {   // o_maneki: the lucky-cat suit, one paw up, red collar + gold bell
      const Wc = '#fbfbf6';
      G.ell(4.6, 6.6, 3.2, 2.4, Wc); G.ell(4.6, 3.8, 3, 2.4, Wc); G.set(2, 1, Wc); G.set(7, 1, Wc); G.set(2, 1, '#ff8a9a'); G.set(7, 1, '#ff8a9a');
      G.rect(8, 1, 1, 4, Wc); G.set(8, 0, Wc); G.set(9, 1, Wc);
      G.rect(2, 5, 6, 1, '#c8463a'); G.ell(4.6, 6.6, 1, 1, '#ffd23f'); G.set(3, 3, OUT); G.set(6, 3, OUT); G.set(3, 2, '#f0a040');
    }
  }, 'plain'));
}
const _obUNIFORM = {   // happi coat: [body, dark, front band, pattern]
  u_sakura: ['#f4a8c0', '#d07890', '#fbf6ea', '#fde0ea'],
  u_aizome: ['#2a3a6a', '#1e2a50', '#f4f0e6', '#8aa4d8'],
  u_sailor: ['#fbfbf6', '#d8dce6', '#2a3a6a', '#c8463a'],
  u_gold: ['#2a3a6a', '#1e2a50', '#ffd23f', '#ffd23f'],
};
function uniformIcon(id) {
  const k = String(id || '').replace(/^u_/, '');
  id = _obUNIFORM['u_' + k] ? 'u_' + k : 'u_sakura';
  return art('ob:uniform:' + id, () => paint(10, 10, G => {
    const [B, D, F, pt] = _obUNIFORM[id];
    G.rect(0, 1, 10, 3, B); G.rect(1, 1, 8, 8, B); G.rect(0, 3, 2, 1, D); G.rect(8, 3, 2, 1, D); G.rect(1, 8, 8, 1, D);   // boxy sleeves + body
    if (id === 'u_sailor') {
      G.rect(2, 1, 6, 2, F); G.set(4, 3, F); G.set(5, 3, F); G.rect(2, 2, 6, 1, '#fbfbf6'); G.set(4, 2, F); G.set(5, 2, F);   // navy collar, white stripe
      G.set(4, 4, pt); G.set(5, 4, pt); G.set(4, 5, pt); G.rect(1, 7, 8, 1, F);
    } else {
      G.rect(4, 1, 1, 8, F); G.rect(5, 1, 1, 8, F); G.set(3, 1, F); G.set(6, 1, F);                                        // front bands
      if (id === 'u_gold') { G.rect(1, 8, 8, 1, F); G.rect(0, 3, 2, 1, F); G.rect(8, 3, 2, 1, F); G.set(2, 5, '#ffe680'); G.set(7, 5, '#ffe680'); }
      else [[2, 3], [7, 2], [2, 6], [7, 6]].forEach(([x, y]) => G.set(x, y, pt));
    }
  }, 'plain'));
}

// ------------------------------------------------------------ v2.1 keepsakes: trophies, covers, festival medals
// trophyArt(k) 12x14, centre anchor (6,7); the base is the bottom row, so it can also stand on a shelf at (6,14).
// k 0 / 'gold' gold cup, 1 / 'silver', 2 / 'bronze', 3 / 'pop' (popularity: gold cup with a red heart), 4 / 'effort' (wooden
// shield with a paw print). Order = the 16.3 award ladder.
const _obMETAL = {
  silver: ['#4a5060', '#6a7080', '#8a90a0', '#acb2be', '#ccd2dc', '#e8ecf2', '#f8fafc'],
  bronze: ['#5a2c14', '#7a4020', '#9a5830', '#ba7444', '#d4925e', '#e8b07c', '#f4cc9c'],
};
function trophyArt(k) {
  const K = ['gold', 'silver', 'bronze', 'pop', 'effort'];
  let i = typeof k === 'string' ? K.indexOf(k === 'popular' ? 'pop' : k) : k | 0;
  if (i < 0 || i > 4) i = 4;
  return art('ob:trophy:' + i, () => paint(12, 14, G => {
    G.rect(2, 10, 8, 3, '#5a3420'); G.rect(2, 10, 8, 1, '#7a4a2a'); G.rect(4, 11, 4, 1, i === 1 ? '#ccd2dc' : i === 2 ? '#d4925e' : '#ffd23f');   // plinth + plate
    if (i === 4) {   // effort: a wooden shield with a paw print
      G.rect(2, 1, 8, 6, '#c8935a'); G.rect(3, 7, 6, 1, '#c8935a'); G.rect(4, 8, 4, 1, '#c8935a'); G.rect(2, 1, 8, 1, '#dba876'); G.rect(2, 1, 1, 7, '#dba876');
      _obPat(G, 3, 2, ['.X.X.', 'X...X', '.XXX.', '.XXX.'], { X: '#5aa83a' });
      return;
    }
    const pal = i === 1 ? _obMETAL.silver : i === 2 ? _obMETAL.bronze : _obGOLD;
    const pk = _obLit(pal, 5, 3, 4.4, 4, { base: .66, lx: .34 });
    for (let y = 1; y <= 6; y++) { const hw = [4, 4, 4, 3.5, 3, 2][y - 1]; for (let x = R(6 - hw); x < R(6 + hw); x++) G.set(x, y, pk(x, y)); }
    G.rect(2, 1, 8, 1, pal[5]); G.rect(3, 1, 6, 1, pal[3]);                                                         // rim + the dark inside
    [[1, 2], [1, 3], [2, 4], [10, 2], [10, 3], [9, 4]].forEach(([x, y]) => G.set(x, y, pal[4]));                       // handles
    G.rect(5, 7, 2, 2, pal[3]); G.set(5, 7, pal[5]); G.rect(4, 9, 4, 1, pal[4]);                                     // stem + foot
    if (i === 3) _obPat(G, 4, 3, ['R.R', 'RRR', '.R.'], { R: '#e8453c' });
    else G.set(3, 2, '#ffffff');
  }, 'plain'));
}
// coverArt(k, tv, season) 10x12, centre anchor: a magazine cover (tv true: a little TV set) with k = 1..5 stars (the press
// visit result, 16.4), season 0..3 tints the photo. coverArt(k) alone = a spring magazine.
function coverArt(k, tv, season) {
  const n = clamp(k | 0, 1, 5), t = !!tv, s = clamp(season | 0, 0, 3);
  return art('ob:cover:' + n + ':' + (t ? 1 : 0) + ':' + s, () => {
    const c = mk(10, 12), x = c.getContext('2d'), px = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w || 1, h || 1); };
    const SKY = ['#f8c8d8', '#a8dcf0', '#f4c08a', '#dce8f4'][s];
    const photo = (y0) => {   // a cat soaking in the onsen, steam, the season's sky
      px(SKY, 1, y0, 8, 6); px('#4cbaa4', 1, y0 + 4, 8, 2); px('#86dcc4', 1, y0 + 4, 8, 1);
      px('#f0a048', 3, y0 + 2, 4, 2); px('#f0a048', 3, y0 + 1, 1, 1); px('#f0a048', 6, y0 + 1, 1, 1); px(OUT, 4, y0 + 3, 1, 1); px(OUT, 5, y0 + 3, 1, 1);
      px('rgba(255,255,255,.8)', 2, y0, 1, 1); px('rgba(255,255,255,.8)', 7, y0 + 1, 1, 1);
      if (s === 0) px('#e8789a', 8, y0, 1, 1); else if (s === 2) px('#e0602a', 1, y0 + 1, 1, 1); else if (s === 3) { px('#ffffff', 2, y0 + 2, 1, 1); px('#ffffff', 8, y0 + 2, 1, 1); }
    };
    const stars = y => { for (let i = 0; i < 5; i++) px(i < n ? '#ffd23f' : '#9a92a0', 2 + i + (i > 1 ? 0 : 0), y, 1, 1); };
    if (!t) {
      px(OUT, 0, 0, 10, 12); px('#fbf4e0', 1, 1, 8, 10); px('#e8dcc0', 8, 1, 1, 10);
      px('#c8463a', 1, 1, 8, 2); px('#fbf4e0', 2, 1, 1, 1); px('#fbf4e0', 4, 1, 2, 1); px('#fbf4e0', 7, 1, 1, 1);   // masthead
      photo(3); stars(10);
      px(n >= 5 ? '#ffd23f' : '#c8463a', 8, 9, 1, 1);
    } else {
      px('#5a5a6a', 3, 0, 1, 1); px('#5a5a6a', 6, 0, 1, 1); px('#5a5a6a', 4, 1, 2, 1);                             // antenna
      px(OUT, 0, 2, 10, 10); px('#5a5a6a', 1, 3, 8, 8); px('#7a7a8a', 1, 3, 8, 1);
      photo(4); px('#3a3a48', 1, 10, 8, 1); stars(10); px('#e8453c', 8, 10, 1, 1);
    }
    return c;
  });
}
// medalArt(season) 9x9, centre anchor: the festival medal (16.2) of season 0 spring (sakura) / 1 summer (firework) /
// 2 autumn (full moon) / 3 winter (new-year sun); ribbon in the season's colours, gold disc
function medalArt(season) {
  const s = clamp(season | 0, 0, 3);
  return art('ob:medal:' + s, () => paint(9, 9, G => {
    const RB = [['#f0a0c0', '#fbf6ea'], ['#4a8ad8', '#2a3a6a'], ['#e07a3a', '#a8302a'], ['#c8302a', '#fbf6ea']][s];
    G.set(2, 1, RB[0]); G.set(3, 1, RB[0]); G.set(5, 1, RB[1]); G.set(6, 1, RB[1]); G.set(3, 2, RB[0]); G.set(5, 2, RB[1]); G.set(4, 2, RB[0]);
    G.ell(4.5, 5.3, 2.9, 2.6, (x, y) => (x + y < 7 ? '#ffe070' : x + y > 10 ? '#c88a18' : '#f0b830'));
    const IN = [['#fde0ea', '#e8789a', '#ffd23f'], ['#2a3a6a', '#ffd23f', '#f0a0c0'], ['#2f3a7a', '#fff2a8', '#fff2a8'], ['#fbf6ea', '#c8302a', '#c8302a']][s];
    G.set(4, 5, IN[2]); G.set(3, 5, IN[1]); G.set(5, 5, IN[1]); G.set(4, 4, IN[1]); G.set(4, 6, IN[1]);
    if (s === 2) { G.set(3, 5, IN[0]); G.set(5, 5, '#fff2a8'); G.set(4, 4, '#fff2a8'); G.set(4, 6, IN[0]); G.set(3, 4, IN[0]); }
    if (s === 3) { G.set(3, 4, '#e86a5a'); G.set(5, 4, '#e86a5a'); G.set(3, 6, '#e86a5a'); G.set(5, 6, '#e86a5a'); G.set(4, 5, '#e8453c'); }
    if (s === 1) { G.set(3, 4, '#ffd23f'); G.set(5, 4, '#ffd23f'); G.set(3, 6, '#ffd23f'); G.set(5, 6, '#ffd23f'); G.set(3, 5, IN[0]); G.set(5, 5, IN[0]); G.set(4, 4, IN[0]); G.set(4, 6, IN[0]); }
    if (s === 0) { G.set(3, 4, '#f0b830'); G.set(5, 4, '#f0b830'); }
  }, 'plain'));
}

// ------------------------------------------------------------ v2.1 HUD: season icon, festival lantern progress
function seasonIcon(s) {   // 7x7, centre anchor: 0 spring sakura / 1 summer sun / 2 autumn maple leaf / 3 winter snowflake
  const k = clamp(s | 0, 0, 3);
  const SI = [
    [['.P.P.', 'PPPPP', '.PyP.', 'PPPPP', '.P.P.'], { P: '#f4a0bc', y: '#ffd23f' }],
    [['Y.Y.Y', '.OOO.', 'YOoOY', '.OOO.', 'Y.Y.Y'], { Y: '#ffd23f', O: '#f8a830', o: '#fff2a8' }],
    [['..M..', 'M.M.M', 'MMMMM', '.MmM.', '..b..'], { M: '#e8602a', m: '#f8a040', b: '#8a4a2a' }],
    [['C.C.C', '.CCC.', 'CCwCC', '.CCC.', 'C.C.C'], { C: '#a8d8f8', w: '#ffffff' }],
  ][k];
  return _obIco('ob:season:' + k, SI[0], SI[1]);
}
function lanternIcon(on) {   // 5x7 festival progress lantern, centre anchor: on = lit red chochin, off = dim unlit paper
  const o = !!on;
  return art('ob:lan:' + (o ? 1 : 0), () => {
    const c = mk(5, 7), x = c.getContext('2d');
    const pal = o ? { d: '#3a2a2e', e: '#a8302a', R: '#e0503a', y: '#ffb070', Y: '#ffd27a' } : { d: '#3a2e30', e: '#5e5458', R: '#8a7e80', y: '#9a8e8e', Y: '#a89c9a' };
    ['.ddd.', 'eRRRe', 'RyYyR', 'RYYYR', 'RyYyR', 'eRRRe', '.ddd.'].forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
    return c;
  });
}

// ------------------------------------------------------------ emblems (same ids AND motifs as the noren crests in env.js)
// 7x7 badge = noren-coloured tile with the 5x5 crest. The crest rows are copied from env.js (_EN_EMB) so the bubble
// over a guest matches the door he walks to; keep the two tables in sync. X = crest, o = accent; on light cloth
// (luminance > .6) the crest is a dark mix of the cloth colour, else white with a warm-yellow accent (as env.js).
const _obEMB = {
  pine: ['#3d6a3a', ['..X..', '.XXX.', 'XXXXX', '..X..', '..X..']],
  bamboo: ['#6aa84a', ['X..X.', 'X..XX', 'o..o.', 'X..X.', 'XX.X.']],
  plum: ['#c8463a', ['..X..', 'XXXXX', 'XXoXX', '.XXX.', '.X.X.']],
  sakura: ['#e890a8', ['X...X', 'XX.XX', 'XXXXX', '.XXX.', '..X..']],
  chrys: ['#e0b030', ['X.X.X', '.XXX.', 'XXoXX', '.XXX.', 'X.X.X']],
  maple: ['#e0602a', ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', '..X..']],
  bush: ['#a05aa8', ['...XX', '..X.o', '.X..o', 'X.o..', 'X....']],
  camellia: ['#b02a4a', ['.XXX.', 'XXoXX', 'XoooX', 'XXoXX', '.XXX.']],
  tea: ['#7a8a3a', ['.X.X.', 'XX.XX', 'XX.XX', '.X.X.', '..X..']],
  wisteria: ['#8a7ad8', ['XXXXX', 'X.X.X', 'X.X.X', '.X.X.', '.X...']],
  orchid: ['#d070c0', ['X...X', 'XX.XX', '.XoX.', '..X..', '..X..']],
  hana: ['#f0a8c0', ['.XXX.', 'XXoXX', '.XXX.', '..X..', '.XX..']],
  firefly: ['#2f5a3a', ['.X.X.', 'XXXXX', '.XXX.', '..o..', '.ooo.']],
  moon: ['#2f3a7a', ['.XXX.', 'XX...', 'X..o.', 'XX...', '.XXX.']],
  snow: ['#a8c8e8', ['..X..', 'X.X.X', '.XXX.', 'X.X.X', '..X..']],
  rice: ['#5a3a24', ['.XXX.', 'XXXXX', '.....', 'XXXXX', '.XXX.']],
  pinebranch: ['#2f5a3a', ['X...X', 'X...X', '.X.X.', '.X.X.', '..X..']],
  ga: ['#8a5ac8', ['XXXXX', 'XoXoX', '.XXX.', '..X..', '..X..']],
  zen: ['#5a9a5a', ['.XXX.', 'X...X', 'X...X', 'X..X.', '.X...']],
  cat: ['#f0a048', ['X.X.X', '.....', '.XXX.', 'XXXXX', '.XXX.']],
  fuku: ['#e0b030', ['.X.X.', '..X..', '.XXX.', 'XXXXX', '.XXX.']],
  fish: ['#d8b048', ['.....', '.XX.X', 'XXXXX', '.XX.X', '.....']],
  tea2: ['#4ab8a8', ['.X.X.', 'X.X..', 'XXXXX', 'XXXXX', '.XXX.']],
  // v2.1 seasonal combos (16.1; noren colours from the table). New ids: env.js needs the same crests for the door noren.
  yozakura: ['#f0a0c0', ['.XX..', 'X..o.', 'X.ooo', 'X..o.', '.XX..']],   // night sakura: crescent moon + blossom
  suzumi: ['#6ac8e8', ['.XXX.', 'XXXXX', 'XXXXX', '..o..', '..o..']],    // summer cool: wind bell
  tsukimi: ['#e07a3a', ['.ooo.', 'ooooo', '.ooo.', 'X.X.X', 'X.X.X']],   // moon viewing: full moon over pampas
  kotatsu: ['#d84a3a', ['..X..', '.ooo.', 'ooooo', 'ooooo', '.ooo.']],   // winter kotatsu: a mandarin
  yume: ['#4ab8a8', ['X...X', 'XXXXX', 'XoXoX', 'XXXXX', '.XXX.']],      // cat's dream: a cat face
  shinnen: ['#e0603a', ['.ooo.', 'ooooo', '..X..', '.XXX.', 'XXXXX']],   // new year: first sun over the mountain
};
function emblemArt(emb) {   // 7x7 room / area / combo emblem badge, centre anchor
  if (!_obEMB[emb]) emb = 'pine';
  return art('ob:emb:' + emb, () => {
    const [bg, rs] = _obEMB[emb], c = mk(7, 7), x = c.getContext('2d');
    const n = parseInt(bg.slice(1), 16), lum = (((n >> 16) & 255) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) / 255;
    const light = lum > .6, main = light ? mixHex(bg, OUT, .68) : '#f4f0e6', acc = light ? mixHex(bg, OUT, .4) : '#ffd27a';
    x.fillStyle = mixHex(bg, OUT, .55); x.fillRect(1, 0, 5, 7); x.fillRect(0, 1, 7, 5);
    x.fillStyle = bg; x.fillRect(1, 1, 5, 5);
    rs.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X' || ch === 'o') { x.fillStyle = ch === 'X' ? main : acc; x.fillRect(1 + i, 1 + j, 1, 1); } }));
    return c;
  });
}

// ------------------------------------------------------------ menu / HUD
function menuIcon(kind) {   // 12x12 menu button icon, centre anchor
  const K = ['play', 'sound', 'music', 'sfx', 'talk', 'book', 'bag', 'house', 'back', 'prev', 'next', 'lock', 'camera', 'day', 'cat', 'chart'];
  if (K.indexOf(kind) < 0) kind = 'play';
  return art('ob:menu:' + kind, () => paint(12, 12, G => {
    const P = _obP, Wc = '#ffffff', Wd = '#dfe4ee';
    if (kind === 'play') { for (let y = 2; y <= 9; y++) { const w = y <= 5 ? y - 1 : 10 - y; G.rect(3, y, w * 1.4 + 1 | 0, 1, y < 6 ? Wc : Wd); } }
    else if (kind === 'sound') {
      G.rect(1, 4, 3, 4, Wc); G.tri(3, 6, 6.5, 1.5, 6.5, 10.5, Wc); G.rect(4, 3, 3, 6, Wc);
      G.set(8, 4, Wc); G.set(8, 7, Wc); G.set(9, 5, Wc); G.set(9, 6, Wc); G.set(10, 3, Wd); G.set(10, 8, Wd); G.rect(11, 4, 1, 4, Wd);
    } else if (kind === 'music') {
      G.ell(4.4, 9, 2.6, 1.9, Wc); G.rect(6, 1, 2, 8, Wc); G.rect(8, 2, 1, 2, Wc); G.set(9, 3, Wc); G.set(9, 4, Wc); G.set(10, 5, Wd); G.set(10, 6, Wd);
    } else if (kind === 'sfx') {
      G.ell(6, 6.6, 4, 3.8, (x, y) => y > 8 ? null : (x + y < 9 ? '#fff2a8' : P.gold)); G.rect(2, 8, 8, 2, '#f0b830'); G.rect(5, 1, 2, 2, '#d89a20'); G.set(6, 10, '#8a5a10');
    } else if (kind === 'talk') {
      G.rect(1, 2, 10, 6, Wc); G.rect(2, 1, 8, 8, Wc); G.set(3, 9, Wc); G.set(3, 10, Wc); G.set(4, 9, Wc);
      [3, 6, 9].forEach(x => G.set(x, 5, '#5a5a6e'));
    } else if (kind === 'book') {
      G.rect(1, 2, 10, 8, '#c8463a'); G.rect(1, 2, 10, 1, '#e0604a'); G.rect(5, 2, 2, 8, '#8a2a22');
      G.rect(2, 3, 3, 6, '#f4ecd8'); G.rect(7, 3, 3, 6, '#f4ecd8'); G.rect(2, 5, 2, 1, '#b0a898'); G.rect(8, 4, 2, 1, '#b0a898'); G.rect(8, 6, 2, 1, '#b0a898');
    } else if (kind === 'bag') {
      G.rect(2, 4, 8, 7, '#f0a048'); G.rect(2, 4, 8, 1, '#ffc878'); G.rect(2, 10, 8, 1, '#c8742a');
      [[4, 3], [4, 2], [5, 1], [6, 1], [7, 2], [7, 3]].forEach(([x, y]) => G.set(x, y, '#8a4a20')); G.rect(5, 6, 2, 2, '#fff2a8');
    } else if (kind === 'house') {
      G.tri(.5, 5.5, 6, .5, 11.5, 5.5, '#c8463a'); G.rect(2, 5, 8, 6, '#f4ecd8'); G.rect(5, 7, 2, 4, '#8a5a34'); G.rect(1, 5, 10, 1, '#8a2a22');
      G.set(3, 7, '#8ab8f8'); G.set(8, 7, '#8ab8f8');
    } else if (kind === 'back') {
      G.tri(.5, 5.5, 5.5, .5, 5.5, 10.5, Wc); G.rect(5, 4, 6, 3, Wc); G.rect(5, 6, 6, 1, Wd);
    } else if (kind === 'prev') { G.tri(2.5, 6, 8.5, 1.5, 8.5, 10.5, Wc); }
    else if (kind === 'next') { G.tri(9.5, 6, 3.5, 1.5, 3.5, 10.5, Wc); }
    else if (kind === 'lock') {
      [[3, 5], [3, 4], [3, 3], [4, 2], [5, 1], [6, 1], [7, 2], [8, 3], [8, 4], [8, 5]].forEach(([x, y]) => G.set(x, y, '#c8c8d0'));
      G.rect(2, 5, 8, 6, P.gold); G.rect(2, 5, 8, 1, '#fff2a8'); G.rect(5, 7, 2, 2, '#8a5a10'); G.set(5, 9, '#8a5a10');
    } else if (kind === 'camera') {
      G.rect(1, 3, 10, 7, '#5a5a6a'); G.rect(1, 3, 10, 1, '#7a7a8a'); G.rect(3, 2, 3, 1, '#5a5a6a');
      G.ell(6, 6.5, 2.6, 2.6, '#2a2a36'); G.ell(6, 6.5, 1.5, 1.5, '#5a8ac8'); G.set(5, 5, '#ffffff'); G.set(9, 4, '#ffd23f');
    } else if (kind === 'day') {
      G.rect(1, 2, 10, 9, '#f6f2ea'); G.rect(1, 2, 10, 3, '#c8463a'); G.set(3, 1, '#5a5a6a'); G.set(8, 1, '#5a5a6a');
      G.rect(3, 6, 2, 1, '#8a8a96'); G.rect(6, 6, 2, 1, '#8a8a96'); G.rect(3, 8, 2, 1, '#8a8a96'); G.rect(6, 8, 2, 1, '#c8463a');
    } else if (kind === 'cat') {
      G.ell(6, 6.8, 4.6, 3.8, '#f0a048'); G.tri(1.5, 5.5, 2, 1, 5, 3.6, '#f0a048'); G.tri(7, 3.6, 10, 1, 10.5, 5.5, '#f0a048');
      G.set(4, 6, OUT); G.set(7, 6, OUT); G.set(5, 8, P.pink); G.set(6, 8, P.pink); G.rect(5, 3, 2, 1, '#c8742a'); G.set(2, 3, P.pink); G.set(9, 3, P.pink);
    } else {
      G.rect(1, 10, 10, 1, Wd); G.rect(1, 1, 1, 10, Wd);
      G.rect(3, 7, 2, 3, '#4a88e0'); G.rect(6, 5, 2, 5, '#4a88e0'); G.rect(9, 2, 2, 8, '#5ac85a');
    }
  }, 'plain'));
}

function pauseIcon() {   // 5x7 pause glyph (two white bars), centre anchor; for the HUD menu pill
  return art('ob:pause', () => { const c = mk(5, 7), x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2, 7); x.fillRect(3, 0, 2, 7); x.fillStyle = '#dfe4ee'; x.fillRect(0, 6, 2, 1); x.fillRect(3, 6, 2, 1); return c; });
}

function toggleArt(on) {   // 22x11 on/off switch, centre anchor; on = green, knob right; off = grey, knob left
  on = !!on;
  return art('ob:toggle:' + (on ? 1 : 0), () => {
    const c = mk(22, 11), x = c.getContext('2d'), px = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    px(OUT, 2, 0, 18, 11); px(OUT, 1, 1, 20, 9); px(OUT, 0, 2, 22, 7);
    const b = on ? ['#3aa04a', '#5ac85a', '#8ae08a'] : ['#6a6478', '#8a8496', '#a8a2b4'];
    px(b[1], 2, 1, 18, 9); px(b[1], 1, 2, 20, 7); px(b[0], 2, 8, 18, 1); px(b[2], 3, 2, 16, 1);
    const kx = on ? 12 : 2;
    px(OUT, kx, 1, 8, 9); px('#ffffff', kx + 1, 2, 6, 7); px('#ffffff', kx, 3, 8, 5); px('#dfe4ee', kx + 1, 7, 6, 1); px('#dfe4ee', kx + 6, 3, 1, 4);
    px(OUT, kx - (on ? 0 : 0), 2, 1, 1);
    if (on) { px('#ffffff', 5, 3, 1, 5); } else { px('#dfe4ee', 14, 3, 4, 1); px('#dfe4ee', 14, 7, 4, 1); px('#dfe4ee', 13, 4, 1, 3); px('#dfe4ee', 18, 4, 1, 3); }
    return c;
  });
}

function rankBadge(id) {   // 9x9 rival-inn badge (animal face), centre anchor; 'me' = the player's orange cat
  const K = ['panda', 'penguin', 'otter', 'deer', 'monkey', 'rabbit', 'tanuki', 'bear', 'fox', 'me'];
  if (K.indexOf(id) < 0) id = 'me';
  const F = {
    panda: [['B.....B', 'BWWWWWB', 'WBBWBBW', 'WBeWeBW', 'WWWnWWW', '.WWWWW.', '..WWW..'], { B: '#2a2a32', W: '#f6f4ee', e: '#ffffff', n: '#2a2a32' }],
    penguin: [['.BBBBB.', 'BBBBBBB', 'BWWBWWB', 'BWeWeWB', 'BWWoWWB', '.WWWWW.', '..WWW..'], { B: '#2e3448', W: '#f6f4ee', e: '#2a2a32', o: '#ffa020' }],
    otter: [['.b...b.', 'bBBBBBb', 'BBBBBBB', 'BeBBBeB', 'BWWnWWB', '.WWWWW.', '..WWW..'], { B: '#9a6a48', b: '#7a5038', W: '#e8dcc8', e: '#2a2228', n: '#2a2228' }],
    deer: [['a.....a', '.a...a.', 'BBBBBBB', 'BeBBBeB', 'BBBWBBB', '.BWnWB.', '..WWW..'], { a: '#8a5a34', B: '#c8864a', W: '#f4e6d0', e: '#2a2228', n: '#2a2228' }],
    monkey: [['..BBB..', '.BBBBB.', 'BpppppB', 'peBpBep', 'ppppppp', '.ppnpp.', '..ppp..'], { B: '#8a5a3a', p: '#f0b8a0', e: '#2a2228', n: '#c8706a' }],
    rabbit: [['.W...W.', '.Wp.pW.', '.WW.WW.', 'WWWWWWW', 'WeWWWeW', 'WWpnpWW', '.WWWWW.'], { W: '#f6f4ee', p: '#f4a8b8', e: '#2a2228', n: '#e87a8a' }],
    tanuki: [['B.....B', 'BBBBBBB', 'DDBBBDD', 'DeDWDeD', 'BWWnWWB', '.WWWWW.', '..BBB..'], { B: '#8a7a6a', D: '#3a3230', W: '#e8e0d0', e: '#ffffff', n: '#2a2228' }],
    bear: [['BB...BB', 'BBBBBBB', 'BBBBBBB', 'BeBBBeB', 'BBTTTBB', '.BTnTB.', '..BBB..'], { B: '#7a4a2a', T: '#d8a878', e: '#2a2228', n: '#2a2228' }],
    fox: [['O.....O', 'OO...OO', 'OOOOOOO', 'OeOOOeO', 'WWOOOWW', '.WWnWW.', '..WWW..'], { O: '#f08a3a', W: '#fbf4e8', e: '#2a2228', n: '#2a2228' }],
    me: [['O.....O', 'OO...OO', 'OOSSSOO', 'OeOOOeO', 'OOOpOOO', '.WWWWW.', '..WWW..'], { O: '#f0a048', S: '#c8742a', W: '#fbf4e8', e: '#2a2228', p: '#ff8a9a' }],
  };
  return _obIco('ob:rank:' + id, F[id][0], F[id][1]);
}

function trophyIcon() { return _obIco('ob:trophy', ['YLYYD', 'YYYYD', '.YYD.', '..D..', '.YYD.'], { Y: '#ffd23f', L: '#fff6c0', D: '#d89a20' }); }   // 7x7
function heartIcon() { return _obIco('ob:heart', ['RR.RR', 'RhRRR', '.RRR.', '..R..'], { R: '#e8453c', h: '#ff9a9a' }); }                                   // 7x6
function bellIcon() { return _obIco('ob:bell', ['..Y..', '.LYY.', '.YYD.', 'YYYYD', '..d..'], { Y: '#ffd23f', L: '#fff6c0', D: '#d89a20', d: '#8a5a10' }); }       // 7x7

function skyDialArt(night) {   // 21x11 HUD day dial: half disc, horizon at the bottom. Core moves sunIcon / moonIcon along the arc
  // centred (10.5, 10), radius ~7 (dotted track). Optional night 0..1 darkens the sky (4 steps); omitted = day.
  const nq = clamp(Math.round((+night || 0) * 3), 0, 3);
  return art('ob:sky:' + nq, () => {
    const c = mk(21, 11), x = c.getContext('2d');
    const SK = [['#8ad0f8', '#b8e4fc', '#ffe0b0'], ['#7aa8d8', '#a8c8e8', '#f8c090'], ['#4a5a98', '#6a7ab0', '#c08a90'], ['#26305e', '#38447a', '#4a4a7a']][nq];
    for (let j = 0; j < 11; j++) for (let i = 0; i < 21; i++) {
      const d = Math.hypot(i + .5 - 10.5, j + .5 - 10.5);
      if (d > 10.5) continue;
      let col = d > 9.6 ? OUT : j >= 9 ? (j === 9 ? '#5a9640' : '#3d7a3a') : (j + DITHER[j & 1][i & 1] * 2 < 4 ? SK[0] : j + DITHER[j & 1][i & 1] * 2 < 8 ? SK[1] : SK[2]);
      if (d <= 9.6 && d > 6.6 && d < 7.6 && j < 9 && ((i + j) & 1)) col = 'rgba(255,255,255,.55)';
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    if (nq >= 2) { x.fillStyle = '#ffffff'; [[4, 4], [15, 3], [9, 2]].forEach(([i, j]) => x.fillRect(i, j, 1, 1)); }
    return c;
  });
}
function sunIcon() {   // 5x5 sun dot for the sky dial, centre anchor
  return art('ob:sun', () => { const c = mk(5, 5), x = c.getContext('2d'); [['.ooo.', 'oYLYo', 'oYYYo', 'oYYYo', '.ooo.']].forEach(rs => rs.forEach((r, j) => [...r].forEach((ch, i) => { const col = { o: '#f08a20', Y: '#ffd23f', L: '#ffffff' }[ch]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }))); return c; });
}
function moonIcon() {   // 5x5 crescent moon for the sky dial, centre anchor
  return art('ob:moon', () => { const c = mk(5, 5), x = c.getContext('2d'); ['.MMm.', 'MMm..', 'MM...', 'MMm..', '.MMm.'].forEach((r, j) => [...r].forEach((ch, i) => { const col = { M: '#fff6c0', m: '#d8c880' }[ch]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } })); return c; });
}

function newTagArt() {   // 13x9 red tag for "new" (core writes the character on it), centre anchor
  return art('ob:newtag', () => {
    const c = mk(13, 9), x = c.getContext('2d'), px = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    px('#6a1418', 1, 0, 11, 9); px('#6a1418', 0, 1, 13, 7);
    px('#e8453c', 1, 1, 11, 7); px('#ff7a6a', 2, 1, 9, 1); px('#c0302a', 1, 7, 11, 1);
    return c;
  });
}

// translucent pale-blue silhouette of any (cached) sprite, for purchase previews; core still fades it with globalAlpha.
// Keyed by canvas identity, so pass canvases that come from art() (not freshly made ones).
const _obGhostId = new WeakMap(); let _obGhostN = 0;
function ghostTint(c) {
  if (!c) return c;
  let id = _obGhostId.get(c); if (!id) { id = ++_obGhostN; _obGhostId.set(c, id); }
  return art('ob:ghost:' + id, () => {
    const t = tintC(c, '#cfe8ff', .72), o = mk(c.width, c.height), x = o.getContext('2d');
    x.globalAlpha = .85; x.drawImage(t, 0, 0); return o;
  });
}

// ------------------------------------------------------------ v2 price-pad icons (12x12, used by padIcon)
// Each entry draws into the padIcon grid (flat dark outline added by padIcon); _obPADPOST adds thin details after.
const _obPAD2 = {
  tea: G => {   // celadon kyusu: spout up-left, straight side handle right, lid + knob (stage M: the copper kettle read as a roast)
    const Q = _obQ;
    G.ell(5.5, 7.6, 3.6, 2.9, _obLit([Q.celD, Q.cel, Q.cel, Q.celL], 5.5, 7.6, 3.6, 2.9));
    G.rect(3, 4, 5, 1, Q.celD); G.rect(4, 3, 3, 1, Q.cel); G.set(5, 2, Q.celL);
    G.set(1, 7, Q.cel); G.set(1, 6, Q.cel); G.set(0, 5, Q.celL); G.set(0, 4, Q.celL);
    G.rect(9, 6, 3, 2, '#8a5a34'); G.set(11, 5, '#a8783a');
    G.rect(3, 8, 4, 1, Q.tea);
  },
  shop: G => {   // striped awning over a little counter
    for (let x = 1; x <= 10; x++) G.rect(x, 2, 1, 3, ((x - 1) >> 1) & 1 ? '#f4ecd6' : '#3d8a4a');
    [1, 2, 5, 6, 9, 10].forEach(x => G.set(x, 5, '#3d8a4a')); [3, 4, 7, 8].forEach(x => G.set(x, 5, '#f4ecd6'));
    G.rect(2, 6, 8, 2, '#5a3420'); G.rect(2, 8, 8, 3, _obP.woodL); G.rect(2, 8, 8, 1, '#e8bc88'); G.set(5, 7, '#ffd23f');
  },
  net: G => {   // hand net with a fish in it
    G.ell(4.6, 4.6, 3.8, 3.8, (x, y) => ((x + y) & 1) ? '#f4f0e6' : '#c8c0b0');
    G.rect(3, 5, 3, 1, _obP.fish); G.set(2, 5, _obP.fishL); G.set(6, 4, _obP.fishD); G.set(6, 6, _obP.fishD);
    [[7, 7], [8, 8], [9, 9], [10, 10]].forEach(([x, y]) => G.set(x, y, '#c8a060'));
  },
  dining: G => {   // rice bowl with chopsticks
    G.ell(5.5, 6.2, 4.2, 2, '#fbfaf4'); G.set(4, 5, '#ffffff');
    G.ell(5.5, 7.2, 4.6, 3.4, (x, y) => y + .5 < 7.4 ? null : '#3a5a9a'); G.rect(1, 7, 10, 1, '#f4f0e6');
    G.rect(4, 10, 4, 1, '#2a447a');
    G.set(9, 1, '#d8b070'); G.set(10, 2, '#d8b070'); G.set(10, 1, '#c8a060'); G.set(11, 2, '#c8a060');
  },
  waiter: G => {   // cow-patterned cat with a navy headband
    const Wc = '#fbfbf6';
    G.ell(6, 7, 4.6, 3.8, Wc); G.tri(1.5, 6, 2, 1.5, 5, 4, Wc); G.tri(7, 4, 10, 1.5, 10.5, 6, '#3a3640');
    G.ell(8.5, 6, 1.8, 1.6, '#3a3640'); G.rect(2, 4, 8, 2, '#2a3a6a'); G.set(9, 5, '#2a3a6a'); G.set(10, 4, '#f4f0e6'); G.set(11, 5, '#f4f0e6');
    G.set(4, 7, OUT); G.set(8, 7, '#ffd23f'); G.set(5, 8, _obP.pink); G.set(6, 8, _obP.pink);
  },
  chef: G => {   // black cat in a tall white chef's hat
    G.ell(6, 8.2, 4.4, 3, '#3e3a46'); G.set(1, 6, '#3e3a46'); G.set(10, 6, '#3e3a46');
    G.ell(6, 2.6, 3.4, 2.2, '#ffffff'); G.rect(3, 3, 6, 3, '#f4f4f8'); G.rect(3, 5, 6, 1, '#d8dce6'); G.set(4, 1, '#ffffff');
    G.set(4, 8, '#ffd23f'); G.set(7, 8, '#ffd23f'); G.set(5, 9, _obP.pink); G.set(6, 9, _obP.pink);
  },
  tray: G => {   // round lacquer tray with a cup and a rice ball
    G.ell(6, 7.6, 5.4, 2.8, '#a8302a'); G.ell(6, 7.4, 4.4, 1.9, '#cc5040');
    G.rect(2, 5, 3, 3, '#f4f0e6'); G.rect(2, 5, 3, 1, _obQ.tea);
    _obPat(G, 6, 3, ['..W..', '.WWW.', 'WWWWW', 'WNNNW'], { W: '#fbfaf4', N: '#26342c' });
  },
  table: G => {   // low dining table, set
    G.rect(1, 4, 10, 5, _obQ.blk); G.rect(1, 4, 10, 1, _obQ.blkL); G.rect(1, 9, 10, 1, _obQ.lac); G.rect(2, 10, 1, 1, _obP.dk2); G.rect(9, 10, 1, 1, _obP.dk2);
    _obPat(G, 2, 4, ['WW', 'BB'], { W: '#fbfaf4', B: '#5a7aba' }); _obPat(G, 7, 4, ['ss', 'RR'], { s: '#b07a40', R: _obQ.lac });
    G.rect(4, 7, 3, 1, '#f4f0e6'); G.set(5, 7, '#c8743a');
  },
  west: G => {   // annex wing: tiled roof, white wall, olive noren
    G.tri(0, 4.5, 6, .5, 12, 4.5, '#4a5a6a'); G.rect(0, 4, 12, 1, '#3a4656'); G.set(5, 2, '#6a7a8a');
    G.rect(2, 5, 8, 6, '#f0ead8'); G.rect(2, 5, 8, 1, '#d8d0bc'); G.rect(4, 6, 4, 4, '#7a8a3a'); G.rect(4, 6, 4, 1, '#5a6a2a'); G.set(6, 7, '#f4f0e6');
    G.rect(4, 10, 4, 1, '#5a3420');
  },
  garden: G => {   // cloud-pruned pine on a mound
    G.ell(6, 10.4, 5.4, 1.6, '#6aa84a'); G.rect(6, 5, 1, 5, '#6a4632'); G.set(5, 7, '#6a4632');
    G.ell(6, 2.6, 3.6, 1.6, '#4a8048'); G.ell(3, 5.4, 2.8, 1.3, '#376a40'); G.ell(9, 6.4, 2.8, 1.3, '#376a40'); G.set(5, 2, '#84b05a'); G.set(2, 5, '#62984e');
  },
  cottage: G => {   // thatched cottage with a pink noren
    G.tri(0, 5.5, 6, .5, 12, 5.5, '#c8a860'); G.rect(0, 5, 12, 1, '#a8864a'); G.set(4, 3, '#e8d090'); G.set(6, 2, '#e8d090');
    G.rect(2, 6, 8, 5, '#8a5a34'); G.rect(2, 6, 8, 1, '#6a4028'); G.rect(5, 7, 3, 4, '#f0a8c0'); G.rect(5, 7, 3, 1, '#c8809a'); G.set(3, 8, '#ffd27a');
  },
  suite: G => {   // indigo noren with a gold edge, gold star above
    G.rect(2, 4, 8, 7, '#ffd23f'); G.rect(3, 4, 6, 6, '#2f3a7a'); G.rect(6, 6, 1, 4, '#ffd23f');
    G.set(4, 6, '#fbf6ea'); G.set(4, 7, '#fbf6ea'); G.set(5, 6, '#fbf6ea'); G.set(5, 8, '#fbf6ea');
    _obPat(G, 4, 0, ['..Y..', '.YYY.', 'YYYYY'], { Y: '#ffd23f' }); G.set(6, 1, '#fff6c0');
  },
  roten: G => {   // night pool under a star
    G.rect(1, 1, 10, 10, '#2a3468'); G.rect(1, 1, 10, 1, '#3a4a88');
    _obPat(G, 4, 2, ['..Y..', '.YYY.', 'YYYYY', '.Y.Y.'], { Y: '#ffd23f' }); G.set(9, 3, '#ffffff'); G.set(2, 5, '#ffffff');
    G.rect(1, 8, 10, 3, '#3aa6b4'); G.rect(1, 8, 10, 1, '#8ae0dc'); G.set(3, 9, '#e8fbf8');
  },
  clerk: G => {   // tabby cat with round glasses
    const T = '#c08a50';
    G.ell(6, 7, 4.6, 3.8, T); G.tri(1.5, 6, 2, 1.5, 5, 4, T); G.tri(7, 4, 10, 1.5, 10.5, 6, T);
    G.set(5, 4, '#8a5a30'); G.set(6, 4, '#8a5a30'); G.set(5, 5, '#8a5a30'); G.set(7, 5, '#8a5a30');
    [[3, 6], [4, 6], [5, 6], [3, 8], [4, 8], [5, 8], [3, 7], [5, 7], [7, 6], [8, 6], [9, 6], [7, 8], [8, 8], [9, 8], [7, 7], [9, 7]].forEach(([x, y]) => G.set(x, y, '#3a3640'));
    G.set(6, 7, '#3a3640'); G.set(4, 7, '#d8eef8'); G.set(8, 7, '#d8eef8'); G.set(6, 9, _obP.pink);
  },
  shishi: G => {   // bamboo deer-scarer on a stone
    G.ell(4, 9.6, 3.4, 1.6, '#a8a8a0'); G.set(3, 9, '#3a7a8a'); G.set(4, 9, '#3a7a8a');
    G.rect(7, 5, 1, 6, '#7a4a2a');
    gLine(G, 2, 2, 10, 8, '#8ac04a'); gLine(G, 2, 3, 10, 9, '#5a8a30'); G.set(6, 5, '#5a8a30'); G.set(2, 2, '#2a3a1a');
  },
  sakura: G => {   // five petals, each with a darker rim, a notch at the tip and a red heart
    const PT = [[6, 2.4], [9.4, 4.9], [8.1, 8.9], [3.9, 8.9], [2.6, 4.9]];
    PT.forEach(([x, y]) => G.ell(x, y, 2.3, 2.3, '#e8789a'));
    PT.forEach(([x, y]) => G.ell(x - .2, y - .2, 1.5, 1.5, '#fcc8d6'));
    [[6, 0], [11, 4], [9, 10], [2, 10], [0, 4]].forEach(([x, y]) => _obCut(G, x, y));
    G.ell(6, 6.2, 1.6, 1.6, '#d8406a'); G.set(6, 6, '#ffd23f'); G.set(5, 5, '#ffd23f'); G.set(7, 5, '#ffd23f'); G.set(5, 2, '#ffffff');
  },
  maple: G => {   // red maple leaf
    const M = '#e0502a';
    G.tri(6, .5, 4, 5, 8, 5, M); G.tri(.5, 3.5, 5, 5, 4, 7.5, M); G.tri(11.5, 3.5, 7, 5, 8, 7.5, M);
    G.tri(2, 9, 5, 6, 6, 8.5, M); G.tri(10, 9, 7, 6, 6, 8.5, M); G.ell(6, 6, 2.4, 2.4, M);
    G.set(6, 10, '#8a4a2a'); G.set(6, 11, '#8a4a2a'); G.set(6, 4, '#ff8a4a'); G.set(4, 5, '#ff8a4a'); G.set(6, 7, '#b03a1a');
  },
  koi: G => {   // red-and-white koi
    G.ell(6, 6, 4, 2.2, '#f8f4ee'); G.rect(4, 5, 3, 2, '#e8452e'); G.set(9, 6, '#e8452e'); G.set(9, 5, '#e8452e');
    G.set(1, 4, '#f0d8d0'); G.set(1, 8, '#f0d8d0'); G.set(2, 5, '#f0d8d0'); G.set(2, 7, '#f0d8d0'); G.set(2, 6, '#f8f4ee');
    G.set(6, 3, '#f0d8d0'); G.set(6, 9, '#f0d8d0'); G.set(9, 6, OUT);
  },
  hat: G => {   // straw hat
    G.ell(6, 8, 5.4, 2, '#e8c870'); G.ell(6, 5.6, 3.2, 2.6, '#f0d488'); G.rect(3, 6, 6, 1, _obP.red); G.set(5, 4, '#fff0b8');
  },
  pet: G => {   // pink paw print (the dark outline separates the toes)
    _obPat(G, 0, 1, ['...XX.XX...', '...XX.XX...', '.XX.....XX.', '.XX.....XX.', '....XXX....', '...XXXXX...', '..XXXXXXX..', '..XXXXXXX..', '...DDDDD...'],
      { X: '#ff9ab0', D: '#e07090' });
    G.set(4, 7, '#ffd0dc'); G.set(3, 1, '#ffd0dc'); G.set(1, 3, '#ffd0dc');
  },
  statue: G => {   // little golden lucky cat
    const GP = _obGOLD;
    G.ell(6, 8.6, 3.2, 2.4, GP[4]); G.ell(6, 4.8, 3.4, 2.8, GP[5]); G.set(3, 2, GP[5]); G.set(9, 2, GP[4]);
    G.rect(9, 1, 2, 4, GP[5]); G.rect(3, 7, 6, 1, _obP.red); G.set(6, 8, GP[6]);
    G.set(4, 5, '#7a4410'); G.set(8, 5, '#7a4410'); G.set(5, 10, GP[3]); G.set(7, 10, GP[3]);
  },
  decor: G => {   // vase with a flowering sprig
    G.ell(6, 8.4, 2.8, 2.4, '#3a5a9a'); G.rect(5, 5, 2, 2, '#3a5a9a'); G.set(5, 7, '#6a8aca');
    G.ell(3.6, 2.6, 1.6, 1.4, '#ff6a8a'); G.ell(8.6, 2.2, 1.6, 1.4, '#ff8aa8'); G.set(6, 2, '#fff0f4'); G.set(4, 4, _obP.leaf); G.set(8, 4, _obP.leafL);
  },
  // ---- v2.1 (16.6 - 16.9): shrine gate / offering, festival plaza, stalls, fireworks, outfits, uniforms
  shrine: G => {   // vermilion torii
    G.rect(0, 1, 12, 2, '#2e2628'); G.set(0, 0, '#2e2628'); G.set(11, 0, '#2e2628'); G.rect(1, 3, 10, 1, '#d8402a'); G.rect(1, 5, 10, 1, '#d8402a');
    G.rect(2, 3, 2, 8, '#d8402a'); G.rect(8, 3, 2, 8, '#d8402a'); G.rect(2, 3, 1, 8, '#f06a4a'); G.rect(8, 3, 1, 8, '#f06a4a'); G.rect(5, 4, 2, 1, '#3a2a2a');
  },
  offer: G => {   // offering box under the shrine bell and its red-white rope
    G.ell(6, 2, 2, 1.8, '#f0b830'); G.set(5, 1, '#fff2a8'); G.rect(5, 3, 2, 1, '#8a5a10');
    [4, 5, 6].forEach(y => { G.set(6, y, y & 1 ? '#e8453c' : '#fbf6ea'); });
    G.rect(1, 7, 10, 4, '#8a5a34'); G.rect(1, 7, 10, 1, '#c8935a'); [3, 5, 7, 9].forEach(x => G.rect(x, 8, 1, 2, '#3a2418')); G.rect(1, 10, 10, 1, '#5a3420');
  },
  plaza: G => {   // two festival lanterns on a string
    gLine(G, 0, 1, 11, 1, '#5a4a40');
    [[3, '#e0503a'], [9, '#e0503a']].forEach(([cx, col]) => {
      G.rect(cx - 1, 2, 3, 1, '#3a2a2e'); G.ell(cx + .5, 5.6, 2.6, 3, (x, y) => (Math.abs(x + .5 - cx - .5) < 1 && y > 3 && y < 7 ? '#ffd27a' : col)); G.rect(cx - 1, 9, 3, 1, '#3a2a2e');
    });
  },
  stall: G => {   // a little yatai: striped awning over a counter
    for (let x = 0; x <= 11; x++) G.rect(x, 1, 1, 3, ((x >> 1) & 1) ? '#fff0d8' : '#e8702a');
    G.rect(1, 4, 1, 7, '#7a4a2a'); G.rect(10, 4, 1, 7, '#7a4a2a'); G.rect(2, 5, 8, 2, '#5a4440');
    G.rect(0, 7, 12, 1, '#dba876'); G.rect(1, 8, 10, 3, '#c8463a'); G.set(5, 9, '#fbf6ea'); G.set(6, 9, '#fbf6ea');
  },
  firework: G => {   // a soft burst
    [[6, 0], [6, 11], [0, 5], [11, 5], [2, 1], [10, 1], [2, 10], [10, 10]].forEach(([x, y]) => G.set(x, y, '#f6b4c8'));
    [[6, 2], [6, 9], [2, 5], [9, 5], [3, 3], [9, 3], [3, 8], [9, 8]].forEach(([x, y]) => G.set(x, y, '#e87a9c'));
    G.ell(6, 5.6, 1.6, 1.6, '#f6d888'); G.set(6, 5, '#fff6c8');
  },
  outfit: G => {   // a pink kimono on a stand
    G.rect(1, 2, 10, 4, '#f4a8c0'); G.rect(3, 6, 6, 5, '#f4a8c0'); G.rect(1, 5, 2, 1, '#d07890'); G.rect(9, 5, 2, 1, '#d07890');
    G.set(5, 2, '#fbf6ea'); G.set(6, 3, '#fbf6ea'); G.set(7, 2, '#fbf6ea'); G.set(6, 2, '#f0c8a0'); G.rect(3, 6, 6, 1, '#c8463a'); G.rect(0, 1, 12, 1, '#7a4a2a');
    G.set(4, 8, '#fde0ea'); G.set(7, 9, '#fde0ea'); G.set(2, 3, '#fde0ea');
  },
  uniform: G => {   // indigo happi coat with white front bands
    G.rect(0, 2, 12, 3, '#2a3a6a'); G.rect(2, 2, 8, 9, '#2a3a6a'); G.rect(5, 2, 1, 9, '#f4f0e6'); G.rect(6, 2, 1, 9, '#f4f0e6');
    G.rect(0, 4, 2, 1, '#1e2a50'); G.rect(10, 4, 2, 1, '#1e2a50'); G.set(3, 5, '#8aa4d8'); G.set(8, 7, '#8aa4d8'); G.set(3, 9, '#8aa4d8');
  },
  goldfish: G => {   // goldfish in a water bag
    G.ell(6, 7, 4.2, 4, (x, y) => y < 5 ? '#d8f0f8' : '#a8dcf0'); G.rect(5, 1, 2, 2, '#d8f0f8'); G.rect(4, 2, 4, 1, '#e8453c');
    G.rect(5, 7, 3, 2, '#ff6a2a'); G.set(4, 7, '#ff9a4a'); G.set(4, 8, '#ff9a4a'); G.set(7, 7, '#ffb060'); G.set(6, 7, OUT);
  },
  takoyaki: G => {   // three balls on a paper boat, a pick
    G.rect(1, 8, 10, 2, '#f4e8d0'); G.rect(2, 10, 8, 1, '#d8c8a8');
    [[3, 6], [6, 5], [9, 6]].forEach(([cx, cy]) => { G.ell(cx, cy + .5, 1.8, 1.8, '#d89040'); G.set(cx - 1, cy, '#e0a858'); G.set(cx, cy - 1, '#6a2a14'); G.set(cx + 1, cy, '#5aa83a'); });
    gLine(G, 8, 1, 9, 4, '#e8d4a0');
  },
  ice: G => {   // shaved ice in a glass cup, strawberry syrup
    G.ell(6, 4.6, 4, 3.2, (x, y) => (y < 4 ? '#ffffff' : '#ff8aa0')); G.set(5, 3, '#ffffff'); G.set(8, 5, '#e8453c');
    G.rect(2, 7, 8, 1, '#c8e8f4'); G.rect(3, 8, 6, 2, '#a8d8ec'); G.rect(4, 10, 4, 1, '#88c0dc');
  },
  shoot: G => {   // a target
    G.ell(6, 6, 5, 5, '#fbf6ea'); G.ell(6, 6, 3.6, 3.6, '#e8453c'); G.ell(6, 6, 2.2, 2.2, '#fbf6ea'); G.ell(6, 6, 1, 1, '#e8453c');
  },
};
// ------------------------------------------------------------ v2.2 (SPEC_v2 19): where a wish is made, the evening rush
// 9x9 work-station icon + 1px outline = 11x11, centre anchor: the place in the world where you make the thing a guest of
// honour wants (bubble station -> item, the glow tag over the station, the arrow's icon, the picture cards).
// 'urn' tea stand (copper kettle on a green-clothed table), 'stove' clay kamado (fire + pot), 'milk' milk machine (blue top,
// bottles behind glass), 'tub' the suite's hinoki tub (steam), 'pass' the dining counter (two rice balls)
const _obSTATION = {
  urn: [['..KKK....', '.K...K...', '..CCC..s.', '.CcCCCCs.', '.CCCCCC..', 'GGGGGGGGG', 'WWWWWWWWW', '.W.....W.', '.W.....W.'],
    { K: '#3a2a20', C: '#c87a3a', c: '#f0b070', s: '#a8603a', G: '#5a9a5a', W: '#7a4a2a' }],
  stove: [['..s...s..', '...s...s.', '.KKKKKKK.', 'KkKKKKKKK', 'CCCCCCCCC', 'CcCCCCCCC', 'CC.fFf.CC', 'CC.FFF.CC', 'CCCCCCCCC'],
    { s: '#a8b0c0', K: '#2a2a36', k: '#6a6a7a', C: '#c87a4a', c: '#e8a878', F: '#ff7a2a', f: '#ffd23f' }],
  milk: [['BBBBBBBBB', 'BwBBBBBBB', 'WWWWWWWWW', 'WgggggggW', 'WgWgWgWgW', 'WgWgWgWgW', 'WgggggggW', 'WWWWWWWWW', 'WnnnnnnnW'],
    { B: '#4a8ad8', w: '#ffffff', W: '#f4f2ea', g: '#a8d8e8', n: '#b8b0a0' }],
  tub: [['.s...s...', '..s...s..', '.s...s...', 'VVVVVVVVV', 'VbbbbbbbV', 'VuuuuuuuV', 'VjjjjjjjV', 'VuuuuuuuV', '.VVVVVVV.'],
    { s: '#a8b8c8', V: '#8a5a34', b: '#5cc8c8', u: '#e6c48c', j: '#b0602c' }],
  pass: [['.........', '..w...w..', '.www.www.', '.wNw.wNw.', 'UUUUUUUUU', 'VVVVVVVVV', 'VuVVuVVuV', 'VVVVVVVVV', 'V.......V'],
    { w: '#fbfaf4', N: '#26342c', U: '#e0b070', V: '#8a5a34', u: '#b07848' }],
};
function stationIcon(kind) { const d = _obSTATION[kind] || _obSTATION.urn; return _obIco('ob:station:' + (_obSTATION[kind] ? kind : 'urn'), d[0], d[1]); }
// a wide gold-rimmed wish bubble, w x 17 (inner 3..w-4 x 3..12), tail at the bottom centre, gold bell top right (like
// bubbleArt(..., true)); the core draws station -> item into it
function wideBubbleArt(w) {
  w = Math.max(16, w | 0);
  return art('ob:widebub:' + w, () => {
    const c = paint(w, 17, G => {
      const ring = '#ffc21f', fill = '#fffbea';
      G.rect(1, 2, w - 2, 11, ring); G.rect(2, 1, w - 4, 13, ring); G.rect(2, 2, w - 4, 11, fill);
      const m = w >> 1; G.rect(m - 1, 14, 2, 1, ring); G.set(m - 1, 15, ring);
    }, 'plain');
    const x = c.getContext('2d'), px = (col, pts) => { x.fillStyle = col; pts.forEach(([i, j]) => x.fillRect(i, j, 1, 1)); }, b = w - 5;
    px(OUT, [[b, 0], [b + 2, 0], [b - 1, 1], [b + 3, 1], [b - 1, 2], [b + 3, 2], [b, 3], [b + 2, 3]]);
    px('#ffd23f', [[b, 1], [b + 1, 1], [b + 2, 1], [b, 2], [b + 1, 2]]); px('#fff6c0', [[b + 1, 0]]); px('#d89a20', [[b + 2, 2]]); px('#8a5a10', [[b + 1, 3]]);
    return c;
  });
}
// 7x7 little clock for the evening rush (HUD pill, picture card), centre anchor
function clockIcon() { return _obIco('ob:clock', ['.WWW.', 'WWKWW', 'WWKWW', 'WWWKW', '.WWW.'], { W: '#fff3d0', K: '#5a3a1a' }); }
const _obPADPOST = {
  dining: x => { x.fillStyle = 'rgba(255,255,255,.75)'; [[3, 1], [4, 2], [3, 3], [7, 1], [6, 2], [7, 3]].forEach(([i, j]) => x.fillRect(i, j, 1, 1)); },
  tea: x => { x.fillStyle = 'rgba(255,255,255,.75)'; [[1, 2], [0, 1], [1, 0]].forEach(([i, j]) => x.fillRect(i, j, 1, 1)); },
  decor: x => { x.fillStyle = '#6a4a30'; [[5, 4], [4, 3], [7, 4], [8, 3], [6, 3]].forEach(([i, j]) => x.fillRect(i, j, 1, 1)); },
};
/*ART:objects:END*/
