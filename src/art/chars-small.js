// ---------------------------------------------------------------- KITTEN (family guests' little one)
// kittenSprite: 10x14, anchor (5,13). view 'down' | 'up' | 'side' (facing right), frame 0 stand / 1 / 2 walk (2 bobs up).
function kittenSprite(view, frame, fur) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid], fr = frame === 1 || frame === 2 ? frame : 0;
  const v = view === 'up' || view === 'side' ? view : 'down';
  return art('chk:' + v + ':' + fr + ':' + fid, () => {
    const bob = fr === 2 ? 1 : 0;
    const c = paint(10, 14, Gr => {
      const G = _chShift(Gr, -bob), L = Gr;
      if (v === 'side') _chKitSide(G, L, f, fr, bob); else _chKitFront(G, L, f, fr, bob, v === 'up');
    });
    if (v === 'down') _chPx(c, _chTip, [[0, 8 - bob], [9, 8 - bob]]);
    _chShadow(c, 5, 13, 3);
    return c;
  });
}
function _chKitHead(G, f, back, oy) {
  const S = (x, y, c) => G.set(x, y + oy, c), ear = f.ear || f.O, inn = back ? shade(ear, -18) : _chC.pink;
  S(2, 2, ear); S(7, 2, ear); S(2, 3, ear); S(3, 3, inn); S(6, 3, inn); S(7, 3, ear);
  G.rect(2, 4 + oy, 6, 1, f.O); G.rect(1, 5 + oy, 8, 4, f.O); G.rect(2, 9 + oy, 6, 1, f.O);
  if (f.stripes) { S(4, 4, f.D); S(5, 4, f.D); S(4, 5, f.D); S(5, 5, f.D); S(1, 7, f.D); S(8, 7, f.D); if (back) { G.rect(2, 7 + oy, 6, 1, f.D); } }
  if (f.patch) {
    if (!back) { S(2, 4, f.D); S(3, 4, f.D); S(2, 5, f.D); S(1, 6, f.D); S(2, 2, f.D); S(2, 3, f.D); if (f.D2) { S(7, 2, f.D2); S(7, 3, f.D2); S(6, 4, f.D2); S(7, 4, f.D2); } }
    else { S(7, 4, f.D); S(6, 4, f.D); S(7, 5, f.D); S(8, 6, f.D); S(7, 2, f.D); S(7, 3, f.D); if (f.D2) { S(2, 2, f.D2); S(2, 3, f.D2); S(2, 4, f.D2); S(3, 4, f.D2); } }
  }
  if (f.points && !back) { G.rect(3, 8 + oy, 4, 2, mixHex(f.O, f.D, .45)); }
  if (!back) {
    const lo = f.eye === OUT ? OUT : shade(f.eye, -40);
    S(3, 6, f.eye); S(3, 7, lo); S(6, 6, f.eye); S(6, 7, lo);
    const n = f.points ? f.D : _chC.nose; S(4, 8, n); S(5, 8, n);
    S(2, 8, _chBlush(f)); S(7, 8, _chBlush(f));
  }
}
// kitten front / back: big head (8 wide) on a 4-wide body, 1px feet; G = body view (bobs on frame 2), L = ground
function _chKitFront(G, L, f, fr, bob, back) {
  const P = f.P || f.W, T = f.T || f.O;
  const lift = fr === 0 ? -1 : ((fr === 1) !== back ? 1 : 0);
  if (!back) { G.set(2, 11, T); G.set(1, 10, T); G.set(1, 9 + (fr === 2 ? 1 : 0), T); }
  else { G.set(7, 11, T); G.set(8, 10, T); G.set(8, 9 + (fr === 1 ? 1 : 0), T); }
  G.rect(3, 10, 4, 2, f.O);
  if (!back) { G.set(4, 10, f.W); G.set(5, 10, f.W); G.set(4, 11, f.W); G.set(5, 11, f.W); G.set(3, 11, P); G.set(6, 11, P); }
  else { if (f.stripes) G.rect(3, 11, 4, 1, f.D); if (f.patch) { G.set(3, 10, f.D); G.set(3, 11, f.D); } }
  [3, 6].forEach((lx, i) => {
    if (lift === i) return;                       // lifted foot tucked under the body
    L.set(lx, 12, P); if (bob) L.set(lx, 11, f.O);
  });
  _chKitHead(G, f, back, 0);
}
// kitten side (facing right): head at the front, short body behind, tail up
function _chKitSide(G, L, f, fr, bob) {
  const P = f.P || f.W, T = f.T || f.O, ear = f.ear || f.O, M = f.M || f.W, S = (x, y, c) => G.set(x, y, c);
  const tt = fr === 2 ? 1 : 0;
  S(1, 9, T); S(0, 8, T); S(0 + tt, 7, T); S(1 + tt, 6, T);
  const legs = fr === 0 ? [[2, 0], [3, 1], [5, 0], [6, 1]] : fr === 1 ? [[1, 0], [4, 1], [4, 0], [7, 1]] : [[3, 0], [1, 1], [6, 0], [4, 1]];
  legs.forEach(([lx, near]) => { const k = near ? 0 : -26; L.set(lx, 12, shade(P, k)); if (bob) L.set(lx, 11, shade(f.O, k)); });
  G.rect(1, 9, 3, 1, f.O); G.rect(1, 10, 6, 2, f.O); G.rect(3, 11, 3, 1, f.W);
  if (f.stripes) { S(2, 9, f.D); S(2, 10, f.D); S(4, 10, f.D); }
  if (f.patch) { S(1, 10, f.D); S(2, 10, f.D); S(2, 9, f.D); }
  const far = shade(ear, -22);
  S(4, 2, far); S(4, 3, far); S(5, 3, far);
  S(7, 2, ear); S(7, 3, ear); S(8, 3, _chC.pink);
  G.rect(3, 4, 6, 1, f.O); G.rect(3, 5, 6, 4, f.O); G.rect(4, 9, 5, 1, f.O); S(9, 7, f.O); S(9, 8, f.points ? f.D : M);
  if (f.stripes) { S(5, 4, f.D); S(6, 4, f.D); S(3, 6, f.D); S(3, 7, f.D); }
  if (f.patch) { S(3, 5, f.D); S(4, 5, f.D); S(3, 6, f.D); S(4, 6, f.D); if (f.D2) { S(7, 2, f.D2); S(7, 3, f.D2); } }
  if (f.points) { S(8, 8, mixHex(f.O, f.D, .5)); S(8, 9, mixHex(f.O, f.D, .5)); S(9, 7, mixHex(f.O, f.D, .5)); S(7, 2, f.D); S(7, 3, f.D); }
  S(7, 6, f.eye); S(7, 7, f.eye === OUT ? OUT : shade(f.eye, -40));
  S(9, 7, f.points ? f.D : _chC.nose);
  if (!f.points) S(8, 8, M);
  S(6, 8, _chBlush(f));
}
// kittenSit: 10x12, anchor (5,11). Sitting on its haunches facing right, tail wrapped round the front paws.
function kittenSit(fur) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid];
  return art('chki:' + fid, () => {
    const c = paint(10, 12, G => {
      const P = f.P || f.W, T = f.T || f.O, ear = f.ear || f.O, M = f.M || f.W, S = (x, y, cc) => G.set(x, y, cc);
      // haunch + body
      G.ell(4.5, 8.8, 3.2, 2.4, f.O); G.rect(5, 6, 3, 4, f.O);
      G.rect(6, 7, 2, 3, f.W);
      if (f.stripes) { S(2, 8, f.D); S(3, 7, f.D); S(2, 9, f.D); }
      if (f.patch) { S(2, 8, f.D); S(3, 8, f.D); S(2, 9, f.D); S(3, 9, f.D); }
      // front paws + tail wrapped along the floor
      S(6, 10, P); S(7, 10, P);
      S(1, 10, T); S(2, 10, T); S(3, 10, T); S(4, 10, T); S(5, 10, T);
      // head
      const far = shade(ear, -22);
      S(4, 0, far); S(4, 1, far); S(5, 1, far);
      S(7, 0, ear); S(7, 1, ear); S(8, 1, ear);
      G.rect(3, 2, 6, 1, f.O); G.rect(3, 3, 6, 3, f.O); G.rect(4, 6, 4, 1, f.O); S(9, 4, f.O); S(9, 5, f.points ? f.D : M);
      if (f.stripes) { S(4, 2, f.D); S(5, 2, f.D); S(3, 4, f.D); }
      if (f.patch) { S(3, 3, f.D); S(4, 3, f.D); S(3, 4, f.D); if (f.D2) { S(7, 0, f.D2); S(7, 1, f.D2); } }
      if (f.points) { S(8, 5, mixHex(f.O, f.D, .5)); S(8, 6, mixHex(f.O, f.D, .5)); S(7, 0, f.D); S(7, 1, f.D); }
      S(7, 3, f.eye); S(7, 4, f.eye === OUT ? OUT : shade(f.eye, -40));
      S(9, 4, f.points ? f.D : _chC.nose);
      if (!f.points) { S(8, 5, M); }
      S(6, 5, _chBlush(f));
    });
    _chPx(c, _chTip, [[9, 5]]);
    _chShadow(c, 5, 11, 4);
    return c;
  });
}

