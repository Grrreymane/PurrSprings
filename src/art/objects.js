/*ART:objects:BEGIN*/
// ============================================================ ART: objects, icons, UI (SPEC_v2 12.3; was art/objects.js until the stage M merge)
// Objects: 3/4 top-down, anchor = bottom-left of the footprint (sprite bottom edge sits on the footprint's
// bottom edge), light from the top-left, 1px contact shadow under things that stand on the floor.
// Icons / UI: anchor = centre unless noted. Every function caches its canvas with art(key, ...).
const _obP = {
  wood: '#c8935a', woodD: '#b07a45', woodL: '#dba876',
  dk: '#7a4a2a', dk2: '#5a3420', dkL: '#9a6038',
  indigo: '#2f4a7a', cloth: '#f4f0e6', red: '#c8463a',
  st: '#a8a8a0', stD: '#8a8a84', stL: '#c4c2b8', rock: '#7a7a78', rockD: '#5e5e60',
  wat: '#5cc8c8', watD: '#3aa6b4', watL: '#8ae0dc', foam: '#e8fbf8',
  grass: '#6aa84a', grassD: '#5a9640', grassL: '#84c060',
  bam: '#7cb84a', bamD: '#5a9a3a', rope: '#c8a860',
  lantern: '#e0503a', glow: '#ffd27a',
  fish: '#ffc85a', fishD: '#e09a3a', fishL: '#ffe08a',
  towel: '#ffffff', towelD: '#dde6f2', stripe: '#4a8ad8',
  // additions
  gold: '#ffd23f', goldD: '#d89a20', goldL: '#fff2a8',
  duvet: '#4a6aa8', duvetD: '#3a5590', duvetL: '#6a8ac8', sheet: '#f6f2ea', sheetD: '#ddd6c8',
  pillow: '#cfdcf0', pillowL: '#e6eef9', pillowD: '#a9bcdc',
  weave: '#d0b070', weaveD: '#a8864a', weaveL: '#e8d090', weaveDk: '#7a5a30',
  leaf: '#5a9a3a', leafD: '#3d7a3a', leafL: '#84c060', leafLL: '#a8d870',
  pink: '#ff8a9a', lilac: '#b8a0e0',
};
// tiny deterministic hash 0..1 (art must stay deterministic: hash coordinates instead of random)
const _obH = (x, y, s) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// paint + contact shadow underneath (+ optional post pass for 1px details that must not be outlined)
function _obObj(w, h, fn, sh, post, outline) {
  const p = paint(w, h, fn, outline === undefined ? true : outline), c = mk(w, h), x = c.getContext('2d');
  (sh || []).forEach(([x0, x1, y, a]) => { x.fillStyle = 'rgba(46,24,30,' + (a || .3) + ')'; x.fillRect(x0, y, x1 - x0 + 1, 1); });
  x.drawImage(p, 0, 0);
  if (post) post(x, (col, pts) => { x.fillStyle = col; pts.forEach(([i, j]) => x.fillRect(i, j, 1, 1)); });
  return c;
}
// like paint() but the coloured outline is mixed with a warm dark brown (gold things go olive with OUT)
function _obPaintW(w, h, fn, dark) {
  const G = new Grid(w, h); fn(G); G.autoShade();
  const add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (G.get(x, y)) continue;
    const below = G.get(x, y + 1), n = below || G.get(x - 1, y) || G.get(x + 1, y) || G.get(x, y - 1);
    if (n) add.push([x, y, mixHex(n, dark || '#4a2010', below ? .55 : .75)]);
  }
  add.forEach(([x, y, c]) => G.set(x, y, c));
  return G.canvas();
}
// draw a pattern of characters into the grid at (ox, oy)
function _obPat(G, ox, oy, rs, pal) { rs.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) G.set(ox + x, oy + y, pal[ch]); })); }
// separator ring: colour pixels around (cx,cy) only where something is already drawn (keeps stacked things apart)
function _obSep(G, cx, cy, rx, ry, col) { G.ell(cx, cy, rx, ry, (x, y) => G.get(x, y) ? col : null); }

// ------------------------------------------------------------ furniture
function deskArt() {   // 48x28, footprint 3x1, anchor (0,28)
  return art('ob:desk', () => _obObj(48, 28, G => {
    const P = _obP;
    // counter top (light wood) + front lip
    G.rect(1, 5, 46, 7, P.woodL);
    for (let x = 1; x < 47; x++) { if (_obH(x, 7) < .3) G.set(x, 7, '#cf9c66'); if (_obH(x, 9) < .3) G.set(x, 9, '#e6b888'); }
    G.rect(1, 12, 46, 1, '#e8bc88'); G.rect(1, 13, 46, 1, P.woodD);
    // body (dark wood)
    G.rect(2, 14, 44, 12, P.dk);
    G.rect(2, 14, 44, 1, P.dk2);
    G.rect(2, 24, 44, 2, P.dk2);
    [[4, 11], [33, 11]].forEach(([px, pw]) => {   // recessed panels
      G.rect(px, 16, pw, 7, '#6e4226'); G.rect(px, 16, pw, 1, P.dk2); G.rect(px, 16, 1, 7, P.dk2);
      G.rect(px, 22, pw, 1, P.dkL); G.rect(px + pw - 1, 17, 1, 6, P.dkL);
    });
    // indigo noren in the middle with a white paw
    G.rect(17, 14, 14, 9, P.indigo); G.rect(17, 14, 14, 1, '#25395f');
    G.rect(21, 18, 1, 5, '#25395f'); G.rect(26, 18, 1, 5, '#25395f');
    _obPat(G, 21, 16, ['.W.W.', 'W...W', '.WWW.', '.WWW.'], { W: P.cloth });
    // maneki-neko (left, back of the counter)
    const Wc = '#fbfbf6';
    G.ell(6.5, 8.6, 3.4, 2.6, Wc); G.ell(6.5, 4.6, 3.7, 3.1, Wc);
    G.set(4, 1, Wc); G.set(4, 2, Wc); G.set(9, 1, Wc); G.set(9, 2, Wc); G.set(5, 2, Wc); G.set(8, 2, Wc);
    G.set(4, 2, P.pink); G.set(9, 2, '#f0a040'); G.set(8, 2, '#f0a040'); G.set(9, 3, '#f0a040');
    G.rect(10, 3, 2, 3, Wc); G.set(11, 2, Wc);                      // raised paw
    G.rect(4, 7, 6, 1, P.lantern); G.set(6, 8, P.gold);              // collar + bell
    G.ell(6.5, 9.4, 1.8, 1, P.gold);                                 // koban coin
    G.set(5, 4, OUT); G.set(8, 4, OUT); G.set(6, 5, P.pink); G.set(7, 5, P.pink);
    // ledger (open book)
    G.rect(14, 6, 9, 4, '#fbf6e8'); G.rect(18, 6, 1, 4, '#d8cbb0');
    [[15, 7, 2], [15, 8, 3], [19, 7, 3], [19, 8, 2]].forEach(([x, y, w]) => G.rect(x, y, w, 1, '#b0a898'));
    G.rect(14, 10, 9, 1, P.red); G.rect(13, 7, 1, 3, P.red); G.rect(23, 7, 1, 3, P.red);
    // call bell
    G.ell(33.5, 10, 3, 1.3, '#4a3a3a'); G.ell(33.5, 8.3, 2.5, 2.2, P.gold); G.rect(33, 5, 2, 1, P.goldD);
    G.set(32, 7, '#fffbe0');
    // ikebana vase
    G.rect(40, 7, 3, 4, '#3a5a9a'); G.set(40, 7, '#5a7aba');
    G.set(41, 6, P.leaf); G.set(41, 5, P.leaf); G.set(40, 4, P.leaf); G.set(42, 4, P.leaf); G.set(43, 5, P.leafL);
    G.set(41, 3, P.pink); G.set(39, 3, '#ff6a7a'); G.set(43, 3, P.pink); G.set(42, 2, '#fff0f4');
  }, [[1, 47, 27, .32], [47, 47, 26, .2]], (x, px) => {
    px('#c0b8b0', [[3, 5], [2, 5], [10, 5], [11, 5]]);   // maneki whiskers
  }));
}

