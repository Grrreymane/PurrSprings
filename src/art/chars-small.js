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
// v2.1 (SPEC_v2 16.6): 'fox' 16x16 anchor (8,15): 3 / 4 = sitting, the tail tip swishes (alternate them).
// 'tanuki' 16x16 anchor (8,15): 3 = sitting; 4 = a puff of smoke with a leaf, 5 = disguised as a paper lantern
// (4 and 5 look the same in every view; play 3 .. 4 5 5 5 4 .. 3 now and then). 'crane' 16x20 anchor (8,19):
// 3 = resting on one leg, 4 = one leg, head bowed (alternate slowly). Unlock ids p_* are accepted; petAnchor(kind) = [ax, ay].
const _CH_PETS = { duck: [10, 10, 5, 9, 2], shiba: [16, 16, 8, 15, 4], fox: [16, 16, 8, 15, 4], tanuki: [16, 16, 8, 15, 5], crane: [16, 20, 8, 19, 4] };   // w, h, ax, ay, last frame
function _chPetKind(kind) { const k = typeof kind === 'string' && kind.indexOf('p_') === 0 ? kind.slice(2) : kind; return _CH_PETS[k] ? k : 'duck'; }
function petSprite(kind, view, frame) {
  const k = _chPetKind(kind), v = view === 'up' || view === 'side' ? view : 'down';
  const max = _CH_PETS[k][4], fr = frame >= 0 && frame <= max ? frame | 0 : 0;
  return art('chp:' + k + ':' + v + ':' + fr, () => k === 'shiba' ? _chShiba(v, fr) : k === 'fox' ? _chFox(v, fr) : k === 'tanuki' ? _chTanuki(v, fr) : k === 'crane' ? _chCrane(v, fr) : _chDuck(v, fr));
}
function petAnchor(kind) { const d = _CH_PETS[_chPetKind(kind)]; return [d[2], d[3]]; }
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