// ---------------------------------------------------------------- PETS (boutique, star 5)
// petSprite('duck', view, frame): 10x10 anchor (5,9). petSprite('shiba', view, frame): 16x16 anchor (8,15).
// frames 0 stand / 1 / 2 walk; shiba frames 3 and 4 = sitting, tail wagging (alternate them).
function petSprite(kind, view, frame) {
  const k = kind === 'shiba' || kind === 'p_shiba' ? 'shiba' : 'duck', v = view === 'up' || view === 'side' ? view : 'down';
  const max = k === 'shiba' ? 4 : 2, fr = frame >= 0 && frame <= max ? frame | 0 : 0;
  return art('chp:' + k + ':' + v + ':' + fr, () => k === 'shiba' ? _chShiba(v, fr) : _chDuck(v, fr));
}
const _chDk = { Y: '#ffd84a', D: '#e8a830', L: '#fff2a8', B: '#f08a2a', F: '#e87a22' };
function _chDuck(v, fr) {
  const c = paint(10, 10, G => {
    const C = _chDk, S = (x, y, cc) => G.set(x, y, cc);
    if (v === 'side') {
      const step = fr === 0 ? [[4, 8], [5, 8]] : fr === 1 ? [[3, 8], [6, 8]] : [[4, 8], [6, 8]];
      step.forEach(([x, y], i) => S(x, y, i ? C.F : shade(C.F, -24)));
      G.ell(4.5, 6, 3.6, 2.2, C.Y); S(1, 4, C.Y); S(1, 5, C.Y);                    // body + tail tip
      G.rect(3, 6, 3, 1, C.D); S(2, 5, C.D);                                       // wing
      G.ell(6.5, 2.7, 2, 2, C.Y);                                                  // head
      S(8, 3, C.B); S(9, 3, C.B); S(8, 4, shade(C.B, -20));                         // beak
      S(7, 2, OUT); S(5, 1, C.L);
    } else {
      const sway = fr === 0 ? 0 : fr === 1 ? -1 : 1, back = v === 'up';
      [[3, 8], [6, 8]].forEach(([x, y], i) => { if (!((fr === 1 && i === 0) || (fr === 2 && i === 1))) { S(x, y, C.F); S(x + 1 - i, y, C.F); } else S(x, y - 1, C.F); });
      G.ell(5 + sway * .5, 6, 3.2, 2.3, C.Y);
      S(1 + (sway > 0 ? 1 : 0), 6, C.D); S(8 + (sway < 0 ? -1 : 0), 6, C.D);       // wings
      G.ell(5 + sway, 2.9, 2.1, 2.1, C.Y);
      if (!back) { S(4 + sway, 3, OUT); S(6 + sway, 3, OUT); S(4 + sway, 4, C.B); S(5 + sway, 4, C.B); S(4 + sway, 5, shade(C.B, -20)); S(5 + sway, 5, shade(C.B, -20)); }
      else { S(5, 7, C.L); S(4, 8, C.Y); S(5, 8, C.Y); }
      S(4 + sway, 1, C.L);
    }
  });
  _chShadow(c, 5, 9, 3);
  return c;
}
const _chSb = { T: '#e2984a', D: '#b8703a', C: '#fbf0dc', N: OUT, I: '#f4c8a0' };
function _chShiba(v, fr) {
  const sit = fr >= 3, wag = fr === 4 ? 1 : 0, bob = fr === 2 ? 1 : 0;
  const c = paint(16, 16, Gr => {
    const G = _chShift(Gr, -bob), L = Gr, C = _chSb, S = (x, y, cc) => G.set(x, y, cc);
    if (v === 'side') {
      if (sit) {
        // tail curled up behind, wagging
        const tx = wag ? 1 : 0;
        S(2 - tx, 9, C.T); S(1 - tx + 1, 8, C.C); S(2, 8, C.T); S(3, 9, C.T); S(1 + (wag ? 0 : 1), 10, C.T);
        G.ell(5.5, 11.5, 3.2, 3, C.T); G.rect(6, 7, 5, 6, C.T);                  // haunch + chest
        G.rect(9, 9, 2, 4, C.C);                                                // chest
        L.rect(10, 12, 2, 3, C.T); L.set(10, 14, C.C); L.set(11, 14, C.C);       // front leg
        L.rect(4, 14, 4, 1, C.C); L.set(8, 14, C.T);                             // hind paw on floor
      } else {
        // tail curled over the back
        S(3, 4, C.T); S(4, 4, C.T); S(2, 5, C.T); S(5, 5, C.T); S(2, 6, C.T); S(4, 5, C.C); S(3, 5, C.C); S(5, 6, C.T); S(3, 6, C.C);
        const legs = fr === 0 ? [[4, 0], [5, 1], [9, 0], [10, 1]] : fr === 1 ? [[3, 0], [6, 1], [8, 0], [11, 1]] : [[5, 0], [3, 1], [10, 0], [8, 1]];
        legs.forEach(([lx, near]) => { const k = near ? 0 : -26; L.rect(lx, 11, 1, 3, shade(C.T, k)); L.set(lx, 14, shade(C.C, k)); if (bob) L.set(lx, 10, shade(C.T, k)); });
        G.rect(3, 7, 9, 4, C.T); G.rect(4, 6, 6, 1, C.T); G.rect(5, 10, 6, 1, C.C);   // body + belly
      }
      // head facing right
      const hy = sit ? -1 : 0, H = (x, y, cc) => G.set(x, y + hy, cc);
      H(10, 1, C.D); H(10, 2, C.T); H(11, 2, C.D); H(12, 1, C.T); H(12, 2, C.T); H(13, 2, C.T); H(12, 3, C.I);
      G.rect(9, 3 + hy, 5, 4, C.T); G.rect(10, 7 + hy, 4, 1, C.T); G.rect(13, 5 + hy, 3, 2, C.T);
      G.rect(12, 6 + hy, 4, 1, C.C); G.rect(11, 7 + hy, 3, 1, C.C); H(10, 6, C.C);
      H(15, 5, C.N); H(12, 4, C.N); H(11, 3, C.C);
    } else if (v === 'up') {
      if (sit) {
        G.ell(8, 11.5, 4.5, 3.2, C.T); G.rect(5, 8, 6, 4, C.T);
        const tx = wag ? 2 : -2; S(8 + tx, 13, C.T); S(8 + tx * 1.5, 13, C.C); S(8 + tx * 2, 12, C.T);
      } else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        [[5, 0], [10, 1]].forEach(([lx, i]) => { if (lift !== i) { L.rect(lx, 13, 1, 1, C.T); L.set(lx, 14, C.C); if (bob) L.set(lx, 12, C.T); } else G.set(lx, 13, C.C); });
        G.rect(5, 9, 6, 4, C.T); G.rect(4, 10, 8, 2, C.T);
        // curled tail on the back: cream ring round a dark-tan centre
        S(7, 8, C.C); S(8, 8, C.C); S(6, 9, C.C); S(9, 9, C.C); S(6, 10, C.C); S(9, 10, C.C); S(7, 11, C.C); S(8, 11, C.T);
        S(7, 9, C.D); S(8, 9, C.T); S(7, 10, C.T); S(8, 10, C.D);
      }
      // back of the head
      S(4, 1, C.T); S(4, 2, C.T); S(5, 2, C.T); S(11, 1, C.T); S(11, 2, C.T); S(10, 2, C.T);
      G.rect(4, 3, 8, 1, C.T); G.rect(3, 4, 10, 4, C.T); G.rect(4, 8, 8, 1, C.T);
      G.rect(5, 3, 6, 1, C.D);
    } else {
      // front
      if (sit) {
        G.ell(8, 12, 4.6, 2.6, C.T);                                           // haunches
        G.rect(5, 9, 6, 3, C.T); G.rect(6, 9, 4, 4, C.C);                        // chest
        L.rect(6, 12, 1, 3, C.C); L.rect(9, 12, 1, 3, C.C);                      // straight front legs
        const tx = wag ? 1 : 0; S(12 + tx, 12, C.T); S(13 + tx, 11, C.T); S(13 + tx, 10, C.C);
      } else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        S(12, 9, C.T); S(12, 8, C.T); S(11, 8, C.C);                             // tail curl over the shoulder
        G.rect(5, 9, 6, 4, C.T); G.rect(6, 9, 4, 3, C.C);
        [[5, 0], [9, 1]].forEach(([lx, i]) => {
          if (lift === i) { G.rect(lx, 12, 2, 1, C.T); G.rect(lx, 13, 2, 1, C.C); }
          else { L.rect(lx, 12, 2, 2, C.T); L.rect(lx, 14, 2, 1, C.C); if (bob) L.rect(lx, 11, 2, 1, C.T); }
        });
      }
      // head: pointed ears, white cheeks, cream eyebrow dots
      S(4, 1, C.T); S(4, 2, C.T); S(5, 2, C.I); S(11, 1, C.T); S(11, 2, C.T); S(10, 2, C.I);
      G.rect(4, 3, 8, 1, C.T); G.rect(3, 4, 10, 4, C.T); G.rect(4, 8, 8, 1, C.T);
      G.rect(5, 6, 6, 3, C.C); S(4, 7, C.C); S(11, 7, C.C);
      S(6, 4, C.C); S(9, 4, C.C);
      S(6, 5, C.N); S(9, 5, C.N); S(7, 6, C.N); S(8, 6, C.N);
      S(7, 7, '#d88070'); S(8, 7, C.C);
    }
  });
  _chShadow(c, 8, 15, 5);
  return c;
}