function shelfArt() {   // 32x30, footprint 2x1, anchor (0,30)
  return art('ob:shelf', () => _obObj(32, 30, G => {
    const P = _obP;
    G.rect(1, 1, 30, 27, P.dk);
    G.rect(1, 1, 30, 2, P.dkL); G.rect(1, 3, 30, 1, P.dk);
    // three compartments (y0 .. y0+5) with a dark back panel, shelf boards in between
    [4, 12, 20].forEach(y0 => { G.rect(3, y0, 26, 6, '#4e2e1c'); G.rect(3, y0, 26, 1, '#3a2014'); });
    [10, 18].forEach(y => { G.rect(1, y, 30, 1, P.dkL); G.rect(1, y + 1, 30, 1, P.dk); });
    G.rect(1, 26, 30, 2, P.dk2);
    // folded towel stacks
    const towel = (x, y, top) => {
      G.rect(x, y, 7, 1, top ? P.towel : '#f4f8fd'); G.rect(x, y + 1, 7, 1, '#c4d0e2');
      G.set(x + 1, y, P.stripe); G.set(x + 5, y, P.stripe); G.set(x + 1, y + 1, '#3a74c0'); G.set(x + 5, y + 1, '#3a74c0');
      if (top) { G.rect(x, y - 1, 7, 1, P.towel); G.set(x + 1, y - 1, '#8ab4ec'); G.set(x + 5, y - 1, '#8ab4ec'); }
    };
    [[4, 2], [12, 2], [20, 2]].forEach(([x, n]) => { for (let i = 0; i < n; i++) towel(x, 8 - 2 * i, i === n - 1); });
    [[4, 2], [12, 2], [20, 1]].forEach(([x, n]) => { for (let i = 0; i < n; i++) towel(x, 16 - 2 * i, i === n - 1); });
    // bottom compartment: a woven basket of rolled towels
    [7, 11, 15, 19, 23].forEach((x, i) => {
      _obSep(G, x + .5, 21.6, 2.8, 2, '#8e9cb2');
      G.ell(x + .5, 21.6, 2.1, 1.6, (xx, yy) => yy > 21 ? P.towelD : P.towel); G.set(x, 21, i & 1 ? '#8ab4ec' : P.stripe);
    });
    for (let y = 23; y <= 25; y++) for (let x = 5; x <= 26; x++) G.set(x, y, (((x + (y & 1) * 2) >> 1) & 1) ? P.weave : P.weaveD);
    G.rect(5, 23, 22, 1, P.weaveL); G.rect(5, 25, 22, 1, P.weaveDk);
  }, [[1, 31, 29, .32]]));
}

function basketArt(n, max) {   // 16x16, footprint 1x1, anchor (0,16)
  max = max > 0 ? max : 10; n = clamp(Math.floor(n) || 0, 0, max);
  const k = n <= 0 ? 0 : clamp(Math.round(n / max * 10), 1, 10);
  return art('ob:basket:' + k, () => _obObj(16, 16, G => {
    const P = _obP, cx = 7.5, cy = 7.2;
    const inRim = (x, y) => { const dx = (x + .5 - cx) / 7, dy = (y + .5 - cy) / 3; return dx * dx + dy * dy <= 1; };
    const inIn = (x, y) => { const dx = (x + .5 - cx) / 5.6, dy = (y + .5 - cy) / 2.1; return dx * dx + dy * dy <= 1; };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (inRim(x, y)) G.set(x, y, inIn(x, y) ? (y + .5 < cy - .6 ? '#4a3018' : '#6a4a2a') : P.weaveL);
    // rolled towels (k of 10), back layer first
    const SL = [[7.5, 7.4], [4.4, 7.1], [10.6, 7.1], [6, 5.6], [9.1, 5.6], [3.2, 5.4], [11.8, 5.4], [7.5, 4], [4.6, 3.9], [10.4, 3.9]];
    const sel = SL.slice(0, k).map((p, i) => [p[0], p[1], i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]);
    sel.forEach(([tx, ty]) => {
      _obSep(G, tx, ty, 2.9, 2.2, '#8e9cb2');
      G.ell(tx, ty, 2.2, 1.65, (x, y) => y + .5 > ty + .45 ? P.towelD : P.towel);
      G.set(R(tx - .5), R(ty - .5), P.stripe); G.set(R(tx - .5), R(ty + .5), '#3a74c0');
    });
    // front rim over the towels, then the woven body
    for (let y = R(cy); y < 16; y++) for (let x = 0; x < 16; x++) if (inRim(x, y) && !inIn(x, y)) G.set(x, y, P.weaveL);
    for (let y = 10; y <= 13; y++) for (let x = (y >= 12 ? 2 : 1); x <= (y >= 12 ? 13 : 14); x++) {
      const v = ((x + (y & 1) * 2) >> 1) & 1;
      G.set(x, y, y === 10 ? P.weave : v ? P.weave : P.weaveD);
    }
    G.rect(2, 13, 12, 1, P.weaveD);
  }, [[1, 15, 15, .32]]));
}

function milkArt(frame) {   // 16x30, footprint 1x1, anchor (0,30)
  frame = frame ? 1 : 0;
  return art('ob:milk:' + frame, () => _obObj(16, 30, G => {
    const P = _obP, body = '#f0ece0', bodyD = '#d8d2c2';
    G.rect(1, 1, 14, 2, '#fbf8f0');                       // top
    G.rect(1, 3, 14, 25, body);
    G.rect(1, 4, 14, 5, frame ? '#5a9ae8' : P.stripe);   // sign panel
    G.rect(1, 8, 14, 1, '#2f5a9a');
    _obPat(G, 3, 5, ['.W.', 'WWW'], { W: '#ffffff' });   // little bottle on the sign
    _obPat(G, 7, 5, ['RRRRR', 'RRRRR'], { R: frame ? '#ff8a7a' : '#ff6a5a' });
    // glass door with two shelves of bottles
    G.rect(2, 10, 12, 12, '#c8ccd4');
    G.rect(3, 11, 10, 10, frame ? '#d8f6fa' : '#bfe8f0');
    G.rect(3, 15, 10, 1, '#9ab0b8'); G.rect(3, 20, 10, 1, '#9ab0b8');
    const caps = ['#4a8ad8', '#c8463a', '#4a8ad8', '#e09a3a'], bods = ['#ffffff', '#ffffff', '#c8935a', '#ffc85a'];
    for (let i = 0; i < 4; i++) {
      const bx = 3 + i * 2 + (i > 1 ? 1 : 0);
      [[bx, 12, i], [bx, 17, (i + 2) & 3]].forEach(([x, y, j]) => { G.set(x, y, caps[j]); G.rect(x, y + 1, 1, 2, bods[j]); });
    }
    G.set(3, 11, '#ffffff'); G.set(4, 11, '#ffffff'); G.set(3, 12, frame ? '#ffffff' : '#e8fbff');
    G.rect(13, 13, 1, 5, '#a0a4ac');                     // handle
    // kick plate with vents
    G.rect(1, 23, 14, 5, bodyD); G.rect(3, 24, 10, 1, '#b8b0a0'); G.rect(3, 26, 10, 1, '#b8b0a0');
    G.rect(1, 22, 14, 1, body);
  }, [[1, 15, 29, .34]]));
}