// fox kit: red-orange, white muzzle / chest / tail tip, black socks and ear backs, a big brush of a tail
const _chFx = { R: '#e8743a', D: '#b8522a', C: '#fcf2e2', K: '#3a2a30', I: '#f6c0a8', N: OUT };
function _chFox(v, fr) {
  const sit = fr >= 3, sw = fr === 4 ? 1 : 0, bob = fr === 2 ? 1 : 0;
  const c = paint(16, 16, Gr => {
    const G = _chShift(Gr, -bob), L = Gr, C = _chFx, S = (x, y, cc) => G.set(x, y, cc);
    const tail = (cx, cy, rx, ry, tipX) => G.ell(cx, cy, rx, ry, (x, y) => (tipX < 0 ? x <= -tipX : x >= tipX) ? C.C : (y + .5 < cy - ry * .3 ? C.R : C.D));
    if (v === 'side') {
      if (sit) {
        G.rect(1, 12, 8, 2, C.D); G.rect(0, 12 - sw, 2, 2, C.C); S(2, 12, C.R);                       // tail along the floor, tip swishing
        G.ell(5.5, 10.5, 3.2, 3, C.R); G.rect(7, 6, 4, 7, C.R); G.rect(9, 8, 2, 5, C.C);           // haunch + chest
        L.rect(9, 12, 1, 2, C.K); L.rect(10, 12, 1, 2, C.K); L.set(11, 13, C.K); L.rect(4, 13, 3, 1, C.K);
      } else {
        tail(2.6, 8.6, 2.8, 2.4, -1);
        const legs = fr === 0 ? [[4, 0], [5, 1], [9, 0], [10, 1]] : fr === 1 ? [[3, 0], [6, 1], [8, 0], [11, 1]] : [[5, 0], [3, 1], [10, 0], [8, 1]];
        legs.forEach(([lx, near]) => { const k = near ? 0 : -26; L.set(lx, 11, shade(C.R, k)); L.rect(lx, 12, 1, 2, shade(C.K, k)); if (bob) L.set(lx, 10, shade(C.R, k)); });
        G.rect(4, 7, 7, 4, C.R); G.rect(5, 6, 4, 1, C.R); G.rect(5, 10, 5, 1, C.C); G.rect(4, 7, 5, 1, C.D);
      }
      const hy = sit ? -1 : 0, H = (x, y, cc) => G.set(x, y + hy, cc);
      H(10, 0, C.K); H(10, 1, C.D); H(11, 1, C.D); H(12, 0, C.K); H(12, 1, C.R); H(13, 1, C.R); H(12, 2, C.I);   // ears
      G.rect(10, 2 + hy, 4, 4, C.R); G.rect(14, 4 + hy, 2, 2, C.R); G.rect(11, 6 + hy, 3, 1, C.C); G.rect(13, 5 + hy, 3, 1, C.C);
      H(10, 5, C.C); H(9, 6, C.R); H(15, 4, C.N); H(13, 3, C.N);
    } else if (v === 'up') {
      if (sit) { G.ell(8, 10.8, 4.2, 3.4, C.R); G.rect(6, 7, 4, 2, C.R); G.rect(9, 13, 4, 1, C.D); G.rect(12, 12 - sw, 2, 2, C.C); G.rect(7, 7, 2, 2, C.D); }
      else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        [[5, 0], [10, 1]].forEach(([lx, i]) => { if (lift !== i) { L.set(lx, 12, C.K); L.set(lx, 13, C.K); if (bob) L.set(lx, 11, C.R); } else G.set(lx, 12, C.K); });
        G.rect(5, 7, 6, 4, C.R); G.rect(4, 8, 8, 2, C.R);
        tail(8 + (fr === 1 ? -.5 : fr === 2 ? .5 : 0), 11, 2.4, 3, 0); G.ell(8 + (fr === 1 ? -.5 : fr === 2 ? .5 : 0), 13.4, 1.6, 1, C.C);
      }
      S(4, 0, C.K); S(4, 1, C.K); S(5, 1, C.K); S(11, 0, C.K); S(11, 1, C.K); S(10, 1, C.K);
      G.rect(4, 2, 8, 1, C.R); G.rect(3, 3, 10, 3, C.R); G.rect(4, 6, 8, 1, C.R); G.rect(5, 2, 6, 1, C.D);
    } else {
      if (sit) {
        G.ell(8, 11.6, 4.2, 2.6, C.R); G.rect(5, 7, 6, 5, C.R); G.rect(6, 7, 4, 5, C.C);
        L.rect(6, 11, 1, 3, C.K); L.rect(9, 11, 1, 3, C.K);
        G.rect(10, 13, 4, 1, C.D); G.rect(13, 12 - sw, 2, 2, C.C);                                  // tail round the paws, tip swishes
      } else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        tail(12.6, 9.2 - (fr === 2 ? .5 : 0), 2.4, 2.6, 14);
        G.rect(5, 8, 6, 4, C.R); G.rect(6, 8, 4, 3, C.C);
        [[5, 0], [9, 1]].forEach(([lx, i]) => {
          if (lift === i) { G.rect(lx, 12, 2, 1, C.K); }
          else { L.rect(lx, 11, 2, 1, C.R); L.rect(lx, 12, 2, 2, C.K); if (bob) L.rect(lx, 10, 2, 1, C.R); }
        });
      }
      // head: tall ears with black tips, white muzzle narrowing to the nose
      S(4, 0, C.K); S(4, 1, C.R); S(5, 1, C.I); S(11, 0, C.K); S(11, 1, C.R); S(10, 1, C.I); S(3, 1, C.K); S(12, 1, C.K);
      G.rect(4, 2, 8, 1, C.R); G.rect(3, 3, 10, 3, C.R); G.rect(4, 6, 8, 1, C.R);
      G.rect(3, 5, 3, 2, C.C); G.rect(10, 5, 3, 2, C.C); G.rect(6, 6, 4, 2, C.C); S(5, 7, C.C); S(10, 7, C.C);
      S(5, 4, C.N); S(10, 4, C.N); S(7, 6, C.N); S(8, 6, C.N);
    }
  });
  _chShadow(c, 8, 15, 5);
  return c;
}