// ---------------------------------------------------------------- catCurl: 14x10, anchor (7,9). A cat asleep in a ball.
// Body oval, head tucked on the right resting on the tail (a crease line keeps it apart), ears up, eyes shut.
function catCurl(fur) {
  const fid = FURS[fur] ? fur : 'orange', f = FURS[fid];
  return art('chc:' + fid, () => {
    const c = paint(14, 10, G => {
      const S = (x, y, cc) => G.set(x, y, cc), ear = f.ear || f.O, T = f.T || f.O, M = f.M || f.W;
      const hx = 9.4, hy = 5.6, inHead = (x, y) => ((x + .5 - hx) / 2.8) ** 2 + ((y + .5 - hy) / 2.3) ** 2 <= 1;
      G.ell(6, 5.4, 5.2, 3.1, f.O);                                            // curled body
      if (f.stripes) [[3, 3], [3, 4], [5, 2], [5, 3], [2, 6], [7, 3], [4, 7]].forEach(p => S(p[0], p[1], f.D));
      if (f.patch) { G.ell(3.6, 4.2, 2.4, 1.9, f.D); if (f.D2) G.ell(6.5, 3, 1.4, 1, f.D2); }
      if (f.points) G.ell(3, 5.6, 1.8, 2.2, mixHex(f.O, f.D, .3));
      // tail wraps round the front, a shade darker than the body
      const tc = shade(T, -18);
      G.rect(2, 8, 8, 1, tc); S(1, 7, tc); S(10, 7, tc);
      if (f.stripes) { S(3, 8, f.D); S(6, 8, f.D); }
      // head
      G.ell(hx, hy, 2.8, 2.3, f.O);
      for (let y = 3; y <= 7; y++) for (let x = 6; x <= 12; x++) if (inHead(x, y)) { if (!inHead(x - 1, y) && G.get(x - 1, y) && !inHead(x - 1, y)) G.set(x - 1, y, shade(f.O, -30)); break; }
      S(7, 1, ear); S(7, 2, ear); S(8, 2, _chC.pink); S(11, 1, ear); S(11, 2, ear); S(10, 2, _chC.pink);
      if (f.stripes) { S(9, 3, f.D); S(9, 4, f.D); }
      if (f.patch) { S(7, 1, f.D); S(7, 2, f.D); S(7, 3, f.D); if (f.D2) { S(11, 1, f.D2); S(11, 2, f.D2); S(11, 3, f.D2); } }
      if (f.points) { G.ell(9.4, 6.4, 1.8, 1.2, mixHex(f.O, f.D, .55)); S(7, 1, f.D); S(7, 2, f.D); S(11, 1, f.D); S(11, 2, f.D); }
      const Ld = _chLid(f); S(7, 5, Ld); S(8, 5, Ld); S(10, 5, Ld); S(11, 5, Ld);
      S(9, 6, f.points ? f.D : _chC.nose);
      if (!f.points) { S(8, 7, M); S(9, 7, M); S(10, 7, M); }
      S(7, 6, _chBlush(f)); S(11, 6, _chBlush(f));
    });
    _chShadow(c, 7, 9, 5);
    return c;
  });
}
/*ART:chars:END*/