// futon (ground layer, 16x32 over 1x2 tiles, anchor (0,32)). For 'sleep' draw catSleepHead with its anchor at
// sprite pixel (8,13) (= tile-top + 13); state 'cover' = only the sleep duvet, to draw over the head and tuck the chin in.
// furn (v2.0.1, optional): 'west' = the west wing's Taisho bed on the same footprint and head spot (_obBed)
function futonArt(state, frame, furn) {
  frame = frame ? 1 : 0;
  if (state !== 'sleep' && state !== 'messy' && state !== 'cover') state = 'clean';
  if (furn === 'west') return _obBed(state, frame);
  const anim = state === 'sleep' || state === 'cover';
  return art('ob:futon:' + state + ':' + (anim ? frame : 0), () => {
    const P = _obP;
    const dots = (x, y) => (((x + (y >> 2 & 1) * 2) & 3) === 1 && (y & 3) === 2);
    const mattress = G => {
      G.rect(2, 1, 12, 28, P.sheet); G.rect(2, 29, 12, 1, P.sheetD);
    };
    const pillow = (G, ox, oy) => {
      G.rect(ox + 1, oy, 6, 6, P.pillow); G.rect(ox, oy + 1, 8, 4, P.pillow);
      G.rect(ox + 1, oy, 6, 1, P.pillowL); G.rect(ox + 1, oy + 5, 6, 1, P.pillowD); G.set(ox, oy + 4, P.pillowD); G.set(ox + 7, oy + 4, P.pillowD);
    };
    const duvetSleep = G => {
      const top = 12, bulge = frame ? 1 : 0;
      G.rect(2, top, 12, 30 - top, P.duvet);
      G.rect(1, 15, 14, 9 + bulge, P.duvet);          // puffy sides over the body
      G.ell(7.5, 19.5 - bulge * .5, 5.4, 7 + bulge * .5, (x, y) => {
        if (y < top) return null;
        const v = (x + .5 - 6) / 6 + (y + .5 - 15) / 9 + (DITHER[y & 1][x & 1] - .375) * .5;
        return v < .25 ? P.duvetL : v < .9 ? P.duvet : P.duvetD;
      });
      G.map((x, y, c) => (y >= top + 2 && dots(x, y) && c !== P.duvetD) ? '#8aa4d8' : c);
      G.rect(2, top, 12, 2, P.sheet); G.rect(2, top + 1, 12, 1, P.sheetD);   // turned-down cover
      G.rect(2, 29, 12, 1, P.duvetD);
    };
    if (state === 'cover') return _obObj(16, 32, G => { duvetSleep(G); }, []);
    return _obObj(16, 32, G => {
      if (state === 'messy') {
        mattress(G);
        // wrinkles on the exposed sheet
        gLine(G, 3, 12, 9, 9, P.sheetD); gLine(G, 4, 16, 11, 12, P.sheetD); gLine(G, 10, 4, 12, 3, P.sheetD);
        // pillow knocked askew
        G.tri(2.5, 4, 8.5, 1.5, 10, 6.5, P.pillow); G.tri(2.5, 4, 10, 6.5, 4, 9, P.pillow);
        gLine(G, 4, 8, 9, 6, P.pillowD); gLine(G, 3, 4, 8, 2, P.pillowL);
        // duvet thrown back in a bunch, white underside showing along the fold
        G.tri(1, 20, 14, 13, 14, 29, P.duvet); G.tri(1, 20, 14, 29, 2, 29, P.duvet);
        G.map((x, y, c) => (c === P.duvet && dots(x, y)) ? '#8aa4d8' : c);
        gLine(G, 1, 20, 14, 13, P.sheet); gLine(G, 1, 21, 14, 14, P.sheetD);
        gLine(G, 4, 23, 13, 18, P.duvetD); gLine(G, 6, 27, 13, 23, P.duvetD); gLine(G, 5, 22, 12, 18, P.duvetL);
        G.rect(2, 29, 12, 1, P.duvetD);
      } else {
        mattress(G);
        pillow(G, 4, 3);
        if (state === 'sleep') duvetSleep(G);
        else {
          G.rect(2, 11, 12, 19, P.duvet);
          G.map((x, y, c) => (y >= 13 && c === P.duvet && dots(x, y)) ? '#8aa4d8' : c);
          G.rect(2, 11, 12, 2, P.sheet); G.rect(2, 12, 12, 1, P.sheetD);
          G.rect(2, 13, 12, 1, P.duvetD);
          G.rect(2, 29, 12, 1, P.duvetD);
        }
      }
    }, [[3, 15, 31, .26], [15, 15, 2, .18], [15, 15, 3, .22]].concat(Array.from({ length: 26 }, (_, i) => [15, 15, 4 + i, .26])));
  });
}

function tableArt(furn) {   // 16x16, footprint 1x1, anchor (0,16); furn 'west' = a round tea table (v2.0.1)
  if (furn === 'west') return _obTeaTable();
  return art('ob:table', () => _obObj(16, 16, G => {
    const P = _obP;
    // low table: polished top, dark apron, stubby legs
    G.rect(1, 6, 14, 5, '#a86a3c'); G.rect(1, 6, 14, 1, '#c08050');
    for (let x = 2; x < 14; x++) if (_obH(x, 8, 3) < .3) G.set(x, 9, '#9a5e34');
    G.rect(1, 11, 14, 1, P.dk); G.rect(1, 12, 14, 1, P.dk2);
    G.rect(2, 13, 2, 1, P.dk2); G.rect(12, 13, 2, 1, P.dk2);
    // celadon teapot on a little mat, two tea cups
    G.rect(2, 9, 7, 1, '#7a4a2a');
    G.ell(5.5, 7, 2.7, 2.2, (x, y) => (x + y < 10 ? '#9ad0b4' : '#6aa88c'));
    G.rect(4, 4, 3, 1, '#7ab89c'); G.set(5, 3, '#4a7a64');
    G.set(2, 6, '#7ab89c'); G.set(1, 5, '#7ab89c'); G.set(8, 5, '#4a7a64'); G.set(9, 6, '#4a7a64');
    G.set(4, 6, '#d4f0e0');
    [[10, 6], [12, 8]].forEach(([x, y]) => { G.rect(x, y, 2, 2, '#f4f0e6'); G.set(x, y + 1, '#d0c8b8'); G.set(x, y, '#7aa838'); G.set(x + 1, y, '#8ab84a'); });
  }, [[1, 15, 15, .3]]));
}

function andonArt(furn) {   // 12x20, footprint 1x1, anchor (0,20); drawing is centred in its 12px canvas; furn 'west' = table lamp
  if (furn === 'west') return _obLamp();
  return art('ob:andon', () => _obObj(12, 20, G => {
    const P = _obP;
    G.rect(1, 1, 10, 2, P.dk); G.rect(1, 1, 10, 1, P.dkL);          // top frame
    // paper body with warm glow
    for (let y = 3; y <= 13; y++) for (let x = 2; x <= 9; x++) {
      const d = Math.abs(x + .5 - 6) / 4 + Math.abs(y + .5 - 8) / 6 + (DITHER[y & 1][x & 1] - .375) * .35;
      G.set(x, y, d < .45 ? '#fffbe6' : d < .85 ? '#ffeaa8' : P.glow);
    }
    G.rect(2, 3, 1, 11, P.dk); G.rect(9, 3, 1, 11, P.dk); G.rect(2, 8, 8, 1, P.dk); G.rect(2, 13, 8, 1, P.dk);
    G.rect(5, 3, 1, 5, '#e8b860'); G.rect(5, 9, 1, 4, '#e8b860');
    // legs + bottom shelf
    G.rect(2, 14, 1, 4, P.dk); G.rect(9, 14, 1, 4, P.dk); G.rect(2, 16, 8, 1, P.dk2);
  }, [[1, 11, 19, .3]]));
}

// ------------------------------------------------------------ v2.0.1 west wing (Taisho roman) furniture, same tiles as
// the futon / andon / low table. Mahogany + brass, a rose quilt, a fringed lamp, a lace-covered tea table.
const _obW = { mah: '#7a3a2a', mahL: '#9a5a40', mahD: '#4e2018', brass: '#f0c860', brassD: '#c8962e',
  q: '#b04e5e', qL: '#cc6e7c', qD: '#86303e', qP: '#f2d8c4', lace: '#fbf6ee', laceD: '#e2d8c8' };