// tanuki: round brown body, dark eye mask, cream muzzle and belly, ringed tail; can turn into a paper lantern
const _chTk = { B: '#8e6c4a', D: '#5e4430', M: '#2e2420', C: '#eadcbc', E: '#4a3628', W: '#ffffff' };
function _chTanuki(v, fr) {
  if (fr >= 4) return _chTanukiMagic(fr);
  const sit = fr === 3, bob = fr === 2 ? 1 : 0;
  const c = paint(16, 16, Gr => {
    const G = _chShift(Gr, -bob), L = Gr, C = _chTk, S = (x, y, cc) => G.set(x, y, cc);
    const tail = (cx, cy, rx, ry) => G.ell(cx, cy, rx, ry, (x, y) => ((v === 'up' ? y : x) % 2 ? C.D : C.B));   // ringed
    if (v === 'side') {
      if (sit) { tail(2.4, 12.4, 2.6, 1.8); G.ell(6.5, 10.4, 3.8, 3.4, C.B); G.ell(8.8, 10.8, 1.6, 2.4, C.C); L.rect(9, 13, 2, 1, C.D); L.rect(4, 13, 3, 1, C.D); }
      else {
        tail(2.2, 9.4, 2.4, 2.2);
        const legs = fr === 0 ? [[5, 0], [6, 1], [9, 0], [10, 1]] : fr === 1 ? [[4, 0], [7, 1], [8, 0], [11, 1]] : [[6, 0], [4, 1], [11, 0], [9, 1]];
        legs.forEach(([lx, near]) => { const k = near ? 0 : -26; L.rect(lx, 12, 1, 2, shade(C.D, k)); if (bob) L.set(lx, 11, shade(C.D, k)); });
        G.ell(7.4, 9.6, 4.6, 3, C.B); G.rect(6, 11, 4, 1, C.C); G.rect(5, 7, 4, 1, C.D);
      }
      // round head low on the chest, short cream muzzle, the dark mask round the eye
      const hy = sit ? -1 : 0, H = (x, y, cc) => G.set(x, y + hy, cc);
      G.ell(11.4, 5.8 + hy, 3.2, 2.9, C.B);
      H(9, 2, C.E); H(10, 2, C.E); H(9, 3, C.E); H(10, 3, C.D);                                     // round ear
      G.rect(13, 6 + hy, 2, 2, C.C); H(15, 6, C.M); H(12, 8, C.C); H(13, 8, C.C);
      H(10, 5, C.M); H(11, 5, C.M); H(12, 5, C.M); H(13, 5, C.M); H(11, 6, C.M); H(12, 6, C.M); H(12, 5, C.W);
    } else if (v === 'up') {
      if (sit) { G.ell(8, 11, 4.6, 3.4, C.B); tail(8, 13.4, 3.4, 1.4); }
      else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        [[5, 0], [10, 1]].forEach(([lx, i]) => { if (lift !== i) { L.rect(lx, 12, 1, 2, C.D); if (bob) L.set(lx, 11, C.D); } else G.set(lx, 12, C.D); });
        G.ell(8, 9.5, 4.4, 3.2, C.B); tail(8 + (fr === 1 ? -.5 : fr === 2 ? .5 : 0), 12, 2, 2.2);
      }
      S(3, 1, C.E); S(4, 1, C.E); S(3, 2, C.E); S(12, 1, C.E); S(11, 1, C.E); S(12, 2, C.E);
      G.ell(8, 4.4, 4.6, 3.2, C.B); G.rect(5, 2, 6, 1, C.D);
    } else {
      if (sit) {
        G.ell(8, 11, 4.6, 3.4, C.B); G.ell(8, 11.2, 2.8, 2.6, C.C);                                // the famous round belly
        L.rect(4, 13, 2, 1, C.D); L.rect(10, 13, 2, 1, C.D); S(4, 10, C.D); S(11, 10, C.D);
        G.ell(13, 12, 1.6, 1.6, C.B); S(13, 11, C.D); S(14, 12, C.D);
      } else {
        const lift = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        G.ell(12.6, 10, 1.8, 2, C.B); S(13, 9, C.D); S(12, 11, C.D); S(14, 10, C.D);
        G.ell(8, 9.8, 4.2, 3, C.B); G.ell(8, 10, 2.4, 2.2, C.C);
        [[5, 0], [9, 1]].forEach(([lx, i]) => {
          if (lift === i) G.rect(lx, 12, 2, 1, C.D); else { L.rect(lx, 12, 2, 2, C.D); if (bob) L.rect(lx, 11, 2, 1, C.D); }
        });
      }
      // head: little round ears, dark mask band with bright eyes, cream muzzle, black nose
      S(3, 1, C.E); S(4, 1, C.E); S(3, 2, C.E); S(12, 1, C.E); S(11, 1, C.E); S(12, 2, C.E);
      G.ell(8, 4.6, 4.8, 3.3, C.B);
      G.rect(4, 4, 3, 2, C.M); G.rect(9, 4, 3, 2, C.M); S(5, 4, C.W); S(10, 4, C.W);
      G.rect(6, 5, 4, 3, C.C); S(5, 6, C.C); S(10, 6, C.C); S(7, 5, C.M); S(8, 5, C.M);
      S(7, 2, C.D); S(8, 2, C.D);
    }
  });
  _chShadow(c, 8, 15, 5);
  return c;
}
// frame 4: poof (smoke puff, a leaf on top); frame 5: the paper-lantern disguise - ears on the cap, tail out of the bottom
function _chTanukiMagic(fr) {
  const C = _chTk;
  const c = paint(16, 16, G => {
    const S = (x, y, cc) => G.set(x, y, cc);
    if (fr === 4) {
      const puff = (cx, cy, r) => G.ell(cx, cy, r, r * .9, (x, y) => y + .5 < cy - r * .2 ? '#fbf8f2' : '#e2dcd2');
      puff(5, 10.4, 3.2); puff(11, 10.6, 3); puff(8, 7.4, 3.6); puff(8, 11.6, 3);
      S(8, 2, '#5aa84a'); S(9, 2, '#5aa84a'); S(7, 3, '#5aa84a'); S(8, 3, '#3e8a3a'); S(9, 3, '#5aa84a'); S(8, 4, '#3e8a3a'); S(10, 1, '#3e8a3a');
    } else {
      const R0 = '#e8603e', RL = '#ffb26e', RD = '#b83e2e', K = '#2a2430';
      G.ell(13, 13, 2.2, 1.5, (x, y) => ((x + y) % 2 ? C.D : C.B));                                // the tail gives it away
      S(4, 0, C.E); S(5, 0, C.E); S(4, 1, C.E); S(10, 0, C.E); S(11, 0, C.E); S(11, 1, C.E);       // tanuki ears on the cap
      G.ell(8, 8, 6, 5.4, (x, y) => (y === 5 || y === 8 || y === 11) ? RD : (x >= 5 && x <= 9 && y >= 4 && y <= 10 ? RL : R0));
      G.rect(5, 1, 6, 1, K); G.rect(4, 2, 8, 1, K); G.rect(4, 13, 8, 1, K); G.rect(5, 14, 6, 1, K);
      S(5, 7, K); S(6, 6, K); S(7, 7, K); S(9, 7, K); S(10, 6, K); S(11, 7, K);                      // happy closed eyes
      S(7, 9, K); S(8, 10, K); S(9, 9, K); S(4, 9, '#ff9a8a'); S(12, 9, '#ff9a8a');
    }
  });
  _chShadow(c, 8, 15, 5);
  return c;
}