function _obBed(state, frame) {   // 16x32 bed, anchor (0,32); head on the pillow at (8,13) like the futon; 'cover' = the quilt only
  return art('ob:bed:' + state + ':' + frame, () => {
    const W = _obW, P = _obP;
    const quiltPx = (x, y, top) => {   // rose quilt, cream diamond stitching, darker towards the lower right
      const st = ((x + y) % 6 === 0 || (x - y + 60) % 6 === 0) && y > top + 2;
      const v = (x + .5 - 6) / 7 + (y + .5 - 18) / 12;
      return st ? W.qP : v < -.25 ? W.qL : v < .7 ? W.q : W.qD;
    };
    const quilt = (G, top, bulge) => {
      for (let y = top; y <= 28; y++) for (let x = 1; x <= 14; x++) G.set(x, y, quiltPx(x, y, top));
      if (bulge !== null) G.ell(7.5, 19.5 - bulge * .5, 5.6, 6.6 + bulge * .5, (x, y) => (y < top + 2 ? null : quiltPx(x, y, top) === W.qP ? W.qP : ((x + .5 - 6) / 6 + (y + .5 - 15) / 9 < .2 ? W.qL : quiltPx(x, y, top))));
      for (let x = 1; x <= 14; x++) { G.set(x, top, W.lace); G.set(x, top + 1, (x & 1) ? W.laceD : W.lace); }   // turned-down sheet, lace edge
      for (let x = 1; x <= 14; x++) G.set(x, 28, W.qD);
    };
    const frameBed = G => {
      for (let y = 1; y <= 30; y++) { G.set(1, y, W.mahL); G.set(14, y, W.mahD); }   // corner posts / side rails
      G.rect(2, 1, 12, 5, W.mah); G.rect(2, 1, 12, 1, W.mahL); G.rect(3, 2, 10, 3, W.mahD); G.rect(4, 3, 8, 1, '#6a2e22');   // headboard + carved panel
      G.rect(2, 6, 12, 23, P.sheet); G.rect(2, 6, 12, 1, P.sheetD);   // mattress
      G.rect(1, 29, 14, 2, W.mah); G.rect(1, 29, 14, 1, W.mahL);       // footboard
    };
    const pillow = (G, ox, oy, askew) => {
      if (askew) { G.tri(3, 8, 9, 5.5, 11, 10, W.lace); G.tri(3, 8, 11, 10, 5, 12, W.lace); gLine(G, 5, 11, 10, 9, W.laceD); return; }
      G.rect(ox + 1, oy, 8, 5, W.lace); G.rect(ox, oy + 1, 10, 3, W.lace); G.rect(ox + 1, oy + 4, 8, 1, W.laceD);
      for (let x = ox; x <= ox + 9; x += 2) G.set(x, oy + 2, W.laceD);   // lace
    };
    const knobs = (x, px) => px(W.brass, [[1, 0], [14, 0], [1, 28], [14, 28]]);
    if (state === 'cover') return _obObj(16, 32, G => { quilt(G, 12, frame); }, [], null);
    return _obObj(16, 32, G => {
      frameBed(G);
      if (state === 'messy') {
        pillow(G, 3, 6, true);
        gLine(G, 3, 15, 10, 12, P.sheetD); gLine(G, 4, 19, 12, 15, P.sheetD);
        G.tri(1, 22, 14, 15, 14, 28, W.q); G.tri(1, 22, 14, 28, 1, 28, W.q);   // quilt thrown back
        G.map((x, y, c) => (c === W.q && ((x + y) % 6 === 0)) ? W.qP : c);
        gLine(G, 1, 22, 14, 15, W.lace); gLine(G, 1, 23, 14, 16, W.qL); gLine(G, 4, 25, 13, 20, W.qD);
      } else {
        pillow(G, 3, 6, false);
        quilt(G, 12, state === 'sleep' ? frame : null);
      }
    }, [[2, 15, 31, .3]].concat(Array.from({ length: 28 }, (_, i) => [15, 15, 3 + i, .24])), knobs);
  });
}
function _obTeaTable() {   // 16x16 round mahogany tea table, a lace doily, a white teapot, two cups, a rose; anchor (0,16)
  return art('ob:teatable', () => _obObj(16, 16, G => {
    const W = _obW;
    G.rect(7, 10, 2, 4, W.mahD); G.set(7, 10, W.mah); G.rect(4, 13, 8, 1, W.mah); G.set(4, 13, W.mahL); G.set(11, 13, W.mahD);   // pedestal, splayed feet
    G.ell(8, 7.4, 7.2, 3.4, (x, y) => (y >= 9 ? W.mahD : (x + .5 - 6) / 7 + (y + .5 - 6) / 3 < -.5 ? W.mahL : W.mah));   // the round top, polished
    G.ell(7.5, 7, 4.6, 2, (x, y) => ((x + y) & 1) && y > 7 ? W.laceD : W.lace);                                          // lace doily
    G.ell(6, 5.6, 2.2, 1.8, (x, y) => (x < 6 ? '#ffffff' : '#e2e2ee')); G.rect(4, 6, 5, 1, '#5a7ac8');                   // teapot, blue band
    G.set(8, 5, '#e2e2ee'); G.set(9, 4, '#e2e2ee'); G.set(6, 3, '#5a7ac8'); G.set(3, 5, '#e2e2ee');
    [[11, 8], [13, 6]].forEach(([x, y]) => { G.rect(x - 1, y + 1, 3, 1, '#d8d4e4'); G.rect(x - 1, y, 2, 1, '#ffffff'); G.set(x, y, '#b07a40'); });   // cups on saucers
    G.set(12, 2, '#5a9a3a'); G.set(12, 3, '#5a9a3a'); G.set(11, 1, '#e04a5a'); G.set(12, 1, '#c8303e'); G.set(12, 4, '#e8f0f8'); G.set(13, 4, '#c8d4e4');   // a rose in a glass
  }, [[1, 15, 15, .3]]));
}
function _obLamp() {   // 12x20 nightstand + table lamp with a fringed amber shade (glows like the andon); anchor (0,20)
  return art('ob:lamp', () => _obObj(12, 20, G => {
    const W = _obW;
    G.rect(1, 12, 10, 2, W.mahL); G.rect(1, 12, 10, 1, '#b8744e');                    // nightstand top
    G.rect(2, 14, 8, 3, W.mah); G.rect(2, 15, 8, 1, W.mahD); G.set(6, 14, W.brass);   // drawer + knob
    G.rect(2, 17, 1, 2, W.mahD); G.rect(9, 17, 1, 2, W.mahD);                         // legs
    G.rect(5, 9, 2, 3, W.brassD); G.rect(4, 11, 4, 1, W.brass); G.set(5, 9, W.brass);  // brass stand
    for (let y = 1; y <= 7; y++) {                                                    // flared silk shade
      const hw = 2 + (y >> 1);
      for (let x = 6 - hw; x < 6 + hw; x++) {
        const d = Math.abs(x + .5 - 6) / hw + (DITHER[y & 1][x & 1] - .375) * .3;
        G.set(x, y, y === 1 ? '#e8a040' : d < .45 ? '#fff4c8' : d < .8 ? '#ffd27a' : '#e89a3a');
      }
    }
    for (let x = 1; x <= 10; x++) if (x & 1) G.set(x, 8, '#c8743a');                  // fringe
  }, [[1, 11, 19, .3]]));
}

function toroArt() {   // 14x26 stone lantern, footprint 1x1, anchor (0,26); centred in its 14px canvas
  return art('ob:toro', () => _obObj(14, 26, G => {
    const P = _obP, S = P.st, SD = P.stD, SL = P.stL;
    G.rect(6, 1, 2, 2, S); G.set(6, 1, SL);                                   // hoju
    G.rect(5, 3, 4, 1, S); G.rect(3, 4, 8, 1, S); G.rect(2, 5, 10, 1, S);      // kasa (roof)
    G.rect(1, 6, 12, 2, S); G.set(1, 5, S); G.set(12, 5, S);
    G.rect(4, 4, 3, 1, SL); G.rect(2, 6, 5, 1, SL); G.rect(1, 7, 12, 1, SD);
    G.rect(3, 8, 8, 6, S); G.rect(3, 8, 8, 1, SD);                            // hibukuro (fire box)
    G.rect(5, 9, 4, 4, '#ffd27a'); G.rect(6, 10, 2, 2, '#fff2c0'); G.rect(5, 12, 4, 1, '#f0a850');
    G.set(3, 9, SL); G.set(3, 10, SL);
    G.rect(2, 14, 10, 2, S); G.rect(2, 14, 10, 1, SL); G.rect(2, 15, 10, 1, SD);   // chudai
    G.rect(5, 16, 4, 5, S); G.rect(5, 16, 1, 5, SL); G.rect(8, 16, 1, 5, SD);       // sao (pillar)
    G.rect(3, 21, 8, 1, S); G.rect(2, 22, 10, 2, S); G.rect(2, 22, 10, 1, SL); G.rect(2, 23, 10, 1, SD);  // kiso
    [[2, 6], [9, 22], [3, 15], [10, 6], [6, 19]].forEach(([x, y]) => G.set(x, y, P.grassD));   // moss
    G.set(11, 6, P.grass);
  }, [[1, 13, 25, .32]]));
}

function plantArt(kind) {   // 14x22, footprint 1x1, anchor (0,22); kind 'pot' | 'bonsai'
  kind = kind === 'bonsai' ? 'bonsai' : 'pot';
  return art('ob:plant:' + kind, () => _obObj(14, 22, G => {
    const P = _obP, LP = [P.leafD, P.leafD, P.leaf, P.leaf, P.leafL, P.leafLL];
    const clump = (cx, cy, rx, ry) => G.ell(cx, cy, rx, ry, lit(LP, cx - .6, cy - .8, rx + .4, ry + .4, { base: .62, lx: .35 }));
    if (kind === 'pot') {
      // glazed indigo pot
      G.rect(2, 13, 10, 2, '#e8e0d0'); G.rect(2, 13, 10, 1, '#fbf6ea');
      G.rect(3, 15, 8, 4, '#3a5a9a'); G.rect(4, 19, 6, 1, '#2a447a');
      G.set(4, 16, '#5a7aba'); G.set(4, 17, '#5a7aba'); G.rect(3, 18, 8, 1, '#2f4a80');
      // leafy bush: overlapping leaf clumps
      [[7, 9, 5.6, 4.6], [4, 7, 3.2, 3], [10, 7, 3.2, 3], [7, 4.5, 3.6, 3.2], [3.5, 10.5, 2.6, 2.2], [10.5, 10.5, 2.6, 2.2]].forEach(a => clump(...a));
      [[4, 6], [7, 3], [9, 6], [6, 9], [3, 9], [10, 9]].forEach(([x, y]) => G.set(x, y, P.leafLL));
      [[8, 11], [11, 11], [5, 12], [9, 8]].forEach(([x, y]) => G.set(x, y, P.leafD));
    } else {
      // low wooden stand
      G.rect(1, 16, 12, 2, P.dk); G.rect(1, 16, 12, 1, P.dkL); G.rect(2, 18, 1, 2, P.dk2); G.rect(11, 18, 1, 2, P.dk2);
      // shallow pot
      G.rect(3, 13, 8, 3, '#7a3a2a'); G.rect(3, 13, 8, 1, '#a85a40'); G.rect(4, 13, 6, 1, '#5a4030');
      // twisted trunk
      [[6, 12], [6, 11], [5, 10], [5, 9], [6, 8], [7, 7], [7, 6], [6, 5], [8, 8], [9, 8], [4, 9], [3, 8]].forEach(([x, y]) => G.set(x, y, '#7a5238'));
      G.set(7, 12, '#5e3e2a'); G.set(5, 11, '#5e3e2a');
      // cloud pads
      clump(3.5, 6.6, 3, 1.8); clump(10, 6.8, 3, 1.8); clump(6.5, 3.4, 3.6, 2.2);
    }
  }, kind === 'pot' ? [[2, 12, 21, .32]] : [[1, 13, 21, .32]]));
}

function benchArt() {   // 32x16, footprint 2x1, anchor (0,16)
  return art('ob:bench', () => _obObj(32, 16, G => {
    const P = _obP;
    // wooden frame and legs
    G.rect(3, 10, 2, 4, P.dk); G.rect(27, 10, 2, 4, P.dk); G.rect(3, 12, 26, 1, P.dk2);
    G.rect(4, 10, 1, 4, P.dk2); G.rect(28, 10, 1, 4, P.dk2);
    // red felt cloth (top + short drape)
    G.rect(1, 4, 30, 5, P.red); G.rect(1, 4, 30, 1, '#dc6450');
    G.rect(1, 9, 30, 2, '#a83a30');
    for (let x = 2; x < 30; x++) if (_obH(x, 6, 7) < .18) G.set(x, 6, '#d4584a');
    // zabuton cushion + tea cup
    G.rect(4, 3, 8, 5, '#3a5a9a'); G.rect(4, 3, 8, 1, '#5a7aba'); G.rect(4, 7, 8, 1, '#2a447a');
    G.set(7, 5, P.cloth); G.set(8, 5, P.cloth);
    G.rect(22, 4, 3, 2, '#e8f0e0'); G.set(22, 4, '#8ab84a'); G.set(23, 4, '#9ac85a'); G.set(24, 4, '#8ab84a');
  }, [[1, 31, 15, .3], [3, 6, 14, .2], [27, 30, 14, .2]]));
}

function signArt(gold) {   // 32x28, footprint 2x1, anchor (0,28)
  gold = !!gold;
  return art('ob:sign:' + (gold ? 1 : 0), () => _obObj(32, 28, G => {
    const P = _obP;
    const fr = gold ? '#b07818' : P.dk, frL = gold ? '#ffe070' : P.dkL, frD = gold ? '#7a4a10' : P.dk2;
    const bd = gold ? P.gold : P.woodL, bdD = gold ? '#f0b830' : '#cf9c66';
    // posts + stone feet
    G.rect(5, 18, 2, 7, P.dk); G.rect(25, 18, 2, 7, P.dk); G.rect(5, 18, 1, 7, P.dkL); G.rect(25, 18, 1, 7, P.dkL);
    G.rect(4, 24, 4, 2, P.stD); G.rect(24, 24, 4, 2, P.stD); G.rect(4, 24, 4, 1, P.stL); G.rect(24, 24, 4, 1, P.stL);
    // board with cat ears
    G.tri(3, 7.5, 6, 2, 9.5, 7.5, fr); G.tri(22.5, 7.5, 26, 2, 29, 7.5, fr);
    G.tri(5, 7.5, 6, 4.5, 8, 7.5, gold ? P.lantern : P.pink); G.tri(24, 7.5, 26, 4.5, 27, 7.5, gold ? P.lantern : P.pink);
    G.rect(2, 7, 28, 12, fr); G.rect(2, 7, 28, 1, frL); G.rect(2, 18, 28, 1, frD);
    G.rect(4, 9, 24, 8, bd); G.rect(4, 9, 24, 1, frD);
    for (let y = 10; y < 17; y++) for (let x = 4; x < 28; x++) if (_obH(x, y, 11) < (gold ? .08 : .12)) G.set(x, y, bdD);
    // emblem: hot-spring mark (bowl + three wavy steam lines)
    const em = gold ? '#a8302a' : P.red;
    G.ell(16, 13.6, 4.6, 2.9, (x, y) => y + .5 >= 14 ? em : null);
    [12, 15, 18].forEach(x0 => [1, 0, 0, 1].forEach((o, j) => G.set(x0 + o, 10 + j, em)));
    if (gold) {
      // star plaque hanging under the board
      G.rect(6, 20, 20, 4, '#8a2a22'); G.rect(6, 20, 20, 1, '#a83a2c'); G.rect(6, 19, 20, 1, frD);
      [7, 11, 15, 19, 23].forEach(x => _obPat(G, x, 21, ['.Y.', 'YYY'], { Y: '#ffe070' }));
      G.set(5, 10, '#ffffff'); G.set(6, 10, '#fff6c0'); G.set(5, 11, '#fff6c0');
    }
  }, [[3, 9, 27, .3], [23, 29, 27, .3]], gold ? (x, px) => { px('#ffffff', [[1, 4], [30, 3], [29, 1], [0, 3]]); } : null));
}