// red-crowned crane: white body, black neck and drooping tail plumes, red crown; the long legs are 1px lines drawn
// straight onto the canvas after paint() (no outline, so they stay thin)
const _chCr = { W: '#fbfbf6', S: '#dcdce4', K: '#2a2a36', R: '#e0303a', L: '#7a7a88', LD: '#55555f', B: '#d8c890', N: OUT };
function _chCrane(v, fr) {
  const oneLeg = fr >= 3, bow = fr === 4, bob = fr === 2 ? 1 : 0, C = _chCr;
  const c = paint(16, 20, Gr => {
    const G = _chShift(Gr, -bob), S = (x, y, cc) => G.set(x, y, cc);
    if (v === 'side') {
      G.ell(7, 10.4, 4.4, 2.8, C.W); G.rect(4, 9, 6, 1, C.S); S(10, 11, C.S);
      G.rect(1, 10, 4, 2, C.K); S(2, 12, C.K); S(1, 12, C.K); S(3, 12, C.K); S(0, 11, C.K);        // black plumes over the tail
      if (bow) { G.rect(10, 7, 2, 3, C.K); S(12, 7, C.K); S(12, 6, C.K); S(13, 6, C.R); S(13, 7, C.K); S(14, 8, C.B); S(14, 7, C.B); S(13, 7, C.N); }
      else {
        G.rect(10, 3, 2, 6, C.K); S(10, 3, C.W); S(10, 4, C.W); S(10, 5, C.W);                       // neck, white nape
        S(11, 1, C.K); S(12, 1, C.R); S(11, 2, C.K); S(12, 2, C.K); S(13, 2, C.K); S(10, 2, C.W);   // head, red crown
        S(14, 2, C.B); S(15, 2, C.B); S(14, 3, C.B); S(12, 2, C.N);
      }
    } else {
      const back = v === 'up';
      if (back) G.rect(5, 12, 6, 2, C.K); else { G.rect(4, 11, 1, 2, C.K); G.rect(11, 11, 1, 2, C.K); }
      G.ell(8, 10.4, 3.7, 3.1, C.W); G.rect(5, 12, 6, 1, back ? C.K : C.S);
      if (back) { S(6, 13, C.K); S(9, 13, C.K); G.rect(6, 9, 4, 1, C.S); }
      const hy = bow ? 4 : 0, H = (x, y, cc) => G.set(x, y + hy, cc);
      G.rect(7, 4 + hy, 2, 5 - hy, C.K);
      G.rect(6, 1 + hy, 4, 3, C.K); H(7, 1, C.R); H(8, 1, C.R);
      if (back) { H(7, 4, C.W); H(8, 4, C.W); H(7, 5, C.W); H(6, 3, C.W); H(9, 3, C.W); }
      else { H(6, 2, C.N); H(9, 2, C.N); H(7, 4, C.B); H(8, 4, C.B); H(7, 5, C.B); H(6, 3, C.W); H(9, 3, C.W); }
    }
  });
  // legs: from under the body (row 13, rides up with the bob) to the ground (row 18), toes forward
  const top = 13 - bob, leg = (hx, fx, near, len) => {
    const col = near ? C.L : C.LD, y1 = len ? top + len : 18, pts = [];
    for (let y = top; y <= y1; y++) pts.push([R(hx + (fx - hx) * (y - top) / Math.max(1, y1 - top)), y]);
    if (!len) pts.push(v === 'side' ? [fx + 1, 18] : [fx + (fx < 8 ? -1 : 1), 18]);
    _chPx(c, col, pts);
  };
  if (v === 'side') {
    if (oneLeg) { leg(7, 7, true); _chPx(c, C.LD, [[8, top], [9, top + 1], [8, top + 2]]); }   // the other leg folded up
    else if (fr === 1) { leg(8, 10, true); leg(6, 4, false); }
    else if (fr === 2) { leg(6, 4, true); leg(8, 10, false); }
    else { leg(6, 6, false); leg(8, 8, true); }
  } else {
    const lift = oneLeg ? 1 : fr === 0 ? -1 : (fr === 1) !== (v === 'up') ? 0 : 1;
    [[6, 0], [9, 1]].forEach(([lx, i]) => { if (lift === i) { if (!oneLeg) leg(lx, lx, true, 3); } else leg(lx, lx, true); });
  }
  _chShadow(c, 8, 19, 4);
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