// pile of dried-fish bundles (tips / payments): 16x20, anchor (8,17) = ground under the pile centre; units 1..12
function pileArt(units) {
  const u = clamp(Math.round(units) || 1, 1, 12);
  return art('ob:pile:' + u, () => {
    const P = _obP;
    // bundle = two dried fish tied with a red string, 7x3: head + eye on the left (unless flipped), forked tail on the right
    const RS = ['.LLLrLT', 'YeYYrYT', 'DDDDrDT'], RN = ['.LLLrLT', 'YeYYrY.', 'DDDDrDT'];
    const bundle = (G, x, y, flip, notch) => (notch ? RN : RS).forEach((r, j) => [...r].forEach((ch, i) => {
      const col = { L: P.fishL, Y: P.fish, D: P.fishD, r: '#d0503a', e: '#4a2414', T: '#f0b04a' }[ch];
      if (col) G.set(flip ? x + 6 - i : x + i, y + j, col);
    }));
    // three neat stacks: back-centre (drawn first), front-left, front-right; heads alternate per layer
    const ST = { B: [4, 12], L: [1, 14], R: [8, 14], C: [4, 14] };
    const ORDER = u === 1 ? [['C', 0]] : [['L', 0], ['R', 0], ['B', 0], ['L', 1], ['R', 1], ['B', 1], ['L', 2], ['R', 2], ['B', 2], ['L', 3], ['R', 3], ['B', 3]].slice(0, u);
    const list = ORDER.slice().sort((a, b) => (a[0] === 'B' ? 0 : 1) - (b[0] === 'B' ? 0 : 1) || a[1] - b[1]);
    let minX = 16, maxX = 0;
    const pc = _obPaintW(16, 20, G => list.forEach(([s, lv]) => {
      const [x, y] = ST[s], odd = lv & 1;
      const flip = s === 'R' ? !odd : !!odd;
      bundle(G, x, y - lv * 3, flip, s === 'C' || (s === 'L' && flip) || (s === 'R' && !flip));
      minX = Math.min(minX, x); maxX = Math.max(maxX, x + 6);
    }));
    const c = mk(16, 20), x = c.getContext('2d');
    x.fillStyle = 'rgba(46,24,30,.32)'; x.fillRect(minX, 17, maxX - minX + 2, 1);
    x.fillStyle = 'rgba(46,24,30,.16)'; x.fillRect(minX + 1, 18, maxX - minX, 1);
    x.drawImage(pc, 0, 0);
    return c;
  });
}

// ------------------------------------------------------------ icons
function fishIcon() {   // 9x7, centre anchor; head left, forked tail right
  return art('ob:fish', () => _obPaintW(9, 7, G => {
    _obPat(G, 1, 1, ['......T', '.LLLLTT', 'YeYYYY.', '.DDDDTT', '......T'], { L: _obP.fishL, Y: _obP.fish, D: _obP.fishD, T: _obP.fishD, e: OUT });
  }));
}

function towelArt() {   // 10x4, centre anchor; stack them 2px apart (each one shows its striped front + a soft line)
  return art('ob:towel', () => {
    const c = mk(10, 4), x = c.getContext('2d'), px = (col, pts) => { x.fillStyle = col; pts.forEach(([i, j, w]) => x.fillRect(i, j, w || 1, 1)); };
    px('#5a6480', [[1, 0, 8], [0, 1], [0, 2], [9, 1], [9, 2]]);
    px('#9aaccc', [[1, 3, 8]]);
    px('#ffffff', [[1, 1, 8]]); px('#f2f6fc', [[1, 2, 8]]);
    px(_obP.stripe, [[2, 1], [7, 1]]); px('#a8c8f0', [[2, 2], [7, 2]]);
    return c;
  });
}

function padIcon(kind) {   // 12x12, centre anchor. v2 adds the kinds in _obPAD2 (tea shop net dining waiter chef tray table
  // west garden cottage suite roten clerk shishi sakura maple koi hat pet statue decor)
  const K = ['room', 'onsen', 'recep', 'maid', 'porter', 'shoes', 'basket', 'milk', 'bath', 'sign'];
  if (K.indexOf(kind) < 0 && !_obPAD2[kind]) kind = 'room';
  return art('ob:pad:' + kind, () => { const c = paint(12, 12, G => {
    const P = _obP;
    if (_obPAD2[kind]) _obPAD2[kind](G);
    else if (kind === 'room') {
      G.rect(2, 1, 8, 10, P.sheet);
      G.rect(3, 2, 6, 2, P.pillow); G.rect(4, 2, 4, 1, P.pillowL);
      G.rect(2, 5, 8, 6, P.duvet); G.rect(2, 5, 8, 1, P.sheet); G.rect(2, 10, 8, 1, P.duvetD);
      G.set(4, 7, '#8aa4d8'); G.set(7, 8, '#8aa4d8'); G.set(4, 9, '#8aa4d8');
    } else if (kind === 'onsen') {
      G.ell(6, 6.2, 5, 3.8, (x, y) => y + .5 >= 7.2 ? P.lantern : null);
      G.rect(2, 7, 8, 1, P.wat); G.set(3, 7, P.watL); G.set(4, 7, P.watL);
    } else if (kind === 'recep') {
      G.rect(1, 9, 10, 2, '#4a3a3a'); G.rect(1, 9, 10, 1, '#6a5656');
      G.ell(6, 8.6, 4.2, 4.2, (x, y) => y + .5 <= 9 ? P.gold : null);
      G.rect(5, 2, 2, 2, P.goldD); G.set(4, 6, P.goldL); G.set(4, 7, P.goldL); G.set(5, 5, P.goldL);
    } else if (kind === 'maid') {
      const Wc = '#fbfbf6';
      G.ell(6, 7, 4.6, 3.8, Wc); G.tri(1.5, 6, 2, 1.5, 5, 4, Wc); G.tri(7, 4, 10, 1.5, 10.5, 6, Wc);
      G.rect(2, 3, 8, 2, P.lilac); G.rect(3, 2, 6, 1, P.lilac); G.set(10, 3, P.lilac); G.set(10, 5, P.lilac); G.set(4, 3, '#d8c8f4');
      G.set(4, 7, OUT); G.set(7, 7, OUT); G.set(5, 8, P.pink); G.set(6, 8, P.pink); G.set(2, 1, Wc); G.set(9, 1, Wc);
    } else if (kind === 'porter') {
      const towel = (x, y) => { G.rect(x, y, 8, 1, P.towel); G.rect(x, y + 1, 8, 1, P.stripe); G.rect(x, y + 2, 8, 1, '#b4c2d8'); };
      towel(2, 2); towel(1, 5); towel(2, 8);
    } else if (kind === 'shoes') {
      const geta = (x, y) => _obPat(G, x, y, ['.LL.', 'LRRL', 'RLLR', 'RLLR', 'LLLL', 'LLLL', 'LLLL', 'SLLS', '.SS.'], { L: '#e8c090', R: P.red, S: P.woodD });
      geta(1, 1); geta(6, 2);
    } else if (kind === 'basket') {
      _obPat(G, 1, 1, ['...DDDD...', '..D....D..', '.D.WW.WW.D', '.DWWWWWWWD'], { D: P.weaveDk, W: P.towel });
      G.rect(1, 5, 10, 1, P.weaveL);
      for (let y = 6; y <= 10; y++) for (let x = (y > 8 ? 2 : 1); x <= (y > 8 ? 9 : 10); x++) G.set(x, y, (((x + (y & 1) * 2) >> 1) & 1) ? P.weave : P.weaveD);
    } else if (kind === 'milk') {
      G.rect(4, 1, 4, 2, P.stripe); G.rect(4, 1, 4, 1, '#7ab0f0');
      G.rect(5, 3, 2, 1, P.towel); G.rect(4, 4, 4, 1, P.towel); G.rect(3, 5, 6, 6, P.towel);
      G.rect(3, 7, 6, 2, P.stripe); G.set(5, 7, P.towel); G.set(6, 8, '#ffffff');
      G.rect(3, 10, 6, 1, P.towelD); G.set(4, 5, '#ffffff');
    } else if (kind === 'bath') {
      for (let y = 4; y <= 10; y++) for (let x = (y > 8 ? 2 : 1); x <= (y > 8 ? 9 : 10); x++) G.set(x, y, (y === 6 || y === 9) ? P.dk : (x % 3 === 0 ? P.woodD : P.wood));
      G.ell(6, 4, 5.4, 2.6, P.woodL);
      G.ell(6, 4, 4.2, 1.6, (x, y) => y < 4 ? P.watL : P.wat);
      G.set(4, 4, P.foam); G.set(5, 4, P.foam); G.set(8, 3, P.foam);
    } else {
      G.tri(1, 4, 2.5, 0, 4.5, 3, '#b07818'); G.tri(7.5, 3, 9.5, 0, 11, 4, '#b07818');
      G.rect(1, 3, 10, 6, '#b07818'); G.rect(2, 4, 8, 4, P.gold); G.rect(1, 3, 10, 1, '#ffe070');
      _obPat(G, 3, 4, ['..Y..', 'YYYYY', '.YYY.', '.Y.Y.'], { Y: P.red });
      G.rect(3, 9, 1, 2, P.dk); G.rect(8, 9, 1, 2, P.dk);
    }
  }, 'plain');
    if (kind === 'onsen') {   // three wavy steam lines, drawn after the outline pass so they stay thin
      const x = c.getContext('2d');
      [2, 5, 8].forEach(x0 => [1, 1, 0, 0, 1, 1].forEach((o, j) => {
        x.fillStyle = '#e0503a'; x.fillRect(x0 + o, j, 1, 1);
        x.fillStyle = 'rgba(90,24,20,.75)'; x.fillRect(x0 + o + 1, j, 1, 1);
      }));
    }
    if (_obPADPOST[kind]) _obPADPOST[kind](c.getContext('2d'));
    return c;
  });
}

// speech bubble 14x13, anchor (7,12) = bottom of the tail. v2: kinds tea rice kaiseki bath photo card heart2 blank
// ('blank' = empty bubble, core draws an emblem inside); gold = call / VIP bubble: gold ring (urgency 0) + a small bell
// on the top-right corner; urgency 1/2 still turn the ring orange / red.
function bubbleArt(kind, urgency, gold) {
  const K = ['bed', 'towel', 'dots', 'angry', 'heart', 'zzz', 'milk', 'tea', 'rice', 'kaiseki', 'bath', 'photo', 'card', 'heart2', 'blank'];
  if (K.indexOf(kind) < 0) kind = 'dots';
  const u = clamp(urgency | 0, 0, 2), gd = !!gold;
  return art('ob:bub:' + kind + ':' + u + (gd ? ':g' : ''), () => { const c = paint(14, 13, G => {
    const ring = gd && !u ? '#ffc21f' : ['#ffffff', '#ff9a2a', '#e8453c'][u], fill = gd && !u ? '#fffbea' : ['#ffffff', '#fff3e0', '#ffe6e2'][u];
    G.rect(1, 2, 12, 7, ring); G.rect(2, 1, 10, 9, ring);
    G.rect(2, 2, 10, 7, fill);
    G.rect(6, 10, 2, 1, ring); G.set(7, 11, ring);
    const pal = { H: _obP.dk, P: _obP.pillow, B: _obP.duvet, M: '#c8c0b0', o: '#5a6a8a', W: '#ffffff', S: _obP.stripe, D: '#5a5a6e', R: '#e8453c', h: '#ff9a9a', Z: '#4a6ad8', z: '#7a96e8', C: _obP.stripe, Y: _obP.gold, m: '#c8d4e8',
      s: '#a8b8c8', G: '#a8d8bc', g: '#b8d050', T: '#7ab894', t: '#c0e4cc', d: '#5a9a7a', w: '#fbfaf4', N: '#26342c', L: '#fff2a8', O: '#b07818', r: '#e8453c',
      b: '#5cc8c8', u: '#e6c48c', j: '#b0602c', V: '#8a5a34', K: '#5a5a6a', k: '#7a7a8a', E: '#2a2a36', e: '#5a8ac8', F: '#e8b838', f: '#fffbea', n: '#b0a898', y: '#ffd23f', X: '#ffffff' };
    const icon = {
      bed: ['H.......', 'HPP.....', 'HPPBBBBB', 'HBBBBBBB', 'HMMMMMMH'],
      towel: ['...ooo...', '..oWSWo..', '.oomSmoo.', 'oWSWoWSWo', 'omSmomSmo', '.ooo.ooo.'],
      dots: ['DD.DD.DD', 'DD.DD.DD'],
      angry: ['..R.R..', '.RR.RR.', 'RR...RR', '.......', 'RR...RR', '.RR.RR.', '..R.R..'],
      heart: ['.RR.RR.', 'RhRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
      zzz: ['.....zzz', '.......z', '.....zzz', 'ZZZZZ...', '...Z....', '..Z.....', '.ZZZZZ..'],
      milk: ['.CCC.', '.oWo.', 'oWWWo', 'oCCCo', 'oWWWo', 'oMMMo', '.ooo.'],
      tea: ['.s..s..', 's..s...', 'GgggggG', 'TTTTTTT', 'tTTTTTd', '.TTTTd.', '..TTT..'],
      rice: ['...M...', '..MwM..', '.MwXwM.', '.MwwwM.', 'MwwwwwM', 'MNNNNNM', '.NNNNN.'],
      kaiseki: ['OLLLLLLO', 'YYYYYYYY', 'rrrRrrrr', 'YYYYYYYY', 'YYYYYYYY', 'OOOOOOOO'],
      bath: ['.s..s..s.', '..s..s..s', 'VbbbbbbbV', 'VuuuuuuuV', 'VjjjjjjjV', '.VuuuuuV.', '..VVVVV..'],   // hinoki tub + steam (stage M: the red one read as a bowl of food)
      photo: ['.kk...y..', 'KKKKKKKKK', 'KKKEEEKKK', 'KKEeXEKKK', 'KKKEEEKKK', 'KKKKKKKKK'],
      card: ['FFFFFFFFF', 'FfyfffffF', 'FyyyfnnfF', 'FfyfffffF','FfffnnnfF', 'FFFFFFFFF'],
      heart2: ['........y.', '.RR.RR.yXy', 'RhRRRRR.y.', 'RRRRRRR...', '.RRRRR....', '..RRR.....', '...R......'],
      blank: null,
    }[kind];
    if (kind === 'zzz') icon[6] = 'ZZZZZ...';
    if (!icon) return;
    const ih = icon.length, iw = icon[0].length;
    _obPat(G, 2 + Math.floor((10 - iw) / 2), 2 + Math.floor((7 - ih) / 2), icon, pal);
  }, 'plain');
    if (gd) {   // small gold bell on the top-right corner (drawn after the outline so it stays crisp)
      const x = c.getContext('2d'), px = (col, pts) => { x.fillStyle = col; pts.forEach(([i, j]) => x.fillRect(i, j, 1, 1)); };
      px(OUT, [[10, 0], [12, 0], [9, 1], [13, 1], [9, 2], [13, 2], [10, 3], [12, 3]]);
      px('#ffd23f', [[10, 1], [11, 1], [12, 1], [10, 2], [11, 2]]); px('#fff6c0', [[11, 0]]); px('#d89a20', [[12, 2]]); px('#8a5a10', [[11, 3]]);
    }
    return c;
  });
}

function arrowArt(frame) {   // 9x8 down arrow, centre anchor
  frame = frame ? 1 : 0;
  return art('ob:arrow:' + frame, () => paint(9, 8, G => {
    const Y = '#ffe14a', L = frame ? '#ffffff' : '#fff6b0', D = '#f0a020';
    _obPat(G, 1, 1, ['..YYY..', '..LYY..', 'YYYYYYY', '.YYYYD.', '..YYD..', '...D...'], { Y, L, D });
    if (frame) G.set(2, 3, L);
  }, 'plain'));
}

function handArt() {   // 10x11 tutorial hand (Fishing I.hand), centre anchor; fingertip at (4,0)
  return art('ob:hand', () => {
    const rs = ['...XX.....', '..XWWX....', '..XWWX....', '..XWWXXX..', '..XWWXWWXX', 'XXXWWWWWWX',
      'XWXWWWWWWX', 'XWWWWWWWWX', '.XWWWWWWWX', '..XWWWWWX.', '...XXXXX..'];
    const c = mk(10, 11), x = c.getContext('2d');
    rs.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') { x.fillStyle = ch === 'X' ? OUT : '#ffffff'; x.fillRect(i, j, 1, 1); } }));
    return c;
  });
}

function joyBase() {   // 28x28, centre anchor (14,14)
  return art('ob:joyBase', () => {
    const c = mk(28, 28), x = c.getContext('2d');
    for (let j = 0; j < 28; j++) for (let i = 0; i < 28; i++) {
      const d = Math.hypot(i + .5 - 14, j + .5 - 14);
      let col = null;
      if (d < 11.6) col = 'rgba(255,255,255,.14)';
      else if (d < 13.2) col = 'rgba(255,255,255,.55)';
      else if (d < 14) col = 'rgba(27,27,47,.32)';
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
    x.fillStyle = 'rgba(255,255,255,.4)';
    [[13, 4], [14, 4], [12, 5], [15, 5], [13, 23], [14, 23], [12, 22], [15, 22], [4, 13], [4, 14], [5, 12], [5, 15], [23, 13], [23, 14], [22, 12], [22, 15]].forEach(([i, j]) => x.fillRect(i, j, 1, 1));
    return c;
  });
}

function joyKnob() {   // 12x12, centre anchor (6,6)
  return art('ob:joyKnob', () => {
    const c = mk(12, 12), x = c.getContext('2d');
    for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
      const dx = i + .5 - 6, dy = j + .5 - 6, d = Math.hypot(dx, dy);
      let col = null;
      if (d < 4.9) col = (dx + dy < -3.5) ? 'rgba(255,255,255,.95)' : (dx + dy > 3.5 ? 'rgba(220,226,240,.8)' : 'rgba(255,255,255,.78)');
      else if (d < 6) col = 'rgba(27,27,47,.4)';
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
    return c;
  });
}

function starIcon(on, gold) {   // 7x7, centre anchor; gold = gold star (after star 5): warmer, deeper gold + a white spark
  on = !!on; gold = !!gold;
  return art('ob:star:' + (gold ? 'g' : on ? 1 : 0), () => paint(7, 7, G => {
    _obPat(G, 1, 1, ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'], { X: gold ? '#ffaa1c' : on ? '#ffd23f' : '#5a5468' });
    if (gold) { G.set(3, 2, '#ffffff'); G.set(2, 3, '#ffe27a'); G.set(3, 3, '#ffc83a'); G.set(4, 4, '#c85a10'); G.set(5, 3, '#d86a14'); G.set(2, 5, '#d86a14'); G.set(4, 5, '#c85a10'); }
    else if (on) { G.set(3, 2, '#fff6c0'); G.set(2, 3, '#fff6c0'); G.set(4, 4, '#f0a020'); G.set(5, 3, '#f0a020'); }
    else { G.set(3, 2, '#6e687e'); }
  }, 'plain'));
}

function soundIcon(on) {   // Fishing I.sound / I.mute: 9x7 glyph + 1px outline = 11x9, centre anchor
  on = on === undefined ? true : !!on;
  return art('ob:sound:' + (on ? 1 : 0), () => rows(on
    ? ['...X..X..', '..XX...X.', 'XXXX.X.X.', 'XXXX.X.X.', 'XXXX.X.X.', '..XX...X.', '...X..X..']
    : ['...X.....', '..XX.....', 'XXXX.X.X.', 'XXXX..X..', 'XXXX.X.X.', '..XX.....', '...X.....'], { X: '#ffffff' }));
}

function sparkleArt(frame) {   // 9x9 unlock twinkle, centre anchor (4,4), frames 0..3
  const f = clamp(frame | 0, 0, 3);
  return art('ob:spark:' + f, () => {
    const c = mk(9, 9), x = c.getContext('2d'), px = (col, pts) => { x.fillStyle = col; pts.forEach(([i, j]) => x.fillRect(4 + i, 4 + j, 1, 1)); };
    const arm = (n, cols) => { for (let d = 1; d <= n; d++) px(cols[d - 1], [[d, 0], [-d, 0], [0, d], [0, -d]]); };
    if (f === 0) { px('#ffffff', [[0, 0]]); arm(1, ['#ffe14a']); }
    else if (f === 1) { px('#ffffff', [[0, 0]]); arm(2, ['#ffffff', '#ffe14a']); px('#ffb02a', [[1, 1], [-1, -1], [1, -1], [-1, 1]]); }
    else if (f === 2) { px('#ffffff', [[0, 0]]); arm(4, ['#ffffff', '#fff27a', '#ffd23f', '#ff9a2a']); px('#ffe14a', [[1, 1], [-1, -1], [1, -1], [-1, 1]]); px('#ffb02a', [[2, 2], [-2, -2], [2, -2], [-2, 2]]); }
    else { px('#fff6c0', [[0, 0]]); px('#ffe14a', [[2, 0], [-2, 0], [0, 2], [0, -2]]); px('#ffb02a', [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3], [3, -3], [-3, 3]]); }
    return c;
  });
}

function poofArt(frame) {   // 16x12 white smoke puff, centre anchor (8,6), frames 0..3
  const f = clamp(frame | 0, 0, 3);
  return art('ob:poof:' + f, () => paint(16, 12, G => {
    const Wc = f === 3 ? '#f4f6fa' : '#ffffff', S = f === 3 ? '#d4dae6' : '#dfe4ee';
    const puff = (cx, cy, r) => G.ell(cx, cy, r, r * .9, (x, y) => ((x + .5 - cx) * .8 + (y + .5 - cy) > r * .3 ? S : Wc));
    if (f === 0) { puff(5.8, 7.4, 2.2); puff(10.2, 7.4, 2.2); puff(8, 6.2, 2.8); }
    else if (f === 1) { puff(4.6, 7.2, 3); puff(11.4, 7.2, 3); puff(8, 5.2, 3.4); puff(8, 8, 2.6); }
    else if (f === 2) {
      puff(3.6, 6.6, 2.8); puff(12.4, 6.6, 2.8); puff(8, 4, 3.1); puff(6, 8.6, 2.2); puff(10.2, 8.6, 2.2);
      G.map((x, y, c) => (Math.hypot(x + .5 - 8, y + .5 - 6.4) < 2.2 && DITHER[y & 1][x & 1] > .6) ? S : c);
    } else { puff(2.6, 5.4, 1.7); puff(13.4, 5.4, 1.7); puff(8, 2.4, 1.6); puff(4.6, 9.4, 1.3); puff(11.4, 9.4, 1.3); }
  }));
}
